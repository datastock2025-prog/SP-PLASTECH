import type { PoolClient } from 'pg';

export const WORK_ORDER_SELECT = `
  SELECT id, item, machine, qty, uom, completed, scrap,
         status, priority, due_date, operator, shift,
         bom_id, version, created_at, updated_at
    FROM work_orders`;

export async function findWorkOrderById(c: PoolClient, id: string) {
  const { rows } = await c.query(
    `${WORK_ORDER_SELECT} WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
  return rows[0] || null;
}

export async function listWorkOrders(c: PoolClient, limit = 50, offset = 0) {
  const { rows } = await c.query(
    `${WORK_ORDER_SELECT} WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
}

export const MACHINE_SELECT = `
  SELECT id, code, name, type, line, status, tonnage,
         hourly_rate, created_at, updated_at
    FROM machines`;

export async function findMachineById(c: PoolClient, id: string) {
  const { rows } = await c.query(
    `${MACHINE_SELECT} WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
  return rows[0] || null;
}

export async function listMachines(c: PoolClient, limit = 50, offset = 0) {
  const { rows } = await c.query(
    `${MACHINE_SELECT} WHERE deleted_at IS NULL ORDER BY name ASC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
}
