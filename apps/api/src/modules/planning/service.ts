import type { PoolClient } from 'pg';
import { AppError } from '../../core/middleware.js';
import {
  findPlannedOrderById,
  listPlannedOrders,
  findMrpRunById,
  listMrpRuns,
} from './repo.js';

export class PlanningService {
  public async getPlannedOrder(c: PoolClient, id: string) {
    const order = await findPlannedOrderById(c, id);
    if (!order) throw new AppError(404, 'NOT_FOUND', `Planned order ${id} not found`);
    return order;
  }

  public async getPlannedOrders(c: PoolClient, limit = 50, offset = 0) {
    return await listPlannedOrders(c, limit, offset);
  }

  public async getMrpRun(c: PoolClient, id: string) {
    const run = await findMrpRunById(c, id);
    if (!run) throw new AppError(404, 'NOT_FOUND', `MRP run ${id} not found`);
    return run;
  }

  public async getMrpRuns(c: PoolClient, limit = 50, offset = 0) {
    return await listMrpRuns(c, limit, offset);
  }
}

export const planningService = new PlanningService();
