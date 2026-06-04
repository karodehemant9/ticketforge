import { Kafka } from 'kafkajs';
import env from './env.js';
import logger from '../utils/logger.js';

const kafka = new Kafka({
  clientId: 'ticketforge-backend',
  brokers: env.KAFKA_BROKERS.split(','),
  retry: {
    initialRetryTime: 100,
    retries: 5,
  },
});

export const producer = kafka.producer();
export const consumer = kafka.consumer({ groupId: 'ticketforge-booking-group' });
export const dlqConsumer = kafka.consumer({ groupId: 'ticketforge-dlq-group' });

export const connectKafka = async () => {
  await producer.connect();
  
  // Create topics if they don't exist
  const admin = kafka.admin();
  await admin.connect();
  
  const topics = await admin.listTopics();
  const topicsToCreate = ['order.created', 'order.payment.retry', 'order.completed', 'orders.dlq'];
  
  for (const topic of topicsToCreate) {
    if (!topics.includes(topic)) {
      await admin.createTopics({
        topics: [{ topic, numPartitions: 1, replicationFactor: 1 }],
        waitForLeaders: true,
      });
      logger.info(`Created Kafka topic: ${topic}`);
    }
  }
  
  await admin.disconnect();
  logger.info('Kafka producer connected, topics verified');
};

export const disconnectKafka = async () => {
  await producer.disconnect();
  await consumer.disconnect();
  logger.info('Kafka disconnected');
};

export const sendBookingEvent = async (topic, message) => {
  await producer.send({
    topic,
    messages: [{ key: message.orderId || message.userId, value: JSON.stringify(message) }],
  });
};

export default kafka;