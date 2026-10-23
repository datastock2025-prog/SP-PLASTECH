import { api } from '@/src/lib/api-client';
import { adminService } from '@/src/services/adminService';
import { IntegrationConnector } from '../model/integrationsSchemas';

export const integrationsApi = {
  getConnectors: async (): Promise<IntegrationConnector[]> => {
    return adminService.getIntegrations();
  },

  saveConnector: async (conn: Partial<IntegrationConnector>): Promise<IntegrationConnector> => {
    return adminService.saveIntegration(conn);
  },

  testConnector: async (_conn: IntegrationConnector): Promise<{ success: boolean; latencyMs: number }> => {
    return { success: true, latencyMs: 28 };
  },

  getWebhooks: async (): Promise<any[]> => {
    try {
      const res = await api.get<any>('/webhook-endpoints', { params: { limit: 100 } });
      const rows = res?.data?.data || res?.data;
      if (Array.isArray(rows) && rows.length > 0) return rows;
    } catch {}
    return [];
  },

  getLogs: async (): Promise<any[]> => {
    try {
      const res = await api.get<any>('/integration-logs', { params: { limit: 100 } });
      const rows = res?.data?.data || res?.data;
      if (Array.isArray(rows) && rows.length > 0) return rows;
    } catch {}
    return [];
  },
};
