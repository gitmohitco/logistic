import { describe, it, expect } from 'vitest';
import { mendixClient, MendixApiError } from '../services/api/mendixClient';
import { UserProfile } from '../types';

describe('Mendix API Client & Error Resilience', () => {
  const analystUser: UserProfile = {
    id: 'usr-analyst-02',
    name: 'Eleanor Vance',
    email: 'e.vance@controltower.enterprise.com',
    role: 'CONTROL_TOWER_ANALYST',
  };

  it('instantiates MendixApiError with status code, message, and payload', () => {
    const error = new MendixApiError(403, 'Entity access denied by Mendix microflow', { code: 'ERR_FORBIDDEN' });
    expect(error.name).toBe('MendixApiError');
    expect(error.status).toBe(403);
    expect(error.message).toBe('Entity access denied by Mendix microflow');
    expect(error.data.code).toBe('ERR_FORBIDDEN');
  });

  it('retrieves shipments summary containing all required KPI dimensions', async () => {
    const summary = await mendixClient.getSummary(analystUser);
    expect(summary).toBeDefined();
    expect(summary.kpi.totalShipments.value).toBeGreaterThanOrEqual(1);
    expect(summary.kpi.activeDeliveries.value).toBeGreaterThanOrEqual(1);
    expect(summary.kpi.onTimeDelivery.value).toBeGreaterThanOrEqual(50);
  });

  it('retrieves tracking events for active shipment without error', async () => {
    const events = await mendixClient.getTrackingEvents('shp-001', analystUser);
    expect(events.length).toBeGreaterThanOrEqual(1);
    expect(events[0].shipmentId).toBe('shp-001');
  });

  it('routes AI queries and receives knowledge references', async () => {
    const res = await mendixClient.aiChat(
      { query: 'Which shipments are at risk of missing their delivery SLA?' },
      analystUser
    );
    expect(res.replyText).toContain('TRK-US-89216');
    expect(res.knowledgeSources.length).toBeGreaterThanOrEqual(1);
    expect(res.relatedShipments.length).toBeGreaterThanOrEqual(1);
  });
});
