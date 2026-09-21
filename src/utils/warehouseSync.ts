import { InventoryStockItem, InventoryStockLot, StockMovementLedgerEntry } from '../types/warehouse';
import { INITIAL_INVENTORY_STOCK, INITIAL_STOCK_MOVEMENT_LEDGER } from '../data/warehouseData';
import { GrnPutawayTask } from '../types/grnTypes';

const STOCK_STORAGE_KEY = 'reboot_warehouse_stock';
const LEDGER_STORAGE_KEY = 'reboot_stock_movement_ledger';

export function getWarehouseStock(): InventoryStockItem[] {
  try {
    const stored = localStorage.getItem(STOCK_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse warehouse stock from storage', e);
  }
  return [...INITIAL_INVENTORY_STOCK];
}

export function getStockMovementLedger(): StockMovementLedgerEntry[] {
  try {
    const stored = localStorage.getItem(LEDGER_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse movement ledger from storage', e);
  }
  return [...INITIAL_STOCK_MOVEMENT_LEDGER];
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
        status: newOnHand > (existing.reorderPointKg || 0) ? 'in_stock' : existing.status,
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
