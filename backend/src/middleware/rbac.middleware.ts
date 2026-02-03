import { Request, Response, NextFunction } from 'express';

/**
 * Role-Based Access Control (RBAC) Middleware
 * Restricts access based on user roles
 */

export type UserRole = 'user' | 'manager' | 'admin';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: UserRole;
  };
}

/**
 * Check if user has required role
 * Hierarchy: admin > manager > user
 */
const roleHierarchy: Record<UserRole, number> = {
  user: 1,
  manager: 2,
  admin: 3,
};

/**
 * Require specific role(s) to access endpoint
 * Usage: requireRole('admin') or requireRole(['admin', 'manager'])
 */
export const requireRole = (allowedRoles: UserRole | UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userRole = req.user?.role;

      if (!userRole) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      
      // Check if user's role is in allowed roles
      if (!roles.includes(userRole)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Insufficient permissions',
          requiredRole: roles,
          userRole,
        });
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({
        error: 'Authorization check failed',
      });
    }
  };
};

/**
 * Require minimum role level
 * Usage: requireMinRole('manager') allows manager and admin
 */
export const requireMinRole = (minRole: UserRole) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userRole = req.user?.role;

      if (!userRole) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      const userRoleLevel = roleHierarchy[userRole];
      const minRoleLevel = roleHierarchy[minRole];

      if (userRoleLevel < minRoleLevel) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Insufficient permissions',
          requiredMinRole: minRole,
          userRole,
        });
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({
        error: 'Authorization check failed',
      });
    }
  };
};

/**
 * Check if user is owner of resource or has admin role
 * Usage: requireOwnerOrAdmin((req) => req.params.userId)
 */
export const requireOwnerOrAdmin = (
  getResourceOwnerId: (req: AuthenticatedRequest) => string
) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      const resourceOwnerId = getResourceOwnerId(req);

      // Allow if user is owner or admin
      if (userId === resourceOwnerId || userRole === 'admin') {
        return next();
      }

      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own resources',
      });
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({
        error: 'Authorization check failed',
      });
    }
  };
};
