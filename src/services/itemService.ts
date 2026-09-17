import { ItemMaster } from '../types';
import { apiClient } from '../shared/api/client';
import { adminEventBus } from './adminService';

const STORAGE_KEY = 'reboot_erp_item_master_catalog';

// Initial items start empty for clean live data entry and testing
const INITIAL_ITEMS: ItemMaster[] = [];

// Stale dummy codes to filter out if previously cached in localStorage
const DUMMY_CODES = new Set([
  'RM-PP-NAT-001',
  'RM-HD-GRN-014',
  'MB-BLK-003',
  'FG-BMP-NEXON-F',
  'FG-BEZEL-AC-4C',
  'RES-PP-COPO-01',
]);

function loadLocalItems(): ItemMaster[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Filter out legacy dummy mock items
        const cleanItems = parsed.filter((i) => !DUMMY_CODES.has(i.code));
        if (cleanItems.length !== parsed.length) {
          saveLocalItems(cleanItems);
        }
        return cleanItems;
      }
    }
  } catch (err) {
    console.warn('Could not read items from localStorage', err);
  }
  return [];
}

function saveLocalItems(items: ItemMaster[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn('Could not save items to localStorage', err);
  }
}

class ItemService {
  private cache: ItemMaster[] = loadLocalItems();

  public getItemsSync(): ItemMaster[] {
    return this.cache;
  }

  public async getItems(): Promise<ItemMaster[]> {
    try {
      const res = await apiClient.get<any>('/api/items');
      if (res && res.data && Array.isArray(res.data.items)) {
        this.cache = res.data.items.filter((i: ItemMaster) => !DUMMY_CODES.has(i.code));
        saveLocalItems(this.cache);
        return this.cache;
      }
    } catch {
      // Fallback to local cache
    }
    return this.cache;
  }

  public async saveItem(item: ItemMaster): Promise<ItemMaster> {
    // Ensure injection molding parameter consistency
    const partWeight = Number(item.partWeightGrams || item.netWeightGrams || 0);
    const runnerWeight = Number(item.runnerWeightGrams || 0);
    const cavities = Number(item.cavityCount || 1);
    const calculatedShot = Number((partWeight + runnerWeight).toFixed(2));

    const enrichedItem: ItemMaster = {
      ...item,
      partWeightGrams: partWeight,
      runnerWeightGrams: runnerWeight,
      cavityCount: cavities,
      shotWeightGrams: calculatedShot,
      netWeightGrams: partWeight,
      standardCycleTime: Number(item.cycleTime || item.standardCycleTime || 0),
      cycleTime: Number(item.cycleTime || item.standardCycleTime || 0),
    };

    // Try backend API post
    try {
      await apiClient.post('/api/items', enrichedItem);
    } catch {
      // Continue with offline local store
    }

    const idx = this.cache.findIndex((i) => i.code === enrichedItem.code);
    if (idx >= 0) {
      this.cache[idx] = enrichedItem;
    } else {
      this.cache.unshift(enrichedItem);
    }

    saveLocalItems(this.cache);
    adminEventBus.emit('ITEM_SAVED', enrichedItem);
    return enrichedItem;
  }

  public async deleteItem(code: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api/items/${code}`);
    } catch {
      // Offline fallback
    }

    this.cache = this.cache.filter((i) => i.code !== code);
    saveLocalItems(this.cache);
    adminEventBus.emit('ITEM_DELETED', { code });
    return true;
  }

  public clearAll(): void {
    this.cache = [];
    saveLocalItems([]);
    localStorage.removeItem('reboot_erp_item_draft_auto');
  }
}

export const itemService = new ItemService();
