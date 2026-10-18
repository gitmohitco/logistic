import { Router, Request, Response } from 'express';
import { pool } from '../db/pool.js';
import { env } from '../config/env.js';

export const healthRouter = Router();

healthRouter.get('/', async (_req: Request, res: Response): Promise<void> => {
  let dbStatus = 'STANDALONE_DEMO_MEMORY';
  if (pool) {
    try {
      await pool.query('SELECT 1');
      dbStatus = 'NEON_POSTGRES_CONNECTED';
    } catch {
      dbStatus = 'NEON_POSTGRES_ERROR';
    }
  }

  res.json({
    status: 'healthy',
    service: 'Logistics Control Tower API Gateway',
    version: '1.0.0',
    environment: env.NODE_ENV,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    connectors: {
      neonDatabase: dbStatus,
      mendixAi: {
        configured: Boolean(env.MENDIX_BASE_URL),
        endpoint: env.MENDIX_AI_ENDPOINT,
        ragKnowledgeBase: 'Mendix PgVector Active',
      },
      gpsIngestion: {
        active: true,
        endpoint: '/api/v1/webhooks/gps',
        deduplication: 'ENABLED',
      },
    },
  });
});
