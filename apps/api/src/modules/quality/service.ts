import type { PoolClient } from 'pg';
import { AppError } from '../../core/middleware.js';
import {
  findNcrById,
  listNcrs,
  findCapaById,
  listCapas,
} from './repo.js';

export class QualityService {
  public async getNcr(c: PoolClient, id: string) {
    const ncr = await findNcrById(c, id);
    if (!ncr) throw new AppError(404, 'NOT_FOUND', `NCR ${id} not found`);
    return ncr;
  }

  public async getNcrs(c: PoolClient, limit = 50, offset = 0) {
    return await listNcrs(c, limit, offset);
  }

  public async getCapa(c: PoolClient, id: string) {
    const capa = await findCapaById(c, id);
    if (!capa) throw new AppError(404, 'NOT_FOUND', `CAPA ${id} not found`);
    return capa;
  }

  public async getCapas(c: PoolClient, limit = 50, offset = 0) {
    return await listCapas(c, limit, offset);
  }
}

export const qualityService = new QualityService();
