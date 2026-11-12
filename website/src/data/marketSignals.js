import { COMPANY_MAP } from './stocks';

export function getStockPrice(ticker, quotes = {}) {
  return quotes[ticker] ?? { price: null, changePct: null, changeAmount: null, asOf: null };
}

export function generateOptimalSignals(currentHoldings = [], results = null, targetCapital = 10000, quotes = {}) {
  if (!results?.allocation) return { buySignals: [], sellSignals: [] };
  const makeSignal = (ticker, weight) => {
    const market = getStockPrice(ticker, quotes);
    const holding = currentHoldings.find(h => h.ticker === ticker);
    const alpha = results.ai_predictions?.[ticker];
    const shares = market.price ? Math.floor(targetCapital * weight / market.price) : 0;
    return { ticker, name: COMPANY_MAP[ticker] || ticker, ...market, weight,
      projectedAlphaPct: Number.isFinite(alpha) ? alpha * 100 : null,
      suggestedShares: shares, heldShares: holding?.shares ?? 0 };
  };
  return {
    buySignals: Object.entries(results.allocation).filter(([, w]) => w > 1e-8).map(([t, w]) => makeSignal(t, w)),
    sellSignals: currentHoldings.filter(h => results.allocation[h.ticker] != null && results.allocation[h.ticker] < 0.05).map(h => makeSignal(h.ticker, results.allocation[h.ticker])),
  };
}
