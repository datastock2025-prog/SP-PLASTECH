import { db } from '@/src/shared/db';
import {
  Lead,
  Opportunity,
  Account,
  Contact,
  Activity,
} from '../model/crmSchemas';
import {
  mockLeads,
  mockOpportunities,
  mockAccounts,
  mockContacts,
  mockActivities,
} from '@/src/data/mockCrmData';

export const crmApi = {
  getLeads: async (): Promise<Lead[]> => {
    try {
      const data = await db.findMany<Lead>('crm_leads');
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {}
    return mockLeads;
  },

  createLead: async (lead: Partial<Lead>): Promise<Lead> => {
    const newLead: Lead = {
      id: lead.id || `LEAD-${Date.now().toString().slice(-4)}`,
      leadName: lead.leadName || 'New Inquiry',
      companyName: lead.companyName || 'Prospective Client',
      contactPerson: lead.contactPerson || 'Contact Person',
      designation: lead.designation || 'Procurement Head',
      email: lead.email || '',
      phone: lead.phone || '',
      city: lead.city || 'Ahmedabad',
      state: lead.state || 'Gujarat',
      country: lead.country || 'India',
      source: lead.source || 'Website Inquiry',
      status: lead.status || 'New',
      priority: lead.priority || 'Medium',
      assignedSalesperson: lead.assignedSalesperson || 'Sales Representative',
      expectedValue: lead.expectedValue || 500000,
      expectedQuantity: lead.expectedQuantity || 50,
      leadScore: lead.leadScore || 50,
      industry: lead.industry || 'Automotive OEM / Tier-1',
      notes: lead.notes || '',
      createdAt: lead.createdAt || new Date().toISOString().split('T')[0],
      nextFollowUpDate: lead.nextFollowUpDate || new Date().toISOString().split('T')[0],
      requirements: lead.requirements || {
        productInterest: 'Custom Injection Molded Part',
        expectedQuantity: 50,
        uom: 'KG',
        targetPrice: 150,
        requiredDeliveryDate: new Date().toISOString().split('T')[0],
        moqAcceptance: true,
        coaRequired: true,
        msdsRequired: true,
        sampleRequired: true,
      },
    };
    try {
      await db.upsert('crm_leads', newLead, 'id');
    } catch {}
    return newLead;
  },

  updateLead: async (lead: Lead): Promise<Lead> => {
    try {
      await db.upsert('crm_leads', lead, 'id');
    } catch {}
    return lead;
  },

  getOpportunities: async (): Promise<Opportunity[]> => {
    try {
      const data = await db.findMany<Opportunity>('opportunity_pipeline');
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {}
    return mockOpportunities;
  },

  createOpportunity: async (opp: Partial<Opportunity>): Promise<Opportunity> => {
    const newOpp: Opportunity = {
      id: opp.id || `OPP-${Date.now().toString().slice(-4)}`,
      opportunityName: opp.opportunityName || 'New Opportunity',
      accountId: opp.accountId || 'ACC-01',
      accountName: opp.accountName || 'Automotive OEM India',
      contactPerson: opp.contactPerson || 'Lead Contact',
      contactEmail: opp.contactEmail || 'contact@client.com',
      contactPhone: opp.contactPhone || '+91 98765 43210',
      stage: opp.stage || 'Qualification',
      winProbability: opp.winProbability || 20,
      expectedValue: opp.expectedValue || 3625000,
      expectedQuantity: opp.expectedQuantity || 25,
      uom: opp.uom || 'MT',
      targetPrice: opp.targetPrice || 145,
      expectedCloseDate: opp.expectedCloseDate || new Date().toISOString().split('T')[0],
      salesperson: opp.salesperson || 'Sales Executive',
      priority: opp.priority || 'Medium',
      status: opp.status || 'Open',
      source: opp.source || 'Website Inquiry',
      stageAgeDays: opp.stageAgeDays || 0,
      productCategory: opp.productCategory || 'Custom Injection Molded Part',
      createdAt: opp.createdAt || new Date().toISOString().split('T')[0],
    };
    try {
      await db.upsert('opportunity_pipeline', newOpp, 'id');
    } catch {}
    return newOpp;
  },

  updateOpportunity: async (opp: Opportunity): Promise<Opportunity> => {
    try {
      await db.upsert('opportunity_pipeline', opp, 'id');
    } catch {}
    return opp;
  },

  getAccounts: async (): Promise<Account[]> => {
    return mockAccounts;
  },

  getContacts: async (): Promise<Contact[]> => {
    return mockContacts;
  },

  getActivities: async (): Promise<Activity[]> => {
    return mockActivities;
  },
};
