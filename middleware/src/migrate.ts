import { pool } from './db.js';

/**
 * Boot-time schema verification (Part A1 specification: Retire boot-time DDL)
 * DDL lives in migrations only (db/migrations/*.sql via dbmate).
 * Boot verifies schema migrations and connectivity without mutating DDL.
 */
export async function verifySchemaVersion(): Promise<string> {
  const res = await pool.query<{ version: string }>(
    'SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1'
  );
  const version = res.rows[0]?.version;
  if (!version) {
    throw new Error('Database schema is uninitialized. Please apply db/migrations with dbmate first.');
  }
  return version;
}

// Deprecated legacy alias kept for backward compatibility with external shims
export async function migrate(): Promise<void> {
  await verifySchemaVersion();
}
