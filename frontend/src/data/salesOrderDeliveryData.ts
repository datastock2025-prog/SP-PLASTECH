import {
  MonthlyPlanOrder,
  OrderRelationship,
  PlasticSalesOrder,
  FgBatchStock,
  FgPickList,
  DeliveryNoteChallan,
  EInvoiceRecord,
  EWayBillRecord,
  ConsolidatedEwbRecord,
  GatePassRecord,
  ComplianceExceptionRecord,
} from '../types/salesOrderDeliveryTypes';

// Initial Monthly Plan Orders (Live data only)
export const INITIAL_MONTHLY_PLANS: MonthlyPlanOrder[] = [];

// Order Relationships (Manual Mapping between Daily Orders and Monthly Plans)
export const INITIAL_ORDER_RELATIONSHIPS: OrderRelationship[] = [];

// Helper function to map a Monthly Plan Order to a PlasticSalesOrder in SO Register with sequential SO-XXXX number
export const mapMonthlyPlanToSalesOrder = (plan: MonthlyPlanOrder, customSoId?: string): PlasticSalesOrder => {
  const isPimpri = plan.plant?.includes('Pimpri') || plan.plant?.includes('Plant 1');
  const city = isPimpri ? 'Pune' : 'Chakan';
  const deliveredVal = Math.round(((plan.totalDailySuppliedQty || 0) / (plan.totalPlannedQty || 1)) * (plan.totalPlannedValue || 0) * 1.18);
  const remainingVal = Math.round(((plan.remainingPlanQty || 0) / (plan.totalPlannedQty || 1)) * (plan.totalPlannedValue || 0) * 1.18);
  const isFullyDelivered = (plan.remainingPlanQty || 0) <= 0 && (plan.totalDailySuppliedQty || 0) >= (plan.totalPlannedQty || 1);

  const planNum = plan.id ? plan.id.split('-').pop() || '1' : '1';
  const numericPart = parseInt(planNum, 10) || 1;
  const generatedId = customSoId || `SO-${5004 + numericPart}`;

  // Find customer PO reference if present in line items or generate clean PO reference
  const firstItemCode = plan.items && plan.items[0]?.customerItemCode ? plan.items[0].customerItemCode : '';
  const poPrefix = firstItemCode ? firstItemCode.split('-')[0] : (plan.customer ? plan.customer.split(' ')[0].toUpperCase() : 'CUST');
  const customerPoNumber = `PO-${poPrefix}-2026-90${numericPart}`;

  return {
    id: generatedId,
    orderType: 'Monthly Plan Order',
    customer: plan.customer || 'Customer',
    customerGstin: plan.customerGstin || '27AAACG0943A1ZX',
    customerPoNumber,
    customerPoDate: plan.createdDate || new Date().toISOString().slice(0, 10),
    orderDate: plan.createdDate || new Date().toISOString().slice(0, 10),
    requiredDeliveryDate: plan.createdDate ? `${plan.createdDate.slice(0, 7)}-30` : new Date().toISOString().slice(0, 10),
    monthlyPlanPeriod: plan.monthPeriod || 'Current Month',
    monthlyPlanRef: plan.id,
    linkType: 'Manually Mapped',
    salesperson: 'Central S&OP Demand Planning',
    currency: 'INR',
    paymentTerms: 'Net 30 Days',
    priceList: 'Central Price Master',
    plant: plan.plant || 'Plant 1 - Pimpri Auto-Hub',
    fgStore: plan.fgStore || 'FG-Automotive Cell',
    billingAddress: {
      line1: 'Corporate Headquarters / Central Works',
      city,
      state: 'Maharashtra',
      pincode: '411018',
      gstin: plan.customerGstin || '27AAACG0943A1ZX',
      placeOfSupply: '27-Maharashtra',
    },
    shippingAddress: {
      line1: 'Central Receiving Bay 1',
      city,
      state: 'Maharashtra',
      pincode: '411018',
      gstin: plan.customerGstin || '27AAACG0943A1ZX',
      dispatchPoint: `${plan.plant || 'Plant 1'} Dispatch Dock`,
    },
    status: isFullyDelivered ? 'Delivered' : 'Confirmed',
    creditStatus: 'Approved',
    creditLimit: 15000000,
    currentExposure: 0,
    availableCredit: 15000000,
    deliveryStatus: (plan.totalDailySuppliedQty || 0) > 0 ? (isFullyDelivered ? 'Fully Delivered' : 'Partially Delivered') : 'Not Started',
    invoiceStatus: (plan.totalDailySuppliedQty || 0) > 0 ? (isFullyDelivered ? 'Fully Invoiced' : 'Partially Invoiced') : 'Uninvoiced',
    eInvoiceStatus: 'Not Required',
    eWayBillStatus: 'Not Required',
    taxableAmount: plan.totalPlannedValue || 0,
    cgstTotal: Math.round((plan.totalPlannedValue || 0) * 0.09),
    sgstTotal: Math.round((plan.totalPlannedValue || 0) * 0.09),
    igstTotal: 0,
    cessTotal: 0,
    freightAmount: 0,
    packingAmount: 0,
    totalOrderValue: Math.round((plan.totalPlannedValue || 0) * 1.18),
    deliveredValue: deliveredVal,
    invoicedValue: deliveredVal,
    remainingValue: remainingVal,
    transportMode: 'Road',
    transporterName: 'VRL Logistics Ltd',
    transporterGstin: '29AABCV1234F1Z1',
    incoterms: 'DAP - Delivered At Place',
    deliveryTerms: 'Monthly Schedule JIT Deliveries',
    packagingInstructions: 'Standard corrugated master cartons',
    eInvoiceRequired: true,
    eWayBillRequired: true,
    deliveryChallanAllowed: true,
    coaRequired: true,
    msdsRequired: false,
    batchTraceabilityRequired: true,
    lines: (plan.items || []).map((it, idx) => ({
      lineNumber: idx + 1,
      itemCode: it.itemCode,
      itemName: it.itemName,
      customerItemCode: it.customerItemCode,
      hsn: it.hsn || '39269099',
      orderedQty: it.plannedQty,
      allocatedQty: it.deliveredQty || 0,
      pickedQty: it.deliveredQty || 0,
      packedQty: it.deliveredQty || 0,
      deliveredQty: it.deliveredQty || 0,
      invoicedQty: it.invoicedQty || 0,
      remainingQty: it.remainingQty !== undefined ? it.remainingQty : Math.max(0, it.plannedQty - (it.deliveredQty || 0)),
      uom: it.uom || 'PCS',
      plant: it.plant || plan.plant || 'Plant 1 - Pimpri Auto-Hub',
      fgStore: it.fgStore || plan.fgStore || 'FG-Automotive Cell',
      requestedDeliveryDate: plan.createdDate ? `${plan.createdDate.slice(0, 7)}-30` : new Date().toISOString().slice(0, 10),
      availableStock: 10000,
      reservedStock: 0,
      shortageQty: 0,
      status: (it.remainingQty || 0) <= 0 ? 'Dispatched' : 'In Stock',
      unitPrice: it.rate || 50,
      discountPct: 0,
      taxableValue: (it.plannedQty || 0) * (it.rate || 50),
      gstRatePct: 18,
      cgstAmount: Math.round((it.plannedQty || 0) * (it.rate || 50) * 0.09),
      sgstAmount: Math.round((it.plannedQty || 0) * (it.rate || 50) * 0.09),
      igstAmount: 0,
      cessAmount: 0,
      totalValue: Math.round((it.plannedQty || 0) * (it.rate || 50) * 1.18),
    })),
    auditTrail: plan.auditTrail || [
      { action: 'Monthly Master Plan Committed', user: 'Central S&OP Demand Planning', timestamp: new Date().toISOString().slice(0, 16).replace('T', ' ') }
    ],
  };
};

export const getNextSalesOrderNumber = (existingOrders: PlasticSalesOrder[]): string => {
  let maxNum = 5000;
  (existingOrders || []).forEach((o) => {
    const match = o.id.match(/\d+/g);
    if (match) {
      const n = parseInt(match[match.length - 1], 10);
      if (n > maxNum) maxNum = n;
    }
  });
  return `SO-${maxNum + 1}`;
};

// Sales Orders (Live data only)
export const INITIAL_PLASTIC_SALES_ORDERS: PlasticSalesOrder[] = [];

// FG Batches in Plant Stores (FEFO & FIFO allocation data)
export const INITIAL_FG_BATCHES: FgBatchStock[] = [
  {
    batchNumber: 'B-2026-ABS-09',
    itemCode: 'FG-AUTO-012',
    itemName: 'ABS Dashboard Trim Bezel (Matte Black)',
    plant: 'Plant 1 - Pimpri Auto-Hub',
    fgStore: 'FG-Automotive Cell',
    locationCode: 'LOC-A1-04',
    binCode: 'BIN-08',
    availableQty: 5000,
    reservedQty: 0,
    pickableQty: 5000,
    mfgDate: '2026-08-10',
    expiryDate: '2027-08-09',
    daysToExpiry: 331,
    qualityStatus: 'Approved',
    coaStatus: 'Available',
    coaNumber: 'COA-2026-0891',
    fefoRank: 1,
    fifoRank: 1,
    polymerLotNo: 'LOT-LG-ABS-881',
  },
  {
    batchNumber: 'B-2026-ABS-12',
    itemCode: 'FG-AUTO-012',
    itemName: 'ABS Dashboard Trim Bezel (Matte Black)',
    plant: 'Plant 1 - Pimpri Auto-Hub',
    fgStore: 'FG-Automotive Cell',
    locationCode: 'LOC-A1-06',
    binCode: 'BIN-12',
    availableQty: 3200,
    reservedQty: 0,
    pickableQty: 3200,
    mfgDate: '2026-09-02',
    expiryDate: '2027-09-01',
    daysToExpiry: 354,
    qualityStatus: 'Approved',
    coaStatus: 'Available',
    coaNumber: 'COA-2026-0944',
    fefoRank: 2,
    fifoRank: 2,
    polymerLotNo: 'LOT-LG-ABS-904',
  },
  {
    batchNumber: 'B-2026-PP-45A',
    itemCode: 'FG-AUTO-045',
    itemName: 'PP Air Duct Housing - Front Left',
    plant: 'Plant 1 - Pimpri Auto-Hub',
    fgStore: 'FG-Automotive Cell',
    locationCode: 'LOC-B2-01',
    binCode: 'BIN-02',
    availableQty: 3500,
    reservedQty: 0,
    pickableQty: 3500,
    mfgDate: '2026-08-18',
    expiryDate: '2027-08-17',
    daysToExpiry: 339,
    qualityStatus: 'Approved',
    coaStatus: 'Available',
    coaNumber: 'COA-2026-0822',
    fefoRank: 1,
    fifoRank: 1,
    polymerLotNo: 'LOT-RPL-110-41',
  },
  {
    batchNumber: 'B-2026-PP-45B',
    itemCode: 'FG-AUTO-045',
    itemName: 'PP Air Duct Housing - Front Left',
    plant: 'Plant 1 - Pimpri Auto-Hub',
    fgStore: 'FG-Automotive Cell',
    locationCode: 'LOC-B2-04',
    binCode: 'BIN-05',
    availableQty: 1100,
    reservedQty: 0,
    pickableQty: 1100,
    mfgDate: '2026-09-05',
    expiryDate: '2027-09-04',
    daysToExpiry: 357,
    qualityStatus: 'Approved',
    coaStatus: 'Available',
    coaNumber: 'COA-2026-0951',
    fefoRank: 2,
    fifoRank: 2,
    polymerLotNo: 'LOT-RPL-110-55',
  },
  {
    batchNumber: 'B-2026-CAP-281',
    itemCode: 'FG-FLIP-28',
    itemName: '28mm PP Flip-Top Dispenser Cap (Parachute Blue)',
    plant: 'Plant 2 - Chakan Packaging Plant',
    fgStore: 'FG-Main Warehouse',
    locationCode: 'LOC-C1-11',
    binCode: 'BIN-CAP-01',
    availableQty: 20000,
    reservedQty: 0,
    pickableQty: 20000,
    mfgDate: '2026-08-25',
    expiryDate: '2028-08-24',
    daysToExpiry: 711,
    qualityStatus: 'Approved',
    coaStatus: 'Available',
    coaNumber: 'COA-2026-0870',
    fefoRank: 1,
    fifoRank: 1,
    polymerLotNo: 'LOT-IP-COP-772',
  },
  {
    batchNumber: 'B-2026-MOTO-88',
    itemCode: 'FG-MOTO-088',
    itemName: 'Nylon-6 Reinforced Rear Mudguard Cowl',
    plant: 'Plant 1 - Pimpri Auto-Hub',
    fgStore: 'FG-Automotive Cell',
    locationCode: 'LOC-D3-09',
    binCode: 'BIN-44',
    availableQty: 9500,
    reservedQty: 0,
    pickableQty: 9500,
    mfgDate: '2026-09-01',
    expiryDate: '2028-08-31',
    daysToExpiry: 718,
    qualityStatus: 'Approved',
    coaStatus: 'Available',
    coaNumber: 'COA-2026-0919',
    fefoRank: 1,
    fifoRank: 1,
    polymerLotNo: 'LOT-BASF-PA6-11',
  },
  {
    batchNumber: 'B-2026-PBT-04',
    itemCode: 'FG-CASING-200',
    itemName: 'Polycarbonate Electric Meter Base Casing',
    plant: 'Plant 1 - Pimpri Auto-Hub',
    fgStore: 'FG-Export Hub',
    locationCode: 'LOC-E1-01',
    binCode: 'BIN-04',
    availableQty: 6500,
    reservedQty: 0,
    pickableQty: 6500,
    mfgDate: '2026-08-20',
    expiryDate: '2028-08-20',
    daysToExpiry: 700,
    qualityStatus: 'Approved',
    coaStatus: 'Available',
    coaNumber: 'COA-2026-0960',
    fefoRank: 1,
    fifoRank: 1,
    polymerLotNo: 'LOT-SABIC-PBT-01',
  },
  {
    batchNumber: 'B-2026-ARM-01',
    itemCode: 'FG-708027010001',
    itemName: 'ARMPAD INSERT - 50MM(HFRL)',
    plant: 'Plant 1 - Pimpri Auto-Hub',
    fgStore: 'FG-Automotive Cell',
    locationCode: 'LOC-A1-04',
    binCode: 'BAY-C-04-RACK',
    availableQty: 744,
    reservedQty: 0,
    pickableQty: 744,
    mfgDate: '2026-09-01',
    expiryDate: '2028-09-01',
    daysToExpiry: 710,
    qualityStatus: 'Approved',
    coaStatus: 'Available',
    coaNumber: 'COA-2026-8750',
    fefoRank: 1,
    fifoRank: 1,
    polymerLotNo: 'LOT-PP-HFRL-99',
  },
  {
    batchNumber: 'B-2026-SAI-01',
    itemCode: '1208C0030',
    itemName: 'sai cover',
    plant: 'Plant 1 - Pimpri Auto-Hub',
    fgStore: 'FG-Automotive Cell',
    locationCode: 'LOC-A1-04',
    binCode: 'BAY-C-04-RACK',
    availableQty: 4800,
    reservedQty: 0,
    pickableQty: 4800,
    mfgDate: '2026-09-01',
    expiryDate: '2028-09-01',
    daysToExpiry: 710,
    qualityStatus: 'Approved',
    coaStatus: 'Available',
    coaNumber: 'COA-2026-8751',
    fefoRank: 1,
    fifoRank: 1,
    polymerLotNo: 'LOT-PP-EPDM-01',
  },
];

// Delivery Notes / Challans (Live data only)
export const INITIAL_DELIVERY_NOTES: DeliveryNoteChallan[] = [];

// Pick Lists (Live data only)
export const INITIAL_PICK_LISTS: FgPickList[] = [];

// E-Invoices (Live data only)
export const INITIAL_E_INVOICES: EInvoiceRecord[] = [];

// E-Way Bills (Live data only)
export const INITIAL_E_WAY_BILLS: EWayBillRecord[] = [];

// Consolidated E-Way Bills (Live data only)
export const INITIAL_CONSOLIDATED_EWBS: ConsolidatedEwbRecord[] = [];

// Gate Passes (Live data only)
export const INITIAL_GATE_PASSES: GatePassRecord[] = [];

// Compliance Exceptions (Live data only)
export const INITIAL_COMPLIANCE_EXCEPTIONS: ComplianceExceptionRecord[] = [];

