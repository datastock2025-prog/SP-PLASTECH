import type { PoolClient } from 'pg';

export interface QualityModulePorts {
  // Ports required from warehouse (hold and release port)
  holdWarehouseLotPort?(lotNumber: string, reason: string): Promise<boolean>;
  releaseWarehouseLotPort?(lotNumber: string, releasedBy: string): Promise<boolean>;
}

export interface QualityApi {
  getNcrById(tx: PoolClient, id: string): Promise<any>;
  getCapaById(tx: PoolClient, id: string): Promise<any>;
}
