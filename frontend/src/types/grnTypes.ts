// ----------------------------------------------------
// GOODS RECEIPT NOTE (GRN) ENTERPRISE TYPES & SCHEMAS
// Aligned with Plastics Manufacturing ERP Specification
// ----------------------------------------------------

export type GrnInspectionMode = 'QC_BEFORE_GRN' | 'QC_AFTER_GRN' | 'NO_QC';

export type GrnStatusState =
  | 'draft'
  | 'arrived'
  | 'unloading'
  | 'counted'
  | 'pending_qc'
  | 'partially_accepted'
  | 'accepted'
  | 'rejected'
  | 'posted'
  | 'putaway_pending'
  | 'putaway_completed'
  | 'closed'
  | 'cancelled'
  | 'reversed'
  | 'return_created';

export type GrnLineQualityStatus =
  | 'Not Required'
  | 'Pending Inspection'
  | 'Under Inspection'
  | 'Passed QC'
  | 'Failed QC'
  | 'Concession Approved'
  | 'On Hold';

export type GrnInventoryPostingStatus =
  | 'Not Posted'
  | 'Posted to Receiving'
  | 'Posted to Quarantine'
  | 'Posted to Available Stock'
  | 'Posted to Rejected Stock'
  | 'Putaway Completed';

export type MaterialType = 'RM' | 'PCK' | 'CON' | 'BOP' | 'FG' | 'Spare parts';

export interface ConfirmedPoQueueItem {
  id: string;
  poNumber: string;
  poLineNo: number;
  poDate: string;
  supplierId: string;
  supplierCode: string;
  supplierName: string;
  supplierGstin: string;
  expectedDate: string;
  arrivalDateTime: string;
  plant: string;
  warehouse: string;
  receivingDock: string;
  itemCode: string;
  itemName: string;
  itemCategory: string;
  materialType: MaterialType;
  uom: string;
  orderedQty: number;
  previouslyReceivedQty: number;
  openPoQty: number;
  unitPrice: number;
  poStatus: 'Confirmed' | 'Partially Received' | 'On Hold' | 'Approved';
  qualityRequired: boolean;
  asnReceived: boolean;
  vehicleArrived: boolean;
  transporterName: string;
  vehicleNumber: string;
  driverName: string;
  deliveryChallanNo: string;
  toleranceOverPct: number;
  toleranceUnderPct: number;
  qcMode: GrnInspectionMode;
  inspectionPlan: string;
}

export interface GrnLineLotAllocation {
  id: string;
  lotBatchNumber: string;
  supplierLotNumber?: string;
  quantity: number;
  uom: string;
  mfgDate: string;
  expiryDate: string;
  bagCount?: number;
  bin?: string;
  palletId?: string;
  coaStatus?: 'Verified' | 'Pending' | 'Missing' | 'Failed';
  coaReference?: string;
  qualityStatus?: GrnLineQualityStatus;
  storageCondition?: string;
  remarks?: string;
}

export interface GrnLineItemExt {
  lineNo: number;
  poLineNo: number;
  itemCode: string;
  itemName: string;
  description: string;
  uom: string;
  orderedQty: number;
  previouslyReceivedQty: number;
  openPoQty: number;
  arrivedQty: number;
  countedQty: number;
  currentReceivedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  concessionQty: number;
  remainingPoQty: number;
  lotBatchNumber: string;
  supplierLotNumber: string;
  mfgDate: string;
  expiryDate: string;
  shelfLifeDays: number;
  remainingShelfLifeDays: number;
  locationCode: string;
  bin: string;
  quarantineBin: string;
  qualityStatus: GrnLineQualityStatus;
  coaStatus: 'Verified' | 'Pending' | 'Missing' | 'Failed';
  coaReference?: string;
  msdsAvailable: boolean;
  countryOrigin: string;
  packingType: '25KG Bags' | 'Drums' | 'Gaylord/Boxes' | 'Pallets' | 'Octabin' | 'Bulk Silo Truck';
  bagCount: number;
  grossWeightKg: number;
  netWeightKg: number;
  storageCondition: 'Ambient Dry (<25°C)' | 'Controlled Humidity' | 'Silo Bulk' | 'Hazardous / Flame-Proof' | 'Cleanroom Staging';
  toleranceWarning: 'ok' | 'over_tolerance_warning' | 'over_tolerance_error' | 'short_supply';
  toleranceReasonCode?: string;
  shortReasonCode?: string;
  remarks: string;
  lots?: GrnLineLotAllocation[];
  qcParameters?: Array<{
    testName: string;
    standard: string;
    actual: string;
    passed: boolean;
  }>;
}

export interface GrnAuditEntry {
  id: string;
  action: 'Created' | 'Counted' | 'Inspected' | 'Posted' | 'Putaway Completed' | 'Reversed' | 'Returned' | 'Edited' | 'Tolerance Approved';
  user: string;
  timestamp: string;
  reason?: string;
  details: string;
}

export interface GrnExceptionRecord {
  id: string;
  grnNumber: string;
  poLineNo: number;
  itemCode: string;
  itemName: string;
  lotBatchNumber: string;
  exceptionType:
    | 'Short Supply'
    | 'Excess Supply'
    | 'Damaged Packing'
    | 'Damaged Material'
    | 'Wrong Item Received'
    | 'Wrong Supplier Lot'
    | 'Expired Material'
    | 'Missing COA'
    | 'Quality Rejection'
    | 'Contamination / Foreign Specs';
  quantityAffected: number;
  uom: string;
  reason: string;
  photoEvidence?: string;
  weighbridgeEvidence?: string;
  supplierNotificationRequired: boolean;
  returnRequired: boolean;
  ncrRequired: boolean;
  debitNoteRequired: boolean;
  disposition: 'Accept as is' | 'Reject' | 'Return to supplier' | 'Quarantine' | 'Concession' | 'Rework';
  status: 'Open' | 'Under Review' | 'Approved' | 'Resolved';
  createdAt: string;
  resolvedAt?: string;
  resolutionNotes?: string;
}

export interface GrnPutawayTask {
  id: string;
  grnNumber: string;
  itemCode: string;
  itemName: string;
  lotNumber: string;
  quantity: number;
  uom: string;
  currentLocation: string;
  recommendedLocation: string;
  recommendedZone: 'RM Bulk Silo' | 'Standard Resin Bay' | 'Masterbatch Storage' | 'Additive Controlled Room' | 'Packaging Store';
  actualLocation: string;
  binCode: string;
  palletContainerId: string;
  putawayStatus: 'Pending' | 'Assigned' | 'In Progress' | 'Completed';
  putawayBy?: string;
  assignedTo?: string;
  completedAt?: string;
  fefoPriority: 'High' | 'Standard' | 'Urgent';
}

export interface GrnReversalRecord {
  id: string;
  originalGrnNumber: string;
  reversalDate: string;
  reversalReason:
    | 'Wrong quantity entered'
    | 'Wrong item received'
    | 'Wrong lot/batch captured'
    | 'Wrong PO selected'
    | 'Duplicate GRN'
    | 'Inventory posting error'
    | 'Supplier return after posting'
    | 'Quality result changed later';
  reversedQty: number;
  uom: string;
  reversedBy: string;
  approvedBy?: string;
  approvalStatus: 'Pending Finance Approval' | 'Approved' | 'Executed';
  inventoryImpactPreview: string;
  accountingImpactPreview: string;
  notes?: string;
}

export interface GrnSupplierReturnRecord {
  id: string;
  returnNumber: string;
  grnNumber: string;
  poNumber: string;
  supplierName: string;
  itemCode: string;
  itemName: string;
  lotNumber: string;
  returnQty: number;
  uom: string;
  reason: string;
  dispositionDate: string;
  transporterName: string;
  vehicleNumber: string;
  debitNoteNumber?: string;
  debitNoteStatus: 'Draft' | 'Sent to Supplier' | 'Settled';
  status: 'Pending Dispatch' | 'Dispatched' | 'Acknowledged by Vendor';
}

export interface GoodsReceiptNoteExt {
  id: string;
  grnNumber: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  supplierGstin?: string;
  supplierInvoiceNo?: string;
  supplierInvoiceDate?: string;
  deliveryChallanNo: string;
  receiptDate: string;
  arrivalDate: string;
  arrivalTime: string;
  gateEntryNumber: string;
  vehicleNumber: string;
  transporterName: string;
  driverName: string;
  receivingPlant: string;
  warehouse: string;
  receivingDock: string;
  receivedBy: string;
  packingSlipRef: string;
  invoiceRef?: string;
  status: GrnStatusState;
  inspectionStatus: 'Pending' | 'In Inspection' | 'Approved' | 'Quarantined' | 'Rejected';
  inspectionMode: GrnInspectionMode;
  inventoryPostingStatus: GrnInventoryPostingStatus;
  notes: string;
  lines: GrnLineItemExt[];
  qrCodePayload?: string;
  overReceiptApproved?: boolean;
  overReceiptApprover?: string;
  putawayStatus: 'Pending' | 'In Progress' | 'Completed' | 'Not Applicable';
  exceptions: GrnExceptionRecord[];
  reversalInfo?: GrnReversalRecord;
  supplierReturn?: GrnSupplierReturnRecord;
  auditTrail: GrnAuditEntry[];
  carrierPhone?: string;
  tareWeightKg?: number;
  grossWeightKg?: number;
  netWeightKg?: number;
}

export interface GrnToleranceSettings {
  allowedOverReceiptPct: number;
  allowedUnderReceiptPct: number;
  maxOverReceiptQtyKg: number;
  roundingToleranceKg: number;
  requireApprovalForOverReceipt: boolean;
  defaultQcMode: GrnInspectionMode;
  quarantineWarehouseBin: string;
  autoCreateInspectionTask: boolean;
  mandatoryCoaForRawMaterials: boolean;
  numberingPrefix: string;
}
