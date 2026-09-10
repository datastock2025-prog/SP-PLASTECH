import {
  ItemMaster,
  BomMaster,
  MachineMaster,
  WorkOrder,
  StockTransaction,
  Warehouse,
  BinLocation,
  Supplier,
  PurchaseOrder,
  Customer,
  SalesOrder,
  SalesQuotation,
  SalesRma,
  SalesContract,
  CustomerInvoice,
  CustomerPayment,
  SupplierInvoice,
  GLAccount,
  JournalEntry,
  CreditDebitNote,
  CostCenter,
  CostRollup,
  ProductionVariance,
  NonConformanceReport,
  CapaRecord,
  InspectionPlan,
  QualityCoa,
  CalibrationEquipment,
  QualityDocument,
  QualityAudit,
  LabTest,
  FixedAsset,
  SubcontractJob,
} from '../types';

export const INITIAL_WAREHOUSES: Warehouse[] = [
  { code: 'RM-WH-01', name: 'Raw Material Warehouse 1', cap: 78 },
  { code: 'RM-WH-02', name: 'Additive & Masterbatch Store', cap: 54 },
  { code: 'RG-WH-01', name: 'Regrind Storage', cap: 62 },
  { code: 'FG-WH-01', name: 'Finished Goods Warehouse', cap: 88 },
  { code: 'PK-WH-01', name: 'Packaging Material Store', cap: 40 },
  { code: 'SP-WH-01', name: 'Spare Parts Store', cap: 35 },
];

export const INITIAL_BINS: BinLocation[] = [
  { code: 'RM-WH-01-A1', warehouse: 'RM-WH-01', zone: 'Raw', type: 'Rack', dims: '2.4m × 1.2m × 2m', maxWeight: '2,000 KG', maxVolume: '6 m³', allowed: 'Raw', status: 'active', utilization: 82 },
  { code: 'RM-WH-01-A2', warehouse: 'RM-WH-01', zone: 'Raw', type: 'Rack', dims: '2.4m × 1.2m × 2m', maxWeight: '2,000 KG', maxVolume: '6 m³', allowed: 'Raw', status: 'active', utilization: 75 },
  { code: 'RM-WH-01-QZ', warehouse: 'RM-WH-01', zone: 'Quarantine', type: 'Cage', dims: '1.2m × 1.2m × 2m', maxWeight: '500 KG', maxVolume: '1.5 m³', allowed: 'Quarantine', status: 'active', utilization: 25 },
  { code: 'RM-WH-02-A1', warehouse: 'RM-WH-02', zone: 'Masterbatch', type: 'Rack', dims: '2.4m × 1.2m × 2m', maxWeight: '2,000 KG', maxVolume: '6 m³', allowed: 'Masterbatch', status: 'active', utilization: 54 },
  { code: 'RG-WH-01-A1', warehouse: 'RG-WH-01', zone: 'Regrind', type: 'Floor', dims: '3.0m × 2.0m × 2m', maxWeight: '3,000 KG', maxVolume: '8 m³', allowed: 'Regrind', status: 'active', utilization: 62 },
  { code: 'FG-WH-01-A1', warehouse: 'FG-WH-01', zone: 'Finished Goods', type: 'Rack', dims: '2.4m × 1.2m × 2m', maxWeight: '2,000 KG', maxVolume: '6 m³', allowed: 'Finished Goods', status: 'active', utilization: 88 },
  { code: 'PK-WH-01-A1', warehouse: 'PK-WH-01', zone: 'Packing', type: 'Floor', dims: '2.4m × 1.2m × 2m', maxWeight: '1,500 KG', maxVolume: '5 m³', allowed: 'Packing', status: 'active', utilization: 40 },
  { code: 'SP-WH-01-A1', warehouse: 'SP-WH-01', zone: 'Staging', type: 'Rack', dims: '2.0m × 1.0m × 2m', maxWeight: '1,000 KG', maxVolume: '4 m³', allowed: 'Staging', status: 'active', utilization: 35 },
];

export const INITIAL_ITEMS: ItemMaster[] = [
  {
    code: 'RM-PP-NAT-001',
    name: 'PP Natural Granules',
    type: 'Raw Material',
    cat: 'Polypropylene',
    stock: '12,400 KG',
    avail: '9,800 KG',
    wh: 'RM-WH-01',
    lot: true,
    qc: true,
    status: 'active',
    icon: '◇',
    baseUOM: 'KG',
    resinType: 'Polypropylene, Homopolymer',
    mfi: '12 g/10min',
    density: '0.905 g/cm³',
    moisture: 'Low',
    regrind: '≤ 15%',
    machineCompat: 'IMM 250T, IMM 450T',
    foodGrade: 'Yes',
    hazardClass: 'Non-hazardous',
    countryOrigin: 'India',
    hsCode: '39021000',
    reorderLevel: '4,000 KG',
    safetyStock: '2,000 KG',
    leadTime: '7 days',
    supplier: 'Reliance Polymers',
    valuation: 'Weighted Avg',
    approval: 'approved',
    createdOn: '12 Jun 2026',
    standardCycleTime: 0,
    cycleTimeUOM: 'sec/pc',
    locationCode: 'RM-WH-01-A1',
    lots: [
      { lotId: 'LOT-001-01', qty: 7440, uom: 'KG', mfgDate: '2026-06-25', expiryDate: '2027-06-20', status: 'available', bin: 'RM-WH-01-A1', supplierRef: 'PO-3390', qcRequired: true },
      { lotId: 'LOT-001-02', qty: 4960, uom: 'KG', mfgDate: '2026-07-25', expiryDate: '2027-07-20', status: 'available', bin: 'RM-WH-01-A2', supplierRef: 'PO-3390', qcRequired: true },
    ]
  },
  {
    code: 'RM-HD-GRN-014',
    name: 'HDPE Granules',
    type: 'Raw Material',
    cat: 'Polyethylene',
    stock: '6,200 KG',
    avail: '6,200 KG',
    wh: 'RM-WH-01',
    lot: true,
    qc: true,
    status: 'active',
    icon: '◇',
    baseUOM: 'KG',
    resinType: 'High Density Polyethylene',
    mfi: '0.4 g/10min',
    density: '0.945 g/cm³',
    moisture: 'Low',
    regrind: '≤ 20%',
    machineCompat: 'IMM 450T, EXT Line',
    foodGrade: 'Yes',
    hazardClass: 'Non-hazardous',
    countryOrigin: 'India',
    hsCode: '39012000',
    reorderLevel: '5,000 KG',
    safetyStock: '2,500 KG',
    leadTime: '10 days',
    supplier: 'GAIL Polymers',
    valuation: 'Weighted Avg',
    approval: 'approved',
    createdOn: '15 Jun 2026',
    standardCycleTime: 0,
    cycleTimeUOM: 'sec/pc',
    locationCode: 'RM-WH-01-A1',
    lots: [
      { lotId: 'LOT-014-01', qty: 6200, uom: 'KG', mfgDate: '2026-08-02', expiryDate: '2027-06-28', status: 'available', bin: 'RM-WH-01-A1', supplierRef: 'PO-3391', qcRequired: true }
    ]
  },
  {
    code: 'MB-WHT-002',
    name: 'White Masterbatch',
    type: 'Masterbatch',
    cat: 'Colorant',
    stock: '840 KG',
    avail: '420 KG',
    wh: 'RM-WH-02',
    lot: true,
    qc: true,
    status: 'low',
    icon: '●',
    baseUOM: 'KG',
    reorderLevel: '1,000 KG',
    safetyStock: '500 KG',
    leadTime: '12 days',
    supplier: 'Borealis India',
    valuation: 'Weighted Avg',
    approval: 'approved',
    createdOn: '10 Jun 2026',
    locationCode: 'RM-WH-02-A1',
    lots: [
      { lotId: 'LOT-002-01', qty: 840, uom: 'KG', mfgDate: '2026-05-15', expiryDate: '2026-09-18', status: 'available', bin: 'RM-WH-02-A1', supplierRef: 'PO-3388', qcRequired: true }
    ]
  },
  {
    code: 'MB-BLK-003',
    name: 'Black Masterbatch',
    type: 'Masterbatch',
    cat: 'Colorant',
    stock: '1,120 KG',
    avail: '1,120 KG',
    wh: 'RM-WH-02',
    lot: true,
    qc: false,
    status: 'active',
    icon: '●',
    baseUOM: 'KG',
    approval: 'approved',
    createdOn: '10 Jun 2026',
    locationCode: 'RM-WH-02-A1',
  },
  {
    code: 'AD-UV-009',
    name: 'UV Stabilizer Additive',
    type: 'Additive',
    cat: 'Additive',
    stock: '260 KG',
    avail: '260 KG',
    wh: 'RM-WH-02',
    lot: true,
    qc: true,
    status: 'active',
    icon: '✦',
    baseUOM: 'KG',
    hazardous: true,
    approval: 'approved',
    createdOn: '12 Jun 2026',
    locationCode: 'RM-WH-02-A1',
  },
  {
    code: 'RG-PP-011',
    name: 'Recycled Regrind PP',
    type: 'Regrind',
    cat: 'Regrind',
    stock: '3,050 KG',
    avail: '2,900 KG',
    wh: 'RG-WH-01',
    lot: true,
    qc: true,
    status: 'hold',
    icon: '♻',
    baseUOM: 'KG',
    reprocessCycle: 2,
    maxCycles: 3,
    contaminationLevel: 'Low',
    recycledContentPct: 100,
    sourceWO: 'WO-1188',
    approval: 'approved',
    createdOn: '18 Jun 2026',
    locationCode: 'RG-WH-01-A1',
    lots: [
      { lotId: 'LOT-011-01', qty: 3050, uom: 'KG', mfgDate: '2026-08-10', expiryDate: '2027-08-10', status: 'quarantine', bin: 'RG-WH-01-A1', supplierRef: 'WO-1188', qcRequired: true }
    ]
  },
  {
    code: 'FG-CTN-500',
    name: 'Plastic Container 500ml',
    type: 'Finished Good',
    cat: 'Containers',
    stock: '22,000 PCS',
    avail: '18,400 PCS',
    wh: 'FG-WH-01',
    lot: true,
    qc: true,
    status: 'active',
    icon: '▣',
    baseUOM: 'PCS',
    standardCycleTime: 12.0,
    cycleTimeUOM: 'sec/pc',
    cycleTimeSource: 'Item Master',
    cycleTimeEffective: '01 Jan 2026',
    cycleTimeApprovedBy: 'A. Sharma',
    cycleTimeVersion: 'v1',
    recycledContentPct: 15,
    approval: 'approved',
    createdOn: '01 Jan 2026',
    locationCode: 'FG-WH-01-A1',
    cycleTimeHistory: [
      { old: '—', new: 12.0, by: 'A. Sharma', date: '01 Jan 2026', reason: 'Initial time study', effective: '01 Jan 2026', source: 'Manual' }
    ],
    lots: [
      { lotId: 'LOT-CTN-04', qty: 22000, uom: 'PCS', mfgDate: '2026-08-20', expiryDate: '2028-08-20', status: 'available', bin: 'FG-WH-01-A1', supplierRef: 'WO-1188', qcRequired: true }
    ]
  },
  {
    code: 'FG-PAL-010',
    name: 'Plastic Pallet Heavy Duty',
    type: 'Finished Good',
    cat: 'Pallets',
    stock: '640 PCS',
    avail: '640 PCS',
    wh: 'FG-WH-01',
    lot: false,
    qc: true,
    status: 'active',
    icon: '▣',
    baseUOM: 'PCS',
    standardCycleTime: 45.0,
    cycleTimeUOM: 'sec/pc',
    approval: 'approved',
    createdOn: '05 Jan 2026',
    locationCode: 'FG-WH-01-A1',
  },
  {
    code: 'PK-CTN-021',
    name: 'Export Carton Box L',
    type: 'Packaging',
    cat: 'Packaging',
    stock: '4,800 PCS',
    avail: '4,800 PCS',
    wh: 'PK-WH-01',
    lot: false,
    qc: false,
    status: 'active',
    icon: '▢',
    baseUOM: 'PCS',
    approval: 'approved',
    createdOn: '10 Jan 2026',
    locationCode: 'PK-WH-01-A1',
  },
  {
    code: 'SP-HTB-044',
    name: 'Heater Band — 250T IMM',
    type: 'Spare Part',
    cat: 'Machine Spares',
    stock: '14 PCS',
    avail: '12 PCS',
    wh: 'SP-WH-01',
    lot: false,
    qc: false,
    status: 'active',
    icon: '⚡',
    baseUOM: 'PCS',
    approval: 'approved',
    createdOn: '15 Jan 2026',
    locationCode: 'SP-WH-01-A1',
  },
  {
    code: 'SP-TCP-045',
    name: 'Thermocouple K-Type',
    type: 'Spare Part',
    cat: 'Machine Spares',
    stock: '6 PCS',
    avail: '6 PCS',
    wh: 'SP-WH-01',
    lot: false,
    qc: false,
    status: 'low',
    icon: '⚡',
    baseUOM: 'PCS',
    approval: 'pending',
    createdOn: '19 Aug 2026',
    locationCode: 'SP-WH-01-A1',
  },
  {
    code: 'RM-AB-060',
    name: 'ABS Resin — Injection Grade',
    type: 'Raw Material',
    cat: 'ABS',
    stock: '0 KG',
    avail: '0 KG',
    wh: 'RM-WH-01',
    lot: true,
    qc: true,
    status: 'blocked',
    icon: '◇',
    baseUOM: 'KG',
    moistureSensitive: true,
    approval: 'rejected',
    rejectReason: 'Missing MSDS and supplier COA — resubmit with compliance docs attached.',
    createdOn: '17 Aug 2026',
    locationCode: 'RM-WH-01-A1',
    lots: [
      { lotId: 'LOT-060-01', qty: 2000, uom: 'KG', mfgDate: '2026-08-15', expiryDate: '2027-08-15', status: 'quarantine', bin: 'RM-WH-01-QZ', supplierRef: 'PO-3393', qcRequired: true }
    ]
  },
  {
    code: 'MB-RED-004',
    name: 'Red Masterbatch — Custom Shade',
    type: 'Masterbatch',
    cat: 'Colorant',
    stock: '0 KG',
    avail: '0 KG',
    wh: 'RM-WH-02',
    lot: true,
    qc: true,
    status: 'inactive',
    icon: '●',
    baseUOM: 'KG',
    approval: 'pending',
    createdOn: '20 Aug 2026',
    locationCode: 'RM-WH-02-A1',
  },
  {
    code: 'FG-BKT-010',
    name: 'Household Bucket 10L',
    type: 'Finished Good',
    cat: 'Containers',
    stock: '2,400 PCS',
    avail: '2,400 PCS',
    wh: 'FG-WH-01',
    lot: true,
    qc: true,
    status: 'active',
    icon: '▣',
    baseUOM: 'PCS',
    standardCycleTime: 18.0,
    cycleTimeUOM: 'sec/pc',
    approval: 'approved',
    createdOn: '12 Jan 2026',
    locationCode: 'FG-WH-01-A1',
  },
  {
    code: 'FG-PET-030',
    name: 'PET Bottle Preform',
    type: 'Finished Good',
    cat: 'Preforms',
    stock: '48,000 PCS',
    avail: '40,600 PCS',
    wh: 'FG-WH-01',
    lot: true,
    qc: true,
    status: 'active',
    icon: '▣',
    baseUOM: 'PCS',
    standardCycleTime: 8.5,
    cycleTimeUOM: 'sec/pc',
    approval: 'approved',
    createdOn: '15 Jan 2026',
    locationCode: 'FG-WH-01-A1',
  },
];

export const INITIAL_BOMS: BomMaster[] = [
  {
    id: 'BOM-1042',
    parent: 'FG-CTN-500',
    parentName: 'Plastic Container 500ml',
    version: 'v3',
    status: 'released',
    updated: '12 Aug 2026',
    lines: [
      { item: 'RM-PP-NAT-001', name: 'PP Natural Granules', qty: 0.485, uom: 'KG', scrap: 2, cost: 37.8 },
      { item: 'MB-WHT-002', name: 'White Masterbatch', qty: 0.012, uom: 'KG', scrap: 1, cost: 5.2 },
    ]
  },
  {
    id: 'BOM-1043',
    parent: 'FG-PAL-010',
    parentName: 'Plastic Pallet Heavy Duty',
    version: 'v1',
    status: 'draft',
    updated: '18 Aug 2026',
    lines: [
      { item: 'RM-HD-GRN-014', name: 'HDPE Granules', qty: 8.2, uom: 'KG', scrap: 3, cost: 639.6 },
      { item: 'RG-PP-011', name: 'Recycled Regrind PP', qty: 1.5, uom: 'KG', scrap: 1.5, cost: 117.0 },
    ]
  },
  {
    id: 'BOM-1044',
    parent: 'FG-CTN-500',
    parentName: 'Plastic Container 500ml (Export)',
    version: 'v1',
    status: 'under_review',
    updated: '15 Aug 2026',
    lines: [
      { item: 'RM-PP-NAT-001', name: 'PP Natural Granules', qty: 0.5, uom: 'KG', scrap: 2, cost: 39.0 },
      { item: 'AD-UV-009', name: 'UV Stabilizer Additive', qty: 0.008, uom: 'KG', scrap: 0, cost: 6.1 },
    ]
  },
  {
    id: 'BOM-1045',
    parent: 'FG-PAL-010',
    parentName: 'Plastic Pallet — Lightweight Variant',
    version: 'v2',
    status: 'rejected',
    updated: '19 Aug 2026',
    rejectReason: 'Regrind ratio exceeds 15% allowance on RG-PP-011 — rework scrap % before resubmitting.',
    lines: [
      { item: 'RM-HD-GRN-014', name: 'HDPE Granules', qty: 5.4, uom: 'KG', scrap: 2, cost: 421.2 },
      { item: 'RG-PP-011', name: 'Recycled Regrind PP', qty: 3.1, uom: 'KG', scrap: 4, cost: 241.8 },
    ]
  },
  {
    id: 'BOM-1046',
    parent: 'FG-BKT-010',
    parentName: 'Household Bucket 10L',
    version: 'v2',
    status: 'released',
    updated: '05 Aug 2026',
    lines: [
      { item: 'RM-HD-GRN-014', name: 'HDPE Granules', qty: 0.62, uom: 'KG', scrap: 2.5, cost: 48.4 },
      { item: 'MB-BLK-003', name: 'Black Masterbatch', qty: 0.015, uom: 'KG', scrap: 1, cost: 6.8 },
    ]
  },
  {
    id: 'BOM-1047',
    parent: 'FG-PET-030',
    parentName: 'PET Bottle Preform',
    version: 'v1',
    status: 'released',
    updated: '22 Jul 2026',
    lines: [
      { item: 'RM-PP-NAT-001', name: 'PP Natural Granules', qty: 0.028, uom: 'KG', scrap: 1.5, cost: 2.2 },
    ]
  },
];

export const INITIAL_MACHINES: MachineMaster[] = [
  { id: 'IMM-250T-03', name: 'Injection Molding Machine 250T', type: 'Injection Molding Machine', line: 'Line 3', status: 'running', job: 'WO-1188', lastPM: '02 Aug 2026', nextPM: '02 Sep 2026', tonnage: '250T', approval: 'approved', createdOn: '02 Jan 2026' },
  { id: 'IMM-450T-01', name: 'Injection Molding Machine 450T', type: 'Injection Molding Machine', line: 'Line 1', status: 'idle', job: '—', lastPM: '20 Jul 2026', nextPM: '20 Aug 2026', tonnage: '450T', approval: 'approved', createdOn: '02 Jan 2026' },
  { id: 'EXT-LINE-02', name: 'Extrusion Line 2', type: 'Extrusion Line', line: 'Line 2', status: 'running', job: 'WO-1189', lastPM: '10 Aug 2026', nextPM: '10 Sep 2026', tonnage: '—', approval: 'approved', createdOn: '02 Jan 2026' },
  { id: 'BLW-01', name: 'Blow Molding Machine 01', type: 'Blow Molding Machine', line: 'Line 4', status: 'breakdown', job: '—', lastPM: '01 Jul 2026', nextPM: 'Overdue', tonnage: '—', approval: 'approved', createdOn: '02 Jan 2026' },
  { id: 'MLD-1001', name: 'Mold M-1001 — Container 500ml', type: 'Mold / Tooling', line: '—', status: 'in_use', job: 'WO-1188', lastPM: '—', nextPM: '—', tonnage: '—', approval: 'approved', createdOn: '02 Jan 2026', shotCount: 842000, expectedLifeShots: 1000000, cavityCount: 4 },
  { id: 'GRN-01', name: 'Granulation / Regrind Machine', type: 'Auxiliary Equipment', line: 'Regrind Bay', status: 'idle', job: '—', lastPM: '15 Jul 2026', nextPM: '15 Aug 2026', tonnage: '—', approval: 'approved', createdOn: '02 Jan 2026' },
  { id: 'MLD-1007', name: 'Mold M-1007 — Bucket 10L (New)', type: 'Mold / Tooling', line: '—', status: 'idle', job: '—', lastPM: '—', nextPM: '—', tonnage: '—', approval: 'pending', createdOn: '20 Aug 2026', shotCount: 12000, expectedLifeShots: 800000, cavityCount: 2 },
  { id: 'IMM-350T-02', name: 'Injection Molding Machine 350T (Refurb)', type: 'Injection Molding Machine', line: 'Line 5', status: 'idle', job: '—', lastPM: '—', nextPM: '—', tonnage: '350T', approval: 'rejected', rejectReason: 'Vendor calibration certificate missing — resubmit with certificate attached.', createdOn: '18 Aug 2026' },
];

export const INITIAL_WORK_ORDERS: WorkOrder[] = [
  {
    id: 'WO-1188',
    item: 'FG-CTN-500',
    bomId: 'BOM-1042',
    machine: 'IMM-250T-03',
    day: 'Wed',
    qty: 8000,
    uom: 'PCS',
    completed: 6240,
    scrap: 112,
    status: 'in_progress',
    priority: 'High',
    dueDate: '22 Aug 2026',
    operator: 'R. Kumar',
    downtimeMin: 20,
    mold: 'MLD-1001',
    jitSeq: 1,
    shift: 'Shift A',
    planDate: '2026-08-21',
    cycleTimeStd: 12.0,
    locInput: 'RM-WH-01',
    locOutput: 'FG-WH-01',
    outputLogs: [
      { time: 'Today, 8:10 AM', good: 2400, scrap: 38, by: 'R. Kumar' },
      { time: 'Today, 11:40 AM', good: 3840, scrap: 74, by: 'R. Kumar' }
    ],
    downtimeLogs: [
      { time: 'Today, 10:05 AM', reason: 'Mold temperature adjustment', min: 20, by: 'R. Kumar' }
    ],
    checklist: [
      { label: 'Visual inspection — no flash/burrs', done: true },
      { label: 'Wall thickness within tolerance', done: true },
      { label: 'Weight check (±2g)', done: false }
    ],
    history: [
      { event: 'Work order created', time: '20 Aug 2026, 9:00 AM' },
      { event: 'Released to production', time: '20 Aug 2026, 9:15 AM' },
      { event: 'Production started', time: 'Today, 7:50 AM' }
    ],
    operations: [
      { seq: 1, name: 'Setup / Mold change', workCenter: 'IMM-250T-03', std: '25 min', actual: '22 min', status: 'complete', operator: 'R. Kumar' },
      { seq: 2, name: 'Molding run', workCenter: 'IMM-250T-03', std: '12s / shot', actual: 'Running', status: 'active', operator: 'R. Kumar' },
      { seq: 3, name: 'Cooling', workCenter: 'IMM-250T-03', std: '8 sec', actual: '8.2 sec', status: 'complete', operator: 'R. Kumar' },
      { seq: 4, name: 'Deflashing / trim', workCenter: 'Finishing bay', std: '—', actual: '—', status: 'pending', operator: '—' },
      { seq: 5, name: 'Pack & label', workCenter: 'FG-WH-01', std: '—', actual: '—', status: 'pending', operator: '—' },
    ],
    parameters: [
      { zone: 'Barrel Zone 1', target: '205°C', actual: '207°C', inSpec: true },
      { zone: 'Barrel Zone 2', target: '212°C', actual: '211°C', inSpec: true },
      { zone: 'Nozzle', target: '218°C', actual: '220°C', inSpec: true },
      { zone: 'Mold temp', target: '35°C', actual: '38°C', inSpec: true },
      { zone: 'Injection pressure', target: '850 bar', actual: '845 bar', inSpec: true },
      { zone: 'Screw speed', target: '120 rpm', actual: '118 rpm', inSpec: true },
      { zone: 'Cycle time', target: '12.0 sec', actual: '12.1 sec', inSpec: true },
    ],
    signoffs: { operator: false, supervisor: false, qa: false }
  },
  {
    id: 'WO-1189',
    item: 'FG-PET-030',
    bomId: 'BOM-1047',
    machine: 'EXT-LINE-02',
    day: 'Mon',
    qty: 2400,
    uom: 'KG',
    completed: 2400,
    scrap: 50,
    status: 'completed',
    priority: 'Medium',
    dueDate: '19 Aug 2026',
    operator: 'S. Nair',
    downtimeMin: 15,
    jitSeq: 2,
    shift: 'Shift B',
    planDate: '2026-08-19',
    cycleTimeStd: 8.5,
    locInput: 'RM-WH-01',
    locOutput: 'FG-WH-01',
    outputLogs: [
      { time: '19 Aug, 2:00 PM', good: 2400, scrap: 50, by: 'S. Nair' }
    ],
    downtimeLogs: [
      { time: '19 Aug, 9:30 AM', reason: 'Material changeover', min: 15, by: 'S. Nair' }
    ],
    checklist: [
      { label: 'Visual inspection — no flash/burrs', done: true },
      { label: 'Wall thickness within tolerance', done: true },
      { label: 'Weight check (±2g)', done: true }
    ],
    history: [
      { event: 'Work order created', time: '18 Aug 2026, 8:00 AM' },
      { event: 'Released to production', time: '18 Aug 2026, 8:20 AM' },
      { event: 'Production started', time: '19 Aug 2026, 7:00 AM' },
      { event: 'Marked completed', time: '19 Aug 2026, 2:05 PM' }
    ],
    signoffs: { operator: true, supervisor: true, qa: true }
  },
  {
    id: 'WO-1190',
    item: 'FG-BKT-010',
    bomId: 'BOM-1046',
    machine: 'IMM-450T-01',
    day: 'Tue',
    qty: 3000,
    uom: 'PCS',
    completed: 860,
    scrap: 8,
    status: 'material_wait',
    priority: 'Medium',
    dueDate: '24 Aug 2026',
    operator: 'A. Sharma',
    downtimeMin: 0,
    jitSeq: 3,
    shift: 'Shift A',
    planDate: '2026-08-20',
    cycleTimeStd: 18.0,
    locInput: 'RM-WH-01',
    locOutput: 'FG-WH-01',
    outputLogs: [
      { time: 'Yesterday, 3:20 PM', good: 860, scrap: 8, by: 'A. Sharma' }
    ],
    downtimeLogs: [],
    checklist: [
      { label: 'Visual inspection — no flash/burrs', done: true },
      { label: 'Wall thickness within tolerance', done: false },
      { label: 'Weight check (±2g)', done: false }
    ],
    history: [
      { event: 'Work order created', time: '19 Aug 2026, 10:00 AM' },
      { event: 'Released to production', time: '19 Aug 2026, 10:30 AM' },
      { event: 'Production started', time: 'Yesterday, 2:00 PM' },
      { event: 'Flagged material shortage — HDPE Granules', time: 'Yesterday, 4:00 PM' }
    ]
  },
  {
    id: 'WO-1191',
    item: 'FG-PET-030',
    bomId: 'BOM-1047',
    machine: 'BLW-01',
    day: 'Thu',
    qty: 15000,
    uom: 'PCS',
    completed: 4120,
    scrap: 230,
    status: 'quality_hold',
    priority: 'High',
    dueDate: '23 Aug 2026',
    operator: 'K. Iyer',
    downtimeMin: 35,
    jitSeq: 4,
    shift: 'Shift A',
    planDate: '2026-08-21',
    cycleTimeStd: 12.0,
    locInput: 'RM-WH-01',
    locOutput: 'FG-WH-01',
    outputLogs: [
      { time: 'Today, 9:00 AM', good: 4120, scrap: 230, by: 'K. Iyer' }
    ],
    downtimeLogs: [
      { time: 'Today, 10:40 AM', reason: 'Quality check hold', min: 35, by: 'Quality team' }
    ],
    checklist: [
      { label: 'Visual inspection — no flash/burrs', done: false },
      { label: 'Wall thickness within tolerance', done: false },
      { label: 'Weight check (±2g)', done: false }
    ],
    history: [
      { event: 'Work order created', time: '21 Aug 2026, 7:00 AM' },
      { event: 'Released to production', time: '21 Aug 2026, 7:20 AM' },
      { event: 'Production started', time: 'Today, 6:30 AM' },
      { event: 'Placed on quality hold — scrap rate exceeds 5%', time: 'Today, 10:40 AM' }
    ],
    parameters: [
      { zone: 'Barrel Zone 1', target: '205°C', actual: '207°C', inSpec: true },
      { zone: 'Injection pressure', target: '850 bar', actual: '910 bar', inSpec: false },
      { zone: 'Cycle time', target: '12.0 sec', actual: '13.4 sec', inSpec: false },
    ]
  },
  {
    id: 'WO-1192',
    item: 'FG-CTN-500',
    bomId: 'BOM-1042',
    machine: null,
    day: null,
    qty: 5000,
    uom: 'PCS',
    completed: 0,
    scrap: 0,
    status: 'planned',
    priority: 'Low',
    dueDate: '28 Aug 2026',
    operator: '—',
    downtimeMin: 0,
    jitSeq: 5,
    shift: 'Shift A',
    planDate: '2026-08-28',
    cycleTimeStd: 12.0,
    locInput: 'RM-WH-01',
    locOutput: 'FG-WH-01',
    outputLogs: [],
    downtimeLogs: [],
    checklist: [
      { label: 'Visual inspection — no flash/burrs', done: false },
      { label: 'Wall thickness within tolerance', done: false },
      { label: 'Weight check (±2g)', done: false }
    ],
    history: [
      { event: 'Work order created', time: 'Today, 8:00 AM' }
    ]
  }
];

export const INITIAL_STOCK_TXNS: StockTransaction[] = [
  { id: 'GRN-4521', type: 'receipt', item: 'RM-PP-NAT-001', qty: 2400, uom: 'KG', wh: 'RM-WH-01', ref: 'PO-3390', date: 'Today', by: 'Priya Rao' },
  { id: 'ISS-1187', type: 'issue', item: 'RM-PP-NAT-001', qty: -860, uom: 'KG', wh: 'RM-WH-01', ref: 'WO-1188', date: 'Yesterday', by: 'Production' },
  { id: 'TRF-0091', type: 'transfer', item: 'MB-WHT-002', qty: 200, uom: 'KG', fromWh: 'RM-WH-02', toWh: 'RM-WH-01', date: '20 Aug 2026', by: 'Warehouse team' },
  { id: 'ADJ-0034', type: 'adjustment', item: 'RM-AB-060', qty: -50, uom: 'KG', wh: 'RM-WH-01', reason: 'Cycle count variance', date: '19 Aug 2026', by: 'Priya Rao' },
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  { code: 'SUP-001', name: 'Reliance Polymers', category: 'Raw Material', rating: 4.6, leadTime: '7 days', contact: 'Anil Mehta', email: 'anil.mehta@relpoly.example', phone: '+91 98200 11223', status: 'active' },
  { code: 'SUP-002', name: 'GAIL Polymers', category: 'Raw Material', rating: 4.2, leadTime: '10 days', contact: 'Sunita Rao', email: 'sunita.rao@gailpoly.example', phone: '+91 98330 44556', status: 'active' },
  { code: 'SUP-003', name: 'Borealis India', category: 'Masterbatch & Additives', rating: 4.8, leadTime: '12 days', contact: 'Vivek Shah', email: 'vivek.shah@borealis.example', phone: '+91 98450 77889', status: 'active' },
  { code: 'SUP-004', name: 'Haldia Petrochemicals', category: 'Raw Material', rating: 3.9, leadTime: '14 days', contact: 'Rina Das', email: 'rina.das@haldia.example', phone: '+91 98110 22334', status: 'active' },
  { code: 'SUP-005', name: 'Precision Tooling Works', category: 'Spare Parts & Tooling', rating: 4.4, leadTime: '5 days', contact: 'Manoj Iyer', email: 'manoj@precisiontools.example', phone: '+91 98220 99001', status: 'inactive' },
];

export const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'PO-3390',
    supplier: 'SUP-001',
    orderDate: '14 Aug 2026',
    expectedDate: '21 Aug 2026',
    approval: 'approved',
    lines: [{ item: 'RM-PP-NAT-001', name: 'PP Natural Granules', qty: 2400, uom: 'KG', price: 78, received: 2400 }],
    receiptLogs: [{ date: '21 Aug 2026', item: 'PP Natural Granules', qty: 2400, uom: 'KG', txnId: 'GRN-4521' }],
    history: [{ event: 'PO created', time: '14 Aug 2026' }, { event: 'Approved', time: '14 Aug 2026' }, { event: 'Goods received — 2,400 KG', time: '21 Aug 2026' }]
  },
  {
    id: 'PO-3391',
    supplier: 'SUP-002',
    orderDate: '18 Aug 2026',
    expectedDate: '28 Aug 2026',
    approval: 'pending',
    lines: [
      { item: 'RM-HD-GRN-014', name: 'HDPE Granules', qty: 5000, uom: 'KG', price: 78, received: 0 },
      { item: 'MB-BLK-003', name: 'Black Masterbatch', qty: 300, uom: 'KG', price: 145, received: 0 }
    ],
    receiptLogs: [],
    history: [{ event: 'PO created', time: '18 Aug 2026' }, { event: 'Submitted for approval', time: '18 Aug 2026' }]
  },
  {
    id: 'PO-3392',
    supplier: 'SUP-003',
    orderDate: '16 Aug 2026',
    expectedDate: '26 Aug 2026',
    approval: 'approved',
    lines: [{ item: 'AD-UV-009', name: 'UV Stabilizer Additive', qty: 400, uom: 'KG', price: 760, received: 180 }],
    receiptLogs: [{ date: '20 Aug 2026', item: 'UV Stabilizer Additive', qty: 180, uom: 'KG', txnId: 'GRN-4498' }],
    history: [{ event: 'PO created', time: '16 Aug 2026' }, { event: 'Approved', time: '16 Aug 2026' }, { event: 'Partial goods receipt — 180 KG', time: '20 Aug 2026' }]
  },
  {
    id: 'PO-3393',
    supplier: 'SUP-004',
    orderDate: '12 Aug 2026',
    expectedDate: '20 Aug 2026',
    approval: 'rejected',
    rejectReason: 'Price 6% above last approved rate — renegotiate before resubmitting.',
    lines: [{ item: 'RM-AB-060', name: 'ABS Resin — Injection Grade', qty: 3000, uom: 'KG', price: 112, received: 0 }],
    receiptLogs: [],
    history: [{ event: 'PO created', time: '12 Aug 2026' }, { event: 'Submitted for approval', time: '12 Aug 2026' }, { event: 'Rejected', time: '19 Aug 2026' }]
  },
  {
    id: 'PO-3394',
    supplier: 'SUP-005',
    orderDate: 'Today',
    expectedDate: '—',
    approval: 'draft',
    lines: [{ item: 'SP-HTB-044', name: 'Heater Band — 250T IMM', qty: 10, uom: 'PCS', price: 1450, received: 0 }],
    receiptLogs: [],
    history: [{ event: 'PO created', time: 'Today' }]
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  { code: 'CUST-001', name: 'Metro Retail Distributors', segment: 'Retail Chain', creditLimit: 2000000, contact: 'Karan Mehta', email: 'karan@metroretail.example', phone: '+91 98200 55667', status: 'active' },
  { code: 'CUST-002', name: 'GreenPack FMCG Pvt Ltd', segment: 'FMCG', creditLimit: 1500000, contact: 'Neha Kulkarni', email: 'neha@greenpack.example', phone: '+91 98330 11222', status: 'active' },
  { code: 'CUST-003', name: 'Bharat AgroTech', segment: 'Agriculture', creditLimit: 800000, contact: 'Suresh Patil', email: 'suresh@bharatagro.example', phone: '+91 98450 33445', status: 'active' },
  { code: 'CUST-004', name: 'UrbanHome Essentials', segment: 'D2C / E-commerce', creditLimit: 500000, contact: 'Priyanka Shah', email: 'priyanka@urbanhome.example', phone: '+91 98110 66778', status: 'inactive' },
];

export const INITIAL_SALES_ORDERS: SalesOrder[] = [
  {
    id: 'SO-501',
    customer: 'CUST-001',
    customerPO: 'PO-METRO-4471',
    priority: 'high',
    quoteRef: 'QT-3001',
    orderDate: '15 Aug 2026',
    deliveryDate: '25 Aug 2026',
    approval: 'approved',
    lines: [{ item: 'FG-CTN-500', name: 'Plastic Container 500ml', qty: 10000, uom: 'PCS', price: 9.5, dispatched: 6000 }],
    dispatchLogs: [{ date: '20 Aug 2026', item: 'Plastic Container 500ml', qty: 6000, uom: 'PCS', txnId: 'ISS-1050' }],
    history: [{ event: 'SO created', time: '15 Aug 2026' }, { event: 'Approved', time: '15 Aug 2026' }, { event: 'Partial dispatch — 6,000 PCS', time: '20 Aug 2026' }]
  },
  {
    id: 'SO-502',
    customer: 'CUST-002',
    customerPO: 'GP-PO-8821',
    priority: 'medium',
    orderDate: '17 Aug 2026',
    deliveryDate: '27 Aug 2026',
    approval: 'pending',
    lines: [{ item: 'FG-BKT-010', name: 'Household Bucket 10L', qty: 2000, uom: 'PCS', price: 42, dispatched: 0 }],
    dispatchLogs: [],
    history: [{ event: 'SO created', time: '17 Aug 2026' }, { event: 'Submitted for approval', time: '17 Aug 2026' }]
  },
  {
    id: 'SO-503',
    customer: 'CUST-003',
    customerPO: 'BAT-2026-119',
    priority: 'medium',
    quoteRef: 'QT-3002',
    orderDate: '12 Aug 2026',
    deliveryDate: '22 Aug 2026',
    approval: 'approved',
    lines: [{ item: 'FG-PET-030', name: 'PET Bottle Preform', qty: 40000, uom: 'PCS', price: 2.6, dispatched: 40000 }],
    dispatchLogs: [{ date: '21 Aug 2026', item: 'PET Bottle Preform', qty: 40000, uom: 'PCS', txnId: 'ISS-1051' }],
    history: [{ event: 'SO created', time: '12 Aug 2026' }, { event: 'Approved', time: '12 Aug 2026' }, { event: 'Fully dispatched — 40,000 PCS', time: '21 Aug 2026' }]
  },
  {
    id: 'SO-504',
    customer: 'CUST-004',
    customerPO: 'UH-PO-556',
    priority: 'low',
    orderDate: '10 Aug 2026',
    deliveryDate: '18 Aug 2026',
    approval: 'rejected',
    rejectReason: 'Customer exceeds approved credit limit — hold until finance clears outstanding dues.',
    lines: [{ item: 'FG-CTN-500', name: 'Plastic Container 500ml', qty: 5000, uom: 'PCS', price: 9.5, dispatched: 0 }],
    dispatchLogs: [],
    history: [{ event: 'SO created', time: '10 Aug 2026' }, { event: 'Submitted for approval', time: '10 Aug 2026' }, { event: 'Rejected', time: '16 Aug 2026' }]
  }
];

export const INITIAL_QUOTATIONS: SalesQuotation[] = [
  {
    id: 'QT-3001',
    customer: 'CUST-001',
    customerRfq: 'RFQ-METRO-118',
    date: '08 Aug 2026',
    validUntil: '22 Aug 2026',
    currency: 'INR',
    salesperson: 'Ananya Rao',
    priority: 'high',
    expectedClose: '20 Aug 2026',
    stage: 'converted',
    approval: 'approved',
    margin: 22.4,
    convertedSo: 'SO-501',
    lines: [{ item: 'FG-CTN-500', name: 'Plastic Container 500ml', customerItemCode: 'MRD-CTN-500', qty: 10000, uom: 'PCS', price: 9.5, discountPct: 2, color: 'Natural', grade: 'Food grade', resinType: 'HDPE', moq: 5000, coaRequired: true }],
    terms: { payment: 'Net 30', incoterm: 'EXW Hosur', shipping: 'Road freight', delivery: '25 Aug 2026' },
    history: [{ event: 'Quotation created', time: '08 Aug 2026' }, { event: 'Accepted by customer', time: '14 Aug 2026' }, { event: 'Converted to SO-501', time: '15 Aug 2026' }]
  },
  {
    id: 'QT-3002',
    customer: 'CUST-003',
    customerRfq: 'BAT-RFQ-44',
    date: '05 Aug 2026',
    validUntil: '19 Aug 2026',
    currency: 'INR',
    salesperson: 'Vikram Das',
    priority: 'medium',
    expectedClose: '12 Aug 2026',
    stage: 'converted',
    approval: 'approved',
    margin: 18.1,
    convertedSo: 'SO-503',
    lines: [{ item: 'FG-PET-030', name: 'PET Bottle Preform', customerItemCode: 'BAT-PF-30', qty: 40000, uom: 'PCS', price: 2.6, discountPct: 0, color: 'Clear', grade: 'Standard', resinType: 'PET', moq: 10000, coaRequired: true }],
    terms: { payment: 'Net 15', incoterm: 'FOR destination', shipping: 'Road freight', delivery: '22 Aug 2026' },
    history: [{ event: 'Quotation created', time: '05 Aug 2026' }, { event: 'Converted to SO-503', time: '12 Aug 2026' }]
  },
  {
    id: 'QT-3003',
    customer: 'CUST-002',
    customerRfq: 'GP-INQ-901',
    date: '20 Aug 2026',
    validUntil: '03 Sep 2026',
    currency: 'INR',
    salesperson: 'Ananya Rao',
    priority: 'medium',
    expectedClose: '28 Aug 2026',
    stage: 'sent',
    approval: 'approved',
    margin: 26.8,
    convertedSo: null,
    lines: [{ item: 'FG-BKT-010', name: 'Household Bucket 10L', customerItemCode: 'GP-BKT-10L', qty: 3000, uom: 'PCS', price: 42, discountPct: 3, color: 'Blue', grade: 'Standard', resinType: 'HDPE', moq: 1000, coaRequired: false }],
    terms: { payment: 'Net 30', incoterm: 'EXW Hosur', shipping: 'Road freight', delivery: '10 Sep 2026' },
    history: [{ event: 'Quotation created', time: '20 Aug 2026' }, { event: 'Sent to customer', time: '21 Aug 2026' }]
  },
  {
    id: 'QT-3004',
    customer: 'CUST-004',
    date: '22 Aug 2026',
    validUntil: '29 Aug 2026',
    currency: 'INR',
    salesperson: 'Vikram Das',
    priority: 'low',
    expectedClose: '05 Sep 2026',
    stage: 'pending',
    approval: 'pending',
    margin: 14.2,
    convertedSo: null,
    lines: [{ item: 'FG-CTN-500', name: 'Plastic Container 500ml', customerItemCode: 'UH-CTN-05', qty: 2000, uom: 'PCS', price: 8.8, discountPct: 8, color: 'White', grade: 'Food grade', resinType: 'HDPE', moq: 1000, coaRequired: true }],
    terms: { payment: 'Advance 50%', incoterm: 'EXW Hosur', shipping: 'Courier', delivery: '12 Sep 2026' },
    history: [{ event: 'Quotation created', time: '22 Aug 2026' }, { event: 'Submitted for discount approval', time: '22 Aug 2026' }]
  }
];

export const INITIAL_RMAS: SalesRma[] = [
  {
    id: 'RMA-701',
    customer: 'CUST-003',
    soId: 'SO-503',
    invoiceId: 'INV-2202',
    item: 'FG-PET-030',
    qty: 1200,
    uom: 'PCS',
    date: '23 Aug 2026',
    reason: 'Quality Rejection',
    returnType: 'Quality complaint',
    disposition: 'Credit',
    status: 'under_inspection',
    creditAmount: 3120,
    batch: 'LOT-2026-A',
    history: [{ event: 'RMA created', time: '23 Aug 2026' }, { event: 'Received at warehouse', time: '25 Aug 2026' }]
  },
  {
    id: 'RMA-702',
    customer: 'CUST-001',
    soId: 'SO-501',
    invoiceId: 'INV-2201',
    item: 'FG-CTN-500',
    qty: 200,
    uom: 'PCS',
    date: '21 Aug 2026',
    reason: 'Damaged in Transit',
    returnType: 'Damaged in transit',
    disposition: 'Replacement',
    status: 'approved',
    creditAmount: 1900,
    batch: 'LOT-2026-B',
    history: [{ event: 'RMA created', time: '21 Aug 2026' }, { event: 'Approved', time: '22 Aug 2026' }]
  },
];

export const INITIAL_CONTRACTS: SalesContract[] = [
  {
    id: 'CTR-101',
    customer: 'CUST-001',
    type: 'Blanket order',
    startDate: '01 Jan 2026',
    endDate: '31 Dec 2026',
    totalQty: 120000,
    releasedQty: 64000,
    totalValue: 1140000,
    releasedValue: 608000,
    status: 'active',
    items: [{ item: 'FG-CTN-500', qty: 120000, price: 9.3, moq: 5000, frequency: 'Monthly' }]
  },
  {
    id: 'CTR-102',
    customer: 'CUST-003',
    type: 'Volume contract',
    startDate: '01 Apr 2026',
    endDate: '31 Mar 2027',
    totalQty: 480000,
    releasedQty: 120000,
    totalValue: 1248000,
    releasedValue: 312000,
    status: 'active',
    items: [{ item: 'FG-PET-030', qty: 480000, price: 2.6, moq: 10000, frequency: 'Bi-weekly' }]
  },
];

export const INITIAL_INVOICES: CustomerInvoice[] = [
  {
    id: 'INV-2201',
    customer: 'CUST-001',
    soId: 'SO-501',
    date: '20 Aug 2026',
    dueDate: '19 Sep 2026',
    lines: [{ item: 'FG-CTN-500', name: 'Plastic Container 500ml', qty: 6000, price: 9.5 }],
    paid: 28500,
    history: [{ event: 'Invoice raised', time: '20 Aug 2026' }, { event: 'Payment received — ₹28,500', time: '20 Aug 2026' }]
  },
  {
    id: 'INV-2202',
    customer: 'CUST-003',
    soId: 'SO-503',
    date: '21 Aug 2026',
    dueDate: '20 Sep 2026',
    lines: [{ item: 'FG-PET-030', name: 'PET Bottle Preform', qty: 40000, price: 2.6 }],
    paid: 0,
    history: [{ event: 'Invoice raised', time: '21 Aug 2026' }]
  },
  {
    id: 'INV-2203',
    customer: 'CUST-002',
    soId: null,
    date: '05 Aug 2026',
    dueDate: '04 Sep 2026',
    lines: [{ item: 'FG-BKT-010', name: 'Household Bucket 10L', qty: 1500, price: 42 }],
    paid: 63000,
    history: [{ event: 'Invoice raised', time: '05 Aug 2026' }, { event: 'Payment received — ₹63,000', time: '12 Aug 2026' }]
  }
];

export const INITIAL_PAYMENTS: CustomerPayment[] = [
  { id: 'PAY-9001', invoiceId: 'INV-2201', customer: 'CUST-001', amount: 28500, date: '20 Aug 2026', method: 'Bank Transfer', by: 'Finance' },
  { id: 'PAY-9002', invoiceId: 'INV-2203', customer: 'CUST-002', amount: 63000, date: '12 Aug 2026', method: 'Cheque', by: 'Finance' },
];

export const INITIAL_SUPPLIER_INVOICES: SupplierInvoice[] = [
  { id: 'SUP-78901', poId: 'PO-3390', supplier: 'SUP-001', date: '21 Aug 2026', dueDate: '20 Sep 2026', amount: 187200, tax: 16848, matchStatus: 'matched', approval: 'approved', paymentStatus: 'unpaid', discountPct: 2, discountDays: 10 },
  { id: 'SUP-78902', poId: 'PO-3392', supplier: 'SUP-003', date: '22 Aug 2026', dueDate: '21 Sep 2026', amount: 136800, tax: 12312, matchStatus: 'qty_variance', approval: 'pending', paymentStatus: 'unpaid', discountPct: 0, discountDays: 0 },
  { id: 'SUP-78903', poId: null, supplier: 'SUP-005', date: '18 Aug 2026', dueDate: '17 Sep 2026', amount: 24500, tax: 2205, matchStatus: 'no_po', approval: 'pending', paymentStatus: 'unpaid', discountPct: 0, discountDays: 0, glAccount: '6200', costCenter: 'CC-MAINT-01' },
  { id: 'SUP-78904', poId: 'PO-3391', supplier: 'SUP-002', date: '25 Aug 2026', dueDate: '24 Sep 2026', amount: 24960, tax: 2246, matchStatus: 'price_variance', approval: 'pending', paymentStatus: 'unpaid', discountPct: 0, discountDays: 0 },
  { id: 'SUP-78905', poId: 'PO-3390', supplier: 'SUP-001', date: '05 Aug 2026', dueDate: '04 Sep 2026', amount: 98000, tax: 8820, matchStatus: 'matched', approval: 'approved', paymentStatus: 'paid', discountPct: 2, discountDays: 10 },
];

export const INITIAL_GL_ACCOUNTS: GLAccount[] = [
  { code: '1000', name: 'Assets', type: 'Asset', sub: 'Group', parent: null, currency: 'INR', tax: false, cc: false, status: 'active', balance: 0 },
  { code: '1100', name: 'Cash & Bank', type: 'Asset', sub: 'Current Asset', parent: '1000', currency: 'INR', tax: false, cc: false, status: 'active', balance: 8420000 },
  { code: '1110', name: 'HDFC Bank — Current A/c', type: 'Asset', sub: 'Bank', parent: '1100', currency: 'INR', tax: false, cc: false, status: 'active', balance: 6120000 },
  { code: '1120', name: 'ICICI Bank — Collections A/c', type: 'Asset', sub: 'Bank', parent: '1100', currency: 'INR', tax: false, cc: false, status: 'active', balance: 2100000 },
  { code: '1200', name: 'Accounts Receivable', type: 'Asset', sub: 'Current Asset', parent: '1000', currency: 'INR', tax: false, cc: false, status: 'active', balance: 8600000 },
  { code: '1300', name: 'Inventory', type: 'Asset', sub: 'Current Asset', parent: '1000', currency: 'INR', tax: true, cc: true, status: 'active', balance: 42000000 },
  { code: '1310', name: 'Raw Material — Resin', type: 'Asset', sub: 'Inventory', parent: '1300', currency: 'INR', tax: true, cc: true, status: 'active', balance: 22400000 },
  { code: '1340', name: 'Finished Goods', type: 'Asset', sub: 'Inventory', parent: '1300', currency: 'INR', tax: true, cc: true, status: 'active', balance: 15020000 },
  { code: '1500', name: 'Fixed Assets', type: 'Asset', sub: 'Non-Current Asset', parent: '1000', currency: 'INR', tax: false, cc: true, status: 'active', balance: 3260000 },
  { code: '2000', name: 'Liabilities', type: 'Liability', sub: 'Group', parent: null, currency: 'INR', tax: false, cc: false, status: 'active', balance: 0 },
  { code: '2100', name: 'Accounts Payable', type: 'Liability', sub: 'Current Liability', parent: '2000', currency: 'INR', tax: false, cc: false, status: 'active', balance: 1840000 },
  { code: '2200', name: 'GST Output Payable', type: 'Liability', sub: 'Tax Payable', parent: '2000', currency: 'INR', tax: true, cc: false, status: 'active', balance: 412000 },
  { code: '3000', name: 'Equity', type: 'Equity', sub: 'Group', parent: null, currency: 'INR', tax: false, cc: false, status: 'active', balance: 0 },
  { code: '3100', name: "Owner's Capital", type: 'Equity', sub: 'Capital', parent: '3000', currency: 'INR', tax: false, cc: false, status: 'active', balance: 32000000 },
  { code: '4000', name: 'Revenue', type: 'Revenue', sub: 'Group', parent: null, currency: 'INR', tax: false, cc: false, status: 'active', balance: 0 },
  { code: '4100', name: 'Sales — Finished Goods', type: 'Revenue', sub: 'Operating Revenue', parent: '4000', currency: 'INR', tax: true, cc: true, status: 'active', balance: 9840000 },
  { code: '5000', name: 'Cost of Goods Sold', type: 'Expense', sub: 'Group', parent: null, currency: 'INR', tax: false, cc: false, status: 'active', balance: 0 },
  { code: '5100', name: 'Direct Material Consumed', type: 'Expense', sub: 'COGS', parent: '5000', currency: 'INR', tax: true, cc: true, status: 'active', balance: 5620000 },
  { code: '5200', name: 'Direct Labor', type: 'Expense', sub: 'COGS', parent: '5000', currency: 'INR', tax: false, cc: true, status: 'active', balance: 840000 },
  { code: '5300', name: 'Machine & Overhead Absorption', type: 'Expense', sub: 'COGS', parent: '5000', currency: 'INR', tax: false, cc: true, status: 'active', balance: 1120000 },
  { code: '6000', name: 'Operating Expenses', type: 'Expense', sub: 'Group', parent: null, currency: 'INR', tax: false, cc: false, status: 'active', balance: 0 },
  { code: '6100', name: 'Utilities & Energy', type: 'Expense', sub: 'Overhead', parent: '6000', currency: 'INR', tax: true, cc: true, status: 'active', balance: 380000 },
  { code: '6200', name: 'Repairs & Maintenance', type: 'Expense', sub: 'Overhead', parent: '6000', currency: 'INR', tax: true, cc: true, status: 'active', balance: 214000 },
];

export const INITIAL_JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: 'JE-8001',
    date: '25 Aug 2026',
    ref: 'INV-2201',
    memo: 'Revenue recognition — INV-2201 dispatch',
    currency: 'INR',
    status: 'posted',
    createdBy: 'Finance',
    approvedBy: 'Priya Rao',
    lines: [
      { account: '1200', desc: 'AR — Customer 001', debit: 57000, credit: 0, cc: '', tax: '' },
      { account: '4100', desc: 'Sales — FG-CTN-500', debit: 0, credit: 57000, cc: 'CC-PROD-01', tax: 'GST18' }
    ]
  },
  {
    id: 'JE-8002',
    date: '24 Aug 2026',
    ref: 'GR-4521',
    memo: 'Goods receipt — PP Natural Granules (PO-3390)',
    currency: 'INR',
    status: 'posted',
    createdBy: 'Finance',
    approvedBy: 'Priya Rao',
    lines: [
      { account: '1310', desc: 'RM Inventory — PP Granules', debit: 187200, credit: 0, cc: 'CC-WH-01', tax: '' },
      { account: '2100', desc: 'AP — Reliance Polymers', debit: 0, credit: 187200, cc: '', tax: '' }
    ]
  },
  {
    id: 'JE-8003',
    date: '23 Aug 2026',
    ref: 'WO-1187',
    memo: 'Production cost absorption — WO-1187 (IM-250T Line)',
    currency: 'INR',
    status: 'posted',
    createdBy: 'System',
    approvedBy: 'System',
    lines: [
      { account: '1340', desc: 'FG Inventory — Container 500ml', debit: 212400, credit: 0, cc: 'CC-PROD-01', tax: '' },
      { account: '1310', desc: 'RM consumed', debit: 0, credit: 168000, cc: 'CC-PROD-01', tax: '' },
      { account: '5200', desc: 'Direct labor absorbed', debit: 0, credit: 24400, cc: 'CC-PROD-01', tax: '' },
      { account: '5300', desc: 'Machine OH absorbed', debit: 0, credit: 20000, cc: 'CC-PROD-01', tax: '' }
    ]
  }
];

export const INITIAL_CREDIT_DEBIT_NOTES: CreditDebitNote[] = [
  { id: 'CN-501', type: 'credit', relatedInvoice: 'INV-2202', party: 'CUST-003', date: '22 Aug 2026', amount: 8400, reason: 'Quality Rejection', status: 'approved', appliedAmount: 0 },
  { id: 'CN-502', type: 'credit', relatedInvoice: 'INV-2201', party: 'CUST-001', date: '21 Aug 2026', amount: 1200, reason: 'Pricing Error', status: 'applied', appliedAmount: 1200 },
  { id: 'DN-201', type: 'debit', relatedInvoice: 'SUP-78901', party: 'SUP-001', date: '23 Aug 2026', amount: 3200, reason: 'Freight Adjustment', status: 'draft', appliedAmount: 0 },
];

export const INITIAL_COST_CENTERS: CostCenter[] = [
  { code: 'CC-PROD-01', name: 'Injection Molding Line 1', type: 'Production', department: 'Manufacturing', manager: 'Suresh Nair', budget: 1200000, actual: 1148000, allocBase: 'Machine hours' },
  { code: 'CC-PROD-02', name: 'Extrusion Line', type: 'Production', department: 'Manufacturing', manager: 'Kavya Menon', budget: 860000, actual: 912000, allocBase: 'Machine hours' },
  { code: 'CC-MAINT-01', name: 'Maintenance & Tooling', type: 'Maintenance', department: 'Engineering', manager: 'Ravi Shankar', budget: 320000, actual: 298000, allocBase: 'Labor hours' },
  { code: 'CC-WH-01', name: 'Raw Material Warehouse', type: 'Administration', department: 'Supply Chain', manager: 'Anita Verma', budget: 180000, actual: 172000, allocBase: 'Floor space' },
  { code: 'CC-QC-01', name: 'Quality Control Lab', type: 'Administration', department: 'Quality', manager: 'Divya Iyer', budget: 140000, actual: 151000, allocBase: 'Headcount' },
  { code: 'CC-ADMIN-01', name: 'Plant Administration', type: 'Administration', department: 'Admin', manager: 'Rahul Bhatt', budget: 260000, actual: 244000, allocBase: 'Revenue proportion' },
];

export const INITIAL_COST_ROLLUPS: CostRollup[] = [
  {
    item: 'FG-CTN-500',
    name: 'Plastic Container 500ml',
    materials: [
      { label: 'PP Resin', qty: '0.048 kg', rate: 78, amount: 3.74 },
      { label: 'Masterbatch (2%)', qty: '0.001 kg', rate: 145, amount: 0.15 },
      { label: 'Packaging', qty: '1 unit', rate: 0.05, amount: 0.05 }
    ],
    labor: { label: 'Operator', hrs: 0.02, rate: 210, amount: 4.20 },
    machineOh: { label: 'IM-250T machine rate', hrs: 0.02, rate: 340, amount: 6.80 },
    moldAmort: { label: 'Mold M-1001 amortization', amount: 0.62 },
    variableOh: { label: 'Energy per unit', amount: 0.28 },
    fixedOh: { label: 'Plant allocation', amount: 0.95 }
  },
  {
    item: 'FG-PET-030',
    name: 'PET Bottle Preform',
    materials: [
      { label: 'PET Resin', qty: '0.022 kg', rate: 96, amount: 2.11 },
      { label: 'Masterbatch (1.5%)', qty: '0.0003 kg', rate: 150, amount: 0.05 }
    ],
    labor: { label: 'Operator', hrs: 0.008, rate: 210, amount: 1.68 },
    machineOh: { label: 'IM-120T machine rate', hrs: 0.008, rate: 280, amount: 2.24 },
    moldAmort: { label: 'Mold M-1042 amortization', amount: 0.18 },
    variableOh: { label: 'Energy per unit', amount: 0.09 },
    fixedOh: { label: 'Plant allocation', amount: 0.31 }
  },
  {
    item: 'FG-BKT-010',
    name: 'Household Bucket 10L',
    materials: [
      { label: 'HDPE Resin', qty: '0.62 kg', rate: 78, amount: 48.36 },
      { label: 'Recycled regrind (15%)', qty: '0.09 kg', rate: 42, amount: 3.78 },
      { label: 'Masterbatch (2.5%)', qty: '0.015 kg', rate: 145, amount: 2.18 }
    ],
    labor: { label: 'Operator', hrs: 0.06, rate: 210, amount: 12.60 },
    machineOh: { label: 'IM-650T machine rate', hrs: 0.06, rate: 520, amount: 31.20 },
    moldAmort: { label: 'Mold M-2003 amortization', amount: 1.85 },
    variableOh: { label: 'Energy per unit', amount: 2.10 },
    fixedOh: { label: 'Plant allocation', amount: 3.40 }
  }
];

export const INITIAL_VARIANCES: ProductionVariance[] = [
  { woId: 'WO-1187', item: 'FG-CTN-500', type: 'Material Price Variance', standard: 187200, actual: 194800, rootCause: 'Supplier price increase' },
  { woId: 'WO-1183', item: 'FG-PET-030', type: 'Material Usage Variance', standard: 52000, actual: 48600, rootCause: 'BOM inaccuracy' },
  { woId: 'WO-1179', item: 'FG-BKT-010', type: 'Labor Efficiency Variance', standard: 18400, actual: 23100, rootCause: 'Machine downtime' },
  { woId: 'WO-1187', item: 'FG-CTN-500', type: 'Machine Overhead Variance', standard: 20000, actual: 18200, rootCause: 'Process parameter deviation' },
  { woId: 'WO-1181', item: 'FG-CTN-500', type: 'Yield / Scrap Variance', standard: 6200, actual: 9800, rootCause: 'Color changeover waste' },
];

export const INITIAL_NCRS: NonConformanceReport[] = [
  {
    id: 'NCR-2026-0114',
    source: 'Incoming Inspection',
    item: 'RM-AB-060',
    itemName: 'ABS Resin — Injection Grade',
    ref: 'PO-3393',
    lot: 'LOT-060-01',
    qty: 2000,
    uom: 'KG',
    severity: 'Major',
    category: 'Material — Out of Spec',
    description: 'Melt Flow Index measured at 8.2 g/10min against spec 10.5–13.5 g/10min. Batch does not meet moldability requirement.',
    containment: 'Lot moved to quarantine bin RM-WH-01-QZ, hold tag applied, purchasing notified to pause further releases from this supplier lot.',
    status: 'disposition',
    discoveredBy: 'Lab Technician',
    discoveredDate: '21 Aug 2026',
    rca: {
      method: '5-Why',
      whys: [
        'MFI out of spec on receipt',
        'Resin batch degraded in transit',
        'Container exposed to high temperature during shipping',
        'No temperature logger required in PO terms',
        'Supplier quality clause did not mandate cold-chain for this grade'
      ],
      rootCause: 'Purchasing terms do not require temperature-controlled transport for heat-sensitive ABS grades.'
    },
    disposition: { action: 'Return to Supplier', qty: 2000, approvedBy: 'Priya Rao (QA Manager)' },
    capaId: 'CAPA-2026-0041',
    history: [
      { event: 'NCR raised from Incoming Inspection', time: '21 Aug 2026, 10:12 AM' },
      { event: 'Lot contained — moved to quarantine', time: '21 Aug 2026, 10:20 AM' },
      { event: 'RCA completed — root cause verified', time: '22 Aug 2026, 3:40 PM' },
      { event: 'Disposition: Return to Supplier', time: '23 Aug 2026, 9:05 AM' }
    ]
  },
  {
    id: 'NCR-2026-0115',
    source: 'In-Process',
    item: 'FG-PET-030',
    itemName: 'PET Bottle Preform',
    ref: 'WO-1191',
    lot: '—',
    qty: 230,
    uom: 'PCS',
    severity: 'Major',
    category: 'Process — Dimensional',
    description: 'Neck finish OD trending above USL on cavities 3 and 7 — 230 pcs scrapped this shift.',
    containment: 'WO-1191 placed on quality hold, affected cavities isolated, 100% sort of prior 2 hours output initiated.',
    status: 'rca',
    discoveredBy: 'K. Iyer (Operator)',
    discoveredDate: 'Today',
    rca: { method: 'Fishbone', whys: ['', '', '', '', ''], rootCause: '' },
    disposition: { action: null, qty: null, approvedBy: null },
    capaId: null,
    history: [{ event: 'NCR raised from Shop Floor quality checkpoint', time: 'Today, 10:40 AM' }]
  },
  {
    id: 'NCR-2026-0116',
    source: 'Final Inspection',
    item: 'FG-CTN-500',
    itemName: 'Plastic Container 500ml',
    ref: 'WO-1188',
    lot: 'LOT-CTN-04',
    qty: 112,
    uom: 'PCS',
    severity: 'Minor',
    category: 'Visual — Cosmetic',
    description: 'Sink marks observed on 112 units near gate location, cosmetic only, no functional impact.',
    containment: 'Units segregated to rework area for gate trim rework.',
    status: 'capa_linked',
    discoveredBy: 'Final QC Inspector',
    discoveredDate: '20 Aug 2026',
    rca: {
      method: '5-Why',
      whys: ['Sink marks at gate', 'Insufficient packing pressure/time', 'Machine setting drifted from standard after changeover', 'No parameter verification checkpoint post-changeover', 'SMED checklist does not include first-article dimensional check'],
      rootCause: 'SMED changeover checklist missing mandatory first-article verification step.'
    },
    disposition: { action: 'Rework', qty: 112, approvedBy: 'Shift Supervisor' },
    capaId: 'CAPA-2026-0042',
    history: [{ event: 'NCR raised at Final Inspection', time: '20 Aug 2026, 4:15 PM' }]
  }
];

export const INITIAL_CAPAS: CapaRecord[] = [
  {
    id: 'CAPA-2026-0041',
    source: 'NCR',
    sourceRef: 'NCR-2026-0114',
    type: 'Corrective',
    problem: 'ABS resin lot received out of MFI spec due to transit temperature exposure.',
    owner: 'Anita Verma (Supplier Quality)',
    priority: 'High',
    dueDate: '10 Sep 2026',
    stage: 'action',
    actions: [
      { id: 1, desc: 'Amend PO terms to require temperature-controlled transport for heat-sensitive grades.', owner: 'Procurement', due: '01 Sep 2026', status: 'in_progress', evidence: '' },
      { id: 2, desc: 'Add incoming temperature-logger check to IQC-ABS inspection plan.', owner: 'Quality Engineer', due: '05 Sep 2026', status: 'pending', evidence: '' }
    ],
    effectiveness: { method: 'Zero MFI-related NCRs on next 5 ABS receipts', date: '15 Oct 2026', result: null },
    history: [{ event: 'CAPA opened from NCR-2026-0114', time: '23 Aug 2026' }]
  },
  {
    id: 'CAPA-2026-0042',
    source: 'NCR',
    sourceRef: 'NCR-2026-0116',
    type: 'Corrective',
    problem: 'Sink marks recurring after changeover due to missing first-article check.',
    owner: 'R. Kumar (Shift Supervisor)',
    priority: 'Medium',
    dueDate: '05 Sep 2026',
    stage: 'implement',
    actions: [
      { id: 1, desc: 'Add mandatory first-article dimensional check to SMED changeover checklist.', owner: 'Manufacturing Engineer', due: '28 Aug 2026', status: 'done', evidence: 'Checklist v4 published' }
    ],
    effectiveness: { method: 'Sink-mark scrap rate <0.5% over next 20 changeovers', date: '20 Sep 2026', result: null },
    history: [{ event: 'CAPA opened from NCR-2026-0116', time: '20 Aug 2026' }]
  }
];

export const INITIAL_INSPECTION_PLANS: InspectionPlan[] = [
  {
    id: 'IQC-PP-REV3',
    name: 'PP Natural Granules — Incoming',
    type: 'Incoming',
    item: 'RM-PP-NAT-001',
    rev: '3',
    status: 'Active',
    effectiveDate: '01 Jun 2026',
    lastUsed: '21 Aug 2026',
    sampling: 'ISO 2859 · AQL Normal Level II',
    params: [
      { seq: 1, parameter: 'Melt Flow Index', method: 'ASTM D1238', uom: 'g/10min', target: '12.0', min: '10.5', max: '13.5', critical: true, instrument: 'MFI Tester', sampleSize: 3 },
      { seq: 2, parameter: 'Moisture Content', method: 'Karl Fischer', uom: 'ppm', target: '<300', min: '0', max: '300', critical: true, instrument: 'Moisture Analyzer', sampleSize: 2 },
      { seq: 3, parameter: 'Density', method: 'ASTM D792', uom: 'g/cm³', target: '0.905', min: '0.900', max: '0.910', critical: false, instrument: 'Density Kit', sampleSize: 3 },
      { seq: 4, parameter: 'Color ΔE', method: 'Spectrophotometer', uom: 'ΔE', target: '<1.0', min: '0', max: '1.0', critical: true, instrument: 'Spectro', sampleSize: 3 },
      { seq: 5, parameter: 'Contamination', method: 'Visual — 20x', uom: 'Pass/Fail', target: 'Pass', min: '—', max: '—', critical: true, instrument: 'Microscope', sampleSize: 5 },
    ]
  },
  {
    id: 'IPQ-CTN-REV1',
    name: 'Container 500ml — In-Process',
    type: 'In-Process',
    item: 'FG-CTN-500',
    rev: '1',
    status: 'Active',
    effectiveDate: '01 Feb 2026',
    lastUsed: 'Today',
    sampling: '5 pcs every 500 shots',
    params: [
      { seq: 1, parameter: 'Weight', method: 'Calibrated scale', uom: 'g', target: '25.0', min: '24.5', max: '25.5', critical: true, instrument: 'Precision scale', sampleSize: 5 },
      { seq: 2, parameter: 'Outer Diameter', method: 'CMM / caliper', uom: 'mm', target: '50.0', min: '49.8', max: '50.2', critical: true, instrument: 'Digital caliper', sampleSize: 5 },
      { seq: 3, parameter: 'Visual defects', method: 'Visual', uom: 'Pass/Fail', target: 'Pass', min: '—', max: '—', critical: false, instrument: '—', sampleSize: 5 },
    ]
  }
];

export const INITIAL_QUALITY_COAS: QualityCoa[] = [
  {
    id: 'COA-2026-0453',
    product: 'PP Natural Granules',
    itemCode: 'RM-PP-NAT-001',
    lot: 'LOT-001-02',
    mfgDate: '25 Jul 2026',
    expiryDate: '20 Jun 2027',
    qty: '7,440 KG',
    source: 'Incoming Inspection',
    status: 'Issued',
    approvedBy: 'J. Menon, QA Manager',
    date: '26 Jul 2026',
    tests: [
      { parameter: 'Melt Flow Index', spec: '10.5–13.5 g/10min', result: '12.1 g/10min', method: 'ASTM D1238' },
      { parameter: 'Moisture Content', spec: '<300 ppm', result: '180 ppm', method: 'Karl Fischer' },
      { parameter: 'Density', spec: '0.900–0.910 g/cm³', result: '0.905 g/cm³', method: 'ASTM D792' },
      { parameter: 'Color ΔE', spec: '<1.0', result: '0.4', method: 'Spectrophotometer' }
    ]
  },
  {
    id: 'COA-2026-0455',
    product: 'Plastic Container 500ml',
    itemCode: 'FG-CTN-500',
    lot: 'LOT-CTN-04',
    mfgDate: '20 Aug 2026',
    expiryDate: '—',
    qty: '6,128 PCS',
    source: 'Final Inspection',
    status: 'Issued',
    approvedBy: 'Priya Rao, Plant Manager',
    date: '20 Aug 2026',
    tests: [
      { parameter: 'Weight', spec: '25 ± 0.5 g', result: '25.1 g', method: 'Calibrated scale' },
      { parameter: 'Dimensional — OD', spec: '50 ± 0.2 mm', result: '50.05 mm', method: 'CMM' },
      { parameter: 'Visual defects', spec: 'Pass', result: 'Pass', method: 'Visual' }
    ]
  }
];

export const INITIAL_CALIBRATION_EQUIPMENT: CalibrationEquipment[] = [
  { id: 'EQ-SPEC-02', name: 'Spectrophotometer', model: 'X-Rite Ci7600', dept: 'QC Lab', freq: '6 months', last: '10 Feb 2026', next: '10 Aug 2026', status: 'overdue' },
  { id: 'EQ-MFI-01', name: 'MFI Tester', model: 'CEAST 7027', dept: 'QC Lab', freq: '12 months', last: '15 Jan 2026', next: '15 Jan 2027', status: 'ok' },
  { id: 'EQ-CAL-05', name: 'Digital Caliper', model: 'Mitutoyo 500-196', dept: 'Molding Floor', freq: '3 months', last: '01 Jul 2026', next: '01 Oct 2026', status: 'ok' },
  { id: 'EQ-SCALE-03', name: 'Precision Scale', model: 'Sartorius Entris', dept: 'QC Lab', freq: '6 months', last: '20 Jun 2026', next: '20 Dec 2026', status: 'ok' },
  { id: 'EQ-TENS-01', name: 'Tensile Tester', model: 'Instron 5960', dept: 'QC Lab', freq: '12 months', last: '05 Sep 2025', next: '05 Sep 2026', status: 'due_soon' },
];

export const INITIAL_QUALITY_DOCS: QualityDocument[] = [
  { id: 'SOP-QC-001', title: 'Incoming Material Inspection Procedure', category: 'SOP', rev: '4', effectiveDate: '01 Jun 2026', reviewDate: '01 Jun 2027', owner: 'Quality Manager', status: 'Released' },
  { id: 'SOP-QC-014', title: 'Calibration Certificate Posting & Migration', category: 'SOP', rev: '2', effectiveDate: '15 Aug 2026', reviewDate: '15 Aug 2027', owner: 'Quality Coordinator', status: 'Released' },
  { id: 'WI-MLD-009', title: 'SMED Changeover — First Article Verification', category: 'Work Instruction', rev: '4', effectiveDate: '26 Aug 2026', reviewDate: '26 Aug 2027', owner: 'Manufacturing Engineer', status: 'Released' },
];

export const INITIAL_AUDITS: QualityAudit[] = [
  { id: 'AUD-2026-004', type: 'Internal', standard: 'ISO 9001', scope: 'Incoming inspection & document control', auditor: 'Internal Auditor', date: '10 Aug 2026', status: 'Closed', findings: 1 },
  { id: 'AUD-2026-005', type: 'Supplier', standard: 'Customer-specific', scope: 'Reliance Polymers — annual supplier audit', auditor: 'Anita Verma', date: '05 Sep 2026', status: 'Scheduled', findings: 0 },
];

export const INITIAL_LAB_TESTS: LabTest[] = [
  { id: 'LAB-2026-0887', sample: 'FG-2026-08-CTN04', product: 'Plastic Container 500ml', test: 'Drop Test', method: 'ASTM D5276', instrument: 'Drop Tester', status: 'pending', priority: 'High' },
  { id: 'LAB-2026-0888', sample: 'RM-2026-08-0060', product: 'ABS Resin', test: 'Melt Flow Index', method: 'ASTM D1238', instrument: 'MFI Tester', status: 'in_progress', priority: 'Critical' },
  { id: 'LAB-2026-0885', sample: 'RM-2026-08-0001', product: 'PP Natural Granules', test: 'Tensile Strength', method: 'ASTM D638', instrument: 'Instron 5960', status: 'completed', priority: 'Medium', result: '28.4 MPa', passed: true }
];

export const INITIAL_FIXED_ASSETS: FixedAsset[] = [
  { code: 'FA-001', name: 'Tata Ace — Delivery Van', category: 'Vehicle', purchaseDate: '10 Jan 2023', purchaseValue: 850000, depreciationRate: 15, location: 'Plant 01', custodian: 'Logistics team', status: 'in_use' },
  { code: 'FA-002', name: 'Dell Precision Workstations (x8)', category: 'IT Equipment', purchaseDate: '22 Jun 2024', purchaseValue: 640000, depreciationRate: 33, location: 'Admin office', custodian: 'IT team', status: 'in_use' },
  { code: 'FA-003', name: 'Office Furniture Set', category: 'Furniture & Fixtures', purchaseDate: '15 Mar 2022', purchaseValue: 320000, depreciationRate: 10, location: 'Admin office', custodian: 'Admin', status: 'in_use' },
  { code: 'FA-004', name: 'Forklift — Godrej 2.5T', category: 'Plant Equipment', purchaseDate: '05 Nov 2021', purchaseValue: 1450000, depreciationRate: 15, location: 'FG-WH-01', custodian: 'Warehouse team', status: 'under_maintenance' },
];

export const INITIAL_SUBCONTRACT_JOBS: SubcontractJob[] = [
  { id: 'SC-201', item: 'FG-BKT-010', subcontractor: 'Precision Tooling Works', process: 'Mold repair — M-1002', qtySent: 1, qtyReceived: 0, uom: 'Job', status: 'in_process', sentDate: '18 Aug 2026', expectedDate: '25 Aug 2026', history: [{ event: 'Job created and sent', time: '18 Aug 2026' }] },
  { id: 'SC-202', item: 'RG-PP-011', subcontractor: 'GreenCycle Compounding', process: 'External regrind compounding', qtySent: 2000, qtyReceived: 2000, uom: 'KG', status: 'received', sentDate: '10 Aug 2026', expectedDate: '17 Aug 2026', history: [{ event: 'Received back — 2,000 KG', time: '17 Aug 2026' }] },
  { id: 'SC-203', item: 'FG-CTN-500', subcontractor: 'Apex Print & Pack', process: 'Pad printing (branding)', qtySent: 5000, qtyReceived: 3200, uom: 'PCS', status: 'in_process', sentDate: '19 Aug 2026', expectedDate: '26 Aug 2026', history: [{ event: 'Partial return — 3,200 PCS', time: 'Today' }] }
];

// Compatibility Export Aliases
export const initialItems = INITIAL_ITEMS;
export const initialBoms = INITIAL_BOMS;
export const initialMachines = INITIAL_MACHINES;
export const initialWorkOrders = INITIAL_WORK_ORDERS;
export const initialSuppliers = INITIAL_SUPPLIERS;
export const initialPurchaseOrders = INITIAL_PURCHASE_ORDERS;
export const initialCustomers = INITIAL_CUSTOMERS;
export const initialSalesOrders = INITIAL_SALES_ORDERS;
export const initialQuotations = INITIAL_QUOTATIONS;
export const initialSalesRmas = INITIAL_RMAS;
export const initialAccounts = INITIAL_GL_ACCOUNTS;
export const initialJournalEntries = INITIAL_JOURNAL_ENTRIES;
export const initialCostCenters = INITIAL_COST_CENTERS;
export const initialNcrs = INITIAL_NCRS;
export const initialCapas = INITIAL_CAPAS;
export const initialInspectionPlans = INITIAL_INSPECTION_PLANS;
export const initialCoas = INITIAL_QUALITY_COAS;
export const initialStockTransactions = INITIAL_STOCK_TXNS;
export const initialSubcontractOrders = INITIAL_SUBCONTRACT_JOBS;

