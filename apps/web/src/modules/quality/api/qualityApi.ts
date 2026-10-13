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
      title: data.title,
      item: data.itemCode,
      severity: data.severity as any,
      type: data.defectType,
      lot: data.lotNumber,
      by: data.reportedBy,
      desc: data.description,
      qtyAffected: data.quantityAffected,
      status: 'open',
      date: new Date().toISOString().split('T')[0],
      history: [{ event: 'Created NCR', time: 'Just now' }],
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
