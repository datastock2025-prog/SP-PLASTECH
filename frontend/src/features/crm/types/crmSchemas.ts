import { z } from 'zod';
import { Customer, Quotation } from '../../../types';

export const leadCaptureSchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  contactPerson: z.string().min(2, 'Contact person is required'),
  email: z.string().email('Valid email is required'),
  projectedVolume: z.number().positive(),
});

export type LeadCaptureFormValues = z.infer<typeof leadCaptureSchema>;
export type { Customer, Quotation };
