import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { ObservabilityLogger } from '../../common/observability/logger.service';
import { MetricsService } from '../../common/observability/metrics.service';
import { TracingService } from '../../common/observability/tracing.service';
import {
  CreateEmployeeDto,
  CreateEmployeeDtoSchema,
  UpdateEmployeeDto,
  ExitEmployeeDto,
  ExitEmployeeDtoSchema,
  RecordPunchDto,
  RecordPunchDtoSchema,
  SyncBiometricDto,
  SyncBiometricDtoSchema,
  AdjustAttendanceDto,
  AdjustAttendanceDtoSchema,
  AssignShiftDto,
  AssignShiftDtoSchema,
  SwapShiftDto,
  SwapShiftDtoSchema,
  CreateLeaveDto,
  CreateLeaveDtoSchema,
  CreateOvertimeDto,
  CreateOvertimeDtoSchema,
  CreateSkillDto,
  CreateSkillDtoSchema,
  AddSkillDto,
  AddSkillDtoSchema,
  CreateTrainingDto,
  CreateTrainingDtoSchema,
  EnrollDto,
  EnrollDtoSchema,
  ReportIncidentDto,
  ReportIncidentDtoSchema,
  UpdateIncidentDto,
  InvestigateDto,
  InvestigateDtoSchema,
  IssuePpeDto,
  IssuePpeDtoSchema,
  RunPayrollDto,
  RunPayrollDtoSchema,
  AddContractorDto,
  AddContractorDtoSchema,
  FileStatutoryDto,
  FileStatutoryDtoSchema,
  GenerateReportDto,
  GenerateReportDtoSchema,
} from './hr.dto';

@Injectable()
export class HrService {
  private readonly fallbackLogger = new Logger(HrService.name);

  // In-memory persistent stores with multi-tenancy support
  private employeeStore = new Map<string, any>();
  private attendanceStore = new Map<string, any>();
  private biometricDeviceStore = new Map<string, any>();
  private shiftAssignmentStore = new Map<string, any>();
  private leaveRequestStore = new Map<string, any>();
  private leaveBalanceStore = new Map<string, any>();
  private overtimeStore = new Map<string, any>();
  private skillStore = new Map<string, any>();
  private employeeSkillStore = new Map<string, any>();
  private trainingStore = new Map<string, any>();
  private employeeTrainingStore = new Map<string, any>();
  private safetyIncidentStore = new Map<string, any>();
  private ppeStore = new Map<string, any>();
  private payrollRecordStore = new Map<string, any>();
  private payrollRunStore = new Map<string, any>();
  private contractorStore = new Map<string, any>();
  private statutoryComplianceStore = new Map<string, any>();

  constructor(
    private readonly db: DatabaseService,
    private readonly obsLogger: ObservabilityLogger,
    private readonly metrics: MetricsService,
    private readonly tracing: TracingService,
  ) {
    this.seedDefaultHrData();
  }

  // ============================================================================
  // SCREEN 1: HR COMMAND CENTER & KPIS
  // ============================================================================

  public async getHrDashboard(tenantId: string = 'TENANT-ALPHA-IND') {
    const kpis = await this.getHrKpis(tenantId);
    const recentEmployees = (await this.getEmployees(tenantId)).slice(0, 5);
    const pendingLeaves = Array.from(this.leaveRequestStore.values()).filter((l) => l.tenantId === tenantId && l.status === 'PENDING').slice(0, 5);
    const recentIncidents = Array.from(this.safetyIncidentStore.values()).filter((i) => i.tenantId === tenantId).slice(0, 5);

    return {
      kpis,
      recentEmployees,
      pendingLeaves,
      recentIncidents,
    };
  }

  public async getHrKpis(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    const employees = await this.getEmployees(tenantId);
    const activeCount = employees.filter((e) => e.employmentStatus === 'ACTIVE').length;
    const probationCount = employees.filter((e) => e.employmentStatus === 'ON_PROBATION').length;
    const openLeaves = Array.from(this.leaveRequestStore.values()).filter((l) => l.tenantId === tenantId && l.status === 'PENDING').length;
    const safetyCount = Array.from(this.safetyIncidentStore.values()).filter((i) => i.tenantId === tenantId && i.status !== 'CLOSED').length;

    return {
      totalHeadcount: employees.length || 142,
      activeHeadcount: activeCount || 135,
      probationHeadcount: probationCount || 7,
      attendanceRateTodayPct: 96.4,
      absenteeismRatePct: 3.6,
      attritionRateMonthlyPct: 1.2,
      openLeaveApprovals: openLeaves,
      trainingHoursCompletedYtd: 1240,
      iatfCompetencyScorePct: 94.8,
      daysWithoutLostTimeInjury: 182,
      activeSafetyIncidents: safetyCount,
      monthlyPayrollLiabilityInr: 6850000,
    };
  }

  public async getHeadcount(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    const employees = await this.getEmployees(tenantId);
    const byDept: Record<string, number> = {};
    const byType: Record<string, number> = {};

    employees.forEach((e) => {
      byDept[e.department] = (byDept[e.department] || 0) + 1;
      byType[e.employmentType] = (byType[e.employmentType] || 0) + 1;
    });

    return {
      total: employees.length,
      byDepartment: byDept,
      byEmploymentType: byType,
    };
  }

  // ============================================================================
  // SCREEN 2: EMPLOYEE MASTER (360°)
  // ============================================================================

  public async getEmployees(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    return this.tracing.traceOperation('HrService.getEmployees', async () => {
      let employees = Array.from(this.employeeStore.values()).filter((e) => e.tenantId === tenantId);
      if (filters.department) employees = employees.filter((e) => e.department === filters.department);
      if (filters.employmentStatus) employees = employees.filter((e) => e.employmentStatus === filters.employmentStatus);
      if (filters.employmentType) employees = employees.filter((e) => e.employmentType === filters.employmentType);
      if (filters.search) {
        const s = filters.search.toLowerCase();
        employees = employees.filter((e) => e.employeeCode.toLowerCase().includes(s) || e.fullName.toLowerCase().includes(s) || e.email.toLowerCase().includes(s));
      }
      return employees.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, { tenantId, filters: JSON.stringify(filters) });
  }

  public async getEmployee(id: string, tenantId: string = 'TENANT-ALPHA-IND') {
    const emp = this.employeeStore.get(id);
    if (!emp || emp.tenantId !== tenantId) {
      throw new NotFoundException(`Employee not found: ${id}`);
    }
    return emp;
  }

  public async createEmployee(dto: CreateEmployeeDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    return this.tracing.traceOperation('HrService.createEmployee', async () => {
      const parsed = CreateEmployeeDtoSchema.parse(dto);
      const id = `EMP-${parsed.employeeCode.replace(/[^A-Za-z0-9]/g, '')}`;
      const fullName = `${parsed.firstName} ${parsed.lastName}`.trim();

      const record = {
        id,
        tenantId,
        ...parsed,
        fullName,
        version: 'v1.0',
        createdById: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.employeeStore.set(id, record);

      // Initialize default leave balances for current year
      this.initLeaveBalancesForEmployee(id, tenantId, userId);

      this.obsLogger.logAudit({
        actorId: userId,
        action: 'CREATE',
        entity: 'Employee',
        entityId: id,
        details: { employeeCode: record.employeeCode, fullName: record.fullName, designation: record.designation },
      });
      this.metrics.incrementBusinessEvent('employee_created', 'HR');

      return record;
    }, { tenantId, userId });
  }

  public async updateEmployee(id: string, dto: UpdateEmployeeDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const existing = await this.getEmployee(id, tenantId);
    const fullName = dto.firstName || dto.lastName ? `${dto.firstName || existing.firstName} ${dto.lastName || existing.lastName}`.trim() : existing.fullName;

    const updated = {
      ...existing,
      ...dto,
      fullName,
      version: this.incrementVersion(existing.version),
      updatedById: userId,
      updatedAt: new Date().toISOString(),
    };

    this.employeeStore.set(id, updated);
    this.obsLogger.logAudit({
      actorId: userId,
      action: 'UPDATE',
      entity: 'Employee',
      entityId: id,
      details: { oldData: existing, newData: updated },
    });
    return updated;
  }

  public async getEmployee360(id: string, tenantId: string = 'TENANT-ALPHA-IND') {
    const employee = await this.getEmployee(id, tenantId);
    const attendance = Array.from(this.attendanceStore.values()).filter((a) => a.tenantId === tenantId && a.employeeId === id);
    const leaves = Array.from(this.leaveRequestStore.values()).filter((l) => l.tenantId === tenantId && l.employeeId === id);
    const leaveBalances = Array.from(this.leaveBalanceStore.values()).filter((b) => b.tenantId === tenantId && b.employeeId === id);
    const skills = Array.from(this.employeeSkillStore.values()).filter((s) => s.tenantId === tenantId && s.employeeId === id);
    const trainings = Array.from(this.employeeTrainingStore.values()).filter((t) => t.tenantId === tenantId && t.employeeId === id);
    const payroll = Array.from(this.payrollRecordStore.values()).filter((p) => p.tenantId === tenantId && p.employeeId === id);

    return {
      ...employee,
      attendanceSummary: {
        totalDaysPresent: attendance.filter((a) => a.status === 'PRESENT').length,
        totalDaysAbsent: attendance.filter((a) => a.status === 'ABSENT').length,
        totalLateDays: attendance.filter((a) => a.lateMinutes > 0).length,
      },
      leaveBalances,
      recentLeaves: leaves.slice(0, 5),
      skills,
      trainings,
      recentPayroll: payroll.slice(0, 3),
    };
  }

  public async onboardEmployee(id: string, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const emp = await this.getEmployee(id, tenantId);
    emp.employmentStatus = 'ACTIVE';
    emp.dateOfConfirmation = new Date().toISOString().split('T')[0];
    emp.updatedAt = new Date().toISOString();
    this.employeeStore.set(id, emp);
    return { success: true, message: `Employee ${emp.fullName} successfully onboarded and activated`, employee: emp };
  }

  public async exitEmployee(id: string, dto: ExitEmployeeDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const parsed = ExitEmployeeDtoSchema.parse(dto);
    const emp = await this.getEmployee(id, tenantId);
    emp.employmentStatus = parsed.employmentStatus;
    emp.dateOfExit = parsed.dateOfExit;
    emp.exitReason = parsed.exitReason;
    emp.updatedAt = new Date().toISOString();
    this.employeeStore.set(id, emp);

    this.obsLogger.logAudit({
      actorId: userId,
      action: 'EMPLOYEE_EXIT',
      entity: 'Employee',
      entityId: id,
      details: { dateOfExit: parsed.dateOfExit, exitReason: parsed.exitReason },
    });

    return { success: true, message: `Employee ${emp.fullName} exit processed`, employee: emp };
  }

  // ============================================================================
  // SCREEN 3: BIOMETRIC ATTENDANCE & PUNCHES
  // ============================================================================

  public async getAttendance(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    let records = Array.from(this.attendanceStore.values()).filter((a) => a.tenantId === tenantId);
    if (filters.employeeId) records = records.filter((a) => a.employeeId === filters.employeeId);
    if (filters.attendanceDate) records = records.filter((a) => a.attendanceDate === filters.attendanceDate);
    if (filters.status) records = records.filter((a) => a.status === filters.status);
    return records.sort((a, b) => new Date(b.attendanceDate).getTime() - new Date(a.attendanceDate).getTime());
  }

  public async recordPunch(dto: RecordPunchDto, tenantId: string = 'TENANT-ALPHA-IND') {
    return this.tracing.traceOperation('HrService.recordPunch', async () => {
      const parsed = RecordPunchDtoSchema.parse(dto);
      const dateStr = parsed.punchTime.split('T')[0];
      const id = `ATT-${parsed.employeeId}-${dateStr}`;

      let record = this.attendanceStore.get(id);
      if (!record) {
        record = {
          id,
          tenantId,
          employeeId: parsed.employeeId,
          attendanceDate: dateStr,
          firstPunchIn: parsed.punchTime,
          lastPunchOut: parsed.punchTime,
          totalPunches: 1,
          workHours: 0,
          overtimeHours: 0,
          lateMinutes: 0,
          earlyLeaveMinutes: 0,
          status: 'PRESENT',
          biometricDeviceId: parsed.biometricDeviceId,
          isManualEntry: false,
          version: 'v1.0',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      } else {
        record.lastPunchOut = parsed.punchTime;
        record.totalPunches += 1;
        
        // Calculate work hours between first punch in and last punch out
        const diffMs = new Date(record.lastPunchOut).getTime() - new Date(record.firstPunchIn).getTime();
        const grossHours = Math.max(0, diffMs / (1000 * 60 * 60));
        const netWorkHours = Math.min(8.0, this.round(grossHours));
        const otHours = Math.max(0, this.round(grossHours - 8.5)); // 8h shift + 30m break

        record.workHours = netWorkHours;
        record.overtimeHours = otHours;
        record.updatedAt = new Date().toISOString();
      }

      this.attendanceStore.set(id, record);
      return record;
    }, { tenantId, employeeId: dto.employeeId });
  }

  public async syncBiometricData(dto: SyncBiometricDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const parsed = SyncBiometricDtoSchema.parse(dto);
    let syncedCount = 0;

    for (const p of parsed.punches) {
      const emp = Array.from(this.employeeStore.values()).find((e) => e.tenantId === tenantId && e.employeeCode === p.employeeCode);
      if (emp) {
        await this.recordPunch({
          employeeId: emp.id,
          punchTime: p.timestamp,
          biometricDeviceId: parsed.deviceId,
        }, tenantId);
        syncedCount++;
      }
    }

    return {
      success: true,
      deviceId: parsed.deviceId,
      totalPunchesReceived: parsed.punches.length,
      syncedRecordsCount: syncedCount,
      timestamp: new Date().toISOString(),
    };
  }

  public async adjustAttendance(id: string, dto: AdjustAttendanceDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const parsed = AdjustAttendanceDtoSchema.parse(dto);
    let record = this.attendanceStore.get(id);

    if (!record) {
      record = {
        id,
        tenantId,
        attendanceDate: parsed.attendanceDate,
        isManualEntry: true,
        version: 'v1.0',
        createdAt: new Date().toISOString(),
      };
    }

    record = {
      ...record,
      ...parsed,
      isManualEntry: true,
      manualAdjustmentReason: parsed.reason,
      adjustedById: userId,
      updatedAt: new Date().toISOString(),
    };

    this.attendanceStore.set(id, record);
    this.obsLogger.logAudit({
      actorId: userId,
      action: 'ATTENDANCE_ADJUSTMENT',
      entity: 'Attendance',
      entityId: id,
      details: { reason: parsed.reason, newStatus: parsed.status },
    });

    return record;
  }

  public async getAttendanceSummary(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    const records = await this.getAttendance(tenantId, filters);
    const totalPresent = records.filter((r) => r.status === 'PRESENT').length;
    const totalAbsent = records.filter((r) => r.status === 'ABSENT').length;
    const totalHalfDay = records.filter((r) => r.status === 'HALF_DAY').length;
    const totalOnLeave = records.filter((r) => r.status === 'ON_LEAVE').length;
    const totalOtHours = this.round(records.reduce((s, r) => s + (r.overtimeHours || 0), 0));

    return {
      period: filters.period || 'Today',
      totalRecords: records.length,
      present: totalPresent,
      absent: totalAbsent,
      halfDay: totalHalfDay,
      onLeave: totalOnLeave,
      totalOvertimeHours: totalOtHours,
    };
  }

  // ============================================================================
  // SCREEN 4: SHIFT ROSTER & LINE STAFFING
  // ============================================================================

  public async getShiftRoster(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    return Array.from(this.shiftAssignmentStore.values()).filter((s) => s.tenantId === tenantId);
  }

  public async assignShift(dto: AssignShiftDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const parsed = AssignShiftDtoSchema.parse(dto);
    const id = `SHIFT-${parsed.employeeId}-${parsed.assignmentDate}-${parsed.shiftId}`;

    const record = {
      id,
      tenantId,
      ...parsed,
      status: 'SCHEDULED',
      version: 'v1.0',
      createdById: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.shiftAssignmentStore.set(id, record);
    return record;
  }

  public async swapShift(dto: SwapShiftDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const parsed = SwapShiftDtoSchema.parse(dto);
    const a1 = this.shiftAssignmentStore.get(parsed.requesterAssignmentId);
    const a2 = this.shiftAssignmentStore.get(parsed.targetAssignmentId);

    if (!a1 || !a2) throw new BadRequestException('Invalid shift assignments to swap');

    const tempShift = a1.shiftId;
    a1.shiftId = a2.shiftId;
    a2.shiftId = tempShift;

    a1.status = 'SWAPPED';
    a2.status = 'SWAPPED';
    a1.updatedAt = new Date().toISOString();
    a2.updatedAt = new Date().toISOString();

    this.shiftAssignmentStore.set(a1.id, a1);
    this.shiftAssignmentStore.set(a2.id, a2);

    return { success: true, message: 'Shifts swapped successfully', assignment1: a1, assignment2: a2 };
  }

  public async getLineStaffing(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    return [
      { lineId: 'LINE-01-MOLDING', lineName: 'Molding Line 1 (Automotive)', requiredStaff: 12, allocatedStaff: 12, fulfillmentPct: 100 },
      { lineId: 'LINE-02-EXTRUSION', lineName: 'Extrusion Line 2 (Pipes)', requiredStaff: 8, allocatedStaff: 7, fulfillmentPct: 87.5 },
      { lineId: 'LINE-03-PACKAGING', lineName: 'Finished Goods Packaging', requiredStaff: 15, allocatedStaff: 15, fulfillmentPct: 100 },
    ];
  }

  // ============================================================================
  // SCREEN 5: LEAVE & OVERTIME APPROVALS
  // ============================================================================

  public async getLeaves(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    let leaves = Array.from(this.leaveRequestStore.values()).filter((l) => l.tenantId === tenantId);
    if (filters.employeeId) leaves = leaves.filter((l) => l.employeeId === filters.employeeId);
    if (filters.status) leaves = leaves.filter((l) => l.status === filters.status);
    return leaves.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async createLeaveRequest(dto: CreateLeaveDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const parsed = CreateLeaveDtoSchema.parse(dto);
    const id = `LEAVE-2026-${Date.now().toString().slice(-6)}`;

    // Validate leave balance
    const balanceKey = `BAL-${parsed.employeeId}-${parsed.leaveType}-${new Date().getFullYear()}`;
    const balance = this.leaveBalanceStore.get(balanceKey);

    if (balance && balance.closingBalance < parsed.totalDays) {
      throw new BadRequestException(`Insufficient ${parsed.leaveType} balance. Available: ${balance.closingBalance}, Requested: ${parsed.totalDays}`);
    }

    const record = {
      id,
      tenantId,
      leaveNumber: id,
      ...parsed,
      status: 'PENDING',
      version: 'v1.0',
      createdById: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.leaveRequestStore.set(id, record);
    return record;
  }

  public async approveLeave(id: string, tenantId: string = 'TENANT-ALPHA-IND', approverId: string = 'USR-ADMIN-01') {
    return this.tracing.traceOperation('HrService.approveLeave', async () => {
      const leave = this.leaveRequestStore.get(id);
      if (!leave || leave.tenantId !== tenantId) throw new NotFoundException(`Leave request not found: ${id}`);
      if (leave.status !== 'PENDING') throw new BadRequestException(`Leave is not in PENDING status: ${leave.status}`);

      const balanceKey = `BAL-${leave.employeeId}-${leave.leaveType}-${new Date().getFullYear()}`;
      let balance = this.leaveBalanceStore.get(balanceKey);

      if (!balance) {
        balance = { id: balanceKey, tenantId, employeeId: leave.employeeId, leaveType: leave.leaveType, year: new Date().getFullYear(), allocated: 12, availed: 0, closingBalance: 12 };
      }

      if (balance.closingBalance < leave.totalDays) {
        throw new BadRequestException(`Insufficient leave balance: Available ${balance.closingBalance}, Required ${leave.totalDays}`);
      }

      // Deduct balance atomically
      const balBefore = balance.closingBalance;
      balance.availed = this.round(balance.availed + leave.totalDays);
      balance.closingBalance = this.round(balance.closingBalance - leave.totalDays);
      this.leaveBalanceStore.set(balanceKey, balance);

      leave.status = 'APPROVED';
      leave.approvedById = approverId;
      leave.approvedAt = new Date().toISOString();
      leave.balanceBefore = balBefore;
      leave.balanceAfter = balance.closingBalance;
      leave.updatedAt = new Date().toISOString();
      this.leaveRequestStore.set(id, leave);

      this.metrics.incrementBusinessEvent('leave_approved', 'HR');
      this.obsLogger.logAudit({
        actorId: approverId,
        action: 'LEAVE_APPROVED',
        entity: 'LeaveRequest',
        entityId: id,
        details: { leaveNumber: leave.leaveNumber, totalDays: leave.totalDays, newBalance: balance.closingBalance },
      });

      return { success: true, message: `Leave ${leave.leaveNumber} approved`, leave };
    }, { leaveId: id, tenantId, approverId });
  }

  public async rejectLeave(id: string, tenantId: string = 'TENANT-ALPHA-IND', approverId: string = 'USR-ADMIN-01', reason: string = 'Rejected by manager') {
    const leave = this.leaveRequestStore.get(id);
    if (!leave || leave.tenantId !== tenantId) throw new NotFoundException(`Leave request not found: ${id}`);
    leave.status = 'REJECTED';
    leave.approvedById = approverId;
    leave.approvedAt = new Date().toISOString();
    leave.rejectionReason = reason;
    leave.updatedAt = new Date().toISOString();
    this.leaveRequestStore.set(id, leave);
    return { success: true, message: `Leave ${leave.leaveNumber} rejected`, leave };
  }

  public async getLeaveBalance(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    let balances = Array.from(this.leaveBalanceStore.values()).filter((b) => b.tenantId === tenantId);
    if (filters.employeeId) balances = balances.filter((b) => b.employeeId === filters.employeeId);
    return balances;
  }

  public async getPendingApprovals(tenantId: string = 'TENANT-ALPHA-IND', approverId: string = 'USR-ADMIN-01') {
    return Array.from(this.leaveRequestStore.values()).filter((l) => l.tenantId === tenantId && l.status === 'PENDING');
  }

  public async getOvertimeRequests(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    return Array.from(this.overtimeStore.values()).filter((o) => o.tenantId === tenantId);
  }

  public async createOvertimeRequest(dto: CreateOvertimeDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const parsed = CreateOvertimeDtoSchema.parse(dto);
    const id = `OT-2026-${Date.now().toString().slice(-6)}`;
    const otRate = parsed.otType === 'HOLIDAY' ? 250 : (parsed.otType === 'WEEKEND' ? 200 : 150);
    const otAmount = this.round(parsed.totalHours * otRate);

    const record = {
      id,
      tenantId,
      otNumber: id,
      ...parsed,
      otRate,
      otAmount,
      status: 'PENDING',
      version: 'v1.0',
      createdById: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.overtimeStore.set(id, record);
    return record;
  }

  public async approveOvertime(id: string, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const ot = this.overtimeStore.get(id);
    if (!ot || ot.tenantId !== tenantId) throw new NotFoundException(`Overtime request not found: ${id}`);
    ot.status = 'APPROVED';
    ot.approvedById = userId;
    ot.approvedAt = new Date().toISOString();
    this.overtimeStore.set(id, ot);
    return { success: true, message: `Overtime ${ot.otNumber} approved for payment processing`, overtime: ot };
  }

  // ============================================================================
  // SCREEN 6: SKILL MATRIX & COMPETENCY (IATF 16949)
  // ============================================================================

  public async getSkills(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    return Array.from(this.skillStore.values()).filter((s) => s.tenantId === tenantId);
  }

  public async createSkill(dto: CreateSkillDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const parsed = CreateSkillDtoSchema.parse(dto);
    const id = `SKILL-${parsed.skillCode}`;
    const record = {
      id,
      tenantId,
      ...parsed,
      isActive: true,
      version: 'v1.0',
      createdById: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.skillStore.set(id, record);
    return record;
  }

  public async getEmployeeSkills(employeeId: string, tenantId: string = 'TENANT-ALPHA-IND') {
    return Array.from(this.employeeSkillStore.values()).filter((s) => s.tenantId === tenantId && s.employeeId === employeeId);
  }

  public async addEmployeeSkill(employeeId: string, dto: AddSkillDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const parsed = AddSkillDtoSchema.parse(dto);
    const id = `EMPSKILL-${employeeId}-${parsed.skillId}`;
    const record = {
      id,
      tenantId,
      employeeId,
      ...parsed,
      version: 'v1.0',
      assessedById: userId,
      lastAssessedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.employeeSkillStore.set(id, record);
    return record;
  }

  public async getTrainings(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    return Array.from(this.trainingStore.values()).filter((t) => t.tenantId === tenantId);
  }

  public async createTraining(dto: CreateTrainingDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const parsed = CreateTrainingDtoSchema.parse(dto);
    const id = parsed.trainingCode || `TRN-2026-${Date.now().toString().slice(-6)}`;
    const record = {
      id,
      tenantId,
      trainingCode: id,
      ...parsed,
      status: 'SCHEDULED',
      version: 'v1.0',
      createdById: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.trainingStore.set(id, record);
    return record;
  }

  public async enrollInTraining(trainingId: string, dto: EnrollDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const parsed = EnrollDtoSchema.parse(dto);
    const enrolled: any[] = [];

    for (const empId of parsed.employeeIds) {
      const id = `ENROLL-${trainingId}-${empId}`;
      const record = {
        id,
        tenantId,
        trainingId,
        employeeId: empId,
        enrollmentStatus: 'ENROLLED',
        attendanceStatus: 'PENDING',
        version: 'v1.0',
        createdAt: new Date().toISOString(),
      };
      this.employeeTrainingStore.set(id, record);
      enrolled.push(record);
    }

    return { success: true, totalEnrolled: enrolled.length, enrollments: enrolled };
  }

  public async getSkillMatrix(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    const employees = await this.getEmployees(tenantId);
    const skills = await this.getSkills(tenantId);
    const empSkills = Array.from(this.employeeSkillStore.values()).filter((s) => s.tenantId === tenantId);

    return {
      totalEmployees: employees.length,
      totalSkills: skills.length,
      matrix: employees.map((emp) => ({
        employeeId: emp.id,
        employeeCode: emp.employeeCode,
        fullName: emp.fullName,
        department: emp.department,
        designation: emp.designation,
        skills: skills.map((sk) => {
          const matched = empSkills.find((es) => es.employeeId === emp.id && es.skillId === sk.id);
          return {
            skillId: sk.id,
            skillName: sk.skillName,
            level: matched?.proficiencyLevel || 'NONE',
            certified: matched?.certified || false,
          };
        }),
      })),
    };
  }

  // ============================================================================
  // SCREEN 7: SAFETY (EHS) & ZERO-HARM INCIDENTS
  // ============================================================================

  public async getIncidents(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    return Array.from(this.safetyIncidentStore.values()).filter((i) => i.tenantId === tenantId);
  }

  public async reportIncident(dto: ReportIncidentDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const parsed = ReportIncidentDtoSchema.parse(dto);
    const id = parsed.incidentNumber || `INC-2026-${Date.now().toString().slice(-6)}`;
    const record = {
      id,
      tenantId,
      incidentNumber: id,
      ...parsed,
      status: 'REPORTED',
      reportedById: userId,
      version: 'v1.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.safetyIncidentStore.set(id, record);

    this.obsLogger.logAudit({
      actorId: userId,
      action: 'SAFETY_INCIDENT_REPORTED',
      entity: 'SafetyIncident',
      entityId: id,
      details: { incidentType: record.incidentType, severity: record.severity, location: record.location },
    });

    return record;
  }

  public async updateIncident(id: string, dto: UpdateIncidentDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const inc = this.safetyIncidentStore.get(id);
    if (!inc || inc.tenantId !== tenantId) throw new NotFoundException(`Incident not found: ${id}`);
    const updated = { ...inc, ...dto, updatedAt: new Date().toISOString() };
    this.safetyIncidentStore.set(id, updated);
    return updated;
  }

  public async investigateIncident(id: string, dto: InvestigateDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const parsed = InvestigateDtoSchema.parse(dto);
    const inc = this.safetyIncidentStore.get(id);
    if (!inc || inc.tenantId !== tenantId) throw new NotFoundException(`Incident not found: ${id}`);

    inc.status = 'INVESTIGATION_COMPLETE';
    inc.rootCause = parsed.rootCause;
    inc.correctiveAction = parsed.correctiveAction;
    inc.preventiveAction = parsed.preventiveAction;
    inc.investigatedById = userId;
    inc.investigationDate = new Date().toISOString();
    inc.investigationReport = parsed.investigationReport;
    inc.updatedAt = new Date().toISOString();
    this.safetyIncidentStore.set(id, inc);

    return { success: true, message: `Incident ${inc.incidentNumber} CAPA investigation completed`, incident: inc };
  }

  public async getPpeIssuance(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    return Array.from(this.ppeStore.values()).filter((p) => p.tenantId === tenantId);
  }

  public async issuePpe(dto: IssuePpeDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const parsed = IssuePpeDtoSchema.parse(dto);
    const id = `PPE-${parsed.employeeId}-${Date.now().toString().slice(-6)}`;
    const record = {
      id,
      tenantId,
      ...parsed,
      condition: 'NEW',
      replaced: false,
      version: 'v1.0',
      createdById: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.ppeStore.set(id, record);
    return record;
  }

  public async getSafetyMetrics(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    const incidents = await this.getIncidents(tenantId);
    return {
      zeroHarmDaysStreak: 182,
      totalIncidentsReportedYtd: incidents.length,
      nearMissesCount: incidents.filter((i) => i.incidentType === 'NEAR_MISS').length,
      lostTimeInjuriesCount: incidents.filter((i) => i.daysLost > 0).length,
      firstAidCasesCount: incidents.filter((i) => i.severity === 'LOW').length,
      openCapasCount: incidents.filter((i) => i.status !== 'CLOSED').length,
      ppeComplianceAuditScorePct: 98.2,
    };
  }

  // ============================================================================
  // SCREEN 8: PAYROLL & STATUTORY SLIPS
  // ============================================================================

  public async getPayrollRecords(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    return Array.from(this.payrollRecordStore.values()).filter((p) => p.tenantId === tenantId);
  }

  public async runPayroll(dto: RunPayrollDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    return this.tracing.traceOperation('HrService.runPayroll', async () => {
      const parsed = RunPayrollDtoSchema.parse(dto);
      const employees = await this.getEmployees(tenantId);
      const targetEmployees = parsed.department ? employees.filter((e) => e.department === parsed.department) : employees;

      let totalGross = 0;
      let totalDeductions = 0;
      let totalNet = 0;
      const records: any[] = [];

      for (const emp of targetEmployees) {
        if (emp.employmentStatus !== 'ACTIVE' && emp.employmentStatus !== 'ON_PROBATION') continue;

        const basic = emp.basicSalary || 25000;
        const hra = emp.hra || 10000;
        const special = emp.specialAllowance || 5000;
        const grossEarnings = this.round(basic + hra + special);

        // Indian Statutory Deductions
        const pfEmployee = this.round(Math.min(basic, 15000) * 0.12); // PF 12% on basic capped at 15k or full
        const pfEmployer = pfEmployee;
        const esiEmployee = grossEarnings <= 21000 ? this.round(grossEarnings * 0.0075) : 0; // ESI 0.75%
        const esiEmployer = grossEarnings <= 21000 ? this.round(grossEarnings * 0.0325) : 0; // ESI 3.25%
        const professionalTax = 200; // PT standard slab
        const incomeTax = grossEarnings > 50000 ? this.round((grossEarnings - 50000) * 0.1) : 0; // Simplified TDS

        const deductions = this.round(pfEmployee + esiEmployee + professionalTax + incomeTax);
        const netPay = this.round(grossEarnings - deductions);

        const recId = `PAY-${parsed.period}-${emp.id}`;
        const payRecord = {
          id: recId,
          tenantId,
          payrollNumber: recId,
          employeeId: emp.id,
          employeeName: emp.fullName,
          employeeCode: emp.employeeCode,
          designation: emp.designation,
          department: emp.department,
          period: parsed.period,
          fiscalYear: parsed.fiscalYear,
          month: parsed.month,
          year: parsed.year,
          basicSalary: basic,
          hra,
          specialAllowance: special,
          grossEarnings,
          pfEmployee,
          pfEmployer,
          esiEmployee,
          esiEmployer,
          professionalTax,
          incomeTax,
          totalDeductions: deductions,
          netPay,
          paymentStatus: 'PROCESSED',
          slipGenerated: true,
          version: 'v1.0',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        this.payrollRecordStore.set(recId, payRecord);
        records.push(payRecord);

        totalGross += grossEarnings;
        totalDeductions += deductions;
        totalNet += netPay;
      }

      // Record Payroll Run summary
      const runId = `PRUN-${parsed.period}`;
      const payrollRun = {
        id: runId,
        tenantId,
        runNumber: runId,
        period: parsed.period,
        fiscalYear: parsed.fiscalYear,
        month: parsed.month,
        year: parsed.year,
        totalEmployees: records.length,
        totalGross: this.round(totalGross),
        totalDeductions: this.round(totalDeductions),
        totalNetPay: this.round(totalNet),
        status: 'COMPLETED',
        processedAt: new Date().toISOString(),
        processedById: userId,
      };
      this.payrollRunStore.set(runId, payrollRun);

      this.metrics.incrementBusinessEvent('payroll_run_completed', 'HR');
      this.obsLogger.logAudit({
        actorId: userId,
        action: 'PAYROLL_RUN',
        entity: 'PayrollRun',
        entityId: runId,
        details: { period: parsed.period, employeeCount: records.length, totalNetPay: totalNet },
      });

      return {
        success: true,
        payrollRun,
        processedCount: records.length,
        records,
      };
    }, { period: dto.period, tenantId, userId });
  }

  public async approvePayroll(id: string, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const run = this.payrollRunStore.get(id);
    if (!run || run.tenantId !== tenantId) throw new NotFoundException(`Payroll run not found: ${id}`);
    run.status = 'APPROVED';
    run.approvedById = userId;
    run.approvedAt = new Date().toISOString();
    this.payrollRunStore.set(id, run);
    return { success: true, message: `Payroll run ${run.runNumber} approved for bank disbursement`, payrollRun: run };
  }

  public async generatePaySlip(payrollId: string, tenantId: string = 'TENANT-ALPHA-IND') {
    const pay = this.payrollRecordStore.get(payrollId);
    if (!pay || pay.tenantId !== tenantId) throw new NotFoundException(`Payroll record not found: ${payrollId}`);
    return {
      payrollNumber: pay.payrollNumber,
      employeeName: pay.employeeName,
      employeeCode: pay.employeeCode,
      period: pay.period,
      slipDownloadUrl: `/api/hr/payroll/${payrollId}/slip`,
      generatedAt: new Date().toISOString(),
    };
  }

  public async getPaySlip(payrollId: string, tenantId: string = 'TENANT-ALPHA-IND') {
    return this.payrollRecordStore.get(payrollId);
  }

  public async getStatutoryDeductions(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    const records = await this.getPayrollRecords(tenantId, filters);
    const totalPfEmployee = this.round(records.reduce((s, r) => s + (r.pfEmployee || 0), 0));
    const totalPfEmployer = this.round(records.reduce((s, r) => s + (r.pfEmployer || 0), 0));
    const totalEsi = this.round(records.reduce((s, r) => s + (r.esiEmployee || 0) + (r.esiEmployer || 0), 0));
    const totalPt = this.round(records.reduce((s, r) => s + (r.professionalTax || 0), 0));
    const totalTds = this.round(records.reduce((s, r) => s + (r.incomeTax || 0), 0));

    return {
      period: filters.period || '2026-09',
      pf: { employee: totalPfEmployee, employer: totalPfEmployer, total: totalPfEmployee + totalPfEmployer },
      esi: { total: totalEsi },
      professionalTax: { total: totalPt },
      tds: { total: totalTds },
      grandTotalStatutoryLiability: totalPfEmployee + totalPfEmployer + totalEsi + totalPt + totalTds,
    };
  }

  // ============================================================================
  // SCREEN 9: LABOR LAW & CLRA COMPLIANCE
  // ============================================================================

  public async getContractors(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    return Array.from(this.contractorStore.values()).filter((c) => c.tenantId === tenantId);
  }

  public async addContractor(dto: AddContractorDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const parsed = AddContractorDtoSchema.parse(dto);
    const id = `CLRA-${Date.now().toString().slice(-6)}`;
    const record = {
      id,
      tenantId,
      contractorId: id,
      ...parsed,
      status: 'ACTIVE',
      complianceStatus: 'COMPLIANT',
      version: 'v1.0',
      createdById: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.contractorStore.set(id, record);
    return record;
  }

  public async getStatutoryCompliance(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    return Array.from(this.statutoryComplianceStore.values()).filter((s) => s.tenantId === tenantId);
  }

  public async fileStatutoryReturn(dto: FileStatutoryDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const parsed = FileStatutoryDtoSchema.parse(dto);
    const id = `STAT-${parsed.complianceType}-${parsed.period}`;
    const record = {
      id,
      tenantId,
      ...parsed,
      status: 'FILED',
      filingDate: new Date().toISOString(),
      createdById: userId,
      version: 'v1.0',
      createdAt: new Date().toISOString(),
    };
    this.statutoryComplianceStore.set(id, record);
    return { success: true, message: `${parsed.complianceType} statutory return filed for ${parsed.period}`, return: record };
  }

  public async getComplianceAudit(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    return {
      auditScorePct: 98.5,
      clraLicenceValidUntil: '2027-03-31',
      factoryLicenceStatus: 'VALID',
      form16IssuedCount: 142,
      form24qQuarterlyFiling: 'UP_TO_DATE',
      epfoEcrGenerated: true,
      esicChallanPaid: true,
    };
  }

  // ============================================================================
  // SCREEN 10: HR ANALYTICS & REPORTS
  // ============================================================================

  public async getHeadcountAnalytics(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    const employees = await this.getEmployees(tenantId);
    return {
      totalHeadcount: employees.length,
      maleCount: employees.filter((e) => e.gender === 'MALE').length,
      femaleCount: employees.filter((e) => e.gender === 'FEMALE').length,
      permanentCount: employees.filter((e) => e.employmentType === 'PERMANENT').length,
      contractCount: employees.filter((e) => e.employmentType === 'CONTRACT').length,
      averageTenureYears: 3.4,
    };
  }

  public async getAttritionAnalytics(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    return {
      monthlyAttritionPct: 1.2,
      annualizedAttritionPct: 14.4,
      resignedCountYtd: 8,
      terminatedCountYtd: 2,
      topExitReason: 'Better career opportunity / Relocation',
    };
  }

  public async getAttendanceAnalytics(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    return {
      averageAttendancePct: 95.8,
      punctualityRatePct: 92.4,
      overtimeHoursTotal: 480,
      totalUnplannedLeaves: 14,
    };
  }

  public async getPayrollAnalytics(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    return {
      totalPayrollSpendYtd: 48500000,
      averageSalaryPerEmployee: 48200,
      overtimePayoutYtd: 1250000,
      statutoryContributionYtd: 6800000,
    };
  }

  public async getSafetyAnalytics(tenantId: string = 'TENANT-ALPHA-IND', filters: any = {}) {
    return this.getSafetyMetrics(tenantId, filters);
  }

  public async generateHrReport(dto: GenerateReportDto, tenantId: string = 'TENANT-ALPHA-IND', userId: string = 'USR-ADMIN-01') {
    const parsed = GenerateReportDtoSchema.parse(dto);
    return {
      reportType: parsed.reportType,
      period: parsed.period,
      format: parsed.format,
      generatedAt: new Date().toISOString(),
      downloadUrl: `/api/hr/reports/${parsed.reportType}-${parsed.period}.${parsed.format.toLowerCase()}`,
      metadata: {
        totalRecords: 142,
        generatedBy: userId,
      },
    };
  }

  // ============================================================================
  // HELPERS & SEED DATA
  // ============================================================================

  private round(val: number): number {
    return Math.round((val + Number.EPSILON) * 100) / 100;
  }

  private incrementVersion(version: string = 'v1.0'): string {
    const match = version.match(/v(\d+)\.(\d+)/);
    if (!match) return 'v1.1';
    return `v${match[1]}.${parseInt(match[2]) + 1}`;
  }

  private initLeaveBalancesForEmployee(employeeId: string, tenantId: string, userId: string) {
    const year = new Date().getFullYear();
    const defaults = [
      { leaveType: 'CASUAL_LEAVE', allocated: 12 },
      { leaveType: 'SICK_LEAVE', allocated: 12 },
      { leaveType: 'EARNED_LEAVE', allocated: 18 },
      { leaveType: 'COMPENSATORY_OFF', allocated: 3 },
    ];

    defaults.forEach((d) => {
      const id = `BAL-${employeeId}-${d.leaveType}-${year}`;
      this.leaveBalanceStore.set(id, {
        id,
        tenantId,
        employeeId,
        leaveType: d.leaveType,
        year,
        openingBalance: d.allocated,
        allocated: d.allocated,
        availed: 0,
        closingBalance: d.allocated,
        carryForward: 0,
        version: 'v1.0',
        createdById: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });
  }

  private seedDefaultHrData() {
    const tenantId = 'TENANT-ALPHA-IND';
    const userId = 'USR-ADMIN-01';

    // Seed Employees
    const defaultEmps = [
      {
        id: 'EMP-001',
        employeeCode: 'EMP-001',
        firstName: 'Rajesh',
        lastName: 'Sharma',
        fullName: 'Rajesh Sharma',
        email: 'rajesh.sharma@spplastech.com',
        phone: '+91 98201 11223',
        dateOfBirth: '1988-04-12',
        gender: 'MALE',
        designation: 'Senior Mold Technician',
        department: 'Tooling & Maintenance',
        employmentType: 'PERMANENT',
        employmentStatus: 'ACTIVE',
        dateOfJoining: '2021-03-01',
        ctc: 720000,
        basicSalary: 35000,
        hra: 15000,
        specialAllowance: 10000,
      },
      {
        id: 'EMP-002',
        employeeCode: 'EMP-002',
        firstName: 'Priya',
        lastName: 'Nair',
        fullName: 'Priya Nair',
        email: 'priya.nair@spplastech.com',
        phone: '+91 98402 33445',
        dateOfBirth: '1992-08-20',
        gender: 'FEMALE',
        designation: 'Quality Assurance Lead',
        department: 'Quality Assurance',
        employmentType: 'PERMANENT',
        employmentStatus: 'ACTIVE',
        dateOfJoining: '2022-06-15',
        ctc: 840000,
        basicSalary: 42000,
        hra: 18000,
        specialAllowance: 10000,
      },
      {
        id: 'EMP-003',
        employeeCode: 'EMP-003',
        firstName: 'Vikram',
        lastName: 'Patel',
        fullName: 'Vikram Patel',
        email: 'vikram.patel@spplastech.com',
        phone: '+91 97203 55667',
        dateOfBirth: '1995-11-05',
        gender: 'MALE',
        designation: 'Extrusion Line Operator',
        department: 'Production',
        employmentType: 'PERMANENT',
        employmentStatus: 'ACTIVE',
        dateOfJoining: '2023-01-10',
        ctc: 480000,
        basicSalary: 22000,
        hra: 9000,
        specialAllowance: 9000,
      },
    ];

    defaultEmps.forEach((emp) => {
      this.employeeStore.set(emp.id, {
        tenantId,
        ...emp,
        version: 'v1.0',
        createdById: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      this.initLeaveBalancesForEmployee(emp.id, tenantId, userId);
    });

    // Seed Skills
    const defaultSkills = [
      { id: 'SKILL-001', skillCode: 'SKILL-001', skillName: 'Injection Molding Machine Operation', skillCategory: 'TECHNICAL', skillLevel: 'ADVANCED', isIatfRequired: true },
      { id: 'SKILL-002', skillCode: 'SKILL-002', skillName: 'Mold Die Setup & Clamping', skillCategory: 'TECHNICAL', skillLevel: 'EXPERT', isIatfRequired: true },
      { id: 'SKILL-003', skillCode: 'SKILL-003', skillName: 'EHS Chemical & Spill Management', skillCategory: 'SAFETY', skillLevel: 'INTERMEDIATE', isIatfRequired: false },
      { id: 'SKILL-004', skillCode: 'SKILL-004', skillName: 'IATF 16949 Core Tools & MSA', skillCategory: 'QUALITY', skillLevel: 'ADVANCED', isIatfRequired: true },
    ];

    defaultSkills.forEach((s) => {
      this.skillStore.set(s.id, {
        tenantId,
        ...s,
        isActive: true,
        version: 'v1.0',
        createdById: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    // Seed Safety Incident
    this.safetyIncidentStore.set('INC-2026-001', {
      id: 'INC-2026-001',
      tenantId,
      incidentNumber: 'INC-2026-001',
      incidentType: 'NEAR_MISS',
      severity: 'LOW',
      incidentDate: '2026-09-20',
      incidentTime: '14:30',
      location: 'Plant 1 - Molding Bay B',
      department: 'Production',
      description: 'Hydraulic oil drip noticed near Machine IMM-03 during mold purge',
      status: 'INVESTIGATION_COMPLETE',
      rootCause: 'Seal wear on secondary return line',
      correctiveAction: 'Replaced O-ring seal and torqued to OEM spec',
      preventiveAction: 'Added hydraulic seal inspection to weekly PM checklist',
      reportedById: userId,
      version: 'v1.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}
