import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import express from 'express';
import Redis from 'ioredis';
import { initRedis } from '../src/config/redis.js';
import routes from '../src/routes/optimize.routes.js';
import { runQuantOptimization } from '../src/services/quant.service.js';
import { getCachedOptimization, setCachedOptimization, cacheStats } from '../src/services/cache.service.js';

const tickers = ['AAPL', 'MSFT'];
const valid = () => ({
  allocation: { AAPL: 0.5, MSFT: 0.5 },
  metrics: { expected_return: -0.1, volatility: 0, sharpe_ratio: 0 },
  ai_predictions: { AAPL: 0, MSFT: -0.1 },
});

test('shared quant boundary rejects malformed results without coercing values', async () => {
  const original = axios.post;
  const invalid = [
    {}, { allocation: {}, metrics: {} }, { ...valid(), metrics: [] },
    ...['expected_return', 'volatility', 'sharpe_ratio'].flatMap(field =>
      [undefined, null, '0.1', NaN, Infinity].map(value => ({ ...valid(), metrics: { ...valid().metrics, [field]: value } }))),
    ...[{}, [], { FAKE: 0.5, MSFT: 0.5 }, { AAPL: 1 }, { AAPL: -0.1, MSFT: 1.1 },
      { AAPL: 0.4, MSFT: 0.4 }, { AAPL: 0.6, MSFT: 0.4 }, { AAPL: '0.5', MSFT: 0.5 },
      { AAPL: NaN, MSFT: 0.5 }].map(allocation => ({ ...valid(), allocation })),
    { ...valid(), metrics: { ...valid().metrics, volatility: -0.1 } },
    { ...valid(), ai_predictions: undefined },
    { ...valid(), ai_predictions: { AAPL: 0, MSFT: '0.1' } },
    { ...valid(), ai_predictions: { AAPL: Infinity, MSFT: 0 } },
    { ...valid(), individual_metrics: { AAPL: {}, MSFT: {} } },
  ];
  try {
    for (const data of invalid) {
      axios.post = async () => ({ data });
      await assert.rejects(runQuantOptimization(tickers, 0.5), /Invalid quant response/);
    }
    const data = valid(); data.allocation = { AAPL: 0.50000001, MSFT: 0.49999999 };
    axios.post = async () => ({ data });
    assert.equal((await runQuantOptimization(tickers, 0.5)).metrics.expected_return, -0.1);
    data.metrics.sharpe_ratio = -0.5;
    data.allocation = { AAPL: 0, MSFT: 1 };
    data.individual_metrics = Object.fromEntries(tickers.map(t => [t, { historical_return: -0.1, historical_volatility: 0, historical_sharpe: 0 }]));
    assert.equal((await runQuantOptimization(tickers, 1)).metrics.sharpe_ratio, -0.5);
  } finally { axios.post = original; }
});

test('cache rejects invalid writes and discards a corrupted memory entry', async () => {
  const sets = cacheStats.sets;
  await assert.rejects(setCachedOptimization(tickers, 0.5, 0.0123, { allocation: {}, metrics: {} }), /Invalid quant response/);
  assert.equal(cacheStats.sets, sets);
  assert.equal(await getCachedOptimization(tickers, 0.5, 0.0123), null);
  const data = valid();
  await setCachedOptimization(tickers, 0.5, 0.0123, data);
  assert.deepEqual((await getCachedOptimization(tickers, 0.5, 0.0123)).data, data);
  data.metrics.volatility = NaN;
  assert.equal(await getCachedOptimization(tickers, 0.5, 0.0123), null);
});

test('malformed sidecar results return 503 on every retry; valid results are cached', async () => {
  const original = axios.post;
  let calls = 0, data = { allocation: {}, metrics: {} };
  axios.post = async () => { calls++; return { data }; };
  const app = express(); app.use(express.json()); app.use('/api', routes);
  const server = app.listen(0, '127.0.0.1');
  try {
    await new Promise(resolve => server.once('listening', resolve));
    const request = () => fetch(`http://127.0.0.1:${server.address().port}/api/optimize`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tickers, max_weight: 0.5, risk_free_rate: 0.0124 }),
    });
    for (let i = 0; i < 2; i++) {
      const response = await request();
      assert.equal(response.status, 503);
      assert.match((await response.json()).error, /Quant engine unavailable/);
    }
    assert.equal(calls, 2);
    data = valid();
    assert.equal((await (await request()).json()).cached, false);
    assert.equal((await (await request()).json()).cached, true);
    assert.equal(calls, 3);
  } finally { axios.post = original; await new Promise(resolve => server.close(resolve)); }
});

test('Redis cache bypasses old keys, rejects corrupt records, and only stores validated results', async () => {
  const connect = Redis.prototype.connect;
  Redis.prototype.connect = async function () { this.status = 'ready'; this.emit('connect'); };
  const redis = initRedis();
  let value = JSON.stringify({ allocation: {}, metrics: {} }), writes = 0;
  redis.get = async key => { assert.match(key, /^rf:opt:v3:/); return value; };
  redis.setex = async (key, _ttl, payload) => { assert.match(key, /^rf:opt:v3:/); writes++; value = payload; };
  try {
    assert.equal(await getCachedOptimization(tickers, 0.5, 0.0125), null);
    value = '{invalid JSON';
    assert.equal(await getCachedOptimization(tickers, 0.5, 0.0125), null);
    await assert.rejects(setCachedOptimization(tickers, 0.5, 0.0125, {}), /Invalid quant response/);
    assert.equal(writes, 0);
    await setCachedOptimization(tickers, 0.5, 0.0125, valid());
    assert.equal(writes, 1);
    assert.equal((await getCachedOptimization(tickers, 0.5, 0.0125)).source, 'redis');
  } finally { redis.disconnect(); Redis.prototype.connect = connect; }
});
