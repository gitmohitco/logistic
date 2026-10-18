import { apiRequest } from './apiClient';
import { Vehicle } from '../types';

export const trackingService = {
  async getLiveTelemetry(): Promise<{ vehicles: Vehicle[]; timestamp: string }> {
    return apiRequest<{ vehicles: Vehicle[]; timestamp: string }>('/tracking/live');
  },

  async simulateGpsTelemetry(payload: {
    eventId: string;
    vehicleId: string;
    latitude: number;
    longitude: number;
    speedKph: number;
    recordedAt: string;
    temperatureCelsius?: number | null;
  }) {
    return apiRequest('/webhooks/gps', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
