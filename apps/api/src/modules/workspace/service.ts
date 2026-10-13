import type { PoolClient } from 'pg';
import { AppError } from '../../core/middleware.js';
import {
  findTaskById,
  listTasks,
  findApprovalById,
  listApprovals,
  listNotifications,
  listSavedPresets,
} from './repo.js';

export class WorkspaceService {
  public async getTask(c: PoolClient, id: string) {
    const task = await findTaskById(c, id);
    if (!task) throw new AppError(404, 'NOT_FOUND', `Task ${id} not found`);
    return task;
  }

  public async getTasks(c: PoolClient, status?: string) {
    return await listTasks(c, status);
  }

  public async getApproval(c: PoolClient, id: string) {
    const approval = await findApprovalById(c, id);
    if (!approval) throw new AppError(404, 'NOT_FOUND', `Approval ${id} not found`);
    return approval;
  }

  public async getApprovals(c: PoolClient, status?: string) {
    return await listApprovals(c, status);
  }

  public async getNotifications(c: PoolClient, limit = 50) {
    return await listNotifications(c, limit);
  }

  public async getSavedPresets(c: PoolClient, view?: string) {
    return await listSavedPresets(c, view);
  }
}

export const workspaceService = new WorkspaceService();
