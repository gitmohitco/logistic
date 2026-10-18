import { Router, Request, Response, NextFunction } from 'express';
import { validateRequest } from '../middleware/validateRequest.js';
import { gpsEventSchema } from '../schemas/gpsEvent.schema.js';
import { trackingService } from '../services/tracking.service.js';
import { logger } from '../utils/logger.js';

export const webhookRouter = Router();

// POST /api/v1/webhooks/gps
webhookRouter.post(
  '/gps',
  validateRequest(gpsEventSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const signature = req.header('X-Webhook-Signature');
      const rawPayload = JSON.stringify(req.body);

      // Verify webhook sender authenticity
      const isValidSig = trackingService.verifyWebhookSignature(signature, rawPayload);
      if (!isValidSig) {
        res.status(401).json({
          status: 'error',
          code: 'INVALID_SIGNATURE',
          message: 'Webhook HMAC signature verification failed',
        });
        return;
      }

      const result = await trackingService.ingestGpsEvent(req.body);

      if (result.status === 'ignored') {
        res.status(200).json({
          status: 'acknowledged',
          message: 'Duplicate event already processed. Safely ignored.',
          eventId: result.eventId,
        });
        return;
      }

      res.status(202).json({
        status: 'accepted',
        message: 'GPS telemetry accepted and enqueued for rule evaluation',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/webhooks/tms (Transport Management System sync)
webhookRouter.post('/tms', async (req: Request, res: Response): Promise<void> => {
  logger.info('TMS webhook event received', { body: req.body });
  res.status(200).json({ status: 'acknowledged', source: 'tms' });
});

// POST /api/v1/webhooks/iot (IoT cold-chain / vibration sensor sync)
webhookRouter.post('/iot', async (req: Request, res: Response): Promise<void> => {
  logger.info('IoT sensor webhook event received', { body: req.body });
  res.status(200).json({ status: 'acknowledged', source: 'iot' });
});
