import type { PoolClient } from 'pg';
import { AppError } from '../../core/middleware.js';
import { findItemById, findItemByCode, listItems } from './repo.js';

export class MasterDataService {
  public async getItem(c: PoolClient, id: string) {
    const item = await findItemById(c, id);
    if (!item) throw new AppError(404, 'NOT_FOUND', `Item ${id} not found`);
    return item;
  }

  public async getItemByCode(c: PoolClient, code: string) {
    const item = await findItemByCode(c, code);
    if (!item) throw new AppError(404, 'NOT_FOUND', `Item with code ${code} not found`);
    return item;
  }

  public async getItems(c: PoolClient, limit = 50, offset = 0) {
    return await listItems(c, limit, offset);
  }
}

export const masterDataService = new MasterDataService();
