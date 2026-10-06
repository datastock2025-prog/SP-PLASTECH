import { NonConformanceReport, CapaReport } from '../../../types';
import { db } from '../../../shared/db';
import { initialNcrs, initialCapas } from '../../../data/initialData';
import { NcrCreateFormValues } from '../types/qualitySchemas';

export const qualityApi = {
  getNcrs: async (): Promise<NonConformanceReport[]> => {
    try {
      const data = await db.findMany<NonConformanceReport>('ncrs');
      return data && data.length > 0 ? data : initialNcrs;
    } catch {
      return initialNcrs;
    }
  },

  getCapas: async (): Promise<CapaReport[]> => {
    try {
      const data = await db.findMany<CapaReport>('capas');
      return data && data.length > 0 ? data : initialCapas;
    } catch {
      return initialCapas;
    }
  },

  createNcr: async (data: NcrCreateFormValues): Promise<NonConformanceReport> => {
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
    return await db.upsert<NonConformanceReport>('ncrs', newNcr);
  },
};

