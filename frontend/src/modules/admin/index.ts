// ============================================================================
// DOMAIN MODULE: ADMIN, SECURITY & SYSTEM GOVERNANCE
// Modular Monolithic Architecture — Reboot ERP
// ============================================================================
export { AdminViews } from '../../../apps/web/src/modules/identity';
export {
  systemHealth,
  adminUsers,
  adminRoles,
  companyProfile,
  numberingSequences,
  approvalWorkflows,
  securityPolicy,
  auditLogs,
  integrations,
  backupRecords,
  notificationTemplates,
  systemParameters,
} from '../../data/adminData';
export {
  userGroups,
  workflowConfigs,
  warehouseLocations,
  machineWorkCenters,
  shifts,
  holidays,
  reasonCodes,
  masterDataRecords,
  documentPolicies,
  loginAuditRecords,
  dataExchangeJobs,
  retentionPolicies,
  licenseDetails,
  sodRules,
  sodViolations,
  multiContextPolicies,
  rowLevelSecurityRules,
  breakGlassRequests,
} from '../../data/adminExtendedData';

export type {
  AdminSystemHealth,
  AdminUser,
  AdminRole,
  CompanyProfile,
  NumberingSequence,
  ApprovalWorkflow,
  SecurityPolicySettings,
  AuditLogEntry,
  IntegrationConnector,
  BackupRecord,
  NotificationTemplate,
  SystemParameter,
  RoleSimulationScenario,
  SodConflictRule,
  SodViolation,
  MultiContextScopePolicy,
  RowLevelSecurityRule,
  BreakGlassRequest,
} from '../../types/admin';
