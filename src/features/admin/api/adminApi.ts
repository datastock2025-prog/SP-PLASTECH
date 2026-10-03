import { apiClient } from '../../../shared/api/client';
import { AuthUser } from '../../../types';
import {
  AdminUser,
  AdminRole,
  PlantDetails,
  NumberingSequence,
  ApprovalWorkflow,
  SystemParameter,
  AdminSystemHealth,
} from '../../../types/admin';

export const adminApi = {
  // Users
  getUsers: async (filters?: Record<string, any>): Promise<AdminUser[]> => {
    const response = await apiClient.get<AdminUser[]>('/admin/users', { params: filters });
    return response.data || [];
  },
  getUserById: async (id: string): Promise<AdminUser> => {
    const response = await apiClient.get<AdminUser>(`/admin/users/${id}`);
    return response.data;
  },
  createUser: async (user: Partial<AdminUser>): Promise<AdminUser> => {
    const response = await apiClient.post<AdminUser>('/admin/users', user);
    return response.data;
  },
  updateUser: async (id: string, user: Partial<AdminUser>): Promise<AdminUser> => {
    const response = await apiClient.put<AdminUser>(`/admin/users/${id}`, user);
    return response.data;
  },
  deleteUser: async (id: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete<{ success: boolean }>(`/admin/users/${id}`);
    return response.data;
  },

  // Roles & Permissions
  getRoles: async (): Promise<AdminRole[]> => {
    const response = await apiClient.get<AdminRole[]>('/admin/roles');
    return response.data || [];
  },
  createRole: async (role: Partial<AdminRole>): Promise<AdminRole> => {
    const response = await apiClient.post<AdminRole>('/admin/roles', role);
    return response.data;
  },
  updateRole: async (id: string, role: Partial<AdminRole>): Promise<AdminRole> => {
    const response = await apiClient.put<AdminRole>(`/admin/roles/${id}`, role);
    return response.data;
  },
  deleteRole: async (id: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete<{ success: boolean }>(`/admin/roles/${id}`);
    return response.data;
  },

  // Plants & Organization
  getPlants: async (): Promise<PlantDetails[]> => {
    const response = await apiClient.get<PlantDetails[]>('/admin/plants');
    return response.data || [];
  },
  savePlant: async (plant: Partial<PlantDetails>): Promise<PlantDetails> => {
    if (plant.id) {
      const response = await apiClient.put<PlantDetails>(`/admin/plants/${plant.id}`, plant);
      return response.data;
    }
    const response = await apiClient.post<PlantDetails>('/admin/plants', plant);
    return response.data;
  },

  // Health Metrics
  getHealthMetrics: async (): Promise<AdminSystemHealth> => {
    const response = await apiClient.get<AdminSystemHealth>('/admin/health-metrics');
    return response.data;
  },

  // Numbering Sequences
  getNumberingSequences: async (): Promise<NumberingSequence[]> => {
    const response = await apiClient.get<NumberingSequence[]>('/admin/numbering-series');
    return response.data || [];
  },
  saveNumberingSequence: async (seq: Partial<NumberingSequence>): Promise<NumberingSequence> => {
    if (seq.id) {
      const response = await apiClient.put<NumberingSequence>(`/admin/numbering-series/${seq.id}`, seq);
      return response.data;
    }
    const response = await apiClient.post<NumberingSequence>('/admin/numbering-series', seq);
    return response.data;
  },

  // Workflows
  getWorkflows: async (): Promise<ApprovalWorkflow[]> => {
    const response = await apiClient.get<ApprovalWorkflow[]>('/admin/approval-workflows');
    return response.data || [];
  },
  saveWorkflow: async (wf: Partial<ApprovalWorkflow>): Promise<ApprovalWorkflow> => {
    if (wf.id) {
      const response = await apiClient.put<ApprovalWorkflow>(`/admin/approval-workflows/${wf.id}`, wf);
      return response.data;
    }
    const response = await apiClient.post<ApprovalWorkflow>('/admin/approval-workflows', wf);
    return response.data;
  },

  // System Parameters
  getSystemParameters: async (): Promise<SystemParameter[]> => {
    const response = await apiClient.get<SystemParameter[]>('/admin/system-parameters');
    return response.data || [];
  },
  saveSystemParameter: async (param: Partial<SystemParameter>): Promise<SystemParameter> => {
    if (param.id) {
      const response = await apiClient.put<SystemParameter>(`/admin/system-parameters/${param.id}`, param);
      return response.data;
    }
    const response = await apiClient.post<SystemParameter>('/admin/system-parameters', param);
    return response.data;
  },
};
