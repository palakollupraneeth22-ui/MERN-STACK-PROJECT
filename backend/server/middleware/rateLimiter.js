/**
 * Rate Limiting Middleware
 * Prevents abuse and protects the API
 */

const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

// Redis client for distributed rate limiting
let redisClient = null;

// Initialize Redis if available
try {
  if (process.env.REDIS_URL) {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL,
    });
    redisClient.connect().catch(err => {
      console.warn('Redis connection failed, using memory store:', err.message);
      redisClient = null;
    });
  }
} catch (error) {
  console.warn('Redis not available, using memory store for rate limiting');
}

/**
 * General API rate limiter - 100 requests per 15 minutes
 */
const generalLimiter = rateLimit({
  store: redisClient
    ? new RedisStore({
        client: redisClient,
        prefix: 'rl:general:',
      })
    : undefined,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health check endpoints
    return req.path === '/health' || req.path === '/api/health';
  },
});

/**
 * Strict rate limiter for authentication endpoints - 5 requests per 15 minutes
 */
const authLimiter = rateLimit({
  store: redisClient
    ? new RedisStore({
        client: redisClient,
        prefix: 'rl:auth:',
      })
    : undefined,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many login attempts, please try again after 15 minutes.',
  skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * Registration rate limiter - 3 requests per hour
 */
const registerLimiter = rateLimit({
  store: redisClient
    ? new RedisStore({
        client: redisClient,
        prefix: 'rl:register:',
      })
    : undefined,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: 'Too many registration attempts, please try again later.',
});

/**
 * File upload rate limiter - 10 uploads per hour
 */
const uploadLimiter = rateLimit({
  store: redisClient
    ? new RedisStore({
        client: redisClient,
        prefix: 'rl:upload:',
      })
    : undefined,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  message: 'Too many uploads, please try again later.',
});

/**
 * YouTube import rate limiter - 20 imports per day
 */
const youtubeImportLimiter = rateLimit({
  store: redisClient
    ? new RedisStore({
        client: redisClient,
        prefix: 'rl:youtube:',
      })
    : undefined,
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 20, // 20 imports per day
  message: 'Too many YouTube imports, please try again tomorrow.',
  skipSuccessfulRequests: false,
});

/**
 * Search rate limiter - 60 searches per minute
 */
const searchLimiter = rateLimit({
  store: redisClient
    ? new RedisStore({
        client: redisClient,
        prefix: 'rl:search:',
      })
    : undefined,
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 searches per minute
  message: 'Too many search requests, please try again later.',
});

module.exports = {
  generalLimiter,
  authLimiter,
  registerLimiter,
  uploadLimiter,
  youtubeImportLimiter,
  searchLimiter,
};
