import { create } from 'zustand';

export interface UserProfile {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  permissions?: string[];
  tenantId?: string;
}

export interface AuthState {
  // In-memory access token (Never stored in localStorage to prevent XSS exfiltration)
  accessToken: string | null;
  user: UserProfile | null;
  activeTenantId: string;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setAuth: (user: UserProfile, token: string, tenantId?: string) => void;
  setToken: (token: string) => void;
  setTenantId: (tenantId: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  activeTenantId: typeof window !== 'undefined' ? localStorage.getItem('activeTenantId') || 'TENANT-ALPHA-IND' : 'TENANT-ALPHA-IND',
  isAuthenticated: false,
  isLoading: false,

  setAuth: (user, token, tenantId) => {
    const tid = tenantId || user.tenantId || 'TENANT-ALPHA-IND';
    if (typeof window !== 'undefined') {
      localStorage.setItem('activeTenantId', tid);
    }
    set({
      user,
      accessToken: token,
      activeTenantId: tid,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  setToken: (token: string) => {
    set({ accessToken: token, isAuthenticated: !!token });
  },

  setTenantId: (tenantId: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('activeTenantId', tenantId);
    }
    set({ activeTenantId: tenantId });
  },

  clearAuth: () => {
    set({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  setLoading: (loading: boolean) => set({ isLoading: loading }),
}));
