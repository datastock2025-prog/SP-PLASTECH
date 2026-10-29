import { createMongoAbility, type MongoAbility } from '@casl/ability';
import type { AbilityRule } from './types';

export type AppAction =
  | 'manage'
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'export'
  | 'import'
  | 'reset-password'
  | 'lock';

export type AppSubject =
  | 'all'
  | 'User'
  | 'Role'
  | 'UserGroup'
  | 'SecurityPolicy'
  | 'Session'
  | 'SoDRule'
  | 'Plant'
  | 'Warehouse'
  | 'WarehouseBin'
  | 'Item'
  | 'BillOfMaterial'
  | 'Customer'
  | 'Supplier'
  | 'Machine'
  | 'WorkOrder'
  | 'SalesOrder'
  | 'PurchaseOrder'
  | 'Quality'
  | 'Finance'
  | 'Preference'
  | 'Dashboard'
  | 'SystemParameter'
  | string;

export type AppAbility = MongoAbility<[AppAction, AppSubject]>;

/**
 * Builds a strict CASL MongoAbility from server-authoritative AbilityRule[]
 */
export function buildAbilityFromRules(rules?: AbilityRule[] | null): AppAbility {
  if (!rules || rules.length === 0) {
    return createMongoAbility<[AppAction, AppSubject]>([]);
  }

  const rawRules = rules.map((r) => ({
    action: r.action as any,
    subject: r.subject as any,
    conditions: r.conditions,
    inverted: r.inverted,
  }));

  return createMongoAbility<[AppAction, AppSubject]>(rawRules as any);
}

/**
 * Maps frontend application views to required CASL action & subject
 */
export function getSubjectForView(view: string): { action: AppAction; subject: AppSubject } | null {
  // Universal workspace views accessible to all authenticated users
  const universal = [
    'home',
    'tasks',
    'approvals',
    'notifications',
    'savedViews',
    'recentRecords',
    'architectureGuide',
    'aiPromptBuilder',
    'promptBuilder',
    'aiAssistant',
    'myProfile',
    'userProfile',
    'profilePreferences',
    'userPreferences',
  ];
  if (universal.includes(view)) {
    return null;
  }

  // Admin Workspace Settings
  if (view.startsWith('admin')) {
    if (view === 'adminUsers') return { action: 'read', subject: 'User' };
    if (view === 'adminUserGroups') return { action: 'read', subject: 'UserGroup' };
    if (
      view === 'adminRbac' ||
      view === 'adminApprovalWorkflows' ||
      view === 'adminWorkspaceRbac' ||
      view === 'adminRbacMatrix' ||
      view === 'adminRbacSecurity'
    ) {
      return { action: 'read', subject: 'Role' };
    }
    if (view === 'adminSecurity' || view === 'adminMfa') return { action: 'read', subject: 'SecurityPolicy' };
    if (view === 'adminWarehouseLocations') return { action: 'read', subject: 'Warehouse' };
    if (view === 'adminPlantBranch') return { action: 'read', subject: 'Plant' };
    if (view === 'adminMachines' || view === 'adminWorkCenters') return { action: 'read', subject: 'Machine' };
    return { action: 'manage', subject: 'SystemParameter' };
  }

  // Master Data & Engineering
  if (['itemList', 'itemDetail', 'items'].includes(view)) return { action: 'read', subject: 'Item' };
  if (['bomList', 'bomDetail', 'createBom', 'bomWizard', 'bomCostRollup'].includes(view)) {
    return { action: 'read', subject: 'BillOfMaterial' };
  }

  // Manufacturing & Shopfloor
  if (['machineList', 'machineDetail', 'machines', 'oeeTracker'].includes(view)) {
    return { action: 'read', subject: 'Machine' };
  }
  if (['woList', 'woDetail', 'workOrders', 'jobCard', 'shopFloorDispatches'].includes(view)) {
    return { action: 'read', subject: 'WorkOrder' };
  }

  // Sales
  if (
    [
      'soList',
      'soDetail',
      'salesOrders',
      'salesOrderCreate',
      'quotations',
      'soWizard',
      'soCreate',
      'createSO',
      'newSO',
    ].includes(view)
  ) {
    return { action: 'read', subject: 'SalesOrder' };
  }
  if (['customerList', 'customerDetail'].includes(view)) return { action: 'read', subject: 'Customer' };

  // Procurement & SCM
  if (['poList', 'poDetail', 'purchaseOrders', 'purchaseReqList', 'rfq', 'prDetail', 'prCreate', 'newPR'].includes(view)) {
    return { action: 'read', subject: 'PurchaseOrder' };
  }
  if (['supplierList', 'supplierDetail'].includes(view)) return { action: 'read', subject: 'Supplier' };
  if (['warehouseList', 'warehouseLocations', 'stockLedger', 'materialTransfer', 'goodsReceipt'].includes(view)) {
    return { action: 'read', subject: 'Warehouse' };
  }

  // Quality
  if (['ncrList', 'ncrDetail', 'capaList', 'qcoaList', 'inspectionRuns'].includes(view)) {
    return { action: 'read', subject: 'Quality' };
  }

  // Finance
  if (['coaList', 'jeList', 'arAging', 'apAging', 'financialStatements', 'accountDetail', 'jeDetail'].includes(view)) {
    return { action: 'read', subject: 'Finance' };
  }

  return null;
}

