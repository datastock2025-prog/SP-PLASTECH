// ============================================================================
// REACTIVE LOCAL MUTATION & QUERY INVALIDATION LAYER
// Invalidates TanStack React Query caches and emits domain events
// ============================================================================

import { queryClient } from '../../shared/providers/QueryProvider';
import { adminEventBus } from '../adminService';
import { queryKeys } from '../../shared/queryKeys';

/**
 * Table-to-QueryKey Invalidation Map
 */
const TABLE_QUERY_MAP: Record<string, { queryKeys: readonly (readonly unknown[])[]; eventName: string }> = {
  items: {
    queryKeys: [queryKeys.masterData.all, queryKeys.warehouse.all, queryKeys.engineering.all, ['items']],
    eventName: 'ITEMS_SYNCED',
  },
  work_orders: {
    queryKeys: [queryKeys.manufacturing.all, queryKeys.planning.all, queryKeys.dashboard.all, ['work_orders']],
    eventName: 'WORK_ORDERS_SYNCED',
  },
  purchase_orders: {
    queryKeys: [queryKeys.procurement.all, queryKeys.warehouse.all, ['purchase_orders']],
    eventName: 'PURCHASE_ORDERS_SYNCED',
  },
  sales_orders: {
    queryKeys: [queryKeys.sales.all, queryKeys.dashboard.all, ['sales_orders']],
    eventName: 'SALES_ORDERS_SYNCED',
  },
  customers: {
    queryKeys: [queryKeys.sales.all, queryKeys.masterData.all, ['customers']],
    eventName: 'CUSTOMERS_SYNCED',
  },
  quotations: {
    queryKeys: [queryKeys.sales.all, ['quotations']],
    eventName: 'QUOTATIONS_SYNCED',
  },
  rmas: {
    queryKeys: [queryKeys.sales.all, ['rmas']],
    eventName: 'RMAS_SYNCED',
  },
  boms: {
    queryKeys: [queryKeys.engineering.all, queryKeys.manufacturing.all, ['boms']],
    eventName: 'BOMS_SYNCED',
  },
  machines: {
    queryKeys: [queryKeys.masterData.all, queryKeys.manufacturing.all, queryKeys.mep.all, ['machines']],
    eventName: 'MACHINES_SYNCED',
  },
  quality_ncrs: {
    queryKeys: [queryKeys.quality.all, queryKeys.dashboard.all, ['quality_ncrs']],
    eventName: 'QUALITY_NCRS_SYNCED',
  },
  quality_capas: {
    queryKeys: [queryKeys.quality.all, ['quality_capas']],
    eventName: 'QUALITY_CAPAS_SYNCED',
  },
  quality_coas: {
    queryKeys: [queryKeys.quality.all, ['quality_coas']],
    eventName: 'QUALITY_COAS_SYNCED',
  },
  qc_inspections: {
    queryKeys: [queryKeys.quality.all, queryKeys.dashboard.all, ['qc_inspections']],
    eventName: 'QUALITY_NCRS_SYNCED',
  },
};

export function broadcastLocalMutation(domain: string, eventType: string, data: any) {
  const config = TABLE_QUERY_MAP[domain.toLowerCase()] || TABLE_QUERY_MAP[domain];
  if (config) {
    config.queryKeys.forEach((key) => {
      try {
        queryClient.invalidateQueries({ queryKey: key as any });
      } catch {}
    });
    adminEventBus.emit(config.eventName, data);
  }
}

// Server-sent change feed (GET /events, fed by the erp_notify trigger). EventSource reconnects on its own;
// every change, from any tab or user in the tenant, invalidates the matching TanStack caches.
export function initializeRealtime(): () => void {
  if (typeof EventSource === 'undefined') return () => {};
  const base = (import.meta as any).env?.VITE_API_BASE_URL || '/api/v1';
  const es = new EventSource(`${base}/events`, { withCredentials: true });
  es.addEventListener('change', (ev) => {
    try {
      const { table, id, op } = JSON.parse((ev as MessageEvent).data);
      broadcastLocalMutation(table, op, { id });
    } catch {}
  });
  return () => es.close();
}

export const initializerealtimeService = initializeRealtime;
