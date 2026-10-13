import type { PoolClient } from 'pg';

export const EMPLOYEE_SELECT = `
  SELECT id, employee_code, full_name, department, designation,
         role, shift, status, email, phone, joining_date, skill_level,
         plant_id, version, created_at, updated_at
    FROM employees`;

export async function findEmployeeById(c: PoolClient, id: string) {
  const { rows } = await c.query(
    `${EMPLOYEE_SELECT} WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
  return rows[0] || null;
}

export async function listEmployees(c: PoolClient, limit = 50, offset = 0) {
  const { rows } = await c.query(
    `${EMPLOYEE_SELECT} WHERE deleted_at IS NULL ORDER BY employee_code ASC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
}

export const ATTENDANCE_SELECT = `
  SELECT id, employee_id, date, shift, status, check_in, check_out,
         overtime_hours, created_at, updated_at
    FROM attendance_records`;

export async function listAttendanceByDate(c: PoolClient, date: string) {
  const { rows } = await c.query(
    `${ATTENDANCE_SELECT} WHERE date = $1 ORDER BY employee_id ASC`,
    [date]
  );
  return rows;
}

export const SHIFT_ROSTER_SELECT = `
  SELECT id, employee_id, shift_code, date, department, created_at, updated_at
    FROM shift_rosters`;

export async function listShiftRosters(c: PoolClient, limit = 100, offset = 0) {
  const { rows } = await c.query(
    `${SHIFT_ROSTER_SELECT} ORDER BY date DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
}
