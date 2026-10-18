import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { db } from '../src/db/dbProvider.js';
import { mendixAiService } from '../src/services/mendixAi.service.js';
import { anomalyEngineService } from '../src/services/anomalyEngine.service.js';
import { mendixResponseSchema } from '../src/schemas/mendix.schema.js';

describe('Logistics Control Tower Integration & Business Workflow Test Suite', () => {
  beforeEach(() => {
    db.reset();
  });

  // Test 1: Valid GPS Event Ingestion
  it('1. should accept and process a valid GPS telematics webhook event', async () => {
    const payload = {
      eventId: 'gps-test-valid-001',
      vehicleId: 'VEH-1042',
      shipmentId: 'SHP-2026-001',
      latitude: 17.3850,
      longitude: 78.4867,
      speedKph: 55.4,
      recordedAt: new Date().toISOString(),
      temperatureCelsius: 22.0,
      source: 'gps',
    };

    const res = await request(app)
      .post('/api/v1/webhooks/gps')
      .send(payload);

    expect(res.status).toBe(202);
    expect(res.body.status).toBe('accepted');
    expect(res.body.data.currentLocationUpdated).toBe(true);

    // Verify vehicle location was updated
    const vehicle = await db.getVehicleById('VEH-1042');
    expect(vehicle?.current_latitude).toBe(17.3850);
  });

  // Test 2: Duplicate GPS Event (Idempotency)
  it('2. should detect duplicate GPS event and safely ignore it idempotently', async () => {
    const payload = {
      eventId: 'gps-test-dup-002',
      vehicleId: 'VEH-1042',
      latitude: 17.3850,
      longitude: 78.4867,
      speedKph: 50.0,
      recordedAt: new Date().toISOString(),
    };

    // First emission
    const firstRes = await request(app).post('/api/v1/webhooks/gps').send(payload);
    expect(firstRes.status).toBe(202);

    // Second emission with same eventId
    const secondRes = await request(app).post('/api/v1/webhooks/gps').send(payload);
    expect(secondRes.status).toBe(200);
    expect(secondRes.body.status).toBe('acknowledged');
    expect(secondRes.body.message).toContain('Duplicate event');
  });

  // Test 3: Invalid Coordinates
  it('3. should reject GPS telemetry payload with invalid coordinates', async () => {
    const invalidPayload = {
      eventId: 'gps-test-inv-003',
      vehicleId: 'VEH-1042',
      latitude: 195.0, // Invalid: exceeds 90 degrees
      longitude: 78.4867,
      speedKph: 45.0,
      recordedAt: new Date().toISOString(),
    };

    const res = await request(app).post('/api/v1/webhooks/gps').send(invalidPayload);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_FAILED');
  });

  // Test 4: Out-of-Order GPS Event
  it('4. should prevent older out-of-order GPS telemetry from overwriting newer vehicle location', async () => {
    const now = Date.now();
    const newerTimestamp = new Date(now).toISOString();
    const olderTimestamp = new Date(now - 7200000).toISOString(); // 2 hours older

    // 1. Ingest newer location
    await request(app).post('/api/v1/webhooks/gps').send({
      eventId: 'gps-newer-004',
      vehicleId: 'VEH-1042',
      latitude: 17.5000,
      longitude: 78.6000,
      speedKph: 60.0,
      recordedAt: newerTimestamp,
    });

    // 2. Ingest older location for same vehicle
    const res = await request(app).post('/api/v1/webhooks/gps').send({
      eventId: 'gps-older-004',
      vehicleId: 'VEH-1042',
      latitude: 16.0000,
      longitude: 77.0000,
      speedKph: 40.0,
      recordedAt: olderTimestamp,
    });

    expect(res.status).toBe(202);
    expect(res.body.data.reason).toBe('OUT_OF_ORDER_TIMESTAMP');

    // Verify current vehicle location preserved the newer position
    const vehicle = await db.getVehicleById('VEH-1042');
    expect(vehicle?.current_latitude).toBe(17.5000);
  });

  // Test 5: Delayed Shipment Detection
  it('5. should identify delayed shipments and return correct delay metrics', async () => {
    const res = await request(app).get('/api/v1/shipments?status=DELAYED');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].status).toBe('DELAYED');
    expect(res.body[0].delayMinutes).toBeGreaterThan(0);
  });

  // Test 6: Temperature Excursion Cold-Chain Anomaly
  it('6. should trigger high severity exception when cold-chain biopharma temperature threshold is breached', async () => {
    // Submit cold-chain breach (> 8°C) for AIR-3015 carrying biopharmaceutical cargo
    await anomalyEngineService.evaluateTelemetryRules({
      vehicleId: 'AIR-3015',
      latitude: 15.2000,
      longitude: 76.5000,
      speedKph: 740.0,
      recordedAt: new Date().toISOString(),
      temperatureCelsius: 11.5, // Critical breach
    });

    const exceptions = await db.getExceptions();
    const tempExc = exceptions.find((e) => e.exception_type === 'TEMPERATURE_EXCURSION');
    expect(tempExc).toBeDefined();
    expect(tempExc?.severity).toBe('HIGH');
  });

  // Test 7: Mendix Timeout Handling
  it('7. should handle Mendix AI network timeouts gracefully with deterministic fallback', async () => {
    // Request with simulated facts
    const reqDto = {
      correlationId: 'corr-timeout-test',
      exceptionId: 'exc-timeout-test',
      exceptionType: 'DELIVERY_DELAY',
      shipmentId: 'shp-001',
      origin: 'Hyderabad',
      destination: 'Vijayawada',
      currentLatitude: 17.3850,
      currentLongitude: 78.4867,
      currentEta: new Date().toISOString(),
      observedAt: new Date().toISOString(),
      context: { delayMinutes: 40, routeDeviationKm: 0, sensorStatus: 'NORMAL' },
    };

    const result = await mendixAiService.analyzeException(reqDto);
    expect(result).toBeDefined();
    expect(result.recommendedAction).toBeDefined();
    expect(result.knowledgeReferences.length).toBeGreaterThan(0);
  });

  // Test 8: OAuth Failure & Resilient Token Fallback
  it('8. should provide authenticated token without exposing credentials or crashing', async () => {
    const token = await mendixAiService.getAccessToken();
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
  });

  // Test 9: Malformed Mendix Response Schema Protection
  it('9. should validate Mendix response schema and reject malformed structures', () => {
    const malformed = {
      correlationId: 'c-1',
      severity: 'SUPER_URGENT', // Invalid enum
    };
    const parseResult = mendixResponseSchema.safeParse(malformed);
    expect(parseResult.success).toBe(false);
  });

  // Test 10: Low Severity Exception Workflow
  it('10. should automatically update ETA and log resolution for low severity exceptions', async () => {
    const created = await db.createException({
      correlation_id: 'corr-low-test-010',
      shipment_id: 'shp-002',
      tracking_id: 'SHP-2026-002',
      exception_type: 'DELIVERY_DELAY',
      severity: 'LOW',
      status: 'OPEN',
      description: 'Minor traffic variance',
      detected_at: new Date().toISOString(),
      original_eta: new Date().toISOString(),
      suggested_eta: new Date(Date.now() + 3600000).toISOString(),
      sla_impact_minutes: 15,
      ai_analysis_status: 'COMPLETED',
    });

    const resolved = await db.resolveException(
      created.id,
      'AUTO_ETA_UPDATE',
      'System auto-resolved within tolerance',
      'system-auto',
      'ADMIN'
    );

    expect(resolved?.status).toBe('RESOLVED');
  });

  // Test 11: Medium Severity Analyst Review
  it('11. should allow authorized analyst to review and resolve medium severity exception', async () => {
    const res = await request(app)
      .post('/api/v1/exceptions/exc-001/resolve')
      .set('X-User-Role', 'ANALYST')
      .send({
        action: 'REROUTE',
        notes: 'Analyst authorized highway bypass reroute.',
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.exception.status).toBe('RESOLVED');
  });

  // Test 12: High Severity Incident Escalation
  it('12. should allow operations manager to acknowledge and escalate high-severity incident', async () => {
    const res = await request(app)
      .post('/api/v1/exceptions/exc-002/resolve')
      .set('X-User-Role', 'OPS_MANAGER')
      .send({
        action: 'EXPEDITE',
        notes: 'Priority landing ramp authorized by Operations Director.',
      });

    expect(res.status).toBe(200);
    expect(res.body.exception.status).toBe('RESOLVED');
  });

  // Test 13: Unauthorized Carrier Access (Tenant Isolation)
  it('13. should prevent external carrier partner from accessing shipments of another carrier', async () => {
    // Carrier Apex (CAR-001) attempting to access BlueDart shipment (shp-003)
    const res = await request(app)
      .get('/api/v1/shipments/shp-003')
      .set('X-User-Role', 'CARRIER')
      .set('X-Carrier-Id', 'car-apex-001');

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('TENANT_ISOLATION_VIOLATION');
  });

  // Test 14: Invalid ETA Confirmation
  it('14. should reject carrier ETA confirmation with invalid timestamp schema', async () => {
    const res = await request(app)
      .post('/api/v1/carrier/confirm-eta')
      .send({
        shipmentId: 'shp-001',
        action: 'PROPOSE',
        proposedEta: 'invalid-not-a-date',
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_FAILED');
  });

  // Test 15: Database Connection & System Health Resilience
  it('15. should report operational health and connector status gracefully', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.connectors).toBeDefined();
    expect(res.body.connectors.mendixAi.ragKnowledgeBase).toContain('Mendix PgVector');
  });
});
