import { WorkOrder, MachineMaster } from '../types';

export interface MoldMaster {
  id: string;
  assetTag: string;
  name: string;
  type: 'Injection Mold' | 'Blow Mold' | 'Extrusion Die' | 'Thermoforming Tool';
  cavities: number;
  activeCavities: number;
  hotRunner: 'Yudo Valve Gate 8-Drop' | 'Synventive Hot Half' | 'Cold Runner 2-Plate' | 'Husky UltraFlow' | 'Direct Gated Hot Tip';
  steelType: 'P20 Pre-hardened' | 'H13 Through-hardened (52 HRC)' | 'S136 Mirror Stainless' | 'NAK80 High Polish';
  manufacturer: string;
  purchaseDate: string;
  purchaseCost: number;
  expectedLifeShots: number;
  currentShotCount: number;
  shotsSinceLastPM: number;
  pmIntervalShots: number;
  status: 'available' | 'in_use' | 'maintenance' | 'repair' | 'retired';
  assignedMachine?: string;
  assignedWO?: string;
  storageLocation: string;
  compatibleProducts: string[];
  lastServiceDate: string;
  lastTechnician: string;
  scrapRatePct: number;
  averageCycleTimeSec: number;
  maintenanceHistory: Array<{
    date: string;
    type: 'Cleaning & Degreasing' | 'Cavity Polish' | 'Ejector Pin Replacement' | 'Hot Runner Heater Change' | 'Core Refurbishment';
    technician: string;
    shotsAtService: number;
    cost: number;
    notes: string;
  }>;
}

export interface ElectronicBatchRecord {
  id: string;
  batchLotNumber: string;
  itemCode: string;
  itemName: string;
  workOrderRef: string;
  machineId: string;
  moldId: string;
  productionDate: string;
  shift: string;
  leadOperator: string;
  supervisor: string;
  qaApprover?: string;
  status: 'In Progress' | 'Complete' | 'Approved' | 'Rejected' | 'Released';
  targetQty: number;
  goodQty: number;
  scrapQty: number;
  reworkQty: number;
  yieldPct: number;
  environmental: {
    ambientTempC: number;
    relativeHumidityPct: number;
    dewPointC: number;
    dryingHopperTempC: number;
  };
  recipeVerification: Array<{
    ingredientCode: string;
    description: string;
    bomQtyKg: number;
    actualDosedKg: number;
    lotNumber: string;
    verifiedBy: string;
    status: 'Verified' | 'Pending';
  }>;
  processCheckpoints: Array<{
    time: string;
    tempZ1: number;
    tempZ2: number;
    tempZ3: number;
    tempZ4: number;
    nozzleTemp: number;
    moldTemp: number;
    injPressureBar: number;
    screwRpm: number;
    cycleTimeSec: number;
    inSpec: boolean;
    operatorInitials: string;
  }>;
  qualityGateChecks: Array<{
    checkpoint: string;
    sampleSize: number;
    nominal: string;
    tolerance: string;
    measuredAvg: string;
    result: 'Pass' | 'Fail';
    tester: string;
    time: string;
  }>;
  deviations: Array<{
    id: string;
    description: string;
    severity: 'Minor' | 'Major';
    correctiveAction: string;
    approvedBy: string;
  }>;
  digitalSignatures: Array<{
    role: string;
    signer: string;
    timestamp: string;
    signatureHash: string;
    status: 'Signed' | 'Pending';
  }>;
}

export interface ChangeoverScheduleItem {
  id: string;
  machineId: string;
  fromProduct: { code: string; name: string; color: string; colorHex: string; resin: string; mold: string };
  toProduct: { code: string; name: string; color: string; colorHex: string; resin: string; mold: string };
  scheduledStartTime: string;
  estimatedDurationMin: number;
  actualDurationMin?: number;
  changeoverType: 'Color Change' | 'Mold + Color Change' | 'Resin Transition' | 'Tool Insert Swap';
  sequencePenalty: 'Optimal (Light-to-Dark)' | 'Sub-optimal (Dark-to-Light: Heavy Purge Required)' | 'Standard';
  estimatedPurgeWasteKg: number;
  status: 'Scheduled' | 'In Progress' | 'Completed';
  checklist: Array<{
    id: string;
    step: string;
    category: 'Internal (Machine Stopped)' | 'External (While Running)';
    estimatedMin: number;
    actualMin?: number;
    completed: boolean;
    operator?: string;
  }>;
}

export const INITIAL_MOLDS: MoldMaster[] = [
  {
    id: 'MLD-1001',
    assetTag: 'AST-MLD-001001',
    name: '500ml Round Container 4-Cavity Tool',
    type: 'Injection Mold',
    cavities: 4,
    activeCavities: 4,
    hotRunner: 'Yudo Valve Gate 8-Drop',
    steelType: 'S136 Mirror Stainless',
    manufacturer: 'Husky Precision Tooling',
    purchaseDate: '2023-03-15',
    purchaseCost: 45000,
    expectedLifeShots: 1000000,
    currentShotCount: 428650,
    shotsSinceLastPM: 28650,
    pmIntervalShots: 50000,
    status: 'in_use',
    assignedMachine: 'IMM-250T-03',
    assignedWO: 'WO-1188',
    storageLocation: 'RACK-MLD-A01',
    compatibleProducts: ['FG-CTN-500', 'FG-CTN-500-EXP'],
    lastServiceDate: '2026-06-12',
    lastTechnician: 'D. Mistry',
    scrapRatePct: 1.8,
    averageCycleTimeSec: 12.1,
    maintenanceHistory: [
      { date: '2026-06-12', type: 'Cavity Polish', technician: 'D. Mistry', shotsAtService: 400000, cost: 420, notes: 'Stripped minor gas marks from Cavity #3' },
      { date: '2026-03-01', type: 'Cleaning & Degreasing', technician: 'R. Pawar', shotsAtService: 350000, cost: 180, notes: 'Full ultrasonic wash and seal check' }
    ]
  },
  {
    id: 'MLD-1002',
    assetTag: 'AST-MLD-001002',
    name: 'Industrial Heavy Pallet 1-Cavity Mold',
    type: 'Injection Mold',
    cavities: 1,
    activeCavities: 1,
    hotRunner: 'Synventive Hot Half',
    steelType: 'P20 Pre-hardened',
    manufacturer: 'KraussMaffei Tooling Group',
    purchaseDate: '2022-08-10',
    purchaseCost: 120000,
    expectedLifeShots: 500000,
    currentShotCount: 312400,
    shotsSinceLastPM: 48900,
    pmIntervalShots: 50000,
    status: 'available',
    storageLocation: 'BAY-PAL-01',
    compatibleProducts: ['FG-PAL-010', 'FG-PAL-010-LT'],
    lastServiceDate: '2026-04-18',
    lastTechnician: 'D. Mistry',
    scrapRatePct: 2.4,
    averageCycleTimeSec: 45.0,
    maintenanceHistory: [
      { date: '2026-04-18', type: 'Ejector Pin Replacement', technician: 'D. Mistry', shotsAtService: 263500, cost: 850, notes: 'Replaced 4 primary hydraulic ejector rods' }
    ]
  },
  {
    id: 'MLD-1003',
    assetTag: 'AST-MLD-001003',
    name: 'Household 10L Bucket & Handle 2-Cavity',
    type: 'Injection Mold',
    cavities: 2,
    activeCavities: 2,
    hotRunner: 'Direct Gated Hot Tip',
    steelType: 'H13 Through-hardened (52 HRC)',
    manufacturer: 'Universal Mold Tech',
    purchaseDate: '2024-01-20',
    purchaseCost: 38000,
    expectedLifeShots: 750000,
    currentShotCount: 184500,
    shotsSinceLastPM: 14500,
    pmIntervalShots: 40000,
    status: 'available',
    storageLocation: 'RACK-MLD-B04',
    compatibleProducts: ['FG-BKT-010'],
    lastServiceDate: '2026-07-02',
    lastTechnician: 'S. Patil',
    scrapRatePct: 1.2,
    averageCycleTimeSec: 18.0,
    maintenanceHistory: [
      { date: '2026-07-02', type: 'Cleaning & Degreasing', technician: 'S. Patil', shotsAtService: 170000, cost: 150, notes: 'Routine water channel descaling' }
    ]
  },
  {
    id: 'MLD-1004',
    assetTag: 'AST-MLD-001004',
    name: 'PET Beverage Preform 28mm 48-Cavity Tool',
    type: 'Injection Mold',
    cavities: 48,
    activeCavities: 48,
    hotRunner: 'Husky UltraFlow',
    steelType: 'S136 Mirror Stainless',
    manufacturer: 'Husky Injection Systems',
    purchaseDate: '2024-05-12',
    purchaseCost: 165000,
    expectedLifeShots: 3000000,
    currentShotCount: 890400,
    shotsSinceLastPM: 40400,
    pmIntervalShots: 100000,
    status: 'available',
    storageLocation: 'CLEAN-RACK-01',
    compatibleProducts: ['FG-PET-030'],
    lastServiceDate: '2026-05-20',
    lastTechnician: 'D. Mistry',
    scrapRatePct: 0.8,
    averageCycleTimeSec: 8.5,
    maintenanceHistory: [
      { date: '2026-05-20', type: 'Hot Runner Heater Change', technician: 'D. Mistry', shotsAtService: 850000, cost: 1200, notes: 'Replaced Zone 12 manifold thermocouple and band' }
    ]
  },
  {
    id: 'MLD-1005',
    assetTag: 'AST-MLD-001005',
    name: 'Automotive Electrical Connector 8-Cavity Sub-gate',
    type: 'Injection Mold',
    cavities: 8,
    activeCavities: 7, // 1 cavity shut off due to burr
    hotRunner: 'Cold Runner 2-Plate',
    steelType: 'NAK80 High Polish',
    manufacturer: 'Meusburger Mold Masters',
    purchaseDate: '2025-02-14',
    purchaseCost: 52000,
    expectedLifeShots: 800000,
    currentShotCount: 245000,
    shotsSinceLastPM: 25000,
    pmIntervalShots: 30000,
    status: 'maintenance',
    storageLocation: 'TOOLROOM-BAY-02',
    compatibleProducts: ['FG-AUTO-CON-08'],
    lastServiceDate: '2026-08-20',
    lastTechnician: 'D. Mistry',
    scrapRatePct: 4.6,
    averageCycleTimeSec: 14.5,
    maintenanceHistory: [
      { date: '2026-08-20', type: 'Core Refurbishment', technician: 'D. Mistry', shotsAtService: 245000, cost: 650, notes: 'Cavity #4 shut off due to pin scoring; undergoing EDM repair' }
    ]
  }
];

export const SCRAP_REASONS_HIERARCHY = [
  {
    category: 'Material Defect',
    subReasons: [
      { code: 'MAT-CONTAM', label: 'Resin Contamination / Foreign Particulates' },
      { code: 'MAT-MOIST', label: 'Excess Moisture / Silver Streaks (Splay)' },
      { code: 'MAT-WRG-GRD', label: 'Incorrect Resin Grade / Wrong MFI' },
      { code: 'MAT-COLOR-DISP', label: 'Masterbatch Dispersion Failure / Streaks' }
    ]
  },
  {
    category: 'Process Defect',
    subReasons: [
      { code: 'PRC-SHORT-SHOT', label: 'Short Shot (Incomplete Cavity Fill)' },
      { code: 'PRC-FLASH-BURR', label: 'Flash / Parting Line Burrs' },
      { code: 'PRC-BURN-MARK', label: 'Diesel Effect / Gas Burn Marks' },
      { code: 'PRC-SINK-MARK', label: 'Sink Marks / Rib Shrinkage' },
      { code: 'PRC-WARPAGE', label: 'Differential Cooling Warpage' },
      { code: 'PRC-DIM-FAIL', label: 'Critical Dimension Out of Tolerance' },
      { code: 'PRC-FLOW-LINE', label: 'Weld / Knit Line Weakness' }
    ]
  },
  {
    category: 'Machine & Tooling Issue',
    subReasons: [
      { code: 'MCH-TEMP-DEV', label: 'Barrel Temperature Profile Deviation' },
      { code: 'MCH-PRESS-DROP', label: 'Injection / Holding Pressure Drop' },
      { code: 'MCH-MOLD-DMG', label: 'Cavity Gate Wear / Scored Core Pin' },
      { code: 'MCH-EJECT-STUCK', label: 'Part Stuck on Ejector Pin' }
    ]
  },
  {
    category: 'Setup & Changeover Waste',
    subReasons: [
      { code: 'SET-PURGE-RES', label: 'Purging Compound Transition Waste' },
      { code: 'SET-COLOR-TRANS', label: 'Color Washout (Dark-to-Light Purge)' },
      { code: 'SET-FIRST-ART', label: 'First Article Setup Scrap' },
      { code: 'SET-STARTUP-WARM', label: 'Machine Heat Stabilization Shots' }
    ]
  }
];

export const DOWNTIME_REASONS_HIERARCHY = [
  {
    category: 'Equipment Failure',
    subReasons: [
      { code: 'EQ-MECH-BRK', label: 'Mechanical Breakdown / Clamp Jam' },
      { code: 'EQ-ELEC-FLT', label: 'Electrical Fault / Driver Trip' },
      { code: 'EQ-HYD-PNEU', label: 'Hydraulic Valve / Pneumatic Pressure Loss' },
      { code: 'EQ-HTR-SNSR', label: 'Heater Band / Thermocouple Failure' },
      { code: 'EQ-PLC-CTRL', label: 'PLC / Robot Automation Error' }
    ]
  },
  {
    category: 'Tooling & Mold',
    subReasons: [
      { code: 'TOOL-MOLD-DMG', label: 'Mold Cavity Damage / Parting Burr' },
      { code: 'TOOL-CLEAN', label: 'Mold Cleaning / Vent Degas' },
      { code: 'TOOL-HOT-RUN', label: 'Hot Runner Tip Clogged / Leak' },
      { code: 'TOOL-EJECT-PB', label: 'Ejector Pin Seized / Return Spring Broke' }
    ]
  },
  {
    category: 'Material & Feed',
    subReasons: [
      { code: 'MAT-SHORTAGE', label: 'Raw Material Hopper Starvation' },
      { code: 'MAT-DRY-WAIT', label: 'Waiting for Resin Pre-drying (Dew Point)' },
      { code: 'MAT-FEED-JAM', label: 'Throat Bridging / Screw Feeder Jam' }
    ]
  },
  {
    category: 'Process & Tuning',
    subReasons: [
      { code: 'PRC-PARAM-ADJ', label: 'Process Parameter Optimization / DOE' },
      { code: 'PRC-QC-HOLD', label: 'Waiting for First Article QA Signoff' },
      { code: 'PRC-PART-STUCK', label: 'Part Stuck in Mold (Manual Extraction)' },
      { code: 'PRC-PURGING', label: 'Purging Barrel & Screw' }
    ]
  },
  {
    category: 'Changeover & Setup (SMED)',
    subReasons: [
      { code: 'SMED-MOLD-CHG', label: 'Mold Change / Crane Hoisting' },
      { code: 'SMED-COLOR-CHG', label: 'Color Changeover & Barrel Scrub' },
      { code: 'SMED-RESIN-CHG', label: 'Resin Polymer Type Change' },
      { code: 'SMED-PACK-SETUP', label: 'Robot End-of-Arm Tooling (EOAT) Setup' }
    ]
  },
  {
    category: 'External & Utilities',
    subReasons: [
      { code: 'EXT-CHILLER', label: 'Chilled Water Loop Temperature Spike' },
      { code: 'EXT-AIR-PRESS', label: 'Plant Compressed Air Drop' },
      { code: 'EXT-POWER-FLK', label: 'Power Grid Fluctuation' },
      { code: 'EXT-OPERATOR', label: 'Operator Absent / Shift Handover Delay' }
    ]
  },
  {
    category: 'Planned Downtime',
    subReasons: [
      { code: 'PLN-PREV-MAINT', label: 'Scheduled PM (Preventive Maintenance)' },
      { code: 'PLN-MEAL-BREAK', label: 'Scheduled Shift Meal Break' },
      { code: 'PLN-SAFETY-AUDIT', label: 'Safety LOTO & Toolroom Audit' }
    ]
  }
];

export const INITIAL_EBR_RECORDS: ElectronicBatchRecord[] = [
  {
    id: 'EBR-2026-00456',
    batchLotNumber: 'LOT-CTN-2026-0828',
    itemCode: 'FG-CTN-500',
    itemName: 'Plastic Container 500ml Natural',
    workOrderRef: 'WO-1188',
    machineId: 'IMM-250T-03',
    moldId: 'MLD-1001',
    productionDate: '2026-08-28',
    shift: 'Shift A (06:00 - 14:00)',
    leadOperator: 'Rajesh Kumar (OP-441)',
    supervisor: 'Anjali Sharma (SPV-102)',
    qaApprover: 'Dr. Vikram Sen (QA-Lead)',
    status: 'In Progress',
    targetQty: 8000,
    goodQty: 6240,
    scrapQty: 112,
    reworkQty: 0,
    yieldPct: 98.2,
    environmental: {
      ambientTempC: 24.5,
      relativeHumidityPct: 48,
      dewPointC: -38.2,
      dryingHopperTempC: 80
    },
    recipeVerification: [
      { ingredientCode: 'RM-PP-NAT-001', description: 'PP Natural Granules', bomQtyKg: 3880, actualDosedKg: 3880, lotNumber: 'LOT-001-01', verifiedBy: 'R. Kumar', status: 'Verified' },
      { ingredientCode: 'MB-WHT-002', description: 'White Masterbatch', bomQtyKg: 96, actualDosedKg: 96, lotNumber: 'LOT-MB-00456', verifiedBy: 'R. Kumar', status: 'Verified' },
      { ingredientCode: 'RG-PP-011', description: 'Internal Regrind PP (Max 15%)', bomQtyKg: 420, actualDosedKg: 420, lotNumber: 'RG-00321', verifiedBy: 'R. Kumar', status: 'Verified' }
    ],
    processCheckpoints: [
      { time: '07:30', tempZ1: 205, tempZ2: 212, tempZ3: 215, tempZ4: 218, nozzleTemp: 220, moldTemp: 35, injPressureBar: 845, screwRpm: 118, cycleTimeSec: 12.1, inSpec: true, operatorInitials: 'RK' },
      { time: '09:30', tempZ1: 206, tempZ2: 213, tempZ3: 215, tempZ4: 218, nozzleTemp: 221, moldTemp: 36, injPressureBar: 850, screwRpm: 120, cycleTimeSec: 12.0, inSpec: true, operatorInitials: 'RK' },
      { time: '11:30', tempZ1: 205, tempZ2: 212, tempZ3: 216, tempZ4: 219, nozzleTemp: 220, moldTemp: 35, injPressureBar: 848, screwRpm: 119, cycleTimeSec: 12.2, inSpec: true, operatorInitials: 'RK' }
    ],
    qualityGateChecks: [
      { checkpoint: 'First Article Visual (No flash/burns)', sampleSize: 10, nominal: 'Flawless', tolerance: 'Class A Finish', measuredAvg: 'Zero defects', result: 'Pass', tester: 'S. Deshmukh', time: '07:15' },
      { checkpoint: 'Wall Thickness (Rim Section)', sampleSize: 12, nominal: '1.20 mm', tolerance: '±0.08 mm', measuredAvg: '1.21 mm', result: 'Pass', tester: 'S. Deshmukh', time: '09:00' },
      { checkpoint: 'Part Net Weight', sampleSize: 20, nominal: '48.50 g', tolerance: '±0.60 g', measuredAvg: '48.54 g', result: 'Pass', tester: 'S. Deshmukh', time: '11:00' }
    ],
    deviations: [
      { id: 'DEV-001', description: 'Slight cooling water temperature surge to 38°C for 6 mins due to chiller cycling', severity: 'Minor', correctiveAction: 'Chiller secondary pump engaged; returned to 35°C', approvedBy: 'A. Sharma' }
    ],
    digitalSignatures: [
      { role: 'Operator Sign-off', signer: 'Rajesh Kumar (OP-441)', timestamp: '2026-08-28 07:10:22', signatureHash: 'SHA256:8f4c3a1b9e...', status: 'Signed' },
      { role: 'Shift Supervisor Verification', signer: 'Anjali Sharma (SPV-102)', timestamp: '2026-08-28 07:25:40', signatureHash: 'SHA256:3d2e1f4a7b...', status: 'Signed' },
      { role: 'Quality Assurance Final Release', signer: 'Dr. Vikram Sen (QA-Lead)', timestamp: 'Pending Final Run', signatureHash: 'Pending', status: 'Pending' }
    ]
  }
];

export const INITIAL_CHANGEOVERS: ChangeoverScheduleItem[] = [
  {
    id: 'CHG-2026-01',
    machineId: 'IMM-250T-03',
    fromProduct: { code: 'FG-CTN-500', name: '500ml Natural Container', color: 'Natural/Clear', colorHex: '#E2E8F0', resin: 'PP Homopolymer', mold: 'MLD-1001' },
    toProduct: { code: 'FG-CTN-500-BLU', name: '500ml Royal Blue Container', color: 'Royal Blue', colorHex: '#2563EB', resin: 'PP Homopolymer', mold: 'MLD-1001' },
    scheduledStartTime: 'Today, 14:00',
    estimatedDurationMin: 35,
    actualDurationMin: 32,
    changeoverType: 'Color Change',
    sequencePenalty: 'Optimal (Light-to-Dark)',
    estimatedPurgeWasteKg: 4.2,
    status: 'In Progress',
    checklist: [
      { id: 'STP-1', step: 'Run barrel dry & remove natural hopper feed', category: 'Internal (Machine Stopped)', estimatedMin: 5, actualMin: 4, completed: true, operator: 'R. Kumar' },
      { id: 'STP-2', step: 'Load Dyna-Purge compound & scrub screw zones (220°C)', category: 'Internal (Machine Stopped)', estimatedMin: 10, actualMin: 9, completed: true, operator: 'R. Kumar' },
      { id: 'STP-3', step: 'Load Blue Masterbatch MB-BLU-003 with PP resin', category: 'External (While Running)', estimatedMin: 5, actualMin: 5, completed: true, operator: 'R. Kumar' },
      { id: 'STP-4', step: 'Purge until solid uniform royal blue color achieved', category: 'Internal (Machine Stopped)', estimatedMin: 8, actualMin: 7, completed: true, operator: 'R. Kumar' },
      { id: 'STP-5', step: 'Inject 3 first article shots & check color shade against delta-E spectro', category: 'Internal (Machine Stopped)', estimatedMin: 7, actualMin: 7, completed: false }
    ]
  },
  {
    id: 'CHG-2026-02',
    machineId: 'IMM-450T-01',
    fromProduct: { code: 'FG-BKT-010', name: 'Household Bucket 10L', color: 'Signal Red', colorHex: '#DC2626', resin: 'PP Block Copolymer', mold: 'MLD-1003' },
    toProduct: { code: 'FG-PAL-010', name: 'Plastic Heavy Pallet', color: 'Black Recycled', colorHex: '#1F2937', resin: 'HDPE Granules', mold: 'MLD-1002' },
    scheduledStartTime: 'Tomorrow, 06:00',
    estimatedDurationMin: 90,
    changeoverType: 'Mold + Color Change',
    sequencePenalty: 'Standard',
    estimatedPurgeWasteKg: 12.5,
    status: 'Scheduled',
    checklist: [
      { id: 'STP-1', step: 'Pre-stage Mold MLD-1002 on overhead crane bay', category: 'External (While Running)', estimatedMin: 15, completed: false },
      { id: 'STP-2', step: 'Disconnect water lines & thermocouple probes from MLD-1003', category: 'Internal (Machine Stopped)', estimatedMin: 10, completed: false },
      { id: 'STP-3', step: 'Unclamp & hoist MLD-1003 to storage rack RACK-MLD-B04', category: 'Internal (Machine Stopped)', estimatedMin: 20, completed: false },
      { id: 'STP-4', step: 'Hoist MLD-1002 into IMM platen & tighten hydraulic tie-bars', category: 'Internal (Machine Stopped)', estimatedMin: 25, completed: false },
      { id: 'STP-5', step: 'Connect high-flow chilled water loop & heat soak mold (45°C)', category: 'Internal (Machine Stopped)', estimatedMin: 10, completed: false },
      { id: 'STP-6', step: 'Switch hopper to HDPE resin & verify barrel temp profile', category: 'Internal (Machine Stopped)', estimatedMin: 10, completed: false }
    ]
  }
];

export const EXCEL_IMPORT_TEMPLATES = [
  {
    id: 'TPL-STD-01',
    name: 'Standard Plant Shift Production Log',
    description: 'Auto-maps Work Order #, Date, Shift, Good Qty, Scrap Qty, Defect Reason, Downtime',
    headerRow: 1,
    matchingRule: 'WO Number + Shift',
    fieldMappings: [
      { excelCol: 'WO No', erpField: 'Work Order Number', required: true },
      { excelCol: 'Shift', erpField: 'Shift', required: true },
      { excelCol: 'Date', erpField: 'Date', required: false },
      { excelCol: 'Good Output', erpField: 'OK Qty', required: true },
      { excelCol: 'Rejection Qty', erpField: 'Rejection Qty', required: false },
      { excelCol: 'Rejection Reason', erpField: 'Rejection Reason', required: false },
      { excelCol: 'Runner Wt (KG)', erpField: 'Runner Qty', required: false },
      { excelCol: 'Lump Wt (KG)', erpField: 'Lumbes Qty', required: false },
      { excelCol: 'DT Min', erpField: 'Downtime Minutes', required: false },
      { excelCol: 'DT Reason', erpField: 'Downtime Reason', required: false },
      { excelCol: 'Operator Name', erpField: 'Operator', required: false }
    ]
  },
  {
    id: 'TPL-MES-02',
    name: 'Automated MES Machine Counter Export',
    description: 'Direct shot counter export from Euromap 63 / OPC-UA bridge',
    headerRow: 1,
    matchingRule: 'WO Number + Shift + Machine',
    fieldMappings: [
      { excelCol: 'work_order_id', erpField: 'Work Order Number', required: true },
      { excelCol: 'shift_code', erpField: 'Shift', required: true },
      { excelCol: 'machine_asset_id', erpField: 'Machine', required: true },
      { excelCol: 'total_shots', erpField: 'Production Qty', required: true },
      { excelCol: 'good_parts', erpField: 'OK Qty', required: true },
      { excelCol: 'bad_parts', erpField: 'Rejection Qty', required: false },
      { excelCol: 'downtime_sec', erpField: 'Downtime Minutes', required: false }
    ]
  }
];

export const INITIAL_OPERATOR_LOGS = [
  {
    id: 'OPLOG-101',
    woNumber: 'WO-1188',
    date: '2026-08-28',
    shift: 'Shift A',
    machine: 'IMM-250T-03',
    itemCode: 'FG-CTN-500',
    prevOperator: 'None (Initial Assignment)',
    newOperator: 'Rajesh Kumar (Senior Molder)',
    prevTeam: '—',
    newTeam: 'Team Alpha (Bay 1)',
    changedBy: 'Anjali Sharma (Supervisor)',
    timestamp: '2026-08-28 06:00:00',
    reason: 'Shift Start Allocation',
    source: 'Manual Allocation',
    status: 'Active'
  },
  {
    id: 'OPLOG-102',
    woNumber: 'WO-1191',
    date: '2026-08-28',
    shift: 'Shift A',
    machine: 'IMM-650T-01',
    itemCode: 'FG-AUTO-CON-08',
    prevOperator: 'K. Verma',
    newOperator: 'M. Patel (Technical Specialist)',
    prevTeam: 'Team Beta',
    newTeam: 'Precision Auto Cell',
    changedBy: 'D. Mistry (Plant Engineer)',
    timestamp: '2026-08-28 09:15:00',
    reason: 'Skill-based assignment for high-cavity tuning',
    source: 'Skill Matrix Transfer',
    status: 'Active'
  },
  {
    id: 'OPLOG-103',
    woNumber: 'WO-1190',
    date: '2026-08-27',
    shift: 'Shift B',
    machine: 'IMM-450T-01',
    itemCode: 'FG-BKT-010',
    prevOperator: 'A. Sharma',
    newOperator: 'S. Deshmukh',
    prevTeam: 'Team Alpha',
    newTeam: 'Team Beta',
    changedBy: 'Priya Rao (Planner)',
    timestamp: '2026-08-27 14:00:00',
    reason: 'Shift Rotation',
    source: 'Shift Handover Log',
    status: 'Completed'
  }
];
