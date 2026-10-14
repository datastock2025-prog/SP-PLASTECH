import { z } from 'zod';
import { NonConformanceReport, CapaReport, CertificateOfAnalysis } from '../../../types';

export const ncrCreateSchema = z.object({
  title: z.string().min(5, 'NCR title must be at least 5 characters'),
  itemCode: z.string().min(1, 'Defective item code is required'),
  severity: z.enum(['Minor', 'Major', 'Critical']),
  defectType: z.string().min(2, 'Defect classification is required'),
  lotNumber: z.string().min(2, 'Affected lot number is required'),
  reportedBy: z.string().min(2, 'Reporter name is required'),
  description: z.string().min(10, 'Detailed defect description is required'),
  quantityAffected: z.number().positive('Quantity affected must be positive'),
});

export type NcrCreateFormValues = z.infer<typeof ncrCreateSchema>;
export type { NonConformanceReport, CapaReport, CertificateOfAnalysis };
