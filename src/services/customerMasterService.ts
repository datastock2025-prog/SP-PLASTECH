import { CustomerMasterRecord, LIVE_CUSTOMERS_CATALOG } from '../data/liveCustomersCatalog';
import { adminEventBus } from './adminService';

const STORAGE_KEY = 'reboot_erp_customer_master_catalog';

export interface CustomerPoVersion {
  version: string;
  poNumber: string;
  poDate: string;
  validFrom?: string;
  validTill?: string;
  changeReason: string;
  changedBy: string;
  changedAt: string;
  notes?: string;
}

export interface ContractedCustomerLine {
  id?: string;
  itemCode: string;
  itemName: string;
  customerPartNumber?: string;
  unitPrice: number;
  hsn?: string;
  gstRatePct?: number;
  polymerGrade?: string;
  mouldCode?: string;
  uom?: string;
}

export interface EnrichedCustomerRecord extends CustomerMasterRecord {
  poNumber?: string;
  poDate?: string;
  poExpiryDate?: string;
  poVersions?: CustomerPoVersion[];
  contractedLines?: ContractedCustomerLine[];
  priceList?: string;
  freightTerms?: string;
  freightAmount?: number;
  packingAmount?: number;
  packagingType?: string;
  packagingInstructions?: string;
  coaRequired?: boolean;
  rohsRequired?: boolean;
  reachRequired?: boolean;
  foodGradeRequired?: boolean;
  batchTraceabilityRequired?: boolean;
  preferredTransporter?: string;
  transporterGstin?: string;
  transportMode?: string;
  incoterms?: string;
  dispatchPoint?: string;
  deliveryTerms?: string;
  shippingAddress?: string;
}

// Initial PO seeding for prominent customers
const DEFAULT_ENRICHMENTS: Record<string, Partial<EnrichedCustomerRecord>> = {
  '12398': {
    poNumber: 'PO-TM-2026-9022',
    poDate: '2026-09-08',
    poVersions: [
      {
        version: 'v2.1 (Rev 03)',
        poNumber: 'PO-TM-2026-9022',
        poDate: '2026-09-08',
        changeReason: 'Monthly Schedule Release & Rate Extension',
        changedBy: 'Ramesh Patel (Key Account Lead)',
        changedAt: '2026-09-08 09:30',
        notes: 'Monthly release for Nexon/Harrier injection molded bezels.',
      },
      {
        version: 'v1.0 (Initial)',
        poNumber: 'PO-TM-2026-8941',
        poDate: '2026-08-01',
        changeReason: 'Initial Annual Rate Contract',
        changedBy: 'Commercial Desk',
        changedAt: '2026-08-01 10:00',
        notes: 'Annual Tier-1 Supplier PO setup.',
      },
    ],
    contractedLines: [
      {
        itemCode: 'FG-708027010001',
        itemName: 'ARMPAD INSERT - 50MM(HFRL)',
        customerPartNumber: '708027010001',
        unitPrice: 55.0,
        hsn: '39269099',
        gstRatePct: 18,
        uom: 'PCS',
        polymerGrade: 'PP-HFRL',
        mouldCode: 'M-TM-ARM-01',
      },
      {
        itemCode: 'FG-AUTO-012',
        itemName: 'ABS Dashboard Trim Bezel (Matte Black)',
        customerPartNumber: 'TATA-7890-DSB',
        unitPrice: 55.0,
        hsn: '39269099',
        gstRatePct: 18,
        uom: 'PCS',
        polymerGrade: 'ABS Injection Grade',
        mouldCode: 'M-TM-DSB-02',
      },
      {
        itemCode: 'FG-AUTO-045',
        itemName: 'PP Air Duct Housing - Front Left',
        customerPartNumber: 'TATA-4412-ADH',
        unitPrice: 42.0,
        hsn: '39269099',
        gstRatePct: 18,
        uom: 'PCS',
        polymerGrade: 'PP Copolymer 30% GF',
        mouldCode: 'M-TM-ADH-01',
      },
    ],
    priceList: 'Tier-1 Automotive OEM Matrix 2026',
    freightTerms: 'Paid & Billed',
    freightAmount: 4500,
    packingAmount: 2000,
    packagingType: 'Corrugated Box with VCI Liner',
    packagingInstructions: '50 PCS per box. Individual bubble wrap. Plastic layer separator. Barcode label on Box front & top.',
    preferredTransporter: 'VRL Logistics Ltd',
    transporterGstin: '29AABCV1234F1Z1',
    transportMode: 'Road',
    incoterms: 'DAP - Delivered At Place',
    dispatchPoint: 'Plant 1 - Pimpri Gate #2',
    deliveryTerms: 'Immediate JIT Delivery within 48 Hours',
    shippingAddress: 'Assembly Line Gate #3, Tata Motors Works, Pimpri, Pune - 411018',
  },
  'BAJAJ': {
    poNumber: 'BAJ-DISP-0911',
    poDate: '2026-09-10',
    poVersions: [
      {
        version: 'Rev 04',
        poNumber: 'BAJ-DISP-0911',
        poDate: '2026-09-10',
        changeReason: 'Spike In Demand - Dominar/Pulsar Mudguards',
        changedBy: 'Vikram Shinde',
        changedAt: '2026-09-10 08:45',
        notes: 'Additional 8,000 PCS approved by Bajaj procurement head.',
      },
    ],
    contractedLines: [
      {
        itemCode: 'FG-MOTO-088',
        itemName: 'Nylon Front Fork Guard (UV Stabilized)',
        customerPartNumber: 'BAJ-CWL-900',
        unitPrice: 76.0,
        hsn: '39269099',
        gstRatePct: 18,
        uom: 'PCS',
        polymerGrade: 'PA66 UV Heat Resistant',
        mouldCode: 'M-BAJ-FRK-01',
      },
      {
        itemCode: 'FG-MOTO-091',
        itemName: 'Nylon-6 Reinforced Rear Mudguard Cowl',
        customerPartNumber: 'BAJ-FND-104',
        unitPrice: 95.0,
        hsn: '39269099',
        gstRatePct: 18,
        uom: 'PCS',
        polymerGrade: 'PA6 Mineral Filled',
        mouldCode: 'M-BAJ-MDG-02',
      },
    ],
    priceList: 'Tier-1 Automotive OEM Matrix 2026',
    paymentTerms: 'Net 30 Days RTGS',
    packagingType: 'Heavy-Duty Corrugated Master Carton',
    preferredTransporter: 'VRL Logistics Ltd',
    transporterGstin: '29AABCV1234F1Z1',
    transportMode: 'Road',
    incoterms: 'DAP - Delivered At Place',
    dispatchPoint: 'Plant 1 - Pimpri Gate #2',
    deliveryTerms: 'Immediate JIT Delivery within 48 Hours',
    shippingAddress: 'Chakan Industrial Area, Phase II, Pune - 410501',
  },
  'MARICO': {
    poNumber: 'PO-MRC-55029',
    poDate: '2026-09-09',
    poVersions: [
      {
        version: 'v3.0',
        poNumber: 'PO-MRC-55029',
        poDate: '2026-09-09',
        changeReason: 'Monthly Oil Cap Schedule Update',
        changedBy: 'Amit Joshi',
        changedAt: '2026-09-09 11:20',
        notes: '28mm Flip-Top Parachute Blue Cap batch release.',
      },
    ],
    contractedLines: [
      {
        itemCode: 'FG-FLIP-28',
        itemName: '28mm PP Flip-Top Dispenser Cap (Parachute Blue)',
        customerPartNumber: 'MAR-CAP-28B',
        unitPrice: 15.5,
        hsn: '39235010',
        gstRatePct: 18,
        uom: 'PCS',
        polymerGrade: 'PP Random Copolymer Food Grade',
        mouldCode: 'M-MAR-CAP-32C',
      },
      {
        itemCode: 'FG-CTN-500',
        itemName: '500ml HDPE Heavy-Duty Chemical Bottle',
        customerPartNumber: 'MAR-BTL-500H',
        unitPrice: 24.0,
        hsn: '39233090',
        gstRatePct: 18,
        uom: 'PCS',
        polymerGrade: 'HDPE Blow Molding Grade',
        mouldCode: 'M-MAR-BTL-01',
      },
    ],
    priceList: 'FMCG Rigid Packaging List',
    paymentTerms: 'Net 30 Days RTGS',
    packagingType: 'Returnable Plastic Crate (RPC)',
    preferredTransporter: 'SafeXpress Logistics',
    transporterGstin: '27AABCS9898F1Z4',
    transportMode: 'Road',
    incoterms: 'DAP - Delivered At Place',
    dispatchPoint: 'Plant 2 - Chakan Main Gate',
    deliveryTerms: 'JIT 24-hour delivery schedule',
    shippingAddress: 'Plot #42, MIDC Chakan, Pune - 410501',
  },
};

function loadStoredCustomers(): EnrichedCustomerRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Could not read customer master catalog from localStorage', err);
  }

  // Initialize from LIVE_CUSTOMERS_CATALOG with enrichments
  const initial: EnrichedCustomerRecord[] = LIVE_CUSTOMERS_CATALOG.map((c) => {
    const enrichmentKey =
      c.code === '12398'
        ? '12398'
        : c.name.toLowerCase().includes('bajaj')
        ? 'BAJAJ'
        : c.name.toLowerCase().includes('marico')
        ? 'MARICO'
        : '';
    const enrichment = enrichmentKey ? DEFAULT_ENRICHMENTS[enrichmentKey] : {};
    return {
      ...c,
      ...enrichment,
      poNumber: enrichment.poNumber || `PO-${c.code}-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      poDate: enrichment.poDate || new Date().toISOString().slice(0, 10),
      poVersions: enrichment.poVersions || [
        {
          version: 'v1.0 (Initial)',
          poNumber: enrichment.poNumber || `PO-${c.code}-2026-01`,
          poDate: new Date().toISOString().slice(0, 10),
          changeReason: 'Initial Account Setup & Contract Creation',
          changedBy: 'Admin / Commercial Team',
          changedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
          notes: 'Standard customer onboarding purchase order.',
        },
      ],
      packagingType: enrichment.packagingType || 'Corrugated Box with VCI Liner',
      packagingInstructions:
        enrichment.packagingInstructions ||
        'Standard master carton packaging with polybag liner and barcode identification.',
      priceList: enrichment.priceList || 'Standard Domestic List',
      preferredTransporter: enrichment.preferredTransporter || 'VRL Logistics Ltd',
      transporterGstin: enrichment.transporterGstin || '29AABCV1234F1Z1',
      transportMode: enrichment.transportMode || 'Road',
      incoterms: enrichment.incoterms || 'DAP - Delivered At Place',
      dispatchPoint: enrichment.dispatchPoint || 'Plant 1 Gate #2',
      deliveryTerms: enrichment.deliveryTerms || 'Immediate JIT Delivery within 48 Hours',
      shippingAddress: enrichment.shippingAddress || c.address || `${c.destination || 'Industrial Estate'}, ${c.state}`,
    };
  });

  saveStoredCustomers(initial);
  return initial;
}

function saveStoredCustomers(customers: EnrichedCustomerRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
  } catch (err) {
    console.warn('Could not save customer master catalog to localStorage', err);
  }
}

class CustomerMasterService {
  private cache: EnrichedCustomerRecord[] = loadStoredCustomers();

  public getCustomersSync(): EnrichedCustomerRecord[] {
    if (!this.cache || this.cache.length === 0) {
      this.cache = loadStoredCustomers();
    }
    return this.cache;
  }

  public getCustomerByCodeOrName(identifier: string): EnrichedCustomerRecord | undefined {
    if (!identifier) return undefined;
    const lower = identifier.toLowerCase().trim();
    return this.getCustomersSync().find(
      (c) =>
        c.code.toLowerCase() === lower ||
        c.name.toLowerCase() === lower ||
        c.shortName?.toLowerCase() === lower ||
        c.name.toLowerCase().includes(lower)
    );
  }

  // LIFO: Resolves the latest / most recent PO number and revision history
  public getLatestPoForCustomer(customerNameOrCode: string): {
    poNumber: string;
    poDate: string;
    version: string;
    history: CustomerPoVersion[];
  } {
    const cust = this.getCustomerByCodeOrName(customerNameOrCode);
    if (!cust) {
      return {
        poNumber: '',
        poDate: new Date().toISOString().slice(0, 10),
        version: 'v1.0',
        history: [],
      };
    }

    const history = cust.poVersions && cust.poVersions.length > 0 ? cust.poVersions : [];
    if (history.length > 0) {
      // LIFO: Newest version is the first in array
      const latest = history[0];
      return {
        poNumber: latest.poNumber || cust.poNumber || '',
        poDate: latest.poDate || cust.poDate || new Date().toISOString().slice(0, 10),
        version: latest.version || 'v1.0',
        history,
      };
    }

    return {
      poNumber: cust.poNumber || '',
      poDate: cust.poDate || new Date().toISOString().slice(0, 10),
      version: 'v1.0',
      history: [],
    };
  }

  public saveCustomer(customer: EnrichedCustomerRecord): EnrichedCustomerRecord {
    const list = this.getCustomersSync();
    const existingIdx = list.findIndex(
      (c) => c.id === customer.id || (c.code && customer.code && c.code === customer.code)
    );

    let savedRecord: EnrichedCustomerRecord;
    if (existingIdx >= 0) {
      savedRecord = {
        ...list[existingIdx],
        ...customer,
      };
      list[existingIdx] = savedRecord;
    } else {
      savedRecord = {
        ...customer,
        id: customer.id || `CUST-${Date.now()}`,
        code: customer.code || this.generateNextCustomerCode(),
        createdOn: customer.createdOn || new Date().toISOString().slice(0, 10),
      };
      list.unshift(savedRecord);
    }

    this.cache = list;
    saveStoredCustomers(list);
    adminEventBus.emit('CUSTOMER_SAVED', savedRecord);
    return savedRecord;
  }

  public addPoAmendment(
    customerIdOrCode: string,
    newPoData: {
      poNumber: string;
      poDate: string;
      version?: string;
      changeReason: string;
      changedBy: string;
      notes?: string;
    }
  ): EnrichedCustomerRecord | undefined {
    const cust = this.getCustomerByCodeOrName(customerIdOrCode);
    if (!cust) return undefined;

    const newVersion: CustomerPoVersion = {
      version: newPoData.version || `Rev 0${(cust.poVersions?.length || 0) + 1}`,
      poNumber: newPoData.poNumber.trim().toUpperCase(),
      poDate: newPoData.poDate || new Date().toISOString().slice(0, 10),
      changeReason: newPoData.changeReason || 'PO Amendment & Volume Extension',
      changedBy: newPoData.changedBy || 'Commercial Operations',
      changedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      notes: newPoData.notes || '',
    };

    const existingVersions = cust.poVersions || [];
    const updatedRecord: EnrichedCustomerRecord = {
      ...cust,
      poNumber: newVersion.poNumber,
      poDate: newVersion.poDate,
      poVersions: [newVersion, ...existingVersions],
    };

    return this.saveCustomer(updatedRecord);
  }

  public deleteCustomer(customerIdOrCode: string): boolean {
    const list = this.getCustomersSync();
    const updated = list.filter(
      (c) => c.id !== customerIdOrCode && c.code !== customerIdOrCode
    );
    if (updated.length !== list.length) {
      this.cache = updated;
      saveStoredCustomers(updated);
      adminEventBus.emit('CUSTOMER_DELETED', customerIdOrCode);
      return true;
    }
    return false;
  }

  public getContractedLinesForCustomer(customerNameOrCode: string): ContractedCustomerLine[] {
    const cust = this.getCustomerByCodeOrName(customerNameOrCode);
    if (!cust) return [];
    if (cust.contractedLines && cust.contractedLines.length > 0) {
      return cust.contractedLines;
    }
    // Default fallback line for any standard customer
    return [
      {
        itemCode: `FG-${cust.code}-01`,
        itemName: `${cust.name.split(' ')[0]} Molded Component Line`,
        customerPartNumber: `${cust.code}-PRT-01`,
        unitPrice: 55.0,
        hsn: '39269099',
        gstRatePct: 18,
        uom: 'PCS',
        polymerGrade: 'PP Injection Molded Grade',
        mouldCode: 'M-01',
      },
    ];
  }

  public generateNextCustomerCode(): string {
    const list = this.getCustomersSync();
    let maxNum = 118;
    list.forEach((c) => {
      const m = c.code.match(/^CUST-(\d+)$/i) || c.code.match(/^(\d+)$/);
      if (m) {
        const n = parseInt(m[1], 10);
        if (n > maxNum) maxNum = n;
      }
    });
    return `CUST-${maxNum + 1}`;
  }
}

export const customerMasterService = new CustomerMasterService();

