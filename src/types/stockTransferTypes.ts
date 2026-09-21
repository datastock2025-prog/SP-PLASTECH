export type TransferType = 'INTRA_PLANT' | 'INTER_PLANT' | 'RETURNABLE_DC' | 'ASSET_MOLD';

export type MaterialType = 'RM' | 'PCK' | 'CON' | 'BOP' | 'FG' | 'WIP';

export type StoreType =
  | 'RM Store'
  | 'FG Store'
  | 'WIP Store'
  | 'Production Store'
  | 'Machine Hopper'
  | 'Tool Room'
  | 'Transit / Receiving Store'
  | 'Dispatch Staging'
  | 'Returnable Packaging Store'
  | 'Consumables Store'
  | 'Spares Store';

export interface ProductionScheduleCMR {
  id: string;                      // e.g. "CMR-2026-0919-01"
  scheduleNumber: string;          // e.g. "SCH-2026-0919-01"
  scheduleDate: string;            // e.g. "2026-09-19"
  shift: 'Shift A' | 'Shift B' | 'Shift C';
  machineId: string;               // e.g. "IMM-250T-03"
  machineBay: string;              // e.g. "Molding Bay #4"
  finishedGoodSku: string;         // e.g. "FG-AUTO-HOUSING-01"
  finishedGoodName: string;        // e.g. "Automotive Electrical Junction Box Top Housing"
  plannedQty: number;              // e.g. 1250
  uom: string;                     // "PCS"
  bomVersion: string;              // "BOM-v2.1"
  targetProductionStore: string;   // "PRD-UNIT-1"
  mixingReferenceNumber?: string;  // e.g. "MIX-AUTO-HOUSING-20260919-01"
  transferStatus: 'PENDING_TRANSFER' | 'TRANSFERRED' | 'RETURNED' | 'PARTIALLY_RETURNED';
  transferredAt?: string;
  transferredBy?: string;
  mixingMaterials: {
    materialSku: string;
    materialName: string;
    materialType: 'Raw Polymer' | 'Masterbatch' | 'Additive' | 'Regrind';
    requiredQtyKg: number;
    issuedQtyKg?: number;
    returnedQtyKg?: number;
    lotNumber: string;
    uom: string;
    unitCostInr: number;
  }[];
}

export interface AssemblyRequisition {
  id: string;                      // e.g. "ASM-REQ-2026-081"
  date: string;
  scheduleNumber: string;
  targetLine: string;              // e.g. "Ultrasonic Assembly Line #2"
  finishedGoodSku: string;
  finishedGoodName: string;
  plannedQty: number;
  uom: string;
  requiredParts: {
    sku: string;
    name: string;
    qty: number;
    uom: string;
    lot: string;
    storeLocation: string;
  }[];
  status: 'PENDING' | 'ISSUED' | 'COMPLETED';
  issuedAt?: string;
  issuedBy?: string;
}

export interface DeflashRequisition {
  id: string;                      // e.g. "DFL-REQ-2026-042"
  date: string;
  scheduleNumber: string;
  targetBay: string;               // e.g. "Secondary Deflash Station #3"
  wipItemSku: string;
  wipItemName: string;
  qty: number;
  uom: string;
  toolsRequired: string[];
  status: 'PENDING' | 'ISSUED' | 'COMPLETED';
  issuedAt?: string;
  issuedBy?: string;
}

export interface ProductionStoreReturnRecord {
  id: string;                      // e.g. "MRN-2026-PRD1-001"
  returnDate: string;
  returnTime: string;
  mixingReferenceNumber: string;   // e.g. "MIX-AUTO-HOUSING-20260919-01"
  cmrReference: string;            // e.g. "CMR-2026-0919-01"
  scheduleNumber: string;          // e.g. "SCH-2026-0919-01"
  sourceStore: string;             // "PRD-UNIT-1"
  destinationWarehouse: string;    // "WH-RM-01 / Silo Zone A"
  finishedGoodSku: string;
  finishedGoodName: string;
  returnedItems: {
    sku: string;
    name: string;
    lotNumber: string;
    returnedQty: number;
    uom: string;
    unitCostInr: number;
    reason: string;
  }[];
  authorizedBy: string;
  receivedBy: string;
  status: 'COMPLETED';
  notes?: string;
}

export type TransferStatus =
  | 'Draft'
  | 'Pending Approval'
  | 'Ready for Pick'
  | 'Picked / Staged'
  | 'Dispatched / In Transit'
  | 'Partially Received'
  | 'Received / Completed'
  | 'Cancelled'
  | 'Return Pending'
  | 'Overdue Return';

export type AssetMoldStatus =
  | 'In Tool Room'
  | 'In Transit'
  | 'Received at Plant'
  | 'Mounted on Machine'
  | 'Under Maintenance';

export type UserRolePerspective =
  | 'Store Keeper (Source)'
  | 'Dispatch / Logistics Executive'
  | 'Store Keeper (Destination)'
  | 'Tool Room / Maintenance Manager'
  | 'Finance / Tax User'
  | 'Plant Manager'
  | 'Logistics & Dispatch Manager';

export interface PlantMaster {
  id: string;
  name: string;
  code: string;
  city: string;
  state: string;
  stateCode: string; // e.g. "27" (Maharashtra), "24" (Gujarat)
  gstin: string;
  pincode: string;
  address: string;
}

export interface StoreMaster {
  id: string;
  plantId: string;
  name: string;
  code: string;
  type: StoreType;
  allowedMaterialTypes: MaterialType[];
  isTransitStore?: boolean;
  canIssue: boolean;
  canReceive: boolean;
}

export interface StockTransferItem {
  id: string;
  itemCode: string;
  itemName: string;
  materialType: MaterialType;
  batchLotNumber: string;
  uom: string;
  availableStock: number;
  transferQty: number;
  requiredQty?: number;
  requisitionRefNumber?: string;
  scheduleNumber?: string;
  mixingRefNumber?: string;
  targetStoreCode?: string;
  receivedQty?: number;
  acceptedQty?: number;
  rejectedQty?: number;
  rejectionReason?: string;
  pickLocation: string;
  standardCost: number;
  assessableValue?: number;
  hsnCode: string;
  gstRatePct: number;
  packagingUnit?: string;
  netWeightKg?: number;
}

export interface AssetMoldItem {
  assetId: string;
  moldName: string;
  serialNumber: string;
  assetType: 'Injection Mold' | 'Extrusion Die' | 'Auxiliary Machinery' | 'Blow Mold';
  currentShotCount: number;
  ratedShotLife: number;
  maintenanceStatus: 'OK' | 'Needs Service' | 'Under Repair' | 'Damaged in Transit';
  insuranceDeclaredValue: number;
  cavities: number;
  tonnageRequired: string;
  compatibleMachines: string[];
  lastMaintenanceDate: string;
  imageThumbnail: string;
  transportInstructions: string;
  toolRoomManagerSignature?: {
    signedBy: string;
    timestamp: string;
    comments?: string;
  };
  productionManagerSignature?: {
    signedBy: string;
    timestamp: string;
    conditionAccepted: boolean;
    comments?: string;
  };
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userName: string;
  userRole: string;
  action: 'Created' | 'Edited' | 'Picked & Packed' | 'Dispatched' | 'Gate Out' | 'Arrived' | 'Received' | 'Overridden' | 'Shortage Reported' | string;
  location: string;
  deviceIp: string;
  changesMade: string;
}

export interface LogisticsDetails {
  vehicleNumber: string;
  transportMode: 'Road' | 'Rail' | 'Air';
  transporterName: string;
  transporterGstin: string;
  driverName: string;
  driverMobile: string;
  lrNumber: string;
  lrDate: string;
  distanceKm: number;
  eWayBillRequired: boolean;
  eWayBillNumber?: string;
  eWayBillDate?: string;
  eWayBillValidUntil?: string;
  eWayBillStatus?: 'Not Applicable' | 'Generated' | 'Expiring Soon' | 'Expired' | 'Extended';
  eWayBillError?: string;
  taxDocType: 'Stock Transfer Delivery Challan' | 'Tax Invoice';
  assessableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTaxAmount: number;
  grandTotalValue: number;
  hsnSummary: Array<{
    hsnCode: string;
    taxableValue: number;
    gstRate: number;
    cgst: number;
    sgst: number;
    igst: number;
  }>;
}

export interface StockTransferRecord {
  id: string; // ISTN-YYYY-XXXXX, XSTN-YYYY-XXXXX, RDC-YYYY-XXXXX, ATN-YYYY-XXXXX
  transferType: TransferType;
  status: TransferStatus;
  assetStatus?: AssetMoldStatus;
  createdDate: string;
  createdTime?: string;
  createdBy?: string;
  requestedBy: string;
  department: string;
  priority: 'Routine' | 'Urgent' | 'Line Stoppage';
  fromPlantId?: string;
  fromPlantName?: string;
  fromStoreId?: string;
  fromStoreName?: string;
  toPlantId?: string;
  toPlantName?: string;
  toStoreId?: string;
  toStoreName?: string;
  sourcePlant?: string;
  destPlant?: string;
  sourceStore?: string;
  destStore?: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  items: StockTransferItem[];
  assetDetails?: AssetMoldItem;
  logistics?: LogisticsDetails;
  remarks?: string;
  gatePassNumber?: string;
  grnNumber?: string;
  grnDate?: string;
  grnReceivedBy?: string;
  shortageReported?: boolean;
  shortageDetails?: {
    shortQtyTotal: number;
    reason: string;
    notificationSentTo: string[];
    decisionStatus: 'Pending Decision' | 'Write-off Approved' | 'Replacement Dispatched';
    resolutionNotes?: string;
  };
  auditTrail: AuditLogEntry[];
}

export interface ReturnableDCRecord {
  id: string; // RDC-YYYY-XXXXX
  destinationType: 'Customer' | 'Inter-Plant';
  destinationName: string;
  destinationLocation: string;
  itemName: string;
  itemCode: string;
  itemType: 'Plastic Pallet' | 'Steel Wire Bin' | 'HM-HDPE Drum' | 'Corrugated Tote';
  issuedQty: number;
  returnedQty: number;
  pendingReturnQty: number;
  issueDate: string;
  expectedReturnDate: string;
  daysOutstanding: number;
  agingStatus: 'Green (<15d)' | 'Amber (15-30d)' | 'Red (>30d Overdue)' | 'Closed (<15d)' | 'Closed';
  notionalValuePerUnit: number;
  depositCollected?: number;
  convertedToTaxInvoice?: boolean;
  taxInvoiceNumber?: string;
  lastReturnDate?: string;
  notes?: string;
}

export interface TransferShortageNotification {
  id: string;
  transferNumber: string;
  dateReported: string;
  itemCode: string;
  itemName: string;
  dispatchedQty: number;
  receivedQty: number;
  shortQty: number;
  sourcePlant: string;
  destPlant: string;
  reason: string;
  status: 'Pending Decision' | 'Write-off Approved' | 'Replacement Dispatched';
  decisionNotes?: string;
}

export interface MaintenanceWorkOrderDraft {
  id: string;
  assetId: string;
  moldName: string;
  reportedDate: string;
  reportedAtPlant: string;
  severity: 'Critical (Line Down)' | 'Major' | 'Minor';
  damageDetails: string;
  insuranceClaimDraftNo: string;
  status: 'Draft Work Order Staged' | 'Inspection Scheduled' | 'In Repair';
}
