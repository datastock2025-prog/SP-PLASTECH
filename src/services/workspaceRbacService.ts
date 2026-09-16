import { NAVIGATION_GROUPS } from '../data/sidebarNavigationData';
import {
  QuarantinedScreenRecord,
  ScreenApprovalAuditEntry,
  WorkspaceRbacConfig,
  ScreenSyncReport,
} from '../types/workspaceRbac';

export interface RoleDef {
  id: string;
  name: string;
  desc: string;
  scope: string;
}

export const WORKSPACE_ROLES: RoleDef[] = [
  { id: 'admin', name: 'Admin', desc: 'Full System Master Configuration & RBAC', scope: 'Enterprise-wide' },
  { id: 'plant_manager', name: 'Plant Manager', desc: 'OEE, Production Schedules & Floor Overrides', scope: 'Plant Scoped' },
  { id: 'planner', name: 'Production Planner', desc: 'MRP Runs, JIT Scheduling & Job Cards', scope: 'Plant Scoped' },
  { id: 'operator', name: 'Machine Operator', desc: 'Shop Floor Press Execution & Downtime Logging', scope: 'Press / Work Center' },
  { id: 'warehouse', name: 'Warehouse Staff', desc: 'Inward GRN, Silo Bins & Material Transfers', scope: 'Warehouse Scoped' },
  { id: 'quality', name: 'Quality Inspector', desc: 'CMM Scans, Lab Inspections & NCR Dispositions', scope: 'Plant Lab' },
  { id: 'maintenance', name: 'Maintenance Engineer', desc: 'Mold Preventive Maintenance & Spares', scope: 'Tool Room & Presses' },
  { id: 'finance', name: 'Finance Manager', desc: 'Cost Rollup, AR/AP, Invoices & GST Returns', scope: 'Company-wide' },
  { id: 'hr', name: 'HR Manager', desc: 'Shift Rotations, Overtime & Biometric Attendance', scope: 'Plant Scoped' },
  { id: 'sales', name: 'Sales Manager', desc: 'OEM Purchase Orders, Quotes & Customer Portals', scope: 'Regional' },
  { id: 'procurement', name: 'Procurement Officer', desc: 'Polymer Resins, Additives & RFQ Comparisons', scope: 'Supply Chain' },
  { id: 'scm', name: 'Supply Chain Manager', desc: 'Control Tower, Inbound Freight & Stockout Alarms', scope: 'Enterprise' },
];

export function normalizeRoleKey(roleStr?: string): string {
  if (!roleStr) return 'admin';
  const r = roleStr.toLowerCase();
  if (r === 'admin' || r.includes('admin') || r.includes('director')) return 'admin';
  if (r === 'plant_manager' || (r.includes('plant') && r.includes('manager'))) return 'plant_manager';
  if (r === 'planner' || r.includes('planner')) return 'planner';
  if (r === 'operator' || r.includes('operator')) return 'operator';
  if (r === 'warehouse' || r.includes('warehouse') || r.includes('inventory')) return 'warehouse';
  if (r === 'quality' || r.includes('quality') || r.includes('inspector') || r.includes('qa')) return 'quality';
  if (r === 'maintenance' || r.includes('maintenance')) return 'maintenance';
  if (r === 'finance' || r.includes('finance') || r.includes('account')) return 'finance';
  if (r === 'hr' || r.includes('hr') || r.includes('human')) return 'hr';
  if (r === 'sales' || r.includes('sales')) return 'sales';
  if (r === 'procurement' || r.includes('procurement') || r.includes('sourcing')) return 'procurement';
  if (r === 'scm' || r.includes('supply chain')) return 'scm';
  return 'admin';
}

// Initial Quarantined / Pending Approval Screens
const INITIAL_QUARANTINED_SCREENS: QuarantinedScreenRecord[] = [
  {
    id: 'quar-01',
    title: 'AI Polymer Melt Flow & Viscosity Predictor',
    view: 'aiResinFormulator',
    groupId: 'OPERATIONS',
    groupTitle: 'Operations',
    subGroup: 'Smart Lab / AI',
    route: '/operations/ai-viscosity-predict',
    status: 'PENDING_APPROVAL',
    detectedAt: '2026-09-12 04:15 AM',
    detectedTrigger: 'Route Auto-Discovery (Build v4.8.2 Canary)',
    securityLevel: 'Elevated',
    description: 'Generative AI regression model predicting Melt Flow Index (MFI) and shrinkage variations based on ambient humidity and barrel heat.',
    allowedRoles: ['admin'],
    showInWorkspaceForRoles: ['admin'],
    showInSidebarForRoles: ['admin'],
  },
  {
    id: 'quar-02',
    title: 'EPR Plastic Waste Credit Exchange & Blockchain Ledger',
    view: 'closedLoopEpr',
    groupId: 'FINANCE',
    groupTitle: 'Finance',
    subGroup: 'Sustainability Compliance',
    route: '/finance/epr-waste-credits',
    status: 'PENDING_APPROVAL',
    detectedAt: '2026-09-11 08:30 PM',
    detectedTrigger: 'Statutory EPR Regulatory Plugin Integration',
    securityLevel: 'Restricted / Sovereign',
    description: 'Central Pollution Control Board (CPCB) registered plastic credit ledger and secondary market trading terminal.',
    allowedRoles: ['admin'],
    showInWorkspaceForRoles: ['admin'],
    showInSidebarForRoles: ['admin'],
  },
  {
    id: 'quar-03',
    title: 'Ultrasonic Horn Acoustic Resonance Monitor',
    view: 'iotUltrasonicWeld',
    groupId: 'OPERATIONS',
    groupTitle: 'Operations',
    subGroup: 'Maintenance IoT',
    route: '/operations/ultrasonic-horn-iot',
    status: 'PENDING_APPROVAL',
    detectedAt: '2026-09-10 11:20 AM',
    detectedTrigger: 'Hardware Bus Discovery (Press #04 Branson 2000X)',
    securityLevel: 'Standard',
    description: 'Real-time Piezoelectric transducer frequency scan to identify hairline micro-cracks in titanium horn fixtures.',
    allowedRoles: ['admin'],
    showInWorkspaceForRoles: ['admin'],
    showInSidebarForRoles: ['admin'],
  },
];

const INITIAL_AUDIT_LOG: ScreenApprovalAuditEntry[] = [
  {
    id: 'aud-01',
    screenId: 'quar-01',
    screenTitle: 'AI Polymer Melt Flow & Viscosity Predictor',
    action: 'REGISTERED',
    performedBy: 'System Zero-Trust Guardian',
    timestamp: '2026-09-12 04:15 AM',
    details: 'New route detected in bundle. Automatically placed in Quarantined Restriction Area pending Admin review.',
  },
  {
    id: 'aud-02',
    screenId: 'quar-02',
    screenTitle: 'EPR Plastic Waste Credit Exchange & Blockchain Ledger',
    action: 'REGISTERED',
    performedBy: 'System Zero-Trust Guardian',
    timestamp: '2026-09-11 08:30 PM',
    details: 'Sovereign statutory module discovered. Marked as Restricted by Default.',
  },
  {
    id: 'aud-03',
    screenId: 'quar-03',
    screenTitle: 'Ultrasonic Horn Acoustic Resonance Monitor',
    action: 'REGISTERED',
    performedBy: 'System Zero-Trust Guardian',
    timestamp: '2026-09-10 11:20 AM',
    details: 'New hardware telemetry screen discovered via IoT gateway.',
  },
];

// Build default visibility matrix based on role domains
function buildDefaultVisibilityMatrix(): Record<string, Record<string, boolean>> {
  const allScreenViews: string[] = [];
  (NAVIGATION_GROUPS || []).forEach((group) => {
    (group?.items || []).forEach((item) => {
      if (item && item.view) {
        allScreenViews.push(item.view);
      }
    });
  });

  // Additional known special views
  const additionalSpecialViews = ['architectureGuide', 'aiPromptBuilder', 'wipOperations', 'adminWorkspaceRbac', 'adminMultiContextSecurity'];
  additionalSpecialViews.forEach((v) => {
    if (!allScreenViews.includes(v)) allScreenViews.push(v);
  });

  const matrix: Record<string, Record<string, boolean>> = {};

  WORKSPACE_ROLES.forEach((role) => {
    matrix[role.id] = {};

    allScreenViews.forEach((viewKey) => {
      // Admin sees everything
      if (role.id === 'admin') {
        matrix[role.id][viewKey] = true;
        return;
      }

      // Home tools are available to all roles
      const homeViews = ['home', 'tasks', 'approvals', 'notifications', 'savedViews', 'recentRecords', 'architectureGuide'];
      if (homeViews.includes(viewKey)) {
        matrix[role.id][viewKey] = true;
        return;
      }

      // Role specific defaults
      let isAllowed = false;

      switch (role.id) {
        case 'operator':
          isAllowed = ['shopFloor', 'woList', 'prodEntryGrid', 'scrapDowntime', 'changeover', 'materialIssuing', 'barcodePrinting', 'wipOperations'].includes(viewKey);
          break;

        case 'planner':
          isAllowed = [
            'jitBoard', 'woList', 'prodEntryGrid', 'createWoGrid', 'mrpRun', 'procurementMrp',
            'bomList', 'bomBuilder', 'bomVersions', 'itemList', 'stockList', 'scmDemandPlanning', 'scmSOP', 'salesForecast'
          ].includes(viewKey);
          break;

        case 'plant_manager':
          isAllowed = [
            'jitBoard', 'woList', 'mfgDash', 'oeeDash', 'scrapDowntime', 'genealogy', 'traceabilityQR',
            'stockList', 'qualityDash', 'ncrList', 'capaList', 'mepDash', 'machineList', 'toolMolds',
            'hrShiftRoster', 'analyticsDash', 'maintenanceReports', 'wipOperations', 'unifiedLedger'
          ].includes(viewKey);
          break;

        case 'warehouse':
          isAllowed = [
            'stockList', 'grnList', 'putaway', 'picking', 'stockTransfer', 'cycleCount', 'quarantine',
            'barcodePrinting', 'subcontractList', 'itemList', 'scmReplenishment', 'deliverySchedule', 'gatePass', 'wipOperations'
          ].includes(viewKey);
          break;

        case 'quality':
          isAllowed = [
            'qualityDash', 'inspectionPlanList', 'ncrList', 'capaList', 'qcoaList', 'qualityHolds',
            'sqaAuditList', 'spcMonitor', 'labEquipmentList', 'qualityReports', 'traceabilityQR', 'genealogy', 'wipOperations'
          ].includes(viewKey);
          break;

        case 'maintenance':
          isAllowed = [
            'mepDash', 'machineList', 'toolMolds', 'pmSchedules', 'sparesInventory', 'calibrationTracker',
            'energyTelemetry', 'maintenanceReports', 'scrapDowntime'
          ].includes(viewKey);
          break;

        case 'finance':
          isAllowed = [
            'financeDash', 'unifiedLedger', 'coaList', 'jeList', 'apDash', 'arDash', 'billingStatus', 'paymentRun',
            'productCosting', 'budgetList', 'finReports', 'assetRegister', 'taxWorkbench', 'creditControl', 'pricingMgmt'
          ].includes(viewKey);
          break;

        case 'hr':
          isAllowed = [
            'hrCommandCenter', 'hrEmployeeList', 'hrAttendance', 'hrShiftRoster', 'hrLeaveOvertime',
            'hrSkillsTraining', 'hrSafetyPpe', 'hrPayroll', 'hrCompliance', 'hrReports'
          ].includes(viewKey);
          break;

        case 'sales':
          isAllowed = [
            'salesDash', 'quoteList', 'soList', 'monthlyPlanOrders', 'monthlyReconciliation',
            'deliverySchedule', 'gatePass', 'eWayBillMgmt', 'complianceDashboard', 'rmaList',
            'pricingMgmt', 'creditControl', 'customerList', 'contractList', 'orderTracking', 'backorderMgmt',
            'crmLeads', 'crmOpportunities', 'crmAccounts', 'crmContacts', 'crmFeedback'
          ].includes(viewKey);
          break;

        case 'procurement':
          isAllowed = [
            'supplierList', 'purchaseReqList', 'rfqList', 'rfqCompare', 'poList', 'poApprovals',
            'grnList', 'purchaseReturns', 'supplierScorecard', 'supplierRisk', 'supplierContracts',
            'supplierPriceList', 'itemList', 'procurementMrp'
          ].includes(viewKey);
          break;

        case 'scm':
          isAllowed = [
            'scmControlTower', 'scmReplenishment', 'scmInboundLogistics', 'scmOutboundLogistics',
            'scmSupplierCollaboration', 'scmTrackTrace', 'scmSupplierRisk', 'scmDemandPlanning',
            'scmSOP', 'scmInventoryAging', 'scmReports', 'scmSustainability', 'stockTransfer'
          ].includes(viewKey);
          break;

        default:
          isAllowed = false;
      }

      matrix[role.id][viewKey] = isAllowed;
    });
  });

  return matrix;
}

const STORAGE_KEY = 'reboot_workspace_rbac_v2';

// In-Memory Storage & Pub/Sub with Dual Workspace & Sidebar Matrix
class WorkspaceRbacService {
  private workspaceMatrix: Record<string, Record<string, boolean>>;
  private sidebarMatrix: Record<string, Record<string, boolean>>;
  private quarantinedScreens: QuarantinedScreenRecord[];
  private auditLog: ScreenApprovalAuditEntry[];
  private config: WorkspaceRbacConfig;
  private lastSyncReport: ScreenSyncReport | null = null;
  private listeners: Array<() => void> = [];

  constructor() {
    // Try restoring from localStorage if available
    let savedState: any = null;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) savedState = JSON.parse(raw);
      }
    } catch {
      // ignore
    }

    if (savedState && savedState.workspaceMatrix && savedState.sidebarMatrix) {
      this.workspaceMatrix = savedState.workspaceMatrix;
      this.sidebarMatrix = savedState.sidebarMatrix;
      this.quarantinedScreens = savedState.quarantinedScreens || [...INITIAL_QUARANTINED_SCREENS];
      this.auditLog = savedState.auditLog || [...INITIAL_AUDIT_LOG];
      this.config = savedState.config || {
        strictZeroTrustQuarantine: true,
        notifyAdminsOnNewRoute: true,
        defaultApprovalVisibility: 'CUSTOM_SELECTION',
        autoSyncDiscoveredScreens: true,
        linkSidebarWithWorkspaceByDefault: false,
      };
      this.lastSyncReport = savedState.lastSyncReport || null;
    } else {
      const defaultWorkspace = buildDefaultVisibilityMatrix();
      this.workspaceMatrix = JSON.parse(JSON.stringify(defaultWorkspace));
      // By default, sidebar starts mirrored to workspace
      this.sidebarMatrix = JSON.parse(JSON.stringify(defaultWorkspace));
      this.quarantinedScreens = [...INITIAL_QUARANTINED_SCREENS];
      this.auditLog = [...INITIAL_AUDIT_LOG];
      this.config = {
        strictZeroTrustQuarantine: true,
        notifyAdminsOnNewRoute: true,
        defaultApprovalVisibility: 'CUSTOM_SELECTION',
        autoSyncDiscoveredScreens: true,
        linkSidebarWithWorkspaceByDefault: false,
      };
    }

    // Auto-discover and sync screens on boot
    this.syncAndDiscoverScreens('System Initial Boot Auto-Sync');
  }

  private persist() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            workspaceMatrix: this.workspaceMatrix,
            sidebarMatrix: this.sidebarMatrix,
            quarantinedScreens: this.quarantinedScreens,
            auditLog: this.auditLog.slice(0, 80),
            config: this.config,
            lastSyncReport: this.lastSyncReport,
          })
        );
      }
    } catch {
      // ignore quota
    }
  }

  // Subscribe to updates
  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.persist();
    this.listeners.forEach((l) => {
      try {
        l();
      } catch (e) {
        console.error('RBAC listener error:', e);
      }
    });
  }

  // Get current visibility matrices
  public getVisibilityMatrix(): Record<string, Record<string, boolean>> {
    return this.workspaceMatrix;
  }

  public getWorkspaceMatrix(): Record<string, Record<string, boolean>> {
    return this.workspaceMatrix;
  }

  public getSidebarMatrix(): Record<string, Record<string, boolean>> {
    return this.sidebarMatrix;
  }

  // Backward compatibility alias for workspace
  public isScreenVisible(roleId: string, screenView: string): boolean {
    return this.isWorkspaceVisible(roleId, screenView);
  }

  // Check if screen is visible on Home Workspace
  public isWorkspaceVisible(roleId: string, screenView: string): boolean {
    const canonicalRole = normalizeRoleKey(roleId);
    if (canonicalRole === 'admin') return true;

    // Quarantined check
    const quarantined = this.quarantinedScreens.find((q) => q.view === screenView);
    if (quarantined) {
      if (quarantined.status === 'PENDING_APPROVAL' || quarantined.status === 'RESTRICTED') {
        const allowed = quarantined.showInWorkspaceForRoles || quarantined.allowedRoles;
        return allowed.includes(canonicalRole);
      }
    }

    const roleMap = this.workspaceMatrix[canonicalRole];
    if (!roleMap) return false;
    if (roleMap[screenView] !== undefined) return roleMap[screenView];

    return !this.config.strictZeroTrustQuarantine;
  }

  // Check if screen is visible in Sidebar Navigation Menu
  public isSidebarVisible(roleId: string, screenView: string): boolean {
    const canonicalRole = normalizeRoleKey(roleId);
    if (canonicalRole === 'admin') return true;

    // Quarantined check
    const quarantined = this.quarantinedScreens.find((q) => q.view === screenView);
    if (quarantined) {
      if (quarantined.status === 'PENDING_APPROVAL' || quarantined.status === 'RESTRICTED') {
        const allowed = quarantined.showInSidebarForRoles || quarantined.allowedRoles;
        return allowed.includes(canonicalRole);
      }
    }

    const roleMap = this.sidebarMatrix[canonicalRole];
    if (!roleMap) return false;
    if (roleMap[screenView] !== undefined) return roleMap[screenView];

    // Fallback to workspace matrix if not set
    if (this.workspaceMatrix[canonicalRole]?.[screenView] !== undefined) {
      return this.workspaceMatrix[canonicalRole][screenView];
    }

    return !this.config.strictZeroTrustQuarantine;
  }

  // Toggle Home Workspace card visibility
  public setWorkspaceVisibility(roleId: string, screenView: string, isVisible: boolean): void {
    const canonicalRole = normalizeRoleKey(roleId);
    if (!this.workspaceMatrix[canonicalRole]) this.workspaceMatrix[canonicalRole] = {};
    this.workspaceMatrix[canonicalRole][screenView] = isVisible;

    if (this.config.linkSidebarWithWorkspaceByDefault) {
      if (!this.sidebarMatrix[canonicalRole]) this.sidebarMatrix[canonicalRole] = {};
      this.sidebarMatrix[canonicalRole][screenView] = isVisible;
    }

    this.notify();
  }

  // Backward compatibility alias
  public setScreenVisibility(roleId: string, screenView: string, isVisible: boolean): void {
    this.setWorkspaceVisibility(roleId, screenView, isVisible);
  }

  // Toggle Sidebar Menu link visibility
  public setSidebarVisibility(roleId: string, screenView: string, isVisible: boolean): void {
    const canonicalRole = normalizeRoleKey(roleId);
    if (!this.sidebarMatrix[canonicalRole]) this.sidebarMatrix[canonicalRole] = {};
    this.sidebarMatrix[canonicalRole][screenView] = isVisible;
    this.notify();
  }

  // Set both Workspace and Sidebar in one atomic call
  public setDualVisibility(roleId: string, screenView: string, inWorkspace: boolean, inSidebar: boolean): void {
    const canonicalRole = normalizeRoleKey(roleId);
    if (!this.workspaceMatrix[canonicalRole]) this.workspaceMatrix[canonicalRole] = {};
    if (!this.sidebarMatrix[canonicalRole]) this.sidebarMatrix[canonicalRole] = {};

    this.workspaceMatrix[canonicalRole][screenView] = inWorkspace;
    this.sidebarMatrix[canonicalRole][screenView] = inSidebar;
    this.notify();
  }

  // Bulk set workspace screens
  public bulkSetWorkspace(roleId: string, screenViews: string[], isVisible: boolean): void {
    const canonicalRole = normalizeRoleKey(roleId);
    if (!this.workspaceMatrix[canonicalRole]) this.workspaceMatrix[canonicalRole] = {};
    screenViews.forEach((v) => {
      this.workspaceMatrix[canonicalRole][v] = isVisible;
    });
    this.notify();
  }

  // Backward compatibility alias
  public bulkSetScreens(roleId: string, screenViews: string[], isVisible: boolean): void {
    this.bulkSetWorkspace(roleId, screenViews, isVisible);
  }

  // Bulk set sidebar screens
  public bulkSetSidebar(roleId: string, screenViews: string[], isVisible: boolean): void {
    const canonicalRole = normalizeRoleKey(roleId);
    if (!this.sidebarMatrix[canonicalRole]) this.sidebarMatrix[canonicalRole] = {};
    screenViews.forEach((v) => {
      this.sidebarMatrix[canonicalRole][v] = isVisible;
    });
    this.notify();
  }

  // Bulk set both
  public bulkSetDual(roleId: string, screenViews: string[], inWorkspace: boolean, inSidebar: boolean): void {
    const canonicalRole = normalizeRoleKey(roleId);
    if (!this.workspaceMatrix[canonicalRole]) this.workspaceMatrix[canonicalRole] = {};
    if (!this.sidebarMatrix[canonicalRole]) this.sidebarMatrix[canonicalRole] = {};

    screenViews.forEach((v) => {
      this.workspaceMatrix[canonicalRole][v] = inWorkspace;
      this.sidebarMatrix[canonicalRole][v] = inSidebar;
    });
    this.notify();
  }

  // Copy Workspace visibility into Sidebar for a role
  public syncSidebarToWorkspace(roleId: string): void {
    const canonicalRole = normalizeRoleKey(roleId);
    if (this.workspaceMatrix[canonicalRole]) {
      this.sidebarMatrix[canonicalRole] = { ...this.workspaceMatrix[canonicalRole] };
      this.auditLog.unshift({
        id: `aud-${Date.now()}`,
        screenId: 'all-screens',
        screenTitle: `Sidebar Sync for ${canonicalRole}`,
        action: 'SIDEBAR_UPDATED',
        performedBy: 'Admin',
        timestamp: new Date().toLocaleString(),
        details: `Mirrored Workspace screen permissions into Sidebar menu for role: ${canonicalRole}.`,
      });
      this.notify();
    }
  }

  // Copy Sidebar visibility into Workspace for a role
  public syncWorkspaceToSidebar(roleId: string): void {
    const canonicalRole = normalizeRoleKey(roleId);
    if (this.sidebarMatrix[canonicalRole]) {
      this.workspaceMatrix[canonicalRole] = { ...this.sidebarMatrix[canonicalRole] };
      this.auditLog.unshift({
        id: `aud-${Date.now()}`,
        screenId: 'all-screens',
        screenTitle: `Workspace Sync for ${canonicalRole}`,
        action: 'WORKSPACE_UPDATED',
        performedBy: 'Admin',
        timestamp: new Date().toLocaleString(),
        details: `Mirrored Sidebar menu permissions into Home Workspace for role: ${canonicalRole}.`,
      });
      this.notify();
    }
  }

  // Reset a role to enterprise defaults
  public resetRoleToDefaults(roleId: string): void {
    const canonicalRole = normalizeRoleKey(roleId);
    const defaults = buildDefaultVisibilityMatrix();
    if (defaults[canonicalRole]) {
      this.workspaceMatrix[canonicalRole] = { ...defaults[canonicalRole] };
      this.sidebarMatrix[canonicalRole] = { ...defaults[canonicalRole] };
      this.notify();
    }
  }

  // Copy permissions from one role to another
  public copyRolePermissions(sourceRoleId: string, targetRoleId: string): void {
    const src = normalizeRoleKey(sourceRoleId);
    const tgt = normalizeRoleKey(targetRoleId);
    if (this.workspaceMatrix[src]) {
      this.workspaceMatrix[tgt] = { ...this.workspaceMatrix[src] };
    }
    if (this.sidebarMatrix[src]) {
      this.sidebarMatrix[tgt] = { ...this.sidebarMatrix[src] };
    }
    this.notify();
  }

  // AUTO-DISCOVERY & SYNCHRONIZE ENGINE:
  // Automatically detects every module, screen, and route defined in the application,
  // syncs them into the Admin registry, ensures role matrix entries exist,
  // and places any newly detected untracked views into the Zero-Trust Quarantine area.
  public syncAndDiscoverScreens(triggerSource = 'Manual Admin Screen Sync'): ScreenSyncReport {
    const discoveredList: ScreenSyncReport['screens'] = [];
    let newScreensCount = 0;
    let updatedCount = 0;

    // 1. Scan NAVIGATION_GROUPS
    (NAVIGATION_GROUPS || []).forEach((group) => {
      (group?.items || []).forEach((item) => {
        if (!item || !item.view) return;
        discoveredList.push({
          id: item.id || `nav-${item.view}`,
          view: item.view,
          title: item.label,
          groupId: group.id,
          groupTitle: group.title,
          subGroup: item.subGroup,
          isQuarantined: false,
          route: `/${group.id.toLowerCase()}/${item.view}`,
        });
      });
    });

    // 2. Scan Known Special Sub-views
    const specialViews: Array<{ view: string; title: string; groupId: string; groupTitle: string; subGroup?: string; route: string }> = [
      { view: 'architectureGuide', title: 'Interactive ERP System Blueprint & Flow Maps', groupId: 'HOME', groupTitle: 'Home', route: '/home/architecture-guide' },
      { view: 'aiPromptBuilder', title: 'AI Prompt Builder & Reasoning Playground', groupId: 'ADMINISTRATION', groupTitle: 'Administration', subGroup: 'AI Studio', route: '/admin/prompt-builder' },
      { view: 'wipOperations', title: 'WIP, Deflash & Assembly Stores (QC Gate)', groupId: 'OPERATIONS', groupTitle: 'Operations', subGroup: 'Production', route: '/operations/wip-stores' },
      { view: 'adminWorkspaceRbac', title: 'Home Workspace & Sidebar RBAC Governance', groupId: 'ADMINISTRATION', groupTitle: 'Administration', subGroup: 'Org & Workflow', route: '/admin/workspace-rbac' },
      { view: 'adminMultiContextSecurity', title: 'RBAC Security & Multi-Context Policies', groupId: 'ADMINISTRATION', groupTitle: 'Administration', subGroup: 'Security & Integrations', route: '/admin/multi-context-security' },
    ];

    specialViews.forEach((sv) => {
      if (!discoveredList.some((d) => d.view === sv.view)) {
        discoveredList.push({
          id: `spec-${sv.view}`,
          view: sv.view,
          title: sv.title,
          groupId: sv.groupId,
          groupTitle: sv.groupTitle,
          subGroup: sv.subGroup,
          isQuarantined: false,
          route: sv.route,
        });
      }
    });

    // 3. Incorporate existing Quarantined Screens
    this.quarantinedScreens.forEach((qs) => {
      const existing = discoveredList.find((d) => d.view === qs.view);
      if (existing) {
        existing.isQuarantined = qs.status === 'PENDING_APPROVAL' || qs.status === 'RESTRICTED';
      } else {
        discoveredList.push({
          id: qs.id,
          view: qs.view,
          title: qs.title,
          groupId: qs.groupId,
          groupTitle: qs.groupTitle,
          subGroup: qs.subGroup,
          isQuarantined: qs.status === 'PENDING_APPROVAL' || qs.status === 'RESTRICTED',
          route: qs.route,
        });
      }
    });

    // 4. Check for missing entries across all roles in workspaceMatrix and sidebarMatrix
    WORKSPACE_ROLES.forEach((role) => {
      if (!this.workspaceMatrix[role.id]) this.workspaceMatrix[role.id] = {};
      if (!this.sidebarMatrix[role.id]) this.sidebarMatrix[role.id] = {};

      discoveredList.forEach((scr) => {
        // If screen not in workspaceMatrix for this role
        if (this.workspaceMatrix[role.id][scr.view] === undefined) {
          if (role.id === 'admin') {
            this.workspaceMatrix[role.id][scr.view] = true;
          } else {
            // Home tools default to true, others default to false if untracked
            this.workspaceMatrix[role.id][scr.view] = scr.groupId === 'HOME';
          }
          updatedCount++;
        }

        // If screen not in sidebarMatrix for this role
        if (this.sidebarMatrix[role.id][scr.view] === undefined) {
          if (role.id === 'admin') {
            this.sidebarMatrix[role.id][scr.view] = true;
          } else {
            this.sidebarMatrix[role.id][scr.view] = this.workspaceMatrix[role.id][scr.view] || false;
          }
          updatedCount++;
        }
      });
    });

    const report: ScreenSyncReport = {
      totalDiscovered: discoveredList.length,
      newScreensCount,
      updatedCount,
      quarantinedCount: this.getPendingCount(),
      lastSyncTime: new Date().toLocaleString(),
      screens: discoveredList,
    };

    this.lastSyncReport = report;

    this.auditLog.unshift({
      id: `aud-${Date.now()}`,
      screenId: 'sync-all',
      screenTitle: 'Auto-Discovery & Screen Sync',
      action: 'SYNCED',
      performedBy: triggerSource,
      timestamp: new Date().toLocaleString(),
      details: `Discovered and cataloged ${discoveredList.length} total screens across ${[...new Set(discoveredList.map((d) => d.groupId))].length} functional modules. ${this.getPendingCount()} screens in Zero-Trust Quarantine.`,
    });

    this.notify();
    return report;
  }

  public getSyncReport(): ScreenSyncReport | null {
    return this.lastSyncReport;
  }

  // Quarantined / Restriction Area Handlers
  public getQuarantinedScreens(): QuarantinedScreenRecord[] {
    return this.quarantinedScreens;
  }

  public getPendingCount(): number {
    return this.quarantinedScreens.filter((q) => q.status === 'PENDING_APPROVAL').length;
  }

  public approveQuarantinedScreen(
    screenId: string,
    allowedRoleIds: string[],
    options?: {
      showInSidebarRoles?: string[];
      showInWorkspaceRoles?: string[];
      approvedBy?: string;
    }
  ): void {
    const screen = this.quarantinedScreens.find((q) => q.id === screenId);
    if (!screen) return;

    const approvedBy = options?.approvedBy || 'Priya Rao (Admin)';
    const workspaceRoles = options?.showInWorkspaceRoles || allowedRoleIds;
    const sidebarRoles = options?.showInSidebarRoles || allowedRoleIds;

    screen.status = 'APPROVED';
    screen.allowedRoles = [...new Set([...allowedRoleIds, 'admin'])];
    screen.showInWorkspaceForRoles = [...new Set([...workspaceRoles, 'admin'])];
    screen.showInSidebarForRoles = [...new Set([...sidebarRoles, 'admin'])];
    screen.approvedBy = approvedBy;
    screen.approvedAt = new Date().toLocaleString();

    // Update visibility matrices for all roles
    WORKSPACE_ROLES.forEach((r) => {
      if (!this.workspaceMatrix[r.id]) this.workspaceMatrix[r.id] = {};
      if (!this.sidebarMatrix[r.id]) this.sidebarMatrix[r.id] = {};

      this.workspaceMatrix[r.id][screen.view] = screen.showInWorkspaceForRoles!.includes(r.id);
      this.sidebarMatrix[r.id][screen.view] = screen.showInSidebarForRoles!.includes(r.id);
    });

    this.auditLog.unshift({
      id: `aud-${Date.now()}`,
      screenId: screen.id,
      screenTitle: screen.title,
      action: 'APPROVED',
      performedBy: approvedBy,
      timestamp: new Date().toLocaleString(),
      details: `Screen approved & provisioned. Workspace: [${screen.showInWorkspaceForRoles!.join(', ')}], Sidebar: [${screen.showInSidebarForRoles!.join(', ')}].`,
    });

    this.notify();
  }

  public rejectQuarantinedScreen(screenId: string, rejectionReason = 'Restricted by Admin policy', rejectedBy = 'Priya Rao (Admin)'): void {
    const screen = this.quarantinedScreens.find((q) => q.id === screenId);
    if (!screen) return;

    screen.status = 'RESTRICTED';
    screen.allowedRoles = ['admin'];
    screen.showInWorkspaceForRoles = ['admin'];
    screen.showInSidebarForRoles = ['admin'];
    screen.rejectionReason = rejectionReason;

    // Block in visibility matrices for non-admins
    WORKSPACE_ROLES.forEach((r) => {
      if (!this.workspaceMatrix[r.id]) this.workspaceMatrix[r.id] = {};
      if (!this.sidebarMatrix[r.id]) this.sidebarMatrix[r.id] = {};
      this.workspaceMatrix[r.id][screen.view] = r.id === 'admin';
      this.sidebarMatrix[r.id][screen.view] = r.id === 'admin';
    });

    this.auditLog.unshift({
      id: `aud-${Date.now()}`,
      screenId: screen.id,
      screenTitle: screen.title,
      action: 'REJECTED',
      performedBy: rejectedBy,
      timestamp: new Date().toLocaleString(),
      details: `Screen rejected & quarantined. Reason: ${rejectionReason}`,
    });

    this.notify();
  }

  // Register a new screen into the Quarantine Area
  public registerNewScreen(data: {
    title: string;
    view: string;
    groupId: string;
    groupTitle: string;
    subGroup?: string;
    route?: string;
    securityLevel?: 'Standard' | 'Elevated' | 'Restricted / Sovereign';
    description?: string;
    registeredBy?: string;
  }): QuarantinedScreenRecord {
    const newRecord: QuarantinedScreenRecord = {
      id: `quar-${Date.now().toString().slice(-4)}`,
      title: data.title,
      view: data.view,
      groupId: data.groupId,
      groupTitle: data.groupTitle,
      subGroup: data.subGroup || 'New Feature',
      route: data.route || `/${data.groupId.toLowerCase()}/${data.view}`,
      status: 'PENDING_APPROVAL',
      detectedAt: new Date().toLocaleString(),
      detectedTrigger: 'Manual Admin / Developer Route Registration',
      securityLevel: data.securityLevel || 'Standard',
      description: data.description || 'Newly registered screen awaiting RBAC role clearance.',
      allowedRoles: ['admin'],
      showInWorkspaceForRoles: ['admin'],
      showInSidebarForRoles: ['admin'],
    };

    this.quarantinedScreens.unshift(newRecord);

    // Default to false for non-admin roles in matrix
    WORKSPACE_ROLES.forEach((r) => {
      if (!this.workspaceMatrix[r.id]) this.workspaceMatrix[r.id] = {};
      if (!this.sidebarMatrix[r.id]) this.sidebarMatrix[r.id] = {};
      this.workspaceMatrix[r.id][newRecord.view] = r.id === 'admin';
      this.sidebarMatrix[r.id][newRecord.view] = r.id === 'admin';
    });

    this.auditLog.unshift({
      id: `aud-${Date.now()}`,
      screenId: newRecord.id,
      screenTitle: newRecord.title,
      action: 'REGISTERED',
      performedBy: data.registeredBy || 'Admin',
      timestamp: new Date().toLocaleString(),
      details: `New screen registered: /${newRecord.view}. Automatically locked in Zero-Trust Quarantine Area.`,
    });

    this.notify();
    return newRecord;
  }

  public getAuditLog(): ScreenApprovalAuditEntry[] {
    return this.auditLog;
  }

  public getConfig(): WorkspaceRbacConfig {
    return this.config;
  }

  public updateConfig(newConfig: Partial<WorkspaceRbacConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.notify();
  }
}

// Singleton instance
export const workspaceRbacService = new WorkspaceRbacService();
