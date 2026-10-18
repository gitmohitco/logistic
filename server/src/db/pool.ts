import pg from 'pg';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const { Pool } = pg;

export let pool: pg.Pool | null = null;

if (env.DATABASE_URL) {
  logger.info('Initializing Neon PostgreSQL connection pool...', {
    ssl: true,
  });

  pool = new Pool({
    connectionString: env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pool.on('error', (err) => {
    logger.error('Unexpected idle client error in Neon PostgreSQL pool', { error: err.message });
  });
} else {
  logger.info('No DATABASE_URL configured. Server will operate using high-performance in-memory repository fallback for standalone demo.');
}

export async function query<T extends pg.QueryResultRow = any>(text: string, params?: any[]): Promise<pg.QueryResult<T>> {
  if (!pool) {
    throw new Error('Database pool not initialized. DATABASE_URL is not set.');
  }
  const start = Date.now();
  const res = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  logger.debug('Executed query', { text, duration, rows: res.rowCount });
  return res;
}
