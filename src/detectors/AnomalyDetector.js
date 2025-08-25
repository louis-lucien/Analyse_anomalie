function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
function median(values){
  const a = values.filter(v=>Number.isFinite(v)).slice().sort((a,b)=>a-b);
  if(!a.length) return NaN;
  const mid = Math.floor(a.length/2);
  return a.length%2 ? a[mid] : (a[mid-1]+a[mid])/2;
}
function mad(values){
  const m = median(values);
  const dev = values.filter(v=>Number.isFinite(v)).map(v=>Math.abs(v - m));
  return median(dev) || 0;
}
function validEmail(s){
  if(!s) return false;
  const t=(''+s).trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t);
}

const DEFAULT_OPTIONS = {
  priceZThreshold: 3.5,
  negativePriceBump: 0.3,
  iqrFactor: 1.5,
  formatBump: 0.2,
  rules: {
    priceNegative: true,
    priceRobustZ: true,
    quantityNonPositive: true,
    quantityIQR: true,
    duplicateOrderId: true,
    invalidDate: true,
    invalidEmail: true,
    countryWhitelist: true,
    whitespaceFields: true,
    totalIncoherent: true,
  },
  allowedCountries: ['France','Germany','Italy','Italia','Spain','Belgium','Netherlands']
};

export default class AnomalyDetector {
  constructor(rows, options={}){
    this.rows = rows;
    this.reasons = new Map(); // order_id -> [reasons]
    this.scores = new Map();  // order_id -> 0..1
    this.opts = { ...DEFAULT_OPTIONS, ...options, rules: { ...DEFAULT_OPTIONS.rules, ...(options.rules||{}) } };
  }
  note(id, msg){ if(!this.reasons.has(id)) this.reasons.set(id, []); this.reasons.get(id).push(msg); }
  setScore(id, s){ this.scores.set(id, clamp(s,0,1)); }

  detectPriceAnomalies(){
    const { priceZThreshold, negativePriceBump, rules } = this.opts;
    const byProduct = new Map();
    for(const r of this.rows){
      if(!byProduct.has(r.product_name)) byProduct.set(r.product_name, []);
      byProduct.get(r.product_name).push(r.price);
    }
    const stats = new Map();
    for(const [p, arr] of byProduct){
      const med = median(arr); const m = mad(arr);
      stats.set(p, { med, mad: m || 1e-9 });
    }
    for(const r of this.rows){
      const id = r.order_id; const st = stats.get(r.product_name);
      const robustZ = Math.abs((r.price - st.med) / (1.4826*st.mad));
      if(rules.priceNegative && r.price < 0) this.note(id, 'Prix négatif (retour?)');
      if(rules.priceRobustZ && robustZ > priceZThreshold) this.note(id, `Prix aberrant (|z|=${robustZ.toFixed(2)})`);
      const base = Math.min(1, robustZ/6);
      const bump = (rules.priceNegative && r.price < 0) ? negativePriceBump : 0;
      this.setScore(id, Math.max(base, this.scores.get(id)||0) + bump);
    }
    return this._summary('price');
  }

  detectQuantityAnomalies(){
    const { iqrFactor, rules } = this.opts;
    const byProduct = new Map();
    for(const r of this.rows){
      const k = r.product_name; if(!byProduct.has(k)) byProduct.set(k, []);
      byProduct.get(k).push(r.quantity);
    }
    const bounds = new Map();
    const quantile = (arr, q)=>{
      const a = arr.filter(v=>Number.isFinite(v)).slice().sort((a,b)=>a-b);
      if(!a.length) return NaN;
      const pos = (a.length-1)*q; const base = Math.floor(pos); const rest = pos-base;
      return a[base] + (a[base+1]-a[base])*(rest||0);
    };
    for(const [k, arr] of byProduct){
      const q1 = quantile(arr, 0.25), q3 = quantile(arr, 0.75);
      const iqr = (q3 - q1) || 1;
      bounds.set(k, { lo: q1 - iqrFactor*iqr, hi: q3 + iqrFactor*iqr });
    }
    for(const r of this.rows){
      const id = r.order_id; const b = bounds.get(r.product_name) || {lo:-Infinity, hi:Infinity};
      if(rules.quantityNonPositive && r.quantity <= 0) this.note(id, 'Quantité non positive');
      if(rules.quantityIQR && (r.quantity < b.lo || r.quantity > b.hi)) this.note(id, `Quantité aberrante (hors IQR)`);
      const span = Math.max(1, b.hi - b.lo);
      const dist = Math.max(0, Math.max(b.lo - r.quantity, r.quantity - b.hi));
      const s = clamp(dist / span, 0, 1);
      this.setScore(id, Math.max(s, this.scores.get(id)||0));
    }
    return this._summary('quantity');
  }

  detectFormatAnomalies(){
    const { formatBump, rules, allowedCountries } = this.opts;
    const allowed = new Set(allowedCountries);
    const seenOrder = new Set();
    for(const r of this.rows){
      const id = r.order_id;
      if(rules.duplicateOrderId){ if(seenOrder.has(id)) this.note(id, 'Doublon order_id'); seenOrder.add(id); }
      if(rules.invalidDate && !r.order_date) this.note(id, 'Date invalide');
      if(rules.invalidEmail && !validEmail(r.customer_email)) this.note(id, 'Email malformé');
      if(rules.countryWhitelist && !allowed.has(r.country)) this.note(id, `Pays suspect: ${r.country}`);
      if(rules.whitespaceFields){
        for(const k of ['payment_method','category']){
          if(/\s{2,}/.test(r[k]) || /^\s|\s$/.test(r[k])) this.note(id, `${k} avec espaces parasites`);
        }
      }
      if(rules.totalIncoherent && Number.isFinite(r.price) && Number.isFinite(r.quantity)){
        const expected = +(r.price * r.quantity).toFixed(2);
        if(Number.isFinite(r.total_amount)){
          const diff = Math.abs(expected - r.total_amount);
          if(diff > 0.01) this.note(id, `total_amount incohérent (attendu ${expected})`);
        }
      }
      if(this.reasons.has(id)){
        const cur = this.scores.get(id)||0;
        this.setScore(id, clamp(cur + formatBump, 0, 1));
      }
    }
    return this._summary('format');
  }

  _summary(kind){
    const indices=[]; const idToIndex = new Map(this.rows.map((r,i)=>[r.order_id, i]));
    for(const [id, why] of this.reasons){ if(why.length){ indices.push(idToIndex.get(id)); } }
    const avg = this.rows.length ? [...this.scores.values()].reduce((a,b)=>a+b,0) / this.rows.length : 0;
    return { indices, score: clamp(avg,0,1), reason: `${kind} anomalies` };
  }

  generateReport(){
    const lines = this.rows.length;
    const flagged = [...this.reasons.values()].filter(x=>x.length).length;
    const byReason = {};
    for(const [id, arr] of this.reasons){ for(const r of arr){ byReason[r] = (byReason[r]||0)+1; } }
    const top = Object.entries(byReason).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v])=>`- ${k}: ${v}`).join('\n');
    const recos = [
      '• Normaliser les prix par produit (median & MAD), corriger les valeurs extrêmes.',
      '• Appliquer une validation stricte des emails côté formulaire.',
      '• Uniformiser les dates au format ISO 8601.',
      '• Dédupliquer sur (order_id) avant ingestion.',
      '• Trim des champs texte (category, payment_method).',
    ].join('\n');
    return `Jeu de données: ${lines} lignes\nLignes avec anomalies: ${flagged} (${((flagged/lines)*100).toFixed(1)}%)\n\nTop anomalies:\n${top || '- (aucune)'}\n\nRecommandations:\n${recos}`;
  }
}

