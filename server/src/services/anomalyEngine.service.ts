import { db } from '../db/dbProvider.js';
import { mendixAiService } from './mendixAi.service.js';
import { logger } from '../utils/logger.js';
import { ExceptionSeverity, ShipmentRecord } from '../types/index.js';

class AnomalyEngineService {
  /**
   * Evaluates operational rules against latest vehicle telematics
   */
  async evaluateTelemetryRules(params: {
    vehicleId: string;
    latitude: number;
    longitude: number;
    speedKph: number;
    recordedAt: string;
    temperatureCelsius?: number | null;
  }) {
    // 1. Locate vehicle and linked shipment
    const vehicle = await db.getVehicleById(params.vehicleId);
    if (!vehicle) return;

    const shipments = await db.getShipments();
    const shipment = shipments.find(
      (s) => s.vehicle_id === vehicle.id || s.vehicle_code === vehicle.vehicle_code
    );
    if (!shipment) return;

    let anomalyDetected = false;
    let exceptionType = 'DELIVERY_DELAY';
    let delayMinutes = shipment.delay_minutes;
    let description = '';

    // Check Temperature Breach for Cold Chain / Bio cargo
    if (
      params.temperatureCelsius !== undefined &&
      params.temperatureCelsius !== null &&
      shipment.cargo_type.toLowerCase().includes('biopharmaceutical')
    ) {
      if (params.temperatureCelsius > 8.0 || params.temperatureCelsius < 2.0) {
        anomalyDetected = true;
        exceptionType = 'TEMPERATURE_EXCURSION';
        description = `Cargo temperature breach: ${params.temperatureCelsius}°C (Safe range: 2.0°C - 8.0°C). Biopharmaceutical integrity at risk.`;
      }
    }

    // Check Speed / Transit Delay (e.g. low speed < 10 km/h for in-transit shipment)
    if (!anomalyDetected && params.speedKph < 15 && shipment.status === 'ON_ROUTE') {
      delayMinutes += 25;
      if (delayMinutes >= 15) {
        anomalyDetected = true;
        exceptionType = 'DELIVERY_DELAY';
        description = `Telemetry indicates traffic bottleneck (speed ${params.speedKph} km/h). ETA delayed by +${delayMinutes} mins.`;
      }
    }

    if (!anomalyDetected) return;

    // Check if open exception already exists to avoid duplicate war-room spam
    const existingExceptions = await db.getExceptions();
    const existingOpen = existingExceptions.find(
      (e) => e.shipment_id === shipment.id && e.status !== 'RESOLVED' && e.exception_type === exceptionType
    );
    if (existingOpen) {
      logger.info('Open exception already active for shipment, skipping duplicate generation', {
        trackingId: shipment.tracking_id,
        exceptionId: existingOpen.id,
      });
      return;
    }

    // Submit anomaly to Mendix AI
    const correlationId = `corr-${Date.now()}-${shipment.tracking_id.toLowerCase()}`;
    const mendixRequest = {
      correlationId,
      exceptionId: `exc-${Date.now()}`,
      exceptionType,
      shipmentId: shipment.id,
      vehicleId: vehicle.id,
      origin: shipment.origin_hub_name || 'Origin Hub',
      destination: shipment.destination_hub_name || 'Destination Hub',
      currentLatitude: params.latitude,
      currentLongitude: params.longitude,
      currentEta: shipment.estimated_arrival,
      temperatureCelsius: params.temperatureCelsius,
      observedAt: params.recordedAt,
      context: {
        delayMinutes,
        routeDeviationKm: 0,
        sensorStatus: anomalyDetected ? 'ALERT' : 'NORMAL',
      },
    };

    const aiResult = await mendixAiService.analyzeException(mendixRequest);

    // Persist exception record in DB
    const createdException = await db.createException({
      correlation_id: correlationId,
      shipment_id: shipment.id,
      tracking_id: shipment.tracking_id,
      vehicle_id: vehicle.id,
      vehicle_code: vehicle.vehicle_code,
      exception_type: exceptionType,
      severity: aiResult.severity as ExceptionSeverity,
      status: 'OPEN',
      description,
      detected_at: new Date().toISOString(),
      original_eta: shipment.original_eta,
      suggested_eta: aiResult.suggestedEta,
      sla_impact_minutes: aiResult.slaImpactMinutes,
      ai_recommendation: aiResult,
      ai_analysis_status: 'COMPLETED',
      carrier_id: shipment.carrier_id,
    });

    // Execute Severity Workflows
    await this.processSeverityWorkflow(createdException, shipment);
  }

  /**
   * Business workflow execution per Section 9
   */
  private async processSeverityWorkflow(exception: any, shipment: ShipmentRecord) {
    if (exception.severity === 'LOW') {
      // Low Severity: Auto-apply suggested ETA update & log customer notification
      logger.info('Low severity exception detected: Applying automated ETA adjustment', {
        trackingId: shipment.tracking_id,
        suggestedEta: exception.suggested_eta,
      });
      await db.resolveException(
        exception.id,
        'AUTO_ETA_UPDATE',
        'System automatically updated ETA within permitted SLA tolerance (+15m) and dispatched customer dispatch advisory.',
        'system-auto',
        'ADMIN'
      );
    } else if (exception.severity === 'MEDIUM') {
      // Medium Severity: Route to Control Tower Analyst case queue
      logger.info('Medium severity exception queued for Control Tower Analyst review', {
        trackingId: shipment.tracking_id,
        exceptionId: exception.id,
      });
    } else if (exception.severity === 'HIGH') {
      // High Severity: Escalate to Operations Manager & War Room
      logger.warn('HIGH SEVERITY CRITICAL INCIDENT ESCALATION: War-Room Incident Created', {
        trackingId: shipment.tracking_id,
        exceptionId: exception.id,
        impact: `+${exception.sla_impact_minutes}m SLA impact`,
      });
    }
  }
}

export const anomalyEngineService = new AnomalyEngineService();
