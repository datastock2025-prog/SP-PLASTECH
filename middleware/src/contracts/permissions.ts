/**
 * SP-PLASTECH ERP — Enterprise RBAC Permissions & SoD Contract Registry
 * Single Source of Truth for CASL abilities, UI screen gates, and backend authorization.
 */

export const ERP_ACTIONS = [
  'manage',
  'create',
  'read',
  'update',
  'delete',
  'approve',
  'reject',
  'export',
  'import',
  'reset-password',
  'lock',
] as const;

export type ErpAction = (typeof ERP_ACTIONS)[number];

export interface ErpSubjectDef {
  code: string;
  label: string;
  module: string;
  description: string;
  supportedActions: readonly ErpAction[];
}

export const ERP_MODULES = [
  { id: 'IDENTITY', name: 'Identity & Access' },
  { id: 'MASTER_DATA', name: 'Master Data & Engineering' },
  { id: 'PRODUCTION', name: 'Manufacturing & Shopfloor' },
  { id: 'SUPPLY_CHAIN', name: 'Procurement & Warehouse' },
  { id: 'QUALITY', name: 'Quality Management' },
  { id: 'MAINTENANCE', name: 'Tooling & Maintenance' },
  { id: 'FINANCE', name: 'Finance & Compliance' },
  { id: 'OPERATIONS', name: 'Platform Operations & Config' },
] as const;

export type ErpModuleId = (typeof ERP_MODULES)[number]['id'];

export const ERP_SUBJECT_CATALOG: readonly ErpSubjectDef[] = [
  // Identity
  { code: 'User', label: 'User Accounts', module: 'IDENTITY', description: 'User provisioning, contact profiles, credentials', supportedActions: ['manage', 'create', 'read', 'update', 'delete', 'reset-password', 'lock'] },
  { code: 'Role', label: 'Security Roles', module: 'IDENTITY', description: 'RBAC role definitions and permission matrices', supportedActions: ['manage', 'create', 'read', 'update', 'delete'] },
  { code: 'UserGroup', label: 'User Groups', module: 'IDENTITY', description: 'Functional team groups for bulk permission assignment', supportedActions: ['manage', 'create', 'read', 'update', 'delete'] },
  { code: 'SecurityPolicy', label: 'Security Policy', module: 'IDENTITY', description: 'Password length, lockout rules, session timeouts, MFA', supportedActions: ['manage', 'read', 'update'] },
  { code: 'Session', label: 'Active Sessions', module: 'IDENTITY', description: 'Concurrent logins, device telemetry, revocation', supportedActions: ['manage', 'read', 'delete'] },
  { code: 'SoDRule', label: 'Segregation of Duties', module: 'IDENTITY', description: 'Toxic combination and incompatible role rules', supportedActions: ['manage', 'create', 'read', 'update', 'delete'] },

  // Master Data
  { code: 'Plant', label: 'Plants & Facilities', module: 'MASTER_DATA', description: 'Manufacturing facilities, GSTINs, and default flags', supportedActions: ['manage', 'create', 'read', 'update', 'delete'] },
  { code: 'Warehouse', label: 'Warehouses & Locations', module: 'MASTER_DATA', description: 'Raw material silos, FG bays, quarantine staging', supportedActions: ['manage', 'create', 'read', 'update', 'delete'] },
  { code: 'WarehouseBin', label: 'Warehouse Bins', module: 'MASTER_DATA', description: 'Physical bin locations, racks, weight capacities', supportedActions: ['manage', 'create', 'read', 'update', 'delete'] },
  { code: 'Item', label: 'Item Master (Parts/Resins)', module: 'MASTER_DATA', description: 'Polymers, masterbatches, molded components, packaging', supportedActions: ['manage', 'create', 'read', 'update', 'delete', 'export', 'import'] },
  { code: 'BillOfMaterial', label: 'Bills of Materials (BOM)', module: 'MASTER_DATA', description: 'Multi-level BOMs, resin shot weights, runner ratios', supportedActions: ['manage', 'create', 'read', 'update', 'delete', 'approve', 'reject'] },
  { code: 'Customer', label: 'Customer Master', module: 'MASTER_DATA', description: 'OEM clients, billing/shipping addresses, credit terms', supportedActions: ['manage', 'create', 'read', 'update', 'delete', 'export'] },
  { code: 'Supplier', label: 'Supplier Master', module: 'MASTER_DATA', description: 'Raw resin suppliers, additive vendors, toolmakers', supportedActions: ['manage', 'create', 'read', 'update', 'delete', 'export'] },

  // Production
  { code: 'Machine', label: 'Injection Molding Machines', module: 'PRODUCTION', description: 'Press tonnages, platen sizes, IoT telemetry hooks', supportedActions: ['manage', 'create', 'read', 'update', 'delete'] },
  { code: 'WorkOrder', label: 'Production Work Orders', module: 'PRODUCTION', description: 'Manufacturing work orders, cavity counts, schedule runs', supportedActions: ['manage', 'create', 'read', 'update', 'delete', 'approve', 'reject'] },
  { code: 'ProductionEntry', label: 'Shift Production Log', module: 'PRODUCTION', description: 'Hourly cycle counts, shot outputs, operator sign-offs', supportedActions: ['manage', 'create', 'read', 'update', 'delete'] },
  { code: 'ScrapDowntime', label: 'Scrap & Downtime Records', module: 'PRODUCTION', description: 'Purge waste, short shots, heater band downtime reasons', supportedActions: ['manage', 'create', 'read', 'update', 'delete', 'approve'] },

  // Supply Chain
  { code: 'SalesOrder', label: 'Sales Orders', module: 'SUPPLY_CHAIN', description: 'Customer purchase contracts and dispatch delivery plans', supportedActions: ['manage', 'create', 'read', 'update', 'delete', 'approve', 'reject'] },
  { code: 'PurchaseRequisition', label: 'Purchase Requisitions', module: 'SUPPLY_CHAIN', description: 'Material requests for polymer resins and additives', supportedActions: ['manage', 'create', 'read', 'update', 'delete', 'approve', 'reject'] },
  { code: 'PurchaseOrder', label: 'Purchase Orders', module: 'SUPPLY_CHAIN', description: 'Vendor POs, delivery schedules, price confirmations', supportedActions: ['manage', 'create', 'read', 'update', 'delete', 'approve', 'reject', 'export'] },
  { code: 'GoodsReceipt', label: 'Goods Receipt Note (GRN)', module: 'SUPPLY_CHAIN', description: 'Inbound gate inwarding, lot numbers, scale weights', supportedActions: ['manage', 'create', 'read', 'update', 'delete', 'approve'] },
  { code: 'StockTransfer', label: 'Stock Transfers', module: 'SUPPLY_CHAIN', description: 'Inter-plant and silo-tohopper resin transfers', supportedActions: ['manage', 'create', 'read', 'update', 'delete', 'approve'] },

  // Quality
  { code: 'InspectionPlan', label: 'Quality Inspection Plans', module: 'QUALITY', description: 'AQL sampling parameters, dimensional tolerance limits', supportedActions: ['manage', 'create', 'read', 'update', 'delete'] },
  { code: 'NonConformanceReport', label: 'Non-Conformance Reports (NCR)', module: 'QUALITY', description: 'Flash, sink marks, visual rejections, containment', supportedActions: ['manage', 'create', 'read', 'update', 'delete', 'approve', 'reject'] },
  { code: 'CAPA', label: 'Corrective & Preventive Action', module: 'QUALITY', description: '8D problem solving, root cause analysis, 5-Why audits', supportedActions: ['manage', 'create', 'read', 'update', 'delete', 'approve'] },

  // Maintenance
  { code: 'ToolMold', label: 'Tooling & Mold Master', module: 'MAINTENANCE', description: 'Core/cavity sets, shot counter life, PM schedules', supportedActions: ['manage', 'create', 'read', 'update', 'delete'] },
  { code: 'PreventiveMaintenance', label: 'PM Work Orders', module: 'MAINTENANCE', description: 'Hydraulic oil changes, toggle lubrication, heater checks', supportedActions: ['manage', 'create', 'read', 'update', 'delete'] },

  // Operations & Compliance
  { code: 'ApprovalWorkflow', label: 'Approval Workflows', module: 'OPERATIONS', description: 'Multi-stage approval hierarchies and limit thresholds', supportedActions: ['manage', 'create', 'read', 'update', 'delete'] },
  { code: 'ApprovalRequest', label: 'Approval Requests', module: 'OPERATIONS', description: 'Pending document approvals and review sign-offs', supportedActions: ['read', 'approve', 'reject'] },
  { code: 'AuditLog', label: 'System Audit Logs', module: 'OPERATIONS', description: 'Immutable transaction trails, field diffs, forensics', supportedActions: ['read', 'export'] },
  { code: 'Integration', label: 'Third-Party Connectors', module: 'OPERATIONS', description: 'Accounting, ERP sync, weighing scale IoT, webhooks', supportedActions: ['manage', 'create', 'read', 'update', 'delete'] },
  { code: 'DataJob', label: 'Data Import / Export Hub', module: 'OPERATIONS', description: 'Bulk CSV staging, schema validation, batch commits', supportedActions: ['manage', 'create', 'read', 'update', 'delete'] },
] as const;

export type ErpSubjectCode = (typeof ERP_SUBJECT_CATALOG)[number]['code'];

export interface SoDConflictRule {
  id: string;
  name: string;
  description: string;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  conflictingActions: {
    first: { subject: ErpSubjectCode; action: ErpAction };
    second: { subject: ErpSubjectCode; action: ErpAction };
  };
}

export const STANDARD_SOD_RULES: readonly SoDConflictRule[] = [
  {
    id: 'SOD-01',
    name: 'Purchase Order Creation vs. Approval',
    description: 'A single user cannot both create and approve the same purchase order.',
    riskLevel: 'CRITICAL',
    conflictingActions: {
      first: { subject: 'PurchaseOrder', action: 'create' },
      second: { subject: 'PurchaseOrder', action: 'approve' },
    },
  },
  {
    id: 'SOD-02',
    name: 'Supplier Master Maintenance vs. PO Approval',
    description: 'Users who manage supplier profiles cannot approve purchase orders to those suppliers.',
    riskLevel: 'CRITICAL',
    conflictingActions: {
      first: { subject: 'Supplier', action: 'manage' },
      second: { subject: 'PurchaseOrder', action: 'approve' },
    },
  },
  {
    id: 'SOD-03',
    name: 'Bill of Material Authoring vs. Engineering Approval',
    description: 'The engineer authoring or updating a BOM cannot self-approve its release.',
    riskLevel: 'HIGH',
    conflictingActions: {
      first: { subject: 'BillOfMaterial', action: 'update' },
      second: { subject: 'BillOfMaterial', action: 'approve' },
    },
  },
  {
    id: 'SOD-04',
    name: 'Scrap Recording vs. Scrap Write-off Approval',
    description: 'Shopfloor operators recording resin scrap cannot approve financial scrap write-offs.',
    riskLevel: 'HIGH',
    conflictingActions: {
      first: { subject: 'ScrapDowntime', action: 'create' },
      second: { subject: 'ScrapDowntime', action: 'approve' },
    },
  },
  {
    id: 'SOD-05',
    name: 'Goods Receipt Entry vs. Inbound Quality Approval',
    description: 'Receiving dock clerks cannot perform quality sign-off and lot release.',
    riskLevel: 'HIGH',
    conflictingActions: {
      first: { subject: 'GoodsReceipt', action: 'create' },
      second: { subject: 'GoodsReceipt', action: 'approve' },
    },
  },
];
