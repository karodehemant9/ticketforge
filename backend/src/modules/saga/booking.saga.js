import pool from '../../config/database.js';
import { sendBookingEvent, consumer } from '../../config/kafka.js';
import logger from '../../utils/logger.js';

const MAX_RETRIES = 3;
const PAYMENT_SIMULATION_MS = 3000;

export const startBookingConsumer = async () => {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: 'order.created', fromBeginning: false });
    await consumer.subscribe({ topic: 'order.payment.retry', fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const data = JSON.parse(message.value.toString());
        logger.info(`Processing ${topic}: ${data.orderId}`);

        try {
          if (topic === 'order.created') {
            await processPayment(data);
          } else if (topic === 'order.payment.retry') {
            await processPayment(data, true);
          }
        } catch (err) {
          logger.error(`Failed to process order ${data.orderId}: ${err.message}`);
          
          if (!data.retryCount || data.retryCount < MAX_RETRIES) {
            const retryCount = (data.retryCount || 0) + 1;
            const delay = Math.pow(2, retryCount) * 1000;
            
            setTimeout(async () => {
              await sendBookingEvent('order.payment.retry', {
                ...data,
                retryCount,
              });
            }, delay);
            
            logger.info(`Scheduled retry ${retryCount} for order ${data.orderId} in ${delay}ms`);
          } else {
            await sendBookingEvent('orders.dlq', {
              ...data,
              error: err.message,
              failedAt: new Date().toISOString(),
            });
            logger.error(`Order ${data.orderId} sent to DLQ after ${MAX_RETRIES} retries`);
          }
        }
      },
    });
    
    logger.info('Kafka consumer started successfully');
  } catch (err) {
    logger.error('Failed to start Kafka consumer:', err.message);
    throw err;
  }
};

const processPayment = async (data, isRetry = false) => {
  const { orderId, userId, totalAmount } = data;

  await pool.query(
    `UPDATE orders SET status = 'payment_initiated', updated_at = NOW() WHERE id = $1`,
    [orderId]
  );

  logger.info(`Simulating payment for order ${orderId}...`);
  await new Promise(resolve => setTimeout(resolve, PAYMENT_SIMULATION_MS));

  const shouldFail = isRetry && Math.random() < 0.3;
  if (shouldFail) {
    throw new Error('Payment gateway timeout');
  }

  await pool.query(
    `UPDATE orders SET status = 'completed', updated_at = NOW() WHERE id = $1`,
    [orderId]
  );

  await sendBookingEvent('order.completed', {
    orderId,
    userId,
    totalAmount,
    completedAt: new Date().toISOString(),
  });

  logger.info(`Order ${orderId} completed successfully`);
};

export const getOrderStatus = async (orderId, userId) => {
  const result = await pool.query(
    `SELECT id, status, total_amount, final_amount, created_at, updated_at,
            (SELECT title FROM events WHERE id = orders.event_id) as event_title
     FROM orders WHERE id = $1 AND user_id = $2`,
    [orderId, userId]
  );
  return result.rows[0] || null;
};