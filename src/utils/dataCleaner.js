const fmt = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });
const money = v => new Intl.NumberFormat('fr-FR', { style:'currency', currency:'EUR' }).format(v||0);

function parseDateFlexible(s){
  if (!s) return null;
  const t = (''+s).trim();
  let d = new Date(t);
  if (!isNaN(d)) return d;
  const m = t.match(/^(\d{1,2})[\/](\d{1,2})[\/](\d{4})(?:\s+(\d{2}):(\d{2}))?$/);
  if (m) {
    const [_, dd, mm, yyyy, HH='00', MM='00'] = m;
    const dt = new Date(+yyyy, +mm-1, +dd, +HH, +MM);
    return isNaN(dt)? null : dt;
  }
  return null;
}

export function normalizeRows(raw){
  const tr = s => (s==null?'' : (''+s).replace(/\s+/g,' ').trim());
  const num = s => {
    const v = parseFloat((''+s).replace(',', '.'));
    return Number.isFinite(v) ? v : NaN;
  };
  const uniqBy = (arr, keyFn)=>{
    const seen = new Set(); const out=[];
    for(const x of arr){ const k = keyFn(x); if(!seen.has(k)){ seen.add(k); out.push(x); } }
    return out;
  };
  const rows = raw.map(r=>{
    const d = parseDateFlexible(r.order_date);
    return {
      order_id: tr(r.order_id),
      order_date: d,
      order_date_str: d? d.toISOString().slice(0,10): '',
      customer_id: tr(r.customer_id),
      customer_email: tr(r.customer_email),
      customer_age: num(r.customer_age),
      product_name: tr(r.product_name),
      category: tr(r.category),
      price: num(r.price),
      quantity: Math.round(num(r.quantity)),
      total_amount: num(r.total_amount),
      country: tr(r.country),
      payment_method: tr(r.payment_method),
      order_status: tr(r.order_status),
    };
  });
  return uniqBy(rows, r=>r.order_id);
}

export function computeKPIs(VIEW){
  const revenueNum = VIEW.reduce((s,r)=> s + (Number.isFinite(r.total_amount)? r.total_amount : (Number.isFinite(r.price)&&Number.isFinite(r.quantity)? r.price*r.quantity : 0)), 0);
  const orders = VIEW.length;
  const anomCount = VIEW.filter(r=> (r._reasons||[]).length).length;
  const rate = orders? (anomCount/orders)*100 : 0;
  const globalScore = VIEW.reduce((s,r)=>s+(r._score||0),0) / (orders||1);
  return {
    revenue: money(revenueNum),
    revenueNum,
    orders: fmt.format(orders),
    anomalyRate: rate.toFixed(1)+'%',
    qualityScore: (100*(1-globalScore)).toFixed(1)+' / 100'
  };
}

export function buildChartsData(VIEW){
  const byDay = new Map();
  const byDayAnom = new Map();
  for(const r of VIEW){
    const day = r.order_date_str || 'Invalide';
    byDay.set(day, (byDay.get(day)||0) + (Number.isFinite(r.total_amount)? r.total_amount : 0));
    byDayAnom.set(day, (byDayAnom.get(day)||0) + ((r._reasons||[]).length?1:0));
  }
  const days = [...byDay.keys()].sort();
  const sales = days.map(d=>+(byDay.get(d)||0).toFixed(2));
  const anomalies = days.map(d=>byDayAnom.get(d)||0);

  const countries = [...new Set(VIEW.map(r=>r.country||'Inconnu'))].sort();
  const countMap = new Map();
  for(const r of VIEW){
    if(!(r._reasons||[]).length) continue;
    const dkey = r.order_date_str || 'Invalide';
    const ckey = r.country || 'Inconnu';
    const key = dkey + '||' + ckey;
    countMap.set(key, (countMap.get(key)||0)+1);
  }
  const matrixData = [];
  for(let yi=0; yi<countries.length; yi++){
    const country = countries[yi];
    for(let xi=0; xi<days.length; xi++){
      const day = days[xi];
      const key = day + '||' + country;
      matrixData.push({ x: xi, y: yi, v: countMap.get(key)||0 });
    }
  }
  return { days, sales, anomalies, heatmapCountries: countries, heatmapMatrix: matrixData };
}

