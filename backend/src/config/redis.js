import Redis from 'ioredis';
import env from './env.js';

const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err.message);
});

redis.on('connect', () => {
  console.log('Redis connected');
});

export const checkRedisHealth = async () => {
  try {
    await redis.ping();
    return true;
  } catch {
    return false;
  }
};

export default redis;