import { supabase } from '../shared/supabaseClient';

// ============================================================================
// SUPABASE ENTERPRISE DATA SERVICE — REBOOT ERP
// Complete End-to-End Real-Time Database Bridge for all ERP Modules
// ============================================================================

export interface DbResult<T> {
  data: T | null;
  error: string | null;
}

export const SupabaseDataService = {
  // 1. MASTER DATA: ITEMS
  async getItems(): Promise<DbResult<any[]>> {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('code', { ascending: true });
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  async upsertItem(item: Record<string, any>): Promise<DbResult<any>> {
    try {
      const { data, error } = await supabase
        .from('items')
        .upsert(item, { onConflict: 'code' })
        .select()
        .single();
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  // 2. PROCUREMENT: SUPPLIERS
  async getSuppliers(): Promise<DbResult<any[]>> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  async upsertSupplier(supplier: Record<string, any>): Promise<DbResult<any>> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .upsert(supplier, { onConflict: 'id' })
        .select()
        .single();
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  // 3. PROCUREMENT: PURCHASE ORDERS
  async getPurchaseOrders(): Promise<DbResult<any[]>> {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  async upsertPurchaseOrder(po: Record<string, any>): Promise<DbResult<any>> {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .upsert(po, { onConflict: 'id' })
        .select()
        .single();
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  // 4. MANUFACTURING: MACHINES & WORK ORDERS
  async getMachines(): Promise<DbResult<any[]>> {
    try {
      const { data, error } = await supabase
        .from('machines')
        .select('*')
        .order('machine_code', { ascending: true });
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  async getWorkOrders(): Promise<DbResult<any[]>> {
    try {
      const { data, error } = await supabase
        .from('work_orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  // 5. SALES & CUSTOMERS
  async getCustomers(): Promise<DbResult<any[]>> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  async getSalesOrders(): Promise<DbResult<any[]>> {
    try {
      const { data, error } = await supabase
        .from('sales_orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  // 6. QUALITY: INSPECTIONS
  async getQcInspections(): Promise<DbResult<any[]>> {
    try {
      const { data, error } = await supabase
        .from('qc_inspections')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  },

  // 7. AUDIT LOGGING (APPEND-ONLY)
  async recordAuditLog(log: {
    actionType: string;
    entityName: string;
    recordId: string;
    userEmail: string;
    userRole?: string;
    changes?: Record<string, any>;
  }): Promise<void> {
    try {
      await supabase.from('audit_logs').insert([
        {
          action_type: log.actionType,
          entity_name: log.entityName,
          record_id: log.recordId,
          user_email: log.userEmail,
          user_role: log.userRole || 'USER',
          changes: log.changes || {},
        },
      ]);
    } catch (err) {
      console.warn('Supabase audit log warning:', err);
    }
  },

  // 8. REALTIME SUBSCRIPTION HELPER
  subscribeToTable(table: string, onUpdate: (payload: any) => void) {
    return supabase
      .channel(`public:${table}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => onUpdate(payload)
      )
      .subscribe();
  },
};

export default SupabaseDataService;
