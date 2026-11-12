import { COMPANY_MAP } from './stocks';

export function getStockPrice(ticker, quotes = {}) {
  return quotes[ticker] ?? { price: null, changePct: null, changeAmount: null, asOf: null };
}

// LocalStorage Key Helpers (scoped per user so accounts don't leak or collide)
const getHoldingsKey = (userId) => `rf_portfolio_holdings_${userId || 'guest'}`;
const getCashKey = (userId) => `rf_portfolio_cash_${userId || 'guest'}`;
const getTradesKey = (userId) => `rf_trade_history_${userId || 'guest'}`;

export function saveUserHoldings(holdings, userId = 'guest') {
  try {
    localStorage.setItem(getHoldingsKey(userId), JSON.stringify(holdings));
  } catch (e) {
    console.warn('Error saving holdings to localStorage', e);
  }
}

export function saveCashBalance(cash, userId = 'guest') {
  try {
    localStorage.setItem(getCashKey(userId), cash.toString());
  } catch (e) {}
}

export function loadTradeHistory(userId = 'guest') {
  try {
    const raw = localStorage.getItem(getTradesKey(userId));
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

export function recordTrade(trade, userId = 'guest') {
  try {
    const history = loadTradeHistory(userId);
    const updated = [
      {
        id: `tr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        timestamp: new Date().toISOString(),
        ...trade,
      },
      ...history.slice(0, 49),
    ];
    localStorage.setItem(getTradesKey(userId), JSON.stringify(updated));
  } catch (e) {}
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
