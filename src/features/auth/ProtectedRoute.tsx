import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { ROLE_CONFIGS } from '../../config/roles';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<keyof typeof ROLE_CONFIGS>;
  requiredPermission?: keyof (typeof ROLE_CONFIGS)['ADMINISTRATOR']['permissions'];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requiredPermission,
}) => {
  const { role, checkPermission } = useAuth();
  const location = useLocation();

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/access-denied" state={{ from: location.pathname, role }} replace />;
  }

  if (requiredPermission && !checkPermission(requiredPermission)) {
    return <Navigate to="/access-denied" state={{ from: location.pathname, role }} replace />;
  }

  return <>{children}</>;
};

export const RoleGuard: React.FC<{
  permission?: keyof (typeof ROLE_CONFIGS)['ADMINISTRATOR']['permissions'];
  roles?: Array<keyof typeof ROLE_CONFIGS>;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}> = ({ permission, roles, fallback = null, children }) => {
  const { role, checkPermission } = useAuth();

  if (roles && !roles.includes(role)) {
    return <>{fallback}</>;
  }

  if (permission && !checkPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
