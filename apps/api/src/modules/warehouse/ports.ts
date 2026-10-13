import type { PoolClient } from 'pg';

export interface WarehouseModulePorts {
  // Ports required from masterdata/core
}

export interface WarehouseApi {
  getStockByItemCode(tx: PoolClient, itemCode: string): Promise<any>;
  getLocationByCode(tx: PoolClient, code: string): Promise<any>;
}
