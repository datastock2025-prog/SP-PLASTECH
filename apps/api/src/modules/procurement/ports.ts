import type { PoolClient } from 'pg';

export interface ProcurementModulePorts {
  // Ports required from masterdata/warehouse/core
}

export interface ProcurementApi {
  getPurchaseOrderById(tx: PoolClient, id: string): Promise<any>;
  getSupplierById(tx: PoolClient, id: string): Promise<any>;
}
