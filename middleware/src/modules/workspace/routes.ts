import { registerResourceRoutes } from '../../crud.js';
import * as zod from '../../schema/zod.js';
import { withTx } from '../../db.js';
import { AppError, can, wrap, type Actor } from '../../middleware.js';
import type { Req, Res } from '../../router.js';
import { z } from 'zod';
import { writeAudit } from '../../userStore.js';

export function workspaceRoutes(r: any) {
  // 1. Workspace Tasks
  const workspaceTaskConfig = {
    subject: 'Dashboard' as const,
    table: 'workspace_tasks',
    columns: [
      'id', 'tenant_id', 'plant_id', 'title', 'description', 'status',
      'priority', 'assigned_to', 'due_date', 'version',
      'created_by', 'updated_by', 'created_at', 'updated_at'
    ],
    searchColumns: ['title', 'description', 'status', 'priority', 'assigned_to'],
    filterColumns: ['status', 'priority', 'assigned_to', 'plant_id'],
    sortAllowlist: ['created_at', 'updated_at', 'due_date', 'priority', 'status'],
    createSchema: zod.workspaceTaskCreateSchema,
    updateSchema: zod.workspaceTaskUpdateSchema,
  };

  registerResourceRoutes(r, '/workspace-tasks', workspaceTaskConfig);
  registerResourceRoutes(r, '/workspace_tasks', workspaceTaskConfig);
  registerResourceRoutes(r, '/workspace/tasks', workspaceTaskConfig);

  // 2. Notifications
  const notificationConfig = {
    subject: 'Dashboard' as const,
    table: 'notifications',
    columns: [
      'id', 'tenant_id', 'user_id', 'type', 'title', 'message', 'is_read',
      'link', 'version', 'created_by', 'updated_by', 'created_at', 'updated_at'
    ],
    searchColumns: ['title', 'message', 'type'],
    filterColumns: ['user_id', 'type', 'is_read'],
    sortAllowlist: ['created_at', 'updated_at', 'type'],
    createSchema: zod.notificationCreateSchema,
    updateSchema: zod.notificationUpdateSchema,
  };

  registerResourceRoutes(r, '/notifications', notificationConfig);
  registerResourceRoutes(r, '/workspace/notifications', notificationConfig);

  // Mark notification as read
  const handleMarkAsRead = async (req: Req, res: Res) => {
    const a = req.actor! as Actor;
    const id = req.params.id;

    const row = await withTx({ tenantId: a.tenantId, userId: a.userId }, async (c) => {
      const { rows } = await c.query(
        `UPDATE notifications
            SET is_read = true,
                version = version + 1,
                updated_at = now()
          WHERE id = $1 AND tenant_id = $2
          RETURNING *`,
        [id, a.tenantId]
      );
      if (!rows[0]) throw new AppError(404, 'NOT_FOUND', 'Notification not found');
      return rows[0];
    });

    res.json({ data: row });
  };

  r.patch('/notifications/:id/read', can('update', 'Dashboard'), wrap(handleMarkAsRead));
  r.patch('/workspace/notifications/:id/read', can('update', 'Dashboard'), wrap(handleMarkAsRead));

  // 3. Workspace Approvals Proxy / Inbox
  r.get('/workspace/approvals', can('read', 'ApprovalRequest'), wrap(async (req: Req, res: Res) => {
    const a = req.actor! as Actor;
    const status = req.query.status ? String(req.query.status) : undefined;
    const requests = await withTx({ tenantId: a.tenantId, userId: a.userId }, async (c) => {
      const where = ['r.tenant_id = $1', 'r.deleted_at IS NULL'];
      const params: any[] = [a.tenantId];
      if (status) {
        params.push(status);
        where.push(`r.status = $${params.length}`);
      }
      const query = `
        SELECT r.id, r.tenant_id, r.workflow_id, r.entity_type, r.entity_id,
               r.current_step_number, r.status, r.requested_by, r.amount, r.metadata,
               r.version, r.created_at, r.updated_at,
               w.name AS workflow_name, w.code AS workflow_code
          FROM approval_requests r
          LEFT JOIN approval_workflows w ON w.id = r.workflow_id
         WHERE ${where.join(' AND ')}
         ORDER BY r.created_at DESC
         LIMIT 100
      `;
      const { rows } = await c.query(query, params);
      return rows;
    }, { readOnly: true });

    res.json({ data: requests });
  }));

  r.post('/workspace/approvals/:id/decision', can('approve', 'ApprovalRequest'), wrap(async (req: Req, res: Res) => {
    const a = req.actor! as Actor;
    const id = z.string().uuid().parse(req.params.id);
    const b = z.object({
      decision: z.enum(['APPROVED', 'REJECTED']),
      comments: z.string().trim().max(300).optional(),
    }).parse(req.body);

    const action = b.decision === 'APPROVED' ? 'APPROVE' : 'REJECT';

    const result = await withTx({ tenantId: a.tenantId, userId: a.userId }, async (c) => {
      const { rows: reqRows } = await c.query(
        `SELECT id, tenant_id, workflow_id, entity_type, entity_id, current_step_number, status, requested_by, amount, metadata, version
           FROM approval_requests
          WHERE id = $1 AND tenant_id = $2 FOR UPDATE`,
        [id, a.tenantId]
      );
      const reqRow = reqRows[0];
      if (!reqRow) throw new AppError(404, 'NOT_FOUND', 'Approval request not found');
      if (reqRow.status !== 'PENDING') {
        throw new AppError(400, 'ALREADY_DECIDED', `Request has already been ${reqRow.status.toLowerCase()}`);
      }

      // Record approval action
      await c.query(
        `INSERT INTO approval_actions (tenant_id, request_id, step_number, action, performed_by, comments)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [a.tenantId, id, reqRow.current_step_number, action, a.userId, b.comments || null]
      );

      let nextStatus = reqRow.status;
      if (action === 'REJECT') {
        nextStatus = 'REJECTED';
      } else {
        const { rows: nextStepRows } = await c.query(
          `SELECT step_number FROM approval_steps WHERE workflow_id = $1 AND step_number > $2 ORDER BY step_number ASC LIMIT 1`,
          [reqRow.workflow_id, reqRow.current_step_number]
        );
        if (nextStepRows[0]) {
          reqRow.current_step_number = nextStepRows[0].step_number;
        } else {
          nextStatus = 'APPROVED';
        }
      }

      const { rows: updatedRows } = await c.query(
        `UPDATE approval_requests
            SET status = $1,
                current_step_number = $2,
                version = version + 1,
                updated_at = now()
          WHERE id = $3 AND tenant_id = $4
          RETURNING *`,
        [nextStatus, reqRow.current_step_number, id, a.tenantId]
      );

      await writeAudit(c, {
        tenantId: a.tenantId,
        entityType: 'approval_request',
        entityId: id,
        action,
        performedBy: a.userId,
        newValues: { status: nextStatus, currentStepNumber: reqRow.current_step_number, comments: b.comments },
        ip: a.ip,
      });

      return updatedRows[0];
    });

    res.json({ data: result });
  }));

  // 4. Workspace Presets
  const workspacePresetConfig = {
    subject: 'Dashboard' as const,
    table: 'workspace_presets',
    columns: [
      'id', 'tenant_id', 'user_id', 'view_name', 'preset_name', 'filters',
      'columns', 'is_default', 'version', 'created_by', 'updated_by', 'created_at', 'updated_at'
    ],
    searchColumns: ['view_name', 'preset_name'],
    filterColumns: ['view_name', 'user_id', 'is_default'],
    sortAllowlist: ['created_at', 'updated_at', 'preset_name'],
    createSchema: zod.workspacePresetCreateSchema,
    updateSchema: zod.workspacePresetUpdateSchema,
  };

  registerResourceRoutes(r, '/workspace-presets', workspacePresetConfig);
  registerResourceRoutes(r, '/workspace_presets', workspacePresetConfig);
  registerResourceRoutes(r, '/workspace/presets', workspacePresetConfig);
}
