import type { PoolClient } from 'pg';
import { AppError } from '../../core/middleware.js';
import {
  findWebhookById,
  listWebhooks,
  listIntegrationLogs,
} from './repo.js';

export class IntegrationsService {
  public async getWebhook(c: PoolClient, id: string) {
    const wh = await findWebhookById(c, id);
    if (!wh) throw new AppError(404, 'NOT_FOUND', `Webhook ${id} not found`);
    return wh;
  }

  public async getWebhooks(c: PoolClient) {
    return await listWebhooks(c);
  }

  public async getLogs(c: PoolClient, limit = 50, offset = 0) {
    return await listIntegrationLogs(c, limit, offset);
  }
}

export const integrationsService = new IntegrationsService();
