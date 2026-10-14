import React, { ReactNode } from 'react';
import { Permission, UserRole } from '../types';
import { useAuth } from '../auth/AuthProvider';
import { AccessDeniedPage } from '../ui/AccessDeniedPage';

export interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: Permission;
  requiredRole?: UserRole | UserRole[];
  onNavigateLogin?: () => void;
  onNavigateHome?: () => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requiredRole,
  onNavigateLogin,
  onNavigateHome,
}) => {
  const { user, isAuthenticated, hasPermission, hasRole } = useAuth();

  if (!isAuthenticated || !user) {
    if (onNavigateLogin) {
      onNavigateLogin();
      return null;
    }
    return (
      <AccessDeniedPage
        requiredPermission="Authentication Required"
        onNavigateHome={onNavigateHome}
      />
    );
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <AccessDeniedPage
        requiredPermission={requiredPermission}
        onNavigateHome={onNavigateHome}
      />
    );
  }

  if (requiredRole && !hasRole(requiredRole)) {
    const rolesStr = Array.isArray(requiredRole) ? requiredRole.join(' or ') : requiredRole;
    return (
      <AccessDeniedPage
        requiredRole={rolesStr}
        onNavigateHome={onNavigateHome}
      />
    );
  }

  return <>{children}</>;
};
