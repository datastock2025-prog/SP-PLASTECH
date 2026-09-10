export interface QuickActionItem {
  id: string;
  name: string;
  module: string;
  category: 'Production' | 'Sales' | 'Procurement' | 'Warehouse' | 'Quality' | 'Maintenance' | 'HR' | 'Finance' | 'Admin' | 'General';
  description: string;
  iconName: string;
  shortcut?: string;
  openBehavior: 'Modal' | 'Drawer' | 'Full Page' | 'External Link';
  permissionRequired: string;
  isActive: boolean;
  isDefaultPinned: boolean;
  sortOrder: number;
  formType: 'workOrder' | 'purchaseReq' | 'maintenanceReq' | 'ncr' | 'downtime' | 'receiveGoods' | 'issueMaterial' | 'salesOrder' | 'inspection' | 'checkStock' | 'trackBatch' | 'custom';
  allowedRoles: string[];
}

export const INITIAL_QUICK_ACTIONS: QuickActionItem[] = [
  // Production
  {
    id: 'QA-001',
    name: 'Create Work Order',
    module: 'Production',
    category: 'Production',
    description: 'Schedule an injection molding or extrusion production run',
    iconName: 'PlayCircle',
    shortcut: 'Alt + W',
    openBehavior: 'Modal',
    permissionRequired: 'mfg_create',
    isActive: true,
    isDefaultPinned: true,
    sortOrder: 1,
    formType: 'workOrder',
    allowedRoles: ['Admin', 'Plant Manager', 'Production Planner', 'production'],
  },
  {
    id: 'QA-002',
    name: 'Record Downtime',
    module: 'Production',
    category: 'Production',
    description: 'Log machine stoppage, mold change, or electrical heater trip',
    iconName: 'Clock',
    shortcut: 'Alt + D',
    openBehavior: 'Modal',
    permissionRequired: 'downtime_log',
    isActive: true,
    isDefaultPinned: true,
    sortOrder: 2,
    formType: 'downtime',
    allowedRoles: ['Admin', 'Plant Manager', 'Machine Operator', 'Production Planner', 'operator', 'production'],
  },
  {
    id: 'QA-003',
    name: 'Issue Material to Floor',
    module: 'Production',
    category: 'Production',
    description: 'Dispense raw resin granules or masterbatch to machine hoppers',
    iconName: 'ArrowRightCircle',
    shortcut: 'Alt + I',
    openBehavior: 'Modal',
    permissionRequired: 'mat_issue',
    isActive: true,
    isDefaultPinned: false,
    sortOrder: 3,
    formType: 'issueMaterial',
    allowedRoles: ['Admin', 'Plant Manager', 'Warehouse Staff', 'Machine Operator', 'warehouse', 'operator'],
  },
  // Quality
  {
    id: 'QA-004',
    name: 'Create NCR (Non-Conformance)',
    module: 'Quality',
    category: 'Quality',
    description: 'Quarantine defect parts (short shot, flash, sink marks, warpage)',
    iconName: 'AlertTriangle',
    shortcut: 'Alt + N',
    openBehavior: 'Modal',
    permissionRequired: 'qc_ncr',
    isActive: true,
    isDefaultPinned: true,
    sortOrder: 4,
    formType: 'ncr',
    allowedRoles: ['Admin', 'Quality Inspector', 'Plant Manager', 'quality'],
  },
  {
    id: 'QA-005',
    name: 'Log Quality Inspection',
    module: 'Quality',
    category: 'Quality',
    description: 'Execute CMM dimension check, MFI melt test, or color Delta-E scan',
    iconName: 'CheckSquare',
    openBehavior: 'Modal',
    permissionRequired: 'qc_inspect',
    isActive: true,
    isDefaultPinned: false,
    sortOrder: 5,
    formType: 'inspection',
    allowedRoles: ['Admin', 'Quality Inspector', 'Plant Manager', 'quality'],
  },
  // Maintenance
  {
    id: 'QA-006',
    name: 'Create Maintenance Request',
    module: 'Maintenance',
    category: 'Maintenance',
    description: 'Report hydraulic oil leak, tie-bar misalignment, or barrel heater burnout',
    iconName: 'Wrench',
    shortcut: 'Alt + M',
    openBehavior: 'Modal',
    permissionRequired: 'maint_req',
    isActive: true,
    isDefaultPinned: true,
    sortOrder: 6,
    formType: 'maintenanceReq',
    allowedRoles: ['Admin', 'Plant Manager', 'Machine Operator', 'Maintenance Engineer', 'operator'],
  },
  // Procurement
  {
    id: 'QA-007',
    name: 'Create Purchase Requisition',
    module: 'Procurement',
    category: 'Procurement',
    description: 'Indent polymer resin bags, color masterbatch, or mold spares',
    iconName: 'ShoppingCart',
    shortcut: 'Alt + P',
    openBehavior: 'Modal',
    permissionRequired: 'pr_create',
    isActive: true,
    isDefaultPinned: true,
    sortOrder: 7,
    formType: 'purchaseReq',
    allowedRoles: ['Admin', 'Plant Manager', 'Procurement Officer', 'Production Planner'],
  },
  // Warehouse
  {
    id: 'QA-008',
    name: 'Receive Goods (GRN)',
    module: 'Warehouse',
    category: 'Warehouse',
    description: 'Inward polymer shipment with moisture check and weighbridge docket',
    iconName: 'PackageCheck',
    shortcut: 'Alt + R',
    openBehavior: 'Modal',
    permissionRequired: 'grn_create',
    isActive: true,
    isDefaultPinned: true,
    sortOrder: 8,
    formType: 'receiveGoods',
    allowedRoles: ['Admin', 'Warehouse Staff', 'Plant Manager', 'warehouse'],
  },
  {
    id: 'QA-009',
    name: 'Check Silo / Bin Stock',
    module: 'Warehouse',
    category: 'Warehouse',
    description: 'Instant lookup of virgin resin, regrind silos, and finished goods bins',
    iconName: 'Boxes',
    openBehavior: 'Drawer',
    permissionRequired: 'stock_view',
    isActive: true,
    isDefaultPinned: false,
    sortOrder: 9,
    formType: 'checkStock',
    allowedRoles: ['Admin', 'Plant Manager', 'Warehouse Staff', 'Production Planner', 'warehouse'],
  },
  {
    id: 'QA-010',
    name: 'Track Polymer Batch Genealogy',
    module: 'Warehouse',
    category: 'Warehouse',
    description: 'Trace raw resin lot to work orders, molded parts, and dispatch invoices',
    iconName: 'GitBranch',
    openBehavior: 'Drawer',
    permissionRequired: 'batch_trace',
    isActive: true,
    isDefaultPinned: false,
    sortOrder: 10,
    formType: 'trackBatch',
    allowedRoles: ['Admin', 'Plant Manager', 'Quality Inspector', 'Warehouse Staff', 'quality'],
  },
  // Sales
  {
    id: 'QA-011',
    name: 'Create Sales Order',
    module: 'Sales',
    category: 'Sales',
    description: 'Enter OEM purchase order for molded auto or pharma components',
    iconName: 'FileText',
    shortcut: 'Alt + S',
    openBehavior: 'Modal',
    permissionRequired: 'so_create',
    isActive: true,
    isDefaultPinned: false,
    sortOrder: 11,
    formType: 'salesOrder',
    allowedRoles: ['Admin', 'Sales Manager', 'Plant Manager'],
  },
  // General & Admin
  {
    id: 'QA-012',
    name: 'Add Employee / Operator',
    module: 'HR',
    category: 'HR',
    description: 'Onboard press operator or technician with shift and skill mapping',
    iconName: 'UserPlus',
    openBehavior: 'Full Page',
    permissionRequired: 'hr_manage',
    isActive: true,
    isDefaultPinned: false,
    sortOrder: 12,
    formType: 'custom',
    allowedRoles: ['Admin', 'HR Manager', 'hr'],
  },
  {
    id: 'QA-013',
    name: 'Run MRP Simulation',
    module: 'Supply Chain',
    category: 'Production',
    description: 'Run net material requirements calculation based on current bookings',
    iconName: 'Cpu',
    openBehavior: 'Modal',
    permissionRequired: 'mrp_exec',
    isActive: true,
    isDefaultPinned: false,
    sortOrder: 13,
    formType: 'custom',
    allowedRoles: ['Admin', 'Plant Manager', 'Production Planner', 'Supply Chain Manager'],
  }
];

export interface QuickActionUsageAudit {
  id: string;
  actionId: string;
  actionName: string;
  module: string;
  userName: string;
  userRole: string;
  plantId: string;
  timestamp: string;
  durationSec: number;
  status: 'SUCCESS' | 'FAILED' | 'CANCELLED';
  triggerSource: 'Top bar' | 'Command palette' | 'Dashboard' | 'Module toolbar' | 'Mobile FAB';
  recordId?: string;
  notes?: string;
}

export const SAMPLE_QA_AUDIT_LOGS: QuickActionUsageAudit[] = [
  {
    id: 'LOG-8801',
    actionId: 'QA-001',
    actionName: 'Create Work Order',
    module: 'Production',
    userName: 'Vikram Singh',
    userRole: 'Production Supervisor',
    plantId: 'PLANT-01',
    timestamp: '2026-09-05 08:34:12',
    durationSec: 24,
    status: 'SUCCESS',
    triggerSource: 'Top bar',
    recordId: 'WO-2026-0419',
    notes: 'Auto-scheduled on IMM Press 04 (450T)',
  },
  {
    id: 'LOG-8802',
    actionId: 'QA-002',
    actionName: 'Record Downtime',
    module: 'Production',
    userName: 'K. Iyer',
    userRole: 'Senior IMM Press Operator',
    plantId: 'PLANT-01',
    timestamp: '2026-09-05 07:55:01',
    durationSec: 15,
    status: 'SUCCESS',
    triggerSource: 'Mobile FAB',
    recordId: 'DT-2026-0082',
    notes: 'Reason: Barrel Purge & Color Changeover (PP Natural to Black)',
  },
  {
    id: 'LOG-8803',
    actionId: 'QA-004',
    actionName: 'Create NCR (Non-Conformance)',
    module: 'Quality',
    userName: 'Ananya Sen',
    userRole: 'Quality Assurance Lead',
    plantId: 'PLANT-01',
    timestamp: '2026-09-05 07:12:44',
    durationSec: 32,
    status: 'SUCCESS',
    triggerSource: 'Command palette',
    recordId: 'NCR-2026-0041',
    notes: 'Sink marks detected on Cavity 3 of Dash Trim Cover',
  },
  {
    id: 'LOG-8804',
    actionId: 'QA-008',
    actionName: 'Receive Goods (GRN)',
    module: 'Warehouse',
    userName: 'Rahul Sharma',
    userRole: 'Warehouse & Logistics Lead',
    plantId: 'PLANT-01',
    timestamp: '2026-09-04 16:45:20',
    durationSec: 42,
    status: 'SUCCESS',
    triggerSource: 'Top bar',
    recordId: 'GRN-2026-0189',
    notes: 'Received 12,500 KG PP Copolymer from Reliance Jamnagar',
  },
  {
    id: 'LOG-8805',
    actionId: 'QA-006',
    actionName: 'Create Maintenance Request',
    module: 'Maintenance',
    userName: 'K. Iyer',
    userRole: 'Senior IMM Press Operator',
    plantId: 'PLANT-01',
    timestamp: '2026-09-04 14:19:08',
    durationSec: 19,
    status: 'SUCCESS',
    triggerSource: 'Module toolbar',
    recordId: 'MNT-2026-0056',
    notes: 'Zone 3 heater band resistance open on KraussMaffei 350T',
  },
];
