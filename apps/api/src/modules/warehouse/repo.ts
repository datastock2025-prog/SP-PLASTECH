import type { PoolClient } from 'pg';

export const STOCK_TRANSFER_SELECT = `
  SELECT id, item_code, from_location, to_location, quantity, reference,
         batch_number, status, version, created_at, updated_at
    FROM stock_transfers`;

export async function findStockTransferById(c: PoolClient, id: string) {
  const { rows } = await c.query(`${STOCK_TRANSFER_SELECT} WHERE id = $1 AND deleted_at IS NULL`, [id]);
  return rows[0] || null;
}

export async function listStockTransfers(c: PoolClient, limit = 50, offset = 0) {
  const { rows } = await c.query(
    `${STOCK_TRANSFER_SELECT} WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
}

export const WAREHOUSE_LOCATION_SELECT = `
  SELECT id, code, name, type, zone, warehouse_code, active,
         created_at, updated_at
    FROM warehouse_locations`;

export async function findWarehouseLocationByCode(c: PoolClient, code: string) {
  const { rows } = await c.query(
    `${WAREHOUSE_LOCATION_SELECT} WHERE code = $1 AND deleted_at IS NULL`,
    [code]
  );
  return rows[0] || null;
}

export async function listWarehouseLocations(c: PoolClient, limit = 50, offset = 0) {
  const { rows } = await c.query(
    `${WAREHOUSE_LOCATION_SELECT} WHERE deleted_at IS NULL ORDER BY code ASC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
}
