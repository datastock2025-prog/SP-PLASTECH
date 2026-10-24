import { z } from 'zod';
import { eq, and, isNull, desc, asc, gt, sql } from 'drizzle-orm';
import { withDrizzleTx, schema } from '../../db.js';
import { AppError, can, wrap, type Actor } from '../../middleware.js';
import { writeAudit } from '../../core/audit.js';
import { ctx } from '../../core/query.js';
import { idCondition, snakeSelect, type ScopedTable } from '../../core/query.js';

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
    const requests = await withDrizzleTx(ctx(a), async (tx) => {
      const conditions = [
        eq(schema.approvalRequests.tenantId, a.tenantId),
        isNull(schema.approvalRequests.deletedAt),
      ];
      if (status) conditions.push(eq(schema.approvalRequests.status, status));
      if (entityType) conditions.push(eq(schema.approvalRequests.entityType, entityType));

      const rows = await tx
        .select({
          ...snakeSelect(schema.approvalRequests),
          workflow_name: schema.approvalWorkflows.name,
          workflow_code: schema.approvalWorkflows.code,
        })
        .from(schema.approvalRequests)
        .innerJoin(
          schema.approvalWorkflows,
          eq(schema.approvalWorkflows.id, schema.approvalRequests.workflowId)
        )
        .where(and(...conditions))
        .orderBy(desc(schema.approvalRequests.createdAt))
        .limit(100);
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
      const [reqRow] = await tx
        .select(snakeSelect(schema.approvalRequests))
        .from(schema.approvalRequests)
        .where(
          and(
            eq(schema.approvalRequests.id, id),
            eq(schema.approvalRequests.tenantId, a.tenantId)
          )
        )
        .for('update');
      if (!reqRow) throw new AppError(404, 'NOT_FOUND', 'Approval request not found');
      const currentStatus = String(reqRow.status);
      if (currentStatus !== 'PENDING') throw new AppError(400, 'ALREADY_DECIDED', `Request has already been ${currentStatus.toLowerCase()}`);

      // SoD Protection: Submitter cannot approve their own request unless superadmin
      if (b.action === 'APPROVE' && reqRow.requested_by === a.userId && a.role !== 'admin' && a.role !== 'director') {
        throw new AppError(403, 'SOD_VIOLATION', 'Segregation of Duties: You cannot approve a request submitted by yourself.');
      }

      let currentStepNumber = Number(reqRow.current_step_number);

      // Record approval action
      await tx.insert(schema.approvalActions).values({
        tenantId: a.tenantId,
        requestId: id,
        stepNumber: currentStepNumber,
        action: b.action,
        performedBy: a.userId,
        comments: b.comments || null,
      });

      let nextStatus: string = currentStatus;
      if (b.action === 'REJECT') {
        nextStatus = 'REJECTED';
      } else {
        // Check if there is another step
        const [nextStep] = await tx
          .select({ stepNumber: schema.approvalSteps.stepNumber })
          .from(schema.approvalSteps)
          .where(
            and(
              eq(schema.approvalSteps.workflowId, reqRow.workflow_id),
              gt(schema.approvalSteps.stepNumber, currentStepNumber)
            )
          )
          .orderBy(asc(schema.approvalSteps.stepNumber))
          .limit(1);
        if (nextStep) {
          currentStepNumber = nextStep.stepNumber;
        } else {
          nextStatus = 'APPROVED';
        }
      }

      const [updated] = await tx
        .update(schema.approvalRequests)
        .set({
          status: nextStatus,
          currentStepNumber: currentStepNumber,
          version: sql`${schema.approvalRequests.version} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(schema.approvalRequests.id, id))
        .returning();

      if (reqRow.entity_type === 'ITEM_MASTER' || reqRow.entity_type === 'items') {
        const itemApproval = nextStatus === 'APPROVED' ? 'approved' : nextStatus === 'REJECTED' ? 'rejected' : 'pending';
        const itemStatus = nextStatus === 'APPROVED' ? 'active' : 'inactive';
        await tx
          .update(schema.items)
          .set({
            approval: itemApproval,
            status: itemStatus,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(schema.items.tenantId, a.tenantId),
              idCondition(schema.items as ScopedTable, reqRow.entity_id, 'code')
            )
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
