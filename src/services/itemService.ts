import { ItemMaster } from '../types';
import { db } from '../shared/db';
import { itemEndpoints, ITEM_LEAN_SELECT_COLUMNS } from '../lib/api-client';
import { adminEventBus } from './adminService';
import { broadcastLocalMutation } from './realtime/supabaseRealtime';
import { masterDataGovernanceService } from './masterDataGovernanceService';
import { mapDbRowToItemMaster } from '../shared/utils/dtoMappers';

// Stale dummy codes to filter out
const DUMMY_CODES = new Set([
  'RM-PP-NAT-001',
  'RM-HD-GRN-014',
  'MB-BLK-003',
  'FG-BMP-NEXON-F',
  'FG-BEZEL-AC-4C',
  'RES-PP-COPO-01',
]);

/**
 * ItemService — Clean Enterprise Gateway Facade
 * Connects directly to vendor-agnostic db adapter and itemEndpoints.
 * TanStack Query serves as the Single Source of Truth (SSOT) cache.
 */
class ItemService {
  /**
   * Synchronous fallback getter for legacy components
   */
  public getItemsSync(): ItemMaster[] {
    return [];
  }

  /**
   * Fetch live item master records directly via DatabaseAdapter (db)
   */
  public async getItems(): Promise<ItemMaster[]> {
    try {
      const data = await db.findMany<any>('items', {
        select: ITEM_LEAN_SELECT_COLUMNS,
        orderBy: { column: 'created_at', ascending: false },
        limit: 100,
      });

      if (Array.isArray(data) && data.length > 0) {
        return data
          .filter((row: any) => row && row.code && !DUMMY_CODES.has(row.code))
          .map((row: any) => mapDbRowToItemMaster(row));
      }
    } catch (e) {
      console.debug('[ItemService] db getItems note:', e);
    }
    return [];
  }

  /**
   * Fetch single item by code via DatabaseAdapter (db)
   */
  public async getItemByCode(code: string): Promise<ItemMaster | undefined> {
    if (!code) return undefined;
    const cleanCode = code.trim();

    try {
      const dto = await itemEndpoints.getItemByCode(cleanCode);
      if (dto) {
        return mapDbRowToItemMaster(dto);
      }
    } catch (e) {
      console.debug('[ItemService] getItemByCode note:', e);
    }
    return undefined;
  }

  /**
   * Persist item record directly via itemEndpoints and DatabaseAdapter (db)
   */
  public async saveItem(item: ItemMaster, actorName: string = 'Master Data Lead'): Promise<ItemMaster> {
    const isNew = !item.id && !item.createdOn;

    // 1. Persist directly via Database Gateway with Zod validation
    const savedDto = await itemEndpoints.saveItem(item as any);
    const enrichedItem = mapDbRowToItemMaster(savedDto, item);

    // 2. Record Immutable Audit Ledger Entry
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
    });

    // 3. Reactive Events & WebSocket Sync Broadcast
    adminEventBus.emit('ITEM_SAVED', enrichedItem);
    broadcastLocalMutation('ITEMS', isNew ? 'INSERT' : 'UPDATE', enrichedItem);
    return enrichedItem;
  }

  /**
   * Approve item and release to production
   */
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

  /**
   * Reject item
   */
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

  /**
   * Delete item by code
   */
  public async deleteItem(code: string, actorName: string = 'Admin'): Promise<boolean> {
    try {
      await itemEndpoints.deleteItem(code);
    } catch {}

    masterDataGovernanceService.recordAudit({
      entityType: 'ITEM_MASTER',
      entityCode: code,
      entityName: code,
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
    // No-op for SSOT TanStack Query
  }
}

export const itemService = new ItemService();
