import type { PoolClient } from 'pg';

export const NCR_SELECT = `
  SELECT id, title, item_code, severity, defect_type, lot_number,
         reported_by, description, quantity_affected, status,
         version, created_at, updated_at
    FROM quality_ncrs`;

export async function findNcrById(c: PoolClient, id: string) {
  const { rows } = await c.query(
    `${NCR_SELECT} WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
  return rows[0] || null;
}

export async function listNcrs(c: PoolClient, limit = 50, offset = 0) {
  const { rows } = await c.query(
    `${NCR_SELECT} WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
}

export const CAPA_SELECT = `
  SELECT id, title, ncr_id, assigned_to, root_cause, action_plan,
         status, due_date, version, created_at, updated_at
    FROM quality_capas`;

export async function findCapaById(c: PoolClient, id: string) {
  const { rows } = await c.query(
    `${CAPA_SELECT} WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
  return rows[0] || null;
}

export async function listCapas(c: PoolClient, limit = 50, offset = 0) {
  const { rows } = await c.query(
    `${CAPA_SELECT} WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
}
