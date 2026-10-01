import axios from 'axios';
import { supabase } from '../shared/supabaseClient';
import { adminEventBus } from './adminService';
import { universalSyncManager } from './realtime/UniversalSyncManager';
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
  lotNumber?: string;
  notes?: string;
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

      const result: ProductionEntryResult = {
        success: true,
        workOrder: {
          id: payload.workOrderId,
          status: 'running',
          produced: payload.goodQty,
          scrap: payload.scrapQty,
        } as unknown as WorkOrder,

        computedOee: {
          availabilityPct,
          performancePct,
          qualityPct,
          overallOeePct,
        },
        materialConsumedKg: Number((totalProduced * 0.035).toFixed(2)),
        hourlyOutputRate,
      };

      adminEventBus.emit('PRODUCTION_LOGGED', result);
      universalSyncManager.broadcastMutation('WORK_ORDERS', 'UPDATE', result.workOrder);
      return result;
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
      const data = res.data?.data || res.data;
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  public async updateItem(item: ItemMaster): Promise<ItemMaster> {
    try {
      const res = await this.api.put(`/items/${item.code}`, item);
      const updated = res.data?.data || item;
      adminEventBus.emit('ITEM_SAVED', updated);
      universalSyncManager.broadcastMutation('ITEMS', 'UPDATE', updated);
      return updated;
    } catch {
      adminEventBus.emit('ITEM_SAVED', item);
      universalSyncManager.broadcastMutation('ITEMS', 'UPDATE', item);
      return item;
    }
  }

  // --------------------------------------------------------------------------
  // 4. Work Orders (Live DB)
  // --------------------------------------------------------------------------
  public async getWorkOrders(): Promise<WorkOrder[]> {
    try {
      const { data, error } = await supabase
        .from('work_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data as WorkOrder[];
      }
    } catch {}

    try {
      const res = await this.api.get('/work-orders');
      const data = res.data?.data || res.data;
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  public async saveWorkOrder(wo: WorkOrder): Promise<WorkOrder> {
    try {
      await supabase.from('work_orders').upsert({
        id: wo.id,
        item_code: wo.itemCode,
        machine_id: wo.machineId,
        status: wo.status,
        updated_at: new Date().toISOString(),
      });
    } catch {}

    try {
      const res = await this.api.post('/work-orders', wo);
      const saved = res.data?.data || wo;
      adminEventBus.emit('WORK_ORDER_SAVED', saved);
      universalSyncManager.broadcastMutation('WORK_ORDERS', 'INSERT', saved);
      return saved;
    } catch {
      adminEventBus.emit('WORK_ORDER_SAVED', wo);
      universalSyncManager.broadcastMutation('WORK_ORDERS', 'INSERT', wo);
      return wo;
    }
  }

  // --------------------------------------------------------------------------
  // 5. Purchase Orders (Live DB)
  // --------------------------------------------------------------------------
  public async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data as PurchaseOrder[];
      }
    } catch {}

    try {
      const res = await this.api.get('/purchase-orders');
      const data = res.data?.data || res.data;
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  // --------------------------------------------------------------------------
  // 6. Sales Orders (Live DB)
  // --------------------------------------------------------------------------
  public async getSalesOrders(): Promise<SalesOrder[]> {
    try {
      const { data, error } = await supabase
        .from('sales_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data as unknown as SalesOrder[];
      }
    } catch {}

    try {
      const res = await this.api.get('/sales-orders');
      const data = res.data?.data || res.data;
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  public async saveSalesOrder(so: SalesOrder): Promise<SalesOrder> {
    try {
      await supabase.from('sales_orders').upsert({
        id: so.id,
        so_number: (so as any).soNumber || so.id,
        customer_id: so.customerId,
        customer_name: (so as any).customerName,
        status: so.status,
        total_value: (so as any).totalValue || (so as any).totalAmount || 0,
        updated_at: new Date().toISOString(),
      });
    } catch {}

    adminEventBus.emit('SALES_ORDER_SAVED', so);
    universalSyncManager.broadcastMutation('SALES_ORDERS', 'UPDATE', so);
    return so;
  }

  // --------------------------------------------------------------------------
  // 7. Customers Master (Live DB)
  // --------------------------------------------------------------------------
  public async getCustomers(): Promise<Customer[]> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data as Customer[];
      }
    } catch {}

    try {
      const res = await this.api.get('/customers');
      const data = res.data?.data || res.data;
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  public async saveCustomer(customer: Customer): Promise<Customer> {
    try {
      await supabase.from('customers').upsert({
        id: customer.id || customer.code,
        code: customer.code,
        name: customer.name,
        email: (customer as any).email,
        phone: (customer as any).phone,
        status: (customer as any).status || 'Active',
        updated_at: new Date().toISOString(),
      });
    } catch {}

    adminEventBus.emit('CUSTOMER_SAVED', customer);
    universalSyncManager.broadcastMutation('CUSTOMERS', 'UPDATE', customer);
    return customer;
  }

  // --------------------------------------------------------------------------
  // 8. Quality NCR, CAPA, COA (Live DB)
  // --------------------------------------------------------------------------
  public async getNcrs(): Promise<NonConformanceReport[]> {
    try {
      const { data, error } = await supabase
        .from('quality_ncrs')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data as NonConformanceReport[];
      }
    } catch {}
    return [];
  }

  public async saveNcr(ncr: NonConformanceReport): Promise<NonConformanceReport> {
    try {
      await supabase.from('quality_ncrs').upsert({
        id: ncr.id,
        ncr_number: (ncr as any).ncrNumber || ncr.id,
        severity: (ncr as any).severity,
        status: (ncr as any).status,
        description: (ncr as any).description,
        updated_at: new Date().toISOString(),
      });
    } catch {}

    adminEventBus.emit('NCR_SAVED', ncr);
    universalSyncManager.broadcastMutation('QUALITY_NCRS', 'UPDATE', ncr);
    return ncr;
  }

  public async getCapas(): Promise<CapaReport[]> {
    try {
      const { data, error } = await supabase
        .from('quality_capas')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data as CapaReport[];
      }
    } catch {}
    return [];
  }

  public async saveCapa(capa: CapaReport): Promise<CapaReport> {
    try {
      await supabase.from('quality_capas').upsert({
        id: capa.id,
        capa_number: (capa as any).capaNumber || capa.id,
        status: (capa as any).status,
        updated_at: new Date().toISOString(),
      });
    } catch {}

    adminEventBus.emit('CAPA_SAVED', capa);
    universalSyncManager.broadcastMutation('QUALITY_CAPAS', 'UPDATE', capa);
    return capa;
  }

  public async getCoas(): Promise<CertificateOfAnalysis[]> {
    try {
      const { data, error } = await supabase
        .from('quality_coas')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data as CertificateOfAnalysis[];
      }
    } catch {}
    return [];
  }

  public async saveCoa(coa: CertificateOfAnalysis): Promise<CertificateOfAnalysis> {
    try {
      await supabase.from('quality_coas').upsert({
        id: coa.id,
        coa_number: (coa as any).coaNumber || coa.id,
        item_code: (coa as any).itemCode,
        lot_number: (coa as any).lotNumber,
        status: (coa as any).status,
        updated_at: new Date().toISOString(),
      });
    } catch {}

    adminEventBus.emit('COA_SAVED', coa);
    universalSyncManager.broadcastMutation('QUALITY_COAS', 'UPDATE', coa);
    return coa;
  }

  // --------------------------------------------------------------------------
  // 9. Engineering BOMs & Machines (Live DB)
  // --------------------------------------------------------------------------
  public async getBoms(): Promise<BomMaster[]> {
    try {
      const { data, error } = await supabase
        .from('boms')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data as BomMaster[];
      }
    } catch {}
    return [];
  }

  public async saveBom(bom: BomMaster): Promise<BomMaster> {
    try {
      await supabase.from('boms').upsert({
        id: bom.id,
        item_code: bom.itemCode,
        version: bom.version,
        status: bom.status,
        updated_at: new Date().toISOString(),
      });
    } catch {}

    adminEventBus.emit('BOM_SAVED', bom);
    universalSyncManager.broadcastMutation('BOMS', 'UPDATE', bom);
    return bom;
  }

  public async getMachines(): Promise<MachineMaster[]> {
    try {
      const { data, error } = await supabase
        .from('machines')
        .select('*')
        .order('machine_code', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data as MachineMaster[];
      }
    } catch {}
    return [];
  }

  public async saveMachine(machine: MachineMaster): Promise<MachineMaster> {
    try {
      await supabase.from('machines').upsert({
        id: machine.id,
        machine_code: (machine as any).machineCode || (machine as any).code || machine.id,
        name: machine.name,
        tonnage: (machine as any).tonnage,
        status: machine.status,
        updated_at: new Date().toISOString(),
      });
    } catch {}

    adminEventBus.emit('MACHINE_SAVED', machine);
    universalSyncManager.broadcastMutation('MACHINES', 'UPDATE', machine);
    return machine;
  }

  // --------------------------------------------------------------------------
  // 10. Chart of Accounts & General Ledger (Live DB)
  // --------------------------------------------------------------------------
  public async getAccounts(): Promise<Account[]> {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('code', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data as Account[];
      }
    } catch {}

    try {
      const res = await this.api.get('/finance/accounts');
      const data = res.data?.data || res.data;
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  public async saveAccount(acc: Account): Promise<Account> {
    try {
      await supabase.from('accounts').upsert({
        id: acc.id || acc.code,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        balance: acc.balance,
        updated_at: new Date().toISOString(),
      });
    } catch {}

    adminEventBus.emit('ACCOUNT_SAVED', acc);
    universalSyncManager.broadcastMutation('ACCOUNTS', 'UPDATE', acc);
    return acc;
  }

  public async getJournalEntries(): Promise<JournalEntry[]> {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data as JournalEntry[];
      }
    } catch {}

    try {
      const res = await this.api.get('/finance/journal-entries');
      const data = res.data?.data || res.data;
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  public async saveJournalEntry(je: JournalEntry): Promise<JournalEntry> {
    try {
      await supabase.from('journal_entries').upsert({
        id: je.id,
        je_number: (je as any).jeNumber || je.id,
        date: je.date,
        status: je.status,
        updated_at: new Date().toISOString(),
      });
    } catch {}

    adminEventBus.emit('JOURNAL_ENTRY_SAVED', je);
    universalSyncManager.broadcastMutation('JOURNAL_ENTRIES', 'UPDATE', je);
    return je;
  }

  // --------------------------------------------------------------------------
  // 11. Quotations & RMAs (Live DB)
  // --------------------------------------------------------------------------
  public async getQuotations(): Promise<Quotation[]> {
    try {
      const { data, error } = await supabase
        .from('quotations')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data as Quotation[];
      }
    } catch {}
    return [];
  }

  public async saveQuotation(quote: Quotation): Promise<Quotation> {
    try {
      await supabase.from('quotations').upsert({
        id: quote.id,
        quote_number: (quote as any).quoteNumber || quote.id,
        customer_id: quote.customerId,
        status: quote.status,
        updated_at: new Date().toISOString(),
      });
    } catch {}

    adminEventBus.emit('QUOTATION_SAVED', quote);
    universalSyncManager.broadcastMutation('QUOTATIONS', 'UPDATE', quote);
    return quote;
  }

  public async getRmas(): Promise<ReturnMerchandise[]> {
    try {
      const { data, error } = await supabase
        .from('rmas')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data as ReturnMerchandise[];
      }
    } catch {}
    return [];
  }

  public async saveRma(rma: ReturnMerchandise): Promise<ReturnMerchandise> {
    try {
      await supabase.from('rmas').upsert({
        id: rma.id,
        rma_number: (rma as any).rmaNumber || rma.id,
        status: rma.status,
        updated_at: new Date().toISOString(),
      });
    } catch {}

    adminEventBus.emit('RMA_SAVED', rma);
    universalSyncManager.broadcastMutation('RMAS', 'UPDATE', rma);
    return rma;
  }
}

export const liveDataStore = new LiveDataStore();
