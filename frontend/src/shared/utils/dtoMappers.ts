import {
  ItemMaster,
  BomMaster,
  WorkOrder,
  PurchaseOrder,
  SalesOrder,
  Customer,
  MachineMaster,
} from '../../types';

/**
 * Enterprise DTO Transformers & Database Entity Mappers
 * Provides robust type coercion and fallback protection for Supabase / PostgreSQL records.
 */

// ITEM MASTER MAPPER
export function mapDbRowToItemMaster(row: any, fallback?: Partial<ItemMaster>): ItemMaster {
  if (!row) return (fallback || {}) as ItemMaster;

  const partWeight = Number(row.part_weight_grams ?? row.partWeightGrams ?? fallback?.partWeightGrams ?? 0);
  const runnerWeight = Number(row.runner_weight_grams ?? row.runnerWeightGrams ?? fallback?.runnerWeightGrams ?? 0);
  const shotWeight = Number((partWeight + runnerWeight).toFixed(2));
  const cycleTimeVal = Number(
    row.cycle_time_seconds ??
      row.cycle_time ??
      row.cycleTimeSec ??
      row.cycleTime ??
      row.standardCycleTime ??
      fallback?.cycleTime ??
      0
  );

  return {
    ...(fallback as any),
    ...row,
    id: String(row.id || row.code || fallback?.id || ''),
    code: String(row.code || fallback?.code || ''),
    name: String(row.name || fallback?.name || ''),
    type: String(row.entity_type || row.type || fallback?.type || 'Finished Good') as any,
    cat: String(row.category || row.cat || fallback?.cat || 'INJECTION MOLDING'),
    category: String(row.category || row.cat || fallback?.category || 'Finished Good'),
    wh: String(row.wh || row.warehouse || fallback?.wh || 'FG_WH_A'),
    plant: String(row.plant || fallback?.plant || 'Plant 1 - Pimpri Auto-Hub'),
    stock: String(row.stock ?? fallback?.stock ?? '0'),
    avail: String(row.avail ?? row.stock ?? fallback?.avail ?? '0'),
    baseUOM: String(row.unit || row.base_uom || row.baseUOM || fallback?.baseUOM || 'PCS'),
    standardCycleTime: cycleTimeVal,
    cycleTime: cycleTimeVal,
    cycleTimeSec: cycleTimeVal,
    cavityCount: Number(row.cavity_count ?? row.cavityCount ?? fallback?.cavityCount ?? 1),
    partWeightGrams: partWeight,
    netWeightGrams: partWeight,
    runnerWeightGrams: runnerWeight,
    shotWeightGrams: shotWeight,
    resinType: String(row.resin_type || row.resinType || row.polymerGrade || fallback?.resinType || ''),
    polymerGrade: String(row.resin_type || row.resinType || row.polymerGrade || fallback?.polymerGrade || ''),
    mfi: String(row.mfi || row.melt_flow_index || fallback?.mfi || ''),
    density: String(row.density || row.specific_density || fallback?.density || ''),
    safetyStock: String(row.safety_stock ?? row.safetyStock ?? fallback?.safetyStock ?? '0'),
    reorderLevel: String(row.reorder_point ?? row.reorder_level ?? row.reorderLevel ?? fallback?.reorderLevel ?? '0'),
    reorderPoint: Number(row.reorder_point ?? row.reorderPoint ?? fallback?.reorderPoint ?? 0),
    minStock: Number(row.min_stock ?? row.minStock ?? fallback?.minStock ?? 0),
    maxStock: Number(row.max_stock ?? row.maxStock ?? fallback?.maxStock ?? 5000),
    leadTime: String(row.leadTime || row.lead_time || fallback?.leadTime || '3 Days'),
    supplier: String(row.supplier || fallback?.supplier || ''),
    standardCost: Number(row.cost ?? row.standard_cost ?? row.standardCost ?? fallback?.standardCost ?? 0),
    cost: Number(row.cost ?? row.standard_cost ?? row.standardCost ?? fallback?.cost ?? 0),
    sellingPrice: Number(row.selling_price ?? row.sellingPrice ?? fallback?.sellingPrice ?? 0),
    valuationMethod: String(row.valuation_method || row.valuationMethod || fallback?.valuationMethod || 'FIFO'),
    moldToolId: String(row.mold_code || row.moldToolId || row.mold_tool_id || fallback?.moldToolId || ''),
    approval: String(row.approval || row.approval_status || fallback?.approval || 'approved') as any,
    status: String(row.status || fallback?.status || 'active') as any,
    lot: Boolean(row.lot ?? fallback?.lot ?? true),
    qc: Boolean(row.qc ?? fallback?.qc ?? true),
    icon: String(row.icon || fallback?.icon || '◇'),
    color: String(row.color || fallback?.color || ''),
    hsnCode: String(row.hsn_code || row.hsnCode || fallback?.hsnCode || ''),
    itemGroup: String(row.item_group || row.itemGroup || fallback?.itemGroup || ''),
    createdOn: row.created_at
      ? new Date(row.created_at).toISOString().split('T')[0]
      : fallback?.createdOn || '2026-09-25',
  };
}

// BOM MAPPER
export function mapDbRowToBom(row: any, fallback?: Partial<BomMaster>): BomMaster {
  if (!row) return (fallback || {}) as BomMaster;
  return {
    ...(fallback as any),
    ...row,
    id: String(row.id || fallback?.id || ''),
    itemCode: String(row.item_code || row.itemCode || (fallback as any)?.itemCode || (fallback as any)?.parent || ''),
    parent: String(row.item_code || row.itemCode || (fallback as any)?.parent || ''),
    parentName: String(row.parent_name || row.parentName || (fallback as any)?.parentName || ''),
    version: String(row.version || fallback?.version || 'v1.0'),
    status: String(row.status || fallback?.status || 'active') as any,
    lines: Array.isArray(row.lines) ? row.lines : Array.isArray(row.components) ? row.components : (fallback?.lines || []),
  };
}

// SALES ORDER MAPPER
export function mapDbRowToSalesOrder(row: any, fallback?: Partial<SalesOrder>): SalesOrder {
  if (!row) return (fallback || {}) as SalesOrder;
  return {
    id: String(row.id || (fallback as any)?.id || ''),
    customer: String(row.customer_name || row.customer || (fallback as any)?.customer || ''),
    customerPO: String(row.customer_po_number || row.customerPO || (fallback as any)?.customerPO || ''),
    priority: (row.priority || (fallback as any)?.priority || 'Medium') as any,
    quoteRef: row.quote_ref || row.quoteRef || (fallback as any)?.quoteRef,
    orderDate: String(row.order_date || row.orderDate || (fallback as any)?.orderDate || new Date().toISOString().split('T')[0]),
    deliveryDate: String(row.delivery_date || row.deliveryDate || (fallback as any)?.deliveryDate || new Date().toISOString().split('T')[0]),
    approval: (row.approval || (fallback as any)?.approval || 'approved') as any,
    rejectReason: row.reject_reason || row.rejectReason,
    lines: Array.isArray(row.lines) ? row.lines : (fallback?.lines || []),
    dispatchLogs: Array.isArray(row.dispatch_logs) ? row.dispatch_logs : (fallback?.dispatchLogs || []),
    history: Array.isArray(row.history) ? row.history : (fallback?.history || []),
    ...row,
  };
}

// WORK ORDER MAPPER
export function mapDbRowToWorkOrder(row: any, fallback?: Partial<WorkOrder>): WorkOrder {
  if (!row) return (fallback || {}) as WorkOrder;
  return {
    id: String(row.id || (fallback as any)?.id || ''),
    item: String(row.item || row.item_code || row.itemCode || (fallback as any)?.item || ''),
    bomId: row.bom_id || row.bomId || (fallback as any)?.bomId || null,
    machine: row.machine || row.machine_id || row.machineId || (fallback as any)?.machine || null,
    day: row.day || row.plan_date || (fallback as any)?.day || 'Day 1',
    qty: Number(row.qty || row.target_qty || row.target || (fallback as any)?.qty || 0),
    uom: String(row.uom || row.unit || (fallback as any)?.uom || 'PCS'),
    completed: Number(row.completed || row.actual || row.actual_qty || (fallback as any)?.completed || 0),
    scrap: Number(row.scrap || row.scrap_qty || (fallback as any)?.scrap || 0),
    status: (row.status || (fallback as any)?.status || 'in_progress') as any,
    priority: (row.priority || (fallback as any)?.priority || 'Medium') as any,
    dueDate: String(row.due_date || row.dueDate || (fallback as any)?.dueDate || new Date().toISOString().split('T')[0]),
    operator: String(row.operator || row.assigned_to || (fallback as any)?.operator || 'Operator 1'),
    downtimeMin: Number(row.downtime_min || row.downtimeMin || (fallback as any)?.downtimeMin || 0),
    outputLogs: Array.isArray(row.output_logs) ? row.output_logs : Array.isArray(row.outputLogs) ? row.outputLogs : (fallback?.outputLogs || []),
    downtimeLogs: Array.isArray(row.downtime_logs) ? row.downtime_logs : Array.isArray(row.downtimeLogs) ? row.downtimeLogs : (fallback?.downtimeLogs || []),
    checklist: Array.isArray(row.checklist) ? row.checklist : (fallback?.checklist || []),
    history: Array.isArray(row.history) ? row.history : (fallback?.history || []),
    ...row,
  };
}

// PURCHASE ORDER MAPPER
export function mapDbRowToPurchaseOrder(row: any, fallback?: Partial<PurchaseOrder>): PurchaseOrder {
  if (!row) return (fallback || {}) as PurchaseOrder;
  return {
    id: String(row.id || (fallback as any)?.id || ''),
    supplier: String(row.supplier_name || row.supplier || (fallback as any)?.supplier || ''),
    vendorName: row.vendor_name || row.vendorName || (fallback as any)?.vendorName,
    buyerName: row.buyer_name || row.buyerName || (fallback as any)?.buyerName,
    orderDate: String(row.order_date || row.orderDate || (fallback as any)?.orderDate || new Date().toISOString().split('T')[0]),
    expectedDate: String(row.expected_delivery_date || row.expectedDate || (fallback as any)?.expectedDate || new Date().toISOString().split('T')[0]),
    status: row.status || (fallback as any)?.status || 'OPEN',
    approval: (row.approval || (fallback as any)?.approval || 'approved') as any,
    rejectReason: row.reject_reason || row.rejectReason,
    totalAmount: Number(row.total_amount ?? row.totalAmount ?? (fallback as any)?.totalAmount ?? 0),
    lines: Array.isArray(row.lines) ? row.lines : (fallback?.lines || []),
    receiptLogs: Array.isArray(row.receipt_logs) ? row.receipt_logs : (fallback?.receiptLogs || []),
    history: Array.isArray(row.history) ? row.history : (fallback?.history || []),
    ...row,
  };
}

// MACHINE MASTER MAPPER
export function mapDbRowToMachine(row: any, fallback?: Partial<MachineMaster>): MachineMaster {
  if (!row) return (fallback || {}) as MachineMaster;
  return {
    ...(fallback as any),
    ...row,
    id: String(row.id || fallback?.id || ''),
    name: String(row.name || fallback?.name || ''),
    type: String(row.type || fallback?.type || 'Injection Molding') as any,
    status: String(row.status || fallback?.status || 'RUNNING') as any,
    tonnage: Number(row.tonnage ?? fallback?.tonnage ?? 0),
  };
}

// CUSTOMER MAPPER
export function mapDbRowToCustomer(row: any, fallback?: Partial<Customer>): Customer {
  if (!row) return (fallback || {}) as Customer;
  return {
    code: String(row.code || (fallback as any)?.code || ''),
    name: String(row.name || (fallback as any)?.name || ''),
    segment: String(row.segment || (fallback as any)?.segment || 'Automotive OEM'),
    creditLimit: Number(row.credit_limit ?? row.creditLimit ?? (fallback as any)?.creditLimit ?? 500000),
    contact: String(row.contact || (fallback as any)?.contact || ''),
    email: String(row.email || (fallback as any)?.email || ''),
    phone: String(row.phone || (fallback as any)?.phone || ''),
    status: (row.status || (fallback as any)?.status || 'active') as any,
    ...row,
  };
}
