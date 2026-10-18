import { describe, it, expect } from 'vitest';
import { mockAdapter } from '../services/api/mockAdapter';
import { UserProfile } from '../types';

describe('Bulk Shipment Tracking Workflow & Outcomes', () => {
  const analystUser: UserProfile = {
    id: 'usr-analyst-02',
    name: 'Eleanor Vance',
    email: 'e.vance@controltower.enterprise.com',
    role: 'CONTROL_TOWER_ANALYST',
  };

  const carrierUser: UserProfile = {
    id: 'usr-carrier-04',
    name: 'Elena Rostova',
    email: 'elena@apexlogistics.com',
    role: 'CARRIER',
    carrierId: 'CAR-001',
    carrierName: 'Apex Intermodal Logistics',
  };

  it('correctly tracks valid shipment IDs with SUCCESS outcome', async () => {
    const inputIds = ['TRK-US-89214', 'TRK-US-89215'];
    const response = await mockAdapter.bulkTrack(inputIds, analystUser);

    expect(response.totalSubmitted).toBe(2);
    expect(response.successfulCount).toBe(2);
    expect(response.results).toHaveLength(2);

    const first = response.results[0];
    expect(first.outcome).toBe('SUCCESS');
    expect(first.trackingId).toBe('TRK-US-89214');
    expect(first.carrierName).toBe('Apex Intermodal Logistics');
  });

  it('marks non-existent tracking IDs as NOT_FOUND and retryable', async () => {
    const inputIds = ['TRK-NOT-FOUND-999'];
    const response = await mockAdapter.bulkTrack(inputIds, analystUser);

    expect(response.notFoundCount).toBe(1);
    const result = response.results[0];
    expect(result.outcome).toBe('NOT_FOUND');
    expect(result.canRetry).toBe(true);
    expect(result.errorMessage).toContain('not located');
  });

  it('marks malformed tracking IDs as MALFORMED and non-retryable', async () => {
    const inputIds = ['!', 'AB', '    '];
    const response = await mockAdapter.bulkTrack(inputIds, analystUser);

    expect(response.failedCount).toBe(3);
    for (const r of response.results) {
      expect(r.outcome).toBe('MALFORMED');
      expect(r.canRetry).toBe(false);
    }
  });

  it('enforces carrier authorization and returns UNAUTHORIZED for other carrier shipments', async () => {
    // TRK-US-89215 belongs to SwiftLine Air Express (CAR-002), not Apex (CAR-001)
    const inputIds = ['TRK-US-89214', 'TRK-US-89215'];
    const response = await mockAdapter.bulkTrack(inputIds, carrierUser);

    expect(response.successfulCount).toBe(1);
    expect(response.unauthorizedCount).toBe(1);

    const restrictedResult = response.results.find((r) => r.queryId === 'TRK-US-89215');
    expect(restrictedResult?.outcome).toBe('UNAUTHORIZED');
    expect(restrictedResult?.errorMessage).toContain('Restricted');
  });
});
