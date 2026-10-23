import { bomEndpoints } from '../../../lib/api-client';
import { BomMaster } from '../../../types';

export const engineeringApi = {
  getBoms: async (): Promise<BomMaster[]> => {
    const fetched = await bomEndpoints.getBoms();
    if (!Array.isArray(fetched)) return [];
    return fetched.map((b) => ({
      id: b.id,
      parent: b.item_code || (b as any).parent || '',
      parentName: (b as any).parentName || b.item_code || '',
      version: b.version || 'v1.0',
      status: (b.status as any) || 'approved',
      updated: b.updated_at || new Date().toISOString().split('T')[0],
      lines: (b as any).components || [],
    } as BomMaster));
  },
};
