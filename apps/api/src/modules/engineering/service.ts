import type { PoolClient } from 'pg';
import { AppError } from '../../core/middleware.js';
import { findBomById, findBomsByItemCode, listBoms, listEcrs } from './repo.js';

export class EngineeringService {
  public async getBom(c: PoolClient, id: string) {
    const bom = await findBomById(c, id);
    if (!bom) throw new AppError(404, 'NOT_FOUND', `BOM ${id} not found`);
    return bom;
  }

  public async getBomsByItem(c: PoolClient, itemCode: string) {
    return await findBomsByItemCode(c, itemCode);
  }

  public async getBoms(c: PoolClient, limit = 50, offset = 0) {
    return await listBoms(c, limit, offset);
  }

  public async getEcrs(c: PoolClient, limit = 50, offset = 0) {
    return await listEcrs(c, limit, offset);
  }
}

export const engineeringService = new EngineeringService();
