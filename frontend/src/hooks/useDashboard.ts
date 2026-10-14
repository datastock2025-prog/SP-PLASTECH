import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../shared/queryKeys';
import { apiClient } from '../services/api';

export interface DashboardKpis {
  activeWorkOrders: number;
  overallOee: number;
  onTimeDeliveryRate: number;
  firstPassYield: number;
  lowStockItemsCount: number;
  activeAlarmsCount: number;
  openCapasCount: number;
  revenueMtd: number;
}

export function useDashboardKpis(plantId?: string) {
  return useQuery({
    queryKey: queryKeys.dashboard.kpis(plantId),
    queryFn: async () => {
      const response = await apiClient.get<DashboardKpis>('/api/v1/dashboard/kpis', {
        params: plantId ? { plantId } : undefined,
      });
      return response.data || {
        activeWorkOrders: 0,
        overallOee: 0,
        onTimeDeliveryRate: 0,
        firstPassYield: 0,
        lowStockItemsCount: 0,
        activeAlarmsCount: 0,
        openCapasCount: 0,
        revenueMtd: 0,
      };
    },
    staleTime: 1000 * 60, // 1 minute stale time
    refetchInterval: 1000 * 60 * 2, // Auto poll every 2 min
  });
}

export function usePendingApprovals() {
  return useQuery({
    queryKey: queryKeys.dashboard.approvals(),
    queryFn: async () => {
      const response = await apiClient.get<any[]>('/api/v1/dashboard/approvals');
      return response.data || [];
    },
  });
}

export function useSystemNotifications() {
  return useQuery({
    queryKey: queryKeys.dashboard.notifications(),
    queryFn: async () => {
      const response = await apiClient.get<any[]>('/api/v1/dashboard/notifications');
      return response.data || [];
    },
    refetchInterval: 1000 * 30, // 30s notifications poll
  });
}
