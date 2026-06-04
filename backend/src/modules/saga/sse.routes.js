import { Router } from 'express';
import { getOrderStatus } from './booking.saga.js';

const router = Router();

router.get('/orders/:id/status', async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendStatus = async () => {
    const order = await getOrderStatus(id, userId);
    if (order) {
      res.write(`data: ${JSON.stringify({ status: order.status, updatedAt: order.updated_at })}\n\n`);
      if (['completed', 'cancelled', 'refunded'].includes(order.status)) {
        res.end();
      }
    }
  };

  await sendStatus();

  const interval = setInterval(sendStatus, 2000);

  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
});

export default router;