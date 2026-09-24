import { z } from 'zod';

export const SubmitWorkflowInstanceDtoSchema = z.object({
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  documentRef: z.string().min(1, 'Document reference is required'),
  domain: z.enum(['Procurement', 'Finance', 'Engineering', 'Quality', 'Manufacturing']),
  documentType: z.string().min(1, 'Document type is required'),
  totalAmount: z.number().optional().default(0),
  payloadSnapshot: z.record(z.any()).default({}),
  initiatorUserId: z.string().min(1, 'Initiator ID is required'),
});
export type SubmitWorkflowInstanceDto = z.infer<typeof SubmitWorkflowInstanceDtoSchema>;

export const ProcessApprovalActionDtoSchema = z.object({
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  action: z.enum(['APPROVE', 'REJECT', 'REQUEST_REWORK']),
  actorUserId: z.string().min(1, 'Actor user ID is required'),
  decisionNotes: z.string().optional().default(''),
});
export type ProcessApprovalActionDto = z.infer<typeof ProcessApprovalActionDtoSchema>;

export const CreateDelegationDtoSchema = z.object({
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  delegatorUserId: z.string().min(1, 'Delegator ID is required'),
  delegateeUserId: z.string().min(1, 'Delegatee ID is required'),
  domainScope: z.string().default('ALL'),
  validFrom: z.string().min(1, 'Valid from date is required'),
  validUntil: z.string().min(1, 'Valid until date is required'),
  reason: z.string().optional().default('Official Out-of-Office proxy coverage'),
});
export type CreateDelegationDto = z.infer<typeof CreateDelegationDtoSchema>;

export const BreakGlassOverrideDtoSchema = z.object({
  tenantId: z.string().default('TENANT-ALPHA-IND'),
  documentRef: z.string().min(1, 'Document reference is required'),
  domain: z.string().min(1, 'Domain is required'),
  primaryAdminId: z.string().min(1, 'Primary admin ID is required'),
  secondaryAdminId: z.string().min(1, 'Secondary admin co-signer is required'),
  reasonCode: z.enum(['EMERGENCY_LINE_STOP', 'VIP_CUSTOMER_EXPEDITE', 'AUDIT_EXCLUSION', 'SYSTEM_FAILOVER']),
  justification: z.string().min(10, 'Detailed forensic justification is required'),
  clientIp: z.string().default('127.0.0.1'),
});
export type BreakGlassOverrideDto = z.infer<typeof BreakGlassOverrideDtoSchema>;

export const WorkflowSimulationDtoSchema = z.object({
  domain: z.string(),
  documentType: z.string(),
  amount: z.number().default(0),
  category: z.string().optional().default(''),
  initiatorRole: z.string().default('SCM Buyer'),
  payload: z.record(z.any()).default({}),
});
export type WorkflowSimulationDto = z.infer<typeof WorkflowSimulationDtoSchema>;
