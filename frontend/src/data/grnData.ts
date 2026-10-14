// ----------------------------------------------------
// GOODS RECEIPT NOTE (GRN) ENTERPRISE STORE & SETTINGS
// Specialized for Plastic Manufacturing Plant #1
// ----------------------------------------------------

import {
  ConfirmedPoQueueItem,
  GoodsReceiptNoteExt,
  GrnToleranceSettings,
  GrnPutawayTask,
} from '../types/grnTypes';

export const DEFAULT_GRN_SETTINGS: GrnToleranceSettings = {
  allowedOverReceiptPct: 5.0,
  allowedUnderReceiptPct: 10.0,
  maxOverReceiptQtyKg: 1500,
  roundingToleranceKg: 10,
  requireApprovalForOverReceipt: true,
  defaultQcMode: 'QC_BEFORE_GRN',
  quarantineWarehouseBin: 'RM-WH-01-QUARANTINE-BAY',
  autoCreateInspectionTask: true,
  mandatoryCoaForRawMaterials: true,
  numberingPrefix: 'GRN-PLANT01-2026',
};

// Clean real data arrays (no fake seed dummy records)
export const INITIAL_CONFIRMED_PO_QUEUE: ConfirmedPoQueueItem[] = [];

export const INITIAL_EXTENDED_GRNS: GoodsReceiptNoteExt[] = [];

export const INITIAL_PUTAWAY_TASKS: GrnPutawayTask[] = [];
