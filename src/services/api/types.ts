import { 
  Shipment, 
  ShipmentStatus 
} from '../../types';

export interface ShipmentsQueryFilter {
  status?: ShipmentStatus | 'ALL';
  carrierId?: string;
  customerId?: string;
  warehouseId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: keyof Shipment;
  sortDirection?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface BulkTrackRequest {
  shipmentIds: string[];
}

export interface AiChatRequest {
  query: string;
  shipmentId?: string;
  conversationId?: string;
}

export interface ResolveExceptionRequest {
  exceptionId: string;
  action: string;
  notes: string;
  suggestedEta?: string;
}

export interface ProposeEtaRequest {
  shipmentId: string;
  proposedEta: string;
  reason: string;
}

export interface WarehouseUpdateRequest {
  shipmentId: string;
  warehouseId: string;
  status: 'ARRIVED' | 'STAGED' | 'DEPARTED' | 'DELAYED';
  dockNumber?: string;
  notes?: string;
}

export interface SystemHealthStatus {
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  mendixServiceVersion: string;
  database: 'CONNECTED' | 'DISCONNECTED';
  aiOrchestrationLatencyMs: number;
  uptimeSeconds: number;
  activeSessions: number;
}
