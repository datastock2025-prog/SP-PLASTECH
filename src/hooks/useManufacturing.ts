import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../shared/queryKeys';
import { broadcastLocalMutation } from '../services/realtime/supabaseRealtime';
import { WorkOrder, BomMaster } from '../types';
import { liveDataStore, ProductionEntryPayload, ProductionEntryResult } from '../services/liveDataStore';

// ============================================================================
// MANUFACTURING (MES) & ENGINEERING — TANSTACK REACT QUERY HOOKS
// ============================================================================

export function useWorkOrders(status?: string) {
  return useQuery<WorkOrder[]>({
    queryKey: queryKeys.manufacturing.workOrders(status),
    queryFn: async () => {
      const data = await liveDataStore.getWorkOrders();
      if (Array.isArray(data)) {
        const filtered = data.filter((w) => !['WO-1188', 'WO-1189', 'WO-1190', 'WO-1191', 'WO-1192', 'WO-1193'].includes(w.id));
        if (status) {
          return filtered.filter((w) => w.status?.toLowerCase() === status.toLowerCase());
        }
        return filtered;
      }
      return [];
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}

export function useSaveWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (wo: WorkOrder) => {
      return await liveDataStore.saveWorkOrder(wo);
    },
    onSuccess: (savedWO) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.manufacturing.workOrders() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      broadcastLocalMutation('WORK_ORDERS', 'UPDATE', savedWO);
    },
  });
}

export function useLogProductionEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ProductionEntryPayload): Promise<ProductionEntryResult> => {
      return await liveDataStore.recordProductionEntry(payload);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.manufacturing.workOrders() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      broadcastLocalMutation('WORK_ORDERS', 'UPDATE', result.workOrder);
    },
  });
}

export function useBoms(filter?: any) {
  return useQuery<BomMaster[]>({
    queryKey: queryKeys.engineering.boms(filter),
    queryFn: async () => {
      return await liveDataStore.getBoms();
    },
    staleTime: 1000 * 30,
  });
}

export function useSaveBom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bom: BomMaster) => {
      return await liveDataStore.saveBom(bom);
    },
    onSuccess: (savedBom) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.engineering.boms() });
      broadcastLocalMutation('BOMS', 'UPDATE', savedBom);
    },
  });
}

