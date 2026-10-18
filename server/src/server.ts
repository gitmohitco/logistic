import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { runMigrations } from './db/migrate.js';

async function bootstrap() {
  try {
    // Attempt migrations on startup if DATABASE_URL is set
    if (env.DATABASE_URL) {
      await runMigrations();
    }

    const server = app.listen(env.PORT, () => {
      logger.info(`Logistics Control Tower Gateway running on port ${env.PORT}`, {
        env: env.NODE_ENV,
        healthEndpoint: `http://localhost:${env.PORT}/api/v1/health`,
      });
    });

    const shutdown = () => {
      logger.info('Shutting down server gracefully...');
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err: any) {
    logger.error('Failed to start Logistics Control Tower server', { error: err.message });
    process.exit(1);
  }
}

bootstrap();
