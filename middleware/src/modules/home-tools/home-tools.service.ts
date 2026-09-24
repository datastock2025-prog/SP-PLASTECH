import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  CreateDashboardWidgetDto,
  CreateDashboardWidgetDtoSchema,
  UpdateDashboardWidgetDto,
  UpdateDashboardWidgetDtoSchema,
  CreateTaskDto,
  CreateTaskDtoSchema,
  SubmitApprovalRequestDto,
  SubmitApprovalRequestDtoSchema,
  ProcessApprovalStageActionDto,
  ProcessApprovalStageActionDtoSchema,
  CreateNotificationDto,
  CreateNotificationDtoSchema,
  CreateSavedViewDto,
  CreateSavedViewDtoSchema,
  UpdateSavedViewDto,
  UpdateSavedViewDtoSchema,
  LogRecentRecordDto,
  LogRecentRecordDtoSchema,
} from './home-tools.dto';

@Injectable()
export class HomeToolsService {
  private readonly logger = new Logger(HomeToolsService.name);

  // In-memory local stores for zero-downtime hybrid execution
  private widgetsStore = new Map<string, any[]>();
  private tasksStore = new Map<string, any>();
  private approvalsStore = new Map<string, any>();
  private notificationsStore = new Map<string, any>();
  private savedViewsStore = new Map<string, any>();
  private recentRecordsStore = new Map<string, any[]>();
  private auditLogsStore: any[] = [];
  private entityVersionsStore: any[] = [];

  constructor(private readonly db: DatabaseService) {
    this.seedDefaultHomeToolsData();
  }

  // ============================================================================
  // SCREEN 1: WORKSPACE HOME DASHBOARD
  // ============================================================================
  public async getDashboardData(userId: string, tenantId: string = 'TENANT-ALPHA-IND') {
    const widgets = await this.getDashboardWidgets(userId, tenantId);
    
    // Aggregate high-level stats
    const tasks = Array.from(this.tasksStore.values()).filter((t) => t.assignedToId === userId && t.status === 'PENDING');
    const approvals = Array.from(this.approvalsStore.values()).filter((a) => a.status === 'PENDING');
    const unreadNotifs = Array.from(this.notificationsStore.values()).filter((n) => n.userId === userId && !n.isRead);

    return {
      success: true,
      tenantId,
      userId,
      stats: {
        pendingTasksCount: tasks.length,
        pendingApprovalsCount: approvals.length,
        unreadNotificationsCount: unreadNotifs.length,
        activeWorkOrders: 14,
        averagePlantOeePct: 84.6,
        plantStatus: 'OPERATIONAL_NOMINAL',
      },
      widgets,
    };
  }

  public async getDashboardWidgets(userId: string, tenantId: string = 'TENANT-ALPHA-IND') {
    const key = `${tenantId}_${userId}`;
    let list = this.widgetsStore.get(key);
    if (!list || list.length === 0) {
      list = this.getDefaultWidgets(userId, tenantId);
      this.widgetsStore.set(key, list);
    }
    return list.filter((w) => w.isVisible).sort((a, b) => a.position - b.position);
  }

  public async createDashboardWidget(userId: string, tenantId: string, dto: CreateDashboardWidgetDto) {
    const parsed = CreateDashboardWidgetDtoSchema.parse(dto);
    const key = `${tenantId}_${userId}`;
    const list = this.widgetsStore.get(key) || [];

    const newWidget = {
      id: `WDG-${Date.now().toString().slice(-6)}`,
      tenantId,
      userId,
      widgetType: parsed.widgetType,
      title: parsed.title,
      config: parsed.config,
      position: parsed.position || list.length + 1,
      isVisible: parsed.isVisible ?? true,
      refreshInterval: parsed.refreshInterval || 300,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    list.push(newWidget);
    this.widgetsStore.set(key, list);
    await this.recordAuditLog(tenantId, userId, 'CREATE', 'DashboardWidget', newWidget.id, null, newWidget);

    return newWidget;
  }

  public async updateDashboardWidget(id: string, userId: string, tenantId: string, dto: UpdateDashboardWidgetDto) {
    const parsed = UpdateDashboardWidgetDtoSchema.parse(dto);
    const key = `${tenantId}_${userId}`;
    const list = this.widgetsStore.get(key) || [];
    const index = list.findIndex((w) => w.id === id);

    if (index === -1) throw new NotFoundException(`Widget with ID ${id} not found.`);

    const oldData = { ...list[index] };
    const updated = { ...oldData, ...parsed, updatedAt: new Date().toISOString() };
    list[index] = updated;
    this.widgetsStore.set(key, list);

    await this.recordAuditLog(tenantId, userId, 'UPDATE', 'DashboardWidget', id, oldData, updated);
    return updated;
  }

  // ============================================================================
  // SCREEN 2: MY TASKS
  // ============================================================================
  public async getTasks(
    userId: string,
    tenantId: string = 'TENANT-ALPHA-IND',
    filters: { status?: string; priority?: string; page?: number; limit?: number } = {}
  ) {
    let items = Array.from(this.tasksStore.values()).filter(
      (t) => t.tenantId === tenantId && (t.assignedToId === userId || t.assignedToId === 'ALL')
    );

    if (filters.status) items = items.filter((t) => t.status === filters.status);
    if (filters.priority) items = items.filter((t) => t.priority === filters.priority);

    const total = items.length;
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    const startIndex = (page - 1) * limit;
    const paginated = items.slice(startIndex, startIndex + limit);

    return { tasks: paginated, total, page, totalPages: Math.ceil(total / limit) };
  }

  public async getTaskById(id: string, tenantId: string = 'TENANT-ALPHA-IND') {
    const task = this.tasksStore.get(id);
    if (!task || task.tenantId !== tenantId) {
      throw new NotFoundException(`Task ${id} not found.`);
    }
    return task;
  }

  public async createTask(userId: string, tenantId: string, dto: CreateTaskDto) {
    const parsed = CreateTaskDtoSchema.parse(dto);
    const taskNumber = `TASK-2026-${Date.now().toString().slice(-6)}`;

    const newTask = {
      id: taskNumber,
      taskNumber,
      tenantId,
      assignedToId: parsed.assignedToId || userId,
      title: parsed.title,
      description: parsed.description || '',
      taskType: parsed.taskType,
      priority: parsed.priority,
      status: parsed.status || 'PENDING',
      dueDate: parsed.dueDate || new Date(Date.now() + 86400000).toISOString(),
      completedAt: null,
      relatedEntityType: parsed.relatedEntityType || null,
      relatedEntityId: parsed.relatedEntityId || null,
      metadata: parsed.metadata || {},
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.tasksStore.set(taskNumber, newTask);
    await this.recordAuditLog(tenantId, userId, 'CREATE', 'Task', taskNumber, null, newTask);

    return newTask;
  }

  public async updateTaskStatus(id: string, status: string, userId: string, tenantId: string) {
    const task = await this.getTaskById(id, tenantId);
    const oldData = { ...task };

    task.status = status;
    task.completedAt = status === 'COMPLETED' ? new Date().toISOString() : null;
    task.updatedAt = new Date().toISOString();

    this.tasksStore.set(id, task);
    await this.recordAuditLog(tenantId, userId, 'UPDATE', 'Task', id, oldData, task);

    return task;
  }

  // ============================================================================
  // SCREEN 3: MY APPROVALS
  // ============================================================================
  public async getApprovalsForUser(
    userId: string,
    tenantId: string = 'TENANT-ALPHA-IND',
    filters: { status?: string; page?: number; limit?: number } = {}
  ) {
    let list = Array.from(this.approvalsStore.values()).filter((a) => a.tenantId === tenantId);
    if (filters.status) list = list.filter((a) => a.status === filters.status);

    const total = list.length;
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    const paginated = list.slice((page - 1) * limit, page * limit);

    return { approvals: paginated, total, page };
  }

  public async getApprovalById(id: string, tenantId: string = 'TENANT-ALPHA-IND') {
    const req = this.approvalsStore.get(id);
    if (!req || req.tenantId !== tenantId) throw new NotFoundException(`Approval Request ${id} not found.`);
    return req;
  }

  public async submitApprovalRequest(userId: string, tenantId: string, dto: SubmitApprovalRequestDto) {
    const parsed = SubmitApprovalRequestDtoSchema.parse(dto);
    const reqNumber = `APR-2026-${Date.now().toString().slice(-6)}`;

    const newApproval = {
      id: reqNumber,
      requestNumber: reqNumber,
      tenantId,
      entityType: parsed.entityType,
      entityId: parsed.entityId,
      title: parsed.title,
      description: parsed.description || '',
      submittedById: userId,
      submittedAt: new Date().toISOString(),
      priority: parsed.priority,
      status: 'PENDING',
      currentStage: 1,
      metadata: parsed.metadata || {},
      stages: parsed.stages.map((stg) => ({
        id: `STG-${Date.now().toString().slice(-4)}-${stg.stageNumber}`,
        stageNumber: stg.stageNumber,
        approverId: stg.approverId,
        approverEmail: stg.approverEmail,
        approverName: stg.approverName,
        status: 'PENDING',
        action: null,
        comments: null,
        actedAt: null,
        required: stg.required ?? true,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.approvalsStore.set(reqNumber, newApproval);
    await this.recordAuditLog(tenantId, userId, 'SUBMIT', 'ApprovalRequest', reqNumber, null, newApproval);

    return newApproval;
  }

  public async processApproval(
    id: string,
    userId: string,
    userEmail: string,
    tenantId: string,
    dto: ProcessApprovalStageActionDto
  ) {
    const parsed = ProcessApprovalStageActionDtoSchema.parse(dto);
    const approval = await this.getApprovalById(id, tenantId);
    const oldData = JSON.parse(JSON.stringify(approval));

    const currentStageIndex = approval.currentStage - 1;
    const stage = approval.stages[currentStageIndex];

    if (stage) {
      stage.action = parsed.action;
      stage.comments = parsed.comments || 'Action processed.';
      stage.actedAt = new Date().toISOString();
      stage.status = parsed.action === 'APPROVE' ? 'APPROVED' : parsed.action === 'REJECT' ? 'REJECTED' : 'ESCALATED';
    }

    if (parsed.action === 'APPROVE') {
      if (approval.currentStage < approval.stages.length) {
        approval.currentStage += 1;
        approval.status = 'IN_REVIEW';
      } else {
        approval.status = 'APPROVED';
      }
    } else if (parsed.action === 'REJECT') {
      approval.status = 'REJECTED';
    } else if (parsed.action === 'REQUEST_CHANGES') {
      approval.status = 'PENDING';
    }

    approval.updatedAt = new Date().toISOString();
    this.approvalsStore.set(id, approval);

    await this.recordAuditLog(tenantId, userId, parsed.action as any, 'ApprovalRequest', id, oldData, approval);

    return approval;
  }

  // ============================================================================
  // SCREEN 4: NOTIFICATIONS
  // ============================================================================
  public async getNotifications(
    userId: string,
    tenantId: string = 'TENANT-ALPHA-IND',
    filters: { isRead?: boolean; page?: number; limit?: number } = {}
  ) {
    let list = Array.from(this.notificationsStore.values()).filter(
      (n) => n.tenantId === tenantId && (n.userId === userId || n.userId === 'ALL')
    );

    if (filters.isRead !== undefined) {
      list = list.filter((n) => n.isRead === filters.isRead);
    }

    const total = list.length;
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 50;
    const paginated = list.slice((page - 1) * limit, page * limit);

    return { notifications: paginated, total, page };
  }

  public async getUnreadNotificationCount(userId: string, tenantId: string = 'TENANT-ALPHA-IND') {
    const count = Array.from(this.notificationsStore.values()).filter(
      (n) => n.tenantId === tenantId && (n.userId === userId || n.userId === 'ALL') && !n.isRead
    ).length;
    return { count };
  }

  public async markNotificationAsRead(id: string, userId: string, tenantId: string) {
    const notif = this.notificationsStore.get(id);
    if (notif && notif.tenantId === tenantId) {
      notif.isRead = true;
      notif.readAt = new Date().toISOString();
      this.notificationsStore.set(id, notif);
    }
    return { success: true };
  }

  public async markAllNotificationsAsRead(userId: string, tenantId: string) {
    Array.from(this.notificationsStore.values())
      .filter((n) => n.tenantId === tenantId && (n.userId === userId || n.userId === 'ALL') && !n.isRead)
      .forEach((n) => {
        n.isRead = true;
        n.readAt = new Date().toISOString();
        this.notificationsStore.set(n.id, n);
      });
    return { success: true };
  }

  // ============================================================================
  // SCREEN 5: SAVED VIEWS
  // ============================================================================
  public async getSavedViews(userId: string, tenantId: string = 'TENANT-ALPHA-IND', module?: string) {
    let views = Array.from(this.savedViewsStore.values()).filter(
      (v) => v.tenantId === tenantId && (v.userId === userId || v.isPublic)
    );
    if (module) views = views.filter((v) => v.module.toLowerCase() === module.toLowerCase());
    return views;
  }

  public async createSavedView(userId: string, tenantId: string, dto: CreateSavedViewDto) {
    const parsed = CreateSavedViewDtoSchema.parse(dto);
    const viewId = `VIEW-${Date.now().toString().slice(-6)}`;

    const newView = {
      id: viewId,
      tenantId,
      userId,
      name: parsed.name,
      module: parsed.module,
      filters: parsed.filters,
      columns: parsed.columns || [],
      sortOrder: parsed.sortOrder || {},
      isPublic: parsed.isPublic ?? false,
      isDefault: parsed.isDefault ?? false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.savedViewsStore.set(viewId, newView);
    await this.recordAuditLog(tenantId, userId, 'CREATE', 'SavedView', viewId, null, newView);

    return newView;
  }

  public async updateSavedView(id: string, userId: string, tenantId: string, dto: UpdateSavedViewDto) {
    const parsed = UpdateSavedViewDtoSchema.parse(dto);
    const view = this.savedViewsStore.get(id);
    if (!view || view.tenantId !== tenantId) throw new NotFoundException(`Saved view ${id} not found.`);

    const oldData = { ...view };
    const updated = { ...view, ...parsed, updatedAt: new Date().toISOString() };
    this.savedViewsStore.set(id, updated);

    await this.recordAuditLog(tenantId, userId, 'UPDATE', 'SavedView', id, oldData, updated);
    return updated;
  }

  public async deleteSavedView(id: string, userId: string, tenantId: string) {
    const view = this.savedViewsStore.get(id);
    if (view && view.tenantId === tenantId) {
      this.savedViewsStore.delete(id);
      await this.recordAuditLog(tenantId, userId, 'DELETE', 'SavedView', id, view, null);
    }
    return { success: true };
  }

  // ============================================================================
  // SCREEN 6: RECENT RECORDS (LRU Access Log)
  // ============================================================================
  public async getRecentRecords(userId: string, tenantId: string = 'TENANT-ALPHA-IND', limit: number = 20) {
    const key = `${tenantId}_${userId}`;
    const list = this.recentRecordsStore.get(key) || [];
    return list.slice(0, Number(limit) || 20);
  }

  public async logRecentRecord(
    userId: string,
    tenantId: string,
    entityType: string,
    entityId: string,
    recordName: string,
    recordUrl: string
  ) {
    const key = `${tenantId}_${userId}`;
    let list = this.recentRecordsStore.get(key) || [];

    // Filter out duplicate existing record and add to front (LRU)
    list = list.filter((r) => r.entityId !== entityId);
    list.unshift({
      id: `REC-${Date.now().toString().slice(-6)}`,
      tenantId,
      userId,
      entityType,
      entityId,
      recordName,
      recordUrl,
      accessedAt: new Date().toISOString(),
    });

    // Keep top 50 records
    if (list.length > 50) list = list.slice(0, 50);
    this.recentRecordsStore.set(key, list);

    return { success: true };
  }

  public async deleteRecentRecord(recordId: string, userId: string, tenantId: string) {
    const key = `${tenantId}_${userId}`;
    let list = this.recentRecordsStore.get(key) || [];
    list = list.filter((r) => r.id !== recordId && r.entityId !== recordId);
    this.recentRecordsStore.set(key, list);
    return { success: true };
  }

  public async clearRecentRecords(userId: string, tenantId: string) {
    const key = `${tenantId}_${userId}`;
    this.recentRecordsStore.set(key, []);
    return { success: true };
  }

  // ============================================================================
  // CORE AUDIT & VERSIONING INFRASTRUCTURE
  // ============================================================================
  public async recordAuditLog(
    tenantId: string,
    actorId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'SUBMIT' | 'CANCEL' | 'EXPORT' | 'LOGIN',
    entityName: string,
    entityId: string,
    oldData: any,
    newData: any,
    details: any = {}
  ) {
    const auditEntry = {
      id: `AUD-${Date.now().toString().slice(-6)}`,
      tenantId,
      actorId,
      actorEmail: actorId.includes('@') ? actorId : `${actorId.toLowerCase()}@sp-plastech.com`,
      action,
      entityName,
      entityId,
      entityVersion: newData?.version || oldData?.version || 'v1.0',
      oldData: oldData ? JSON.parse(JSON.stringify(oldData)) : null,
      newData: newData ? JSON.parse(JSON.stringify(newData)) : null,
      ipAddress: '127.0.0.1',
      userAgent: 'SP-PLASTECH Enterprise Core',
      details,
      createdAt: new Date().toISOString(),
    };

    this.auditLogsStore.push(auditEntry);
    this.logger.log(`[Audit] ${action} on ${entityName}:${entityId} by ${actorId}`);
    return auditEntry;
  }

  public async getAuditLogs(tenantId: string = 'TENANT-ALPHA-IND', entityName?: string, entityId?: string) {
    let logs = this.auditLogsStore.filter((l) => l.tenantId === tenantId);
    if (entityName) logs = logs.filter((l) => l.entityName === entityName);
    if (entityId) logs = logs.filter((l) => l.entityId === entityId);
    return logs.slice(-100).reverse();
  }

  private getDefaultWidgets(userId: string, tenantId: string) {
    return [
      { id: 'WDG-01', tenantId, userId, widgetType: 'PENDING_TASKS', title: 'Assigned Action Items', config: {}, position: 1, isVisible: true, refreshInterval: 120 },
      { id: 'WDG-02', tenantId, userId, widgetType: 'MY_APPROVALS', title: 'Pending Stage-Gates', config: {}, position: 2, isVisible: true, refreshInterval: 120 },
      { id: 'WDG-03', tenantId, userId, widgetType: 'PRODUCTION_STATUS', title: 'IMM Bays Production Status', config: {}, position: 3, isVisible: true, refreshInterval: 300 },
      { id: 'WDG-04', tenantId, userId, widgetType: 'INVENTORY_ALERTS', title: 'Resin Silo Low Stock Alerts', config: {}, position: 4, isVisible: true, refreshInterval: 300 },
    ];
  }

  private seedDefaultHomeToolsData() {
    // Seed Sample Tasks
    this.tasksStore.set('TASK-2026-00101', {
      id: 'TASK-2026-00101',
      taskNumber: 'TASK-2026-00101',
      tenantId: 'TENANT-ALPHA-IND',
      assignedToId: 'USR-ADMIN-01',
      title: 'Sign off Line 02 SMED Changeover Checklist',
      description: 'Review mold clamping torque and cooling line manifold connections for M-004 bumper mold.',
      taskType: 'MAINTENANCE',
      priority: 'HIGH',
      status: 'PENDING',
      dueDate: new Date(Date.now() + 14400000).toISOString(),
      completedAt: null,
      relatedEntityType: 'WorkOrder',
      relatedEntityId: 'WO-2026-00412',
      metadata: { machineId: 'IMM-BAY-02' },
      createdBy: 'Priya Rao',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    this.tasksStore.set('TASK-2026-00102', {
      id: 'TASK-2026-00102',
      taskNumber: 'TASK-2026-00102',
      tenantId: 'TENANT-ALPHA-IND',
      assignedToId: 'USR-ADMIN-01',
      title: 'Perform In-Process AQL Quality Inspection on WO-2026-00456',
      description: 'Check 25 sample pieces for sink marks and flash tolerance.',
      taskType: 'QUALITY_CHECK',
      priority: 'URGENT',
      status: 'PENDING',
      dueDate: new Date(Date.now() + 7200000).toISOString(),
      completedAt: null,
      relatedEntityType: 'WorkOrder',
      relatedEntityId: 'WO-2026-00456',
      metadata: { aqlStandard: 'Level-II Normal' },
      createdBy: 'Vikram Mehta',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Seed Sample Approval
    this.approvalsStore.set('APR-2026-00789', {
      id: 'APR-2026-00789',
      requestNumber: 'APR-2026-00789',
      tenantId: 'TENANT-ALPHA-IND',
      entityType: 'PurchaseOrder',
      entityId: 'PO-2026-00789',
      title: '40MT Virgin Polypropylene Resin Procurement (₹38.5 Lakhs)',
      description: 'High-volume polyolefin tanker loads from Reliance Polymers for Tata Nexon bumper project.',
      submittedById: 'Kavita Iyer',
      submittedAt: new Date().toISOString(),
      priority: 'HIGH',
      status: 'PENDING',
      currentStage: 1,
      metadata: { totalAmount: 3850000, vendorName: 'Reliance Polymers Ltd' },
      stages: [
        { id: 'STG-01', stageNumber: 1, approverId: 'USR-ADMIN-01', approverEmail: 'scm.manager@sp-plastech.com', approverName: 'SCM Purchase Manager', status: 'PENDING', action: null, comments: null, actedAt: null, required: true },
        { id: 'STG-02', stageNumber: 2, approverId: 'USR-FIN-01', approverEmail: 'cfo@sp-plastech.com', approverName: 'Financial Controller', status: 'PENDING', action: null, comments: null, actedAt: null, required: true },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Seed Notifications
    this.notificationsStore.set('NOTIF-01', {
      id: 'NOTIF-01',
      tenantId: 'TENANT-ALPHA-IND',
      userId: 'ALL',
      title: 'Production Halt Warning: IMM Bay 03 Chiller Pressure Drop',
      message: 'Cooling circuit temperature exceeded 26°C. Preventive shutdown triggered on tool M-002.',
      type: 'PRODUCTION_HALT',
      severity: 'CRITICAL',
      isRead: false,
      readAt: null,
      actionUrl: '/mfg/imm-bay-03',
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    });

    this.notificationsStore.set('NOTIF-02', {
      id: 'NOTIF-02',
      tenantId: 'TENANT-ALPHA-IND',
      userId: 'ALL',
      title: 'Low Polymer Silo Stock Alert',
      message: 'Virgin PP Silo-02 at 18% capacity (3.2MT remaining). Projected run-out in 14 hours.',
      type: 'INVENTORY_LOW',
      severity: 'WARNING',
      isRead: false,
      readAt: null,
      actionUrl: '/scm/silo-inventory',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    });
  }
}
