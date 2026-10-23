import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/src/shared/queryKeys';
import { broadcastLocalMutation } from '@/src/services/realtime/realtimeService';
import { adminEventBus } from '@/src/services/adminService';
import { api } from '@/src/lib/api-client';
import {
  masterDataGovernanceService,
  MasterDataChangeRecord,
  MasterDataChangeRequest,
} from './masterDataGovernanceService';
import { ItemMaster, MachineMaster, Customer, BomMaster } from '@/src/types';

// ============================================================================
// MASTER DATA — TANSTACK REACT QUERY HOOKS (v5)
// Pure 2-Layer Model: Drizzle/Hono API ↔ TanStack Query
// Zero intermediate API facade files or DTO mappers
// ============================================================================

// 1. ITEMS / ITEM MASTER CATALOG (Rule 2: Bounded Queries)
export function useItems(filter?: any, limit: number = 50) {
  return useQuery<ItemMaster[]>({
    queryKey: queryKeys.masterData.items({ filter, limit }),
    queryFn: async () => {
      const res = await api.get<any>('/items', { params: { limit } });
      const envelope = res?.data !== undefined ? res.data : res;
      return Array.isArray(envelope?.data) ? envelope.data : Array.isArray(envelope) ? envelope : [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes fresh cache
    refetchOnWindowFocus: false, // Prevent window focus query barrage
  });
}

// 1b. EXACT TOTAL ITEM COUNT (Single REST Call via /items/summary stats)
export function useItemCount() {
  return useQuery<number>({
    queryKey: ['masterData', 'itemCount'],
    queryFn: async () => {
      try {
        const res = await api.get<any>('/items/summary');
        const stats = res?.data?.data ?? res?.data;
        return stats?.total || 0;
      } catch (e) {
        console.debug('[useItemCount] note:', e);
      }
      return 0;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useItemCatalogStats() {
  return useQuery({
    queryKey: ['masterData', 'itemCatalogStats'],
    queryFn: async () => {
      const res = await api.get<any>('/items/summary');
      return res?.data?.data ?? res?.data ?? { total: 0, pending: 0, drafts: 0, rejected: 0, lowStock: 0, active: 0 };
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

// Rule 2: Strict Paginated Items Query with Cursor / Offset parameters
export function usePaginatedItems(params: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
  itemType?: string;
  approval?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  return useQuery({
    queryKey: ['masterData', 'paginatedItems', params],
    queryFn: async () => {
      const page = Math.max(1, params.page || 1);
      const limit = Math.min(100, Math.max(1, params.limit || 50));
      const queryParams: Record<string, any> = { page, limit };
      if (params.search?.trim()) queryParams.search = params.search.trim();
      if (params.category && params.category !== 'All' && params.category !== 'ALL') queryParams.category = params.category;
      if (params.status && params.status !== 'ALL') queryParams.status = params.status;
      if (params.approval) queryParams.approval = params.approval;
      if (params.sortBy) queryParams.sortBy = params.sortBy;
      if (params.sortOrder) queryParams.sortOrder = params.sortOrder;

      const res = await api.get<any>('/items', { params: queryParams });
      const envelope = res?.data !== undefined ? res.data : res;
      const items: ItemMaster[] = Array.isArray(envelope?.data)
        ? envelope.data
        : Array.isArray(envelope)
          ? envelope
          : [];
      const total = Number(envelope?.meta?.total ?? items.length);

      return {
        items,
        totalCount: total,
        page,
        limit,
        hasMore: page * limit < total,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });
}

export function useItemDetail(code?: string) {
  return useQuery<ItemMaster | undefined>({
    queryKey: ['masterData', 'itemDetail', code],
    queryFn: async () => {
      if (!code) return undefined;
      const res = await api.get<any>(`/items/${encodeURIComponent(code)}`);
      return res?.data?.data ?? res?.data;
    },
    enabled: !!code,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useSaveItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: ItemMaster) => {
      if (item.id) {
        const res = await api.patch<any>(`/items/${encodeURIComponent(item.id)}`, item);
        return res?.data?.data ?? res?.data;
      }
      const res = await api.post<any>('/items', item);
      return res?.data?.data ?? res?.data;
    },
    onSuccess: (savedItem) => {
      // 1. Immediately hydrate TanStack Query cache with the returned representation (Eliminates Race Condition & Flicker)
      queryClient.setQueriesData({ queryKey: ['masterData', 'items'] }, (old: ItemMaster[] | undefined) => {
        if (!old || !Array.isArray(old)) return [savedItem];
        const exists = old.some((i) => i.code === savedItem.code || (savedItem.id && i.id === savedItem.id));
        return exists
          ? old.map((i) => (i.code === savedItem.code || (savedItem.id && i.id === savedItem.id) ? savedItem : i))
          : [savedItem, ...old];
      });
      queryClient.setQueriesData({ queryKey: ['masterData', 'itemDetail', savedItem.code] }, savedItem);
      queryClient.setQueriesData({ queryKey: ['masterData', 'paginatedItems'] }, (old: any) => {
        if (!old?.items) return old;
        const idx = old.items.findIndex((i: ItemMaster) => i.id === savedItem.id);
        if (idx >= 0) {
          const next = [...old.items];
          next[idx] = savedItem;
          return { ...old, items: next };
        }
        return { ...old, items: [savedItem, ...old.items].slice(0, old.limit), totalCount: old.totalCount + 1 };
      });
      queryClient.invalidateQueries({ queryKey: ['masterData', 'paginatedItems'] });
      queryClient.invalidateQueries({ queryKey: ['masterData', 'itemCount'] });
      queryClient.invalidateQueries({ queryKey: ['masterData', 'itemCatalogStats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      broadcastLocalMutation('ITEMS', 'UPDATE', savedItem);
      adminEventBus.emit('ITEM_SAVED', savedItem);
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      await api.delete(`/items/${encodeURIComponent(code)}`);
      return true;
    },
    onSuccess: (_, code) => {
      // 1. Immediately remove from TanStack Query cache (Zero Stale Flicker)
      queryClient.setQueriesData({ queryKey: ['masterData', 'items'] }, (old: ItemMaster[] | undefined) => {
        if (!old || !Array.isArray(old)) return [];
        return old.filter((i) => i.code !== code);
      });
      queryClient.setQueriesData({ queryKey: ['masterData', 'paginatedItems'] }, (old: any) => {
        if (!old?.items) return old;
        const items = old.items.filter((i: ItemMaster) => i.code !== code);
        return { ...old, items, totalCount: Math.max(0, old.totalCount - (old.items.length - items.length)) };
      });
      queryClient.invalidateQueries({ queryKey: ['masterData', 'paginatedItems'] });
      queryClient.invalidateQueries({ queryKey: ['masterData', 'itemCount'] });
      queryClient.invalidateQueries({ queryKey: ['masterData', 'itemCatalogStats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      broadcastLocalMutation('ITEMS', 'DELETE', { code });
      adminEventBus.emit('ITEM_DELETED', { code });
    },
  });
}

export function useApproveItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      item,
      reviewerName = 'Admin Authority',
      comment = 'Approved and released SKU to live shopfloor',
    }: {
      item: ItemMaster;
      reviewerName?: string;
      comment?: string;
    }) => {
      const payload = {
        ...item,
        approval: 'approved',
        status: 'active',
        approvedBy: reviewerName,
        comment,
        version: item.version,
      };
      const target = item.id || item.code;
      const res = await api.patch<any>(`/items/${encodeURIComponent(target)}`, payload);
      return res?.data?.data ?? res?.data;
    },
    onSuccess: (approvedItem) => {
      // 1. Direct representation cache write
      queryClient.setQueriesData({ queryKey: ['masterData', 'items'] }, (old: ItemMaster[] | undefined) => {
        if (!old || !Array.isArray(old)) return [approvedItem];
        return old.map((i) => (i.code === approvedItem.code ? approvedItem : i));
      });
      queryClient.setQueriesData({ queryKey: ['masterData', 'itemDetail', approvedItem.code] }, approvedItem);
      queryClient.invalidateQueries({ queryKey: ['masterData', 'paginatedItems'] });
      queryClient.invalidateQueries({ queryKey: ['masterData', 'itemCount'] });
      queryClient.invalidateQueries({ queryKey: ['masterData', 'itemCatalogStats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      broadcastLocalMutation('ITEMS', 'UPDATE', approvedItem);
      adminEventBus.emit('ITEM_SAVED', approvedItem);
      adminEventBus.emit('ITEM_APPROVED', approvedItem);
    },
  });
}

export function useRejectItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      item,
      reviewerName = 'Admin Authority',
      reason = 'Rejected in QA / Engineering review',
    }: {
      item: ItemMaster;
      reviewerName?: string;
      reason?: string;
    }) => {
      const payload = {
        ...item,
        approval: 'rejected',
        rejectedReason: reason,
        version: item.version,
      };
      const target = item.id || item.code;
      const res = await api.patch<any>(`/items/${encodeURIComponent(target)}`, payload);
      return res?.data?.data ?? res?.data;
    },
    onSuccess: (rejectedItem) => {
      // 1. Direct representation cache write
      queryClient.setQueriesData({ queryKey: ['masterData', 'items'] }, (old: ItemMaster[] | undefined) => {
        if (!old || !Array.isArray(old)) return [rejectedItem];
        return old.map((i) => (i.code === rejectedItem.code ? rejectedItem : i));
      });
      queryClient.setQueriesData({ queryKey: ['masterData', 'itemDetail', rejectedItem.code] }, rejectedItem);
      queryClient.invalidateQueries({ queryKey: ['masterData', 'paginatedItems'] });
      queryClient.invalidateQueries({ queryKey: ['masterData', 'itemCount'] });
      queryClient.invalidateQueries({ queryKey: ['masterData', 'itemCatalogStats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      broadcastLocalMutation('ITEMS', 'UPDATE', rejectedItem);
      adminEventBus.emit('ITEM_SAVED', rejectedItem);
      adminEventBus.emit('ITEM_REJECTED', rejectedItem);
    },
  });
}

export function useBulkImportItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (items: any[]) => {
      let importedCount = 0;
      for (const item of items) {
        await api.post('/items', item);
        importedCount++;
      }
      return { importedCount };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['masterData'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      broadcastLocalMutation('ITEMS', 'UPDATE', { count: result.importedCount });
    },
  });
}

export function useBulkSyncCatalog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.get<any>('/items', { params: { limit: 100 } });
      const envelope = res?.data !== undefined ? res.data : res;
      return Array.isArray(envelope?.data) ? envelope.data : Array.isArray(envelope) ? envelope : [];
    },
    onSuccess: (catalog) => {
      queryClient.invalidateQueries({ queryKey: ['masterData'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      broadcastLocalMutation('ITEMS', 'UPDATE', { count: catalog.length });
      adminEventBus.emit('CATALOG_RELOADED', catalog);
      adminEventBus.emit('ITEMS_SYNCED', { data: catalog });
    },
  });
}

export function useSubmitForApproval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ item, requestedBy = 'Engineer', note = 'Submitted for Technical & QA Review' }: { item: ItemMaster; requestedBy?: string; note?: string }) => {
      const pending: ItemMaster = {
        ...item,
        approval: 'pending',
        status: 'inactive',
      };
      if (pending.id) {
        const res = await api.patch<any>(`/items/${encodeURIComponent(pending.id)}`, pending);
        return res?.data?.data ?? res?.data;
      }
      const res = await api.post<any>('/items', pending);
      return res?.data?.data ?? res?.data;
    },
    onSuccess: (pendingItem) => {
      queryClient.setQueriesData({ queryKey: ['masterData', 'items'] }, (old: ItemMaster[] | undefined) => {
        if (!old || !Array.isArray(old)) return [pendingItem];
        return old.map((i) => (i.code === pendingItem.code ? pendingItem : i));
      });
      queryClient.setQueriesData({ queryKey: ['masterData', 'itemDetail', pendingItem.code] }, pendingItem);
      queryClient.invalidateQueries({ queryKey: ['masterData'] });
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
      broadcastLocalMutation('ITEMS', 'UPDATE', pendingItem);
    },
  });
}

export interface DbAuditLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  changed_fields?: string[];
  old_values?: any;
  new_values?: any;
  performed_by?: string;
  ip_address?: string;
  performed_at: string;
}

// 2. LIVE ITEM AUDIT TRAIL & CHANGE LEDGER (PostgreSQL db SSOT)
export function useItemAuditHistory(targetFilter?: { type?: string; code?: string; search?: string }) {
  return useQuery<DbAuditLog[]>({
    queryKey: ['auditLogs', targetFilter],
    queryFn: async () => {
      try {
        const params: Record<string, any> = { limit: 100 };
        if (targetFilter?.type && targetFilter.type !== 'ALL') {
          params.entityType = targetFilter.type === 'ITEM_MASTER' ? 'items' : targetFilter.type.toLowerCase();
        }
        if (targetFilter?.code) {
          params.entityId = targetFilter.code;
        }
        if (targetFilter?.search) {
          params.search = targetFilter.search;
        }
        const res = await api.get<any>('/audit-logs', { params });
        const list = res?.data?.data || res?.data || [];
        return Array.isArray(list) ? list : [];
      } catch (err) {
        console.warn('[useItemAuditHistory] DB audit-logs error:', err);
        return [];
      }
    },
    staleTime: 1000 * 10,
    refetchOnWindowFocus: true,
  });
}

// 3. ADMIN APPROVALS QUEUE
export function useItemApprovalsQueue() {
  return useQuery<MasterDataChangeRequest[]>({
    queryKey: ['masterData', 'approvalsQueue'],
    queryFn: async () => {
      return masterDataGovernanceService.getChangeRequests();
    },
    staleTime: 1000 * 15,
  });
}

// 4. MACHINES
export function useMachines() {
  return useQuery<MachineMaster[]>({
    queryKey: queryKeys.masterData.machines(),
    queryFn: async () => {
      try {
        const res = await api.get<any>('/machines', {
          params: { limit: 100, sortBy: 'created_at', sortOrder: 'desc' },
        });
        const rows = res?.data?.data || res?.data;
        if (Array.isArray(rows)) return rows;
      } catch (e) {
        console.debug('[useMachines] REST error:', e);
      }
      return [];
    },
    staleTime: 1000 * 30,
  });
}

export function useSaveMachine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (machine: MachineMaster) => {
      if (machine.id) {
        try {
          const res = await api.patch<any>(`/machines/${encodeURIComponent(machine.id)}`, machine);
          if (res?.data) return res.data.data || res.data;
        } catch {}
      } else {
        try {
          const res = await api.post<any>('/machines', machine);
          if (res?.data) return res.data.data || res.data;
        } catch {}
      }
      return machine;
    },
    onSuccess: (savedMachine) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.masterData.machines() });
      broadcastLocalMutation('MACHINES', 'UPDATE', savedMachine);
    },
  });
}

export function useDeleteMachine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await api.delete(`/machines/${encodeURIComponent(id)}`);
      } catch (e) {
        console.debug('[useDeleteMachine] notice:', e);
      }
      return id;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.masterData.machines() });
      broadcastLocalMutation('MACHINES', 'DELETE', { id });
    },
  });
}

// 5. CUSTOMERS
export function useCustomers() {
  return useQuery<Customer[]>({
    queryKey: queryKeys.sales.customers(),
    queryFn: async () => {
      try {
        const res = await api.get<any>('/customers', {
          params: { limit: 100, sortBy: 'created_at', sortOrder: 'desc' },
        });
        const rows = res?.data?.data || res?.data;
        if (Array.isArray(rows)) return rows;
      } catch (e) {
        console.debug('[useCustomers] REST error:', e);
      }
      return [];
    },
    staleTime: 1000 * 30,
  });
}

export function useSaveCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (customer: Customer) => {
      const custId = (customer as any).id || customer.code;
      if (custId) {
        try {
          const res = await api.patch<any>(`/customers/${encodeURIComponent(custId)}`, customer);
          if (res?.data) return res.data.data || res.data;
        } catch {}
      }
      try {
        const res = await api.post<any>('/customers', customer);
        if (res?.data) return res.data.data || res.data;
      } catch {}
      return customer;
    },
    onSuccess: (savedCustomer) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.customers() });
      broadcastLocalMutation('CUSTOMERS', 'UPDATE', savedCustomer);
    },
  });
}

export const useMoldTools = () => useQuery({
  queryKey: ['masterdata', 'moldTools'],
  queryFn: async () => {
    try {
      const res = await api.get<any>('/molds', { params: { limit: 100 } });
      const rows = res?.data?.data || res?.data;
      if (Array.isArray(rows)) return rows;
    } catch {}
    return [];
  },
});

export const useWarehouses = () => useQuery({
  queryKey: ['masterdata', 'warehouses'],
  queryFn: async () => {
    try {
      const res = await api.get<any>('/warehouses', { params: { limit: 100 } });
      const rows = res?.data?.data || res?.data;
      if (Array.isArray(rows)) return rows;
    } catch {}
    return [];
  },
});

export const usePlants = () => useQuery({
  queryKey: ['masterdata', 'plants'],
  queryFn: async () => {
    try {
      const res = await api.get<any>('/plants', { params: { limit: 100 } });
      const rows = res?.data?.data || res?.data;
      if (Array.isArray(rows)) return rows;
    } catch {}
    return [];
  },
});

export const useGovernanceAuditHistory = useItemAuditHistory;
export const useGovernanceChangeRequests = useItemApprovalsQueue;

export const useCreateWarehouse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (warehouseData: { code: string; name: string; location_type?: string; address?: string }) => {
      const payload = {
        id: warehouseData.code,
        code: warehouseData.code,
        name: warehouseData.name,
        location_type: warehouseData.location_type || 'RAW_MATERIAL',
        address: warehouseData.address || warehouseData.name,
        bins: [],
      };
      const res = await api.post<any>('/warehouses', payload);
      return res?.data?.data || res?.data || payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masterdata', 'warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    },
  });
};

export const useCreateWarehouseBin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (binData: { warehouse_id: string; bin_code: string; zone?: string; capacity_kg?: number }) => {
      const payload = {
        warehouse_id: binData.warehouse_id,
        bin_code: binData.bin_code,
        zone: binData.zone || 'A',
        capacity_kg: binData.capacity_kg || 1000,
        is_active: true,
      };
      const res = await api.post<any>('/warehouse-bins', payload);
      return res?.data?.data || res?.data || payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masterdata', 'warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse_bins'] });
    },
  });
};

export const useSuppliers = () => useQuery({
  queryKey: ['masterdata', 'suppliers'],
  queryFn: async () => {
    try {
      const res = await api.get<any>('/suppliers', { params: { limit: 100 } });
      const rows = res?.data?.data || res?.data;
      if (Array.isArray(rows)) return rows;
    } catch {}
    return [];
  },
});

export const useCreateSupplier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (supplierData: { code?: string; name: string; type?: string; category?: string; paymentTerms?: string }) => {
      const code = supplierData.code || `SUP-${Date.now().toString().slice(-4)}`;
      const payload = {
        code,
        name: supplierData.name,
        type: supplierData.type || 'Raw Material',
        category: supplierData.category || 'Raw Material',
        payment_terms: supplierData.paymentTerms || 'Net 30 Days',
        status: 'active',
      };
      const res = await api.post<any>('/suppliers', payload);
      return res?.data?.data || res?.data || payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masterdata', 'suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
};


