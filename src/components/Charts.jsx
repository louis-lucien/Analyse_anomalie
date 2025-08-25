import React, { useEffect, useRef, useState } from 'react';
import { Chart, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, LineController, BarController, Filler } from 'chart.js';
import { MatrixController, MatrixElement } from 'chartjs-chart-matrix';
import AnomalyHeatmap from './AnomalyHeatmap.jsx';

Chart.register(Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, LineController, BarController, Filler, MatrixController, MatrixElement);

const textColor = '#0f172a';
const gridColor = 'rgba(15, 23, 42, 0.08)';
const brand = '#7c3aed';
const brandFill = 'rgba(124, 58, 237, 0.15)';
const accent = '#f59e0b';
const accentFill = 'rgba(245, 158, 11, 0.18)';

export default function Charts({ data }){
  const [tab, setTab] = useState('ca');
  const salesRef = useRef(null);
  const anomRef = useRef(null);
  const salesChartRef = useRef(null);
  const anomChartRef = useRef(null);

  // Extraire les données depuis l'objet data
  const days = data?.days || [];
  const sales = data?.sales || [];
  const anomalies = data?.anomalies || [];

  useEffect(()=>{
    // Toujours détruire toute instance existante avant de (re)créer
    if(salesRef.current){ Chart.getChart(salesRef.current)?.destroy(); salesChartRef.current = null; }
    if(anomRef.current){ Chart.getChart(anomRef.current)?.destroy(); anomChartRef.current = null; }

    if(tab === 'ca' && salesRef.current && days.length > 0){
      const ctxSales = salesRef.current.getContext('2d');
      const g = ctxSales.createLinearGradient(0, 0, 0, 260);
      g.addColorStop(0, brandFill);
      g.addColorStop(1, 'rgba(124,58,237,0)');
      salesChartRef.current = new Chart(salesRef.current, {
        type:'line',
        data:{ labels: days, datasets:[{ label:'CA', data: sales, borderColor: brand, backgroundColor: g, fill: true, borderWidth: 2.5, tension: 0.35, pointRadius: 1.8, pointHoverRadius: 4 }] },
        options:{ responsive:true, animation:false, plugins:{ legend:{ display:false }, tooltip:{ callbacks:{ label:(ctx)=> new Intl.NumberFormat('fr-FR', { style:'currency', currency:'EUR' }).format(ctx.parsed.y||0) } } }, scales:{ x:{ ticks:{ color:textColor, maxRotation:0, autoSkip:true }, grid:{ color:gridColor } }, y:{ ticks:{ color:textColor }, grid:{ color:gridColor }, beginAtZero:true } } }
      });
    }

    if(tab === 'anom' && anomRef.current && days.length > 0){
      anomChartRef.current = new Chart(anomRef.current, {
        type:'bar',
        data:{ labels: days, datasets:[{ label:'Anomalies', data: anomalies, backgroundColor: accentFill, borderColor: accent, borderWidth: 1.5, borderRadius: 6, maxBarThickness: 22 }] },
        options:{ responsive:true, animation:false, plugins:{ legend:{ display:false }, tooltip:{ callbacks:{ label:(ctx)=> `Anomalies: ${ctx.parsed.y||0}` } } }, scales:{ x:{ ticks:{ color:textColor, maxRotation:0, autoSkip:true }, grid:{ color:gridColor } }, y:{ ticks:{ color:textColor, precision:0 }, grid:{ color:gridColor }, beginAtZero:true } } }
      });
    }

    return ()=>{
      if(salesRef.current){ Chart.getChart(salesRef.current)?.destroy(); }
      if(anomRef.current){ Chart.getChart(anomRef.current)?.destroy(); }
      salesChartRef.current = null;
      anomChartRef.current = null;
    };
  }, [tab, days, sales, anomalies]);

  // Vérifier si les données sont disponibles
  const hasData = days.length > 0 && (sales.length > 0 || anomalies.length > 0);

  return (
    <div className="charts-container">
      {/* Navigation par onglets */}
      <div className="charts-tabs">
        <button 
          className={`tab-button ${tab === 'ca' ? 'active' : ''}`}
          onClick={() => setTab('ca')}
        >
          📈 Ventes (CA)
        </button>
        <button 
          className={`tab-button ${tab === 'anom' ? 'active' : ''}`}
          onClick={() => setTab('anom')}
        >
          ⚠️ Anomalies / jour
        </button>
        <button 
          className={`tab-button ${tab === 'heat' ? 'active' : ''}`}
          onClick={() => setTab('heat')}
        >
          🗺️ Heatmap anomalies
        </button>
      </div>

      {/* Zone de contenu des graphiques */}
      <div className="chart-content">
        {!hasData ? (
          <div className="no-data-message">
            <div className="no-data-icon">📊</div>
            <h3>Aucune donnée à afficher</h3>
            <p>Chargez d'abord votre fichier CSV pour voir les visualisations</p>
          </div>
        ) : (
          <>
            {tab === 'ca' && (
              <div className="chart-wrapper">
                <h4>Évolution du chiffre d'affaires</h4>
                <canvas key="ca" ref={salesRef} />
              </div>
            )}
            
            {tab === 'anom' && (
              <div className="chart-wrapper">
                <h4>Anomalies détectées par jour</h4>
                <canvas key="anom" ref={anomRef} />
              </div>
            )}
            
            {tab === 'heat' && data?.heatmapMatrix && data?.days && data?.heatmapCountries && (
              <div className="chart-wrapper">
                <h4>Heatmap des anomalies (Jour × Pays)</h4>
                <AnomalyHeatmap 
                  days={data.days} 
                  countries={data.heatmapCountries} 
                  data={data.heatmapMatrix} 
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

