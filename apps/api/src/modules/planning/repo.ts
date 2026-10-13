import type { PoolClient } from 'pg';

export const PLANNED_ORDER_SELECT = `
  SELECT id, order_number, item_code, quantity, uom,
         start_date, due_date, source, status, version,
         created_at, updated_at
    FROM planned_orders`;

export async function findPlannedOrderById(c: PoolClient, id: string) {
  const { rows } = await c.query(
    `${PLANNED_ORDER_SELECT} WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
  return rows[0] || null;
}

export async function listPlannedOrders(c: PoolClient, limit = 50, offset = 0) {
  const { rows } = await c.query(
    `${PLANNED_ORDER_SELECT} WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
}

export const MRP_RUN_SELECT = `
  SELECT id, run_number, plan_horizon_days, total_planned_orders,
         status, executed_at, created_at, updated_at
    FROM mrp_runs`;

export async function findMrpRunById(c: PoolClient, id: string) {
  const { rows } = await c.query(
    `${MRP_RUN_SELECT} WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
  return rows[0] || null;
}

export async function listMrpRuns(c: PoolClient, limit = 50, offset = 0) {
  const { rows } = await c.query(
    `${MRP_RUN_SELECT} WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
}
