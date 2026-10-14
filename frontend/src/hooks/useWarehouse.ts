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
        reason: `Active stock balance (${(item.totalOnHand || 0).toLocaleString()} ${item.uom || 'units'}) found for SKU ${item.sku || (item as any).itemCode} in this store location.`,
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
    (s) => String(s?.sku || '').toUpperCase() === clean || String((s as any)?.itemCode || '').toUpperCase() === clean
  );
}

export function getItemStockData(itemOrCode: string | any): {
  totalStock: number;
  allocated: number;
  available: number;
  onHand: number;
  onHandNum: number;
  availNum: number;
} {
  const code = typeof itemOrCode === 'string' ? itemOrCode : itemOrCode?.code || itemOrCode?.id || itemOrCode?.sku || '';
  const stock = getWarehouseStockItem(code);
  const totalStock = stock
    ? Number(stock.totalOnHand || 0)
    : typeof itemOrCode === 'object'
    ? parseFloat(String(itemOrCode?.stock || 0)) || 0
    : 0;
  const allocated = stock ? Number(stock.allocatedToProduction || 0) : 0;
  const available = stock
    ? Math.max(0, Number(stock.availableToPromise != null ? stock.availableToPromise : totalStock - allocated))
    : typeof itemOrCode === 'object'
    ? parseFloat(String(itemOrCode?.avail || totalStock)) || 0
    : totalStock;

  return {
    totalStock,
    allocated,
    available,
    onHand: totalStock,
    onHandNum: totalStock,
    availNum: available,
  };
}

export function syncItemsWithWarehouseStock(items: ItemMaster[]): ItemMaster[] {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    if (!item) return item;
    const stockInfo = getItemStockData(item.code);
    return {
      ...item,
      stock: String(stockInfo.totalStock),
      avail: String(stockInfo.available),
    };
  });
}

export function postPutawayTasksToWarehouse(tasks: GrnPutawayTask[], user?: any): boolean {
  if (!tasks || tasks.length === 0) return false;
  const now = new Date().toISOString();
  const userName = user?.name || user?.username || 'Quality/Warehouse Operator';

  for (const task of tasks) {
    const existing = inMemoryStock.find((s) => (s as any).itemCode === (task as any).itemCode || s.sku === (task as any).itemCode);
    const qty = Number((task as any).acceptedQty || (task as any).receivedQty || (task as any).quantity || 0);
    if (qty <= 0) continue;

    const newLot: InventoryStockLot = {
      lotNumber: (task as any).lotNumber || `LOT-${Date.now().toString().slice(-4)}`,
      supplierBatchNumber: (task as any).batchNumber || 'SUP-BATCH-01',
      supplierName: (task as any).supplierName || (task as any).supplier || 'Primary Supplier',
      receiptDate: now.split('T')[0],
      initialQuantityKg: qty,
      availableQuantityKg: qty,
      allocatedQuantityKg: 0,
      uom: (task as any).uom || 'KG',
      mfiTested: '12.5 g/10min',
      moisturePct: 0.02,
      storageBin: (task as any).targetBin || (task as any).binLocation || 'BIN-GEN-01',
      status: 'released',
      grnReference: (task as any).grnNumber || `GRN-${Date.now().toString().slice(-4)}`,
      expiryDate: (task as any).expiryDate || '2027-12-31',
      inwardOriginLocation: (task as any).targetWarehouse || 'RM-STORE-01',
    };

    if (existing) {
      existing.totalOnHand = (existing.totalOnHand || 0) + qty;
      existing.availableToPromise = (existing.availableToPromise || 0) + qty;
      existing.lots = [newLot, ...(existing.lots || [])];
      db.upsert('warehouse_stock', existing).catch(console.warn);
    } else {
      const newItem: InventoryStockItem = {
        id: `STK-${(task as any).itemCode || (task as any).sku || Date.now()}`,
        sku: (task as any).itemCode || (task as any).sku || 'SKU-GEN',
        name: (task as any).itemName || (task as any).name || (task as any).itemCode || 'Material',
        category: 'Virgin Polymer',
        storeType: 'RM',
        primaryWarehouse: (task as any).targetWarehouse || 'RM-STORE-01',
        primaryBin: (task as any).targetBin || (task as any).binLocation || 'BIN-GEN-01',
        subCategory: 'Standard Polymer',
        uom: (task as any).uom || 'KG',
        totalOnHand: qty,
        allocatedToProduction: 0,
        reservedForOrders: 0,
        availableToPromise: qty,
        inTransitFromVendors: 0,
        unitCostInr: 120,
        totalValuationInr: qty * 120,
        reorderPointKg: 200,
        safetyStockKg: 100,
        maximumStockKg: 5000,
        economicOrderQtyKg: 1000,
        status: 'in_stock',
        leadTimeDays: 7,
        abcClassification: 'A',
        lots: [newLot],
        lastMovementDate: now.split('T')[0],
      };
      inMemoryStock.unshift(newItem);
      db.upsert('warehouse_stock', newItem).catch(console.warn);
    }

    const ledgerEntry: StockMovementLedgerEntry = {
      id: `SML-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: now,
      ledgerDate: now.split('T')[0],
      sku: (task as any).itemCode || (task as any).sku || '',
      itemName: (task as any).itemName || (task as any).itemCode || 'Material Inward',
      movementType: 'IN',
      docType: 'RECEIPTS',
      docNumber: (task as any).grnNumber || 'GRN-MANUAL',
      location: (task as any).targetBin || 'BIN-GEN-01',
      locationType: 'WAREHOUSE',
      quantity: qty,
      qtyIn: qty,
      qtyOut: 0,
      uom: (task as any).uom || 'KG',
      status: 'CLOSED',
      sourceLocation: 'RECEIVING_DOCK',
      destinationStore: (task as any).targetWarehouse || 'RM-STORE-01',
      lotNumber: (task as any).lotNumber || 'LOT-INWARD',
      authorizedBy: userName,
      runningBalance: qty,
    };
    inMemoryLedger.unshift(ledgerEntry);
    db.upsert('stock_movement_ledger', ledgerEntry).catch(console.warn);
  }
  return true;
}

export function recordOutwardDispatchInventoryMovement(challan: any, customer?: any, _items: ItemMaster[] = []): boolean {
  if (!challan) return false;
  const now = new Date().toISOString();
  const challanItems = Array.isArray(challan.items) ? challan.items : [];

  for (const ci of challanItems) {
    const itemCode = ci.itemCode || ci.item || ci.sku || '';
    const qty = Number(ci.dispatchQty || ci.quantity || 0);
    if (!itemCode || qty <= 0) continue;

    const stock = inMemoryStock.find((s) => (s as any).itemCode === itemCode || s.sku === itemCode);
    if (stock) {
      stock.totalOnHand = Math.max(0, (stock.totalOnHand || 0) - qty);
      stock.availableToPromise = Math.max(0, (stock.availableToPromise || 0) - qty);
      db.upsert('warehouse_stock', stock).catch(console.warn);
    }

    const ledgerEntry: StockMovementLedgerEntry = {
      id: `SML-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: now,
      ledgerDate: now.split('T')[0],
      sku: itemCode,
      itemName: ci.itemName || itemCode,
      movementType: 'OUT',
      docType: 'DISPATCHES',
      docNumber: challan.challanNumber || challan.id || 'DC-MANUAL',
      location: 'BAY-DISPATCH-01',
      locationType: 'DOCK',
      quantity: qty,
      qtyIn: 0,
      qtyOut: qty,
      uom: ci.uom || 'PCS',
      status: 'CLOSED',
      sourceLocation: 'FG-STORE-01',
      destinationStore: customer?.name || 'Customer Delivery',
      lotNumber: ci.lotNumber || 'LOT-DISPATCH',
      authorizedBy: challan.createdBy || 'Dispatch Officer',
      runningBalance: stock ? stock.totalOnHand : 0,
    };
    inMemoryLedger.unshift(ledgerEntry);
    db.upsert('stock_movement_ledger', ledgerEntry).catch(console.warn);
  }
  return true;
}

export function recordProductionShiftInventoryMovement(params: {
  workOrder: WorkOrder;
  bom?: BomMaster | null;
  boms?: BomMaster[];
  items?: ItemMaster[];
  goodQty?: number;
  shiftGood?: number;
  scrapQty?: number;
  shiftScrap?: number;
  runnerKg?: number;
  shiftRunnerKg?: number;
  lumpsKg?: number;
  shiftLumpsKg?: number;
  shift?: string;
  operator?: string;
  destinationStore?: string | any;
}): boolean {
  const { workOrder, operator = 'Operator', shift = 'Shift A' } = params;
  const effectiveGood = Number(params.goodQty ?? params.shiftGood ?? 0);
  if (!workOrder || effectiveGood <= 0) return false;
  const now = new Date().toISOString();
  const fgItemCode = workOrder.item || (workOrder as any).itemCode;

  const stock = inMemoryStock.find((s) => (s as any).itemCode === fgItemCode || s.sku === fgItemCode);
  if (stock) {
    stock.totalOnHand = (stock.totalOnHand || 0) + effectiveGood;
    stock.availableToPromise = (stock.availableToPromise || 0) + effectiveGood;
    db.upsert('warehouse_stock', stock).catch(console.warn);
  }

  const ledgerEntry: StockMovementLedgerEntry = {
    id: `SML-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: now,
    ledgerDate: now.split('T')[0],
    sku: fgItemCode,
    itemName: (workOrder as any).itemName || fgItemCode,
    movementType: 'IN',
    docType: 'RECEIPTS',
    docNumber: workOrder.id,
    location: 'BIN-FG-01',
    locationType: 'WAREHOUSE',
    quantity: effectiveGood,
    qtyIn: effectiveGood,
    qtyOut: 0,
    uom: workOrder.uom || 'PCS',
    status: 'CLOSED',
    sourceLocation: workOrder.machine || 'SHOP_FLOOR',
    destinationStore: params.destinationStore ? (typeof params.destinationStore === 'string' ? params.destinationStore : (params.destinationStore as any)?.code || (params.destinationStore as any)?.label) : 'FG-STORE-01',
    lotNumber: (workOrder as any).lotNumber || `LOT-PROD-${Date.now().toString().slice(-4)}`,
    authorizedBy: `${operator} (Shift ${shift})`,
    runningBalance: stock ? stock.totalOnHand : effectiveGood,
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
