import { ItemMaster } from '../../../types';
import { itemService } from '../../../services/itemService';
import { CreateItemFormValues } from '../types/masterDataSchemas';

export const masterDataApi = {
  getItems: async (): Promise<ItemMaster[]> => {
    return itemService.getItems();
  },

  getItemByCode: async (code: string): Promise<ItemMaster | undefined> => {
    return itemService.getItemByCode(code);
  },

  createItem: async (data: CreateItemFormValues): Promise<ItemMaster> => {
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
    return await itemService.saveItem(newItem);
  },
};

