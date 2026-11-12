import axios from 'axios';

const PYTHON_QUANT_URL = process.env.PYTHON_QUANT_URL || 'http://127.0.0.1:5001';

/**
 * Runs quadratic Sharpe ratio optimization using projected gradient descent
 * with box bounds [0, maxWeight] and budget constraint sum(w) = 1.
 */
export function solveMarkowitzSharpe(returns, covMatrix, maxWeight = 0.35, riskFreeRate = 0.04) {
  const n = returns.length;
  const effectiveMax = Math.max(maxWeight, 1.0 / n);

  // Equal weight starting guess
  let weights = new Array(n).fill(1.0 / n);
  const lr = 0.01;
  const iterations = 800;

  for (let iter = 0; iter < iterations; iter++) {
    // 1. Calculate portfolio return: w^T * mu
    let portReturn = 0;
    for (let i = 0; i < n; i++) portReturn += weights[i] * returns[i];

    // 2. Calculate variance: w^T * Sigma * w
    let portVariance = 0;
    const SigmaW = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        SigmaW[i] += covMatrix[i][j] * weights[j];
      }
      portVariance += weights[i] * SigmaW[i];
    }
    const portVol = Math.sqrt(Math.max(portVariance, 1e-8));
    const excessReturn = portReturn - riskFreeRate;

    // 3. Gradient of Sharpe Ratio S = excessReturn / portVol
    // dS/dw_i = (mu_i * portVol - excessReturn * (SigmaW_i / portVol)) / portVariance
    const grad = new Array(n);
    for (let i = 0; i < n; i++) {
      grad[i] = (returns[i] * portVol - (excessReturn * SigmaW[i]) / portVol) / (portVariance + 1e-8);
    }

    // 4. Gradient ascent step
    for (let i = 0; i < n; i++) {
      weights[i] += lr * grad[i];
    }

    // 5. Projection onto bounds [0, effectiveMax]
    for (let i = 0; i < n; i++) {
      weights[i] = Math.max(0, Math.min(effectiveMax, weights[i]));
    }

    // 6. Normalization so sum(w) = 1
    const sum = weights.reduce((a, b) => a + b, 0);
    if (sum > 0) {
      weights = weights.map((w) => w / sum);
    }
  }

  // Final metrics
  let optReturn = 0;
  for (let i = 0; i < n; i++) optReturn += weights[i] * returns[i];

  let optVariance = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      optVariance += weights[i] * covMatrix[i][j] * weights[j];
    }
  }
  const optVol = Math.sqrt(Math.max(optVariance, 1e-8));
  const sharpe = optVol > 0 ? (optReturn - riskFreeRate) / optVol : 0;

  return {
    weights: weights.map((w) => Number(w.toFixed(4))),
    expectedReturn: Number(optReturn.toFixed(4)),
    volatility: Number(optVol.toFixed(4)),
    sharpeRatio: Number(sharpe.toFixed(4)),
  };
}

/**
 * Execute optimization via Python Quant Microservice or JS Quant Fallback
 */
export async function runQuantOptimization(tickers, maxWeight = 0.35, riskFreeRate = 0.04) {
  const response = await axios.post(
    `${PYTHON_QUANT_URL}/api/optimize`,
    { tickers, max_weight: maxWeight, risk_free_rate: riskFreeRate },
    { timeout: 15000 }
  );
  if (!response.data?.allocation || !response.data?.metrics) throw new Error('Invalid quant response');
  return { ...response.data, engine: 'python-pytorch-slsqp' };
}

/**
 * Fetch 15-day price history for a given ticker
 */
export async function fetchPriceHistory(ticker) {
  const response = await axios.get(`${PYTHON_QUANT_URL}/api/prices?ticker=${encodeURIComponent(ticker)}`, { timeout: 10000 });
  const data = response.data;
  if (!Array.isArray(data?.dates) || !Array.isArray(data?.prices) || !data.prices.length || data.dates.length !== data.prices.length || data.prices.some(p => !Number.isFinite(p) || p <= 0) || data.dates.some(d => !/^\d{4}-\d{2}-\d{2}$/.test(d))) throw new Error('Invalid historical price data');
  return { ...data, source: 'historical-close', as_of: data.dates.at(-1) };
}
