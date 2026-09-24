export type WidgetType =
  | 'PENDING_TASKS'
  | 'MY_APPROVALS'
  | 'PRODUCTION_STATUS'
  | 'MRP_SHORTAGES'
  | 'INVENTORY_ALERTS'
  | 'QUALITY_ISSUES'
  | 'MACHINE_DOWNTIME'
  | 'CUSTOM';

export type TaskType =
  | 'APPROVAL_REQUEST'
  | 'INSPECTION'
  | 'DATA_ENTRY'
  | 'REVIEW'
  | 'MAINTENANCE'
  | 'QUALITY_CHECK'
  | 'CUSTOM';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE';

export type ApprovalPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL';
export type ApprovalStatus = 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'ESCALATED';
export type StageStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED' | 'ESCALATED';
export type StageAction = 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES' | 'ESCALATE';

export type NotificationType =
  | 'SYSTEM_ALERT'
  | 'PRODUCTION_HALT'
  | 'QUALITY_ISSUE'
  | 'INVENTORY_LOW'
  | 'MAINTENANCE_DUE'
  | 'APPROVAL_REQUEST'
  | 'TASK_ASSIGNED'
  | 'MRP_SHORTAGE'
  | 'CUSTOM';

export type NotificationSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export interface DashboardWidget {
  id: string;
  widgetType: WidgetType;
  title: string;
  config: Record<string, any>;
  position: number;
  isVisible: boolean;
  refreshInterval: number;
}

export interface DashboardData {
  stats: {
    pendingTasksCount: number;
    pendingApprovalsCount: number;
    unreadNotificationsCount: number;
    activeWorkOrders: number;
    averagePlantOeePct: number;
    plantStatus: string;
  };
  widgets: DashboardWidget[];
}

export interface Task {
  id: string;
  taskNumber: string;
  title: string;
  description?: string;
  taskType: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  completedAt?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  metadata?: Record<string, any>;
  createdBy: string;
  createdAt: string;
}

export interface ApprovalStage {
  id: string;
  stageNumber: number;
  approverId: string;
  approverEmail: string;
  approverName: string;
  status: StageStatus;
  action?: StageAction;
  comments?: string;
  actedAt?: string;
  required: boolean;
}

export interface ApprovalRequest {
  id: string;
  requestNumber: string;
  entityType: string;
  entityId: string;
  title: string;
  description?: string;
  submittedById: string;
  submittedAt: string;
  priority: ApprovalPriority;
  status: ApprovalStatus;
  currentStage: number;
  metadata?: Record<string, any>;
  stages: ApprovalStage[];
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  severity: NotificationSeverity;
  isRead: boolean;
  readAt?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface SavedView {
  id: string;
  name: string;
  module: string;
  filters: Record<string, any>;
  columns?: string[];
  sortOrder?: Record<string, any>;
  isPublic: boolean;
  isDefault: boolean;
  createdAt: string;
}

export interface RecentRecord {
  id: string;
  entityType: string;
  entityId: string;
  recordName: string;
  recordUrl: string;
  metadata?: Record<string, any>;
  accessedAt: string;
}
