// ============================================================================
// MAINTENANCE MODULE: PUBLIC API
// Modular Monolithic Architecture — apps/web/src/modules/maintenance/index.ts
// ============================================================================

export { MaintenanceViews, MaintenanceViews as MepViews, maintenanceRoutes } from './routes';

export {
  useMaintenance,
  useMaintenanceWorkOrders,
  useSaveMaintenanceWorkOrder,
  useEquipmentAssets,
  useMepWorkOrders,
  useSaveMepWorkOrder,
  useMolds,
} from './api/useMaintenance';

export { maintenanceApi } from './api/maintenanceApi';

export {
  MaintenanceWorkOrderSchema,
  CreateMaintenanceWorkOrderInputSchema,
  UpdateMaintenanceWorkOrderInputSchema,
  EquipmentAssetSchema,
  MeterReadingSchema,
  MepAlarmSchema,
  MaintenanceCategoryEnum,
  MaintenancePriorityEnum,
  MaintenanceStatusEnum,
  EquipmentStatusEnum,
  maintenanceWorkOrderFormSchema,
} from './model/maintenanceSchemas';

export type {
  MaintenanceWorkOrderContract,
  CreateMaintenanceWorkOrderContract,
  UpdateMaintenanceWorkOrderContract,
  EquipmentAssetContract,
  MeterReadingContract,
  MepAlarmContract,
  MaintenanceCategory,
  MaintenancePriority,
  MaintenanceStatus,
  EquipmentStatus,
  MaintenanceWorkOrderFormValues,
  MepEquipment,
  MepAlarm,
  MepEnergyReading,
  MepUtilityReading,
  MepCleanroomZone,
  MepMetric,
  MepWorkOrder,
  MepCategory,
  MepEquipmentStatus,
} from './model/maintenanceSchemas';

// Maintenance & MEP Sub-components
export { MepOperationsDash } from './components/MepOperationsDash';
export { MepMechanicalView } from './components/MepMechanicalView';
export { MepElectricalView } from './components/MepElectricalView';
export { MepPlumbingWaterView } from './components/MepPlumbingWaterView';
export { MepHvacCleanroomView } from './components/MepHvacCleanroomView';
export { MepWorkOrdersView } from './components/MepWorkOrdersView';
