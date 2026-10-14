import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../shared/queryKeys';
import { apiClient } from '../services/api';

export interface JitScheduleItem {
  id: string;
  plantId: string;
  itemCode: string;
  plannedQty: number;
  scheduledDate: string;
  shift: string;
  machineId: string;
  status: 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'DELAYED';
}

export interface MrpRun {
  id: string;
  runDate: string;
  plantId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  suggestedPoCount: number;
  suggestedWoCount: number;
}

export function useJitSchedule(plantId?: string) {
  return useQuery({
    queryKey: queryKeys.planning.jitSchedule(plantId),
    queryFn: async () => {
      const response = await apiClient.get<JitScheduleItem[]>('/api/v1/planning/jit-schedule', {
        params: plantId ? { plantId } : undefined,
      });
      return response.data || [];
    },
    staleTime: 1000 * 60 * 3,
  });
}

export function useMrpRuns() {
  return useQuery({
    queryKey: queryKeys.planning.mrpRuns(),
    queryFn: async () => {
      const response = await apiClient.get<MrpRun[]>('/api/v1/planning/mrp-runs');
      return response.data || [];
    },
  });
}

export function useTriggerMrpRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { plantId: string; runType?: string }) => {
      const response = await apiClient.post<MrpRun>('/api/v1/planning/mrp-runs/execute', params);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.planning.mrpRuns() });
      queryClient.invalidateQueries({ queryKey: queryKeys.procurement.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.manufacturing.all });
    },
  });
}

export function useDemandForecast() {
  return useQuery({
    queryKey: queryKeys.planning.demandForecast(),
    queryFn: async () => {
      const response = await apiClient.get<any[]>('/api/v1/planning/forecast');
      return response.data || [];
    },
  });
}
