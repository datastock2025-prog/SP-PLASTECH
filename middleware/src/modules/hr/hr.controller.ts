import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { HrService } from './hr.service';
import {
  CreateEmployeeDto,
  UpdateEmployeeDto,
  ExitEmployeeDto,
  RecordPunchDto,
  SyncBiometricDto,
  AdjustAttendanceDto,
  AssignShiftDto,
  SwapShiftDto,
  CreateLeaveDto,
  CreateOvertimeDto,
  CreateSkillDto,
  AddSkillDto,
  CreateTrainingDto,
  EnrollDto,
  ReportIncidentDto,
  UpdateIncidentDto,
  InvestigateDto,
  IssuePpeDto,
  RunPayrollDto,
  AddContractorDto,
  FileStatutoryDto,
  GenerateReportDto,
} from './hr.dto';

@Controller('hr')
export class HrController {
  constructor(private readonly service: HrService) {}

  // ============================================================================
  // SCREEN 1: HR COMMAND CENTER (DASHBOARD & KPIS)
  // ============================================================================

  @Get('dashboard')
  async getHrDashboard(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getHrDashboard(tenantId);
    return { success: true, data };
  }

  @Get('dashboard/kpis')
  async getHrKpis(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getHrKpis(tenantId, filters);
    return { success: true, data };
  }

  @Get('dashboard/headcount')
  async getHeadcount(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getHeadcount(tenantId, filters);
    return { success: true, data };
  }

  // ============================================================================
  // SCREEN 2: EMPLOYEE MASTER (360°)
  // ============================================================================

  @Get('employees')
  async getEmployees(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getEmployees(tenantId, filters);
    return { success: true, data };
  }

  @Post('employees')
  async createEmployee(@Body() dto: CreateEmployeeDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const data = await this.service.createEmployee(dto, tenantId, userId);
    return { success: true, data };
  }

  @Put('employees/:id')
  async updateEmployee(@Param('id') id: string, @Body() dto: UpdateEmployeeDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const data = await this.service.updateEmployee(id, dto, tenantId, userId);
    return { success: true, data };
  }

  @Get('employees/:id/360')
  async getEmployee360(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getEmployee360(id, tenantId);
    return { success: true, data };
  }

  @Post('employees/:id/onboard')
  async onboardEmployee(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    return this.service.onboardEmployee(id, tenantId, userId);
  }

  @Post('employees/:id/exit')
  async exitEmployee(@Param('id') id: string, @Body() dto: ExitEmployeeDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    return this.service.exitEmployee(id, dto, tenantId, userId);
  }

  // ============================================================================
  // SCREEN 3: BIOMETRIC ATTENDANCE & PUNCHES
  // ============================================================================

  @Get('attendance')
  async getAttendance(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getAttendance(tenantId, filters);
    return { success: true, data };
  }

  @Post('attendance/punch')
  async recordPunch(@Body() dto: RecordPunchDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.recordPunch(dto, tenantId);
    return { success: true, data };
  }

  @Post('attendance/sync-biometric')
  async syncBiometricData(@Body() dto: SyncBiometricDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const data = await this.service.syncBiometricData(dto, tenantId, userId);
    return { success: true, data };
  }

  @Post('attendance/:id/adjust')
  async adjustAttendance(@Param('id') id: string, @Body() dto: AdjustAttendanceDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const data = await this.service.adjustAttendance(id, dto, tenantId, userId);
    return { success: true, data };
  }

  @Get('attendance/summary')
  async getAttendanceSummary(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getAttendanceSummary(tenantId, filters);
    return { success: true, data };
  }

  // ============================================================================
  // SCREEN 4: SHIFT ROSTER & LINE STAFFING
  // ============================================================================

  @Get('shifts/roster')
  async getShiftRoster(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getShiftRoster(tenantId, filters);
    return { success: true, data };
  }

  @Post('shifts/assign')
  async assignShift(@Body() dto: AssignShiftDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const data = await this.service.assignShift(dto, tenantId, userId);
    return { success: true, data };
  }

  @Post('shifts/swap')
  async swapShift(@Body() dto: SwapShiftDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    return this.service.swapShift(dto, tenantId, userId);
  }

  @Get('shifts/line-staffing')
  async getLineStaffing(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getLineStaffing(tenantId, filters);
    return { success: true, data };
  }

  // ============================================================================
  // SCREEN 5: LEAVE & OVERTIME APPROVALS
  // ============================================================================

  @Get('leaves')
  async getLeaves(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getLeaves(tenantId, filters);
    return { success: true, data };
  }

  @Post('leaves')
  async createLeaveRequest(@Body() dto: CreateLeaveDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const data = await this.service.createLeaveRequest(dto, tenantId, userId);
    return { success: true, data };
  }

  @Post('leaves/:id/approve')
  async approveLeave(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const approverId = req.user?.id || 'USR-ADMIN-01';
    return this.service.approveLeave(id, tenantId, approverId);
  }

  @Post('leaves/:id/reject')
  async rejectLeave(@Param('id') id: string, @Body('reason') reason: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const approverId = req.user?.id || 'USR-ADMIN-01';
    return this.service.rejectLeave(id, tenantId, approverId, reason);
  }

  @Get('leaves/balance')
  async getLeaveBalance(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getLeaveBalance(tenantId, filters);
    return { success: true, data };
  }

  @Get('leaves/pending-approvals')
  async getPendingApprovals(@Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const approverId = req.user?.id || 'USR-ADMIN-01';
    const data = await this.service.getPendingApprovals(tenantId, approverId);
    return { success: true, data };
  }

  @Get('overtime')
  async getOvertimeRequests(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getOvertimeRequests(tenantId, filters);
    return { success: true, data };
  }

  @Post('overtime')
  async createOvertimeRequest(@Body() dto: CreateOvertimeDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const data = await this.service.createOvertimeRequest(dto, tenantId, userId);
    return { success: true, data };
  }

  @Post('overtime/:id/approve')
  async approveOvertime(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    return this.service.approveOvertime(id, tenantId, userId);
  }

  // ============================================================================
  // SCREEN 6: SKILL MATRIX & COMPETENCY (IATF 16949)
  // ============================================================================

  @Get('skills')
  async getSkills(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getSkills(tenantId, filters);
    return { success: true, data };
  }

  @Post('skills')
  async createSkill(@Body() dto: CreateSkillDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const data = await this.service.createSkill(dto, tenantId, userId);
    return { success: true, data };
  }

  @Get('employees/:id/skills')
  async getEmployeeSkills(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getEmployeeSkills(id, tenantId);
    return { success: true, data };
  }

  @Post('employees/:id/skills')
  async addEmployeeSkill(@Param('id') id: string, @Body() dto: AddSkillDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const data = await this.service.addEmployeeSkill(id, dto, tenantId, userId);
    return { success: true, data };
  }

  @Get('trainings')
  async getTrainings(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getTrainings(tenantId, filters);
    return { success: true, data };
  }

  @Post('trainings')
  async createTraining(@Body() dto: CreateTrainingDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const data = await this.service.createTraining(dto, tenantId, userId);
    return { success: true, data };
  }

  @Post('trainings/:id/enroll')
  async enrollInTraining(@Param('id') id: string, @Body() dto: EnrollDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    return this.service.enrollInTraining(id, dto, tenantId, userId);
  }

  @Get('skill-matrix')
  async getSkillMatrix(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getSkillMatrix(tenantId, filters);
    return { success: true, data };
  }

  // ============================================================================
  // SCREEN 7: SAFETY (EHS) & ZERO-HARM INCIDENTS
  // ============================================================================

  @Get('safety/incidents')
  async getIncidents(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getIncidents(tenantId, filters);
    return { success: true, data };
  }

  @Post('safety/incidents')
  async reportIncident(@Body() dto: ReportIncidentDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const data = await this.service.reportIncident(dto, tenantId, userId);
    return { success: true, data };
  }

  @Put('safety/incidents/:id')
  async updateIncident(@Param('id') id: string, @Body() dto: UpdateIncidentDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const data = await this.service.updateIncident(id, dto, tenantId, userId);
    return { success: true, data };
  }

  @Post('safety/incidents/:id/investigate')
  async investigateIncident(@Param('id') id: string, @Body() dto: InvestigateDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    return this.service.investigateIncident(id, dto, tenantId, userId);
  }

  @Get('safety/ppe')
  async getPpeIssuance(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getPpeIssuance(tenantId, filters);
    return { success: true, data };
  }

  @Post('safety/ppe/issue')
  async issuePpe(@Body() dto: IssuePpeDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const data = await this.service.issuePpe(dto, tenantId, userId);
    return { success: true, data };
  }

  @Get('safety/metrics')
  async getSafetyMetrics(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getSafetyMetrics(tenantId, filters);
    return { success: true, data };
  }

  // ============================================================================
  // SCREEN 8: PAYROLL & STATUTORY SLIPS
  // ============================================================================

  @Get('payroll')
  async getPayrollRecords(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getPayrollRecords(tenantId, filters);
    return { success: true, data };
  }

  @Post('payroll/run')
  async runPayroll(@Body() dto: RunPayrollDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    return this.service.runPayroll(dto, tenantId, userId);
  }

  @Post('payroll/:id/approve')
  async approvePayroll(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    return this.service.approvePayroll(id, tenantId, userId);
  }

  @Post('payroll/:id/generate-slip')
  async generatePaySlip(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.generatePaySlip(id, tenantId);
    return { success: true, data };
  }

  @Get('payroll/:id/slip')
  async getPaySlip(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getPaySlip(id, tenantId);
    return { success: true, data };
  }

  @Get('payroll/statutory')
  async getStatutoryDeductions(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getStatutoryDeductions(tenantId, filters);
    return { success: true, data };
  }

  // ============================================================================
  // SCREEN 9: LABOR LAW & CLRA COMPLIANCE
  // ============================================================================

  @Get('compliance/contractors')
  async getContractors(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getContractors(tenantId, filters);
    return { success: true, data };
  }

  @Post('compliance/contractors')
  async addContractor(@Body() dto: AddContractorDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const data = await this.service.addContractor(dto, tenantId, userId);
    return { success: true, data };
  }

  @Get('compliance/statutory')
  async getStatutoryCompliance(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getStatutoryCompliance(tenantId, filters);
    return { success: true, data };
  }

  @Post('compliance/statutory/file')
  async fileStatutoryReturn(@Body() dto: FileStatutoryDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    return this.service.fileStatutoryReturn(dto, tenantId, userId);
  }

  @Get('compliance/audit')
  async getComplianceAudit(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getComplianceAudit(tenantId, filters);
    return { success: true, data };
  }

  // ============================================================================
  // SCREEN 10: HR ANALYTICS & REPORTS
  // ============================================================================

  @Get('analytics/headcount')
  async getHeadcountAnalytics(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getHeadcountAnalytics(tenantId, filters);
    return { success: true, data };
  }

  @Get('analytics/attrition')
  async getAttritionAnalytics(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getAttritionAnalytics(tenantId, filters);
    return { success: true, data };
  }

  @Get('analytics/attendance')
  async getAttendanceAnalytics(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getAttendanceAnalytics(tenantId, filters);
    return { success: true, data };
  }

  @Get('analytics/payroll')
  async getPayrollAnalytics(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getPayrollAnalytics(tenantId, filters);
    return { success: true, data };
  }

  @Get('analytics/safety')
  async getSafetyAnalytics(@Query() filters: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const data = await this.service.getSafetyAnalytics(tenantId, filters);
    return { success: true, data };
  }

  @Post('analytics/reports/generate')
  async generateHrReport(@Body() dto: GenerateReportDto, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const userId = req.user?.id || 'USR-ADMIN-01';
    const data = await this.service.generateHrReport(dto, tenantId, userId);
    return { success: true, data };
  }
}
