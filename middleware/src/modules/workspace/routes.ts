import { registerResourceRoutes } from '../../core/resource.js';
import * as zod from '../../schema/zod.js';
import { and, asc, desc, eq, gt, isNull } from 'drizzle-orm';
import { withDrizzleTx } from '../../db.js';
import { AppError, can, wrap, type Actor } from '../../middleware.js';
import type { Req, Res } from '../../router.js';
import { z } from 'zod';
import { writeAudit } from '../../core/audit.js';
import { patchRow, snakeSelect, type ScopedTable } from '../../core/query.js';
import {
  notifications,
  approvalRequests,
  approvalWorkflows,
  approvalSteps,
  approvalActions,
} from '../../schema/index.js';

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

    const row = await withDrizzleTx({ tenantId: a.tenantId, userId: a.userId }, async (db) => {
      return patchRow(db, notifications as ScopedTable, a, id, { is_read: true });
    });

    res.json({ data: row });
  };

  r.patch('/notifications/:id/read', can('update', 'Dashboard'), wrap(handleMarkAsRead));
  r.patch('/workspace/notifications/:id/read', can('update', 'Dashboard'), wrap(handleMarkAsRead));

  // 3. Workspace Approvals Proxy / Inbox
  r.get('/workspace/approvals', can('read', 'ApprovalRequest'), wrap(async (req: Req, res: Res) => {
    const a = req.actor! as Actor;
    const status = req.query.status ? String(req.query.status) : undefined;
    const requests = await withDrizzleTx({ tenantId: a.tenantId, userId: a.userId }, async (db) => {
      const conditions = [
        eq(approvalRequests.tenantId, a.tenantId),
        isNull(approvalRequests.deletedAt),
      ];
      if (status) conditions.push(eq(approvalRequests.status, status));

      return db
        .select({
          ...snakeSelect(approvalRequests),
          workflow_name: approvalWorkflows.name,
          workflow_code: approvalWorkflows.code,
        })
        .from(approvalRequests)
        .leftJoin(approvalWorkflows, eq(approvalWorkflows.id, approvalRequests.workflowId))
        .where(and(...conditions))
        .orderBy(desc(approvalRequests.createdAt))
        .limit(100);
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

    const result = await withDrizzleTx({ tenantId: a.tenantId, userId: a.userId }, async (db, c) => {
      const [reqRow] = await db
        .select(snakeSelect(approvalRequests))
        .from(approvalRequests)
        .where(
          and(
            eq(approvalRequests.id, id),
            eq(approvalRequests.tenantId, a.tenantId)
          )
        )
        .for('update');

      if (!reqRow) throw new AppError(404, 'NOT_FOUND', 'Approval request not found');
      const currentStatus = String(reqRow.status);
      if (currentStatus !== 'PENDING') {
        throw new AppError(400, 'ALREADY_DECIDED', `Request has already been ${currentStatus.toLowerCase()}`);
      }

      let currentStepNumber = Number(reqRow.current_step_number);

      // Record approval action
      await db.insert(approvalActions).values({
        tenantId: a.tenantId,
        requestId: id,
        stepNumber: currentStepNumber,
        action,
        performedBy: a.userId,
        comments: b.comments || null,
      });

      let nextStatus: string = currentStatus;
      if (action === 'REJECT') {
        nextStatus = 'REJECTED';
      } else {
        const [nextStep] = await db
          .select({ stepNumber: approvalSteps.stepNumber })
          .from(approvalSteps)
          .where(
            and(
              eq(approvalSteps.workflowId, reqRow.workflow_id),
              gt(approvalSteps.stepNumber, currentStepNumber)
            )
          )
          .orderBy(asc(approvalSteps.stepNumber))
          .limit(1);

        if (nextStep) {
          currentStepNumber = nextStep.stepNumber;
        } else {
          nextStatus = 'APPROVED';
        }
      }

      const updated = await patchRow(db, approvalRequests as ScopedTable, a, id, {
        status: nextStatus,
        current_step_number: currentStepNumber,
      });

      await writeAudit(c, {
        tenantId: a.tenantId,
        entityType: 'approval_request',
        entityId: id,
        action,
        performedBy: a.userId,
        newValues: { status: nextStatus, currentStepNumber: currentStepNumber, comments: b.comments },
        ip: a.ip,
      });

      return updated;
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
