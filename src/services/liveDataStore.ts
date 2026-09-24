import axios from 'axios';
import {
  ItemMaster,
  BomMaster,
  MachineMaster,
  WorkOrder,
  PurchaseOrder,
  SalesOrder,
  Account,
  JournalEntry,
  NonConformanceReport,
  CapaReport,
  CertificateOfAnalysis,
  Customer,
  Quotation,
  ReturnMerchandise,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export interface ProductionEntryPayload {
  workOrderId: string;
  machineId: string;
  shift: string;
  operatorId: string;
  goodQty: number;
  scrapQty: number;
  downtimeMinutes: number;
  downtimeReason?: string;
  cavities: number;
  actualCycleTimeSec: number;
}

export interface ProductionEntryResult {
  success: boolean;
  workOrder: WorkOrder;
  computedOee: {
    availabilityPct: number;
    performancePct: number;
    qualityPct: number;
    overallOeePct: number;
  };
  materialConsumedKg: number;
  hourlyOutputRate: number;
}

export interface BomCalculationPayload {
  itemId: string;
  shotWeightGrams: number;
  runnerWeightGrams: number;
  cavities: number;
  standardCycleTimeSec: number;
  scrapAllowancePct: number;
  components: Array<{
    itemCode: string;
    percentage: number;
    standardCost: number;
  }>;
  machineHourlyRate: number;
}

export interface BomCalculationResult {
  bomUnitCost: number;
  materialCostPerPart: number;
  machineCostPerPart: number;
  expectedPartsPerHour: number;
  grossShotWeightG: number;
}

class LiveDataStore {
  private api = axios.create({
    baseURL: API_BASE,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': 'PLANT-01',
    },
  });

  // --------------------------------------------------------------------------
  // 1. Production Mutation & Real-Time OEE Calculation Pipeline
  // --------------------------------------------------------------------------
  public async recordProductionEntry(payload: ProductionEntryPayload): Promise<ProductionEntryResult> {
    try {
      const res = await this.api.post('/operations/production-entry', payload);
      return res.data?.data || res.data;
    } catch (err) {
      // Local client-side calculation preview fallback
      const plannedMinutes = 480; // 8 hr shift
      const operatingMinutes = Math.max(0, plannedMinutes - payload.downtimeMinutes);
      const totalProduced = payload.goodQty + payload.scrapQty;
      
      const availabilityPct = Number(((operatingMinutes / plannedMinutes) * 100).toFixed(2));
      const idealOperatingSec = (totalProduced / payload.cavities) * payload.actualCycleTimeSec;
      const actualOperatingSec = operatingMinutes * 60;
      const performancePct = Number((actualOperatingSec > 0 ? Math.min(100, (idealOperatingSec / actualOperatingSec) * 100) : 0).toFixed(2));
      const qualityPct = Number((totalProduced > 0 ? (payload.goodQty / totalProduced) * 100 : 100).toFixed(2));
      const overallOeePct = Number(((availabilityPct * performancePct * qualityPct) / 10000).toFixed(2));
      const hourlyOutputRate = Number((payload.actualCycleTimeSec > 0 ? (3600 / payload.actualCycleTimeSec) * payload.cavities : 0).toFixed(0));

      return {
        success: true,
        workOrder: {
          id: payload.workOrderId,
          status: 'running',
          produced: payload.goodQty,
          scrap: payload.scrapQty,
        } as WorkOrder,
        computedOee: {
          availabilityPct,
          performancePct,
          qualityPct,
          overallOeePct,
        },
        materialConsumedKg: Number((totalProduced * 0.035).toFixed(2)),
        hourlyOutputRate,
      };
    }
  }

  // --------------------------------------------------------------------------
  // 2. Engineering BOM & Costing Rollup Calculation Pipeline
  // --------------------------------------------------------------------------
  public calculateBomRollup(payload: BomCalculationPayload): BomCalculationResult {
    const grossShotWeightG = payload.shotWeightGrams + payload.runnerWeightGrams;
    const partsPerHour = payload.standardCycleTimeSec > 0 ? (3600 / payload.standardCycleTimeSec) * payload.cavities : 0;
    const machineCostPerPart = partsPerHour > 0 ? payload.machineHourlyRate / partsPerHour : 0;
    
    // Component material cost sum
    const materialCostPerPart = payload.components.reduce((acc, c) => {
      const partResinKg = (grossShotWeightG / 1000 / payload.cavities) * (c.percentage / 100) * (1 + payload.scrapAllowancePct / 100);
      return acc + partResinKg * c.standardCost;
    }, 0);

    const bomUnitCost = Number((materialCostPerPart + machineCostPerPart).toFixed(4));

    return {
      bomUnitCost,
      materialCostPerPart: Number(materialCostPerPart.toFixed(4)),
      machineCostPerPart: Number(machineCostPerPart.toFixed(4)),
      expectedPartsPerHour: Math.round(partsPerHour),
      grossShotWeightG,
    };
  }

  // --------------------------------------------------------------------------
  // 3. Items & Resins (Live DB)
  // --------------------------------------------------------------------------
  public async getItems(): Promise<ItemMaster[]> {
    try {
      const res = await this.api.get('/items');
      return res.data?.data || res.data || [];
    } catch {
      return [];
    }
  }

  public async updateItem(item: ItemMaster): Promise<ItemMaster> {
    try {
      const res = await this.api.put(`/items/${item.code}`, item);
      return res.data?.data || item;
    } catch {
      return item;
    }
  }

  // --------------------------------------------------------------------------
  // 4. Work Orders (Live DB)
  // --------------------------------------------------------------------------
  public async getWorkOrders(): Promise<WorkOrder[]> {
    try {
      const res = await this.api.get('/work-orders');
      return res.data?.data || res.data || [];
    } catch {
      return [];
    }
  }

  public async saveWorkOrder(wo: WorkOrder): Promise<WorkOrder> {
    try {
      const res = await this.api.post('/work-orders', wo);
      return res.data?.data || wo;
    } catch {
      return wo;
    }
  }

  // --------------------------------------------------------------------------
  // 5. Purchase Orders (Live DB)
  // --------------------------------------------------------------------------
  public async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    try {
      const res = await this.api.get('/purchase-orders');
      return res.data?.data || res.data || [];
    } catch {
      return [];
    }
  }

  // --------------------------------------------------------------------------
  // 6. Sales Orders (Live DB)
  // --------------------------------------------------------------------------
  public async getSalesOrders(): Promise<SalesOrder[]> {
    try {
      const res = await this.api.get('/sales-orders');
      return res.data?.data || res.data || [];
    } catch {
      return [];
    }
  }

  // --------------------------------------------------------------------------
  // 7. Chart of Accounts & General Ledger (Live DB)
  // --------------------------------------------------------------------------
  public async getAccounts(): Promise<Account[]> {
    try {
      const res = await this.api.get('/finance/accounts');
      return res.data?.data || res.data || [];
    } catch {
      return [];
    }
  }

  public async getJournalEntries(): Promise<JournalEntry[]> {
    try {
      const res = await this.api.get('/finance/journal-entries');
      return res.data?.data || res.data || [];
    } catch {
      return [];
    }
  }
}

export const liveDataStore = new LiveDataStore();
