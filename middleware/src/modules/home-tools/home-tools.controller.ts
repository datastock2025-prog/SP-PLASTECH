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
import { HomeToolsService } from './home-tools.service';
import {
  CreateDashboardWidgetDto,
  UpdateDashboardWidgetDto,
  CreateTaskDto,
  UpdateTaskStatusDto,
  SubmitApprovalRequestDto,
  ProcessApprovalStageActionDto,
  CreateSavedViewDto,
  UpdateSavedViewDto,
  LogRecentRecordDto,
} from './home-tools.dto';

@Controller('home-tools')
export class HomeToolsController {
  constructor(private readonly homeToolsService: HomeToolsService) {}

  // ==================== SCREEN 1: WORKSPACE HOME ====================
  @Get('dashboard')
  async getDashboard(@Req() req: any, @Query('userId') userId?: string, @Query('tenantId') tenantId?: string) {
    const user = userId || req?.user?.id || 'USR-ADMIN-01';
    const tenant = tenantId || req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    return this.homeToolsService.getDashboardData(user, tenant);
  }

  @Get('dashboard/widgets')
  async getDashboardWidgets(@Req() req: any, @Query('userId') userId?: string, @Query('tenantId') tenantId?: string) {
    const user = userId || req?.user?.id || 'USR-ADMIN-01';
    const tenant = tenantId || req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    return this.homeToolsService.getDashboardWidgets(user, tenant);
  }

  @Post('dashboard/widgets')
  async createWidget(@Body() dto: CreateDashboardWidgetDto, @Req() req: any) {
    const user = req?.user?.id || 'USR-ADMIN-01';
    const tenant = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    return this.homeToolsService.createDashboardWidget(user, tenant, dto);
  }

  @Put('dashboard/widgets/:id')
  async updateWidget(@Param('id') id: string, @Body() dto: UpdateDashboardWidgetDto, @Req() req: any) {
    const user = req?.user?.id || 'USR-ADMIN-01';
    const tenant = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    return this.homeToolsService.updateDashboardWidget(id, user, tenant, dto);
  }

  // ==================== SCREEN 2: MY TASKS ====================
  @Get('tasks')
  async getTasks(
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Req() req?: any
  ) {
    const user = req?.user?.id || 'USR-ADMIN-01';
    const tenant = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    return this.homeToolsService.getTasks(user, tenant, { status, priority, page, limit });
  }

  @Get('tasks/:id')
  async getTask(@Param('id') id: string, @Req() req?: any) {
    const user = req?.user?.id || 'USR-ADMIN-01';
    const tenant = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const task = await this.homeToolsService.getTaskById(id, tenant);
    await this.homeToolsService.logRecentRecord(user, tenant, 'Task', id, task.title, `/tasks/${id}`);
    return task;
  }

  @Post('tasks')
  async createTask(@Body() dto: CreateTaskDto, @Req() req?: any) {
    const user = req?.user?.id || 'USR-ADMIN-01';
    const tenant = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    return this.homeToolsService.createTask(user, tenant, dto);
  }

  @Put('tasks/:id/status')
  async updateTaskStatus(@Param('id') id: string, @Body() dto: UpdateTaskStatusDto, @Req() req?: any) {
    const user = req?.user?.id || 'USR-ADMIN-01';
    const tenant = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    return this.homeToolsService.updateTaskStatus(id, dto.status, user, tenant);
  }

  // ==================== SCREEN 3: MY APPROVALS ====================
  @Get('approvals')
  async getApprovals(
    @Query('status') status?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Req() req?: any
  ) {
    const user = req?.user?.id || 'USR-ADMIN-01';
    const tenant = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    return this.homeToolsService.getApprovalsForUser(user, tenant, { status, page, limit });
  }

  @Get('approvals/:id')
  async getApproval(@Param('id') id: string, @Req() req?: any) {
    const user = req?.user?.id || 'USR-ADMIN-01';
    const tenant = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    const approval = await this.homeToolsService.getApprovalById(id, tenant);
    await this.homeToolsService.logRecentRecord(user, tenant, 'ApprovalRequest', id, approval.title, `/approvals/${id}`);
    return approval;
  }

  @Post('approvals')
  async submitApproval(@Body() dto: SubmitApprovalRequestDto, @Req() req?: any) {
    const user = req?.user?.id || 'USR-ADMIN-01';
    const tenant = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    return this.homeToolsService.submitApprovalRequest(user, tenant, dto);
  }

  @Post('approvals/:id/action')
  async processApproval(
    @Param('id') id: string,
    @Body() dto: ProcessApprovalStageActionDto,
    @Req() req?: any
  ) {
    const user = req?.user?.id || 'USR-ADMIN-01';
    const userEmail = req?.user?.email || 'admin@sp-plastech.com';
    const tenant = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    return this.homeToolsService.processApproval(id, user, userEmail, tenant, dto);
  }

  // ==================== SCREEN 4: NOTIFICATIONS ====================
  @Get('notifications')
  async getNotifications(
    @Query('isRead') isRead?: boolean,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
    @Req() req?: any
  ) {
    const user = req?.user?.id || 'USR-ADMIN-01';
    const tenant = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    return this.homeToolsService.getNotifications(user, tenant, { isRead, page, limit });
  }

  @Get('notifications/unread-count')
  async getUnreadCount(@Req() req?: any) {
    const user = req?.user?.id || 'USR-ADMIN-01';
    const tenant = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    return this.homeToolsService.getUnreadNotificationCount(user, tenant);
  }

  @Post('notifications/:id/read')
  async markAsRead(@Param('id') id: string, @Req() req?: any) {
    const user = req?.user?.id || 'USR-ADMIN-01';
    const tenant = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    return this.homeToolsService.markNotificationAsRead(id, user, tenant);
  }

  @Post('notifications/read-all')
  async markAllAsRead(@Req() req?: any) {
    const user = req?.user?.id || 'USR-ADMIN-01';
    const tenant = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    return this.homeToolsService.markAllNotificationsAsRead(user, tenant);
  }

  // ==================== SCREEN 5: SAVED VIEWS ====================
  @Get('saved-views')
  async getSavedViews(@Query('module') module?: string, @Req() req?: any) {
    const user = req?.user?.id || 'USR-ADMIN-01';
    const tenant = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    return this.homeToolsService.getSavedViews(user, tenant, module);
  }

  @Post('saved-views')
  async createSavedView(@Body() dto: CreateSavedViewDto, @Req() req?: any) {
    const user = req?.user?.id || 'USR-ADMIN-01';
    const tenant = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    return this.homeToolsService.createSavedView(user, tenant, dto);
  }

  @Put('saved-views/:id')
  async updateSavedView(@Param('id') id: string, @Body() dto: UpdateSavedViewDto, @Req() req?: any) {
    const user = req?.user?.id || 'USR-ADMIN-01';
    const tenant = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    return this.homeToolsService.updateSavedView(id, user, tenant, dto);
  }

  @Delete('saved-views/:id')
  async deleteSavedView(@Param('id') id: string, @Req() req?: any) {
    const user = req?.user?.id || 'USR-ADMIN-01';
    const tenant = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    return this.homeToolsService.deleteSavedView(id, user, tenant);
  }

  // ==================== SCREEN 6: RECENT RECORDS ====================
  @Get('recent-records')
  async getRecentRecords(@Query('limit') limit: number = 20, @Req() req?: any) {
    const user = req?.user?.id || 'USR-ADMIN-01';
    const tenant = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    return this.homeToolsService.getRecentRecords(user, tenant, limit);
  }

  @Post('recent-records')
  async logRecentRecord(@Body() dto: LogRecentRecordDto, @Req() req?: any) {
    const user = req?.user?.id || 'USR-ADMIN-01';
    const tenant = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    return this.homeToolsService.logRecentRecord(user, tenant, dto.entityType, dto.entityId, dto.recordName, dto.recordUrl);
  }

  @Delete('recent-records/:id')
  async deleteRecentRecord(@Param('id') id: string, @Req() req?: any) {
    const user = req?.user?.id || 'USR-ADMIN-01';
    const tenant = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    return this.homeToolsService.deleteRecentRecord(id, user, tenant);
  }

  @Delete('recent-records')
  async clearRecentRecords(@Req() req?: any) {
    const user = req?.user?.id || 'USR-ADMIN-01';
    const tenant = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    return this.homeToolsService.clearRecentRecords(user, tenant);
  }

  // ==================== AUDIT TRAIL ENDPOINTS ====================
  @Get('audit-logs')
  async getAuditLogs(
    @Query('entityName') entityName?: string,
    @Query('entityId') entityId?: string,
    @Req() req?: any
  ) {
    const tenant = req?.headers?.['x-tenant-id'] || 'TENANT-ALPHA-IND';
    return this.homeToolsService.getAuditLogs(tenant, entityName, entityId);
  }
}
