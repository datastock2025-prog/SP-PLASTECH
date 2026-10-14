import { z } from 'zod';

export const NcrSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(5, 'NCR title must be at least 5 characters'),
  itemCode: z.string().min(1, 'Defective item code is required'),
  severity: z.enum(['Minor', 'Major', 'Critical']).default('Major'),
  defectType: z.string().min(2, 'Defect classification is required'),
  lotNumber: z.string().min(2, 'Affected lot number is required'),
  reportedBy: z.string().min(2, 'Reporter name is required'),
  description: z.string().min(10, 'Detailed defect description is required'),
  quantityAffected: z.number().positive('Quantity affected must be positive'),
  status: z.enum(['open', 'investigating', 'capa_pending', 'closed', 'rejected']).default('open'),
  version: z.number().int().min(1).optional().default(1),
});

export const CreateNcrInputSchema = NcrSchema.omit({ id: true });
export const UpdateNcrInputSchema = NcrSchema.partial().extend({
  version: z.number().int().min(1),
});

export const CapaSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(5, 'CAPA title must be at least 5 characters'),
  ncrId: z.string().optional(),
  assignedTo: z.string().min(2, 'Assignee name is required'),
  rootCause: z.string().optional().default(''),
  actionPlan: z.string().optional().default(''),
  status: z.enum(['draft', 'in_progress', 'implemented', 'verified', 'closed']).default('in_progress'),
  dueDate: z.string().min(1, 'Target completion date is required'),
  version: z.number().int().min(1).optional().default(1),
});

export const CertificateOfAnalysisSchema = z.object({
  id: z.string().optional(),
  coaNumber: z.string().min(1, 'COA number is required'),
  lotNumber: z.string().min(1, 'Lot number is required'),
  itemCode: z.string().min(1, 'Item code is required'),
  customerName: z.string().optional().default(''),
  status: z.enum(['draft', 'released', 'void']).default('released'),
  issuedDate: z.string().min(1, 'Issued date is required'),
});

export const InspectionPlanSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Plan name is required'),
  itemCode: z.string().min(1, 'Item code is required'),
  type: z.enum(['incoming', 'in_process', 'final']).default('in_process'),
  active: z.boolean().default(true),
});

export type NcrContract = z.infer<typeof NcrSchema>;
export type CreateNcrContract = z.infer<typeof CreateNcrInputSchema>;
export type UpdateNcrContract = z.infer<typeof UpdateNcrInputSchema>;
export type CapaContract = z.infer<typeof CapaSchema>;
export type CertificateOfAnalysisContract = z.infer<typeof CertificateOfAnalysisSchema>;
export type InspectionPlanContract = z.infer<typeof InspectionPlanSchema>;
