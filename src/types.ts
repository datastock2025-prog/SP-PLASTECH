export type ItemType =
  | 'Raw Material'
  | 'Additive'
  | 'Masterbatch'
  | 'Colorant'
  | 'Regrind'
  | 'Semi-Finished Good'
  | 'Finished Good'
  | 'Packaging'
  | 'Packaging Material'
  | 'Spare Part'
  | 'Consumable';
export type ItemStatus = 'active' | 'low' | 'hold' | 'blocked' | 'inactive';
export type ApprovalStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'released' | 'under_review' | 'obsolete' | 'waived';

export interface ItemLot {
  lotId: string;
  qty: number;
  uom: string;
  mfgDate: string;
  expiryDate: string;
  status: 'available' | 'quarantine' | 'expired' | 'rejected' | 'released';
  bin: string;
  supplierRef: string;
  qcRequired?: boolean;
  testResults?: Record<string, string | number>;
}

export interface ItemMaster {
  code: string;
  name: string;
  type: ItemType;
  cat: string;
  stock: string;
  avail: string;
  wh: string;
  lot: boolean;
  qc: boolean;
  status: ItemStatus;
  icon: string;
  desc?: string;
  baseUOM: string;
  resinType?: string;
  mfi?: string;
  density?: string;
  moisture?: string;
  regrind?: string;
  machineCompat?: string;
  foodGrade?: string;
  hazardClass?: string;
  countryOrigin?: string;
  hsCode?: string;
  reorderLevel?: string;
  safetyStock?: string;
  leadTime?: string;
  supplier?: string;
  valuation?: string;
  approval: ApprovalStatus;
  createdOn: string;
  rejectReason?: string;
  standardCycleTime?: number;
  cycleTimeUOM?: string;
  cycleTimeSource?: string;
  cycleTimeEffective?: string;
  cycleTimeApprovedBy?: string;
  cycleTimeVersion?: string;
  cycleTimeHistory?: Array<{
    old: string | number;
    new: number;
    by: string;
    date: string;
    reason: string;
    effective: string;
    source: string;
  }>;
  locationCode?: string;
  moistureSensitive?: boolean;
  hazardous?: boolean;
  sourceWO?: string | null;
  reprocessCycle?: number;
  maxCycles?: number;
  contaminationLevel?: string;
  recycledContentPct?: number;
  lots?: ItemLot[];
  standardCost?: number;
  cost?: number;
  scrapRate?: number;
  defaultLocation?: string;
}

export interface BomLine {
  id?: string;
  sequence?: number;
  level?: number;
  item: string;
  name: string;
  category?: string;
  qty: number;
  uom: string;
  scrap: number;
  yield?: number;
  cost: number;
  extendedCost?: number;
  additionPhase?: 'Main Hopper' | 'Side Feeder' | 'Liquid Dosing' | 'Pre-mix' | 'Post-mix' | 'Rework Addition';
  regrindPct?: number;
  dosageRate?: string;
  tolerance?: string;
  substituteGroup?: string;
  substituteItem?: string;
  isCritical?: boolean;
  backflush?: boolean;
  issueMethod?: 'Auto Backflush' | 'Manual Issue' | 'Floor Stock';
  position?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  instructions?: string;
  customerApproved?: boolean;
  status?: 'active' | 'inactive' | 'obsolete' | 'substitute_available';
}

export type BomType = 'Engineering BOM' | 'Manufacturing BOM' | 'Sales BOM' | 'Costing BOM' | 'Packaging BOM';
export type PlasticProcessType = 'Injection Molding' | 'Extrusion' | 'Blow Molding' | 'Thermoforming' | 'Compounding & Blending' | 'Granulation & Regrind' | 'Assembly & Packaging';

export interface BomApprovalHistory {
  stage: string;
  approver: string;
  role: string;
  status: 'Approved' | 'Rejected' | 'Pending' | 'Request Change';
  comments?: string;
  timestamp: string;
  signature?: string;
}

export interface BomDocument {
  id: string;
  name: string;
  type: 'Product Drawing' | 'Customer Drawing' | 'Material Spec' | 'Process Spec' | 'Machine Setup Sheet' | 'Mold Setup Sheet' | 'Packaging Spec' | 'Label Artwork' | 'COA Template' | 'MSDS/SDS' | 'Quality Standard' | 'Customer Approval' | 'Regulatory Cert';
  version: string;
  effectiveDate: string;
  expiryDate?: string;
  uploadedBy: string;
  status: 'Active' | 'Under Review' | 'Expired';
  fileSize: string;
  requiredForRelease?: boolean;
  link?: string;
}

export interface BomMaster {
  id: string;
  parent: string;
  parentName: string;
  version: string;
  revision?: string;
  bomType?: BomType;
  processType?: PlasticProcessType;
  status: ApprovalStatus;
  approvalStage?: 'Draft' | 'Engineering Review' | 'Production Review' | 'Quality Review' | 'Finance Review' | 'Approved' | 'Released';
  updated: string;
  createdDate?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  baseUOM?: string;
  batchSize?: number;
  yieldPct?: number;
  scrapPct?: number;
  standardCost?: number;
  materialCost?: number;
  laborCost?: number;
  machineOverhead?: number;
  moldAmortization?: number;
  energyCost?: number;
  regrindCredit?: number;
  lastCostRollupDate?: string;
  owner?: string;
  plantId?: string;
  moldId?: string;
  machineGroup?: string;
  cycleTimeSec?: number;
  cavities?: number;
  rejectReason?: string;
  isLocked?: boolean;
  notes?: string;
  mfgCategory?: 'Discrete Manufacturing BOM' | 'Formula / Recipe BOM' | 'Assembly BOM' | 'Packaging BOM' | 'Secondary Operation BOM';
  secondaryOperations?: SecondaryOperationDetail[];
  routingResources?: RoutingResourceDetail[];
  scrapConfig?: ScrapYieldConfig;
  qualityConfig?: QualitySpecConfig;
  packagingCost?: number;
  secondaryOpCost?: number;
  customerPartNumber?: string;
  defaultInputLocation?: string;
  defaultWipLocation?: string;
  defaultFgLocation?: string;
  defaultSecondaryLocation?: string;
  lines: BomLine[];
  approvals?: BomApprovalHistory[];
  documents?: BomDocument[];
}

export interface SecondaryOperationDetail {
  id: string;
  sequence: number;
  partCode: string;
  partName: string;
  description: string;
  inputItem: string;
  outputItem: string;
  operationType: 'Trimming' | 'Degating' | 'Sticker Placement' | 'Labeling' | 'Printing' | 'Assembly' | 'Insert Fitting' | 'Welding' | 'Packing' | 'Inspection' | 'Quality sorting' | 'Rework' | 'Other';
  workCenter: string;
  locationBefore: string;
  locationAfter: string;
  stockStatusBefore: string;
  stockStatusAfter: string;
  qualityCheckRequired: boolean;
  standardTimeMin: number;
  scrapPct: number;
  inventoryImpact: 'Transform to New Item' | 'Same Item Status Update' | 'Move to New Location' | 'No Inventory Impact';
  consumedComponents: Array<{
    itemCode: string;
    itemName: string;
    qty: number;
    uom: string;
    scrapPct: number;
    issueMethod: string;
    locationCode: string;
    substituteAllowed: boolean;
  }>;
}

export interface RoutingResourceDetail {
  id: string;
  operationNo: number;
  operationName: string;
  operationType: string;
  workCenter: string;
  machineId: string;
  moldId: string;
  cavities: number;
  setupTimeMin: number;
  runTimeHours: number;
  cycleTimeSec: number;
  crewSize: number;
  laborSkill: string;
  outputPerHour: number;
  qualityCheckpoint: boolean;
  instructions: string;
}

export interface ScrapYieldConfig {
  standardYieldPct: number;
  expectedScrapPct: number;
  startupScrapKg: number;
  processWastePct: number;
  purgingMaterialKg: number;
  runnerScrapCategory: string;
  lumbesScrapCategory: string;
  reworkAllowed: boolean;
  regridRecoveryAllowed: boolean;
  maxRegrindPct: number;
}

export interface QualitySpecConfig {
  qualityInspectionRequired: boolean;
  incomingInspectionRequired: boolean;
  inProcessInspectionRequired: boolean;
  finalInspectionRequired: boolean;
  secondaryInspectionRequired: boolean;
  inspectionPlanId: string;
  samplingRule: string;
  criticalParams: string[];
  coaRequired: boolean;
  customerApprovalRequired: boolean;
  msdsRequired: boolean;
}

export interface EngineeringChangeRequest {
  id: string;
  ecrNumber: string;
  requestDate: string;
  requestedBy: string;
  department: string;
  relatedItem: string;
  relatedItemName: string;
  relatedBomId?: string;
  changeType: 'Material Change' | 'Quantity Change' | 'Supplier Change' | 'Cost Reduction' | 'Quality Improvement' | 'Regulatory Compliance' | 'Customer Request' | 'Process Improvement' | 'Packaging Change';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  riskLevel: 'Low' | 'Medium' | 'High';
  targetDate: string;
  description: string;
  reason: string;
  expectedImpact: string;
  status: 'Draft' | 'Submitted' | 'Under Review' | 'Approved' | 'Rejected' | 'Converted to ECO' | 'Closed';
  affectedBoms: string[];
  affectedWorkOrders: string[];
  stockImpactKg: number;
  estimatedCostImpact: number;
  approvals: BomApprovalHistory[];
}

export interface EngineeringChangeOrder {
  id: string;
  ecoNumber: string;
  linkedEcrId?: string;
  itemCode: string;
  itemName: string;
  bomId: string;
  changeOwner: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  targetDate: string;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'In Progress' | 'Implemented' | 'Closed' | 'Cancelled';
  effectiveStrategy: 'Immediate' | 'Use Up Existing Stock' | 'From Specific Date' | 'From Specific Batch';
  specificBatchDate?: string;
  beforeBomLines: BomLine[];
  afterBomLines: BomLine[];
  routingChanges?: Array<{
    operation: string;
    changeType: 'Added' | 'Removed' | 'Modified';
    details: string;
  }>;
  checklist: Array<{
    task: string;
    completed: boolean;
    completedBy?: string;
    completedDate?: string;
  }>;
  approvals: BomApprovalHistory[];
}

export interface RecipeFormula {
  id: string;
  name: string;
  parentItem: string;
  parentName: string;
  baseUOM: string;
  batchSizeKg: number;
  totalPercentage: number;
  yieldPct: number;
  processType: PlasticProcessType;
  version: string;
  status: ApprovalStatus;
  colorFamily?: string;
  moistureSensitivity?: string;
  tempSensitivity?: string;
  mixingInstructions?: string;
  preDryingInstructions?: string;
  lines: Array<{
    seq: number;
    materialGroup: 'Base Resin' | 'Regrind' | 'Filler' | 'Masterbatch' | 'Colorant' | 'Additive' | 'Processing Aid' | 'Purging Compound' | 'Packaging';
    item: string;
    description: string;
    percentage: number;
    qtyKg: number;
    uom: string;
    dosageRate: string;
    tolerance: string;
    additionPhase: 'Main Hopper' | 'Side Feeder' | 'Liquid Dosing' | 'Pre-mix' | 'Post-mix' | 'Rework Addition';
    scrapPct: number;
    substituteGroup?: string;
    costPerKg: number;
    status: 'active' | 'substitute_available' | 'hold';
  }>;
}

export interface AlternateMaterial {
  id: string;
  primaryItem: string;
  primaryItemName: string;
  replacementItem: string;
  replacementItemName: string;
  type: 'Alternate' | 'Substitute';
  priority: number;
  conversionRatio: number;
  validFrom: string;
  validTo: string;
  approvalStatus: 'Approved' | 'Pending QA' | 'Rejected' | 'Customer Approval Required';
  customerApprovalRequired: boolean;
  qualityApprovalRequired: boolean;
  currentStock: string;
  costImpactPerKg: number;
  notes: string;
}

export interface RegrindUsageSpec {
  id: string;
  itemCode: string;
  itemName: string;
  regrindEnabled: boolean;
  maxRegrindPct: number;
  currentConfigPct: number;
  sources: Array<'Internal sprues/runners' | 'Rejected parts' | 'Post-industrial regrind (PIR)' | 'Post-consumer regrind (PCR)'>;
  allowedMaterialFamily: string;
  colorRestrictions: string;
  degradationCycleLimit: number;
  currentCycleAverage: number;
  qualityInspectionRequired: boolean;
  customerApprovalRequired: boolean;
  foodContactBlocked: boolean;
  medicalGradeBlocked: boolean;
  costSavingsPerKg: number;
  annualCo2ReductionKg: number;
}

export interface RoutingOperationItem {
  seq: number;
  name: string;
  workCenter: string;
  machineId?: string;
  machineName?: string;
  moldId?: string;
  setupTimeMin: number;
  runTimeSec: number;
  cycleTimeSec: number;
  crewSize: number;
  laborSkill: string;
  outputPerHour: number;
  scrapPct: number;
  qualityCheckpoint: boolean;
  instructions: string;
  status: 'active' | 'in_review' | 'inactive';
}

export interface BomRouting {
  id: string;
  linkedBomId: string;
  itemCode: string;
  itemName: string;
  version: string;
  status: ApprovalStatus;
  standardBatchSize: number;
  effectiveDate: string;
  operations: RoutingOperationItem[];
}

export interface MachineMoldRequirement {
  id: string;
  bomId: string;
  itemCode: string;
  itemName: string;
  machineType: string;
  tonnageMin: number;
  tonnageMax: number;
  recommendedMachine: string;
  barrelCapacityCc: number;
  screwType: string;
  ovenDryingRequired: boolean;
  dryingTempC: number;
  dryingTimeHours: number;
  moldId: string;
  moldName: string;
  cavities: number;
  hotRunnerType: string;
  moldMaterial: string;
  moldStatus: 'Available' | 'In Production' | 'In Toolroom PM' | 'Maintenance Required';
  shotsRemaining: number;
  tempZones: { z1: number; z2: number; z3: number; z4: number; nozzle: number; mold: number };
  injectionPressureBar: number;
  holdingPressureBar: number;
  screwSpeedRpm: number;
  coolingTimeSec: number;
  startupScrapKg: number;
  purgeMaterial: string;
}

export interface CustomAttributeDef {
  id: string;
  name: string;
  dataType: 'Text' | 'Number' | 'Percentage' | 'Select' | 'Boolean';
  mandatory: boolean;
  defaultValue: string;
  appliesTo: string;
  active: boolean;
}

export interface ItemCategoryNode {
  id: string;
  code: string;
  name: string;
  parentId: string | null;
  itemCount: number;
  defaultUOM?: string;
  defaultWarehouse?: string;
  children?: ItemCategoryNode[];
  attributes?: CustomAttributeDef[];
}

export interface MachineMaster {
  id: string;
  name: string;
  type: 'Injection Molding Machine' | 'Extrusion Line' | 'Blow Molding Machine' | 'Mold / Tooling' | 'Auxiliary Equipment';
  line: string;
  status: 'running' | 'idle' | 'breakdown' | 'maintenance' | 'in_use';
  job: string;
  lastPM: string;
  nextPM: string;
  tonnage: string;
  approval: ApprovalStatus;
  createdOn: string;
  rejectReason?: string;
  shotCount?: number;
  expectedLifeShots?: number;
  cavityCount?: number;
}

export interface RejectionBreakdownItem {
  id?: string;
  reason: string;
  qty: number;
  category?: 'dimensional' | 'visual' | 'material' | 'structural' | 'process' | 'startup' | string;
  notes?: string;
}

export interface DowntimeIntervalItem {
  id?: string;
  fromTime: string;
  toTime: string;
  min: number;
  reason: string;
  category?: 'mechanical' | 'electrical' | 'mold' | 'process' | 'material' | 'planned' | string;
  by?: string;
  notes?: string;
}

export interface WorkOrder {
  id: string;
  item: string;
  bomId: string | null;
  machine: string | null;
  day: string | null;
  qty: number;
  uom: string;
  completed: number;
  scrap: number;
  status: 'pending_approval' | 'planned' | 'released' | 'material_wait' | 'in_progress' | 'paused' | 'quality_hold' | 'completed' | 'cancelled';
  priority: 'Low' | 'Medium' | 'High';
  dueDate: string;
  operator: string;
  downtimeMin: number;
  mold?: string;
  jitSeq?: number;
  shift?: string;
  planDate?: string;
  plant?: string;
  plantName?: string;
  jitScheduleId?: string;
  cycleTimeStd?: number;
  locInput?: string;
  locOutput?: string;
  locScrap?: string;
  locRunner?: string;
  rejectionReason?: string;
  runnerQty?: number;
  lumbesQty?: number;
  runnerWeightKg?: number;
  lumpsWeightKg?: number;
  rejectionBreakdown?: RejectionBreakdownItem[];
  downtimeIntervals?: DowntimeIntervalItem[];
  remark?: string;
  qualityReleased?: boolean;
  releasedBy?: string;
  releasedDate?: string;
  coaId?: string;
  outputLogs: Array<{ time: string; good: number; scrap: number; by: string; rejReason?: string }>;
  downtimeLogs: Array<{ time: string; reason: string; min: number; by: string }>;
  checklist: Array<{ label: string; done: boolean }>;
  history: Array<{ event: string; time: string }>;
  operatorHistory?: Array<{
    from: string;
    to: string;
    by: string;
    date: string;
    reason: string;
    shift: string;
    source: string;
    woStatus: string;
  }>;
  operations?: Array<{
    seq: number;
    name: string;
    workCenter: string;
    std: string;
    actual: string;
    status: 'pending' | 'active' | 'complete';
    operator: string;
  }>;
  parameters?: Array<{
    zone: string;
    target: string;
    actual: string;
    inSpec: boolean;
  }>;
  signoffs?: Record<string, boolean>;
}

export interface StockTransaction {
  id: string;
  type: 'receipt' | 'issue' | 'transfer' | 'adjustment';
  item: string;
  qty: number;
  uom: string;
  wh?: string;
  fromWh?: string;
  toWh?: string;
  ref?: string;
  reason?: string;
  date: string;
  by: string;
}

export interface Warehouse {
  code: string;
  name: string;
  cap: number;
}

export interface BinLocation {
  code: string;
  warehouse: string;
  zone: string;
  type: string;
  dims: string;
  maxWeight: string;
  maxVolume: string;
  allowed: string;
  status: string;
  utilization: number;
}

export interface Supplier {
  code: string;
  name: string;
  category: string;
  rating: number;
  leadTime: string;
  contact: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
}

export interface PurchaseOrder {
  id: string;
  supplier: string;
  orderDate: string;
  expectedDate: string;
  approval: ApprovalStatus;
  rejectReason?: string;
  lines: Array<{
    item: string;
    name: string;
    qty: number;
    uom: string;
    price: number;
    received: number;
  }>;
  receiptLogs: Array<{
    date: string;
    item: string;
    qty: number;
    uom: string;
    txnId: string;
    lot?: string;
  }>;
  history: Array<{ event: string; time: string }>;
}

export interface Customer {
  code: string;
  name: string;
  segment: string;
  creditLimit: number;
  contact: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  gstin?: string;
  pan?: string;
  billingAddress?: string;
  shippingAddresses?: string[];
  paymentTerms?: string;
  accountManager?: string;
  riskRating?: 'AAA' | 'AA' | 'A' | 'BBB' | 'High Risk';
  creditStatus?: 'good_standing' | 'near_limit' | 'over_limit' | 'credit_blocked' | 'under_review' | 'default';
  creditUsed?: number;
  overdueAmount?: number;
  notes?: string;
  contacts?: Array<{
    name: string;
    role: string;
    email: string;
    phone: string;
    isPrimary: boolean;
  }>;
}

export interface SalesOrder {
  id: string;
  customer: string;
  customerPO?: string;
  priority: 'low' | 'medium' | 'high' | 'Low' | 'Medium' | 'High';
  quoteRef?: string;
  orderDate: string;
  deliveryDate: string;
  approval: ApprovalStatus;
  rejectReason?: string;
  lines: Array<{
    item: string;
    name: string;
    qty: number;
    uom: string;
    price: number;
    dispatched: number;
  }>;
  dispatchLogs: Array<{
    date: string;
    item: string;
    qty: number;
    uom: string;
    txnId: string;
  }>;
  history: Array<{ event: string; time: string }>;
}

export interface SalesQuotation {
  id: string;
  customer: string;
  customerRfq?: string;
  date: string;
  validUntil: string;
  currency: string;
  salesperson: string;
  priority: 'low' | 'medium' | 'high';
  expectedClose: string;
  stage: 'draft' | 'pending' | 'approved' | 'sent' | 'reviewing' | 'accepted' | 'lost' | 'expired' | 'converted';
  approval: ApprovalStatus;
  margin: number;
  convertedSo: string | null;
  lines: Array<{
    item: string;
    name: string;
    customerItemCode?: string;
    qty: number;
    uom: string;
    price: number;
    discountPct: number;
    color: string;
    grade: string;
    resinType: string;
    moq: number;
    coaRequired: boolean;
  }>;
  terms: {
    payment: string;
    incoterm: string;
    shipping: string;
    delivery: string;
  };
  history: Array<{ event: string; time: string }>;
}

export interface SalesRma {
  id: string;
  customer: string;
  soId: string | null;
  invoiceId: string | null;
  item: string;
  qty: number;
  uom: string;
  date: string;
  reason: string;
  returnType: string;
  disposition: string;
  status: 'draft' | 'pending' | 'approved' | 'customer_ship' | 'received' | 'under_inspection' | 'disposition_pending' | 'completed' | 'rejected' | 'closed';
  creditAmount: number;
  batch: string;
  history: Array<{ event: string; time: string }>;
}

export interface SalesContract {
  id: string;
  customer: string;
  type: string;
  startDate: string;
  endDate: string;
  totalQty: number;
  releasedQty: number;
  totalValue: number;
  releasedValue: number;
  status: 'active' | 'expiring' | 'expired' | 'draft';
  items: Array<{
    item: string;
    qty: number;
    price: number;
    moq: number;
    frequency: string;
  }>;
}

export interface CustomerInvoice {
  id: string;
  customer: string;
  soId: string | null;
  date: string;
  dueDate: string;
  lines: Array<{
    item: string;
    name: string;
    qty: number;
    price: number;
  }>;
  paid: number;
  history: Array<{ event: string; time: string }>;
}

export interface CustomerPayment {
  id: string;
  invoiceId: string;
  customer: string;
  amount: number;
  date: string;
  method: string;
  by: string;
}

export interface SupplierInvoice {
  id: string;
  poId: string | null;
  supplier: string;
  date: string;
  dueDate: string;
  amount: number;
  tax: number;
  matchStatus: 'matched' | 'price_variance' | 'qty_variance' | 'no_po';
  approval: ApprovalStatus;
  paymentStatus: 'unpaid' | 'paid';
  discountPct: number;
  discountDays: number;
  glAccount?: string;
  costCenter?: string;
  disputeReason?: string;
}

export interface GLAccount {
  code: string;
  name: string;
  type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  sub: string;
  parent: string | null;
  currency: string;
  tax: boolean;
  cc: boolean;
  status: 'active' | 'inactive';
  balance: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  ref: string;
  memo: string;
  currency: string;
  status: 'draft' | 'pending' | 'posted' | 'reversed';
  createdBy: string;
  approvedBy: string;
  reversalOf?: string;
  reversedBy?: string;
  lines: Array<{
    account: string;
    desc: string;
    debit: number;
    credit: number;
    cc: string;
    tax: string;
  }>;
}

export interface CreditDebitNote {
  id: string;
  type: 'credit' | 'debit';
  relatedInvoice: string;
  party: string;
  date: string;
  amount: number;
  reason: string;
  status: 'draft' | 'approved' | 'applied' | 'refunded' | 'void';
  appliedAmount: number;
}

export interface CostCenter {
  code: string;
  name: string;
  type: 'Production' | 'Maintenance' | 'Administration';
  department: string;
  manager: string;
  budget: number;
  actual: number;
  allocBase: string;
}

export interface CostRollup {
  item: string;
  name: string;
  materials: Array<{ label: string; qty: string; rate: number; amount: number }>;
  labor: { label: string; hrs: number; rate: number; amount: number };
  machineOh: { label: string; hrs: number; rate: number; amount: number };
  moldAmort: { label: string; amount: number };
  variableOh: { label: string; amount: number };
  fixedOh: { label: string; amount: number };
}

export interface ProductionVariance {
  woId: string;
  item: string;
  type: string;
  standard: number;
  actual: number;
  rootCause: string;
}

export interface NonConformanceReport {
  id: string;
  source: string;
  item: string;
  itemName: string;
  ref: string;
  lot: string;
  qty: number;
  uom: string;
  severity: 'Minor' | 'Major' | 'Critical';
  category: string;
  description: string;
  containment: string;
  status: 'open' | 'contained' | 'rca' | 'disposition' | 'capa_linked' | 'closed' | 'waived';
  discoveredBy: string;
  discoveredDate: string;
  rca: {
    method: string;
    whys: string[];
    rootCause: string;
  };
  disposition: {
    action: string | null;
    qty: number | null;
    approvedBy: string | null;
  };
  capaId: string | null;
  history: Array<{ event: string; time: string }>;
}

export interface CapaRecord {
  id: string;
  source: string;
  sourceRef: string;
  type: 'Corrective' | 'Preventive';
  problem: string;
  owner: string;
  priority: 'Low' | 'Medium' | 'High';
  dueDate: string;
  stage: 'define' | 'contain' | 'rootcause' | 'action' | 'implement' | 'verify' | 'close';
  actions: Array<{
    id: number;
    desc: string;
    owner: string;
    due: string;
    status: 'pending' | 'in_progress' | 'done';
    evidence: string;
  }>;
  effectiveness: {
    method: string;
    date: string;
    result: 'pass' | 'fail' | null;
  };
  history: Array<{ event: string; time: string }>;
}

export interface InspectionPlan {
  id: string;
  name: string;
  type: 'Incoming' | 'In-Process' | 'Final' | 'Lab';
  item: string;
  rev: string;
  status: 'Active' | 'Draft' | 'Obsolete';
  effectiveDate: string;
  lastUsed: string;
  sampling: string;
  params: Array<{
    seq: number;
    parameter: string;
    method: string;
    uom: string;
    target: string;
    min: string;
    max: string;
    critical: boolean;
    instrument: string;
    sampleSize: number | string;
  }>;
}

export interface QualityCoa {
  id: string;
  product: string;
  itemCode: string;
  lot: string;
  mfgDate: string;
  expiryDate: string;
  qty: string;
  source: string;
  status: string;
  approvedBy: string;
  date: string;
  tests: Array<{
    parameter: string;
    spec: string;
    result: string;
    method: string;
  }>;
}

export interface CalibrationEquipment {
  id: string;
  name: string;
  model: string;
  dept: string;
  freq: string;
  last: string;
  next: string;
  status: 'ok' | 'due_soon' | 'overdue';
}

export interface QualityDocument {
  id: string;
  title: string;
  category: 'SOP' | 'Work Instruction' | 'Specification' | 'Form';
  rev: string;
  effectiveDate: string;
  reviewDate: string;
  owner: string;
  status: 'Released' | 'Under Review' | 'Draft';
}

export interface QualityAudit {
  id: string;
  type: 'Internal' | 'Supplier' | 'Layered Process Audit' | 'Customer';
  standard: string;
  scope: string;
  auditor: string;
  date: string;
  status: 'Closed' | 'Scheduled' | 'In Progress';
  findings: number;
  checklist?: Array<{ clause: string; result: string | null }>;
}

export interface LabTest {
  id: string;
  sample: string;
  product: string;
  test: string;
  method: string;
  instrument: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  result?: string;
  passed?: boolean;
  specimens?: string[];
}

// Subcontracting, Assets & Quality Types
export interface FixedAsset {
  id?: string;
  code?: string;
  tag?: string;
  name: string;
  category: string;
  purchaseDate: string;
  purchaseValue?: number;
  cost?: number;
  accumDep?: number;
  bookValue?: number;
  method?: string;
  lifeYears?: number;
  depreciationRate?: number;
  location: string;
  custodian?: string;
  status: 'in_use' | 'under_maintenance' | 'disposed' | 'active';
}

export interface SubcontractJob {
  id: string;
  item: string;
  subcontractor: string;
  process: string;
  qtySent: number;
  qtyReceived: number;
  uom: string;
  status: 'sent' | 'in_process' | 'received' | 'closed';
  sentDate: string;
  expectedDate: string;
  history: Array<{ event: string; time: string }>;
}

// ==========================================
// MEP (Mechanical, Electrical, Plumbing & Utilities) Module Types
// ==========================================

export type MepCategory = 'Mechanical' | 'Electrical' | 'Plumbing' | 'HVAC & Cleanroom';
export type MepEquipmentStatus = 'Running' | 'Standby' | 'Warning' | 'Tripped' | 'Maintenance';

export interface MepMetric {
  label: string;
  value: number | string;
  uom: string;
  status: 'normal' | 'warn' | 'crit';
  target?: string;
}

export interface MepEquipment {
  id: string;
  name: string;
  category: MepCategory;
  subSystem: string;
  location: string;
  status: MepEquipmentStatus;
  capacity: string;
  currentLoadPct: number;
  powerRatingKw: number;
  metrics: Record<string, MepMetric>;
  healthScore: number;
  lastPmDate: string;
  nextPmDue: string;
  runningHours: number;
  efficiency: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  coolingWaterSupplyTemp?: number;
  coolingWaterReturnTemp?: number;
  pressureBar?: number;
  flowRateM3h?: number;
  powerKw?: number;
  currentAmps?: number;
  powerFactor?: number;
}

export interface MepAlarm {
  id: string;
  equipmentId: string;
  equipmentName: string;
  category: MepCategory;
  severity: 'Critical' | 'Major' | 'Minor' | 'Warning';
  title: string;
  desc: string;
  timestamp: string;
  status: 'Active' | 'Acknowledged' | 'Resolved';
  actionRequired: string;
  acknowledgedBy?: string;
}

export interface MepEnergyReading {
  meterId: string;
  name: string;
  zone: string;
  voltageL1L2L3: [number, number, number];
  currentL1L2L3: [number, number, number];
  activePowerKw: number;
  apparentPowerKva: number;
  powerFactor: number;
  frequencyHz: number;
  thdCurrentPct: number;
  todayKwh: number;
  monthKwh: number;
  peakDemandKva: number;
  costEstToday: number;
  status: 'normal' | 'peak_alert' | 'pf_penalty_risk';
}

export interface MepUtilityReading {
  id: string;
  type: 'Chilled Water' | 'Cooling Tower Water' | 'Compressed Air' | 'RO Water' | 'Soft Water' | 'ETP Effluent' | 'Nitrogen / Vacuum';
  flowRate: number;
  flowUom: string;
  pressure: number;
  pressureUom: string;
  temperature: number;
  tempUom: string;
  ph?: number;
  tdsPpm?: number;
  hardnessPpm?: number;
  dewPointC?: number;
  todayTotal: number;
  status: 'Normal' | 'Advisory' | 'Critical';
}

export interface MepWorkOrderTask {
  id: number;
  desc: string;
  done: boolean;
  checkedBy?: string;
}

export interface MepWorkOrderPart {
  partCode: string;
  partName: string;
  qty: number;
  uom: string;
  issued: boolean;
}

export interface MepWorkOrder {
  id: string;
  title: string;
  equipmentId: string;
  equipmentName: string;
  category: MepCategory;
  type: 'Preventative (PM)' | 'Breakdown' | 'Calibration' | 'Overhaul' | 'Audit Finding';
  priority: 'Emergency' | 'High' | 'Medium' | 'Low';
  assignedTo: string;
  status: 'Draft' | 'Assigned' | 'In Progress' | 'Pending Parts' | 'Completed' | 'Signed Off';
  dueDate: string;
  scheduledDate: string;
  estimatedHours: number;
  actualHours?: number;
  tasks: MepWorkOrderTask[];
  partsRequired: MepWorkOrderPart[];
  permitRequired: boolean;
  permitType?: 'LOTO (Lockout/Tagout)' | 'Hot Work' | 'Confined Space' | 'Electrical Safety';
  rootCause?: string;
  completionNotes?: string;
  closedBy?: string;
}

export interface MepCleanroomZone {
  id: string;
  name: string;
  isoClass: string;
  tempC: number;
  tempTarget: string;
  rhPct: number;
  rhTarget: string;
  diffPressurePa: number;
  dpTarget: string;
  airChangesPerHour: number;
  particles05um: number;
  hepaFilterStatus: 'Good' | 'Replace Soon' | 'Clogged';
  status: 'Normal' | 'Warning' | 'Alert';
}

// ==========================================
// HR & MANUFACTURING WORKFORCE MODULE TYPES
// ==========================================

export type HrEmployeeStatus =
  | 'Active'
  | 'Probation'
  | 'Contract'
  | 'Trainee'
  | 'Apprenticeship'
  | 'On Notice'
  | 'Suspended'
  | 'Resigned'
  | 'Terminated'
  | 'Retired'
  | 'Inactive';

export type HrEmployeeType = 'Permanent' | 'Contract' | 'Temporary' | 'Apprentice' | 'Intern' | 'Trainee';

export type HrAttendanceStatus =
  | 'Present'
  | 'Absent'
  | 'Late'
  | 'Half Day'
  | 'On Leave'
  | 'Holiday'
  | 'Missing Punch'
  | 'On Duty'
  | 'Training'
  | 'Suspended'
  | 'Work From Home';

export type HrLeaveType =
  | 'Casual Leave'
  | 'Sick Leave'
  | 'Earned Leave / Privilege Leave'
  | 'Maternity Leave'
  | 'Paternity Leave'
  | 'Bereavement Leave'
  | 'Compensatory Off'
  | 'Leave Without Pay'
  | 'Medical Leave'
  | 'Special Leave';

export type HrLeaveStatus = 'Draft' | 'Submitted' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Cancelled' | 'Completed';

export type HrOvertimeType = 'Pre-shift' | 'Post-shift' | 'Holiday' | 'Emergency';
export type HrOvertimeStatus = 'Draft' | 'Submitted' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Sent to Payroll' | 'Closed';

export type HrTrainingStatus = 'Assigned' | 'In Progress' | 'Completed' | 'Failed' | 'Overdue' | 'Expired' | 'Renewal Required';
export type HrCertificationStatus = 'Valid' | 'Expiring Soon' | 'Expired' | 'Revoked' | 'Renewal Pending';

export type HrSkillLevel = 'Trainee' | 'Basic' | 'Intermediate' | 'Advanced' | 'Expert / Trainer';

export type HrIncidentType =
  | 'Injury'
  | 'Near miss'
  | 'Machine accident'
  | 'Chemical spill'
  | 'Fire hazard'
  | 'Slip/trip/fall'
  | 'PPE violation'
  | 'Unsafe condition'
  | 'Property damage'
  | 'Environmental incident';

export type HrIncidentSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type HrIncidentStatus = 'Reported' | 'Under Investigation' | 'Action Planned' | 'In Progress' | 'Closed' | 'Reopened';

export type HrPpeStatus = 'Issued' | 'In Use' | 'Damaged' | 'Returned' | 'Expired' | 'Replacement Due' | 'Lost';
export type HrPayrollStatus = 'Draft' | 'Ready for Review' | 'Approved' | 'Locked' | 'Sent to Finance' | 'Completed';
export type HrComplianceStatus = 'Valid' | 'Expiring Soon' | 'Expired' | 'Missing' | 'Under Review';

export type HrRole =
  | 'Admin'
  | 'HR Manager'
  | 'HR Executive'
  | 'Payroll Officer'
  | 'Plant Manager'
  | 'Department Supervisor'
  | 'Safety Officer'
  | 'Employee'
  | 'Auditor';

export interface HrDepartment {
  code: string;
  name: string;
  parentDept?: string;
  headName: string;
  costCenter: string;
  plant: string;
  headcount: number;
  openPositions: number;
  status: 'Active' | 'Inactive';
  description: string;
}

export interface HrDesignation {
  code: string;
  name: string;
  department: string;
  grade: string;
  reportingDesignation: string;
  skillRequirements: string[];
  certificationRequirements: string[];
  status: 'Active' | 'Inactive';
}

export interface HrEmployee {
  id: string; // EMP code e.g. EMP-101
  photo?: string;
  firstName: string;
  lastName: string;
  gender: 'Male' | 'Female' | 'Other';
  dob: string;
  bloodGroup: string;
  department: string;
  designation: string;
  employeeType: HrEmployeeType;
  status: HrEmployeeStatus;
  plant: string;
  shift: string; // 'Shift A' | 'Shift B' | 'Shift C' | 'General Shift' | 'Night Shift'
  supervisor: string;
  mobile: string;
  email: string;
  nationalIdMasked: string;
  bankAccountMasked: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  address: string;
  joiningDate: string;
  confirmationDate?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  contractorCompany?: string;
  noticePeriodDays: number;
  grade: string;
  costCenter: string;
  medicalNotes?: string;
  skills: {
    skillId: string;
    skillName: string;
    level: HrSkillLevel;
    validUntil: string;
    assessedBy: string;
  }[];
  certifications: {
    certId: string;
    name: string;
    issueDate: string;
    expiryDate: string;
    certNumber: string;
    status: HrCertificationStatus;
  }[];
  assignedTrainings: {
    trainingId: string;
    name: string;
    assignedDate: string;
    dueDate: string;
    status: HrTrainingStatus;
    score?: number;
  }[];
  issuedPpe: {
    issueId: string;
    ppeName: string;
    size: string;
    issueDate: string;
    replacementDueDate: string;
    status: HrPpeStatus;
  }[];
  leaveBalances: {
    casual: number;
    sick: number;
    earned: number;
    compOff: number;
  };
}

export interface HrAttendanceRecord {
  id: string;
  date: string;
  employeeId: string;
  employeeName: string;
  department: string;
  shift: string;
  scheduledIn: string;
  scheduledOut: string;
  checkIn: string;
  checkOut: string;
  totalHours: number;
  overtimeHours: number;
  lateMinutes: number;
  earlyExitMinutes: number;
  status: HrAttendanceStatus;
  exception?: string;
  deviceSource: 'Biometric Face-01' | 'Fingerprint-Gate-A' | 'Turnstile-Main' | 'Manual Correction';
  supervisorApproved?: boolean;
}

export interface HrShiftMaster {
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  breakDurationMins: number;
  gracePeriodMins: number;
  overtimeEligible: boolean;
  nightShiftAllowance: boolean;
  shiftAllowanceAmount: number;
  status: 'Active' | 'Inactive';
}

export interface HrShiftRosterCell {
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  date: string;
  shiftCode: string;
  lineOrMachine?: string;
  isWeeklyOff: boolean;
  status: 'Scheduled' | 'Confirmed' | 'Swapped' | 'Absent';
}

export interface HrLeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  leaveType: HrLeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  contactDuringLeave: string;
  handoverEmployee?: string;
  status: HrLeaveStatus;
  supervisorApprover: string;
  shiftImpactAlert?: string;
  replacementAssigned?: string;
  appliedDate: string;
}

export interface HrOvertimeRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string;
  shift: string;
  otType: HrOvertimeType;
  fromTime: string;
  toTime: string;
  hours: number;
  workOrderRef?: string;
  machineRef?: string;
  reason: string;
  supervisor: string;
  status: HrOvertimeStatus;
  laborCostEstimate: number;
}

export interface HrTrainingMaster {
  id: string;
  name: string;
  type: 'Safety' | 'Machine Operation' | 'Mold Handling' | 'Quality' | 'Chemical MSDS' | 'Forklift' | 'ISO/IATF' | 'Induction';
  department: string;
  validityMonths: number;
  isMandatory: boolean;
  trainer: string;
  passingScore: number;
  certificationIssued: boolean;
  active: boolean;
  description: string;
}

export interface HrSkillMatrixItem {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  skillGroup: string;
  machineOrProcess: string;
  level: HrSkillLevel;
  lastAssessmentDate: string;
  assessor: string;
  validUntil: string;
  certificationRequired: boolean;
  certified: boolean;
}

export interface HrSafetyIncident {
  id: string;
  date?: string;
  incidentDate?: string;
  time?: string;
  employeeId: string;
  employeeName: string;
  department?: string;
  locationArea?: string;
  location?: string;
  machineInvolved?: string;
  incidentType: HrIncidentType | string;
  severity: HrIncidentSeverity | string;
  title?: string;
  description: string;
  immediateAction?: string;
  witnesses?: string;
  medicalTreatmentRequired?: boolean;
  lostWorkdays?: number;
  reportedBy?: string;
  investigator?: string;
  rootCause5Why?: string[];
  correctiveAction?: string;
  preventiveAction?: string;
  capaRef?: string;
  status: HrIncidentStatus | string;
}

export interface HrPpeMasterItem {
  code: string;
  name: string;
  category: 'Footwear' | 'Head Protection' | 'Hand Protection' | 'Eye & Face' | 'Hearing' | 'Respiratory' | 'Apparel';
  sizes: string[];
  validityDays: number;
  stockAvailable: number;
  minStockLevel: number;
  costPerUnit: number;
  supplier: string;
}

export interface HrPpeIssueRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  ppeCode: string;
  ppeName: string;
  size: string;
  issueDate: string;
  condition: 'Brand New' | 'Good' | 'Fair';
  replacementDueDate: string;
  returnDate?: string;
  status: HrPpeStatus;
  issuedBy: string;
}

export interface HrPayrollInputRow {
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  payDays?: number;
  payableDays?: number;
  totalDaysInMonth?: number;
  presentDays?: number;
  absentDays?: number;
  paidLeaveDays?: number;
  lossOfPayDays?: number;
  regularHours?: number;
  overtimeHours?: number;
  nightShiftHours?: number;
  shiftAllowance: number;
  basicSalary?: number;
  hra?: number;
  overtimePay?: number;
  providentFund?: number;
  esi?: number;
  professionalTax?: number;
  grossSalary?: number;
  netSalary?: number;
  totalDeductions?: number;
  incentives?: number;
  bonus?: number;
  deductions?: number;
  advances?: number;
  grossPayableEst?: number;
  status: HrPayrollStatus | string;
  bankAccountValid: boolean;
}

export interface HrLaborAllocationLine {
  lineId: string;
  lineName: string;
  processType: 'Injection Molding' | 'Extrusion' | 'Blow Molding' | 'Assembly & Packing' | 'Tool Room';
  shift: string;
  requiredOperators: number;
  assignedOperators: string[];
  certifiedCount: number;
  shortageCount: number;
  workOrderRef: string;
  partName: string;
  targetHourlyRate: number;
  status: 'Full Coverage' | 'Understaffed' | 'Critical Shortage';
}

export interface HrContractAgency {
  id: string;
  agencyName: string;
  contactPerson: string;
  phone: string;
  licenseNumber: string;
  licenseValidUntil: string;
  activeWorkers: number;
  pfCode: string;
  esiCode: string;
  complianceScore: number;
}

export interface HrComplianceDoc {
  id: string;
  employeeId?: string;
  employeeName?: string;
  category: 'Labor License' | 'Factory Act' | 'Statutory Filing' | 'Medical Fitness' | 'ID Proof' | 'Contract' | 'Safety Audit' | string;
  docName?: string;
  title?: string;
  act?: string;
  frequency?: string;
  lastFilingDate?: string;
  nextDueDate?: string;
  docNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  status: HrComplianceStatus | string;
  uploadedBy?: string;
  confidential?: boolean;
}

export interface HrAuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  module: string;
  details: string;
  ipAddress: string;
}

// Type Aliases
export type Item = ItemMaster;
export type Account = GLAccount;
export type CapaReport = CapaRecord;
export type CertificateOfAnalysis = QualityCoa;
export type Quotation = SalesQuotation;
export type ReturnMerchandise = SalesRma;
export type SubcontractOrder = SubcontractJob;
export type Invoice = CustomerInvoice;
export type HrPpeInventoryItem = HrPpeMasterItem;
export type HrTrainingProgram = HrTrainingMaster;
export type HrSkillMatrixRecord = HrSkillMatrixItem;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  roleType: 'admin' | 'production' | 'quality' | 'warehouse' | 'finance' | 'operator' | 'hr';
  department: string;
  plantId: string;
  plantName: string;
  shift: string;
  badgeId: string;
  pin: string;
  avatarColor: string;
  initials: string;
  permissions: string[];
}


