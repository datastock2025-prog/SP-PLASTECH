import { supabase } from '../shared/supabaseClient';
import { db } from '../shared/db';
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
const SUMMARY_TTL_MS = 60 * 1000; // 60s memory cache

export const dashboardSummaryService = {
  /**
   * Fetch all core screen data in ONE single consolidated PostgreSQL RPC call
   * Endpoint: POST https://gqrelwvmeoqvfnanoutz.supabase.co/rest/v1/rpc/get_dashboard_summary
   */
  async getDashboardSummary(force = false): Promise<DashboardSummaryPayload> {
    const now = Date.now();
    if (!force && cachedSummary && now - cachedSummaryTimestamp < SUMMARY_TTL_MS) {
      return cachedSummary;
    }

    try {
      // 1. Single Consolidated Supabase RPC Call to PostgreSQL
      const { data, error } = await supabase.rpc('get_dashboard_summary');

      if (!error && data && typeof data === 'object') {
        const payload: DashboardSummaryPayload = {
          items: Array.isArray(data.items) ? data.items : [],
          work_orders: Array.isArray(data.work_orders) ? data.work_orders : [],
          purchase_orders: Array.isArray(data.purchase_orders) ? data.purchase_orders : [],
          sales_orders: Array.isArray(data.sales_orders) ? data.sales_orders : [],
          customers: Array.isArray(data.customers) ? data.customers : [],
          machines: Array.isArray(data.machines) ? data.machines : [],
          quality_ncrs: Array.isArray(data.quality_ncrs) ? data.quality_ncrs : [],
          plants: Array.isArray(data.plants) ? data.plants : [],
          server_time: data.server_time,
        };

        cachedSummary = payload;
        cachedSummaryTimestamp = now;
        return payload;
      }
    } catch {
      // RPC fallback to consolidated query
    }

    // 2. Resilient fallback to live db if RPC is pending deployment
    try {
      const [items, workOrders, customers] = await Promise.all([
        db.findMany<ItemMaster>('items', { limit: 50 }),
        db.findMany<WorkOrder>('work_orders', { limit: 50 }),
        db.findMany<Customer>('customers', { limit: 50 }),
      ]);

      const fallback: DashboardSummaryPayload = {
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

      cachedSummary = fallback;
      cachedSummaryTimestamp = now;
      return fallback;
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
    }
  },
};
