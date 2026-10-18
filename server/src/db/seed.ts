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

    // 4. Shipments
    const carriersList = (await query('SELECT id, code FROM carriers')).rows;
    const hubsList = (await query('SELECT id, hub_code FROM hub_capacities')).rows;
    const vehiclesList = (await query('SELECT id, vehicle_code FROM vehicles')).rows;

    const carrierMap = new Map(carriersList.map(c => [c.code, c.id]));
    const hubMap = new Map(hubsList.map(h => [h.hub_code, h.id]));
    const vehicleMap = new Map(vehiclesList.map(v => [v.vehicle_code, v.id]));

    for (const s of initialShipments) {
      const carrierId = carrierMap.get('APEX') || carriersList[0]?.id;
      const originId = hubMap.get('HUB-HYD') || hubsList[0]?.id;
      const destId = hubMap.get('HUB-VJA') || hubsList[1]?.id;
      const vehicleId = s.vehicle_code ? vehicleMap.get(s.vehicle_code) : null;

      if (carrierId && originId && destId) {
        await query(
          `INSERT INTO shipments (
            tracking_id, carrier_id, origin_hub_id, destination_hub_id, vehicle_id,
            status, estimated_arrival, original_eta, cargo_type, weight_kg, delay_minutes, route_coordinates
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (tracking_id) DO NOTHING;`,
          [
            s.tracking_id,
            carrierId,
            originId,
            destId,
            vehicleId || null,
            s.status,
            s.estimated_arrival,
            s.original_eta,
            s.cargo_type,
            s.weight_kg,
            s.delay_minutes,
            JSON.stringify(s.route_coordinates || []),
          ]
        );
      }
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
