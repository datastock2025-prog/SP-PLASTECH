import { supabase } from '../shared/supabaseClient';
import {
  PlasticSalesOrder,
  MonthlyPlanOrder,
  OrderRelationship,
  DeliveryNoteChallan,
  FgBatchStock,
  EInvoiceRecord,
  EWayBillRecord,
  GatePassRecord,
  ComplianceExceptionRecord,
} from '../types/salesOrderDeliveryTypes';
import {
  INITIAL_PLASTIC_SALES_ORDERS,
  INITIAL_MONTHLY_PLANS,
  INITIAL_ORDER_RELATIONSHIPS,
  INITIAL_DELIVERY_NOTES,
  INITIAL_FG_BATCHES,
  INITIAL_E_INVOICES,
  INITIAL_E_WAY_BILLS,
  INITIAL_GATE_PASSES,
  INITIAL_COMPLIANCE_EXCEPTIONS,
  getNextSalesOrderNumber,
} from '../data/salesOrderDeliveryData';
import { adminEventBus, adminService } from './adminService';
import { customerMasterService, CustomerPoVersion } from './customerMasterService';

const SALES_ORDERS_CACHE_KEY = 'sp_plastech_live_sales_orders_v2';
const MONTHLY_PLANS_CACHE_KEY = 'sp_plastech_live_monthly_plans_v2';
const RELATIONSHIPS_CACHE_KEY = 'sp_plastech_live_relationships_v2';
const DELIVERIES_CACHE_KEY = 'sp_plastech_live_deliveries_v2';
const E_INVOICES_CACHE_KEY = 'sp_plastech_live_e_invoices_v2';
const E_WAY_BILLS_CACHE_KEY = 'sp_plastech_live_e_way_bills_v2';
const GATE_PASSES_CACHE_KEY = 'sp_plastech_live_gate_passes_v2';

class SalesDataService {
  // ==========================================================================
  // 1. SALES ORDERS CRUD & DB PERSISTENCE
  // ==========================================================================
  public getSalesOrdersSync(): PlasticSalesOrder[] {
    try {
      const stored = localStorage.getItem(SALES_ORDERS_CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error reading cached sales orders:', e);
    }
    return INITIAL_PLASTIC_SALES_ORDERS;
  }

  public async getSalesOrders(): Promise<PlasticSalesOrder[]> {
    try {
      const { data, error } = await supabase
        .from('sales_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const mapped: PlasticSalesOrder[] = data.map((d: any) => ({
          id: d.id,
          orderType: d.order_type,
          customer: d.customer_name,
          customerGstin: d.customer_code,
          customerPoNumber: d.customer_po_number,
          customerPoDate: d.customer_po_date,
          orderDate: d.order_date,
          requiredDeliveryDate: d.required_delivery_date,
          plant: d.plant_warehouse,
          fgStore: d.fg_store,
          priceList: d.payment_terms || 'Tier-1 Automotive Matrix',
          paymentTerms: d.payment_terms || 'Net 30 Days',
          shippingAddress: typeof d.shipping_address === 'string' ? JSON.parse(d.shipping_address) : d.shipping_address || {},
          billingAddress: typeof d.billing_address === 'string' ? JSON.parse(d.billing_address) : d.billing_address || {},
          status: d.status,
          creditStatus: d.credit_status || 'Approved',
          creditLimit: 15000000,
          currentExposure: 6420000,
          availableCredit: 8580000,
          deliveryStatus: d.delivery_status || 'Not Started',
          invoiceStatus: d.invoice_status || 'Uninvoiced',
          eInvoiceStatus: d.e_invoice_status || 'Pending',
          eWayBillStatus: d.e_way_bill_status || 'Pending',
          taxableAmount: Number(d.taxable_amount || 0),
          cgstTotal: Number(d.cgst_total || 0),
          sgstTotal: Number(d.sgst_total || 0),
          igstTotal: Number(d.igst_total || 0),
          cessTotal: 0,
          freightAmount: Number(d.freight_amount || 0),
          packingAmount: Number(d.packing_amount || 0),
          totalOrderValue: Number(d.total_order_value || 0),
          deliveredValue: Number(d.delivered_value || 0),
          invoicedValue: Number(d.invoiced_value || 0),
          remainingValue: Number(d.total_order_value || 0) - Number(d.delivered_value || 0),
          transportMode: d.transport_mode || 'Road',
          transporterName: d.transporter_name || '',
          transporterGstin: d.transporter_gstin || '',
          vehicleNumber: d.vehicle_number || '',
          incoterms: d.incoterms || 'DAP',
          deliveryTerms: 'Immediate JIT Delivery',
          packagingInstructions: 'Heavy-Duty Corrugated Master Carton',
          eInvoiceRequired: true,
          eWayBillRequired: true,
          deliveryChallanAllowed: true,
          coaRequired: true,
          msdsRequired: false,
          batchTraceabilityRequired: true,
          lines: [],
          auditTrail: typeof d.audit_trail === 'string' ? JSON.parse(d.audit_trail) : d.audit_trail || [],
        }));

        this.setSalesOrdersCache(mapped);
        return mapped;
      }
    } catch (err) {
      console.warn('Supabase sales_orders query skipped/fallback:', err);
    }
    return this.getSalesOrdersSync();
  }

  public async saveSalesOrder(order: PlasticSalesOrder): Promise<PlasticSalesOrder> {
    // 1. Update memory & Local Cache
    const current = this.getSalesOrdersSync();
    const updated = [order, ...current.filter((o) => o.id !== order.id)];
    this.setSalesOrdersCache(updated);

    // 2. Persist to DB
    try {
      await supabase.from('sales_orders').upsert({
        id: order.id,
        order_type: order.orderType,
        customer_code: order.customerGstin || 'CUST',
        customer_name: order.customer,
        customer_po_number: order.customerPoNumber,
        customer_po_date: order.customerPoDate,
        order_date: order.orderDate,
        required_delivery_date: order.requiredDeliveryDate,
        plant_warehouse: order.plant,
        fg_store: order.fgStore,
        status: order.status,
        credit_status: order.creditStatus,
        taxable_amount: order.taxableAmount,
        cgst_total: order.cgstTotal,
        sgst_total: order.sgstTotal,
        igst_total: order.igstTotal,
        freight_amount: order.freightAmount,
        packing_amount: order.packingAmount,
        total_order_value: order.totalOrderValue,
        delivered_value: order.deliveredValue,
        invoiced_value: order.invoicedValue,
        delivery_status: order.deliveryStatus,
        invoice_status: order.invoiceStatus,
        e_invoice_status: order.eInvoiceStatus,
        e_way_bill_status: order.eWayBillStatus,
        monthly_plan_ref: order.monthlyPlanRef,
        payment_terms: order.paymentTerms,
        incoterms: order.incoterms,
        transporter_name: order.transporterName,
        transporter_gstin: order.transporterGstin,
        vehicle_number: order.vehicleNumber,
        shipping_address: order.shippingAddress,
        billing_address: order.billingAddress,
        audit_trail: order.auditTrail,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Failed to upsert sales_order to DB (cached locally):', e);
    }

    // 3. Emit reactive event
    adminEventBus.emit('SALES_ORDER_CREATED', order);
    return order;
  }

  private setSalesOrdersCache(orders: PlasticSalesOrder[]) {
    try {
      localStorage.setItem(SALES_ORDERS_CACHE_KEY, JSON.stringify(orders));
    } catch (e) {
      console.warn('Error caching sales orders:', e);
    }
  }

  // ==========================================================================
  // 2. MONTHLY PLANS CRUD & DB PERSISTENCE
  // ==========================================================================
  public getMonthlyPlansSync(): MonthlyPlanOrder[] {
    try {
      const stored = localStorage.getItem(MONTHLY_PLANS_CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error reading cached monthly plans:', e);
    }
    return INITIAL_MONTHLY_PLANS;
  }

  public async getMonthlyPlans(): Promise<MonthlyPlanOrder[]> {
    try {
      const { data, error } = await supabase
        .from('monthly_plan_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const mapped: MonthlyPlanOrder[] = data.map((d: any) => ({
          id: d.id,
          planNumber: d.plan_number,
          monthPeriod: d.month_period,
          customer: d.customer,
          customerCode: d.customer_code,
          customerPoNumber: d.customer_po_number,
          plantWarehouse: d.plant_warehouse,
          status: d.status,
          totalPlannedQty: Number(d.total_planned_qty || 0),
          totalDailySuppliedQty: Number(d.total_daily_supplied_qty || 0),
          remainingPlanQty: Number(d.remaining_plan_qty || 0),
          totalPlannedValue: Number(d.total_planned_value || 0),
          items: typeof d.items === 'string' ? JSON.parse(d.items) : d.items || [],
          unitBreakdowns: typeof d.unit_breakdowns === 'string' ? JSON.parse(d.unit_breakdowns) : d.unit_breakdowns || [],
        }));

        this.setMonthlyPlansCache(mapped);
        return mapped;
      }
    } catch (err) {
      console.warn('Supabase monthly_plan_orders query skipped/fallback:', err);
    }
    return this.getMonthlyPlansSync();
  }

  public async saveMonthlyPlan(plan: MonthlyPlanOrder): Promise<MonthlyPlanOrder> {
    const current = this.getMonthlyPlansSync();
    const updated = [plan, ...current.filter((p) => p.id !== plan.id)];
    this.setMonthlyPlansCache(updated);

    try {
      await supabase.from('monthly_plan_orders').upsert({
        id: plan.id,
        plan_number: plan.planNumber || plan.id,
        month_period: plan.monthPeriod,
        customer: plan.customer,
        customer_code: plan.customerCode || 'CUST',
        customer_po_number: plan.customerPoNumber,
        plant_warehouse: plan.plantWarehouse,
        status: plan.status,
        total_planned_qty: plan.totalPlannedQty,
        total_daily_supplied_qty: plan.totalDailySuppliedQty || 0,
        remaining_plan_qty: plan.remainingPlanQty,
        total_planned_value: plan.totalPlannedValue,
        items: plan.items,
        unit_breakdowns: plan.unitBreakdowns || [],
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Failed to upsert monthly_plan to DB:', e);
    }

    adminEventBus.emit('MONTHLY_PLAN_CREATED', plan);
    return plan;
  }

  private setMonthlyPlansCache(plans: MonthlyPlanOrder[]) {
    try {
      localStorage.setItem(MONTHLY_PLANS_CACHE_KEY, JSON.stringify(plans));
    } catch (e) {
      console.warn('Error caching monthly plans:', e);
    }
  }

  // ==========================================================================
  // 3. RECONCILIATION ORDER RELATIONSHIPS
  // ==========================================================================
  public getRelationshipsSync(): OrderRelationship[] {
    try {
      const stored = localStorage.getItem(RELATIONSHIPS_CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error reading cached relationships:', e);
    }
    return INITIAL_ORDER_RELATIONSHIPS;
  }

  public async saveRelationships(newRels: OrderRelationship[]): Promise<OrderRelationship[]> {
    try {
      localStorage.setItem(RELATIONSHIPS_CACHE_KEY, JSON.stringify(newRels));
    } catch (e) {
      console.warn('Error caching relationships:', e);
    }

    try {
      for (const r of newRels) {
        await supabase.from('order_relationships').upsert({
          id: r.id,
          monthly_plan_id: r.monthlyPlanId,
          monthly_plan_line_item: r.monthlyPlanLineItem,
          linked_daily_so_id: r.linkedDailySoId,
          linked_daily_so_line_item: r.linkedDailySoLineItem,
          link_type: r.linkType,
          linked_quantity: r.linkedQuantity,
          remaining_monthly_quantity: r.remainingMonthlyQuantity,
          mapping_reason: r.mappingReason,
          mapped_by: r.mappedBy,
          mapping_date: r.mappingDate || new Date().toISOString(),
          approval_status: r.approvalStatus,
        });
      }
    } catch (e) {
      console.warn('Failed to upsert relationships to DB:', e);
    }

    adminEventBus.emit('RELATIONSHIPS_UPDATED', newRels);
    return newRels;
  }

  // ==========================================================================
  // 4. DELIVERY NOTES / CHALLANS
  // ==========================================================================
  public getDeliveriesSync(): DeliveryNoteChallan[] {
    try {
      const stored = localStorage.getItem(DELIVERIES_CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error reading cached deliveries:', e);
    }
    return INITIAL_DELIVERY_NOTES;
  }

  public saveDeliverySync(delivery: DeliveryNoteChallan): DeliveryNoteChallan[] {
    const current = this.getDeliveriesSync();
    const updated = [delivery, ...current.filter((d) => d.id !== delivery.id)];
    try {
      localStorage.setItem(DELIVERIES_CACHE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Error saving delivery cache:', e);
    }
    adminEventBus.emit('DELIVERY_CREATED', delivery);
    return updated;
  }

  // ==========================================================================
  // 5. E-INVOICES, E-WAY BILLS & GATE PASSES
  // ==========================================================================
  public getEInvoicesSync(): EInvoiceRecord[] {
    try {
      const stored = localStorage.getItem(E_INVOICES_CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error reading cached e-invoices:', e);
    }
    return INITIAL_E_INVOICES;
  }

  public saveEInvoicesSync(invoices: EInvoiceRecord[]) {
    try {
      localStorage.setItem(E_INVOICES_CACHE_KEY, JSON.stringify(invoices));
    } catch (e) {
      console.warn('Error caching e-invoices:', e);
    }
  }

  public getEWayBillsSync(): EWayBillRecord[] {
    try {
      const stored = localStorage.getItem(E_WAY_BILLS_CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error reading cached e-way bills:', e);
    }
    return INITIAL_E_WAY_BILLS;
  }

  public saveEWayBillsSync(ewbs: EWayBillRecord[]) {
    try {
      localStorage.setItem(E_WAY_BILLS_CACHE_KEY, JSON.stringify(ewbs));
    } catch (e) {
      console.warn('Error caching e-way bills:', e);
    }
  }

  public getGatePassesSync(): GatePassRecord[] {
    try {
      const stored = localStorage.getItem(GATE_PASSES_CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error reading cached gate passes:', e);
    }
    return INITIAL_GATE_PASSES;
  }

  public saveGatePassesSync(passes: GatePassRecord[]) {
    try {
      localStorage.setItem(GATE_PASSES_CACHE_KEY, JSON.stringify(passes));
    } catch (e) {
      console.warn('Error caching gate passes:', e);
    }
  }

  public getBatchesSync(): FgBatchStock[] {
    return INITIAL_FG_BATCHES;
  }

  public getComplianceExceptionsSync(): ComplianceExceptionRecord[] {
    return INITIAL_COMPLIANCE_EXCEPTIONS;
  }
}

export const salesDataService = new SalesDataService();

