import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db/dbProvider.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { carrierConfirmEtaSchema } from '../schemas/carrier.schema.js';
import { logger } from '../utils/logger.js';

export const carrierRouter = Router();

// POST /api/v1/carrier/confirm-eta
carrierRouter.post(
  '/confirm-eta',
  validateRequest(carrierConfirmEtaSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { shipmentId, action, proposedEta, reason } = req.body;

      // Fetch shipment to verify carrier tenancy
      const shipment = await db.getShipmentById(shipmentId);
      if (!shipment) {
        res.status(404).json({ status: 'error', message: 'Shipment not found' });
        return;
      }

      // If user is a Carrier, enforce that they only act on their own shipments
      if (req.user?.role === 'CARRIER' && shipment.carrier_id !== req.user.carrierId) {
        res.status(403).json({
          status: 'error',
          code: 'UNAUTHORIZED_CARRIER',
          message: 'Carrier organization is not authorized to modify this shipment',
        });
        return;
      }

      if (action === 'PROPOSE') {
        if (!proposedEta) {
          res.status(400).json({ status: 'error', message: 'proposedEta is required when action is PROPOSE' });
          return;
        }

        const updated = await db.proposeRevisedEta(shipmentId, proposedEta, reason || 'Carrier operational adjustment');
        res.json({
          status: 'success',
          action: 'PROPOSE',
          message: 'Proposed revised ETA has been registered and submitted for analyst confirmation',
          shipment: updated,
        });
        return;
      }

      if (action === 'CONFIRM') {
        const updated = await db.confirmEta(shipmentId, true);
        res.json({
          status: 'success',
          action: 'CONFIRM',
          message: 'Committed delivery ETA confirmed by carrier dispatch',
          shipment: updated,
        });
        return;
      }

      if (action === 'REJECT') {
        const updated = await db.confirmEta(shipmentId, false);
        res.json({
          status: 'success',
          action: 'REJECT',
          message: 'Proposed ETA variation rejected. Current SLA schedule preserved.',
          shipment: updated,
        });
        return;
      }

      res.status(400).json({ status: 'error', message: 'Unsupported carrier action' });
    } catch (err) {
      next(err);
    }
  }
);
