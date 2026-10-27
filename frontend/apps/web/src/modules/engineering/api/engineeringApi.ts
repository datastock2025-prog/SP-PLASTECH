import { bomEndpoints, BomDto } from '@/src/lib/api-client';
import { BomMaster } from '@/src/types';

export const engineeringApi = {
  getBoms: async (): Promise<BomMaster[]> => {
    try {
      const fetched = await bomEndpoints.getBoms();
      if (Array.isArray(fetched) && fetched.length > 0) {
        return fetched.map((b) => ({
          ...b,
          id: b.id,
          parent: b.item_code || (b as any).parent || '',
          parentName: (b as any).parentName || b.item_code || '',
          version: b.version || '1.0',
          status: (b.status as any) || 'draft',
          updated: b.updated_at || new Date().toISOString().split('T')[0],
          lines: (b as any).lines || (b as any).components || [],
        } as BomMaster));
      }
    } catch (e) {
      console.debug('[engineeringApi.getBoms] notice:', e);
    }
    return [];
  },

  getBomById: async (id: string): Promise<BomDto | null> => {
    return await bomEndpoints.getBomById(id);
  },

  saveBom: async (bom: Partial<BomMaster>): Promise<any> => {
    return await bomEndpoints.saveBom(bom as any);
  },

  deleteBom: async (id: string): Promise<any> => {
    return await bomEndpoints.deleteBom(id);
  },
};
