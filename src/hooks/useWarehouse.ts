import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../shared/queryKeys';
import { apiClient } from '../services/api';
import { db } from '../shared/db';
import { InventoryStockItem, InventoryStockLot, StockMovementLedgerEntry, StoreCategoryType } from '../types/warehouse';
import { INITIAL_INVENTORY_STOCK, INITIAL_STOCK_MOVEMENT_LEDGER } from '../data/warehouseData';
import { GrnPutawayTask } from '../types/grnTypes';
import { WorkOrder, BomMaster, ItemMaster } from '../types';
import { broadcastLocalMutation } from '../services/realtime/supabaseRealtime';

export interface StockItem {
  id: string;
  itemCode: string;
  itemName: string;
  binLocation: string;
  quantityOnHand: number;
  allocatedQuantity: number;
  availableQuantity: number;
  uom: string;
  lotNumber?: string;
  status: 'AVAILABLE' | 'RESERVED' | 'QUARANTINE' | 'DAMAGED';
}

export interface StockTransfer {
  id: string;
  transferNumber: string;
  sourceWarehouse: string;
  targetWarehouse: string;
  itemCode: string;
  quantity: number;
  status: 'DRAFT' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
  transferredAt?: string;
}

// In-memory runtime cache for synchronous operations
let inMemoryStock: InventoryStockItem[] = [...INITIAL_INVENTORY_STOCK];
let inMemoryLedger: StockMovementLedgerEntry[] = [...INITIAL_STOCK_MOVEMENT_LEDGER];

export function isUserAdmin(user?: any): boolean {
  if (!user) {
    try {
      const session = localStorage.getItem('reboot_auth_session') || localStorage.getItem('reboot_current_user');
      if (session) {
        const u = JSON.parse(session);
        if (u && (u.roleType === 'admin' || (u.role && u.role.toLowerCase().includes('admin')) || u.role === 'Super Administrator')) {
          return true;
        }
      }
    } catch {}
    return true;
  }
  const role = String(user.role || '').toLowerCase();
  const roleType = String(user.roleType || '').toLowerCase();
  return (
    roleType === 'admin' ||
    role.includes('admin') ||
    role.includes('super administrator') ||
    role.includes('director')
  );
}

export function isStoreInUse(storeOrBinCode?: string): { inUse: boolean; reason?: string } {
  if (!storeOrBinCode || typeof storeOrBinCode !== 'string' || !storeOrBinCode.trim()) {
    return { inUse: false };
  }
  const clean = String(storeOrBinCode).trim().toLowerCase();

  for (const item of inMemoryStock) {
    if (!item) continue;
    const whMatch = String(item.primaryWarehouse || '').toLowerCase().trim() === clean;
    const binMatch = String(item.primaryBin || '').toLowerCase().trim() === clean;
    const storeTypeMatch = String(item.storeType || '').toLowerCase().trim() === clean;
    const lotMatch = item.lots?.some(
      (lot) =>
        String(lot?.storageBin || '').toLowerCase().trim() === clean ||
        String(lot?.inwardOriginLocation || '').toLowerCase().trim() === clean
    );

    if ((whMatch || binMatch || storeTypeMatch || lotMatch) && (Number(item.totalOnHand || 0) > 0 || (item.lots && item.lots.length > 0))) {
      return {
        inUse: true,
        reason: `Active stock balance (${(item.totalOnHand || 0).toLocaleString()} ${item.uom || 'units'}) found for SKU ${item.sku || item.itemCode} in this store location.`,
      };
    }
  }

  for (const entry of inMemoryLedger) {
    if (!entry) continue;
    const locMatch = String(entry.location || '').toLowerCase().trim() === clean;
    const destMatch = String(entry.destinationStore || '').toLowerCase().trim() === clean;
    const srcMatch = String(entry.sourceLocation || '').toLowerCase().trim() === clean;

    if (locMatch || destMatch || srcMatch) {
      return {
        inUse: true,
        reason: `Referenced in inventory movement transaction ${entry.id} (${entry.docNumber || entry.docType || 'Movement Ledger'}).`,
      };
    }
  }

  return { inUse: false };
}

export function getWarehouseStock(): InventoryStockItem[] {
  return inMemoryStock;
}

export function getStockMovementLedger(): StockMovementLedgerEntry[] {
  return inMemoryLedger;
}

export function getWarehouseStockItem(itemCodeOrSku: string): InventoryStockItem | undefined {
  if (!itemCodeOrSku) return undefined;
  const clean = String(itemCodeOrSku).trim().toUpperCase();
  return inMemoryStock.find(
    (s) => String(s?.sku || '').toUpperCase() === clean || String(s?.itemCode || '').toUpperCase() === clean
  );
}

export function getItemStockData(itemCode: string): { totalStock: number; allocated: number; available: number } {
  const stock = getWarehouseStockItem(itemCode);
  if (!stock) return { totalStock: 0, allocated: 0, available: 0 };
  const totalStock = Number(stock.totalOnHand || 0);
  const allocated = Number(stock.allocated || 0);
  const available = Math.max(0, Number(stock.available != null ? stock.available : totalStock - allocated));
  return { totalStock, allocated, available };
}

export function syncItemsWithWarehouseStock(items: ItemMaster[]): ItemMaster[] {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    if (!item) return item;
    const stockInfo = getItemStockData(item.code);
    return {
      ...item,
      stock: stockInfo.totalStock,
      avail: stockInfo.available,
    };
  });
}

export function postPutawayTasksToWarehouse(tasks: GrnPutawayTask[], user?: any): boolean {
  if (!tasks || tasks.length === 0) return false;
  const now = new Date().toISOString();
  const userName = user?.name || user?.username || 'Quality/Warehouse Operator';

  for (const task of tasks) {
    const existing = inMemoryStock.find((s) => s.itemCode === task.itemCode || s.sku === task.itemCode);
    const qty = Number(task.acceptedQty || 0);
    if (qty <= 0) continue;

    const newLot: InventoryStockLot = {
      lotNumber: task.lotNumber || `LOT-${Date.now().toString().slice(-4)}`,
      quantity: qty,
      availableQty: qty,
      receivedDate: now.split('T')[0],
      expiryDate: task.expiryDate || '2027-12-31',
      qcStatus: 'Approved',
      storageBin: task.targetBin || 'BIN-GEN-01',
      inwardOriginLocation: task.targetWarehouse || 'RM-STORE-01',
      supplierName: task.supplierName || 'Primary Supplier',
      grnNumber: task.grnNumber || `GRN-${Date.now().toString().slice(-4)}`,
    };

    if (existing) {
      existing.totalOnHand = (existing.totalOnHand || 0) + qty;
      existing.available = (existing.available || 0) + qty;
      existing.lots = [newLot, ...(existing.lots || [])];
      db.upsert('warehouse_stock', existing).catch(console.warn);
    } else {
      const newItem: InventoryStockItem = {
        id: `STK-${task.itemCode}-${Date.now().toString().slice(-4)}`,
        itemCode: task.itemCode,
        sku: task.itemCode,
        description: task.itemName || task.itemCode,
        category: (task as any).category || 'RAW_MATERIAL',
        storeType: (task.targetWarehouse as StoreCategoryType) || 'RAW_MATERIALS_STORE',
        primaryWarehouse: task.targetWarehouse || 'RM-STORE-01',
        primaryBin: task.targetBin || 'BIN-GEN-01',
        uom: task.uom || 'KG',
        totalOnHand: qty,
        allocated: 0,
        available: qty,
        quarantine: 0,
        safetyStock: 100,
        reorderPoint: 200,
        lots: [newLot],
      };
      inMemoryStock.unshift(newItem);
      db.upsert('warehouse_stock', newItem).catch(console.warn);
    }

    const ledgerEntry: StockMovementLedgerEntry = {
      id: `SML-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: now,
      itemCode: task.itemCode,
      itemName: task.itemName || task.itemCode,
      movementType: 'INWARD_RECEIPT',
      quantity: qty,
      uom: task.uom || 'KG',
      sourceLocation: 'RECEIVING_DOCK',
      destinationStore: task.targetWarehouse || 'RM-STORE-01',
      location: task.targetBin || 'BIN-GEN-01',
      lotNumber: task.lotNumber || 'LOT-INWARD',
      docType: 'GRN',
      docNumber: task.grnNumber || 'GRN-MANUAL',
      operator: userName,
      reason: 'GRN Putaway confirmation into warehouse stock',
    };
    inMemoryLedger.unshift(ledgerEntry);
    db.upsert('stock_movement_ledger', ledgerEntry).catch(console.warn);
  }
  return true;
}

export function recordOutwardDispatchInventoryMovement(challan: any, customer?: any, items: ItemMaster[] = []): boolean {
  if (!challan) return false;
  const now = new Date().toISOString();
  const challanItems = Array.isArray(challan.items) ? challan.items : [];

  for (const ci of challanItems) {
    const itemCode = ci.itemCode || ci.item || '';
    const qty = Number(ci.dispatchQty || ci.quantity || 0);
    if (!itemCode || qty <= 0) continue;

    const stock = inMemoryStock.find((s) => s.itemCode === itemCode || s.sku === itemCode);
    if (stock) {
      stock.totalOnHand = Math.max(0, (stock.totalOnHand || 0) - qty);
      stock.available = Math.max(0, (stock.available || 0) - qty);
      db.upsert('warehouse_stock', stock).catch(console.warn);
    }

    const ledgerEntry: StockMovementLedgerEntry = {
      id: `SML-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: now,
      itemCode,
      itemName: ci.itemName || itemCode,
      movementType: 'OUTWARD_DISPATCH',
      quantity: qty,
      uom: ci.uom || 'PCS',
      sourceLocation: 'FG-STORE-01',
      destinationStore: customer?.name || 'Customer Delivery',
      location: 'BAY-DISPATCH-01',
      lotNumber: ci.lotNumber || 'LOT-DISPATCH',
      docType: 'DELIVERY_CHALLAN',
      docNumber: challan.challanNumber || challan.id || 'DC-MANUAL',
      operator: challan.createdBy || 'Dispatch Officer',
      reason: `Customer shipment for Order ${challan.orderNumber || 'SO-DIRECT'}`,
    };
    inMemoryLedger.unshift(ledgerEntry);
    db.upsert('stock_movement_ledger', ledgerEntry).catch(console.warn);
  }
  return true;
}

export function recordProductionShiftInventoryMovement(params: {
  workOrder: WorkOrder;
  bom?: BomMaster | null;
  items: ItemMaster[];
  goodQty: number;
  scrapQty: number;
  runnerKg: number;
  lumpsKg: number;
  shift: string;
  operator: string;
}): boolean {
  const { workOrder, goodQty, operator, shift } = params;
  if (!workOrder || goodQty <= 0) return false;
  const now = new Date().toISOString();
  const fgItemCode = workOrder.item || (workOrder as any).itemCode;

  const stock = inMemoryStock.find((s) => s.itemCode === fgItemCode || s.sku === fgItemCode);
  if (stock) {
    stock.totalOnHand = (stock.totalOnHand || 0) + goodQty;
    stock.available = (stock.available || 0) + goodQty;
    db.upsert('warehouse_stock', stock).catch(console.warn);
  }

  const ledgerEntry: StockMovementLedgerEntry = {
    id: `SML-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: now,
    itemCode: fgItemCode,
    itemName: (workOrder as any).itemName || fgItemCode,
    movementType: 'PRODUCTION_RECEIPT',
    quantity: goodQty,
    uom: workOrder.uom || 'PCS',
    sourceLocation: workOrder.machine || 'SHOP_FLOOR',
    destinationStore: 'FG-STORE-01',
    location: 'BIN-FG-01',
    lotNumber: (workOrder as any).lotNumber || `LOT-PROD-${Date.now().toString().slice(-4)}`,
    docType: 'WORK_ORDER',
    docNumber: workOrder.id,
    operator: `${operator} (Shift ${shift})`,
    reason: `Production floor completed batch for WO ${workOrder.id}`,
  };
  inMemoryLedger.unshift(ledgerEntry);
  db.upsert('stock_movement_ledger', ledgerEntry).catch(console.warn);
  return true;
}

// ============================================================================
// TANSTACK REACT QUERY V5 HOOKS (SSOT)
// ============================================================================

export function useWarehouseStock() {
  return useQuery<InventoryStockItem[]>({
    queryKey: queryKeys.warehouse.stock(),
    queryFn: async () => {
      try {
        const data = await db.findMany<InventoryStockItem>('warehouse_stock');
        if (data && data.length > 0) {
          inMemoryStock = data;
          return data;
        }
      } catch (e) {
        console.debug('[useWarehouseStock] db fetch notice:', e);
      }
      return inMemoryStock;
    },
    staleTime: 1000 * 30,
  });
}

export function useWarehouseMovementLedger() {
  return useQuery<StockMovementLedgerEntry[]>({
    queryKey: queryKeys.warehouse.stockLedger(),
    queryFn: async () => {
      try {
        const data = await db.findMany<StockMovementLedgerEntry>('stock_movement_ledger', {
          orderBy: { column: 'timestamp', ascending: false },
          limit: 100,
        });
        if (data && data.length > 0) {
          inMemoryLedger = data;
          return data;
        }
      } catch (e) {
        console.debug('[useWarehouseMovementLedger] notice:', e);
      }
      return inMemoryLedger;
    },
    staleTime: 1000 * 30,
  });
}

export function useSaveWarehouseStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: InventoryStockItem) => {
      await db.upsert('warehouse_stock', item, 'id');
      const idx = inMemoryStock.findIndex((s) => s.id === item.id);
      if (idx >= 0) inMemoryStock[idx] = item;
      else inMemoryStock.unshift(item);
      return item;
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.warehouse.stock() });
      broadcastLocalMutation('WAREHOUSE_STOCK', 'UPDATE', saved);
    },
  });
}

export function useStockLedger(filter?: Record<string, any>) {
  return useQuery({
    queryKey: queryKeys.warehouse.stockLedger(filter),
    queryFn: async () => {
      try {
        const data = await db.findMany<InventoryStockItem>('warehouse_stock');
        if (data && data.length > 0) return data;
      } catch {}
      return inMemoryStock;
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useWarehouseBins() {
  return useQuery({
    queryKey: queryKeys.warehouse.bins(),
    queryFn: async () => {
      try {
        const response = await apiClient.get<any[]>('/api/v1/warehouse/bins');
        return response.data || [];
      } catch {
        return [];
      }
    },
  });
}

export function useStockTransfers() {
  return useQuery({
    queryKey: queryKeys.warehouse.transfers(),
    queryFn: async () => {
      try {
        const response = await apiClient.get<StockTransfer[]>('/api/v1/warehouse/transfers');
        return response.data || [];
      } catch {
        return [];
      }
    },
  });
}

export function useSaveStockTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (transfer: Partial<StockTransfer>) => {
      try {
        if (transfer.id) {
          const response = await apiClient.put<StockTransfer>(`/api/v1/warehouse/transfers/${transfer.id}`, transfer);
          return response.data;
        }
        const response = await apiClient.post<StockTransfer>('/api/v1/warehouse/transfers', transfer);
        return response.data;
      } catch {
        return transfer as StockTransfer;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.warehouse.transfers() });
      queryClient.invalidateQueries({ queryKey: queryKeys.warehouse.stockLedger() });
    },
  });
}

export function useQuarantineLots() {
  return useQuery({
    queryKey: queryKeys.warehouse.quarantine(),
    queryFn: async () => {
      try {
        const response = await apiClient.get<any[]>('/api/v1/warehouse/quarantine');
        return response.data || [];
      } catch {
        return [];
      }
    },
  });
}
