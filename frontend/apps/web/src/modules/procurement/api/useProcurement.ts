import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/src/shared/queryKeys';
import { broadcastLocalMutation } from '@/src/services/realtime/supabaseRealtime';
import { supplierService } from '@/src/services/procurement/supplierService';
import { db } from '@/src/shared/db';
import { PurchaseOrder } from '@/src/types';
import { initialPurchaseOrders } from '@/src/data/initialData';
import { mapDbRowToPurchaseOrder } from '@/src/shared/utils/dtoMappers';

export function usePurchaseOrders(_filter?: any) {
  return useQuery<PurchaseOrder[]>({
    queryKey: queryKeys.procurement.purchaseOrders(_filter),
    queryFn: async () => {
      try {
        const data = await db.findMany<any>('purchase_orders', {
          orderBy: { column: 'created_at', ascending: false },
          limit: 100,
        });

        if (Array.isArray(data) && data.length > 0) {
          return data.map((row: any) => mapDbRowToPurchaseOrder(row));
        }
      } catch (e) {
        console.debug('[usePurchaseOrders] error:', e);
      }
      return initialPurchaseOrders;
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}

export function useSavePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (po: PurchaseOrder) => {
      try {
        await db.upsert('purchase_orders', {
          id: po.id,
          supplier_id: (po as any).supplierId || (po as any).supplier,
          status: (po as any).status,
          updated_at: new Date().toISOString(),
        });
      } catch (e) {
        console.debug('[useSavePurchaseOrder] db upsert notice:', e);
      }
      return po;
    },
    onSuccess: (savedPO) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.procurement.purchaseOrders() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      broadcastLocalMutation('PURCHASE_ORDERS', 'UPDATE', savedPO);
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

export function useProcurement() {
  const { data: purchaseOrders = [], isLoading } = usePurchaseOrders();
  const { data: suppliers = [] } = useSuppliers();
  return {
    purchaseOrders,
    suppliers,
    isLoading,
  };
}
