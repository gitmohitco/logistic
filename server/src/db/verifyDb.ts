import { query, pool } from './pool.js';

async function main() {
  try {
    const carriers = await query('SELECT count(*) FROM carriers');
    const hubs = await query('SELECT count(*) FROM hub_capacities');
    const vehicles = await query('SELECT count(*) FROM vehicles');
    const shipments = await query('SELECT count(*) FROM shipments');
    const exceptions = await query('SELECT count(*) FROM exceptions');

    console.log('✅ NEON POSTGRESQL CONNECTIVITY & METRICS:');
    console.log(`- Carriers registered: ${carriers.rows[0].count}`);
    console.log(`- Regional Hubs: ${hubs.rows[0].count}`);
    console.log(`- Live Fleet Vehicles: ${vehicles.rows[0].count}`);
    console.log(`- Active Shipments: ${shipments.rows[0].count}`);
    console.log(`- System Exceptions: ${exceptions.rows[0].count}`);
  } catch (err: any) {
    console.error('❌ Connection test error:', err.message);
  } finally {
    if (pool) await pool.end();
  }
}

main();
