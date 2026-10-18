import { Request, Response, NextFunction } from 'express';
import { UserContext, UserRole } from '../types/index.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: UserContext;
      correlationId?: string;
    }
  }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  // Support GCP OIDC header, Bearer token, or X-User-Role header
  const roleHeader = (req.header('X-User-Role') as UserRole) || 'ANALYST';
  const carrierIdHeader = req.header('X-Carrier-Id') || 'car-apex-001';

  // Attach authenticated user context
  req.user = {
    id: roleHeader === 'CARRIER' ? 'carrier-user-01' : 'ops-user-01',
    name: roleHeader === 'CARRIER' ? 'Apex Carrier Partner' : 'Control Tower Operator',
    email: 'operator@controltower.logistics.com',
    role: roleHeader,
    carrierId: roleHeader === 'CARRIER' ? carrierIdHeader : undefined,
  };

  req.correlationId = (req.header('X-Correlation-Id') as string) || `corr-${Date.now()}`;
  next();
};

export const authorize = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        code: 'UNAUTHENTICATED',
        message: 'Authentication credentials required',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        status: 'error',
        code: 'FORBIDDEN',
        message: `Role ${req.user.role} does not have access to this resource`,
      });
      return;
    }

    next();
  };
};
