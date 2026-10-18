import { z } from 'zod';

export const mendixRequestSchema = z.object({
  correlationId: z.string(),
  exceptionId: z.string(),
  exceptionType: z.string(),
  shipmentId: z.string(),
  vehicleId: z.string().optional(),
  origin: z.string(),
  destination: z.string(),
  currentLatitude: z.number(),
  currentLongitude: z.number(),
  currentEta: z.string(),
  temperatureCelsius: z.number().nullable().optional(),
  observedAt: z.string(),
  context: z.object({
    delayMinutes: z.number(),
    routeDeviationKm: z.number().default(0),
    sensorStatus: z.string().default('NORMAL'),
  }),
});

export type MendixRequestDto = z.infer<typeof mendixRequestSchema>;

export const mendixResponseSchema = z.object({
  correlationId: z.string(),
  exceptionId: z.string(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  recommendedAction: z.enum(['REROUTE', 'NOTIFY_CARRIER', 'EXPEDITE', 'HOLD', 'INSPECT_CARGO']),
  reasoningSummary: z.string(),
  suggestedEta: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'suggestedEta must be a valid ISO 8601 timestamp',
  }),
  slaImpactMinutes: z.number(),
  confidence: z.number().min(0).max(1),
  knowledgeReferences: z.array(
    z.object({
      documentTitle: z.string(),
      section: z.string(),
      snippet: z.string(),
    })
  ).default([]),
});

export type MendixResponseDto = z.infer<typeof mendixResponseSchema>;
