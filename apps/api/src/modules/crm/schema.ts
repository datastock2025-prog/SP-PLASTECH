import { z } from 'zod';

export const CreateLeadInputSchema = z.object({
  leadName: z.string().trim().min(1),
  companyName: z.string().trim().min(1),
  contactPerson: z.string().trim().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  city: z.string().trim().default('Ahmedabad'),
  status: z.enum(['New', 'Contacted', 'Qualified', 'Unqualified', 'Converted', 'Lost', 'Duplicate', 'On Hold']).default('New'),
  source: z.string().trim().default('Website Inquiry'),
  estimatedValue: z.number().min(0).default(0),
  assignedTo: z.string().trim().default('Sales Representative'),
});

export const UpdateLeadInputSchema = CreateLeadInputSchema.partial().extend({
  version: z.number().int().min(1),
});

export const CreateOpportunityInputSchema = z.object({
  opportunityName: z.string().trim().min(1),
  accountId: z.string().trim().min(1),
  accountName: z.string().trim().min(1),
  stage: z.enum(['Qualification', 'Requirement Identified', 'Technical Discussion', 'Sample Submitted', 'Quotation Sent', 'Negotiation', 'Customer Review', 'Won', 'Lost', 'On Hold']).default('Qualification'),
  probability: z.number().min(0).max(100).default(20),
  expectedRevenue: z.number().min(0).default(0),
  closingDate: z.string().trim().min(1),
});

export const UpdateOpportunityInputSchema = CreateOpportunityInputSchema.partial().extend({
  version: z.number().int().min(1),
});
