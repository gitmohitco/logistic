import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, UserProfile } from '../../types';
import { ROLE_CONFIGS, hasPermission, isRouteAllowed } from '../../config/roles';

export const ROLE_PRESET_USERS: Record<UserRole, UserProfile> = {
  ADMINISTRATOR: {
    id: 'usr-admin-01',
    name: 'Marcus Vance',
    email: 'm.vance@controltower.enterprise.com',
    role: 'ADMINISTRATOR',
  },
  CONTROL_TOWER_ANALYST: {
    id: 'usr-analyst-02',
    name: 'Eleanor Vance',
    email: 'e.vance@controltower.enterprise.com',
    role: 'CONTROL_TOWER_ANALYST',
  },
  DISPATCHER_PLANNER: {
    id: 'usr-planner-03',
    name: 'Dave Holloway',
    email: 'd.holloway@controltower.enterprise.com',
    role: 'DISPATCHER_PLANNER',
  },
  CARRIER: {
    id: 'usr-carrier-04',
    name: 'Elena Rostova',
    email: 'elena@apexlogistics.com',
    role: 'CARRIER',
    carrierId: 'CAR-001',
    carrierName: 'Apex Intermodal Logistics',
  },
  WAREHOUSE_SUPERVISOR: {
    id: 'usr-wh-05',
    name: 'Tariq Al-Mansoor',
    email: 't.mansoor@chicago-hub.com',
    role: 'WAREHOUSE_SUPERVISOR',
    warehouseId: 'WH-ORD-01',
    warehouseName: 'Chicago Central Logistics Hub',
  },
  CUSTOMER_SERVICE: {
    id: 'usr-cs-06',
    name: 'Chloe Bennet',
    email: 'c.bennet@support.controltower.com',
    role: 'CUSTOMER_SERVICE',
  },
  CUSTOMER: {
    id: 'usr-cust-07',
    name: 'Jordan Smith',
    email: 'j.smith@biomedics.com',
    role: 'CUSTOMER',
    customerId: 'CUST-BIOMED',
    customerName: 'BioMedics Global Logistics',
  },
};

interface AuthContextType {
  user: UserProfile;
  role: UserRole;
  isAuthenticated: boolean;
  loginAsRole: (role: UserRole) => void;
  logout: () => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  changePassword: (currentPass: string, newPass: string) => { success: boolean; error?: string };
  checkPermission: (permission: keyof (typeof ROLE_CONFIGS)['ADMINISTRATOR']['permissions']) => boolean;
  canAccessRoute: (path: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'control_tower_authenticated_user_role';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY) as UserRole;
    if (saved && ROLE_CONFIGS[saved]) {
      return saved;
    }
    return 'CONTROL_TOWER_ANALYST';
  });

  const [user, setUser] = useState<UserProfile>(() => {
    const savedCustom = localStorage.getItem(`control_tower_profile_${role}`);
    if (savedCustom) {
      try {
        return JSON.parse(savedCustom);
      } catch {}
    }
    return ROLE_PRESET_USERS[role];
  });

  useEffect(() => {
    const savedCustom = localStorage.getItem(`control_tower_profile_${role}`);
    if (savedCustom) {
      try {
        setUser(JSON.parse(savedCustom));
        localStorage.setItem(AUTH_STORAGE_KEY, role);
        localStorage.setItem('logistics_active_role', role);
        return;
      } catch {}
    }
    setUser(ROLE_PRESET_USERS[role]);
    localStorage.setItem(AUTH_STORAGE_KEY, role);
    localStorage.setItem('logistics_active_role', role);
  }, [role]);

  const loginAsRole = (newRole: UserRole) => {
    setRole(newRole);
  };

  const logout = () => {
    // Default fallback to analyst or prompt login
    setRole('CUSTOMER');
  };

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem(`control_tower_profile_${role}`, JSON.stringify(updated));
      return updated;
    });
  };

  const changePassword = (currentPass: string, newPass: string): { success: boolean; error?: string } => {
    if (!currentPass || currentPass.trim().length === 0) {
      return { success: false, error: 'Current password is required.' };
    }
    if (!newPass || newPass.length < 8) {
      return { success: false, error: 'New password must be at least 8 characters long.' };
    }
    localStorage.setItem(`control_tower_pwd_changed_${user.id}`, new Date().toISOString());
    return { success: true };
  };

  const checkPermission = (permission: keyof (typeof ROLE_CONFIGS)['ADMINISTRATOR']['permissions']) => {
    return hasPermission(role, permission);
  };

  const canAccessRoute = (path: string) => {
    return isRouteAllowed(role, path);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: true,
        loginAsRole,
        logout,
        updateUserProfile,
        changePassword,
        checkPermission,
        canAccessRoute,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
