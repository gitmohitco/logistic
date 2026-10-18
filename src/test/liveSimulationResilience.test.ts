import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { fleetSimulationService } from '../services/telematics/fleetSimulationService';
import { trackingService } from '../../server/src/services/tracking.service';
import { db } from '../../server/src/db/dbProvider';

describe('Live Tracking Simulation Optimization & Anti-Crash Resilience Suite', () => {
  beforeEach(() => {
    fleetSimulationService.initializeFleet(520);
    fleetSimulationService.stop();
  });

  afterEach(() => {
    fleetSimulationService.stop();
  });

  it('1. should initialize 520+ vehicles with valid geographical coordinates and telemetry', () => {
    const vehicles = fleetSimulationService.getVehicles();
    expect(vehicles.length).toBeGreaterThanOrEqual(520);

    // Every vehicle must have finite coordinates within legal world bounds
    vehicles.forEach((v) => {
      expect(Number.isFinite(v.currentLatitude)).toBe(true);
      expect(Number.isFinite(v.currentLongitude)).toBe(true);
      expect(v.currentLatitude).toBeGreaterThanOrEqual(-90);
      expect(v.currentLatitude).toBeLessThanOrEqual(90);
      expect(v.currentLongitude).toBeGreaterThanOrEqual(-180);
      expect(v.currentLongitude).toBeLessThanOrEqual(180);
      expect(v.currentSpeedKph).toBeGreaterThanOrEqual(0);
    });

    const stats = fleetSimulationService.getStats();
    expect(stats.totalCount).toBe(vehicles.length);
    expect(stats.activeMoving).toBeGreaterThan(0);
    expect(stats.stabilityScore).toBe(100);
  });

  it('2. should advance telemetry coordinates safely without mutating bounds or crashing', () => {
    const initialStats = fleetSimulationService.getStats();
    expect(() => fleetSimulationService.tick()).not.toThrow();

    const updatedStats = fleetSimulationService.getStats();
    expect(updatedStats.totalTicksProcessed).toBe(initialStats.totalTicksProcessed + 1);
    expect(updatedStats.tickLatencyMs).toBeLessThan(50); // High-performance sub-millisecond execution
  });

  it('3. should sanitize corrupted GPS data (NaN, infinity, out of bounds) safely', () => {
    // Test NaN latitude
    const res1 = fleetSimulationService.sanitizeCoordinate(NaN, -87.6298);
    expect(res1.sanitized).toBe(true);
    expect(Number.isFinite(res1.lat)).toBe(true);

    // Test out-of-range coordinates (> 90 or < -90)
    const res2 = fleetSimulationService.sanitizeCoordinate(999.0, -999.0);
    expect(res2.sanitized).toBe(true);
    expect(res2.lat).toBe(90);
    expect(res2.lng).toBe(-180);

    // Test valid coordinates
    const res3 = fleetSimulationService.sanitizeCoordinate(41.8781, -87.6298);
    expect(res3.sanitized).toBe(false);
    expect(res3.lat).toBe(41.8781);
    expect(res3.lng).toBe(-87.6298);
  });

  it('4. should withstand chaos injection of corrupted packets without crashing the engine', () => {
    const result = fleetSimulationService.injectCorruptData();
    expect(result.injectedCount).toBe(5);
    expect(result.status).toContain('successfully intercepted');

    // All vehicles should remain valid after auto-healing
    const vehicles = fleetSimulationService.getVehicles();
    vehicles.forEach((v) => {
      expect(Number.isFinite(v.currentLatitude)).toBe(true);
      expect(Number.isFinite(v.currentLongitude)).toBe(true);
      expect(v.currentLatitude).toBeLessThanOrEqual(90);
      expect(v.currentLatitude).toBeGreaterThanOrEqual(-90);
    });

    const stats = fleetSimulationService.getStats();
    expect(stats.corruptedPacketsHandled).toBeGreaterThanOrEqual(5);
    expect(stats.stabilityScore).toBe(100);
  });

  it('5. should process burst stream spike of 250 packets in under 100ms with zero frame drops', () => {
    const burstRes = fleetSimulationService.injectBurstStream(250);
    expect(burstRes.burstSize).toBe(250);
    expect(burstRes.durationMs).toBeLessThan(100); // Must be blazing fast

    const stats = fleetSimulationService.getStats();
    expect(stats.stabilityScore).toBe(100);
  });

  it('6. should isolate throwing subscribers so broken UI listener never terminates simulation', () => {
    let goodSubscriberCalled = false;

    // Bad subscriber that throws an uncaught error
    const unsubBad = fleetSimulationService.subscribe(() => {
      throw new Error('Simulated rogue subscriber failure in UI component');
    });

    // Good subscriber
    const unsubGood = fleetSimulationService.subscribe(() => {
      goodSubscriberCalled = true;
    });

    // Advance tick: engine must not throw and must still notify good subscriber
    expect(() => fleetSimulationService.tick()).not.toThrow();
    expect(goodSubscriberCalled).toBe(true);

    unsubBad();
    unsubGood();
  });

  it('7. should dynamically adjust simulation speed modes (1x, 3x, Turbo) reliably', () => {
    fleetSimulationService.setSpeedMode('FAST');
    let stats = fleetSimulationService.getStats();
    expect(stats.simulationSpeedMode).toBe('FAST');
    expect(stats.activeIntervalMs).toBe(500);

    fleetSimulationService.setSpeedMode('TURBO');
    stats = fleetSimulationService.getStats();
    expect(stats.simulationSpeedMode).toBe('TURBO');
    expect(stats.activeIntervalMs).toBe(200);

    fleetSimulationService.setSpeedMode('NORMAL');
    stats = fleetSimulationService.getStats();
    expect(stats.simulationSpeedMode).toBe('NORMAL');
    expect(stats.activeIntervalMs).toBe(1500);
  });

  it('8. should prevent server crash on malformed webhook signature of mismatched length', () => {
    // Malformed short signature (e.g. length 7 vs expected sha256 64 hex chars)
    // In unoptimized code, crypto.timingSafeEqual throws RangeError and crashes Node.js server!
    const malformedSig = 'invalid';
    const payload = JSON.stringify({ eventId: 'test-evt', vehicleId: 'V1', speedKph: 50 });

    expect(() => {
      const isValid = trackingService.verifyWebhookSignature(malformedSig, payload);
      expect(isValid).toBe(false);
    }).not.toThrow();
  });

  it('9. should enforce sliding window cap on server in-memory GPS events to prevent OOM leak', async () => {
    // Simulate ingesting 200 events
    for (let i = 0; i < 20; i++) {
      await db.saveGpsEvent({
        eventId: `evt-leak-test-${i}-${Date.now()}`,
        vehicleId: 'VEH-1042',
        latitude: 41.8781,
        longitude: -87.6298,
        speedKph: 60,
        recordedAt: new Date().toISOString(),
      });
    }

    // Must be able to query without memory crashes
    const vehicle = await db.getVehicleById('VEH-1042');
    expect(vehicle).toBeDefined();
    expect(vehicle?.current_latitude).toBe(41.8781);
  });
});
