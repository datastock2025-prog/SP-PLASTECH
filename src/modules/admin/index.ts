// ============================================================================
// DOMAIN MODULE: ADMIN, SECURITY & SYSTEM GOVERNANCE
// Modular Monolithic Architecture — Reboot ERP
// ============================================================================

export { AdminViews } from '../../components/AdminViews';
export {
  mockSystemHealth,
  mockAdminUsers,
  mockAdminRoles,
  mockCompanyProfile,
  mockNumberingSequences,
  mockApprovalWorkflows,
  mockSecurityPolicy,
  mockAuditLogs,
  mockIntegrations,
  mockBackupRecords,
  mockNotificationTemplates,
  mockSystemParameters,
} from '../../data/mockAdminData';
export {
  mockUserGroups,
  mockWorkflowConfigs,
  mockWarehouseLocations,
  mockMachineWorkCenters,
  mockShifts,
  mockHolidays,
  mockReasonCodes,
  mockMasterDataRecords,
  mockDocumentPolicies,
  mockLoginAuditRecords,
  mockDataExchangeJobs,
  mockRetentionPolicies,
  mockLicenseDetails,
  mockSodRules,
  mockSodViolations,
  mockSimulationScenarios,
  mockMultiContextPolicies,
  mockRowLevelSecurityRules,
  mockBreakGlassRequests,
} from '../../data/mockAdminExtendedData';

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
