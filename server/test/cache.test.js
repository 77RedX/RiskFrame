import test from 'node:test';
import assert from 'node:assert/strict';
import { getCachedOptimization, setCachedOptimization } from '../src/services/cache.service.js';

test('distinct precise risk-free rates never share a cache key', async () => {
  const tickers = ['AAPL', 'NVDA', 'MSFT'];
  const data = { allocation: { AAPL: 1/3, NVDA: 1/3, MSFT: 1/3 }, metrics: { expected_return: 0, volatility: 0, sharpe_ratio: 0 }, ai_predictions: { AAPL: 0, NVDA: 0, MSFT: 0 } };
  await setCachedOptimization(tickers, 0.35, 0.0401, { ...data, value: 'first' });
  await setCachedOptimization(tickers, 0.35, 0.0402, { ...data, value: 'second' });
  assert.equal((await getCachedOptimization(tickers, 0.35, 0.0401)).data.value, 'first');
  assert.equal((await getCachedOptimization(tickers, 0.35, 0.0402)).data.value, 'second');
});
