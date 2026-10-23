import express from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.middleware.js';
import { Portfolio } from '../models/Portfolio.js';
import { runQuantOptimization } from '../services/quant.service.js';

const router = express.Router();

const SavePortfolioSchema = z.object({
  name: z.string().min(1, 'Portfolio name is required'),
  description: z.string().optional(),
  tickers: z.array(z.string()).min(2, 'At least 2 tickers required'),
  allocations: z.record(z.number()),
  metrics: z.object({
    expectedReturn: z.number(),
    volatility: z.number(),
    sharpeRatio: z.number(),
  }),
  aiPredictions: z.record(z.number()).optional(),
  individualMetrics: z.record(z.any()).optional(),
  rebalanceCadence: z.enum(['manual', 'weekly', 'monthly']).optional(),
});

// All portfolio routes require authentication
router.use(authenticate);

// GET /api/portfolios - List user portfolios (using .lean() for maximum performance)
router.get('/', async (req, res) => {
  try {
    const portfolios = await Portfolio.find({ userId: req.user._id })
      .sort({ isPinned: -1, createdAt: -1 })
      .lean()
      .exec();

    return res.json({ portfolios });
  } catch (err) {
    console.error('[Get Portfolios Error]:', err);
    return res.status(500).json({ error: 'Failed to retrieve portfolios' });
  }
});

// GET /api/portfolios/:id - Retrieve single portfolio
router.get('/:id', async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).lean();

    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    return res.json({ portfolio });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve portfolio' });
  }
});

// POST /api/portfolios - Save new portfolio
router.post('/', async (req, res) => {
  try {
    const parsed = SavePortfolioSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const {
      name,
      description,
      tickers,
      allocations,
      metrics,
      aiPredictions,
      individualMetrics,
      rebalanceCadence,
    } = parsed.data;

    const portfolio = new Portfolio({
      userId: req.user._id,
      name,
      description: description || '',
      tickers,
      allocations,
      metrics,
      aiPredictions: aiPredictions || {},
      individualMetrics: individualMetrics || {},
      rebalanceCadence: rebalanceCadence || 'monthly',
      lastRebalancedAt: new Date(),
    });

    await portfolio.save();

    return res.status(201).json({
      message: 'Portfolio saved successfully',
      portfolio,
    });
  } catch (err) {
    console.error('[Save Portfolio Error]:', err);
    return res.status(500).json({ error: 'Failed to save portfolio' });
  }
});

// POST /api/portfolios/:id/rebalance - Execute fresh rebalance and append history
router.post('/:id/rebalance', async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    const maxWeight = req.user.preferences?.maxAssetWeight || 0.35;
    const riskFreeRate = req.user.preferences?.riskFreeRate || 0.04;

    // 1. Re-run optimization on the portfolio's tickers
    const newResult = await runQuantOptimization(portfolio.tickers, maxWeight, riskFreeRate);

    // 2. Snapshot current allocations into rebalance history
    portfolio.rebalanceHistory.push({
      rebalancedAt: portfolio.lastRebalancedAt || new Date(),
      allocations: portfolio.allocations,
      sharpeRatio: portfolio.metrics.sharpeRatio,
      expectedReturn: portfolio.metrics.expectedReturn,
      volatility: portfolio.metrics.volatility,
      reason: req.body.reason || 'Triggered manual rebalance',
    });

    // 3. Update current portfolio metrics
    portfolio.allocations = newResult.allocation;
    portfolio.metrics = {
      expectedReturn: newResult.metrics.expected_return,
      volatility: newResult.metrics.volatility,
      sharpeRatio: newResult.metrics.sharpe_ratio,
    };
    portfolio.aiPredictions = newResult.ai_predictions;
    portfolio.individualMetrics = newResult.individual_metrics;
    portfolio.lastRebalancedAt = new Date();

    await portfolio.save();

    return res.json({
      message: 'Portfolio rebalanced successfully',
      portfolio,
    });
  } catch (err) {
    console.error('[Rebalance Portfolio Error]:', err);
    return res.status(500).json({ error: 'Failed to rebalance portfolio' });
  }
});

// DELETE /api/portfolios/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await Portfolio.deleteOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    return res.json({ message: 'Portfolio removed successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete portfolio' });
  }
});

export default router;
