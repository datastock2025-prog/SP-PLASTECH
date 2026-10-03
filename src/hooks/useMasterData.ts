import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../shared/api/client';
import { queryKeys } from '../shared/queryKeys';
import { universalSyncManager } from '../services/realtime/UniversalSyncManager';
import { itemService } from '../services/itemService';
import {
  masterDataGovernanceService,
  MasterDataChangeRecord,
  MasterDataChangeRequest,
} from '../services/masterDataGovernanceService';
import { ItemMaster, MachineMaster, Customer, BomMaster } from '../types';

// ============================================================================
// MASTER DATA — TANSTACK REACT QUERY HOOKS (v5)
// Multi-Tenant Gateway + Strict API-First & Live Database Sync
// ============================================================================

// 1. ITEMS / ITEM MASTER CATALOG
export function useItems(filter?: any) {
  return useQuery<ItemMaster[]>({
    queryKey: queryKeys.masterData.items(filter),
    queryFn: async () => {
      const items = await itemService.getItems();
      return items;
    },
    staleTime: 1000 * 30, // 30 seconds fresh cache
    refetchOnWindowFocus: false,
  });
}

export function useItemDetail(code?: string) {
  return useQuery<ItemMaster | undefined>({
    queryKey: ['masterData', 'itemDetail', code],
    queryFn: async () => {
      if (!code) return undefined;
      return await itemService.getItemByCode(code);
    },
    enabled: !!code,
    staleTime: 1000 * 30,
  });
}

export function useSaveItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: ItemMaster) => {
      return await itemService.saveItem(item);
    },
    onSuccess: (savedItem) => {
      queryClient.invalidateQueries({ queryKey: ['masterData', 'items'] });
      queryClient.invalidateQueries({ queryKey: ['masterData', 'itemDetail', savedItem.code] });
      queryClient.invalidateQueries({ queryKey: ['masterData', 'auditLedger'] });
      universalSyncManager.broadcastMutation('ITEMS', 'UPDATE', savedItem);
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      return await itemService.deleteItem(code);
    },
    onSuccess: (_, code) => {
      queryClient.invalidateQueries({ queryKey: ['masterData', 'items'] });
      queryClient.invalidateQueries({ queryKey: ['masterData', 'itemDetail', code] });
      queryClient.invalidateQueries({ queryKey: ['masterData', 'auditLedger'] });
      universalSyncManager.broadcastMutation('ITEMS', 'DELETE', { code });
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
      return await itemService.approveItem(item, reviewerName, comment);
    },
    onSuccess: (approvedItem) => {
      queryClient.invalidateQueries({ queryKey: ['masterData', 'items'] });
      queryClient.invalidateQueries({ queryKey: ['masterData', 'itemDetail', approvedItem.code] });
      queryClient.invalidateQueries({ queryKey: ['masterData', 'auditLedger'] });
      queryClient.invalidateQueries({ queryKey: ['masterData', 'approvalsQueue'] });
      universalSyncManager.broadcastMutation('ITEMS', 'UPDATE', approvedItem);
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
      return await itemService.rejectItem(item, reviewerName, reason);
    },
    onSuccess: (rejectedItem) => {
      queryClient.invalidateQueries({ queryKey: ['masterData', 'items'] });
      queryClient.invalidateQueries({ queryKey: ['masterData', 'itemDetail', rejectedItem.code] });
      queryClient.invalidateQueries({ queryKey: ['masterData', 'auditLedger'] });
      queryClient.invalidateQueries({ queryKey: ['masterData', 'approvalsQueue'] });
      universalSyncManager.broadcastMutation('ITEMS', 'UPDATE', rejectedItem);
    },
  });
}

export function useBulkSyncCatalog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      return await itemService.syncLiveCatalog();
    },
    onSuccess: (catalog) => {
      queryClient.invalidateQueries({ queryKey: ['masterData', 'items'] });
      queryClient.invalidateQueries({ queryKey: ['masterData', 'auditLedger'] });
      universalSyncManager.broadcastMutation('ITEMS', 'UPDATE', { count: catalog.length });
    },
  });
}

// 2. ITEM AUDIT TRAIL & CHANGE LEDGER
export function useItemAuditHistory(targetFilter?: { type?: string; code?: string }) {
  return useQuery<MasterDataChangeRecord[]>({
    queryKey: ['masterData', 'auditLedger', targetFilter],
    queryFn: async () => {
      return masterDataGovernanceService.getAuditHistory(targetFilter);
    },
    staleTime: 1000 * 15,
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

import { liveDataStore } from '../services/liveDataStore';

// 4. MACHINES
export function useMachines() {
  return useQuery<MachineMaster[]>({
    queryKey: queryKeys.masterData.machines(),
    queryFn: async () => {
      return await liveDataStore.getMachines();
    },
    staleTime: 1000 * 30,
  });
}

export function useSaveMachine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (machine: MachineMaster) => {
      return await liveDataStore.saveMachine(machine);
    },
    onSuccess: (savedMachine) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.masterData.machines() });
      universalSyncManager.broadcastMutation('MACHINES', 'UPDATE', savedMachine);
    },
  });
}

export function useDeleteMachine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return await liveDataStore.deleteMachine(id);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.masterData.machines() });
      universalSyncManager.broadcastMutation('MACHINES', 'DELETE', { id });
    },
  });
}

// 5. CUSTOMERS
export function useCustomers() {
  return useQuery<Customer[]>({
    queryKey: queryKeys.sales.customers(),
    queryFn: async () => {
      return await liveDataStore.getCustomers();
    },
    staleTime: 1000 * 30,
  });
}

export function useSaveCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (customer: Customer) => {
      return await liveDataStore.saveCustomer(customer);
    },
    onSuccess: (savedCustomer) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.customers() });
      universalSyncManager.broadcastMutation('CUSTOMERS', 'UPDATE', savedCustomer);
    },
  });
}

