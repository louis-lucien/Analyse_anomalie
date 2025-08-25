import Papa from 'papaparse';

export function parseCSVText(text){
  const parsed = Papa.parse(text, { header:true, skipEmptyLines:true, dynamicTyping:false });
  if(parsed.errors?.length){
    return { error: 'Erreurs de parsing: ' + parsed.errors[0].message };
  }
  const required = ['order_id','order_date','customer_id','customer_email','product_name','category','price','quantity','total_amount','country','payment_method','order_status'];
  const hdr = parsed.meta?.fields ?? Object.keys(parsed.data?.[0]||{});
  const missing = required.filter(k=> !hdr.includes(k));
  if(missing.length){
    return { error: 'Colonnes manquantes: ' + missing.join(', ') };
  }
  return { data: parsed.data };
}

