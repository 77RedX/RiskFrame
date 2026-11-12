import Redis from 'ioredis';

let redisClient = null;
let isRedisConnected = false;

export function initRedis() {
  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 5) {
          console.warn('[Redis] Max retries reached. Operating in memory fallback mode.');
          return null; // Stop retrying automatically
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    redisClient.on('connect', () => {
      isRedisConnected = true;
      console.log('[Redis] Connected to the configured cache');
    });

    redisClient.on('error', () => {
      isRedisConnected = false;
      console.warn('[Redis] Connection unavailable. Fallback cache active.');
    });

    redisClient.on('close', () => {
      isRedisConnected = false;
    });

    // Initiate connection asynchronously
    redisClient.connect().catch(() => {
      console.warn('[Redis] Initial connection failed. Fallback in-memory cache active.');
    });

    return redisClient;
  } catch {
    console.warn('[Redis] Could not initialize the cache client.');
    return null;
  }
}

export function getRedis() {
  if (!redisClient) {
    return initRedis();
  }
  return redisClient;
}

export function isRedisReady() {
  return isRedisConnected && redisClient?.status === 'ready';
}
