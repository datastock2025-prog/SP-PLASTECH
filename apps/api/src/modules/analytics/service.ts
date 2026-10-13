import type { PoolClient } from 'pg';
import { AppError } from '../../core/middleware.js';
import {
  findKpiById,
  listKpis,
  listSavedReports,
} from './repo.js';

export class AnalyticsService {
  public async getKpi(c: PoolClient, id: string) {
    const kpi = await findKpiById(c, id);
    if (!kpi) throw new AppError(404, 'NOT_FOUND', `KPI ${id} not found`);
    return kpi;
  }

  public async getKpis(c: PoolClient, plantId?: string) {
    return await listKpis(c, plantId);
  }

  public async getSavedReports(c: PoolClient) {
    return await listSavedReports(c);
  }
}

export const analyticsService = new AnalyticsService();
