export type TransportMode = 'AIR' | 'GROUND' | 'SEA';
export type VehicleStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
export type ShipmentStatus = 'LOADING' | 'ON_ROUTE' | 'DELAYED' | 'DELIVERED';
export type ExceptionSeverity = 'LOW' | 'MEDIUM' | 'HIGH';
export type ExceptionStatus = 'OPEN' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED';
export type UserRole = 'ANALYST' | 'OPS_MANAGER' | 'ADMIN' | 'CARRIER';

export interface UserContext {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  carrierId?: string;
}

export interface HubCapacityRecord {
  id: string;
  hub_code: string;
  hub_name: string;
  total_capacity: number;
  occupied_capacity: number;
  capacity_unit: string;
  latitude: number;
  longitude: number;
  status: string;
  updated_at: string;
}

export interface VehicleRecord {
  id: string;
  carrier_id?: string;
  vehicle_code: string;
  transport_mode: TransportMode;
  status: VehicleStatus;
  current_latitude: number;
  current_longitude: number;
  current_speed_kph: number;
  heading_deg: number;
  last_location_at: string;
  created_at: string;
  updated_at: string;
  assigned_shipment_id?: string;
  assigned_tracking_id?: string;
  driver_name?: string;
  driver_phone?: string;
}

export interface ShipmentRecord {
  id: string;
  tracking_id: string;
  carrier_id: string;
  carrier_name?: string;
  origin_hub_id: string;
  origin_hub_name?: string;
  origin_lat?: number;
  origin_lng?: number;
  destination_hub_id: string;
  destination_hub_name?: string;
  destination_lat?: number;
  destination_lng?: number;
  vehicle_id?: string;
  vehicle_code?: string;
  driver_id?: string;
  driver_name?: string;
  driver_phone?: string;
  status: ShipmentStatus;
  estimated_arrival: string;
  original_eta: string;
  actual_arrival?: string;
  cargo_type: string;
  weight_kg: number;
  delay_minutes: number;
  route_coordinates?: [number, number][];
  current_latitude?: number;
  current_longitude?: number;
  current_speed_kph?: number;
  temperature_celsius?: number | null;
  active_exception_id?: string;
  exception_severity?: ExceptionSeverity;
  created_at: string;
  updated_at: string;
}

export interface GpsEventRecord {
  id: string;
  event_id: string;
  vehicle_id: string;
  shipment_id?: string;
  latitude: number;
  longitude: number;
  speed_kph: number;
  temperature_celsius?: number | null;
  recorded_at: string;
  processed_at: string;
  source: string;
}

export interface ExceptionRecord {
  id: string;
  correlation_id: string;
  shipment_id: string;
  tracking_id?: string;
  vehicle_id?: string;
  vehicle_code?: string;
  exception_type: string;
  severity: ExceptionSeverity;
  status: ExceptionStatus;
  description: string;
  detected_at: string;
  resolved_at?: string;
  original_eta: string;
  suggested_eta?: string;
  sla_impact_minutes: number;
  ai_recommendation?: any;
  ai_analysis_status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'FALLBACK';
  carrier_id?: string;
  resolution_notes?: string;
  resolved_by?: string;
  created_at: string;
  updated_at: string;
}
