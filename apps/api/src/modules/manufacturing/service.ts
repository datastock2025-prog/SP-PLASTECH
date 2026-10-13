import type { PoolClient } from 'pg';
import { AppError } from '../../core/middleware.js';
import {
  findWorkOrderById,
  listWorkOrders,
  findMachineById,
  listMachines,
} from './repo.js';

export class ManufacturingService {
  public async getWorkOrder(c: PoolClient, id: string) {
    const wo = await findWorkOrderById(c, id);
    if (!wo) throw new AppError(404, 'NOT_FOUND', `Work order ${id} not found`);
    return wo;
  }

  public async getWorkOrders(c: PoolClient, limit = 50, offset = 0) {
    return await listWorkOrders(c, limit, offset);
  }

  public async getMachine(c: PoolClient, id: string) {
    const machine = await findMachineById(c, id);
    if (!machine) throw new AppError(404, 'NOT_FOUND', `Machine ${id} not found`);
    return machine;
  }

  public async getMachines(c: PoolClient, limit = 50, offset = 0) {
    return await listMachines(c, limit, offset);
  }
}

export const manufacturingService = new ManufacturingService();
