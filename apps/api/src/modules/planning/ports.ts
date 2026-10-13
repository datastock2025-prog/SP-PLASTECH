import type { PoolClient } from 'pg';

export interface PlanningModulePorts {
  // Ports required from engineering, sales, procurement, warehouse, manufacturing (read only)
  getBomExplosionPort?(itemCode: string, qty: number): Promise<any>;
  getUnfulfilledSalesOrdersPort?(): Promise<any[]>;
  getInventoryLevelsPort?(itemCodes: string[]): Promise<Record<string, number>>;
}

export interface PlanningApi {
  getPlannedOrderById(tx: PoolClient, id: string): Promise<any>;
  getMrpRunById(tx: PoolClient, id: string): Promise<any>;
}
