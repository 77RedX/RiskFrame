import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { Portfolio } from '../src/models/Portfolio.js';
import { agentTools } from '../src/services/agent.service.js';



test('risk tool evaluates canonical optimizer metrics', async () => {
  const result = await agentTools.analyzeRisk.execute({ allocations: { AAPL: 0.25, MSFT: 0.25, NVDA: 0.25, AMZN: 0.25 }, metrics: { volatility: 0.15, sharpe_ratio: 1.4 } });
  assert.equal(result.sharpeAssessment, 'Strong risk-adjusted return');
});



test('copilot preserves result provenance and adapts canonical metrics for saved strategies', async () => {
  const post = axios.post, save = Portfolio.prototype.save;
  const source = { allocation: { AAPL: 0.5, MSFT: 0.5 }, metrics: { expected_return: 0, volatility: 0.2, sharpe_ratio: 0 }, applied_settings: { max_weight: 0.5, risk_free_rate: 0 }, market_data_as_of: '2026-11-12', calculated_at: '2026-11-13T00:00:00Z' };
  axios.post = async () => ({ data: source });
  let stored;
  Portfolio.prototype.save = async function () { await this.validate(); stored = this; };
  try {
    const result = await agentTools.optimizePortfolio.execute({ tickers: ['AAPL', 'MSFT'] });
    assert.equal(result.market_data_as_of, source.market_data_as_of);
    assert.deepEqual(result.applied_settings, source.applied_settings);
    assert.equal(result.engine, 'python-pytorch-slsqp');
    await agentTools.savePortfolio.execute({ userId: '000000000000000000000001', name: 'Test', tickers: ['AAPL', 'MSFT'], allocations: source.allocation, metrics: source.metrics });
    assert.equal(stored.metrics.expectedReturn, 0);
    assert.equal(stored.metrics.sharpeRatio, 0);
    assert.equal(stored.metrics.volatility, 0.2);
  } finally { axios.post = post; Portfolio.prototype.save = save; }
});
