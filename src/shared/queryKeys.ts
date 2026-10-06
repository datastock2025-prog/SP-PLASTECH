// ============================================================================
// TYPED TANSTACK REACT QUERY (v5) QUERY KEY FACTORIES — SP-PLASTECH ERP
// ============================================================================

export const queryKeys = {
  // 1. Authentication & Session
  auth: {
    all: ['auth'] as const,
    session: () => [...queryKeys.auth.all, 'session'] as const,
    profile: () => [...queryKeys.auth.all, 'profile'] as const,
    permissions: () => [...queryKeys.auth.all, 'permissions'] as const,
  },

  // 2. Executive Dashboard & KPIs
  dashboard: {
    all: ['dashboard'] as const,
    kpis: (plantId?: string) => [...queryKeys.dashboard.all, 'kpis', { plantId }] as const,
    tasks: () => [...queryKeys.dashboard.all, 'tasks'] as const,
    approvals: () => [...queryKeys.dashboard.all, 'approvals'] as const,
    notifications: () => [...queryKeys.dashboard.all, 'notifications'] as const,
  },

  // 3. Sales & Customer Management
  sales: {
    all: ['sales'] as const,
    orders: (filter?: any) => [...queryKeys.sales.all, 'orders', { filter }] as const,
    orderDetail: (id: string) => [...queryKeys.sales.all, 'order', id] as const,
    quotations: (filter?: any) => [...queryKeys.sales.all, 'quotations', { filter }] as const,
    customers: () => [...queryKeys.sales.all, 'customers'] as const,
    customerDetail: (id: string) => [...queryKeys.sales.all, 'customer', id] as const,
    rmas: () => [...queryKeys.sales.all, 'rmas'] as const,
    monthlyPlans: (plantId?: string) => [...queryKeys.sales.all, 'monthlyPlans', { plantId }] as const,
  },

  // 4. Engineering & BOM Management
  engineering: {
    all: ['engineering'] as const,
    boms: (filter?: any) => [...queryKeys.engineering.all, 'boms', { filter }] as const,
    bomDetail: (id: string) => [...queryKeys.engineering.all, 'bom', id] as const,
    recipes: () => [...queryKeys.engineering.all, 'recipes'] as const,
    ecrs: () => [...queryKeys.engineering.all, 'ecrs'] as const,
    ecos: () => [...queryKeys.engineering.all, 'ecos'] as const,
    routings: () => [...queryKeys.engineering.all, 'routings'] as const,
  },

  // 5. Planning & MRP
  planning: {
    all: ['planning'] as const,
    jitSchedule: (plantId?: string) => [...queryKeys.planning.all, 'jit', { plantId }] as const,
    mrpRuns: () => [...queryKeys.planning.all, 'mrp'] as const,
    demandForecast: () => [...queryKeys.planning.all, 'forecast'] as const,
  },

  // 6. Manufacturing (MES)
  manufacturing: {
    all: ['manufacturing'] as const,
    workOrders: (status?: string) => [...queryKeys.manufacturing.all, 'workOrders', { status }] as const,
    workOrderDetail: (id: string) => [...queryKeys.manufacturing.all, 'workOrder', id] as const,
    shopFloorLive: (machineId?: string) => [...queryKeys.manufacturing.all, 'shopFloor', { machineId }] as const,
    regrindMaterials: () => [...queryKeys.manufacturing.all, 'regrind'] as const,
    downtimeLogs: () => [...queryKeys.manufacturing.all, 'downtime'] as const,
    genealogy: (lotNumber: string) => [...queryKeys.manufacturing.all, 'genealogy', lotNumber] as const,
  },

  // 7. Quality & SPC
  quality: {
    all: ['quality'] as const,
    dashboard: () => [...queryKeys.quality.all, 'dashboard'] as const,
    ncrs: (filter?: any) => [...queryKeys.quality.all, 'ncrs', { filter }] as const,
    ncrDetail: (id: string) => [...queryKeys.quality.all, 'ncr', id] as const,
    capas: (filter?: any) => [...queryKeys.quality.all, 'capas', { filter }] as const,
    coas: (filter?: any) => [...queryKeys.quality.all, 'coas', { filter }] as const,
    inspectionPlans: () => [...queryKeys.quality.all, 'inspectionPlans'] as const,
    wipInspections: () => [...queryKeys.quality.all, 'wipInspections'] as const,
    spcTelemetry: (itemCode?: string) => [...queryKeys.quality.all, 'spc', { itemCode }] as const,
  },

  // 8. Procurement & Suppliers
  procurement: {
    all: ['procurement'] as const,
    purchaseOrders: (filter?: any) => [...queryKeys.procurement.all, 'pos', { filter }] as const,
    purchaseOrderDetail: (id: string) => [...queryKeys.procurement.all, 'po', id] as const,
    suppliers: () => [...queryKeys.procurement.all, 'suppliers'] as const,
    supplierDetail: (id: string) => [...queryKeys.procurement.all, 'supplier', id] as const,
    requisitions: () => [...queryKeys.procurement.all, 'prs'] as const,
    priceLists: () => [...queryKeys.procurement.all, 'priceLists'] as const,
  },

  // 9. Warehouse & Inventory
  warehouse: {
    all: ['warehouse'] as const,
    stock: (filter?: any) => [...queryKeys.warehouse.all, 'stock', { filter }] as const,
    stockLedger: (filter?: any) => [...queryKeys.warehouse.all, 'stockLedger', { filter }] as const,
    bins: () => [...queryKeys.warehouse.all, 'bins'] as const,
    transfers: () => [...queryKeys.warehouse.all, 'transfers'] as const,
    quarantine: () => [...queryKeys.warehouse.all, 'quarantine'] as const,
  },

  // 10. SCM & Logistics
  scm: {
    all: ['scm'] as const,
    controlTower: () => [...queryKeys.scm.all, 'controlTower'] as const,
    gatePasses: () => [...queryKeys.scm.all, 'gatePasses'] as const,
    deliveries: () => [...queryKeys.scm.all, 'deliveries'] as const,
    ewayBills: () => [...queryKeys.scm.all, 'ewayBills'] as const,
  },

  // 11. MEP & Toolroom Maintenance
  mep: {
    all: ['mep'] as const,
    workOrders: () => [...queryKeys.mep.all, 'workOrders'] as const,
    molds: () => [...queryKeys.mep.all, 'molds'] as const,
    maintenanceSchedules: () => [...queryKeys.mep.all, 'schedules'] as const,
  },

  // 12. Finance & General Ledger
  finance: {
    all: ['finance'] as const,
    accounts: () => [...queryKeys.finance.all, 'accounts'] as const,
    journalEntries: (filter?: any) => [...queryKeys.finance.all, 'journals', { filter }] as const,
    agingReport: (type: 'AR' | 'AP') => [...queryKeys.finance.all, 'aging', type] as const,
    taxReturns: () => [...queryKeys.finance.all, 'tax'] as const,
  },

  // 13. Human Resources
  hr: {
    all: ['hr'] as const,
    employees: () => [...queryKeys.hr.all, 'employees'] as const,
    attendance: (date?: string) => [...queryKeys.hr.all, 'attendance', { date }] as const,
    shiftRosters: () => [...queryKeys.hr.all, 'rosters'] as const,
    payroll: (month?: string) => [...queryKeys.hr.all, 'payroll', { month }] as const,
  },

  // 14. Master Data
  masterData: {
    all: ['masterData'] as const,
    items: (filter?: any) => [...queryKeys.masterData.all, 'items', { filter }] as const,
    itemDetail: (code: string) => [...queryKeys.masterData.all, 'item', code] as const,
    machines: () => [...queryKeys.masterData.all, 'machines'] as const,
    reasons: () => [...queryKeys.masterData.all, 'reasons'] as const,
  },

  // 15. Analytics & Live OEE
  analytics: {
    all: ['analytics'] as const,
    oeeStream: (plantId?: string) => [...queryKeys.analytics.all, 'oee', { plantId }] as const,
    kpiReports: () => [...queryKeys.analytics.all, 'reports'] as const,
  },

  // 16. System Administration & RBAC
  admin: {
    all: ['admin'] as const,
    dashboard: () => [...queryKeys.admin.all, 'dashboard'] as const,
    healthMetrics: () => [...queryKeys.admin.all, 'healthMetrics'] as const,
    searchIndex: () => [...queryKeys.admin.all, 'searchIndex'] as const,
    users: (filters?: Record<string, any>) => [...queryKeys.admin.all, 'users', { filters }] as const,
    user: (id: string) => [...queryKeys.admin.all, 'user', id] as const,
    roles: () => [...queryKeys.admin.all, 'roles'] as const,
    role: (id: string) => [...queryKeys.admin.all, 'role', id] as const,
    sodRules: () => [...queryKeys.admin.all, 'sodRules'] as const,
    sodViolations: () => [...queryKeys.admin.all, 'sodViolations'] as const,
    userGroups: () => [...queryKeys.admin.all, 'userGroups'] as const,
    plants: () => [...queryKeys.admin.all, 'plants'] as const,
    plant: (id: string) => [...queryKeys.admin.all, 'plant', id] as const,
    warehouses: () => [...queryKeys.admin.all, 'warehouses'] as const,
    warehouse: (id: string) => [...queryKeys.admin.all, 'warehouse', id] as const,
    machines: (plantId?: string) => [...queryKeys.admin.all, 'machines', { plantId }] as const,
    machine: (id: string) => [...queryKeys.admin.all, 'machine', id] as const,
    shifts: (plantId?: string) => [...queryKeys.admin.all, 'shifts', { plantId }] as const,
    holidays: (plantId?: string) => [...queryKeys.admin.all, 'holidays', { plantId }] as const,
    reasonCodes: (category?: string) => [...queryKeys.admin.all, 'reasonCodes', { category }] as const,
    masterDataRules: () => [...queryKeys.admin.all, 'masterDataRules'] as const,
    transporters: () => [...queryKeys.admin.all, 'transporters'] as const,
    numberingSeries: () => [...queryKeys.admin.all, 'numberingSeries'] as const,
    workflows: () => [...queryKeys.admin.all, 'workflows'] as const,
    securityPolicy: () => [...queryKeys.admin.all, 'securityPolicy'] as const,
    loginAudit: (params?: Record<string, any>) => [...queryKeys.admin.all, 'loginAudit', { params }] as const,
    auditLogs: (filter?: any) => [...queryKeys.admin.all, 'auditLogs', { filter }] as const,
    integrations: () => [...queryKeys.admin.all, 'integrations'] as const,
    dataJobs: () => [...queryKeys.admin.all, 'dataJobs'] as const,
    documentSettings: () => [...queryKeys.admin.all, 'documentSettings'] as const,
    backupRetention: () => [...queryKeys.admin.all, 'backupRetention'] as const,
    license: () => [...queryKeys.admin.all, 'license'] as const,
    companyProfile: () => [...queryKeys.admin.all, 'companyProfile'] as const,
    systemSettings: () => [...queryKeys.admin.all, 'settings'] as const,
    systemParameters: () => [...queryKeys.admin.all, 'systemParameters'] as const,
    quickActions: () => [...queryKeys.admin.all, 'quickActions'] as const,
    multiContext: () => [...queryKeys.admin.all, 'multiContext'] as const,
    workspaceRbac: () => [...queryKeys.admin.all, 'workspaceRbac'] as const,
    notificationTemplates: () => [...queryKeys.admin.all, 'notificationTemplates'] as const,
  },
};
