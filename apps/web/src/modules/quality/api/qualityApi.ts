import { db } from '@/src/shared/db';
import { NonConformanceReport, CapaReport, CertificateOfAnalysis } from '@/src/types';
import { NcrCreateFormValues } from '../model/qualitySchemas';

export const qualityApi = {
  getNcrs: async (): Promise<NonConformanceReport[]> => {
    try {
      const data = await db.findMany<NonConformanceReport>('quality_ncrs');
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {}
    return [];
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
      severity: data.severity as any,
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
        date: null,
        notes: '',
      },
      correctiveAction: {
        type: 'Standard Containment',
        assignedTo: data.reportedBy,
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        status: 'open',
      },
    };

    try {
      await db.upsert('quality_ncrs', newNcr, 'id');
    } catch {}

    return newNcr;
  },

  getCapas: async (): Promise<CapaReport[]> => {
    try {
      const data = await db.findMany<CapaReport>('quality_capas');
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {}
    return [];
  },

  getCoas: async (): Promise<CertificateOfAnalysis[]> => {
    try {
      const data = await db.findMany<CertificateOfAnalysis>('quality_coas');
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {}
    return [];
  },
};
