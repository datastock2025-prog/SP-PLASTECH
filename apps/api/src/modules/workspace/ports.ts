import type { PoolClient } from 'pg';

export interface WorkspaceModulePorts {
  // Consumes events from procurement, engineering, quality
  onPoApprovedHandler?(event: any): Promise<void>;
  onBomVersionApprovedHandler?(event: any): Promise<void>;
  onNcrRaisedHandler?(event: any): Promise<void>;
}

export interface WorkspaceApi {
  getTaskById(tx: PoolClient, id: string): Promise<any>;
  listTasks(tx: PoolClient, status?: string): Promise<any[]>;
  getApprovalById(tx: PoolClient, id: string): Promise<any>;
  listApprovals(tx: PoolClient, status?: string): Promise<any[]>;
  listNotifications(tx: PoolClient, userId?: string): Promise<any[]>;
  listSavedPresets(tx: PoolClient, view?: string): Promise<any[]>;
}
