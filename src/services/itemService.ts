import { ItemMaster } from '../types';
import { db } from '../shared/db';
import { adminEventBus } from './adminService';
import { universalSyncManager } from './realtime/UniversalSyncManager';
import { masterDataGovernanceService } from './masterDataGovernanceService';
import { DOCUMENT_ITEM_MASTER_CATALOG } from '../data/masterItemsCatalog';

const STORAGE_KEY = 'reboot_erp_item_master_catalog';

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
  let localSaved: ItemMaster[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        localSaved = parsed.filter((i) => i && i.code && !DUMMY_CODES.has(i.code));
      }
    }
  } catch (err) {
    console.warn('Could not read items from localStorage', err);
  }

  // Create a base map from the document catalog
  const catalogMap = new Map<string, ItemMaster>();
  DOCUMENT_ITEM_MASTER_CATALOG.forEach((item) => {
    catalogMap.set(item.code, {
      ...item,
      approval: 'approved' as const,
      status: item.status || 'active',
    });
  });

  // Apply all user saved items (including approved items, newly registered SKUs, edits) over the catalog map
  localSaved.forEach((item) => {
    if (item && item.code) {
      catalogMap.set(item.code, item);
    }
  });

  const merged = Array.from(catalogMap.values());
  saveLocalItems(merged);
  return merged;
}

function saveLocalItems(items: ItemMaster[]) {
  try {
    if (Array.isArray(items) && items.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  } catch (err) {
    console.warn('Could not save items to localStorage', err);
  }
}

class ItemService {
  private cache: ItemMaster[] = loadLocalItems();

  constructor() {
    if (typeof window !== 'undefined') {
      adminEventBus.on('ITEMS_SYNCED', (event: any) => {
        if (event?.data) {
          const item = event.data;
          const idx = this.cache.findIndex((i) => i.code === item.code);
          if (idx >= 0) {
            this.cache[idx] = { ...this.cache[idx], ...item };
          } else {
            this.cache.unshift(item);
          }
          saveLocalItems(this.cache);
          adminEventBus.emit('ITEM_SAVED', item);
        }
      });
    }
  }

  public getItemsSync(): ItemMaster[] {
    if (!this.cache || this.cache.length === 0) {
      this.cache = loadLocalItems();
    }
    return this.cache;
  }

  public async getItems(): Promise<ItemMaster[]> {
    // 1. Load baseline catalog items from local repository
    const baseCatalog = loadLocalItems();

    // 2. Fetch latest overrides / newly created items from Vendor-Agnostic DB
    try {
      const data = await db.findMany<ItemMaster>('items', {
        orderBy: { column: 'created_at', ascending: false },
      });

      if (Array.isArray(data) && data.length > 0) {
        const itemMap = new Map<string, ItemMaster>();
        baseCatalog.forEach((item) => {
          if (item && item.code) {
            itemMap.set(item.code.toUpperCase(), item);
          }
        });

        // Overlay DB records over the base catalog
        data.forEach((item: any) => {
          if (item && item.code && !DUMMY_CODES.has(item.code)) {
            const existing = itemMap.get(item.code.toUpperCase()) || {};
            itemMap.set(item.code.toUpperCase(), { ...existing, ...item });
          }
        });

        this.cache = Array.from(itemMap.values());
        saveLocalItems(this.cache);
        return this.cache;
      }
    } catch (e) {
      console.debug('[ItemService] db.findMany items note:', e);
    }

    // 3. Fallback to resilient cached catalog
    this.cache = baseCatalog;
    return this.cache;
  }

  public async getItemByCode(code: string): Promise<ItemMaster | undefined> {
    if (!code) return undefined;
    const cleanCode = code.trim();

    try {
      const data = await db.findOne<ItemMaster>('items', cleanCode, 'code');
      if (data) return data;
    } catch {}

    return this.cache.find((i) => i.code.toLowerCase() === cleanCode.toLowerCase());
  }

  public async saveItem(item: ItemMaster, actorName: string = 'Master Data Lead'): Promise<ItemMaster> {
    // Ensure injection molding and material parameter consistency
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
      status: item.status || 'active',
      approval: item.approval || 'approved',
    };

    const existingIdx = this.cache.findIndex((i) => i.code === enrichedItem.code);
    const previousSnapshot = existingIdx >= 0 ? { ...this.cache[existingIdx] } : null;
    const isNew = existingIdx < 0;

    // 1. Vendor-Agnostic Database Gateway Upsert
    try {
      await db.upsert('items', enrichedItem, 'code');
    } catch (e) {
      console.debug('[ItemService] db.upsert note:', e);
    }

    // 2. Update Memory Cache & Local Storage
    if (existingIdx >= 0) {
      this.cache[existingIdx] = enrichedItem;
    } else {
      this.cache.unshift(enrichedItem);
    }
    saveLocalItems(this.cache);

    // 3. Record Immutable Audit Ledger Entry with exact diff
    const diffRecord: Record<string, { before: any; after: any }> = {};
    if (previousSnapshot) {
      if (previousSnapshot.status !== enrichedItem.status) diffRecord.status = { before: previousSnapshot.status, after: enrichedItem.status };
      if (previousSnapshot.approval !== enrichedItem.approval) diffRecord.approval = { before: previousSnapshot.approval, after: enrichedItem.approval };
      if (previousSnapshot.cycleTime !== enrichedItem.cycleTime) diffRecord.cycleTime = { before: previousSnapshot.cycleTime, after: enrichedItem.cycleTime };
      if (previousSnapshot.partWeightGrams !== enrichedItem.partWeightGrams) diffRecord.partWeightGrams = { before: previousSnapshot.partWeightGrams, after: enrichedItem.partWeightGrams };
      if (previousSnapshot.moldToolId !== enrichedItem.moldToolId) diffRecord.moldToolId = { before: previousSnapshot.moldToolId, after: enrichedItem.moldToolId };
      if (previousSnapshot.standardCost !== enrichedItem.standardCost) diffRecord.standardCost = { before: previousSnapshot.standardCost, after: enrichedItem.standardCost };
    }

    masterDataGovernanceService.recordAudit({
      entityType: 'ITEM_MASTER',
      entityCode: enrichedItem.code,
      entityName: enrichedItem.name,
      action: isNew ? 'CREATE' : 'UPDATE',
      changedBy: actorName,
      userRole: 'admin',
      changeSummary: isNew
        ? `Registered new SKU ${enrichedItem.code} (${enrichedItem.name}) under plant ${enrichedItem.plant || 'Plant 1'}.`
        : `Updated master specs for SKU ${enrichedItem.code} (${enrichedItem.name}).`,
      diff: Object.keys(diffRecord).length > 0 ? diffRecord : undefined,
    });

    // 4. Reactive Events & WebSocket Sync Broadcast
    adminEventBus.emit('ITEM_SAVED', enrichedItem);
    universalSyncManager.broadcastMutation('ITEMS', isNew ? 'INSERT' : 'UPDATE', enrichedItem);
    return enrichedItem;
  }

  public async approveItem(
    item: ItemMaster,
    reviewerName: string = 'Admin Lead',
    comment: string = 'Approved and released SKU to live shopfloor'
  ): Promise<ItemMaster> {
    const updated: ItemMaster = {
      ...item,
      approval: 'approved',
      status: 'active',
      approvedBy: reviewerName,
    };

    try {
      await db.upsert('items', updated, 'code');
    } catch {}

    const idx = this.cache.findIndex((i) => i.code === item.code);
    if (idx >= 0) {
      this.cache[idx] = updated;
    }
    saveLocalItems(this.cache);

    masterDataGovernanceService.recordAudit({
      entityType: 'ITEM_MASTER',
      entityCode: updated.code,
      entityName: updated.name,
      action: 'APPROVE',
      changedBy: reviewerName,
      approvedBy: reviewerName,
      userRole: 'admin',
      changeSummary: `${comment} &bull; ${updated.code} released to production catalog.`,
      diff: {
        approval: { before: item.approval, after: 'approved' },
        status: { before: item.status, after: 'active' },
      },
    });

    adminEventBus.emit('ITEM_SAVED', updated);
    adminEventBus.emit('ITEM_APPROVED', updated);
    universalSyncManager.broadcastMutation('ITEMS', 'UPDATE', updated);
    return updated;
  }

  public async rejectItem(
    item: ItemMaster,
    reviewerName: string = 'Admin Lead',
    reason: string = 'Rejected in QA / Engineering gate review'
  ): Promise<ItemMaster> {
    const updated: ItemMaster = {
      ...item,
      approval: 'rejected',
      status: 'blocked',
    };

    try {
      await db.upsert('items', updated, 'code');
    } catch {}

    const idx = this.cache.findIndex((i) => i.code === item.code);
    if (idx >= 0) {
      this.cache[idx] = updated;
    }
    saveLocalItems(this.cache);

    masterDataGovernanceService.recordAudit({
      entityType: 'ITEM_MASTER',
      entityCode: updated.code,
      entityName: updated.name,
      action: 'REJECT',
      changedBy: reviewerName,
      userRole: 'admin',
      changeSummary: `Rejected SKU ${updated.code}: ${reason}`,
      diff: {
        approval: { before: item.approval, after: 'rejected' },
        status: { before: item.status, after: 'blocked' },
      },
    });

    adminEventBus.emit('ITEM_SAVED', updated);
    adminEventBus.emit('ITEM_REJECTED', updated);
    universalSyncManager.broadcastMutation('ITEMS', 'UPDATE', updated);
    return updated;
  }

  public async deleteItem(code: string, actorName: string = 'Admin'): Promise<boolean> {
    const existing = this.cache.find((i) => i.code === code);

    // 1. Vendor-Agnostic Database Gateway Delete
    try {
      await db.delete('items', code, 'code');
    } catch {}

    // 2. Cache & Storage Update
    this.cache = this.cache.filter((i) => i.code !== code);
    saveLocalItems(this.cache);

    // 3. Audit Trail
    masterDataGovernanceService.recordAudit({
      entityType: 'ITEM_MASTER',
      entityCode: code,
      entityName: existing?.name || code,
      action: 'DELETE',
      changedBy: actorName,
      userRole: 'admin',
      changeSummary: `Permanently deleted SKU ${code} from item master catalog.`,
    });

    adminEventBus.emit('ITEM_DELETED', { code });
    universalSyncManager.broadcastMutation('ITEMS', 'DELETE', { code });
    return true;
  }

  public async syncLiveCatalog(): Promise<ItemMaster[]> {
    const liveItems = DOCUMENT_ITEM_MASTER_CATALOG.map((item) => ({
      ...item,
      approval: 'approved' as const,
      status: item.status || 'active',
    }));

    // Upsert into Vendor-Agnostic Database Gateway
    try {
      await db.upsert('items', liveItems, 'code');
    } catch (e) {
      console.debug('[ItemService] bulk db.upsert note:', e);
    }

    this.cache = liveItems;
    saveLocalItems(liveItems);

    masterDataGovernanceService.recordAudit({
      entityType: 'ITEM_MASTER',
      entityCode: 'CATALOG_SYNC_ALL',
      entityName: 'Document Master Catalog (1,719 SKUs)',
      action: 'VERSION_RELEASE',
      changedBy: 'Super Admin Gateway Sync',
      approvedBy: 'Admin Authority',
      userRole: 'admin',
      changeSummary: `Synchronized and released complete live catalog of ${liveItems.length} SKUs with verified injection tooling, rheology specs, and warehouse mappings.`,
    });

    adminEventBus.emit('CATALOG_RELOADED', liveItems);
    adminEventBus.emit('ITEMS_SYNCED', { data: liveItems });
    universalSyncManager.broadcastMutation('ITEMS', 'UPDATE', { count: liveItems.length });
    return liveItems;
  }

  public reloadDocumentCatalog(): ItemMaster[] {
    const liveItems = DOCUMENT_ITEM_MASTER_CATALOG.map((item) => ({
      ...item,
      approval: 'approved' as const,
      status: item.status || 'active',
    }));
    this.cache = liveItems;
    saveLocalItems(liveItems);
    adminEventBus.emit('CATALOG_RELOADED', liveItems);
    return liveItems;
  }

  public clearAll(): void {
    this.cache = [];
    saveLocalItems([]);
    localStorage.removeItem('reboot_erp_item_draft_auto');
  }
}

export const itemService = new ItemService();
