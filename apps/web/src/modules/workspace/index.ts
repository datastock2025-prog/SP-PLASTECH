// ============================================================================
// WORKSPACE MODULE: PUBLIC API
// Modular Monolithic Architecture — apps/web/src/modules/workspace/index.ts
// ============================================================================

export { WorkspaceViews } from './screens/WorkspaceViews';
export { HomeView } from './components/HomeView';
export {
  WorkspaceTasksView,
  WorkspaceApprovalsView,
  WorkspaceNotificationsView,
  WorkspaceSavedViewsView,
  WorkspaceRecentRecordsView,
} from './components/WorkspaceHomeTools';

export {
  useWorkspaceTasks,
  useCreateWorkspaceTask,
  useUpdateWorkspaceTask,
  useWorkspaceApprovals,
  useDecideWorkspaceApproval,
  useWorkspaceNotifications,
  useWorkspacePresets,
} from './api/useWorkspace';

export { workspaceApi } from './api/workspaceApi';
export { workspaceRoutes } from './routes';

export {
  TaskPriorityEnum,
  TaskStatusEnum,
  TaskSchema,
  CreateTaskInputSchema,
  UpdateTaskInputSchema,
  ApprovalStatusEnum,
  ApprovalSchema,
  CreateApprovalInputSchema,
  UpdateApprovalInputSchema,
  NotificationTypeEnum,
  NotificationSchema,
  CreateNotificationInputSchema,
  SavedPresetSchema,
  CreateSavedPresetInputSchema,
} from './model/workspaceSchemas';

export type {
  TaskContract,
  CreateTaskContract,
  UpdateTaskContract,
  ApprovalContract,
  CreateApprovalContract,
  UpdateApprovalContract,
  NotificationContract,
  CreateNotificationContract,
  SavedPresetContract,
  CreateSavedPresetContract,
} from './model/workspaceSchemas';
