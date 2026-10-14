import { z } from 'zod';

export const LeadStatusEnum = z.enum([
  'New',
  'Contacted',
  'Qualified',
  'Unqualified',
  'Converted',
  'Lost',
  'Duplicate',
  'On Hold',
]);

export const OpportunityStageEnum = z.enum([
  'Qualification',
  'Requirement Identified',
  'Technical Discussion',
  'Sample Submitted',
  'Quotation Sent',
  'Negotiation',
  'Customer Review',
  'Won',
  'Lost',
  'On Hold',
]);

export const LeadSchema = z.object({
  id: z.string().optional(),
  leadName: z.string().min(1, 'Lead name is required'),
  companyName: z.string().min(1, 'Company name is required'),
  contactPerson: z.string().min(1, 'Contact person is required'),
  email: z.string().optional(),
  phone: z.string().optional(),
  city: z.string().default('Ahmedabad'),
  status: LeadStatusEnum.default('New'),
  source: z.string().default('Website Inquiry'),
  estimatedValue: z.number().min(0).default(0),
  assignedTo: z.string().default('Sales Representative'),
  version: z.number().int().min(1).optional().default(1),
});

export const CreateLeadInputSchema = LeadSchema.omit({ id: true });
export const UpdateLeadInputSchema = LeadSchema.partial().extend({
  version: z.number().int().min(1),
});

export const OpportunitySchema = z.object({
  id: z.string().optional(),
  opportunityName: z.string().min(1, 'Opportunity name is required'),
  accountId: z.string().min(1, 'Account ID is required'),
  accountName: z.string().min(1, 'Account name is required'),
  stage: OpportunityStageEnum.default('Qualification'),
  probability: z.number().min(0).max(100).default(20),
  expectedRevenue: z.number().min(0).default(0),
  closingDate: z.string().min(1, 'Closing date is required'),
  assignedTo: z.string().default('Sales Executive'),
  version: z.number().int().min(1).optional().default(1),
});

export const CreateOpportunityInputSchema = OpportunitySchema.omit({ id: true });
export const UpdateOpportunityInputSchema = OpportunitySchema.partial().extend({
  version: z.number().int().min(1),
});

export const CustomerInquirySchema = z.object({
  id: z.string().optional(),
  inquiryNumber: z.string().min(1, 'Inquiry number is required'),
  customerId: z.string().min(1, 'Customer ID is required'),
  partDescription: z.string().min(1, 'Part description is required'),
  targetPrice: z.number().min(0).default(0),
  status: z.enum(['Draft', 'Costing', 'Quoted', 'Accepted', 'Rejected']).default('Draft'),
});

export const ComplaintSchema = z.object({
  id: z.string().optional(),
  complaintNumber: z.string().min(1, 'Complaint number is required'),
  customerId: z.string().min(1, 'Customer ID is required'),
  title: z.string().min(1, 'Complaint title is required'),
  severity: z.enum(['Critical', 'Major', 'Minor']).default('Minor'),
  status: z.enum(['Open', 'Under Investigation', 'Resolved', 'Closed']).default('Open'),
});

export type LeadStatus = z.infer<typeof LeadStatusEnum>;
export type OpportunityStage = z.infer<typeof OpportunityStageEnum>;
export type LeadContract = z.infer<typeof LeadSchema>;
export type CreateLeadContract = z.infer<typeof CreateLeadInputSchema>;
export type UpdateLeadContract = z.infer<typeof UpdateLeadInputSchema>;
export type OpportunityContract = z.infer<typeof OpportunitySchema>;
export type CreateOpportunityContract = z.infer<typeof CreateOpportunityInputSchema>;
export type UpdateOpportunityContract = z.infer<typeof UpdateOpportunityInputSchema>;
export type CustomerInquiryContract = z.infer<typeof CustomerInquirySchema>;
export type ComplaintContract = z.infer<typeof ComplaintSchema>;
