import { memoryStorage } from '../shared/memoryStore';
import { broadcastLocalMutation } from './realtime/realtimeService';
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
import { api } from '../lib/api-client';

// Pure REST domain bridge replacing deprecated legacy db adapter
const db = {
  findMany: async <T = any>(table: string, _opts?: any): Promise<T[]> => {
    try {
      const endpoint = `/${table.replace(/_/g, '-')}`;
      const res = await api.get<any>(endpoint, { params: { limit: 100 } });
      const rows = res?.data?.data || res?.data;
      if (Array.isArray(rows)) return rows;
    } catch {}
    return [];
  },
  findOne: async <T = any>(table: string, id: string): Promise<T | null> => {
    try {
      const endpoint = `/${table.replace(/_/g, '-')}/${encodeURIComponent(id)}`;
      const res = await api.get<any>(endpoint);
      return res?.data?.data || res?.data || null;
    } catch {}
    return null;
  },
  upsert: async <T = any>(table: string, item: any, key: string = 'id'): Promise<T> => {
    const id = item[key] || item.id;
    const endpoint = `/${table.replace(/_/g, '-')}`;
    if (id) {
      try {
        const res = await api.patch<any>(`${endpoint}/${encodeURIComponent(id)}`, item);
        const row = res?.data?.data || res?.data;
        if (row && typeof row === 'object') return row;
      } catch {}
    }
    try {
      const res = await api.post<any>(endpoint, item);
      const row = res?.data?.data || res?.data;
      if (row && typeof row === 'object') return row;
    } catch {}
    return item;
  },
  delete: async (table: string, id: string): Promise<boolean> => {
    try {
      await api.delete(`/${table.replace(/_/g, '-')}/${encodeURIComponent(id)}`);
      return true;
    } catch {
      return false;
    }
  },
};

const SALES_ORDERS_CACHE_KEY = 'sp_plastech_live_sales_orders_v2';
const MONTHLY_PLANS_CACHE_KEY = 'sp_plastech_live_monthly_plans_v2';
const RELATIONSHIPS_CACHE_KEY = 'sp_plastech_live_relationships_v2';
const DELIVERIES_CACHE_KEY = 'sp_plastech_live_deliveries_v2';
const E_INVOICES_CACHE_KEY = 'sp_plastech_live_e_invoices_v2';
const E_WAY_BILLS_CACHE_KEY = 'sp_plastech_live_e_way_bills_v2';
const GATE_PASSES_CACHE_KEY = 'sp_plastech_live_gate_passes_v2';

const FG_BATCHES_CACHE_KEY = 'sp_plastech_live_fg_batches_v2';

class SalesDataService {
  private inMemoryOrders: PlasticSalesOrder[] | null = null;
  private inMemoryPlans: MonthlyPlanOrder[] | null = null;

  constructor() {
    // Listen for cross-browser sync events from other browsers/tabs
    if (typeof window !== 'undefined') {
      adminEventBus.on('SALES_ORDERS_SYNCED', (event: any) => {
        if (event?.data) {
          const incoming = event.data;
          const current = this.inMemoryOrders || this.getSalesOrdersSync();
          const exists = current.some((o) => o.id === incoming.id);
          const updated = exists
            ? current.map((o) => (o.id === incoming.id ? { ...o, ...incoming } : o))
            : [incoming, ...current];
          this.inMemoryOrders = updated;
          this.setSalesOrdersCache(updated);
          adminEventBus.emit('SALES_ORDER_CREATED', incoming);
        }
      });

      adminEventBus.on('MONTHLY_PLANS_SYNCED', (event: any) => {
        if (event?.data) {
          const incoming = event.data;
          const current = this.inMemoryPlans || this.getMonthlyPlansSync();
          const exists = current.some((p) => p.id === incoming.id);
          const updated = exists
            ? current.map((p) => (p.id === incoming.id ? { ...p, ...incoming } : p))
            : [incoming, ...current];
          this.inMemoryPlans = updated;
          this.setMonthlyPlansCache(updated);
          adminEventBus.emit('MONTHLY_PLAN_CREATED', incoming);
        }
      });
    }
  }

  // ==========================================================================
  // 1. SALES ORDERS CRUD & DB PERSISTENCE (DATABASE-FIRST)
  // ==========================================================================
  public getSalesOrdersSync(): PlasticSalesOrder[] {
    if (this.inMemoryOrders !== null) {
      return this.inMemoryOrders;
    }
    try {
      const stored = memoryStorage.getItem(SALES_ORDERS_CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.inMemoryOrders = parsed;
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading cached sales orders:', e);
    }
    return [];
  }

  public saveSalesOrdersSync(orders: PlasticSalesOrder[]) {
    this.inMemoryOrders = orders;
    try {
      memoryStorage.setItem(SALES_ORDERS_CACHE_KEY, JSON.stringify(orders));
    } catch (e) {
      console.warn('Error saving sales orders to cache:', e);
    }
  }

  public saveMonthlyPlansSync(plans: MonthlyPlanOrder[]) {
    this.inMemoryPlans = plans;
    try {
      memoryStorage.setItem(MONTHLY_PLANS_CACHE_KEY, JSON.stringify(plans));
    } catch (e) {
      console.warn('Error saving monthly plans to cache:', e);
    }
  }

  public async getSalesOrders(): Promise<PlasticSalesOrder[]> {
    try {
      const data = await db.findMany<any>('sales_orders', {
        orderBy: { column: 'created_at', ascending: false },
      });

      if (Array.isArray(data) && data.length > 0) {
        const mapped: PlasticSalesOrder[] = data.map((d: any) => {
          const rawItems = Array.isArray(d.items) ? d.items : [];
          const lines = rawItems.map((item: any, idx: number) => {
            const qty = Number(item.orderedQty || item.plannedQty || item.quantity || item.qty || 0);
            const delQty = Number(item.deliveredQty || item.dispatched || 0);
            const rate = Number(item.rate || item.unitPrice || item.price || 0);
            const taxable = Number(item.taxableValue || item.taxableAmount || (qty * rate));
            const total = Number(item.totalValue || item.totalAmount || (taxable * 1.18));
            return {
              lineNumber: item.lineNumber || (idx + 1),
              itemCode: item.itemCode || item.code || item.item_code || item.item || 'BODYLATCH-001',
              itemName: item.itemName || item.name || item.item_name || 'Body Latch Assembly LH/RH',
              customerItemCode: item.customerItemCode || item.customerCode || 'CUST-BL-01',
              hsn: item.hsn || '39269099',
              polymerGrade: item.polymerGrade || item.polymer || 'Reliance Repol H110MA',
              mouldCode: item.mouldCode || item.moldId || 'MOLD-001',
              orderedQty: qty,
              allocatedQty: qty,
              pickedQty: 0,
              packedQty: 0,
              deliveredQty: delQty,
              invoicedQty: delQty,
              remainingQty: Math.max(0, qty - delQty),
              availableStock: Number(item.availableStock || 5000),
              reservedStock: qty,
              uom: item.uom || 'PCS',
              unitPrice: rate,
              taxableValue: taxable,
              totalValue: total,
              shortageQty: 0,
              status: item.status || 'Active',
              plant: item.plant || (d.plant_id ? 'PLT-01 - Plant 1 - Pimpri Auto-Hub' : 'PLT-01 - Plant 1 - Pimpri Auto-Hub'),
              fgStore: item.fgStore || 'FG-Automotive Cell',
              batchPreference: item.batchPreference || 'FEFO Strict',
              requestedDeliveryDate: d.delivery_date || d.order_date || new Date().toISOString().slice(0, 10),
            };
          });

          const totalVal = Number(d.total_amount || d.total_order_value || 0) || lines.reduce((acc: number, l: any) => acc + l.totalValue, 0);
          const delVal = lines.reduce((acc: number, l: any) => acc + (l.deliveredQty * l.unitPrice * 1.18), 0);
          const taxAmt = lines.reduce((acc: number, l: any) => acc + l.taxableValue, 0);
          const soId = d.so_number || d.soNumber || d.id;

          return {
            id: soId,
            dbId: d.id,
            soNumber: soId,
            linkType: d.link_type || (soId.startsWith('PLN-') ? 'Linked' : 'STANDARD'),
            salesperson: d.salesperson || 'Commercial Sales Desk',
            currency: d.currency || 'INR',
            orderType: d.order_type || (soId.startsWith('PLN-') ? 'Monthly Plan Order' : 'Daily Sales Order'),
            customer: d.customer_name || d.customer_id || d.customer || 'Supreme Polymers India Ltd',
            customerGstin: d.customer_code || d.customer_gstin || '27AAACS1234F1Z5',
            customerPoNumber: d.customer_po_number || d.customerPoNumber || ('PO-' + soId.slice(-8)),
            customerPoDate: d.customer_po_date || d.order_date || new Date().toISOString().slice(0, 10),
            orderDate: d.order_date || new Date().toISOString().slice(0, 10),
            requiredDeliveryDate: d.delivery_date || d.required_delivery_date || d.order_date || new Date().toISOString().slice(0, 10),
            plant: d.plant_warehouse || (d.plant_id ? 'PLT-01 - Plant 1 - Pimpri Auto-Hub' : 'PLT-01 - Plant 1 - Pimpri Auto-Hub'),
            fgStore: d.fg_store || 'FG-Automotive Cell',
            priceList: d.payment_terms || 'Tier-1 Automotive Matrix',
            paymentTerms: d.payment_terms || 'Net 30 Days',
            shippingAddress: typeof d.shipping_address === 'string' ? JSON.parse(d.shipping_address) : d.shipping_address || {},
            billingAddress: typeof d.billing_address === 'string' ? JSON.parse(d.billing_address) : d.billing_address || {},
            status: d.status || 'Approved',
            creditStatus: d.credit_status || 'Approved',
            creditLimit: 15000000,
            currentExposure: 6420000,
            availableCredit: 8580000,
            deliveryStatus: d.delivery_status || (delVal > 0 ? (delVal >= totalVal ? 'Fully Delivered' : 'Partially Delivered') : 'Not Started'),
            invoiceStatus: d.invoice_status || 'Uninvoiced',
            eInvoiceStatus: d.e_invoice_status || 'Pending',
            eWayBillStatus: d.e_way_bill_status || 'Pending',
            taxableAmount: taxAmt,
            cgstTotal: Math.round(taxAmt * 0.09),
            sgstTotal: Math.round(taxAmt * 0.09),
            igstTotal: 0,
            cessTotal: 0,
            freightAmount: Number(d.freight_amount || 0),
            packingAmount: Number(d.packing_amount || 0),
            totalOrderValue: Math.round(totalVal),
            deliveredValue: Math.round(delVal),
            invoicedValue: Number(d.invoiced_value || 0),
            remainingValue: Math.max(0, Math.round(totalVal - delVal)),
            transportMode: d.transport_mode || 'Road',
            transporterName: d.transporter_name || 'VRL Logistics Ltd',
            transporterGstin: d.transporter_gstin || '29AABCV1234F1Z1',
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
            lines: lines,
            auditTrail: typeof d.audit_trail === 'string' ? JSON.parse(d.audit_trail) : d.audit_trail || [
              {
                action: 'Order synchronized from live PostgreSQL',
                user: 'System API',
                timestamp: d.created_at || new Date().toISOString(),
              }
            ],
          };
        });

        this.inMemoryOrders = mapped;
        this.setSalesOrdersCache(mapped);
        return mapped;
      }
    } catch (err) {
      console.warn('DB sales_orders query fallback:', err);
    }
    return this.getSalesOrdersSync();
  }

  public async approveSalesOrder(soId: string): Promise<boolean> {
    const current = this.inMemoryOrders || this.getSalesOrdersSync();
    const target = current.find((o) => o.id === soId || (o as any).soNumber === soId);
    if (target) {
      target.status = 'Approved';
      if (!target.auditTrail) target.auditTrail = [];
      target.auditTrail.push({
        action: 'Sales Order Approved & Released to Shop Floor',
        user: 'System Administrator (Super Admin)',
        timestamp: new Date().toISOString(),
      });
      this.inMemoryOrders = [...current];
      this.setSalesOrdersCache(this.inMemoryOrders);
    }

    try {
      await db.upsert('sales_orders', {
        so_number: soId,
        status: 'Approved',
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('DB approve sales_order notice:', e);
    }

    adminEventBus.emit('SALES_ORDER_UPDATED', { id: soId, status: 'Approved' });
    broadcastLocalMutation('SALES_ORDERS', 'UPDATE', { id: soId, status: 'Approved' });
    return true;
  }

  public async saveSalesOrder(order: PlasticSalesOrder): Promise<PlasticSalesOrder> {
    const current = this.inMemoryOrders || this.getSalesOrdersSync();
    const updated = [order, ...current.filter((o) => o.id !== order.id)];
    this.inMemoryOrders = updated;
    this.setSalesOrdersCache(updated);

    try {
      await db.upsert('sales_orders', {
        id: (order as any).dbId || (order.id.includes('-') && order.id.length === 36 ? order.id : undefined),
        so_number: order.id,
        customer_id: order.customer,
        status: order.status || 'Pending Approval',
        total_amount: order.totalOrderValue,
        order_date: order.orderDate,
        delivery_date: order.requiredDeliveryDate,
        plant_id: order.plant?.split(' - ')[0] || null,
        items: order.lines,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Failed to upsert sales_order to DB:', e);
    }

    adminEventBus.emit('SALES_ORDER_CREATED', order);
    broadcastLocalMutation('SALES_ORDERS', 'INSERT', order);
    return order;
  }

    private setSalesOrdersCache(orders: PlasticSalesOrder[]) {
    try {
      memoryStorage.setItem(SALES_ORDERS_CACHE_KEY, JSON.stringify(orders));
    } catch (e) {
      console.warn('Error caching sales orders:', e);
    }
  }

  // ==========================================
  // 2. MONTHLY PLANS CRUD & DB PERSISTENCE (DATABASE-FIRST)
  // ==========================================
  public getMonthlyPlansSync(): MonthlyPlanOrder[] {
    if (this.inMemoryPlans !== null) {
      return this.inMemoryPlans;
    }
    try {
      const stored = memoryStorage.getItem(MONTHLY_PLANS_CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.inMemoryPlans = parsed;
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading cached monthly plans:', e);
    }
    return [];
  }

  public async getMonthlyPlans(): Promise<MonthlyPlanOrder[]> {
    try {
      const res = await api.get<any>('/sales-orders', { params: { limit: 100 } });
      const orders = res?.data?.data || res?.data || [];
      const plansFromDb = Array.isArray(orders) ? orders.filter((o: any) => 
        (o.so_number && o.so_number.startsWith('PLN-')) || 
        o.order_type === 'Monthly Plan Order'
      ) : [];

      if (plansFromDb.length > 0) {
        const mapped: MonthlyPlanOrder[] = plansFromDb.map((d: any) => {
          const rawItems = Array.isArray(d.items) ? d.items : [];
          const totalPlannedQty = rawItems.reduce((s: number, i: any) => s + (Number(i.plannedQty || i.orderedQty || 0)), 0) || 25000;
          const totalDailySuppliedQty = rawItems.reduce((s: number, i: any) => s + (Number(i.deliveredQty || 0)), 0) || 8500;
          const remainingPlanQty = Math.max(0, totalPlannedQty - totalDailySuppliedQty);
          const totalPlannedValue = Number(d.total_amount || 0) || 1375000;

          return {
            id: d.so_number || d.id,
            customer: d.customer_id || 'Supreme Polymers India Ltd',
            customerGstin: d.customer_gstin || '27AAACS1234F1Z5',
            monthPeriod: 'October 2026',
            planType: 'Monthly supply plan',
            consumptionMode: 'Auto-consume, disabled by default',
            billingMode: 'Non-billable plan',
            status: d.status || 'Active',
            plant: d.plant_id || 'Plant 1 - Pimpri Auto-Hub',
            fgStore: 'FG-Automotive Cell',
            createdDate: d.order_date || new Date().toISOString().slice(0, 10),
            totalPlannedQty,
            totalDailySuppliedQty,
            remainingPlanQty,
            varianceQty: 0,
            variancePct: 0,
            totalPlannedValue,
            items: rawItems,
            auditTrail: [],
          };
        });

        this.inMemoryPlans = mapped;
        this.saveMonthlyPlansSync(mapped);
        return mapped;
      }
    } catch (err) {
      console.warn('API monthly plans fetch error:', err);
    }
    return this.getMonthlyPlansSync();
  }

  public async saveMonthlyPlan(plan: MonthlyPlanOrder): Promise<MonthlyPlanOrder> {
    const current = this.inMemoryPlans || this.getMonthlyPlansSync();
    const updated = [plan, ...current.filter((p) => p.id !== plan.id)];
    this.inMemoryPlans = updated;
    this.setMonthlyPlansCache(updated);

    try {
      await db.upsert('monthly_plan_orders', {
        id: plan.id,
        plan_number: plan.id,
        month_period: plan.monthPeriod,
        customer: plan.customer,
        customer_code: plan.customerGstin || 'CUST',
        customer_po_number: (plan as any).customerPoNumber || plan.id,
        plant_warehouse: plan.plant,
        status: plan.status,
        total_planned_qty: plan.totalPlannedQty,
        total_daily_supplied_qty: plan.totalDailySuppliedQty || 0,
        remaining_plan_qty: plan.remainingPlanQty,
        total_planned_value: plan.totalPlannedValue,
        items: plan.items,
        unit_breakdowns: (plan as any).unitBreakdowns || [],
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Failed to upsert monthly_plan to DB:', e);
    }

    adminEventBus.emit('MONTHLY_PLAN_CREATED', plan);
    broadcastLocalMutation('MONTHLY_PLANS', 'INSERT', plan);
    return plan;
  }

  private setMonthlyPlansCache(plans: MonthlyPlanOrder[]) {
    try {
      memoryStorage.setItem(MONTHLY_PLANS_CACHE_KEY, JSON.stringify(plans));
    } catch (e) {
      console.warn('Error caching monthly plans:', e);
    }
  }

  // ==========================================================================
  // 3. RECONCILIATION ORDER RELATIONSHIPS
  // ==========================================================================
  public getRelationshipsSync(): OrderRelationship[] {
    try {
      const stored = memoryStorage.getItem(RELATIONSHIPS_CACHE_KEY);
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
      memoryStorage.setItem(RELATIONSHIPS_CACHE_KEY, JSON.stringify(newRels));
    } catch (e) {
      console.warn('Error caching relationships:', e);
    }

    try {
      for (const r of newRels) {
        await db.upsert('order_relationships', {
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
      const stored = memoryStorage.getItem(DELIVERIES_CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error reading cached deliveries:', e);
    }
    return [];
  }

  public async getDeliveries(): Promise<DeliveryNoteChallan[]> {
    try {
      const data = await db.findMany<any>('delivery_challans', {
        orderBy: { column: 'created_at', ascending: false },
      });
      if (Array.isArray(data)) {
        const mapped: DeliveryNoteChallan[] = data.map((d: any) => ({
          id: d.id,
          type: 'Delivery Challan',
          salesOrderId: d.so_id,
          salesOrderType: 'Daily dispatch call-off',
          customer: d.customer_id,
          customerGstin: '27AABCA1234A1Z5',
          shipToAddress: 'Delivery Address',
          shipToGstin: '27AABCA1234A1Z5',
          placeOfSupply: 'Maharashtra (27)',
          plant: 'Main Plant Pune',
          fgStore: 'WH-FG-01',
          deliveryDate: d.dispatch_date || new Date().toISOString().split('T')[0],
          status: (d.status === 'dispatched' ? 'Dispatched' : 'Draft') as any,
          transportMode: 'Road',
          transporterName: d.transporter || 'VRL Logistics',
          transporterIdGstin: '27AAACL1234A1Z1',
          vehicleNumber: d.vehicle_no || '',
          lrNumber: d.lr_number || '',
          dispatchPoint: 'Gate 1',
          estimatedDistanceKm: 50,
          expectedDeparture: new Date().toISOString(),
          expectedArrival: new Date().toISOString(),
          invoiceValue: Number(d.total_amount || 0),
          taxableValue: Number(d.total_amount || 0),
          cgstAmount: 0,
          sgstAmount: 0,
          igstAmount: 0,
          eInvoiceStatus: 'Not Required',
          eWayBillStatus: 'Not Required',
          ewbPartA: false,
          ewbPartB: false,
          gatePassStatus: 'Not Generated',
          packageCount: 1,
          grossWeightKg: 0,
          netWeightKg: 0,
          podStatus: 'Pending',
          items: Array.isArray(d.lines)
            ? d.lines.map((l: any, idx: number) => ({
                soLineNumber: idx + 1,
                itemCode: l.item_code || l.itemCode || '',
                itemName: l.item_name || l.itemName || l.item_code || '',
                orderedQty: Number(l.quantity || l.qty || 0),
                deliveredQty: Number(l.quantity || l.qty || 0),
                remainingQty: 0,
                requestedQty: Number(l.quantity || l.qty || 0),
                pickedQty: Number(l.quantity || l.qty || 0),
                packedQty: Number(l.quantity || l.qty || 0),
                uom: l.uom || 'PCS',
                plant: 'Main Plant Pune',
                fgStore: 'WH-FG-01',
                batchLot: 'DEFAULT',
                locationCode: 'WH-FG-01',
                hsn: '3923',
                unitPrice: Number(l.unit_price || l.unitPrice || 0),
                taxableValue: Number(l.total_price || 0),
                gstRatePct: 18,
                cgstAmount: 0,
                sgstAmount: 0,
                igstAmount: 0,
                cessAmount: 0,
                totalValue: Number(l.total_price || 0),
              }))
            : [],
        } as unknown as DeliveryNoteChallan));
        memoryStorage.setItem(DELIVERIES_CACHE_KEY, JSON.stringify(mapped));
        return mapped;
      }
    } catch (err) {
      console.warn('DB delivery_challans query fallback:', err);
    }
    return this.getDeliveriesSync();
  }

  public async saveDelivery(delivery: DeliveryNoteChallan): Promise<DeliveryNoteChallan> {
    try {
      await db.upsert('delivery_challans', {
        id: delivery.id,
        challan_number: (delivery as any).challanNumber || delivery.id,
        so_id: delivery.salesOrderId || (delivery as any).soNumber,
        customer_id: delivery.customer,
        vehicle_no: delivery.vehicleNumber,
        transporter: delivery.transporterName,
        lr_number: delivery.lrNumber,
        status: String(delivery.status).toLowerCase(),
        lines: (delivery as any).lines || delivery.items || [],
        total_amount: (delivery as any).totalAmount || delivery.invoiceValue || delivery.taxableValue || 0,
      });
    } catch (e) {
      console.warn('Failed to upsert delivery to DB:', e);
    }
    this.saveDeliverySync(delivery);
    return delivery;
  }

  public saveDeliverySync(delivery: DeliveryNoteChallan): DeliveryNoteChallan[] {
    const current = this.getDeliveriesSync();
    const updated = [delivery, ...current.filter((d) => d.id !== delivery.id)];
    try {
      memoryStorage.setItem(DELIVERIES_CACHE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Error saving delivery cache:', e);
    }
    adminEventBus.emit('DELIVERY_CREATED', delivery);
    broadcastLocalMutation('DELIVERIES', 'INSERT', delivery);
    return updated;
  }

  // ==========================================================================
  // 5. E-INVOICES, E-WAY BILLS & GATE PASSES
  // ==========================================================================
  public getEInvoicesSync(): EInvoiceRecord[] {
    try {
      const stored = memoryStorage.getItem(E_INVOICES_CACHE_KEY);
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
      memoryStorage.setItem(E_INVOICES_CACHE_KEY, JSON.stringify(invoices));
    } catch (e) {
      console.warn('Error caching e-invoices:', e);
    }
  }

  public getEWayBillsSync(): EWayBillRecord[] {
    try {
      const stored = memoryStorage.getItem(E_WAY_BILLS_CACHE_KEY);
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
      memoryStorage.setItem(E_WAY_BILLS_CACHE_KEY, JSON.stringify(ewbs));
    } catch (e) {
      console.warn('Error caching e-way bills:', e);
    }
  }

  public getGatePassesSync(): GatePassRecord[] {
    try {
      const stored = memoryStorage.getItem(GATE_PASSES_CACHE_KEY);
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
      memoryStorage.setItem(GATE_PASSES_CACHE_KEY, JSON.stringify(passes));
    } catch (e) {
      console.warn('Error caching gate passes:', e);
    }
  }

  public getBatchesSync(): FgBatchStock[] {
    try {
      const stored = memoryStorage.getItem(FG_BATCHES_CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error reading cached FG batches:', e);
    }
    return INITIAL_FG_BATCHES;
  }

  public saveBatchesSync(batches: FgBatchStock[]) {
    try {
      memoryStorage.setItem(FG_BATCHES_CACHE_KEY, JSON.stringify(batches));
    } catch (e) {
      console.warn('Error caching FG batches:', e);
    }
  }

  /**
   * Task-2: Deducts live inventory quantities upon successful outward dispatch
   */
  public deductStockForDispatch(
    delivItems: Array<{ itemCode: string; batchLot?: string; fgStore?: string; qty: number }>
  ): FgBatchStock[] {
    const currentBatches = this.getBatchesSync();
    const updatedBatches = currentBatches.map((b) => {
      const matched = delivItems.find(
        (di) =>
          di.itemCode === b.itemCode &&
          (!di.batchLot || di.batchLot === b.batchNumber || di.batchLot.includes(b.batchNumber))
      );
      if (matched) {
        const newAvailable = Math.max(0, b.availableQty - matched.qty);
        const newPickable = Math.max(0, b.pickableQty - matched.qty);
        return {
          ...b,
          availableQty: newAvailable,
          pickableQty: newPickable,
        };
      }
      return b;
    });

    this.saveBatchesSync(updatedBatches);
    adminEventBus.emit('INVENTORY_STOCK_DEDUCTED', { items: delivItems });
    return updatedBatches;
  }

  /**
   * Task-2: Holds stock and emits alert notification to designated dispatcher/supervisor if dispatch fails/held
   */
  public holdStockForFailedDispatch(
    delivItems: Array<{ itemCode: string; batchLot?: string; fgStore?: string; qty: number }>,
    reason: string,
    targetUser: string = 'Dispatch Supervisor / Plant Quality Lead'
  ): FgBatchStock[] {
    const currentBatches = this.getBatchesSync();
    const updatedBatches = currentBatches.map((b) => {
      const matched = delivItems.find(
        (di) =>
          di.itemCode === b.itemCode &&
          (!di.batchLot || di.batchLot === b.batchNumber || di.batchLot.includes(b.batchNumber))
      );
      if (matched) {
        const newAvailable = Math.max(0, b.availableQty - matched.qty);
        const newReserved = b.reservedQty + matched.qty;
        return {
          ...b,
          availableQty: newAvailable,
          reservedQty: newReserved,
          qualityStatus: 'Quality Hold' as const,
        };
      }
      return b;
    });

    this.saveBatchesSync(updatedBatches);

    // Emit alert notification to target user
    adminEventBus.emit('DISPATCH_COMPLIANCE_HOLD', {
      items: delivItems,
      reason,
      targetUser,
      timestamp: new Date().toISOString(),
    });

    return updatedBatches;
  }

  public getComplianceExceptionsSync(): ComplianceExceptionRecord[] {
    return INITIAL_COMPLIANCE_EXCEPTIONS;
  }
}

export const salesDataService = new SalesDataService();

