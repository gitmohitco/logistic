import { describe, it, expect } from 'vitest';
import { ROLE_CONFIGS, hasPermission, isRouteAllowed } from '../config/roles';
import { UserRole } from '../types';

describe('Role & Permission Matrix for 7 Business Roles', () => {
  const mandatoryRoles: UserRole[] = [
    'ADMINISTRATOR',
    'CONTROL_TOWER_ANALYST',
    'DISPATCHER_PLANNER',
    'CARRIER',
    'WAREHOUSE_SUPERVISOR',
    'CUSTOMER_SERVICE',
    'CUSTOMER',
  ];

  it('defines exactly all 7 mandatory business roles', () => {
    expect(Object.keys(ROLE_CONFIGS)).toHaveLength(7);
    for (const role of mandatoryRoles) {
      expect(ROLE_CONFIGS[role]).toBeDefined();
      expect(ROLE_CONFIGS[role].role).toBe(role);
      expect(ROLE_CONFIGS[role].label).toBeTruthy();
    }
  });

  describe('Administrator Entitlements', () => {
    it('grants user management, system health, and cross-carrier access', () => {
      expect(hasPermission('ADMINISTRATOR', 'canManageUsers')).toBe(true);
      expect(hasPermission('ADMINISTRATOR', 'canViewSystemHealth')).toBe(true);
      expect(hasPermission('ADMINISTRATOR', 'canViewAllShipments')).toBe(true);
      expect(hasPermission('ADMINISTRATOR', 'canViewInternalNotes')).toBe(true);
      expect(isRouteAllowed('ADMINISTRATOR', '/admin/users')).toBe(true);
    });
  });

  describe('Customer Security Boundaries', () => {
    it('strictly forbids Customer role from viewing internal notes or operational controls', () => {
      expect(hasPermission('CUSTOMER', 'canViewInternalNotes')).toBe(false);
      expect(hasPermission('CUSTOMER', 'canViewCarrierCredentials')).toBe(false);
      expect(hasPermission('CUSTOMER', 'canManageUsers')).toBe(false);
      expect(hasPermission('CUSTOMER', 'canResolveExceptions')).toBe(false);
      expect(hasPermission('CUSTOMER', 'canBulkTrack')).toBe(false);
      expect(hasPermission('CUSTOMER', 'canUseAiAssistant')).toBe(false);
    });

    it('denies Customer access to internal routes', () => {
      expect(isRouteAllowed('CUSTOMER', '/admin/users')).toBe(false);
      expect(isRouteAllowed('CUSTOMER', '/exceptions')).toBe(false);
      expect(isRouteAllowed('CUSTOMER', '/bulk-track')).toBe(false);
    });

    it('allows Customer access only to authorized tracking pages', () => {
      expect(isRouteAllowed('CUSTOMER', '/dashboard')).toBe(true);
      expect(isRouteAllowed('CUSTOMER', '/shipments')).toBe(true);
      expect(isRouteAllowed('CUSTOMER', '/shipments/shp-001')).toBe(true);
      expect(isRouteAllowed('CUSTOMER', '/tracking-events')).toBe(true);
    });
  });

  describe('Carrier Partner Entitlements', () => {
    it('permits ETA proposals but restricts full network visibility', () => {
      expect(hasPermission('CARRIER', 'canProposeEta')).toBe(true);
      expect(hasPermission('CARRIER', 'canViewAllShipments')).toBe(false);
      expect(hasPermission('CARRIER', 'canViewCarrierOnly')).toBe(true);
      expect(hasPermission('CARRIER', 'canManageUsers')).toBe(false);
      expect(hasPermission('CARRIER', 'canResolveExceptions')).toBe(false);
    });
  });

  describe('Warehouse Supervisor Entitlements', () => {
    it('allows warehouse status updates and hub-linked shipments', () => {
      expect(hasPermission('WAREHOUSE_SUPERVISOR', 'canSubmitWarehouseUpdates')).toBe(true);
      expect(hasPermission('WAREHOUSE_SUPERVISOR', 'canViewWarehouseOnly')).toBe(true);
      expect(hasPermission('WAREHOUSE_SUPERVISOR', 'canViewAllShipments')).toBe(false);
    });
  });

  describe('Control Tower Analyst & Dispatcher Entitlements', () => {
    it('allows AI assistant and cross-network exception resolution', () => {
      expect(hasPermission('CONTROL_TOWER_ANALYST', 'canUseAiAssistant')).toBe(true);
      expect(hasPermission('CONTROL_TOWER_ANALYST', 'canResolveExceptions')).toBe(true);
      expect(hasPermission('DISPATCHER_PLANNER', 'canReassignShipments')).toBe(true);
      expect(hasPermission('DISPATCHER_PLANNER', 'canUseAiAssistant')).toBe(true);
    });
  });
});
