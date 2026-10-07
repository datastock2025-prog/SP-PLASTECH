import { ItemMaster } from '../../../types';
import { itemService } from '../../../services/itemService';
import { itemEndpoints, ItemMasterDto, PaginatedItemsResponse } from '../../../lib/api-client';
import { CreateItemFormValues, UpdateItemFormValues } from '../types/masterDataSchemas';

export interface GetItemsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
}

export const masterDataApi = {
  /**
   * Read: Paginated, filtered, sorted Item Catalog
   */
  getItemsPaginated: async (params: GetItemsParams = {}): Promise<PaginatedItemsResponse> => {
    try {
      return await itemEndpoints.getItemsPaginated(params);
    } catch (error: any) {
      const msg = error.response?.data?.error?.message || error.message || 'Failed to fetch items catalog';
      console.error('[masterDataApi.getItemsPaginated] Error:', msg);
      throw new Error(msg);
    }
  },

  /**
   * Read: Active items list with bounded limit
   */
  getItems: async (limit: number = 50): Promise<ItemMaster[]> => {
    try {
      return await itemService.getItems(limit);
    } catch (error: any) {
      const msg = error.response?.data?.error?.message || error.message || 'Failed to fetch items';
      console.error('[masterDataApi.getItems] Error:', msg);
      throw new Error(msg);
    }
  },

  /**
   * Read: Single item by code or id
   */
  getItemByCode: async (code: string): Promise<ItemMaster | undefined> => {
    try {
      return await itemService.getItemByCode(code);
    } catch (error: any) {
      const msg = error.response?.data?.error?.message || error.message || `Failed to fetch item '${code}'`;
      console.error('[masterDataApi.getItemByCode] Error:', msg);
      throw new Error(msg);
    }
  },

  /**
   * Create: Register new SKU with validation
   */
  createItem: async (data: CreateItemFormValues): Promise<ItemMaster> => {
    try {
      const newItem: ItemMaster = {
        code: data.code.trim(),
        name: data.name.trim(),
        type: (data.type || (data.category === 'Raw Material' ? 'Raw Material' : 'Finished Good')) as any,
        cat: data.category,
        category: data.category,
        stock: '0 ' + data.uom,
        avail: '0 ' + data.uom,
        wh: data.location || 'RM-WH-01',
        lot: data.isBatchTracked,
        qc: true,
        status: 'active',
        icon: '◇',
        baseUOM: data.uom,
        desc: data.description || '',
        approval: 'approved',
        cost: data.costPrice,
        standardCost: data.costPrice,
        sellingPrice: data.sellingPrice,
        minStock: data.minStock,
        maxStock: data.maxStock,
        reorderPoint: data.reorderPoint,
        partWeightGrams: data.partWeightGrams,
        runnerWeightGrams: data.runnerWeightGrams,
        cavityCount: data.cavityCount,
        cycleTimeSec: data.cycleTimeSeconds,
        moldToolId: data.moldCode,
        resinType: data.resinType,
        color: data.color,
        hsnCode: data.hsnCode,
        version: 1,
        createdOn: new Date().toISOString().split('T')[0],
      };
      return await itemService.saveItem(newItem);
    } catch (error: any) {
      const msg = error.response?.data?.error?.message || error.message || 'Failed to create item SKU';
      console.error('[masterDataApi.createItem] Error:', msg);
      throw new Error(msg);
    }
  },

  /**
   * Update: Update item with optimistic concurrency control
   */
  updateItem: async (item: ItemMaster): Promise<ItemMaster> => {
    try {
      return await itemService.saveItem(item);
    } catch (error: any) {
      const isConflict = error.response?.status === 409 || error.message?.includes('conflict') || error.message?.includes('modified by another user');
      const msg = isConflict
        ? `Concurrency Conflict: SKU '${item.code}' was updated by another session. Please refresh and try again.`
        : error.response?.data?.error?.message || error.message || `Failed to update SKU '${item.code}'`;
      console.error('[masterDataApi.updateItem] Error:', msg);
      throw new Error(msg);
    }
  },

  /**
   * Delete: Soft-delete item
   */
  deleteItem: async (code: string): Promise<boolean> => {
    try {
      return await itemService.deleteItem(code);
    } catch (error: any) {
      const msg = error.response?.data?.error?.message || error.message || `Failed to delete SKU '${code}'`;
      console.error('[masterDataApi.deleteItem] Error:', msg);
      throw new Error(msg);
    }
  },

  /**
   * Approve: Release item to production
   */
  approveItem: async (item: ItemMaster, reviewerName?: string, comment?: string): Promise<ItemMaster> => {
    try {
      return await itemService.approveItem(item, reviewerName, comment);
    } catch (error: any) {
      const msg = error.response?.data?.error?.message || error.message || `Failed to approve SKU '${item.code}'`;
      console.error('[masterDataApi.approveItem] Error:', msg);
      throw new Error(msg);
    }
  },

  /**
   * Reject: Reject SKU approval
   */
  rejectItem: async (item: ItemMaster, reviewerName?: string, reason?: string): Promise<ItemMaster> => {
    try {
      return await itemService.rejectItem(item, reviewerName, reason);
    } catch (error: any) {
      const msg = error.response?.data?.error?.message || error.message || `Failed to reject SKU '${item.code}'`;
      console.error('[masterDataApi.rejectItem] Error:', msg);
      throw new Error(msg);
    }
  },

  /**
   * Bulk Import: Batch transactional SKU import
   */
  bulkImport: async (items: ItemMasterDto[]): Promise<{ importedCount: number; errors: string[] }> => {
    try {
      return await itemEndpoints.bulkImport(items);
    } catch (error: any) {
      const msg = error.response?.data?.error?.message || error.message || 'Bulk import failed';
      console.error('[masterDataApi.bulkImport] Error:', msg);
      throw new Error(msg);
    }
  },
};
