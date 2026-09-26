import axios from 'axios';
import {
  ExecutiveKpiSummary,
  ExecutiveKpiItem,
  OeeRecordItem,
  OeeLossParetoItem,
  QualityMetricItem,
  InventoryAgingItem,
  ScmKpiItem,
  EsgMetricItem,
  MaintenanceMetricItem,
  DocumentTemplateItem,
  ChatSessionItem,
  ChatMessageItem,
} from '../../types/analyticsTypes';
import {
  MOCK_EXECUTIVE_KPIS_SUMMARY,
  MOCK_OEE_RECORDS,
  MOCK_LOSS_PARETO,
  MOCK_QUALITY_METRICS,
  MOCK_INVENTORY_AGING,
  MOCK_SCM_KPIS,
  MOCK_ESG_METRICS,
  MOCK_MAINTENANCE_METRICS,
  MOCK_DOCUMENT_TEMPLATES,
} from './analyticsMockData';
import { UniversalQueryEngine } from './universalQueryEngine';

export class AnalyticsApi {
  private api: any;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
      withCredentials: true,
      timeout: 10000,
    });

    this.api.interceptors.request.use((config: any) => {
      const activeTenant = localStorage.getItem('activeTenantId') || 'TENANT-ALPHA-IND';
      config.headers['X-Tenant-ID'] = activeTenant;
      config.headers['X-CSRF-Token'] = this.getCsrfToken();
      return config;
    });
  }

  private getCsrfToken(): string {
    if (typeof document === 'undefined') return '';
    return (
      document.cookie
        .split('; ')
        .find((row) => row.startsWith('XSRF-TOKEN='))
        ?.split('=')[1] || 'csrf-token-demo'
    );
  }

  // ========== 1. EXECUTIVE KPIs ==========
  async getExecutiveKpis(filters: any = {}): Promise<ExecutiveKpiSummary> {
    try {
      const { data } = await this.api.get('/analytics/executive-kpis', { params: filters });
      return data;
    } catch {
      return MOCK_EXECUTIVE_KPIS_SUMMARY;
    }
  }

  async getOeeTelemetry(filters: any = {}): Promise<{ records: OeeRecordItem[]; lossPareto: OeeLossParetoItem[] }> {
    try {
      const { data } = await this.api.get('/analytics/oee/telemetry', { params: filters });
      return data;
    } catch {
      return {
        records: MOCK_OEE_RECORDS,
        lossPareto: MOCK_LOSS_PARETO,
      };
    }
  }

  async getQualityMetrics(filters: any = {}): Promise<QualityMetricItem[]> {
    try {
      const { data } = await this.api.get('/analytics/quality/metrics', { params: filters });
      return data;
    } catch {
      return MOCK_QUALITY_METRICS;
    }
  }

  async getInventoryAging(filters: any = {}): Promise<InventoryAgingItem[]> {
    try {
      const { data } = await this.api.get('/analytics/scm/inventory-aging', { params: filters });
      return data;
    } catch {
      return MOCK_INVENTORY_AGING;
    }
  }

  async getScmKpis(filters: any = {}): Promise<ScmKpiItem[]> {
    try {
      const { data } = await this.api.get('/analytics/scm/kpis', { params: filters });
      return data;
    } catch {
      return MOCK_SCM_KPIS;
    }
  }

  async getEsgMetrics(filters: any = {}): Promise<EsgMetricItem[]> {
    try {
      const { data } = await this.api.get('/analytics/sustainability/metrics', { params: filters });
      return data;
    } catch {
      return MOCK_ESG_METRICS;
    }
  }

  async getMaintenanceMetrics(filters: any = {}): Promise<MaintenanceMetricItem[]> {
    try {
      const { data } = await this.api.get('/analytics/maintenance/metrics', { params: filters });
      return data;
    } catch {
      return MOCK_MAINTENANCE_METRICS;
    }
  }

  // ========== 2. DOCUMENT BUILDER & TEMPLATES ==========
  async getDocumentTemplates(category?: string): Promise<DocumentTemplateItem[]> {
    try {
      const { data } = await this.api.get('/analytics/documents/templates', { params: { category } });
      return data;
    } catch {
      if (!category || category === 'ALL') return MOCK_DOCUMENT_TEMPLATES;
      return MOCK_DOCUMENT_TEMPLATES.filter((t) => t.category === category);
    }
  }

  async createDocumentTemplate(templateData: Partial<DocumentTemplateItem>): Promise<DocumentTemplateItem> {
    try {
      const { data } = await this.api.post('/analytics/documents/templates', templateData);
      return data;
    } catch {
      const newTmpl: DocumentTemplateItem = {
        id: `TMPL-${Date.now()}`,
        templateName: templateData.templateName || 'Untitled Executive Template',
        description: templateData.description || 'Custom structured analytics brief',
        category: templateData.category || 'Custom',
        structure: templateData.structure || { sections: [] },
        isActive: true,
      };
      return newTmpl;
    }
  }

  async exportDocument(templateId: string, exportConfig: any): Promise<any> {
    try {
      const { data } = await this.api.post('/analytics/documents/templates/' + templateId + '/export', exportConfig);
      return data;
    } catch {
      return {
        success: true,
        format: exportConfig.format || 'PDF',
        fileName: `SP_PLASTECH_Analytics_Export_${new Date().toISOString().slice(0, 10)}.${(exportConfig.format || 'PDF').toLowerCase()}`,
        downloadUrl: '#',
      };
    }
  }

  // ========== 3. LIVE MULTI-MODULE CONNECTED AI CHAT ==========
  async createChatSession(sessionData: any = {}): Promise<ChatSessionItem> {
    try {
      const { data } = await this.api.post('/ai-gateway/sessions', sessionData);
      return data;
    } catch {
      return {
        id: `SESS-${Date.now()}`,
        userId: 'USR-ADMIN-01',
        sessionType: sessionData.sessionType || 'ANALYTICS_QUERY',
        title: sessionData.title || 'Executive Analytics Session',
        isActive: true,
        createdAt: new Date().toISOString(),
      };
    }
  }

  async sendChatMessage(sessionId: string, message: string): Promise<{ reply: string; metadata?: any; messages: ChatMessageItem[] }> {
    // 1. Try Live AI Gateway backend first
    try {
      const { data } = await this.api.post('/ai-gateway/query', { prompt: message });
      if (data && data.reply) {
        return {
          reply: data.reply,
          metadata: data.metadata,
          messages: [
            { id: `M1-${Date.now()}`, sessionId, role: 'USER', content: message, createdAt: new Date().toISOString() },
            { id: `M2-${Date.now()}`, sessionId, role: 'ASSISTANT', content: data.reply, createdAt: new Date().toISOString() },
          ],
        };
      }
    } catch {
      // Fallback to Universal Live Query Engine
    }

    // 2. High-Speed Multi-Module Query Engine
    const res = await UniversalQueryEngine.processQuery(message);

    return {
      reply: res.reply,
      metadata: res.metadata,
      messages: [
        { id: `M1-${Date.now()}`, sessionId, role: 'USER', content: message, createdAt: new Date().toISOString() },
        { id: `M2-${Date.now()}`, sessionId, role: 'ASSISTANT', content: res.reply, createdAt: new Date().toISOString() },
      ],
    };
  }

  async exportChatToDocument(sessionId: string, exportConfig: any): Promise<any> {
    try {
      const { data } = await this.api.post(`/analytics/chat/sessions/${sessionId}/export`, exportConfig);
      return data;
    } catch {
      return {
        success: true,
        documentTitle: exportConfig.documentTitle || 'SP-PLASTECH Executive Analytics Brief',
        format: exportConfig.format || 'PDF',
        fileName: `SP_PLASTECH_Brief_${new Date().toISOString().slice(0, 10)}.${(exportConfig.format || 'PDF').toLowerCase()}`,
      };
    }
  }
}

export const analyticsApi = new AnalyticsApi();
