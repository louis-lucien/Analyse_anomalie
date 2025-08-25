import React from 'react';

export default function Dashboard({ kpis }){
  const { revenue, orders, anomalyRate, qualityScore } = kpis || {};
  return (
    <div className="kpis" style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:12}}>
      <article className="kpi" style={{border:'1px solid #E5E7EB', borderRadius:14, padding:14}}>
        <h6>Chiffre d'affaires total</h6>
        <div className="v">{revenue}</div>
      </article>
      <article className="kpi" style={{border:'1px solid #E5E7EB', borderRadius:14, padding:14}}>
        <h6>Nombre de commandes</h6>
        <div className="v">{orders}</div>
      </article>
      <article className="kpi" style={{border:'1px solid #E5E7EB', borderRadius:14, padding:14}}>
        <h6>Taux d'anomalies</h6>
        <div className="v">{anomalyRate}</div>
      </article>
      <article className="kpi" style={{border:'1px solid #E5E7EB', borderRadius:14, padding:14}}>
        <h6>Score global qualité</h6>
        <div className="v">{qualityScore}</div>
      </article>
    </div>
  );
}

