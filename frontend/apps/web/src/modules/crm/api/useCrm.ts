import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/src/shared/queryKeys';
import { broadcastLocalMutation } from '@/src/services/realtime/realtimeService';
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
import { crmApi } from './crmApi';

export function useLeads() {
  return useQuery<Lead[]>({
    queryKey: queryKeys.crm.leads(),
    queryFn: async () => {
      try {
        const res = await db.findMany<Lead>('crm_leads', {
          orderBy: { column: 'created_date', ascending: false },
          limit: 100,
        });
        if (Array.isArray(res) && res.length > 0) return res;
      } catch (e) {
        console.debug('[useLeads] fallback note:', e);
      }
      return mockLeads;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useSaveLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (lead: Lead) => {
      try {
        await db.upsert('crm_leads', lead, 'id');
      } catch (e) {
        console.debug('[useSaveLead] note:', e);
      }
      return lead;
    },
    onSuccess: (savedLead) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.crm.leads() });
      broadcastLocalMutation('CRM_LEADS', 'UPDATE', savedLead);
    },
  });
}

export function useOpportunities() {
  return useQuery<Opportunity[]>({
    queryKey: queryKeys.crm.opportunities(),
    queryFn: async () => {
      try {
        const res = await db.findMany<Opportunity>('opportunity_pipeline', {
          orderBy: { column: 'expected_close_date', ascending: true },
          limit: 100,
        });
        if (Array.isArray(res) && res.length > 0) return res;
      } catch (e) {
        console.debug('[useOpportunities] fallback note:', e);
      }
      return mockOpportunities;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useSaveOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (opp: Opportunity) => {
      try {
        await db.upsert('opportunity_pipeline', opp, 'id');
      } catch (e) {
        console.debug('[useSaveOpportunity] note:', e);
      }
      return opp;
    },
    onSuccess: (savedOpp) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.crm.opportunities() });
      broadcastLocalMutation('OPPORTUNITIES', 'UPDATE', savedOpp);
    },
  });
}

export function useCrm() {
  const { data: leads = [], isLoading: isLoadingLeads } = useLeads();
  const { data: opportunities = [], isLoading: isLoadingOpps } = useOpportunities();

  return {
    leads,
    opportunities,
    accounts: mockAccounts,
    contacts: mockContacts,
    activities: mockActivities,
    isLoading: isLoadingLeads || isLoadingOpps,
  };
}
