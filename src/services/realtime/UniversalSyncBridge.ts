// ============================================================================
// UNIVERSAL SYNC ↔ TANSTACK REACT QUERY (v5) INVALIDATION BRIDGE
// Seamlessly translates real-time CDC & BroadcastChannel events to Query Invalidation
// ============================================================================

import { queryClient } from '../../shared/providers/QueryProvider';
import { adminEventBus } from '../adminService';
import { queryKeys } from '../../shared/queryKeys';
import { SyncMessage } from './UniversalSyncManager';

/**
 * Domain-to-QueryKey Invalidation Map across all 16 ERP Domains
 */
const DOMAIN_INVALIDATION_MAP: Record<string, readonly (readonly unknown[])[]> = {
  SALES_ORDERS: [queryKeys.sales.all, queryKeys.dashboard.all],
  MONTHLY_PLANS: [queryKeys.sales.all, queryKeys.planning.all],
  DELIVERIES: [queryKeys.scm.all, queryKeys.sales.all],
  WORK_ORDERS: [queryKeys.manufacturing.all, queryKeys.planning.all, queryKeys.dashboard.all],
  ITEMS: [queryKeys.masterData.all, queryKeys.warehouse.all, queryKeys.engineering.all],
  PURCHASE_ORDERS: [queryKeys.procurement.all, queryKeys.warehouse.all],
  QUALITY_NCRS: [queryKeys.quality.all, queryKeys.dashboard.all],
  QUALITY_CAPAS: [queryKeys.quality.all],
  QUALITY_COAS: [queryKeys.quality.all],
  CUSTOMERS: [queryKeys.sales.all, queryKeys.masterData.all],
  QUOTATIONS: [queryKeys.sales.all],
  RMAS: [queryKeys.sales.all],
  BOMS: [queryKeys.engineering.all, queryKeys.manufacturing.all],
  MACHINES: [queryKeys.masterData.all, queryKeys.manufacturing.all, queryKeys.mep.all],
  ACCOUNTS: [queryKeys.finance.all],
  JOURNAL_ENTRIES: [queryKeys.finance.all],
  STOCK_TRANSFERS: [queryKeys.warehouse.all],
  GATE_PASSES: [queryKeys.scm.all],
  MOLDS: [queryKeys.mep.all],
  MEP_WORK_ORDERS: [queryKeys.mep.all],
  EMPLOYEES: [queryKeys.hr.all],
  ATTENDANCE: [queryKeys.hr.all],
  MRP_RUNS: [queryKeys.planning.all, queryKeys.procurement.all, queryKeys.manufacturing.all],
  OEE: [queryKeys.analytics.all, queryKeys.dashboard.all],
  AUDIT_LOGS: [queryKeys.admin.all],
  USERS: [queryKeys.admin.all, queryKeys.auth.all],
  SYSTEM_SETTINGS: [queryKeys.admin.all],
};

let isBridgeInitialized = false;

export function initializeUniversalSyncBridge(): () => void {
  if (isBridgeInitialized) return () => {};
  isBridgeInitialized = true;

  // Handle generic Enterprise Sync Event from UniversalSyncManager
  const unsubscribeGlobal = adminEventBus.on('ENTERPRISE_SYNC_EVENT', (syncMsg: SyncMessage) => {
    if (!syncMsg || !syncMsg.domain) return;
    
    const keysToInvalidate = DOMAIN_INVALIDATION_MAP[syncMsg.domain];
    if (Array.isArray(keysToInvalidate)) {
      keysToInvalidate.forEach((queryKey) => {
        try {
          queryClient.invalidateQueries({ queryKey: queryKey as any });
        } catch (err) {
          console.warn('[SyncBridge] Invalidation warning:', err);
        }
      });
    }
  });

  return () => {
    unsubscribeGlobal?.();
    isBridgeInitialized = false;
  };
}
