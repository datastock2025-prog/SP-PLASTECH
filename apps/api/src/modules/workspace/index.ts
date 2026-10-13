export { createWorkspaceRouter } from './router.js';
export { WorkspaceService, workspaceService } from './service.js';
export type { WorkspaceApi, WorkspaceModulePorts } from './ports.js';
export type {
  ApprovalDecidedEvent,
  TaskCompletedEvent,
  PoApprovedConsumer,
  BomVersionApprovedConsumer,
  NcrRaisedConsumer,
} from './events.js';
