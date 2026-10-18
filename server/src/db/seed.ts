import { pool, query } from './pool.js';
import { logger } from '../utils/logger.js';
import { 
  initialCarriers, 
  initialHubs, 
  initialVehicles, 
  initialShipments, 
  initialExceptions 
} from './seedData.js';

export async function runSeed() {
  if (!pool) {
    logger.info('DATABASE_URL is not set. In-memory repository already initialised with default mock seed data.');
    return;
  }

  try {
    logger.info('Starting PostgreSQL database seeding...');

    // 1. Carriers
    for (const c of initialCarriers) {
      await query(
        `INSERT INTO carriers (code, name, contact_email, contact_phone, is_active)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (code) DO NOTHING;`,
        [c.code, c.name, c.contact_email, c.contact_phone, c.is_active]
      );
    }

    // 2. Hubs
    for (const h of initialHubs) {
      await query(
        `INSERT INTO hub_capacities (hub_code, hub_name, total_capacity, occupied_capacity, capacity_unit, latitude, longitude, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (hub_code) DO NOTHING;`,
        [h.hub_code, h.hub_name, h.total_capacity, h.occupied_capacity, h.capacity_unit, h.latitude, h.longitude, h.status]
      );
    }

    // 3. Vehicles
    for (const v of initialVehicles) {
      await query(
        `INSERT INTO vehicles (vehicle_code, transport_mode, status, current_latitude, current_longitude, current_speed_kph, heading_deg)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (vehicle_code) DO NOTHING;`,
        [v.vehicle_code, v.transport_mode, v.status, v.current_latitude, v.current_longitude, v.current_speed_kph, v.heading_deg]
      );
    }

    logger.info('PostgreSQL database seeded successfully!');
  } catch (err: any) {
    logger.error('Database seeding failed', { error: err.message });
    throw err;
  }
}

// Execute directly if run via CLI
runSeed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
