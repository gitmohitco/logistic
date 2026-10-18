export type TransportMode = 'AIR' | 'GROUND' | 'SEA';
export type VehicleStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
export type ShipmentStatus = 'PENDING' | 'LOADING' | 'ON_ROUTE' | 'DELAYED' | 'DELIVERED' | 'CANCELLED';
export type ExceptionSeverity = 'LOW' | 'MEDIUM' | 'HIGH';
export type ExceptionStatus = 'OPEN' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED';

// Exactly 7 Mandatory Business Roles
export type UserRole =
  | 'ADMINISTRATOR'
  | 'CONTROL_TOWER_ANALYST'
  | 'DISPATCHER_PLANNER'
  | 'CARRIER'
  | 'WAREHOUSE_SUPERVISOR'
  | 'CUSTOMER_SERVICE'
  | 'CUSTOMER';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  department?: string;
  title?: string;
  carrierId?: string;
  carrierName?: string;
  customerId?: string;
  customerName?: string;
  warehouseId?: string;
  warehouseName?: string;
  avatarUrl?: string;
}

export interface TrackingEvent {
  id: string;
  shipmentId: string;
  trackingId: string;
  eventType: 'DISPATCHED' | 'CHECKPOINT' | 'DELAY_REPORTED' | 'CUSTOMS_CLEARED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'EXCEPTION_FLAGGED';
  title: string;
  description: string;
  location: string;
  latitude?: number;
  longitude?: number;
  timestamp: string;
  recordedBy?: string;
  statusAfterEvent: ShipmentStatus;
  isMilestone?: boolean;
}

export interface HubCapacity {
  id: string;
  hubCode: string;
  hubName: string;
  totalCapacity: number;
  occupiedCapacity: number;
  capacityUnit: string;
  latitude: number;
  longitude: number;
  status: 'OPTIMAL' | 'WARNING' | 'CRITICAL';
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  carrierId?: string;
  carrierName?: string;
  vehicleCode: string;
  transportMode: TransportMode;
  status: VehicleStatus;
  currentLatitude: number;
  currentLongitude: number;
  currentSpeedKph: number;
  headingDeg: number;
  lastLocationAt: string;
  assignedShipmentId?: string;
  assignedTrackingId?: string;
  driverName?: string;
  driverPhone?: string;
}

export interface Shipment {
  id: string;
  trackingId: string;
  carrierId: string;
  carrierName: string;
  customerId?: string;
  customerName?: string;
  originHubId: string;
  originHubName: string;
  originCoords: [number, number];
  destinationHubId: string;
  destinationHubName: string;
  destinationCoords: [number, number];
  vehicleId?: string;
  vehicleCode?: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  status: ShipmentStatus;
  estimatedArrival: string;
  originalEta: string;
  actualArrival?: string;
  cargoType: string;
  weightKg: number;
  delayMinutes: number;
  routeCoordinates: [number, number][];
  currentLatitude?: number;
  currentLongitude?: number;
  currentSpeedKph?: number;
  temperatureCelsius?: number | null;
  activeExceptionId?: string;
  exceptionSeverity?: ExceptionSeverity;
  trackingEvents?: TrackingEvent[];
  internalNotes?: string; // Hidden from Customer role!
  slaDeadline?: string;
  isSlaAtRisk?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MendixAiRecommendation {
  correlationId: string;
  exceptionId: string;
  severity: ExceptionSeverity;
  recommendedAction: 'REROUTE' | 'NOTIFY_CARRIER' | 'EXPEDITE' | 'HOLD' | 'INSPECT_CARGO';
  reasoningSummary: string;
  suggestedEta: string;
  slaImpactMinutes: number;
  confidence: number;
  knowledgeReferences: Array<{
    documentTitle: string;
    section: string;
    snippet: string;
  }>;
  analyzedAt: string;
  isSimulatedFallback?: boolean;
}

export interface ExceptionItem {
  id: string;
  correlationId: string;
  shipmentId: string;
  trackingId: string;
  vehicleId?: string;
  vehicleCode?: string;
  exceptionType: string;
  severity: ExceptionSeverity;
  status: ExceptionStatus;
  description: string;
  detectedAt: string;
  resolvedAt?: string;
  originalEta: string;
  suggestedEta?: string;
  slaImpactMinutes: number;
  aiRecommendation?: MendixAiRecommendation;
  aiAnalysisStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'FALLBACK';
  carrierId?: string;
  carrierName?: string;
  customerId?: string;
  customerName?: string;
  owner?: string;
  ageHours?: number;
  resolutionNotes?: string;
  resolvedBy?: string;
}

export interface KpiMetric {
  value: number;
  prevMonth: number;
  percentChange: number;
  trend: number[];
  isPositiveGood?: boolean;
}

export interface DashboardSummary {
  kpi: {
    totalShipments: KpiMetric;
    activeDeliveries: KpiMetric;
    fleetUtilization: KpiMetric;
    onTimeDelivery: KpiMetric;
    inTransitShipments?: KpiMetric;
    delayedShipments?: KpiMetric;
    deliveredShipments?: KpiMetric;
    slaAtRiskShipments?: KpiMetric;
  };
  statusDistribution?: Record<string, number>;
  lastUpdated: string;
  mode: 'LIVE' | 'DEMO' | 'MENDIX_CONNECTED';
}

// Bulk Tracking Types
export interface BulkTrackItemResult {
  queryId: string;
  shipmentId?: string;
  trackingId?: string;
  carrierName?: string;
  originHubName?: string;
  destinationHubName?: string;
  status?: ShipmentStatus;
  estimatedArrival?: string;
  delayMinutes?: number;
  outcome: 'SUCCESS' | 'NOT_FOUND' | 'UNAUTHORIZED' | 'MALFORMED' | 'ERROR';
  errorMessage?: string;
  canRetry?: boolean;
}

export interface BulkTrackResponse {
  jobId: string;
  totalSubmitted: number;
  successfulCount: number;
  failedCount: number;
  unauthorizedCount: number;
  notFoundCount: number;
  results: BulkTrackItemResult[];
  processedAt: string;
}

// AI Assistant Types
export interface AiChatMessage {
  id: string;
  sender: 'USER' | 'ASSISTANT' | 'SYSTEM';
  text: string;
  timestamp: string;
  sourceReferences?: Array<{
    shipmentId: string;
    trackingId: string;
    details: string;
    confidenceScore?: number;
  }>;
  isOperationalData?: boolean;
  isAiExplanation?: boolean;
  status?: 'SENDING' | 'SUCCESS' | 'ERROR';
}

export interface AiChatResponse {
  messageId: string;
  replyText: string;
  modelUsed: string;
  timestamp: string;
  knowledgeSources: Array<{
    documentTitle: string;
    section: string;
    snippet: string;
  }>;
  relatedShipments: Array<{
    shipmentId: string;
    trackingId: string;
    details: string;
  }>;
}

// User Management Types for Administrator
export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  carrierId?: string;
  carrierName?: string;
  customerId?: string;
  customerName?: string;
  warehouseId?: string;
  warehouseName?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'INVITED';
  lastActive: string;
  createdAt: string;
}

// Carrier Organization Management
export interface CarrierOrganization {
  id: string;
  carrierCode: string;
  name: string;
  contactEmail: string;
  contactPhone: string;
  transportModes: TransportMode[];
  slaTier: 'TIER_1_ENTERPRISE' | 'TIER_2_PREFERRED' | 'TIER_3_STANDARD';
  status: 'ACTIVE' | 'ONBOARDING' | 'SUSPENDED';
  activeShipmentsCount?: number;
  fleetCount?: number;
  primaryHub?: string;
  createdAt: string;
}

