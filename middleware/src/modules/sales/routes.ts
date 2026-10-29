import { and, eq, isNull, or, sql } from 'drizzle-orm';
import { registerResourceRoutes } from '../../core/resource.js';
import * as zod from '../../schema/zod.js';
import { withDrizzleTx } from '../../db.js';
import { AppError, can, wrap, type Actor } from '../../middleware.js';
import type { Req, Res } from '../../router.js';
import { patchRow } from '../../core/query.js';
import {
  deliveryChallans,
  stockMovementLedger,
  warehouseStock,
  items,
  salesOrderLines,
  salesOrders,
  customers,
} from '../../schema/erp.js';

export function salesRoutes(r: any) {
  registerResourceRoutes(r, '/customers', {
    subject: 'Customer',
    table: 'customers',
    columns: ['id', 'code', 'name', 'customer_type', 'tier', 'gstin', 'pan', 'credit_limit', 'credit_days', 'status', 'contacts', 'shipping_addresses', 'billing_addresses', 'payment_terms', 'incoterms', 'currency', 'created_by', 'updated_by', 'plant_id', 'version', 'created_at', 'updated_at'],
    searchColumns: ['code', 'name', 'gstin', 'pan'],
    sortAllowlist: ['created_at', 'updated_at', 'code', 'name', 'credit_limit'],
    createSchema: zod.customerCreateSchema,
    updateSchema: zod.customerUpdateSchema,
  });

  registerResourceRoutes(r, '/crm-accounts', {
    subject: 'Customer',
    table: 'customers',
    columns: ['id', 'code', 'name', 'customer_type', 'tier', 'gstin', 'pan', 'credit_limit', 'credit_days', 'status', 'contacts', 'shipping_addresses', 'billing_addresses', 'payment_terms', 'incoterms', 'currency', 'created_by', 'updated_by', 'plant_id', 'version', 'created_at', 'updated_at'],
    searchColumns: ['code', 'name', 'gstin', 'pan'],
    sortAllowlist: ['created_at', 'updated_at', 'code', 'name', 'credit_limit'],
    createSchema: zod.customerCreateSchema,
    updateSchema: zod.customerUpdateSchema,
  });

  registerResourceRoutes(r, '/sales-orders', {
    subject: 'SalesOrder',
    table: 'sales_orders',
    columns: ['id', 'so_number', 'customer_id', 'status', 'total_amount', 'order_date', 'delivery_date', 'items', 'created_by', 'updated_by', 'plant_id', 'version', 'created_at', 'updated_at'],
    searchColumns: ['so_number', 'status', 'customer_id'],
    sortAllowlist: ['created_at', 'updated_at', 'so_number', 'total_amount', 'order_date'],
    createSchema: zod.salesOrderCreateSchema,
    updateSchema: zod.salesOrderUpdateSchema,
  });

  // Backward compatibility alias for migration
  registerResourceRoutes(r, '/sales_orders', {
    subject: 'SalesOrder',
    table: 'sales_orders',
    columns: ['id', 'so_number', 'customer_id', 'status', 'total_amount', 'order_date', 'delivery_date', 'items', 'created_by', 'updated_by', 'plant_id', 'version', 'created_at', 'updated_at'],
    searchColumns: ['so_number', 'status', 'customer_id'],
    sortAllowlist: ['created_at', 'updated_at', 'so_number', 'total_amount', 'order_date'],
    createSchema: zod.salesOrderCreateSchema,
    updateSchema: zod.salesOrderUpdateSchema,
  });

  const salesOrderLineConfig = {
    subject: 'SalesOrder' as const,
    table: 'sales_order_lines',
    columns: [
      'id', 'tenant_id', 'plant_id', 'so_id', 'line_no', 'item_code', 'item_name',
      'quantity', 'dispatched_qty', 'unit_price', 'total_price', 'uom', 'version',
      'created_by', 'updated_by', 'created_at', 'updated_at'
    ],
    searchColumns: ['so_id', 'item_code', 'item_name'],
    sortAllowlist: ['created_at', 'updated_at', 'line_no', 'quantity'],
    createSchema: zod.salesOrderLineCreateSchema,
    updateSchema: zod.salesOrderLineUpdateSchema,
  };
  registerResourceRoutes(r, '/sales-order-lines', salesOrderLineConfig);
  registerResourceRoutes(r, '/sales_order_lines', salesOrderLineConfig);

  const deliveryChallanConfig = {
    subject: 'SalesOrder' as const,
    table: 'delivery_challans',
    columns: [
      'id', 'tenant_id', 'plant_id', 'challan_number', 'so_id', 'customer_id',
      'vehicle_no', 'transporter', 'lr_number', 'dispatch_date', 'status',
      'lines', 'total_amount', 'version', 'created_by', 'updated_by', 'created_at', 'updated_at'
    ],
    searchColumns: ['challan_number', 'so_id', 'customer_id', 'vehicle_no', 'transporter', 'lr_number'],
    sortAllowlist: ['created_at', 'updated_at', 'challan_number', 'dispatch_date', 'total_amount'],
    createSchema: zod.deliveryChallanCreateSchema,
    updateSchema: zod.deliveryChallanUpdateSchema,
  };
  registerResourceRoutes(r, '/delivery-challans', deliveryChallanConfig);
  registerResourceRoutes(r, '/delivery_challans', deliveryChallanConfig);

  const handleDispatch = async (req: Req, res: Res) => {
    const a = req.actor! as Actor;
    const id = req.params.id;
    const row = await withDrizzleTx({ tenantId: a.tenantId, userId: a.userId }, async (tx) => {
      const challans = await tx
        .select()
        .from(deliveryChallans)
        .where(
          and(
            or(eq(deliveryChallans.id, id), eq(deliveryChallans.challanNumber, id)),
            isNull(deliveryChallans.deletedAt)
          )
        )
        .for('update');

      if (!challans.length) throw new AppError(404, 'NOT_FOUND', 'Delivery challan not found');
      const challan = challans[0];
      if (challan.status === 'dispatched') {
        throw new AppError(409, 'ALREADY_DISPATCHED', 'Delivery challan is already dispatched');
      }

      const updatedChallan = await patchRow(
        tx as any,
        deliveryChallans,
        a,
        challan.id,
        { status: 'dispatched' }
      );

      const lines = Array.isArray(challan.lines) ? (challan.lines as any[]) : [];
      const dateStr = new Date().toISOString().split('T')[0];

      for (const line of lines) {
        const itemCode = line.item_code || line.itemCode || line.sku;
        const qty = Number(line.quantity || line.qty || 0);
        const itemName = line.item_name || line.itemName || line.name || itemCode;
        const uom = line.uom || 'PCS';

        if (!itemCode || qty <= 0) continue;

        // 1. Append OUT movement in stock_movement_ledger
        await tx.insert(stockMovementLedger).values({
          tenantId: a.tenantId,
          plantId: challan.plantId || a.activePlantId || null,
          ledgerDate: dateStr,
          docType: 'DELIVERY_CHALLAN',
          docNumber: challan.challanNumber,
          location: 'WH-FG-01',
          sku: itemCode,
          itemName: itemName,
          movementType: 'OUT',
          quantity: String(qty),
          qtyOut: String(qty),
          uom: uom,
          status: 'CLOSED',
          destinationStore: 'Customer Dispatch',
          purposeType: 'SALES_DISPATCH',
          customer: challan.customerId,
          authorizedBy: a.fullName || 'Dispatch Supervisor',
          createdBy: a.userId,
        });

        // 2. Decrement warehouse_stock
        await tx
          .update(warehouseStock)
          .set({
            totalOnHand: sql`GREATEST(0, ${warehouseStock.totalOnHand} - ${qty})`,
            availableToPromise: sql`GREATEST(0, ${warehouseStock.availableToPromise} - ${qty})`,
            updatedAt: new Date(),
          })
          .where(and(eq(warehouseStock.sku, itemCode), isNull(warehouseStock.deletedAt)));

        // 3. Decrement items master stock
        await tx
          .update(items)
          .set({
            stock: sql`GREATEST(0, ${items.stock} - ${qty})`,
            updatedAt: new Date(),
          })
          .where(and(eq(items.code, itemCode), isNull(items.deletedAt)));

        // 4. Update sales_order_lines dispatched_qty if so_id exists
        if (challan.soId) {
          await tx
            .update(salesOrderLines)
            .set({
              dispatchedQty: sql`${salesOrderLines.dispatchedQty} + ${qty}`,
              updatedAt: new Date(),
              version: sql`${salesOrderLines.version} + 1`,
            })
            .where(
              and(
                eq(salesOrderLines.soId, challan.soId),
                eq(salesOrderLines.itemCode, itemCode),
                isNull(salesOrderLines.deletedAt)
              )
            );
        }
      }

      return updatedChallan;
    });

    res.json({ data: row });
  };

  r.post('/delivery-challans/:id/dispatch', can('update', 'SalesOrder'), wrap(handleDispatch));
  r.post('/delivery_challans/:id/dispatch', can('update', 'SalesOrder'), wrap(handleDispatch));

  // Safe endpoints for auxiliary sales registries (monthly plans, RMAs, quotations)
  const emptyAuxHandler = wrap(async (_req, res) => {
    res.json({
      data: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });
  });

  r.get('/monthly_plan_orders', can('read', 'SalesOrder'), emptyAuxHandler);
  r.get('/monthly-plan-orders', can('read', 'SalesOrder'), emptyAuxHandler);
  r.get('/rmas', can('read', 'SalesOrder'), emptyAuxHandler);
  r.get('/quotations', can('read', 'SalesOrder'), emptyAuxHandler);

  // Single-round-trip atomic sales KPI aggregation
  const salesSummaryHandler = wrap(async (req: Req, res: Res) => {
    const a = req.actor! as Actor;
    const stats = await withDrizzleTx({ tenantId: a.tenantId, userId: a.userId }, async (tx) => {
      const [orderRow] = await tx
        .select({
          total_orders: sql<number>`COUNT(*)::int`,
          draft_orders: sql<number>`COUNT(*) FILTER (WHERE ${salesOrders.status} = 'draft')::int`,
          confirmed_orders: sql<number>`COUNT(*) FILTER (WHERE ${salesOrders.status} IN ('confirmed', 'approved', 'open'))::int`,
          in_production_orders: sql<number>`COUNT(*) FILTER (WHERE ${salesOrders.status} IN ('in_production', 'production'))::int`,
          dispatched_orders: sql<number>`COUNT(*) FILTER (WHERE ${salesOrders.status} IN ('dispatched', 'delivered', 'closed'))::int`,
          total_revenue: sql<string>`COALESCE(SUM(${salesOrders.totalAmount}), 0)::numeric`,
        })
        .from(salesOrders)
        .where(isNull(salesOrders.deletedAt));

      const [custRow] = await tx
        .select({
          total_customers: sql<number>`COUNT(*)::int`,
        })
        .from(customers)
        .where(isNull(customers.deletedAt));

      return {
        totalOrders: orderRow?.total_orders || 0,
        draftOrders: orderRow?.draft_orders || 0,
        confirmedOrders: orderRow?.confirmed_orders || 0,
        inProductionOrders: orderRow?.in_production_orders || 0,
        dispatchedOrders: orderRow?.dispatched_orders || 0,
        totalRevenue: Number(orderRow?.total_revenue || 0),
        totalCustomers: custRow?.total_customers || 0,
      };
    });

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.json({ data: stats });
  });

  r.get('/sales/summary', can('read', 'SalesOrder'), salesSummaryHandler);
  r.get('/sales-orders/summary', can('read', 'SalesOrder'), salesSummaryHandler);
  r.get('/sales_orders/summary', can('read', 'SalesOrder'), salesSummaryHandler);
}
