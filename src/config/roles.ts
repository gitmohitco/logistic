import { UserRole } from '../types';

export interface RoleConfig {
  role: UserRole;
  label: string;
  badgeColor: string;
  description: string;
  allowedRoutes: string[];
  permissions: {
    canViewAllShipments: boolean;
    canViewAssignedOnly: boolean;
    canViewCustomerOnly: boolean;
    canViewCarrierOnly: boolean;
    canViewWarehouseOnly: boolean;
    canManageUsers: boolean;
    canViewSystemHealth: boolean;
    canResolveExceptions: boolean;
    canProposeEta: boolean;
    canSubmitWarehouseUpdates: boolean;
    canUseAiAssistant: boolean;
    canBulkTrack: boolean;
    canViewInternalNotes: boolean;
    canViewCarrierCredentials: boolean;
    canReassignShipments: boolean;
  };
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  ADMINISTRATOR: {
    role: 'ADMINISTRATOR',
    label: 'Administrator',
    badgeColor: '#18217E',
    description: 'System administration, user role assignments, carrier organization association & system health.',
    allowedRoutes: [
      '/dashboard',
      '/shipments',
      '/shipments/:id',
      '/bulk-track',
      '/tracking-events',
      '/exceptions',
      '/ai-assistant',
      '/admin/users',
      '/admin/system',
    ],
    permissions: {
      canViewAllShipments: true,
      canViewAssignedOnly: false,
      canViewCustomerOnly: false,
      canViewCarrierOnly: false,
      canViewWarehouseOnly: false,
      canManageUsers: true,
      canViewSystemHealth: true,
      canResolveExceptions: true,
      canProposeEta: true,
      canSubmitWarehouseUpdates: true,
      canUseAiAssistant: true,
      canBulkTrack: true,
      canViewInternalNotes: true,
      canViewCarrierCredentials: true,
      canReassignShipments: true,
    },
  },
  CONTROL_TOWER_ANALYST: {
    role: 'CONTROL_TOWER_ANALYST',
    label: 'Control Tower Analyst',
    badgeColor: '#424989',
    description: 'Cross-network visibility, delay & SLA risk monitoring, AI-assisted operational search & exceptions.',
    allowedRoutes: [
      '/dashboard',
      '/shipments',
      '/shipments/:id',
      '/bulk-track',
      '/tracking-events',
      '/exceptions',
      '/ai-assistant',
    ],
    permissions: {
      canViewAllShipments: true,
      canViewAssignedOnly: false,
      canViewCustomerOnly: false,
      canViewCarrierOnly: false,
      canViewWarehouseOnly: false,
      canManageUsers: false,
      canViewSystemHealth: true,
      canResolveExceptions: true,
      canProposeEta: false,
      canSubmitWarehouseUpdates: false,
      canUseAiAssistant: true,
      canBulkTrack: true,
      canViewInternalNotes: true,
      canViewCarrierCredentials: false,
      canReassignShipments: true,
    },
  },
  DISPATCHER_PLANNER: {
    role: 'DISPATCHER_PLANNER',
    label: 'Dispatcher / Planner',
    badgeColor: '#18217E',
    description: 'Assigned deliveries, planning routes, tracking events, exceptions & operational assignments.',
    allowedRoutes: [
      '/dashboard',
      '/shipments',
      '/shipments/:id',
      '/bulk-track',
      '/tracking-events',
      '/exceptions',
      '/ai-assistant',
    ],
    permissions: {
      canViewAllShipments: true,
      canViewAssignedOnly: false,
      canViewCustomerOnly: false,
      canViewCarrierOnly: false,
      canViewWarehouseOnly: false,
      canManageUsers: false,
      canViewSystemHealth: false,
      canResolveExceptions: true,
      canProposeEta: true,
      canSubmitWarehouseUpdates: false,
      canUseAiAssistant: true,
      canBulkTrack: true,
      canViewInternalNotes: true,
      canViewCarrierCredentials: false,
      canReassignShipments: true,
    },
  },
  CARRIER: {
    role: 'CARRIER',
    label: 'Carrier Partner',
    badgeColor: '#393A50',
    description: 'Authorized carrier shipments, tracking updates, delay reporting & revised ETA proposals.',
    allowedRoutes: [
      '/dashboard',
      '/shipments',
      '/shipments/:id',
      '/tracking-events',
      '/exceptions',
    ],
    permissions: {
      canViewAllShipments: false,
      canViewAssignedOnly: false,
      canViewCustomerOnly: false,
      canViewCarrierOnly: true,
      canViewWarehouseOnly: false,
      canManageUsers: false,
      canViewSystemHealth: false,
      canResolveExceptions: false,
      canProposeEta: true,
      canSubmitWarehouseUpdates: false,
      canUseAiAssistant: false,
      canBulkTrack: false,
      canViewInternalNotes: false,
      canViewCarrierCredentials: false,
      canReassignShipments: false,
    },
  },
  WAREHOUSE_SUPERVISOR: {
    role: 'WAREHOUSE_SUPERVISOR',
    label: 'Warehouse Supervisor',
    badgeColor: '#8A9995',
    description: 'Warehouse arrivals, departures, readiness, staging delays & warehouse status updates.',
    allowedRoutes: [
      '/dashboard',
      '/shipments',
      '/shipments/:id',
      '/tracking-events',
      '/exceptions',
    ],
    permissions: {
      canViewAllShipments: false,
      canViewAssignedOnly: false,
      canViewCustomerOnly: false,
      canViewCarrierOnly: false,
      canViewWarehouseOnly: true,
      canManageUsers: false,
      canViewSystemHealth: false,
      canResolveExceptions: false,
      canProposeEta: false,
      canSubmitWarehouseUpdates: true,
      canUseAiAssistant: false,
      canBulkTrack: false,
      canViewInternalNotes: true,
      canViewCarrierCredentials: false,
      canReassignShipments: false,
    },
  },
  CUSTOMER_SERVICE: {
    role: 'CUSTOMER_SERVICE',
    label: 'Customer Service user',
    badgeColor: '#424989',
    description: 'Search customer shipments, delivery progress, customer-impacting exceptions & resolution comms.',
    allowedRoutes: [
      '/dashboard',
      '/shipments',
      '/shipments/:id',
      '/bulk-track',
      '/tracking-events',
      '/exceptions',
      '/ai-assistant',
    ],
    permissions: {
      canViewAllShipments: true,
      canViewAssignedOnly: false,
      canViewCustomerOnly: false,
      canViewCarrierOnly: false,
      canViewWarehouseOnly: false,
      canManageUsers: false,
      canViewSystemHealth: false,
      canResolveExceptions: false,
      canProposeEta: false,
      canSubmitWarehouseUpdates: false,
      canUseAiAssistant: true,
      canBulkTrack: true,
      canViewInternalNotes: true,
      canViewCarrierCredentials: false,
      canReassignShipments: false,
    },
  },
  CUSTOMER: {
    role: 'CUSTOMER',
    label: 'Customer',
    badgeColor: '#09104D',
    description: 'Permitted shipment tracking, progress & estimates. Strictly no internal notes or carrier credentials.',
    allowedRoutes: [
      '/dashboard',
      '/shipments',
      '/shipments/:id',
      '/tracking-events',
    ],
    permissions: {
      canViewAllShipments: false,
      canViewAssignedOnly: false,
      canViewCustomerOnly: true,
      canViewCarrierOnly: false,
      canViewWarehouseOnly: false,
      canManageUsers: false,
      canViewSystemHealth: false,
      canResolveExceptions: false,
      canProposeEta: false,
      canSubmitWarehouseUpdates: false,
      canUseAiAssistant: false,
      canBulkTrack: false,
      canViewInternalNotes: false,
      canViewCarrierCredentials: false,
      canReassignShipments: false,
    },
  },
};

export function hasPermission(
  role: UserRole,
  permission: keyof RoleConfig['permissions']
): boolean {
  const config = ROLE_CONFIGS[role];
  if (!config) return false;
  return Boolean(config.permissions[permission]);
}

export function isRouteAllowed(role: UserRole, path: string): boolean {
  const config = ROLE_CONFIGS[role];
  if (!config) return false;
  
  // Exact or wildcard match
  return config.allowedRoutes.some((pattern) => {
    if (pattern === path) return true;
    if (pattern.includes(':id')) {
      const regex = new RegExp(`^${pattern.replace(':id', '[^/]+')}$`);
      return regex.test(path);
    }
    return false;
  });
}
