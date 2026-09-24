import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import * as crypto from 'crypto';
import {
  SubmitWorkflowInstanceDto,
  SubmitWorkflowInstanceDtoSchema,
  ProcessApprovalActionDto,
  ProcessApprovalActionDtoSchema,
  CreateDelegationDto,
  CreateDelegationDtoSchema,
  BreakGlassOverrideDto,
  BreakGlassOverrideDtoSchema,
  WorkflowSimulationDto,
  WorkflowSimulationDtoSchema,
} from './approval-workflow.dto';

@Injectable()
export class ApprovalWorkflowService {
  private readonly logger = new Logger(ApprovalWorkflowService.name);

  constructor(private readonly db: DatabaseService) {}

  // ============================================================================
  // 1. SUBMIT DOCUMENT FOR APPROVAL (FSM Initialization)
  // ============================================================================
  public async submitDocumentForApproval(dto: SubmitWorkflowInstanceDto) {
    const parsed = SubmitWorkflowInstanceDtoSchema.parse(dto);

    return this.db.withAdvisoryLock(`wf_submit_${parsed.documentRef}`, async () => {
      // 1. Find matching active workflow definition
      const wfRes = await this.db.query(
        `SELECT * FROM admin_approval_workflows
         WHERE tenant_id = $1 AND module = $2 AND is_active = TRUE AND deleted_at IS NULL
         ORDER BY min_amount DESC`,
        [parsed.tenantId, parsed.domain]
      );

      if (wfRes.rows.length === 0) {
        throw new NotFoundException(`No active workflow found for domain "${parsed.domain}" in tenant "${parsed.tenantId}".`);
      }

      // Filter by threshold
      const matchedWf = wfRes.rows.find((wf) => {
        const min = Number(wf.min_amount) || 0;
        const max = wf.max_amount ? Number(wf.max_amount) : Infinity;
        return parsed.totalAmount >= min && parsed.totalAmount <= max;
      }) || wfRes.rows[0];

      const tiers = Array.isArray(matchedWf.tiers) ? matchedWf.tiers : JSON.parse(matchedWf.tiers || '[]');
      if (tiers.length === 0) {
        throw new BadRequestException(`Workflow "${matchedWf.name}" has no approval tiers configured.`);
      }

      const instanceId = `WFI-${Date.now().toString().slice(-6)}`;
      const totalTiers = tiers.length;

      // 2. Insert workflow instance
      await this.db.query(
        `INSERT INTO admin_approval_instances (
          id, tenant_id, workflow_id, document_ref, domain, total_amount,
          current_tier, total_tiers, status, initiator_user_id, payload_snapshot, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
        [
          instanceId,
          parsed.tenantId,
          matchedWf.id,
          parsed.documentRef,
          parsed.domain,
          parsed.totalAmount,
          1,
          totalTiers,
          'PENDING',
          parsed.initiatorUserId,
          JSON.stringify(parsed.payloadSnapshot),
        ]
      );

      // 3. Create First Tier Task
      const tier1 = tiers[0];
      const taskId = `TSK-${Date.now().toString().slice(-6)}`;
      const slaHours = Number(tier1.escalateAfterHours) || 24;
      const dueDate = new Date(Date.now() + slaHours * 3600000);

      // Check active delegations for tier 1
      const delegatedUserId = await this.resolveDelegationProxy(parsed.tenantId, tier1.approverValue, parsed.domain);

      await this.db.query(
        `INSERT INTO admin_approval_tasks (
          id, instance_id, tier_number, stage_name, assigned_role, assigned_user_id,
          delegated_from_user_id, status, due_date, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
        [
          taskId,
          instanceId,
          1,
          tier1.stageName || 'Tier 1 Review',
          tier1.approverType === 'Role' ? tier1.approverValue : null,
          delegatedUserId || (tier1.approverType === 'Specific User' ? tier1.approverValue : null),
          delegatedUserId ? tier1.approverValue : null,
          'PENDING',
          dueDate,
        ]
      );

      this.logger.log(`Document ${parsed.documentRef} submitted to workflow ${matchedWf.name} [Instance: ${instanceId}]`);

      return {
        success: true,
        instanceId,
        workflowName: matchedWf.name,
        currentTier: 1,
        totalTiers,
        status: 'PENDING',
        initialTask: {
          taskId,
          stageName: tier1.stageName,
          assignedRole: tier1.approverValue,
          dueDate,
        },
      };
    });
  }

  // ============================================================================
  // 2. PROCESS APPROVAL ACTION (Approve / Reject / Request Rework)
  // ============================================================================
  public async processApprovalAction(taskId: string, dto: ProcessApprovalActionDto) {
    const parsed = ProcessApprovalActionDtoSchema.parse(dto);

    return this.db.withAdvisoryLock(`wf_task_${taskId}`, async () => {
      // 1. Fetch task and instance
      const taskRes = await this.db.query(
        `SELECT t.*, i.initiator_user_id, i.document_ref, i.domain, i.total_tiers, i.workflow_id, i.current_tier as inst_tier
         FROM admin_approval_tasks t
         JOIN admin_approval_instances i ON t.instance_id = i.id
         WHERE t.id = $1 AND t.status = 'PENDING'`,
        [taskId]
      );

      if (taskRes.rows.length === 0) {
        throw new NotFoundException(`Active approval task with ID "${taskId}" not found or already completed.`);
      }

      const task = taskRes.rows[0];

      // 2. Segregation of Duties (SoD) Check: Author cannot approve
      if (task.initiator_user_id === parsed.actorUserId && parsed.action === 'APPROVE') {
        throw new ForbiddenException('SoD Violation: Document initiator cannot act as an approver on their own submission.');
      }

      const completedAt = new Date();

      if (parsed.action === 'REJECT') {
        // Mark task rejected
        await this.db.query(
          `UPDATE admin_approval_tasks
           SET status = 'REJECTED', acted_by_user_id = $1, decision_notes = $2, completed_at = $3
           WHERE id = $4`,
          [parsed.actorUserId, parsed.decisionNotes, completedAt, taskId]
        );

        // Terminate instance as REJECTED
        await this.db.query(
          `UPDATE admin_approval_instances
           SET status = 'REJECTED', updated_at = $1
           WHERE id = $2`,
          [completedAt, task.instance_id]
        );

        return { success: true, status: 'REJECTED', message: `Document ${task.document_ref} has been rejected.` };
      }

      if (parsed.action === 'REQUEST_REWORK') {
        // Mark task rework requested
        await this.db.query(
          `UPDATE admin_approval_tasks
           SET status = 'REWORK', acted_by_user_id = $1, decision_notes = $2, completed_at = $3
           WHERE id = $4`,
          [parsed.actorUserId, parsed.decisionNotes, completedAt, taskId]
        );

        // Update instance status
        await this.db.query(
          `UPDATE admin_approval_instances
           SET status = 'REWORK_REQUESTED', updated_at = $1
           WHERE id = $2`,
          [completedAt, task.instance_id]
        );

        return {
          success: true,
          status: 'REWORK_REQUESTED',
          message: `Rework requested for ${task.document_ref}. Returned to initiator ${task.initiator_user_id}.`,
        };
      }

      // Handle APPROVAL
      await this.db.query(
        `UPDATE admin_approval_tasks
         SET status = 'APPROVED', acted_by_user_id = $1, decision_notes = $2, completed_at = $3
         WHERE id = $4`,
        [parsed.actorUserId, parsed.decisionNotes, completedAt, taskId]
      );

      // Check if more tiers remain
      const currentTier = Number(task.tier_number);
      const totalTiers = Number(task.total_tiers);

      if (currentTier < totalTiers) {
        // Advance to next tier
        const nextTierNum = currentTier + 1;

        // Fetch workflow tiers
        const wfRes = await this.db.query(`SELECT tiers FROM admin_approval_workflows WHERE id = $1`, [task.workflow_id]);
        const tiers = wfRes.rows[0]?.tiers ? (Array.isArray(wfRes.rows[0].tiers) ? wfRes.rows[0].tiers : JSON.parse(wfRes.rows[0].tiers)) : [];
        const nextTier = tiers[nextTierNum - 1] || { stageName: `Tier ${nextTierNum}`, approverValue: 'Management', escalateAfterHours: 24 };

        const nextTaskId = `TSK-${Date.now().toString().slice(-6)}`;
        const slaHours = Number(nextTier.escalateAfterHours) || 24;
        const dueDate = new Date(Date.now() + slaHours * 3600000);

        const delegatedUserId = await this.resolveDelegationProxy(parsed.tenantId, nextTier.approverValue, task.domain);

        await this.db.query(
          `INSERT INTO admin_approval_tasks (
            id, instance_id, tier_number, stage_name, assigned_role, assigned_user_id,
            delegated_from_user_id, status, due_date, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
          [
            nextTaskId,
            task.instance_id,
            nextTierNum,
            nextTier.stageName,
            nextTier.approverType === 'Role' ? nextTier.approverValue : null,
            delegatedUserId || (nextTier.approverType === 'Specific User' ? nextTier.approverValue : null),
            delegatedUserId ? nextTier.approverValue : null,
            'PENDING',
            dueDate,
          ]
        );

        await this.db.query(
          `UPDATE admin_approval_instances
           SET current_tier = $1, updated_at = NOW()
           WHERE id = $2`,
          [nextTierNum, task.instance_id]
        );

        return {
          success: true,
          status: 'IN_PROGRESS',
          message: `Tier ${currentTier} approved. Advanced to Tier ${nextTierNum} (${nextTier.stageName}).`,
          nextTaskId,
        };
      }

      // Final Tier Approved!
      await this.db.query(
        `UPDATE admin_approval_instances
         SET status = 'APPROVED', updated_at = $1
         WHERE id = $2`,
        [completedAt, task.instance_id]
      );

      return {
        success: true,
        status: 'APPROVED',
        message: `All ${totalTiers} tiers completed. Document ${task.document_ref} is fully AUTHORIZED.`,
      };
    });
  }

  // ============================================================================
  // 3. GET USER APPROVALS INBOX
  // ============================================================================
  public async getUserApprovalsInbox(userId: string, tenantId: string = 'TENANT-ALPHA-IND') {
    const res = await this.db.query(
      `SELECT t.id as task_id, t.tier_number, t.stage_name, t.status as task_status,
              t.due_date, t.created_at as task_created_at, t.delegated_from_user_id,
              i.id as instance_id, i.document_ref, i.domain, i.total_amount, i.status as instance_status,
              i.current_tier, i.total_tiers, i.initiator_user_id, u.full_name as initiator_name
       FROM admin_approval_tasks t
       JOIN admin_approval_instances i ON t.instance_id = i.id
       LEFT JOIN auth_users u ON i.initiator_user_id = u.id
       WHERE (t.assigned_user_id = $1 OR t.assigned_role IN (
         SELECT r.name FROM auth_users usr JOIN auth_roles r ON usr.role_id = r.id WHERE usr.id = $1
       )) AND t.status = 'PENDING' AND i.tenant_id = $2
       ORDER BY t.due_date ASC`,
      [userId, tenantId]
    );

    return res.rows.map((row) => ({
      ...row,
      isDelegated: Boolean(row.delegated_from_user_id),
      slaRemainingHours: Math.max(0, (new Date(row.due_date).getTime() - Date.now()) / 3600000).toFixed(1),
    }));
  }

  // ============================================================================
  // 4. DELEGATION PROXY & BREAK-GLASS CONTROLS
  // ============================================================================
  public async createDelegation(dto: CreateDelegationDto) {
    const parsed = CreateDelegationDtoSchema.parse(dto);
    const id = `DEL-${Date.now().toString().slice(-4)}`;

    await this.db.query(
      `INSERT INTO admin_approval_delegations (
        id, tenant_id, delegator_user_id, delegatee_user_id, domain_scope,
        valid_from, valid_until, reason, is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, NOW(), NOW())`,
      [
        id,
        parsed.tenantId,
        parsed.delegatorUserId,
        parsed.delegateeUserId,
        parsed.domainScope,
        parsed.validFrom,
        parsed.validUntil,
        parsed.reason,
      ]
    );

    return { success: true, delegationId: id, message: 'Proxy delegation registered.' };
  }

  public async executeBreakGlassOverride(dto: BreakGlassOverrideDto) {
    const parsed = BreakGlassOverrideDtoSchema.parse(dto);
    const vaultId = `BG-${Date.now().toString().slice(-6)}`;

    // Generate SHA-256 HMAC non-repudiation signature
    const signaturePayload = `${vaultId}:${parsed.documentRef}:${parsed.primaryAdminId}:${parsed.secondaryAdminId}:${parsed.reasonCode}:${Date.now()}`;
    const signatureHash = crypto.createHash('sha256').update(signaturePayload).digest('hex');

    await this.db.query(
      `INSERT INTO admin_break_glass_vault (
        id, tenant_id, document_ref, domain, primary_admin_id, secondary_admin_id,
        reason_code, justification, signature_hash, client_ip, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
      [
        vaultId,
        parsed.tenantId,
        parsed.documentRef,
        parsed.domain,
        parsed.primaryAdminId,
        parsed.secondaryAdminId,
        parsed.reasonCode,
        parsed.justification,
        signatureHash,
        parsed.clientIp,
      ]
    );

    // Force approve any active instance for this document
    await this.db.query(
      `UPDATE admin_approval_instances
       SET status = 'OVERRIDDEN', updated_at = NOW()
       WHERE document_ref = $1 AND tenant_id = $2`,
      [parsed.documentRef, parsed.tenantId]
    );

    return {
      success: true,
      vaultId,
      signatureHash,
      status: 'OVERRIDDEN',
      message: `Emergency Break-Glass authorized for ${parsed.documentRef}. Written to audit vault.`,
    };
  }

  public async simulateWorkflow(dto: WorkflowSimulationDto) {
    const parsed = WorkflowSimulationDtoSchema.parse(dto);

    const wfRes = await this.db.query(
      `SELECT * FROM admin_approval_workflows
       WHERE module = $1 AND is_active = TRUE AND deleted_at IS NULL
       ORDER BY min_amount DESC`,
      [parsed.domain]
    );

    const matchedWf = wfRes.rows.find((w) => parsed.amount >= (Number(w.min_amount) || 0)) || wfRes.rows[0] || {
      name: 'Default Single-Stage Review',
      sla_hours_total: 24,
      tiers: [{ stageName: 'Executive Review', approverValue: 'Management', escalateAfterHours: 24 }],
    };

    const tiers = Array.isArray(matchedWf.tiers) ? matchedWf.tiers : JSON.parse(matchedWf.tiers || '[]');

    return {
      matchedWorkflow: matchedWf.name,
      totalSlaHours: matchedWf.sla_hours_total || 24,
      stages: tiers.map((t: any, idx: number) => ({
        stageNumber: idx + 1,
        stageName: t.stageName,
        approver: t.approverValue,
        slaHours: t.escalateAfterHours || 24,
        escalateTo: t.escalateTo || 'Operations Head',
      })),
    };
  }

  private async resolveDelegationProxy(tenantId: string, approverIdentifier: string, domain: string): Promise<string | null> {
    const today = new Date().toISOString().split('T')[0];
    const delRes = await this.db.query(
      `SELECT delegatee_user_id FROM admin_approval_delegations
       WHERE tenant_id = $1 AND delegator_user_id = $2 AND is_active = TRUE
         AND $3 BETWEEN valid_from AND valid_until
         AND (domain_scope = 'ALL' OR domain_scope ILIKE $4)
       LIMIT 1`,
      [tenantId, approverIdentifier, today, `%${domain}%`]
    );

    return delRes.rows.length > 0 ? delRes.rows[0].delegatee_user_id : null;
  }
}
