import React, { useMemo, useState } from 'react';

const fmt = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });
const money = v => new Intl.NumberFormat('fr-FR', { style:'currency', currency:'EUR' }).format(v||0);

export default function DataTable({ rows=[] }){
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [anom, setAnom] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState(1);

  const columns = ['order_id','order_date_str','customer_email','product_name','category','price','quantity','total_amount','country','payment_method','order_status','_score','_reasons'];

  const filtered = useMemo(()=>{
    let r = rows.filter(rw=>{
      const hay = `${rw.order_id} ${rw.customer_email} ${rw.product_name} ${rw.category} ${rw.country} ${rw.order_status}`.toLowerCase();
      if(q && !hay.includes(q.toLowerCase())) return false;
      if(status && rw.order_status !== status) return false;
      if(anom==='anomalies' && !(rw._reasons||[]).length) return false;
      if(anom==='clean' && (rw._reasons||[]).length) return false;
      return true;
    });
    if(sortKey){
      const key = sortKey, dir = sortDir;
      r.sort((a,b)=>{
        const va=a[key], vb=b[key];
        if(va==null && vb==null) return 0;
        if(va==null) return 1; if(vb==null) return -1;
        if(typeof va === 'number' && typeof vb === 'number') return dir*(va - vb);
        return dir*(''+va).localeCompare(''+vb);
      });
    }
    return r;
  }, [rows, q, status, anom, sortKey, sortDir]);

  const total = rows.length;
  const anomaliesCount = rows.filter(r=> (r._reasons||[]).length).length;

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(Math.max(1, page), pages);
  const slice = filtered.slice((pageSafe-1)*pageSize, (pageSafe-1)*pageSize + pageSize);

  return (
    <div className="fade-in">
      <div className="toolbar" style={{display:'grid', gap:10, gridTemplateColumns:'1fr 2fr 1fr', alignItems:'center'}}>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          <span className="badge">Total: {fmt.format(total)}</span>
          <span className="badge">Anomalies: {fmt.format(anomaliesCount)}</span>
        </div>
        <div>
          <input type="search" placeholder="Rechercher (id, email, produit, pays...)" value={q} onChange={e=>{ setQ(e.target.value); setPage(1); }} style={{width:'100%'}} />
        </div>
        <div style={{display:'flex', gap:8, justifyContent:'flex-end', alignItems:'center'}}>
          <div className="pill" style={{display:'flex', gap:6, alignItems:'center'}}>
            <label><input type="radio" name="anom" checked={anom===''} onChange={()=>{ setAnom(''); setPage(1); }} /> Toutes</label>
            <label><input type="radio" name="anom" checked={anom==='anomalies'} onChange={()=>{ setAnom('anomalies'); setPage(1); }} /> Anomalies</label>
            <label><input type="radio" name="anom" checked={anom==='clean'} onChange={()=>{ setAnom('clean'); setPage(1); }} /> Propres</label>
          </div>
          <select value={status} onChange={e=>{ setStatus(e.target.value); setPage(1); }}>
            <option value="">Tous statuts</option>
            <option>Delivered</option>
            <option>Shipped</option>
            <option>Processing</option>
            <option>Cancelled</option>
          </select>
          <select value={pageSize} onChange={e=>{ setPageSize(+e.target.value); setPage(1); }}>
            <option>10</option>
            <option>25</option>
            <option>50</option>
            <option>100</option>
          </select>
        </div>
      </div>

      <div className="table-container" style={{marginTop:10}}>
        <table>
          <thead>
            <tr>
              {columns.map(c=> (
                <th key={c} style={{cursor:'pointer'}} onClick={()=>{ setSortKey(c); setSortDir(d=>-d); setPage(1); }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((r, idx)=> (
              <tr key={idx} style={{background: (r._reasons||[]).length? '#FFF7ED' : ''}}>
                {columns.map(c=>{
                  let v = r[c];
                  if(c==='price' || c==='total_amount') v = money(+v||0);
                  if(c==='_reasons') v = (r._reasons||[]).map(s=>'• '+s).join('\n');
                  return <td key={c} className={c === '_reasons' ? '_reasons' : ''}>{v==null? '' : v}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="sticky-footer">
          <div className="muted">{fmt.format(filtered.length)} lignes</div>
          <div style={{display:'flex', gap:6, alignItems:'center'}}>
            <button onClick={()=> setPage(p=> Math.max(1, p-1))}>Préc.</button>
            <span className="mono">{pageSafe}/{pages}</span>
            <button onClick={()=> setPage(p=> p+1)}>Suiv.</button>
          </div>
        </div>
      </div>
    </div>
  );
}

