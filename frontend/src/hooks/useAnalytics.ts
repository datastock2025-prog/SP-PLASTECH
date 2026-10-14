import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../shared/queryKeys';
import { apiClient } from '../services/api';

export interface OeeMetric {
  machineId: string;
  machineName: string;
  availability: number;
  performance: number;
  quality: number;
  oee: number;
  timestamp: string;
}

export function useOeeStream(plantId?: string) {
  return useQuery({
    queryKey: queryKeys.analytics.oeeStream(plantId),
    queryFn: async () => {
      const response = await apiClient.get<OeeMetric[]>('/api/v1/analytics/oee', {
        params: plantId ? { plantId } : undefined,
      });
      return response.data || [];
    },
    staleTime: 1000 * 15,
    refetchInterval: 1000 * 30, // 30 second live telemetry poll
  });
}

export function useKpiReports(filter?: any) {
  return useQuery({
    queryKey: queryKeys.analytics.kpiReports(),
    queryFn: async () => {
      const response = await apiClient.get<any[]>('/api/v1/analytics/reports', { params: filter });
      return response.data || [];
    },
  });
}
