import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
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
