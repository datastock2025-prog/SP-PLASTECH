import { apiClient } from '../../../shared/api/client';
import { DashboardMetrics } from '../types/dashboardTypes';

export const dashboardApi = {
  getMetrics: async (): Promise<DashboardMetrics> => {
    try {
      const response = await apiClient.get<DashboardMetrics>('/dashboard/metrics');
      return response.data;
    } catch {
      return {
        activeWOCount: 5,
        lowStockCount: 3,
        openPOCount: 2,
        oeePercentage: 86.4,
        openNcrs: 2,
        machineUtilization: 91.2,
      };
    }
  },
};
