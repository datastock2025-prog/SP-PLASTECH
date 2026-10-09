import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getMigrations } from 'better-auth/db/migration';
import type { Auth } from './auth.js';
import { config } from './config.js';
import { pool } from './db.js';

export async function migrate(auth: Auth): Promise<void> {
  const { runMigrations } = await getMigrations(auth.options);
  await runMigrations();
  const sql = readFileSync(resolve(config.root, 'sql', '001_identity.sql'), 'utf8');
  await pool.query(sql);
}
