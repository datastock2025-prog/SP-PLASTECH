import { api } from '@/src/lib/api-client';
import { NonConformanceReport, CapaReport, CertificateOfAnalysis } from '@/src/types';
import { NcrCreateFormValues } from '../model/qualitySchemas';

export const qualityApi = {
  getNcrs: async (): Promise<NonConformanceReport[]> => {
    try {
      const res = await api.get<any>('/qc-inspections', {
        params: { limit: 100, sortBy: 'created_at', sortOrder: 'desc', includeTotal: true },
      });
      const rows = res?.data?.data || res?.data;
      if (Array.isArray(rows)) return rows;
    } catch (e) {
      console.debug('[qualityApi.getNcrs] REST query notice:', e);
    }
    return [];
  },

  createNcr: async (data: NcrCreateFormValues): Promise<NonConformanceReport> => {
    const newNcr: any = {
      inspection_no: `NCR-${Date.now().toString().slice(-4)}`,
      doc_type: 'WORK_ORDER',
      doc_id: `WO-REF-${Date.now().toString().slice(-3)}`,
      item_code: data.itemCode,
      lot_number: data.lotNumber,
      inspected_qty: data.quantityAffected,
      rejected_qty: data.quantityAffected,
      disposition: 'QUARANTINE',
      notes: data.description,
      defects: [{ category: data.defectType, severity: data.severity, title: data.title }],
    };

    try {
      const res = await api.post<any>('/qc-inspections', newNcr);
      const row = res?.data?.data || res?.data;
      if (row && typeof row === 'object') return row as NonConformanceReport;
    } catch (e) {
      console.debug('[qualityApi.createNcr] REST notice:', e);
    }

    return newNcr as NonConformanceReport;
  },

  getCapas: async (): Promise<CapaReport[]> => {
    try {
      const res = await api.get<any>('/qc-capas', { params: { limit: 100 } });
      const rows = res?.data?.data || res?.data;
      if (Array.isArray(rows)) return rows;
    } catch {}
    return [];
  },

  getCoas: async (): Promise<CertificateOfAnalysis[]> => {
    try {
      const res = await api.get<any>('/qc-coas', { params: { limit: 100 } });
      const rows = res?.data?.data || res?.data;
      if (Array.isArray(rows)) return rows;
    } catch {}
    return [];
  },
};
