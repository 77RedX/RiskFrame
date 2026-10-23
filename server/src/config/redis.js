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
      console.log('⚡ [Redis] Successfully connected to Redis instance at', redisUrl);
    });

    redisClient.on('error', (err) => {
      isRedisConnected = false;
      console.warn(`⚠️  [Redis] Redis connection notice (${err.code || err.message}). Fallback cache active.`);
    });

    redisClient.on('close', () => {
      isRedisConnected = false;
    });

    // Initiate connection asynchronously
    redisClient.connect().catch((err) => {
      console.warn(`⚠️  [Redis] Initial connect attempt: ${err.message}. Fallback in-memory cache active.`);
    });

    return redisClient;
  } catch (error) {
    console.warn(`⚠️  [Redis] Could not initialize ioredis: ${error.message}`);
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
