import { z } from 'zod';

export const carrierConfirmEtaSchema = z.object({
  shipmentId: z.string().min(1, 'shipmentId is required'),
  action: z.enum(['PROPOSE', 'CONFIRM', 'REJECT']),
  proposedEta: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), {
    message: 'proposedEta must be a valid ISO 8601 timestamp',
  }),
  reason: z.string().optional(),
});

export const resolveExceptionSchema = z.object({
  action: z.string().min(1, 'action is required'),
  notes: z.string().optional().default('Approved by operations controller'),
});
