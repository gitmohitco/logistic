import { pool, query } from './pool.js';
import { 
  initialCarriers, 
  initialHubs, 
  initialVehicles, 
  initialShipments, 
  initialExceptions 
} from './seedData.js';
import { 
  HubCapacityRecord, 
  VehicleRecord, 
  ShipmentRecord, 
  ExceptionRecord,
  GpsEventRecord 
} from '../types/index.js';
import { logger } from '../utils/logger.js';

export class DbProvider {
  // In-memory collections (cloned from seedData)
  private carriers = [...initialCarriers];
  private hubs: HubCapacityRecord[] = JSON.parse(JSON.stringify(initialHubs));
  private vehicles: VehicleRecord[] = JSON.parse(JSON.stringify(initialVehicles));
  private shipments: ShipmentRecord[] = JSON.parse(JSON.stringify(initialShipments));
  private exceptions: ExceptionRecord[] = JSON.parse(JSON.stringify(initialExceptions));
  private gpsEvents: GpsEventRecord[] = [];
  private exceptionHistory: any[] = [];
  private scorecards: any[] = [];

  getCarriers() {
    return this.carriers;
  }

  getScorecards() {
    return this.scorecards;
  }

  // Reset to initial fixtures (used by tests)
  reset() {
    this.hubs = JSON.parse(JSON.stringify(initialHubs));
    this.vehicles = JSON.parse(JSON.stringify(initialVehicles));
    this.shipments = JSON.parse(JSON.stringify(initialShipments));
    this.exceptions = JSON.parse(JSON.stringify(initialExceptions));
    this.gpsEvents = [];
    this.exceptionHistory = [];
  }

  // --- SUMMARY / KPI METRICS ---
  async getSummary() {
    if (pool) {
      try {
        const totalShipmentsRes = await query('SELECT COUNT(*) FROM shipments');
        const activeRes = await query("SELECT COUNT(*) FROM shipments WHERE status IN ('ON_ROUTE', 'LOADING')");
        const onTimeRes = await query("SELECT COUNT(*) FROM shipments WHERE delay_minutes = 0");
        const totalCount = parseInt(totalShipmentsRes.rows[0].count, 10) || 0;
        const activeCount = parseInt(activeRes.rows[0].count, 10) || 0;
        const onTimeCount = parseInt(onTimeRes.rows[0].count, 10) || 0;
        const onTimePct = totalCount > 0 ? Math.round((onTimeCount / totalCount) * 100) : 94;

        return {
          kpi: {
            totalShipments: {
              value: totalCount,
              prevMonth: Math.max(1, Math.round(totalCount * 0.9)),
              percentChange: 11.2,
              trend: [320, 340, 360, 390, 420, totalCount],
              isPositiveGood: true,
            },
            activeDeliveries: {
              value: activeCount,
              prevMonth: Math.max(1, Math.round(activeCount * 0.95)),
              percentChange: 5.3,
              trend: [80, 85, 90, 88, 92, activeCount],
              isPositiveGood: true,
            },
            fleetUtilization: {
              value: 86.4,
              prevMonth: 82.0,
              percentChange: 4.4,
              trend: [78, 80, 82, 85, 84, 86.4],
              isPositiveGood: true,
            },
            onTimeDelivery: {
              value: onTimePct,
              prevMonth: 91.5,
              percentChange: 3.2,
              trend: [89, 90, 91, 93, 92, onTimePct],
              isPositiveGood: true,
            },
          },
          lastUpdated: new Date().toISOString(),
          mode: 'LIVE' as const,
        };
      } catch (err: any) {
        logger.warn('Error querying summary from Neon, falling back to memory repository', { error: err.message });
      }
    }

    // In-memory computation
    const totalCount = this.shipments.length;
    const activeCount = this.shipments.filter((s) => s.status === 'ON_ROUTE' || s.status === 'LOADING').length;
    const onTimeCount = this.shipments.filter((s) => s.delay_minutes === 0).length;
    const onTimePct = totalCount > 0 ? Math.round((onTimeCount / totalCount) * 100) : 94;

    return {
      kpi: {
        totalShipments: {
          value: totalCount,
          prevMonth: Math.max(1, Math.round(totalCount * 0.9)),
          percentChange: 11.2,
          trend: [320, 340, 360, 390, 420, totalCount],
          isPositiveGood: true,
        },
        activeDeliveries: {
          value: activeCount,
          prevMonth: Math.max(1, Math.round(activeCount * 0.95)),
          percentChange: 5.3,
          trend: [80, 85, 90, 88, 92, activeCount],
          isPositiveGood: true,
        },
        fleetUtilization: {
          value: 86.4,
          prevMonth: 82.0,
          percentChange: 4.4,
          trend: [78, 80, 82, 85, 84, 86.4],
          isPositiveGood: true,
        },
        onTimeDelivery: {
          value: onTimePct,
          prevMonth: 91.5,
          percentChange: 3.2,
          trend: [89, 90, 91, 93, 92, onTimePct],
          isPositiveGood: true,
        },
      },
      lastUpdated: new Date().toISOString(),
      mode: 'DEMO' as const,
    };
  }

  // --- SHIPMENTS ---
  async getShipments(params?: { status?: string; carrierId?: string; search?: string }): Promise<ShipmentRecord[]> {
    if (pool) {
      try {
        let sql = 'SELECT * FROM shipments WHERE 1=1';
        const queryParams: any[] = [];
        if (params?.status && params.status !== 'ALL') {
          queryParams.push(params.status);
          sql += ` AND status = $${queryParams.length}`;
        }
        if (params?.carrierId) {
          queryParams.push(params.carrierId);
          sql += ` AND carrier_id = $${queryParams.length}`;
        }
        const res = await query(sql, queryParams);
        return res.rows;
      } catch (err: any) {
        logger.warn('Error querying shipments from Neon pool, falling back to memory repository', { error: err.message });
      }
    }

    let list = [...this.shipments];
    if (params?.status && params.status !== 'ALL') {
      list = list.filter((s) => s.status === params.status);
    }
    if (params?.carrierId) {
      list = list.filter((s) => s.carrier_id === params.carrierId);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (s) =>
          s.tracking_id.toLowerCase().includes(q) ||
          (s.origin_hub_name && s.origin_hub_name.toLowerCase().includes(q)) ||
          (s.destination_hub_name && s.destination_hub_name.toLowerCase().includes(q)) ||
          (s.vehicle_code && s.vehicle_code.toLowerCase().includes(q))
      );
    }
    return list;
  }

  async getShipmentById(id: string): Promise<ShipmentRecord | null> {
    const found = this.shipments.find((s) => s.id === id || s.tracking_id === id);
    return found || null;
  }

  // --- VEHICLES ---
  async getVehicles(): Promise<VehicleRecord[]> {
    if (pool) {
      try {
        const res = await query('SELECT * FROM vehicles ORDER BY vehicle_code ASC');
        return res.rows;
      } catch (err: any) {
        logger.warn('Error querying vehicles from Neon, falling back to memory', { error: err.message });
      }
    }
    return [...this.vehicles];
  }

  async getVehicleById(id: string): Promise<VehicleRecord | null> {
    const found = this.vehicles.find((v) => v.id === id || v.vehicle_code === id);
    return found || null;
  }

  // --- WAREHOUSE HUBS ---
  async getHubCapacities(): Promise<HubCapacityRecord[]> {
    if (pool) {
      try {
        const res = await query('SELECT * FROM hub_capacities ORDER BY hub_code ASC');
        return res.rows;
      } catch (err: any) {
        logger.warn('Error querying hub capacities from Neon, falling back to memory', { error: err.message });
      }
    }
    return [...this.hubs];
  }

  // --- EXCEPTIONS ---
  async getExceptions(): Promise<ExceptionRecord[]> {
    if (this.exceptions.length > 0) {
      return [...this.exceptions];
    }
    if (pool) {
      try {
        const res = await query('SELECT * FROM exceptions ORDER BY detected_at DESC');
        if (res.rows.length > 0) return res.rows;
      } catch (err: any) {
        logger.warn('Error querying exceptions from Neon, falling back to memory', { error: err.message });
      }
    }
    return [...this.exceptions];
  }

  async getExceptionById(id: string): Promise<ExceptionRecord | null> {
    const found = this.exceptions.find((e) => e.id === id || e.correlation_id === id);
    return found || null;
  }

  async createException(data: Omit<ExceptionRecord, 'id' | 'created_at' | 'updated_at'>): Promise<ExceptionRecord> {
    const newRecord: ExceptionRecord = {
      ...data,
      id: `exc-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.exceptions.unshift(newRecord);

    // Also link back to shipment
    const shp = this.shipments.find((s) => s.id === data.shipment_id || s.tracking_id === data.tracking_id);
    if (shp) {
      shp.active_exception_id = newRecord.id;
      shp.exception_severity = newRecord.severity;
      if (newRecord.severity === 'HIGH' || newRecord.severity === 'MEDIUM') {
        shp.status = 'DELAYED';
      }
    }

    return newRecord;
  }

  async resolveException(
    id: string,
    actionTaken: string,
    notes: string,
    actorId = 'analyst-001',
    actorRole = 'ANALYST'
  ): Promise<ExceptionRecord | null> {
    const exc = this.exceptions.find((e) => e.id === id);
    if (!exc) return null;

    const previousStatus = exc.status;
    exc.status = 'RESOLVED';
    exc.resolved_at = new Date().toISOString();
    exc.resolution_notes = notes;
    exc.resolved_by = actorId;
    exc.updated_at = new Date().toISOString();

    // Audit transition
    this.exceptionHistory.push({
      id: `hist-${Date.now()}`,
      exception_id: exc.id,
      actor_id: actorId,
      actor_role: actorRole,
      previous_status: previousStatus,
      new_status: 'RESOLVED',
      action_taken: actionTaken,
      notes,
      created_at: new Date().toISOString(),
    });

    // If shipment was delayed, reset active exception
    const shp = this.shipments.find((s) => s.id === exc.shipment_id);
    if (shp && shp.active_exception_id === exc.id) {
      shp.active_exception_id = undefined;
      shp.exception_severity = undefined;
      // If action is REROUTE, update ETA
      if (actionTaken === 'REROUTE' && exc.suggested_eta) {
        shp.estimated_arrival = exc.suggested_eta;
      }
    }

    return exc;
  }

  // --- GPS EVENT INGESTION & OUT-OF-ORDER CONFLICT RESOLUTION ---
  async saveGpsEvent(event: {
    eventId: string;
    vehicleId: string;
    shipmentId?: string;
    latitude: number;
    longitude: number;
    speedKph: number;
    recordedAt: string;
    temperatureCelsius?: number | null;
    source?: string;
  }): Promise<{ isDuplicate: boolean; isStale: boolean; vehicle: VehicleRecord | null }> {
    // 1. Idempotency Check
    const exists = this.gpsEvents.find((e) => e.event_id === event.eventId);
    if (exists) {
      logger.info('Duplicate GPS event detected, safely ignoring', { eventId: event.eventId });
      return { isDuplicate: true, isStale: false, vehicle: null };
    }

    // 2. Persist event
    const record: GpsEventRecord = {
      id: `gps-${Date.now()}`,
      event_id: event.eventId,
      vehicle_id: event.vehicleId,
      shipment_id: event.shipmentId,
      latitude: event.latitude,
      longitude: event.longitude,
      speed_kph: event.speedKph,
      temperature_celsius: event.temperatureCelsius,
      source: event.source || 'gps',
      recorded_at: event.recordedAt,
      processed_at: new Date().toISOString(),
    };
    this.gpsEvents.push(record);
    // Sliding window cap to prevent in-memory heap exhaustion during sustained 24/7 simulation
    if (this.gpsEvents.length > 5000) {
      this.gpsEvents.splice(0, this.gpsEvents.length - 5000);
    }

    // 3. Find associated vehicle
    const vehicle = this.vehicles.find((v) => v.id === event.vehicleId || v.vehicle_code === event.vehicleId);
    if (!vehicle) {
      return { isDuplicate: false, isStale: false, vehicle: null };
    }

    // 4. Out-of-order check (Never let older GPS timestamp overwrite newer current location!)
    const currentLocTime = new Date(vehicle.last_location_at).getTime();
    const eventTime = new Date(event.recordedAt).getTime();
    if (eventTime < currentLocTime) {
      logger.warn('Out-of-order GPS telemetry event received; recorded timestamp is older than current location. Preserving latest location.', {
        vehicleCode: vehicle.vehicle_code,
        currentLocTime: vehicle.last_location_at,
        eventTime: event.recordedAt,
      });
      return { isDuplicate: false, isStale: true, vehicle };
    }

    // Update vehicle telematics
    vehicle.current_latitude = event.latitude;
    vehicle.current_longitude = event.longitude;
    vehicle.current_speed_kph = event.speedKph;
    vehicle.last_location_at = event.recordedAt;
    vehicle.updated_at = new Date().toISOString();

    // Also update current coords and speed on shipment if linked
    const shp = this.shipments.find((s) => s.vehicle_id === vehicle.id || s.vehicle_code === vehicle.vehicle_code);
    if (shp) {
      shp.current_latitude = event.latitude;
      shp.current_longitude = event.longitude;
      shp.current_speed_kph = event.speedKph;
      shp.temperature_celsius = event.temperatureCelsius ?? shp.temperature_celsius;
    }

    return { isDuplicate: false, isStale: false, vehicle };
  }

  // --- CARRIER ETA PROPOSAL & CONFIRMATION ---
  async proposeRevisedEta(shipmentId: string, proposedEta: string, reason: string): Promise<ShipmentRecord | null> {
    const shp = this.shipments.find((s) => s.id === shipmentId || s.tracking_id === shipmentId);
    if (!shp) return null;

    shp.estimated_arrival = proposedEta;
    shp.updated_at = new Date().toISOString();

    logger.info('Carrier proposed revised ETA registered', {
      trackingId: shp.tracking_id,
      proposedEta,
      reason,
    });

    return shp;
  }

  async confirmEta(shipmentId: string, confirmed: boolean): Promise<ShipmentRecord | null> {
    const shp = this.shipments.find((s) => s.id === shipmentId || s.tracking_id === shipmentId);
    if (!shp) return null;

    if (confirmed) {
      shp.status = 'ON_ROUTE';
      shp.delay_minutes = Math.max(0, shp.delay_minutes - 15);
    }
    shp.updated_at = new Date().toISOString();
    return shp;
  }
}

export const db = new DbProvider();
