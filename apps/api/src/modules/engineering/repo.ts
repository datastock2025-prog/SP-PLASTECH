import type { PoolClient } from 'pg';

export const BOM_SELECT = `
  SELECT id, code, item_code, version, yield_percent, status,
         components, version_number, created_at, updated_at
    FROM bill_of_materials`;

export async function findBomById(c: PoolClient, id: string) {
  const { rows } = await c.query(`${BOM_SELECT} WHERE id = $1 AND deleted_at IS NULL`, [id]);
  return rows[0] || null;
}

export async function findBomsByItemCode(c: PoolClient, itemCode: string) {
  const { rows } = await c.query(
    `${BOM_SELECT} WHERE item_code = $1 AND deleted_at IS NULL ORDER BY version DESC`,
    [itemCode]
  );
  return rows;
}

export async function listBoms(c: PoolClient, limit = 50, offset = 0) {
  const { rows } = await c.query(
    `${BOM_SELECT} WHERE deleted_at IS NULL ORDER BY code ASC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
}

export const ECR_SELECT = `
  SELECT id, ecr_number, title, item_code, status, priority,
         description, requested_by, created_at, updated_at
    FROM engineering_change_requests`;

export async function listEcrs(c: PoolClient, limit = 50, offset = 0) {
  const { rows } = await c.query(
    `${ECR_SELECT} WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
}
