export interface NavItemDef {
  id: string;
  label: string;
  view: string;
  icon: string;
  badge?: string;
  badgeColor?: string;
  roles?: string[];
  subGroup?: string;
  tooltip?: string;
  params?: Record<string, any>;
}

export interface NavGroupDef {
  id: string;
  title: string;
  shortLabel?: string;
  icon: string;
  roles?: string[];
  items: NavItemDef[];
  defaultExpanded?: boolean;
}

export interface RecentRecordItem {
  id: string;
  title: string;
  recordCode: string;
  module: string;
  view: string;
  type: 'wo' | 'so' | 'po' | 'item' | 'supplier' | 'ncr' | 'bom' | 'hr';
  timestamp: string;
  params?: Record<string, any>;
}

export const INITIAL_RECENT_RECORDS: RecentRecordItem[] = [
  {
    id: 'rec-1',
    title: 'Automotive Bumper Housing - Black PP',
    recordCode: 'WO-2026-00456',
    module: 'Production',
    view: 'woList',
    type: 'wo',
    timestamp: '10 mins ago',
  },
  {
    id: 'rec-2',
    title: 'Maruti Suzuki OEM Blanket PO',
    recordCode: 'SO-2026-1234',
    module: 'Sales',
    view: 'soList',
    type: 'so',
    timestamp: '35 mins ago',
  },
  {
    id: 'rec-3',
    title: 'Polypropylene Natural Grade PP-1110',
    recordCode: 'PP-NAT-001',
    module: 'Item Master',
    view: 'itemList',
    type: 'item',
    timestamp: '1 hr ago',
  },
  {
    id: 'rec-4',
    title: 'Reliance Polymers Corp Ltd',
    recordCode: 'SUP-00104',
    module: 'Procurement',
    view: 'supplierList',
    type: 'supplier',
    timestamp: '2 hrs ago',
  },
  {
    id: 'rec-5',
    title: 'Bulk Virgin Resin Purchase (40MT)',
    recordCode: 'PO-2026-00789',
    module: 'Procurement',
    view: 'poList',
    type: 'po',
    timestamp: '3 hrs ago',
  },
  {
    id: 'rec-6',
    title: 'Sink Marks on Bezel Right Cavity',
    recordCode: 'NCR-2026-088',
    module: 'Quality',
    view: 'ncrList',
    type: 'ncr',
    timestamp: 'Yesterday',
  },
];

export const ROLE_DEFAULT_FAVORITES: Record<string, string[]> = {
  admin: ['home', 'woList', 'jitBoard', 'stockList', 'oeeDash', 'hrCommandCenter', 'adminUsers'],
  plant_manager: ['home', 'woList', 'jitBoard', 'mfgDash', 'oeeDash', 'scrapDowntime', 'stockList'],
  planner: ['home', 'jitBoard', 'woList', 'prodEntryGrid', 'mrpRun', 'bomList', 'stockList'],
  operator: ['home', 'shopFloor', 'prodEntryGrid', 'woList', 'scrapDowntime'],
  warehouse: ['home', 'stockList', 'grnList', 'putaway', 'picking', 'stockTransfer', 'quarantine'],
  quality: ['home', 'qualityDash', 'inspectionPlanList', 'ncrList', 'capaList', 'qcoaList', 'spcMonitor'],
  maintenance: ['home', 'mepDash', 'machineList', 'toolMolds', 'pmSchedules', 'sparesInventory'],
  finance: ['home', 'financeDash', 'coaList', 'apDash', 'arDash', 'billingStatus', 'finReports'],
  hr: ['home', 'hrCommandCenter', 'hrEmployeeList', 'hrAttendance', 'hrShiftRoster', 'hrPayroll'],
  sales: ['home', 'salesDash', 'quoteList', 'soList', 'deliverySchedule', 'customerList', 'creditControl'],
  procurement: ['home', 'supplierList', 'purchaseReqList', 'rfqList', 'poList', 'grnList', 'supplierScorecard'],
  scm: ['home', 'scmControlTower', 'scmReplenishment', 'scmInboundLogistics', 'scmOutboundLogistics', 'scmTrackTrace'],
};

export const NAVIGATION_GROUPS: NavGroupDef[] = [
  {
    id: 'HOME',
    title: 'Home',
    icon: 'Home',
    defaultExpanded: true,
    items: [
      { id: 'nav-home', label: 'Workspace Home', view: 'home', icon: 'Home', tooltip: 'Enterprise Workspace Command Center' },
      { id: 'nav-tasks', label: 'My Tasks', view: 'tasks', icon: 'CheckSquare', badge: '5', badgeColor: 'bg-indigo-500', tooltip: 'Your assigned work items and inspections' },
      { id: 'nav-approvals', label: 'My Approvals', view: 'approvals', icon: 'FileCheck', badge: '3', badgeColor: 'bg-emerald-500', tooltip: 'Pending document and stage-gate approvals' },
      { id: 'nav-notifications', label: 'Notifications', view: 'notifications', icon: 'Bell', badge: '8', badgeColor: 'bg-amber-500', tooltip: 'System alerts, production halts, and events' },
      { id: 'nav-saved-views', label: 'Saved Views', view: 'savedViews', icon: 'Eye', tooltip: 'Custom filtered grids and presets' },
      { id: 'nav-recent-records', label: 'Recent Records', view: 'recentRecords', icon: 'History', tooltip: 'History of recently opened manufacturing records' },
    ],
  },
  {
    id: 'FRONT_OFFICE',
    title: 'Front Office',
    icon: 'Briefcase',
    defaultExpanded: false,
    items: [
      // CRM
      { id: 'nav-crm-leads', label: 'Leads & Inquiries', view: 'crmLeads', icon: 'Users', subGroup: 'CRM' },
      { id: 'nav-crm-opps', label: 'Opportunities', view: 'crmOpportunities', icon: 'Target', subGroup: 'CRM' },
      { id: 'nav-crm-accounts', label: 'Customer Accounts', view: 'crmAccounts', icon: 'Building', subGroup: 'CRM' },
      { id: 'nav-crm-contacts', label: 'Client Contacts', view: 'crmContacts', icon: 'PhoneCall', subGroup: 'CRM' },
      { id: 'nav-crm-feedback', label: 'Complaints & Claims', view: 'crmFeedback', icon: 'MessageSquare', subGroup: 'CRM' },
      // Sales
      { id: 'nav-sales-dash', label: 'Sales Dashboard', view: 'salesDash', icon: 'TrendingUp', subGroup: 'Sales' },
      { id: 'nav-sales-quotes', label: 'Quotations', view: 'quoteList', icon: 'FileText', subGroup: 'Sales' },
      { id: 'nav-sales-orders', label: 'Sales Orders', view: 'soList', icon: 'ShoppingBag', subGroup: 'Sales' },
      { id: 'nav-sales-deliveries', label: 'Deliveries & Dispatch', view: 'deliverySchedule', icon: 'Truck', subGroup: 'Sales' },
      { id: 'nav-sales-rma', label: 'Customer Returns (RMA)', view: 'rmaList', icon: 'RotateCcw', subGroup: 'Sales' },
      { id: 'nav-sales-pricing', label: 'Pricing Matrix & Rebates', view: 'pricingMgmt', icon: 'DollarSign', subGroup: 'Sales' },
      { id: 'nav-sales-credit', label: 'Credit Control & Exposure', view: 'creditControl', icon: 'ShieldCheck', subGroup: 'Sales' },
      { id: 'nav-sales-customers', label: 'Customer Master (360°)', view: 'customerList', icon: 'Users', subGroup: 'Sales' },
      { id: 'nav-sales-contracts', label: 'Sales Contracts & Blankets', view: 'contractList', icon: 'Layers', subGroup: 'Sales' },
      { id: 'nav-sales-tracking', label: '13-Stage Order Tracking', view: 'orderTracking', icon: 'Activity', subGroup: 'Sales' },
      { id: 'nav-sales-backorders', label: 'Backorders & Demand', view: 'backorderMgmt', icon: 'Clock', subGroup: 'Sales' },
    ],
  },
  {
    id: 'OPERATIONS',
    title: 'Operations',
    icon: 'Cpu',
    defaultExpanded: true,
    items: [
      // Production
      { id: 'nav-jit-board', label: 'JIT Scheduling Board', view: 'jitBoard', icon: 'Calendar', subGroup: 'Production' },
      { id: 'nav-wo-list', label: 'Work Orders', view: 'woList', icon: 'ClipboardList', badge: '14 Active', badgeColor: 'bg-cyan-600', subGroup: 'Production' },
      { id: 'nav-prod-entry', label: 'Daily Production Entry', view: 'prodEntryGrid', icon: 'FileSpreadsheet', subGroup: 'Production' },
      { id: 'nav-shop-floor', label: 'Shop Floor Console', view: 'shopFloor', icon: 'Tv', subGroup: 'Production' },
      { id: 'nav-mfg-dash', label: 'Machine Monitoring / Telemetry', view: 'mfgDash', icon: 'Activity', subGroup: 'Production' },
      { id: 'nav-scrap-downtime', label: 'Downtime & Scrap Analysis', view: 'scrapDowntime', icon: 'Trash2', subGroup: 'Production' },
      { id: 'nav-genealogy', label: 'Batch Records & Genealogy', view: 'genealogy', icon: 'Dna', subGroup: 'Production' },
      { id: 'nav-traceability-qr', label: 'Traceability & QR Verification', view: 'traceabilityQR', icon: 'QrCode', subGroup: 'Production' },
      { id: 'nav-changeover', label: 'Changeover Matrix (SMED)', view: 'changeover', icon: 'RefreshCw', subGroup: 'Production' },
      { id: 'nav-material-issuing', label: 'Material Issuing & Return', view: 'materialIssuing', icon: 'Inbox', subGroup: 'Production' },
      // Warehouse
      { id: 'nav-stock-list', label: 'Inventory Overview (Stock)', view: 'stockList', icon: 'Package', badge: '6 Low', badgeColor: 'bg-amber-500', subGroup: 'Warehouse' },
      { id: 'nav-grn-list', label: 'Goods Receipts (GRN)', view: 'grnList', icon: 'Receipt', subGroup: 'Warehouse' },
      { id: 'nav-putaway', label: 'Putaway & Bin Placement', view: 'putaway', icon: 'Archive', subGroup: 'Warehouse' },
      { id: 'nav-picking', label: 'Picking & Staging', view: 'picking', icon: 'Boxes', subGroup: 'Warehouse' },
      { id: 'nav-stock-transfer', label: 'Stock Transfer & Movement', view: 'stockTransfer', icon: 'ArrowLeftRight', subGroup: 'Warehouse' },
      { id: 'nav-cycle-count', label: 'Cycle Count Audits', view: 'cycleCount', icon: 'FileCheck', subGroup: 'Warehouse' },
      { id: 'nav-quarantine', label: 'Quarantine & Quality Hold', view: 'quarantine', icon: 'AlertOctagon', subGroup: 'Warehouse' },
      { id: 'nav-labels', label: 'Labels & Barcode Printing', view: 'barcodePrinting', icon: 'Tag', subGroup: 'Warehouse' },
      { id: 'nav-subcontract', label: 'Subcontracting (Job Work)', view: 'subcontractList', icon: 'GitPullRequest', subGroup: 'Warehouse' },
      // Quality
      { id: 'nav-quality-dash', label: 'Quality Command Center', view: 'qualityDash', icon: 'Award', subGroup: 'Quality' },
      { id: 'nav-inspections', label: 'Inspection Plans & Checklists', view: 'inspectionPlanList', icon: 'CheckSquare', subGroup: 'Quality' },
      { id: 'nav-ncr-list', label: 'Non-Conformance Reports (NCR)', view: 'ncrList', icon: 'AlertTriangle', badge: '2 Open', badgeColor: 'bg-rose-500', subGroup: 'Quality' },
      { id: 'nav-capa-list', label: 'CAPA Management', view: 'capaList', icon: 'CheckCircle2', subGroup: 'Quality' },
      { id: 'nav-qcoa-list', label: 'Certificates of Analysis (COA)', view: 'qcoaList', icon: 'FileText', subGroup: 'Quality' },
      { id: 'nav-quality-holds', label: 'Quality Holds & Releases', view: 'qualityHolds', icon: 'ShieldAlert', subGroup: 'Quality' },
      { id: 'nav-sqa-audits', label: 'Supplier Quality Audits (SQA)', view: 'sqaAuditList', icon: 'Scale', subGroup: 'Quality' },
      { id: 'nav-spc-monitor', label: 'In-Process / SPC Control Charts', view: 'spcMonitor', icon: 'TrendingUp', subGroup: 'Quality' },
      { id: 'nav-lab-equipment', label: 'Lab Equipment & Reagents', view: 'labEquipmentList', icon: 'Microscope', subGroup: 'Quality' },
      // Maintenance / MEP
      { id: 'nav-mep-dash', label: 'Machine Maintenance Command', view: 'mepDash', icon: 'Zap', subGroup: 'Maintenance' },
      { id: 'nav-machines', label: 'Machines & Work Centers', view: 'machineList', icon: 'Cpu', subGroup: 'Maintenance' },
      { id: 'nav-tool-molds', label: 'Tooling & Mold Tracker', view: 'toolMolds', icon: 'Disc', subGroup: 'Maintenance' },
      { id: 'nav-pm-schedules', label: 'Preventive Maintenance (PM)', view: 'pmSchedules', icon: 'Clock', subGroup: 'Maintenance' },
      { id: 'nav-spares', label: 'Spare Parts & Consumables', view: 'sparesInventory', icon: 'Sliders', subGroup: 'Maintenance' },
      { id: 'nav-calibration', label: 'Calibration Records', view: 'calibrationTracker', icon: 'Gauge', subGroup: 'Maintenance' },
      { id: 'nav-energy', label: 'Utilities & Energy Telemetry', view: 'energyTelemetry', icon: 'Zap', subGroup: 'Maintenance' },
    ],
  },
  {
    id: 'PLANNING',
    title: 'Planning',
    icon: 'FolderTree',
    defaultExpanded: false,
    items: [
      // BOM / Engineering
      { id: 'nav-item-master', label: 'Item Master (SKUs)', view: 'itemList', icon: 'Package', subGroup: 'BOM / Engineering' },
      { id: 'nav-bom-list', label: 'BOM List & Formulas', view: 'bomList', icon: 'FolderTree', subGroup: 'BOM / Engineering' },
      { id: 'nav-bom-builder', label: 'Visual Multi-Level BOM Builder', view: 'bomBuilder', icon: 'Network', subGroup: 'BOM / Engineering' },
      { id: 'nav-bom-versions', label: 'BOM Versions & Diff Viewer', view: 'bomVersions', icon: 'GitCompare', subGroup: 'BOM / Engineering' },
      { id: 'nav-eco-list', label: 'Engineering Change Orders (ECO/ECR)', view: 'ecoList', icon: 'GitBranch', subGroup: 'BOM / Engineering' },
      { id: 'nav-routing-list', label: 'Process Routing Operations', view: 'routingList', icon: 'GitFork', subGroup: 'BOM / Engineering' },
      { id: 'nav-cost-rollup', label: 'Standard Cost Rollup', view: 'productCosting', icon: 'Coins', subGroup: 'BOM / Engineering' },
      // MRP
      { id: 'nav-mrp-run', label: 'MRP Run & Planned Orders', view: 'mrpRun', icon: 'Cpu', subGroup: 'MRP' },
      { id: 'nav-proc-mrp', label: 'Material Requirements Planning', view: 'procurementMrp', icon: 'Layers', subGroup: 'MRP' },
      // Demand Planning
      { id: 'nav-demand-plan', label: 'Demand Planning & S&OP', view: 'scmDemandPlanning', icon: 'TrendingUp', subGroup: 'Demand Planning' },
      { id: 'nav-sop-matrix', label: 'Sales & Operations Planning', view: 'scmSOP', icon: 'Calendar', subGroup: 'Demand Planning' },
      { id: 'nav-sales-forecast', label: '12-Month Sales Forecast', view: 'salesForecast', icon: 'BarChart3', subGroup: 'Demand Planning' },
      // Supply Chain
      { id: 'nav-scm-tower', label: 'SCM Control Tower', view: 'scmControlTower', icon: 'Compass', subGroup: 'Supply Chain' },
      { id: 'nav-replenish', label: 'Inventory Replenishment', view: 'scmReplenishment', icon: 'RefreshCw', subGroup: 'Supply Chain' },
      { id: 'nav-inbound-log', label: 'Inbound Logistics', view: 'scmInboundLogistics', icon: 'Truck', subGroup: 'Supply Chain' },
      { id: 'nav-outbound-log', label: 'Outbound Freight & Logistics', view: 'scmOutboundLogistics', icon: 'Truck', subGroup: 'Supply Chain' },
      { id: 'nav-supplier-collab', label: 'Supplier Collaboration Portal', view: 'scmSupplierCollaboration', icon: 'Users', subGroup: 'Supply Chain' },
      { id: 'nav-track-trace', label: 'Multi-Modal Track & Trace', view: 'scmTrackTrace', icon: 'Activity', subGroup: 'Supply Chain' },
      { id: 'nav-supplier-risk', label: 'Supplier Risk Radar', view: 'scmSupplierRisk', icon: 'ShieldAlert', subGroup: 'Supply Chain' },
    ],
  },
  {
    id: 'FINANCE',
    title: 'Finance',
    icon: 'Landmark',
    defaultExpanded: false,
    items: [
      { id: 'nav-fin-dash', label: 'Finance Command Center', view: 'financeDash', icon: 'Landmark', subGroup: 'Accounting' },
      { id: 'nav-coa-list', label: 'Chart of Accounts (COA)', view: 'coaList', icon: 'FolderTree', subGroup: 'Accounting' },
      { id: 'nav-je-list', label: 'Journal Entries & Ledger', view: 'jeList', icon: 'BookOpen', subGroup: 'Accounting' },
      { id: 'nav-ap-dash', label: 'Accounts Payable & 3-Way Match', view: 'apDash', icon: 'TrendingDown', subGroup: 'Accounting' },
      { id: 'nav-ar-dash', label: 'Accounts Receivable & Collections', view: 'arDash', icon: 'TrendingUp', subGroup: 'Accounting' },
      { id: 'nav-billing-status', label: 'Invoicing & Customer Billing', view: 'billingStatus', icon: 'FileText', subGroup: 'Accounting' },
      { id: 'nav-payment-run', label: 'Batch Payment Run', view: 'paymentRun', icon: 'CreditCard', subGroup: 'Accounting' },
      { id: 'nav-product-costing', label: 'Product Costing & Standard Margins', view: 'productCosting', icon: 'Coins', subGroup: 'Accounting' },
      { id: 'nav-budget-list', label: 'Cost Centers & Budgets', view: 'budgetList', icon: 'PieChart', subGroup: 'Accounting' },
      { id: 'nav-fin-reports', label: 'Financial Statements (P&L, BS)', view: 'finReports', icon: 'FileBarChart', subGroup: 'Accounting' },
      { id: 'nav-asset-register', label: 'Fixed Asset Register', view: 'assetRegister', icon: 'Building', subGroup: 'Accounting' },
      { id: 'nav-tax-workbench', label: 'GST & Tax Workbench', view: 'taxWorkbench', icon: 'Scale', subGroup: 'Accounting' },
    ],
  },
  {
    id: 'PEOPLE',
    title: 'People',
    icon: 'Users',
    defaultExpanded: false,
    items: [
      { id: 'nav-hr-center', label: 'HR Command Center', view: 'hrCommandCenter', icon: 'Users', subGroup: 'HR' },
      { id: 'nav-hr-employees', label: 'Employee Master (360°)', view: 'hrEmployeeList', icon: 'UserCheck', subGroup: 'HR' },
      { id: 'nav-hr-attendance', label: 'Biometric Attendance & Punches', view: 'hrAttendance', icon: 'Timer', subGroup: 'HR' },
      { id: 'nav-hr-roster', label: 'Shift Roster & Line Staffing', view: 'hrShiftRoster', icon: 'CalendarDays', subGroup: 'HR' },
      { id: 'nav-hr-leave', label: 'Leave & Overtime Approvals', view: 'hrLeaveOvertime', icon: 'Coffee', badge: '4 Req', badgeColor: 'bg-amber-500', subGroup: 'HR' },
      { id: 'nav-hr-skills', label: 'Skill Matrix & Competency (IATF)', view: 'hrSkillsTraining', icon: 'Award', subGroup: 'HR' },
      { id: 'nav-hr-safety', label: 'Safety (EHS) & Zero-Harm Incidents', view: 'hrSafetyPpe', icon: 'Shield', subGroup: 'HR' },
      { id: 'nav-hr-payroll', label: 'Payroll & Statutory Slips', view: 'hrPayroll', icon: 'Wallet', subGroup: 'HR' },
      { id: 'nav-hr-compliance', label: 'Labor Law & CLRA Compliance', view: 'hrCompliance', icon: 'FileCheck', subGroup: 'HR' },
      { id: 'nav-hr-reports', label: 'HR Analytics & Headcount', view: 'hrReports', icon: 'BarChart3', subGroup: 'HR' },
    ],
  },
  {
    id: 'PROCUREMENT',
    title: 'Procurement',
    icon: 'ShoppingBag',
    defaultExpanded: false,
    items: [
      { id: 'nav-proc-suppliers', label: 'Supplier Directory', view: 'supplierList', icon: 'Building', subGroup: 'Sourcing' },
      { id: 'nav-proc-pr', label: 'Purchase Requisitions (PR)', view: 'purchaseReqList', icon: 'FilePlus', subGroup: 'Sourcing' },
      { id: 'nav-proc-rfq', label: 'Requests for Quotation (RFQ)', view: 'rfqList', icon: 'FileText', subGroup: 'Sourcing' },
      { id: 'nav-proc-rfq-compare', label: 'RFQ Bid Comparison Matrix', view: 'rfqCompare', icon: 'GitCompare', subGroup: 'Sourcing' },
      { id: 'nav-proc-po', label: 'Purchase Orders (PO)', view: 'poList', icon: 'Receipt', badge: '12 Open', badgeColor: 'bg-cyan-600', subGroup: 'Sourcing' },
      { id: 'nav-proc-approvals', label: 'Multi-Tier PO Approvals', view: 'poApprovals', icon: 'FileCheck', subGroup: 'Sourcing' },
      { id: 'nav-proc-grn', label: 'Goods Receipts (GRN)', view: 'grnList', icon: 'Package', subGroup: 'Sourcing' },
      { id: 'nav-proc-returns', label: 'Vendor Debit Notes & Returns', view: 'purchaseReturns', icon: 'RotateCcw', subGroup: 'Sourcing' },
      { id: 'nav-proc-scorecards', label: 'Supplier Performance Scorecards', view: 'supplierScorecard', icon: 'Award', subGroup: 'Sourcing' },
      { id: 'nav-proc-risk', label: 'Supplier Risk & Compliance', view: 'supplierRisk', icon: 'ShieldAlert', subGroup: 'Sourcing' },
      { id: 'nav-proc-contracts', label: 'Supplier Contracts & Blanket POs', view: 'supplierContracts', icon: 'Layers', subGroup: 'Sourcing' },
      { id: 'nav-proc-prices', label: 'Supplier Price Lists', view: 'supplierPriceList', icon: 'DollarSign', subGroup: 'Sourcing' },
    ],
  },
  {
    id: 'ANALYTICS',
    title: 'Analytics',
    icon: 'BarChart3',
    defaultExpanded: false,
    items: [
      { id: 'nav-ana-kpi', label: 'Executive KPI Dashboard', view: 'analyticsDash', icon: 'BarChart3' },
      { id: 'nav-ana-oee', label: 'OEE Analytics & Loss Pareto', view: 'oeeDash', icon: 'PieChart' },
      { id: 'nav-ana-quality', label: 'Quality Defect PPM & Six Sigma', view: 'qualityReports', icon: 'Award' },
      { id: 'nav-ana-aging', label: 'Inventory Aging & Velocity', view: 'scmInventoryAging', icon: 'Clock' },
      { id: 'nav-ana-scm', label: 'Supply Chain Performance Reports', view: 'scmReports', icon: 'Activity' },
      { id: 'nav-ana-esg', label: 'ESG & Carbon Footprint', view: 'scmSustainability', icon: 'ShieldCheck' },
      { id: 'nav-ana-maint', label: 'Maintenance MTBF & MTTR', view: 'maintenanceReports', icon: 'Zap' },
    ],
  },
  {
    id: 'ADMINISTRATION',
    title: 'Administration',
    icon: 'Sliders',
    defaultExpanded: false,
    items: [
      { id: 'nav-adm-users', label: 'Users Directory', view: 'adminUsers', icon: 'Users' },
      { id: 'nav-adm-groups', label: 'User Groups & Crews', view: 'adminUserGroups', icon: 'Users' },
      { id: 'nav-adm-roles', label: 'RBAC Permission Matrix & Simulator', view: 'adminRoles', icon: 'Shield' },
      { id: 'nav-adm-multicontext-rbac', label: 'RBAC Security & Multi-Context', view: 'adminMultiContextSecurity', icon: 'ShieldAlert' },
      { id: 'nav-adm-workflows', label: 'Approval Workflows', view: 'adminWorkflows', icon: 'GitBranch' },
      { id: 'nav-adm-company', label: 'Company & Organization', view: 'adminCompanySettings', icon: 'Building' },
      { id: 'nav-adm-plants', label: 'Plants & Branches', view: 'adminPlantBranches', icon: 'Building' },
      { id: 'nav-adm-wh-locs', label: 'Warehouse & Silo Locations', view: 'adminWarehouseLocations', icon: 'Archive' },
      { id: 'nav-adm-machines', label: 'Machine & Work Centers', view: 'adminMachineWorkCenters', icon: 'Cpu' },
      { id: 'nav-adm-calendar', label: 'Shift & Working Calendar', view: 'adminShiftCalendar', icon: 'Calendar' },
      { id: 'nav-adm-reasons', label: 'Reason Codes Setup', view: 'adminReasonCodes', icon: 'AlertTriangle' },
      { id: 'nav-adm-num-seq', label: 'Number Sequences & Masking', view: 'adminNumberSequences', icon: 'Sliders' },
      { id: 'nav-adm-notify', label: 'Notification Rule Engine', view: 'adminNotificationRules', icon: 'Bell' },
      { id: 'nav-adm-master-data', label: 'Master Data Governance', view: 'adminMasterData', icon: 'FolderTree' },
      { id: 'nav-adm-docs', label: 'Document Management', view: 'adminDocumentSettings', icon: 'FileText' },
      { id: 'nav-adm-audit', label: 'Login & Security Audit', view: 'adminLoginSecurityAudit', icon: 'ShieldCheck' },
      { id: 'nav-adm-integrations', label: 'Integration Hub (OPC-UA/SAP)', view: 'adminIntegrationManagement', icon: 'Network' },
      { id: 'nav-adm-data-io', label: 'Data Import / Export Center', view: 'adminDataImportExport', icon: 'ArrowLeftRight' },
      { id: 'nav-adm-backups', label: 'Backup, Retention & DPDP', view: 'adminBackupRetentionPrivacy', icon: 'Archive' },
      { id: 'nav-adm-license', label: 'License & Subscription', view: 'adminLicense', icon: 'Award' },
      { id: 'nav-adm-udfs', label: 'System Parameters & UDFs', view: 'adminCustomFields', icon: 'Sliders' },
      { id: 'nav-adm-qa-config', label: 'Quick Actions & Shortcut Studio', view: 'adminQuickActionsConfig', icon: 'Zap' },
      { id: 'nav-adm-search-config', label: 'Global Configuration Search', view: 'adminGlobalSearchConfig', icon: 'Search' },
    ],
  },
];
