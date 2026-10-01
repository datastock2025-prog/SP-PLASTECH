import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../shared/api/client';
import { queryKeys } from '../shared/queryKeys';
import { universalSyncManager } from '../services/realtime/UniversalSyncManager';
import { WorkOrder, BomMaster } from '../types';
import { ProductionEntryPayload, ProductionEntryResult } from '../services/liveDataStore';

// ============================================================================
// MANUFACTURING (MES) & ENGINEERING — TANSTACK REACT QUERY HOOKS
// ============================================================================

export function useWorkOrders(status?: string) {
  return useQuery<WorkOrder[]>({
    queryKey: queryKeys.manufacturing.workOrders(status),
    queryFn: async () => {
      const res = await apiClient.get('/work-orders', { params: status ? { status } : {} });
      const data = res.data?.data || res.data;
      if (Array.isArray(data)) {
        return data.filter((w) => !['WO-1188', 'WO-1189', 'WO-1190', 'WO-1191', 'WO-1192', 'WO-1193'].includes(w.id));
      }
      return [];
    },
  });
}

export function useSaveWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (wo: WorkOrder) => {
      const res = await apiClient.post('/work-orders', wo);
      return res.data?.data || res.data || wo;
    },
    onSuccess: (savedWO) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.manufacturing.workOrders() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      universalSyncManager.broadcastMutation('WORK_ORDERS', 'UPDATE', savedWO);
    },
  });
}

export function useLogProductionEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ProductionEntryPayload): Promise<ProductionEntryResult> => {
      const res = await apiClient.post('/operations/production-entry', payload);
      return res.data?.data || res.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.manufacturing.workOrders() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      universalSyncManager.broadcastMutation('WORK_ORDERS', 'UPDATE', result.workOrder);
    },
  });
}

export function useBoms(filter?: any) {
  return useQuery<BomMaster[]>({
    queryKey: queryKeys.engineering.boms(filter),
    queryFn: async () => {
      const res = await apiClient.get('/engineering/boms', { params: filter });
      return Array.isArray(res.data?.data || res.data) ? (res.data?.data || res.data) : [];
    },
  });
}

export function useSaveBom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bom: BomMaster) => {
      const res = await apiClient.post('/engineering/boms', bom);
      return res.data?.data || res.data || bom;
    },
    onSuccess: (savedBom) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.engineering.boms() });
      universalSyncManager.broadcastMutation('BOMS', 'UPDATE', savedBom);
    },
  });
}
