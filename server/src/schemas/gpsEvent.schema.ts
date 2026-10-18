import { z } from 'zod';

export const gpsEventSchema = z.object({
  eventId: z.string().min(1, 'eventId is required'),
  vehicleId: z.string().min(1, 'vehicleId is required'),
  shipmentId: z.string().optional(),
  latitude: z.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
  longitude: z.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
  speedKph: z.number().min(0, 'Speed must be nonnegative').max(1200, 'Speed exceeds operational threshold'),
  recordedAt: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'recordedAt must be a valid ISO 8601 timestamp',
  }),
  temperatureCelsius: z.number().nullable().optional(),
  source: z.string().default('gps'),
});

export type GpsEventDto = z.infer<typeof gpsEventSchema>;
