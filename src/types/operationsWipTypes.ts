import { RejectionBreakdownItem } from '../types';

export type OperationalStoreType = 'PRD-STORE' | 'DEFLASH-STORE' | 'ASSEMBLY-STORE' | 'FG-STORE';
export type MainWarehouseStoreType = 'MAIN-RM-STORE' | 'MAIN-BOP-STORE' | 'MAIN-PCK-STORE' | 'MAIN-CON-STORE';
export type MaterialCategoryType = 'RM' | 'BOP' | 'PCK' | 'CON';

export type WipQcStatus =
  | 'pending_qc'
  | 'qc_approved'
  | 'qc_hold'
  | 'qc_rejected'
  | 'transferred_deflash'
  | 'transferred_assembly'
  | 'moved_to_fg';

export interface WipInventoryRecord {
  id: string; // e.g. WIP-LOT-2026-001
  workOrderId: string; // e.g. WO-1042
  batchLotNo: string; // e.g. LOT-P1-260911-01
  itemCode: string;
  itemName: string;
  bomId: string;
  plantId: string; // e.g. PLANT-01
  plantName: string;
  machineId: string;
  shift: string;
  productionDate: string;
  operator: string;
  source: 'grid_entry' | 'excel_csv_upload';
  deduplicationKey: string; // ${workOrderId}_${shift}_${productionDate}
  producedQty: number;
  goodQty: number;
  scrapQty: number;
  runnerKg: number;
  lumpsKg: number;
  currentStore: OperationalStoreType;
  currentStage: 'Molding WIP' | 'QC Inspection' | 'Deflashing' | 'Assembly' | 'FG Inventory';
  qcStatus: WipQcStatus;
  qcRejectionReason?: string;
  qcRejectionCategory?: string;
  qcRejectionNotes?: string;
  qcHoldReason?: string;
  qcInspectedBy?: string;
  qcInspectedAt?: string;
  requiresDeflash: boolean;
  requiresAssembly: boolean;
  deflashStatus?: 'pending' | 'in_progress' | 'qc_approved' | 'qc_rejected';
  deflashScrapQty?: number;
  deflashRejectionReason?: string;
  assemblyStatus?: 'pending' | 'in_progress' | 'qc_approved' | 'qc_rejected';
  assemblyScrapQty?: number;
  assemblyRejectionReason?: string;
  reversalRecipeDeducted?: boolean;
  deduplicationNotes?: string;
  lastUpdated: string;
  history: Array<{
    event: string;
    time: string;
    by: string;
    store: OperationalStoreType;
    details?: string;
  }>;
}

export interface PlantStoreInventoryItem {
  id: string;
  plantId: string;
  plantName: string;
  storeCode: MainWarehouseStoreType | OperationalStoreType;
  itemCode: string;
  itemName: string;
  category: MaterialCategoryType;
  stockQty: number;
  uom: string;
  allocatedQty: number;
  minSafetyStock: number;
  unitCost: number;
  batchNo?: string;
}

export interface MaterialTransferRecord {
  id: string; // MTN-2026-001
  transferNo: string;
  plantId: string;
  plantName: string;
  date: string;
  category: MaterialCategoryType;
  fromStore: MainWarehouseStoreType;
  toStore: OperationalStoreType;
  itemCode: string;
  itemName: string;
  qty: number;
  uom: string;
  bomRefId?: string;
  workOrderRef?: string;
  batchLotNo?: string;
  requestedBy: string;
  transferredBy: string;
  status: 'draft' | 'dispatched' | 'received' | 'cancelled';
  notes?: string;
}

export interface SecondaryOperationRecipeLine {
  itemCode: string;
  itemName: string;
  category: MaterialCategoryType;
  qtyPerUnit: number;
  uom: string;
  costPerUnit: number;
}
