import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../shared/api/client';
import { queryKeys } from '../shared/queryKeys';
import { universalSyncManager } from '../services/realtime/UniversalSyncManager';
import { PurchaseOrder } from '../types';

// ============================================================================
// PROCUREMENT — TANSTACK REACT QUERY HOOKS
// ============================================================================

export function usePurchaseOrders(filter?: any) {
  return useQuery<PurchaseOrder[]>({
    queryKey: queryKeys.procurement.purchaseOrders(filter),
    queryFn: async () => {
      const res = await apiClient.get('/purchase-orders', { params: filter });
      return Array.isArray(res.data?.data || res.data) ? (res.data?.data || res.data) : [];
    },
  });
}

export function useSavePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (po: PurchaseOrder) => {
      const res = await apiClient.post('/purchase-orders', po);
      return res.data?.data || res.data || po;
    },
    onSuccess: (savedPO) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.procurement.purchaseOrders() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      universalSyncManager.broadcastMutation('PURCHASE_ORDERS', 'UPDATE', savedPO);
    },
  });
}

export function useSuppliers() {
  return useQuery<any[]>({
    queryKey: queryKeys.procurement.suppliers(),
    queryFn: async () => {
      const res = await apiClient.get('/procurement/vendors');
      return Array.isArray(res.data?.data || res.data) ? (res.data?.data || res.data) : [];
    },
  });
}

export function useSupplierPriceLists() {
  return useQuery<any[]>({
    queryKey: queryKeys.procurement.priceLists(),
    queryFn: async () => {
      const res = await apiClient.get('/procurement/prices');
      return Array.isArray(res.data?.data || res.data) ? (res.data?.data || res.data) : [];
    },
  });
}
