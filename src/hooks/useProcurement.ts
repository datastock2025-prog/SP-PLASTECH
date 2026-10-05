import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../shared/queryKeys';
import { universalSyncManager } from '../services/realtime/UniversalSyncManager';
import { liveDataStore } from '../services/liveDataStore';
import { supplierService } from '../services/procurement/supplierService';
import { db } from '../shared/db';
import { PurchaseOrder } from '../types';

// ============================================================================
// PROCUREMENT — TANSTACK REACT QUERY HOOKS
// ============================================================================

export function usePurchaseOrders(_filter?: any) {
  return useQuery<PurchaseOrder[]>({
    queryKey: queryKeys.procurement.purchaseOrders(_filter),
    queryFn: async () => {
      return await liveDataStore.getPurchaseOrders();
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}

export function useSavePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (po: PurchaseOrder) => {
      return await liveDataStore.savePurchaseOrder(po);
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
      return await supplierService.getSuppliers();
    },
  });
}

export function useSupplierPriceLists() {
  return useQuery<any[]>({
    queryKey: queryKeys.procurement.priceLists(),
    queryFn: async () => {
      try {
        const data = await db.findMany<any>('supplier_price_lists');
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    },
  });
}
