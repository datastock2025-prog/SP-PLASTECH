import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../shared/queryKeys';
import { apiClient } from '../services/api';

export interface MoldRecord {
  id: string;
  moldCode: string;
  moldName: string;
  cavityCount: number;
  totalShotCount: number;
  maxShotLife: number;
  status: 'ACTIVE' | 'MAINTENANCE' | 'QUARANTINE' | 'RETIRED';
  lastMaintainedAt?: string;
}

export interface MaintenanceWorkOrder {
  id: string;
  mwoNumber: string;
  equipmentType: 'MOLD' | 'MACHINE' | 'UTILITY';
  equipmentId: string;
  type: 'PREVENTIVE' | 'BREAKDOWN' | 'CALIBRATION';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  assignedTo?: string;
}

export function useMolds() {
  return useQuery({
    queryKey: queryKeys.mep.molds(),
    queryFn: async () => {
      const response = await apiClient.get<MoldRecord[]>('/api/v1/mep/molds');
      return response.data || [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveMold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mold: Partial<MoldRecord>) => {
      if (mold.id) {
        const response = await apiClient.put<MoldRecord>(`/api/v1/mep/molds/${mold.id}`, mold);
        return response.data;
      }
      const response = await apiClient.post<MoldRecord>('/api/v1/mep/molds', mold);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mep.molds() });
    },
  });
}

export function useMepWorkOrders() {
  return useQuery({
    queryKey: queryKeys.mep.workOrders(),
    queryFn: async () => {
      const response = await apiClient.get<MaintenanceWorkOrder[]>('/api/v1/mep/work-orders');
      return response.data || [];
    },
  });
}

export function useSaveMepWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mwo: Partial<MaintenanceWorkOrder>) => {
      if (mwo.id) {
        const response = await apiClient.put<MaintenanceWorkOrder>(`/api/v1/mep/work-orders/${mwo.id}`, mwo);
        return response.data;
      }
      const response = await apiClient.post<MaintenanceWorkOrder>('/api/v1/mep/work-orders', mwo);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mep.workOrders() });
    },
  });
}
