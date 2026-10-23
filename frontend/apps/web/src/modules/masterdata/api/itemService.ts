import { ItemMaster } from '@/src/types';
import { api } from '@/src/lib/api-client';
import { adminEventBus } from '@/src/services/adminService';
import { broadcastLocalMutation } from '@/src/services/realtime/realtimeService';
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

/**
 * ItemService — Clean 2-Layer Enterprise Gateway Facade
 * Connects directly to REST API (Zero DTO mappers, zero intermediate API files).
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
   * Rule 2: Fetch live item master records with bounded limit
   */
  public async getItems(limit: number = 50): Promise<ItemMaster[]> {
    try {
      const res = await api.get<any>('/items', { params: { limit } });
      const envelope = res?.data !== undefined ? res.data : res;
      const items = Array.isArray(envelope?.data) ? envelope.data : Array.isArray(envelope) ? envelope : [];
      return items.filter((item: any) => item && item.code && !DUMMY_CODES.has(item.code));
    } catch (e) {
      console.debug('[ItemService] REST getItems note:', e);
    }
    return [];
  }

  /**
   * Fetch single item by code directly via REST API
   */
  public async getItemByCode(code: string): Promise<ItemMaster | undefined> {
    if (!code) return undefined;
    try {
      const res = await api.get<any>(`/items/${encodeURIComponent(code.trim())}`);
      return res?.data?.data ?? res?.data;
    } catch (e) {
      console.debug('[ItemService] getItemByCode note:', e);
    }
    return undefined;
  }

  /**
   * Persist item record directly via REST API
   */
  public async saveItem(item: ItemMaster, actorName: string = 'Master Data Lead'): Promise<ItemMaster> {
    const isNew = !item.id && !item.createdOn;

    let enrichedItem: ItemMaster;
    if (item.id) {
      const res = await api.patch<any>(`/items/${encodeURIComponent(item.id)}`, item);
      enrichedItem = res?.data?.data ?? res?.data;
    } else {
      const res = await api.post<any>('/items', item);
      enrichedItem = res?.data?.data ?? res?.data;
    }

    // Record Immutable Audit Ledger Entry
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

    // Reactive Events & WebSocket Sync Broadcast
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
    const payload = {
      ...item,
      approval: 'approved',
      status: 'active',
      approvedBy: reviewerName,
      comment,
      version: item.version,
    };
    const target = item.id || item.code;
    const res = await api.patch<any>(`/items/${encodeURIComponent(target)}`, payload);
    const updated = res?.data?.data ?? res?.data;

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
    const payload = {
      ...item,
      approval: 'rejected',
      rejectedReason: reason,
      version: item.version,
    };
    const target = item.id || item.code;
    const res = await api.patch<any>(`/items/${encodeURIComponent(target)}`, payload);
    const updated = res?.data?.data ?? res?.data;

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
    await api.delete(`/items/${encodeURIComponent(code)}`);

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
