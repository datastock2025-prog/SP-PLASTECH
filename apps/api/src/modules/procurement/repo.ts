import type { PoolClient } from 'pg';

export const PO_SELECT = `
  SELECT id, supplier_id, order_date, expected_date, approval, status,
         lines, total_amount, version, created_at, updated_at
    FROM purchase_orders`;

export async function findPurchaseOrderById(c: PoolClient, id: string) {
  const { rows } = await c.query(`${PO_SELECT} WHERE id = $1 AND deleted_at IS NULL`, [id]);
  return rows[0] || null;
}

export async function listPurchaseOrders(c: PoolClient, limit = 50, offset = 0) {
  const { rows } = await c.query(
    `${PO_SELECT} WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
}

export const SUPPLIER_SELECT = `
  SELECT id, code, name, type, category, status, payment_terms,
         created_at, updated_at
    FROM suppliers`;

export async function findSupplierById(c: PoolClient, id: string) {
  const { rows } = await c.query(`${SUPPLIER_SELECT} WHERE id = $1 AND deleted_at IS NULL`, [id]);
  return rows[0] || null;
}

export async function listSuppliers(c: PoolClient, limit = 50, offset = 0) {
  const { rows } = await c.query(
    `${SUPPLIER_SELECT} WHERE deleted_at IS NULL ORDER BY name ASC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
}
