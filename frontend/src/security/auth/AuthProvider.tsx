import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { UserProfile, UserRole, Permission, MfaChallenge } from '../types';
import { secureTokenStorage } from './SecureTokenStorage';
import { sessionManager } from './SessionManager';
import { mfaService } from './MfaService';
import { useMe } from '../../features/identity/useIdentity';
import type { Me } from '../../features/identity/types';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  activeChallenge: MfaChallenge | null;
  mfaChallenge: MfaChallenge | null;
  login: (email: string, password?: string, rememberMe?: boolean) => Promise<{ mfaRequired?: boolean }>;
  verifyMfa: (code: string) => Promise<boolean>;
  verifyMfaChallenge: (challengeId: string, code: string) => Promise<boolean>;
  cancelMfa: () => void;
  cancelMfaChallenge: () => void;
  logout: (reason?: string) => void;
  extendSession: () => void;
  refreshSessionToken: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  startImpersonation: (targetUser: UserProfile) => void;
  stopImpersonation: () => void;
}

const USER_ADMIN_PERMISSIONS = ['users.view', 'users.create', 'users.edit', 'users.delete', 'audit.view'] as Permission[];

const meToProfile = (me: Me): UserProfile => ({
  id: me.id,
  email: me.email,
  fullName: me.fullName,
  tenantId: me.activePlantId ?? 'default',
  tenantName: me.plants.find((p) => p.id === me.activePlantId)?.name ?? 'SP-PLASTECH',
  role: me.roleCode as UserRole,
  permissions: me.roleCode === 'USER_ADMIN' ? USER_ADMIN_PERMISSIONS : [],
  mfaEnabled: false,
  mfaMethods: [],
  lastLoginAt: me.lastLoginAt ?? '',
  lastLoginIp: '',
  sessionExpiry: Date.now() + 15 * 60 * 1000,
});
const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const meQuery = useMe();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [originalUser, setOriginalUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeChallenge, setActiveChallenge] = useState<MfaChallenge | null>(null);

  useEffect(() => {
    setUser(meQuery.data ? meToProfile(meQuery.data) : null);
  }, [meQuery.data]);

  const logout = useCallback((_reason?: string) => {
    secureTokenStorage.clearTokens();
    sessionManager.stopMonitoring();
    setUser(null);
    setOriginalUser(null);
    setActiveChallenge(null);
  }, []);

  useEffect(() => {
    // Start idle session monitoring
    sessionManager.startMonitoring(15);
    const unsubTimeout = sessionManager.subscribeTimeout(() => {
      logout('SESSION_TIMEOUT');
    });

    return () => {
      sessionManager.stopMonitoring();
      unsubTimeout();
    };
  }, [logout]);

  const login = useCallback(async (_email: string, _password?: string, _rememberMe = false) => {
    throw new Error('Use the application login screen.');
  }, []);

  const verifyMfa = useCallback(async (_code: string) => false, []);
  const verifyMfaChallenge = useCallback(async (_challengeId: string, code: string) => {
    return verifyMfa(code);
  }, [verifyMfa]);

  const cancelMfa = useCallback(() => {
    setActiveChallenge(null);
  }, []);

  const cancelMfaChallenge = useCallback(() => {
    setActiveChallenge(null);
  }, []);

  const extendSession = useCallback(() => {
    sessionManager.resetActivityTimer();
    if (user) {
      setUser((prev) => (prev ? { ...prev, sessionExpiry: Date.now() + 15 * 60 * 1000 } : null));
    }
  }, [user]);

  const refreshSessionToken = useCallback(async () => {
    extendSession();
  }, [extendSession]);

  const hasPermission = useCallback((perm: Permission): boolean => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    return user.permissions.includes(perm);
  }, [user]);

  const hasRole = useCallback((roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    const roleList = Array.isArray(roles) ? roles : [roles];
    return roleList.includes(user.role);
  }, [user]);

  const startImpersonation = useCallback((targetUser: UserProfile) => {
    if (!user || user.role !== 'SUPER_ADMIN') return;
    setOriginalUser(user);
    setUser({
      ...targetUser,
      isImpersonated: true,
      impersonatedBy: user.fullName,
    });
  }, [user]);

  const stopImpersonation = useCallback(() => {
    if (originalUser) {
      setUser(originalUser);
      setOriginalUser(null);
    }
  }, [originalUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        activeChallenge,
        mfaChallenge: activeChallenge,
        login,
        verifyMfa,
        verifyMfaChallenge,
        cancelMfa,
        cancelMfaChallenge,
        logout,
        extendSession,
        refreshSessionToken,
        hasPermission,
        hasRole,
        startImpersonation,
        stopImpersonation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
