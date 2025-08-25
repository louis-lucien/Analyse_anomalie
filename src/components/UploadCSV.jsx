import React from 'react';

const SAMPLE = `order_id,order_date,customer_id,customer_email,customer_age,product_name,category,price,quantity,total_amount,country,payment_method,order_status\nORD10582,2024-02-16,CUST0615,user18@gmail.com,57.0,Vacuum Cleaner,Electronics,610.39,4,2441.56,Netherlands,PayPal,Cancelled\nORD11131,2024-02-12,CUST0308,user333@hotmail.com,58.0,Zara Dress,Sports,351.52,1,351.52,Italy,PayPal,Shipped\nORD11591,2024-10-18,CUST0668,user249@hotmail.com,24.0,Levi's Jeans,Electronics,661.44,5,3307.2,Belgium, Cash on Delivery ,Delivered\nORD11419,2024-05-19,CUST0569,user437@gmail.com,55.0,Levi's Jeans,Books,766.67,4,3066.68,Belgium, PayPal ,Delivered\nORD11754,2024-08-16,CUST0088,user283@hotmail.com,68.0,Yoga Mat,Home & Garden,925.08,3,2775.24,Netherlands,Credit Card,Processing\n`;

export default function UploadCSV({ onLoaded }){
  const onFile = (e)=>{
    const f = e.target.files?.[0]; if(!f) return;
    const reader = new FileReader();
    reader.onload = ev => onLoaded(ev.target.result);
    reader.onerror = () => alert('Lecture fichier échouée');
    reader.readAsText(f);
  };

  return (
    <div style={{display:'flex', gap:8, alignItems:'center'}}>
      <label className="pill" htmlFor="file">📤</label>
      <input id="file" type="file" accept=".csv,.txt" onChange={onFile} />
      <button className="secondary" onClick={()=> onLoaded(SAMPLE)}>Charger échantillon</button>
    </div>
  );
}

