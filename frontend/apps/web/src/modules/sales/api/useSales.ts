import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/src/shared/queryKeys';
import { broadcastLocalMutation } from '@/src/services/realtime/realtimeService';
import { api } from '@/src/lib/api-client';
import { SalesOrder, Quotation, ReturnMerchandise } from '@/src/types';
import { salesApi, type SalesSummaryDto } from './salesApi';

export { type SalesSummaryDto };

const normalizeSalesOrder = (row: any): SalesOrder => ({
  ...row,
  id: String(row.id || ''),
  customer: String(row.customer_name || row.customer || ''),
  customerPO: String(row.customer_po_number || row.customerPO || ''),
  priority: (row.priority || 'Medium') as any,
  quoteRef: row.quote_ref || row.quoteRef,
  orderDate: String(row.order_date || row.orderDate || ''),
  deliveryDate: String(row.delivery_date || row.deliveryDate || ''),
  approval: (row.approval || 'approved') as any,
  rejectReason: row.reject_reason || row.rejectReason,
  lines: Array.isArray(row.lines) ? row.lines : [],
  dispatchLogs: Array.isArray(row.dispatch_logs) ? row.dispatch_logs : [],
  history: Array.isArray(row.history) ? row.history : [],
});

// 1. Sales Orders Query (TanStack Query SSOT)
export function useSalesOrders(_filter?: any) {
  return useQuery<SalesOrder[]>({
    queryKey: queryKeys.sales.orders(_filter),
    queryFn: async () => {
      try {
        const res = await api.get<any>('/sales-orders', {
          params: { limit: 100, sortBy: 'created_at', sortOrder: 'desc', includeTotal: true },
        });
        const rows = res?.data?.data || res?.data;
        if (Array.isArray(rows)) {
          return rows.map((row: any) => normalizeSalesOrder(row));
        }
      } catch (e) {
        console.debug('[useSalesOrders] REST query notice:', e);
      }
      return [];
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}

// 2. Sales Summary / KPI Query (Atomic Single-Round-Trip)
export function useSalesSummary() {
  return useQuery<SalesSummaryDto>({
    queryKey: queryKeys.sales.summary(),
    queryFn: async () => {
      return await salesApi.getSalesSummary();
    },
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  });
}

// 3. Save Sales Order Mutation
export function useSaveSalesOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (so: SalesOrder) => {
      const payload = {
        id: so.id,
        so_number: (so as any).soNumber || so.id,
        customer_id: (so as any).customerId || (so as any).customer,
        customer_name: (so as any).customerName,
        status: (so as any).status || 'draft',
        total_amount: (so as any).totalAmount || (so as any).totalValue || 0,
        items: (so as any).items || (so as any).lines || [],
        order_date: (so as any).orderDate || new Date().toISOString().split('T')[0],
        delivery_date: (so as any).deliveryDate || null,
        updated_at: new Date().toISOString(),
      };

      if (so.id) {
        try {
          const res = await api.patch<any>(`/sales-orders/${encodeURIComponent(so.id)}`, payload);
          const row = res?.data?.data || res?.data;
          if (row) return mapDbRowToSalesOrder(row);
        } catch {
          // If 404, fallback to create
          try {
            const res = await api.post<any>('/sales-orders', payload);
            const row = res?.data?.data || res?.data;
            if (row) return mapDbRowToSalesOrder(row);
          } catch {}
        }
      } else {
        try {
          const res = await api.post<any>('/sales-orders', payload);
          const row = res?.data?.data || res?.data;
          if (row) return mapDbRowToSalesOrder(row);
        } catch {}
      }
      return so;
    },
    onSuccess: (savedSO) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.orders() });
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.summary() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      broadcastLocalMutation('SALES_ORDERS', 'UPDATE', savedSO);
    },
  });
}

// 4. Quotations Query
export function useQuotations(_filter?: any) {
  return useQuery<Quotation[]>({
    queryKey: queryKeys.sales.quotations(_filter),
    queryFn: async () => {
      try {
        const res = await api.get<any>('/quotations', {
          params: { limit: 100, sortBy: 'created_at', sortOrder: 'desc' },
        });
        const rows = res?.data?.data || res?.data;
        if (Array.isArray(rows)) return rows;
      } catch (e) {
        console.debug('[useQuotations] query notice:', e);
      }
      return [];
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}

// 5. Save Quotation Mutation
export function useSaveQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (quote: Quotation) => {
      if (quote.id) {
        try {
          const res = await api.patch<any>(`/quotations/${encodeURIComponent(quote.id)}`, quote);
          if (res?.data) return res.data.data || res.data;
        } catch {}
      }
      try {
        const res = await api.post<any>('/quotations', quote);
        if (res?.data) return res.data.data || res.data;
      } catch {}
      return quote;
    },
    onSuccess: (savedQuote) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.quotations() });
      broadcastLocalMutation('QUOTATIONS', 'UPDATE', savedQuote);
    },
  });
}

// 6. Return Merchandise Authorizations (RMA)
export function useSalesRmas() {
  return useQuery<ReturnMerchandise[]>({
    queryKey: queryKeys.sales.rmas(),
    queryFn: async () => {
      try {
        const res = await api.get<any>('/rmas', {
          params: { limit: 100, sortBy: 'created_at', sortOrder: 'desc' },
        });
        const rows = res?.data?.data || res?.data;
        if (Array.isArray(rows)) return rows;
      } catch (e) {
        console.debug('[useSalesRmas] query notice:', e);
      }
      return [];
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}

// 7. Save RMA Mutation
export function useSaveSalesRma() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rma: ReturnMerchandise) => {
      if (rma.id) {
        try {
          const res = await api.patch<any>(`/rmas/${encodeURIComponent(rma.id)}`, rma);
          if (res?.data) return res.data.data || res.data;
        } catch {}
      }
      try {
        const res = await api.post<any>('/rmas', rma);
        if (res?.data) return res.data.data || res.data;
      } catch {}
      return rma;
    },
    onSuccess: (savedRma) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.rmas() });
      broadcastLocalMutation('RMAS', 'UPDATE', savedRma);
    },
  });
}

// 8. Consolidated Sales Hook
export function useSales() {
  const { data: salesOrders = [], isLoading: isLoadingOrders } = useSalesOrders();
  const { data: quotations = [], isLoading: isLoadingQuotes } = useQuotations();
  const { data: summary, isLoading: isLoadingSummary } = useSalesSummary();
  return {
    salesOrders,
    quotations,
    summary,
    isLoading: isLoadingOrders || isLoadingQuotes || isLoadingSummary,
  };
}
