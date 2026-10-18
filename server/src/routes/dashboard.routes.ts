import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db/dbProvider.js';

export const dashboardRouter = Router();

dashboardRouter.get('/summary', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const summary = await db.getSummary();
    res.json(summary);
  } catch (err) {
    next(err);
  }
});
