import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../shared/queryKeys';
import { apiClient } from '../shared/api/client';
import { adminService } from '../services/adminService';
import {
  AdminUser,
  AdminRole,
  PlantDetails,
  NumberingSequence,
  ApprovalWorkflow,
  SystemParameter,
  AdminSystemHealth,
  SecurityPolicy,
  NotificationTemplate,
  IntegrationConnector,
  BackupJob,
  CompanyProfile,
  AuditLogEntry,
  SodConflictRule,
  SodViolation,
  MultiContextScopePolicy,
} from '../types/admin';
import {
  ReasonCodeItem,
  MachineWorkCenterConfig,
  ShiftCalendarConfig,
  HolidayOvertimeRule,
  WarehouseLocationConfig,
  MasterDataRecord,
  SecurityLoginAuditRecord,
  LicenseSubscriptionDetails,
  DocumentSettingPolicy,
  DataRetentionPolicy,
  DataExchangeJob,
  UserGroup,
} from '../data/adminExtendedData';
import { transportMasterService, TransporterRecord } from '../services/transportMasterService';
import { masterDataGovernanceService } from '../services/masterDataGovernanceService';
import { workspaceRbacService } from '../services/workspaceRbacService';
import { WorkspaceRbacConfig } from '../types/workspaceRbac';

// ============================================================================
// 1. HEALTH & METRICS
// ============================================================================
export function useAdminHealthMetrics() {
  return useQuery({
    queryKey: queryKeys.admin.healthMetrics(),
    queryFn: async (): Promise<AdminSystemHealth> => {
      try {
        const res = await apiClient.get<AdminSystemHealth>('/admin/health-metrics');
        if (res.data) return res.data;
      } catch {}
      return adminService.getSystemHealth();
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });
}

// ============================================================================
// 2. USERS MANAGEMENT
// ============================================================================
export function useAdminUsers(filters?: Record<string, any>) {
  return useQuery({
    queryKey: queryKeys.admin.users(filters),
    queryFn: async (): Promise<AdminUser[]> => {
      try {
        const res = await apiClient.get<AdminUser[]>('/admin/users', { params: filters });
        if (Array.isArray(res.data) && res.data.length > 0) return res.data;
      } catch {}
      return adminService.getUsers();
    },
    staleTime: 1000 * 60 * 3,
  });
}

export function useSaveAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (user: Partial<AdminUser> & { password?: string; pin?: string }) => {
      if (user.id && !user.id.startsWith('temp-')) {
        return adminService.updateUser(user.id, user);
      }
      return adminService.createUser(user);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard() });
    },
  });
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      return adminService.deleteUser(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users() });
    },
  });
}

export function useChangeAdminUserPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      return adminService.resetUserPassword(userId, newPassword);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users() });
    },
  });
}

export function useGenerateAdminUserOtp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      return adminService.generateTempOtp(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users() });
    },
  });
}

export function useVerifyAdminUserOtp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, code }: { userId: string; code: string }) => {
      return adminService.verifyUserOtp(userId, code);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users() });
    },
  });
}

export function useProvisionAdminUserRbac() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      rbacData,
    }: {
      userId: string;
      rbacData: { roleId: string; plantIds: string[]; department?: string; designation?: string; assignedShift?: string };
    }) => {
      return adminService.provisionUserRbac(userId, rbacData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.roles() });
    },
  });
}

// ============================================================================
// 3. ROLES & PERMISSIONS & SOD
// ============================================================================
export function useAdminRoles() {
  return useQuery({
    queryKey: queryKeys.admin.roles(),
    queryFn: async (): Promise<AdminRole[]> => {
      try {
        const res = await apiClient.get<AdminRole[]>('/admin/roles');
        if (Array.isArray(res.data) && res.data.length > 0) return res.data;
      } catch {}
      return adminService.getRoles();
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveAdminRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (role: Partial<AdminRole>) => {
      if (role.id && !role.id.startsWith('temp-')) {
        return adminService.updateRole(role.id, role);
      }
      return adminService.createRole(role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.roles() });
    },
  });
}

export function useDeleteAdminRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (roleId: string) => {
      return adminService.deleteRole(roleId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.roles() });
    },
  });
}

export function useSodRules() {
  return useQuery({
    queryKey: queryKeys.admin.sodRules(),
    queryFn: async (): Promise<SodConflictRule[]> => {
      try {
        const res = await apiClient.get<SodConflictRule[]>('/admin/sod-rules');
        if (Array.isArray(res.data)) return res.data;
      } catch {}
      return adminService.getSodRules();
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSodViolations() {
  return useQuery({
    queryKey: queryKeys.admin.sodViolations(),
    queryFn: async (): Promise<SodViolation[]> => {
      try {
        const res = await apiClient.get<SodViolation[]>('/admin/sod-violations');
        if (Array.isArray(res.data)) return res.data;
      } catch {}
      return adminService.getSodViolations();
    },
    staleTime: 1000 * 60 * 5,
  });
}

// ============================================================================
// 4. PLANTS & BRANCHES
// ============================================================================
export function useAdminPlants() {
  return useQuery({
    queryKey: queryKeys.admin.plants(),
    queryFn: async (): Promise<PlantDetails[]> => {
      try {
        const res = await apiClient.get<PlantDetails[]>('/admin/plants');
        if (Array.isArray(res.data) && res.data.length > 0) return res.data;
      } catch {}
      return adminService.getPlants();
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveAdminPlant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (plant: Partial<PlantDetails>) => {
      if (plant.id && !plant.id.startsWith('temp-')) {
        return adminService.updatePlant(plant.id, plant);
      }
      return adminService.createPlant(plant);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.plants() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard() });
    },
  });
}

// ============================================================================
// 5. WAREHOUSES & LOCATIONS
// ============================================================================
export function useAdminWarehouses() {
  return useQuery({
    queryKey: queryKeys.admin.warehouses(),
    queryFn: async (): Promise<WarehouseLocationConfig[]> => {
      try {
        const res = await apiClient.get<WarehouseLocationConfig[]>('/admin/warehouses');
        if (Array.isArray(res.data) && res.data.length > 0) return res.data;
      } catch {}
      return adminService.getWarehouseLocations();
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveAdminWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (wh: Partial<WarehouseLocationConfig>) => {
      return adminService.saveWarehouseLocation(wh);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.warehouses() });
    },
  });
}

// ============================================================================
// 6. MACHINES & WORK CENTERS
// ============================================================================
export function useAdminMachines(plantId?: string) {
  return useQuery({
    queryKey: queryKeys.admin.machines(plantId),
    queryFn: async (): Promise<MachineWorkCenterConfig[]> => {
      try {
        const res = await apiClient.get<MachineWorkCenterConfig[]>('/admin/machines', { params: { plantId } });
        if (Array.isArray(res.data) && res.data.length > 0) return res.data;
      } catch {}
      return adminService.getMachines(plantId);
    },
    staleTime: 1000 * 60 * 3,
  });
}

export function useSaveAdminMachine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (machine: Partial<MachineWorkCenterConfig>) => {
      return adminService.saveMachine(machine);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.machines() });
    },
  });
}

// ============================================================================
// 7. SHIFTS & WORKING CALENDAR
// ============================================================================
export function useAdminShifts(plantId?: string) {
  return useQuery({
    queryKey: queryKeys.admin.shifts(plantId),
    queryFn: async (): Promise<ShiftCalendarConfig[]> => {
      try {
        const res = await apiClient.get<ShiftCalendarConfig[]>('/admin/shifts', { params: { plantId } });
        if (Array.isArray(res.data)) return res.data;
      } catch {}
      return adminService.getShifts(plantId);
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useAdminHolidays(plantId?: string) {
  return useQuery({
    queryKey: queryKeys.admin.holidays(plantId),
    queryFn: async (): Promise<HolidayOvertimeRule[]> => {
      try {
        const res = await apiClient.get<HolidayOvertimeRule[]>('/admin/holidays', { params: { plantId } });
        if (Array.isArray(res.data)) return res.data;
      } catch {}
      return adminService.getHolidays(plantId);
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveAdminShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (shift: Partial<ShiftCalendarConfig>) => {
      return adminService.saveShift(shift);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.shifts() });
    },
  });
}

export function useSaveAdminHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (holiday: Partial<HolidayOvertimeRule>) => {
      return adminService.saveHoliday(holiday);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.holidays() });
    },
  });
}

// ============================================================================
// 8. REASON CODES SETUP
// ============================================================================
export function useAdminReasonCodes(category?: string) {
  return useQuery({
    queryKey: queryKeys.admin.reasonCodes(category),
    queryFn: async (): Promise<ReasonCodeItem[]> => {
      try {
        const res = await apiClient.get<ReasonCodeItem[]>('/admin/reason-codes', { params: { category } });
        if (Array.isArray(res.data) && res.data.length > 0) return res.data;
      } catch {}
      return adminService.getReasonCodes(category);
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveAdminReasonCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: Partial<ReasonCodeItem>) => {
      return adminService.saveReasonCode(item);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.reasonCodes() });
    },
  });
}

export function useDeleteAdminReasonCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (codeId: string) => {
      return adminService.deleteReasonCode(codeId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.reasonCodes() });
    },
  });
}

// ============================================================================
// 9. MASTER DATA GOVERNANCE
// ============================================================================
export function useAdminMasterDataGovernance() {
  return useQuery({
    queryKey: queryKeys.admin.masterDataRules(),
    queryFn: async (): Promise<MasterDataRecord[]> => {
      return masterDataGovernanceService.getAllRecords();
    },
    staleTime: 1000 * 60 * 5,
  });
}

// ============================================================================
// 10. TRANSPORTER MASTER (FLEET)
// ============================================================================
export function useAdminTransporters() {
  return useQuery({
    queryKey: queryKeys.admin.transporters(),
    queryFn: async (): Promise<TransporterRecord[]> => {
      return transportMasterService.getTransporters();
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveAdminTransporter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (transporter: Partial<TransporterRecord> & { name: string; transporterCode: string; transporterIdGstin: string; contactPerson: string; phone: string; email: string; address: string; city: string; state: string; transportModes: any[]; vehicleTypes: string[]; status: 'active' | 'inactive'; rating: number }) => {
      return transportMasterService.saveTransporter(transporter as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.transporters() });
    },
  });
}

export function useDeleteAdminTransporter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return transportMasterService.deleteTransporter(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.transporters() });
    },
  });
}

// ============================================================================
// 11. COMPANY PROFILE
// ============================================================================
export function useAdminCompanyProfile() {
  return useQuery({
    queryKey: queryKeys.admin.companyProfile(),
    queryFn: async (): Promise<CompanyProfile> => {
      return adminService.getCompanyProfile();
    },
    staleTime: 1000 * 60 * 10,
  });
}

export function useSaveAdminCompanyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: Partial<CompanyProfile>) => {
      return adminService.updateCompanyProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.companyProfile() });
    },
  });
}

// ============================================================================
// 12. NUMBERING SEQUENCES
// ============================================================================
export function useAdminNumberingSeries() {
  return useQuery({
    queryKey: queryKeys.admin.numberingSeries(),
    queryFn: async (): Promise<NumberingSequence[]> => {
      return adminService.getNumberingSequences();
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveAdminNumberingSeries() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (seq: Partial<NumberingSequence>) => {
      if (seq.id) {
        return adminService.updateNumberingSequence(seq.id, seq);
      }
      return adminService.createNumberingSequence(seq);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.numberingSeries() });
    },
  });
}

// ============================================================================
// 13. APPROVAL WORKFLOWS
// ============================================================================
export function useAdminWorkflows() {
  return useQuery({
    queryKey: queryKeys.admin.workflows(),
    queryFn: async (): Promise<ApprovalWorkflow[]> => {
      return adminService.getApprovalWorkflows();
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveAdminWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (wf: Partial<ApprovalWorkflow>) => {
      if (wf.id) {
        return adminService.updateApprovalWorkflow(wf.id, wf);
      }
      return adminService.createApprovalWorkflow(wf);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.workflows() });
    },
  });
}

// ============================================================================
// 14. SECURITY POLICY & MFA
// ============================================================================
export function useAdminSecurityPolicy() {
  return useQuery({
    queryKey: queryKeys.admin.securityPolicy(),
    queryFn: async (): Promise<SecurityPolicy> => {
      return adminService.getSecurityPolicy();
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveAdminSecurityPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (policy: Partial<SecurityPolicy>) => {
      return adminService.updateSecurityPolicy(policy);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.securityPolicy() });
    },
  });
}

// ============================================================================
// 15. AUDIT LOGS & LOGIN SECURITY AUDIT
// ============================================================================
export function useAuditLogs(filter?: any) {
  return useQuery({
    queryKey: queryKeys.admin.auditLogs(filter),
    queryFn: async (): Promise<AuditLogEntry[]> => {
      return adminService.getAuditLogs(filter);
    },
    staleTime: 1000 * 30,
  });
}

export function useAdminLoginAudit(params?: Record<string, any>) {
  return useQuery({
    queryKey: queryKeys.admin.loginAudit(params),
    queryFn: async (): Promise<SecurityLoginAuditRecord[]> => {
      return adminService.getLoginAuditRecords(params);
    },
    staleTime: 1000 * 30,
  });
}

// ============================================================================
// 16. INTEGRATIONS & CONNECTORS
// ============================================================================
export function useAdminIntegrations() {
  return useQuery({
    queryKey: queryKeys.admin.integrations(),
    queryFn: async (): Promise<IntegrationConnector[]> => {
      return adminService.getIntegrations();
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveAdminIntegration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (connector: Partial<IntegrationConnector>) => {
      return adminService.saveIntegration(connector);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.integrations() });
    },
  });
}

// ============================================================================
// 17. BACKUP, RETENTION & DPDP
// ============================================================================
export function useAdminBackupRetention() {
  return useQuery({
    queryKey: queryKeys.admin.backupRetention(),
    queryFn: async (): Promise<DataRetentionPolicy[]> => {
      return adminService.getBackupRetentionPolicy();
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveAdminBackupRetention() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (policy: Partial<DataRetentionPolicy>) => {
      return adminService.saveBackupRetentionPolicy(policy);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.backupRetention() });
    },
  });
}

export function useAdminBackups() {
  return useQuery({
    queryKey: queryKeys.admin.all,
    queryFn: async (): Promise<BackupJob[]> => {
      return adminService.getBackups();
    },
    staleTime: 1000 * 60 * 2,
  });
}

// ============================================================================
// 18. LICENSE & SUBSCRIPTION
// ============================================================================
export function useAdminLicense() {
  return useQuery({
    queryKey: queryKeys.admin.license(),
    queryFn: async (): Promise<LicenseSubscriptionDetails> => {
      return adminService.getLicenseDetails();
    },
    staleTime: 1000 * 60 * 15,
  });
}

// ============================================================================
// 19. QUICK ACTIONS & GLOBAL CONFIG
// ============================================================================
export function useAdminQuickActions() {
  return useQuery({
    queryKey: queryKeys.admin.quickActions(),
    queryFn: async (): Promise<any[]> => {
      return adminService.getQuickActions();
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveAdminQuickActions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (actions: any[]) => {
      return adminService.saveQuickActions(actions);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.quickActions() });
    },
  });
}

// ============================================================================
// 20. MULTI-CONTEXT POLICIES
// ============================================================================
export function useAdminMultiContextPolicies() {
  return useQuery({
    queryKey: queryKeys.admin.multiContext(),
    queryFn: async (): Promise<MultiContextScopePolicy[]> => {
      return adminService.getMultiContextPolicies();
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveAdminMultiContextPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (policy: Partial<MultiContextScopePolicy>) => {
      return adminService.saveMultiContextPolicy(policy);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.multiContext() });
    },
  });
}

// ============================================================================
// 21. WORKSPACE RBAC & SCREEN APPROVALS
// ============================================================================
export function useAdminWorkspaceRbac() {
  return useQuery({
    queryKey: queryKeys.admin.workspaceRbac(),
    queryFn: async (): Promise<WorkspaceRbacConfig> => {
      return workspaceRbacService.getConfig();
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveAdminWorkspaceRbac() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (config: Partial<WorkspaceRbacConfig>) => {
      workspaceRbacService.updateConfig(config);
      return workspaceRbacService.getConfig();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.workspaceRbac() });
    },
  });
}

// ============================================================================
// 22. USER GROUPS & CREWS
// ============================================================================
export function useAdminUserGroups() {
  return useQuery({
    queryKey: queryKeys.admin.userGroups(),
    queryFn: async (): Promise<UserGroup[]> => {
      return adminService.getUserGroups();
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveAdminUserGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (group: Partial<UserGroup>) => {
      return adminService.saveUserGroup(group);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.userGroups() });
    },
  });
}

// ============================================================================
// 23. SYSTEM PARAMETERS & UDF
// ============================================================================
export function useAdminSystemParameters() {
  return useQuery({
    queryKey: queryKeys.admin.systemParameters(),
    queryFn: async (): Promise<SystemParameter[]> => {
      return adminService.getSystemParameters();
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveAdminSystemParameter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (param: Partial<SystemParameter>) => {
      return adminService.saveSystemParameter(param);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.systemParameters() });
    },
  });
}

// ============================================================================
// 24. NOTIFICATIONS
// ============================================================================
export function useAdminNotificationTemplates() {
  return useQuery({
    queryKey: queryKeys.admin.notificationTemplates(),
    queryFn: async (): Promise<NotificationTemplate[]> => {
      return adminService.getNotificationTemplates();
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveAdminNotificationTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tmpl: Partial<NotificationTemplate>) => {
      return adminService.saveNotificationTemplate(tmpl);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.notificationTemplates() });
    },
  });
}
