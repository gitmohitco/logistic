import { 
  Shipment, 
  UserProfile, 
  BulkTrackResponse, 
  BulkTrackItemResult,
  AiChatResponse,
  DashboardSummary,
  ExceptionItem,
  TrackingEvent,
  ManagedUser,
  CarrierOrganization,
  Vehicle,
  HubCapacity
} from '../../types';
import { 
  MOCK_SHIPMENTS, 
  MOCK_TRACKING_EVENTS, 
  MOCK_EXCEPTIONS, 
  MOCK_MANAGED_USERS, 
  MOCK_CARRIERS,
  MOCK_HUBS, 
  MOCK_VEHICLES 
} from './mockData';
import { ShipmentsQueryFilter, PaginatedResponse, SystemHealthStatus } from './types';

// In-memory mutable state for the dev session
let shipmentsDb: Shipment[] = JSON.parse(JSON.stringify(MOCK_SHIPMENTS));
let exceptionsDb: ExceptionItem[] = JSON.parse(JSON.stringify(MOCK_EXCEPTIONS));
let trackingEventsDb: TrackingEvent[] = JSON.parse(JSON.stringify(MOCK_TRACKING_EVENTS));
let usersDb: ManagedUser[] = JSON.parse(JSON.stringify(MOCK_MANAGED_USERS));
let carriersDb: CarrierOrganization[] = JSON.parse(JSON.stringify(MOCK_CARRIERS));

/**
 * Filter shipments according to business role authorization
 */
function applyRoleIsolation(shipments: Shipment[], user: UserProfile): Shipment[] {
  let filtered = [...shipments];

  if (user.role === 'CARRIER' && user.carrierId) {
    filtered = filtered.filter((s) => s.carrierId === user.carrierId);
  } else if (user.role === 'CUSTOMER' && user.customerId) {
    filtered = filtered.filter((s) => s.customerId === user.customerId);
  } else if (user.role === 'WAREHOUSE_SUPERVISOR' && user.warehouseId) {
    filtered = filtered.filter(
      (s) => s.originHubId === user.warehouseId || s.destinationHubId === user.warehouseId
    );
  }

  // Security Rule: Strip internal notes and carrier credentials for Customer role
  if (user.role === 'CUSTOMER') {
    filtered = filtered.map((s) => {
      const sanitized = { ...s };
      delete sanitized.internalNotes;
      return sanitized;
    });
  }

  return filtered;
}

export const mockAdapter = {
  async getShipments(
    filter: ShipmentsQueryFilter = {},
    user: UserProfile
  ): Promise<PaginatedResponse<Shipment>> {
    await new Promise((r) => setTimeout(r, 120)); // Small realistic latency

    let list = applyRoleIsolation(shipmentsDb, user);

    if (filter.status && filter.status !== 'ALL') {
      list = list.filter((s) => s.status === filter.status);
    }

    if (filter.search) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.trackingId.toLowerCase().includes(q) ||
          s.carrierName.toLowerCase().includes(q) ||
          s.originHubName.toLowerCase().includes(q) ||
          s.destinationHubName.toLowerCase().includes(q) ||
          s.cargoType.toLowerCase().includes(q) ||
          (s.vehicleCode && s.vehicleCode.toLowerCase().includes(q))
      );
    }

    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const total = list.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = list.slice((page - 1) * limit, page * limit);

    return {
      data: paginated,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  },

  async getShipmentById(id: string, user: UserProfile): Promise<Shipment | null> {
    await new Promise((r) => setTimeout(r, 100));

    const shipment = shipmentsDb.find((s) => s.id === id || s.trackingId.toUpperCase() === id.toUpperCase());
    if (!shipment) return null;

    // Check authorization
    if (user.role === 'CARRIER' && user.carrierId && shipment.carrierId !== user.carrierId) {
      throw new Error('403 Forbidden: You are not authorized to view this carrier shipment');
    }
    if (user.role === 'CUSTOMER' && user.customerId && shipment.customerId !== user.customerId) {
      throw new Error('403 Forbidden: You are not authorized to view this customer shipment');
    }

    const result = { ...shipment };
    result.trackingEvents = trackingEventsDb.filter((e) => e.shipmentId === shipment.id || e.trackingId === shipment.trackingId);

    // Strip internal notes for Customer
    if (user.role === 'CUSTOMER') {
      delete result.internalNotes;
    }

    return result;
  },

  async getSummary(user: UserProfile): Promise<DashboardSummary> {
    await new Promise((r) => setTimeout(r, 150));

    const list = applyRoleIsolation(shipmentsDb, user);
    const total = list.length;
    const inTransit = list.filter((s) => s.status === 'ON_ROUTE').length;
    const delivered = list.filter((s) => s.status === 'DELIVERED').length;
    const delayed = list.filter((s) => s.status === 'DELAYED').length;
    const slaAtRisk = list.filter((s) => s.isSlaAtRisk || s.delayMinutes > 60).length;

    const statusDistribution: Record<string, number> = {
      ON_ROUTE: inTransit,
      DELIVERED: delivered,
      DELAYED: delayed,
      LOADING: list.filter((s) => s.status === 'LOADING').length,
    };

    return {
      kpi: {
        totalShipments: {
          value: total,
          prevMonth: Math.max(1, total - 2),
          percentChange: 8.5,
          trend: [total - 4, total - 3, total - 1, total],
          isPositiveGood: true,
        },
        activeDeliveries: {
          value: inTransit,
          prevMonth: Math.max(1, inTransit - 1),
          percentChange: 12.0,
          trend: [inTransit - 2, inTransit - 1, inTransit, inTransit],
          isPositiveGood: true,
        },
        deliveredShipments: {
          value: delivered,
          prevMonth: Math.max(1, delivered - 1),
          percentChange: 5.2,
          trend: [1, 2, 2, delivered],
          isPositiveGood: true,
        },
        delayedShipments: {
          value: delayed,
          prevMonth: delayed + 1,
          percentChange: -15.4,
          trend: [delayed + 2, delayed + 1, delayed + 1, delayed],
          isPositiveGood: false,
        },
        slaAtRiskShipments: {
          value: slaAtRisk,
          prevMonth: slaAtRisk + 1,
          percentChange: -20.0,
          trend: [slaAtRisk + 2, slaAtRisk + 1, slaAtRisk, slaAtRisk],
          isPositiveGood: false,
        },
        fleetUtilization: {
          value: 86.4,
          prevMonth: 82.1,
          percentChange: 5.2,
          trend: [80, 82, 85, 86.4],
          isPositiveGood: true,
        },
        onTimeDelivery: {
          value: total > 0 ? Number((((total - delayed) / total) * 100).toFixed(1)) : 94.2,
          prevMonth: 91.0,
          percentChange: 3.5,
          trend: [90, 92, 93, 94.2],
          isPositiveGood: true,
        },
      },
      statusDistribution,
      lastUpdated: new Date().toLocaleTimeString(),
      mode: 'DEMO',
    };
  },

  async bulkTrack(shipmentIds: string[], user: UserProfile): Promise<BulkTrackResponse> {
    await new Promise((r) => setTimeout(r, 350));

    const results: BulkTrackItemResult[] = [];
    let successfulCount = 0;
    let failedCount = 0;
    let unauthorizedCount = 0;
    let notFoundCount = 0;

    for (const queryId of shipmentIds) {
      const cleanId = queryId.trim();

      // Check malformed
      if (!cleanId || cleanId.length < 4 || !/^[\w-]+$/.test(cleanId)) {
        failedCount++;
        results.push({
          queryId: cleanId,
          outcome: 'MALFORMED',
          errorMessage: 'ID format invalid: must be 4+ alphanumeric characters or dashes',
          canRetry: false,
        });
        continue;
      }

      // Lookup in database
      const match = shipmentsDb.find(
        (s) => s.trackingId.toUpperCase() === cleanId.toUpperCase() || s.id.toUpperCase() === cleanId.toUpperCase()
      );

      if (!match) {
        notFoundCount++;
        results.push({
          queryId: cleanId,
          outcome: 'NOT_FOUND',
          errorMessage: 'Shipment record not located in Mendix Master Index',
          canRetry: true,
        });
        continue;
      }

      // Check role authorization
      if (user.role === 'CARRIER' && user.carrierId && match.carrierId !== user.carrierId) {
        unauthorizedCount++;
        results.push({
          queryId: cleanId,
          outcome: 'UNAUTHORIZED',
          errorMessage: 'Restricted: Record belongs to another carrier organization',
          canRetry: false,
        });
        continue;
      }

      if (user.role === 'CUSTOMER' && user.customerId && match.customerId !== user.customerId) {
        unauthorizedCount++;
        results.push({
          queryId: cleanId,
          outcome: 'UNAUTHORIZED',
          errorMessage: 'Restricted: Record belongs to another customer account',
          canRetry: false,
        });
        continue;
      }

      successfulCount++;
      results.push({
        queryId: cleanId,
        shipmentId: match.id,
        trackingId: match.trackingId,
        carrierName: match.carrierName,
        originHubName: match.originHubName,
        destinationHubName: match.destinationHubName,
        status: match.status,
        estimatedArrival: match.estimatedArrival,
        delayMinutes: match.delayMinutes,
        outcome: 'SUCCESS',
      });
    }

    return {
      jobId: `JOB-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      totalSubmitted: shipmentIds.length,
      successfulCount,
      failedCount,
      unauthorizedCount,
      notFoundCount,
      results,
      processedAt: new Date().toISOString(),
    };
  },

  async getTrackingEvents(shipmentId?: string): Promise<TrackingEvent[]> {
    await new Promise((r) => setTimeout(r, 80));
    if (shipmentId) {
      return trackingEventsDb.filter((e) => e.shipmentId === shipmentId || e.trackingId === shipmentId);
    }
    return trackingEventsDb;
  },

  async getExceptions(user: UserProfile): Promise<ExceptionItem[]> {
    await new Promise((r) => setTimeout(r, 100));
    let list = [...exceptionsDb];

    if (user.role === 'CARRIER' && user.carrierId) {
      list = list.filter((e) => e.carrierId === user.carrierId);
    } else if (user.role === 'CUSTOMER') {
      // Customers do not see operational exceptions war room
      return [];
    }

    return list;
  },

  async resolveException(
    exceptionId: string,
    action: string,
    notes: string,
    user: UserProfile
  ): Promise<ExceptionItem> {
    await new Promise((r) => setTimeout(r, 200));

    const exc = exceptionsDb.find((e) => e.id === exceptionId);
    if (!exc) throw new Error('Exception not found');

    exc.status = 'RESOLVED';
    exc.resolvedAt = new Date().toISOString();
    exc.resolvedBy = `${user.name} (${user.role})`;
    exc.resolutionNotes = `[${action}] ${notes}`;

    // Also update corresponding shipment
    const shp = shipmentsDb.find((s) => s.id === exc.shipmentId);
    if (shp && shp.status === 'DELAYED' && action === 'REROUTE') {
      shp.status = 'ON_ROUTE';
      shp.delayMinutes = Math.max(15, shp.delayMinutes - 60);
    }

    return exc;
  },

  async proposeEta(
    shipmentId: string,
    proposedEta: string,
    reason: string
  ): Promise<Shipment> {
    await new Promise((r) => setTimeout(r, 200));

    const shp = shipmentsDb.find((s) => s.id === shipmentId);
    if (!shp) throw new Error('Shipment not found');

    shp.estimatedArrival = proposedEta;
    shp.updatedAt = new Date().toISOString();

    // Append tracking event
    const newEvent: TrackingEvent = {
      id: `evt-${Date.now()}`,
      shipmentId: shp.id,
      trackingId: shp.trackingId,
      eventType: 'DELAY_REPORTED',
      title: 'Carrier Revised ETA Proposed',
      description: `New ETA ${new Date(proposedEta).toLocaleString()}. Reason: ${reason}`,
      location: shp.originHubName,
      timestamp: new Date().toISOString(),
      recordedBy: shp.carrierName,
      statusAfterEvent: shp.status,
      isMilestone: true,
    };
    trackingEventsDb.unshift(newEvent);

    return shp;
  },

  async warehouseUpdate(
    shipmentId: string,
    status: 'ARRIVED' | 'STAGED' | 'DEPARTED' | 'DELAYED',
    notes: string,
    user: UserProfile
  ): Promise<Shipment> {
    await new Promise((r) => setTimeout(r, 150));

    const shp = shipmentsDb.find((s) => s.id === shipmentId);
    if (!shp) throw new Error('Shipment not found');

    if (status === 'DEPARTED') shp.status = 'ON_ROUTE';
    if (status === 'ARRIVED') shp.status = 'DELIVERED';
    if (status === 'DELAYED') shp.status = 'DELAYED';

    const newEvent: TrackingEvent = {
      id: `evt-${Date.now()}`,
      shipmentId: shp.id,
      trackingId: shp.trackingId,
      eventType: status === 'ARRIVED' ? 'DELIVERED' : 'CHECKPOINT',
      title: `Warehouse Staging Update: ${status}`,
      description: notes || `Updated by ${user.name} at ${user.warehouseName || 'Warehouse Hub'}`,
      location: user.warehouseName || shp.destinationHubName,
      timestamp: new Date().toISOString(),
      recordedBy: user.name,
      statusAfterEvent: shp.status,
      isMilestone: true,
    };
    trackingEventsDb.unshift(newEvent);

    return shp;
  },

  async aiChat(
    query: string,
    _user: UserProfile,
    _shipmentId?: string
  ): Promise<AiChatResponse> {
    await new Promise((r) => setTimeout(r, 400)); // Natural AI thinking pause

    const q = query.toLowerCase();
    let replyText = '';
    const knowledgeSources = [
      {
        documentTitle: 'Mendix Logistics SOP - Cold Chain Protocol Rev 4.2',
        section: 'Excursion Containment & Secondary Hub Staging',
        snippet: 'Temperature excursions exceeding 30 minutes at >6°C mandate secondary lab evaluation and immediate dry-ice replenishment.',
      },
      {
        documentTitle: 'SLA Master Service Agreement (Tier-1 Carriers)',
        section: 'Section 8: Liquidated Damages & On-Time Performance Thresholds',
        snippet: 'Delays exceeding 120 minutes without 2-hour advance carrier telemetry notification trigger automatic SLA penalty review.',
      },
    ];

    const relatedShipments: Array<{ shipmentId: string; trackingId: string; details: string }> = [];

    if (q.includes('sla') || q.includes('risk') || q.includes('miss')) {
      replyText = `Based on Mendix AI evaluation of active telematics and scheduled delivery windows:\n\n` +
        `• **TRK-US-89216** (BioMedics Vaccines) is currently **210 minutes delayed** due to a refrigeration compressor deviation in Indiana. Its SLA deadline is 19:00 UTC, which is currently breached.\n` +
        `• **TRK-US-89218** (Industrial Robotics) is **95 minutes delayed** on I-80 due to multi-lane highway congestion. A recommended reroute via Route 20 bypass will recover approximately 52 minutes.\n\n` +
        `Operational Recommendation: Approve the Route 20 bypass recommendation in the Exception War Room and request dry-ice inspection for TRK-US-89216.`;

      relatedShipments.push(
        { shipmentId: 'shp-003', trackingId: 'TRK-US-89216', details: 'SLA Breached (210m delay, Cold-Chain alert)' },
        { shipmentId: 'shp-005', trackingId: 'TRK-US-89218', details: 'SLA At Risk (95m delay, I-80 congestion)' }
      );
    } else if (q.includes('delayed') || q.includes('why') || q.includes('explain')) {
      replyText = `Shipment **TRK-US-89216** was classified as delayed due to an automated IoT sensor alert at 10:15 UTC. Telematics recorded an internal reefing cargo temperature rise to +8.4°C against the +4.0°C contractual limit.\n\nThe vehicle pulled into Fort Wayne Service Plaza for mechanical inspection. A Mendix AI War Room dossier has been opened with correlation ID CORR-MENDIX-9921.`;
      relatedShipments.push({ shipmentId: 'shp-003', trackingId: 'TRK-US-89216', details: 'Temp excursion: +8.4°C' });
    } else if (q.includes('event') || q.includes('latest') || q.includes('summarize')) {
      replyText = `Summary of latest network tracking activity:\n\n` +
        `1. **TRK-US-89215** (SwiftLine Air Express): Customs expedited clearance completed at Newark Liberty Cargo Complex.\n` +
        `2. **TRK-US-89214** (Apex Intermodal): Passed South Bend weigh station at 88 km/h. Seal intact.\n` +
        `3. **TRK-US-89217** (Apex Intermodal): Proof of delivery electronically signed at Dallas Hub Dock 12.\n\n` +
        `All telemetry streams are streaming via Mendix IoT Connector.`;
      relatedShipments.push(
        { shipmentId: 'shp-002', trackingId: 'TRK-US-89215', details: 'Customs cleared at EWR' },
        { shipmentId: 'shp-001', trackingId: 'TRK-US-89214', details: 'In-transit, 88 km/h' }
      );
    } else {
      replyText = `Mendix AI Assistant has processed your query: "${query}".\n\n` +
        `Across the authorized control tower network, **6 shipments** are active, **2 exceptions** are open, and on-time performance is currently **94.2%**.\n\n` +
        `To inspect specific issues, ask about "delayed shipments", "SLA risk breaches", or specific tracking IDs like "TRK-US-89214".`;
    }

    return {
      messageId: `msg-${Date.now()}`,
      replyText,
      modelUsed: 'Mendix Orchestrated LLM (Enterprise RAG)',
      timestamp: new Date().toISOString(),
      knowledgeSources,
      relatedShipments,
    };
  },

  async getManagedUsers(): Promise<ManagedUser[]> {
    await new Promise((r) => setTimeout(r, 100));
    return usersDb;
  },

  async updateManagedUser(user: Partial<ManagedUser> & { id: string }): Promise<ManagedUser> {
    await new Promise((r) => setTimeout(r, 150));
    const idx = usersDb.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      usersDb[idx] = { ...usersDb[idx], ...user };
      return usersDb[idx];
    }
    const newUser: ManagedUser = {
      id: user.id || `usr-${Date.now()}`,
      name: user.name || 'New User',
      email: user.email || 'user@controltower.com',
      role: user.role || 'CONTROL_TOWER_ANALYST',
      carrierId: user.carrierId,
      carrierName: user.carrierName,
      status: user.status || 'ACTIVE',
      lastActive: 'Just now',
      createdAt: new Date().toISOString(),
    };
    usersDb.push(newUser);
    return newUser;
  },

  async getSystemHealth(): Promise<SystemHealthStatus> {
    await new Promise((r) => setTimeout(r, 60));
    return {
      status: 'HEALTHY',
      mendixServiceVersion: 'v10.12.1-prod',
      database: 'CONNECTED',
      aiOrchestrationLatencyMs: 312,
      uptimeSeconds: 849200,
      activeSessions: 14,
    };
  },

  async getCarriers(): Promise<CarrierOrganization[]> {
    await new Promise((r) => setTimeout(r, 80));
    return carriersDb;
  },

  async createCarrier(carrier: Partial<CarrierOrganization>): Promise<CarrierOrganization> {
    await new Promise((r) => setTimeout(r, 120));
    const nextNum = carriersDb.length + 1;
    const nextCode = carrier.carrierCode || `CAR-${String(nextNum).padStart(3, '0')}`;
    const newCarrier: CarrierOrganization = {
      id: carrier.id || `car-org-${Date.now()}`,
      carrierCode: nextCode,
      name: carrier.name || 'New Carrier Partner',
      contactEmail: carrier.contactEmail || 'operations@carrier.com',
      contactPhone: carrier.contactPhone || '+1-800-555-0100',
      transportModes: carrier.transportModes && carrier.transportModes.length > 0 ? carrier.transportModes : ['GROUND'],
      slaTier: carrier.slaTier || 'TIER_2_PREFERRED',
      status: carrier.status || 'ACTIVE',
      activeShipmentsCount: 0,
      fleetCount: carrier.fleetCount || 5,
      primaryHub: carrier.primaryHub || 'Chicago Central Logistics Hub',
      createdAt: new Date().toISOString(),
    };
    carriersDb.unshift(newCarrier);
    return newCarrier;
  },

  getVehicles(): Vehicle[] {
    return MOCK_VEHICLES;
  },

  getHubs(): HubCapacity[] {
    return MOCK_HUBS;
  },
};

