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
    const res = await apiClient.get<TaskContract[]>('/api/v1/workspace/tasks', { params: { status } });
    return res.data || [];
  },

  createTask: async (input: CreateTaskContract): Promise<TaskContract> => {
    const res = await apiClient.post<TaskContract>('/api/v1/workspace/tasks', input);
    return res.data;
  },

  updateTask: async (id: string, input: UpdateTaskContract): Promise<TaskContract> => {
    const res = await apiClient.patch<TaskContract>(`/api/v1/workspace/tasks/${id}`, input);
    return res.data;
  },

  getApprovals: async (status?: string): Promise<ApprovalContract[]> => {
    const res = await apiClient.get<ApprovalContract[]>('/api/v1/workspace/approvals', { params: { status } });
    return res.data || [];
  },

  decideApproval: async (id: string, decision: 'APPROVED' | 'REJECTED', comments?: string): Promise<ApprovalContract> => {
    const res = await apiClient.post<ApprovalContract>(`/api/v1/workspace/approvals/${id}/decision`, { decision, comments });
    return res.data;
  },

  getNotifications: async (): Promise<NotificationContract[]> => {
    const res = await apiClient.get<NotificationContract[]>('/api/v1/workspace/notifications');
    return res.data || [];
  },

  markNotificationAsRead: async (id: string): Promise<void> => {
    await apiClient.patch<void>(`/api/v1/workspace/notifications/${id}/read`, {});
  },

  getSavedPresets: async (view?: string): Promise<SavedPresetContract[]> => {
    const res = await apiClient.get<SavedPresetContract[]>('/api/v1/workspace/presets', { params: { view } });
    return res.data || [];
  },
};
