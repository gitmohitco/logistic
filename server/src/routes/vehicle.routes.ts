import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db/dbProvider.js';

export const vehicleRouter = Router();

vehicleRouter.get('/', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const vehicles = await db.getVehicles();
    const dtos = vehicles.map((v) => ({
      id: v.id,
      carrierId: v.carrier_id,
      vehicleCode: v.vehicle_code,
      transportMode: v.transport_mode,
      status: v.status,
      currentLatitude: Number(v.current_latitude),
      currentLongitude: Number(v.current_longitude),
      currentSpeedKph: Number(v.current_speed_kph),
      headingDeg: Number(v.heading_deg),
      lastLocationAt: v.last_location_at,
      assignedShipmentId: v.assigned_shipment_id,
      assignedTrackingId: v.assigned_tracking_id,
      driverName: v.driver_name,
      driverPhone: v.driver_phone,
    }));
    res.json(dtos);
  } catch (err) {
    next(err);
  }
});
