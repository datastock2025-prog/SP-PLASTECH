import type { PoolClient } from 'pg';
import { AppError } from '../../core/middleware.js';
import {
  findAccountById,
  listAccounts,
  findJournalEntryById,
  listJournalEntries,
} from './repo.js';

export class FinanceService {
  public async getAccount(c: PoolClient, id: string) {
    const account = await findAccountById(c, id);
    if (!account) throw new AppError(404, 'NOT_FOUND', `Account ${id} not found`);
    return account;
  }

  public async getAccounts(c: PoolClient, limit = 50, offset = 0) {
    return await listAccounts(c, limit, offset);
  }

  public async getJournalEntry(c: PoolClient, id: string) {
    const entry = await findJournalEntryById(c, id);
    if (!entry) throw new AppError(404, 'NOT_FOUND', `Journal entry ${id} not found`);
    return entry;
  }

  public async getJournalEntries(c: PoolClient, limit = 50, offset = 0) {
    return await listJournalEntries(c, limit, offset);
  }
}

export const financeService = new FinanceService();
