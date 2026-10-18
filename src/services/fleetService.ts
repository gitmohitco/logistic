import { apiRequest } from './apiClient';
import { Vehicle, HubCapacity } from '../types';

export const fleetService = {
  async getVehicles(): Promise<Vehicle[]> {
    return apiRequest<Vehicle[]>('/vehicles');
  },

  async getHubCapacities(): Promise<HubCapacity[]> {
    return apiRequest<HubCapacity[]>('/warehouses/capacity');
  },
};
