const API = import.meta.env.VITE_API_URL || '';

export const checkHealth = () =>
  fetch(`${API}/api/health`).then(r => r.json()).then(d => d.status === 'ok');

export const optimizePortfolio = async (tickers) => {
  const res = await fetch(`${API}/api/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tickers }),
  });
  if (!res.ok) throw new Error(`Backend Error: ${res.statusText}`);
  return res.json();
};

export const fetchPrices = async (ticker) => {
  const res = await fetch(`${API}/api/prices?ticker=${ticker}`);
  if (!res.ok) throw new Error(`Backend Error: ${res.statusText}`);
  return res.json();
};
