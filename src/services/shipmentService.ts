import { apiRequest } from './apiClient';
import { Shipment, DashboardSummary } from '../types';

export const shipmentService = {
  async getSummary(): Promise<DashboardSummary> {
    return apiRequest<DashboardSummary>('/dashboard/summary');
  },

  async getAllShipments(params?: { status?: string; carrierId?: string; search?: string }): Promise<Shipment[]> {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') query.set('status', params.status);
    if (params?.carrierId) query.set('carrierId', params.carrierId);
    if (params?.search) query.set('search', params.search);

    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiRequest<Shipment[]>(`/shipments${qs}`);
  },

  async getShipmentById(id: string): Promise<Shipment> {
    return apiRequest<Shipment>(`/shipments/${id}`);
  },

  async proposeRevisedEta(shipmentId: string, proposedEta: string, reason: string): Promise<{ success: boolean; message: string }> {
    return apiRequest<{ success: boolean; message: string }>('/carrier/confirm-eta', {
      method: 'POST',
      body: JSON.stringify({
        shipmentId,
        proposedEta,
        reason,
        action: 'PROPOSE',
      }),
    });
  },

  async confirmEta(shipmentId: string, confirmed: boolean): Promise<{ success: boolean; message: string }> {
    return apiRequest<{ success: boolean; message: string }>('/carrier/confirm-eta', {
      method: 'POST',
      body: JSON.stringify({
        shipmentId,
        action: confirmed ? 'CONFIRM' : 'REJECT',
      }),
    });
  },
};
