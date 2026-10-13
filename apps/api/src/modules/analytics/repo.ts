import type { PoolClient } from 'pg';

export const KPI_SELECT = `
  SELECT id, kpi_category, kpi_name, kpi_value, kpi_target,
         kpi_unit, period, period_type, year, trend, plant_id,
         version, created_at, updated_at
    FROM executive_kpis`;

export async function findKpiById(c: PoolClient, id: string) {
  const { rows } = await c.query(
    `${KPI_SELECT} WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
  return rows[0] || null;
}

export async function listKpis(c: PoolClient, plantId?: string) {
  let query = `${KPI_SELECT} WHERE deleted_at IS NULL`;
  const params: any[] = [];
  if (plantId) {
    query += ` AND plant_id = $1`;
    params.push(plantId);
  }
  query += ` ORDER BY kpi_category ASC, kpi_name ASC`;
  const { rows } = await c.query(query, params);
  return rows;
}

export const SAVED_REPORT_SELECT = `
  SELECT id, title, report_type, created_by, configuration,
         created_at, updated_at
    FROM saved_reports`;

export async function listSavedReports(c: PoolClient) {
  const { rows } = await c.query(
    `${SAVED_REPORT_SELECT} ORDER BY created_at DESC`
  );
  return rows;
}
