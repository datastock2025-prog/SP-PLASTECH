// ============================================================================
// SUPABASE REALTIME POSTGRESQL CHANGE LISTENER & QUERY INVALIDATION LAYER
// Replaces custom sync managers with standard Supabase WebSocket CDC subscriptions
// ============================================================================

import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../../shared/supabaseClient';
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
};

let realtimeChannel: RealtimeChannel | null = null;
let isSubscribed = false;

/**
 * Initializes Supabase Realtime WebSocket subscription on public tables.
 * When a change is detected in PostgreSQL, it automatically invalidates TanStack React Query
 * caches and emits domain events so all open browsers (Chrome, Brave, Edge) re-fetch in real-time.
 */
export function initializeSupabaseRealtime(): () => void {
  if (isSubscribed || typeof window === 'undefined') return () => {};
  isSubscribed = true;

  try {
    realtimeChannel = supabase
      .channel('public:realtime_erp_mesh')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          const table = payload.table;
          const config = TABLE_QUERY_MAP[table];

          if (config) {
            // 1. Invalidate TanStack Query caches across all open browsers
            config.queryKeys.forEach((key) => {
              try {
                queryClient.invalidateQueries({ queryKey: key as any });
              } catch (err) {
                console.warn(`[SupabaseRealtime] Invalidation error for ${table}:`, err);
              }
            });

            // 2. Dispatch domain sync event to reactive state listeners
            adminEventBus.emit(config.eventName, payload.new || payload.old);

            // 3. Handle item-specific events
            if (table === 'items') {
              if (payload.eventType === 'DELETE') {
                const code = (payload.old as any)?.code || (payload.old as any)?.id;
                if (code) adminEventBus.emit('ITEM_DELETED', { code });
              } else if (payload.new) {
                adminEventBus.emit('ITEM_SAVED', payload.new);
              }
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.info('[SupabaseRealtime] Connected to PostgreSQL Realtime WebSocket Mesh');
        }
      });
  } catch (err) {
    console.warn('[SupabaseRealtime] Initialization skipped:', err);
  }

  return () => {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }
    isSubscribed = false;
  };
}

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
