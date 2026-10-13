import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/src/shared/queryKeys';
import { workspaceApi } from './workspaceApi';
import type {
  CreateTaskContract,
  UpdateTaskContract,
} from '../model/workspaceSchemas';

export function useWorkspaceTasks(status?: string) {
  return useQuery({
    queryKey: queryKeys.workspace.tasks(status),
    queryFn: () => workspaceApi.getTasks(status),
    staleTime: 1000 * 30,
  });
}

export function useCreateWorkspaceTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskContract) => workspaceApi.createTask(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspace.tasks() });
    },
  });
}

export function useUpdateWorkspaceTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTaskContract }) =>
      workspaceApi.updateTask(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspace.tasks() });
    },
  });
}

export function useWorkspaceApprovals(status?: string) {
  return useQuery({
    queryKey: queryKeys.workspace.approvals(status),
    queryFn: () => workspaceApi.getApprovals(status),
    staleTime: 1000 * 30,
  });
}

export function useDecideWorkspaceApproval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      decision,
      comments,
    }: {
      id: string;
      decision: 'APPROVED' | 'REJECTED';
      comments?: string;
    }) => workspaceApi.decideApproval(id, decision, comments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspace.approvals() });
    },
  });
}

export function useWorkspaceNotifications() {
  return useQuery({
    queryKey: queryKeys.workspace.notifications(),
    queryFn: () => workspaceApi.getNotifications(),
    staleTime: 1000 * 60,
  });
}

export function useWorkspacePresets(view?: string) {
  return useQuery({
    queryKey: queryKeys.workspace.presets(view),
    queryFn: () => workspaceApi.getSavedPresets(view),
    staleTime: 1000 * 60 * 5,
  });
}
