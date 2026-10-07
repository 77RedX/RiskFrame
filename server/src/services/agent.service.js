import { runQuantOptimization } from './quant.service.js';
import { Portfolio } from '../models/Portfolio.js';

/**
 * Tools available to the Quantitative Agent
 */
export const agentTools = {
  optimizePortfolio: {
    name: 'optimizePortfolio',
    description: 'Runs Ledoit-Wolf shrinkage and quadratic SLSQP optimization to maximize Sharpe ratio for tickers.',
    execute: async ({ tickers, maxWeight = 0.35, riskFreeRate = 0.04 }) => {
      const result = await runQuantOptimization(tickers, maxWeight, riskFreeRate);
      return {
        allocation: result.allocation,
        metrics: result.metrics,
        topHolding: Object.entries(result.allocation).sort((a, b) => b[1] - a[1])[0],
      };
    },
  },

  getUserPortfolios: {
    name: 'getUserPortfolios',
    description: "Fetches user's active portfolios saved in MongoDB.",
    execute: async ({ userId }) => {
      if (!userId) return { error: 'Anonymous user: no saved portfolios found.' };
      const portfolios = await Portfolio.find({ userId }).select('name tickers metrics allocations').lean();
      return { portfolios };
    },
  },

  savePortfolio: {
    name: 'savePortfolio',
    description: "Saves an optimized allocation into MongoDB under the user's account.",
    execute: async ({ userId, name, tickers, allocations, metrics }) => {
      if (!userId) return { error: 'Please sign in to save this portfolio.' };
      const doc = new Portfolio({
        userId,
        name: name || 'Agent Generated Strategy',
        tickers,
        allocations,
        metrics,
      });
      await doc.save();
      return { success: true, portfolioId: doc._id, name: doc.name };
    },
  },

  analyzeRisk: {
    name: 'analyzeRisk',
    description: 'Evaluates portfolio concentration, diversification, and risk-adjusted return trade-offs.',
    execute: async ({ allocations, metrics }) => {
      const weights = Object.values(allocations || {});
      const maxConcentration = Math.max(...weights, 0);
      const isHighlyConcentrated = maxConcentration > 0.30;
      const riskRating =
        metrics.volatility < 0.15 ? 'Low (Defensive)' : metrics.volatility < 0.25 ? 'Moderate' : 'High (Aggressive)';

      return {
        riskRating,
        maxConcentration: `${(maxConcentration * 100).toFixed(1)}%`,
        isDiversified: !isHighlyConcentrated && weights.length >= 4,
        sharpeAssessment:
          metrics.sharpeRatio > 1.2
            ? 'Strong risk-adjusted alpha'
            : metrics.sharpeRatio > 0.8
            ? 'Acceptable risk/reward'
            : 'Suboptimal Sharpe; consider adding macro hedge ETFs (GLD, TLT)',
      };
    },
  },
};

/**
 * Autonomous Quant Agent ReAct loop
 */
export async function runAgentConversation({ message, userId, userPreferences }) {
  const query = message.toLowerCase();
  const toolCallsMade = [];
  let responseText = '';

  // Extract stock tickers mentioned in user message (2-5 uppercase letters)
  const tickerMatches = message.match(/\b[A-Z]{2,5}\b/g) || [];
  const validUniverse = new Set([
    'AAPL', 'MSFT', 'NVDA', 'AVGO', 'AMD', 'AMZN', 'GOOGL', 'META', 'TSLA', 'JPM',
    'V', 'UNH', 'LLY', 'XOM', 'PG', 'COST', 'GLD', 'TLT', 'IEF', 'SHY', 'TIP',
  ]);
  const detectedTickers = [...new Set(tickerMatches.filter((t) => validUniverse.has(t)))];

  // 1. Tool Execution: If user asks to optimize or mentions tickers
  if (detectedTickers.length >= 2 || query.includes('optimize') || query.includes('portfolio') || query.includes('basket')) {
    const tickersToUse = detectedTickers.length >= 2 ? detectedTickers : ['AAPL', 'NVDA', 'MSFT', 'AMZN', 'GLD'];
    const maxWeight = userPreferences?.maxAssetWeight || 0.35;
    const riskFreeRate = userPreferences?.riskFreeRate || 0.04;

    const optResult = await agentTools.optimizePortfolio.execute({
      tickers: tickersToUse,
      maxWeight,
      riskFreeRate,
    });
    toolCallsMade.push({ tool: 'optimizePortfolio', params: { tickers: tickersToUse }, result: optResult });

    const riskAssessment = await agentTools.analyzeRisk.execute({
      allocations: optResult.allocation,
      metrics: optResult.metrics,
    });
    toolCallsMade.push({ tool: 'analyzeRisk', result: riskAssessment });

    const allocationSummary = Object.entries(optResult.allocation)
      .map(([ticker, w]) => `• **${ticker}**: ${(w * 100).toFixed(1)}%`)
      .join('\n');

    responseText = `I ran a quantitative portfolio optimization for **${tickersToUse.join(', ')}** using Ledoit-Wolf shrinkage and the Temporal CNN alpha forecast:

### Recommended Allocation:
${allocationSummary}

### Quantitative Metrics:
- **Expected Return**: ${(optResult.metrics.expected_return * 100).toFixed(2)}%
- **Portfolio Volatility**: ${(optResult.metrics.volatility * 100).toFixed(2)}%
- **Sharpe Ratio**: ${optResult.metrics.sharpe_ratio.toFixed(2)}
- **Risk Assessment**: ${riskAssessment.riskRating} (${riskAssessment.sharpeAssessment})

*Notice*: Maximum single-asset concentration is capped at ${(maxWeight * 100).toFixed(0)}% to preserve diversification against drawdown shocks.`;
  } else if (query.includes('saved') || query.includes('my portfolios') || query.includes('list')) {
    // 2. Tool Execution: Fetch user portfolios
    const userPortfolios = await agentTools.getUserPortfolios.execute({ userId });
    toolCallsMade.push({ tool: 'getUserPortfolios', result: userPortfolios });

    if (userPortfolios.error || !userPortfolios.portfolios || userPortfolios.portfolios.length === 0) {
      responseText = `You don't have any saved portfolios in MongoDB yet. Select stocks on the terminal or ask me to generate a basket like *"Optimize NVDA, AAPL, MSFT, and GLD"* and save it!`;
    } else {
      const list = userPortfolios.portfolios
        .map((p) => `• **${p.name}** (${p.tickers.join(', ')}): Sharpe ${p.metrics.sharpeRatio.toFixed(2)}`)
        .join('\n');
      responseText = `Here are your saved portfolios from MongoDB:\n\n${list}`;
    }
  } else {
    // 3. General Financial AI Guidance
    responseText = `Hello! I am your **RiskFrame Quantitative Co-Pilot**. I bridge your deep-learning alpha model with real-time portfolio optimization and MongoDB account management.

You can ask me to:
1. **Optimize a custom basket**: *"Optimize AAPL, NVDA, GOOGL, and GLD with low risk"*
2. **Review your holdings**: *"Show my saved portfolios"*
3. **Assess risk**: *"How can I hedge against tech drawdowns?"*`;
  }

  return {
    reply: responseText,
    toolCalls: toolCallsMade,
  };
}
