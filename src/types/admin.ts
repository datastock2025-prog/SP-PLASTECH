export type AdminModuleCategory =
  | 'Dashboard'
  | 'Users'
  | 'Roles & RBAC'
  | 'Company & Plants'
  | 'Document Numbering'
  | 'Approval Workflows'
  | 'Security & MFA'
  | 'Audit Logs'
  | 'Integrations & APIs'
  | 'Backups & Recovery'
  | 'Notification Templates'
  | 'System Parameters';

export interface SystemMetric {
  name: string;
  value: number | string;
  unit?: string;
  status: 'optimal' | 'warning' | 'critical';
  trend?: string;
}

export interface AdminSystemHealth {
  serverStatus: 'Operational' | 'Degraded' | 'Maintenance';
  uptimeSeconds: number;
  uptimeFormatted: string;
  cpuUsagePct: number;
  memoryUsagePct: number;
  memoryUsedGb: number;
  memoryTotalGb: number;
  diskUsagePct: number;
  diskUsedGb: number;
  diskTotalGb: number;
  activeSessionsCount: number;
  databaseConnections: number;
  dbLatencyMs: number;
  backgroundJobsPending: number;
  backgroundJobsProcessing: number;
  backgroundJobsFailed: number;
  lastBackupTime: string;
  sslCertificateExpiryDays: number;
}

export interface AdminUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  roleId: string;
  roleName: string;
  plantIds: string[];
  plantNames: string[];
  assignedShift: string;
  status: 'Active' | 'Suspended' | 'Locked' | 'Pending Activation';
  mfaEnabled: boolean;
  mfaMethod?: 'Authenticator App (TOTP)' | 'SMS OTP' | 'Hardware Security Key' | 'None';
  lastLoginDate: string;
  lastLoginIp: string;
  createdDate: string;
  avatarColor: string;
  initials: string;
  failedLoginAttempts: number;
}

export interface ModulePermission {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  approve: boolean;
  export: boolean;
}

export interface AdminRole {
  id: string;
  name: string;
  code: string;
  description: string;
  isSystemRole: boolean;
  userCount: number;
  createdDate: string;
  permissions: Record<string, ModulePermission>;
}

export interface PlantDetails {
  id: string;
  plantCode: string;
  plantName: string;
  division: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  totalMachines: number;
  activeLines: number;
  shifts: string[];
  defaultWarehouseId: string;
  defaultWarehouseName: string;
  isHeadquarters: boolean;
  operationalStatus: 'Fully Operational' | 'Partial Maintenance' | 'Offline';
}

export interface CompanyProfile {
  companyName: string;
  legalEntityName: string;
  brandName: string;
  cin: string;
  pan: string;
  gstinCorporate: string;
  tan: string;
  registeredOffice: string;
  corporateOffice: string;
  website: string;
  supportEmail: string;
  contactNumber: string;
  fiscalYearStartMonth: string;
  baseCurrency: string;
  currencySymbol: string;
  timeZone: string;
  dateFormat: string;
  plants: PlantDetails[];
}

export interface NumberingSequence {
  id: string;
  documentType: string;
  module: string;
  prefix: string;
  suffix?: string;
  currentSequence: number;
  zeroPadding: number;
  resetFrequency: 'Never' | 'Yearly (Jan-Dec)' | 'Fiscal Year (Apr-Mar)' | 'Monthly';
  samplePreview: string;
  allowManualOverride: boolean;
  lastGeneratedOn: string;
  notes?: string;
}

export interface ApprovalTier {
  tierLevel: number;
  tierName: string;
  approverRoleId: string;
  approverRoleName: string;
  specificApproverId?: string;
  specificApproverName?: string;
  conditionDescription: string;
  thresholdAmount?: number;
  slaHours: number;
  autoEscalateAfterSla: boolean;
  escalationTargetRole?: string;
}

export interface ApprovalWorkflow {
  id: string;
  workflowName: string;
  module: 'Procurement' | 'Sales' | 'Engineering' | 'Finance' | 'Quality' | 'HR';
  documentType: string;
  description: string;
  triggerCondition: string;
  isActive: boolean;
  tiers: ApprovalTier[];
  lastModifiedDate: string;
  modifiedBy: string;
}

export interface SecurityPolicySettings {
  minPasswordLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  passwordExpiryDays: number;
  enforcePasswordHistoryCount: number;
  maxFailedAttemptsBeforeLockout: number;
  lockoutDurationMinutes: number;
  sessionTimeoutMinutes: number;
  singleActiveSessionPerUser: boolean;
  mfaEnforcement: 'Enforced for All' | 'Enforced for Admins & Finance' | 'Optional';
  ipWhitelistEnabled: boolean;
  allowedIpRanges: string[];
  corsAllowedOrigins: string[];
  jwtTokenExpiryHours: number;
  auditLogRetentionDays: number;
  soc2ComplianceLogging: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  userEmail: string;
  ipAddress: string;
  userAgent: string;
  module: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'APPROVE' | 'REJECT' | 'EXPORT' | 'PASSWORD_RESET' | 'PERMISSION_CHANGE';
  resourceType: string;
  resourceId: string;
  resourceName: string;
  status: 'SUCCESS' | 'FAILED' | 'WARNING';
  description: string;
  changes?: {
    field: string;
    oldValue: string | number | boolean | null;
    newValue: string | number | boolean | null;
  }[];
}

export interface IntegrationConnector {
  id: string;
  name: string;
  serviceCategory: 'ERP & Accounting' | 'Government Compliance' | 'Hardware & IoT' | 'Market Data' | 'Messaging & Alerts';
  provider: string;
  status: 'Connected' | 'Disconnected' | 'Error' | 'Syncing';
  endpointUrl: string;
  authType: 'OAuth2' | 'API Key / Token' | 'mTLS / Certificate' | 'Basic Auth';
  syncFrequency: 'Real-time Webhook' | 'Every 15 Minutes' | 'Hourly Batch' | 'Daily at Midnight' | 'Manual';
  lastSyncTime: string;
  lastSyncStatus: 'OK' | 'Warnings' | 'Failed';
  recordsSyncedToday: number;
  errorMessage?: string;
  description: string;
}

export interface BackupRecord {
  id: string;
  backupCode: string;
  backupType: 'Full Database Snapshot' | 'Incremental Transaction Log' | 'Media & CAD Drawings' | 'Audit Archive';
  creationTimestamp: string;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  storageTarget: 'AWS S3 (Primary EU/AP)' | 'Google Cloud Storage (Coldline)' | 'On-Premises NAS Vault';
  status: 'Completed' | 'In Progress' | 'Failed';
  verifiedChecksum: boolean;
  retentionUntil: string;
  triggeredBy: 'Automated Cron' | 'Admin Manual';
}

export interface NotificationTemplate {
  id: string;
  templateCode: string;
  templateName: string;
  module: string;
  triggerEvent: string;
  channels: {
    inApp: boolean;
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
  emailSubject: string;
  messageBody: string;
  availablePlaceholders: string[];
  recipientRoles: string[];
  isActive: boolean;
  lastUpdated: string;
}

export interface SystemParameter {
  id: string;
  key: string;
  name: string;
  category: 'Inventory & Traceability' | 'Production & Shop Floor' | 'Finance & Valuation' | 'Quality & AQL' | 'General System';
  description: string;
  valueType: 'boolean' | 'number' | 'string' | 'select';
  currentValue: any;
  defaultValue: any;
  options?: string[];
  requiresServerRestart: boolean;
  unit?: string;
}

// RBAC Simulator & Sandbox Types
export interface RoleSimulationScenario {
  id: string;
  name: string;
  description: string;
  userId?: string;
  roleIds: string[];
  plantId: string;
  shift: string;
  module: string;
  resource: string;
  action: 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export' | 'admin';
  expectedVerdict: 'PERMIT' | 'DENY' | 'REQUIRES_DUAL_AUTH' | 'MFA_STEP_UP_REQUIRED';
}

export interface SimulationVerdict {
  verdict: 'PERMIT' | 'DENY' | 'REQUIRES_DUAL_AUTH' | 'MFA_STEP_UP_REQUIRED';
  matchedRole: string;
  reason: string;
  policyPath: string;
  evaluatedAt: string;
  conditionsChecked: { name: string; passed: boolean; detail: string }[];
}

export interface SodConflictRule {
  id: string;
  code: string;
  name: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  conflictingRoles: string[];
  conflictingActions: { module: string; action: string }[];
  regulatoryStandard: 'SOX 404' | 'IATF 16949' | 'ISO 27001' | 'GMP Annex 11';
}

export interface SodViolation {
  id: string;
  ruleCode: string;
  ruleName: string;
  userName: string;
  userEmail: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  rolesAssigned: string[];
  detectedOn: string;
  status: 'Open' | 'Mitigated' | 'Exception Approved';
  mitigatingControl?: string;
}

// Multi-Context & Security Governance Types
export interface MultiContextScopePolicy {
  id: string;
  contextName: string;
  contextType: 'Plant Entity' | 'Business Unit' | 'Warehouse Division' | 'HQ Corporate';
  code: string;
  location: string;
  ipSubnets: string[];
  operatingHours: string;
  enforceGeofence: boolean;
  mfaRequired: boolean;
  assignedUsersCount: number;
  dataIsolationLevel: 'Strict Partitioned' | 'Federated Read' | 'Global Master';
  activeSessions: number;
}

export interface RowLevelSecurityRule {
  id: string;
  tableName: string;
  ruleName: string;
  applicableRoles: string[];
  filterCondition: string;
  targetContext: string;
  isActive: boolean;
  lastUpdated: string;
}

export interface BreakGlassRequest {
  id: string;
  ticketNumber: string;
  requestedBy: string;
  roleElevatedTo: string;
  reason: string;
  targetPlant: string;
  validForHours: number;
  approvedBy: string;
  status: 'Active' | 'Expired' | 'Revoked' | 'Pending';
  requestedAt: string;
  expiresAt: string;
}

