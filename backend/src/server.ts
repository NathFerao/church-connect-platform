import './types';

import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { config } from './config/constants';
import prisma from './config/database';
import redis from './config/redis';
import { logger } from './utils/logger';

const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info('✓ Database connected');

    await redis.ping();
    logger.info('✓ Redis connected');

    const server = app.listen(config.port, () => {
      logger.info(`✓ Server running on port ${config.port} in ${config.nodeEnv} mode`);
      logger.info(`✓ API available at http://localhost:${config.port}/api/${config.apiVersion}`);
    });

    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');
        try {
          await prisma.$disconnect();
          logger.info('Database disconnected');
          redis.disconnect();
          logger.info('Redis disconnected');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();