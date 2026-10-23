import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/src/shared/queryKeys';
import { broadcastLocalMutation } from '@/src/services/realtime/realtimeService';
import { api } from '@/src/lib/api-client';
import {
  MepEquipment,
  MepAlarm,
  MepEnergyReading,
  MepUtilityReading,
  MepWorkOrder,
  MepCleanroomZone,
} from '../model/maintenanceSchemas';

export function useMaintenanceWorkOrders() {
  return useQuery<MepWorkOrder[]>({
    queryKey: queryKeys.maintenance.workOrders(),
    queryFn: async () => {
      try {
        const res = await api.get<any>('/maintenance-work-orders', {
          params: { limit: 100, includeTotal: true },
        });
        const rows = res?.data?.data || res?.data;
        if (Array.isArray(rows)) return rows;
      } catch (e) {
        console.debug('[useMaintenanceWorkOrders] REST query notice:', e);
      }
      return [];
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}

export function useSaveMaintenanceWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (wo: MepWorkOrder) => {
      if (wo.id) {
        try {
          const res = await api.patch<any>(`/maintenance-work-orders/${encodeURIComponent(wo.id)}`, wo);
          if (res?.data) return res.data.data || res.data;
        } catch {}
      } else {
        try {
          const res = await api.post<any>('/maintenance-work-orders', wo);
          if (res?.data) return res.data.data || res.data;
        } catch {}
      }
      return wo;
    },
    onSuccess: (savedWo) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenance.workOrders() });
      queryClient.invalidateQueries({ queryKey: queryKeys.mep.workOrders() });
      broadcastLocalMutation('MAINTENANCE_WORK_ORDERS', 'UPDATE', savedWo);
    },
  });
}

export function useEquipmentAssets() {
  return useQuery<MepEquipment[]>({
    queryKey: queryKeys.maintenance.equipment(),
    queryFn: async () => {
      try {
        const res = await api.get<any>('/machines', {
          params: { limit: 100, includeTotal: true },
        });
        const rows = res?.data?.data || res?.data;
        if (Array.isArray(rows)) return rows;
      } catch (e) {
        console.debug('[useEquipmentAssets] REST query notice:', e);
      }
      return [];
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}

// Backward-compatible hook aliases for legacy useMep callers
export const useMepWorkOrders = useMaintenanceWorkOrders;
export const useSaveMepWorkOrder = useSaveMaintenanceWorkOrder;
export const useMepEquipment = useEquipmentAssets;

export function useMepAlarms() {
  return useQuery<MepAlarm[]>({
    queryKey: queryKeys.mep.alarms(),
    queryFn: async () => [],
    staleTime: 1000 * 30,
  });
}

export function useMepEnergyMeters() {
  return useQuery<MepEnergyReading[]>({
    queryKey: queryKeys.mep.energy(),
    queryFn: async () => [],
    staleTime: 1000 * 30,
  });
}

export function useMepUtilityReadings() {
  return useQuery<MepUtilityReading[]>({
    queryKey: queryKeys.mep.utilities(),
    queryFn: async () => [],
    staleTime: 1000 * 30,
  });
}

export function useMepCleanroomZones() {
  return useQuery<MepCleanroomZone[]>({
    queryKey: queryKeys.mep.cleanrooms(),
    queryFn: async () => [],
    staleTime: 1000 * 30,
  });
}

export function useMolds() {
  return useQuery({
    queryKey: queryKeys.mep.molds(),
    queryFn: async () => [],
    staleTime: 1000 * 60,
  });
}

export function useMaintenance() {
  const { data: workOrders = [], isLoading: isLoadingWO } = useMaintenanceWorkOrders();
  const { data: equipment = [], isLoading: isLoadingEq } = useEquipmentAssets();

  return {
    workOrders,
    equipment,
    isLoading: isLoadingWO || isLoadingEq,
  };
}
