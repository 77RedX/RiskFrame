import assert from 'node:assert';
import test from 'node:test';
import { solveMarkowitzSharpe } from '../src/services/quant.service.js';
import { runAgentConversation } from '../src/services/agent.service.js';

test('Markowitz Sharpe Ratio Optimizer calculates non-negative weights summing to 1', () => {
  const returns = [0.25, 0.35, 0.18];
  const covMatrix = [
    [0.04, 0.01, 0.01],
    [0.01, 0.06, 0.01],
    [0.01, 0.01, 0.03],
  ];

  const result = solveMarkowitzSharpe(returns, covMatrix, 0.35, 0.04);
  assert.strictEqual(result.weights.length, 3);

  const sumWeights = result.weights.reduce((a, b) => a + b, 0);
  assert(Math.abs(sumWeights - 1.0) < 0.01, `Weights sum to ${sumWeights}, expected ~1.0`);
  assert(result.weights.every((w) => w >= 0 && w <= 0.36));
  assert(result.sharpeRatio > 0);
});

test('Agent Conversation detects stock tickers and executes optimization tool', async () => {
  const agentOutput = await runAgentConversation({
    message: 'Please optimize a portfolio with AAPL, NVDA, and MSFT',
    userId: null,
    userPreferences: { maxAssetWeight: 0.35, riskFreeRate: 0.04 },
  });

  assert(agentOutput.reply.length > 50);
  assert(agentOutput.toolCalls.length >= 1);
  assert.strictEqual(agentOutput.toolCalls[0].tool, 'optimizePortfolio');
  assert(agentOutput.reply.includes('Expected Return'));
});
