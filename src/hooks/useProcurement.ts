import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../shared/queryKeys';
import { broadcastLocalMutation } from '../services/realtime/supabaseRealtime';
import { supplierService } from '../services/procurement/supplierService';
import { db } from '../shared/db';
import { PurchaseOrder } from '../types';
import { initialPurchaseOrders } from '../data/initialData';

// ============================================================================
// PROCUREMENT — TANSTACK REACT QUERY HOOKS (SSOT)
// ============================================================================

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
          return data.map((row: any) => ({
            id: row.id || row.po_number || row.poNumber,
            supplier: row.supplier_name || row.supplier || row.supplier_id || 'Reliance Industries Ltd',
            supplierId: row.supplier_id || row.supplier,
            orderDate: row.order_date || (row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : '2026-09-25'),
            expectedDeliveryDate: row.expected_delivery || row.delivery_date || row.expected_delivery_date || row.due_date || '2026-10-10',
            deliveryDate: row.delivery_date || row.expected_delivery || row.expected_delivery_date || row.due_date || '2026-10-10',
            totalAmount: Number(row.total_amount || row.total_cost || row.amount || row.total_value || 0),
            status: row.status || 'pending',
            currency: 'INR (₹)',
            plant: row.plant || 'Plant 1 - Pimpri Auto-Hub',
            created_at: row.created_at,
          }));
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
