import { Router } from 'express';
import { checkDbHealth } from '../../config/database.js';
import { checkRedisHealth } from '../../config/redis.js';

const router = Router();

router.get('/', async (req, res) => {
  const dbHealthy = await checkDbHealth();
  const redisHealthy = await checkRedisHealth();

  const status = dbHealthy && redisHealthy ? 200 : 503;
  res.status(status).json({
    success: status === 200,
    data: {
      status: status === 200 ? 'healthy' : 'unhealthy',
      services: { database: dbHealthy ? 'up' : 'down', redis: redisHealthy ? 'up' : 'down' },
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;