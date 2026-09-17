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
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import {
  CreateUserDto,
  UpdateUserDto,
  CreateRoleDto,
  UpdateRoleDto,
  CreatePlantDto,
  UpdatePlantDto,
  CreateNumberingSequenceDto,
  UpdateNumberingSequenceDto,
  CreateWorkflowDto,
  UpdateWorkflowDto,
} from './admin.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ==========================================
  // USERS
  // ==========================================
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

  // ==========================================
  // ROLES
  // ==========================================
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

  // ==========================================
  // PLANTS / FACILITIES
  // ==========================================
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

  // ==========================================
  // NUMBERING SEQUENCES
  // ==========================================
  @Get('numbering')
  async getNumberingSequences(@Query('tenantId') tenantId?: string) {
    const sequences = await this.adminService.getNumberingSequences(tenantId || 'TENANT-ALPHA-IND');
    return { success: true, sequences };
  }

  @Post('numbering')
  async createNumberingSequence(@Body() dto: CreateNumberingSequenceDto, @Req() req: any) {
    const actorId = req.user?.id || 'USR-ADMIN-01';
    const sequence = await this.adminService.createNumberingSequence(dto, actorId);
    return { success: true, sequence };
  }

  @Put('numbering/:id')
  async updateNumberingSequence(
    @Param('id') id: string,
    @Body() dto: UpdateNumberingSequenceDto,
    @Req() req: any
  ) {
    const actorId = req.user?.id || 'USR-ADMIN-01';
    const sequence = await this.adminService.updateNumberingSequence(id, dto, actorId);
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

  // ==========================================
  // APPROVAL WORKFLOWS
  // ==========================================
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

  // ==========================================
  // SYSTEM PARAMETERS
  // ==========================================
  @Get('parameters')
  async getParameters(@Query('tenantId') tenantId?: string) {
    const parameters = await this.adminService.getParameters(tenantId || 'TENANT-ALPHA-IND');
    return { success: true, parameters };
  }

  @Put('parameters/:id')
  async updateParameter(
    @Param('id') id: string,
    @Body('paramValue') paramValue: string,
    @Req() req: any
  ) {
    const actorId = req.user?.id || 'USR-ADMIN-01';
    const parameter = await this.adminService.updateParameter(id, paramValue, actorId);
    return { success: true, parameter };
  }

  // ==========================================
  // SYSTEM HEALTH & POOL TELEMETRY
  // ==========================================
  @Get('system-health')
  async getSystemHealth() {
    const health = await this.adminService.getSystemHealth();
    return { success: true, ...health };
  }
}
