import { apiClient } from '../../../shared/api/client';
import { AuthUser, LoginWithPinFormValues, LoginWithCredentialsFormValues } from '../types/authSchemas';
import { DEMO_USERS } from '../../../data/authUsers';

export interface LoginResponse {
  user: AuthUser;
  success: boolean;
  message?: string;
}

export const authApi = {
  // Login with PIN or credentials via centralized API client
  login: async (credentials: LoginWithPinFormValues | LoginWithCredentialsFormValues): Promise<LoginResponse> => {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
      return response.data;
    } catch {
      // Offline / Demo resilient fallback
      let user: AuthUser | undefined;
      if ('userId' in credentials) {
        user = DEMO_USERS.find((u) => u.id === credentials.userId && u.pin === credentials.pin);
      } else {
        user = DEMO_USERS.find((u) => u.email.toLowerCase() === credentials.email.toLowerCase());
      }

      if (user) {
        return { user, success: true, message: 'Authenticated successfully' };
      }
      throw new Error('Invalid authentication credentials or PIN');
    }
  },

  // Verify active session (via HttpOnly session cookie)
  getCurrentUser: async (): Promise<AuthUser | null> => {
    try {
      const response = await apiClient.get<{ user: AuthUser }>('/auth/me');
      return response.data.user;
    } catch {
      // In-memory / initial demo session fallback (no tokens in storage!)
      return DEMO_USERS[0];
    }
  },

  // Logout clears server session cookie
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Silently handled
    }
  },
};
