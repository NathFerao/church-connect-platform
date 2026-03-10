import Redis from 'ioredis';

const REDIS_ENABLED = !!(process.env.REDIS_URL || process.env.REDIS_HOST !== undefined && process.env.REDIS_HOST !== 'localhost');

let redis: Redis | null = null;

if (REDIS_ENABLED) {
  const retryStrategy = (times: number): number | null => {
    if (times > 3) {
      console.warn('Redis unavailable after 3 retries — continuing without Redis');
      return null;
    }
    return Math.min(times * 200, 2000);
  };

  if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL, { retryStrategy });
  } else {
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      retryStrategy,
    });
  }

  redis.on('connect', () => {
    console.log('✓ Redis connected');
  });

  redis.on('error', (err: Error) => {
    console.warn('Redis error (non-fatal):', err.message);
  });
} else {
  console.log('ℹ Redis not configured — skipping (rate limiting will use in-memory store)');
}

export default redis;