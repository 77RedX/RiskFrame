import test from 'node:test';
import assert from 'node:assert/strict';
import { getCachedOptimization, setCachedOptimization } from '../src/services/cache.service.js';

test('distinct precise risk-free rates never share a cache key', async () => {
  const tickers = ['AAPL', 'NVDA', 'MSFT'];
  await setCachedOptimization(tickers, 0.35, 0.0401, { value: 'first' });
  await setCachedOptimization(tickers, 0.35, 0.0402, { value: 'second' });
  assert.equal((await getCachedOptimization(tickers, 0.35, 0.0401)).data.value, 'first');
  assert.equal((await getCachedOptimization(tickers, 0.35, 0.0402)).data.value, 'second');
});
