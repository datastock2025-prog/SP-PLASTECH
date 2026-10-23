import { api } from '@/src/lib/api-client';
import {
  Lead,
  Opportunity,
  Account,
  Contact,
  Activity,
} from '../model/crmSchemas';

export const crmApi = {
  getLeads: async (): Promise<Lead[]> => {
    try {
      const res = await api.get<any>('/crm-leads', { params: { limit: 100 } });
      const rows = res?.data?.data || res?.data;
      if (Array.isArray(rows)) return rows;
    } catch {}
    return [];
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
      const res = await api.post<any>('/crm-leads', newLead);
      const row = res?.data?.data || res?.data;
      if (row && typeof row === 'object') return row;
    } catch {}
    return newLead;
  },

  updateLead: async (lead: Lead): Promise<Lead> => {
    if (lead.id) {
      try {
        const res = await api.patch<any>(`/crm-leads/${encodeURIComponent(lead.id)}`, lead);
        const row = res?.data?.data || res?.data;
        if (row && typeof row === 'object') return row;
      } catch {}
    }
    return lead;
  },

  getOpportunities: async (): Promise<Opportunity[]> => {
    try {
      const res = await api.get<any>('/crm-opportunities', { params: { limit: 100 } });
      const rows = res?.data?.data || res?.data;
      if (Array.isArray(rows)) return rows;
    } catch {}
    return [];
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
      const res = await api.post<any>('/crm-opportunities', newOpp);
      const row = res?.data?.data || res?.data;
      if (row && typeof row === 'object') return row;
    } catch {}
    return newOpp;
  },

  updateOpportunity: async (opp: Opportunity): Promise<Opportunity> => {
    if (opp.id) {
      try {
        const res = await api.patch<any>(`/crm-opportunities/${encodeURIComponent(opp.id)}`, opp);
        const row = res?.data?.data || res?.data;
        if (row && typeof row === 'object') return row;
      } catch {}
    }
    return opp;
  },

  getAccounts: async (): Promise<Account[]> => {
    try {
      const res = await api.get<any>('/crm-accounts', { params: { limit: 100 } });
      const rows = res?.data?.data || res?.data;
      if (Array.isArray(rows)) return rows;
    } catch {}
    return [];
  },

  getContacts: async (): Promise<Contact[]> => {
    try {
      const res = await api.get<any>('/crm-contacts', { params: { limit: 100 } });
      const rows = res?.data?.data || res?.data;
      if (Array.isArray(rows)) return rows;
    } catch {}
    return [];
  },

  getActivities: async (): Promise<Activity[]> => {
    try {
      const res = await api.get<any>('/crm-activities', { params: { limit: 100 } });
      const rows = res?.data?.data || res?.data;
      if (Array.isArray(rows)) return rows;
    } catch {}
    return [];
  },
};
