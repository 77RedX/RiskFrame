import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { Portfolio } from '../src/models/Portfolio.js';
import { runAgentConversation, agentTools } from '../src/services/agent.service.js';

test('saved portfolio request never triggers an unrelated optimization', async () => {
  const original = axios.post;
  let calls = 0;
  axios.post = async () => { calls++; return { data: { allocation: { AAPL: 1 }, metrics: { expected_return: 0.1, volatility: 0.2, sharpe_ratio: 0.3 } } }; };
  try {
    const result = await runAgentConversation({ message: 'Show my saved portfolios', userId: null });
    assert.equal(calls, 0);
    assert.equal(result.toolCalls[0].tool, 'getUserPortfolios');
    assert.match(result.reply, /sign in/i);
  } finally { axios.post = original; }
});

test('risk tool evaluates canonical optimizer metrics', async () => {
  const result = await agentTools.analyzeRisk.execute({ allocations: { AAPL: 0.25, MSFT: 0.25, NVDA: 0.25, AMZN: 0.25 }, metrics: { volatility: 0.15, sharpe_ratio: 1.4 } });
  assert.equal(result.sharpeAssessment, 'Strong risk-adjusted alpha');
});

test('copilot uses the engine universe, rejects unknown symbols, and preserves a zero risk-free rate', async () => {
  const get = axios.get, post = axios.post;
  let body, calls = 0;
  axios.get = async () => ({ data: { tickers: ['AAPL', 'V', 'F', 'O'] } });
  axios.post = async (_url, request) => {
    body = request; calls++;
    return { data: { allocation: { V: 0.5, F: 0.5 }, metrics: { expected_return: 0.1, volatility: 0.2, sharpe_ratio: 0.5 } } };
  };
  try {
    await runAgentConversation({ message: 'Optimize V F', userPreferences: { maxAssetWeight: 0.5, riskFreeRate: 0 } });
    assert.deepEqual(body.tickers, ['V', 'F']);
    assert.equal(body.risk_free_rate, 0);
    const unknown = await runAgentConversation({ message: 'Optimize AAPL FAKE' });
    assert.match(unknown.reply, /unsupported.*FAKE/i);
    assert.equal(calls, 1);
    const missing = await runAgentConversation({ message: 'Optimize a basket' });
    assert.match(missing.reply, /2 to 35/);
    assert.equal(calls, 1);
  } finally { axios.get = get; axios.post = post; }
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
