import { apiClient } from '../../../shared/api/client';
import { ItemMaster } from '../../../types';
import { initialItems } from '../../../data/initialData';
import { CreateItemFormValues } from '../types/masterDataSchemas';

export const masterDataApi = {
  getItems: async (): Promise<ItemMaster[]> => {
    try {
      const response = await apiClient.get<ItemMaster[]>('/masterdata/items');
      return response.data;
    } catch {
      return initialItems;
    }
  },

  getItemByCode: async (code: string): Promise<ItemMaster | undefined> => {
    try {
      const response = await apiClient.get<ItemMaster>(`/masterdata/items/${code}`);
      return response.data;
    } catch {
      return initialItems.find((i) => i.code === code);
    }
  },

  createItem: async (data: CreateItemFormValues): Promise<ItemMaster> => {
    try {
      const response = await apiClient.post<ItemMaster>('/masterdata/items', data);
      return response.data;
    } catch {
      const newItem: ItemMaster = {
        code: data.code,
        name: data.name,
        type: 'Raw Material',
        cat: data.category,
        stock: '0 ' + data.uom,
        avail: '0 ' + data.uom,
        wh: data.location || 'RM-WH-01',
        lot: data.isBatchTracked,
        qc: true,
        status: 'active',
        icon: '◇',
        baseUOM: data.uom,
        desc: data.description,
        approval: 'approved',
        createdOn: new Date().toISOString().split('T')[0],
      };
      return newItem;
    }
  },
};
