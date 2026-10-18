import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, query } from './pool.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  if (!pool) {
    logger.warn('Skipping SQL migrations: DATABASE_URL not set.');
    return;
  }

  try {
    logger.info('Starting database migration...');
    const migrationFile = path.join(__dirname, 'migrations', '001_initial_schema.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');

    await query(sql);
    logger.info('Database migration completed successfully!');
  } catch (err: any) {
    logger.error('Database migration failed', { error: err.message });
    throw err;
  }
}

// Execute directly if script run via CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
