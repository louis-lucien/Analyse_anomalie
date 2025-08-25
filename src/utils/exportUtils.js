import Papa from 'papaparse';

export function exportCleanCSV(VIEW){
  if(!VIEW?.length) return;
  const rows = VIEW.map(r=>({
    order_id: r.order_id,
    order_date: r.order_date_str,
    customer_id: r.customer_id,
    customer_email: r.customer_email,
    customer_age: r.customer_age,
    product_name: r.product_name,
    category: r.category,
    price: r.price,
    quantity: r.quantity,
    total_amount: +(((Number.isFinite(r.price)&&Number.isFinite(r.quantity)) ? (r.price*r.quantity).toFixed(2) : (r.total_amount||0))),
    country: r.country,
    payment_method: r.payment_method,
    order_status: r.order_status,
    anomaly_score: r._score,
    anomaly_reasons: (r._reasons||[]).join('; '),
  }));
  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'ecommerce_cleaned.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

export function downloadTemplate(){
  const header = ['order_id','order_date','customer_id','customer_email','customer_age','product_name','category','price','quantity','total_amount','country','payment_method','order_status'];
  const example = ['ORD10001','2024-01-15','CUST0001','user@example.com','32','Sample Product','Electronics','199.99','2','399.98','France','Credit Card','Delivered'];
  const csv = header.join(',') + '\n' + example.join(',') + '\n';
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'ecommerce_template.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

