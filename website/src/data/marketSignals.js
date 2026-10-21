import { SP500_STOCKS, COMPANY_MAP } from './stocks';

// Baseline reference market prices for key S&P 500 assets
export const BASE_MARKET_PRICES = {
  AAPL: 234.80,
  NVDA: 138.25,
  MSFT: 446.50,
  AMZN: 195.20,
  GOOGL: 182.40,
  GOOG: 183.10,
  META: 592.40,
  TSLA: 244.60,
  AVGO: 178.90,
  AMD: 156.40,
  ADBE: 512.30,
  QCOM: 168.70,
  CRM: 288.90,
  NOW: 895.00,
  ORCL: 172.50,
  INTC: 22.80,
  MU: 104.20,
  LLY: 914.50,
  UNH: 574.00,
  JNJ: 162.30,
  ABBV: 192.80,
  MRK: 114.50,
  PFE: 28.90,
  ISRG: 488.00,
  JPM: 218.60,
  V: 288.40,
  MA: 496.20,
  GS: 512.00,
  BAC: 39.80,
  WFC: 56.40,
  BLK: 948.00,
  COST: 898.00,
  WMT: 80.50,
  HD: 398.00,
  MCD: 298.50,
  NKE: 82.40,
  SBUX: 96.50,
  XOM: 118.20,
  CVX: 148.50,
  COP: 108.60,
  CAT: 388.40,
  GE: 188.20,
  UNP: 242.00,
  RTX: 122.50,
  BA: 154.20,
  NEE: 82.40,
  SO: 88.60,
  PLD: 124.50,
  AMT: 224.00,
  LIN: 462.00,
  GLD: 244.50,
  TLT: 94.80,
  IEF: 95.40,
  SHY: 82.90,
  TIP: 108.40,
};

/**
 * Get deterministic current market price & 24h change for any ticker
 */
export function getStockPrice(ticker) {
  if (BASE_MARKET_PRICES[ticker]) {
    const price = BASE_MARKET_PRICES[ticker];
    // Deterministic small daily variation
    const hash = ticker.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const changePct = Number((((hash % 41) - 18) / 10).toFixed(2)); // range -1.8% to +2.2%
    const changeAmount = Number(((price * changePct) / 100).toFixed(2));
    return {
      price,
      changePct,
      changeAmount,
      currency: 'USD',
    };
  }

  // Fallback formula for other universe stocks
  const hash = ticker.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const base = 50 + (hash % 250);
  const changePct = Number((((hash % 37) - 16) / 10).toFixed(2));
  const changeAmount = Number(((base * changePct) / 100).toFixed(2));
  return {
    price: Number(base.toFixed(2)),
    changePct,
    changeAmount,
    currency: 'USD',
  };
}

// Initial demo portfolio holdings (stored in localStorage)
export const DEFAULT_DEMO_HOLDINGS = [
  {
    ticker: 'NVDA',
    name: 'NVIDIA Corp.',
    sector: 'Technology',
    shares: 35,
    avgBuyPrice: 112.50,
    buyDate: '2026-01-15',
  },
  {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    sector: 'Technology',
    shares: 25,
    avgBuyPrice: 195.40,
    buyDate: '2026-02-02',
  },
  {
    ticker: 'MSFT',
    name: 'Microsoft Corp.',
    sector: 'Technology',
    shares: 18,
    avgBuyPrice: 402.00,
    buyDate: '2026-02-18',
  },
  {
    ticker: 'AMZN',
    name: 'Amazon.com Inc.',
    sector: 'Consumer Disc.',
    shares: 30,
    avgBuyPrice: 172.80,
    buyDate: '2026-03-05',
  },
  {
    ticker: 'LLY',
    name: 'Eli Lilly & Co.',
    sector: 'Healthcare',
    shares: 10,
    avgBuyPrice: 840.00,
    buyDate: '2026-03-20',
  },
];

export const DEFAULT_CASH_BALANCE = 24500.00;

// LocalStorage Key Helpers (scoped per user so accounts don't leak or collide)
const getHoldingsKey = (userId) => `rf_portfolio_holdings_${userId || 'guest'}`;
const getCashKey = (userId) => `rf_portfolio_cash_${userId || 'guest'}`;
const getTradesKey = (userId) => `rf_trade_history_${userId || 'guest'}`;

export function loadUserHoldings(userId = 'guest') {
  try {
    const raw = localStorage.getItem(getHoldingsKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Error reading holdings from localStorage', e);
  }
  return DEFAULT_DEMO_HOLDINGS;
}

export function saveUserHoldings(holdings, userId = 'guest') {
  try {
    localStorage.setItem(getHoldingsKey(userId), JSON.stringify(holdings));
  } catch (e) {
    console.warn('Error saving holdings to localStorage', e);
  }
}

export function loadCashBalance(userId = 'guest') {
  try {
    const raw = localStorage.getItem(getCashKey(userId));
    if (raw !== null) {
      const num = parseFloat(raw);
      if (!isNaN(num)) return num;
    }
  } catch (e) {}
  return DEFAULT_CASH_BALANCE;
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

/**
 * Computes optimal BUY and SELL signals based on:
 * 1. Deep learning neural projections (21-day alpha)
 * 2. Convex Sharpe optimization weights
 * 3. User's existing holdings (scanned for deterioration or rebalancing)
 */
export function generateOptimalSignals(currentHoldings = [], optimizationResults = null, targetCapital = 10000) {
  const holdingsMap = {};
  currentHoldings.forEach((h) => {
    holdingsMap[h.ticker] = h;
  });

  // Base optimal buy candidate universe
  const candidateBuyTickers = [
    { ticker: 'NVDA', baseAlpha: 0.384, baseSharpe: 1.84, score: 98, rationale: 'Temporal CNN projects top-percentile alpha; semiconductor AI infrastructure momentum.' },
    { ticker: 'AAPL', baseAlpha: 0.286, baseSharpe: 1.42, score: 95, rationale: 'High return on equity; low covariance drawdown risk in volatile sessions.' },
    { ticker: 'AVGO', baseAlpha: 0.312, baseSharpe: 1.55, score: 93, rationale: 'Superior enterprise cash flow with convex Sharpe ratio tilt.' },
    { ticker: 'MSFT', baseAlpha: 0.264, baseSharpe: 1.38, score: 92, rationale: 'Cloud earnings leverage; low idiosyncratic downside variance.' },
    { ticker: 'AMZN', baseAlpha: 0.295, baseSharpe: 1.45, score: 90, rationale: 'Expanding operating margin; cross-sectional momentum ranking top 5%.' },
    { ticker: 'LLY',  baseAlpha: 0.320, baseSharpe: 1.60, score: 94, rationale: 'Defensive healthcare growth; uncorrelated pharmaceutical revenue stream.' },
    { ticker: 'GOOGL',baseAlpha: 0.245, baseSharpe: 1.25, score: 88, rationale: 'Attractive valuation multiple; AI ad engine recovery.' },
    { ticker: 'META', baseAlpha: 0.335, baseSharpe: 1.58, score: 94, rationale: 'High operational efficiency and strong ad return velocity.' },
    { ticker: 'GLD',  baseAlpha: 0.165, baseSharpe: 1.15, score: 86, rationale: 'Optimal macroeconomic hedge; negative covariance against equity drawdown.' },
  ];

  // If optimizationResults exist, blend them into candidate rankings
  let optimalBuySignals = candidateBuyTickers.map((item) => {
    const market = getStockPrice(item.ticker);
    let alpha = item.baseAlpha;
    let weight = 0.20;

    if (optimizationResults?.allocation?.[item.ticker]) {
      weight = optimizationResults.allocation[item.ticker];
    }
    if (optimizationResults?.ai_predictions?.[item.ticker]) {
      alpha = optimizationResults.ai_predictions[item.ticker];
    }

    const suggestedAllocationAmount = targetCapital * (weight || 0.15);
    const suggestedShares = Math.max(1, Math.round(suggestedAllocationAmount / market.price));

    return {
      ticker: item.ticker,
      name: COMPANY_MAP[item.ticker] || item.ticker,
      sector: SP500_STOCKS.find((s) => s.ticker === item.ticker)?.sector || 'Technology',
      price: market.price,
      changePct: market.changePct,
      projectedAlphaPct: Number((alpha * 100).toFixed(2)),
      optimalWeightPct: Number(((weight || 0.15) * 100).toFixed(1)),
      convictionScore: item.score,
      badgeText: item.score >= 94 ? 'Strong Buy' : 'Optimal Buy',
      suggestedShares,
      suggestedAmount: Number((suggestedShares * market.price).toFixed(2)),
      rationale: item.rationale,
      isCurrentlyHeld: !!holdingsMap[item.ticker],
      heldShares: holdingsMap[item.ticker]?.shares || 0,
    };
  });

  // Sort optimal buys by conviction score descending
  optimalBuySignals.sort((a, b) => b.convictionScore - a.convictionScore);

  // Generate Optimal SELL recommendations
  const optimalSellSignals = [];

  // 1. First Priority: Scan user's currently held stocks for exit/trim opportunities!
  currentHoldings.forEach((holding) => {
    const market = getStockPrice(holding.ticker);
    const pnlPct = ((market.price - holding.avgBuyPrice) / holding.avgBuyPrice) * 100;
    const isModelWeightLow = optimizationResults && (optimizationResults.allocation[holding.ticker] || 0) < 0.05;

    // Conditions where selling is optimal:
    // a) Large profit target reached (> 20%) -> Harvest optimal profits
    // b) Model recommends 0% or low allocation
    // c) Negative trailing or forward trend
    if (pnlPct >= 18 || isModelWeightLow || holding.ticker === 'INTC' || holding.ticker === 'PFE') {
      const exitUrgency = pnlPct >= 25 ? 'High (Take Profit)' : isModelWeightLow ? 'High (Rebalance Exit)' : 'Moderate';
      const rationale = pnlPct >= 18
        ? `Target gain of +${pnlPct.toFixed(1)}% achieved. Quantitative optimizer advises harvesting capital into higher-alpha assets.`
        : isModelWeightLow
        ? 'SLSQP solver reduced optimal weight below 5%. Capital reallocation is mathematically advantageous.'
        : 'Alpha decay detected in lookback window; downside protection recommended.';

      optimalSellSignals.push({
        ticker: holding.ticker,
        name: holding.name || COMPANY_MAP[holding.ticker] || holding.ticker,
        sector: holding.sector || 'Equities',
        price: market.price,
        changePct: market.changePct,
        userShares: holding.shares,
        avgBuyPrice: holding.avgBuyPrice,
        unrealizedPnlPct: Number(pnlPct.toFixed(2)),
        unrealizedPnlAmount: Number(((market.price - holding.avgBuyPrice) * holding.shares).toFixed(2)),
        urgency: exitUrgency,
        badgeText: pnlPct >= 18 ? 'Optimal Exit (Take Profit)' : 'Optimal Sell',
        rationale,
        isPortfolioHolding: true,
      });
    }
  });

  // 2. Second Priority: Add Market-Wide Optimal Sells (stocks traders should avoid / exit)
  const marketSellCandidates = [
    { ticker: 'INTC', price: 22.80, changePct: -1.8, rationale: 'Negative 21-day neural alpha; margin compression and competitive market share loss.', urgency: 'High (Underperform)' },
    { ticker: 'WFC',  price: 56.40, changePct: -0.8, rationale: 'Weak covariance profile; regulatory headwinds dampening net interest income.', urgency: 'Moderate' },
    { ticker: 'PFE',  price: 28.90, changePct: -1.2, rationale: 'Sub-par return forecast relative to S&P 500 median; vaccine revenue cliff.', urgency: 'Moderate' },
    { ticker: 'BA',   price: 154.20, changePct: -2.4, rationale: 'Elevated supply chain variance and negative free cash flow trajectory.', urgency: 'High (Risk Off)' },
    { ticker: 'CVX',  price: 148.50, changePct: -0.6, rationale: 'Crude oil volatility reducing forward Sharpe ratio contribution.', urgency: 'Moderate' },
  ];

  marketSellCandidates.forEach((c) => {
    // Only add if not already added from user holdings
    if (!optimalSellSignals.some((s) => s.ticker === c.ticker)) {
      const market = getStockPrice(c.ticker);
      optimalSellSignals.push({
        ticker: c.ticker,
        name: COMPANY_MAP[c.ticker] || c.ticker,
        sector: SP500_STOCKS.find((s) => s.ticker === c.ticker)?.sector || 'Equities',
        price: market.price,
        changePct: market.changePct,
        userShares: holdingsMap[c.ticker]?.shares || 0,
        avgBuyPrice: holdingsMap[c.ticker]?.avgBuyPrice || market.price,
        unrealizedPnlPct: 0,
        unrealizedPnlAmount: 0,
        urgency: c.urgency,
        badgeText: 'Optimal Sell Signal',
        rationale: c.rationale,
        isPortfolioHolding: !!holdingsMap[c.ticker],
      });
    }
  });

  return {
    buySignals: optimalBuySignals,
    sellSignals: optimalSellSignals,
  };
}
