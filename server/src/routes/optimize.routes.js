import express from 'express';
import { z } from 'zod';
import { optionalAuthenticate } from '../middleware/auth.middleware.js';
import {
  getCachedOptimization,
  setCachedOptimization,
  getCachedPrices,
  setCachedPrices,
  cacheStats,
} from '../services/cache.service.js';
import { runQuantOptimization, fetchPriceHistory } from '../services/quant.service.js';

const router = express.Router();

const OptimizeRequestSchema = z.object({
  tickers: z.array(z.string()).min(2, 'At least 2 tickers required'),
  max_weight: z.number().min(0.05).max(1.0).optional(),
  risk_free_rate: z.number().optional(),
});

// POST /api/optimize
router.post('/optimize', optionalAuthenticate, async (req, res) => {
  const startTime = Date.now();
  try {
    const parsed = OptimizeRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const { tickers } = parsed.data;
    // If user is authenticated, check their custom risk preferences
    const maxWeight =
      parsed.data.max_weight || req.user?.preferences?.maxAssetWeight || 0.35;
    const riskFreeRate =
      parsed.data.risk_free_rate || req.user?.preferences?.riskFreeRate || 0.04;

    // 1. Check Redis / In-memory memoization cache
    const cached = await getCachedOptimization(tickers, maxWeight, riskFreeRate);
    if (cached) {
      const latencyMs = Date.now() - startTime;
      res.setHeader('X-Cache', `HIT (${cached.source})`);
      res.setHeader('X-Response-Time-Ms', latencyMs);
      return res.json({
        ...cached.data,
        cached: true,
        cacheSource: cached.source,
        runtimeMs: latencyMs,
      });
    }

    // 2. Cache miss: compute optimization
    const result = await runQuantOptimization(tickers, maxWeight, riskFreeRate);

    // 3. Store in Redis cache for 24h
    await setCachedOptimization(tickers, maxWeight, riskFreeRate, result, 86400);

    const latencyMs = Date.now() - startTime;
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('X-Response-Time-Ms', latencyMs);

    return res.json({
      ...result,
      cached: false,
      runtimeMs: latencyMs,
    });
  } catch (err) {
    console.error('[Optimization Route Error]:', err);
    return res.status(500).json({ error: 'Failed to optimize portfolio.' });
  }
});

// GET /api/prices?ticker=AAPL
router.get('/prices', async (req, res) => {
  const startTime = Date.now();
  const ticker = req.query.ticker;
  if (!ticker || typeof ticker !== 'string') {
    return res.status(400).json({ error: 'Missing ticker query parameter' });
  }

  try {
    const symbol = ticker.toUpperCase();
    const cached = await getCachedPrices(symbol);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json({ ...cached, cached: true, runtimeMs: Date.now() - startTime });
    }

    const data = await fetchPriceHistory(symbol);
    await setCachedPrices(symbol, data, 3600);

    res.setHeader('X-Cache', 'MISS');
    return res.json({ ...data, cached: false, runtimeMs: Date.now() - startTime });
  } catch (err) {
    console.error('[Prices Route Error]:', err);
    return res.status(500).json({ error: 'Failed to fetch price series.' });
  }
});

// GET /api/cache/stats
router.get('/cache/stats', (req, res) => {
  const total = cacheStats.hits + cacheStats.misses;
  const hitRatio = total > 0 ? (cacheStats.hits / total) * 100 : 0;
  return res.json({
    ...cacheStats,
    hitRatio: `${hitRatio.toFixed(1)}%`,
    totalRequests: total,
  });
});

export default router;
