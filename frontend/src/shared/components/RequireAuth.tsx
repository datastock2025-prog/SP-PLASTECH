import React, { createContext, useContext } from 'react';
import { AuthUser } from '../../types';

export type UserRole =
  | 'admin'
  | 'user'
  | 'manager'
  | 'operator'
  | 'supervisor'
  | 'quality'
  | 'maintenance'
  | 'engineer'
  | string;

export interface AuthContextValue {
  currentUser: AuthUser | null;
  setCurrentUser?: (user: AuthUser | null) => void;
}

export const AuthContext = createContext<AuthContextValue>({
  currentUser: null,
});

/** Hook to access current authenticated user in any component */
export const useAuthContext = () => useContext(AuthContext);

export interface RequireAuthProps {
  /**
   * Array of authorized roles e.g. ['admin', 'user']
   * If omitted, any authenticated user is permitted.
   */
  roles?: (UserRole | string)[];
  /**
   * Optional direct user reference.
   * If omitted, reads currentUser from AuthContext.
   */
  currentUser?: AuthUser | { role: string; [key: string]: any } | null;
  /** Content rendered when the user meets role requirements */
  children: React.ReactNode;
  /** Fallback element rendered if user is unauthorized (defaults to null) */
  fallback?: React.ReactNode;
}

/**
 * Role-Based UI Guard (<RequireAuth roles={['admin', 'user']}>)
 *
 * Enforces role-based security directives across both views and granular UI controls
 * (such as approve buttons, configuration tabs, and deletion modals).
 *
 * - Reads authenticated user from AuthContext or optional currentUser prop.
 * - Compares user role against permitted roles with case-insensitivity.
 * - 'admin' super-users automatically pass all standard role checks.
 * - Generalized 'user' role permits all authenticated plant personnel.
 * - Never renders unauthorized elements into the DOM tree (zero DOM leakage).
 */
export const RequireAuth: React.FC<RequireAuthProps> = ({
  roles,
  currentUser: propUser,
  children,
  fallback = null,
}) => {
  const context = useContext(AuthContext);
  const activeUser = propUser !== undefined ? propUser : context.currentUser;

  // 1. Unauthenticated check
  if (!activeUser) {
    return <>{fallback}</>;
  }

  // 2. Open to all authenticated users if no specific roles required
  if (!roles || roles.length === 0) {
    return <>{children}</>;
  }

  // 3. Normalize roles for comparison
  const rawRole = (activeUser.role || '').toLowerCase();

  const hasPermission = roles.some((targetRole) => {
    const target = targetRole.toLowerCase();

    // Exact role match
    if (rawRole === target) return true;

    // Super-user Admin privilege
    if (rawRole === 'admin' || rawRole.includes('director') || rawRole === 'superadmin') {
      return true;
    }

    // Generic 'user' requirement: satisfies any authenticated role
    if (target === 'user' && rawRole !== 'anonymous' && rawRole.length > 0) {
      return true;
    }

    // Common ERP role keyword checks (e.g. 'quality' matches 'Quality Manager')
    if (rawRole.includes(target)) {
      return true;
    }

    return false;
  });

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default RequireAuth;
