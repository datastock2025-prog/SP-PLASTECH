import { z } from 'zod';
import { registerResourceRoutes } from '../../crud.js';
import { withTx } from '../../db.js';
import { AppError, can, wrap, type Actor } from '../../middleware.js';
import type { Req, Res } from '../../router.js';
import { ctx } from '../../core/helpers.js';
import { writeAudit } from '../../userStore.js';
import * as zod from '../../schema/zod.js';

export function procurementRoutes(r: any) {
  // 1. Supplier Master
  registerResourceRoutes(r, '/suppliers', {
    subject: 'Supplier',
    table: 'suppliers',
    columns: ['id', 'code', 'name', 'type', 'category', 'rating', 'status', 'contacts', 'payment_terms', 'currency', 'banking_tax', 'created_by', 'updated_by', 'plant_id', 'version', 'created_at', 'updated_at'],
    searchColumns: ['code', 'name', 'type', 'status'],
    sortAllowlist: ['created_at', 'updated_at', 'code', 'name', 'rating'],
    createSchema: zod.supplierCreateSchema,
    updateSchema: zod.supplierUpdateSchema,
  });

  // 2. Purchase Orders
  const poColumns = [
    'id', 'po_number', 'supplier_id', 'status', 'total_amount', 'order_date',
    'expected_delivery_date', 'items', 'created_by', 'updated_by', 'plant_id',
    'version', 'created_at', 'updated_at'
  ];

  registerResourceRoutes(r, '/purchase-orders', {
    subject: 'PurchaseOrder',
    table: 'purchase_orders',
    columns: poColumns,
    searchColumns: ['po_number', 'status', 'supplier_id'],
    filterColumns: ['po_number', 'status', 'supplier_id', 'plant_id'],
    sortAllowlist: ['created_at', 'updated_at', 'po_number', 'total_amount', 'order_date'],
    createSchema: zod.purchaseOrderCreateSchema,
    updateSchema: zod.purchaseOrderUpdateSchema,
  });

  registerResourceRoutes(r, '/purchase_orders', {
    subject: 'PurchaseOrder',
    table: 'purchase_orders',
    columns: poColumns,
    searchColumns: ['po_number', 'status', 'supplier_id'],
    filterColumns: ['po_number', 'status', 'supplier_id', 'plant_id'],
    sortAllowlist: ['created_at', 'updated_at', 'po_number', 'total_amount', 'order_date'],
    createSchema: zod.purchaseOrderCreateSchema,
    updateSchema: zod.purchaseOrderUpdateSchema,
  });

  // 3. Purchase Requisitions (PR)
  const prColumns = [
    'id', 'pr_number', 'department', 'required_date', 'priority', 'status',
    'lines', 'total_estimated_amount', 'notes', 'plant_id', 'created_by',
    'updated_by', 'version', 'created_at', 'updated_at'
  ];

  registerResourceRoutes(r, '/purchase-requisitions', {
    subject: 'PurchaseRequisition',
    table: 'purchase_requisitions',
    columns: prColumns,
    searchColumns: ['pr_number', 'department', 'status'],
    filterColumns: ['pr_number', 'department', 'status', 'priority', 'plant_id'],
    sortAllowlist: ['created_at', 'updated_at', 'pr_number', 'required_date'],
    createSchema: zod.prCreateSchema,
    updateSchema: zod.prUpdateSchema,
  });

  registerResourceRoutes(r, '/purchase_requisitions', {
    subject: 'PurchaseRequisition',
    table: 'purchase_requisitions',
    columns: prColumns,
    searchColumns: ['pr_number', 'department', 'status'],
    filterColumns: ['pr_number', 'department', 'status', 'priority', 'plant_id'],
    sortAllowlist: ['created_at', 'updated_at', 'pr_number', 'required_date'],
    createSchema: zod.prCreateSchema,
    updateSchema: zod.prUpdateSchema,
  });

  // 4. Goods Receipt Notes (GRN) & Inwarding
  const grnColumns = [
    'id', 'grn_number', 'po_id', 'supplier_id', 'supplier_invoice_no',
    'vehicle_no', 'received_date', 'status', 'lines', 'total_amount',
    'notes', 'plant_id', 'created_by', 'updated_by', 'version', 'created_at', 'updated_at'
  ];

  registerResourceRoutes(r, '/goods-receipt-notes', {
    subject: 'GoodsReceipt',
    table: 'goods_receipt_notes',
    columns: grnColumns,
    searchColumns: ['grn_number', 'po_id', 'supplier_invoice_no', 'status'],
    filterColumns: ['grn_number', 'po_id', 'supplier_id', 'status', 'plant_id'],
    sortAllowlist: ['created_at', 'updated_at', 'grn_number', 'received_date'],
    createSchema: zod.grnCreateSchema,
    updateSchema: zod.grnUpdateSchema,
  });

  registerResourceRoutes(r, '/goods_receipt_notes', {
    subject: 'GoodsReceipt',
    table: 'goods_receipt_notes',
    columns: grnColumns,
    searchColumns: ['grn_number', 'po_id', 'supplier_invoice_no', 'status'],
    filterColumns: ['grn_number', 'po_id', 'supplier_id', 'status', 'plant_id'],
    sortAllowlist: ['created_at', 'updated_at', 'grn_number', 'received_date'],
    createSchema: zod.grnCreateSchema,
    updateSchema: zod.grnUpdateSchema,
  });

  // 5. Transactional GRN Inward & Stock Ledger Posting
  r.post(
    '/goods-receipt-notes/:id/inward',
    can('create', 'GoodsReceipt'),
    wrap(async (req, res) => {
      const a = req.actor!;
      const grnId = z.string().trim().min(1).parse(req.params.id);

      const out = await withTx(ctx(a), async (c) => {
        const grnRes = await c.query(
          `SELECT id, grn_number, po_id, supplier_id, status, lines, version
             FROM goods_receipt_notes
            WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
             FOR UPDATE`,
          [grnId, a.tenantId]
        );

        if (!grnRes.rows[0]) {
          throw new AppError(404, 'NOT_FOUND', 'Goods Receipt Note not found');
        }

        const grn = grnRes.rows[0];
        if (grn.status === 'inwarded') {
          throw new AppError(400, 'ALREADY_INWARDED', 'GRN has already been inwarded to inventory');
        }

        const lines = Array.isArray(grn.lines) ? grn.lines : [];
        const dateStr = new Date().toISOString().split('T')[0];

        // Post each received line to stock movement ledger and live stock
        for (const line of lines) {
          const itemSku = line.item_code || line.sku || line.item || 'UNKNOWN-SKU';
          const itemName = line.item_name || line.name || itemSku;
          const qty = Number(line.received_qty || line.qty || line.quantity || 0);
          const uom = line.uom || 'KG';
          const lotNo = line.lot_number || line.lotNo || `LOT-${Date.now().toString().slice(-4)}`;
          const unitPrice = Number(line.unit_price || line.price || 0);

          if (qty > 0) {
            // A. Post IN entry to stock_movement_ledger
            await c.query(
              `INSERT INTO stock_movement_ledger (
                tenant_id, plant_id, ledger_date, doc_type, doc_number, location,
                sku, item_name, lot_number, unit_price, parent_doc_type, parent_doc_number,
                movement_type, quantity, qty_in, uom, status, source_type, source_reference,
                authorized_by, created_by
              ) VALUES ($1, $2, $3, 'RECEIPTS', $4, 'U1RM-DOCK', $5, $6, $7, $8, 'PO', $9, 'IN', $10, $10, $11, 'CLOSED', 'VENDOR_GRN', $4, $12, $13)`,
              [
                a.tenantId, a.activePlantId || null, dateStr, grn.grn_number,
                itemSku, itemName, lotNo, unitPrice, grn.po_id, qty, uom,
                a.fullName || 'Store In-Charge', a.userId
              ]
            );

            // B. Increment items master live stock
            await c.query(
              `UPDATE items
                  SET stock = stock + $1, updated_at = now()
                WHERE code = $2 AND tenant_id = $3`,
              [qty, itemSku, a.tenantId]
            );

            // C. Upsert warehouse_stock live projection
            await c.query(
              `INSERT INTO warehouse_stock (
                tenant_id, plant_id, sku, name, total_on_hand, available_to_promise, uom, unit_cost_inr, primary_warehouse, primary_bin
              ) VALUES ($1, $2, $3, $4, $5, $5, $6, $7, 'WH-RM-01', 'A1')
              ON CONFLICT (tenant_id, sku) WHERE deleted_at IS NULL
              DO UPDATE SET
                total_on_hand = warehouse_stock.total_on_hand + EXCLUDED.total_on_hand,
                available_to_promise = warehouse_stock.available_to_promise + EXCLUDED.available_to_promise,
                updated_at = now()`,
              [a.tenantId, a.activePlantId || null, itemSku, itemName, qty, uom, unitPrice]
            );
          }
        }

        // Update GRN status
        const updatedGrn = await c.query(
          `UPDATE goods_receipt_notes
              SET status = 'inwarded', updated_at = now(), version = version + 1
            WHERE id = $1 AND tenant_id = $2
            RETURNING id, grn_number, status, version`,
          [grnId, a.tenantId]
        );

        await writeAudit(c, {
          tenantId: a.tenantId,
          entityType: 'GoodsReceipt',
          entityId: grnId,
          action: 'INWARD',
          oldValues: { status: grn.status },
          newValues: { status: 'inwarded' },
          performedBy: a.userId,
        });

        return updatedGrn.rows[0];
      });

      res.setHeader('X-Invalidate', 'goods_receipt_notes,warehouse_stock,stock_movement_ledger,items');
      res.json({ data: out });
    })
  );

  // Single-round-trip atomic procurement KPI aggregation
  const procurementSummaryHandler = wrap(async (req: Req, res: Res) => {
    const a = req.actor! as Actor;
    const stats = await withTx({ tenantId: a.tenantId, userId: a.userId }, async (c) => {
      const poRes = await c.query(
        `SELECT
           COUNT(*)::int AS total_pos,
           COUNT(*) FILTER (WHERE status = 'open')::int AS open_pos,
           COUNT(*) FILTER (WHERE status IN ('received', 'inwarded', 'closed'))::int AS completed_pos,
           COALESCE(SUM(total_amount), 0)::numeric AS total_spend
         FROM purchase_orders
        WHERE tenant_id = $1 AND deleted_at IS NULL`,
        [a.tenantId]
      );
      const prRes = await c.query(
        `SELECT
           COUNT(*)::int AS total_prs,
           COUNT(*) FILTER (WHERE status IN ('draft', 'pending'))::int AS pending_prs
         FROM purchase_requisitions
        WHERE tenant_id = $1 AND deleted_at IS NULL`,
        [a.tenantId]
      );
      const grnRes = await c.query(
        `SELECT COUNT(*)::int AS total_grns FROM goods_receipt_notes WHERE tenant_id = $1 AND deleted_at IS NULL`,
        [a.tenantId]
      );
      const supRes = await c.query(
        `SELECT COUNT(*)::int AS total_suppliers FROM suppliers WHERE tenant_id = $1 AND deleted_at IS NULL`,
        [a.tenantId]
      );

      const poRow = poRes.rows[0] || {};
      const prRow = prRes.rows[0] || {};
      return {
        totalPos: poRow.total_pos || 0,
        openPos: poRow.open_pos || 0,
        completedPos: poRow.completed_pos || 0,
        totalSpend: Number(poRow.total_spend || 0),
        totalPrs: prRow.total_prs || 0,
        pendingPrs: prRow.pending_prs || 0,
        totalGrns: grnRes.rows[0]?.total_grns || 0,
        totalSuppliers: supRes.rows[0]?.total_suppliers || 0,
      };
    });

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.json({ data: stats });
  });

  r.get('/procurement/summary', can('read', 'PurchaseOrder'), procurementSummaryHandler);
  r.get('/purchase-orders/summary', can('read', 'PurchaseOrder'), procurementSummaryHandler);
  r.get('/purchase_orders/summary', can('read', 'PurchaseOrder'), procurementSummaryHandler);
}
