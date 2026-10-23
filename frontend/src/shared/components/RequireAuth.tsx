import React, { createContext, useContext } from 'react';
import { AuthUser } from '../../types';
import { useCan } from '../providers/AbilityProvider';

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
  /** Optional CASL action check */
  action?: string;
  /** Optional CASL subject check */
  subject?: string;
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

export const RequireAuth: React.FC<RequireAuthProps> = ({
  roles,
  action,
  subject,
  currentUser: propUser,
  children,
  fallback = null,
}) => {
  const context = useContext(AuthContext);
  const activeUser = propUser !== undefined ? propUser : context.currentUser;
  const can = useCan();

  // 1. Unauthenticated check
  if (!activeUser) {
    return <>{fallback}</>;
  }

  // 2. CASL Ability check if action & subject are specified
  if (action && subject) {
    if (can(action, subject)) {
      return <>{children}</>;
    }
    return <>{fallback}</>;
  }

  // 3. Open to all authenticated users if no specific roles required
  if (!roles || roles.length === 0) {
    return <>{children}</>;
  }

  // 4. Exact role comparison (no loose includes or director string matching)
  const rawRole = (activeUser.role || '').toLowerCase();

  const hasPermission = roles.some((targetRole) => {
    const target = targetRole.toLowerCase();

    // Exact role match
    if (rawRole === target) return true;

    // Super-user Admin privilege
    if (rawRole === 'super_admin' || rawRole === 'admin') {
      return true;
    }

    // Generic 'user' requirement: satisfies any authenticated role
    if (target === 'user' && rawRole !== 'anonymous' && rawRole.length > 0) {
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
