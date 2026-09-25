import { InventoryStockItem, InventoryStockLot, StockMovementLedgerEntry } from '../types/warehouse';
import { INITIAL_INVENTORY_STOCK, INITIAL_STOCK_MOVEMENT_LEDGER } from '../data/warehouseData';
import { GrnPutawayTask } from '../types/grnTypes';
import { WorkOrder, BomMaster, ItemMaster } from '../types';

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
        currentStock[stockIdx] = {
          ...sItem,
          totalOnHand: newOnHand,
          availableToPromise: Math.max(0, sItem.availableToPromise - consumedResinKg),
          lastMovementDate: todayStr,
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

  return {
    updatedStock: currentStock,
    updatedLedger,
    summary: `Posted +${shiftGood} Good PCS to inventory ledger and auto-deducted BOM materials.`,
  };
}
