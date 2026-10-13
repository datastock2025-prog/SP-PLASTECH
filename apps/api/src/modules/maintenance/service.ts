import type { PoolClient } from 'pg';
import { AppError } from '../../core/middleware.js';
import {
  findWorkOrderById,
  listWorkOrders,
  findEquipmentAssetById,
  listEquipmentAssets,
} from './repo.js';

export class MaintenanceService {
  public async getWorkOrder(c: PoolClient, id: string) {
    const wo = await findWorkOrderById(c, id);
    if (!wo) throw new AppError(404, 'NOT_FOUND', `Maintenance work order ${id} not found`);
    return wo;
  }

  public async getWorkOrders(c: PoolClient, limit = 50, offset = 0) {
    return await listWorkOrders(c, limit, offset);
  }

  public async getEquipmentAsset(c: PoolClient, id: string) {
    const eq = await findEquipmentAssetById(c, id);
    if (!eq) throw new AppError(404, 'NOT_FOUND', `Equipment asset ${id} not found`);
    return eq;
  }

  public async getEquipmentAssets(c: PoolClient, limit = 50, offset = 0) {
    return await listEquipmentAssets(c, limit, offset);
  }
}

export const maintenanceService = new MaintenanceService();
