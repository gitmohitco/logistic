import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error occurred';

  logger.error('Unhandled error during request processing', {
    url: req.originalUrl,
    method: req.method,
    status,
    message,
    correlationId: req.correlationId,
  });

  res.status(status).json({
    status: 'error',
    code: err.code || 'INTERNAL_ERROR',
    message,
    correlationId: req.correlationId,
  });
};
