import crypto from 'crypto';
import { getRedis, isRedisReady } from '../config/redis.js';

// Resilient in-memory fallback cache (LRU-like with TTL)
const inMemoryCache = new Map();
const inMemoryExpiry = new Map();

// Telemetry metrics
export const cacheStats = {
  hits: 0,
  misses: 0,
  sets: 0,
};

function generateOptimizationHash(tickers, maxWeight = 0.35, riskFreeRate = 0.04) {
  const sortedTickers = [...tickers].map((t) => t.toUpperCase()).sort().join(',');
  const rawKey = `${sortedTickers}:w${Number(maxWeight).toFixed(3)}:rf${Number(riskFreeRate).toFixed(3)}`;
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

export async function getCachedOptimization(tickers, maxWeight = 0.35, riskFreeRate = 0.04) {
  const hash = generateOptimizationHash(tickers, maxWeight, riskFreeRate);
  const key = `rf:opt:${hash}`;

  // 1. Try Redis first
  if (isRedisReady()) {
    try {
      const redis = getRedis();
      const val = await redis.get(key);
      if (val) {
        cacheStats.hits++;
        return { data: JSON.parse(val), source: 'redis' };
      }
    } catch (err) {
      console.warn(`[Cache] Redis read warning: ${err.message}`);
    }
  }

  // 2. Check in-memory fallback
  if (inMemoryCache.has(key)) {
    const expiresAt = inMemoryExpiry.get(key) || 0;
    if (Date.now() < expiresAt) {
      cacheStats.hits++;
      return { data: inMemoryCache.get(key), source: 'memory' };
    }
    inMemoryCache.delete(key);
    inMemoryExpiry.delete(key);
  }

  cacheStats.misses++;
  return null;
}

export async function setCachedOptimization(tickers, maxWeight, riskFreeRate, data, ttlSeconds = 86400) {
  const hash = generateOptimizationHash(tickers, maxWeight, riskFreeRate);
  const key = `rf:opt:${hash}`;
  cacheStats.sets++;

  // 1. Save in Redis
  if (isRedisReady()) {
    try {
      const redis = getRedis();
      await redis.setex(key, ttlSeconds, JSON.stringify(data));
    } catch (err) {
      console.warn(`[Cache] Redis write warning: ${err.message}`);
    }
  }

  // 2. Always keep in in-memory cache as secondary layer
  inMemoryCache.set(key, data);
  inMemoryExpiry.set(key, Date.now() + ttlSeconds * 1000);

  // Keep in-memory cache bounded
  if (inMemoryCache.size > 1000) {
    const oldestKey = inMemoryCache.keys().next().value;
    inMemoryCache.delete(oldestKey);
    inMemoryExpiry.delete(oldestKey);
  }
}

export async function getCachedPrices(ticker) {
  const key = `rf:prices:${ticker.toUpperCase()}`;

  if (isRedisReady()) {
    try {
      const redis = getRedis();
      const val = await redis.get(key);
      if (val) return JSON.parse(val);
    } catch (err) {
      console.warn(`[Cache] Redis price read warning: ${err.message}`);
    }
  }

  if (inMemoryCache.has(key)) {
    const expiresAt = inMemoryExpiry.get(key) || 0;
    if (Date.now() < expiresAt) return inMemoryCache.get(key);
  }

  return null;
}

export async function setCachedPrices(ticker, data, ttlSeconds = 3600) {
  const key = `rf:prices:${ticker.toUpperCase()}`;

  if (isRedisReady()) {
    try {
      const redis = getRedis();
      await redis.setex(key, ttlSeconds, JSON.stringify(data));
    } catch (err) {
      console.warn(`[Cache] Redis price write warning: ${err.message}`);
    }
  }

  inMemoryCache.set(key, data);
  inMemoryExpiry.set(key, Date.now() + ttlSeconds * 1000);
}
