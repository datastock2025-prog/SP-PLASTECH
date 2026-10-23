import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/src/shared/queryKeys';
import { broadcastLocalMutation } from '@/src/services/realtime/realtimeService';
import {
  Lead,
  Opportunity,
  Account,
  Contact,
  Activity,
} from '../model/crmSchemas';
import { crmApi } from './crmApi';

export function useLeads() {
  return useQuery<Lead[]>({
    queryKey: queryKeys.crm.leads(),
    queryFn: async () => {
      return await crmApi.getLeads();
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useSaveLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (lead: Lead) => {
      if (lead.id) {
        return await crmApi.updateLead(lead);
      }
      return await crmApi.createLead(lead);
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
      return await crmApi.getOpportunities();
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useSaveOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (opp: Opportunity) => {
      if (opp.id) {
        return await crmApi.updateOpportunity(opp);
      }
      return await crmApi.createOpportunity(opp);
    },
    onSuccess: (savedOpp) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.crm.opportunities() });
      broadcastLocalMutation('OPPORTUNITIES', 'UPDATE', savedOpp);
    },
  });
}

export function useAccounts() {
  return useQuery<Account[]>({
    queryKey: queryKeys.crm.accounts(),
    queryFn: async () => {
      return await crmApi.getAccounts();
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useContacts() {
  return useQuery<Contact[]>({
    queryKey: queryKeys.crm.contacts(),
    queryFn: async () => {
      return await crmApi.getContacts();
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useActivities() {
  return useQuery<Activity[]>({
    queryKey: queryKeys.crm.activities(),
    queryFn: async () => {
      return await crmApi.getActivities();
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useCrm() {
  const { data: leads = [], isLoading: isLoadingLeads } = useLeads();
  const { data: opportunities = [], isLoading: isLoadingOpps } = useOpportunities();
  const { data: accounts = [], isLoading: isLoadingAccs } = useAccounts();
  const { data: contacts = [], isLoading: isLoadingContacts } = useContacts();
  const { data: activities = [], isLoading: isLoadingActs } = useActivities();

  return {
    leads,
    opportunities,
    accounts,
    contacts,
    activities,
    isLoading: isLoadingLeads || isLoadingOpps || isLoadingAccs || isLoadingContacts || isLoadingActs,
  };
}
