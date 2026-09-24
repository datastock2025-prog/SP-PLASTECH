import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { UserProfile, UserRole, Permission, MfaChallenge } from '../types';
import { secureTokenStorage } from './SecureTokenStorage';
import { sessionManager } from './SessionManager';
import { mfaService } from './MfaService';

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

const DEFAULT_ADMIN_USER: UserProfile = {
  id: 'USR-ADMIN-01',
  email: 'security.admin@spplastech.com',
  fullName: 'Dr. Evelyn Reed',
  tenantId: 'TENANT-ALPHA-IND',
  tenantName: 'SP-PLASTECH Polymer Solutions Ltd.',
  role: 'SUPER_ADMIN',
  permissions: [
    'users.view', 'users.create', 'users.edit', 'users.delete', 'users.impersonate',
    'roles.manage', 'tenant.config', 'audit.view', 'audit.export',
    'finance.view', 'finance.create', 'finance.edit', 'finance.delete', 'finance.approve', 'finance.export',
    'payroll.view', 'payroll.process', 'sales.view', 'sales.create', 'sales.edit', 'sales.delete', 'sales.approve', 'sales.export',
    'procurement.view', 'procurement.create', 'procurement.edit', 'procurement.delete', 'procurement.approve',
    'mfg.view', 'mfg.plan', 'mfg.schedule', 'mfg.execute', 'mfg.abort',
    'quality.view', 'quality.inspect', 'quality.release', 'quality.reject', 'quality.ncr',
    'warehouse.view', 'warehouse.transfer', 'warehouse.dispatch', 'warehouse.receive', 'warehouse.reconcile', 'warehouse.audit',
    'reports.view', 'reports.export', 'reports.sensitive', 'compliance.manage'
  ],
  mfaEnabled: true,
  mfaMethods: ['TOTP', 'EMAIL'],
  lastLoginAt: '2026-09-17 09:30:15 IST',
  lastLoginIp: '103.21.144.68 (Corporate VPN)',
  sessionExpiry: Date.now() + 15 * 60 * 1000,
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(DEFAULT_ADMIN_USER);
  const [originalUser, setOriginalUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeChallenge, setActiveChallenge] = useState<MfaChallenge | null>(null);

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

  const login = useCallback(async (email: string, password?: string, rememberMe = false) => {
    setIsLoading(true);
    try {
      // Simulate backend authentication
      secureTokenStorage.setAccessToken('jwt_access_token_secure_mem', rememberMe ? 604800 : 900);
      const challenge = mfaService.createStepUpChallenge('Login Authentication');
      setActiveChallenge(challenge);
      return { mfaRequired: true };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyMfa = useCallback(async (code: string) => {
    const isValid = await mfaService.verifyTotpCode(code);
    if (isValid) {
      setUser(DEFAULT_ADMIN_USER);
      setActiveChallenge(null);
      sessionManager.resetActivityTimer();
      return true;
    }
    return false;
  }, []);

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
