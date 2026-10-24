import { z } from 'zod';
import { registerResourceRoutes } from '../../core/resource.js';
import { sql } from 'drizzle-orm';
import { withDrizzleTx } from '../../db.js';
import { patchRow, type ScopedTable } from '../../core/query.js';
import { breakdownTickets } from '../../schema/erp.js';
import { can, wrap, type Actor } from '../../middleware.js';
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

      const patchData: Record<string, unknown> = {
        status: 'CLOSED',
        end_downtime: sql`COALESCE(${breakdownTickets.endDowntime}, now())`,
      };
      if (body.action_taken !== undefined) {
        patchData.action_taken = body.action_taken;
      }

      const row = await withDrizzleTx({ tenantId: a.tenantId, userId: a.userId }, async (db) => {
        return patchRow(
          db,
          breakdownTickets as ScopedTable,
          a,
          id,
          patchData,
          undefined,
          { naturalKey: 'ticket_number' }
        );
      });

      res.json({ data: row });
    })
  );
}
