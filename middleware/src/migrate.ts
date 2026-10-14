import type { Auth } from './auth.js';
import { pool } from './db.js';
import { getMigrations } from 'better-auth/db/migration';

export async function migrate(auth: Auth, identitySql: string): Promise<void> {
  const { runMigrations } = await getMigrations(auth.options);
  await runMigrations();
  await pool.query(identitySql);
}
