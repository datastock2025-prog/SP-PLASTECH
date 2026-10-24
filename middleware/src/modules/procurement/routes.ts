import { z } from 'zod';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { registerResourceRoutes } from '../../core/resource.js';
import { withDrizzleTx } from '../../db.js';
import { AppError, can, wrap, type Actor } from '../../middleware.js';
import type { Req, Res } from '../../router.js';
import { ctx } from '../../core/query.js';
import { writeAudit } from '../../core/audit.js';
import * as zod from '../../schema/zod.js';
import {
  goodsReceiptNotes,
  stockMovementLedger,
  items,
  warehouseStock,
  purchaseOrders,
  purchaseRequisitions,
  suppliers,
} from '../../schema/erp.js';

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

      const out = await withDrizzleTx(ctx(a), async (tx, client) => {
        const grns = await tx
          .select({
            id: goodsReceiptNotes.id,
            grn_number: goodsReceiptNotes.grnNumber,
            po_id: goodsReceiptNotes.poId,
            supplier_id: goodsReceiptNotes.supplierId,
            status: goodsReceiptNotes.status,
            lines: goodsReceiptNotes.lines,
            version: goodsReceiptNotes.version,
          })
          .from(goodsReceiptNotes)
          .where(
            and(
              eq(goodsReceiptNotes.id, grnId),
              isNull(goodsReceiptNotes.deletedAt)
            )
          )
          .for('update');

        if (!grns[0]) {
          throw new AppError(404, 'NOT_FOUND', 'Goods Receipt Note not found');
        }

        const grn = grns[0];
        if (grn.status === 'inwarded') {
          throw new AppError(400, 'ALREADY_INWARDED', 'GRN has already been inwarded to inventory');
        }

        const lines = Array.isArray(grn.lines) ? (grn.lines as any[]) : [];
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
            await tx.insert(stockMovementLedger).values({
              tenantId: a.tenantId,
              plantId: a.activePlantId || null,
              ledgerDate: dateStr,
              docType: 'RECEIPTS',
              docNumber: grn.grn_number,
              location: 'U1RM-DOCK',
              sku: itemSku,
              itemName: itemName,
              lotNumber: lotNo,
              unitPrice: String(unitPrice),
              parentDocType: 'PO',
              parentDocNumber: grn.po_id,
              movementType: 'IN',
              quantity: String(qty),
              qtyIn: String(qty),
              uom: uom,
              status: 'CLOSED',
              sourceType: 'VENDOR_GRN',
              sourceReference: grn.grn_number,
              authorizedBy: a.fullName || 'Store In-Charge',
              createdBy: a.userId,
            });

            // B. Increment items master live stock
            await tx
              .update(items)
              .set({
                stock: sql`${items.stock} + ${qty}`,
                updatedAt: new Date(),
              })
              .where(eq(items.code, itemSku));

            // C. Upsert warehouse_stock live projection
            await tx
              .insert(warehouseStock)
              .values({
                tenantId: a.tenantId,
                plantId: a.activePlantId || null,
                sku: itemSku,
                name: itemName,
                totalOnHand: String(qty),
                availableToPromise: String(qty),
                uom: uom,
                unitCostInr: String(unitPrice),
                primaryWarehouse: 'WH-RM-01',
                primaryBin: 'A1',
              })
              .onConflictDoUpdate({
                target: [warehouseStock.tenantId, warehouseStock.sku],
                targetWhere: isNull(warehouseStock.deletedAt),
                set: {
                  totalOnHand: sql`${warehouseStock.totalOnHand} + EXCLUDED.total_on_hand`,
                  availableToPromise: sql`${warehouseStock.availableToPromise} + EXCLUDED.available_to_promise`,
                  updatedAt: new Date(),
                },
              });
          }
        }

        // Update GRN status
        const [updatedGrn] = await tx
          .update(goodsReceiptNotes)
          .set({
            status: 'inwarded',
            updatedAt: new Date(),
            version: sql`${goodsReceiptNotes.version} + 1`,
          })
          .where(eq(goodsReceiptNotes.id, grnId))
          .returning({
            id: goodsReceiptNotes.id,
            grn_number: goodsReceiptNotes.grnNumber,
            status: goodsReceiptNotes.status,
            version: goodsReceiptNotes.version,
          });

        await writeAudit(client, {
          tenantId: a.tenantId,
          entityType: 'GoodsReceipt',
          entityId: grnId,
          action: 'INWARD',
          oldValues: { status: grn.status },
          newValues: { status: 'inwarded' },
          performedBy: a.userId,
        });

        return updatedGrn;
      });

      res.setHeader('X-Invalidate', 'goods_receipt_notes,warehouse_stock,stock_movement_ledger,items');
      res.json({ data: out });
    })
  );

  // Single-round-trip atomic procurement KPI aggregation
  const procurementSummaryHandler = wrap(async (req: Req, res: Res) => {
    const a = req.actor! as Actor;
    const stats = await withDrizzleTx({ tenantId: a.tenantId, userId: a.userId }, async (tx) => {
      const [poRow] = await tx
        .select({
          total_pos: sql<number>`COUNT(*)::int`,
          open_pos: sql<number>`COUNT(*) FILTER (WHERE ${purchaseOrders.status} = 'open')::int`,
          completed_pos: sql<number>`COUNT(*) FILTER (WHERE ${purchaseOrders.status} IN ('received', 'inwarded', 'closed'))::int`,
          total_spend: sql<string>`COALESCE(SUM(${purchaseOrders.totalAmount}), 0)::numeric`,
        })
        .from(purchaseOrders)
        .where(isNull(purchaseOrders.deletedAt));

      const [prRow] = await tx
        .select({
          total_prs: sql<number>`COUNT(*)::int`,
          pending_prs: sql<number>`COUNT(*) FILTER (WHERE ${purchaseRequisitions.status} IN ('draft', 'pending'))::int`,
        })
        .from(purchaseRequisitions)
        .where(isNull(purchaseRequisitions.deletedAt));

      const [grnRow] = await tx
        .select({ total_grns: sql<number>`COUNT(*)::int` })
        .from(goodsReceiptNotes)
        .where(isNull(goodsReceiptNotes.deletedAt));

      const [supRow] = await tx
        .select({ total_suppliers: sql<number>`COUNT(*)::int` })
        .from(suppliers)
        .where(isNull(suppliers.deletedAt));

      return {
        totalPos: poRow?.total_pos || 0,
        openPos: poRow?.open_pos || 0,
        completedPos: poRow?.completed_pos || 0,
        totalSpend: Number(poRow?.total_spend || 0),
        totalPrs: prRow?.total_prs || 0,
        pendingPrs: prRow?.pending_prs || 0,
        totalGrns: grnRow?.total_grns || 0,
        totalSuppliers: supRow?.total_suppliers || 0,
      };
    });

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.json({ data: stats });
  });

  r.get('/procurement/summary', can('read', 'PurchaseOrder'), procurementSummaryHandler);
  r.get('/purchase-orders/summary', can('read', 'PurchaseOrder'), procurementSummaryHandler);
  r.get('/purchase_orders/summary', can('read', 'PurchaseOrder'), procurementSummaryHandler);
}
