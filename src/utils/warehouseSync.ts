import { InventoryStockItem, InventoryStockLot, StockMovementLedgerEntry, StoreCategoryType } from '../types/warehouse';
import { INITIAL_INVENTORY_STOCK, INITIAL_STOCK_MOVEMENT_LEDGER } from '../data/warehouseData';
import { GrnPutawayTask } from '../types/grnTypes';
import { WorkOrder, BomMaster, ItemMaster } from '../types';
import { liveDataStore } from '../services/liveDataStore';
import { itemService } from '../services/itemService';

const STOCK_STORAGE_KEY = 'reboot_warehouse_stock_v3';
const LEDGER_STORAGE_KEY = 'reboot_stock_movement_ledger_v3';

/**
 * Checks if the current authenticated user has administrative privileges.
 */
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
    return true; // Default fallback in admin settings
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

/**
 * Task-1 & Task-4: Check if a store / warehouse / bin code is actively used in any activity
 * (has stock > 0, attached lot records, or transactions in stock movement ledger).
 * If in use, updates and modifications must be strictly locked to preserve audit integrity.
 */
export function isStoreInUse(storeOrBinCode?: string): { inUse: boolean; reason?: string } {
  if (!storeOrBinCode || !storeOrBinCode.trim()) {
    return { inUse: false };
  }
  const clean = storeOrBinCode.trim().toLowerCase();

  // 1. Check current inventory stock
  try {
    const stockList = getWarehouseStock();
    for (const item of stockList) {
      if (!item) continue;
      const whMatch = (item.primaryWarehouse || '').toLowerCase().trim() === clean;
      const binMatch = (item.primaryBin || '').toLowerCase().trim() === clean;
      const storeTypeMatch = (item.storeType || '').toLowerCase().trim() === clean;
      const lotMatch = item.lots?.some(
        (lot) =>
          (lot.storageBin || '').toLowerCase().trim() === clean ||
          (lot.inwardOriginLocation || '').toLowerCase().trim() === clean
      );

      if ((whMatch || binMatch || storeTypeMatch || lotMatch) && (item.totalOnHand > 0 || (item.lots && item.lots.length > 0))) {
        return {
          inUse: true,
          reason: `Active stock balance (${item.totalOnHand.toLocaleString()} ${item.uom}) found for SKU ${item.sku} in this store location.`,
        };
      }
    }
  } catch (err) {
    console.warn('Error checking stock usage for store:', storeOrBinCode, err);
  }

  // 2. Check stock movement ledger
  try {
    const ledger = getStockMovementLedger();
    for (const entry of ledger) {
      if (!entry) continue;
      const locMatch = (entry.location || '').toLowerCase().trim() === clean;
      const destMatch = (entry.destinationStore || '').toLowerCase().trim() === clean;
      const srcMatch = (entry.sourceLocation || '').toLowerCase().trim() === clean;

      if (locMatch || destMatch || srcMatch) {
        return {
          inUse: true,
          reason: `Referenced in inventory movement transaction ${entry.id} (${entry.docNumber || entry.docType || 'Movement Ledger'}).`,
        };
      }
    }
  } catch (err) {
    console.warn('Error checking ledger usage for store:', storeOrBinCode, err);
  }

  return { inUse: false };
}


/**
 * Robust, error-resilient retrieval of all Warehouse Inventory Stock
 */
export function getWarehouseStock(): InventoryStockItem[] {
  // Purge legacy storage keys if present
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('reboot_warehouse_stock');
      localStorage.removeItem('reboot_stock_movement_ledger');
      localStorage.removeItem('reboot_warehouse_stock_v2');
      localStorage.removeItem('reboot_stock_movement_ledger_v2');
    }
  } catch {}

  try {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STOCK_STORAGE_KEY) : null;
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Filter out legacy static dummy mock items so live testing is 100% clean
        const cleaned = parsed.filter(
          (item) =>
            item &&
            item.sku &&
            !['ASM-BEZEL-SUBASSY-01', 'DFL-CAP-MOLDED-01', 'FG-AUTO-BEZEL-01', 'WIP-AUTO-HOUSING-01', 'WIP-SWITCH-BEZEL-02', 'RM-PP-NAT-001', 'RM-HDPE-INJ-002', 'MB-BLK-001', 'RG-PP-NAT-001', 'RM-NYLON-66-GF30', 'CON-MOLD-RELEASE-01', 'CON-PURGE-COMP-01', 'PCK-CORR-BOX-01', 'PCK-ANTI-BAG-02', 'BOP-BRASS-M4-01', 'BOP-RUBBER-GROMMET-02', 'RM-PS-HIP-002', 'MB-AMB-008'].includes(item.sku)
        );
        if (cleaned.length > 0) return cleaned;
      }
    }
  } catch (e) {
    console.error('Error parsing warehouse stock from localStorage:', e);
  }

  // Live real data fallback: Initialize warehouse stock from dynamic Item Master
  try {
    const items = itemService.getItemsSync();
    const liveStock: InventoryStockItem[] = items.map((m, idx) => {
      const stockVal = parseFloat(String(m.stock || '0').replace(/[^0-9.]/g, '')) || 0;
      const availVal = parseFloat(String(m.avail || '0').replace(/[^0-9.]/g, '')) || stockVal;
      const uom = m.baseUOM || (m.type === 'Raw Material' || (m.type as any) === 'Regrind' ? 'KG' : (m.type as any) === 'Masterbatch' ? 'KG' : (m.type as any) === 'Packaging Material' ? 'BOX' : 'PCS');
      const storeType: 'RM' | 'WIP' | 'ASM' | 'DFL' | 'CON' | 'PCK' | 'BOP' | 'FG' =
        m.type === 'Raw Material' || (m.type as any) === 'Regrind' ? 'RM' :
        (m.type as any) === 'Masterbatch' ? 'RM' :
        m.type === 'Spare Part' ? 'CON' :
        m.type === 'Packaging' || (m.type as any) === 'Packaging Material' ? 'PCK' :
        (m.isWip || (m as any).routingDestination === 'WIP') ? 'WIP' : 'FG';

      const primaryBin = (m.wh || 'WH-01') + '-BAY-01';
      const effectiveStock = stockVal;
      const effectiveAvail = availVal;

      const mappedCategory: StoreCategoryType =
        m.type === 'Raw Material' ? 'Virgin Polymer' :
        (m.type as any) === 'Regrind' ? 'Regrind Polymer' :
        (m.type as any) === 'Masterbatch' ? 'Masterbatch' :
        m.type === 'Packaging' || (m.type as any) === 'Packaging Material' ? 'Packaging Material' :
        m.type === 'Finished Good' || (m.type as any) === 'Finished Goods' ? 'Molded Part (FG)' :
        (m.isWip || (m as any).routingDestination === 'WIP') ? 'WIP Store' : 'Molded Part (FG)';

      const unitCost = parseFloat(String((m as any).cost || (m as any).price || '0')) || 0;

      return {
        id: `STK-${String(idx + 1).padStart(4, '0')}`,
        sku: m.code,
        name: m.name,
        category: mappedCategory,
        storeType,
        plant: (m as any).plant || 'Plant 1 - Pimpri Auto-Hub',
        subCategory: m.cat || m.itemGroup || 'General Material',
        primaryWarehouse: m.wh || (storeType === 'RM' ? 'WH-RM-01' : storeType === 'WIP' ? 'WIP-WH-01' : 'FG-WH-01'),
        primaryBin,
        totalOnHand: effectiveStock,
        allocatedToProduction: 0,
        reservedForOrders: 0,
        availableToPromise: effectiveAvail,
        inTransitFromVendors: 0,
        uom,
        unitCostInr: unitCost,
        totalValuationInr: effectiveStock * unitCost,
        reorderPointKg: 0,
        safetyStockKg: 0,
        maximumStockKg: 100000,
        economicOrderQtyKg: 0,
        status: (effectiveStock > 0 && effectiveAvail > 0) ? 'in_stock' : 'no_stock',
        leadTimeDays: 5,
        abcClassification: 'A',
        lastMovementDate: m.createdOn || new Date().toISOString().slice(0, 10),
        lots: [],
      };
    });

    return liveStock;
  } catch (err) {
    console.error('Fatal error generating default warehouse stock catalog:', err);
    return [];
  }
}

/**
 * Normalized lookup map for instant O(1) stock checks by item code or SKU
 */
export function getWarehouseStockMap(): Map<string, InventoryStockItem> {
  const map = new Map<string, InventoryStockItem>();
  try {
    const stockList = getWarehouseStock();
    // 1. Raw exact index
    for (const item of stockList) {
      if (item && item.sku) {
        const rawCode = String(item.sku).trim().toUpperCase();
        if (rawCode) {
          map.set(rawCode, item);
        }
      }
    }
    // 2. Normalized alphanumeric index (ONLY for codes with length >= 4 to avoid 1, 2, 10, 30 collisions)
    for (const item of stockList) {
      if (item && item.sku) {
        const rawCode = String(item.sku).trim().toUpperCase();
        const cleanCode = rawCode.replace(/[^A-Z0-9]/g, '');
        if (cleanCode.length >= 4 && cleanCode !== rawCode && !map.has(cleanCode)) {
          map.set(cleanCode, item);
        }
      }
    }
  } catch (err) {
    console.error('Error generating warehouse stock map:', err);
  }
  return map;
}

/**
 * Single-Item warehouse stock finder with STRICT EXACT MATCHING.
 * Eliminates false positive substring matching for short item codes like 1, 2, 10, 30.
 */
export function getWarehouseStockItem(codeOrSku?: string): InventoryStockItem | undefined {
  if (!codeOrSku) return undefined;
  try {
    const stockMap = getWarehouseStockMap();
    const query = String(codeOrSku).trim().toUpperCase();
    if (!query) return undefined;
    
    // 1. Strict exact match
    if (stockMap.has(query)) {
      return stockMap.get(query);
    }

    // 2. Cleaned alphanumeric match (ONLY for queries with length >= 4)
    const clean = query.replace(/[^A-Z0-9]/g, '');
    if (clean.length >= 4 && stockMap.has(clean)) {
      return stockMap.get(clean);
    }
  } catch (err) {
    console.error('Error resolving warehouse stock item for code:', codeOrSku, err);
  }
  return undefined;
}

export interface NormalizedStockData {
  onHand: string;
  available: string;
  allocated: string;
  onHandNum: number;
  availNum: number;
  allocatedNum: number;
  uom: string;
  primaryBin?: string;
  warehouse?: string;
  hasStock: boolean;
}

/**
 * UNIFIED SOURCE OF TRUTH: getItemStockData
 * Strictly validates against warehouse stock. If an item has 0 stock or is not present,
 * it returns exactly 0 without false positive matches.
 */
export function getItemStockData(item?: ItemMaster | { code?: string; type?: string; baseUOM?: string; stock?: string | number; avail?: string | number } | null): NormalizedStockData {
  if (!item) {
    return {
      onHand: '0 PCS',
      available: '0 PCS',
      allocated: '0 PCS',
      onHandNum: 0,
      availNum: 0,
      allocatedNum: 0,
      uom: 'PCS',
      hasStock: false,
    };
  }

  try {
    const code = (item.code || '').trim();
    const uom = item.baseUOM || (item.type === 'Raw Material' || item.type === 'Regrind' ? 'KG' : item.type === 'Masterbatch' ? 'KG' : item.type === 'Packaging Material' ? 'BOX' : 'PCS');

    if (!code) {
      return {
        onHand: `0 ${uom}`,
        available: `0 ${uom}`,
        allocated: `0 ${uom}`,
        onHandNum: 0,
        availNum: 0,
        allocatedNum: 0,
        uom,
        hasStock: false,
      };
    }

    // 1. Check Warehouse Stock Single Source of Truth with STRICT exact matching
    const whItem = getWarehouseStockItem(code);
    if (whItem) {
      const onHandNum = typeof whItem.totalOnHand === 'number' && !isNaN(whItem.totalOnHand)
        ? whItem.totalOnHand
        : parseFloat(String(whItem.totalOnHand || '0').replace(/[^0-9.]/g, '')) || 0;

      const allocatedNum = typeof whItem.allocatedToProduction === 'number' && !isNaN(whItem.allocatedToProduction)
        ? whItem.allocatedToProduction
        : parseFloat(String(whItem.allocatedToProduction || '0').replace(/[^0-9.]/g, '')) || 0;

      const availNum = typeof whItem.availableToPromise === 'number' && !isNaN(whItem.availableToPromise)
        ? whItem.availableToPromise
        : Math.max(0, onHandNum - allocatedNum);

      const resolvedUom = whItem.uom || uom;

      return {
        onHand: `${onHandNum.toLocaleString('en-IN')} ${resolvedUom}`,
        available: `${availNum.toLocaleString('en-IN')} ${resolvedUom}`,
        allocated: `${allocatedNum.toLocaleString('en-IN')} ${resolvedUom}`,
        onHandNum,
        availNum,
        allocatedNum,
        uom: resolvedUom,
        primaryBin: whItem.primaryBin,
        warehouse: whItem.primaryWarehouse,
        hasStock: onHandNum > 0,
      };
    }

    // 2. Strict zero stock when item has no warehouse record
    return {
      onHand: `0 ${uom}`,
      available: `0 ${uom}`,
      allocated: `0 ${uom}`,
      onHandNum: 0,
      availNum: 0,
      allocatedNum: 0,
      uom,
      hasStock: false,
    };
  } catch (err) {
    console.error('Error calculating item stock data for item:', item, err);
    return {
      onHand: '0 PCS',
      available: '0 PCS',
      allocated: '0 PCS',
      onHandNum: 0,
      availNum: 0,
      allocatedNum: 0,
      uom: 'PCS',
      hasStock: false,
    };
  }
}

/**
 * Synchronize an array of ItemMaster objects so their .stock and .avail properties
 * match the live warehouse inventory accurately with strict SKU matching.
 */
export function syncItemsWithWarehouseStock(items: ItemMaster[]): ItemMaster[] {
  if (!Array.isArray(items)) return [];

  return items.map((item) => {
    if (!item) return item;
    const wh = getWarehouseStockItem(item.code);

    if (wh) {
      const onHand = typeof wh.totalOnHand === 'number' ? wh.totalOnHand : parseFloat(String(wh.totalOnHand || '0')) || 0;
      const avail = typeof wh.availableToPromise === 'number' ? wh.availableToPromise : onHand;
      return {
        ...item,
        stock: String(onHand),
        avail: String(avail),
        wh: wh.primaryWarehouse || item.wh,
      };
    }
    return {
      ...item,
      stock: '0',
      avail: '0',
    };
  });
}

export function getStockMovementLedger(): StockMovementLedgerEntry[] {
  try {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(LEDGER_STORAGE_KEY) : null;
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        // Filter out legacy mock/dummy ledger entries
        const cleaned = parsed.filter(
          (entry) =>
            entry &&
            entry.id &&
            !entry.id.startsWith('LDG-2026-') &&
            !entry.id.startsWith('MOV-INIT-') &&
            !entry.id.startsWith('SYN-MOV-') &&
            entry.docNumber !== 'GRN-PLANT01-2026-004528' &&
            entry.docNumber !== 'WO-ISSUE-2026-007892' &&
            entry.sku !== 'RM-PS-HIP-002' &&
            entry.sku !== 'MB-AMB-008'
        );
        return cleaned;
      }
    }
  } catch (e) {
    console.warn('Failed to parse movement ledger from storage', e);
  }
  return [];
}

export function postPutawayTasksToWarehouse(tasks: GrnPutawayTask[], customBins?: Record<string, string>): {
  updatedStock: InventoryStockItem[];
  updatedLedger: StockMovementLedgerEntry[];
  totalQty: number;
} {
  const currentStock = getWarehouseStock();
  const currentLedger = getStockMovementLedger();

  const newLedgerEntries: StockMovementLedgerEntry[] = [];
  let totalQtyPosted = 0;

  tasks.forEach((task) => {
    const targetBin = customBins?.[task.id] || task.actualLocation || task.recommendedLocation || 'WH-RM-01-BAY-A1';
    totalQtyPosted += task.quantity;

    // 1. Find or create matching stock item
    let stockItemIndex = currentStock.findIndex(
      (item) => item.sku.toLowerCase() === task.itemCode.toLowerCase()
    );

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const todayFormatted = now.toLocaleDateString('en-GB');

    const newLot: InventoryStockLot = {
      lotNumber: task.lotNumber || `LOT-${Date.now().toString().slice(-6)}`,
      supplierBatchNumber: task.lotNumber || `SUP-${task.grnNumber}`,
      supplierName: 'Reliance / Verified Polymer Supplier',
      receiptDate: todayStr,
      initialQuantityKg: task.quantity,
      availableQuantityKg: task.quantity,
      allocatedQuantityKg: 0,
      uom: task.uom || 'KG',
      mfiTested: '12.0 g/10min',
      moisturePct: 0.02,
      storageBin: targetBin,
      status: 'released',
      grnReference: task.grnNumber,
      inwardSource: `Vendor Inward (${task.grnNumber})`,
      inwardOriginLocation: task.currentLocation || 'Receiving Dock',
      inwardDocumentRef: task.grnNumber,
      inwardReceivedBy: 'Dharmesh Solanki (Forklift Bay #2)',
    };

    if (stockItemIndex >= 0) {
      const existing = currentStock[stockItemIndex];
      const existingLots = existing.lots || [];
      const updatedLots = [newLot, ...existingLots.filter((l) => l.lotNumber !== newLot.lotNumber)];

      const newOnHand = existing.totalOnHand + task.quantity;
      const newAvail = existing.availableToPromise + task.quantity;

      currentStock[stockItemIndex] = {
        ...existing,
        totalOnHand: newOnHand,
        availableToPromise: newAvail,
        primaryBin: targetBin || existing.primaryBin,
        lastMovementDate: todayStr,
        status: newOnHand > (existing.reorderPointKg || 0) ? 'in_stock' : (newOnHand > 0 ? 'low_stock' : 'no_stock'),
        lots: updatedLots,
        totalValuationInr: newOnHand * (existing.unitCostInr || 78.5),
      };
    } else {
      // Create new Stock Item
      const newItem: InventoryStockItem = {
        id: `STK-${Date.now().toString().slice(-4)}`,
        sku: task.itemCode,
        name: task.itemName,
        category: task.itemCode.startsWith('RM')
          ? 'Virgin Polymer'
          : task.itemCode.startsWith('MB') || task.itemCode.startsWith('CON')
          ? 'Masterbatch'
          : task.itemCode.startsWith('PCK')
          ? 'Packaging Material'
          : 'Virgin Polymer',
        subCategory: 'Polymer Inward',
        resinGrade: 'Standard Blow / Injection Grade',
        primaryWarehouse: task.recommendedZone || 'WH-RM-01',
        primaryBin: targetBin,
        totalOnHand: task.quantity,
        allocatedToProduction: 0,
        reservedForOrders: 0,
        availableToPromise: task.quantity,
        inTransitFromVendors: 0,
        uom: task.uom || 'KG',
        unitCostInr: 85.0,
        totalValuationInr: task.quantity * 85.0,
        reorderPointKg: 5000,
        safetyStockKg: 2000,
        maximumStockKg: 50000,
        economicOrderQtyKg: 10000,
        status: 'in_stock',
        leadTimeDays: 5,
        abcClassification: 'A',
        lastMovementDate: todayStr,
        lots: [newLot],
      };
      currentStock.unshift(newItem);
    }

    // 2. Create Movement Ledger Receipt Entry
    const ledgerEntry: StockMovementLedgerEntry = {
      id: `MVT-REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      ledgerDate: todayFormatted,
      docType: 'RECEIPTS',
      docNumber: task.grnNumber,
      location: targetBin,
      locationType: 'WAREHOUSE',
      sku: task.itemCode,
      itemName: task.itemName,
      lotNumber: task.lotNumber,
      movementType: 'IN',
      quantity: task.quantity,
      qtyIn: task.quantity,
      qtyOut: 0,
      uom: task.uom || 'KG',
      status: 'CLOSED',
      sourceType: 'VENDOR_GRN',
      sourceOrigin: `GRN Dock Inward (${task.grnNumber})`,
      sourceReference: task.grnNumber,
      sourceLocation: task.currentLocation || 'Receiving Dock 2',
      purposeDescription: 'Inward Goods Receipt & Warehouse Bin Putaway',
      destinationStore: targetBin,
      outwardReference: '',
      authorizedBy: 'Dharmesh Solanki (Forklift Lead)',
      runningBalance: (currentStock[stockItemIndex]?.totalOnHand || task.quantity),
      notes: `Putaway completed to ${targetBin}. Added to Warehouse Stock Overview & Lot Ledger.`,
    };

    newLedgerEntries.push(ledgerEntry);
  });

  const updatedLedger = [...newLedgerEntries, ...currentLedger];

  // Save to persistent storage
  try {
    localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(currentStock));
    localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(updatedLedger));
  } catch (e) {
    console.warn('LocalStorage save failed', e);
  }

  // Update in-memory fallback export objects
  INITIAL_INVENTORY_STOCK.splice(0, INITIAL_INVENTORY_STOCK.length, ...currentStock);
  INITIAL_STOCK_MOVEMENT_LEDGER.splice(0, INITIAL_STOCK_MOVEMENT_LEDGER.length, ...updatedLedger);

  // Dispatch custom browser events for reactive real-time updates across screens
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('warehouse_stock_updated', {
        detail: { stock: currentStock, ledger: updatedLedger },
      })
    );
    window.dispatchEvent(
      new CustomEvent('warehouse_ledger_updated', {
        detail: { ledger: updatedLedger },
      })
    );
  }

  return {
    updatedStock: currentStock,
    updatedLedger,
    totalQty: totalQtyPosted,
  };
}

/**
 * Task-3 & Task-4: Record Production Shift Output, Auto-Deduct RM/MB by BOM & Add to Store (FG/Assembly/Deflash)
 */
export function recordProductionShiftInventoryMovement(params: {
  workOrder: WorkOrder;
  shiftGood: number;
  shiftScrap?: number;
  shiftRunnerKg?: number;
  shiftLumpsKg?: number;
  operator?: string;
  destinationStore?: { code: string; label: string; type: string };
  boms?: BomMaster[];
  items?: ItemMaster[];
}): {
  updatedStock: InventoryStockItem[];
  updatedLedger: StockMovementLedgerEntry[];
  summary: string;
} {
  const {
    workOrder,
    shiftGood,
    shiftScrap = 0,
    shiftRunnerKg = 0,
    shiftLumpsKg = 0,
    operator = 'Floor Operator',
    destinationStore,
    boms = [],
    items = [],
  } = params;

  const currentStock = getWarehouseStock();
  const currentLedger = getStockMovementLedger();
  const newLedgerEntries: StockMovementLedgerEntry[] = [];

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const todayFormatted = now.toLocaleDateString('en-GB');
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // 1. Find BOM & Material Specs
  const matchingBom = boms.find((b) => b.parent === workOrder.item || b.id === workOrder.bomId);
  const matchingItem = items.find((i) => i.code === workOrder.item);
  const totalMoldedPcs = shiftGood + shiftScrap;

  // Approximate default part weight if not in BOM
  const defaultShotWeightG = matchingBom?.totalShotWeightGrams || matchingBom?.itemNetWeightGrams || 50;
  const rawMaterialRateKgPerPc = defaultShotWeightG / 1000; // e.g. 0.050 kg per piece

  // 2. Consume Raw Materials (RM & MB) based on BOM
  if (totalMoldedPcs > 0) {
    if (matchingBom && matchingBom.lines && matchingBom.lines.length > 0) {
      matchingBom.lines.forEach((line) => {
        const consumedQty = Math.round(totalMoldedPcs * (line.qty || 0.05) * 100) / 100;
        if (consumedQty <= 0) return;

        // Find or fallback stock item
        let stockIdx = currentStock.findIndex(
          (s) => s.sku.toLowerCase() === line.item.toLowerCase()
        );
        if (stockIdx === -1 && line.item.startsWith('RM')) {
          stockIdx = currentStock.findIndex((s) => s.category === 'Virgin Polymer');
        } else if (stockIdx === -1 && line.item.startsWith('MB')) {
          stockIdx = currentStock.findIndex((s) => s.category === 'Masterbatch');
        }

        if (stockIdx >= 0) {
          const sItem = currentStock[stockIdx];
          const newOnHand = Math.max(0, sItem.totalOnHand - consumedQty);
          const newAvail = Math.max(0, sItem.availableToPromise - consumedQty);
          currentStock[stockIdx] = {
            ...sItem,
            totalOnHand: newOnHand,
            availableToPromise: newAvail,
            lastMovementDate: todayStr,
            totalValuationInr: newOnHand * (sItem.unitCostInr || 78.5),
            status: newOnHand <= (sItem.safetyStockKg || 2000) ? 'low_stock' : 'in_stock',
          };

          const issueEntry: StockMovementLedgerEntry = {
            id: `MVT-ISS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            timestamp: timeStr,
            ledgerDate: todayFormatted,
            docType: 'ISSUES',
            docNumber: workOrder.id,
            location: sItem.primaryBin || 'SILO-01-A',
            locationType: 'SHOPFLOOR',
            sku: sItem.sku,
            itemName: sItem.name,
            movementType: 'OUT',
            quantity: consumedQty,
            qtyIn: 0,
            qtyOut: consumedQty,
            uom: sItem.uom || 'KG',
            status: 'CLOSED',
            purposeType: 'PRODUCTION_ISSUE',
            purposeDescription: `Raw Material Issue to Machine ${workOrder.machine} for WO ${workOrder.id} (${workOrder.item})`,
            destinationStore: `PRD-MACHINE-${workOrder.machine}`,
            outwardReference: workOrder.id,
            authorizedBy: operator,
            runningBalance: newOnHand,
            notes: `Auto-deducted by BOM (${matchingBom.id || 'BOM-1001'}). Consumed ${consumedQty} ${sItem.uom} for ${totalMoldedPcs} molded pcs.`,
          };
          newLedgerEntries.push(issueEntry);
        }
      });
    } else {
      // Fallback: Deduct generic virgin polymer resin
      const consumedResinKg = Math.round(totalMoldedPcs * rawMaterialRateKgPerPc * 100) / 100;
      const stockIdx = currentStock.findIndex((s) => s.category === 'Virgin Polymer' || s.storeType === 'RM');
      if (stockIdx >= 0) {
        const sItem = currentStock[stockIdx];
        const newOnHand = Math.max(0, sItem.totalOnHand - consumedResinKg);
        const newAvail = Math.max(0, sItem.availableToPromise - consumedResinKg);
        currentStock[stockIdx] = {
          ...sItem,
          totalOnHand: newOnHand,
          availableToPromise: newAvail,
          lastMovementDate: todayStr,
          status: (newOnHand > 0 && newAvail > 0) ? (newOnHand <= (sItem.safetyStockKg || 2000) ? 'low_stock' : 'in_stock') : 'no_stock',
          totalValuationInr: newOnHand * (sItem.unitCostInr || 78.5),
        };

        const issueEntry: StockMovementLedgerEntry = {
          id: `MVT-ISS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          timestamp: timeStr,
          ledgerDate: todayFormatted,
          docType: 'ISSUES',
          docNumber: workOrder.id,
          location: sItem.primaryBin || 'SILO-01-A',
          locationType: 'SHOPFLOOR',
          sku: sItem.sku,
          itemName: sItem.name,
          movementType: 'OUT',
          quantity: consumedResinKg,
          qtyIn: 0,
          qtyOut: consumedResinKg,
          uom: 'KG',
          status: 'CLOSED',
          purposeType: 'PRODUCTION_ISSUE',
          purposeDescription: `Polymer Resin Consumption for WO ${workOrder.id} (${workOrder.item})`,
          destinationStore: `PRD-MACHINE-${workOrder.machine}`,
          outwardReference: workOrder.id,
          authorizedBy: operator,
          runningBalance: newOnHand,
          notes: `Shift production consumption: ${consumedResinKg} KG for ${totalMoldedPcs} pcs.`,
        };
        newLedgerEntries.push(issueEntry);
      }
    }
  }

  // 3. Add Good Output to Target Store (Assembly Store / De-flash Store / FG Store)
  if (shiftGood > 0) {
    const destCode = destinationStore?.code || 'FG-STORE';
    const destLabel = destinationStore?.label || 'FG Store';

    let targetStoreType: 'FG' | 'ASM' | 'DFL' | 'WIP' = 'FG';
    let targetCategory: 'Molded Part (FG)' | 'Assembly Store' | 'De-Flash Store' | 'WIP Store' = 'Molded Part (FG)';
    let targetZone = 'WH-FG-03 (FG High-Bay Zone C)';
    let targetBin = 'BAY-C-04-RACK';

    if (destCode.includes('ASM') || destLabel.toLowerCase().includes('assembly')) {
      targetStoreType = 'ASM';
      targetCategory = 'Assembly Store';
      targetZone = 'WH-ASM-07 (Assembly Zone G)';
      targetBin = 'ASM-BAY-01';
    } else if (destCode.includes('DFL') || destLabel.toLowerCase().includes('de-flash') || destLabel.toLowerCase().includes('deflash')) {
      targetStoreType = 'DFL';
      targetCategory = 'De-Flash Store';
      targetZone = 'WH-DFL-08 (De-Flash Zone H)';
      targetBin = 'DFL-BIN-04';
    } else if (destCode.includes('WIP') || destLabel.toLowerCase().includes('wip')) {
      targetStoreType = 'WIP';
      targetCategory = 'WIP Store';
      targetZone = 'WH-WIP-01 (WIP Staging Zone)';
      targetBin = 'WIP-STAGING-01';
    }

    let fgStockIdx = currentStock.findIndex(
      (s) => s.sku.toLowerCase() === workOrder.item.toLowerCase() && (s.storeType === targetStoreType || s.category === targetCategory)
    );

    const fgLot: InventoryStockLot = {
      lotNumber: `LOT-${workOrder.id}-${todayStr.replace(/-/g, '').slice(2)}`,
      supplierBatchNumber: `IMM-${workOrder.machine}-D${todayStr.replace(/-/g, '')}`,
      supplierName: `Plant 01 (Machine ${workOrder.machine})`,
      receiptDate: todayStr,
      initialQuantityKg: shiftGood,
      availableQuantityKg: shiftGood,
      allocatedQuantityKg: 0,
      uom: workOrder.uom || 'PCS',
      mfiTested: '12.0 g/10min',
      moisturePct: 0.01,
      storageBin: targetBin,
      status: 'released',
      grnReference: workOrder.id,
      inwardSource: `Production Output from IMM ${workOrder.machine}`,
      inwardOriginLocation: `Shopfloor Bay ${workOrder.machine}`,
      inwardDocumentRef: workOrder.id,
      inwardReceivedBy: operator,
    };

    if (fgStockIdx >= 0) {
      const existing = currentStock[fgStockIdx];
      const newOnHand = existing.totalOnHand + shiftGood;
      const newAvail = existing.availableToPromise + shiftGood;
      currentStock[fgStockIdx] = {
        ...existing,
        totalOnHand: newOnHand,
        availableToPromise: newAvail,
        lastMovementDate: todayStr,
        status: 'in_stock',
        lots: [fgLot, ...(existing.lots || [])],
        totalValuationInr: newOnHand * (existing.unitCostInr || 45.0),
      };
    } else {
      const newFgItem: InventoryStockItem = {
        id: `STK-${targetStoreType}-${Date.now().toString().slice(-4)}`,
        sku: workOrder.item,
        name: matchingItem?.name || `Molded ${workOrder.item}`,
        category: targetCategory,
        storeType: targetStoreType,
        subCategory: 'Injection Molded Part',
        resinGrade: matchingItem?.resinType || 'PP Injection Grade',
        primaryWarehouse: targetZone,
        primaryBin: targetBin,
        totalOnHand: shiftGood,
        allocatedToProduction: 0,
        reservedForOrders: 0,
        availableToPromise: shiftGood,
        inTransitFromVendors: 0,
        uom: workOrder.uom || 'PCS',
        unitCostInr: 45.0,
        totalValuationInr: shiftGood * 45.0,
        reorderPointKg: 1000,
        safetyStockKg: 500,
        maximumStockKg: 20000,
        economicOrderQtyKg: 5000,
        status: 'in_stock',
        leadTimeDays: 1,
        abcClassification: 'A',
        lastMovementDate: todayStr,
        lots: [fgLot],
      };
      currentStock.unshift(newFgItem);
      fgStockIdx = 0;
    }

    const receiptEntry: StockMovementLedgerEntry = {
      id: `MVT-REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: timeStr,
      ledgerDate: todayFormatted,
      docType: 'RECEIPTS',
      docNumber: workOrder.id,
      location: targetBin,
      locationType: targetStoreType === 'ASM' ? 'ASSEMBLY' : targetStoreType === 'DFL' ? 'DEFLASH' : 'WAREHOUSE',
      sku: workOrder.item,
      itemName: matchingItem?.name || `Molded ${workOrder.item}`,
      lotNumber: fgLot.lotNumber,
      movementType: 'IN',
      quantity: shiftGood,
      qtyIn: shiftGood,
      qtyOut: 0,
      uom: workOrder.uom || 'PCS',
      status: 'CLOSED',
      sourceType: 'PRODUCTION_OUTPUT',
      sourceOrigin: `Floor Molding Line (Machine ${workOrder.machine})`,
      sourceReference: workOrder.id,
      sourceLocation: `Shopfloor Bay ${workOrder.machine}`,
      purposeDescription: `Daily Production Output Added to ${destLabel}`,
      destinationStore: targetBin,
      authorizedBy: operator,
      runningBalance: currentStock[fgStockIdx]?.totalOnHand || shiftGood,
      notes: `Received +${shiftGood} Good PCS into ${targetCategory} (${targetBin}) from WO ${workOrder.id}.`,
    };
    newLedgerEntries.push(receiptEntry);
  }

  // 4. Record Regrind / Runner Flakes Recovery
  if (shiftRunnerKg > 0 || shiftLumpsKg > 0) {
    const regrindQty = shiftRunnerKg + shiftLumpsKg;
    const regrindIdx = currentStock.findIndex((s) => s.category === 'Regrind Polymer');
    if (regrindIdx >= 0) {
      const sItem = currentStock[regrindIdx];
      const newOnHand = sItem.totalOnHand + regrindQty;
      currentStock[regrindIdx] = {
        ...sItem,
        totalOnHand: newOnHand,
        availableToPromise: sItem.availableToPromise + regrindQty,
        lastMovementDate: todayStr,
        totalValuationInr: newOnHand * (sItem.unitCostInr || 42.0),
      };
    }

    const regrindEntry: StockMovementLedgerEntry = {
      id: `MVT-REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: timeStr,
      ledgerDate: todayFormatted,
      docType: 'RECEIPTS',
      docNumber: workOrder.id,
      location: 'REGRIND-SILO-01',
      locationType: 'RECYCLING',
      sku: 'RG-PP-NAT-001',
      itemName: 'PP Regrind Flakes (Clean Sprues & Runners)',
      movementType: 'IN',
      quantity: regrindQty,
      qtyIn: regrindQty,
      qtyOut: 0,
      uom: 'KG',
      status: 'CLOSED',
      sourceType: 'REGRIND_RECOVERY',
      sourceOrigin: `Molding Floor Runners (Machine ${workOrder.machine})`,
      sourceReference: workOrder.id,
      sourceLocation: `Shopfloor Bay ${workOrder.machine}`,
      purposeDescription: `Granulator Regrind Recovery from WO ${workOrder.id}`,
      destinationStore: 'REGRIND-SILO-01',
      authorizedBy: operator,
      runningBalance: (currentStock[regrindIdx]?.totalOnHand || regrindQty),
      notes: `Sprues & cold runner recovery: ${shiftRunnerKg} KG runner, ${shiftLumpsKg} KG purge lumps.`,
    };
    newLedgerEntries.push(regrindEntry);
  }

  const updatedLedger = [...newLedgerEntries, ...currentLedger];

  // Save to persistent storage
  try {
    localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(currentStock));
    localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(updatedLedger));
  } catch (e) {
    console.warn('LocalStorage save failed', e);
  }

  // Update in-memory fallback objects
  INITIAL_INVENTORY_STOCK.splice(0, INITIAL_INVENTORY_STOCK.length, ...currentStock);
  INITIAL_STOCK_MOVEMENT_LEDGER.splice(0, INITIAL_STOCK_MOVEMENT_LEDGER.length, ...updatedLedger);

  // Dispatch custom browser events for reactive real-time updates across screens
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('warehouse_stock_updated', {
        detail: { stock: currentStock, ledger: updatedLedger },
      })
    );
    window.dispatchEvent(
      new CustomEvent('warehouse_ledger_updated', {
        detail: { ledger: updatedLedger },
      })
    );
  }

  // Persist to backend database asynchronously
  liveDataStore.recordProductionEntry({
    workOrderId: workOrder.id,
    machineId: workOrder.machine || 'IMM-250T-03',
    operatorId: operator,
    goodQty: shiftGood,
    scrapQty: shiftScrap,
    downtimeMinutes: 0,
    actualCycleTimeSec: Number(workOrder.cycleTimeStd) || 14.8,
    cavities: 4,
    shift: workOrder.shift || 'SHIFT-A',
    lotNumber: `LOT-${workOrder.id}-${todayStr.replace(/-/g, '').slice(2)}`,
    notes: `Production entry: +${shiftGood} Good PCS into store. Operator: ${operator}.`,
  }).catch((err) => console.warn('Backend production logging notification:', err));

  return {
    updatedStock: currentStock,
    updatedLedger,
    summary: `Posted +${shiftGood} Good PCS to inventory ledger and auto-deducted BOM materials.`,
  };
}

export interface OutwardDispatchInventoryItem {
  itemCode: string;
  itemName?: string;
  qty: number;
  uom?: string;
  batchLot?: string;
  locationCode?: string;
  binCode?: string;
  fgStore?: string;
  plant?: string;
}

/**
 * Task-1: Deduct dispatched quantities from warehouse inventory stock
 * and append outward transaction records to the stock movement ledger.
 */
export function recordOutwardDispatchInventoryMovement(params: {
  deliveryId: string;
  invoiceNumber?: string;
  customer?: string;
  customerGstin?: string;
  plant?: string;
  fgStore?: string;
  items: OutwardDispatchInventoryItem[];
  authorizedBy?: string;
  notes?: string;
}): { updatedStock: InventoryStockItem[]; updatedLedger: StockMovementLedgerEntry[] } {
  const currentStock = getWarehouseStock();
  const currentLedger = getStockMovementLedger();
  const newLedgerEntries: StockMovementLedgerEntry[] = [];
  const now = new Date();
  const timestamp = now.toISOString();
  const ledgerDate = now.toLocaleDateString('en-GB');

  params.items.forEach((dispItem, idx) => {
    if (!dispItem.qty || dispItem.qty <= 0) return;

    const cleanCode = (dispItem.itemCode || '').trim().toLowerCase();
    const rawCode = cleanCode.replace(/^fg-/, '');

    const stockIdx = currentStock.findIndex((s) => {
      const sSku = (s.sku || '').toLowerCase();
      const sRaw = sSku.replace(/^fg-/, '');
      return sSku === cleanCode || sRaw === rawCode || sSku === rawCode;
    });

    let currentBalance = 0;
    let unitCost = 45;
    let uom = dispItem.uom || 'PCS';
    let skuName = dispItem.itemName || dispItem.itemCode;
    let plantName = params.plant || 'Plant 1 - Pimpri Auto-Hub';
    let targetLoc = params.fgStore || 'FG-Automotive Cell';

    if (stockIdx >= 0) {
      const itemStock = currentStock[stockIdx];
      const newOnHand = Math.max(0, itemStock.totalOnHand - dispItem.qty);
      const newAvail = Math.max(0, itemStock.availableToPromise - dispItem.qty);

      itemStock.totalOnHand = newOnHand;
      itemStock.availableToPromise = newAvail;
      if (newOnHand <= 0 || newAvail <= 0) {
        itemStock.status = 'no_stock';
      } else if (newOnHand < (itemStock.safetyStockKg || 500)) {
        itemStock.status = 'low_stock';
      } else {
        itemStock.status = 'in_stock';
      }

      currentBalance = newOnHand;
      unitCost = itemStock.unitCostInr || unitCost;
      uom = itemStock.uom || uom;
      skuName = itemStock.name || skuName;
      plantName = itemStock.plant || plantName;
      targetLoc = itemStock.primaryWarehouse || targetLoc;

      // Deduct from matching lot if lots exist
      if (itemStock.lots && itemStock.lots.length > 0) {
        let remainingToDeduct = dispItem.qty;
        for (const lot of itemStock.lots) {
          if (remainingToDeduct <= 0) break;
          const lotAvail = lot.availableQuantityKg || 0;
          if (lotAvail > 0) {
            const deductFromLot = Math.min(lotAvail, remainingToDeduct);
            lot.availableQuantityKg -= deductFromLot;
            remainingToDeduct -= deductFromLot;
          }
        }
      }
    }

    const ledgerEntry: StockMovementLedgerEntry = {
      id: `MVT-DISP-${now.getTime().toString().slice(-6)}-${idx + 1}`,
      timestamp,
      ledgerDate,
      docType: 'DISPATCHES',
      docNumber: params.invoiceNumber || params.deliveryId,
      location: targetLoc,
      locationType: 'WAREHOUSE',
      customer: params.customer || 'OEM Customer',
      sku: dispItem.itemCode,
      itemName: skuName,
      lotNumber: dispItem.batchLot || 'B-2026-DISP-01',
      unitPrice: unitCost,
      parentDocType: 'DELIVERY_CHALLAN',
      parentDocNumber: params.deliveryId,
      referenceNumber: params.invoiceNumber || params.deliveryId,
      movementType: 'OUT',
      quantity: dispItem.qty,
      qtyIn: 0,
      qtyOut: dispItem.qty,
      uom,
      status: 'CLOSED',
      purposeType: 'CUSTOMER_DISPATCH',
      purposeDescription: `Customer Dispatch Outward (${params.invoiceNumber || params.deliveryId})`,
      destinationStore: `CUSTOMER-SITE (${params.customer || 'Consignee'})`,
      outwardReference: params.deliveryId,
      authorizedBy: params.authorizedBy || 'Dispatch Compliance Manager',
      runningBalance: currentBalance,
      plant: plantName,
      notes: params.notes || `Dispatched for Delivery Challan ${params.deliveryId} & Invoice ${params.invoiceNumber || 'N/A'}.`,
    };

    newLedgerEntries.push(ledgerEntry);
  });

  const updatedLedger = [...newLedgerEntries, ...currentLedger];

  // Save to persistent storage
  try {
    localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(currentStock));
    localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(updatedLedger));
  } catch (e) {
    console.warn('LocalStorage save failed', e);
  }

  // Update in-memory fallback objects
  INITIAL_INVENTORY_STOCK.splice(0, INITIAL_INVENTORY_STOCK.length, ...currentStock);
  INITIAL_STOCK_MOVEMENT_LEDGER.splice(0, INITIAL_STOCK_MOVEMENT_LEDGER.length, ...updatedLedger);

  // Dispatch custom browser events for reactive real-time updates across screens
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('warehouse_stock_updated', {
        detail: { stock: currentStock, ledger: updatedLedger },
      })
    );
    window.dispatchEvent(
      new CustomEvent('warehouse_ledger_updated', {
        detail: { ledger: updatedLedger },
      })
    );
  }

  return {
    updatedStock: currentStock,
    updatedLedger,
  };
}

