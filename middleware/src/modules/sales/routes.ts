import { registerResourceRoutes } from '../../crud.js';
import * as zod from '../../schema/zod.js';
import { withTx } from '../../db.js';
import { AppError, can, wrap, type Actor } from '../../middleware.js';
import type { Req, Res } from '../../router.js';

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
    const row = await withTx({ tenantId: a.tenantId, userId: a.userId }, async (c) => {
      const { rows } = await c.query(
        `SELECT id, challan_number, so_id, customer_id, vehicle_no, transporter, lr_number, dispatch_date, status, lines, total_amount, plant_id, version
           FROM delivery_challans
          WHERE (id = $1 OR challan_number = $1) AND tenant_id = $2 AND deleted_at IS NULL FOR UPDATE`,
        [id, a.tenantId]
      );
      if (!rows.length) throw new AppError(404, 'NOT_FOUND', 'Delivery challan not found');
      const challan = rows[0];
      if (challan.status === 'dispatched') {
        throw new AppError(409, 'ALREADY_DISPATCHED', 'Delivery challan is already dispatched');
      }

      const updateRes = await c.query(
        `UPDATE delivery_challans
            SET status = 'dispatched',
                updated_at = now(),
                updated_by = $1,
                version = version + 1
          WHERE id = $2 AND tenant_id = $3
          RETURNING *`,
        [a.userId, challan.id, a.tenantId]
      );

      const lines = Array.isArray(challan.lines) ? challan.lines : [];
      const dateStr = new Date().toISOString().split('T')[0];

      for (const line of lines) {
        const itemCode = line.item_code || line.itemCode || line.sku;
        const qty = Number(line.quantity || line.qty || 0);
        const itemName = line.item_name || line.itemName || line.name || itemCode;
        const uom = line.uom || 'PCS';

        if (!itemCode || qty <= 0) continue;

        // 1. Append OUT movement in stock_movement_ledger
        await c.query(
          `INSERT INTO stock_movement_ledger 
           (tenant_id, plant_id, ledger_date, doc_type, doc_number, location, sku, item_name, movement_type, quantity, qty_out, uom, status, destination_store, purpose_type, customer, authorized_by, created_by)
           VALUES ($1, $2, $3, 'DELIVERY_CHALLAN', $4, 'WH-FG-01', $5, $6, 'OUT', $7, $7, $8, 'CLOSED', 'Customer Dispatch', 'SALES_DISPATCH', $9, $10, $11)`,
          [
            a.tenantId,
            challan.plant_id || a.activePlantId || null,
            dateStr,
            challan.challan_number,
            itemCode,
            itemName,
            qty,
            uom,
            challan.customer_id,
            a.fullName || 'Dispatch Supervisor',
            a.userId
          ]
        );

        // 2. Decrement warehouse_stock
        await c.query(
          `UPDATE warehouse_stock
              SET total_on_hand = GREATEST(0, total_on_hand - $1),
                  available_to_promise = GREATEST(0, available_to_promise - $1),
                  updated_at = now()
            WHERE sku = $2 AND tenant_id = $3 AND deleted_at IS NULL`,
          [qty, itemCode, a.tenantId]
        );

        // 3. Decrement items master stock
        await c.query(
          `UPDATE items
              SET stock = GREATEST(0, stock - $1),
                  updated_at = now()
            WHERE code = $2 AND tenant_id = $3 AND deleted_at IS NULL`,
          [qty, itemCode, a.tenantId]
        );

        // 4. Update sales_order_lines dispatched_qty if so_id exists
        if (challan.so_id) {
          await c.query(
            `UPDATE sales_order_lines
                SET dispatched_qty = dispatched_qty + $1,
                    updated_at = now(),
                    version = version + 1
              WHERE so_id = $2 AND item_code = $3 AND tenant_id = $4 AND deleted_at IS NULL`,
            [qty, challan.so_id, itemCode, a.tenantId]
          );
        }
      }

      return updateRes.rows[0];
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
    const stats = await withTx({ tenantId: a.tenantId, userId: a.userId }, async (c) => {
      const orderRes = await c.query(
        `SELECT
           COUNT(*)::int AS total_orders,
           COUNT(*) FILTER (WHERE status = 'draft')::int AS draft_orders,
           COUNT(*) FILTER (WHERE status IN ('confirmed', 'approved', 'open'))::int AS confirmed_orders,
           COUNT(*) FILTER (WHERE status IN ('in_production', 'production'))::int AS in_production_orders,
           COUNT(*) FILTER (WHERE status IN ('dispatched', 'delivered', 'closed'))::int AS dispatched_orders,
           COALESCE(SUM(total_amount), 0)::numeric AS total_revenue
         FROM sales_orders
        WHERE tenant_id = $1 AND deleted_at IS NULL`,
        [a.tenantId]
      );
      const custRes = await c.query(
        `SELECT COUNT(*)::int AS total_customers FROM customers WHERE tenant_id = $1 AND deleted_at IS NULL`,
        [a.tenantId]
      );
      const row = orderRes.rows[0] || {};
      return {
        totalOrders: row.total_orders || 0,
        draftOrders: row.draft_orders || 0,
        confirmedOrders: row.confirmed_orders || 0,
        inProductionOrders: row.in_production_orders || 0,
        dispatchedOrders: row.dispatched_orders || 0,
        totalRevenue: Number(row.total_revenue || 0),
        totalCustomers: custRes.rows[0]?.total_customers || 0,
      };
    });

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.json({ data: stats });
  });

  r.get('/sales/summary', can('read', 'SalesOrder'), salesSummaryHandler);
  r.get('/sales-orders/summary', can('read', 'SalesOrder'), salesSummaryHandler);
  r.get('/sales_orders/summary', can('read', 'SalesOrder'), salesSummaryHandler);
}
