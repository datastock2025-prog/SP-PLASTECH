import axios, { AxiosInstance } from 'axios';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api';

// ============================================================================
// TypeScript Interfaces for Administration Module (All 23 Screens)
// ============================================================================
export interface AdminUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  phone?: string;
  designation?: string;
  department: string;
  roleId: string;
  roleName?: string;
  tenantId: string;
  plantIds: string[];
  assignedShift?: string;
  badgeId?: string;
  avatarColor?: string;
  initials?: string;
  status: string;
  mfaEnabled: boolean;
  mfaMethod?: string;
  failedLoginAttempts?: number;
  isLocked?: boolean;
  lastLoginAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface UserGroup {
  id: string;
  tenantId: string;
  groupCode: string;
  groupName: string;
  groupType: string;
  description?: string;
  plantId?: string;
  supervisorId?: string;
  maxMembers: number;
  memberCount?: number;
  isActive: boolean;
  createdAt: string;
}

export interface AuthRole {
  id: string;
  name: string;
  description?: string;
  scope: string;
  department: string;
  isSystemRole: boolean;
  permissions: string[];
  userCount?: number;
  createdAt: string;
}

export interface SecurityContext {
  id: string;
  tenantId: string;
  contextType: string;
  contextId: string;
  contextName: string;
  description?: string;
  isActive: boolean;
}

export interface ApprovalWorkflow {
  id: string;
  tenantId: string;
  name: string;
  module: string;
  documentType: string;
  description?: string;
  minAmount: number;
  maxAmount?: number;
  conditionFormula?: string;
  slaHoursTotal: number;
  tiers: any[];
  isActive: boolean;
  createdAt: string;
}

export interface CompanyProfile {
  tenantId: string;
  companyCode: string;
  legalName: string;
  tradeName?: string;
  registrationNo?: string;
  gstin?: string;
  pan?: string;
  tan?: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  pincode?: string;
  phone?: string;
  email?: string;
  website?: string;
  bankName?: string;
  bankAccount?: string;
  bankIfsc?: string;
  logoUrl?: string;
}

export interface PlantFacility {
  id: string;
  code: string;
  name: string;
  location: string;
  entityType: string;
  address?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  gstin?: string;
  capacityRating?: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface Warehouse {
  id: string;
  plantId: string;
  warehouseCode: string;
  warehouseName: string;
  warehouseType: string;
  location?: string;
  capacity: number;
  capacityUom: string;
  isTemperatureControlled: boolean;
  isActive: boolean;
}

export interface MachineRegistry {
  id: string;
  plantId: string;
  machineCode: string;
  machineName: string;
  machineType: string;
  manufacturer?: string;
  yearOfMfg?: number;
  tonnage: number;
  cavityCapacity: number;
  cycleTimeSec: number;
  powerRating: number;
  status: string;
  isOperational: boolean;
}

export interface ShiftDefinition {
  id: string;
  shiftCode: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  breakMinutes: number;
  isActive: boolean;
}

export interface ReasonCode {
  id: string;
  codeCategory: string;
  reasonCode: string;
  reasonDescription: string;
  isOeeImpact: boolean;
  isActive: boolean;
}

export interface NumberingSequence {
  id: string;
  tenantId: string;
  module: string;
  documentType: string;
  prefix: string;
  includeYear: boolean;
  yearFormat: string;
  includeMonth: boolean;
  separator: string;
  paddingLength: number;
  currentNumber: number;
  stepSize: number;
  resetFrequency: string;
  samplePreview: string;
  isActive: boolean;
}

export interface NotificationRule {
  id: string;
  ruleCode: string;
  ruleName: string;
  eventType: string;
  triggerCondition: Record<string, any>;
  channels: string[];
  recipients: string[];
  priority: number;
  isActive: boolean;
}

export interface GovernanceRule {
  id: string;
  ruleCode: string;
  ruleName: string;
  entityType: string;
  ruleType: string;
  condition: Record<string, any>;
  action: string;
  severity: string;
  isActive: boolean;
}

export interface ComplianceDocument {
  id: string;
  documentCode: string;
  documentName: string;
  documentType: string;
  category?: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  expiryDate?: string;
  tags: string[];
  isActive: boolean;
  createdAt: string;
}

export interface EmailConfig {
  id: string;
  configName: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  useTls: boolean;
  fromEmail: string;
  fromName: string;
  isActive: boolean;
}

export interface ApiKeyItem {
  id: string;
  keyName: string;
  service: string;
  permissions: string[];
  maskedKey: string;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CustomFieldDefinition {
  id: string;
  entityType: string;
  fieldCode: string;
  fieldName: string;
  fieldType: string;
  options: string[];
  isRequired: boolean;
  isSearchable: boolean;
  sortOrder: number;
  isActive: boolean;
}

// ============================================================================
// Administration API Client (Singleton Pattern)
// ============================================================================
export class AdministrationApi {
  private static instance: AdministrationApi;
  private api: AxiosInstance;

  private constructor() {
    this.api = axios.create({
      baseURL: API_BASE,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.api.interceptors.request.use((config) => {
      const tenantId = this.getActiveTenantId();
      const csrfToken = this.getCsrfToken();
      if (tenantId) config.headers['X-Tenant-ID'] = tenantId;
      if (csrfToken) config.headers['X-CSRF-Token'] = csrfToken;
      return config;
    });

    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            await axios.post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true });
            return this.api(originalRequest);
          } catch (refreshErr) {
            console.warn('[AdministrationApi] Session expired.');
          }
        }
        return Promise.reject(error);
      }
    );
  }

  public static getInstance(): AdministrationApi {
    if (!AdministrationApi.instance) {
      AdministrationApi.instance = new AdministrationApi();
    }
    return AdministrationApi.instance;
  }

  private getActiveTenantId(): string {
    return localStorage.getItem('reboot_tenant_id') || 'TENANT-ALPHA-IND';
  }

  private getCsrfToken(): string | null {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  // --------------------------------------------------------------------------
  // Screen 1: User Directory
  // --------------------------------------------------------------------------
  public async getUsers(tenantId?: string): Promise<{ success: boolean; users: AdminUser[] }> {
    const res = await this.api.get('/admin/users', { params: { tenantId } });
    return res.data;
  }

  public async getUserById(userId: string): Promise<{ success: boolean; user: AdminUser }> {
    const res = await this.api.get(`/admin/users/${userId}`);
    return res.data;
  }

  public async createUser(dto: Partial<AdminUser>): Promise<{ success: boolean; user: AdminUser }> {
    const res = await this.api.post('/admin/users', dto);
    return res.data;
  }

  public async updateUser(userId: string, dto: Partial<AdminUser>): Promise<{ success: boolean; user: AdminUser }> {
    const res = await this.api.put(`/admin/users/${userId}`, dto);
    return res.data;
  }

  public async deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
    const res = await this.api.delete(`/admin/users/${userId}`);
    return res.data;
  }

  public async resetUserPin(userId: string, pin: string = '1234'): Promise<{ success: boolean; message: string }> {
    const res = await this.api.post(`/admin/users/${userId}/reset-pin`, { pin });
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 2: User Groups
  // --------------------------------------------------------------------------
  public async getUserGroups(tenantId?: string): Promise<{ success: boolean; groups: UserGroup[] }> {
    const res = await this.api.get('/admin/user-groups', { params: { tenantId } });
    return res.data;
  }

  public async createUserGroup(dto: Partial<UserGroup>): Promise<{ success: boolean; group: UserGroup }> {
    const res = await this.api.post('/admin/user-groups', dto);
    return res.data;
  }

  public async addGroupMember(groupId: string, userId: string, role: string = 'MEMBER'): Promise<any> {
    const res = await this.api.post(`/admin/user-groups/${groupId}/members`, { userId, role });
    return res.data;
  }

  public async removeGroupMember(groupId: string, userId: string): Promise<any> {
    const res = await this.api.delete(`/admin/user-groups/${groupId}/members/${userId}`);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 3: Roles & Permissions
  // --------------------------------------------------------------------------
  public async getRoles(): Promise<{ success: boolean; roles: AuthRole[] }> {
    const res = await this.api.get('/admin/roles');
    return res.data;
  }

  public async createRole(dto: Partial<AuthRole>): Promise<{ success: boolean; role: AuthRole }> {
    const res = await this.api.post('/admin/roles', dto);
    return res.data;
  }

  public async updateRole(roleId: string, dto: Partial<AuthRole>): Promise<{ success: boolean; role: AuthRole }> {
    const res = await this.api.put(`/admin/roles/${roleId}`, dto);
    return res.data;
  }

  public async deleteRole(roleId: string): Promise<{ success: boolean; message: string }> {
    const res = await this.api.delete(`/admin/roles/${roleId}`);
    return res.data;
  }

  public async updateRolePermissions(roleId: string, permissions: string[]): Promise<any> {
    const res = await this.api.put(`/admin/roles/${roleId}/permissions`, { permissions });
    return res.data;
  }

  public async simulateRole(roleId: string, resource: string, action: string): Promise<any> {
    const res = await this.api.post('/admin/roles/simulate', { roleId, resource, action });
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 4: Multi-Context Security
  // --------------------------------------------------------------------------
  public async getContexts(tenantId?: string): Promise<{ success: boolean; contexts: SecurityContext[] }> {
    const res = await this.api.get('/admin/contexts', { params: { tenantId } });
    return res.data;
  }

  public async createContext(dto: Partial<SecurityContext>): Promise<{ success: boolean; context: SecurityContext }> {
    const res = await this.api.post('/admin/contexts', dto);
    return res.data;
  }

  public async getUserContexts(userId: string): Promise<any> {
    const res = await this.api.get(`/admin/users/${userId}/contexts`);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 5: Approval Workflows
  // --------------------------------------------------------------------------
  public async getWorkflows(tenantId?: string): Promise<{ success: boolean; workflows: ApprovalWorkflow[] }> {
    const res = await this.api.get('/admin/workflows', { params: { tenantId } });
    return res.data;
  }

  public async createWorkflow(dto: Partial<ApprovalWorkflow>): Promise<{ success: boolean; workflow: ApprovalWorkflow }> {
    const res = await this.api.post('/admin/workflows', dto);
    return res.data;
  }

  public async updateWorkflow(wfId: string, dto: Partial<ApprovalWorkflow>): Promise<{ success: boolean; workflow: ApprovalWorkflow }> {
    const res = await this.api.put(`/admin/workflows/${wfId}`, dto);
    return res.data;
  }

  public async deleteWorkflow(wfId: string): Promise<{ success: boolean; message: string }> {
    const res = await this.api.delete(`/admin/workflows/${wfId}`);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 6: Company Profile
  // --------------------------------------------------------------------------
  public async getCompanyProfile(tenantId?: string): Promise<{ success: boolean; company: CompanyProfile }> {
    const res = await this.api.get('/admin/company', { params: { tenantId } });
    return res.data;
  }

  public async updateCompanyProfile(dto: Partial<CompanyProfile>): Promise<{ success: boolean; company: CompanyProfile }> {
    const res = await this.api.put('/admin/company', dto);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 7: Plants & Facilities
  // --------------------------------------------------------------------------
  public async getPlants(): Promise<{ success: boolean; plants: PlantFacility[] }> {
    const res = await this.api.get('/admin/plants');
    return res.data;
  }

  public async createPlant(dto: Partial<PlantFacility>): Promise<{ success: boolean; plant: PlantFacility }> {
    const res = await this.api.post('/admin/plants', dto);
    return res.data;
  }

  public async updatePlant(plantId: string, dto: Partial<PlantFacility>): Promise<{ success: boolean; plant: PlantFacility }> {
    const res = await this.api.put(`/admin/plants/${plantId}`, dto);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 8: Warehouses & Silos
  // --------------------------------------------------------------------------
  public async getWarehouses(plantId?: string): Promise<{ success: boolean; warehouses: Warehouse[] }> {
    const res = await this.api.get('/admin/warehouses', { params: { plantId } });
    return res.data;
  }

  public async createWarehouse(dto: Partial<Warehouse>): Promise<{ success: boolean; warehouse: Warehouse }> {
    const res = await this.api.post('/admin/warehouses', dto);
    return res.data;
  }

  public async getWarehouseLocations(warehouseId: string): Promise<any> {
    const res = await this.api.get(`/admin/warehouses/${warehouseId}/locations`);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 9: Machines & Work Centers
  // --------------------------------------------------------------------------
  public async getMachines(plantId?: string): Promise<{ success: boolean; machines: MachineRegistry[] }> {
    const res = await this.api.get('/admin/machines', { params: { plantId } });
    return res.data;
  }

  public async createMachine(dto: Partial<MachineRegistry>): Promise<{ success: boolean; machine: MachineRegistry }> {
    const res = await this.api.post('/admin/machines', dto);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 10: Shifts & Calendar
  // --------------------------------------------------------------------------
  public async getShifts(): Promise<{ success: boolean; shifts: ShiftDefinition[] }> {
    const res = await this.api.get('/admin/shifts');
    return res.data;
  }

  public async createShift(dto: Partial<ShiftDefinition>): Promise<{ success: boolean; shift: ShiftDefinition }> {
    const res = await this.api.post('/admin/shifts', dto);
    return res.data;
  }

  public async getCalendarHolidays(year?: number): Promise<any> {
    const res = await this.api.get('/admin/calendar/holidays', { params: { year } });
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 11: Reason Codes
  // --------------------------------------------------------------------------
  public async getReasonCodes(category?: string): Promise<{ success: boolean; reasonCodes: ReasonCode[] }> {
    const res = await this.api.get('/admin/reason-codes', { params: { category } });
    return res.data;
  }

  public async createReasonCode(dto: Partial<ReasonCode>): Promise<{ success: boolean; reasonCode: ReasonCode }> {
    const res = await this.api.post('/admin/reason-codes', dto);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 12: Numbering Sequences
  // --------------------------------------------------------------------------
  public async getNumberingSequences(tenantId?: string): Promise<{ success: boolean; sequences: NumberingSequence[] }> {
    const res = await this.api.get('/admin/numbering', { params: { tenantId } });
    return res.data;
  }

  public async createNumberingSequence(dto: Partial<NumberingSequence>): Promise<{ success: boolean; sequence: NumberingSequence }> {
    const res = await this.api.post('/admin/numbering', dto);
    return res.data;
  }

  public async generateNextNumber(module: string, documentType: string, tenantId?: string): Promise<{ success: boolean; documentNumber: string }> {
    const res = await this.api.post('/admin/numbering/generate', { module, documentType, tenantId });
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 13: Notification Rules
  // --------------------------------------------------------------------------
  public async getNotificationRules(): Promise<{ success: boolean; rules: NotificationRule[] }> {
    const res = await this.api.get('/admin/notifications/rules');
    return res.data;
  }

  public async createNotificationRule(dto: Partial<NotificationRule>): Promise<{ success: boolean; rule: NotificationRule }> {
    const res = await this.api.post('/admin/notifications/rules', dto);
    return res.data;
  }

  public async testNotificationRule(eventType: string, payload: Record<string, any> = {}): Promise<any> {
    const res = await this.api.post('/admin/notifications/rules/test', { eventType, payload });
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 14: Master Data Governance
  // --------------------------------------------------------------------------
  public async getGovernanceRules(entityType?: string): Promise<{ success: boolean; rules: GovernanceRule[] }> {
    const res = await this.api.get('/admin/governance/rules', { params: { entityType } });
    return res.data;
  }

  public async createGovernanceRule(dto: Partial<GovernanceRule>): Promise<{ success: boolean; rule: GovernanceRule }> {
    const res = await this.api.post('/admin/governance/rules', dto);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 15: Document Management
  // --------------------------------------------------------------------------
  public async getDocuments(category?: string): Promise<{ success: boolean; documents: ComplianceDocument[] }> {
    const res = await this.api.get('/admin/documents', { params: { category } });
    return res.data;
  }

  public async uploadDocument(dto: Partial<ComplianceDocument>): Promise<{ success: boolean; document: ComplianceDocument }> {
    const res = await this.api.post('/admin/documents', dto);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 16: Security & Audit Trail Logs
  // --------------------------------------------------------------------------
  public async getAuditLogs(entityName?: string, action?: string, limit: number = 100): Promise<any> {
    const res = await this.api.get('/admin/audit-logs', { params: { entityName, action, limit } });
    return res.data;
  }

  public async getSecurityEvents(limit: number = 50): Promise<any> {
    const res = await this.api.get('/admin/security/events', { params: { limit } });
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 17: Email & SMTP
  // --------------------------------------------------------------------------
  public async getEmailConfigs(): Promise<{ success: boolean; configs: EmailConfig[] }> {
    const res = await this.api.get('/admin/email/configs');
    return res.data;
  }

  public async saveEmailConfig(dto: Partial<EmailConfig>): Promise<{ success: boolean; config: EmailConfig }> {
    const res = await this.api.post('/admin/email/configs', dto);
    return res.data;
  }

  public async testEmailConfig(toEmail: string): Promise<any> {
    const res = await this.api.post('/admin/email/test', { toEmail });
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 18: Integrations & API Keys
  // --------------------------------------------------------------------------
  public async getApiKeys(): Promise<{ success: boolean; apiKeys: ApiKeyItem[] }> {
    const res = await this.api.get('/admin/api-keys');
    return res.data;
  }

  public async createApiKey(dto: Partial<ApiKeyItem>): Promise<any> {
    const res = await this.api.post('/admin/api-keys', dto);
    return res.data;
  }

  public async rotateApiKey(keyId: string): Promise<any> {
    const res = await this.api.post(`/admin/api-keys/${keyId}/rotate`);
    return res.data;
  }

  public async revokeApiKey(keyId: string): Promise<any> {
    const res = await this.api.delete(`/admin/api-keys/${keyId}`);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 19: Backup & Disaster Recovery
  // --------------------------------------------------------------------------
  public async getBackupConfigs(): Promise<any> {
    const res = await this.api.get('/admin/backups/configs');
    return res.data;
  }

  public async triggerManualBackup(configId?: string): Promise<any> {
    const res = await this.api.post('/admin/backups/manual', { configId });
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 20: License & Subscription
  // --------------------------------------------------------------------------
  public async getLicenseStatus(tenantId?: string): Promise<any> {
    const res = await this.api.get('/admin/license', { params: { tenantId } });
    return res.data;
  }

  public async updateLicense(dto: any): Promise<any> {
    const res = await this.api.put('/admin/license', dto);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 21: Data Import / Export
  // --------------------------------------------------------------------------
  public async executeDataImport(jobName: string, entityType: string, mapping: Record<string, string> = {}): Promise<any> {
    const res = await this.api.post('/admin/data/import', { jobName, entityType, mapping });
    return res.data;
  }

  public async executeDataExport(entityType: string, format: 'CSV' | 'XLSX' | 'JSON' = 'CSV'): Promise<any> {
    const res = await this.api.post('/admin/data/export', { entityType, format });
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 22: Custom Fields Builder
  // --------------------------------------------------------------------------
  public async getCustomFields(entityType?: string): Promise<{ success: boolean; customFields: CustomFieldDefinition[] }> {
    const res = await this.api.get('/admin/custom-fields', { params: { entityType } });
    return res.data;
  }

  public async createCustomField(dto: Partial<CustomFieldDefinition>): Promise<{ success: boolean; customField: CustomFieldDefinition }> {
    const res = await this.api.post('/admin/custom-fields', dto);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // Screen 23: System Health & Pool Telemetry
  // --------------------------------------------------------------------------
  public async getSystemHealth(): Promise<any> {
    const res = await this.api.get('/admin/system-health');
    return res.data;
  }
}

export const adminApi = AdministrationApi.getInstance();
