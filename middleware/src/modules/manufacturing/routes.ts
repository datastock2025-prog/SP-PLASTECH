import { registerResourceRoutes } from '../../crud.js';
import { withTx } from '../../db.js';
import { AppError, can, wrap, type Actor } from '../../middleware.js';
import type { Req, Res } from '../../router.js';
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
    beforeCreate: async (c: any, a: Actor, data: any) => {
      const good = Number(data.good_qty || 0);
      const rej = Number(data.rejected_qty || 0);
      const total = good + rej;

      // 1. Fetch work order to get item_code and plant_id
      const { rows: woRows } = await c.query(
        'SELECT id, item_code, plant_id, good_qty, rejection_qty, produced_qty, target_qty FROM work_orders WHERE (id = $1 OR code = $1) AND tenant_id = $2 AND deleted_at IS NULL FOR UPDATE',
        [data.work_order_id, a.tenantId]
      );

      if (woRows.length > 0) {
        const wo = woRows[0];
        const newGood = Number(wo.good_qty || 0) + good;
        const newRej = Number(wo.rejection_qty || 0) + rej;
        const newProd = Number(wo.produced_qty || 0) + total;
        const newStatus = newProd >= Number(wo.target_qty || 0) ? 'completed' : 'in_progress';

        await c.query(
          'UPDATE work_orders SET good_qty = $1, rejection_qty = $2, produced_qty = $3, status = $4, updated_at = now(), version = version + 1 WHERE id = $5 AND tenant_id = $6',
          [newGood, newRej, newProd, newStatus, wo.id, a.tenantId]
        );

        // 2. Post finished goods stock movement ledger entry (movement_type = 'IN')
        if (good > 0) {
          const dateStr = new Date().toISOString().split('T')[0];
          await c.query(
            `INSERT INTO stock_movement_ledger 
             (tenant_id, plant_id, ledger_date, doc_type, doc_number, location, sku, item_name, movement_type, quantity, qty_in, uom, status, source_location, destination_store, authorized_by, created_by)
             VALUES ($1, $2, $3, 'WORK_ORDER', $4, 'WH-FG-01', $5, $5, 'IN', $6, $6, 'PCS', 'CLOSED', 'MFG-FLOOR', 'WH-FG-01', $7, $8)`,
            [a.tenantId, wo.plant_id || a.activePlantId || null, dateStr, wo.id, wo.item_code, good, a.fullName || 'Shopfloor Lead', a.userId]
          );

          // Increment items master live stock
          await c.query(
            `UPDATE items
                SET stock = stock + $1, updated_at = now()
              WHERE code = $2 AND tenant_id = $3`,
            [good, wo.item_code, a.tenantId]
          );

          // Upsert into warehouse_stock live projection
          await c.query(
            `INSERT INTO warehouse_stock (
              tenant_id, plant_id, sku, name, total_on_hand, available_to_promise, uom, primary_warehouse, primary_bin
            ) VALUES ($1, $2, $3, $3, $4, $4, 'PCS', 'WH-FG-01', 'FG-A1')
            ON CONFLICT (tenant_id, sku) WHERE deleted_at IS NULL
            DO UPDATE SET
              total_on_hand = warehouse_stock.total_on_hand + EXCLUDED.total_on_hand,
              available_to_promise = warehouse_stock.available_to_promise + EXCLUDED.available_to_promise,
              updated_at = now()`,
            [a.tenantId, wo.plant_id || a.activePlantId || null, wo.item_code, good]
          );
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
      const row = await withTx({ tenantId: a.tenantId, userId: a.userId }, async (c) => {
        const { rows } = await c.query(
          `UPDATE work_orders SET status = 'in_progress', updated_at = now(), version = version + 1 WHERE (id = $1 OR code = $1) AND tenant_id = $2 RETURNING *`,
          [id, a.tenantId]
        );
        if (!rows.length) throw new AppError(404, 'NOT_FOUND', 'Work order not found');
        return rows[0];
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
      const row = await withTx({ tenantId: a.tenantId, userId: a.userId }, async (c) => {
        const { rows } = await c.query(
          `UPDATE work_orders SET status = 'closed', updated_at = now(), version = version + 1 WHERE (id = $1 OR code = $1) AND tenant_id = $2 RETURNING *`,
          [id, a.tenantId]
        );
        if (!rows.length) throw new AppError(404, 'NOT_FOUND', 'Work order not found');
        return rows[0];
      });
      res.json({ data: row });
    })
  );
}
