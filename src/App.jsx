import React, { useMemo, useState, useEffect } from 'react';
import UploadCSV from './components/UploadCSV.jsx';
import Dashboard from './components/Dashboard.jsx';
import Charts from './components/Charts.jsx';
import AnomalyHeatmap from './components/AnomalyHeatmap.jsx';
import DataTable from './components/DataTable.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import { parseCSVText } from './utils/csvParser.js';
import { normalizeRows, computeKPIs, buildChartsData } from './utils/dataCleaner.js';
import { exportCleanCSV, downloadTemplate } from './utils/exportUtils.js';
import AnomalyDetector from './detectors/AnomalyDetector.js';

const DEFAULT_SETTINGS = {
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

export default function App(){
  const [rows, setRows] = useState([]);
  const [view, setView] = useState([]);
  const [perf, setPerf] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const recompute = (baseRows, opts)=>{
    const det = new AnomalyDetector(baseRows, opts);
    det.detectPriceAnomalies(); det.detectQuantityAnomalies(); det.detectFormatAnomalies();
    return baseRows.map(r=>({ ...r, _reasons: det.reasons.get(r.order_id)||[], _score: +(det.scores.get(r.order_id)||0).toFixed(3) }));
  };

  const onCSVLoaded = (text)=>{
    const t0 = performance.now();
    const parsed = parseCSVText(text);
    if(parsed.error){ alert(parsed.error); return; }
    const clean = normalizeRows(parsed.data);
    const viewRows = recompute(clean, settings);
    setRows(clean); setView(viewRows); setPerf({ ms: performance.now()-t0, n: viewRows.length });
  };

  // Recalculer automatiquement quand les paramètres changent
  useEffect(()=>{
    if(!rows.length) return;
    const t0 = performance.now();
    const viewRows = recompute(rows, settings);
    setView(viewRows);
    setPerf(p=> p ? { ...p, ms: performance.now() - t0 } : p);
  }, [settings]);

  const kpis = useMemo(()=> computeKPIs(view), [view]);
  const charts = useMemo(()=> buildChartsData(view), [view]);

  // Indicateur de cohérence CA (somme des ventes du graphe vs KPI)
  const salesSum = (charts.sales||[]).reduce((a,b)=> a+(+b||0), 0);
  const caDiff = Math.abs((kpis.revenueNum||0) - salesSum);

  // Résumé anomalies par motif
  const reasonsCount = useMemo(()=>{
    const map = new Map();
    for(const r of view){
      for(const why of (r._reasons||[])){
        map.set(why, (map.get(why)||0)+1);
      }
    }
    return [...map.entries()].sort((a,b)=> b[1]-a[1]).slice(0,8);
  }, [view]);

  return (
    <ErrorBoundary>
      <main className="container">
        {/* Barre de header fine */}
        <div className="header-bar"></div>
        
        {/* Logo NeoleaN */}
        <div className="hero fade-in">
          <div className="logo"><span className="n1">Neo</span><span className="n2">lea</span><span className="n3">N</span></div>
          <div className="underline"></div>
        </div>

        {/* Guide d'utilisation en 3 étapes */}
        <div className="onboarding fade-in">
          <div className="step card-hover"><h6>1. Importer</h6><p>Chargez votre fichier CSV e‑commerce.</p></div>
          <div className="step card-hover"><h6>2. Explorer</h6><p>Visualisez ventes, anomalies et détaillez la table.</p></div>
          <div className="step card-hover"><h6>3. Exporter</h6><p>Téléchargez les données nettoyées prêtes à l'emploi.</p></div>
        </div>

        {/* Zone de contrôle principale */}
        <header>
          <hgroup>
            <h1>NEOLEAN — E‑commerce Analyzer</h1>
            <p className="muted">Importez un CSV, visualisez les ventes, détectez et filtrez les anomalies, exportez les données nettoyées.</p>
          </hgroup>
          <div className="toolbar" style={{display:'flex', gap:8, flexWrap:'wrap', alignItems:'center'}}>
            <UploadCSV onLoaded={onCSVLoaded} />
            <button className="primary-brand" onClick={()=> exportCleanCSV(view)} disabled={!view.length}>⬇️ Export nettoyé</button>
            <button className="secondary" onClick={()=>{ setRows([]); setView([]); setPerf(null); }}>Réinitialiser</button>
            <button className="secondary" onClick={downloadTemplate}>Télécharger modèle</button>
            {perf && (<span className="badge">⏱️ {Intl.NumberFormat('fr-FR').format(perf.n)} lignes en {perf.ms.toFixed(0)} ms</span>)}
          </div>
        </header>

        {/* Tableau de bord avec KPIs clés */}
        <section>
          <div className="kpis">
            <div className="kpi card-hover"><h6>Chiffre d'affaires total <span className="tooltip" data-tip="Somme des montants par commande.">ℹ️</span></h6><div className="v">{kpis.revenue}</div></div>
            <div className="kpi card-hover"><h6>Nombre de commandes <span className="tooltip" data-tip="Nombre de lignes uniques (order_id).">ℹ️</span></h6><div className="v">{kpis.orders}</div></div>
            <div className="kpi card-hover"><h6>Taux d'anomalies <span className="tooltip" data-tip="% de lignes ayant au moins une anomalie détectée.">ℹ️</span></h6><div className="v">{kpis.anomalyRate}</div></div>
            <div className="kpi card-hover"><h6>Score global qualité <span className="tooltip" data-tip="100 − moyenne des scores d'anomalie (0..1).">ℹ️</span></h6><div className="v">{kpis.qualityScore}</div></div>
          </div>
          {/* Indicateur de cohérence des données */}
          <p className="muted" style={{marginTop:6}}>Cohérence CA (KPI vs graphe): écart {new Intl.NumberFormat('fr-FR', { style:'currency', currency:'EUR' }).format(caDiff)}.</p>
        </section>

        {/* Visualisations avec système d'onglets */}
        <section>
          <h3>Visualisations</h3>
          <p className="muted">Naviguez par onglets: Ventes (CA), Anomalies par jour, ou Heatmap journalière par pays.</p>
          <Charts data={charts} />
        </section>

        {/* Résumé des anomalies détectées */}
        <section>
          <h3>Résumé anomalies</h3>
          <div className="onboarding">
            {reasonsCount.length ? reasonsCount.map(([label,count])=> (
              <div key={label} className="step card-hover" title="Cliquez pour copier le motif pour filtrer">
                <h6>{label}</h6>
                <p>{new Intl.NumberFormat('fr-FR').format(count)} lignes</p>
              </div>
            )) : <div className="muted">Aucune anomalie détectée.</div>}
          </div>
        </section>

        {/* Table interactive avec filtres et pagination */}
        <section>
          <h3>Table des commandes</h3>
          <DataTable rows={view} />
        </section>

        {/* Paramètres avancés (repliés par défaut) */}
        <section>
          <details>
            <summary>Paramètres avancés (optionnels)</summary>
            <p className="muted">Vous pouvez ajuster les seuils et les règles pour affiner la détection. Par défaut, les paramètres conviennent à un jeu de 2 500 lignes.</p>
            <SettingsPanel settings={settings} onChange={setSettings} />
          </details>
        </section>
      </main>
    </ErrorBoundary>
  );
}

