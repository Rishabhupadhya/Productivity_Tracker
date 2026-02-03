import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

/**
 * Rate Limiting Configuration
 * SOC2 Compliance: Protect against brute force attacks
 */

// Redis client for distributed rate limiting (production)
// Falls back to memory store for development
let redisClient: ReturnType<typeof createClient> | null = null;

if (process.env.REDIS_URL) {
  redisClient = createClient({
    url: process.env.REDIS_URL,
    socket: {
      reconnectStrategy: (retries: number) => Math.min(retries * 50, 500),
    },
  });

  redisClient.connect().catch((err: Error) => {
    console.error('Redis connection failed:', err);
    redisClient = null;
  });
}

/**
 * Strict rate limiting for authentication endpoints
 * Prevents brute force attacks
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    error: 'Too many authentication attempts. Please try again later.',
    retryAfter: 15, // minutes
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  // Use Redis store if available, otherwise memory store
  ...(redisClient && {
    store: new RedisStore({
      // @ts-ignore
      client: redisClient,
      prefix: 'rl:auth:',
    }),
  }),
});

/**
 * Medium rate limiting for OAuth callbacks
 * More lenient than login but still protected
 */
export const oauthRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: {
    error: 'Too many OAuth authentication attempts. Please try again later.',
    retryAfter: 15,
  },
  standardHeaders: true,
  legacyHeaders: false,
  ...(redisClient && {
    store: new RedisStore({
      // @ts-ignore
      client: redisClient,
      prefix: 'rl:oauth:',
    }),
  }),
});

/**
 * General API rate limiting
 * Protects against API abuse
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    error: 'Too many requests. Please slow down.',
    retryAfter: 15,
  },
  standardHeaders: true,
  legacyHeaders: false,
  ...(redisClient && {
    store: new RedisStore({
      // @ts-ignore
      client: redisClient,
      prefix: 'rl:api:',
    }),
  }),
});

/**
 * Token refresh rate limiting
 * Prevent token refresh abuse
 */
export const tokenRefreshRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 refreshes per hour
  message: {
    error: 'Too many token refresh requests. Please try again later.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  ...(redisClient && {
    store: new RedisStore({
      // @ts-ignore
      client: redisClient,
      prefix: 'rl:refresh:',
    }),
  }),
});

/**
 * Export Redis client for cleanup
 */
export const closeRedisConnection = async () => {
  if (redisClient) {
    await redisClient.quit();
  }
};
