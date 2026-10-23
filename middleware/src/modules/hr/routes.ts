import { registerResourceRoutes } from '../../crud.js';
import * as zod from '../../schema/zod.js';
import { withTx } from '../../db.js';
import { can, wrap, type Actor } from '../../middleware.js';
import type { Req, Res } from '../../router.js';
import { z } from 'zod';

export function hrRoutes(r: any) {
  // 1. Employee Directory
  const employeeConfig = {
    subject: 'User' as const,
    table: 'employees',
    columns: [
      'id', 'tenant_id', 'plant_id', 'employee_code', 'first_name', 'last_name',
      'email', 'phone', 'gender', 'department', 'designation', 'employment_type',
      'status', 'date_of_joining', 'aadhaar_masked', 'pan_masked', 'bank_account_masked',
      'skills', 'certifications', 'version', 'created_by', 'updated_by', 'created_at', 'updated_at'
    ],
    searchColumns: ['employee_code', 'first_name', 'last_name', 'email', 'department', 'designation'],
    filterColumns: ['employee_code', 'department', 'designation', 'employment_type', 'status', 'plant_id'],
    sortAllowlist: ['created_at', 'updated_at', 'employee_code', 'first_name', 'department', 'date_of_joining'],
    createSchema: zod.employeeCreateSchema,
    updateSchema: zod.employeeUpdateSchema,
  };

  registerResourceRoutes(r, '/employees', employeeConfig);

  // 2. Attendance Records
  const attendanceConfig = {
    subject: 'User' as const,
    table: 'attendance_records',
    columns: [
      'id', 'tenant_id', 'plant_id', 'employee_id', 'employee_name', 'date',
      'check_in', 'check_out', 'status', 'shift', 'version',
      'created_by', 'updated_by', 'created_at', 'updated_at'
    ],
    searchColumns: ['employee_id', 'employee_name', 'status', 'shift'],
    filterColumns: ['employee_id', 'date', 'status', 'shift', 'plant_id'],
    sortAllowlist: ['created_at', 'updated_at', 'date', 'employee_id'],
    createSchema: zod.attendanceRecordCreateSchema,
    updateSchema: zod.attendanceRecordUpdateSchema,
  };

  registerResourceRoutes(r, '/attendance-records', attendanceConfig);
  registerResourceRoutes(r, '/attendance_records', attendanceConfig);
  registerResourceRoutes(r, '/attendance', attendanceConfig);

  // Custom bulk attendance import
  r.post('/attendance/import', can('create', 'User'), wrap(async (req: Req, res: Res) => {
    const a = req.actor! as Actor;
    const body = z.object({
      records: z.array(z.object({
        employee_id: z.string().trim().min(1),
        employee_name: z.string().trim().optional().nullable(),
        date: z.string().optional(),
        check_in: z.union([z.string(), z.date()]).optional().nullable(),
        check_out: z.union([z.string(), z.date()]).optional().nullable(),
        status: z.string().optional().default('PRESENT'),
        shift: z.string().optional().nullable(),
      })).min(1),
    }).parse(req.body);

    const insertedCount = await withTx({ tenantId: a.tenantId, userId: a.userId }, async (c) => {
      let count = 0;
      for (const rec of body.records) {
        await c.query(
          `INSERT INTO attendance_records (
              tenant_id, plant_id, employee_id, employee_name, date,
              check_in, check_out, status, shift, version, created_by, updated_by
           ) VALUES ($1, $2, $3, $4, COALESCE($5, CURRENT_DATE), $6, $7, $8, $9, 1, $10, $10)`,
          [
            a.tenantId, a.activePlantId || null, rec.employee_id, rec.employee_name || null,
            rec.date || null, rec.check_in || null, rec.check_out || null,
            rec.status, rec.shift || null, a.userId
          ]
        );
        count++;
      }
      return count;
    });

    res.status(201).json({ data: { imported: insertedCount } });
  }));

  // 3. Shift Rosters
  const shiftRosterConfig = {
    subject: 'User' as const,
    table: 'shift_rosters',
    columns: [
      'id', 'tenant_id', 'plant_id', 'employee_id', 'employee_name', 'week_start_date',
      'schedule', 'status', 'version', 'created_by', 'updated_by', 'created_at', 'updated_at'
    ],
    searchColumns: ['employee_id', 'employee_name', 'status'],
    filterColumns: ['employee_id', 'week_start_date', 'status', 'plant_id'],
    sortAllowlist: ['created_at', 'updated_at', 'week_start_date', 'employee_id'],
    createSchema: zod.shiftRosterCreateSchema,
    updateSchema: zod.shiftRosterUpdateSchema,
  };

  registerResourceRoutes(r, '/shift-rosters', shiftRosterConfig);
  registerResourceRoutes(r, '/shift_rosters', shiftRosterConfig);

  // 4. Operator Skills Matrix
  const operatorSkillConfig = {
    subject: 'User' as const,
    table: 'operator_skills',
    columns: [
      'id', 'tenant_id', 'plant_id', 'operator_id', 'machine_id', 'skill_name',
      'competency_level', 'is_certified', 'certified_date', 'version',
      'created_by', 'updated_by', 'created_at', 'updated_at'
    ],
    searchColumns: ['operator_id', 'machine_id', 'skill_name'],
    filterColumns: ['operator_id', 'machine_id', 'skill_name', 'is_certified', 'plant_id'],
    sortAllowlist: ['created_at', 'updated_at', 'competency_level', 'operator_id'],
    createSchema: zod.operatorSkillCreateSchema,
    updateSchema: zod.operatorSkillUpdateSchema,
  };

  registerResourceRoutes(r, '/operator-skills', operatorSkillConfig);
  registerResourceRoutes(r, '/operator_skills', operatorSkillConfig);
}
