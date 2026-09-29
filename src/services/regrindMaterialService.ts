import { adminEventBus } from './adminService';
import { WorkOrder, ItemMaster, BomMaster } from '../types';

export interface RegrindMaterialEntry {
  id: string;
  mixingId: string; // Single ID called Mixing ID which is connected to BOM, item number for each RG entry
  date: string;
  shift: 'Shift A' | 'Shift B' | 'Shift C';
  machineId: string;
  workOrderId: string;
  moldId: string;
  itemCode: string;
  itemName: string;
  baseResin: string;
  colorMasterbatch: string;
  regrindType: 'Sprues/Runners' | 'Rejected Parts' | 'Purging' | 'Mixed';
  qualityCondition: 'Clean' | 'Dusty/Flash' | 'Contaminated';
  bagTagId: string;
  tareWeightKg: number;
  grossWeightKg: number;
  netWeightKg: number; // Auto-calculated Gross - Tare
  rgStoreLocation: string; // e.g. RG-BIN-01, RG-BIN-04, SILO-A
  bomId: string;
  bomItemId?: string; // Mapped item code in BOM for regrind blend ratio
  maxBlendRatioPct: number;
  remarks?: string;
  operator: string;
  status: 'Logged' | 'Stored' | 'Blended' | 'Consumed';
  createdAt: string;
}

export interface WoScrapConsolidatedSummary {
  workOrderId: string;
  machineId: string;
  itemCode: string;
  itemName: string;
  date: string;
  shift: string;
  goodQty: number;
  rejectionQty: number;
  partWeightGrams: number;
  runnerWeightGrams: number;
  shotWeightGrams: number;
  cavities: number;
  rejectionKg: number; // (rejectionQty * partWeightGrams) / 1000
  runnerKg: number; // calculated from runnerQty or shot cycles
  lumpsKg: number; // purge lumps in kg
  totalScrapKg: number; // rejectionKg + runnerKg + lumpsKg
  baseResin: string;
  color: string;
  moldId: string;
  bomId: string;
  mixingId: string;
  rgLoggedKg: number;
  pendingRgKg: number;
  status: 'Pending Grinding' | 'Partial Reground' | 'Fully Reground';
}

export interface DailyMixingSummary {
  mixingId: string;
  itemNumber: string; // Mixing ID as item number for BOM
  date: string;
  baseResin: string;
  colorMasterbatch: string;
  totalNetKg: number;
  entryCount: number;
  targetBoms: string[];
  recommendedBlendPct: number;
  storageBins: string[];
  qualitySummary: string;
  status: 'Active Stock' | 'Allocated to BOM' | 'Consumed';
}

const STORAGE_KEY_ENTRIES = 'reboot_erp_regrind_material_entries';

export const INITIAL_RG_ENTRIES: RegrindMaterialEntry[] = [
  {
    id: 'RGE-2026-0001',
    mixingId: 'MIX-2026-0901',
    date: '2026-09-29',
    shift: 'Shift A',
    machineId: 'IMM-250T-01',
    workOrderId: 'WO-2026-0814',
    moldId: 'M-104-ABS-2C',
    itemCode: 'FG-AUTO-012',
    itemName: 'ABS Dashboard Trim Bezel (Matte Black)',
    baseResin: 'LG Chem ABS-121H',
    colorMasterbatch: 'Jet Black MB-01 (2%)',
    regrindType: 'Sprues/Runners',
    qualityCondition: 'Clean',
    bagTagId: 'BAG-RG-2609-001',
    tareWeightKg: 0.50,
    grossWeightKg: 28.50,
    netWeightKg: 28.00,
    rgStoreLocation: 'RG-BIN-01 (Auto-Cell)',
    bomId: 'BOM-FG-AUTO-012',
    bomItemId: 'RM-RG-ABS-BLK-01',
    maxBlendRatioPct: 15,
    remarks: 'Clean cold runners from morning production run',
    operator: 'Kishore Patil',
    status: 'Stored',
    createdAt: '2026-09-29T08:30:00Z',
  },
  {
    id: 'RGE-2026-0002',
    mixingId: 'MIX-2026-0901',
    date: '2026-09-29',
    shift: 'Shift A',
    machineId: 'IMM-250T-01',
    workOrderId: 'WO-2026-0814',
    moldId: 'M-104-ABS-2C',
    itemCode: 'FG-AUTO-012',
    itemName: 'ABS Dashboard Trim Bezel (Matte Black)',
    baseResin: 'LG Chem ABS-121H',
    colorMasterbatch: 'Jet Black MB-01 (2%)',
    regrindType: 'Rejected Parts',
    qualityCondition: 'Clean',
    bagTagId: 'BAG-RG-2609-002',
    tareWeightKg: 0.50,
    grossWeightKg: 14.20,
    netWeightKg: 13.70,
    rgStoreLocation: 'RG-BIN-01 (Auto-Cell)',
    bomId: 'BOM-FG-AUTO-012',
    bomItemId: 'RM-RG-ABS-BLK-01',
    maxBlendRatioPct: 15,
    remarks: 'Startup short shot rejections granulated',
    operator: 'Kishore Patil',
    status: 'Stored',
    createdAt: '2026-09-29T09:45:00Z',
  },
  {
    id: 'RGE-2026-0003',
    mixingId: 'MIX-2026-0902',
    date: '2026-09-29',
    shift: 'Shift A',
    machineId: 'IMM-180T-02',
    workOrderId: 'WO-2026-0815',
    moldId: 'M-088-PP-1C',
    itemCode: 'FG-AUTO-045',
    itemName: 'PP Air Duct Housing - Front Left',
    baseResin: 'Reliance Repol H110MA (PP Homo)',
    colorMasterbatch: 'Natural / Uncolored',
    regrindType: 'Sprues/Runners',
    qualityCondition: 'Clean',
    bagTagId: 'BAG-RG-2609-003',
    tareWeightKg: 0.45,
    grossWeightKg: 22.45,
    netWeightKg: 22.00,
    rgStoreLocation: 'RG-BIN-02 (PP Bay)',
    bomId: 'BOM-FG-AUTO-045',
    bomItemId: 'RM-RG-PP-NAT-01',
    maxBlendRatioPct: 20,
    remarks: 'Pure PP natural runners, 6mm granulated size',
    operator: 'Sunil Jadhav',
    status: 'Stored',
    createdAt: '2026-09-29T10:15:00Z',
  },
  {
    id: 'RGE-2026-0004',
    mixingId: 'MIX-2026-0902',
    date: '2026-09-29',
    shift: 'Shift A',
    machineId: 'IMM-180T-02',
    workOrderId: 'WO-2026-0815',
    moldId: 'M-088-PP-1C',
    itemCode: 'FG-AUTO-045',
    itemName: 'PP Air Duct Housing - Front Left',
    baseResin: 'Reliance Repol H110MA (PP Homo)',
    colorMasterbatch: 'Natural / Uncolored',
    regrindType: 'Purging',
    qualityCondition: 'Dusty/Flash',
    bagTagId: 'BAG-RG-2609-004',
    tareWeightKg: 0.60,
    grossWeightKg: 8.60,
    netWeightKg: 8.00,
    rgStoreLocation: 'RG-BIN-02 (PP Bay)',
    bomId: 'BOM-FG-AUTO-045',
    bomItemId: 'RM-RG-PP-NAT-01',
    maxBlendRatioPct: 10,
    remarks: 'Purge lumps cut and crushed for low-ratio utility blending',
    operator: 'Sunil Jadhav',
    status: 'Stored',
    createdAt: '2026-09-29T11:00:00Z',
  }
];

class RegrindMaterialService {
  private entries: RegrindMaterialEntry[] = this.loadEntries();

  private loadEntries(): RegrindMaterialEntry[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ENTRIES);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read RG entries from localStorage', e);
    }
    this.saveEntries(INITIAL_RG_ENTRIES);
    return INITIAL_RG_ENTRIES;
  }

  private saveEntries(data: RegrindMaterialEntry[]) {
    try {
      localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(data));
    } catch (e) {
      console.warn('Could not persist RG entries', e);
    }
  }

  public getEntriesSync(): RegrindMaterialEntry[] {
    return this.entries;
  }

  public addEntry(entry: Omit<RegrindMaterialEntry, 'id' | 'createdAt'>): RegrindMaterialEntry {
    const newEntry: RegrindMaterialEntry = {
      ...entry,
      id: `RGE-2026-${String(this.entries.length + 1).padStart(4, '0')}`,
      netWeightKg: Number((Number(entry.grossWeightKg || 0) - Number(entry.tareWeightKg || 0)).toFixed(2)),
      createdAt: new Date().toISOString(),
    };

    this.entries = [newEntry, ...this.entries];
    this.saveEntries(this.entries);
    adminEventBus.emit('RG_MATERIAL_ENTRY_ADDED', newEntry);
    return newEntry;
  }

  public deleteEntry(id: string): boolean {
    this.entries = this.entries.filter((e) => e.id !== id);
    this.saveEntries(this.entries);
    adminEventBus.emit('RG_MATERIAL_ENTRY_DELETED', { id });
    return true;
  }

  // Generate unique Mixing ID for daily batch (acts as item number for RG entry and connects to BOM)
  public generateNextMixingId(baseResin?: string, dateStr?: string): string {
    const d = (dateStr || new Date().toISOString().slice(0, 10)).replace(/-/g, '').slice(2); // e.g. 260929
    const existing = this.entries.filter((e) => e.date === (dateStr || new Date().toISOString().slice(0, 10)));
    const seq = existing.length + 1;
    return `MIX-${d}-${String(seq).padStart(3, '0')}`;
  }

  // Work Order Scrap to KG Consolidation Calculation
  public calculateWoScrapConsolidated(
    workOrders: WorkOrder[],
    items: ItemMaster[],
    boms: BomMaster[]
  ): WoScrapConsolidatedSummary[] {
    const entries = this.getEntriesSync();

    return workOrders.map((wo) => {
      const item = items.find((i) => i.code === wo.item);
      const bom = boms.find((b) => b.id === wo.bomId || b.itemCode === wo.item);

      const partWeightGrams = Number(item?.partWeightGrams || item?.netWeightGrams || 85.0);
      const runnerWeightGrams = Number(item?.runnerWeightGrams || 15.0);
      const shotWeightGrams = Number(item?.shotWeightGrams || (partWeightGrams + runnerWeightGrams));
      const cavities = Number(item?.cavityCount || 2);

      const produced = Number(wo.producedQty || wo.actualQty || 0);
      const goodQty = Number(wo.goodQty || produced * 0.95);
      const rejectionQty = Number(wo.rejectionQty || wo.scrapQty || Math.max(0, produced - goodQty) || 25);

      // Rejections converted to KG
      const rejectionKg = Number(((rejectionQty * partWeightGrams) / 1000).toFixed(2));

      // Runner converted to KG (from wo.runnerQty or calculated from cycles)
      const cycles = Math.ceil(produced / Math.max(1, cavities));
      const runnerKg = Number((wo.runnerQty ?? (cycles * runnerWeightGrams) / 1000).toFixed(2));

      // Purging / Lumps in KG
      const lumpsKg = Number((wo.lumpsQty ?? (rejectionQty > 0 ? (rejectionQty * partWeightGrams * 0.2) / 1000 : 2.5)).toFixed(2));

      // Total Scrap in KG
      const totalScrapKg = Number((rejectionKg + runnerKg + lumpsKg).toFixed(2));

      // Check how much RG has already been logged for this WO
      const loggedEntries = entries.filter((e) => e.workOrderId === wo.id);
      const rgLoggedKg = Number(loggedEntries.reduce((sum, e) => sum + e.netWeightKg, 0).toFixed(2));
      const pendingRgKg = Number(Math.max(0, totalScrapKg - rgLoggedKg).toFixed(2));

      const status: WoScrapConsolidatedSummary['status'] =
        rgLoggedKg >= totalScrapKg && totalScrapKg > 0
          ? 'Fully Reground'
          : rgLoggedKg > 0
          ? 'Partial Reground'
          : 'Pending Grinding';

      const baseResin =
        item?.rawMaterialGrade ||
        item?.grade ||
        (bom?.items?.find((bi) => (bi as any).type === 'raw_material' || bi.itemCode.startsWith('RM-'))?.itemName) ||
        'Polypropylene Homopolymer (Grade H110FU)';

      const color =
        item?.color ||
        (bom?.items?.find((bi) => bi.itemCode.startsWith('MB-') || bi.itemCode.includes('COL'))?.itemName) ||
        'Natural / Standard Tone';

      return {
        workOrderId: wo.id,
        machineId: wo.machine || 'IMM-250T-01',
        itemCode: wo.item,
        itemName: item?.name || wo.item,
        date: wo.planDate || wo.dueDate || '2026-09-29',
        shift: wo.shift || 'Shift A',
        goodQty,
        rejectionQty,
        partWeightGrams,
        runnerWeightGrams,
        shotWeightGrams,
        cavities,
        rejectionKg,
        runnerKg,
        lumpsKg,
        totalScrapKg,
        baseResin,
        color,
        moldId: wo.moldId || (item as any)?.moldCode || 'M-104-ABS-2C',
        bomId: wo.bomId || `BOM-${wo.item}`,
        mixingId: loggedEntries[0]?.mixingId || `MIX-${wo.id.replace('WO-', '')}`,
        rgLoggedKg,
        pendingRgKg,
        status,
      };
    });
  }

  // Aggregate daily entries by Mixing ID (which is the item number for each RG entry connected to BOM)
  public getDailyMixingSummaries(): DailyMixingSummary[] {
    const entries = this.getEntriesSync();
    const map = new Map<string, DailyMixingSummary>();

    entries.forEach((e) => {
      const key = e.mixingId;
      if (!map.has(key)) {
        map.set(key, {
          mixingId: e.mixingId,
          itemNumber: e.mixingId, // Item Number for BOM
          date: e.date,
          baseResin: e.baseResin,
          colorMasterbatch: e.colorMasterbatch,
          totalNetKg: 0,
          entryCount: 0,
          targetBoms: [],
          recommendedBlendPct: e.maxBlendRatioPct || 15,
          storageBins: [],
          qualitySummary: e.qualityCondition,
          status: 'Active Stock',
        });
      }

      const summary = map.get(key)!;
      summary.totalNetKg = Number((summary.totalNetKg + e.netWeightKg).toFixed(2));
      summary.entryCount += 1;
      if (e.bomId && !summary.targetBoms.includes(e.bomId)) {
        summary.targetBoms.push(e.bomId);
      }
      if (e.rgStoreLocation && !summary.storageBins.includes(e.rgStoreLocation)) {
        summary.storageBins.push(e.rgStoreLocation);
      }
    });

    return Array.from(map.values());
  }
}

export const regrindMaterialService = new RegrindMaterialService();
