import { z } from 'zod';
import { and, desc, eq, isNull, or } from 'drizzle-orm';
import { registerResourceRoutes } from '../../core/resource.js';
import { withDrizzleTx } from '../../db.js';
import { AppError, can, wrap } from '../../middleware.js';
import { ctx } from '../../core/query.js';
import { stockMovementLedger, warehouseStock } from '../../schema/erp.js';
import * as zod from '../../schema/zod.js';

export function warehouseRoutes(r: any) {
  // 1. Warehouses Master Directory
  registerResourceRoutes(r, '/warehouses', {
    subject: 'Warehouse',
    table: 'warehouses',
    columns: ['id', 'code', 'name', 'plant_id', 'location_type', 'address', 'bins', 'created_by', 'updated_by', 'version', 'created_at', 'updated_at'],
    searchColumns: ['code', 'name', 'location_type'],
    sortAllowlist: ['created_at', 'updated_at', 'code', 'name'],
    createSchema: zod.warehouseCreateSchema,
    updateSchema: zod.warehouseUpdateSchema,
  });

  // 1b. Warehouse Bins Directory
  registerResourceRoutes(r, '/warehouse-bins', {
    subject: 'Warehouse',
    table: 'warehouse_bins',
    columns: ['id', 'warehouse_id', 'bin_code', 'zone', 'aisle', 'rack', 'shelf', 'capacity_kg', 'is_active', 'version', 'created_at', 'updated_at'],
    searchColumns: ['bin_code', 'zone', 'warehouse_id'],
    filterColumns: ['warehouse_id', 'zone', 'is_active'],
    sortAllowlist: ['created_at', 'updated_at', 'bin_code'],
    createSchema: zod.warehouseBinCreateSchema,
    updateSchema: zod.warehouseBinUpdateSchema,
  });

  registerResourceRoutes(r, '/warehouse_bins', {
    subject: 'Warehouse',
    table: 'warehouse_bins',
    columns: ['id', 'warehouse_id', 'bin_code', 'zone', 'aisle', 'rack', 'shelf', 'capacity_kg', 'is_active', 'version', 'created_at', 'updated_at'],
    searchColumns: ['bin_code', 'zone', 'warehouse_id'],
    filterColumns: ['warehouse_id', 'zone', 'is_active'],
    sortAllowlist: ['created_at', 'updated_at', 'bin_code'],
    createSchema: zod.warehouseBinCreateSchema,
    updateSchema: zod.warehouseBinUpdateSchema,
  });

  // 2. Warehouse Stock Directory (Live Balances per SKU)
  const stockColumns = [
    'id', 'sku', 'name', 'category', 'store_type', 'sub_category', 'resin_grade',
    'primary_warehouse', 'primary_bin', 'total_on_hand', 'allocated_to_production',
    'reserved_for_orders', 'available_to_promise', 'in_transit_from_vendors',
    'uom', 'unit_cost_inr', 'total_valuation_inr', 'reorder_point_kg', 'safety_stock_kg',
    'maximum_stock_kg', 'status', 'lead_time_days', 'abc_classification', 'lots',
    'plant_id', 'version', 'created_at', 'updated_at'
  ];

  registerResourceRoutes(r, '/warehouse-stock', {
    subject: 'Warehouse',
    table: 'warehouse_stock',
    columns: stockColumns,
    searchColumns: ['sku', 'name', 'primary_warehouse', 'category'],
    filterColumns: ['sku', 'category', 'store_type', 'primary_warehouse', 'status', 'plant_id'],
    sortAllowlist: ['sku', 'name', 'total_on_hand', 'total_valuation_inr', 'created_at', 'updated_at'],
    createSchema: zod.warehouseStockCreateSchema,
    updateSchema: zod.warehouseStockUpdateSchema,
  });

  // Alias for backward compatibility
  registerResourceRoutes(r, '/warehouse_stock', {
    subject: 'Warehouse',
    table: 'warehouse_stock',
    columns: stockColumns,
    searchColumns: ['sku', 'name', 'primary_warehouse', 'category'],
    filterColumns: ['sku', 'category', 'store_type', 'primary_warehouse', 'status', 'plant_id'],
    sortAllowlist: ['sku', 'name', 'total_on_hand', 'total_valuation_inr', 'created_at', 'updated_at'],
    createSchema: zod.warehouseStockCreateSchema,
    updateSchema: zod.warehouseStockUpdateSchema,
  });

  registerResourceRoutes(r, '/stock', {
    subject: 'Warehouse',
    table: 'warehouse_stock',
    columns: stockColumns,
    searchColumns: ['sku', 'name', 'primary_warehouse', 'category'],
    filterColumns: ['sku', 'category', 'store_type', 'primary_warehouse', 'status', 'plant_id'],
    sortAllowlist: ['sku', 'name', 'total_on_hand', 'total_valuation_inr', 'created_at', 'updated_at'],
    createSchema: zod.warehouseStockCreateSchema,
    updateSchema: zod.warehouseStockUpdateSchema,
  });

  // 3. Stock Movement Ledger (Append-Only Transaction Stream)
  const ledgerColumns = [
    'id', 'timestamp', 'ledger_date', 'doc_type', 'doc_number', 'location', 'location_type',
    'customer', 'supplier', 'sku', 'item_name', 'lot_number', 'unit_price', 'parent_doc_type',
    'parent_doc_number', 'reference_number', 'qty_per_uom', 'movement_type', 'quantity',
    'qty_in', 'qty_out', 'uom', 'status', 'source_type', 'source_origin', 'source_reference',
    'source_location', 'purpose_type', 'purpose_description', 'destination_store',
    'outward_reference', 'authorized_by', 'running_balance', 'plant', 'notes', 'plant_id',
    'version', 'created_at', 'updated_at'
  ];

  registerResourceRoutes(r, '/stock-movement-ledger', {
    subject: 'Warehouse',
    table: 'stock_movement_ledger',
    columns: ledgerColumns,
    searchColumns: ['doc_number', 'sku', 'item_name', 'lot_number', 'location'],
    filterColumns: ['doc_number', 'sku', 'doc_type', 'movement_type', 'location', 'status', 'plant_id'],
    sortAllowlist: ['timestamp', 'created_at', 'doc_number', 'sku', 'quantity'],
    createSchema: zod.stockLedgerCreateSchema,
    updateSchema: zod.stockLedgerUpdateSchema,
  });

  // Backward compatibility aliases
  registerResourceRoutes(r, '/stock_movement_ledger', {
    subject: 'Warehouse',
    table: 'stock_movement_ledger',
    columns: ledgerColumns,
    searchColumns: ['doc_number', 'sku', 'item_name', 'lot_number', 'location'],
    filterColumns: ['doc_number', 'sku', 'doc_type', 'movement_type', 'location', 'status', 'plant_id'],
    sortAllowlist: ['timestamp', 'created_at', 'doc_number', 'sku', 'quantity'],
    createSchema: zod.stockLedgerCreateSchema,
    updateSchema: zod.stockLedgerUpdateSchema,
  });

  registerResourceRoutes(r, '/stock-transactions', {
    subject: 'Warehouse',
    table: 'stock_movement_ledger',
    columns: ledgerColumns,
    searchColumns: ['doc_number', 'sku', 'item_name', 'lot_number', 'location'],
    filterColumns: ['sku', 'doc_type', 'movement_type', 'location', 'status', 'plant_id'],
    sortAllowlist: ['timestamp', 'created_at', 'doc_number', 'sku', 'quantity'],
    createSchema: zod.stockLedgerCreateSchema,
    updateSchema: zod.stockLedgerUpdateSchema,
  });

  registerResourceRoutes(r, '/stock_transactions', {
    subject: 'Warehouse',
    table: 'stock_movement_ledger',
    columns: ledgerColumns,
    searchColumns: ['doc_number', 'sku', 'item_name', 'lot_number', 'location'],
    filterColumns: ['sku', 'doc_type', 'movement_type', 'location', 'status', 'plant_id'],
    sortAllowlist: ['timestamp', 'created_at', 'doc_number', 'sku', 'quantity'],
    createSchema: zod.stockLedgerCreateSchema,
    updateSchema: zod.stockLedgerUpdateSchema,
  });

  // 4. Atomic Inter-Store Stock Transfer Endpoint
  const transferSchema = z.object({
    item_code: z.string().trim().min(1),
    from_location: z.string().trim().min(1),
    to_location: z.string().trim().min(1),
    quantity: z.coerce.number().positive(),
    uom: z.string().trim().default('KG'),
      reference: z.string().trim().optional().default('Stock Transfer'),
  });

  const handleTransfer = wrap(async (req, res) => {
    const a = req.actor!;
    const body = transferSchema.parse({
      item_code: req.body.item_code || req.body.itemCode || req.body.sku || req.body.item,
      from_location: req.body.from_location || req.body.fromLocation || req.body.fromWh,
      to_location: req.body.to_location || req.body.toLocation || req.body.toWh,
      quantity: req.body.quantity ?? req.body.qty,
      uom: req.body.uom || 'KG',
      reference: req.body.reference || req.body.ref,
    });

    const transferDocNo = `TF-${Date.now().toString().slice(-6)}`;
    const nowIso = new Date().toISOString();
    const dateStr = nowIso.split('T')[0];

    const result = await withDrizzleTx(ctx(a), async (db) => {
      // 1. Post OUT movement from source
      const [outRow] = await db
        .insert(stockMovementLedger)
        .values({
          tenantId: a.tenantId,
          plantId: a.activePlantId || null,
          ledgerDate: dateStr,
          docType: 'TRANSFERS',
          docNumber: transferDocNo,
          location: body.from_location,
          sku: body.item_code,
          itemName: body.item_code,
          movementType: 'OUT',
          quantity: String(body.quantity),
          qtyOut: String(body.quantity),
          uom: body.uom,
          status: 'CLOSED',
          destinationStore: body.to_location,
          authorizedBy: a.fullName || 'Store In-Charge',
          createdBy: a.userId,
        })
        .returning({
          id: stockMovementLedger.id,
          doc_number: stockMovementLedger.docNumber,
          sku: stockMovementLedger.sku,
          quantity: stockMovementLedger.quantity,
          created_at: stockMovementLedger.createdAt,
        });

      // 2. Post IN movement to destination
      await db.insert(stockMovementLedger).values({
        tenantId: a.tenantId,
        plantId: a.activePlantId || null,
        ledgerDate: dateStr,
        docType: 'TRANSFERS',
        docNumber: transferDocNo,
        location: body.to_location,
        sku: body.item_code,
        itemName: body.item_code,
        movementType: 'IN',
        quantity: String(body.quantity),
        qtyIn: String(body.quantity),
        uom: body.uom,
        status: 'CLOSED',
        sourceLocation: body.from_location,
        authorizedBy: a.fullName || 'Store In-Charge',
        createdBy: a.userId,
      });

      return outRow;
    });

    res.setHeader('X-Invalidate', 'warehouse_stock,stock_movement_ledger');
    res.status(201).json({
      data: {
        id: result.id,
        transferNumber: result.doc_number,
        docNumber: result.doc_number,
        itemCode: result.sku,
        quantity: result.quantity,
        status: 'COMPLETED',
        createdAt: result.created_at,
      },
    });
  });

  r.post('/stock/transfers', can('create', 'Warehouse'), handleTransfer);
  r.post('/warehouse/transfers', can('create', 'Warehouse'), handleTransfer);

  r.get(
    '/warehouse/transfers',
    can('read', 'Warehouse'),
    wrap(async (req, res) => {
      const a = req.actor!;
      const result = await withDrizzleTx(ctx(a), async (db) => {
        return db
          .select({
            id: stockMovementLedger.id,
            transferNumber: stockMovementLedger.docNumber,
            sourceWarehouse: stockMovementLedger.location,
            targetWarehouse: stockMovementLedger.destinationStore,
            itemCode: stockMovementLedger.sku,
            quantity: stockMovementLedger.quantity,
            status: stockMovementLedger.status,
            transferredAt: stockMovementLedger.createdAt,
          })
          .from(stockMovementLedger)
          .where(
            and(
              eq(stockMovementLedger.tenantId, a.tenantId),
              eq(stockMovementLedger.docType, 'TRANSFERS'),
              eq(stockMovementLedger.movementType, 'OUT'),
              isNull(stockMovementLedger.deletedAt)
            )
          )
          .orderBy(desc(stockMovementLedger.createdAt))
          .limit(50);
      });
      res.json({ data: result });
    })
  );

  r.get(
    '/warehouse/quarantine',
    can('read', 'Warehouse'),
    wrap(async (req, res) => {
      const a = req.actor!;
      const result = await withDrizzleTx(ctx(a), async (db) => {
        return db
          .select({
            id: warehouseStock.id,
            itemCode: warehouseStock.sku,
            name: warehouseStock.name,
            quantity: warehouseStock.totalOnHand,
            warehouse: warehouseStock.primaryWarehouse,
            bin: warehouseStock.primaryBin,
            status: warehouseStock.status,
            updatedAt: warehouseStock.updatedAt,
          })
          .from(warehouseStock)
          .where(
            and(
              eq(warehouseStock.tenantId, a.tenantId),
              or(
                eq(warehouseStock.status, 'QUARANTINE'),
                eq(warehouseStock.storeType, 'QUARANTINE')
              ),
              isNull(warehouseStock.deletedAt)
            )
          )
          .orderBy(desc(warehouseStock.updatedAt))
          .limit(50);
      });
      res.json({ data: result });
    })
  );
}
