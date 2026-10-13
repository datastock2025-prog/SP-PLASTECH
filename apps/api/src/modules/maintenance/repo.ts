import type { PoolClient } from 'pg';

export const WORK_ORDER_SELECT = `
  SELECT id, work_order_number, title, equipment_id, equipment_name,
         category, type, priority, status, assigned_to, due_date,
         estimated_hours, actual_hours, version, created_at, updated_at
    FROM maintenance_work_orders`;

export async function findWorkOrderById(c: PoolClient, id: string) {
  const { rows } = await c.query(
    `${WORK_ORDER_SELECT} WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
  return rows[0] || null;
}

export async function listWorkOrders(c: PoolClient, limit = 50, offset = 0) {
  const { rows } = await c.query(
    `${WORK_ORDER_SELECT} WHERE deleted_at IS NULL ORDER BY due_date ASC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
}

export const EQUIPMENT_ASSET_SELECT = `
  SELECT id, asset_code, name, category, sub_system, location,
         status, capacity, current_load_pct, power_rating_kw, health_score,
         running_hours, version, created_at, updated_at
    FROM equipment_assets`;

export async function findEquipmentAssetById(c: PoolClient, id: string) {
  const { rows } = await c.query(
    `${EQUIPMENT_ASSET_SELECT} WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
  return rows[0] || null;
}

export async function listEquipmentAssets(c: PoolClient, limit = 50, offset = 0) {
  const { rows } = await c.query(
    `${EQUIPMENT_ASSET_SELECT} WHERE deleted_at IS NULL ORDER BY asset_code ASC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
}
