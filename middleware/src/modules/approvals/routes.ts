import { z } from 'zod';
import { eq, and, isNull, desc, asc, sql } from 'drizzle-orm';
import { withDrizzleTx, schema } from '../../db.js';
import { AppError, can, wrap, type Actor } from '../../middleware.js';
import { writeAudit } from '../../userStore.js';
import { ctx } from '../../core/helpers.js';

const str = (max = 200) => z.string().trim().min(1).max(max);
const optStr = (max = 200) => z.string().trim().max(max).nullable().optional().transform((v) => (v ? v : null));

export function approvalsRoutes(r: any) {
  // ---------- Protocol 1E: Approvals, Governance, Audit Logs & Search ----------
  r.get('/approval-workflows', can('read', 'ApprovalWorkflow'), wrap(async (req, res) => {
    const a = req.actor!;
    const workflows = await withDrizzleTx(ctx(a), async (tx) => {
      const wfList = await tx
        .select()
        .from(schema.approvalWorkflows)
        .where(isNull(schema.approvalWorkflows.deletedAt))
        .orderBy(asc(schema.approvalWorkflows.code));
      const steps = await tx
        .select()
        .from(schema.approvalSteps)
        .orderBy(asc(schema.approvalSteps.stepNumber));
      return wfList.map((w) => ({
        ...w,
        steps: steps.filter((s) => s.workflowId === w.id),
      }));
    });
    res.json({ data: workflows });
  }));

  r.post('/approval-workflows', can('create', 'ApprovalWorkflow'), wrap(async (req, res) => {
    const a = req.actor!;
    const b = z.object({
      code: str(30).transform((v) => v.toUpperCase()),
      name: str(120),
      entityType: str(40),
      minAmount: z.coerce.number().optional().nullable(),
      maxAmount: z.coerce.number().optional().nullable(),
      steps: z.array(z.object({
        stepNumber: z.number().int().min(1),
        stepName: str(60),
        approverType: z.enum(['ROLE', 'USER', 'GROUP']).default('ROLE'),
        approverId: str(64),
        isMandatory: z.boolean().default(true),
      })).min(1),
    }).parse(req.body);

    const created = await withDrizzleTx(ctx(a), async (tx, c) => {
      const [wf] = await tx
        .insert(schema.approvalWorkflows)
        .values({
          tenantId: a.tenantId,
          code: b.code,
          name: b.name,
          entityType: b.entityType,
          minAmount: b.minAmount ? String(b.minAmount) : null,
          maxAmount: b.maxAmount ? String(b.maxAmount) : null,
        })
        .returning();

      for (const s of b.steps) {
        await tx.insert(schema.approvalSteps).values({
          tenantId: a.tenantId,
          workflowId: wf.id,
          stepNumber: s.stepNumber,
          stepName: s.stepName,
          approverType: s.approverType,
          approverId: s.approverId,
          isMandatory: s.isMandatory,
        });
      }

      await writeAudit(c, {
        tenantId: a.tenantId,
        entityType: 'approval_workflow',
        entityId: wf.id,
        action: 'CREATE',
        performedBy: a.userId,
        newValues: { ...wf, steps: b.steps },
        ip: a.ip,
      });

      return wf;
    });

    res.status(201).json({ data: created });
  }));

  r.get('/approval-requests', can('read', 'ApprovalRequest'), wrap(async (req, res) => {
    const a = req.actor!;
    const status = req.query.status ? String(req.query.status) : undefined;
    const entityType = req.query.entityType ? String(req.query.entityType) : undefined;
    const requests = await withDrizzleTx(ctx(a), async (_tx, c) => {
      const where = ['r.tenant_id = $1', 'r.deleted_at IS NULL'];
      const params: any[] = [a.tenantId];
      if (status) {
        params.push(status);
        where.push(`r.status = $${params.length}`);
      }
      if (entityType) {
        params.push(entityType);
        where.push(`r.entity_type = $${params.length}`);
      }
      const query = `
        SELECT r.*, w.name AS workflow_name, w.code AS workflow_code
        FROM public.approval_requests r
        JOIN public.approval_workflows w ON w.id = r.workflow_id
        WHERE ${where.join(' AND ')}
        ORDER BY r.created_at DESC
        LIMIT 100
      `;
      const rows = (await c.query(query, params)).rows;
      return rows;
    });
    res.json({ data: requests });
  }));

  r.post('/approval-requests', wrap(async (req, res) => {
    const a = req.actor!;
    const b = z.object({
      workflowId: z.string().uuid(),
      entityType: str(40),
      entityId: str(64),
      amount: z.coerce.number().optional().nullable(),
      metadata: z.record(z.string(), z.any()).optional().default({}),
    }).parse(req.body);

    const created = await withDrizzleTx(ctx(a), async (tx, c) => {
      const [reqRow] = await tx
        .insert(schema.approvalRequests)
        .values({
          tenantId: a.tenantId,
          workflowId: b.workflowId,
          entityType: b.entityType,
          entityId: b.entityId,
          amount: b.amount ? String(b.amount) : null,
          metadata: b.metadata,
          requestedBy: a.userId,
        })
        .returning();

      await writeAudit(c, {
        tenantId: a.tenantId,
        entityType: 'approval_request',
        entityId: reqRow.id,
        action: 'CREATE',
        performedBy: a.userId,
        newValues: reqRow,
        ip: a.ip,
      });

      return reqRow;
    });

    res.status(201).json({ data: created });
  }));

  r.post('/approval-requests/:id/decide', wrap(async (req, res) => {
    const a = req.actor!;
    const id = z.string().uuid().parse(req.params.id);
    const b = z.object({
      action: z.enum(['APPROVE', 'REJECT']),
      comments: optStr(300),
    }).parse(req.body);

    const result = await withDrizzleTx(ctx(a), async (tx, c) => {
      const reqRow = (await c.query(`SELECT id, tenant_id, workflow_id, entity_type, entity_id, current_step_number, status, requested_by, amount, metadata, version, created_at, updated_at, deleted_at FROM public.approval_requests WHERE id = $1 AND tenant_id = $2 FOR UPDATE`, [id, a.tenantId])).rows[0];
      if (!reqRow) throw new AppError(404, 'NOT_FOUND', 'Approval request not found');
      if (reqRow.status !== 'PENDING') throw new AppError(400, 'ALREADY_DECIDED', `Request has already been ${reqRow.status.toLowerCase()}`);

      // SoD Protection: Submitter cannot approve their own request unless superadmin
      if (b.action === 'APPROVE' && reqRow.requested_by === a.userId && a.role !== 'admin' && a.role !== 'director') {
        throw new AppError(403, 'SOD_VIOLATION', 'Segregation of Duties: You cannot approve a request submitted by yourself.');
      }

      // Record approval action
      await tx.insert(schema.approvalActions).values({
        tenantId: a.tenantId,
        requestId: id,
        stepNumber: reqRow.current_step_number,
        action: b.action,
        performedBy: a.userId,
        comments: b.comments || null,
      });

      let nextStatus = reqRow.status;
      if (b.action === 'REJECT') {
        nextStatus = 'REJECTED';
      } else {
        // Check if there is another step
        const nextStep = (await c.query(
          `SELECT step_number FROM public.approval_steps WHERE workflow_id = $1 AND step_number > $2 ORDER BY step_number ASC LIMIT 1`,
          [reqRow.workflow_id, reqRow.current_step_number]
        )).rows[0];
        if (nextStep) {
          reqRow.current_step_number = nextStep.step_number;
        } else {
          nextStatus = 'APPROVED';
        }
      }

      const [updated] = await tx
        .update(schema.approvalRequests)
        .set({
          status: nextStatus,
          currentStepNumber: reqRow.current_step_number,
          version: sql`${schema.approvalRequests.version} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(schema.approvalRequests.id, id))
        .returning();

      if (reqRow.entity_type === 'ITEM_MASTER' || reqRow.entity_type === 'items') {
        const itemApproval = nextStatus === 'APPROVED' ? 'approved' : nextStatus === 'REJECTED' ? 'rejected' : 'pending';
        const itemStatus = nextStatus === 'APPROVED' ? 'active' : 'inactive';
        await c.query(
          `UPDATE public.items
           SET approval = $1, status = $2, updated_at = now()
           WHERE tenant_id = $3 AND (id::text = $4 OR code = $4)`,
          [itemApproval, itemStatus, a.tenantId, reqRow.entity_id]
        );
      }

      await writeAudit(c, {
        tenantId: a.tenantId,
        entityType: 'approval_request',
        entityId: id,
        action: b.action,
        performedBy: a.userId,
        newValues: { status: nextStatus, currentStepNumber: reqRow.current_step_number, comments: b.comments },
        ip: a.ip,
      });

      return updated;
    });

    res.json({ data: result });
  }));

}
