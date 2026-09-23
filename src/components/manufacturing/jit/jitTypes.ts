import { ItemMaster, MachineMaster, BomMaster } from '../../../types';
import { MoldMaster } from '../../../data/manufacturingData';

export type JitShift = 'Shift A (06:00 - 14:00)' | 'Shift B (14:00 - 22:00)' | 'Shift C (22:00 - 06:00)' | 'Full Day 24H' | 'Custom Hours';

export interface PlannedMachineJob {
  id: string;
  planDate: string; // YYYY-MM-DD
  machineId: string;
  itemCode: string;
  itemName: string;
  moldId: string;
  moldName: string;
  bomId?: string;
  formulaId?: string;
  cavities: number;
  cycleTimeSec: number;
  isCustomCavity?: boolean;
  isCustomCycleTime?: boolean;
  isCustomOverride?: boolean;
  plannedHours: number;
  calculatedPcs: number;
  targetPcs: number;
  calculationMode: 'hours_to_pcs' | 'pcs_to_hours';
  shift: JitShift;
  efficiencyPct: number;
  operator: string;
  notes?: string;
  plant?: string;
  plantName?: string;
  priority: 'High' | 'Normal' | 'Urgent';
  expectedFinishDate?: string;
  expectedFinishTime?: string;
  status: 'Draft' | 'Feasible' | 'Material_Shortage' | 'Released';
  workOrderGenerated?: string;
  workOrderId?: string;
  scheduleNumber?: string;
  sentToDailyProd?: boolean;
  isLockedByInput?: boolean;
  releasedAt?: string;
  auditLog?: Array<{ timestamp: string; action: string; user?: string }>;
}

export type MaterialCategory = 'RM' | 'MB' | 'INSERT' | 'PCK' | 'OTHER';

export interface ExplodedMaterialRequirement {
  materialCode: string;
  materialName: string;
  category: MaterialCategory;
  categoryLabel: 'Raw Material (Resin)' | 'Masterbatch (Colorant)' | 'Insert / Hardware' | 'Packaging Material' | 'Other Auxiliary';
  uom: string;
  requiredQty: number;
  ratePerPc: number;
  scrapPct: number;
  sourceJobs: Array<{
    machineId: string;
    itemCode: string;
    producedPcs: number;
    allocatedQty: number;
  }>;
  storeLocation: string;
  availableStock: number;
  shortageQty: number;
  feasibility: 'Sufficient' | 'Tight_Buffer' | 'Critical_Shortage';
}

export interface StoreInventoryNode {
  id: string;
  code: string;
  name: string;
  type: 'FG' | 'SFG' | 'RM' | 'MB' | 'PCK' | 'SPARE' | 'CUSTOM';
  description: string;
  zone: string;
  plantId?: string;
  isCustom?: boolean;
  totalItemsCount?: number;
  totalWeightKg?: number;
}

export interface JitProductionPlan {
  planId: string;
  planDate: string; // YYYY-MM-DD
  createdOn: string;
  preparedBy: string;
  status: 'Draft' | 'Verified' | 'Approved' | 'Released_To_Shopfloor';
  notes: string;
  targetDayLabel: string;
}

export interface CrudEligibilityUser {
  id: string;
  name: string;
  role: string;
  department: string;
  canEditReleased: boolean;
  canDeleteReleased: boolean;
  canAddReleased: boolean;
  canRollbackInputWO?: boolean;
}


