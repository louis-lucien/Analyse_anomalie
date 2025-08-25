
import React, { useEffect, useRef } from 'react';
import { Chart, LinearScale, Tooltip } from 'chart.js';
import { MatrixController } from 'chartjs-chart-matrix';

export default function AnomalyHeatmap({ days, countries, data }){
  const chartRef = useRef(null);
  const canvasRef = useRef(null);
  
  useEffect(()=>{
    if(!days.length || !countries.length || !Array.isArray(data) || !canvasRef.current) return;
    
    // Destruction de l'instance précédente pour éviter les conflits
    if(chartRef.current) {
      chartRef.current.destroy();
    }
    
    const colorFromValue = (c) => {
      if(!c || !c.raw || typeof c.raw.v !== 'number') {
        return 'rgba(0,0,0,0)';
      }
      
      const value = c.raw.v;
      if(value === 0) {
        return 'rgba(0,0,0,0)';
      }
      
      const intensity = Math.min(1, 0.15 + value/5);
      return `rgba(239, 68, 68, ${intensity})`;
    };
    
    // Création de la heatmap avec Chart.js Matrix
    chartRef.current = new Chart(canvasRef.current, {
      type: 'matrix',
      data: {
        datasets: [{
          label: 'Anomalies',
          data: data,
          width: ({chart}) => Math.max(10, (chart.chartArea?.width || 400) / Math.max(1, days.length)),
          height: ({chart}) => Math.max(16, (chart.chartArea?.height || 300) / Math.max(1, countries.length)),
          backgroundColor: colorFromValue,
          borderWidth: 0.5,
          borderColor: 'rgba(148, 163, 184, 0.6)'
        }]
      },
      options: {
        responsive: true,
        animation: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                if(ctx && ctx.raw && typeof ctx.raw.v === 'number') {
                  return `Anomalies: ${ctx.raw.v}`;
                }
                return 'Anomalies: 0';
              }
            }
          }
        },
        scales: {
          x: {
            type: 'linear',
            ticks: {
              callback: (v) => {
                const index = Math.round(v);
                return days[index] || '';
              }
            },
            min: -0.5,
            max: days.length - 0.5,
            grid: { display: false }
          },
          y: {
            type: 'linear',
            ticks: {
              callback: (v) => {
                const index = Math.round(v);
                return countries[index] || '';
              }
            },
            min: -0.5,
            max: countries.length - 0.5,
            grid: { display: false }
          }
        }
      }
    });
    
    return () => {
      if(chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [days, countries, data]);
  
  return (
    <div className="heatmap-container">
      <canvas 
        ref={canvasRef}
        style={{
          maxHeight: '400px',
          width: '100%',
          height: 'auto'
        }}
      />
      
      <div className="heatmap-legend">
        <p>
          <span style={{color: 'rgba(239, 68, 68, 0.3)'}}>■</span> Peu d'anomalies • 
          <span style={{color: 'rgba(239, 68, 68, 0.6)'}}>■</span> Anomalies modérées • 
          <span style={{color: 'rgba(239, 68, 68, 1)'}}>■</span> Beaucoup d'anomalies
        </p>
        <p className="muted">
          Chaque cellule représente le nombre d'anomalies pour un jour et un pays donnés
        </p>
      </div>
    </div>
  );
}


