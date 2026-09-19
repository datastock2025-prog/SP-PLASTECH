export type StockItemStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'in_quarantine' | 'allocated' | 'discontinued';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type CountStatus = 'scheduled' | 'in_progress' | 'under_review' | 'reconciled' | 'variance_flagged';
export type QuarantineDisposition = 'pending_disposition' | 'released_to_production' | 'returned_to_vendor' | 'send_to_regrind' | 'scrap_destroy';
export type LedgerTransactionStatus = 'OPEN' | 'CLOSED' | 'IN TRANSIT';

export interface WarehouseLocation {
  id: string;
  code: string;
  name: string;
  zone: string;
  type: 'bulk_silo' | 'pallet_rack' | 'bin_shelf' | 'cold_storage' | 'quarantine_area' | 'tool_crib' | 'wip_staging' | 'dispatch_dock';
  capacityKg: number;
  currentOccupiedKg: number;
  occupancyPct: number;
  temperatureControlled?: boolean;
  activeItemsCount: number;
  description: string;
}

export interface InventoryStockLot {
  lotNumber: string;
  supplierBatchNumber: string;
  supplierName: string;
  receiptDate: string;
  initialQuantityKg: number;
  availableQuantityKg: number;
  allocatedQuantityKg: number;
  uom: string;
  mfiTested: string;
  moisturePct: number;
  storageBin: string;
  status: 'released' | 'quarantine' | 'reserved' | 'depleted';
  grnReference: string;
  expiryDate?: string;

  // "Where From In" (Inward Origin)
  inwardSource?: string;         // e.g. "Vendor Inward (Reliance Petrochemicals Ltd)", "Production Shift A (IMM-250T-03)"
  inwardOriginLocation?: string; // e.g. "Inward Receiving Dock #1", "Molding Shopfloor Bay 4"
  inwardDocumentRef?: string;    // e.g. "GRN-2026-001 / PO-9921", "WO-20260919-01"
  inwardReceivedBy?: string;     // e.g. "Ramesh K. (Inward Storekeeper)"

  // "What Purpose Is Out" (Outward Purpose)
  outwardPurpose?: string;       // e.g. "Issued to Molding Work Order", "Dispatched for Customer Tax Invoice"
  outwardDestination?: string;   // e.g. "PRD-STORE (Machine Line #3)", "FG-STORE (Loading Dock #2)"
  outwardReference?: string;     // e.g. "WO-2026-0881", "INV-2026-9042"
  outwardAuthorizedBy?: string;  // e.g. "Suresh P. (Production Supervisor)"
}

export interface StockMovementLedgerEntry {
  id: string;
  timestamp: string;
  ledgerDate: string;            // e.g. "18/09/2026"
  docType: 'TRANSFERS' | 'RECEIPTS' | 'ISSUES' | 'DISPATCHES' | 'ADJUSTMENTS';
  docNumber: string;             // e.g. "TF26-0852", "GR26-1069"
  location: string;              // e.g. "U1RM-DOCK", "WIP-STAGING-01", "CON-STORE"
  locationType: string;          // e.g. "DOCK", "WAREHOUSE", "SHOPFLOOR", "ASSEMBLY", "QUARANTINE"
  customer?: string;             // e.g. "TATA MOTORS", "BAJAJ AUTO", ""
  supplier?: string;             // e.g. "KINGFA SCIENCE & TECHN BAN", "RELIANCE INDUSTRIES"
  sku: string;
  itemName: string;
  lotNumber?: string;
  unitPrice?: number;            // e.g. 447.00
  parentDocType?: string;        // e.g. "PO", "WO", "MTN", "SO"
  parentDocNumber?: string;      // e.g. "202600600"
  referenceNumber?: string;      // e.g. "1712-2601475"
  qtyPerUom?: number;            // e.g. 1
  movementType: 'IN' | 'OUT';
  quantity: number;
  qtyIn: number;                 // e.g. 3325.0000
  qtyOut: number;                // e.g. 450.0000
  uom: string;
  status: LedgerTransactionStatus; // 'OPEN' | 'CLOSED' | 'IN TRANSIT'

  // "Where From In" (Inward Origin)
  sourceType?: 'VENDOR_GRN' | 'PRODUCTION_OUTPUT' | 'DEFLASH_RETURN' | 'REGRIND_RECOVERY' | 'INTER_PLANT_TRANSFER' | 'INITIAL_OPENING';
  sourceOrigin: string;          // e.g. "Reliance Petrochemicals (PO-2026-081)"
  sourceReference: string;       // e.g. "GRN-2026-001"
  sourceLocation: string;        // e.g. "Inward Receiving Dock #1"

  // "What Purpose Is Out" (Outward Purpose)
  purposeType?: 'PRODUCTION_ISSUE' | 'ASSEMBLY_REQUISITION' | 'DEFLASH_TRIMMING' | 'CUSTOMER_DISPATCH' | 'QC_REJECTION_SCRAP' | 'SUBCONTRACT_JOB';
  purposeDescription: string;    // e.g. "Issued for Automotive Bumper Housing Molding"
  destinationStore: string;      // e.g. "PRD-STORE (IMM Line #3)"
  outwardReference: string;      // e.g. "WO-2026-0881"

  authorizedBy: string;          // e.g. "Ramesh K. (Store In-Charge)"
  runningBalance: number;
  notes?: string;
}

export type StoreCategoryType =
  | 'Virgin Polymer'
  | 'Masterbatch'
  | 'Additive'
  | 'Regrind Polymer'
  | 'Molded Part (FG)'
  | 'Insert / Hardware'
  | 'Packaging Material'
  | 'WIP Store'
  | 'Consumables'
  | 'Packaging Store'
  | 'BOP Store';

export interface InventoryStockItem {
  id: string;
  sku: string;
  name: string;
  category: StoreCategoryType;
  storeType?: 'RM' | 'WIP' | 'CON' | 'PCK' | 'BOP' | 'FG';
  subCategory: string;
  resinGrade?: string;
  primaryWarehouse: string;
  primaryBin: string;
  totalOnHand: number;
  allocatedToProduction: number;
  reservedForOrders: number;
  availableToPromise: number;
  inTransitFromVendors: number;
  uom: string;
  unitCostInr: number;
  totalValuationInr: number;
  reorderPointKg: number;
  safetyStockKg: number;
  maximumStockKg: number;
  economicOrderQtyKg: number;
  status: StockItemStatus;
  leadTimeDays: number;
  abcClassification: 'A' | 'B' | 'C';
  lots: InventoryStockLot[];
  lastMovementDate: string;
}

export interface PutawayTask {
  id: string;
  taskNumber: string;
  grnReference: string;
  itemSku: string;
  itemName: string;
  lotNumber: string;
  quantity: number;
  uom: string;
  sourceDock: string;
  recommendedBin: string;
  actualBinPutaway?: string;
  assignedOperator: string;
  status: TaskStatus;
  createdDate: string;
  completedDate?: string;
  priority: 'Urgent' | 'High' | 'Normal';
}

export interface PickPackLine {
  id: string;
  itemSku: string;
  itemName: string;
  lotNumber: string;
  sourceBin: string;
  requiredQty: number;
  pickedQty: number;
  uom: string;
  isPicked: boolean;
}

export interface PickPackTask {
  id: string;
  pickListNumber: string;
  orderType: 'Work_Order_Staging' | 'Sales_Order_Dispatch';
  referenceNumber: string;
  destinationLocation: string; // e.g. "Bay #4 Machine IMM-150" or "Loading Dock #2"
  assignedPicker: string;
  createdDate: string;
  scheduledTime: string;
  status: 'assigned' | 'picking' | 'staged' | 'packed' | 'shipped';
  priority: 'Urgent' | 'High' | 'Normal';
  totalLines: number;
  pickedLines: number;
  lines: PickPackLine[];
  palletBarcode?: string;
}

export interface CycleCountItemAudit {
  itemSku: string;
  itemName: string;
  binLocation: string;
  lotNumber: string;
  systemRecordedQty: number;
  physicallyCountedQty: number;
  varianceQty: number;
  variancePct: number;
  varianceValueInr: number;
  status: 'matched' | 'variance' | 'adjusted';
  remarks?: string;
}

export interface CycleCountSession {
  id: string;
  countNumber: string;
  sessionTitle: string;
  targetZone: string;
  frequency: 'Daily ABC' | 'Weekly High Value' | 'Monthly Full Wall-to-Wall' | 'Ad-hoc Audit';
  auditorName: string;
  startDate: string;
  status: CountStatus;
  totalSkusAudited: number;
  matchedCount: number;
  varianceCount: number;
  netVarianceValueInr: number;
  items: CycleCountItemAudit[];
}

export interface QuarantineLotRecord {
  id: string;
  quarantineNumber: string;
  itemSku: string;
  itemName: string;
  lotNumber: string;
  quantityKg: number;
  uom: string;
  currentBin: string;
  holdDate: string;
  holdReason: 'MFI Out of Spec' | 'High Moisture Contamination' | 'Color Tone Mismatch' | 'Flash / Dimensional Burr' | 'Damaged Packaging Bags' | 'Vendor Quality Recall';
  originSource: string; // e.g. "Inward GRN-2026-004" or "Machine IMM-120 Shift A"
  qcInspector: string;
  dispositionStatus: QuarantineDisposition;
  dispositionActionNote?: string;
  authorizedBy?: string;
  closureDate?: string;
}

export interface RegrindScrapRun {
  id: string;
  batchNumber: string;
  date: string;
  granulatorId: string;
  granulatorName: string;
  shift: 'Shift A' | 'Shift B' | 'Shift C';
  operatorName: string;
  inputPolymerType: string;
  sourceMoldRunners: string; // e.g. "Sprues from WO-2026-001 (Automotive Housing)"
  inputWeightKg: number;
  outputRegrindWeightKg: number;
  scrapDustLossKg: number;
  granulatorScreenSizeMm: number;
  yieldPct: number;
  targetRegrindSilo: string;
  recommendedBlendRatioMaxPct: number;
  status: 'completed' | 'in_progress';
}

export interface SubcontractOrder {
  id: string;
  orderNumber: string;
  vendorName: string;
  vendorCode: string;
  processType: 'Electroplating (Bright Chrome)' | 'Ultrasonic Plastic Welding' | 'Screen & Pad Printing' | 'Hot Stamping & Laser Etching';
  materialSentSku: string;
  materialSentName: string;
  quantitySent: number;
  quantityReceived: number;
  uom: string;
  unitProcessingRate: number;
  totalOrderCost: number;
  dispatchDate: string;
  expectedReturnDate: string;
  status: 'dispatched' | 'partially_received' | 'completed' | 'quality_check';
  rejectionScrapQuantity: number;
}
