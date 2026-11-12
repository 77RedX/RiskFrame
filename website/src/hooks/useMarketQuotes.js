import { useEffect, useState } from 'react';
import { fetchPrices } from '../api';

export default function useMarketQuotes(tickers) {
  const key = [...new Set(tickers)].sort().join(',');
  const [quotes, setQuotes] = useState({});
  useEffect(() => {
    let cancelled = false;
    setQuotes({});
    if (!key) return;
    Promise.all(key.split(',').map(async ticker => {
      try {
        const data = await fetchPrices(ticker);
        const price = data.prices?.at(-1), previous = data.prices?.at(-2);
        const asOf = data.dates?.at(-1);
        if (!Number.isFinite(price) || price <= 0 || !asOf) return [ticker, null];
        return [ticker, { price, asOf, changeAmount: previous > 0 ? price - previous : null, changePct: previous > 0 ? (price / previous - 1) * 100 : null }];
      } catch { return [ticker, null]; }
    })).then(entries => { if (!cancelled) setQuotes(Object.fromEntries(entries)); });
    return () => { cancelled = true; };
  }, [key]);
  return quotes;
}
