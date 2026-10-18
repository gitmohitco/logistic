-- PostgreSQL Schema for Neon Serverless Logistics Control Tower

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CARRIERS
CREATE TABLE IF NOT EXISTS carriers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(64),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. DRIVERS
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    carrier_id UUID REFERENCES carriers(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(64) NOT NULL,
    license_number VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'AVAILABLE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. HUB CAPACITIES
CREATE TABLE IF NOT EXISTS hub_capacities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hub_code VARCHAR(32) NOT NULL UNIQUE,
    hub_name VARCHAR(255) NOT NULL,
    total_capacity INTEGER NOT NULL CHECK (total_capacity > 0),
    occupied_capacity INTEGER NOT NULL DEFAULT 0 CHECK (occupied_capacity >= 0),
    capacity_unit VARCHAR(32) NOT NULL DEFAULT 'TEU',
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'OPTIMAL',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. VEHICLES
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    carrier_id UUID REFERENCES carriers(id) ON DELETE SET NULL,
    vehicle_code VARCHAR(64) NOT NULL UNIQUE,
    transport_mode VARCHAR(16) NOT NULL CHECK (transport_mode IN ('AIR', 'GROUND', 'SEA')),
    status VARCHAR(16) NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE', 'MAINTENANCE')),
    current_latitude NUMERIC(9, 6) NOT NULL,
    current_longitude NUMERIC(9, 6) NOT NULL,
    current_speed_kph NUMERIC(6, 2) NOT NULL DEFAULT 0 CHECK (current_speed_kph >= 0),
    heading_deg NUMERIC(5, 2) NOT NULL DEFAULT 0,
    last_location_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. SHIPMENTS
CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tracking_id VARCHAR(64) NOT NULL UNIQUE,
    carrier_id UUID NOT NULL REFERENCES carriers(id) ON DELETE RESTRICT,
    origin_hub_id UUID NOT NULL REFERENCES hub_capacities(id) ON DELETE RESTRICT,
    destination_hub_id UUID NOT NULL REFERENCES hub_capacities(id) ON DELETE RESTRICT,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    status VARCHAR(16) NOT NULL CHECK (status IN ('LOADING', 'ON_ROUTE', 'DELAYED', 'DELIVERED')),
    estimated_arrival TIMESTAMPTZ NOT NULL,
    original_eta TIMESTAMPTZ NOT NULL,
    actual_arrival TIMESTAMPTZ,
    cargo_type VARCHAR(128) NOT NULL,
    weight_kg NUMERIC(10, 2) NOT NULL CHECK (weight_kg > 0),
    delay_minutes INTEGER NOT NULL DEFAULT 0,
    route_coordinates JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. GPS EVENTS (Idempotent telemetry ingestion)
CREATE TABLE IF NOT EXISTS gps_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id VARCHAR(128) NOT NULL UNIQUE,
    vehicle_id VARCHAR(64) NOT NULL,
    shipment_id VARCHAR(64),
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    speed_kph NUMERIC(6, 2) NOT NULL,
    temperature_celsius NUMERIC(5, 2),
    source VARCHAR(64) NOT NULL DEFAULT 'gps',
    recorded_at TIMESTAMPTZ NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. EXCEPTIONS (AI Analyzed Anomaly Records)
CREATE TABLE IF NOT EXISTS exceptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    correlation_id VARCHAR(128) NOT NULL UNIQUE,
    shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    exception_type VARCHAR(64) NOT NULL,
    severity VARCHAR(16) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH')),
    status VARCHAR(32) NOT NULL CHECK (status IN ('OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED')),
    description TEXT NOT NULL,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    original_eta TIMESTAMPTZ NOT NULL,
    suggested_eta TIMESTAMPTZ,
    sla_impact_minutes INTEGER NOT NULL DEFAULT 0,
    ai_recommendation JSONB,
    ai_analysis_status VARCHAR(16) NOT NULL DEFAULT 'PENDING' CHECK (ai_analysis_status IN ('PENDING', 'COMPLETED', 'FAILED', 'FALLBACK')),
    resolution_notes TEXT,
    resolved_by VARCHAR(128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. EXCEPTION HISTORY (Audit Trail)
CREATE TABLE IF NOT EXISTS exception_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exception_id UUID NOT NULL REFERENCES exceptions(id) ON DELETE CASCADE,
    actor_id VARCHAR(128) NOT NULL,
    actor_role VARCHAR(64) NOT NULL,
    previous_status VARCHAR(32) NOT NULL,
    new_status VARCHAR(32) NOT NULL,
    action_taken VARCHAR(128) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. CARRIER SCORECARDS
CREATE TABLE IF NOT EXISTS carrier_scorecards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    carrier_id UUID NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
    period_month VARCHAR(7) NOT NULL, -- YYYY-MM
    total_shipments INTEGER NOT NULL DEFAULT 0,
    on_time_shipments INTEGER NOT NULL DEFAULT 0,
    delayed_shipments INTEGER NOT NULL DEFAULT 0,
    critical_exceptions INTEGER NOT NULL DEFAULT 0,
    avg_resolution_minutes NUMERIC(8, 2) NOT NULL DEFAULT 0,
    score_percentage NUMERIC(5, 2) NOT NULL DEFAULT 100.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(carrier_id, period_month)
);

-- PERFORMANCE & QUERY INDEXES
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_id ON shipments(tracking_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status_eta ON shipments(status, estimated_arrival);
CREATE INDEX IF NOT EXISTS idx_shipments_carrier ON shipments(carrier_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status_mode ON vehicles(status, transport_mode);
CREATE INDEX IF NOT EXISTS idx_vehicles_location_at ON vehicles(last_location_at DESC);
CREATE INDEX IF NOT EXISTS idx_exceptions_severity_status ON exceptions(severity, status, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_gps_events_vehicle_recorded ON gps_events(vehicle_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_gps_events_event_id ON gps_events(event_id);
