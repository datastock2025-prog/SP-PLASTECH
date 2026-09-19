import * as XLSX from 'xlsx';
import { ItemMaster, MachineMaster, BomMaster, BomLine, WorkOrder } from '../../../types';
import { MoldMaster } from '../../../data/manufacturingData';
import {
  PlannedMachineJob,
  ExplodedMaterialRequirement,
  MaterialCategory,
  StoreInventoryNode,
} from './jitTypes';

/**
 * Returns plant-tailored default connected stores.
 * If plant is PLANT-01 -> defaults to PRD-UNIT-1 (RM, MB, PK, FG)
 * If plant is PLANT-02 -> defaults to PRD-UNIT-2 (RM, MB, PK, FG)
 */
export function getPlantConnectedStores(plantId: string = 'PLANT-01'): StoreInventoryNode[] {
  const isPlant2 = plantId.toUpperCase().includes('02') || plantId.toUpperCase().includes('2');
  const unitCode = isPlant2 ? 'PRD-UNIT-2' : 'PRD-UNIT-1';
  const unitLabel = isPlant2 ? 'Plant 02 (Unit 2)' : 'Plant 01 (Unit 1)';

  return [
    {
      id: `store-${unitCode.toLowerCase()}`,
      code: unitCode,
      name: `${unitCode} — Unified Production & Raw Materials Store`,
      type: 'RM',
      description: `Unified shop floor & materials store for ${unitLabel}. All material categories (Resins, Masterbatch, Packaging, Inserts, WIP) managed here.`,
      zone: 'Main Floor & Production Storage Bay',
      plantId: isPlant2 ? 'PLANT-02' : 'PLANT-01',
      isCustom: false,
    },
  ];
}

// Initial connected stores list fallback
export const DEFAULT_CONNECTED_STORES: StoreInventoryNode[] = getPlantConnectedStores('PLANT-01');

/**
 * Calculates Expected Finish Date & Time based on plan date and planned hours.
 */
export function calculateExpectedFinish(
  planDate: string,
  plannedHours: number,
  shift: string = 'Shift A'
): { expectedFinishDate: string; expectedFinishTime: string; displayText: string } {
  const baseDate = planDate ? new Date(planDate) : new Date();
  
  let startHour = 6;
  if (shift.includes('Shift B')) startHour = 14;
  else if (shift.includes('Shift C')) startHour = 22;
  else if (shift.includes('Full Day')) startHour = 6;

  baseDate.setHours(startHour, 0, 0, 0);

  const totalMillis = plannedHours * 3600 * 1000;
  const finishDate = new Date(baseDate.getTime() + totalMillis);

  const yyyy = finishDate.getFullYear();
  const mm = String(finishDate.getMonth() + 1).padStart(2, '0');
  const dd = String(finishDate.getDate()).padStart(2, '0');
  const finishDateStr = `${yyyy}-${mm}-${dd}`;

  const hours = String(finishDate.getHours()).padStart(2, '0');
  const minutes = String(finishDate.getMinutes()).padStart(2, '0');
  const finishTimeStr = `${hours}:${minutes}`;

  const isNextDay = finishDateStr !== planDate;
  const displayText = `${finishDateStr} ${finishTimeStr}${isNextDay ? ' (+1 day)' : ''}`;

  return {
    expectedFinishDate: finishDateStr,
    expectedFinishTime: finishTimeStr,
    displayText,
  };
}

/**
 * Parses numeric stock from strings like "12,400 KG" or "22,000 PCS" or pure numbers
 */
export function parseStockNumber(val: string | number | undefined | null): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return val;
  const cleaned = val.replace(/,/g, '').trim();
  const match = cleaned.match(/^([0-9.]+)/);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  return isNaN(num) ? 0 : num;
}

/**
 * Calculates pieces produced given machine hours, cycle time, cavities, and operational efficiency
 */
export function calculatePcsFromHours(
  hours: number,
  cycleTimeSec: number,
  cavities: number,
  efficiencyPct: number = 95
): number {
  if (hours <= 0 || cycleTimeSec <= 0 || cavities <= 0) return 0;
  const totalSeconds = hours * 3600;
  const effectiveSeconds = totalSeconds * (Math.max(10, Math.min(100, efficiencyPct)) / 100);
  const shots = Math.floor(effectiveSeconds / cycleTimeSec);
  return shots * cavities;
}

/**
 * Calculates required machine run hours given target pieces, cycle time, cavities, and efficiency
 */
export function calculateHoursFromPcs(
  pcs: number,
  cycleTimeSec: number,
  cavities: number,
  efficiencyPct: number = 95
): number {
  if (pcs <= 0 || cycleTimeSec <= 0 || cavities <= 0) return 0;
  const shots = Math.ceil(pcs / cavities);
  const totalSeconds = shots * cycleTimeSec;
  const efficiency = Math.max(10, Math.min(100, efficiencyPct)) / 100;
  const requiredSeconds = totalSeconds / efficiency;
  const hours = requiredSeconds / 3600;
  return Number(hours.toFixed(2));
}

/**
 * Categorize a BOM material line into RM, MB, INSERT, or PCK, connecting to plant-specific store
 */
export function categorizeBomLine(
  line: BomLine,
  item?: ItemMaster,
  plantId: string = 'PLANT-01'
): {
  cat: MaterialCategory;
  label: 'Raw Material (Resin)' | 'Masterbatch (Colorant)' | 'Insert / Hardware' | 'Packaging Material' | 'Other Auxiliary';
  defaultStore: string;
} {
  const isPlant2 = plantId.toUpperCase().includes('02') || plantId.toUpperCase().includes('2');
  const unitCode = isPlant2 ? 'PRD-UNIT-2' : 'PRD-UNIT-1';

  const itemType = item?.type || '';
  const itemCode = (line.item || '').toUpperCase();
  const itemName = (line.name || '').toUpperCase();

  if (
    itemType === 'Masterbatch' ||
    itemType === 'Colorant' ||
    itemCode.startsWith('MB-') ||
    itemName.includes('MASTERBATCH') ||
    itemName.includes('PIGMENT') ||
    itemName.includes('COLOR')
  ) {
    return { cat: 'MB', label: 'Masterbatch (Colorant)', defaultStore: unitCode };
  }

  if (
    itemType === 'Packaging' ||
    itemType === 'Packaging Material' ||
    itemCode.startsWith('PK-') ||
    itemName.includes('CARTON') ||
    itemName.includes('BOX') ||
    itemName.includes('POLYBAG') ||
    itemName.includes('BAG') ||
    itemName.includes('PALLET')
  ) {
    return { cat: 'PCK', label: 'Packaging Material', defaultStore: unitCode };
  }

  if (
    itemCode.startsWith('INS-') ||
    itemCode.startsWith('SCR-') ||
    itemCode.startsWith('SP-') ||
    itemName.includes('INSERT') ||
    itemName.includes('THREAD') ||
    itemName.includes('BRASS') ||
    itemName.includes('CLIP') ||
    itemName.includes('FASTENER')
  ) {
    return { cat: 'INSERT', label: 'Insert / Hardware', defaultStore: unitCode };
  }

  // Default to Raw Material / Resin under unified plant store
  return { cat: 'RM', label: 'Raw Material (Resin)', defaultStore: unitCode };
}

/**
 * Generates an intelligent synthetic recipe for items without a defined BOM
 */
export function getSyntheticRecipeForPart(item: ItemMaster): BomLine[] {
  const isPallet = item.code.includes('PAL') || item.name.toLowerCase().includes('pallet');
  const isBucket = item.code.includes('BKT') || item.name.toLowerCase().includes('bucket');
  const isPreform = item.code.includes('PRF') || item.name.toLowerCase().includes('preform');

  if (isPallet) {
    return [
      { item: 'RM-HD-GRN-014', name: 'HDPE Granules Injection Grade', qty: 7.8, uom: 'KG', scrap: 2, cost: 600 },
      { item: 'RG-PP-011', name: 'Recycled Regrind PP', qty: 1.2, uom: 'KG', scrap: 2, cost: 95 },
      { item: 'MB-BLK-003', name: 'Black Masterbatch 2%', qty: 0.18, uom: 'KG', scrap: 1, cost: 25 },
      { item: 'PK-CTN-021', name: 'Heavy Duty Stretch Film & Top Cover', qty: 0.05, uom: 'ROLL', scrap: 0, cost: 12 },
    ];
  }

  if (isBucket) {
    return [
      { item: 'RM-PP-NAT-001', name: 'PP Natural Granules', qty: 0.72, uom: 'KG', scrap: 1.5, cost: 56 },
      { item: 'MB-RED-004', name: 'Red Masterbatch 2%', qty: 0.015, uom: 'KG', scrap: 1, cost: 4.5 },
      { item: 'SP-INS-001', name: 'Steel Wire Handle with Grip (Insert)', qty: 1.0, uom: 'NOS', scrap: 0.5, cost: 14 },
      { item: 'PK-CTN-021', name: 'Corrugated Master Carton (Holds 10 Buckets)', qty: 0.1, uom: 'NOS', scrap: 1, cost: 8 },
    ];
  }

  if (isPreform) {
    return [
      { item: 'RM-PET-001', name: 'PET Resin Bottle Grade', qty: 0.02, uom: 'KG', scrap: 1.0, cost: 2.2 },
      { item: 'MB-BLU-001', name: 'Cyan Blue Masterbatch', qty: 0.0004, uom: 'KG', scrap: 0.5, cost: 0.2 },
      { item: 'PK-BOX-002', name: 'Preform Octabin Corrugated Liner', qty: 0.0002, uom: 'NOS', scrap: 0, cost: 0.1 },
    ];
  }

  // Generic 500ml container or part
  return [
    { item: 'RM-PP-NAT-001', name: 'PP Natural Granules (Virgin)', qty: 0.485, uom: 'KG', scrap: 2, cost: 38 },
    { item: 'MB-WHT-002', name: 'White Masterbatch (Food Grade)', qty: 0.012, uom: 'KG', scrap: 1, cost: 5.2 },
    { item: 'PK-CTN-021', name: 'Export Carton Box 500ml (Holds 50 Pcs)', qty: 0.02, uom: 'NOS', scrap: 0.5, cost: 1.5 },
  ];
}

/**
 * Explodes material requirements for all scheduled jobs under the plan
 */
export function explodePlanRequirements(
  jobs: PlannedMachineJob[],
  boms: BomMaster[],
  items: ItemMaster[],
  stores: StoreInventoryNode[] = DEFAULT_CONNECTED_STORES
): ExplodedMaterialRequirement[] {
  const itemMap = new Map<string, ItemMaster>(items.map((i) => [i.code, i]));
  const bomMap = new Map<string, BomMaster>(boms.map((b) => [b.parent, b]));
  const storeMap = new Map<string, StoreInventoryNode>(stores.map((s) => [s.code, s]));

  const aggregatedMap = new Map<string, ExplodedMaterialRequirement>();

  for (const job of jobs) {
    if (!job.itemCode || job.calculatedPcs <= 0) continue;

    // Use linked BOM if specified, or parent item match
    let bom: BomMaster | undefined;
    if (job.bomId) {
      bom = boms.find((b) => b.id === job.bomId);
    }
    if (!bom) {
      bom = bomMap.get(job.itemCode);
    }

    const item = itemMap.get(job.itemCode);
    const lines = (bom && bom.lines && bom.lines.length > 0) ? bom.lines : (item ? getSyntheticRecipeForPart(item) : []);

    for (const line of lines) {
      const matCode = line.item;
      const matItem = itemMap.get(matCode);
      const catInfo = categorizeBomLine(line, matItem, job.plant);

      const scrapFactor = 1 + (line.scrap || 0) / 100;
      const singlePcReq = (line.qty || 0) * scrapFactor;
      const jobMatReq = singlePcReq * job.calculatedPcs;

      const existing = aggregatedMap.get(matCode);
      if (existing) {
        existing.requiredQty += jobMatReq;
        existing.sourceJobs.push({
          machineId: job.machineId,
          itemCode: job.itemCode,
          producedPcs: job.calculatedPcs,
          allocatedQty: jobMatReq,
        });
      } else {
        const available = matItem ? parseStockNumber(matItem.avail || matItem.stock) : 0;
        const storeCode = matItem?.wh || catInfo.defaultStore;
        const storeObj = storeMap.get(storeCode);
        const storeLocation = storeObj ? `${storeObj.code} (${storeObj.name})` : storeCode;

        aggregatedMap.set(matCode, {
          materialCode: matCode,
          materialName: line.name || matItem?.name || matCode,
          category: catInfo.cat,
          categoryLabel: catInfo.label,
          uom: line.uom || matItem?.baseUOM || 'KG',
          requiredQty: jobMatReq,
          ratePerPc: singlePcReq,
          scrapPct: line.scrap || 0,
          sourceJobs: [
            {
              machineId: job.machineId,
              itemCode: job.itemCode,
              producedPcs: job.calculatedPcs,
              allocatedQty: jobMatReq,
            },
          ],
          storeLocation,
          availableStock: available,
          shortageQty: 0,
          feasibility: 'Sufficient',
        });
      }
    }
  }

  // Calculate final feasibility and shortages
  const result: ExplodedMaterialRequirement[] = [];

  aggregatedMap.forEach((req) => {
    req.requiredQty = Number(req.requiredQty.toFixed(3));
    req.ratePerPc = Number(req.ratePerPc.toFixed(4));

    if (req.availableStock < req.requiredQty) {
      req.shortageQty = Number((req.requiredQty - req.availableStock).toFixed(3));
      req.feasibility = 'Critical_Shortage';
    } else if (req.availableStock < req.requiredQty * 1.15) {
      req.shortageQty = 0;
      req.feasibility = 'Tight_Buffer';
    } else {
      req.shortageQty = 0;
      req.feasibility = 'Sufficient';
    }

    result.push(req);
  });

  return result.sort((a, b) => {
    const order = { RM: 1, MB: 2, INSERT: 3, PCK: 4, OTHER: 5 };
    return (order[a.category] || 99) - (order[b.category] || 99);
  });
}

/**
 * Consolidated Material Requirement (CMR) Matrix Model matching reference Screenshot 4
 */
export interface ConsolidatedMatrixRow {
  siNo: number;
  description: string;
  stockCode: string;
  uom: string;
  machineDemands: Record<string, number>; // machineId / shortCode -> qty
  total: number;
}

export interface ConsolidatedMatrixResult {
  scheduleNumber: string;
  planDate: string;
  machines: Array<{ id: string; shortCode: string; name: string }>;
  rows: ConsolidatedMatrixRow[];
  columnTotals: Record<string, number>; // machineId -> total kg/nos
  grandTotal: number;
}

/**
 * Builds the Consolidated Material Requirement Matrix (matching Screenshot 4)
 */
export function buildConsolidatedMaterialMatrix(
  jobs: PlannedMachineJob[],
  boms: BomMaster[],
  items: ItemMaster[],
  machines: MachineMaster[],
  scheduleNumber: string = 'SCH-20260920-01',
  planDate: string = '2026-09-20'
): ConsolidatedMatrixResult {
  const itemMap = new Map<string, ItemMaster>(items.map((i) => [i.code, i]));
  const bomMap = new Map<string, BomMaster>(boms.map((b) => [b.parent, b]));

  // Scheduled machine IDs
  const scheduledMachineIds = Array.from(new Set(jobs.map((j) => j.machineId))).sort();

  // Short codes for machines (e.g. IMM-250T-03 -> S-03)
  const machineMetaList = scheduledMachineIds.map((mId) => {
    const mObj = machines.find((m) => m.id === mId);
    let shortCode = mId;
    const match = mId.match(/(\d+)/g);
    if (match && match.length > 0) {
      const lastDigits = match[match.length - 1];
      shortCode = `S-${lastDigits.padStart(2, '0')}`;
    }
    return {
      id: mId,
      shortCode,
      name: mObj?.name || mId,
    };
  });

  // Map of materialKey -> Map of machineId -> qty
  const materialMap = new Map<
    string,
    {
      description: string;
      stockCode: string;
      uom: string;
      machineDemands: Record<string, number>;
    }
  >();

  for (const job of jobs) {
    if (!job.itemCode || job.calculatedPcs <= 0) continue;

    let bom: BomMaster | undefined;
    if (job.bomId) {
      bom = boms.find((b) => b.id === job.bomId);
    }
    if (!bom) {
      bom = bomMap.get(job.itemCode);
    }

    const item = itemMap.get(job.itemCode);
    const lines = (bom && bom.lines && bom.lines.length > 0) ? bom.lines : (item ? getSyntheticRecipeForPart(item) : []);

    for (const line of lines) {
      const matCode = line.item;
      const matItem = itemMap.get(matCode);
      const scrapFactor = 1 + (line.scrap || 0) / 100;
      const qty = (line.qty || 0) * scrapFactor * job.calculatedPcs;
      const uom = line.uom || matItem?.baseUOM || 'KGS';
      const desc = line.name || matItem?.name || matCode;

      if (!materialMap.has(matCode)) {
        materialMap.set(matCode, {
          description: desc,
          stockCode: matCode,
          uom: uom.toUpperCase() === 'KG' ? 'KGS' : uom.toUpperCase() === 'PCS' ? 'NOS' : uom,
          machineDemands: {},
        });
      }

      const matEntry = materialMap.get(matCode)!;
      matEntry.machineDemands[job.machineId] = (matEntry.machineDemands[job.machineId] || 0) + qty;
    }
  }

  // Convert to formatted rows
  const rows: ConsolidatedMatrixRow[] = [];
  const columnTotals: Record<string, number> = {};
  let grandTotal = 0;

  // Initialize column totals
  for (const m of machineMetaList) {
    columnTotals[m.id] = 0;
  }

  let siNo = 1;
  materialMap.forEach((entry, matCode) => {
    let rowTotal = 0;
    const cleanDemands: Record<string, number> = {};

    for (const m of machineMetaList) {
      const val = entry.machineDemands[m.id] || 0;
      if (val > 0) {
        const roundedVal = Number(val.toFixed(4));
        cleanDemands[m.id] = roundedVal;
        rowTotal += roundedVal;
        columnTotals[m.id] = Number(((columnTotals[m.id] || 0) + roundedVal).toFixed(4));
      }
    }

    rowTotal = Number(rowTotal.toFixed(4));
    grandTotal = Number((grandTotal + rowTotal).toFixed(4));

    rows.push({
      siNo: siNo++,
      description: entry.description,
      stockCode: entry.stockCode,
      uom: entry.uom,
      machineDemands: cleanDemands,
      total: rowTotal,
    });
  });

  return {
    scheduleNumber,
    planDate,
    machines: machineMetaList,
    rows,
    columnTotals,
    grandTotal,
  };
}

/**
 * Exports Consolidated Material Matrix to Excel (.xlsx)
 */
export function exportConsolidatedMatrixToExcel(matrix: ConsolidatedMatrixResult) {
  const excelRows = matrix.rows.map((r) => {
    const rowObj: Record<string, any> = {
      'SI. NO': r.siNo,
      'Description': r.description,
      'Stock Code': r.stockCode,
      'UOM': r.uom,
    };

    for (const m of matrix.machines) {
      rowObj[`${m.shortCode} (${m.id})`] = r.machineDemands[m.id] || '';
    }

    rowObj['Total'] = r.total;
    return rowObj;
  });

  // Summary row
  const summaryObj: Record<string, any> = {
    'SI. NO': '',
    'Description': 'TOTAL',
    'Stock Code': '',
    'UOM': '',
  };

  for (const m of matrix.machines) {
    summaryObj[`${m.shortCode} (${m.id})`] = matrix.columnTotals[m.id] || 0;
  }
  summaryObj['Total'] = matrix.grandTotal;
  excelRows.push(summaryObj);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(excelRows);
  XLSX.utils.book_append_sheet(wb, ws, 'Consolidated Material Req');

  const fileName = `Consolidated_Material_Req_${matrix.scheduleNumber}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Exports a single Machine Job & BOM specs to Excel (.xlsx)
 */
export function exportSingleJobToExcel(
  job: PlannedMachineJob,
  boms: BomMaster[],
  items: ItemMaster[],
  stores: StoreInventoryNode[] = DEFAULT_CONNECTED_STORES
) {
  const itemMap = new Map<string, ItemMaster>(items.map((i) => [i.code, i]));
  const item = itemMap.get(job.itemCode);
  const bom = job.bomId ? boms.find((b) => b.id === job.bomId) : boms.find((b) => b.parent === job.itemCode);
  const lines = (bom && bom.lines && bom.lines.length > 0) ? bom.lines : (item ? getSyntheticRecipeForPart(item) : []);

  const jobMeta = [
    { Property: 'Work Order ID', Value: job.workOrderId || `WO-JIT-${job.machineId}` },
    { Property: 'Production Date', Value: job.planDate },
    { Property: 'Injection Machine', Value: `${job.machineId} (${job.plant || 'PLANT-01'})` },
    { Property: 'Target Item', Value: `${job.itemCode} - ${job.itemName}` },
    { Property: 'Linked BOM', Value: bom ? `${bom.id} (${bom.version || 'v2.1'})` : 'Standard Recipe' },
    { Property: 'Mold Tooling', Value: `${job.moldName} (${job.cavities} Cav)` },
    { Property: 'Cycle Time (sec)', Value: job.cycleTimeSec },
    { Property: 'Planned Hours', Value: `${job.plannedHours} hrs (${job.shift})` },
    { Property: 'Target Output', Value: `${job.calculatedPcs} PCS` },
    { Property: 'Operator', Value: job.operator || 'Not assigned' },
    { Property: 'Priority', Value: job.priority },
    { Property: 'Expected Finish', Value: job.expectedFinishDate || job.planDate },
    { Property: 'Status', Value: job.status },
  ];

  const materialRows = lines.map((l) => {
    const matItem = itemMap.get(l.item);
    const cat = categorizeBomLine(l, matItem, job.plant);
    const scrapFactor = 1 + (l.scrap || 0) / 100;
    const reqQty = Number(((l.qty || 0) * scrapFactor * job.calculatedPcs).toFixed(3));
    const avail = matItem ? parseStockNumber(matItem.avail || matItem.stock) : 0;

    return {
      'Category': cat.label,
      'Material Code': l.item,
      'Description': l.name || matItem?.name || l.item,
      'Dosage / PC': l.qty,
      'Scrap %': l.scrap || 0,
      'Total Required': reqQty,
      'UOM': l.uom || 'KG',
      'Assigned Store': cat.defaultStore,
      'Available Stock': avail,
      'Feasibility': avail >= reqQty ? 'Sufficient' : 'Shortage',
    };
  });

  const wb = XLSX.utils.book_new();
  const wsMeta = XLSX.utils.json_to_sheet(jobMeta);
  XLSX.utils.book_append_sheet(wb, wsMeta, 'Work Order Specs');

  const wsMat = XLSX.utils.json_to_sheet(materialRows);
  XLSX.utils.book_append_sheet(wb, wsMat, 'BOM Recipe Demands');

  const fileName = `WorkOrder_${job.machineId}_${job.itemCode}_${job.planDate}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Exports a single Machine Job & BOM specs to CSV
 */
export function exportSingleJobToCsv(
  job: PlannedMachineJob,
  boms: BomMaster[],
  items: ItemMaster[]
) {
  const itemMap = new Map<string, ItemMaster>(items.map((i) => [i.code, i]));
  const item = itemMap.get(job.itemCode);
  const bom = job.bomId ? boms.find((b) => b.id === job.bomId) : boms.find((b) => b.parent === job.itemCode);
  const lines = (bom && bom.lines && bom.lines.length > 0) ? bom.lines : (item ? getSyntheticRecipeForPart(item) : []);

  const csvRows: string[] = [
    'WORK ORDER JOB SPECIFICATION',
    `Work Order ID,${job.workOrderId || `WO-JIT-${job.machineId}`}`,
    `Production Date,${job.planDate}`,
    `Machine,${job.machineId}`,
    `Plant,${job.plant || 'PLANT-01'}`,
    `Item Code,${job.itemCode}`,
    `Item Name,"${job.itemName.replace(/"/g, '""')}"`,
    `Linked BOM,${bom?.id || 'BOM-1001'}`,
    `Mold,${job.moldName}`,
    `Cavities,${job.cavities}`,
    `Cycle Time (s),${job.cycleTimeSec}`,
    `Planned Hours,${job.plannedHours}`,
    `Target PCS,${job.calculatedPcs}`,
    `Operator,"${job.operator || ''}"`,
    `Priority,${job.priority}`,
    `Expected Finish,${job.expectedFinishDate || job.planDate}`,
    `Status,${job.status}`,
    '',
    'BOM RECIPE REQUIREMENTS',
    'Category,Material Code,Description,Required Qty,UOM,Scrap %',
  ];

  for (const l of lines) {
    const matItem = itemMap.get(l.item);
    const cat = categorizeBomLine(l, matItem, job.plant);
    const scrapFactor = 1 + (l.scrap || 0) / 100;
    const reqQty = Number(((l.qty || 0) * scrapFactor * job.calculatedPcs).toFixed(3));
    csvRows.push(`"${cat.label}",${l.item},"${(l.name || matItem?.name || l.item).replace(/"/g, '""')}",${reqQty},${l.uom || 'KG'},${l.scrap || 0}%`);
  }

  const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvRows.join('\n'));
  const link = document.createElement('a');
  link.setAttribute('href', csvContent);
  link.setAttribute('download', `WorkOrder_${job.machineId}_${job.itemCode}_${job.planDate}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exports production schedule to multi-sheet Excel (.xlsx)
 */
export function exportJitPlanToExcel(
  planDate: string,
  jobs: PlannedMachineJob[],
  requirements: ExplodedMaterialRequirement[],
  stores: StoreInventoryNode[] = DEFAULT_CONNECTED_STORES
) {
  // Sheet 1: Schedule Jobs
  const scheduleRows = jobs.map((job) => ({
    'Plan Date': job.planDate || planDate,
    'Plant Facility': job.plant || 'PLANT-01',
    'Machine ID': job.machineId,
    'Shift Slot': job.shift,
    'Item Code': job.itemCode,
    'Item Name': job.itemName,
    'Linked BOM': job.bomId || 'BOM-1001',
    'Mold / Tooling': job.moldName,
    'Cavities': job.cavities,
    'Cycle Time (s)': job.cycleTimeSec,
    'Planned Hours': job.plannedHours,
    'Calculated Output (PCS)': job.calculatedPcs,
    'Efficiency %': job.efficiencyPct,
    'Operator': job.operator || 'Not Assigned',
    'Priority': job.priority,
    'Expected Finish': job.expectedFinishDate || job.planDate,
    'Store Feasibility': job.status,
  }));

  // Sheet 2: Exploded Material Demands
  const materialRows = requirements.map((req) => ({
    'Material Category': req.categoryLabel,
    'Material Code': req.materialCode,
    'Material Description': req.materialName,
    'Rate per Unit': req.ratePerPc,
    'Scrap %': req.scrapPct,
    'Total Qty Required': req.requiredQty,
    'UOM': req.uom,
    'Connected Store': req.storeLocation,
    'Available Stock': req.availableStock,
    'Shortage Deficit': req.shortageQty,
    'Feasibility State': req.feasibility.replace('_', ' '),
  }));

  // Sheet 3: Connected Stores Matrix
  const storeRows = stores.map((st) => ({
    'Store Code': st.code,
    'Store Name': st.name,
    'Classification': st.type,
    'Storage Zone': st.zone,
    'Plant ID': st.plantId || 'PLANT-01',
    'Description': st.description,
    'Custom Store': st.isCustom ? 'Yes' : 'Standard Factory Store',
  }));

  const wb = XLSX.utils.book_new();

  const wsSchedule = XLSX.utils.json_to_sheet(scheduleRows);
  XLSX.utils.book_append_sheet(wb, wsSchedule, 'Injection Machine Schedule');

  const wsMaterials = XLSX.utils.json_to_sheet(materialRows);
  XLSX.utils.book_append_sheet(wb, wsMaterials, 'BOM Material Requirements');

  const wsStores = XLSX.utils.json_to_sheet(storeRows);
  XLSX.utils.book_append_sheet(wb, wsStores, 'Connected Factory Stores');

  const fileName = `JIT_Production_Plan_${planDate.replace(/-/g, '')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Exports production schedule to standard CSV
 */
export function exportJitPlanToCsv(
  planDate: string,
  jobs: PlannedMachineJob[],
  requirements: ExplodedMaterialRequirement[]
) {
  const headers = [
    'Plan Date',
    'Machine ID',
    'Shift',
    'Item Code',
    'Item Name',
    'Linked BOM',
    'Mold Tag',
    'Cavities',
    'Cycle Time (s)',
    'Run Hours',
    'Output (PCS)',
    'Operator',
    'Priority',
    'Expected Finish',
    'Status',
  ];

  const lines: string[] = [headers.join(',')];

  for (const job of jobs) {
    const row = [
      `"${planDate}"`,
      `"${job.machineId}"`,
      `"${job.shift}"`,
      `"${job.itemCode}"`,
      `"${job.itemName.replace(/"/g, '""')}"`,
      `"${job.bomId || 'BOM-1001'}"`,
      `"${job.moldId}"`,
      job.cavities,      job.cycleTimeSec,
      job.plannedHours,
      job.calculatedPcs,
      `"${job.operator || ''}"`,
      `"${job.priority}"`,
      `"${job.expectedFinishDate || job.planDate}"`,
      `"${job.status}"`,
    ];
    lines.push(row.join(','));
  }

  lines.push('');
  lines.push('--- MATERIAL REQUIREMENTS & STORE AVAILABILITY ---');
  lines.push(
    ['Category', 'Material Code', 'Description', 'Required Qty', 'UOM', 'Store', 'Available Stock', 'Shortage', 'Feasibility'].join(',')
  );

  for (const req of requirements) {
    const row = [
      `"${req.categoryLabel}"`,
      `"${req.materialCode}"`,
      `"${req.description.replace(/"/g, '""')}"`,
      req.requiredQty,
      `"${req.uom}"`,
      `"${req.storeName}"`,
      req.availableStock,
      req.shortageQty,
      `"${req.feasibility}"`,
    ];
    lines.push(row.join(','));
  }

  const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(lines.join('\n'));
  const link = document.createElement('a');
  link.setAttribute('href', csvContent);
  link.setAttribute('download', `JIT_Production_Plan_${planDate.replace(/-/g, '')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Task 2: Detects whether a Work Order has started receiving floor production data.
 * Once input has begun, it cannot be rolled back or modified except by Admin or authorized users.
 */
export function isWorkOrderInputStarted(wo: Partial<WorkOrder> | undefined | null): boolean {
  if (!wo) return false;
  const good = Number(wo.completed) || 0;
  const scrap = Number(wo.scrap) || 0;
  const downtime = Number(wo.downtimeMin) || 0;
  const runner = Number(wo.runnerWeightKg || wo.runnerQty) || 0;
  const lumps = Number(wo.lumpsWeightKg || wo.lumbesQty) || 0;
  const hasLogs = Boolean(wo.outputLogs && wo.outputLogs.length > 0);
  const hasDowntimeLogs = Boolean(wo.downtimeLogs && wo.downtimeLogs.length > 0);
  const hasRejections = Boolean(wo.rejectionBreakdown && wo.rejectionBreakdown.length > 0);
  const hasDowntimeIntervals = Boolean(wo.downtimeIntervals && wo.downtimeIntervals.length > 0);
  const isFinished = wo.status === 'completed';

  return (
    good > 0 ||
    scrap > 0 ||
    downtime > 0 ||
    runner > 0 ||
    lumps > 0 ||
    hasLogs ||
    hasDowntimeLogs ||
    hasRejections ||
    hasDowntimeIntervals ||
    isFinished
  );
}

/**
 * Task 2: Validates whether the active user or admin override has permission to modify/rollback an input-active order.
 */
export function canUserModifyInputActiveOrder(
  wo: Partial<WorkOrder> | undefined | null,
  isAdminUnlocked: boolean,
  eligibleUsers?: Array<{ id: string; name: string; canRollbackInputWO?: boolean; canEditReleased?: boolean }>,
  currentUserIdentifier?: string
): { allowed: boolean; reason?: string } {
  if (!wo || !isWorkOrderInputStarted(wo)) {
    return { allowed: true };
  }

  // Admin override is globally active
  if (isAdminUnlocked) {
    return { allowed: true, reason: 'Administrator override active' };
  }

  // Check if current user is explicitly authorized by Admin
  if (currentUserIdentifier && eligibleUsers && eligibleUsers.length > 0) {
    const userMatch = eligibleUsers.find(
      (u) =>
        u.id === currentUserIdentifier ||
        u.name.toLowerCase() === currentUserIdentifier.toLowerCase()
    );
    if (userMatch && (userMatch.canRollbackInputWO || userMatch.canEditReleased)) {
      return { allowed: true, reason: `Authorized by Admin (${userMatch.name})` };
    }
  }

  return {
    allowed: false,
    reason: `Work Order ${wo.id || 'record'} has active floor production input and cannot be rolled back or edited. Only Admin or users granted permission by Admin can modify.`,
  };
}

/**
 * Task 3: Generates a strictly unique Work Order ID with zero duplicate risk.
 */
export function generateUniqueWorkOrderId(
  existingOrders: WorkOrder[] = [],
  prefix: string = 'WO-JIT'
): string {
  const existingSet = new Set(existingOrders.map((w) => (w?.id || '').trim().toUpperCase()));
  
  // Format based on prefix
  const cleanPrefix = prefix.replace(/-+$/, '');
  const today = new Date();
  const yy = String(today.getFullYear()).slice(2);
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const dateTag = `${yy}${mm}${dd}`;

  let seq = 1;
  while (true) {
    let candidate = '';
    if (cleanPrefix.includes('JIT')) {
      candidate = `${cleanPrefix}-${dateTag}-${seq}`;
    } else if (cleanPrefix.includes('MAN')) {
      candidate = `${cleanPrefix}-${String(seq).padStart(3, '0')}`;
    } else {
      candidate = `${cleanPrefix}-${1000 + existingOrders.length + seq}`;
    }

    if (!existingSet.has(candidate.toUpperCase())) {
      return candidate;
    }
    seq++;
  }
}

/**
 * Task 3: Generates a strictly unique Schedule Number (e.g. SCH-20260821-01, 02).
 */
export function generateUniqueScheduleNumber(
  existingJobs: PlannedMachineJob[] = [],
  planDate: string
): string {
  const cleanDate = (planDate || '2026-08-21').replace(/-/g, '');
  const existingNumbers = new Set(
    existingJobs
      .map((j) => (j.scheduleNumber || `SCH-${(j.planDate || '').replace(/-/g, '')}-01`).trim().toUpperCase())
  );

  let seq = 1;
  while (true) {
    const candidate = `SCH-${cleanDate}-${String(seq).padStart(2, '0')}`;
    if (!existingNumbers.has(candidate.toUpperCase())) {
      return candidate;
    }
    seq++;
  }
}

/**
 * Task 3: Validates whether a Work Order ID is strictly unique.
 */
export function isWorkOrderNumberUnique(
  id: string,
  existingOrders: WorkOrder[] = [],
  excludeCurrentId?: string
): boolean {
  if (!id || !id.trim()) return false;
  const target = id.trim().toUpperCase();
  const exclude = excludeCurrentId ? excludeCurrentId.trim().toUpperCase() : null;

  return !existingOrders.some((w) => {
    if (!w || !w.id) return false;
    const existing = w.id.trim().toUpperCase();
    if (exclude && existing === exclude) return false;
    return existing === target;
  });
}

/**
 * Task 3: Validates whether a Schedule Number is strictly unique.
 */
export function isScheduleNumberUnique(
  schNum: string,
  existingJobs: PlannedMachineJob[] = [],
  excludeJobId?: string
): boolean {
  if (!schNum || !schNum.trim()) return false;
  const target = schNum.trim().toUpperCase();

  return !existingJobs.some((j) => {
    if (!j || (excludeJobId && j.id === excludeJobId)) return false;
    const existing = (j.scheduleNumber || `SCH-${(j.planDate || '').replace(/-/g, '')}-01`).trim().toUpperCase();
    return existing === target && j.planDate !== target;
  });
}
