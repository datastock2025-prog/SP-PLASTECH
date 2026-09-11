// ============================================================================
// DOMAIN MODULE: MEP (MECHANICAL, ELECTRICAL, PLUMBING) & FACILITIES
// Modular Monolithic Architecture — Reboot ERP
// ============================================================================

export { MepViews } from '../../components/MepViews';
export {
  INITIAL_MEP_EQUIPMENT,
  INITIAL_MEP_ALARMS,
  INITIAL_MEP_ENERGY_METERS,
  INITIAL_MEP_UTILITY_READINGS,
  INITIAL_MEP_WORK_ORDERS,
  INITIAL_MEP_CLEANROOM_ZONES,
} from '../../data/mepData';

export type {
  MepEquipment,
  MepAlarm,
  MepEnergyReading,
  MepUtilityReading,
  MepWorkOrder,
  MepCleanroomZone,
} from '../../types';
