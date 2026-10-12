import type { PoolClient } from 'pg';

export interface MasterDataModulePorts {
  // MasterData ports required from core/identity
}

export interface MasterDataApi {
  getItemById(tx: PoolClient, id: string): Promise<any>;
  getItemByCode(tx: PoolClient, code: string): Promise<any>;
}
