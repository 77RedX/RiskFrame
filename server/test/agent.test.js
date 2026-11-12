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
