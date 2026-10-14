import { describe, it, expect } from 'vitest';
import {
  LeadSchema,
  CreateLeadInputSchema,
  UpdateLeadInputSchema,
  OpportunitySchema,
  CreateOpportunityInputSchema,
  UpdateOpportunityInputSchema,
  CustomerInquirySchema,
  ComplaintSchema,
} from '@/packages/contracts/crm';

describe('CRM Module Contracts & Validation', () => {
  it('validates a valid LeadSchema payload', () => {
    const rawLead = {
      id: 'lead-uuid-001',
      leadName: 'Precision Auto Polymers Inquiry',
      companyName: 'Precision Auto Components Ltd',
      contactPerson: 'Sanjay Deshmukh',
      email: 'sanjay.d@precisionauto.co.in',
      phone: '+91 98234 11223',
      city: 'Pune',
      status: 'Qualified' as const,
      source: 'PlastIndia Exhibition',
      estimatedValue: 2400000,
      assignedTo: 'Vikram Joshi',
      version: 1,
    };

    const parsed = LeadSchema.safeParse(rawLead);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.leadName).toBe('Precision Auto Polymers Inquiry');
      expect(parsed.data.companyName).toBe('Precision Auto Components Ltd');
      expect(parsed.data.status).toBe('Qualified');
      expect(parsed.data.estimatedValue).toBe(2400000);
    }
  });

  it('rejects a lead without leadName or companyName', () => {
    const invalid = {
      leadName: '',
      companyName: '',
      contactPerson: 'Sanjay Deshmukh',
    };

    const parsed = LeadSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('validates an UpdateLeadInputSchema with OCC version check', () => {
    const update = {
      status: 'Converted' as const,
      estimatedValue: 3500000,
      version: 2,
    };

    const parsed = UpdateLeadInputSchema.safeParse(update);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.version).toBe(2);
      expect(parsed.data.status).toBe('Converted');
      expect(parsed.data.estimatedValue).toBe(3500000);
    }
  });

  it('validates an OpportunitySchema payload', () => {
    const rawOpp = {
      id: 'opp-uuid-001',
      opportunityName: 'FY27 Maruti Suzuki Connector Housing Contract',
      accountId: 'acc-uuid-101',
      accountName: 'Maruti Suzuki India Limited',
      stage: 'Quotation Sent' as const,
      probability: 65,
      expectedRevenue: 12500000,
      closingDate: '2026-12-15',
      assignedTo: 'Rajesh Mehra',
      version: 1,
    };

    const parsed = OpportunitySchema.safeParse(rawOpp);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.opportunityName).toBe('FY27 Maruti Suzuki Connector Housing Contract');
      expect(parsed.data.stage).toBe('Quotation Sent');
      expect(parsed.data.probability).toBe(65);
      expect(parsed.data.expectedRevenue).toBe(12500000);
    }
  });

  it('validates a CustomerInquirySchema payload', () => {
    const rawInquiry = {
      id: 'inq-uuid-001',
      inquiryNumber: 'INQ-2026-10-0089',
      customerId: 'cust-uuid-001',
      partDescription: 'Automotive Fuse Cover Glass Filled Nylon PA66',
      targetPrice: 28.5,
      status: 'Costing' as const,
    };

    const parsed = CustomerInquirySchema.safeParse(rawInquiry);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.inquiryNumber).toBe('INQ-2026-10-0089');
      expect(parsed.data.targetPrice).toBe(28.5);
      expect(parsed.data.status).toBe('Costing');
    }
  });

  it('validates a ComplaintSchema payload', () => {
    const rawComplaint = {
      id: 'comp-uuid-001',
      complaintNumber: 'CMP-2026-0042',
      customerId: 'cust-uuid-002',
      title: 'Flash defect noticed on batch LOT-2026-0922',
      severity: 'Major' as const,
      status: 'Under Investigation' as const,
    };

    const parsed = ComplaintSchema.safeParse(rawComplaint);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.complaintNumber).toBe('CMP-2026-0042');
      expect(parsed.data.severity).toBe('Major');
      expect(parsed.data.status).toBe('Under Investigation');
    }
  });
});
