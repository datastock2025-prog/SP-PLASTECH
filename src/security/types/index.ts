/**
 * Complete Security & Authentication Types for Enterprise ERP
 * Compliant with GDPR, SOC2, HIPAA, ISO 27001
 */

export type UserRole =
  | 'SUPER_ADMIN'
  | 'COMPANY_ADMIN'
  | 'HR_MANAGER'
  | 'FINANCE_CONTROLLER'
  | 'ACCOUNTANT'
  | 'PLANT_HEAD'
  | 'PRODUCTION_MANAGER'
  | 'QUALITY_MANAGER'
  | 'MAINTENANCE_ENGINEER'
  | 'LOGISTICS_MANAGER'
  | 'WAREHOUSE_SUPERVISOR'
  | 'PROCUREMENT_OFFICER'
  | 'SALES_DIRECTOR'
  | 'INTERNAL_AUDITOR'
  | 'OPERATOR'
  | 'GUEST';

export type Permission =
  // User & Tenant Admin
  | 'users.view' | 'users.create' | 'users.edit' | 'users.delete' | 'users.impersonate'
  | 'roles.manage' | 'tenant.config' | 'audit.view' | 'audit.export'
  // Finance & Accounting
  | 'finance.view' | 'finance.create' | 'finance.edit' | 'finance.delete' | 'finance.approve' | 'finance.export' | 'payroll.view' | 'payroll.process'
  // Sales & Procurement
  | 'sales.view' | 'sales.create' | 'sales.edit' | 'sales.delete' | 'sales.approve' | 'sales.export'
  | 'procurement.view' | 'procurement.create' | 'procurement.edit' | 'procurement.delete' | 'procurement.approve'
  // Manufacturing & Planning
  | 'mfg.view' | 'mfg.plan' | 'mfg.schedule' | 'mfg.execute' | 'mfg.abort'
  // Quality Assurance
  | 'quality.view' | 'quality.inspect' | 'quality.release' | 'quality.reject' | 'quality.ncr'
  // Warehouse & Stock Transfer
  | 'warehouse.view' | 'warehouse.transfer' | 'warehouse.dispatch' | 'warehouse.receive' | 'warehouse.reconcile' | 'warehouse.audit'
  // Reports & Compliance
  | 'reports.view' | 'reports.export' | 'reports.sensitive' | 'compliance.manage';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  name?: string;
  tenantId: string;
  tenantName: string;
  role: UserRole;
  permissions: Permission[];
  avatarUrl?: string;
  mfaEnabled: boolean;
  mfaMethods: ('TOTP' | 'SMS' | 'EMAIL')[];
  lastLoginAt: string;
  lastLoginIp: string;
  isImpersonated?: boolean;
  impersonatedBy?: string;
  sessionExpiry: number;
}

export interface AuthSession {
  sessionId: string;
  userId: string;
  deviceId: string;
  deviceInfo: string;
  ipAddress: string;
  location: string;
  createdAt: string;
  lastActiveAt: string;
  isCurrent: boolean;
  rememberMe: boolean;
}

export interface MfaChallenge {
  challengeId: string;
  requiredMethod: 'TOTP' | 'SMS' | 'EMAIL';
  actionName?: string;
  expiresAt: number;
}

export interface MfaSetupData {
  secret: string;
  qrCodeUrl: string;
  recoveryCodes: string[];
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  eventType:
    | 'AUTH_LOGIN_SUCCESS'
    | 'AUTH_LOGIN_FAILURE'
    | 'AUTH_LOGOUT'
    | 'AUTH_TOKEN_REFRESH'
    | 'AUTH_MFA_CHALLENGE'
    | 'RBAC_PERMISSION_DENIED'
    | 'RBAC_ROUTE_BLOCKED'
    | 'DATA_SENSITIVE_VIEW'
    | 'DATA_EXPORT'
    | 'DATA_PII_UNMASK'
    | 'SECURITY_IDOR_ATTEMPT'
    | 'SECURITY_XSS_DETECTED'
    | 'ADMIN_IMPERSONATION_START'
    | 'ADMIN_IMPERSONATION_END'
    | string;
  type?: string;
  actorId?: string;
  ip?: string;
  userId?: string;
  tenantId?: string;
  resource?: string;
  ipAddress?: string;
  details?: Record<string, any>;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'WARN';
}

export interface PasswordValidationResult {
  score: number; // 0 - 4
  isValid: boolean;
  hasMinLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  hasNoCommonWords: boolean;
  feedback: string[];
}

export interface CookieConsentPreferences {
  essential: boolean; // Always true
  analytics: boolean;
  functional: boolean;
  timestamp: string;
  version: string;
}

export type CookieConsent = CookieConsentPreferences;

