import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../shared/queryKeys';
import { apiClient } from '../services/api';
import { adminEventBus } from '../services/adminService';
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
  DataRetentionPolicy,
  UserGroup,
} from '../data/adminExtendedData';
import { TransporterRecord, transporterFromApi, transporterToApi } from '../services/transportMasterService';
import { masterDataGovernanceService } from '../services/masterDataGovernanceService';
import { workspaceRbacService } from '../services/workspaceRbacService';
import { WorkspaceRbacConfig } from '../types/workspaceRbac';
import { identityApi } from '../features/identity/api';

// ============================================================================
// 1. HEALTH & METRICS
// ============================================================================
export function useAdminHealthMetrics() {
  return useQuery({
    queryKey: queryKeys.admin.healthMetrics(),
    queryFn: async (): Promise<AdminSystemHealth> => {
      const res = await apiClient.get<any>('/api/v1/system/health');
      const data = res.data?.data || res.data || {};
      return {
        status: data.status || 'HEALTHY',
        uptime: '99.98%',
        dbLatencyMs: Number(data.dbLatencyMs || 1.2),
        activeSessions: Number(data.activeSessions || 1),
        userCount: Number(data.userCount || 1),
        cpuCores: Number(data.cpuCores || 4),
        loadPct: Number(data.loadPct || 12),
        memoryTotalGb: Number(data.memoryTotalGb || 16),
        memoryUsedGb: Number(data.memoryUsedGb || 4.2),
        uptimeSeconds: Number(data.uptimeSeconds || 36000),
      } as any;
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
      const res = await apiClient.get<any>('/api/v1/users', { params: filters });
      const rows = res.data?.data || res.data || [];
      return Array.isArray(rows) ? rows : [];
    },
    staleTime: 1000 * 60 * 3,
  });
}

export function useSaveAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (user: Partial<AdminUser> & { password?: string; pin?: string }) => {
      if (user.id && !user.id.startsWith('temp-')) {
        const res = await apiClient.patch(`/api/v1/users/${user.id}`, user);
        return res.data?.data || res.data;
      }
      const res = await apiClient.post('/api/v1/users', user);
      return res.data?.data || res.data;
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard() });
      queryClient.invalidateQueries({ queryKey: ['identity', 'users'] });
      adminEventBus.emit('USER_UPDATED', saved);
    },
  });
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiClient.delete(`/api/v1/users/${userId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users() });
      queryClient.invalidateQueries({ queryKey: ['identity', 'users'] });
    },
  });
}

export function useChangeAdminUserPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      const res = await apiClient.post(`/api/v1/users/${userId}/reset-password`, { password: newPassword });
      return res.data;
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
      const res = await apiClient.post(`/api/v1/users/${userId}/otp`);
      return res.data;
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
      const res = await apiClient.post(`/api/v1/users/${userId}/verify-otp`, { code });
      return res.data;
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
      const res = await apiClient.patch(`/api/v1/users/${userId}`, rbacData);
      return res.data?.data || res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.roles() });
      queryClient.invalidateQueries({ queryKey: ['identity', 'users'] });
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
      const res = await apiClient.get<any>('/api/v1/roles');
      const rows = res.data?.data || res.data || [];
      return Array.isArray(rows) ? rows : [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveAdminRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (role: Partial<AdminRole>) => {
      if (role.id && !role.id.startsWith('temp-')) {
        const res = await apiClient.put(`/api/v1/roles/${role.id}/permissions`, {
          version: (role as any).version || 1,
          permissions: (role as any).permissions || [],
        });
        return res.data?.data || res.data;
      }
      const res = await apiClient.post('/api/v1/roles', role);
      return res.data?.data || res.data;
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.roles() });
      queryClient.invalidateQueries({ queryKey: ['identity', 'roles'] });
      adminEventBus.emit('ROLE_UPDATED', saved);
    },
  });
}

export function useDeleteAdminRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (roleId: string) => {
      const res = await apiClient.delete(`/api/v1/roles/${roleId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.roles() });
      queryClient.invalidateQueries({ queryKey: ['identity', 'roles'] });
    },
  });
}

export function useSodRules() {
  return useQuery({
    queryKey: queryKeys.admin.sodRules(),
    queryFn: async (): Promise<SodConflictRule[]> => {
      const res = await apiClient.get<any>('/api/v1/sod-rules');
      const rows = res.data?.data || res.data || [];
      return Array.isArray(rows) ? rows : [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSodViolations() {
  return useQuery({
    queryKey: queryKeys.admin.sodViolations(),
    queryFn: async (): Promise<SodViolation[]> => {
      const res = await apiClient.get<any>('/api/v1/sod-violations');
      const rows = res.data?.data || res.data || [];
      return Array.isArray(rows) ? rows : [];
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
      const res = await apiClient.get<any>('/api/v1/plants');
      const rows = res.data?.data || res.data || [];
      return (Array.isArray(rows) ? rows : []).map((p: any) => {
        const [city = '', state = ''] = (p.location ?? '').split(',').map((s: string) => s.trim());
        return {
          id: p.id,
          plantCode: p.code || p.plantCode,
          plantName: p.name || p.plantName,
          division: 'Plant',
          address: p.address ?? '',
          city,
          state,
          pincode: '',
          gstin: p.gstin ?? '',
          contactPerson: p.contactPerson ?? '',
          contactEmail: p.contactEmail ?? '',
          contactPhone: p.contactPhone ?? '',
          totalMachines: 12,
          activeLines: 8,
          shifts: ['Shift A (06:00-14:00)', 'Shift B (14:00-22:00)'],
          defaultWarehouseId: `WH-${p.code || '01'}`,
          defaultWarehouseName: `${p.name || 'Plant'} Store`,
          isHeadquarters: Boolean(p.isDefault),
          operationalStatus: p.isActive ? 'Fully Operational' : 'Offline',
        };
      });
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveAdminPlant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (plant: Partial<PlantDetails>) => {
      if (plant.id && !plant.id.startsWith('temp-') && !plant.id.startsWith('PLANT-')) {
        const res = await apiClient.patch(`/api/v1/plants/${plant.id}`, {
          version: (plant as any).version || 1,
          name: plant.plantName,
          code: plant.plantCode,
          location: plant.city ? `${plant.city}, ${plant.state || 'Maharashtra'}` : undefined,
        });
        return res.data?.data || res.data;
      }
      const res = await apiClient.post('/api/v1/plants', {
        code: plant.plantCode,
        name: plant.plantName,
        location: plant.city ? `${plant.city}, ${plant.state || 'Maharashtra'}` : 'Plant Location',
      });
      return res.data?.data || res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.plants() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard() });
      queryClient.invalidateQueries({ queryKey: ['identity', 'plants'] });
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
      const [whRes, binRes] = await Promise.all([
        apiClient.get<any>('/api/v1/warehouses', { params: { limit: 100 } }),
        apiClient.get<any>('/api/v1/warehouse-bins', { params: { limit: 100 } }),
      ]);
      const whRows = (whRes?.data as any)?.data || whRes?.data || [];
      const binRows = (binRes?.data as any)?.data || binRes?.data || [];
      return (Array.isArray(binRows) ? binRows : []).map((b: any) => {
        const parent = Array.isArray(whRows) ? whRows.find((w: any) => w && (w.id === b.warehouseId || w.code === b.warehouseId)) : null;
        return {
          id: b.id,
          binCode: b.binCode || b.bin_code || '',
          warehouseCode: parent?.code || b.warehouseId || 'WH-01',
          warehouseName: parent?.name || parent?.code || 'Warehouse',
          plantId: parent?.plantId || 'PLANT-01',
          plantName: parent?.plantName || parent?.plantId || 'Main Plant',
          plantScope: parent?.plantId || 'All Plants',
          zoneCode: b.zone || 'ZONE-A',
          zoneType: (b.zone as any) || 'Raw Polymer Silos',
          zoneName: b.zone || 'Zone A',
          aisle: b.aisle || 'A1',
          rack: b.rack || 'R01',
          shelf: b.shelf || '01',
          maxCapacityKg: Number(b.capacityKg || b.capacity_kg || 1000),
          currentOccupancyKg: 0,
          temperatureControlled: Boolean(b.temperatureControlled),
          targetTemp: 22,
          barcodeScannable: true,
          isBlocked: !b.isActive && b.isActive !== undefined,
          utilizationPct: 0,
        };
      });
    },
    staleTime: 1000 * 60 * 3,
  });
}

export function useSaveAdminWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (wh: Partial<WarehouseLocationConfig>) => {
      if (wh.binCode) {
        const res = await apiClient.post('/api/v1/warehouse-bins', {
          warehouseId: wh.warehouseCode || 'WH-01',
          binCode: wh.binCode,
          zone: wh.zoneName || wh.zoneType,
          aisle: wh.aisle || 'A1',
          rack: wh.rack || 'R01',
          shelf: wh.shelf || '01',
          capacityKg: wh.maxCapacityKg || 1000,
          isActive: !wh.isBlocked,
        });
        return res.data;
      }
      return null;
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
      const res = await apiClient.get<any>('/api/v1/machines', { params: { plantId } });
      const rows = res.data?.data || res.data || [];
      return (Array.isArray(rows) ? rows : []).map((m: any) => ({
        id: m.id,
        machineCode: m.code || m.machineCode,
        machineName: m.name || m.machineName,
        plantId: m.plantId || plantId || 'PLANT-01',
        clampingForceTons: Number(m.tonnage || 180),
        screwDiameterMm: 45,
        maxShotWeightGrams: 320,
        hourlyRateInr: Number(m.hourlyRate || 850),
        activeStatus: m.status === 'ACTIVE' || m.isActive ? 'Active' : 'Maintenance',
        connectedPlc: true,
        ipAddress: '192.168.10.45',
        lastPreventiveMaintenance: '2026-10-15',
        totalOperatingHours: 4200,
      }));
    },
    staleTime: 1000 * 60 * 3,
  });
}

export function useSaveAdminMachine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (machine: Partial<MachineWorkCenterConfig>) => {
      if (machine.id && !machine.id.startsWith('temp-')) {
        const res = await apiClient.patch(`/api/v1/machines/${machine.id}`, machine);
        return res.data?.data || res.data;
      }
      const res = await apiClient.post('/api/v1/machines', machine);
      return res.data?.data || res.data;
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.machines() });
      adminEventBus.emit('MACHINE_MASTER_SAVED', saved);
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
      const res = await apiClient.get<any>('/api/v1/shifts');
      const rows = res.data?.data || res.data || [];
      return (Array.isArray(rows) ? rows : []).map((s: any) => ({
        id: s.id,
        shiftCode: s.code || s.shiftCode,
        shiftName: s.name || s.shiftName,
        plantId: s.plantId || plantId || 'ALL',
        startTime: s.startTime || s.start_time || '09:00',
        endTime: s.endTime || s.end_time || '18:00',
        durationHours: Number(s.durationHours || 8),
        breakDurationMinutes: s.breakDurationMinutes || 30,
        active: Boolean(s.isActive ?? true),
        isNightShift: Boolean(s.isNightShift),
      }));
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveAdminShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (shift: Partial<ShiftCalendarConfig>) => {
      if (shift.id && !shift.id.startsWith('temp-')) {
        const res = await apiClient.patch(`/api/v1/shifts/${shift.id}`, shift);
        return res.data?.data || res.data;
      }
      const res = await apiClient.post('/api/v1/shifts', shift);
      return res.data?.data || res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.shifts() });
    },
  });
}

export function useAdminHolidays(plantId?: string) {
  return useQuery({
    queryKey: queryKeys.admin.holidays(plantId),
    queryFn: async (): Promise<HolidayOvertimeRule[]> => {
      const res = await apiClient.get<any>('/api/v1/holidays', { params: { plantId } });
      const rows = res.data?.data || res.data || [];
      return Array.isArray(rows) ? rows : [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveAdminHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (holiday: Partial<HolidayOvertimeRule>) => {
      const res = await apiClient.post('/api/v1/holidays', holiday);
      return res.data?.data || res.data;
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
      const res = await apiClient.get<any>('/api/v1/reason-codes', { params: { category } });
      const rows = res.data?.data || res.data || [];
      return (Array.isArray(rows) ? rows : []).map((r: any) => ({
        id: r.id,
        code: r.code,
        category: r.category,
        description: r.description,
        active: Boolean(r.isActive ?? r.is_active ?? true),
        isSystemStandard: true,
        resolutionActionRequired: false,
      }));
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveAdminReasonCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: Partial<ReasonCodeItem>) => {
      if (item.id && !item.id.startsWith('temp-')) {
        const res = await apiClient.patch(`/api/v1/reason-codes/${item.id}`, item);
        return res.data?.data || res.data;
      }
      const res = await apiClient.post('/api/v1/reason-codes', item);
      return res.data?.data || res.data;
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
      const res = await apiClient.delete(`/api/v1/reason-codes/${codeId}`);
      return res.data;
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
      const res = await apiClient.get<unknown[]>('/api/v1/transporters');
      return (Array.isArray(res.data) ? res.data : []).map(transporterFromApi);
    },
    staleTime: 30_000,
  });
}

export function useSaveAdminTransporter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id?: string; patch: Partial<TransporterRecord> & { isActive?: boolean } }) => {
      const { isActive, ...rest } = patch;
      const body: Record<string, unknown> = transporterToApi(rest);
      if (id) {
        delete body.code; // code is immutable after creation
        if (isActive !== undefined) body.isActive = isActive;
        const res = await apiClient.patch(`/api/v1/transporters/${id}`, body);
        return transporterFromApi(res.data);
      }
      const res = await apiClient.post('/api/v1/transporters', body);
      return transporterFromApi(res.data);
    },
    onSuccess: (saved) => {
      // Direct cache hydration with the authoritative row, then background revalidate.
      queryClient.setQueryData<TransporterRecord[]>(queryKeys.admin.transporters(), (old = []) => {
        const i = old.findIndex((t) => t.id === saved.id);
        return i >= 0 ? old.map((t) => (t.id === saved.id ? saved : t)) : [saved, ...old];
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.transporters() });
      adminEventBus.emit('TRANSPORTER_SAVED', saved);
    },
  });
}

export function useDeleteAdminTransporter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/v1/transporters/${id}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData<TransporterRecord[]>(queryKeys.admin.transporters(), (old = []) =>
        old.filter((t) => t.id !== id)
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.transporters() });
      adminEventBus.emit('TRANSPORTER_DELETED', { id });
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
      const res = await apiClient.get<any>('/api/v1/company-settings');
      const data = res.data?.data || res.data || {};
      return {
        companyName: data.companyName || 'SP-PLASTECH Polymer Industries',
        legalName: data.legalName || data.companyName || 'SP-PLASTECH Polymer Industries Private Limited',
        taxIdGstin: data.gstin || '27AABCS1429B1Z4',
        panNumber: data.pan || 'AABCS1429B',
        corporateIdentificationNumber: data.cin || 'U25209MH2018PTC312456',
        registeredAddress: data.registeredAddress || 'Chakan MIDC Phase II, Pune, Maharashtra',
        currency: data.currency || 'INR',
        fiscalYearStart: data.fiscalYearStart || '04-01',
        version: data.version || 1,
        ...data,
      };
    },
    staleTime: 1000 * 60 * 10,
  });
}

export function useSaveAdminCompanyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: Partial<CompanyProfile>) => {
      const res = await apiClient.patch('/api/v1/company-settings', {
        version: (profile as any).version || 1,
        companyName: profile.companyName,
        legalName: (profile as any).legalEntityName || profile.legalName,
        cin: profile.corporateIdentificationNumber || (profile as any).cin,
        pan: profile.panNumber || (profile as any).pan,
        gstin: profile.taxIdGstin || (profile as any).gstinCorporate || (profile as any).gstin,
        currency: profile.currency || (profile as any).baseCurrency,
        fiscalYearStart: profile.fiscalYearStart || '04-01',
        registeredAddress: profile.registeredAddress || (profile as any).registeredOffice,
      });
      return res.data?.data || res.data;
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
      const res = await apiClient.get<any>('/api/v1/numbering-series');
      const rows = res.data?.data || res.data || [];
      return (Array.isArray(rows) ? rows : []).map((s: any) => ({
        id: s.id,
        documentType: s.seriesCode || s.entityType,
        prefix: s.prefix || '',
        suffix: s.suffix || '',
        currentSequence: Number(s.currentNumber ?? s.currentValue ?? 1000),
        zeroPadding: Number(s.paddingDigits ?? s.padding_digits ?? 5),
        samplePreview: `${s.prefix || ''}${String(s.currentNumber ?? s.currentValue ?? 1000).padStart(s.paddingDigits ?? 5, '0')}${s.suffix || ''}`,
      }));
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveAdminNumberingSeries() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (seq: Partial<NumberingSequence>) => {
      if (seq.id && !seq.id.startsWith('temp-')) {
        const res = await apiClient.patch(`/api/v1/numbering-series/${seq.id}`, seq);
        return res.data?.data || res.data;
      }
      const res = await apiClient.post('/api/v1/numbering-series', seq);
      return res.data?.data || res.data;
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
      const res = await apiClient.get<any>('/api/v1/approval-workflows');
      const rows = res.data?.data || res.data || [];
      return Array.isArray(rows) ? rows : [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveAdminWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (wf: Partial<ApprovalWorkflow>) => {
      const res = await apiClient.post('/api/v1/approval-workflows', wf);
      return res.data?.data || res.data;
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
      const res = await apiClient.get<any>('/api/v1/security-policy');
      const data = res.data?.data || res.data || {};
      return {
        minPasswordLength: data.passwordMinLength || 8,
        requireUppercase: Boolean(data.requireUppercase ?? true),
        requireNumbers: Boolean(data.requireNumber ?? true),
        requireSpecialChars: Boolean(data.requireSpecialChar ?? true),
        maxFailedAttemptsBeforeLockout: Number(data.maxFailedAttempts || 5),
        lockoutDurationMinutes: Number(data.lockoutDurationMinutes || 15),
        sessionTimeoutMinutes: Number(data.sessionTimeoutMinutes || 30),
        twoFactorEnforcement: data.twoFactorEnforcement || 'OFF',
        mfaEnforcedRoles: data.mfaEnforcedRoles || [],
        passwordExpiryDays: data.passwordExpiryDays || 90,
        enforcePreviousPasswordHistoryCount: data.enforcePreviousPasswordHistoryCount || 3,
        allowedIpRanges: data.allowedIpRanges || [],
      } as any;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveAdminSecurityPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (policy: Partial<SecurityPolicy>) => {
      const res = await apiClient.patch('/api/v1/security-policy', {
        version: (policy as any).version || 1,
        passwordMinLength: policy.minPasswordLength,
        requireSpecialChar: policy.requireSpecialChars,
        requireNumber: policy.requireNumbers,
        requireUppercase: policy.requireUppercase,
        maxFailedAttempts: policy.maxFailedAttemptsBeforeLockout,
        lockoutDurationMinutes: policy.lockoutDurationMinutes,
        sessionTimeoutMinutes: policy.sessionTimeoutMinutes,
        mfaEnforcedRoles: (policy as any).mfaEnforcedRoles || [],
      });
      return res.data?.data || res.data;
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.securityPolicy() });
      adminEventBus.emit('SECURITY_POLICY_SAVED', saved);
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
      const res = await apiClient.get<any>('/api/v1/audit-logs', { params: filter });
      const rows = res.data?.data || res.data || [];
      return Array.isArray(rows) ? rows : [];
    },
    staleTime: 1000 * 30,
  });
}

export function useAdminLoginAudit(params?: Record<string, any>) {
  return useQuery({
    queryKey: queryKeys.admin.loginAudit(params),
    queryFn: async (): Promise<SecurityLoginAuditRecord[]> => {
      const res = await apiClient.get<any>('/api/v1/login-events', { params });
      const rows = res.data?.data || res.data || [];
      return Array.isArray(rows) ? rows : [];
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
      const res = await apiClient.get<any>('/api/v1/integrations');
      const rows = res.data?.data || res.data || [];
      return Array.isArray(rows) ? rows : [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveAdminIntegration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (connector: Partial<IntegrationConnector>) => {
      const res = await apiClient.post('/api/v1/integrations', connector);
      return res.data?.data || res.data;
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
      const res = await apiClient.get<any>('/api/v1/retention-policies');
      const rows = res.data?.data || res.data || [];
      return Array.isArray(rows) ? rows : [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveAdminBackupRetention() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (policy: Partial<DataRetentionPolicy>) => {
      const res = await apiClient.post('/api/v1/retention-policies', policy);
      return res.data?.data || res.data;
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
      const res = await apiClient.get<any>('/api/v1/backups');
      const rows = res.data?.data || res.data || [];
      return Array.isArray(rows) ? rows : [];
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
      return {
        tier: 'Enterprise Dedicated',
        status: 'Active / Fully Compliant',
        activeUserLicenses: 50,
        totalAllocatedLicenses: 100,
        licenseKey: 'SP-PLASTECH-PROD-2026-X991-ENTERPRISE',
        validUntil: '2027-12-31',
        featuresEnabled: [
          'JIT Continuous Scheduling Engine',
          'Multi-Plant BOM Explosion',
          'ISO 22400 OEE Analytics Engine',
          'Document Hub Multi-Format Delivery',
        ],
      } as any;
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
      const res = await apiClient.get<any>('/api/v1/workspace-presets');
      const rows = res.data?.data || res.data || [];
      return Array.isArray(rows) ? rows : [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveAdminQuickActions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (actions: any[]) => {
      const res = await apiClient.post('/api/v1/workspace-presets', { actions });
      return res.data?.data || res.data;
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
      const res = await apiClient.get<any>('/api/v1/security-policy');
      const data = res.data?.data || res.data || {};
      return data.multiContextPolicies || [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveAdminMultiContextPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (policy: Partial<MultiContextScopePolicy>) => {
      const res = await apiClient.patch('/api/v1/security-policy', { multiContextPolicies: [policy] });
      return res.data?.data || res.data;
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
      const res = await apiClient.get<any>('/api/v1/user-groups');
      const rows = res.data?.data || res.data || [];
      return (Array.isArray(rows) ? rows : []).map((g: any) => ({
        id: g.id,
        code: g.code || g.groupCode,
        name: g.name || g.groupName,
        description: g.description || '',
        department: g.department || 'Operations',
        membersCount: Number(g.userCount || 0),
        active: Boolean(g.isActive ?? true),
      }));
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveAdminUserGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (group: Partial<UserGroup>) => {
      if (group.id && !group.id.startsWith('temp-') && !group.id.startsWith('GRP-')) {
        const res = await apiClient.patch(`/api/v1/user-groups/${group.id}`, group);
        return res.data?.data || res.data;
      }
      const res = await apiClient.post('/api/v1/user-groups', {
        code: group.code || `GRP-${Date.now().toString().slice(-4)}`,
        name: group.name,
        description: group.description,
      });
      return res.data?.data || res.data;
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
      const res = await apiClient.get<any>('/api/v1/system-parameters');
      const rows = res.data?.data || res.data || [];
      return (Array.isArray(rows) ? rows : []).map((p: any) => ({
        id: p.id,
        key: p.paramKey || p.param_key,
        name: p.paramKey || p.param_key,
        category: p.category,
        description: p.description || '',
        valueType: (p.dataType || 'string').toLowerCase() as any,
        currentValue: p.paramValue || p.param_value,
        defaultValue: p.paramValue || p.param_value,
        requiresServerRestart: false,
      }));
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveAdminSystemParameter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (param: any) => {
      if (param.id && !param.id.startsWith('temp-')) {
        const res = await apiClient.patch(`/api/v1/system-parameters/${param.id}`, {
          paramValue: String(param.currentValue ?? param.paramValue ?? ''),
        });
        return res.data?.data || res.data;
      }
      const res = await apiClient.post('/api/v1/system-parameters', param);
      return res.data?.data || res.data;
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
      const res = await apiClient.get<any>('/api/v1/document-templates');
      const rows = res.data?.data || res.data || [];
      return (Array.isArray(rows) ? rows : []).map((t: any) => ({
        id: t.id,
        code: t.docType || t.name,
        name: t.name,
        channel: 'EMAIL',
        subject: t.subjectTemplate || '',
        templateBody: t.bodyTemplate || '',
        triggerEvent: t.docType || 'EVENT',
        enabled: Boolean(t.isActive ?? true),
      }));
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveAdminNotificationTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tmpl: Partial<NotificationTemplate>) => {
      const res = await apiClient.post('/api/v1/document-templates', tmpl);
      return res.data?.data || res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.notificationTemplates() });
    },
  });
}
