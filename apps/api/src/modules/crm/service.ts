import type { PoolClient } from 'pg';
import { AppError } from '../../core/middleware.js';
import {
  findLeadById,
  listLeads,
  findOpportunityById,
  listOpportunities,
} from './repo.js';

export class CrmService {
  public async getLead(c: PoolClient, id: string) {
    const lead = await findLeadById(c, id);
    if (!lead) throw new AppError(404, 'NOT_FOUND', `Lead ${id} not found`);
    return lead;
  }

  public async getLeads(c: PoolClient, limit = 50, offset = 0) {
    return await listLeads(c, limit, offset);
  }

  public async getOpportunity(c: PoolClient, id: string) {
    const opp = await findOpportunityById(c, id);
    if (!opp) throw new AppError(404, 'NOT_FOUND', `Opportunity ${id} not found`);
    return opp;
  }

  public async getOpportunities(c: PoolClient, limit = 50, offset = 0) {
    return await listOpportunities(c, limit, offset);
  }
}

export const crmService = new CrmService();
