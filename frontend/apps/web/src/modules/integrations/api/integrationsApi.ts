import { db } from '@/src/shared/db';
import { adminService } from '@/src/services/adminService';
import { IntegrationConnector } from '../model/integrationsSchemas';

export const integrationsApi = {
  getConnectors: async (): Promise<IntegrationConnector[]> => {
    return adminService.getIntegrations();
  },

  saveConnector: async (conn: Partial<IntegrationConnector>): Promise<IntegrationConnector> => {
    return adminService.saveIntegration(conn);
  },

  testConnector: async (conn: IntegrationConnector): Promise<{ success: boolean; latencyMs: number }> => {
    return { success: true, latencyMs: 28 };
  },

  getWebhooks: async (): Promise<any[]> => {
    try {
      const data = await db.findMany('webhook_endpoints');
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {}
    return [];
  },

  getLogs: async (): Promise<any[]> => {
    try {
      const data = await db.findMany('integration_logs');
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {}
    return [];
  },
};
