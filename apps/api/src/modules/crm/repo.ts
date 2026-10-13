import type { PoolClient } from 'pg';

export const LEAD_SELECT = `
  SELECT id, lead_name, company_name, contact_person, email,
         phone, city, status, source, estimated_value, assigned_to,
         version, created_at, updated_at
    FROM crm_leads`;

export async function findLeadById(c: PoolClient, id: string) {
  const { rows } = await c.query(
    `${LEAD_SELECT} WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
  return rows[0] || null;
}

export async function listLeads(c: PoolClient, limit = 50, offset = 0) {
  const { rows } = await c.query(
    `${LEAD_SELECT} WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
}

export const OPPORTUNITY_SELECT = `
  SELECT id, opportunity_name, account_id, account_name, stage,
         probability, expected_revenue, closing_date, assigned_to,
         version, created_at, updated_at
    FROM opportunity_pipeline`;

export async function findOpportunityById(c: PoolClient, id: string) {
  const { rows } = await c.query(
    `${OPPORTUNITY_SELECT} WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
  return rows[0] || null;
}

export async function listOpportunities(c: PoolClient, limit = 50, offset = 0) {
  const { rows } = await c.query(
    `${OPPORTUNITY_SELECT} WHERE deleted_at IS NULL ORDER BY closing_date ASC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
}
