import axios from 'axios';
import { db } from '../shared/db';
import { adminEventBus } from './adminService';
import { broadcastLocalMutation } from './realtime/supabaseRealtime';
import { itemService } from './itemService';
import {
  initialAccounts,
  initialJournalEntries,
  initialWorkOrders,
  initialMachines,
  initialPurchaseOrders,
  initialSalesOrders,
  initialCustomers,
  initialQuotations,
  initialSalesRmas,
  initialNcrs,
  initialCapas,
  initialCoas,
  initialBoms,
} from '../data/initialData';
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

import { getApiBaseUrl } from '../shared/config';

const API_BASE = getApiBaseUrl('/api/v1');

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
      broadcastLocalMutation('WORK_ORDERS', 'UPDATE', result.workOrder);
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
    return itemService.getItems();
  }

  public async updateItem(item: ItemMaster): Promise<ItemMaster> {
    const saved = await itemService.saveItem(item);
    adminEventBus.emit('ITEM_SAVED', saved);
    broadcastLocalMutation('ITEMS', 'UPDATE', saved);
    return saved;
  }

  // --------------------------------------------------------------------------
  // 4. Work Orders (Live DB)
  // --------------------------------------------------------------------------
  public async getWorkOrders(): Promise<WorkOrder[]> {
    try {
      const data = await db.findMany<WorkOrder>('work_orders', {
        orderBy: { column: 'created_at', ascending: false },
      });

      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (e) {
      console.debug('[liveDataStore] getWorkOrders error:', e);
    }
    return initialWorkOrders;
  }

  public async saveWorkOrder(wo: WorkOrder): Promise<WorkOrder> {
    try {
      await db.upsert('work_orders', {
        id: wo.id,
        item_code: wo.item || (wo as any).itemCode,
        machine_id: wo.machine || (wo as any).machineId,
        status: wo.status,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.debug('[liveDataStore] saveWorkOrder error:', e);
    }

    adminEventBus.emit('WORK_ORDER_SAVED', wo);
    broadcastLocalMutation('WORK_ORDERS', 'INSERT', wo);
    return wo;
  }

  // --------------------------------------------------------------------------
  // 5. Purchase Orders (Live DB)
  // --------------------------------------------------------------------------
  public async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    try {
      const data = await db.findMany<PurchaseOrder>('purchase_orders', {
        orderBy: { column: 'created_at', ascending: false },
      });

      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (e) {
      console.debug('[liveDataStore] getPurchaseOrders error:', e);
    }
    return initialPurchaseOrders;
  }

  public async savePurchaseOrder(po: PurchaseOrder): Promise<PurchaseOrder> {
    try {
      await db.upsert('purchase_orders', {
        id: po.id,
        supplier_id: (po as any).supplierId || (po as any).supplier,
        status: (po as any).status,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.debug('[liveDataStore] savePurchaseOrder error:', e);
    }

    adminEventBus.emit('PURCHASE_ORDER_SAVED', po);
    broadcastLocalMutation('PURCHASE_ORDERS', 'UPDATE', po);
    return po;
  }

  // --------------------------------------------------------------------------
  // 6. Sales Orders (Live DB)
  // --------------------------------------------------------------------------
  public async getSalesOrders(): Promise<SalesOrder[]> {
    try {
      const data = await db.findMany<SalesOrder>('sales_orders', {
        orderBy: { column: 'created_at', ascending: false },
      });

      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (e) {
      console.debug('[liveDataStore] getSalesOrders error:', e);
    }
    return initialSalesOrders;
  }

  public async saveSalesOrder(so: SalesOrder): Promise<SalesOrder> {
    try {
      await db.upsert('sales_orders', {
        id: so.id,
        so_number: (so as any).soNumber || so.id,
        customer_id: (so as any).customerId || (so as any).customer,
        customer_name: (so as any).customerName,
        status: (so as any).status,
        total_value: (so as any).totalValue || (so as any).totalAmount || 0,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.debug('[liveDataStore] saveSalesOrder error:', e);
    }

    adminEventBus.emit('SALES_ORDER_SAVED', so);
    broadcastLocalMutation('SALES_ORDERS', 'UPDATE', so);
    return so;
  }

  // --------------------------------------------------------------------------
  // 7. Customers Master (Live DB)
  // --------------------------------------------------------------------------
  public async getCustomers(): Promise<Customer[]> {
    try {
      const data = await db.findMany<Customer>('customers', {
        orderBy: { column: 'name', ascending: true },
      });

      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (e) {
      console.debug('[liveDataStore] getCustomers error:', e);
    }
    return initialCustomers;
  }

  public async saveCustomer(customer: Customer): Promise<Customer> {
    try {
      await db.upsert('customers', {
        id: (customer as any).id || customer.code,
        code: customer.code,
        name: customer.name,
        email: (customer as any).email,
        phone: (customer as any).phone,
        status: (customer as any).status || 'Active',
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.debug('[liveDataStore] saveCustomer error:', e);
    }

    adminEventBus.emit('CUSTOMER_SAVED', customer);
    broadcastLocalMutation('CUSTOMERS', 'UPDATE', customer);
    return customer;
  }

  // --------------------------------------------------------------------------
  // 8. Quality NCR, CAPA, COA (Live DB)
  // --------------------------------------------------------------------------
  public async getNcrs(): Promise<NonConformanceReport[]> {
    try {
      const data = await db.findMany<NonConformanceReport>('quality_ncrs', {
        orderBy: { column: 'created_at', ascending: false },
      });

      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (e) {
      console.debug('[liveDataStore] getNcrs error:', e);
    }
    return initialNcrs;
  }

  public async saveNcr(ncr: NonConformanceReport): Promise<NonConformanceReport> {
    try {
      await db.upsert('quality_ncrs', {
        id: ncr.id,
        ncr_number: (ncr as any).ncrNumber || ncr.id,
        severity: (ncr as any).severity,
        status: (ncr as any).status,
        description: (ncr as any).description,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.debug('[liveDataStore] saveNcr error:', e);
    }

    adminEventBus.emit('NCR_SAVED', ncr);
    broadcastLocalMutation('QUALITY_NCRS', 'UPDATE', ncr);
    return ncr;
  }

  public async getCapas(): Promise<CapaReport[]> {
    try {
      const data = await db.findMany<CapaReport>('quality_capas', {
        orderBy: { column: 'created_at', ascending: false },
      });

      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (e) {
      console.debug('[liveDataStore] getCapas error:', e);
    }
    return initialCapas;
  }

  public async saveCapa(capa: CapaReport): Promise<CapaReport> {
    try {
      await db.upsert('quality_capas', {
        id: capa.id,
        capa_number: (capa as any).capaNumber || capa.id,
        status: (capa as any).status,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.debug('[liveDataStore] saveCapa error:', e);
    }

    adminEventBus.emit('CAPA_SAVED', capa);
    broadcastLocalMutation('QUALITY_CAPAS', 'UPDATE', capa);
    return capa;
  }

  public async getCoas(): Promise<CertificateOfAnalysis[]> {
    try {
      const data = await db.findMany<CertificateOfAnalysis>('quality_coas', {
        orderBy: { column: 'created_at', ascending: false },
      });

      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (e) {
      console.debug('[liveDataStore] getCoas error:', e);
    }
    return initialCoas as any[];
  }

  public async saveCoa(coa: CertificateOfAnalysis): Promise<CertificateOfAnalysis> {
    try {
      await db.upsert('quality_coas', {
        id: coa.id,
        coa_number: (coa as any).coaNumber || coa.id,
        item_code: (coa as any).itemCode,
        lot_number: (coa as any).lotNumber,
        status: (coa as any).status,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.debug('[liveDataStore] saveCoa error:', e);
    }

    adminEventBus.emit('COA_SAVED', coa);
    broadcastLocalMutation('QUALITY_COAS', 'UPDATE', coa);
    return coa;
  }

  // --------------------------------------------------------------------------
  // 9. Engineering BOMs & Machines (Live DB)
  // --------------------------------------------------------------------------
  public async getBoms(): Promise<BomMaster[]> {
    try {
      const data = await db.findMany<BomMaster>('boms', {
        orderBy: { column: 'created_at', ascending: false },
      });

      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (e) {
      console.debug('[liveDataStore] getBoms error:', e);
    }
    return initialBoms;
  }

  public async saveBom(bom: BomMaster): Promise<BomMaster> {
    try {
      await db.upsert('boms', {
        id: bom.id,
        item_code: bom.itemCode,
        version: bom.version,
        status: bom.status,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.debug('[liveDataStore] saveBom error:', e);
    }

    adminEventBus.emit('BOM_SAVED', bom);
    broadcastLocalMutation('BOMS', 'UPDATE', bom);
    return bom;
  }

  public async getMachines(): Promise<MachineMaster[]> {
    try {
      const data = await db.findMany<MachineMaster>('machines', {
        orderBy: { column: 'machine_code', ascending: true },
      });

      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (e) {
      console.debug('[liveDataStore] getMachines error:', e);
    }
    return initialMachines;
  }

  public async saveMachine(machine: MachineMaster): Promise<MachineMaster> {
    try {
      await db.upsert('machines', {
        id: machine.id,
        machine_code: (machine as any).machineCode || (machine as any).code || machine.id,
        name: machine.name,
        tonnage: (machine as any).tonnage,
        status: machine.status,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.debug('[liveDataStore] saveMachine error:', e);
    }

    adminEventBus.emit('MACHINE_SAVED', machine);
    adminEventBus.emit('MACHINES_SYNCED');
    broadcastLocalMutation('MACHINES', 'UPDATE', machine);
    return machine;
  }

  public async deleteMachine(id: string): Promise<boolean> {
    try {
      await db.delete('machines', id);
    } catch (e) {
      console.debug('[liveDataStore] deleteMachine error:', e);
    }

    adminEventBus.emit('MACHINE_DELETED', { id });
    adminEventBus.emit('MACHINES_SYNCED');
    broadcastLocalMutation('MACHINES', 'DELETE', { id });
    return true;
  }

  // --------------------------------------------------------------------------
  // 10. Chart of Accounts & General Ledger (Live DB)
  // --------------------------------------------------------------------------
  public async getAccounts(): Promise<Account[]> {
    try {
      const data = await db.findMany<Account>('accounts', {
        orderBy: { column: 'code', ascending: true },
      });

      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (e) {
      console.debug('[liveDataStore] getAccounts error:', e);
    }
    return initialAccounts as any[];
  }

  public async saveAccount(acc: Account): Promise<Account> {
    try {
      await db.upsert('accounts', {
        id: (acc as any).id || acc.code,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        balance: acc.balance,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.debug('[liveDataStore] saveAccount error:', e);
    }

    adminEventBus.emit('ACCOUNT_SAVED', acc);
    broadcastLocalMutation('ACCOUNTS', 'UPDATE', acc);
    return acc;
  }

  public async getJournalEntries(): Promise<JournalEntry[]> {
    try {
      const data = await db.findMany<JournalEntry>('journal_entries', {
        orderBy: { column: 'created_at', ascending: false },
      });

      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (e) {
      console.debug('[liveDataStore] getJournalEntries error:', e);
    }
    return initialJournalEntries as any[];
  }

  public async saveJournalEntry(je: JournalEntry): Promise<JournalEntry> {
    try {
      await db.upsert('journal_entries', {
        id: je.id,
        je_number: (je as any).jeNumber || je.id,
        date: je.date,
        status: (je as any).status,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.debug('[liveDataStore] saveJournalEntry error:', e);
    }

    adminEventBus.emit('JOURNAL_ENTRY_SAVED', je);
    broadcastLocalMutation('JOURNAL_ENTRIES', 'UPDATE', je);
    return je;
  }

  // --------------------------------------------------------------------------
  // 11. Quotations & RMAs (Live DB)
  // --------------------------------------------------------------------------
  public async getQuotations(): Promise<Quotation[]> {
    try {
      const data = await db.findMany<Quotation>('quotations', {
        orderBy: { column: 'created_at', ascending: false },
      });

      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (e) {
      console.debug('[liveDataStore] getQuotations error:', e);
    }
    return initialQuotations;
  }

  public async saveQuotation(quote: Quotation): Promise<Quotation> {
    try {
      await db.upsert('quotations', {
        id: quote.id,
        quote_number: (quote as any).quoteNumber || quote.id,
        customer_id: (quote as any).customerId || (quote as any).customer,
        status: (quote as any).status,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.debug('[liveDataStore] saveQuotation error:', e);
    }

    adminEventBus.emit('QUOTATION_SAVED', quote);
    broadcastLocalMutation('QUOTATIONS', 'UPDATE', quote);
    return quote;
  }

  public async getRmas(): Promise<ReturnMerchandise[]> {
    try {
      const data = await db.findMany<ReturnMerchandise>('rmas', {
        orderBy: { column: 'created_at', ascending: false },
      });

      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (e) {
      console.debug('[liveDataStore] getRmas error:', e);
    }
    return initialSalesRmas as any[];
  }

  public async saveRma(rma: ReturnMerchandise): Promise<ReturnMerchandise> {
    try {
      await db.upsert('rmas', {
        id: rma.id,
        rma_number: (rma as any).rmaNumber || rma.id,
        status: rma.status,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.debug('[liveDataStore] saveRma error:', e);
    }

    adminEventBus.emit('RMA_SAVED', rma);
    broadcastLocalMutation('RMAS', 'UPDATE', rma);
    return rma;
  }
}

export const liveDataStore = new LiveDataStore();
