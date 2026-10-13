import type { PoolClient } from 'pg';

export interface HrModulePorts {
  // Currently consumes no external events
}

export interface HrApi {
  getEmployeeById(tx: PoolClient, id: string): Promise<any>;
  listEmployeesByPlant(tx: PoolClient, plantId: string): Promise<any[]>;
}
