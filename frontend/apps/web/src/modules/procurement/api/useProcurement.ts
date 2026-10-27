import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/src/shared/queryKeys';
import { broadcastLocalMutation } from '@/src/services/realtime/realtimeService';
import { supplierService } from '@/src/services/procurement/supplierService';
import { api } from '@/src/lib/api-client';
import { PurchaseOrder } from '@/src/types';
import { procurementApi, normalizePurchaseOrder, type ProcurementSummaryDto } from './procurementApi';

export { type ProcurementSummaryDto };

// 1. Purchase Orders Query (TanStack Query SSOT)
export function usePurchaseOrders(filter?: any) {
  return useQuery<PurchaseOrder[]>({
    queryKey: queryKeys.procurement.purchaseOrders(filter),
    queryFn: async () => {
      const res = await api.get<any>('/purchase-orders', {
        params: {
          limit: filter?.limit ?? 100,
          page: filter?.page ?? 1,
          sortBy: filter?.sortBy ?? 'created_at',
          sortOrder: filter?.sortOrder ?? 'desc',
          includeTotal: true,
          ...filter,
        },
      });
      const rows = res?.data?.data || res?.data;
      if (Array.isArray(rows)) {
        return rows.map((row: any) => normalizePurchaseOrder(row));
      }
      return [];
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}

// 2. Procurement Summary / KPI Query (Atomic Single-Round-Trip)
export function useProcurementSummary() {
  return useQuery<ProcurementSummaryDto>({
    queryKey: queryKeys.procurement.summary(),
    queryFn: async () => {
      return await procurementApi.getProcurementSummary();
    },
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  });
}

// 3. Save Purchase Order Mutation
export function useSavePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (po: PurchaseOrder) => {
      const payload: Record<string, any> = {
        id: po.id,
        po_number: (po as any).poNumber || (po as any).po_number || po.id,
        supplier_id: (po as any).supplierId || (po as any).supplier_id || (po as any).supplier,
        status: (po as any).status || 'open',
        total_amount: String((po as any).totalAmount || (po as any).total_amount || 0),
        order_date: (po as any).orderDate || (po as any).order_date || new Date().toISOString().split('T')[0],
        expected_delivery_date: (po as any).expectedDate || (po as any).expected_delivery_date,
        items: po.lines || [],
      };

      if (po.id) {
        try {
          const res = await api.patch<any>(`/purchase-orders/${encodeURIComponent(po.id)}`, payload);
          const row = res?.data?.data || res?.data;
          if (row) return ;
        } catch {
          try {
            const res = await api.post<any>('/purchase-orders', payload);
            const row = res?.data?.data || res?.data;
            if (row) return ;
          } catch {}
        }
      } else {
        try {
          const res = await api.post<any>('/purchase-orders', payload);
          const row = res?.data?.data || res?.data;
          if (row) return ;
        } catch {}
      }
      return po;
    },
    onSuccess: (savedPO) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.procurement.purchaseOrders() });
      queryClient.invalidateQueries({ queryKey: queryKeys.procurement.summary() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      broadcastLocalMutation('PURCHASE_ORDERS', 'UPDATE', savedPO);
    },
  });
}

// 4. Suppliers Query
export function useSuppliers() {
  return useQuery<any[]>({
    queryKey: queryKeys.procurement.suppliers(),
    queryFn: async () => {
      return await supplierService.getSuppliers();
    },
    staleTime: 1000 * 60,
  });
}

// 5. Supplier Price Lists Query
export function useSupplierPriceLists() {
  return useQuery<any[]>({
    queryKey: queryKeys.procurement.priceLists(),
    queryFn: async () => {
      try {
        const res = await api.get<any>('/supplier-price-lists', { params: { limit: 100 } });
        const rows = res?.data?.data || res?.data;
        if (Array.isArray(rows)) return rows;
      } catch {}
      return [];
    },
    staleTime: 1000 * 60,
  });
}

// 6. Purchase Requisitions Query
export function usePurchaseRequisitions() {
  return useQuery<any[]>({
    queryKey: ['procurement', 'purchase-requisitions'],
    queryFn: async () => {
      try {
        const res = await api.get<any>('/purchase-requisitions', {
          params: { limit: 100, sortBy: 'created_at', sortOrder: 'desc', includeTotal: true },
        });
        const rows = res?.data?.data || res?.data;
        if (Array.isArray(rows)) return rows;
      } catch {}
      return [];
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}

// 7. Goods Receipt Notes Query
export function useGoodsReceiptNotes() {
  return useQuery<any[]>({
    queryKey: ['procurement', 'goods-receipt-notes'],
    queryFn: async () => {
      try {
        const res = await api.get<any>('/goods-receipt-notes', {
          params: { limit: 100, sortBy: 'created_at', sortOrder: 'desc', includeTotal: true },
        });
        const rows = res?.data?.data || res?.data;
        if (Array.isArray(rows)) return rows;
      } catch {}
      return [];
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}

// 8. Consolidated Procurement Hook
export function useProcurement() {
  const { data: purchaseOrders = [], isLoading: isLoadingPOs } = usePurchaseOrders();
  const { data: suppliers = [], isLoading: isLoadingSuppliers } = useSuppliers();
  const { data: summary, isLoading: isLoadingSummary } = useProcurementSummary();
  return {
    purchaseOrders,
    suppliers,
    summary,
    isLoading: isLoadingPOs || isLoadingSuppliers || isLoadingSummary,
  };
}
