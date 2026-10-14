import {
  SupplierMaster,
  PurchaseRequisition,
  RequestForQuotation,
  QuotationComparisonSession,
  ExtendedPurchaseOrder,
  GoodsReceiptNote,
  SupplierInvoiceRecord,
  SupplierReturnRecord,
  SupplierContractRecord,
  MrpPurchaseSuggestion,
  SupplierRiskItem,
  SupplierPriceListEntry,
} from '../types/procurement';
import { DOCUMENT_LIVE_SUPPLIERS_CATALOG } from './liveSuppliersCatalog';
import { DOCUMENT_SUPPLIER_PRICE_LISTS } from './liveSupplierPriceLists';

// ----------------------------------------------------
// 1. LIVE SUPPLIERS MASTER DATA (Document RPTM0501T01 - 411 Live Records)
// ----------------------------------------------------
export const INITIAL_PROCUREMENT_SUPPLIERS: SupplierMaster[] = DOCUMENT_LIVE_SUPPLIERS_CATALOG;

// ----------------------------------------------------
// 2. PURCHASE REQUISITIONS (PR) DATA
// ----------------------------------------------------
export const addPurchaseRequisition = (newPr: PurchaseRequisition) => {
  INITIAL_PURCHASE_REQUISITIONS.unshift(newPr);
  try {
    const existing = JSON.parse(localStorage.getItem('plastix_purchase_requisitions') || '[]');
    localStorage.setItem('reboot_erp_purchase_requisitions', JSON.stringify([newPr, ...existing.filter((p: any) => p.id !== newPr.id)]));
    localStorage.setItem('plastix_purchase_requisitions', JSON.stringify([newPr, ...existing.filter((p: any) => p.id !== newPr.id)]));
  } catch (e) {
    // ignore
  }
};

export const getStoredPRs = (): PurchaseRequisition[] => {
  try {
    const saved = localStorage.getItem('reboot_erp_purchase_requisitions') || localStorage.getItem('plastix_purchase_requisitions');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return [];
};

export const INITIAL_PURCHASE_REQUISITIONS: PurchaseRequisition[] = [
  ...getStoredPRs(),
  {
    id: 'PR-2026-09-U1',
    prNumber: 'PR-2026-09-U1',
    requestDate: '2026-09-01',
    requestedBy: 'Sales & Operations Planning',
    department: 'Sales & Demand Planning',
    plantWarehouse: 'Plant 1 - Pimpri Auto-Hub',
    requiredDate: '2026-09-15',
    priority: 'High',
    source: 'Monthly Plan Order',
    currency: 'INR (₹)',
    estimatedTotal: 5040000,
    budgetAllocated: 6000000,
    budgetRemaining: 960000,
    budgetExceeded: false,
    status: 'pending_approval',
    approvalStatus: 'pending',
    currentApprover: 'K. Ramanathan (Procurement VP)',
    justification: 'Plant 1 demand reservation for Unit Plan PLN-2026-09-U1 (Tata Motors & Mahindra SKUs).',
    notes: 'Unit Plan PLN-2026-09-U1. Ready for Procurement BOM Explosion & Vendor allocation.',
    lines: [
      {
        id: 'PRL-U1-01',
        lineNo: 1,
        itemCode: 'SKU-INJ-001',
        itemName: 'Automotive Bumper Bracket Front LH',
        itemCategory: 'Injection Molded Auto Parts',
        description: 'Material: PP Copolymer 20% Talc Filled, Color: Black',
        quantity: 75000,
        uom: 'PCS',
        requiredDate: '2026-09-15',
        estimatedUnitPrice: 32.0,
        estimatedTotal: 2400000,
        salesOrderRef: 'PLN-2026-09-U1',
        status: 'pending',
      },
      {
        id: 'PRL-U1-02',
        lineNo: 2,
        itemCode: 'SKU-INJ-002',
        itemName: 'Automotive Bumper Bracket Front RH',
        itemCategory: 'Injection Molded Auto Parts',
        description: 'Material: PP Copolymer 20% Talc Filled, Color: Black',
        quantity: 50000,
        uom: 'PCS',
        requiredDate: '2026-09-15',
        estimatedUnitPrice: 32.0,
        estimatedTotal: 1600000,
        salesOrderRef: 'PLN-2026-09-U1',
        status: 'pending',
      },
      {
        id: 'PRL-U1-03',
        lineNo: 3,
        itemCode: 'SKU-INJ-003',
        itemName: 'HVAC Air Duct Connector Flange',
        itemCategory: 'Automotive HVAC',
        description: 'Material: PA66 Heat Stabilized 30% Glass Filled',
        quantity: 35000,
        uom: 'PCS',
        requiredDate: '2026-09-15',
        estimatedUnitPrice: 29.7,
        estimatedTotal: 1040000,
        salesOrderRef: 'PLN-2026-09-U1',
        status: 'pending',
      }
    ],
    approvalHistory: [
      { step: 1, role: 'Sales Planning Head', user: 'Central SCM', action: 'Approved', date: '2026-09-01 10:00 AM', comment: 'Monthly Plan PLN-2026-09-U1 released for Plant 1.' },
      { step: 2, role: 'Plant 1 Operations Head', user: 'Sunil Nair', action: 'Approved', date: '2026-09-01 11:30 AM', comment: 'Plant 1 line capacity confirmed.' },
      { step: 3, role: 'Procurement VP', user: 'K. Ramanathan', action: 'Pending', comment: 'Pending vendor RFQ allocation.' }
    ]
  },
  {
    id: 'PR-2026-09-U2',
    prNumber: 'PR-2026-09-U2',
    requestDate: '2026-09-01',
    requestedBy: 'Sales & Operations Planning',
    department: 'Sales & Demand Planning',
    plantWarehouse: 'Plant 2 - Chakan Assembly',
    requiredDate: '2026-09-18',
    priority: 'High',
    source: 'Monthly Plan Order',
    currency: 'INR (₹)',
    estimatedTotal: 1830000,
    budgetAllocated: 2500000,
    budgetRemaining: 670000,
    budgetExceeded: false,
    status: 'pending_approval',
    approvalStatus: 'pending',
    currentApprover: 'K. Ramanathan (Procurement VP)',
    justification: 'Plant 2 demand reservation for Unit Plan PLN-2026-09-U2 (Bajaj Auto Limited).',
    notes: 'Unit Plan PLN-2026-09-U2. Ready for Procurement BOM Explosion & Vendor allocation.',
    lines: [
      {
        id: 'PRL-U2-01',
        lineNo: 1,
        itemCode: 'SKU-INJ-004',
        itemName: 'Engine Engine Cover Shield Lower',
        itemCategory: 'Under-the-hood Components',
        description: 'Material: PA6 30% Glass Filled, Heat Stabilized',
        quantity: 35000,
        uom: 'PCS',
        requiredDate: '2026-09-18',
        estimatedUnitPrice: 52.28,
        estimatedTotal: 1830000,
        salesOrderRef: 'PLN-2026-09-U2',
        status: 'pending',
      }
    ],
    approvalHistory: [
      { step: 1, role: 'Sales Planning Head', user: 'Central SCM', action: 'Approved', date: '2026-09-01 10:00 AM', comment: 'Monthly Plan PLN-2026-09-U2 released for Plant 2.' },
      { step: 2, role: 'Plant 2 Operations Head', user: 'Rohan Deshmukh', action: 'Approved', date: '2026-09-01 11:45 AM', comment: 'Plant 2 line capacity confirmed.' },
      { step: 3, role: 'Procurement VP', user: 'K. Ramanathan', action: 'Pending', comment: 'Pending vendor RFQ allocation.' }
    ]
  },
  {
    id: 'PR-2026-081',
    prNumber: 'PR-2026-081',
    requestDate: '2026-08-27',
    requestedBy: 'Priya Rao (Warehouse Manager)',
    department: 'Warehouse & Inventory',
    plantWarehouse: 'RM-WH-01 (Main Plant)',
    requiredDate: '2026-09-04',
    priority: 'Urgent',
    source: 'MRP',
    currency: 'INR (₹)',
    estimatedTotal: 942000,
    budgetAllocated: 1500000,
    budgetRemaining: 558000,
    budgetExceeded: false,
    status: 'pending_approval',
    approvalStatus: 'pending',
    currentApprover: 'K. Ramanathan (Procurement VP)',
    justification: 'Safety stock breach triggered on PP Natural Granules. 3 major Work Orders (WO-1188, WO-1192) scheduled next week.',
    notes: 'Platts index price expected to rise +₹1.50/kg next week. Recommend placing contract PO immediately.',
    lines: [
      {
        id: 'PRL-01',
        lineNo: 1,
        itemCode: 'RM-PP-NAT-001',
        itemName: 'PP Natural Granules H110MA',
        itemCategory: 'Polypropylene',
        description: 'MFI 12 g/10min, FDA compliant homopolymer for injection molding container base',
        quantity: 12000,
        uom: 'KG',
        requiredDate: '2026-09-04',
        suggestedSupplierId: 'SUP-S0128',
        suggestedSupplierName: 'RELIANCE INDUSTRIES LIMITED BANGALORE',
        estimatedUnitPrice: 78.5,
        estimatedTotal: 942000,
        workOrderRef: 'WO-1188',
        salesOrderRef: 'SO-5001',
        machineRef: 'IMM-250T-03',
        status: 'pending',
      }
    ],
    approvalHistory: [
      { step: 1, role: 'Warehouse Head', user: 'Priya Rao', action: 'Approved', date: '2026-08-27 09:30 AM', comment: 'Stock verified below reorder point (4,000 KG).' },
      { step: 2, role: 'Plant Manager', user: 'Sunil Nair', action: 'Approved', date: '2026-08-27 11:15 AM', comment: 'Approved for production continuity.' },
      { step: 3, role: 'Procurement VP', user: 'K. Ramanathan', action: 'Pending', comment: 'Under commercial price validation against Platts index.' },
    ]
  },
  {
    id: 'PR-2026-082',
    prNumber: 'PR-2026-082',
    requestDate: '2026-08-26',
    requestedBy: 'Amit Sharma (Production Planner)',
    department: 'Production Operations',
    plantWarehouse: 'RM-WH-02 (Additive Store)',
    requiredDate: '2026-09-08',
    priority: 'High',
    source: 'Production Work Order',
    currency: 'INR (₹)',
    estimatedTotal: 145000,
    budgetAllocated: 300000,
    budgetRemaining: 155000,
    budgetExceeded: false,
    status: 'approved',
    approvalStatus: 'approved',
    currentApprover: 'Completed',
    justification: 'White masterbatch lot needed for export food-container batch batch WO-1192.',
    lines: [
      {
        id: 'PRL-02',
        lineNo: 1,
        itemCode: 'MB-WHT-002',
        itemName: 'White Masterbatch (70% TiO2)',
        itemCategory: 'Masterbatch & Colorants',
        description: 'High opacity, dispersion rating 5/5, food contact approved (FDA 21 CFR)',
        quantity: 900,
        uom: 'KG',
        requiredDate: '2026-09-08',
        suggestedSupplierId: 'SUP-S0009',
        suggestedSupplierName: 'APPL INDUSTRIES LIMITED HSR',
        estimatedUnitPrice: 161.1,
        estimatedTotal: 145000,
        workOrderRef: 'WO-1192',
        status: 'approved',
      }
    ],
    approvalHistory: [
      { step: 1, role: 'Production Planner', user: 'Amit Sharma', action: 'Approved', date: '2026-08-26 08:00 AM' },
      { step: 2, role: 'Procurement Officer', user: 'Vikram Seth', action: 'Approved', date: '2026-08-26 02:40 PM', comment: 'Ready for PO conversion.' },
    ]
  },
  {
    id: 'PR-2026-083',
    prNumber: 'PR-2026-083',
    requestDate: '2026-08-25',
    requestedBy: 'R. Sen (Toolroom Maintenance Eng)',
    department: 'Maintenance & Toolroom',
    plantWarehouse: 'SP-WH-01 (Tooling & Spares)',
    requiredDate: '2026-09-15',
    priority: 'Medium',
    source: 'Maintenance Job',
    currency: 'INR (₹)',
    estimatedTotal: 180000,
    budgetAllocated: 250000,
    budgetRemaining: 70000,
    budgetExceeded: false,
    status: 'converted_rfq',
    approvalStatus: 'approved',
    convertedRfqId: 'RFQ-2026-018',
    justification: 'Replacement core pins and beryllium copper cooling inserts for Mold MLD-1001 500ml container.',
    lines: [
      {
        id: 'PRL-03',
        lineNo: 1,
        itemCode: 'SP-MOLD-PIN-01',
        itemName: 'Core Pin Set H13 Nitrided (4 Pcs)',
        itemCategory: 'Molds & Tooling',
        quantity: 2,
        uom: 'SET',
        requiredDate: '2026-09-15',
        suggestedSupplierName: 'BHANSALI ENGINEERING POLYMERS LIMITED',
        estimatedUnitPrice: 90000,
        estimatedTotal: 180000,
        moldRef: 'MLD-1001',
        status: 'converted',
      }
    ],
    approvalHistory: [
      { step: 1, role: 'Maintenance Head', user: 'R. Sen', action: 'Approved', date: '2026-08-25 10:00 AM' },
      { step: 2, role: 'Plant Head', user: 'Sunil Nair', action: 'Approved', date: '2026-08-25 04:30 PM' },
    ]
  }
];

// ----------------------------------------------------
// 3. REQUEST FOR QUOTATION (RFQ) DATA
// ----------------------------------------------------
export const INITIAL_PROCUREMENT_RFQS: RequestForQuotation[] = [
  {
    id: 'RFQ-2026-018',
    rfqNumber: 'RFQ-2026-018',
    title: 'High-Precision Mold Core Inserts & Ejector Pin Sets (Mold MLD-1001)',
    sourcePrNumber: 'PR-2026-083',
    createdDate: '2026-08-25',
    closingDate: '2026-09-02',
    requiredDeliveryDate: '2026-09-18',
    currency: 'INR (₹)',
    incoterms: 'DAP Factory Gate',
    shippingTerms: 'Road Transport with protective wood crates',
    paymentTerms: 'Net 30 Days after sample inspection',
    owner: 'Vikram Seth (Procurement Officer)',
    status: 'response_received',
    submissionInstructions: 'Submit technical datasheet, steel hardness test cert (HRC 52-54), and dimensional report.',
    lines: [
      {
        lineNo: 1,
        itemCode: 'SP-MOLD-PIN-01',
        itemName: 'Core Pin Set H13 Nitrided (4 Pcs)',
        description: 'Hardened H13 DIN 1.2344, polished Ra 0.2 surface finish for 500ml container core cavity',
        quantity: 2,
        uom: 'SET',
        requiredDate: '2026-09-18',
        targetPrice: 85000,
        historicalPrice: 88000,
        coaRequired: true,
        msdsRequired: false,
      }
    ],
    invitedSuppliers: [
      {
        supplierId: 'SUP-S0017',
        supplierName: 'BHANSALI ENGINEERING POLYMERS LIMITED',
        supplierEmail: 'manoj@precisiontools.example',
        invitedDate: '2026-08-25',
        status: 'Responded',
        responseDate: '2026-08-27',
        quotationRef: 'QT-PREC-9912',
        totalQuoteAmount: 168000,
        leadTimeDays: 14,
        paymentTerms: 'Net 30 Days',
        validUntil: '2026-09-25',
      },
      {
        supplierId: 'SUP-TOOL-08',
        supplierName: 'Shree Sai Tooling Technologies',
        supplierEmail: 'sales@shreesaitools.example',
        invitedDate: '2026-08-25',
        status: 'Responded',
        responseDate: '2026-08-28',
        quotationRef: 'QT-SST-4401',
        totalQuoteAmount: 182000,
        leadTimeDays: 10,
        paymentTerms: '10% Advance, Net 30',
        validUntil: '2026-09-30',
      },
      {
        supplierId: 'SUP-TOOL-09',
        supplierName: 'Apex Toolcraft Components',
        supplierEmail: 'quotes@apextoolcraft.example',
        invitedDate: '2026-08-25',
        status: 'Viewed',
      }
    ],
    responsesCount: 2,
  },
  {
    id: 'RFQ-2026-019',
    rfqNumber: 'RFQ-2026-019',
    title: '5-Ply Heavy Duty Corrugated Export Cartons (Annual Sourcing Contract)',
    createdDate: '2026-08-22',
    closingDate: '2026-09-05',
    requiredDeliveryDate: '2026-09-20',
    currency: 'INR (₹)',
    incoterms: 'FOR Factory',
    shippingTerms: 'Palletized bundles of 50 pcs',
    paymentTerms: 'Net 45 Days',
    owner: 'Priya Rao (Procurement Team)',
    status: 'sent',
    submissionInstructions: 'Sample 5 pcs required for burst factor & edge crush test (ECT) validation.',
    lines: [
      {
        lineNo: 1,
        itemCode: 'PK-BOX-500',
        itemName: '5-Ply Corrugated Shipper Box (600x400x350 mm)',
        description: 'Burst factor 18, kraft paper 180 GSM, 2-color flexo printed with Reboot logo',
        quantity: 25000,
        uom: 'PCS',
        requiredDate: '2026-09-20',
        targetPrice: 38.0,
        historicalPrice: 40.5,
        coaRequired: true,
        msdsRequired: false,
      }
    ],
    invitedSuppliers: [
      {
        supplierId: 'SUP-S0010',
        supplierName: 'AR INDUSTRIES',
        supplierEmail: 'info@dynaflexpkg.example',
        invitedDate: '2026-08-22',
        status: 'Responded',
        totalQuoteAmount: 950000,
        leadTimeDays: 5,
      },
      {
        supplierId: 'SUP-PKG-02',
        supplierName: 'PackRight India Pvt Ltd',
        supplierEmail: 'sales@packright.example',
        invitedDate: '2026-08-22',
        status: 'Viewed',
      }
    ],
    responsesCount: 1,
  }
];

// ----------------------------------------------------
// 4. QUOTATION COMPARISON MATRIX DATA
// ----------------------------------------------------
export const INITIAL_QUOTATION_COMPARISONS: Record<string, QuotationComparisonSession> = {
  'RFQ-2026-018': {
    rfqNumber: 'RFQ-2026-018',
    rfqTitle: 'High-Precision Mold Core Inserts & Ejector Pin Sets (Mold MLD-1001)',
    evaluationMethod: 'Weighted Scoring',
    weights: {
      price: 40,
      delivery: 20,
      quality: 25,
      paymentTerms: 10,
      supplierRisk: 5,
    },
    suppliers: [
      {
        supplierId: 'SUP-S0017',
        supplierName: 'BHANSALI ENGINEERING POLYMERS LIMITED',
        supplierRating: 4.5,
        quoteRef: 'QT-PREC-9912',
        currency: 'INR (₹)',
        exchangeRate: 1.0,
        leadTimeDays: 14,
        paymentTerms: 'Net 30 Days (Standard)',
        deliveryDate: '2026-09-12',
        validUntil: '2026-09-25',
        moq: 1,
        qualityAcceptanceRate: 98.5,
        onTimeDeliveryPct: 92.0,
        freightAmount: 2500,
        packingAmount: 1500,
        taxAmount: 30240,
        totalLandedAmount: 202240,
        weightedScore: 92.4,
        priceScore: 96,
        deliveryScore: 88,
        qualityScore: 94,
        termsScore: 90,
        riskScore: 92,
        isBestPrice: true,
        isBestTotalScore: true,
        selected: true,
        linePrices: [
          {
            itemCode: 'SP-MOLD-PIN-01',
            unitPrice: 84000,
            totalPrice: 168000,
            isLowest: true,
            targetVariancePct: -1.2,
            historicalVariancePct: -4.5,
          }
        ]
      },
      {
        supplierId: 'SUP-TOOL-08',
        supplierName: 'Shree Sai Tooling Technologies',
        supplierRating: 4.1,
        quoteRef: 'QT-SST-4401',
        currency: 'INR (₹)',
        exchangeRate: 1.0,
        leadTimeDays: 10,
        paymentTerms: '10% Advance, Net 30',
        deliveryDate: '2026-09-08',
        validUntil: '2026-09-30',
        moq: 1,
        qualityAcceptanceRate: 94.0,
        onTimeDeliveryPct: 95.0,
        freightAmount: 3000,
        packingAmount: 2000,
        taxAmount: 32760,
        totalLandedAmount: 219760,
        weightedScore: 84.8,
        priceScore: 82,
        deliveryScore: 96,
        qualityScore: 86,
        termsScore: 75,
        riskScore: 85,
        isBestPrice: false,
        isBestTotalScore: false,
        selected: false,
        linePrices: [
          {
            itemCode: 'SP-MOLD-PIN-01',
            unitPrice: 91000,
            totalPrice: 182000,
            isLowest: false,
            targetVariancePct: +7.0,
            historicalVariancePct: +3.4,
          }
        ]
      }
    ]
  }
};

// ----------------------------------------------------
// 5. EXTENDED PURCHASE ORDERS (PO) DATA
// ----------------------------------------------------
export const INITIAL_EXTENDED_POS: ExtendedPurchaseOrder[] = [];

// ----------------------------------------------------
// 6. GOODS RECEIPT NOTE (GRN) DATA
// ----------------------------------------------------
export const INITIAL_PROCUREMENT_GRNS: GoodsReceiptNote[] = [];

// ----------------------------------------------------
// 7. SUPPLIER INVOICES & 3-WAY MATCH DATA
// ----------------------------------------------------
export const INITIAL_SUPPLIER_INVOICES: SupplierInvoiceRecord[] = [
  {
    id: 'PINV-2026-091',
    invoiceNumber: 'INV-RIL-2026-8819',
    supplierId: 'SUP-S0128',
    supplierName: 'RELIANCE INDUSTRIES LIMITED BANGALORE',
    invoiceDate: '2026-08-21',
    dueDate: '2026-09-20',
    poNumber: 'PO-3390',
    grnNumber: 'GRN-4521',
    currency: 'INR (₹)',
    exchangeRate: 1.0,
    subtotal: 923160,
    taxAmount: 166168,
    freightAmount: 0,
    otherCharges: 0,
    totalInvoiceAmount: 1089328,
    matchedAmount: 1089328,
    varianceAmount: 0,
    matchStatus: 'matched',
    approvalStatus: 'approved',
    paymentStatus: 'Scheduled',
    lines: [
      {
        lineNo: 1,
        itemCode: 'RM-PP-NAT-001',
        itemName: 'PP Natural Granules H110MA',
        poQty: 12000,
        poPrice: 78.5,
        poTotal: 923160,
        grnQty: 12000,
        grnAcceptedQty: 12000,
        grnDate: '2026-08-21',
        grnRef: 'GRN-4521',
        invoiceQty: 12000,
        invoicePrice: 78.5,
        invoiceTotal: 923160,
        qtyVariance: 0,
        priceVariance: 0,
        variancePct: 0,
        status: 'Exact Match',
      }
    ]
  },
  {
    id: 'PINV-2026-092',
    invoiceNumber: 'INV-DYNA-4491',
    supplierId: 'SUP-S0010',
    supplierName: 'AR INDUSTRIES',
    invoiceDate: '2026-08-24',
    dueDate: '2026-09-23',
    poNumber: 'PO-3385',
    grnNumber: 'GRN-4515',
    currency: 'INR (₹)',
    exchangeRate: 1.0,
    subtotal: 82000,
    taxAmount: 14760,
    freightAmount: 2500,
    otherCharges: 0,
    totalInvoiceAmount: 99260,
    matchedAmount: 96760,
    varianceAmount: 2500,
    matchStatus: 'price_variance',
    approvalStatus: 'pending',
    paymentStatus: 'Hold',
    disputeReason: 'Unapproved ₹2,500 local freight surcharge added to invoice without prior PO amendment.',
    lines: [
      {
        lineNo: 1,
        itemCode: 'PK-BOX-500',
        itemName: '5-Ply Corrugated Shipper Box',
        poQty: 2000,
        poPrice: 41.0,
        poTotal: 82000,
        grnQty: 2000,
        grnAcceptedQty: 2000,
        grnDate: '2026-08-23',
        grnRef: 'GRN-4515',
        invoiceQty: 2000,
        invoicePrice: 41.0,
        invoiceTotal: 82000,
        qtyVariance: 0,
        priceVariance: 2500,
        variancePct: 3.0,
        status: 'Price Variance Warning',
      }
    ]
  }
];

// ----------------------------------------------------
// 8. PURCHASE RETURNS (SUPPLIER RMA) DATA
// ----------------------------------------------------
export const INITIAL_PROCUREMENT_RETURNS: SupplierReturnRecord[] = [
  {
    id: 'SRET-2026-012',
    returnNumber: 'SRET-2026-012',
    supplierId: 'SUP-S0233',
    supplierName: 'SOUTHERN RUBBER COMPANY',
    poNumber: 'PO-3378',
    grnNumber: 'GRN-4482',
    itemCode: 'RG-PP-011',
    itemName: 'Recycled Regrind PP Granules',
    lotBatchNumber: 'LOT-RG-902',
    returnQty: 850,
    uom: 'KG',
    unitPrice: 48.0,
    creditAmount: 40800,
    returnDate: '2026-08-19',
    reason: 'Quality rejection',
    dispositionRequested: 'Credit Note',
    status: 'supplier_acknowledged',
    linkedNcrId: 'NCR-2026-08',
    debitNoteNumber: 'DN-2026-014',
    trackingNumber: 'TRK-RET-8812',
    notes: 'Excess un-melted foreign contamination and metal fines found during melt filtration test.',
  },
  {
    id: 'SRET-2026-013',
    returnNumber: 'SRET-2026-013',
    supplierId: 'SUP-S0010',
    supplierName: 'AR INDUSTRIES',
    poNumber: 'PO-3382',
    grnNumber: 'GRN-4501',
    itemCode: 'PK-BOX-500',
    itemName: '5-Ply Corrugated Shipper Box',
    lotBatchNumber: 'LOT-BX-772',
    returnQty: 150,
    uom: 'PCS',
    unitPrice: 41.0,
    creditAmount: 6150,
    returnDate: '2026-08-22',
    reason: 'Damaged material',
    dispositionRequested: 'Replacement',
    status: 'sent_to_supplier',
    notes: 'Crushed corners due to improper forklift pallet stacking during transit.',
  }
];

// ----------------------------------------------------
// 9. SUPPLIER CONTRACTS DATA
// ----------------------------------------------------
export const INITIAL_PROCUREMENT_CONTRACTS: SupplierContractRecord[] = [
  {
    id: 'CONT-REL-2026-01',
    contractNumber: 'CONT-REL-2026-01',
    supplierId: 'SUP-S0128',
    supplierName: 'RELIANCE INDUSTRIES LIMITED BANGALORE',
    title: 'Annual Polypropylene (PP) Bulk Volume Supply Agreement',
    contractType: 'Volume Contract',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    renewalDate: '2026-11-15',
    totalCommittedValue: 18000000,
    releasedValue: 11450000,
    remainingValue: 6550000,
    totalCommittedQty: 240000,
    releasedQty: 148000,
    uom: 'KG',
    status: 'Active',
    indexedPricing: true,
    indexReference: 'Platts Asia PP CFR India Monthly Average + Logistics Adder',
    priceRevisionFormula: 'Monthly reset on 1st of every month based on ICIS/Platts average index.',
    penaltyClauses: '₹1.00/kg penalty if dispatch delayed past agreed 7-day SLA.',
    qualityTerms: 'Batch rejection with immediate credit memo if MFI deviates > ±1.0 g/10min.',
    items: [
      {
        itemCode: 'RM-PP-NAT-001',
        itemName: 'PP Natural Granules H110MA',
        contractQty: 240000,
        unitPrice: 77.0,
        moq: 10000,
        leadTimeDays: 7,
      }
    ]
  },
  {
    id: 'CONT-CLA-2026-02',
    contractNumber: 'CONT-CLA-2026-02',
    supplierId: 'SUP-S0009',
    supplierName: 'APPL INDUSTRIES LIMITED HSR',
    title: 'Masterbatch & Colorant Annual Blanket Agreement',
    contractType: 'Blanket Order',
    startDate: '2026-04-01',
    endDate: '2027-03-31',
    renewalDate: '2027-02-15',
    totalCommittedValue: 3500000,
    releasedValue: 1280000,
    remainingValue: 2220000,
    totalCommittedQty: 25000,
    releasedQty: 8400,
    uom: 'KG',
    status: 'Active',
    indexedPricing: false,
    qualityTerms: 'Delta E < 0.5 spectrophotometer color tolerance guarantee on all standard shades.',
    items: [
      {
        itemCode: 'MB-WHT-002',
        itemName: 'White Masterbatch (70% TiO2)',
        contractQty: 15000,
        unitPrice: 160.0,
        moq: 500,
        leadTimeDays: 7,
      },
      {
        itemCode: 'MB-BLK-003',
        itemName: 'Black Masterbatch',
        contractQty: 10000,
        unitPrice: 140.0,
        moq: 300,
        leadTimeDays: 7,
      }
    ]
  }
];

// ----------------------------------------------------
// 9b. SUPPLIER PRICE LISTS / INDEXED CONTRACT SCHEDULES
// ----------------------------------------------------
export const INITIAL_SUPPLIER_PRICE_LISTS: SupplierPriceListEntry[] = DOCUMENT_SUPPLIER_PRICE_LISTS;

// ----------------------------------------------------
// 10. MRP PURCHASE SUGGESTIONS DATA
// ----------------------------------------------------
export const INITIAL_MRP_SUGGESTIONS: MrpPurchaseSuggestion[] = [
  {
    id: 'MRP-2026-091',
    itemCode: 'RM-HD-GRN-014',
    itemName: 'HDPE Granules B56003 (Blow/Inj)',
    category: 'Polyethylene',
    requiredDate: '2026-09-02',
    requiredQty: 8200,
    uom: 'KG',
    availableStock: 6200,
    reservedStock: 11400,
    incomingPoQty: 5000,
    incomingProdQty: 0,
    safetyStock: 2500,
    reorderPoint: 5000,
    shortageQty: 2700,
    suggestedOrderQty: 5000, // Adjusted to supplier MOQ
    preferredSupplierId: 'SUP-S0128',
    preferredSupplierName: 'RELIANCE INDUSTRIES LIMITED BANGALORE',
    leadTimeDays: 7,
    estimatedUnitPrice: 84.0,
    estimatedTotalCost: 420000,
    priority: 'Critical Shortage',
    source: 'Production Work Order',
    linkedWorkOrderId: 'WO-1190',
    linkedSalesOrderId: 'SO-5002',
    exceptionAlerts: [
      'Production Work Order WO-1190 scheduled for 2026-09-02 will stall without 2,700 KG additional HDPE stock.',
      'Lead time is 7 days — PO must be released within 24 hours to prevent line stoppage.'
    ],
    status: 'Open Suggestion'
  },
  {
    id: 'MRP-2026-092',
    itemCode: 'MB-WHT-002',
    itemName: 'White Masterbatch (70% TiO2)',
    category: 'Colorant',
    requiredDate: '2026-09-06',
    requiredQty: 1200,
    uom: 'KG',
    availableStock: 840,
    reservedStock: 960,
    incomingPoQty: 0,
    incomingProdQty: 0,
    safetyStock: 500,
    reorderPoint: 1000,
    shortageQty: 620,
    suggestedOrderQty: 1000,
    preferredSupplierId: 'SUP-S0009',
    preferredSupplierName: 'APPL INDUSTRIES LIMITED HSR',
    leadTimeDays: 10,
    estimatedUnitPrice: 161.0,
    estimatedTotalCost: 161000,
    priority: 'High (Production Risk)',
    source: 'Safety Stock Breach',
    linkedWorkOrderId: 'WO-1192',
    exceptionAlerts: [
      'Safety stock breached below 500 KG threshold. Current free balance is only 420 KG.'
    ],
    status: 'Open Suggestion'
  },
  {
    id: 'MRP-2026-093',
    itemCode: 'PK-BOX-500',
    itemName: '5-Ply Corrugated Shipper Box',
    category: 'Packaging',
    requiredDate: '2026-09-10',
    requiredQty: 6000,
    uom: 'PCS',
    availableStock: 2200,
    reservedStock: 4800,
    incomingPoQty: 2000,
    incomingProdQty: 0,
    safetyStock: 2000,
    reorderPoint: 4000,
    shortageQty: 2600,
    suggestedOrderQty: 5000,
    preferredSupplierId: 'SUP-S0010',
    preferredSupplierName: 'AR INDUSTRIES',
    leadTimeDays: 4,
    estimatedUnitPrice: 38.0,
    estimatedTotalCost: 190000,
    priority: 'Medium (Reorder Point)',
    source: 'Sales Order Demand',
    linkedSalesOrderId: 'SO-5001',
    exceptionAlerts: [],
    status: 'Open Suggestion'
  }
];

// ----------------------------------------------------
// 11. SUPPLIER RISK & COMPLIANCE DATA
// ----------------------------------------------------
export const INITIAL_SUPPLIER_RISKS: SupplierRiskItem[] = [
  {
    id: 'RISK-01',
    supplierId: 'SUP-S0233',
    supplierName: 'SOUTHERN RUBBER COMPANY',
    riskCategory: 'Quality Risk',
    riskLevel: 'Critical',
    issueDescription: 'High contamination rate in washed regrind PP (LOT-RG-902). Multiple line nozzle clogs.',
    impact: 'Line 3 downtime totaled 145 minutes; 240 KG scrap generated.',
    mitigationAction: 'Immediate vendor block. Supplier quality audit scheduled for Sep 4; CAPA verification mandatory.',
    owner: 'Dr. Sneha Verma (Quality Head)',
    dueDate: '2026-09-06',
    status: 'Mitigating'
  },
  {
    id: 'RISK-02',
    supplierId: 'SUP-S0058',
    supplierName: 'GUJARAT STATE FERTILIZERS & CHEMICALS LIMITED TN',
    riskCategory: 'Single-Source Risk',
    riskLevel: 'High',
    issueDescription: 'Sole qualified supplier for Lexan 940A flame retardant polycarbonate.',
    impact: 'Vulnerable to Saudi Arabia shipping canal delays (lead time 21+ days).',
    mitigationAction: 'Initiate qualification trials with Covestro (Makrolon 6557) as dual-sourcing strategy.',
    owner: 'Vikram Seth (Procurement Officer)',
    dueDate: '2026-09-25',
    status: 'Open'
  },
  {
    id: 'RISK-03',
    supplierId: 'SUP-S0010',
    supplierName: 'AR INDUSTRIES',
    riskCategory: 'Compliance Risk',
    riskLevel: 'Medium',
    issueDescription: 'ISO 9001:2015 certificate expiring on 2026-10-31 (62 days remaining).',
    impact: 'Audit finding risk during upcoming ISO 13485 customer audit.',
    mitigationAction: 'Requested renewed certificate and surveillance audit copy.',
    owner: 'Priya Rao (Procurement QC)',
    dueDate: '2026-09-15',
    status: 'Open'
  }
];

// ----------------------------------------------------
// 12. PROCUREMENT SPEND & ANALYTICS METRICS
// ----------------------------------------------------
export const PROCUREMENT_SPEND_BY_CATEGORY = [
  { category: 'Virgin Polymer Resin (PP, HDPE, PET)', spend: 28450000, pct: 64.2, color: '#0F8B8D' },
  { category: 'Masterbatch & Color Concentrates', spend: 5200000, pct: 11.7, color: '#E8622C' },
  { category: 'Additives, Fillers & UV Stabilizers', spend: 3850000, pct: 8.7, color: '#6366F1' },
  { category: 'Packaging Materials (Boxes, Liners)', spend: 3100000, pct: 7.0, color: '#EC4899' },
  { category: 'Molds, Tooling & Core Pins', spend: 2150000, pct: 4.8, color: '#F59E0B' },
  { category: 'Machine Spare Parts & Maintenance', spend: 1100000, pct: 2.5, color: '#10B981' },
  { category: 'Logistics, Freight & Utilities', spend: 480000, pct: 1.1, color: '#8B5CF6' },
];

export const PROCUREMENT_MONTHLY_SPEND_TREND = [
  { month: 'Mar 2026', spend: 4120000, budget: 4500000, ppvPct: -1.2 },
  { month: 'Apr 2026', spend: 4380000, budget: 4500000, ppvPct: +0.4 },
  { month: 'May 2026', spend: 4620000, budget: 4800000, ppvPct: -0.8 },
  { month: 'Jun 2026', spend: 4850000, budget: 5000000, ppvPct: -1.5 },
  { month: 'Jul 2026', spend: 5120000, budget: 5200000, ppvPct: +1.1 },
  { month: 'Aug 2026 (MTD)', spend: 4420000, budget: 5500000, ppvPct: -0.9 },
];
