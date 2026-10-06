import { ItemMaster } from '../types';
import { db } from '../shared/db';
import { itemEndpoints, ITEM_SELECT_COLUMNS, ITEM_LEAN_SELECT_COLUMNS } from '../lib/api-client';
import { adminEventBus } from './adminService';
import { broadcastLocalMutation } from './realtime/supabaseRealtime';
import { masterDataGovernanceService } from './masterDataGovernanceService';

// Stale dummy codes to filter out
const DUMMY_CODES = new Set([
  'RM-PP-NAT-001',
  'RM-HD-GRN-014',
  'MB-BLK-003',
  'FG-BMP-NEXON-F',
  'FG-BEZEL-AC-4C',
  'RES-PP-COPO-01',
]);

function mapDbRowToItemMaster(dbItem: any, fallback?: ItemMaster): ItemMaster {
  const partWeight = Number(dbItem.part_weight_grams ?? dbItem.partWeightGrams ?? fallback?.partWeightGrams ?? 0);
  const runnerWeight = Number(dbItem.runner_weight_grams ?? dbItem.runnerWeightGrams ?? fallback?.runnerWeightGrams ?? 0);
  const shotWeight = Number((partWeight + runnerWeight).toFixed(2));
  const cycleTimeVal = Number(
    dbItem.cycle_time_seconds ?? dbItem.cycle_time ?? dbItem.cycleTimeSec ?? dbItem.cycleTime ?? dbItem.standardCycleTime ?? fallback?.cycleTime ?? 0
  );

  return {
    ...fallback,
    ...dbItem,
    id: String(dbItem.id || dbItem.code || fallback?.id || ''),
    code: String(dbItem.code || fallback?.code || ''),
    name: String(dbItem.name || fallback?.name || ''),
    type: String(dbItem.entity_type || dbItem.type || fallback?.type || 'Finished Good'),
    cat: String(dbItem.category || dbItem.cat || fallback?.cat || 'INJECTION MOLDING'),
    category: String(dbItem.category || dbItem.cat || fallback?.category || 'Finished Good'),
    wh: String(dbItem.wh || dbItem.warehouse || fallback?.wh || 'FG_WH_A'),
    plant: String(dbItem.plant || fallback?.plant || 'Plant 1 - Pimpri Auto-Hub'),
    stock: String(dbItem.stock ?? fallback?.stock ?? '0'),
    avail: String(dbItem.avail ?? dbItem.stock ?? fallback?.avail ?? '0'),
    baseUOM: String(dbItem.unit || dbItem.base_uom || dbItem.baseUOM || fallback?.baseUOM || 'PCS'),
    standardCycleTime: cycleTimeVal,
    cycleTime: cycleTimeVal,
    cycleTimeSec: cycleTimeVal,
    cavityCount: Number(dbItem.cavity_count ?? dbItem.cavityCount ?? fallback?.cavityCount ?? 1),
    partWeightGrams: partWeight,
    netWeightGrams: partWeight,
    runnerWeightGrams: runnerWeight,
    shotWeightGrams: shotWeight,
    resinType: String(dbItem.resin_type || dbItem.resinType || dbItem.polymerGrade || fallback?.resinType || ''),
    polymerGrade: String(dbItem.resin_type || dbItem.resinType || dbItem.polymerGrade || fallback?.polymerGrade || ''),
    mfi: String(dbItem.mfi || dbItem.melt_flow_index || fallback?.mfi || ''),
    density: String(dbItem.density || dbItem.specific_density || fallback?.density || ''),
    safetyStock: String(dbItem.safety_stock ?? dbItem.safetyStock ?? fallback?.safetyStock ?? '0'),
    reorderLevel: String(dbItem.reorder_point ?? dbItem.reorder_level ?? dbItem.reorderLevel ?? fallback?.reorderLevel ?? '0'),
    reorderPoint: Number(dbItem.reorder_point ?? dbItem.reorderPoint ?? fallback?.reorderPoint ?? 0),
    minStock: Number(dbItem.min_stock ?? dbItem.minStock ?? fallback?.minStock ?? 0),
    maxStock: Number(dbItem.max_stock ?? dbItem.maxStock ?? fallback?.maxStock ?? 5000),
    leadTime: String(dbItem.leadTime || dbItem.lead_time || fallback?.leadTime || '3 Days'),
    supplier: String(dbItem.supplier || fallback?.supplier || ''),
    standardCost: Number(dbItem.cost ?? dbItem.standard_cost ?? dbItem.standardCost ?? fallback?.standardCost ?? 0),
    cost: Number(dbItem.cost ?? dbItem.standard_cost ?? dbItem.standardCost ?? fallback?.cost ?? 0),
    sellingPrice: Number(dbItem.selling_price ?? dbItem.sellingPrice ?? fallback?.sellingPrice ?? 0),
    valuationMethod: String(dbItem.valuation_method || dbItem.valuationMethod || fallback?.valuationMethod || 'FIFO'),
    moldToolId: String(dbItem.mold_code || dbItem.moldToolId || dbItem.mold_tool_id || fallback?.moldToolId || ''),
    approval: String(dbItem.approval || dbItem.approval_status || fallback?.approval || 'approved') as any,
    status: String(dbItem.status || fallback?.status || 'active') as any,
    lot: Boolean(dbItem.lot ?? fallback?.lot ?? true),
    qc: Boolean(dbItem.qc ?? fallback?.qc ?? true),
    icon: String(dbItem.icon || fallback?.icon || '◇'),
    color: String(dbItem.color || fallback?.color || ''),
    hsnCode: String(dbItem.hsn_code || dbItem.hsnCode || fallback?.hsnCode || ''),
    itemGroup: String(dbItem.item_group || dbItem.itemGroup || fallback?.itemGroup || ''),
    createdOn: dbItem.created_at ? new Date(dbItem.created_at).toISOString().split('T')[0] : (fallback?.createdOn || '2026-09-25'),
  };
}

class ItemService {
  private cache: ItemMaster[] = [];
  private inFlightItems: Promise<ItemMaster[]> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      adminEventBus.on('ITEMS_SYNCED', (event: any) => {
        if (event?.data) {
          const items = Array.isArray(event.data) ? event.data : [event.data];
          items.forEach((item: ItemMaster) => {
            const idx = this.cache.findIndex((i) => i.code === item.code);
            if (idx >= 0) {
              this.cache[idx] = { ...this.cache[idx], ...item };
            } else {
              this.cache.unshift(item);
            }
          });
        }
      });
    }
  }

  public getItemsSync(): ItemMaster[] {
    return this.cache;
  }

  public async getItems(): Promise<ItemMaster[]> {
    if (this.inFlightItems) {
      return this.inFlightItems;
    }

    this.inFlightItems = (async () => {
      // 1. Fetch latest live items directly via DatabaseAdapter (Selective Columns for ultra-low TTFB & bounded limit)
      try {
        const data = await db.findMany<any>('items', {
          select: ITEM_LEAN_SELECT_COLUMNS,
          orderBy: { column: 'created_at', ascending: false },
          limit: 50,
        });

        if (Array.isArray(data) && data.length > 0) {
          const itemsList = data
            .filter((row: any) => row && row.code && !DUMMY_CODES.has(row.code))
            .map((row: any) => mapDbRowToItemMaster(row));

          this.cache = itemsList;
          return this.cache;
        }
      } catch (e) {
        console.debug('[ItemService] db getItems note:', e);
      } finally {
        this.inFlightItems = null;
      }

      return this.cache;
    })();

    return this.inFlightItems;
  }

  public async getItemByCode(code: string): Promise<ItemMaster | undefined> {
    if (!code) return undefined;
    const cleanCode = code.trim();

    try {
      const dto = await itemEndpoints.getItemByCode(cleanCode);
      if (dto) {
        return mapDbRowToItemMaster(dto);
      }
    } catch {}

    return this.cache.find((i) => i.code.toLowerCase() === cleanCode.toLowerCase());
  }

  public async saveItem(item: ItemMaster, actorName: string = 'Master Data Lead'): Promise<ItemMaster> {
    // 1. Persist directly to Supabase Cloud PostgreSQL with Zod validation
    const savedDto = await itemEndpoints.saveItem(item as any);
    const enrichedItem = mapDbRowToItemMaster(savedDto, item);

    // 2. Update Memory Cache
    const existingIdx = this.cache.findIndex((i) => i.code === enrichedItem.code);
    const previousSnapshot = existingIdx >= 0 ? { ...this.cache[existingIdx] } : null;
    const isNew = existingIdx < 0;

    if (existingIdx >= 0) {
      this.cache[existingIdx] = enrichedItem;
    } else {
      this.cache.unshift(enrichedItem);
    }

    // 4. Record Immutable Audit Ledger Entry with exact diff
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

    // 5. Reactive Events & WebSocket Sync Broadcast
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
      await itemEndpoints.saveItem(updated as any);
    } catch (err) {
      console.warn('[itemService.approveItem] Notice:', err);
    }

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
      await itemEndpoints.saveItem(updated as any);
    } catch (err) {
      console.warn('[itemService.rejectItem] Notice:', err);
    }

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
      await itemEndpoints.deleteItem(code);
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
    const liveItems = await this.getItems();

    adminEventBus.emit('CATALOG_RELOADED', liveItems);
    adminEventBus.emit('ITEMS_SYNCED', { data: liveItems });
    broadcastLocalMutation('ITEMS', 'UPDATE', { count: liveItems.length });
    return liveItems;
  }

  public async reloadDocumentCatalog(): Promise<ItemMaster[]> {
    const liveItems = await this.getItems();
    adminEventBus.emit('CATALOG_RELOADED', liveItems);
    return liveItems;
  }

  public clearAll(): void {
    this.cache = [];
  }
}

export const itemService = new ItemService();
