import { 
  Shipment, 
  UserProfile, 
  DashboardSummary, 
  BulkTrackResponse, 
  AiChatResponse,
  ExceptionItem,
  TrackingEvent,
  ManagedUser,
  CarrierOrganization,
  Vehicle,
  HubCapacity
} from '../../types';
import { 
  ShipmentsQueryFilter, 
  PaginatedResponse, 
  BulkTrackRequest, 
  AiChatRequest,
  ResolveExceptionRequest,
  ProposeEtaRequest,
  WarehouseUpdateRequest,
  SystemHealthStatus 
} from './types';
import { mockAdapter } from './mockAdapter';

// Configuration from environment
const MENDIX_BASE_URL = import.meta.env.VITE_MENDIX_BASE_URL || '/api/v1';
const IS_EXPLICIT_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.DEV;

export class MendixApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'MendixApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Generic HTTP client for Mendix Published REST Services
 */
async function mendixFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  user?: UserProfile
): Promise<T> {
  const url = `${MENDIX_BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Inject authentication & security context headers
  if (user) {
    headers.set('X-User-Role', user.role);
    headers.set('X-User-Id', user.id);
    if (user.carrierId) headers.set('X-Carrier-Id', user.carrierId);
    if (user.customerId) headers.set('X-Customer-Id', user.customerId);
    if (user.warehouseId) headers.set('X-Warehouse-Id', user.warehouseId);
  }

  // Add timeout controller
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText };
      }

      const message =
        errorData.message ||
        `Mendix REST error: ${response.status} ${response.statusText}`;
      throw new MendixApiError(response.status, message, errorData);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new MendixApiError(408, 'Mendix request timed out after 12s');
    }
    if (err instanceof MendixApiError) {
      throw err;
    }
    throw new MendixApiError(503, err.message || 'Mendix Service Unavailable');
  }
}

/**
 * Centralized Mendix API Client with explicit Mock Adapter fallback
 */
export const mendixClient = {
  /**
   * GET /shipments
   */
  async getShipments(
    filter: ShipmentsQueryFilter = {},
    user: UserProfile
  ): Promise<PaginatedResponse<Shipment>> {
    if (IS_EXPLICIT_MOCK) {
      return mockAdapter.getShipments(filter, user);
    }

    const query = new URLSearchParams();
    if (filter.status && filter.status !== 'ALL') query.set('status', filter.status);
    if (filter.search) query.set('search', filter.search);
    if (filter.page) query.set('page', String(filter.page));
    if (filter.limit) query.set('limit', String(filter.limit));

    try {
      return await mendixFetch<PaginatedResponse<Shipment>>(
        `/shipments?${query.toString()}`,
        { method: 'GET' },
        user
      );
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('Mendix backend unreachable, using development mock adapter', err);
        return mockAdapter.getShipments(filter, user);
      }
      throw err;
    }
  },

  /**
   * GET /shipments/{id}
   */
  async getShipmentById(id: string, user: UserProfile): Promise<Shipment | null> {
    if (IS_EXPLICIT_MOCK) {
      return mockAdapter.getShipmentById(id, user);
    }

    try {
      return await mendixFetch<Shipment>(`/shipments/${id}`, { method: 'GET' }, user);
    } catch (err) {
      if (import.meta.env.DEV) {
        return mockAdapter.getShipmentById(id, user);
      }
      throw err;
    }
  },

  /**
   * GET /shipments/summary
   */
  async getSummary(user: UserProfile): Promise<DashboardSummary> {
    if (IS_EXPLICIT_MOCK) {
      return mockAdapter.getSummary(user);
    }

    try {
      return await mendixFetch<DashboardSummary>('/shipments/summary', { method: 'GET' }, user);
    } catch (err) {
      if (import.meta.env.DEV) {
        return mockAdapter.getSummary(user);
      }
      throw err;
    }
  },

  /**
   * POST /shipments/bulk-track
   */
  async bulkTrack(request: BulkTrackRequest, user: UserProfile): Promise<BulkTrackResponse> {
    if (IS_EXPLICIT_MOCK) {
      return mockAdapter.bulkTrack(request.shipmentIds, user);
    }

    try {
      return await mendixFetch<BulkTrackResponse>(
        '/shipments/bulk-track',
        {
          method: 'POST',
          body: JSON.stringify(request),
        },
        user
      );
    } catch (err) {
      if (import.meta.env.DEV) {
        return mockAdapter.bulkTrack(request.shipmentIds, user);
      }
      throw err;
    }
  },

  /**
   * GET /shipments/tracking-events
   */
  async getTrackingEvents(shipmentId?: string, user?: UserProfile): Promise<TrackingEvent[]> {
    if (IS_EXPLICIT_MOCK) {
      return mockAdapter.getTrackingEvents(shipmentId);
    }

    const query = shipmentId ? `?shipmentId=${shipmentId}` : '';
    try {
      return await mendixFetch<TrackingEvent[]>(
        `/shipments/tracking-events${query}`,
        { method: 'GET' },
        user
      );
    } catch (err) {
      if (import.meta.env.DEV) {
        return mockAdapter.getTrackingEvents(shipmentId);
      }
      throw err;
    }
  },

  /**
   * GET /shipments/exceptions
   */
  async getExceptions(user: UserProfile): Promise<ExceptionItem[]> {
    if (IS_EXPLICIT_MOCK) {
      return mockAdapter.getExceptions(user);
    }

    try {
      return await mendixFetch<ExceptionItem[]>('/shipments/exceptions', { method: 'GET' }, user);
    } catch (err) {
      if (import.meta.env.DEV) {
        return mockAdapter.getExceptions(user);
      }
      throw err;
    }
  },

  /**
   * POST /ai/chat
   */
  async aiChat(request: AiChatRequest, user: UserProfile): Promise<AiChatResponse> {
    if (IS_EXPLICIT_MOCK) {
      return mockAdapter.aiChat(request.query, user, request.shipmentId);
    }

    try {
      return await mendixFetch<AiChatResponse>(
        '/ai/chat',
        {
          method: 'POST',
          body: JSON.stringify(request),
        },
        user
      );
    } catch (err) {
      if (import.meta.env.DEV) {
        return mockAdapter.aiChat(request.query, user, request.shipmentId);
      }
      throw err;
    }
  },

  /**
   * Resolve Exception
   */
  async resolveException(
    request: ResolveExceptionRequest,
    user: UserProfile
  ): Promise<ExceptionItem> {
    if (IS_EXPLICIT_MOCK) {
      return mockAdapter.resolveException(
        request.exceptionId,
        request.action,
        request.notes,
        user
      );
    }

    return await mendixFetch<ExceptionItem>(
      `/shipments/exceptions/${request.exceptionId}/resolve`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      },
      user
    );
  },

  /**
   * Carrier Propose Revised ETA
   */
  async proposeEta(
    request: ProposeEtaRequest,
    user: UserProfile
  ): Promise<Shipment> {
    if (IS_EXPLICIT_MOCK) {
      return mockAdapter.proposeEta(request.shipmentId, request.proposedEta, request.reason);
    }

    return await mendixFetch<Shipment>(
      `/shipments/${request.shipmentId}/propose-eta`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      },
      user
    );
  },

  /**
   * Warehouse Status Update
   */
  async warehouseUpdate(
    request: WarehouseUpdateRequest,
    user: UserProfile
  ): Promise<Shipment> {
    if (IS_EXPLICIT_MOCK) {
      return mockAdapter.warehouseUpdate(
        request.shipmentId,
        request.status,
        request.notes || '',
        user
      );
    }

    return await mendixFetch<Shipment>(
      `/shipments/${request.shipmentId}/warehouse-update`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      },
      user
    );
  },

  /**
   * Administrator: Managed Users
   */
  async getManagedUsers(user: UserProfile): Promise<ManagedUser[]> {
    if (IS_EXPLICIT_MOCK) {
      return mockAdapter.getManagedUsers();
    }
    return await mendixFetch<ManagedUser[]>('/admin/users', { method: 'GET' }, user);
  },

  async updateManagedUser(
    userData: Partial<ManagedUser> & { id: string },
    user: UserProfile
  ): Promise<ManagedUser> {
    if (IS_EXPLICIT_MOCK) {
      return mockAdapter.updateManagedUser(userData);
    }
    return await mendixFetch<ManagedUser>(
      `/admin/users/${userData.id}`,
      {
        method: 'PUT',
        body: JSON.stringify(userData),
      },
      user
    );
  },

  /**
   * Carrier Organizations Management
   */
  async getCarriers(user?: UserProfile): Promise<CarrierOrganization[]> {
    if (IS_EXPLICIT_MOCK) {
      return mockAdapter.getCarriers();
    }
    return await mendixFetch<CarrierOrganization[]>('/admin/carriers', { method: 'GET' }, user);
  },

  async createCarrier(
    carrierData: Partial<CarrierOrganization>,
    user?: UserProfile
  ): Promise<CarrierOrganization> {
    if (IS_EXPLICIT_MOCK) {
      return mockAdapter.createCarrier(carrierData);
    }
    return await mendixFetch<CarrierOrganization>(
      '/admin/carriers',
      {
        method: 'POST',
        body: JSON.stringify(carrierData),
      },
      user
    );
  },

  /**
   * Operational Health & Connectors
   */
  async getSystemHealth(user: UserProfile): Promise<SystemHealthStatus> {
    if (IS_EXPLICIT_MOCK) {
      return mockAdapter.getSystemHealth();
    }
    return await mendixFetch<SystemHealthStatus>('/admin/health', { method: 'GET' }, user);
  },

  getVehicles(): Vehicle[] {
    return mockAdapter.getVehicles();
  },

  getHubs(): HubCapacity[] {
    return mockAdapter.getHubs();
  },
};
