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

  async getKpisByCategory(category: string, filters: any = {}): Promise<ExecutiveKpiItem[]> {
    try {
      const { data } = await this.api.get(`/analytics/executive-kpis/${category}`, { params: filters });
      return data;
    } catch {
      return MOCK_EXECUTIVE_KPIS_SUMMARY.kpis.filter((k) => k.kpiCategory === category);
    }
  }

  // ========== 2. OEE ANALYTICS & LOSS PARETO ==========
  async getOeeMetrics(filters: any = {}): Promise<{
    overallOee: number;
    availability: number;
    performance: number;
    quality: number;
    totalProduction: number;
    goodParts: number;
    scrapCount: number;
    records: OeeRecordItem[];
  }> {
    try {
      const { data } = await this.api.get('/analytics/oee/metrics', { params: filters });
      return data;
    } catch {
      return {
        overallOee: 84.6,
        availability: 91.2,
        performance: 94.2,
        quality: 98.4,
        totalProduction: 4210,
        goodParts: 4139,
        scrapCount: 71,
        records: MOCK_OEE_RECORDS,
      };
    }
  }

  async getLossPareto(filters: any = {}): Promise<{ totalLossHours: number; paretoData: OeeLossParetoItem[] }> {
    try {
      const { data } = await this.api.get('/analytics/oee/loss-pareto', { params: filters });
      return data;
    } catch {
      return { totalLossHours: 111.3, paretoData: MOCK_LOSS_PARETO };
    }
  }

  // ========== 3. QUALITY DEFECT PPM & SIX SIGMA ==========
  async getQualityMetrics(filters: any = {}): Promise<{
    totalInspected: number;
    defectsFound: number;
    ppm: number;
    firstPassYield: number;
    sigmaLevel: number;
    dpmo: number;
    costOfPoorQualityTotal: number;
    metrics: QualityMetricItem[];
  }> {
    try {
      const { data } = await this.api.get('/analytics/quality/metrics', { params: filters });
      return data;
    } catch {
      return {
        totalInspected: 3540,
        defectsFound: 24,
        ppm: 6779.6,
        firstPassYield: 99.32,
        sigmaLevel: 4.82,
        dpmo: 6779.6,
        costOfPoorQualityTotal: 670,
        metrics: MOCK_QUALITY_METRICS,
      };
    }
  }

  // ========== 4. INVENTORY AGING & VELOCITY ==========
  async getInventoryAging(filters: any = {}): Promise<{
    totalInventoryValue: number;
    slowMovingValue: number;
    slowMovingPercentage: number;
    bucketSummary: Record<string, number>;
    itemsCount: number;
    items: InventoryAgingItem[];
  }> {
    try {
      const { data } = await this.api.get('/analytics/inventory/aging', { params: filters });
      return data;
    } catch {
      return {
        totalInventoryValue: 6330850,
        slowMovingValue: 1145000,
        slowMovingPercentage: 18.1,
        bucketSummary: {
          days_0_30: 2903250,
          days_31_60: 2281600,
          days_61_90: 0,
          days_91_180: 992000,
          days_180_plus: 153000,
        },
        itemsCount: MOCK_INVENTORY_AGING.length,
        items: MOCK_INVENTORY_AGING,
      };
    }
  }

  // ========== 5. SUPPLY CHAIN PERFORMANCE ==========
  async getScmPerformance(filters: any = {}): Promise<{
    supplierOTIF: number;
    orderFulfillmentRate: number;
    averageLeadTimeDays: number;
    purchasePriceVariance: number;
    topVendors: Array<{ name: string; otif: number; qualityRating: number; spendYTD: number }>;
    kpis: ScmKpiItem[];
  }> {
    try {
      const { data } = await this.api.get('/analytics/scm/performance', { params: filters });
      return data;
    } catch {
      return {
        supplierOTIF: 96.4,
        orderFulfillmentRate: 98.1,
        averageLeadTimeDays: 14.2,
        purchasePriceVariance: -1.4,
        topVendors: [
          { name: 'Reliance Polymers Ltd', otif: 97.4, qualityRating: 99.2, spendYTD: 8400000 },
          { name: 'BASF Masterbatch India', otif: 95.8, qualityRating: 98.6, spendYTD: 3200000 },
          { name: 'Supreme Additives & Colors', otif: 91.2, qualityRating: 96.4, spendYTD: 1450000 },
        ],
        kpis: MOCK_SCM_KPIS,
      };
    }
  }

  // ========== 6. ESG & CARBON FOOTPRINT ==========
  async getEsgMetrics(filters: any = {}): Promise<{
    totalCarbonFootprintTonnes: number;
    energyIntensityKwhPerKg: number;
    recycledPcrResinPercent: number;
    waterRecycledPercent: number;
    scope1Emissions: number;
    scope2Emissions: number;
    scope3Emissions: number;
    metrics: EsgMetricItem[];
  }> {
    try {
      const { data } = await this.api.get('/analytics/esg/metrics', { params: filters });
      return data;
    } catch {
      return {
        totalCarbonFootprintTonnes: 1420.5,
        energyIntensityKwhPerKg: 1.14,
        recycledPcrResinPercent: 18.5,
        waterRecycledPercent: 78.0,
        scope1Emissions: 180.2,
        scope2Emissions: 920.3,
        scope3Emissions: 320.0,
        metrics: MOCK_ESG_METRICS,
      };
    }
  }

  // ========== 7. MAINTENANCE MTBF & MTTR ==========
  async getMaintenanceMetrics(filters: any = {}): Promise<{
    meanTimeBetweenFailuresHours: number;
    meanTimeToRepairHours: number;
    preventiveMaintenanceAdherence: number;
    totalBreakdownCostYTD: number;
    pressFleetAvailability: number;
    metrics: MaintenanceMetricItem[];
  }> {
    try {
      const { data } = await this.api.get('/analytics/maintenance/metrics', { params: filters });
      return data;
    } catch {
      return {
        meanTimeBetweenFailuresHours: 248.5,
        meanTimeToRepairHours: 2.14,
        preventiveMaintenanceAdherence: 96.2,
        totalBreakdownCostYTD: 345000,
        pressFleetAvailability: 94.6,
        metrics: MOCK_MAINTENANCE_METRICS,
      };
    }
  }

  // ========== DOCUMENT MANAGEMENT & CUSTOM TEMPLATES ==========
  async getDocumentTemplates(filters: any = {}): Promise<DocumentTemplateItem[]> {
    try {
      const { data } = await this.api.get('/analytics/documents/templates', { params: filters });
      return data;
    } catch {
      return MOCK_DOCUMENT_TEMPLATES;
    }
  }

  async createDocumentTemplate(templateData: any): Promise<DocumentTemplateItem> {
    try {
      const { data } = await this.api.post('/analytics/documents/templates', templateData);
      return data;
    } catch {
      const newTmpl: DocumentTemplateItem = {
        id: `TMPL-${Date.now()}`,
        templateCode: templateData.templateCode || `RPT-CUST-${Date.now().toString().slice(-4)}`,
        templateName: templateData.templateName || 'Custom Report',
        templateType: templateData.templateType || 'CUSTOM',
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

  // ========== RAG CHAT SYSTEM ==========
  async createChatSession(sessionData: any = {}): Promise<ChatSessionItem> {
    try {
      const { data } = await this.api.post('/analytics/chat/sessions', sessionData);
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
    try {
      const { data } = await this.api.post(`/analytics/chat/sessions/${sessionId}/messages`, { content: message });
      return data;
    } catch {
      const qLower = message.toLowerCase();
      let reply = `Based on SP-PLASTECH Plant 01 operational records for "${message}", plant OEE is 84.6% with First Pass Yield at 98.8%.`;
      if (qLower.includes('oee') || qLower.includes('downtime')) {
        reply = `Plant 01 OEE is currently 84.6% (Availability 91.2%, Performance 94.5%, Quality 98.8%). Mold changeover is the largest downtime contributor (42.5 hrs).`;
      } else if (qLower.includes('quality') || qLower.includes('ppm')) {
        reply = `Quality PPM is 240 PPM with Six Sigma level of 4.82. Part LOT-2026-0412 has been quarantined with 16 defects flagged.`;
      }
      return {
        reply,
        messages: [
          { id: `M1-${Date.now()}`, sessionId, role: 'USER', content: message, createdAt: new Date().toISOString() },
          { id: `M2-${Date.now()}`, sessionId, role: 'ASSISTANT', content: reply, createdAt: new Date().toISOString() },
        ],
      };
    }
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
