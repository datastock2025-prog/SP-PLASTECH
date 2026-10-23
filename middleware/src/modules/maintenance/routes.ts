import { z } from 'zod';
import { registerResourceRoutes } from '../../crud.js';
import { withTx } from '../../db.js';
import { AppError, can, wrap, type Actor } from '../../middleware.js';
import type { Req, Res } from '../../router.js';
import * as zod from '../../schema/zod.js';

export function maintenanceRoutes(r: any) {
  // Preventive Maintenance Schedules
  const pmConfig = {
    subject: 'PreventiveMaintenance' as const,
    table: 'maintenance_schedules',
    columns: [
      'id', 'tenant_id', 'plant_id', 'machine_id', 'mold_id', 'frequency_type',
      'threshold_value', 'task_description', 'last_completed_date', 'next_due_date',
      'status', 'version', 'created_at', 'updated_at'
    ],
    searchColumns: ['machine_id', 'mold_id', 'task_description', 'status'],
    sortAllowlist: ['created_at', 'updated_at', 'machine_id', 'next_due_date'],
    createSchema: zod.insertMaintenanceScheduleSchema,
    updateSchema: zod.updateMaintenanceScheduleSchema,
  };

  registerResourceRoutes(r, '/maintenance-schedules', pmConfig);
  registerResourceRoutes(r, '/maintenance_schedules', pmConfig);
  registerResourceRoutes(r, '/maintenance-work-orders', pmConfig);
  registerResourceRoutes(r, '/maintenance_work_orders', pmConfig);

  // Breakdown Tickets
  const breakdownConfig = {
    subject: 'PreventiveMaintenance' as const,
    table: 'breakdown_tickets',
    columns: [
      'id', 'tenant_id', 'plant_id', 'ticket_number', 'machine_id', 'fault_category',
      'symptom', 'severity', 'start_downtime', 'end_downtime', 'action_taken',
      'status', 'version', 'created_at', 'updated_at'
    ],
    searchColumns: ['ticket_number', 'machine_id', 'fault_category', 'symptom', 'status'],
    sortAllowlist: ['created_at', 'updated_at', 'ticket_number', 'start_downtime'],
    createSchema: zod.insertBreakdownTicketSchema,
    updateSchema: zod.updateBreakdownTicketSchema,
  };

  registerResourceRoutes(r, '/breakdown-tickets', breakdownConfig);
  registerResourceRoutes(r, '/breakdown_tickets', breakdownConfig);

  // Close breakdown ticket endpoint
  r.post(
    '/breakdown-tickets/:id/close',
    can('update', 'PreventiveMaintenance'),
    wrap(async (req: Req, res: Res) => {
      const a = req.actor! as Actor;
      const id = req.params.id;
      const body = z.object({
        action_taken: z.string().trim().optional(),
      }).parse(req.body);

      const row = await withTx({ tenantId: a.tenantId, userId: a.userId }, async (c) => {
        const { rows } = await c.query(
          `UPDATE breakdown_tickets 
           SET status = 'CLOSED', 
               end_downtime = COALESCE(end_downtime, now()),
               action_taken = COALESCE($1, action_taken), 
               updated_at = now(), 
               version = version + 1 
           WHERE (id::text = $2 OR ticket_number = $2) AND tenant_id = $3 
           RETURNING *`,
          [body.action_taken || null, id, a.tenantId]
        );
        if (!rows.length) throw new AppError(404, 'NOT_FOUND', 'Breakdown ticket not found');
        return rows[0];
      });

      res.json({ data: row });
    })
  );
}
