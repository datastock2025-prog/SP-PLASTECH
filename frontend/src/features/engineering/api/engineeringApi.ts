import { apiClient } from '../../../shared/api/client';
import { BomMaster } from '../../../types';
import { INITIAL_BOMS } from '../../../modules/engineering';

export const engineeringApi = {
  getBoms: async (): Promise<BomMaster[]> => {
    try {
      const response = await apiClient.get<BomMaster[]>('/engineering/boms');
      return response.data;
    } catch {
      return INITIAL_BOMS;
    }
  },
};
