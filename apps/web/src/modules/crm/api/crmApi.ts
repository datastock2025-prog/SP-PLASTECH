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
      industrySegment: lead.industrySegment || 'Automotive OEM',
      estimatedAnnualVolumeMt: lead.estimatedAnnualVolumeMt || 50,
      estimatedDealValueInr: lead.estimatedDealValueInr || 500000,
      assignedTo: lead.assignedTo || 'Sales Representative',
      createdDate: lead.createdDate || new Date().toISOString().split('T')[0],
      requirements: lead.requirements || [],
      customNotes: lead.customNotes || '',
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
      primaryContactId: opp.primaryContactId || 'CON-01',
      primaryContactName: opp.primaryContactName || 'Lead Contact',
      stage: opp.stage || 'Qualification',
      probabilityPct: opp.probabilityPct || 20,
      expectedCloseDate: opp.expectedCloseDate || new Date().toISOString().split('T')[0],
      forecastCategory: opp.forecastCategory || 'Pipeline',
      productInterest: opp.productInterest || 'Custom Injection Molded Part',
      targetVolumeMt: opp.targetVolumeMt || 25,
      targetPricePerKg: opp.targetPricePerKg || 145,
      totalExpectedValueInr: opp.totalExpectedValueInr || 3625000,
      assignedTo: opp.assignedTo || 'Sales Executive',
      createdDate: opp.createdDate || new Date().toISOString().split('T')[0],
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
