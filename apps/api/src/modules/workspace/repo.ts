import type { PoolClient } from 'pg';

export const TASK_SELECT = `
  SELECT id, title, module, priority, due, assigned_by, assigned_to,
         status, view, version, created_at, updated_at
    FROM user_tasks`;

export async function findTaskById(c: PoolClient, id: string) {
  const { rows } = await c.query(
    `${TASK_SELECT} WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
  return rows[0] || null;
}

export async function listTasks(c: PoolClient, status?: string) {
  if (status && status !== 'ALL') {
    const { rows } = await c.query(
      `${TASK_SELECT} WHERE status = $1 AND deleted_at IS NULL ORDER BY created_at DESC`,
      [status]
    );
    return rows;
  }
  const { rows } = await c.query(
    `${TASK_SELECT} WHERE deleted_at IS NULL ORDER BY created_at DESC`
  );
  return rows;
}

export const APPROVAL_SELECT = `
  SELECT id, document_type, document_number, requested_by, department,
         amount, currency, status, submitted_at, decided_at, decided_by,
         comments, version, created_at, updated_at
    FROM approvals_queue`;

export async function findApprovalById(c: PoolClient, id: string) {
  const { rows } = await c.query(
    `${APPROVAL_SELECT} WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
  return rows[0] || null;
}

export async function listApprovals(c: PoolClient, status?: string) {
  if (status && status !== 'ALL') {
    const { rows } = await c.query(
      `${APPROVAL_SELECT} WHERE status = $1 AND deleted_at IS NULL ORDER BY created_at DESC`,
      [status]
    );
    return rows;
  }
  const { rows } = await c.query(
    `${APPROVAL_SELECT} WHERE deleted_at IS NULL ORDER BY created_at DESC`
  );
  return rows;
}

export const NOTIFICATION_SELECT = `
  SELECT id, title, message, type, read, action_url, created_at
    FROM user_notifications`;

export async function listNotifications(c: PoolClient, limit = 50) {
  const { rows } = await c.query(
    `${NOTIFICATION_SELECT} WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
  return rows;
}

export const PRESET_SELECT = `
  SELECT id, name, view, filter_config, is_default, created_by, created_at
    FROM saved_presets`;

export async function listSavedPresets(c: PoolClient, view?: string) {
  if (view) {
    const { rows } = await c.query(
      `${PRESET_SELECT} WHERE view = $1 AND deleted_at IS NULL ORDER BY created_at DESC`,
      [view]
    );
    return rows;
  }
  const { rows } = await c.query(
    `${PRESET_SELECT} WHERE deleted_at IS NULL ORDER BY created_at DESC`
  );
  return rows;
}
