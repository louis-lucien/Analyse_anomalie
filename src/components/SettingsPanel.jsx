import React from 'react';

export default function SettingsPanel({ settings, onChange }){
  const s = settings;
  const upd = (k, v)=> onChange({ ...s, [k]: v });
  const updSet = (k, arr)=> onChange({ ...s, [k]: arr });

  const toggleRule = (rule)=> upd('rules', { ...s.rules, [rule]: !s.rules[rule] });

  const [countryInput, setCountryInput] = React.useState('');
  const addCountry = ()=>{ if(countryInput.trim()){ updSet('allowedCountries', Array.from(new Set([...
 s.allowedCountries, countryInput.trim()]))); setCountryInput(''); } };
  const removeCountry = (c)=> updSet('allowedCountries', s.allowedCountries.filter(x=>x!==c));

  return (
    <details open>
      <summary>Paramètres</summary>
      <div style={{display:'grid', gap:8, gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))'}}>
        <fieldset>
          <label>Z‑score seuil (prix)</label>
          <input type="number" step="0.1" value={s.priceZThreshold} onChange={e=>upd('priceZThreshold', +e.target.value)} />
          <small>Seuil |z| au‑delà duquel un prix est marqué aberrant (par produit).</small>
        </fieldset>
        <fieldset>
          <label>Facteur IQR (quantités)</label>
          <input type="number" step="0.1" value={s.iqrFactor} onChange={e=>upd('iqrFactor', +e.target.value)} />
          <small>Borne = [Q1 − k*IQR, Q3 + k*IQR]</small>
        </fieldset>
        <fieldset>
          <label>Majoration score si prix négatif</label>
          <input type="number" step="0.1" value={s.negativePriceBump} onChange={e=>upd('negativePriceBump', +e.target.value)} />
        </fieldset>
        <fieldset>
          <label>Majoration score si anomalies de format</label>
          <input type="number" step="0.1" value={s.formatBump} onChange={e=>upd('formatBump', +e.target.value)} />
        </fieldset>
        <fieldset>
          <label>Règles activées</label>
          <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
            {Object.keys(s.rules).map(k=> (
              <label key={k} className="pill">
                <input type="checkbox" checked={!!s.rules[k]} onChange={()=> toggleRule(k)} /> {k}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <label>Pays autorisés</label>
          <div style={{display:'flex', gap:6}}>
            <input value={countryInput} onChange={e=>setCountryInput(e.target.value)} placeholder="Ajouter un pays" />
            <button className="secondary" onClick={addCountry} type="button">Ajouter</button>
          </div>
          <div style={{display:'flex', gap:6, flexWrap:'wrap', marginTop:6}}>
            {s.allowedCountries.map(c=> (
              <span key={c} className="pill">{c} <button className="secondary" type="button" onClick={()=> removeCountry(c)}>×</button></span>
            ))}
          </div>
        </fieldset>
      </div>
    </details>
  );
}
