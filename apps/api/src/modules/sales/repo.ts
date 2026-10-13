import type { PoolClient } from 'pg';

export const SO_SELECT = `
  SELECT id, so_number, customer_id, customer_name, status,
         total_value, lines, priority, order_date, delivery_date,
         version, created_at, updated_at
    FROM sales_orders`;

export async function findSalesOrderById(c: PoolClient, id: string) {
  const { rows } = await c.query(`${SO_SELECT} WHERE id = $1 AND deleted_at IS NULL`, [id]);
  return rows[0] || null;
}

export async function listSalesOrders(c: PoolClient, limit = 50, offset = 0) {
  const { rows } = await c.query(
    `${SO_SELECT} WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
}

export const CUSTOMER_SELECT = `
  SELECT id, code, name, segment, credit_limit, contact, email,
         phone, status, gstin, pan, created_at, updated_at
    FROM customers`;

export async function findCustomerById(c: PoolClient, id: string) {
  const { rows } = await c.query(
    `${CUSTOMER_SELECT} WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
  return rows[0] || null;
}

export async function listCustomers(c: PoolClient, limit = 50, offset = 0) {
  const { rows } = await c.query(
    `${CUSTOMER_SELECT} WHERE deleted_at IS NULL ORDER BY name ASC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
}
