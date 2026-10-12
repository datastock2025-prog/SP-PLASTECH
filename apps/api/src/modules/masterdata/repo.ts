import type { PoolClient } from 'pg';

export const ITEM_SELECT = `
  SELECT id, code, name, category, type, uom, cost_price, selling_price, min_stock, max_stock,
         reorder_point, safety_stock, location, description, hsn_code, is_batch_tracked,
         part_weight_grams, runner_weight_grams, cavity_count, cycle_time_seconds,
         mold_code, resin_type, color, version, created_at, updated_at
    FROM items`;

export async function findItemById(c: PoolClient, id: string) {
  const { rows } = await c.query(`${ITEM_SELECT} WHERE id = $1 AND deleted_at IS NULL`, [id]);
  return rows[0] || null;
}

export async function findItemByCode(c: PoolClient, code: string) {
  const { rows } = await c.query(`${ITEM_SELECT} WHERE code = $1 AND deleted_at IS NULL`, [code]);
  return rows[0] || null;
}

export async function listItems(c: PoolClient, limit = 50, offset = 0) {
  const { rows } = await c.query(
    `${ITEM_SELECT} WHERE deleted_at IS NULL ORDER BY code ASC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
}
