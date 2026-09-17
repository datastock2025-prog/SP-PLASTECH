import React, { ReactNode } from 'react';
import { Permission, UserRole } from '../types';
import { useAuth } from '../auth/AuthProvider';

export interface RequirePermissionProps {
  permission: Permission | Permission[];
  requireAll?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}

export const RequirePermission: React.FC<RequirePermissionProps> = ({
  permission,
  requireAll = false,
  fallback = null,
  children,
}) => {
  const { hasPermission, user } = useAuth();

  if (!user) return <>{fallback}</>;

  const perms = Array.isArray(permission) ? permission : [permission];
  const hasAccess = requireAll
    ? perms.every((p) => hasPermission(p))
    : perms.some((p) => hasPermission(p));

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export interface RequireRoleProps {
  roles: UserRole | UserRole[];
  fallback?: ReactNode;
  children: ReactNode;
}

export const RequireRole: React.FC<RequireRoleProps> = ({
  roles,
  fallback = null,
  children,
}) => {
  const { hasRole, user } = useAuth();

  if (!user || !hasRole(roles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
