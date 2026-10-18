import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db/dbProvider.js';

export const shipmentRouter = Router();

// GET /api/v1/shipments
shipmentRouter.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;

    // Enforce carrier isolation
    let carrierId = req.query.carrierId as string | undefined;
    if (req.user?.role === 'CARRIER') {
      carrierId = req.user.carrierId;
    }

    const shipments = await db.getShipments({ status, carrierId, search });

    // Map to camelCase DTO expected by frontend
    const dtos = shipments.map((s) => ({
      id: s.id,
      trackingId: s.tracking_id,
      carrierId: s.carrier_id,
      carrierName: s.carrier_name || 'Apex Intermodal Logistics',
      originHubId: s.origin_hub_id,
      originHubName: s.origin_hub_name || 'Origin Hub',
      originCoords: [s.origin_lat || 17.3850, s.origin_lng || 78.4867],
      destinationHubId: s.destination_hub_id,
      destinationHubName: s.destination_hub_name || 'Destination Hub',
      destinationCoords: [s.destination_lat || 16.5062, s.destination_lng || 80.6480],
      vehicleId: s.vehicle_id,
      vehicleCode: s.vehicle_code,
      driverId: s.driver_id,
      driverName: s.driver_name,
      driverPhone: s.driver_phone,
      status: s.status,
      estimatedArrival: s.estimated_arrival,
      originalEta: s.original_eta,
      actualArrival: s.actual_arrival,
      cargoType: s.cargo_type,
      weightKg: Number(s.weight_kg),
      delayMinutes: s.delay_minutes,
      routeCoordinates: s.route_coordinates || [],
      currentLatitude: s.current_latitude,
      currentLongitude: s.current_longitude,
      currentSpeedKph: s.current_speed_kph,
      temperatureCelsius: s.temperature_celsius,
      activeExceptionId: s.active_exception_id,
      exceptionSeverity: s.exception_severity,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    }));

    res.json(dtos);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/shipments/:id
shipmentRouter.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const s = await db.getShipmentById(id);
    if (!s) {
      res.status(404).json({ status: 'error', message: 'Shipment not found' });
      return;
    }

    // Carrier data isolation verification
    if (req.user?.role === 'CARRIER' && s.carrier_id !== req.user.carrierId) {
      res.status(403).json({
        status: 'error',
        code: 'TENANT_ISOLATION_VIOLATION',
        message: 'Carrier partner cannot access shipments belonging to another carrier organization',
      });
      return;
    }

    res.json({
      id: s.id,
      trackingId: s.tracking_id,
      carrierId: s.carrier_id,
      carrierName: s.carrier_name || 'Apex Intermodal Logistics',
      originHubId: s.origin_hub_id,
      originHubName: s.origin_hub_name || 'Origin Hub',
      originCoords: [s.origin_lat || 17.3850, s.origin_lng || 78.4867],
      destinationHubId: s.destination_hub_id,
      destinationHubName: s.destination_hub_name || 'Destination Hub',
      destinationCoords: [s.destination_lat || 16.5062, s.destination_lng || 80.6480],
      vehicleId: s.vehicle_id,
      vehicleCode: s.vehicle_code,
      driverName: s.driver_name,
      status: s.status,
      estimatedArrival: s.estimated_arrival,
      originalEta: s.original_eta,
      cargoType: s.cargo_type,
      weightKg: Number(s.weight_kg),
      delayMinutes: s.delay_minutes,
      routeCoordinates: s.route_coordinates || [],
      currentLatitude: s.current_latitude,
      currentLongitude: s.current_longitude,
      currentSpeedKph: s.current_speed_kph,
      temperatureCelsius: s.temperature_celsius,
      activeExceptionId: s.active_exception_id,
      exceptionSeverity: s.exception_severity,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    });
  } catch (err) {
    next(err);
  }
});
