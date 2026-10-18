import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { authenticate } from './middleware/authenticate.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';

import { dashboardRouter } from './routes/dashboard.routes.js';
import { shipmentRouter } from './routes/shipment.routes.js';
import { vehicleRouter } from './routes/vehicle.routes.js';
import { trackingRouter } from './routes/tracking.routes.js';
import { warehouseRouter } from './routes/warehouse.routes.js';
import { exceptionRouter } from './routes/exception.routes.js';
import { webhookRouter } from './routes/webhook.routes.js';
import { carrierRouter } from './routes/carrier.routes.js';
import { healthRouter } from './routes/health.routes.js';

export const app = express();

// Security Middlewares
app.use(helmet({
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: [env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Apply rate limiter to API routes in non-test mode
if (env.NODE_ENV !== 'test') {
  app.use('/api', apiRateLimiter);
}

// Global Authentication & Correlation Middleware
app.use(authenticate);

// Request Logger
app.use((req, _res, next) => {
  logger.debug(`Incoming ${req.method} ${req.url}`, {
    correlationId: req.correlationId,
    role: req.user?.role,
  });
  next();
});

// Versioned API Routes (/api/v1/...)
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/shipments', shipmentRouter);
app.use('/api/v1/vehicles', vehicleRouter);
app.use('/api/v1/tracking', trackingRouter);
app.use('/api/v1/warehouses', warehouseRouter);
app.use('/api/v1/exceptions', exceptionRouter);
app.use('/api/v1/webhooks', webhookRouter);
app.use('/api/v1/carrier', carrierRouter);
app.use('/api/v1/health', healthRouter);

// Centralized Error Handling
app.use(errorHandler);
