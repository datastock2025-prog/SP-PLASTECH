export interface UserGroup {
  id: string;
  name: string;
  code: string;
  department: string;
  description: string;
  membersCount: number;
  rolesAssigned: string[];
  plantAccess: string[];
  supervisorName: string;
  status: 'Active' | 'Inactive';
  createdDate: string;
  tags: string[];
}

export interface WorkflowRuleConfig {
  id: string;
  name: string;
  documentType: string;
  module: string;
  description: string;
  isActive: boolean;
  minAmount?: number;
  maxAmount?: number;
  conditionFormula: string;
  slaHoursTotal: number;
  stages: {
    stageNumber: number;
    stageName: string;
    approverType: 'Role' | 'Specific User' | 'Department Head' | 'Dynamic Hierarchy';
    approverValue: string;
    escalateAfterHours: number;
    escalateTo: string;
    requireComment: boolean;
    notifyVia: ('Email' | 'WhatsApp' | 'InApp')[];
  }[];
}

export interface WarehouseLocationConfig {
  id: string;
  warehouseCode: string;
  warehouseName: string;
  plantId: string;
  plantName: string;
  zoneCode: string;
  zoneName: string;
  zoneType: 'Raw Polymer Silos' | 'Masterbatch Temperature Controlled' | 'Finished Goods High-Bay' | 'Regrind / Scrap Staging' | 'Tool & Die Staging' | 'Quarantine & Hold';
  aisle: string;
  rack: string;
  shelf: string;
  binCode: string;
  maxCapacityKg: number;
  currentOccupancyKg: number;
  temperatureControlled: boolean;
  targetTempCelsius?: number;
  humidityMaxPct?: number;
  isBlocked: boolean;
  barcodeScannable: boolean;
}

export interface MachineWorkCenterConfig {
  id: string;
  code: string;
  name: string;
  plantId: string;
  plantName: string;
  bayNumber: string;
  category: 'Injection Molding' | 'Blow Molding' | 'Twin-Screw Extrusion' | 'Ultrasonic Welding' | 'Auxiliary Chiller & Dehumidifier';
  tonnageRating: number;
  clampingForceKn: number;
  tieBarSpacingMm: string;
  maxShotWeightGrams: number;
  screwDiameterMm: number;
  hourlyCostRateInr: number;
  currentStatus: 'Running' | 'Idle' | 'Maintenance' | 'Tool Changeover';
  plcInterfaceIp: string;
  energyMeterId: string;
  oeeTargetPct: number;
  currentOeePct: number;
  assignedMolds: string[];
}

export interface ShiftCalendarConfig {
  id: string;
  shiftCode: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  handoverBufferMinutes: number;
  paidBreakMinutes: number;
  shiftAllowanceInr: number;
  isNightShift: boolean;
  appliesToPlants: string[];
  status: 'Active' | 'Suspended';
}

export interface HolidayOvertimeRule {
  id: string;
  title: string;
  dateOrRule: string;
  type: 'Gazetted Holiday' | 'Restricted Holiday' | 'Annual Plant Overhaul Shutdown' | 'Weekly Off';
  otMultiplier: number;
  compOffEligible: boolean;
  affectedPlants: string[];
}

export interface ReasonCodeItem {
  id: string;
  code: string;
  title: string;
  subCategory: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  affectsOEE: boolean;
  defaultAction: string;
  isActive: boolean;
  department: string;
}

export interface MasterDataRecord {
  id: string;
  entityType: 'Polymer Resin Item' | 'Color Masterbatch' | 'Finished Molded Component' | 'Tooling & Mold Asset' | 'Customer Account' | 'Supplier Account';
  code: string;
  name: string;
  primaryUom: string;
  category: string;
  plantScope: string;
  lastUpdated: string;
  updatedBy: string;
  complianceCert: string;
  status: 'Approved' | 'Draft' | 'Locked';
}

export interface DocumentSettingPolicy {
  id: string;
  categoryName: string;
  codePrefix: string;
  description: string;
  mandatoryWatermark: string;
  retentionYears: number;
  approvalRequired: boolean;
  allowedExtensions: string[];
  maxFileSizeMb: number;
  cloudStorageBucket: string;
  autoExpireAlertDays: number;
}

export interface SecurityLoginAuditRecord {
  id: string;
  timestamp: string;
  userEmail: string;
  fullName: string;
  role: string;
  ipAddress: string;
  geoLocation: string;
  deviceBrowser: string;
  authMethod: 'Password + TOTP' | 'Password + SMS' | 'Single Sign-On (SAML)' | 'Failed Password';
  status: 'Successful Login' | 'MFA Challenge Failed' | 'Account Locked (Brute Force)' | 'Session Expired';
  riskScore: 'Low' | 'Medium' | 'High';
}

export interface DataExchangeJob {
  id: string;
  jobName: string;
  type: 'IMPORT' | 'EXPORT';
  entity: string;
  fileFormat: 'CSV' | 'XLSX' | 'JSON' | 'EDI 850';
  totalRecords: number;
  successCount: number;
  errorCount: number;
  startedAt: string;
  durationSec: number;
  triggeredBy: string;
  status: 'Completed' | 'Failed' | 'In Progress';
  downloadUrl?: string;
}

export interface DataRetentionPolicy {
  id: string;
  dataDomain: string;
  retentionPeriod: string;
  legalBasis: string;
  autoPurgeEnabled: boolean;
  anonymizePii: boolean;
  backupTarget: string;
  lastRunDate: string;
}

export interface LicenseSubscriptionDetails {
  planName: string;
  tier: 'Enterprise Plastics Suite';
  organization: string;
  customerCin: string;
  licenseKey: string;
  activePlants: number;
  maxPlantsAllowed: number;
  activeUserSeats: number;
  totalSeatsLicensed: number;
  concurrentLogins: number;
  licensedModules: { name: string; status: 'Active' | 'Add-on'; expiry: string }[];
  contractStart: string;
  contractRenewal: string;
  daysRemaining: number;
  supportSlaTier: string;
  dedicatedAccountManager: string;
}

// -------------------------------------------------------------
// Mock Data for User Groups (Screen 4)
// -------------------------------------------------------------
export const mockUserGroups: UserGroup[] = [
  {
    id: 'GRP-01',
    name: 'Tool Room & Mold Maintenance Gang',
    code: 'TOOL-MAINT',
    department: 'Tooling & Maintenance',
    description: 'Lead toolmakers and technicians authorized for mold inspection, cavity polishing, and clamp resets.',
    membersCount: 14,
    rolesAssigned: ['Mold Tech Lead', 'Preventive Maintenance Tech'],
    plantAccess: ['Pune / Chakan Hub', 'Sanand Precision'],
    supervisorName: 'Kailash Deshmukh',
    status: 'Active',
    createdDate: '2024-03-10',
    tags: ['Injection Molds', 'Die Clamping', 'Critical Spares'],
  },
  {
    id: 'GRP-02',
    name: 'Color Matching & Polymer Rheology Lab',
    code: 'COLOR-LAB',
    department: 'Quality Assurance',
    description: 'Spectrophotometer technicians, MFI testers, and raw polymer quality certification engineers.',
    membersCount: 8,
    rolesAssigned: ['QA Lab Chemist', 'Polymer Testing Specialist'],
    plantAccess: ['Pune / Chakan Hub', 'Sanand Precision', 'Chennai Molding'],
    supervisorName: 'Dr. Sunita Kulkarni',
    status: 'Active',
    createdDate: '2024-01-22',
    tags: ['Spectrophotometer', 'MFI Testing', 'Spectra-Check'],
  },
  {
    id: 'GRP-03',
    name: 'Shift-C Night Operations Crew',
    code: 'NIGHT-CREW-C',
    department: 'Production',
    description: 'Autonomous night shift operators with emergency halt and regrind hopper override authorizations.',
    membersCount: 32,
    rolesAssigned: ['Senior Injection Operator', 'Material Loader'],
    plantAccess: ['Pune / Chakan Hub'],
    supervisorName: 'Ramesh Powar',
    status: 'Active',
    createdDate: '2024-06-01',
    tags: ['Night Shift', 'Continuous Molding', 'Emergency Dispatch'],
  },
  {
    id: 'GRP-04',
    name: 'Automotive PPAP Level-3 Audit Team',
    code: 'AUTO-PPAP',
    department: 'OEM Quality Compliance',
    description: 'Cross-functional engineers responsible for Tata Motors & Maruti Suzuki First Piece Inspection & CMM Reports.',
    membersCount: 6,
    rolesAssigned: ['Quality Lead', 'DFM Engineer', 'Production Manager'],
    plantAccess: ['Pune / Chakan Hub', 'Chennai Molding'],
    supervisorName: 'Vikramaditya Sen',
    status: 'Active',
    createdDate: '2024-02-18',
    tags: ['IATF 16949', 'PPAP L3', 'OEM Audits'],
  },
  {
    id: 'GRP-05',
    name: 'Resin Silo & Bulk Logistics Dispatchers',
    code: 'SILO-LOGISTICS',
    department: 'Supply Chain & Warehousing',
    description: 'Weighbridge operators, bulk silo pneumatic discharge crew, and raw polymer lot receivers.',
    membersCount: 11,
    rolesAssigned: ['Warehouse Officer', 'Weighbridge Inspector'],
    plantAccess: ['Pune / Chakan Hub', 'Sanand Precision'],
    supervisorName: 'Mahesh Jadhav',
    status: 'Active',
    createdDate: '2024-05-14',
    tags: ['Silo Pneumatics', 'Weighbridge', 'Bulk Polymer'],
  },
];

// -------------------------------------------------------------
// Mock Data for Approval Workflows (Screen 5)
// -------------------------------------------------------------
export const mockWorkflowConfigs: WorkflowRuleConfig[] = [
  {
    id: 'WF-PO-POLYMER',
    name: 'Prime Polymer Resin Bulk Procurement (>₹5 Lakhs)',
    documentType: 'Purchase Order (PO)',
    module: 'Procurement',
    description: 'High-value polyolefin (PP/HDPE/ABS) tanker loads and 25kg pallet orders requiring financial sign-off.',
    isActive: true,
    minAmount: 500000,
    maxAmount: 5000000,
    conditionFormula: 'PO.Category == "Polymer Resin" && PO.TotalAmount >= 500000',
    slaHoursTotal: 48,
    stages: [
      {
        stageNumber: 1,
        stageName: 'Technical & Rate Variance Check',
        approverType: 'Role',
        approverValue: 'SCM Purchase Manager',
        escalateAfterHours: 12,
        escalateTo: 'VP of Supply Chain',
        requireComment: false,
        notifyVia: ['Email', 'InApp'],
      },
      {
        stageNumber: 2,
        stageName: 'Plant Budget & Working Capital Validation',
        approverType: 'Role',
        approverValue: 'Financial Controller',
        escalateAfterHours: 24,
        escalateTo: 'CFO',
        requireComment: true,
        notifyVia: ['Email', 'WhatsApp', 'InApp'],
      },
      {
        stageNumber: 3,
        stageName: 'Executive Expenditure Authorization',
        approverType: 'Specific User',
        approverValue: 'Priya Rao (VP Ops)',
        escalateAfterHours: 12,
        escalateTo: 'Managing Director',
        requireComment: true,
        notifyVia: ['WhatsApp', 'InApp'],
      },
    ],
  },
  {
    id: 'WF-SCRAP-DISP',
    name: 'Excess Scrap & Purge Lump Quarantine Disposition',
    documentType: 'Material Review Board (MRB)',
    module: 'Quality & Shopfloor',
    description: 'Triggered when production scrap or black-speck contamination exceeds 3.5% of total batch run.',
    isActive: true,
    conditionFormula: 'JobCard.ScrapPct > 3.5 || MRB.Disposition == "Scrap and Destroy"',
    slaHoursTotal: 18,
    stages: [
      {
        stageNumber: 1,
        stageName: 'Root Cause & Regrind Ratio Feasibility',
        approverType: 'Role',
        approverValue: 'Quality Assurance Lead',
        escalateAfterHours: 6,
        escalateTo: 'Plant Manager',
        requireComment: true,
        notifyVia: ['Email', 'InApp'],
      },
      {
        stageNumber: 2,
        stageName: 'Commercial Write-off Sign-off',
        approverType: 'Department Head',
        approverValue: 'Plant Manager (Chakan)',
        escalateAfterHours: 12,
        escalateTo: 'VP of Manufacturing',
        requireComment: true,
        notifyVia: ['InApp', 'Email'],
      },
    ],
  },
  {
    id: 'WF-MOLD-DEV',
    name: 'New Tool / Mold DFM Design Freeze & Tooling PO',
    documentType: 'Engineering Change Order (ECO)',
    module: 'Tooling & R&D',
    description: 'Sign-off on new multi-cavity injection molds, hot-runner manifold drawings, and prototype tool fabrication.',
    isActive: true,
    minAmount: 1500000,
    conditionFormula: 'ECO.Type == "New Mold Fabrication" && Tool.Cavities >= 4',
    slaHoursTotal: 72,
    stages: [
      {
        stageNumber: 1,
        stageName: 'Moldflow & Cooling Line Validation',
        approverType: 'Role',
        approverValue: 'Lead Tooling Engineer',
        escalateAfterHours: 24,
        escalateTo: 'Head of R&D',
        requireComment: true,
        notifyVia: ['Email', 'InApp'],
      },
      {
        stageNumber: 2,
        stageName: 'Automotive OEM Quality Alignment',
        approverType: 'Role',
        approverValue: 'OEM Program Manager',
        escalateAfterHours: 24,
        escalateTo: 'VP of Engineering',
        requireComment: false,
        notifyVia: ['Email'],
      },
      {
        stageNumber: 3,
        stageName: 'Capital Expenditure (CapEx) Board Approval',
        approverType: 'Role',
        approverValue: 'Executive Director',
        escalateAfterHours: 24,
        escalateTo: 'Managing Director',
        requireComment: true,
        notifyVia: ['Email', 'WhatsApp', 'InApp'],
      },
    ],
  },
];

// -------------------------------------------------------------
// Mock Data for Warehouse & Locations (Screen 8)
// -------------------------------------------------------------
export const mockWarehouseLocations: WarehouseLocationConfig[] = [
  {
    id: 'LOC-01',
    warehouseCode: 'WH-PUN-01',
    warehouseName: 'Chakan Central Polymer & Goods Hub',
    plantId: 'PLANT-01',
    plantName: 'Pune / Chakan Hub',
    zoneCode: 'Z-SILO',
    zoneName: 'External Silo Yard (PP/HDPE)',
    zoneType: 'Raw Polymer Silos',
    aisle: 'A1',
    rack: 'S01',
    shelf: '01',
    binCode: 'SILO-PP-01',
    maxCapacityKg: 50000,
    currentOccupancyKg: 38500,
    temperatureControlled: false,
    isBlocked: false,
    barcodeScannable: true,
  },
  {
    id: 'LOC-02',
    warehouseCode: 'WH-PUN-01',
    warehouseName: 'Chakan Central Polymer & Goods Hub',
    plantId: 'PLANT-01',
    plantName: 'Pune / Chakan Hub',
    zoneCode: 'Z-MB-AC',
    zoneName: 'Color Masterbatch Cleanroom A/C',
    zoneType: 'Masterbatch Temperature Controlled',
    aisle: 'B2',
    rack: 'R04',
    shelf: '03',
    binCode: 'MB-BLK-04C',
    maxCapacityKg: 2500,
    currentOccupancyKg: 1840,
    temperatureControlled: true,
    targetTempCelsius: 22,
    humidityMaxPct: 45,
    isBlocked: false,
    barcodeScannable: true,
  },
  {
    id: 'LOC-03',
    warehouseCode: 'WH-PUN-01',
    warehouseName: 'Chakan Central Polymer & Goods Hub',
    plantId: 'PLANT-01',
    plantName: 'Pune / Chakan Hub',
    zoneCode: 'Z-FG-HIGH',
    zoneName: 'Finished Automotive Bumpers High-Bay',
    zoneType: 'Finished Goods High-Bay',
    aisle: 'D1',
    rack: 'R12',
    shelf: '02',
    binCode: 'FG-BMP-D12',
    maxCapacityKg: 8000,
    currentOccupancyKg: 6200,
    temperatureControlled: false,
    isBlocked: false,
    barcodeScannable: true,
  },
  {
    id: 'LOC-04',
    warehouseCode: 'WH-PUN-01',
    warehouseName: 'Chakan Central Polymer & Goods Hub',
    plantId: 'PLANT-01',
    plantName: 'Pune / Chakan Hub',
    zoneCode: 'Z-REGRIND',
    zoneName: 'Regrind & Granulator Crushed Flakes',
    zoneType: 'Regrind / Scrap Staging',
    aisle: 'E3',
    rack: 'FL-01',
    shelf: '01',
    binCode: 'RGD-PP-E01',
    maxCapacityKg: 12000,
    currentOccupancyKg: 8900,
    temperatureControlled: false,
    isBlocked: false,
    barcodeScannable: true,
  },
  {
    id: 'LOC-05',
    warehouseCode: 'WH-SND-01',
    warehouseName: 'Sanand Precision Logistics Store',
    plantId: 'PLANT-02',
    plantName: 'Sanand Precision',
    zoneCode: 'Z-TOOL',
    zoneName: 'Heavy Injection Mold Die Rack Bay',
    zoneType: 'Tool & Die Staging',
    aisle: 'T1',
    rack: 'CR-02',
    shelf: '01',
    binCode: 'TOOL-DIE-T02',
    maxCapacityKg: 25000,
    currentOccupancyKg: 19500,
    temperatureControlled: false,
    isBlocked: false,
    barcodeScannable: true,
  },
  {
    id: 'LOC-06',
    warehouseCode: 'WH-PUN-01',
    warehouseName: 'Chakan Central Polymer & Goods Hub',
    plantId: 'PLANT-01',
    plantName: 'Pune / Chakan Hub',
    zoneCode: 'Z-QUAR',
    zoneName: 'Yellow Tag Quarantine & Lab Retest',
    zoneType: 'Quarantine & Hold',
    aisle: 'Q1',
    rack: 'R01',
    shelf: '01',
    binCode: 'QRN-LOT-99',
    maxCapacityKg: 5000,
    currentOccupancyKg: 2100,
    temperatureControlled: false,
    isBlocked: true,
    barcodeScannable: true,
  },
];

// -------------------------------------------------------------
// Mock Data for Machine / Work Centers (Screen 9)
// -------------------------------------------------------------
export const mockMachineWorkCenters: MachineWorkCenterConfig[] = [
  {
    id: 'MC-01',
    code: 'INJ-650T-01',
    name: 'Engel Victory 650 Ton Tie-Bar-Less',
    plantId: 'PLANT-01',
    plantName: 'Pune / Chakan Hub',
    bayNumber: 'Bay-A (Heavy Automotive)',
    category: 'Injection Molding',
    tonnageRating: 650,
    clampingForceKn: 6500,
    tieBarSpacingMm: 'Tie-bar-less 1200x1100',
    maxShotWeightGrams: 2850,
    screwDiameterMm: 90,
    hourlyCostRateInr: 2850,
    currentStatus: 'Running',
    plcInterfaceIp: '192.168.20.101',
    energyMeterId: 'EM-BAY-A-01',
    oeeTargetPct: 88,
    currentOeePct: 91.4,
    assignedMolds: ['MOLD-BMP-TATA-F', 'MOLD-BMP-TATA-R'],
  },
  {
    id: 'MC-02',
    code: 'INJ-350T-02',
    name: 'Toshiba EC350SX Electric High-Speed',
    plantId: 'PLANT-01',
    plantName: 'Pune / Chakan Hub',
    bayNumber: 'Bay-B (Precision Interior)',
    category: 'Injection Molding',
    tonnageRating: 350,
    clampingForceKn: 3500,
    tieBarSpacingMm: '730 x 730 mm',
    maxShotWeightGrams: 980,
    screwDiameterMm: 60,
    hourlyCostRateInr: 1750,
    currentStatus: 'Running',
    plcInterfaceIp: '192.168.20.102',
    energyMeterId: 'EM-BAY-B-02',
    oeeTargetPct: 85,
    currentOeePct: 86.2,
    assignedMolds: ['MOLD-BEZEL-AC-4C', 'MOLD-HVAC-VENT-8C'],
  },
  {
    id: 'MC-03',
    code: 'INJ-250T-03',
    name: 'Haitian Mars III 250T Servo Hydraulic',
    plantId: 'PLANT-01',
    plantName: 'Pune / Chakan Hub',
    bayNumber: 'Bay-B (Precision Interior)',
    category: 'Injection Molding',
    tonnageRating: 250,
    clampingForceKn: 2500,
    tieBarSpacingMm: '580 x 580 mm',
    maxShotWeightGrams: 520,
    screwDiameterMm: 45,
    hourlyCostRateInr: 1200,
    currentStatus: 'Tool Changeover',
    plcInterfaceIp: '192.168.20.103',
    energyMeterId: 'EM-BAY-B-03',
    oeeTargetPct: 82,
    currentOeePct: 74.8,
    assignedMolds: ['MOLD-DOOR-HANDLE-2C'],
  },
  {
    id: 'MC-04',
    code: 'EXT-75MM-01',
    name: 'Coperion ZSK 45 Twin-Screw Masterbatch Compounding',
    plantId: 'PLANT-02',
    plantName: 'Sanand Precision',
    bayNumber: 'Compounding Bay 1',
    category: 'Twin-Screw Extrusion',
    tonnageRating: 120,
    clampingForceKn: 1200,
    tieBarSpacingMm: 'N/A Extruder',
    maxShotWeightGrams: 45000,
    screwDiameterMm: 45,
    hourlyCostRateInr: 3200,
    currentStatus: 'Running',
    plcInterfaceIp: '192.168.30.201',
    energyMeterId: 'EM-EXT-01',
    oeeTargetPct: 85,
    currentOeePct: 88.7,
    assignedMolds: ['DIE-STRAND-PELLET-12H'],
  },
  {
    id: 'MC-05',
    code: 'WLD-US-01',
    name: 'Herrmann Ultrasonic 20kHz Welding Station',
    plantId: 'PLANT-01',
    plantName: 'Pune / Chakan Hub',
    bayNumber: 'Assembly Cell 3',
    category: 'Ultrasonic Welding',
    tonnageRating: 15,
    clampingForceKn: 150,
    tieBarSpacingMm: 'Benchtop',
    maxShotWeightGrams: 0,
    screwDiameterMm: 0,
    hourlyCostRateInr: 850,
    currentStatus: 'Idle',
    plcInterfaceIp: '192.168.20.145',
    energyMeterId: 'EM-WLD-01',
    oeeTargetPct: 90,
    currentOeePct: 89.1,
    assignedMolds: ['FIXTURE-AIR-DUCT-01'],
  },
];

// -------------------------------------------------------------
// Mock Data for Shifts & Working Calendar (Screen 10)
// -------------------------------------------------------------
export const mockShifts: ShiftCalendarConfig[] = [
  {
    id: 'SFT-01',
    shiftCode: 'SHIFT-A',
    shiftName: 'Morning Shift (Shift A)',
    startTime: '07:00',
    endTime: '15:30',
    durationHours: 8.5,
    handoverBufferMinutes: 15,
    paidBreakMinutes: 45,
    shiftAllowanceInr: 100,
    isNightShift: false,
    appliesToPlants: ['Pune / Chakan Hub', 'Sanand Precision', 'Chennai Molding'],
    status: 'Active',
  },
  {
    id: 'SFT-02',
    shiftCode: 'SHIFT-B',
    shiftName: 'Evening Shift (Shift B)',
    startTime: '15:30',
    endTime: '00:00',
    durationHours: 8.5,
    handoverBufferMinutes: 15,
    paidBreakMinutes: 45,
    shiftAllowanceInr: 150,
    isNightShift: false,
    appliesToPlants: ['Pune / Chakan Hub', 'Sanand Precision', 'Chennai Molding'],
    status: 'Active',
  },
  {
    id: 'SFT-03',
    shiftCode: 'SHIFT-C',
    shiftName: 'Graveyard Night Shift (Shift C)',
    startTime: '00:00',
    endTime: '07:00',
    durationHours: 7.0,
    handoverBufferMinutes: 15,
    paidBreakMinutes: 30,
    shiftAllowanceInr: 250,
    isNightShift: true,
    appliesToPlants: ['Pune / Chakan Hub', 'Sanand Precision'],
    status: 'Active',
  },
  {
    id: 'SFT-04',
    shiftCode: 'SHIFT-GEN',
    shiftName: 'General Day Shift (Admin & Toolroom)',
    startTime: '09:00',
    endTime: '18:00',
    durationHours: 9.0,
    handoverBufferMinutes: 0,
    paidBreakMinutes: 60,
    shiftAllowanceInr: 0,
    isNightShift: false,
    appliesToPlants: ['Pune / Chakan Hub', 'Sanand Precision', 'Chennai Molding'],
    status: 'Active',
  },
];

export const mockHolidays: HolidayOvertimeRule[] = [
  {
    id: 'HOL-01',
    title: 'Ganesh Chaturthi (Plant Holiday)',
    dateOrRule: '2026-09-14',
    type: 'Gazetted Holiday',
    otMultiplier: 2.0,
    compOffEligible: true,
    affectedPlants: ['Pune / Chakan Hub'],
  },
  {
    id: 'HOL-02',
    title: 'Mahatma Gandhi Jayanti',
    dateOrRule: '2026-10-02',
    type: 'Gazetted Holiday',
    otMultiplier: 2.0,
    compOffEligible: true,
    affectedPlants: ['Pune / Chakan Hub', 'Sanand Precision', 'Chennai Molding'],
  },
  {
    id: 'HOL-03',
    title: 'Annual Chiller & Main Substation Shutdown',
    dateOrRule: '2026-11-05 to 2026-11-07',
    type: 'Annual Plant Overhaul Shutdown',
    otMultiplier: 1.5,
    compOffEligible: true,
    affectedPlants: ['Pune / Chakan Hub'],
  },
  {
    id: 'HOL-04',
    title: 'Diwali Laxmi Pujan',
    dateOrRule: '2026-11-08',
    type: 'Gazetted Holiday',
    otMultiplier: 2.0,
    compOffEligible: true,
    affectedPlants: ['Pune / Chakan Hub', 'Sanand Precision', 'Chennai Molding'],
  },
];

// -------------------------------------------------------------
// Comprehensive Reason Codes with Plastic Manufacturing Examples (Screen 11)
// -------------------------------------------------------------
export const mockReasonCodes: ReasonCodeItem[] = [
  // --- Production: Rejection Reasons ---
  {
    id: 'RC-PRD-REJ-01',
    code: 'REJ-SHORT-SHOT',
    title: 'Short Shot / Incomplete Cavity Filling',
    subCategory: 'rejection reasons',
    department: 'Production',
    description: 'Inadequate injection pressure, low melt temp, or frozen gate preventing complete tool filling.',
    severity: 'High',
    affectsOEE: true,
    defaultAction: 'Purge barrel, increase holding pressure by 5%, check heater bands.',
    isActive: true,
  },
  {
    id: 'RC-PRD-REJ-02',
    code: 'REJ-FLASH-BURR',
    title: 'Part Flash / Parting Line Burrs',
    subCategory: 'rejection reasons',
    department: 'Production',
    description: 'Excessive clamping clearance, platen deflection, or over-packing beyond mold shut-off limits.',
    severity: 'Medium',
    affectsOEE: true,
    defaultAction: 'Verify clamping tonnage, check mold parting surfaces for foreign debris.',
    isActive: true,
  },
  {
    id: 'RC-PRD-REJ-03',
    code: 'REJ-SINK-MARKS',
    title: 'Sink Marks & Thick Section Voids',
    subCategory: 'rejection reasons',
    department: 'Production',
    description: 'Insufficient packing time/pressure causing differential shrinkage in rib and boss intersections.',
    severity: 'Medium',
    affectsOEE: true,
    defaultAction: 'Extend hold time by 1.5s, lower mold cooling water temp to 18°C.',
    isActive: true,
  },
  {
    id: 'RC-PRD-REJ-04',
    code: 'REJ-SILVER-SPLAY',
    title: 'Silver Streaks / Moisture Splay',
    subCategory: 'rejection reasons',
    department: 'Production',
    description: 'Hygroscopic polymer (e.g. Nylon PA66, Polycarbonate) insufficiently dried in desiccant hopper.',
    severity: 'Critical',
    affectsOEE: true,
    defaultAction: 'Halt machine immediately. Verify dew point meter (< -40°C), dry resin for min 3 hours.',
    isActive: true,
  },
  {
    id: 'RC-PRD-REJ-05',
    code: 'REJ-WARPAGE',
    title: 'Dimensional Warpage & Twisting',
    subCategory: 'rejection reasons',
    department: 'Production',
    description: 'Non-uniform cooling between core and cavity sides or high residual orientation stress.',
    severity: 'High',
    affectsOEE: true,
    defaultAction: 'Inspect cooling channel flow rates via flowmeter; adjust differential cooling.',
    isActive: true,
  },

  // --- Production: Downtime Reasons ---
  {
    id: 'RC-PRD-DWN-01',
    code: 'DWN-MOLD-CHANGE',
    title: 'Mold Changeover & Tool Clamping (SMED)',
    subCategory: 'downtime reasons',
    department: 'Production',
    description: 'Scheduled change of mold die, hydraulic core pull connection, and water manifold hookup.',
    severity: 'Medium',
    affectsOEE: true,
    defaultAction: 'Pre-heat mold on staging cart; log setup elapsed time against 45-min target.',
    isActive: true,
  },
  {
    id: 'RC-PRD-DWN-02',
    code: 'DWN-BARREL-PURGE',
    title: 'Barrel Purging & Color Cleanout',
    subCategory: 'downtime reasons',
    department: 'Production',
    description: 'Clearing dark masterbatch (e.g. Carbon Black) before injecting Natural or White resins.',
    severity: 'Medium',
    affectsOEE: true,
    defaultAction: 'Run 5 kg chemical purge compound through screw at 230°C.',
    isActive: true,
  },
  {
    id: 'RC-PRD-DWN-03',
    code: 'DWN-HOPPER-EMPTY',
    title: 'Resin Hopper Empty / Material Starvation',
    subCategory: 'downtime reasons',
    department: 'Production',
    description: 'Auto-loader vacuum hose blockage or silo day-bin sensor ran empty.',
    severity: 'High',
    affectsOEE: true,
    defaultAction: 'Clear vacuum wand suction screen, replenish day-bin with virgin lot.',
    isActive: true,
  },
  {
    id: 'RC-PRD-DWN-04',
    code: 'DWN-ROBOT-ALARM',
    title: 'Take-out Robot Arm Vacuum Sensor Fault',
    subCategory: 'downtime reasons',
    department: 'Production',
    description: 'Pneumatic suction cup failed to detect sprue grip before platen mold close cycle.',
    severity: 'High',
    affectsOEE: true,
    defaultAction: 'Clean vacuum cup lip, inspect venturi ejector generator line.',
    isActive: true,
  },

  // --- Production: Scrap Reasons ---
  {
    id: 'RC-PRD-SCR-01',
    code: 'SCR-STARTUP-SHOTS',
    title: 'Start-up Purge & Stabilization Shots',
    subCategory: 'scrap reasons',
    department: 'Production',
    description: 'First 5-10 cyclic shots before thermal equilibrium is attained across all nozzle zones.',
    severity: 'Low',
    affectsOEE: false,
    defaultAction: 'Collect in clean Blue Bin; route to granulator for 100% closed-loop regrind.',
    isActive: true,
  },
  {
    id: 'RC-PRD-SCR-02',
    code: 'SCR-BLACK-SPECKS',
    title: 'Degraded Polymer & Carbon Black Specks',
    subCategory: 'scrap reasons',
    department: 'Production',
    description: 'Stagnant resin in screw dead-spots breaking down due to prolonged high residence time.',
    severity: 'Critical',
    affectsOEE: true,
    defaultAction: 'Pull screw barrel for mechanical brushing if specks persist >15 mins.',
    isActive: true,
  },
  {
    id: 'RC-PRD-SCR-03',
    code: 'SCR-INCOMPATIBLE-MIX',
    title: 'Cross-Contamination (PP mixed with PE/ABS)',
    subCategory: 'scrap reasons',
    department: 'Production',
    description: 'Accidental mixing of incompatible polymers causing severe delamination and brittleness.',
    severity: 'Critical',
    affectsOEE: false,
    defaultAction: 'Quarantine entire lot; cannot be reground; dispose to licensed polymer recycler.',
    isActive: true,
  },

  // --- Production: Runner / Lumbes Categories ---
  {
    id: 'RC-PRD-RUN-01',
    code: 'RUN-COLD-SPRU',
    title: 'Cold Runner Sprues & Feeding Gates',
    subCategory: 'runner/lumbes categories',
    department: 'Production',
    description: 'Standard 2-plate cold runner system branches degated by operator or robotic trimmer.',
    severity: 'Low',
    affectsOEE: false,
    defaultAction: 'Immediate beside-the-press granulation for proportional 15% blend.',
    isActive: true,
  },
  {
    id: 'RC-PRD-RUN-02',
    code: 'RUN-PURGE-LUMP',
    title: 'Heavy Machine Purge Lumps & Drool Cakes',
    subCategory: 'runner/lumbes categories',
    department: 'Production',
    description: 'Solidified polymer cakes generated during color transitions and cold-start barrel cleans.',
    severity: 'Low',
    affectsOEE: false,
    defaultAction: 'Heavy shredder crushing before secondary fine granulator processing.',
    isActive: true,
  },
  {
    id: 'RC-PRD-RUN-03',
    code: 'RUN-EDGE-TRIM',
    title: 'Thermoforming / Extrusion Edge Trimmings',
    subCategory: 'runner/lumbes categories',
    department: 'Production',
    description: 'Continuous web edges trimmed from sheet extrusion cooling rolls.',
    severity: 'Low',
    affectsOEE: false,
    defaultAction: 'Inline guillotine chopper feeds directly back to main extruder hopper.',
    isActive: true,
  },

  // --- Warehouse Reason Codes ---
  {
    id: 'RC-WH-ADJ-01',
    code: 'WH-ADJ-EVAP',
    title: 'Moisture Loss / Atmospheric Evaporation',
    subCategory: 'stock adjustment reasons',
    department: 'Warehouse',
    description: 'Normal weight fluctuation in stored hygroscopic pellets post desiccant drying.',
    severity: 'Low',
    affectsOEE: false,
    defaultAction: 'Apply standard 0.15% moisture variance allowance to inventory ledger.',
    isActive: true,
  },
  {
    id: 'RC-WH-ADJ-02',
    code: 'WH-ADJ-SPILL',
    title: 'Forklift Puncture / Bag Spillage',
    subCategory: 'stock adjustment reasons',
    department: 'Warehouse',
    description: '25kg multi-wall paper sack punctured by pallet fork during stacking.',
    severity: 'Medium',
    affectsOEE: false,
    defaultAction: 'Collect unsoiled pellets into utility bag; write off damaged floor sweepings.',
    isActive: true,
  },
  {
    id: 'RC-WH-TRF-01',
    code: 'WH-TRF-SILO-BIN',
    title: 'Silo Pneumatic Transfer to Line Day-Bin',
    subCategory: 'transfer reasons',
    department: 'Warehouse',
    description: 'Blowing resin from 50MT outdoor silo into plant internal drying hoppers.',
    severity: 'Low',
    affectsOEE: false,
    defaultAction: 'Generate automated transfer voucher against Work Order consumption.',
    isActive: true,
  },
  {
    id: 'RC-WH-TRF-02',
    code: 'WH-TRF-INTER-PLANT',
    title: 'Inter-Plant Transfer (Chakan to Sanand)',
    subCategory: 'transfer reasons',
    department: 'Warehouse',
    description: 'Transfer of pre-compounded masterbatch batch to secondary stamping facility.',
    severity: 'Low',
    affectsOEE: false,
    defaultAction: 'Attach GST E-Way Bill and Certificate of Analysis (COA).',
    isActive: true,
  },
  {
    id: 'RC-WH-PUT-01',
    code: 'WH-PUT-BIN-FULL',
    title: 'Bin Weight Capacity Exceeded (>1500 kg)',
    subCategory: 'putaway exceptions',
    department: 'Warehouse',
    description: 'High-bay rack weight sensor tripped; pallet redirected to floor staging.',
    severity: 'Medium',
    affectsOEE: false,
    defaultAction: 'Split pallet across two lower tier racks; update RFID tag.',
    isActive: true,
  },
  {
    id: 'RC-WH-PUT-02',
    code: 'WH-PUT-INCOMPATIBLE',
    title: 'Hazardous / Food-Grade Co-Storage Prohibition',
    subCategory: 'putaway exceptions',
    department: 'Warehouse',
    description: 'Cannot store engineering flame-retardant resins adjacent to FDA food-grade PP.',
    severity: 'High',
    affectsOEE: false,
    defaultAction: 'Enforce separate warehouse bay allocation rule WMS-ISO-22000.',
    isActive: true,
  },
  {
    id: 'RC-WH-CYC-01',
    code: 'WH-CYC-MISSING-BAG',
    title: 'Physical Pallet Count Variance (-2 Bags)',
    subCategory: 'cycle count variance reasons',
    department: 'Warehouse',
    description: 'Physical audit discovered 48 bags instead of recorded 50 bags on wooden skid.',
    severity: 'Medium',
    affectsOEE: false,
    defaultAction: 'Trace CCTV footage and scan issue logs from Shift B staging.',
    isActive: true,
  },
  {
    id: 'RC-WH-CYC-02',
    code: 'WH-CYC-TARE-DRIFT',
    title: 'Weighbridge Zero Tare Calibration Drift',
    subCategory: 'cycle count variance reasons',
    department: 'Warehouse',
    description: 'Gross weight discrepancy detected between tanker dispatch slip and receiving scale.',
    severity: 'High',
    affectsOEE: false,
    defaultAction: 'Perform standard 20-ton calibrated test block verification.',
    isActive: true,
  },

  // --- Quality Reason Codes ---
  {
    id: 'RC-QC-DEF-01',
    code: 'QC-DEF-MFI-OOS',
    title: 'Melt Flow Index (MFI) Out of Specification',
    subCategory: 'defect codes',
    department: 'Quality',
    description: 'MFI test at 230°C/2.16kg yielded 14.5 g/10min vs spec range 10-12 g/10min.',
    severity: 'Critical',
    affectsOEE: true,
    defaultAction: 'Issue Quality Hold on lot; alert Supplier SCM team for batch dispute.',
    isActive: true,
  },
  {
    id: 'RC-QC-DEF-02',
    code: 'QC-DEF-COLOR-DELTA',
    title: 'Color Spectrophotometer Delta-E > 0.8',
    subCategory: 'defect codes',
    department: 'Quality',
    description: 'Automotive dashboard bezel shade deviated outside OEM CIELAB color sphere.',
    severity: 'High',
    affectsOEE: true,
    defaultAction: 'Adjust masterbatch feeder dosing percentage from 2.0% to 2.2%.',
    isActive: true,
  },
  {
    id: 'RC-QC-HLD-01',
    code: 'QC-HLD-PPAP-WAIT',
    title: 'Awaiting OEM Customer PPAP Level 3 Sign-Off',
    subCategory: 'hold reasons',
    department: 'Quality',
    description: 'First production run complete; waiting on Tata Motors CMM dimensional approval.',
    severity: 'Medium',
    affectsOEE: false,
    defaultAction: 'Tag pallets with Yellow Quarantine tape; do not release for commercial invoice.',
    isActive: true,
  },
  {
    id: 'RC-QC-HLD-02',
    code: 'QC-HLD-ROHS-REACH',
    title: 'Third-Party Laboratory RoHS/REACH Test Pending',
    subCategory: 'hold reasons',
    department: 'Quality',
    description: 'Heavy metal XRF screening report pending from NABL certified laboratory.',
    severity: 'High',
    affectsOEE: false,
    defaultAction: 'Quarantine stock until certificate of compliance is uploaded.',
    isActive: true,
  },
  {
    id: 'RC-QC-DIS-01',
    code: 'QC-DIS-REGRIND-15',
    title: 'Grind & Blend into Regrind (Max 15% Blend)',
    subCategory: 'disposition reasons',
    department: 'Quality',
    description: 'Defective cosmetic parts authorized for in-house granulation and controlled blend.',
    severity: 'Low',
    affectsOEE: false,
    defaultAction: 'Label granulator gaylord with Lot ID and MFI retest certification.',
    isActive: true,
  },
  {
    id: 'RC-QC-DIS-02',
    code: 'QC-DIS-RETURN-VENDOR',
    title: 'Reject & Return to Polymer Supplier (Debit Note)',
    subCategory: 'disposition reasons',
    department: 'Quality',
    description: 'Raw resin lot failed unnotched Izod impact testing; return 20MT to manufacturer.',
    severity: 'Critical',
    affectsOEE: false,
    defaultAction: 'Issue commercial Debit Note and dispatch return truck with rejection report.',
    isActive: true,
  },

  // --- Maintenance Reason Codes ---
  {
    id: 'RC-MNT-BRK-01',
    code: 'MNT-BRK-HYD-PRESSURE',
    title: 'Hydraulic Proportional Valve Pressure Loss',
    subCategory: 'breakdown reasons',
    department: 'Maintenance',
    description: 'System pressure dropped below 140 bar; mold closing speed severely degraded.',
    severity: 'Critical',
    affectsOEE: true,
    defaultAction: 'Replace proportional valve filter cartridge and bleed air from manifold.',
    isActive: true,
  },
  {
    id: 'RC-MNT-BRK-02',
    code: 'MNT-BRK-THERMO-OPEN',
    title: 'Barrel Zone-3 Thermocouple Open Loop',
    subCategory: 'breakdown reasons',
    department: 'Maintenance',
    description: 'Temperature reading jumped to 999°C; safety controller triggered cold-screw freeze.',
    severity: 'High',
    affectsOEE: true,
    defaultAction: 'Replace Type-J thermocouple lead wire and recalibrate PID loop.',
    isActive: true,
  },
  {
    id: 'RC-MNT-PM-01',
    code: 'MNT-PM-500H-OIL',
    title: '500-Hour Hydraulic Oil Filtration & Particle Count',
    subCategory: 'preventive maintenance types',
    department: 'Maintenance',
    description: 'Offline kidney-loop filtration to maintain NAS 1638 Class 7 cleanliness.',
    severity: 'Medium',
    affectsOEE: false,
    defaultAction: 'Execute oil sampling; record viscosity cSt at 40°C.',
    isActive: true,
  },
  {
    id: 'RC-MNT-PM-02',
    code: 'MNT-PM-1000H-SCREW',
    title: '1000-Hour Screw Flight & Barrel Wear Micrometer Audit',
    subCategory: 'preventive maintenance types',
    department: 'Maintenance',
    description: 'Measure radial clearance between bimetallic barrel and screw flights.',
    severity: 'High',
    affectsOEE: false,
    defaultAction: 'Pull screw during planned weekend outage; log 8-point diametrical micrometer chart.',
    isActive: true,
  },

  // --- HR Settings ---
  {
    id: 'RC-HR-SFT-01',
    code: 'HR-SFT-3ROT',
    title: '3-Shift 24x7 Rotating Shift System',
    subCategory: 'shift patterns',
    department: 'Human Resources',
    description: 'Continuous manufacturing rotation pattern with weekly off rotations for operators.',
    severity: 'Low',
    affectsOEE: false,
    defaultAction: 'Biometric clock synced with shift changeover times.',
    isActive: true,
  },
  {
    id: 'RC-HR-OT-01',
    code: 'HR-OT-SUN-DBL',
    title: 'Sunday & Festival Double-Time Overtime (2.0x)',
    subCategory: 'overtime rules',
    department: 'Human Resources',
    description: 'Mandatory statutory compensation for urgent weekend automotive breakdown support.',
    severity: 'Medium',
    affectsOEE: false,
    defaultAction: 'Plant Manager sign-off required prior to shift commencement.',
    isActive: true,
  },
  {
    id: 'RC-HR-TRN-01',
    code: 'HR-TRN-MOLD-SAFE',
    title: 'Injection Molding Safety & Tool Clamping Certification',
    subCategory: 'training categories',
    department: 'Human Resources',
    description: 'Mandatory 16-hour safety course covering interlock bypass hazards and crane lifting.',
    severity: 'High',
    affectsOEE: false,
    defaultAction: 'Annual recertification mandatory for all Grade-A machine operators.',
    isActive: true,
  },

  // --- Sales / CRM Settings ---
  {
    id: 'RC-CRM-SRC-01',
    code: 'CRM-SRC-PLASTINDIA',
    title: 'PlastIndia Trade Fair & Polymer Expo',
    subCategory: 'lead sources',
    department: 'Sales & CRM',
    description: 'Inbound inquiries generated from annual trade show stall exhibitions.',
    severity: 'Low',
    affectsOEE: false,
    defaultAction: 'Assign to regional key account manager within 24 hours.',
    isActive: true,
  },
  {
    id: 'RC-CRM-STG-01',
    code: 'CRM-STG-MOLDFLOW',
    title: 'DFM Feasibility & Moldflow Simulation Stage',
    subCategory: 'opportunity stages',
    department: 'Sales & CRM',
    description: 'Engineering analysis of wall thickness, weld lines, and gate location prior to commercial quote.',
    severity: 'Medium',
    affectsOEE: false,
    defaultAction: 'Submit Moldflow filling animation to customer engineering team.',
    isActive: true,
  },
  {
    id: 'RC-CRM-LST-01',
    code: 'CRM-LST-RESIN-HI',
    title: 'Polymer Index Cost Escalation (Lost to Low-Tier Molder)',
    subCategory: 'lost reasons',
    department: 'Sales & CRM',
    description: 'Customer opted for non-certified molder utilizing unverified regrind blends.',
    severity: 'Medium',
    affectsOEE: false,
    defaultAction: 'Log lost analysis in CRM dashboard; schedule 6-month quality follow-up.',
    isActive: true,
  },

  // --- Procurement Settings ---
  {
    id: 'RC-PRC-CAT-01',
    code: 'PRC-CAT-PRIME-RESIN',
    title: 'Tier-1 Prime Polymer Producers (Reliance, SABIC, IOCL)',
    subCategory: 'supplier categories',
    department: 'Procurement',
    description: 'Approved virgin resin manufacturers meeting ISO 9001 and automotive flame retardancy.',
    severity: 'Low',
    affectsOEE: false,
    defaultAction: 'Quarterly price benchmarking against ICIS Far East Asia CFR index.',
    isActive: true,
  },
  {
    id: 'RC-PRC-LMT-01',
    code: 'PRC-LMT-PLANT-SCM',
    title: 'Plant SCM Approval Threshold (₹1,00,000 to ₹10,00,000)',
    subCategory: 'purchase approval limits',
    department: 'Procurement',
    description: 'Authority matrix tier for masterbatch and recurring production auxiliary spares.',
    severity: 'Medium',
    affectsOEE: false,
    defaultAction: 'Enforce 2-quote comparison attachment in ERP purchase requisition.',
    isActive: true,
  },

  // --- Finance Settings ---
  {
    id: 'RC-FIN-TAX-01',
    code: 'FIN-TAX-GST-18',
    title: 'GST 18% - Polymer Resins & Engineering Plastics (HSN 3901/3902)',
    subCategory: 'tax codes',
    department: 'Finance',
    description: 'Standard Goods and Services Tax applicable to domestic prime polyolefin deliveries.',
    severity: 'Low',
    affectsOEE: false,
    defaultAction: 'Auto-verify e-Way bill against NIC tax portal.',
    isActive: true,
  },
  {
    id: 'RC-FIN-CUR-01',
    code: 'FIN-CUR-USD-FOREX',
    title: 'USD ($) - Import Polymer Forex Hedge Currency',
    subCategory: 'currency',
    department: 'Finance',
    description: 'Foreign exchange settlement currency for Saudi SABIC and Korean LG Chem shipments.',
    severity: 'Medium',
    affectsOEE: false,
    defaultAction: 'Daily RBI reference rate sync via automated financial connector.',
    isActive: true,
  },
  {
    id: 'RC-FIN-CC-01',
    code: 'FIN-CC-101-MOLDING',
    title: 'Cost Center CC-101: Injection Molding Heavy Shopfloor',
    subCategory: 'cost centers',
    department: 'Finance',
    description: 'Direct absorption center for power consumption, machine depreciation, and direct operator labor.',
    severity: 'Low',
    affectsOEE: false,
    defaultAction: 'Monthly variance reconciliation against actual energy meter readings.',
    isActive: true,
  },
];

// -------------------------------------------------------------
// Mock Data for Master Data Management (Screen 13)
// -------------------------------------------------------------
export const mockMasterDataRecords: MasterDataRecord[] = [
  {
    id: 'MD-01',
    entityType: 'Polymer Resin Item',
    code: 'RES-PP-COPO-01',
    name: 'Polypropylene Impact Co-Polymer (MFI 12, High Izod)',
    primaryUom: 'Kilograms (KG)',
    category: 'Virgin Raw Polymer',
    plantScope: 'All Plants (Global)',
    lastUpdated: '2026-09-02',
    updatedBy: 'Dr. Sunita Kulkarni',
    complianceCert: 'RoHS, REACH, UL-94 HB',
    status: 'Approved',
  },
  {
    id: 'MD-02',
    entityType: 'Color Masterbatch',
    code: 'MB-BLK-AUTO-02',
    name: 'UV Stabilized Carbon Black Masterbatch (40% Loading)',
    primaryUom: 'Kilograms (KG)',
    category: 'Additives & Pigments',
    plantScope: 'Pune / Chakan Hub',
    lastUpdated: '2026-08-28',
    updatedBy: 'Vikramaditya Sen',
    complianceCert: 'Automotive Weatherability SAE J2527',
    status: 'Approved',
  },
  {
    id: 'MD-03',
    entityType: 'Finished Molded Component',
    code: 'FG-BMP-NEXON-F',
    name: 'Front Bumper Fascia (Tata Nexon EV Prime - Painted)',
    primaryUom: 'Numbers (PCS)',
    category: 'Automotive Exterior',
    plantScope: 'Pune / Chakan Hub',
    lastUpdated: '2026-09-01',
    updatedBy: 'Priya Rao',
    complianceCert: 'PPAP Level-3 Approved',
    status: 'Approved',
  },
  {
    id: 'MD-04',
    entityType: 'Tooling & Mold Asset',
    code: 'MOLD-BMP-TATA-F',
    name: '1+1 Cavity Hot Runner Front Bumper Tool (P20 Steel)',
    primaryUom: 'Units (EA)',
    category: 'Injection Mold Dies',
    plantScope: 'Pune / Chakan Hub',
    lastUpdated: '2026-07-15',
    updatedBy: 'Kailash Deshmukh',
    complianceCert: 'Mold Life Guarantee 500k Shots',
    status: 'Approved',
  },
  {
    id: 'MD-05',
    entityType: 'Customer Account',
    code: 'CUST-TATA-MOTORS',
    name: 'Tata Motors Passenger Vehicles Ltd (Sanand & Pune Plants)',
    primaryUom: 'N/A',
    category: 'OEM Tier-1 Customer',
    plantScope: 'All Plants',
    lastUpdated: '2026-08-10',
    updatedBy: 'Priya Rao',
    complianceCert: 'IATF 16949 Vendor Code 48920',
    status: 'Approved',
  },
];

// -------------------------------------------------------------
// Mock Data for Document Settings (Screen 16)
// -------------------------------------------------------------
export const mockDocumentPolicies: DocumentSettingPolicy[] = [
  {
    id: 'DOC-POL-01',
    categoryName: 'Material Safety Data Sheets (MSDS / SDS)',
    codePrefix: 'MSDS-',
    description: 'Mandatory toxicological and thermal hazard declarations for all received polymers and purging solvents.',
    mandatoryWatermark: 'OFFICIAL REBOOT ERP SAFETY MASTER',
    retentionYears: 10,
    approvalRequired: true,
    allowedExtensions: ['.pdf'],
    maxFileSizeMb: 25,
    cloudStorageBucket: 's3://reboot-erp-msds-vault-ap-south-1',
    autoExpireAlertDays: 60,
  },
  {
    id: 'DOC-POL-02',
    categoryName: 'OEM PPAP Level 3 Submission Dossiers',
    codePrefix: 'PPAP-',
    description: 'Control plans, FMEA failure mode matrices, and ballooned dimensional drawings for automotive clients.',
    mandatoryWatermark: 'CONFIDENTIAL PROPRIETARY IATF 16949',
    retentionYears: 15,
    approvalRequired: true,
    allowedExtensions: ['.pdf', '.xlsx', '.step', '.iges'],
    maxFileSizeMb: 100,
    cloudStorageBucket: 's3://reboot-erp-ppap-vault-ap-south-1',
    autoExpireAlertDays: 90,
  },
  {
    id: 'DOC-POL-03',
    categoryName: 'Raw Material Mill Test Certificates (COA)',
    codePrefix: 'COA-',
    description: 'Batch-specific MFI, ash content, and density test certificates provided by polymer petrochemical suppliers.',
    mandatoryWatermark: 'VERIFIED LABORATORY COPY',
    retentionYears: 8,
    approvalRequired: false,
    allowedExtensions: ['.pdf', '.jpg', '.png'],
    maxFileSizeMb: 15,
    cloudStorageBucket: 's3://reboot-erp-coa-records',
    autoExpireAlertDays: 30,
  },
  {
    id: 'DOC-POL-04',
    categoryName: 'Tool & Die Maintenance Logs & CMM Scans',
    codePrefix: 'TOOL-CMM-',
    description: 'Cavity wear optical coordinate measurement machine (CMM) reports and preventive polishing sheets.',
    mandatoryWatermark: 'TOOLROOM WORKSHOP ASSET',
    retentionYears: 12,
    approvalRequired: true,
    allowedExtensions: ['.pdf', '.dxf', '.csv'],
    maxFileSizeMb: 50,
    cloudStorageBucket: 's3://reboot-erp-toolroom-drawings',
    autoExpireAlertDays: 45,
  },
];

// -------------------------------------------------------------
// Mock Data for Login & Security Audit (Screen 18)
// -------------------------------------------------------------
export const mockLoginAuditRecords: SecurityLoginAuditRecord[] = [
  {
    id: 'LOG-AUD-991',
    timestamp: '2026-09-05 08:42:10 AM',
    userEmail: 'priya.rao@reboot-erp.com',
    fullName: 'Priya Rao',
    role: 'Super Administrator',
    ipAddress: '192.168.10.45',
    geoLocation: 'Pune, Maharashtra (Plant LAN)',
    deviceBrowser: 'Chrome 128 / macOS 15.1',
    authMethod: 'Password + TOTP',
    status: 'Successful Login',
    riskScore: 'Low',
  },
  {
    id: 'LOG-AUD-990',
    timestamp: '2026-09-05 07:15:32 AM',
    userEmail: 'kailash.deshmukh@reboot-erp.com',
    fullName: 'Kailash Deshmukh',
    role: 'Tooling Manager',
    ipAddress: '192.168.20.12',
    geoLocation: 'Chakan Shopfloor (Station Kiosk-03)',
    deviceBrowser: 'Edge 127 / Windows 11 Enterprise',
    authMethod: 'Password + TOTP',
    status: 'Successful Login',
    riskScore: 'Low',
  },
  {
    id: 'LOG-AUD-989',
    timestamp: '2026-09-05 03:22:18 AM',
    userEmail: 'unknown.intruder@external-bot.net',
    fullName: 'Unregistered Identity',
    role: 'Guest / Anonymous',
    ipAddress: '185.220.101.4',
    geoLocation: 'Frankfurt, Germany (Tor Exit Node)',
    deviceBrowser: 'Python-Requests / Linux',
    authMethod: 'Failed Password',
    status: 'Account Locked (Brute Force)',
    riskScore: 'High',
  },
  {
    id: 'LOG-AUD-988',
    timestamp: '2026-09-04 11:45:01 PM',
    userEmail: 'ramesh.powar@reboot-erp.com',
    fullName: 'Ramesh Powar',
    role: 'Night Shift Supervisor',
    ipAddress: '192.168.10.88',
    geoLocation: 'Pune, Maharashtra (Plant LAN)',
    deviceBrowser: 'Chrome Mobile / Android Rugged Tablet',
    authMethod: 'Password + SMS',
    status: 'Successful Login',
    riskScore: 'Low',
  },
  {
    id: 'LOG-AUD-987',
    timestamp: '2026-09-04 06:12:44 PM',
    userEmail: 'vikram.sen@reboot-erp.com',
    fullName: 'Vikramaditya Sen',
    role: 'Quality Lead',
    ipAddress: '14.139.122.9',
    geoLocation: 'Mumbai, Maharashtra (Home Broadband)',
    deviceBrowser: 'Firefox 130 / Windows 11',
    authMethod: 'Password + TOTP',
    status: 'MFA Challenge Failed',
    riskScore: 'Medium',
  },
];

// -------------------------------------------------------------
// Mock Data for Data Import / Export Center (Screen 21)
// -------------------------------------------------------------
export const mockDataExchangeJobs: DataExchangeJob[] = [
  {
    id: 'JOB-EXP-801',
    jobName: 'Monthly GSTIN B2B Outward Invoice Ledger (GSTR-1)',
    type: 'EXPORT',
    entity: 'Sales Invoices & E-Way Bills',
    fileFormat: 'JSON',
    totalRecords: 1420,
    successCount: 1420,
    errorCount: 0,
    startedAt: '2026-09-04 23:00',
    durationSec: 8.4,
    triggeredBy: 'Automated Financial Scheduler',
    status: 'Completed',
    downloadUrl: '#download-gstr1-json',
  },
  {
    id: 'JOB-IMP-802',
    jobName: 'Bulk Masterbatch Formulation & Color Specs',
    type: 'IMPORT',
    entity: 'Recipe & Formulation Master',
    fileFormat: 'XLSX',
    totalRecords: 150,
    successCount: 146,
    errorCount: 4,
    startedAt: '2026-09-04 15:20',
    durationSec: 14.2,
    triggeredBy: 'Dr. Sunita Kulkarni',
    status: 'Completed',
    downloadUrl: '#view-error-report',
  },
  {
    id: 'JOB-EXP-803',
    jobName: 'Weekly Machine OEE Telemetry & Downtime Logs',
    type: 'EXPORT',
    entity: 'PLC Telemetry & Reason Codes',
    fileFormat: 'CSV',
    totalRecords: 8520,
    successCount: 8520,
    errorCount: 0,
    startedAt: '2026-09-03 06:00',
    durationSec: 22.1,
    triggeredBy: 'Priya Rao',
    status: 'Completed',
    downloadUrl: '#download-oee-csv',
  },
  {
    id: 'JOB-IMP-804',
    jobName: 'Tata Motors EDI 850 Material Release Forecast',
    type: 'IMPORT',
    entity: 'Sales Orders & Delivery Releases',
    fileFormat: 'EDI 850',
    totalRecords: 340,
    successCount: 340,
    errorCount: 0,
    startedAt: '2026-09-02 02:00',
    durationSec: 5.1,
    triggeredBy: 'SAP EDI Connector',
    status: 'Completed',
  },
];

// -------------------------------------------------------------
// Mock Data for Backup, Retention, & Data Privacy (Screen 22)
// -------------------------------------------------------------
export const mockRetentionPolicies: DataRetentionPolicy[] = [
  {
    id: 'RET-01',
    dataDomain: 'GST Statutory Tax Invoices & Credit Notes',
    retentionPeriod: '8 Years (Mandatory)',
    legalBasis: 'Central GST Act Sec 36',
    autoPurgeEnabled: false,
    anonymizePii: false,
    backupTarget: 'AWS S3 Glacier Vault (WORM Immutable)',
    lastRunDate: '2026-09-01',
  },
  {
    id: 'RET-02',
    dataDomain: 'Machine High-Frequency Sensor Telemetry (1-sec)',
    retentionPeriod: '90 Days High-Res, then aggregated to hourly',
    legalBasis: 'Internal Operational Optimization',
    autoPurgeEnabled: true,
    anonymizePii: false,
    backupTarget: 'ClickHouse Cold Storage',
    lastRunDate: '2026-09-04',
  },
  {
    id: 'RET-03',
    dataDomain: 'Employee Biometric Punch Logs & Health Records',
    retentionPeriod: '5 Years post separation',
    legalBasis: 'Digital Personal Data Protection (DPDP) Act 2023',
    autoPurgeEnabled: true,
    anonymizePii: true,
    backupTarget: 'Encrypted KMS S3 Vault',
    lastRunDate: '2026-08-30',
  },
  {
    id: 'RET-04',
    dataDomain: 'ERP Administrative Audit Trail Logs',
    retentionPeriod: '7 Years',
    legalBasis: 'SOC 2 Type II & IATF 16949 Audit Trail Mandate',
    autoPurgeEnabled: false,
    anonymizePii: false,
    backupTarget: 'Geo-Redundant Object Storage',
    lastRunDate: '2026-09-04',
  },
];

// -------------------------------------------------------------
// Mock Data for License & Subscription (Screen 24)
// -------------------------------------------------------------
export const mockLicenseDetails: LicenseSubscriptionDetails = {
  planName: 'Reboot ERP Enterprise - Plastics & Injection Molding Edition',
  tier: 'Enterprise Plastics Suite',
  organization: 'Reboot Polymers & Precision Plastics Pvt. Ltd.',
  customerCin: 'U25209PN2021PTC199842',
  licenseKey: 'RBT-PLST-ENT-2026-9821-X992-A71B',
  activePlants: 3,
  maxPlantsAllowed: 5,
  activeUserSeats: 85,
  totalSeatsLicensed: 100,
  concurrentLogins: 42,
  licensedModules: [
    { name: 'Core BOM & Engineering (IATF 16949)', status: 'Active', expiry: '2027-12-31' },
    { name: 'Multi-Plant Injection Shopfloor & OEE Telemetry', status: 'Active', expiry: '2027-12-31' },
    { name: 'Closed-Loop Regrind & Scrap Reclamation', status: 'Active', expiry: '2027-12-31' },
    { name: 'Quality Lab & Spectrophotometer Color Integration', status: 'Active', expiry: '2027-12-31' },
    { name: 'Weighbridge & Industrial Barcode Hardware Connector', status: 'Active', expiry: '2027-12-31' },
    { name: 'AI Defect Vision & Camera Inspection Connector', status: 'Add-on', expiry: '2027-12-31' },
    { name: 'NIC GST e-Invoicing & Automated E-Way Bill Dispatch', status: 'Active', expiry: '2027-12-31' },
  ],
  contractStart: '2024-01-01',
  contractRenewal: '2027-12-31',
  daysRemaining: 482,
  supportSlaTier: '24x7 Mission Critical (15-min Sev-1 Response)',
  dedicatedAccountManager: 'Arjun Mehra (arjun.m@reboot-erp.com)',
};

// -------------------------------------------------------------
// Mock Data for RBAC Simulator & Separation of Duties (SoD)
// -------------------------------------------------------------
import {
  SodConflictRule,
  SodViolation,
  RoleSimulationScenario,
  MultiContextScopePolicy,
  RowLevelSecurityRule,
  BreakGlassRequest,
} from '../types/admin';

export const mockSodRules: SodConflictRule[] = [
  {
    id: 'SOD-RULE-001',
    code: 'SOD_PURCHASE_CYCLE',
    name: 'Requisitioner cannot Approve Purchase Orders',
    description: 'Enforces dual-custody segregation between PR issuance and PO commercial authorization.',
    severity: 'CRITICAL',
    conflictingRoles: ['ROLE_PURCHASE_EXEC', 'ROLE-PROC-DIRECTOR'],
    conflictingActions: [
      { module: 'Procurement & Sourcing', action: 'create' },
      { module: 'Procurement & Sourcing', action: 'approve' },
    ],
    regulatoryStandard: 'SOX 404',
  },
  {
    id: 'SOD-RULE-002',
    code: 'SOD_QUALITY_RELEASE',
    name: 'Production Dispatcher cannot Certify COA Release',
    description: 'Prevents shop floor operators from overriding quality inspection lot decisions or COAs.',
    severity: 'CRITICAL',
    conflictingRoles: ['ROLE-PLANT-MANAGER', 'ROLE-QUALITY-DIRECTOR'],
    conflictingActions: [
      { module: 'Manufacturing & MES', action: 'edit' },
      { module: 'Quality & Laboratory', action: 'approve' },
    ],
    regulatoryStandard: 'IATF 16949',
  },
  {
    id: 'SOD-RULE-003',
    code: 'SOD_FIN_DISBURSEMENT',
    name: 'Invoice Creation vs Payment Authorization',
    description: 'Segregation of vendor invoice booking against treasury wire release and payment approval.',
    severity: 'HIGH',
    conflictingRoles: ['ROLE_AP_CLERK', 'ROLE-FIN-CONTROLLER'],
    conflictingActions: [
      { module: 'Finance & Accounting', action: 'create' },
      { module: 'Finance & Accounting', action: 'approve' },
    ],
    regulatoryStandard: 'SOX 404',
  },
  {
    id: 'SOD-RULE-004',
    code: 'SOD_BOM_CHANGE',
    name: 'Recipe Scaler vs Masterbatch Approval',
    description: 'Formulation changes must require engineering change sign-off before MES consumption.',
    severity: 'MEDIUM',
    conflictingRoles: ['ROLE_TOOLING_ENG', 'ROLE-PLANT-MANAGER'],
    conflictingActions: [
      { module: 'Engineering & BOM', action: 'edit' },
      { module: 'Engineering & BOM', action: 'approve' },
    ],
    regulatoryStandard: 'ISO 27001',
  },
];

export const mockSodViolations: SodViolation[] = [
  {
    id: 'VIO-2026-001',
    ruleCode: 'SOD_PURCHASE_CYCLE',
    ruleName: 'Requisitioner cannot Approve Purchase Orders',
    userName: 'Vikram Mehta',
    userEmail: 'vikram.m@reboot-erp.com',
    severity: 'CRITICAL',
    rolesAssigned: ['Procurement Lead', 'Interim Plant Manager'],
    detectedOn: '2026-09-06 14:22',
    status: 'Open',
    mitigatingControl: 'Requires 2nd Controller Approval above ₹1,00,000 until role split.',
  },
  {
    id: 'VIO-2026-002',
    ruleCode: 'SOD_QUALITY_RELEASE',
    ruleName: 'Production Dispatcher cannot Certify COA Release',
    userName: 'Deepak Sawant',
    userEmail: 'deepak.s@reboot-erp.com',
    severity: 'CRITICAL',
    rolesAssigned: ['Shift Supervisor A', 'Acting Quality Lab Tech'],
    detectedOn: '2026-09-05 09:15',
    status: 'Exception Approved',
    mitigatingControl: 'Night Shift temporary emergency coverage approved by Plant Head.',
  },
  {
    id: 'VIO-2026-003',
    ruleCode: 'SOD_BOM_CHANGE',
    ruleName: 'Recipe Scaler vs Masterbatch Approval',
    userName: 'Rohit Kulkarni',
    userEmail: 'rohit.k@reboot-erp.com',
    severity: 'MEDIUM',
    rolesAssigned: ['Tooling Engineer', 'BOM Master Author'],
    detectedOn: '2026-09-02 18:30',
    status: 'Mitigated',
    mitigatingControl: 'Removed dual authoring rights; assigned read-only BOM review role.',
  },
];

export const mockSimulationScenarios: RoleSimulationScenario[] = [
  {
    id: 'SIM-01',
    name: 'Junior Shift Operator releasing a Work Order',
    description: 'Verify if a shop floor operator can bypass supervisory line authorization to release mold WO.',
    roleIds: ['ROLE_OPERATOR'],
    plantId: 'PLANT-01',
    shift: 'Shift A (06:00 - 14:00)',
    module: 'Manufacturing & MES',
    resource: 'Work Order Release & Schedule Lock',
    action: 'approve',
    expectedVerdict: 'DENY',
  },
  {
    id: 'SIM-02',
    name: 'Plant Manager approving Raw Material PR > ₹5,00,000',
    description: 'Check threshold cap escalation when PO value exceeds plant localized ceiling.',
    roleIds: ['ROLE-PLANT-MANAGER'],
    plantId: 'PLANT-01',
    shift: 'General',
    module: 'Procurement & Sourcing',
    resource: 'Polymer Resin Bulk Purchase Order',
    action: 'approve',
    expectedVerdict: 'REQUIRES_DUAL_AUTH',
  },
  {
    id: 'SIM-03',
    name: 'QA Inspector signing off ISO/IATF Final Inspection COA',
    description: 'Validate quality sign-off privileges against active lot inspection reports.',
    roleIds: ['ROLE-QUALITY-DIRECTOR'],
    plantId: 'PLANT-02',
    shift: 'Shift B (14:00 - 22:00)',
    module: 'Quality & Laboratory',
    resource: 'Lot Release & Certificate of Analysis (COA)',
    action: 'approve',
    expectedVerdict: 'PERMIT',
  },
  {
    id: 'SIM-04',
    name: 'Finance Executive deleting posted General Ledger batch',
    description: 'Verify strict immutable ledger policy against voucher deletion attempts.',
    roleIds: ['ROLE-FIN-CONTROLLER'],
    plantId: 'PLANT-01',
    shift: 'General',
    module: 'Finance & Accounting',
    resource: 'Posted Journal Entry / Period Vouchers',
    action: 'delete',
    expectedVerdict: 'DENY',
  },
  {
    id: 'SIM-05',
    name: 'Super Admin modifying System Parameter from unwhitelisted IP',
    description: 'Simulate privilege step-up and geofence challenge when connecting remotely.',
    roleIds: ['ROLE-SUPER-ADMIN'],
    plantId: 'HQ-CORP',
    shift: 'General',
    module: 'Admin & System Config',
    resource: 'Global Configuration & Database Encryption Keys',
    action: 'edit',
    expectedVerdict: 'MFA_STEP_UP_REQUIRED',
  },
];

// -------------------------------------------------------------
// Mock Data for Multi-Context Scope Policies & Row-Level Security
// -------------------------------------------------------------
export const mockMultiContextPolicies: MultiContextScopePolicy[] = [
  {
    id: 'CTX-P01',
    contextName: 'Plant 1 - Chennai Injection Molding Facility',
    contextType: 'Plant Entity',
    code: 'PLANT_CHE_01',
    location: 'Sriperumbudur Industrial Corridor, Chennai, TN',
    ipSubnets: ['192.168.10.0/24', '10.10.1.0/24'],
    operatingHours: '24x7 (3-Shift Continuous Injection Ops)',
    enforceGeofence: true,
    mfaRequired: false,
    assignedUsersCount: 48,
    dataIsolationLevel: 'Strict Partitioned',
    activeSessions: 18,
  },
  {
    id: 'CTX-P02',
    contextName: 'Plant 2 - Pune Automotive Components Plant',
    contextType: 'Plant Entity',
    code: 'PLANT_PUN_02',
    location: 'Chakan MIDC Phase II, Pune, MH',
    ipSubnets: ['192.168.20.0/24', '10.10.2.0/24'],
    operatingHours: '24x7 (IATF 16949 Certified Production)',
    enforceGeofence: true,
    mfaRequired: true,
    assignedUsersCount: 36,
    dataIsolationLevel: 'Strict Partitioned',
    activeSessions: 14,
  },
  {
    id: 'CTX-P03',
    contextName: 'Plant 3 - Ahmedabad Compounding & Masterbatch Facility',
    contextType: 'Plant Entity',
    code: 'PLANT_AHM_03',
    location: 'Sanand GIDC Industrial Estate, Ahmedabad, GJ',
    ipSubnets: ['192.168.30.0/24', '10.10.3.0/24'],
    operatingHours: '2-Shift Extrusion & Color Blending',
    enforceGeofence: true,
    mfaRequired: false,
    assignedUsersCount: 22,
    dataIsolationLevel: 'Strict Partitioned',
    activeSessions: 7,
  },
  {
    id: 'CTX-HQ',
    contextName: 'Corporate Headquarters & Central Commercial Office',
    contextType: 'HQ Corporate',
    code: 'CORP_MUM_HQ',
    location: 'Bandra-Kurla Complex (BKC), Mumbai, MH',
    ipSubnets: ['172.16.0.0/16', '14.139.120.0/28'],
    operatingHours: '08:30 - 19:30 (Mon - Sat)',
    enforceGeofence: false,
    mfaRequired: true,
    assignedUsersCount: 19,
    dataIsolationLevel: 'Global Master',
    activeSessions: 9,
  },
];

export const mockRowLevelSecurityRules: RowLevelSecurityRule[] = [
  {
    id: 'RLS-001',
    tableName: 'mfg_work_orders',
    ruleName: 'Plant-Scoped Work Order Visibility',
    applicableRoles: ['Plant Operations Manager', 'Shift Supervisor', 'Machine Operator'],
    filterCondition: '`plant_id` = CURRENT_USER.active_plant_id',
    targetContext: 'All Plant Entities',
    isActive: true,
    lastUpdated: '2026-09-01',
  },
  {
    id: 'RLS-002',
    tableName: 'inv_silo_balances',
    ruleName: 'Warehouse Silo & Regrind Stock Partitioning',
    applicableRoles: ['Warehouse Officer', 'Forklift Material Handler'],
    filterCondition: '`warehouse_plant_code` IN (CURRENT_USER.authorized_plants)',
    targetContext: 'Raw Material & Silo Zones',
    isActive: true,
    lastUpdated: '2026-09-03',
  },
  {
    id: 'RLS-003',
    tableName: 'fin_general_ledger_entries',
    ruleName: 'Cost Center & Currency Boundary Fencing',
    applicableRoles: ['Plant Accountant', 'Billing Clerk'],
    filterCondition: '`cost_center_code` LIKE CONCAT(CURRENT_USER.division_prefix, "%")',
    targetContext: 'Finance & Accounting',
    isActive: true,
    lastUpdated: '2026-08-28',
  },
  {
    id: 'RLS-004',
    tableName: 'sal_customer_orders',
    ruleName: 'OEM Account Territory Isolation',
    applicableRoles: ['Territory Sales Manager', 'Key Account Executive'],
    filterCondition: '`account_owner_id` = CURRENT_USER.id OR `is_shared_account` = TRUE',
    targetContext: 'Sales & Commercial',
    isActive: true,
    lastUpdated: '2026-08-15',
  },
];

export const mockBreakGlassRequests: BreakGlassRequest[] = [
  {
    id: 'BG-2026-881',
    ticketNumber: 'INC-2026-0907-01',
    requestedBy: 'Amitabh Joshi (Lead DevOps & DBA)',
    roleElevatedTo: 'SYS_SUPER_ADMIN',
    reason: 'Emergency database index rebuild and silo lock release following network partition.',
    targetPlant: 'Plant 2 - Pune',
    validForHours: 2,
    approvedBy: 'Kavita Iyer (Head of IT Governance)',
    status: 'Active',
    requestedAt: '2026-09-07 08:30',
    expiresAt: '2026-09-07 10:30',
  },
  {
    id: 'BG-2026-880',
    ticketNumber: 'INC-2026-0904-09',
    requestedBy: 'Suresh Patil (Automation Lead)',
    roleElevatedTo: 'PLANT_OPS_MGR',
    reason: 'Midnight injection machine PLC firmware update and safety interlock calibration.',
    targetPlant: 'Plant 1 - Chennai',
    validForHours: 4,
    approvedBy: 'Sunil Rao (Plant General Manager)',
    status: 'Expired',
    requestedAt: '2026-09-04 22:00',
    expiresAt: '2026-09-05 02:00',
  },
];

