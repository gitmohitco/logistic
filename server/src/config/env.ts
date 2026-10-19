import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../env') });
dotenv.config({ path: path.resolve(process.cwd(), 'env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().transform(Number).default('4000'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),

  // Neon PostgreSQL
  DATABASE_URL: z.string().optional(),

  // Google OIDC / Auth
  GOOGLE_OIDC_ISSUER: z.string().default('https://accounts.google.com'),
  GOOGLE_OIDC_CLIENT_ID: z.string().default('mock-google-client-id'),
  GOOGLE_OIDC_CLIENT_SECRET: z.string().default('mock-google-client-secret'),
  SESSION_SECRET: z.string().default('dev-secret-at-least-32-chars-long-2026'),

  // Mendix 11.12.3 AI
  MENDIX_BASE_URL: z.string().default('https://logistics-ai-sandbox.mendixcloud.com'),
  MENDIX_AI_ENDPOINT: z.string().default('/rest/logistics/v1/exceptions/analyze'),
  MENDIX_TOKEN_URL: z.string().default('https://logistics-ai-sandbox.mendixcloud.com/oauth/v2/token'),
  MENDIX_CLIENT_ID: z.string().default('mendix-client-id'),
  MENDIX_CLIENT_SECRET: z.string().default('mendix-client-secret'),
  MENDIX_SCOPE: z.string().default('logistics:exceptions:analyze'),
  MENDIX_AUDIENCE: z.string().default('https://logistics-ai-sandbox.mendixcloud.com'),

  // Webhook security
  GPS_WEBHOOK_SECRET: z.string().default('gps-telematics-secure-hmac-secret-key-2026'),
  TMS_WEBHOOK_SECRET: z.string().default('tms-enterprise-secure-hmac-secret-key-2026'),
  LOG_LEVEL: z.string().default('info'),
});

export const env = envSchema.parse(process.env);
