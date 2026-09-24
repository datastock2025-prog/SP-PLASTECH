import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import {
  CreateUserDto,
  UpdateUserDto,
  CreateUserGroupDto,
  AddMemberDto,
  CreateRoleDto,
  UpdateRoleDto,
  UpdatePermissionsDto,
  SimulateRoleDto,
  CreateContextDto,
  AssignContextDto,
  CreateWorkflowDto,
  UpdateWorkflowDto,
  UpdateCompanyDto,
  CreatePlantDto,
  UpdatePlantDto,
  CreateWarehouseDto,
  CreateLocationDto,
  CreateMachineDto,
  CreateMoldDto,
  CreateShiftDto,
  MarkHolidayDto,
  CreateReasonCodeDto,
  CreateNumberSequenceDto,
  CreateNotificationRuleDto,
  TestRuleDto,
  CreateGovernanceRuleDto,
  CreateDocumentDto,
  CreateEmailConfigDto,
  TestEmailDto,
  CreateApiKeyDto,
  CreateBackupConfigDto,
  UpdateLicenseDto,
  ImportDataDto,
  ExportDataDto,
  CreateCustomFieldDto,
} from './admin.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ============================================================================
  // SCREEN 1: USER DIRECTORY & MANAGEMENT
  // ============================================================================
  @Get('users')
  async getUsers(@Query('tenantId') tenantId?: string) {
    const users = await this.adminService.getUsers(tenantId || 'TENANT-ALPHA-IND');
    return { success: true, users };
  }

  @Get('users/:id')
  async getUserById(@Param('id') id: string) {
    const user = await this.adminService.getUserById(id);
    return { success: true, user };
  }

  @Post('users')
  async createUser(@Body() dto: CreateUserDto, @Req() req: any) {
    const actorId = req.user?.id || 'USR-ADMIN-01';
    const user = await this.adminService.createUser(dto, actorId);
    return { success: true, user };
  }

  @Put('users/:id')
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto, @Req() req: any) {
    const actorId = req.user?.id || 'USR-ADMIN-01';
    const user = await this.adminService.updateUser(id, dto, actorId);
    return { success: true, user };
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string, @Req() req: any) {
    const actorId = req.user?.id || 'USR-ADMIN-01';
    const result = await this.adminService.deleteUser(id, actorId);
    return result;
  }

  @Post('users/:id/reset-pin')
  async resetPin(@Param('id') id: string, @Body('pin') pin: string, @Req() req: any) {
    const actorId = req.user?.id || 'USR-ADMIN-01';
    const result = await this.adminService.resetUserPin(id, pin || '1234', actorId);
    return result;
  }

  // ============================================================================
  // SCREEN 2: USER GROUPS & CREWS
  // ============================================================================
  @Get('user-groups')
  async getUserGroups(@Query('tenantId') tenantId?: string) {
    const groups = await this.adminService.getUserGroups(tenantId || 'TENANT-ALPHA-IND');
    return { success: true, groups };
  }

  @Post('user-groups')
  async createUserGroup(@Body() dto: CreateUserGroupDto, @Req() req: any) {
    const actorId = req.user?.id || 'USR-ADMIN-01';
    const group = await this.adminService.createUserGroup(dto, actorId);
    return { success: true, group };
  }

  @Post('user-groups/:id/members')
  async addGroupMember(@Param('id') groupId: string, @Body() dto: AddMemberDto, @Req() req: any) {
    const actorId = req.user?.id || 'USR-ADMIN-01';
    const result = await this.adminService.addGroupMember(groupId, dto, actorId);
    return result;
  }

  @Delete('user-groups/:id/members/:userId')
  async removeGroupMember(@Param('id') groupId: string, @Param('userId') userId: string) {
    const result = await this.adminService.removeGroupMember(groupId, userId);
    return result;
  }

  // ============================================================================
  // SCREEN 3: RBAC PERMISSION MATRIX & SIMULATOR
  // ============================================================================
  @Get('roles')
  async getRoles() {
    const roles = await this.adminService.getRoles();
    return { success: true, roles };
  }

  @Post('roles')
  async createRole(@Body() dto: CreateRoleDto, @Req() req: any) {
    const actorId = req.user?.id || 'USR-ADMIN-01';
    const role = await this.adminService.createRole(dto, actorId);
    return { success: true, role };
  }

  @Put('roles/:id')
  async updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto, @Req() req: any) {
    const actorId = req.user?.id || 'USR-ADMIN-01';
    const role = await this.adminService.updateRole(id, dto, actorId);
    return { success: true, role };
  }

  @Delete('roles/:id')
  async deleteRole(@Param('id') id: string, @Req() req: any) {
    const actorId = req.user?.id || 'USR-ADMIN-01';
    const result = await this.adminService.deleteRole(id, actorId);
    return result;
  }

  @Put('roles/:id/permissions')
  async updateRolePermissions(@Param('id') id: string, @Body() dto: UpdatePermissionsDto) {
    const result = await this.adminService.updateRolePermissions(id, dto);
    return result;
  }

  @Post('roles/simulate')
  async simulateRolePermissions(@Body() dto: SimulateRoleDto) {
    const simulation = await this.adminService.simulateRolePermissions(dto);
    return { success: true, simulation };
  }

  // ============================================================================
  // SCREEN 4: RBAC MULTI-CONTEXT SECURITY
  // ============================================================================
  @Get('contexts')
  async getContexts(@Query('tenantId') tenantId?: string) {
    const contexts = await this.adminService.getContexts(tenantId || 'TENANT-ALPHA-IND');
    return { success: true, contexts };
  }

  @Post('contexts')
  async createContext(@Body() dto: CreateContextDto, @Req() req: any) {
    const actorId = req.user?.id || 'USR-ADMIN-01';
    const context = await this.adminService.createContext(dto, actorId);
    return { success: true, context };
  }

  @Get('users/:userId/contexts')
  async getUserContexts(@Param('userId') userId: string) {
    const userContexts = await this.adminService.getUserContexts(userId);
    return { success: true, userContexts };
  }

  @Post('users/:userId/contexts')
  async assignUserContext(
    @Param('userId') userId: string,
    @Body() dto: AssignContextDto,
    @Req() req: any
  ) {
    const actorId = req.user?.id || 'USR-ADMIN-01';
    const assignment = await this.adminService.assignUserContext(userId, dto, actorId);
    return { success: true, assignment };
  }

  // ============================================================================
  // SCREEN 5: MULTI-TIER APPROVAL WORKFLOWS
  // ============================================================================
  @Get('workflows')
  async getWorkflows(@Query('tenantId') tenantId?: string) {
    const workflows = await this.adminService.getWorkflows(tenantId || 'TENANT-ALPHA-IND');
    return { success: true, workflows };
  }

  @Post('workflows')
  async createWorkflow(@Body() dto: CreateWorkflowDto, @Req() req: any) {
    const actorId = req.user?.id || 'USR-ADMIN-01';
    const workflow = await this.adminService.createWorkflow(dto, actorId);
    return { success: true, workflow };
  }

  @Put('workflows/:id')
  async updateWorkflow(@Param('id') id: string, @Body() dto: UpdateWorkflowDto, @Req() req: any) {
    const actorId = req.user?.id || 'USR-ADMIN-01';
    const workflow = await this.adminService.updateWorkflow(id, dto, actorId);
    return { success: true, workflow };
  }

  @Delete('workflows/:id')
  async deleteWorkflow(@Param('id') id: string, @Req() req: any) {
    const actorId = req.user?.id || 'USR-ADMIN-01';
    const result = await this.adminService.deleteWorkflow(id, actorId);
    return result;
  }

  // ============================================================================
  // SCREEN 6: COMPANY PROFILE & ORGANIZATION SETUP
  // ============================================================================
  @Get('company')
  async getCompanyProfile(@Query('tenantId') tenantId?: string) {
    const company = await this.adminService.getCompanyProfile(tenantId || 'TENANT-ALPHA-IND');
    return { success: true, company };
  }

  @Put('company')
  async updateCompanyProfile(
    @Body() dto: UpdateCompanyDto,
    @Req() req: any,
    @Query('tenantId') tenantId?: string
  ) {
    const actorId = req.user?.id || 'USR-ADMIN-01';
    const company = await this.adminService.updateCompanyProfile(dto, actorId, tenantId || 'TENANT-ALPHA-IND');
    return { success: true, company };
  }

  // ============================================================================
  // SCREEN 7: PLANTS & MANUFACTURING FACILITIES
  // ============================================================================
  @Get('plants')
  async getPlants() {
    const plants = await this.adminService.getPlants();
    return { success: true, plants };
  }

  @Post('plants')
  async createPlant(@Body() dto: CreatePlantDto, @Req() req: any) {
    const actorId = req.user?.id || 'USR-ADMIN-01';
    const plant = await this.adminService.createPlant(dto, actorId);
    return { success: true, plant };
  }

  @Put('plants/:id')
  async updatePlant(@Param('id') id: string, @Body() dto: UpdatePlantDto, @Req() req: any) {
    const actorId = req.user?.id || 'USR-ADMIN-01';
    const plant = await this.adminService.updatePlant(id, dto, actorId);
    return { success: true, plant };
  }

  @Delete('plants/:id')
  async deletePlant(@Param('id') id: string, @Req() req: any) {
    const actorId = req.user?.id || 'USR-ADMIN-01';
    const result = await this.adminService.deletePlant(id, actorId);
    return result;
  }

  // ============================================================================
  // SCREEN 8: WAREHOUSES & SILO STORAGE LOCATIONS
  // ============================================================================
  @Get('warehouses')
  async getWarehouses(@Query('plantId') plantId?: string) {
    const warehouses = await this.adminService.getWarehouses(plantId);
    return { success: true, warehouses };
  }

  @Post('warehouses')
  async createWarehouse(@Body() dto: CreateWarehouseDto, @Req() req: any) {
    const actorId = req.user?.id || 'USR-ADMIN-01';
    const warehouse = await this.adminService.createWarehouse(dto, actorId);
    return { success: true, warehouse };
  }

  @Get('warehouses/:id/locations')
  async getWarehouseLocations(@Param('id') warehouseId: string) {
    const locations = await this.adminService.getWarehouseLocations(warehouseId);
    return { success: true, locations };
  }

  @Post('warehouses/:id/locations')
  async createLocation(
    @Param('id') warehouseId: string,
    @Body() dto: CreateLocationDto,
    @Req() req: any
  ) {
    const actorId = req.user?.id || 'USR-ADMIN-01';
    const location = await this.adminService.createLocation(warehouseId, dto, actorId);
    return { success: true, location };
  }

  // ============================================================================
  // SCREEN 9: MACHINE & WORK CENTER REGISTRY
  // ============================================================================
  @Get('machines')
  async getMachines(@Query('plantId') plantId?: string) {
    const machines = await this.adminService.getMachines(plantId);
    return { success: true, machines };
  }

  @Post('machines')
  async createMachine(@Body() dto: CreateMachineDto, @Req() req: any) {
    const actorId = req.user?.id || 'USR-ADMIN-01';
    const machine = await this.adminService.createMachine(dto, actorId);
    return { success: true, machine };
  }

  @Get('molds')
  async getMolds(@Query('machineId') machineId?: string) {
    const molds = await this.adminService.getMolds(machineId);
    return { success: true, molds };
  }

  @Post('molds')
  async createMold(@Body() dto: CreateMoldDto, @Req() req: any) {
    const actorId = req.user?.id || 'USR-ADMIN-01';
    const mold = await this.adminService.createMold(dto, actorId);
    return { success: true, mold };
  }

  // ============================================================================
  // SCREEN 10: SHIFT SCHEDULE & WORKING CALENDAR
  // ============================================================================
  @Get('shifts')
  async getShifts() {
    const shifts = await this.adminService.getShifts();
    return { success: true, shifts };
  }

  @Post('shifts')
  async createShift(@Body() dto: CreateShiftDto, @Req() req: any) {
    const actorId = req.user?.id || 'USR-ADMIN-01';
    const shift = await this.adminService.createShift(dto, actorId);
    return { success: true, shift };
  }

  @Get('calendar/holidays')
  async getCalendarHolidays(@Query('year') year?: number) {
    const holidays = await this.adminService.getCalendarHolidays(year ? Number(year) : undefined);
    return { success: true, holidays };
  }

  @Post('calendar/holidays')
  async markHoliday(@Body() dto: MarkHolidayDto, @Req() req: any) {
    const actorId = req.user?.id || 'USR-ADMIN-01';
    const holiday = await this.adminService.markHoliday(dto, actorId);
    return { success: true, holiday };
  }

  // ============================================================================
  // SCREEN 11: REASON CODES (Downtime, Rejection, Delay)
  // ============================================================================
  @Get('reason-codes')
  async getReasonCodes(@Query('category') category?: string) {
    const reasonCodes = await this.adminService.getReasonCodes(category);
    return { success: true, reasonCodes };
  }

  @Post('reason-codes')
  async createReasonCode(@Body() dto: CreateReasonCodeDto, @Req() req: any) {
    const actorId = req.user?.id || 'USR-ADMIN-01';
    const reasonCode = await this.adminService.createReasonCode(dto, actorId);
    return { success: true, reasonCode };
  }

  // ============================================================================
  // SCREEN 12: NUMBERING SEQUENCES & AUTO-COUNTERS
  // ============================================================================
  @Get('numbering')
  async getNumberingSequences(@Query('tenantId') tenantId?: string) {
    const sequences = await this.adminService.getNumberingSequences(tenantId || 'TENANT-ALPHA-IND');
    return { success: true, sequences };
  }

  @Post('numbering')
  async createNumberingSequence(@Body() dto: CreateNumberSequenceDto, @Req() req: any) {
    const actorId = req.user?.id || 'USR-ADMIN-01';
    const sequence = await this.adminService.createNumberingSequence(dto, actorId);
    return { success: true, sequence };
  }

  @Post('numbering/generate')
  async generateNextNumber(
    @Body('module') moduleName: string,
    @Body('documentType') documentType: string,
    @Body('tenantId') tenantId?: string
  ) {
    const documentNumber = await this.adminService.generateNextNumber(
      moduleName,
      documentType,
      tenantId || 'TENANT-ALPHA-IND'
    );
    return { success: true, documentNumber };
  }

  // ============================================================================
  // SCREEN 13: NOTIFICATION RULES & DISPATCHERS
  // ============================================================================
  @Get('notifications/rules')
  async getNotificationRules() {
    const rules = await this.adminService.getNotificationRules();
    return { success: true, rules };
  }

  @Post('notifications/rules')
  async createNotificationRule(@Body() dto: CreateNotificationRuleDto, @Req() req: any) {
    const actorId = req.user?.id || 'USR-ADMIN-01';
    const rule = await this.adminService.createNotificationRule(dto, actorId);
    return { success: true, rule };
  }

  @Post('notifications/rules/test')
  async testNotificationRule(@Body() dto: TestRuleDto) {
    const result = await this.adminService.testNotificationRule(dto);
    return { success: true, result };
  }

  // ============================================================================
  // SCREEN 14: MASTER DATA GOVERNANCE (MDG) RULES
  // ============================================================================
  @Get('governance/rules')
  async getGovernanceRules(@Query('entityType') entityType?: string) {
    const rules = await this.adminService.getGovernanceRules(entityType);
    return { success: true, rules };
  }

  @Post('governance/rules')
  async createGovernanceRule(@Body() dto: CreateGovernanceRuleDto, @Req() req: any) {
    const actorId = req.user?.id || 'USR-ADMIN-01';
    const rule = await this.adminService.createGovernanceRule(dto, actorId);
    return { success: true, rule };
  }

  // ============================================================================
  // SCREEN 15: DOCUMENT MANAGEMENT & COMPLIANCE DMS
  // ============================================================================
  @Get('documents')
  async getDocuments(@Query('category') category?: string) {
    const documents = await this.adminService.getDocuments(category);
    return { success: true, documents };
  }

  @Post('documents')
  async uploadDocument(@Body() dto: CreateDocumentDto, @Req() req: any) {
    const actorId = req.user?.id || 'USR-ADMIN-01';
    const document = await this.adminService.uploadDocument(dto, actorId);
    return { success: true, document };
  }

  // ============================================================================
  // SCREEN 16: SECURITY & AUDIT TRAIL LOGS
  // ============================================================================
  @Get('audit-logs')
  async getAuditLogs(
    @Query('entityName') entityName?: string,
    @Query('action') action?: string,
    @Query('limit') limit?: number
  ) {
    const logs = await this.adminService.getAuditLogs({ entityName, action, limit: limit ? Number(limit) : undefined });
    return { success: true, logs };
  }

  @Get('security/events')
  async getSecurityEvents(@Query('limit') limit?: number) {
    const events = await this.adminService.getSecurityEvents(limit ? Number(limit) : undefined);
    return { success: true, events };
  }

  // ============================================================================
  // SCREEN 17: EMAIL & SMTP CONFIGURATION
  // ============================================================================
  @Get('email/configs')
  async getEmailConfigs() {
    const configs = await this.adminService.getEmailConfigs();
    return { success: true, configs };
  }

  @Post('email/configs')
  async saveEmailConfig(@Body() dto: CreateEmailConfigDto, @Req() req: any) {
    const actorId = req.user?.id || 'USR-ADMIN-01';
    const config = await this.adminService.saveEmailConfig(dto, actorId);
    return { success: true, config };
  }

  @Post('email/test')
  async testEmailConfig(@Body() dto: TestEmailDto) {
    const result = await this.adminService.testEmailConfig(dto);
    return { success: true, result };
  }

  // ============================================================================
  // SCREEN 18: INTEGRATIONS & API KEYS
  // ============================================================================
  @Get('api-keys')
  async getApiKeys() {
    const apiKeys = await this.adminService.getApiKeys();
    return { success: true, apiKeys };
  }

  @Post('api-keys')
  async createApiKey(@Body() dto: CreateApiKeyDto, @Req() req: any) {
    const actorId = req.user?.id || 'USR-ADMIN-01';
    const apiKey = await this.adminService.createApiKey(dto, actorId);
    return { success: true, apiKey };
  }

  @Post('api-keys/:id/rotate')
  async rotateApiKey(@Param('id') id: string, @Req() req: any) {
    const actorId = req.user?.id || 'USR-ADMIN-01';
    const result = await this.adminService.rotateApiKey(id, actorId);
    return result;
  }

  @Delete('api-keys/:id')
  async revokeApiKey(@Param('id') id: string) {
    const result = await this.adminService.revokeApiKey(id);
    return result;
  }

  // ============================================================================
  // SCREEN 19: BACKUP & DISASTER RECOVERY
  // ============================================================================
  @Get('backups/configs')
  async getBackupConfigs() {
    const configs = await this.adminService.getBackupConfigs();
    return { success: true, configs };
  }

  @Post('backups/configs')
  async createBackupConfig(@Body() dto: CreateBackupConfigDto, @Req() req: any) {
    const actorId = req.user?.id || 'USR-ADMIN-01';
    const config = await this.adminService.createBackupConfig(dto, actorId);
    return { success: true, config };
  }

  @Post('backups/manual')
  async triggerManualBackup(@Body('configId') configId?: string) {
    const backup = await this.adminService.triggerManualBackup(configId || 'DEFAULT');
    return { success: true, backup };
  }

  // ============================================================================
  // SCREEN 20: LICENSE & SUBSCRIPTION
  // ============================================================================
  @Get('license')
  async getLicenseStatus(@Query('tenantId') tenantId?: string) {
    const license = await this.adminService.getLicenseStatus(tenantId || 'TENANT-ALPHA-IND');
    return { success: true, license };
  }

  @Put('license')
  async updateLicense(@Body() dto: UpdateLicenseDto, @Query('tenantId') tenantId?: string) {
    const license = await this.adminService.updateLicense(dto, tenantId || 'TENANT-ALPHA-IND');
    return { success: true, license };
  }

  // ============================================================================
  // SCREEN 21: DATA IMPORT / EXPORT ENGINE
  // ============================================================================
  @Post('data/import')
  async executeDataImport(@Body() dto: ImportDataDto, @Req() req: any) {
    const actorId = req.user?.id || 'USR-ADMIN-01';
    const result = await this.adminService.executeDataImport(dto, actorId);
    return { success: true, result };
  }

  @Post('data/export')
  async executeDataExport(@Body() dto: ExportDataDto) {
    const result = await this.adminService.executeDataExport(dto);
    return { success: true, result };
  }

  // ============================================================================
  // SCREEN 22: CUSTOM FIELDS & FORMS BUILDER
  // ============================================================================
  @Get('custom-fields')
  async getCustomFields(@Query('entityType') entityType?: string) {
    const customFields = await this.adminService.getCustomFields(entityType);
    return { success: true, customFields };
  }

  @Post('custom-fields')
  async createCustomField(@Body() dto: CreateCustomFieldDto, @Req() req: any) {
    const actorId = req.user?.id || 'USR-ADMIN-01';
    const customField = await this.adminService.createCustomField(dto, actorId);
    return { success: true, customField };
  }

  // ============================================================================
  // SCREEN 23: SYSTEM HEALTH & POOL TELEMETRY
  // ============================================================================
  @Get('system-health')
  async getSystemHealth() {
    const health = await this.adminService.getSystemHealth();
    return { success: true, ...health };
  }
}
