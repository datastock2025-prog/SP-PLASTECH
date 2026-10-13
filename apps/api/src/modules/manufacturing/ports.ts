import type { PoolClient } from 'pg';

export interface ManufacturingModulePorts {
  // Ports required from engineering, warehouse, hr
  getBomDetailsPort?(bomId: string): Promise<any>;
  consumeMaterialPort?(materials: Array<{ itemCode: string; qty: number }>): Promise<boolean>;
  verifyOperatorSkillPort?(operatorId: string, machineType: string): Promise<boolean>;
}

export interface ManufacturingApi {
  getWorkOrderById(tx: PoolClient, id: string): Promise<any>;
  getMachineById(tx: PoolClient, id: string): Promise<any>;
}
