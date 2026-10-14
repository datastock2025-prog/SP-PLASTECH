import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../shared/queryKeys';
import { apiClient } from '../services/api';

export interface GatePass {
  id: string;
  passNumber: string;
  type: 'INWARD' | 'OUTWARD' | 'RETURNABLE';
  vehicleNumber: string;
  transporterName: string;
  driverName?: string;
  driverPhone?: string;
  status: 'PENDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

export interface DeliveryShipment {
  id: string;
  shipmentNumber: string;
  destination: string;
  carrier: string;
  trackingNumber: string;
  status: 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED' | 'DELAYED';
  eta?: string;
}

export function useGatePasses() {
  return useQuery({
    queryKey: queryKeys.scm.gatePasses(),
    queryFn: async () => {
      const response = await apiClient.get<GatePass[]>('/api/v1/scm/gate-passes');
      return response.data || [];
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useSaveGatePass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (pass: Partial<GatePass>) => {
      if (pass.id) {
        const response = await apiClient.put<GatePass>(`/api/v1/scm/gate-passes/${pass.id}`, pass);
        return response.data;
      }
      const response = await apiClient.post<GatePass>('/api/v1/scm/gate-passes', pass);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scm.gatePasses() });
    },
  });
}

export function useDeliveries() {
  return useQuery({
    queryKey: queryKeys.scm.deliveries(),
    queryFn: async () => {
      const response = await apiClient.get<DeliveryShipment[]>('/api/v1/scm/deliveries');
      return response.data || [];
    },
  });
}

export function useControlTowerMetrics() {
  return useQuery({
    queryKey: queryKeys.scm.controlTower(),
    queryFn: async () => {
      const response = await apiClient.get<any>('/api/v1/scm/control-tower');
      return response.data || {};
    },
    staleTime: 1000 * 30, // 30s fast refresh
  });
}
