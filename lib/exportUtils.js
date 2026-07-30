import { formatCurrency } from './mockData';

export function exportToCSV(data, filename = 'coinflow-report.csv') {
  if (!data || !data.length) return;

  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(obj => 
    Object.values(obj).map(val => `"${val}"`).join(',')
  ).join('\n');

  const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generateCollectionReport(slots) {
  const total = slots.reduce((sum, s) => sum + s.totalValue, 0);
  const date = new Date().toLocaleDateString();
  
  return {
    title: "CoinFlow Smart Collection Report",
    date,
    total: formatCurrency(total),
    details: slots.map(s => ({
      slot: s.label,
      count: s.coinCount,
      value: formatCurrency(s.totalValue)
    }))
  };
}
