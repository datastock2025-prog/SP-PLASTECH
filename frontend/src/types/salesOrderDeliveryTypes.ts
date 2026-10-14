/**
 * Data Architecture for Sales Order and Delivery & Dispatch
 * Indian Plastic Manufacturing ERP
 * Compliant with GST, E-Invoice (IRP/GSP), and E-Way Bill (NIC)
 */

export type SalesOrderType = 'Daily Sales Order' | 'Monthly Plan Order' | 'Blanket/Contract Order';

export type MonthlyPlanLinkType = 'Not Linked' | 'Manually Mapped' | 'Auto-Consumed' | 'Linked';

export type MonthlyPlanStatus =
  | 'Draft'
  | 'Published'
  | 'Partially Supplied'
  | 'Fully Supplied'
  | 'Variance'
  | 'Expired'
  | 'Closed';

export type SalesOrderStatus =
  | 'Draft'
  | 'Pending Approval'
  | 'Credit Hold'
  | 'Confirmed'
  | 'Partially Allocated'
  | 'Allocated'
  | 'In Production'
  | 'Ready to Dispatch'
  | 'Partially Delivered'
  | 'Delivered'
  | 'Invoiced'
  | 'Closed'
  | 'Cancelled';

export type DeliveryStatus =
  | 'Draft'
  | 'Stock Allocated'
  | 'Pick List Created'
  | 'Picking'
  | 'Picked'
  | 'Packing'
  | 'Packed'
  | 'Packaged'
  | 'Challan Generated'
  | 'E-Invoiced'
  | 'Compliance Pending'
  | 'Ready for Dispatch'
  | 'Gate Pass Created'
  | 'Gate Pass Issued'
  | 'Dispatched'
  | 'In Transit'
  | 'In-Transit'
  | 'Delivered'
  | 'POD Received'
  | 'Cancelled'
  | 'Closed';

export type EInvoiceStatus =
  | 'Not Required'
  | 'Pending'
  | 'Submitted'
  | 'Generated'
  | 'Failed'
  | 'Cancelled'
  | 'Needs Regeneration';

export type EWayBillStatus =
  | 'Not Required'
  | 'Pending'
  | 'Generated'
  | 'Active'
  | 'Vehicle Updated'
  | 'Expired'
  | 'Extended'
  | 'Cancelled'
  | 'Consolidated';

export type GatePassStatus =
  | 'Draft'
  | 'Generated'
  | 'Verified'
  | 'Dispatched'
  | 'Cancelled';

export type UserRole =
  | 'Sales Executive'
  | 'Sales Manager'
  | 'Customer Service'
  | 'Warehouse Picker'
  | 'Warehouse Supervisor'
  | 'Dispatch Executive'
  | 'Accounts User'
  | 'GST Compliance User'
  | 'Security/Gate User'
  | 'Admin';

export interface MonthlyPlanOrder {
  id: string; // e.g. PLN-2026-09-01
  customer: string;
  customerGstin: string;
  monthPeriod: string; // e.g. "September 2026"
  planType: 'Forecast' | 'Rate contract' | 'Monthly supply plan' | 'Billable monthly order';
  consumptionMode: 'Independent' | 'Manual reconciliation' | 'Auto-consume, disabled by default';
  billingMode: 'Non-billable plan' | 'Billable monthly summary' | 'Reconciliation only';
  status: MonthlyPlanStatus;
  plant: string;
  fgStore: string;
  createdDate: string;
  items: Array<{
    itemCode: string;
    itemName: string;
    customerItemCode?: string;
    hsn: string;
    plannedQty: number;
    deliveredQty: number;
    invoicedQty: number;
    remainingQty: number;
    rate: number;
    uom: string;
    plant: string;
    fgStore: string;
  }>;
  totalPlannedQty: number;
  totalDailySuppliedQty: number;
  remainingPlanQty: number;
  varianceQty: number;
  variancePct: number;
  totalPlannedValue: number;
  notes?: string;
  planNumber?: string;
  plantWarehouse?: string;
  monthYear?: string;
  auditTrail: Array<{ action: string; user: string; timestamp: string; note?: string }>;
}

export interface OrderRelationship {
  id: string;
  monthlyPlanId: string;
  monthlyPlanLineItem: string;
  linkedDailySoId: string;
  linkedDailySoLineItem: string;
  linkType: MonthlyPlanLinkType;
  linkedQuantity: number;
  remainingMonthlyQuantity: number;
  mappingReason: string;
  mappedBy: string;
  mappingDate: string;
  approvedBy?: string;
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
}

export interface PlasticSalesOrderItem {
  lineNumber: number;
  itemCode: string;
  itemName: string;
  customerItemCode?: string;
  hsn: string;
  orderedQty: number;
  allocatedQty: number;
  pickedQty: number;
  packedQty: number;
  deliveredQty: number;
  invoicedQty: number;
  remainingQty: number;
  uom: string;
  plant: string;
  fgStore: string;
  batchPreference?: string;
  requestedDeliveryDate: string;
  availableStock: number;
  reservedStock: number;
  shortageQty: number;
  status: 'In Stock' | 'Shortage' | 'Allocated' | 'Dispatched';
  unitPrice: number;
  discountPct: number;
  taxableValue: number;
  gstRatePct: number; // e.g. 18%
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  totalValue: number;
  polymerGrade?: string;
  mouldCode?: string;
}

export interface PlasticSalesOrder {
  id: string; // SO-5001
  orderType: SalesOrderType;
  customer: string;
  customerGstin: string;
  customerPoNumber: string;
  customerPoDate: string;
  orderDate: string;
  requiredDeliveryDate: string;
  monthlyPlanPeriod?: string;
  monthlyPlanRef?: string;
  linkedMonthlyPlanId?: string;
  linkType: MonthlyPlanLinkType;
  salesperson: string;
  currency: string;
  paymentTerms: string;
  priceList: string;
  plant: string;
  fgStore: string;
  billingAddress: {
    line1: string;
    city: string;
    state: string;
    pincode: string;
    gstin: string;
    placeOfSupply: string;
  };
  shippingAddress: {
    line1: string;
    city: string;
    state: string;
    pincode: string;
    gstin: string;
    dispatchPoint: string;
  };
  status: SalesOrderStatus;
  creditStatus: 'Approved' | 'Hold' | 'Review Pending' | 'Exceeded';
  creditLimit: number;
  currentExposure: number;
  availableCredit: number;
  // Delivery & Compliance Statuses
  deliveryStatus: 'Not Started' | 'Partially Delivered' | 'Fully Delivered' | 'Pending Pick';
  invoiceStatus: 'Uninvoiced' | 'Partially Invoiced' | 'Fully Invoiced';
  eInvoiceStatus: EInvoiceStatus;
  eWayBillStatus: EWayBillStatus;
  // Financials
  taxableAmount: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  cessTotal: number;
  freightAmount: number;
  packingAmount: number;
  totalOrderValue: number;
  deliveredValue: number;
  invoicedValue: number;
  remainingValue: number;
  // Transport & Dispatch info
  transportMode: 'Road' | 'Rail' | 'Air' | 'Ship';
  transporterName: string;
  transporterGstin: string;
  vehicleNumber?: string;
  lrNumber?: string;
  incoterms: string;
  deliveryTerms: string;
  packagingInstructions: string;
  // Compliance configs
  eInvoiceRequired: boolean;
  eWayBillRequired: boolean;
  deliveryChallanAllowed: boolean;
  coaRequired: boolean;
  msdsRequired: boolean;
  batchTraceabilityRequired: boolean;
  // Collections
  lines: PlasticSalesOrderItem[];
  auditTrail: Array<{ action: string; user: string; timestamp: string; details?: string }>;
}

export type SalesOrderLineItem = PlasticSalesOrderItem;
export type DeliveryChallanItem = DeliveryNoteChallan['items'][number];

export interface FgBatchStock {
  batchNumber: string;
  itemCode: string;
  itemName: string;
  plant: string;
  fgStore: string;
  locationCode: string; // e.g. LOC-A1-04
  binCode: string;
  availableQty: number;
  reservedQty: number;
  pickableQty: number;
  mfgDate: string;
  expiryDate: string;
  daysToExpiry: number;
  qualityStatus: 'Approved' | 'Near Expiry' | 'Quality Hold' | 'Quarantine' | 'Rejected';
  coaStatus: 'Available' | 'Pending QC' | 'Not Required';
  coaNumber?: string;
  fefoRank: number; // 1 = earliest expiry
  fifoRank: number; // 1 = oldest mfg
  polymerLotNo?: string;
}

export interface FgPickListItem {
  lineId: string;
  itemCode: string;
  itemName: string;
  batchLot: string;
  locationCode: string;
  binCode: string;
  requiredQty: number;
  pickedQty: number;
  uom: string;
  expiryDate: string;
  qualityStatus: string;
  fefoSuggested: boolean;
  scanStatus: 'Pending' | 'Scanned' | 'Shortage' | 'Override';
  overrideReason?: string;
  photoUrl?: string;
}

export interface FgPickList {
  id: string; // PK-8001
  deliveryNoteId: string;
  salesOrderId: string;
  customer: string;
  plant: string;
  fgStore: string;
  pickerName: string;
  date: string;
  status: 'Draft' | 'In Progress' | 'Picked' | 'Packed' | 'Cancelled';
  items: FgPickListItem[];
  notes?: string;
}

export interface DeliveryPackageItem {
  packageId?: string; // PKG-9001
  packageNumber?: string;
  palletId?: string; // PAL-101
  itemCode?: string;
  itemName?: string;
  batchLot?: string;
  packedQty?: number;
  itemCount?: number;
  uom?: string;
  packageType: 'Corrugated Box' | 'Wooden Pallet' | 'Plastic Crate' | 'HDPE Bag' | string;
  grossWeightKg?: number;
  netWeightKg?: number;
  weightKg?: number;
  dimensionsCm?: string; // e.g. "60x40x40"
  labelStatus?: 'Pending' | 'Printed' | 'Applied';
  sealNumber?: string;
  qrCode?: string;
  customerItemCode?: string;
  mfgDate?: string;
  expiryDate?: string;
  handlingInstructions?: string;
}

export interface DeliveryNoteChallan {
  id: string; // DN-4001 or DC-4001
  type: 'Normal Supply' | 'Delivery Challan' | 'Sample Dispatch' | 'Returnable Dispatch';
  salesOrderId: string;
  salesOrderType: SalesOrderType;
  customer: string;
  customerGstin: string;
  shipToAddress: string;
  shipToGstin: string;
  placeOfSupply: string;
  plant: string;
  fgStore: string;
  deliveryDate: string;
  date?: string;
  dispatchDate?: string;
  status: DeliveryStatus;
  // Logistics
  transportMode: 'Road' | 'Rail' | 'Air' | 'Ship';
  transporterName: string;
  transporterIdGstin: string;
  vehicleNumber: string;
  driverName?: string;
  driverMobile?: string;
  driverPhone?: string;
  driverContact?: string;
  lrNumber: string;
  dispatchPoint: string;
  estimatedDistanceKm: number;
  approxDistanceKm?: number;
  expectedDeparture: string;
  expectedArrival: string;
  actualDeparture?: string;
  actualDelivery?: string;
  // Invoice & Compliance
  invoiceNumber?: string;
  invoiceDate?: string;
  invoiceValue: number;
  taxableValue: number;
  taxableAmount?: number;
  cgstAmount: number;
  cgstTotal?: number;
  sgstAmount: number;
  sgstTotal?: number;
  igstAmount: number;
  igstTotal?: number;
  eInvoiceStatus: EInvoiceStatus;
  irn?: string;
  ackNumber?: string;
  ackNo?: string;
  ackDate?: string;
  eWayBillStatus: EWayBillStatus;
  ewbStatus?: string;
  ewbNumber?: string;
  ewbDate?: string;
  ewbValidUntil?: string;
  ewbPartA: boolean;
  ewbPartB: boolean;
  gatePassNumber?: string;
  gatePassStatus: GatePassStatus;
  sealNumber?: string;
  packageCount: number;
  packagingType?: string;
  grossWeightKg: number;
  tareWeightKg?: number;
  netWeightKg: number;
  // POD
  podStatus: 'Pending' | 'Received' | 'Disputed' | 'Rejected';
  podReceiverName?: string;
  podReceivedDate?: string;
  podSignature?: string;
  podRemarks?: string;
  podAttachmentUrl?: string;
  // Items
  items: Array<{
    soLineNumber: number;
    itemCode: string;
    itemName: string;
    orderedQty: number;
    deliveredQty: number;
    remainingQty: number;
    requestedQty: number;
    pickedQty: number;
    packedQty: number;
    uom: string;
    plant: string;
    fgStore: string;
    batchLot: string;
    locationCode: string;
    hsn: string;
    unitPrice: number;
    taxRatePct: number;
    lineTotal: number;
    pickStatus: 'Pending' | 'Picked' | 'Shortage';
    coaNumber?: string;
    taxableValue?: number;
    allocatedBatches?: any[];
  }>;
  packages: DeliveryPackageItem[];
  complianceBlockReason?: string;
  auditTrail: Array<{ action: string; user: string; timestamp: string; remarks?: string }>;
}

export interface EInvoiceRecord {
  id?: string;
  deliveryId?: string;
  invoiceNumber: string;
  deliveryNoteNumber?: string;
  salesOrderNumber?: string;
  customer?: string;
  customerGstin?: string;
  supplierGstin?: string;
  invoiceDate?: string;
  invoiceValue?: number;
  totalValue?: number;
  taxableValue?: number;
  placeOfSupply?: string;
  posState?: string;
  posStateCode?: string;
  invoiceType?: 'B2B' | 'B2G' | 'Export' | 'SEZ' | string;
  hsnCode?: string;
  cgst?: number;
  cgstValue?: number;
  sgst?: number;
  sgstValue?: number;
  igst?: number;
  igstValue?: number;
  cess?: number;
  cessValue?: number;
  irn?: string;
  ackNumber?: string;
  ackNo?: string;
  ackDate?: string;
  status?: EInvoiceStatus;
  qrCodeUrl?: string;
  eWayBillLinked?: boolean;
  errorCode?: string;
  errorMessage?: string;
  signedInvoiceJson?: string;
  signedQrCode?: string;
  nicSyncStatus?: string;
  items?: any[];
  apiLogs?: Array<{ timestamp: string; endpoint: string; status: number; message: string }>;
  overrideApprovedBy?: string;
  overrideReason?: string;
}

export interface EWayBillRecord {
  id?: string;
  ewbNumber: string;
  sourceDocument?: 'Invoice' | 'Delivery Challan';
  documentNumber: string;
  customer?: string;
  customerGstin?: string;
  fromGstin?: string;
  fromLegalName?: string;
  fromAddress?: string;
  fromPlace?: string;
  fromPincode?: string;
  fromState?: string;
  fromStateCode?: string;
  toGstin?: string;
  toLegalName?: string;
  toAddress?: string;
  toPlace?: string;
  toPincode?: string;
  toState?: string;
  toStateCode?: string;
  recipientGstin?: string;
  supplierGstin?: string;
  dispatchDate?: string;
  generatedDate?: string;
  validUntil: string;
  hoursRemaining?: number;
  validityHoursRemaining?: number;
  totalValue?: number;
  taxableAmount?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  cessAmount?: number;
  transporterName?: string;
  transporterId?: string;
  vehicleNumber?: string;
  vehicleType?: string;
  transportMode?: 'Road' | 'Rail' | 'Air' | 'Ship';
  distanceKm?: number;
  approxDistanceKm?: number;
  status: EWayBillStatus;
  partA?: boolean;
  partB?: boolean;
  partBStatus?: string;
  subSupplyType?: 'Supply' | 'Export' | 'Job Work' | 'SKD/CKD' | 'Recipient Not Known' | 'For Own Use' | 'Others' | string;
  supplyType?: string;
  reasonForTransportation?: 'Supply' | 'Export' | 'Job work' | 'Line Sale' | 'Recipient not known' | 'Fair/Exhibition' | string;
  dispatchFrom?: string;
  dispatchTo?: string;
  driverName?: string;
  driverMobile?: string;
  lrNumber?: string;
  ewbDate?: string;
  documentDate?: string;
  documentType?: string;
  qrCodeUrl?: string;
  qrCodeData?: string;
  items?: any[];
  vehicleHistory?: Array<{ vehicleNumber: string; fromPlace: string; updatedOn: string; user: string; reason: string }>;
  isConsolidated?: boolean;
  consolidatedEwbNumber?: string;
}

export interface ConsolidatedEwbRecord {
  consolidatedEwbNumber: string;
  vehicleNumber: string;
  transporter: string;
  dispatchDate: string;
  totalInvoices: number;
  totalDeliveryChallans: number;
  totalEwbs: number;
  totalValue: number;
  status: 'Generated' | 'Active' | 'Cancelled';
  ewbList: Array<{
    ewbNumber: string;
    documentNumber: string;
    customer: string;
    value: number;
    destination: string;
    status: string;
  }>;
}

export interface GatePassRecord {
  id?: string;
  deliveryId?: string;
  deliveryNumber?: string;
  invoiceNumber?: string;
  salesOrderId?: string;
  customer?: string;
  customerName?: string;
  plant?: string;
  invoiceValue?: number;
  tareWeightKg?: number;
  netWeightKg?: number;
  driverLicenseNumber?: string;
  gatePassNumber: string;
  deliveryNoteNumber?: string;
  deliveryNoteId?: string;
  invoiceOrChallanNumber?: string;
  vehicleNumber: string;
  driverName: string;
  driverMobile?: string;
  driverPhone?: string;
  driverContact?: string;
  transporter?: string;
  transporterName?: string;
  gateNumber?: string;
  ewbNumber?: string;
  lrNumber?: string;
  sealNumber?: string;
  packageCount?: number;
  totalPackages?: number;
  grossWeightKg?: number;
  packagingType?: string;
  securityOfficerName?: string;
  qrCodeData?: string;
  notes?: string;
  issueDate?: string;
  departureTime?: string;
  securityVerifiedBy?: string;
  dispatchApprovedBy?: string;
  status?: GatePassStatus;
  securityCheckStatus?: 'Pending' | 'Cleared' | 'Security Hold' | string;
  vehiclePhotoCaptured?: boolean;
  sealPhotoCaptured?: boolean;
  vehicleInspection?: any;
  ewbQrScanned?: boolean;
  eInvoiceQrVerified?: boolean;
  remarks?: string;
  gateOutTimestamp?: string;
  holdReason?: string;
}

export interface ComplianceExceptionRecord {
  id: string; // EXC-7001
  deliveryOrInvoice: string;
  customer: string;
  entityName?: string;
  category?: string;
  documentNumber?: string;
  description?: string;
  penaltyRisk?: number;
  suggestedResolution?: string;
  exceptionType:
    | 'E-invoice pending'
    | 'E-invoice failed'
    | 'IRN not generated'
    | 'QR missing'
    | 'EWB not generated'
    | 'EWB expired'
    | 'Vehicle not updated'
    | 'Transporter ID missing'
    | 'GSTIN invalid'
    | 'HSN missing'
    | 'Tax breakup mismatch'
    | 'Invoice value threshold mismatch'
    | 'Gate pass missing'
    | 'Dispatch without compliance'
    | 'API integration failure'
    | string;
  errorCode: string;
  errorMessage: string;
  severity: 'Critical' | 'Warning' | 'Informational' | string;
  detectedDate: string;
  assignedTo: string;
  status: 'Open' | 'In Review' | 'Resolved' | 'Overridden' | string;
  auditLog: Array<{ action: string; timestamp: string; user: string; note: string }>;
}
