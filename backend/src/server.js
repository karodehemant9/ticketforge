import app from './app.js';
import env from './config/env.js';
import logger from './utils/logger.js';

const server = app.listen(env.PORT, () => {
  logger.info(`TicketForge running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});

const shutdown = (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('Forced shutdown');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  shutdown('UNCAUGHT_EXCEPTION');
});
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
  shutdown('UNHANDLED_REJECTION');
});