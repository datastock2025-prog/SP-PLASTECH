import { and, eq, isNull, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { registerResourceRoutes } from '../../core/resource.js';
import { withDrizzleTx } from '../../db.js';
import { can, wrap, type Actor } from '../../middleware.js';
import type { Req, Res } from '../../router.js';
import { idCondition, patchRow, type ScopedTable } from '../../core/query.js';
import { workOrders, stockMovementLedger, items, warehouseStock } from '../../schema/erp.js';
import * as schema from '../../schema/index.js';
import * as zod from '../../schema/zod.js';

export function manufacturingRoutes(r: any) {
  registerResourceRoutes(r, '/machines', {
    subject: 'Machine',
    table: 'machines',
    columns: ['id', 'code', 'name', 'tonnage', 'plant', 'status', 'brand', 'model', 'hourly_rate', 'created_by', 'updated_by', 'plant_id', 'version', 'created_at', 'updated_at'],
    searchColumns: ['code', 'name', 'brand', 'model', 'plant'],
    sortAllowlist: ['created_at', 'updated_at', 'code', 'name', 'tonnage', 'hourly_rate'],
    createSchema: zod.machineCreateSchema,
    updateSchema: zod.machineUpdateSchema,
  });

  registerResourceRoutes(r, '/work-orders', {
    subject: 'WorkOrder',
    table: 'work_orders',
    columns: ['id', 'code', 'item_code', 'machine_id', 'target_qty', 'produced_qty', 'good_qty', 'rejection_qty', 'status', 'priority', 'start_date', 'due_date', 'created_by', 'updated_by', 'plant_id', 'version', 'created_at', 'updated_at'],
    searchColumns: ['code', 'item_code', 'status', 'priority'],
    sortAllowlist: ['created_at', 'updated_at', 'code', 'target_qty', 'start_date', 'due_date'],
    createSchema: zod.workOrderCreateSchema,
    updateSchema: zod.workOrderUpdateSchema,
  });

  // Backward compatibility alias for migration
  registerResourceRoutes(r, '/work_orders', {
    subject: 'WorkOrder',
    table: 'work_orders',
    columns: ['id', 'code', 'item_code', 'machine_id', 'target_qty', 'produced_qty', 'good_qty', 'rejection_qty', 'status', 'priority', 'start_date', 'due_date', 'created_by', 'updated_by', 'plant_id', 'version', 'created_at', 'updated_at'],
    searchColumns: ['code', 'item_code', 'status', 'priority'],
    sortAllowlist: ['created_at', 'updated_at', 'code', 'target_qty', 'start_date', 'due_date'],
    createSchema: zod.workOrderCreateSchema,
    updateSchema: zod.workOrderUpdateSchema,
  });

  // Production entries with transactional work order and stock ledger posting
  const prodEntryConfig = {
    subject: 'WorkOrder' as const,
    table: 'production_entries',
    columns: [
      'id', 'tenant_id', 'plant_id', 'work_order_id', 'machine_id', 'operator_id',
      'shift_id', 'entry_timestamp', 'shots_produced', 'good_qty', 'rejected_qty',
      'rejection_reason_code', 'regrind_kg_generated', 'version', 'created_at', 'updated_at'
    ],
    searchColumns: ['work_order_id', 'machine_id', 'operator_id', 'shift_id'],
    sortAllowlist: ['created_at', 'updated_at', 'entry_timestamp', 'good_qty'],
    createSchema: zod.insertProductionEntrySchema,
    updateSchema: zod.updateProductionEntrySchema,
    beforeCreate: async (client: any, a: Actor, data: any, dbInstance?: any) => {
      const db = dbInstance || drizzle(client, { schema });
      const good = Number(data.good_qty || 0);
      const rej = Number(data.rejected_qty || 0);
      const total = good + rej;

      // 1. Fetch work order to get item_code and plant_id
      const [wo] = await db
        .select({
          id: workOrders.id,
          item_code: workOrders.itemCode,
          plant_id: workOrders.plantId,
          good_qty: workOrders.goodQty,
          rejection_qty: workOrders.rejectionQty,
          produced_qty: workOrders.producedQty,
          target_qty: workOrders.targetQty,
        })
        .from(workOrders)
        .where(
          and(
            idCondition(workOrders as ScopedTable, data.work_order_id, 'code'),
            eq(workOrders.tenantId, a.tenantId),
            isNull(workOrders.deletedAt)
          )
        )
        .for('update');

      if (wo) {
        const newGood = Number(wo.good_qty || 0) + good;
        const newRej = Number(wo.rejection_qty || 0) + rej;
        const newProd = Number(wo.produced_qty || 0) + total;
        const newStatus = newProd >= Number(wo.target_qty || 0) ? 'completed' : 'in_progress';

        await patchRow(db, workOrders as ScopedTable, a, wo.id, {
          good_qty: newGood,
          rejection_qty: newRej,
          produced_qty: newProd,
          status: newStatus,
        });

        // 2. Post finished goods stock movement ledger entry (movement_type = 'IN')
        if (good > 0) {
          const dateStr = new Date().toISOString().split('T')[0];
          await db.insert(stockMovementLedger).values({
            tenantId: a.tenantId,
            plantId: wo.plant_id || a.activePlantId || null,
            ledgerDate: dateStr,
            docType: 'WORK_ORDER',
            docNumber: wo.id,
            location: 'WH-FG-01',
            sku: wo.item_code,
            itemName: wo.item_code,
            movementType: 'IN',
            quantity: String(good),
            qtyIn: String(good),
            uom: 'PCS',
            status: 'CLOSED',
            sourceLocation: 'MFG-FLOOR',
            destinationStore: 'WH-FG-01',
            authorizedBy: a.fullName || 'Shopfloor Lead',
            createdBy: a.userId,
          });

          // Increment items master live stock
          await db
            .update(items)
            .set({
              stock: sql`${items.stock} + ${good}`,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(items.code, wo.item_code),
                eq(items.tenantId, a.tenantId)
              )
            );

          // Upsert into warehouse_stock live projection
          await db
            .insert(warehouseStock)
            .values({
              tenantId: a.tenantId,
              plantId: wo.plant_id || a.activePlantId || null,
              sku: wo.item_code,
              name: wo.item_code,
              totalOnHand: String(good),
              availableToPromise: String(good),
              uom: 'PCS',
              primaryWarehouse: 'WH-FG-01',
              primaryBin: 'FG-A1',
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

      return {};
    },
  };

  registerResourceRoutes(r, '/production-entries', prodEntryConfig);
  registerResourceRoutes(r, '/production_entries', prodEntryConfig);

  // Downtime logs
  const downtimeConfig = {
    subject: 'Machine' as const,
    table: 'downtime_logs',
    columns: [
      'id', 'tenant_id', 'plant_id', 'machine_id', 'start_time', 'end_time',
      'duration_minutes', 'category', 'reason_code', 'comments', 'version', 'created_at', 'updated_at'
    ],
    searchColumns: ['machine_id', 'category', 'reason_code', 'comments'],
    sortAllowlist: ['created_at', 'updated_at', 'start_time', 'duration_minutes'],
    createSchema: zod.insertDowntimeLogSchema,
    updateSchema: zod.updateDowntimeLogSchema,
  };

  registerResourceRoutes(r, '/downtime-logs', downtimeConfig);
  registerResourceRoutes(r, '/downtime_logs', downtimeConfig);

  // Custom Work Order actions: release & close
  r.post(
    '/work-orders/:id/release',
    can('update', 'WorkOrder'),
    wrap(async (req: Req, res: Res) => {
      const a = req.actor! as Actor;
      const id = req.params.id;
      const row = await withDrizzleTx({ tenantId: a.tenantId, userId: a.userId }, async (db) => {
        return patchRow(db, workOrders as ScopedTable, a, id, { status: 'in_progress' }, undefined, { naturalKey: 'code' });
      });
      res.json({ data: row });
    })
  );

  r.post(
    '/work-orders/:id/close',
    can('update', 'WorkOrder'),
    wrap(async (req: Req, res: Res) => {
      const a = req.actor! as Actor;
      const id = req.params.id;
      const row = await withDrizzleTx({ tenantId: a.tenantId, userId: a.userId }, async (db) => {
        return patchRow(db, workOrders as ScopedTable, a, id, { status: 'closed' }, undefined, { naturalKey: 'code' });
      });
      res.json({ data: row });
    })
  );
}
