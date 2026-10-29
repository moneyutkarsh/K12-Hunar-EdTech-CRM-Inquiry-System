import { app } from './app.js';
import { config } from './config/env.js';
import pool from './config/db.js';
import { logger } from './config/logger.js';

const server = app.listen(config.PORT, () => {
  logger.info(`🚀 K12 Hunar CRM Backend running on port ${config.PORT} (${config.NODE_ENV} mode)`);
  logger.info(`📡 Health Check: http://localhost:${config.PORT}/api/health`);
  logger.info(`📚 Swagger Docs: http://localhost:${config.PORT}/api/docs`);
});

const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Initiating graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed.');
    try {
      if (pool && typeof pool.end === 'function') {
        await pool.end();
        logger.info('Database pool drained successfully.');
      }
    } catch (err) {
      logger.error('Error during pool draining:', err);
    }
    process.exit(0);
  });

  // Force exit if shutdown takes longer than 10 seconds
  setTimeout(() => {
    logger.error('Forceful shutdown triggered after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
