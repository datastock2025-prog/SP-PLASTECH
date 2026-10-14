import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboardApi';
import { DashboardMetrics } from '../types/dashboardTypes';

export const DASHBOARD_METRICS_KEY = ['dashboard', 'metrics'];

export function useDashboard() {
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: DASHBOARD_METRICS_KEY,
    queryFn: () => dashboardApi.getMetrics(),
  });

  return {
    metrics: metrics || {
      activeWOCount: 5,
      lowStockCount: 3,
      openPOCount: 2,
      oeePercentage: 86.4,
      openNcrs: 2,
      machineUtilization: 91.2,
    },
    isLoading,
  };
}
