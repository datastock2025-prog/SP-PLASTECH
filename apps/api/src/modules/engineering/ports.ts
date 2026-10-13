import type { PoolClient } from 'pg';

export interface EngineeringModulePorts {
  // Engineering ports required from core/masterdata
}

export interface EngineeringApi {
  getBomById(tx: PoolClient, id: string): Promise<any>;
  getBomsByItemCode(tx: PoolClient, itemCode: string): Promise<any[]>;
}
