import type { PoolClient } from 'pg';

export const ACCOUNT_SELECT = `
  SELECT id, code, name, type, category, balance, currency,
         active, version, created_at, updated_at
    FROM accounts`;

export async function findAccountById(c: PoolClient, id: string) {
  const { rows } = await c.query(
    `${ACCOUNT_SELECT} WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
  return rows[0] || null;
}

export async function listAccounts(c: PoolClient, limit = 50, offset = 0) {
  const { rows } = await c.query(
    `${ACCOUNT_SELECT} WHERE deleted_at IS NULL ORDER BY code ASC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
}

export const JOURNAL_ENTRY_SELECT = `
  SELECT id, entry_number, date, description, lines, status,
         version, created_at, updated_at
    FROM journal_entries`;

export async function findJournalEntryById(c: PoolClient, id: string) {
  const { rows } = await c.query(
    `${JOURNAL_ENTRY_SELECT} WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
  return rows[0] || null;
}

export async function listJournalEntries(c: PoolClient, limit = 50, offset = 0) {
  const { rows } = await c.query(
    `${JOURNAL_ENTRY_SELECT} WHERE deleted_at IS NULL ORDER BY date DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
}
