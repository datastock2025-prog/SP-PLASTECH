import { apiClient } from '../../../shared/api/client';
import { NonConformanceReport, CapaReport } from '../../../types';
import { initialNcrs, initialCapas } from '../../../data/initialData';
import { NcrCreateFormValues } from '../types/qualitySchemas';

export const qualityApi = {
  getNcrs: async (): Promise<NonConformanceReport[]> => {
    try {
      const response = await apiClient.get<NonConformanceReport[]>('/quality/ncrs');
      return response.data;
    } catch {
      return initialNcrs;
    }
  },

  getCapas: async (): Promise<CapaReport[]> => {
    try {
      const response = await apiClient.get<CapaReport[]>('/quality/capas');
      return response.data;
    } catch {
      return initialCapas;
    }
  },

  createNcr: async (data: NcrCreateFormValues): Promise<NonConformanceReport> => {
    try {
      const response = await apiClient.post<NonConformanceReport>('/quality/ncrs', data);
      return response.data;
    } catch {
      const newNcr: NonConformanceReport = {
        id: `NCR-${Date.now().toString().slice(-4)}`,
        source: 'Production Floor',
        item: data.itemCode,
        itemName: data.title,
        ref: `WO-REF-${Date.now().toString().slice(-3)}`,
        lot: data.lotNumber,
        qty: data.quantityAffected,
        uom: 'PCS',
        severity: data.severity,
        category: data.defectType,
        description: data.description,
        containment: 'Segregated into quarantine area pending review.',
        status: 'open',
        discoveredBy: data.reportedBy,
        discoveredDate: new Date().toISOString().split('T')[0],
        rca: {
          method: '5-Why',
          whys: [],
          rootCause: '',
        },
        disposition: {
          action: null,
          qty: null,
          approvedBy: null,
        },
        capaId: null,
        history: [{ event: 'Created NCR', time: 'Just now' }],
      };
      return newNcr;
    }
  },
};
