import * as XLSX from 'xlsx';
import { ItemMaster, MachineMaster, BomMaster, BomLine } from '../../../types';
import { MoldMaster } from '../../../data/manufacturingData';
import {
  PlannedMachineJob,
  ExplodedMaterialRequirement,
  MaterialCategory,
  StoreInventoryNode,
} from './jitTypes';

// Initial connected stores list
export const DEFAULT_CONNECTED_STORES: StoreInventoryNode[] = [
  {
    id: 'store-fg-01',
    code: 'FG-WH-01',
    name: 'Finished Goods Warehouse',
    type: 'FG',
    description: 'Central storage for finished moulded products ready for dispatch',
    zone: 'Zone A - FG Pallet Stacks',
    isCustom: false,
  },
  {
    id: 'store-sfg-01',
    code: 'RG-WH-01',
    name: 'Semi-Finished & Regrind Store',
    type: 'SFG',
    description: 'Regrind material, runners, WIP sub-assemblies and degated parts',
    zone: 'Zone R - Regrind Floor',
    isCustom: false,
  },
  {
    id: 'store-rm-01',
    code: 'RM-WH-01',
    name: 'Raw Material Resin Store',
    type: 'RM',
    description: 'Virgin polymers (PP, HDPE, ABS, POM, Nylon) in 25kg bags & octabins',
    zone: 'Zone RM - Heavy Racks',
    isCustom: false,
  },
  {
    id: 'store-mb-01',
    code: 'RM-WH-02',
    name: 'Additive & Masterbatch Store',
    type: 'MB',
    description: 'Color concentrates, UV stabilizers, slipping agents and pigments',
    zone: 'Zone MB - Climate Controlled',
    isCustom: false,
  },
  {
    id: 'store-pck-01',
    code: 'PK-WH-01',
    name: 'Packaging Material Store',
    type: 'PCK',
    description: 'Corrugated cartons, polybags, stretch film, separator sheets, labels',
    zone: 'Zone PK - Packing Bay',
    isCustom: false,
  },
  {
    id: 'store-sp-01',
    code: 'SP-WH-01',
    name: 'Hardware & Insert Store',
    type: 'SPARE',
    description: 'Brass threaded inserts, screws, fasteners, clips & machine spares',
    zone: 'Zone SP - Secure Small Bins',
    isCustom: false,
  },
];

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
 * Categorize a BOM material line into RM, MB, INSERT, or PCK
 */
export function categorizeBomLine(line: BomLine, item?: ItemMaster): {
  cat: MaterialCategory;
  label: 'Raw Material (Resin)' | 'Masterbatch (Colorant)' | 'Insert / Hardware' | 'Packaging Material' | 'Other Auxiliary';
  defaultStore: string;
} {
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
    return { cat: 'MB', label: 'Masterbatch (Colorant)', defaultStore: 'RM-WH-02' };
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
    return { cat: 'PCK', label: 'Packaging Material', defaultStore: 'PK-WH-01' };
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
    return { cat: 'INSERT', label: 'Insert / Hardware', defaultStore: 'SP-WH-01' };
  }

  // Default to Raw Material / Resin
  return { cat: 'RM', label: 'Raw Material (Resin)', defaultStore: 'RM-WH-01' };
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

    const bom = bomMap.get(job.itemCode);
    const item = itemMap.get(job.itemCode);
    const lines = (bom && bom.lines && bom.lines.length > 0) ? bom.lines : (item ? getSyntheticRecipeForPart(item) : []);

    for (const line of lines) {
      const matCode = line.item;
      const matItem = itemMap.get(matCode);
      const catInfo = categorizeBomLine(line, matItem);

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
          ratePerPc: line.qty,
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

  // Calculate final feasibility for each material
  const result: ExplodedMaterialRequirement[] = [];
  for (const req of aggregatedMap.values()) {
    req.requiredQty = Number(req.requiredQty.toFixed(2));
    const shortage = req.requiredQty - req.availableStock;
    if (shortage > 0) {
      req.shortageQty = Number(shortage.toFixed(2));
      req.feasibility = 'Critical_Shortage';
    } else if (req.availableStock - req.requiredQty < req.requiredQty * 0.2) {
      req.shortageQty = 0;
      req.feasibility = 'Tight_Buffer';
    } else {
      req.shortageQty = 0;
      req.feasibility = 'Sufficient';
    }
    result.push(req);
  }

  // Sort by Category then Critical Shortage first
  return result.sort((a, b) => {
    if (a.feasibility === 'Critical_Shortage' && b.feasibility !== 'Critical_Shortage') return -1;
    if (b.feasibility === 'Critical_Shortage' && a.feasibility !== 'Critical_Shortage') return 1;
    return a.category.localeCompare(b.category);
  });
}

/**
 * Exports production schedule & recipe requirements to Excel (.xlsx)
 */
export function exportJitPlanToExcel(
  planDate: string,
  jobs: PlannedMachineJob[],
  requirements: ExplodedMaterialRequirement[],
  machines: MachineMaster[],
  stores: StoreInventoryNode[]
) {
  const machineMap = new Map(machines.map((m) => [m.id, m]));

  // Sheet 1: Machine Production Plan
  const scheduleRows = jobs.map((job, idx) => {
    const m = machineMap.get(job.machineId);
    return {
      'Seq #': idx + 1,
      'Plan Date': planDate,
      'Machine ID': job.machineId,
      'Machine Name': m?.name || job.machineId,
      'Tonnage': m?.tonnage || '—',
      'Shift': job.shift,
      'Product Code': job.itemCode,
      'Product Description': job.itemName,
      'Mold Tool Tag': job.moldId,
      'Cavities': job.cavities,
      'Cycle Time (sec)': job.cycleTimeSec,
      'Planned Run Hours': job.plannedHours,
      'Est. Efficiency %': job.efficiencyPct,
      'Planned Output (PCS)': job.calculatedPcs,
      'Lead Operator': job.operator || 'Unassigned',
      'Feasibility Status': job.status,
    };
  });

  // Sheet 2: Material BOM Explosion & Store Availability
  const materialRows = requirements.map((req, idx) => ({
    'Item #': idx + 1,
    'Material Category': req.categoryLabel,
    'Material Code': req.materialCode,
    'Material Description': req.materialName,
    'Rate per Unit': req.ratePerPc,
    'Scrap %': req.scrapPct,
    'Total Qty Required': req.requiredQty,
    'UOM': req.uom,
    'Connected Store': req.storeLocation,
    'Available Stock in Store': req.availableStock,
    'Shortage Deficit': req.shortageQty > 0 ? req.shortageQty : 0,
    'Feasibility State': req.feasibility.replace('_', ' '),
  }));

  // Sheet 3: Connected Stores Matrix
  const storeRows = stores.map((st) => ({
    'Store Code': st.code,
    'Store Name': st.name,
    'Classification': st.type,
    'Storage Zone': st.zone,
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
    'Mold Tag',
    'Cavities',
    'Cycle Time (s)',
    'Run Hours',
    'Output (PCS)',
    'Operator',
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
      `"${job.moldId}"`,
      job.cavities,
      job.cycleTimeSec,
      job.plannedHours,
      job.calculatedPcs,
      `"${job.operator || ''}"`,
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
      `"${req.materialName.replace(/"/g, '""')}"`,
      req.requiredQty,
      `"${req.uom}"`,
      `"${req.storeLocation.replace(/"/g, '""')}"`,
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
