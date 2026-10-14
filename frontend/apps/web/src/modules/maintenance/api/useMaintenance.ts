import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/src/shared/queryKeys';
import { broadcastLocalMutation } from '@/src/services/realtime/realtimeService';
import { db } from '@/src/shared/db';
import {
  MepEquipment,
  MepAlarm,
  MepEnergyReading,
  MepUtilityReading,
  MepWorkOrder,
  MepCleanroomZone,
} from '../model/maintenanceSchemas';
import {
  INITIAL_MEP_EQUIPMENT,
  INITIAL_MEP_ALARMS,
  INITIAL_MEP_ENERGY_METERS,
  INITIAL_MEP_UTILITY_READINGS,
  INITIAL_MEP_WORK_ORDERS,
  INITIAL_MEP_CLEANROOM_ZONES,
} from '@/src/data/mepData';
import { maintenanceApi } from './maintenanceApi';

export function useMaintenanceWorkOrders() {
  return useQuery<MepWorkOrder[]>({
    queryKey: queryKeys.maintenance.workOrders(),
    queryFn: async () => {
      try {
        const res = await db.findMany<MepWorkOrder>('maintenance_work_orders', {
          orderBy: { column: 'due_date', ascending: true },
          limit: 100,
        });
        if (Array.isArray(res) && res.length > 0) return res;
      } catch (e) {
        console.debug('[useMaintenanceWorkOrders] fallback note:', e);
      }
      return INITIAL_MEP_WORK_ORDERS;
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}

export function useSaveMaintenanceWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (wo: MepWorkOrder) => {
      try {
        await db.upsert('maintenance_work_orders', wo, 'id');
      } catch (e) {
        console.debug('[useSaveMaintenanceWorkOrder] note:', e);
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
        const res = await db.findMany<MepEquipment>('equipment_assets', {
          orderBy: { column: 'id', ascending: true },
          limit: 100,
        });
        if (Array.isArray(res) && res.length > 0) return res;
      } catch (e) {
        console.debug('[useEquipmentAssets] fallback note:', e);
      }
      return INITIAL_MEP_EQUIPMENT;
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}

// Backward-compatible hook aliases for legacy useMep callers
export const useMepWorkOrders = useMaintenanceWorkOrders;
export const useSaveMepWorkOrder = useSaveMaintenanceWorkOrder;

export function useMolds() {
  return useQuery({
    queryKey: queryKeys.maintenance.molds(),
    queryFn: async () => {
      try {
        const res = await db.findMany('mold_tools');
        if (Array.isArray(res) && res.length > 0) return res;
      } catch {}
      return [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useMaintenance() {
  const { data: workOrders = [], isLoading: isLoadingWo } = useMaintenanceWorkOrders();
  const { data: equipment = [], isLoading: isLoadingEq } = useEquipmentAssets();

  return {
    workOrders,
    equipment,
    alarms: INITIAL_MEP_ALARMS,
    energyMeters: INITIAL_MEP_ENERGY_METERS,
    utilityReadings: INITIAL_MEP_UTILITY_READINGS,
    cleanroomZones: INITIAL_MEP_CLEANROOM_ZONES,
    isLoading: isLoadingWo || isLoadingEq,
  };
}
