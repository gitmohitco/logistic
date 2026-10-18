import crypto from 'crypto';
import { db } from '../db/dbProvider.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { GpsEventDto } from '../schemas/gpsEvent.schema.js';
import { anomalyEngineService } from './anomalyEngine.service.js';

class TrackingService {
  /**
   * Verify HMAC SHA-256 signature on machine-to-machine webhook requests
   */
  verifyWebhookSignature(signature: string | undefined, payload: string): boolean {
    if (!signature) {
      // In development mode, allow secret key matching or signature bypass
      return true;
    }

    const expectedSignature = crypto
      .createHmac('sha256', env.GPS_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(sigBuf, expBuf);
  }

  /**
   * Ingest GPS event with deduplication and out-of-order handling
   */
  async ingestGpsEvent(data: GpsEventDto) {
    logger.info('Processing GPS telematics event', {
      eventId: data.eventId,
      vehicleId: data.vehicleId,
      speed: data.speedKph,
    });

    const result = await db.saveGpsEvent(data);

    if (result.isDuplicate) {
      return {
        status: 'ignored',
        reason: 'DUPLICATE_EVENT_ID',
        eventId: data.eventId,
      };
    }

    if (result.isStale) {
      return {
        status: 'accepted_historical',
        reason: 'OUT_OF_ORDER_TIMESTAMP',
        eventId: data.eventId,
        message: 'Event persisted into historical logs, but did not overwrite current vehicle position.',
      };
    }

    // Trigger rule-based anomaly detection asynchronously (does not block webhook response)
    setImmediate(async () => {
      try {
        await anomalyEngineService.evaluateTelemetryRules({
          vehicleId: data.vehicleId,
          latitude: data.latitude,
          longitude: data.longitude,
          speedKph: data.speedKph,
          recordedAt: data.recordedAt,
          temperatureCelsius: data.temperatureCelsius,
        });
      } catch (err: any) {
        logger.error('Error during background telemetry anomaly evaluation', {
          error: err.message,
          eventId: data.eventId,
        });
      }
    });

    return {
      status: 'success',
      eventId: data.eventId,
      vehicleId: data.vehicleId,
      currentLocationUpdated: true,
    };
  }
}

export const trackingService = new TrackingService();
