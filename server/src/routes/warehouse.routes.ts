import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db/dbProvider.js';

export const warehouseRouter = Router();

warehouseRouter.get('/capacity', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const hubs = await db.getHubCapacities();
    const dtos = hubs.map((h) => ({
      id: h.id,
      hubCode: h.hub_code,
      hubName: h.hub_name,
      totalCapacity: Number(h.total_capacity),
      occupiedCapacity: Number(h.occupied_capacity),
      capacityUnit: h.capacity_unit,
      latitude: Number(h.latitude),
      longitude: Number(h.longitude),
      status: h.status,
      updatedAt: h.updated_at,
    }));
    res.json(dtos);
  } catch (err) {
    next(err);
  }
});
