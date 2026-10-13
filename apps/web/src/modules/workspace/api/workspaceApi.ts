import { apiClient } from '@/src/shared/api/client';
import type {
  TaskContract,
  CreateTaskContract,
  UpdateTaskContract,
  ApprovalContract,
  NotificationContract,
  SavedPresetContract,
} from '../model/workspaceSchemas';

export const workspaceApi = {
  getTasks: async (status?: string): Promise<TaskContract[]> => {
    return apiClient.get<TaskContract[]>('/api/v1/workspace/tasks', { params: { status } });
  },

  createTask: async (input: CreateTaskContract): Promise<TaskContract> => {
    return apiClient.post<TaskContract>('/api/v1/workspace/tasks', input);
  },

  updateTask: async (id: string, input: UpdateTaskContract): Promise<TaskContract> => {
    return apiClient.patch<TaskContract>(`/api/v1/workspace/tasks/${id}`, input);
  },

  getApprovals: async (status?: string): Promise<ApprovalContract[]> => {
    return apiClient.get<ApprovalContract[]>('/api/v1/workspace/approvals', { params: { status } });
  },

  decideApproval: async (id: string, decision: 'APPROVED' | 'REJECTED', comments?: string): Promise<ApprovalContract> => {
    return apiClient.post<ApprovalContract>(`/api/v1/workspace/approvals/${id}/decision`, { decision, comments });
  },

  getNotifications: async (): Promise<NotificationContract[]> => {
    return apiClient.get<NotificationContract[]>('/api/v1/workspace/notifications');
  },

  markNotificationAsRead: async (id: string): Promise<void> => {
    return apiClient.patch<void>(`/api/v1/workspace/notifications/${id}/read`, {});
  },

  getSavedPresets: async (view?: string): Promise<SavedPresetContract[]> => {
    return apiClient.get<SavedPresetContract[]>('/api/v1/workspace/presets', { params: { view } });
  },
};
