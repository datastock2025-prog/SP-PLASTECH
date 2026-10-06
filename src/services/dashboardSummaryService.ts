import { db } from '../shared/db';
import { itemService } from './itemService';
import {
  ItemMaster,
  WorkOrder,
  PurchaseOrder,
  SalesOrder,
  Customer,
  MachineMaster,
  NonConformanceReport,
} from '../types';

export interface DashboardSummaryPayload {
  items: ItemMaster[];
  work_orders: WorkOrder[];
  purchase_orders: PurchaseOrder[];
  sales_orders: SalesOrder[];
  customers: Customer[];
  machines: MachineMaster[];
  quality_ncrs: NonConformanceReport[];
  plants: any[];
  server_time?: string;
}

let cachedSummary: DashboardSummaryPayload | null = null;
let cachedSummaryTimestamp = 0;
let inFlightSummary: Promise<DashboardSummaryPayload> | null = null;
const SUMMARY_TTL_MS = 60 * 1000; // 60s memory cache

export const dashboardSummaryService = {
  /**
   * Fetch primary live PostgreSQL data directly from Supabase Cloud tables
   * Identical, deterministic API calls across all browsers with in-flight deduplication
   */
  async getDashboardSummary(force = false): Promise<DashboardSummaryPayload> {
    const now = Date.now();
    if (!force && cachedSummary && now - cachedSummaryTimestamp < SUMMARY_TTL_MS) {
      return cachedSummary;
    }

    if (inFlightSummary) {
      return inFlightSummary;
    }

    inFlightSummary = (async () => {
      try {
        // Direct live PostgreSQL queries against Supabase Cloud tables without artificial limits
        const [items, workOrders, customers] = await Promise.all([
          itemService.getItems(),
          db.findMany<WorkOrder>('work_orders', { orderBy: { column: 'created_at', ascending: false } }),
          db.findMany<Customer>('customers', { orderBy: { column: 'name', ascending: true } }),
        ]);

        const payload: DashboardSummaryPayload = {
          items: items || [],
          work_orders: workOrders || [],
          purchase_orders: [],
          sales_orders: [],
          customers: customers || [],
          machines: [],
          quality_ncrs: [],
          plants: [],
          server_time: new Date().toISOString(),
        };

        cachedSummary = payload;
        cachedSummaryTimestamp = Date.now();
        return payload;
      } catch {
        return {
          items: [],
          work_orders: [],
          purchase_orders: [],
          sales_orders: [],
          customers: [],
          machines: [],
          quality_ncrs: [],
          plants: [],
          server_time: new Date().toISOString(),
        };
      } finally {
        inFlightSummary = null;
      }
    })();

    return inFlightSummary;
  },

  /**
   * Invalidate memory cache immediately on mutation events
   */
  invalidateCache(): void {
    cachedSummary = null;
    cachedSummaryTimestamp = 0;
  },
};

