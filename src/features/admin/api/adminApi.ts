import { apiClient } from '../../../shared/api/client';
import { DEMO_USERS } from '../../../data/authUsers';
import { AuthUser } from '../../../types';

export const adminApi = {
  getUsers: async (): Promise<AuthUser[]> => {
    try {
      const response = await apiClient.get<AuthUser[]>('/admin/users');
      return response.data;
    } catch {
      return DEMO_USERS;
    }
  },
};
