export { createWarehouseRouter } from './router.js';
export { WarehouseService, warehouseService } from './service.js';
export type { WarehouseApi, WarehouseModulePorts } from './ports.js';
export type {
  StockTransferredEvent,
  LotHeldEvent,
  LotReleasedEvent,
  StockShortageDetectedEvent,
} from './events.js';
