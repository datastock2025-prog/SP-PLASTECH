import type { PoolClient } from 'pg';

export const WEBHOOK_SELECT = `
  SELECT id, name, url, secret, events, active, failure_count,
         version, created_at, updated_at
    FROM webhook_endpoints`;

export async function findWebhookById(c: PoolClient, id: string) {
  const { rows } = await c.query(
    `${WEBHOOK_SELECT} WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
  return rows[0] || null;
}

export async function listWebhooks(c: PoolClient) {
  const { rows } = await c.query(
    `${WEBHOOK_SELECT} WHERE deleted_at IS NULL ORDER BY created_at DESC`
  );
  return rows;
}

export const INTEGRATION_LOG_SELECT = `
  SELECT id, service, direction, status, status_code, latency_ms,
         payload_size, error_message, created_at
    FROM integration_logs`;

export async function listIntegrationLogs(c: PoolClient, limit = 50, offset = 0) {
  const { rows } = await c.query(
    `${INTEGRATION_LOG_SELECT} ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
}
