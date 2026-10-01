import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../shared/queryKeys';
import { apiClient } from '../services/api';

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  tenantId: string;
  plantId?: string;
  isActive: boolean;
  lastLoginAt?: string;
}

export function useAdminUsers() {
  return useQuery({
    queryKey: queryKeys.admin.users(),
    queryFn: async () => {
      const response = await apiClient.get<AdminUser[]>('/api/v1/admin/users');
      return response.data || [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (user: Partial<AdminUser>) => {
      if (user.id) {
        const response = await apiClient.put<AdminUser>(`/api/v1/admin/users/${user.id}`, user);
        return response.data;
      }
      const response = await apiClient.post<AdminUser>('/api/v1/admin/users', user);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users() });
    },
  });
}

export function useAuditLogs(filter?: any) {
  return useQuery({
    queryKey: queryKeys.admin.auditLogs(filter),
    queryFn: async () => {
      const response = await apiClient.get<any[]>('/api/v1/admin/audit-logs', { params: filter });
      return response.data || [];
    },
  });
}

export function useSystemSettings() {
  return useQuery({
    queryKey: queryKeys.admin.systemSettings(),
    queryFn: async () => {
      const response = await apiClient.get<Record<string, any>>('/api/v1/admin/system-settings');
      return response.data || {};
    },
  });
}

export function useUpdateSystemSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settings: Record<string, any>) => {
      const response = await apiClient.put<Record<string, any>>('/api/v1/admin/system-settings', settings);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.systemSettings() });
    },
  });
}
