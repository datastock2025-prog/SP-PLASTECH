export { createManufacturingRouter } from './router.js';
export { ManufacturingService, manufacturingService } from './service.js';
export type { ManufacturingApi, ManufacturingModulePorts } from './ports.js';
export type {
  ProductionCompletedEvent,
  ScrapReportedEvent,
  MachineDowntimeLoggedEvent,
} from './events.js';
