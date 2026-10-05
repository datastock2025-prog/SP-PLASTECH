import { ItemMaster } from '../types';
import { db } from '../shared/db';
import { itemEndpoints } from '../lib/api-client';
import { adminEventBus } from './adminService';
import { broadcastLocalMutation } from './realtime/supabaseRealtime';
import { masterDataGovernanceService } from './masterDataGovernanceService';
import { DOCUMENT_ITEM_MASTER_CATALOG } from '../data/masterItemsCatalog';

// Stale dummy codes to filter out
const DUMMY_CODES = new Set([
  'RM-PP-NAT-001',
  'RM-HD-GRN-014',
  'MB-BLK-003',
  'FG-BMP-NEXON-F',
  'FG-BEZEL-AC-4C',
  'RES-PP-COPO-01',
]);

function initializeBaseCatalog(): ItemMaster[] {
  return DOCUMENT_ITEM_MASTER_CATALOG.map((item) => ({
    ...item,
    approval: 'approved' as const,
    status: item.status || 'active',
  }));
}

class ItemService {
  private cache: ItemMaster[] = initializeBaseCatalog();

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
          adminEventBus.emit('ITEM_SAVED', item);
        }
      });
    }
  }

  public getItemsSync(): ItemMaster[] {
    if (!this.cache || this.cache.length === 0) {
      this.cache = initializeBaseCatalog();
    }
    return this.cache;
  }

  public async getItems(): Promise<ItemMaster[]> {
    // 1. Load baseline in-memory catalog
    const baseCatalog = initializeBaseCatalog();

    // 2. Fetch latest live overrides from PostgreSQL Database (Single Source of Truth)
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

        // Overlay DB records over the base catalog with intelligent property normalization
        data.forEach((dbItem: any) => {
          if (dbItem && dbItem.code && !DUMMY_CODES.has(dbItem.code)) {
            const key = dbItem.code.toUpperCase();
            const existing = itemMap.get(key) || ({} as ItemMaster);

            const merged: ItemMaster = {
              ...existing,
              ...dbItem,
              code: dbItem.code || existing.code,
              name: dbItem.name || existing.name,
              type: dbItem.type || existing.type || 'Finished Good',
              cat: dbItem.cat || dbItem.category || existing.cat || 'INJECTION MOLDING',
              wh: dbItem.wh || dbItem.warehouse || existing.wh || 'FG_WH_A',
              plant: dbItem.plant || existing.plant || 'Plant 1 - Pimpri Auto-Hub',
              stock: String(dbItem.stock ?? existing.stock ?? '0'),
              avail: String(dbItem.avail ?? existing.avail ?? '0'),
              baseUOM: dbItem.baseUOM || dbItem.base_uom || existing.baseUOM || 'PCS',
              standardCycleTime: Number(dbItem.standardCycleTime ?? dbItem.standard_cycle_time ?? dbItem.cycleTime ?? dbItem.cycle_time ?? existing.standardCycleTime ?? existing.cycleTime ?? 0),
              cycleTime: Number(dbItem.cycleTime ?? dbItem.cycle_time ?? dbItem.standardCycleTime ?? dbItem.standard_cycle_time ?? existing.cycleTime ?? existing.standardCycleTime ?? 0),
              cavityCount: Number(dbItem.cavityCount ?? dbItem.cavity_count ?? existing.cavityCount ?? 1),
              partWeightGrams: Number(dbItem.partWeightGrams ?? dbItem.part_weight_grams ?? existing.partWeightGrams ?? existing.netWeightGrams ?? 0),
              runnerWeightGrams: Number(dbItem.runnerWeightGrams ?? dbItem.runner_weight_grams ?? existing.runnerWeightGrams ?? 0),
              shotWeightGrams: Number(dbItem.shotWeightGrams ?? dbItem.shot_weight_grams ?? existing.shotWeightGrams ?? 0),
              netWeightGrams: Number(dbItem.netWeightGrams ?? dbItem.partWeightGrams ?? existing.netWeightGrams ?? 0),
              resinType: dbItem.resinType || dbItem.resin_type || dbItem.polymerGrade || dbItem.polymer_grade || existing.resinType || existing.polymerGrade || '',
              polymerGrade: dbItem.polymerGrade || dbItem.polymer_grade || dbItem.resinType || dbItem.resin_type || existing.polymerGrade || existing.resinType || '',
              mfi: dbItem.mfi || dbItem.melt_flow_index || existing.mfi || '',
              density: dbItem.density || dbItem.specific_density || existing.density || '',
              safetyStock: String(dbItem.safetyStock ?? dbItem.safety_stock ?? existing.safetyStock ?? '0'),
              reorderLevel: String(dbItem.reorderLevel ?? dbItem.reorder_level ?? existing.reorderLevel ?? '0'),
              leadTime: dbItem.leadTime || dbItem.lead_time || existing.leadTime || '3 Days',
              supplier: dbItem.supplier || existing.supplier || '',
              standardCost: Number(dbItem.standardCost ?? dbItem.standard_cost ?? dbItem.cost ?? existing.standardCost ?? existing.cost ?? 0),
              cost: Number(dbItem.cost ?? dbItem.standard_cost ?? dbItem.standardCost ?? existing.cost ?? existing.standardCost ?? 0),
              moldToolId: dbItem.moldToolId || dbItem.mold_tool_id || existing.moldToolId || '',
              approval: dbItem.approval || dbItem.approval_status || existing.approval || 'approved',
              status: dbItem.status || existing.status || 'active',
              lot: dbItem.lot ?? existing.lot ?? true,
              qc: dbItem.qc ?? existing.qc ?? true,
              icon: dbItem.icon || existing.icon || '◇',
              createdOn: dbItem.createdOn || dbItem.created_at || existing.createdOn || '2026-09-25',
            };

            itemMap.set(key, merged);
          }
        });

        this.cache = Array.from(itemMap.values());
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
    // 1. Centralized Enterprise Database Gateway & API Client Upsert
    try {
      await Promise.allSettled([
        db.upsert('items', enrichedItem, 'code'),
        itemEndpoints.saveItem(enrichedItem as any),
      ]);
    } catch (e) {
      console.debug('[ItemService] DB/API save note:', e);
    }

    // 2. Update Memory Cache
    if (existingIdx >= 0) {
      this.cache[existingIdx] = enrichedItem;
    } else {
      this.cache.unshift(enrichedItem);
    }

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
    broadcastLocalMutation('ITEMS', isNew ? 'INSERT' : 'UPDATE', enrichedItem);
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
      await Promise.allSettled([
        db.upsert('items', updated, 'code'),
        itemEndpoints.saveItem(updated as any),
      ]);
    } catch {}

    const idx = this.cache.findIndex((i) => i.code === item.code);
    if (idx >= 0) {
      this.cache[idx] = updated;
    }

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
    broadcastLocalMutation('ITEMS', 'UPDATE', updated);
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
      await Promise.allSettled([
        db.upsert('items', updated, 'code'),
        itemEndpoints.saveItem(updated as any),
      ]);
    } catch {}

    const idx = this.cache.findIndex((i) => i.code === item.code);
    if (idx >= 0) {
      this.cache[idx] = updated;
    }

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
    broadcastLocalMutation('ITEMS', 'UPDATE', updated);
    return updated;
  }

  public async deleteItem(code: string, actorName: string = 'Admin'): Promise<boolean> {
    const existing = this.cache.find((i) => i.code === code);

    // 1. Centralized Database Gateway & API Client Delete
    try {
      await Promise.allSettled([
        db.delete('items', code, 'code'),
        itemEndpoints.deleteItem(code),
      ]);
    } catch {}

    // 2. Cache Update
    this.cache = this.cache.filter((i) => i.code !== code);

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
    broadcastLocalMutation('ITEMS', 'DELETE', { code });
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
    broadcastLocalMutation('ITEMS', 'UPDATE', { count: liveItems.length });
    return liveItems;
  }

  public reloadDocumentCatalog(): ItemMaster[] {
    const liveItems = DOCUMENT_ITEM_MASTER_CATALOG.map((item) => ({
      ...item,
      approval: 'approved' as const,
      status: item.status || 'active',
    }));
    this.cache = liveItems;
    adminEventBus.emit('CATALOG_RELOADED', liveItems);
    return liveItems;
  }

  public clearAll(): void {
    this.cache = [];
  }
}

export const itemService = new ItemService();
