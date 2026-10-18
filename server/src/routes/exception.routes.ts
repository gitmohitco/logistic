import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db/dbProvider.js';
import { authorize } from '../middleware/authenticate.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { resolveExceptionSchema } from '../schemas/carrier.schema.js';

export const exceptionRouter = Router();

// GET /api/v1/exceptions
exceptionRouter.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const list = await db.getExceptions();
    
    // Carrier tenant isolation: if carrier role, only return exceptions for their shipments
    let filtered = list;
    if (req.user?.role === 'CARRIER') {
      filtered = list.filter((e) => e.carrier_id === req.user?.carrierId);
    }

    const dtos = filtered.map((e) => ({
      id: e.id,
      correlationId: e.correlation_id,
      shipmentId: e.shipment_id,
      trackingId: e.tracking_id || 'SHP-2026-001',
      vehicleId: e.vehicle_id,
      vehicleCode: e.vehicle_code,
      exceptionType: e.exception_type,
      severity: e.severity,
      status: e.status,
      description: e.description,
      detectedAt: e.detected_at,
      resolvedAt: e.resolved_at,
      originalEta: e.original_eta,
      suggestedEta: e.suggested_eta,
      slaImpactMinutes: e.sla_impact_minutes,
      aiRecommendation: e.ai_recommendation,
      aiAnalysisStatus: e.ai_analysis_status,
      carrierId: e.carrier_id,
      resolutionNotes: e.resolution_notes,
      resolvedBy: e.resolved_by,
    }));

    res.json(dtos);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/exceptions/:id
exceptionRouter.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const e = await db.getExceptionById(id);
    if (!e) {
      res.status(404).json({ status: 'error', message: 'Exception record not found' });
      return;
    }

    // Carrier isolation
    if (req.user?.role === 'CARRIER' && e.carrier_id !== req.user.carrierId) {
      res.status(403).json({
        status: 'error',
        code: 'TENANT_ISOLATION_VIOLATION',
        message: 'Carriers are prohibited from accessing exceptions belonging to other organizations',
      });
      return;
    }

    res.json({
      id: e.id,
      correlationId: e.correlation_id,
      shipmentId: e.shipment_id,
      trackingId: e.tracking_id,
      vehicleId: e.vehicle_id,
      vehicleCode: e.vehicle_code,
      exceptionType: e.exception_type,
      severity: e.severity,
      status: e.status,
      description: e.description,
      detectedAt: e.detected_at,
      resolvedAt: e.resolved_at,
      originalEta: e.original_eta,
      suggestedEta: e.suggested_eta,
      slaImpactMinutes: e.sla_impact_minutes,
      aiRecommendation: e.ai_recommendation,
      aiAnalysisStatus: e.ai_analysis_status,
      resolutionNotes: e.resolution_notes,
      resolvedBy: e.resolved_by,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/exceptions/:id/resolve
// Only analysts, ops managers, and admins are authorized to resolve Mendix AI recommendations
exceptionRouter.post(
  '/:id/resolve',
  authorize(['ANALYST', 'OPS_MANAGER', 'ADMIN']),
  validateRequest(resolveExceptionSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { action, notes } = req.body;
      const id = req.params.id as string;
      const resolved = await db.resolveException(
        id,
        action,
        notes,
        req.user?.id || 'analyst-001',
        req.user?.role || 'ANALYST'
      );

      if (!resolved) {
        res.status(404).json({ status: 'error', message: 'Exception record not found' });
        return;
      }

      res.json({
        status: 'success',
        message: `Exception resolved via action: ${action}`,
        exception: resolved,
      });
    } catch (err) {
      next(err);
    }
  }
);
