import {
  SalesOrder,
  SalesQuotation,
  SalesRma,
  SalesContract,
  Customer,
  CustomerInvoice,
  CustomerPayment,
} from '../types';

export interface PriceListEntry {
  id: string;
  name: string;
  customerOrGroup: string;
  itemOrGroup: string;
  currency: string;
  unitPrice: number;
  basePrice: number;
  discountPct: number;
  effectiveFrom: string;
  effectiveTo: string;
  moq: number;
  priority: 'Tier 1' | 'Tier 2' | 'Tier 3' | 'Contract';
  status: 'active' | 'expired' | 'draft';
  freightIncluded: boolean;
  packagingIncluded: boolean;
  marginFloorPct: number;
  requiresApproval: boolean;
}

export interface VolumeBracket {
  fromQty: number;
  toQty: number;
  unitPrice: number;
  discountPct: number;
  uom: string;
}

export interface RebateProgram {
  id: string;
  name: string;
  customer: string;
  productGroup: string;
  volumeTarget: number;
  rebatePct: number;
  currentVolume: number;
  accruedRebate: number;
  validity: string;
  status: 'active' | 'achieved' | 'expired';
}

export interface CreditExposure {
  customerCode: string;
  customerName: string;
  creditLimit: number;
  currentBalance: number;
  openOrdersValue: number;
  availableCredit: number;
  overdueAmount: number;
  riskRating: 'AAA' | 'AA' | 'A' | 'BBB' | 'High Risk';
  paymentBehavior: 'Prompt' | 'Normal' | 'Slow 15d' | 'Chronic Overdue';
  lastPaymentDate: string;
  creditStatus: 'good_standing' | 'near_limit' | 'over_limit' | 'credit_blocked' | 'under_review' | 'default';
  reviewDueDate: string;
}

export interface BillingRecord {
  id: string;
  soId: string;
  customer: string;
  deliveryNote: string;
  deliveryDate: string;
  deliveredQty: number;
  deliveredValue: number;
  invoiceStatus: 'not_billed' | 'ready_to_bill' | 'invoice_requested' | 'partially_invoiced' | 'invoiced' | 'paid' | 'overdue' | 'disputed';
  invoiceId?: string;
  invoiceDate?: string;
  dueDate?: string;
  paymentStatus: 'unpaid' | 'partially_paid' | 'paid' | 'overdue';
  hasCOA: boolean;
  hasPOD: boolean;
}

export interface BackorderRecord {
  id: string;
  soId: string;
  customer: string;
  item: string;
  itemName: string;
  orderedQty: number;
  allocatedQty: number;
  shortageQty: number;
  uom: string;
  requestedDate: string;
  feasibleDate: string;
  supplySource: 'available_stock' | 'incoming_po' | 'incoming_production' | 'wh_transfer' | 'substitute_resin';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'open' | 'partially_allocated' | 'fully_allocated' | 'awaiting_production' | 'awaiting_purchase' | 'customer_confirmed';
  notes: string;
}

export interface SalesForecastRecord {
  id: string;
  customer: string;
  item: string;
  category: 'Raw Resin' | 'Masterbatch' | 'Additives' | 'Regrind' | 'Finished Goods' | 'Packaging';
  forecastMonth: string;
  forecastQty: number;
  actualOrderQty: number;
  actualDeliveredQty: number;
  uom: string;
  varianceQty: number;
  variancePct: number;
  accuracyPct: number;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Locked' | 'Closed';
}

export interface CustomerComplaint {
  id: string;
  customer: string;
  date: string;
  product: string;
  batch: string;
  issue: string;
  status: 'Investigating' | 'CAPA Initiated' | 'Resolved' | 'Closed';
  ncrRef?: string;
}

// ----------------------------------------------------
// EXTENDED CUSTOMERS WITH 360 METRICS
// ----------------------------------------------------
export const SALES_CUSTOMERS: Customer[] = [
  {
    code: 'CUST-001',
    name: 'Metro Retail Distributors',
    segment: 'Retail & Packaging',
    creditLimit: 2000000,
    contact: 'Karan Mehta',
    email: 'karan.mehta@metroretail.example',
    phone: '+91 98200 55667',
    status: 'active',
    gstin: '27AABCM8899K1Z4',
    pan: 'AABCM8899K',
    billingAddress: 'Plot 45, Bhiwandi Logistics Park, Thane, Maharashtra 421302',
    shippingAddresses: [
      'Central WH, Bhiwandi Logistics Hub, Thane 421302',
      'North Hub, Sonipat Industrial Area, Haryana 131028',
    ],
    paymentTerms: 'Net 30 Days',
    accountManager: 'Ananya Rao',
    riskRating: 'AA',
    creditStatus: 'good_standing',
    creditUsed: 1420000,
    overdueAmount: 0,
    notes: 'Major customer for blow-molded bottles & containers. Consistent quarterly volume.',
    contacts: [
      { name: 'Karan Mehta', role: 'Head of Procurement', email: 'karan.mehta@metroretail.example', phone: '+91 98200 55667', isPrimary: true },
      { name: 'Ritu Sharma', role: 'Accounts Payable Lead', email: 'ritu.s@metroretail.example', phone: '+91 98200 55668', isPrimary: false },
    ],
  },
  {
    code: 'CUST-002',
    name: 'GreenPack FMCG Pvt Ltd',
    segment: 'FMCG Packaging',
    creditLimit: 1500000,
    contact: 'Neha Kulkarni',
    email: 'neha@greenpack.example',
    phone: '+91 98330 11222',
    status: 'active',
    gstin: '29AABCG1234F1ZQ',
    pan: 'AABCG1234F',
    billingAddress: '22 Peenya Industrial Area, Phase II, Bengaluru, Karnataka 560058',
    shippingAddresses: [
      'Peenya Plant 02, Bengaluru 560058',
      'Dharwad Unit, Karnataka 580011',
    ],
    paymentTerms: 'Net 45 Days',
    accountManager: 'Vikram Das',
    riskRating: 'AAA',
    creditStatus: 'good_standing',
    creditUsed: 980000,
    overdueAmount: 0,
    notes: 'Premium FMCG closures & dispenser pumps. Requires strict COA with each shipment.',
    contacts: [
      { name: 'Neha Kulkarni', role: 'Sourcing Director', email: 'neha@greenpack.example', phone: '+91 98330 11222', isPrimary: true },
      { name: 'Sameer Sen', role: 'Quality Audit Manager', email: 'sameer.s@greenpack.example', phone: '+91 98330 11223', isPrimary: false },
    ],
  },
  {
    code: 'CUST-003',
    name: 'Bharat AgroTech Systems',
    segment: 'Agriculture / Irrigation',
    creditLimit: 800000,
    contact: 'Suresh Patil',
    email: 'suresh@bharatagro.example',
    phone: '+91 98450 33445',
    status: 'active',
    gstin: '27AAACB5678P1Z8',
    pan: 'AAACB5678P',
    billingAddress: 'MIDC Industrial Estate, Satpur, Nashik, Maharashtra 422007',
    shippingAddresses: [
      'Nashik Plant, Satpur MIDC, Nashik 422007',
    ],
    paymentTerms: 'Net 30 Days',
    accountManager: 'Ananya Rao',
    riskRating: 'BBB',
    creditStatus: 'near_limit',
    creditUsed: 740000,
    overdueAmount: 125000,
    notes: 'Drip irrigation drip emitters & connectors. High seasonal surge in Q3 & Q4.',
    contacts: [
      { name: 'Suresh Patil', role: 'General Manager Supply', email: 'suresh@bharatagro.example', phone: '+91 98450 33445', isPrimary: true },
      { name: 'Vijay Deshmukh', role: 'Store Keeper', email: 'vijay.d@bharatagro.example', phone: '+91 98450 33446', isPrimary: false },
    ],
  },
  {
    code: 'CUST-004',
    name: 'UrbanHome Essentials',
    segment: 'Consumer Plastics / Houseware',
    creditLimit: 500000,
    contact: 'Priyanka Shah',
    email: 'priyanka@urbanhome.example',
    phone: '+91 98110 66778',
    status: 'active',
    gstin: '07AAACU9988D1Z2',
    pan: 'AAACU9988D',
    billingAddress: 'B-14 Okhla Industrial Area Phase 1, New Delhi 110020',
    shippingAddresses: [
      'Okhla DC, New Delhi 110020',
    ],
    paymentTerms: 'Net 15 Days',
    accountManager: 'Vikram Das',
    riskRating: 'High Risk',
    creditStatus: 'credit_blocked',
    creditUsed: 520000,
    overdueAmount: 240000,
    notes: 'Credit blocked due to 45-day overdue balance. Requires director sign-off before dispatch.',
    contacts: [
      { name: 'Priyanka Shah', role: 'Partner & Buyer', email: 'priyanka@urbanhome.example', phone: '+91 98110 66778', isPrimary: true },
    ],
  },
  {
    code: 'CUST-005',
    name: 'Apex Automotive Components',
    segment: 'Automotive OEM Tier 1',
    creditLimit: 3500000,
    contact: 'Rajesh Nambiar',
    email: 'rajesh.n@apexauto.example',
    phone: '+91 98765 43210',
    status: 'active',
    gstin: '33AAACA4455N1ZK',
    pan: 'AAACA4455N',
    billingAddress: 'SIPCOT Industrial Park, Sriperumbudur, Tamil Nadu 602105',
    shippingAddresses: [
      'Sriperumbudur Unit 1, Tamil Nadu 602105',
      'Oragadam JIT Hub, Tamil Nadu 602105',
    ],
    paymentTerms: 'Net 60 Days',
    accountManager: 'Rahul Verma',
    riskRating: 'AAA',
    creditStatus: 'good_standing',
    creditUsed: 2100000,
    overdueAmount: 0,
    notes: 'Tier 1 supplier for engine bay brackets & HVAC louvers. IATF 16949 audit approved.',
    contacts: [
      { name: 'Rajesh Nambiar', role: 'VP Sourcing', email: 'rajesh.n@apexauto.example', phone: '+91 98765 43210', isPrimary: true },
      { name: 'K. Senthil', role: 'Supplier Quality Engineer', email: 'senthil.k@apexauto.example', phone: '+91 98765 43211', isPrimary: false },
    ],
  },
  {
    code: 'CUST-006',
    name: 'Medix Pharma Containers',
    segment: 'Medical & Healthcare',
    creditLimit: 2500000,
    contact: 'Dr. Aditi Varma',
    email: 'aditi.v@medixpharma.example',
    phone: '+91 98451 99887',
    status: 'active',
    gstin: '36AAACM3344R1ZM',
    pan: 'AAACM3344R',
    billingAddress: 'Genome Valley, Shamirpet, Hyderabad, Telangana 500078',
    shippingAddresses: [
      'Cleanroom Packaging Hub, Hyderabad 500078',
    ],
    paymentTerms: 'Net 30 Days',
    accountManager: 'Rahul Verma',
    riskRating: 'AAA',
    creditStatus: 'good_standing',
    creditUsed: 890000,
    overdueAmount: 0,
    notes: 'Medical USP Class VI certified PP syringes and amber vial caps. Cleanroom Class 100k required.',
    contacts: [
      { name: 'Dr. Aditi Varma', role: 'Head of Quality & Materials', email: 'aditi.v@medixpharma.example', phone: '+91 98451 99887', isPrimary: true },
    ],
  },
];

// ----------------------------------------------------
// SALES BLANKET CONTRACTS & RATE AGREEMENTS
// ----------------------------------------------------
export const SALES_CONTRACTS_SEED: SalesContract[] = [
  {
    id: 'CNT-2026-01',
    customer: 'Apex Automotive Components',
    type: 'Annual Volume Blanket Agreement',
    startDate: '2026-04-01',
    endDate: '2027-03-31',
    totalQty: 250000,
    releasedQty: 98500,
    totalValue: 12500000,
    releasedValue: 4925000,
    status: 'active',
    items: [
      { item: 'FG-AUTO-012', qty: 150000, price: 42.0, moq: 5000, frequency: 'Bi-Weekly JIT' },
      { item: 'FG-AUTO-045', qty: 100000, price: 62.0, moq: 2500, frequency: 'Monthly JIT' },
    ],
  },
  {
    id: 'CNT-2026-02',
    customer: 'GreenPack FMCG Pvt Ltd',
    type: 'Rate Contract with Polymer Index Linkage',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    totalQty: 500000,
    releasedQty: 340000,
    totalValue: 7500000,
    releasedValue: 5100000,
    status: 'active',
    items: [
      { item: 'FG-FLIP-28', qty: 350000, price: 14.5, moq: 20000, frequency: 'Weekly Dispatch' },
      { item: 'FG-PUMP-24', qty: 150000, price: 16.2, moq: 10000, frequency: 'Bi-Weekly' },
    ],
  },
  {
    id: 'CNT-2026-03',
    customer: 'Metro Retail Distributors',
    type: 'Quarterly Volume Rebate Contract',
    startDate: '2026-07-01',
    endDate: '2026-09-30',
    totalQty: 120000,
    releasedQty: 85000,
    totalValue: 2400000,
    releasedValue: 1700000,
    status: 'expiring',
    items: [
      { item: 'FG-CTN-500', qty: 80000, price: 18.5, moq: 5000, frequency: 'Weekly Dispatch' },
      { item: 'FG-CTN-1000', qty: 40000, price: 23.0, moq: 2500, frequency: 'Bi-Weekly' },
    ],
  },
  {
    id: 'CNT-2026-04',
    customer: 'Medix Pharma Containers',
    type: 'Medical Grade Dedicated Cell Contract',
    startDate: '2026-06-01',
    endDate: '2027-05-31',
    totalQty: 300000,
    releasedQty: 45000,
    totalValue: 9600000,
    releasedValue: 1440000,
    status: 'active',
    items: [
      { item: 'FG-MED-VIAL', qty: 200000, price: 28.0, moq: 10000, frequency: 'Monthly Batch' },
      { item: 'FG-MED-CAP', qty: 100000, price: 40.0, moq: 5000, frequency: 'Monthly Batch' },
    ],
  },
  {
    id: 'CNT-2025-08',
    customer: 'Bharat AgroTech Systems',
    type: 'Agricultural Drip Emitters Rate Agreement',
    startDate: '2025-08-01',
    endDate: '2026-07-31',
    totalQty: 400000,
    releasedQty: 395000,
    totalValue: 3200000,
    releasedValue: 3160000,
    status: 'expired',
    items: [
      { item: 'FG-DRIP-01', qty: 400000, price: 8.0, moq: 25000, frequency: 'Monthly' },
    ],
  },
];

// ----------------------------------------------------
// EXTENDED QUOTATIONS WITH PLASTIC MFG ATTRIBUTES
// ----------------------------------------------------
export const SALES_QUOTATIONS: SalesQuotation[] = [
  {
    id: 'QT-3001',
    customer: 'CUST-001',
    customerRfq: 'RFQ-METRO-118',
    date: '2026-08-08',
    validUntil: '2026-09-08',
    currency: 'INR',
    salesperson: 'Ananya Rao',
    priority: 'high',
    expectedClose: '2026-08-20',
    stage: 'converted',
    approval: 'approved',
    margin: 22.4,
    convertedSo: 'SO-501',
    lines: [
      {
        item: 'FG-CTN-500',
        name: '500ml HDPE Dispenser Container',
        customerItemCode: 'MRD-CTN-500',
        qty: 10000,
        uom: 'PCS',
        price: 9.5,
        discountPct: 2,
        color: 'Natural / Semi-Opaque',
        grade: 'HDPE Blow Grade B56003',
        resinType: 'HDPE High Density Polyethylene',
        moq: 5000,
        coaRequired: true,
      },
    ],
    terms: {
      payment: 'Net 30 Days from Invoice',
      incoterm: 'EXW Hosur Plant 01',
      shipping: 'Dedicated Road Freight (Palletized)',
      delivery: 'Within 10 Days from Order Confirmation',
    },
    history: [
      { event: 'Quotation created by Ananya Rao', time: '08 Aug 2026, 10:15 AM' },
      { event: 'Technical spec & drawing approved', time: '10 Aug 2026, 02:30 PM' },
      { event: 'Sample lot approval received (SAMP-092)', time: '12 Aug 2026, 11:00 AM' },
      { event: 'Customer accepted quotation', time: '14 Aug 2026, 04:20 PM' },
      { event: 'Converted to Sales Order SO-501', time: '15 Aug 2026, 09:00 AM' },
    ],
  },
  {
    id: 'QT-3002',
    customer: 'CUST-003',
    customerRfq: 'BAT-RFQ-44',
    date: '2026-08-12',
    validUntil: '2026-09-12',
    currency: 'INR',
    salesperson: 'Vikram Das',
    priority: 'medium',
    expectedClose: '2026-08-22',
    stage: 'converted',
    approval: 'approved',
    margin: 18.1,
    convertedSo: 'SO-503',
    lines: [
      {
        item: 'FG-PET-030',
        name: '30mm PCO PET Bottle Preform (28g)',
        customerItemCode: 'BAT-PF-28G',
        qty: 40000,
        uom: 'PCS',
        price: 2.6,
        discountPct: 0,
        color: 'Crystal Clear',
        grade: 'Bottle Grade IV 0.82',
        resinType: 'PET Polyethylene Terephthalate',
        moq: 10000,
        coaRequired: true,
      },
    ],
    terms: {
      payment: 'Net 15 Days',
      incoterm: 'FOR Customer Hub (Bengaluru)',
      shipping: 'Covered Truck (Corrugated Octabins)',
      delivery: '22 Aug 2026',
    },
    history: [
      { event: 'Quotation initiated from RFQ', time: '12 Aug 2026, 11:30 AM' },
      { event: 'Approved by Sales Director', time: '12 Aug 2026, 03:00 PM' },
      { event: 'Converted to SO-503', time: '12 Aug 2026, 04:15 PM' },
    ],
  },
  {
    id: 'QT-3003',
    customer: 'CUST-002',
    customerRfq: 'GP-INQ-901',
    date: '2026-08-20',
    validUntil: '2026-09-15',
    currency: 'INR',
    salesperson: 'Ananya Rao',
    priority: 'medium',
    expectedClose: '2026-08-30',
    stage: 'sent',
    approval: 'approved',
    margin: 26.8,
    convertedSo: null,
    lines: [
      {
        item: 'FG-BKT-010',
        name: 'Heavy Duty 10L Industrial Bucket with Metal Handle',
        customerItemCode: 'GP-BKT-10L',
        qty: 3000,
        uom: 'PCS',
        price: 42.0,
        discountPct: 3,
        color: 'Royal Blue (MB-BLU-012 @ 2%)',
        grade: 'PP Copolymer MFI 12',
        resinType: 'PP Polypropylene Block Copolymer',
        moq: 1000,
        coaRequired: false,
      },
    ],
    terms: {
      payment: 'Net 30 Days',
      incoterm: 'EXW Hosur Plant 01',
      shipping: 'Customer Transport / FOB',
      delivery: '10 Sep 2026',
    },
    history: [
      { event: 'Quote drafted & pricing calculated', time: '20 Aug 2026, 09:00 AM' },
      { event: 'Automated margin check: 26.8% (Target >20% Passed)', time: '20 Aug 2026, 09:05 AM' },
      { event: 'Sent to Neha Kulkarni via email with PDF', time: '20 Aug 2026, 11:45 AM' },
    ],
  },
  {
    id: 'QT-3004',
    customer: 'CUST-004',
    customerRfq: 'UH-RFQ-2026',
    date: '2026-08-22',
    validUntil: '2026-09-05',
    currency: 'INR',
    salesperson: 'Vikram Das',
    priority: 'low',
    expectedClose: '2026-09-02',
    stage: 'pending',
    approval: 'pending',
    margin: 14.2,
    convertedSo: null,
    lines: [
      {
        item: 'FG-CTN-500',
        name: '500ml HDPE Dispenser Container',
        customerItemCode: 'UH-CTN-05',
        qty: 2000,
        uom: 'PCS',
        price: 8.8,
        discountPct: 8,
        color: 'Opaque White (MB-WHT-002 @ 3%)',
        grade: 'Food Grade Blow Molding HDPE',
        resinType: 'HDPE High Density Polyethylene',
        moq: 1000,
        coaRequired: true,
      },
    ],
    terms: {
      payment: 'Advance 50%, Balance before dispatch',
      incoterm: 'EXW Hosur Plant 01',
      shipping: 'Courier / Express Logistics',
      delivery: '12 Sep 2026',
    },
    history: [
      { event: 'Quotation entered with 8% discount override', time: '22 Aug 2026, 02:00 PM' },
      { event: 'Warning: Margin 14.2% is below 18% floor. Requires Finance Approval', time: '22 Aug 2026, 02:01 PM' },
      { event: 'Submitted to Finance Manager (Priya Rao) for approval', time: '22 Aug 2026, 02:05 PM' },
    ],
  },
  {
    id: 'QT-3005',
    customer: 'CUST-005',
    customerRfq: 'APEX-MOLD-2026-08',
    date: '2026-08-25',
    validUntil: '2026-09-25',
    currency: 'INR',
    salesperson: 'Ananya Rao',
    priority: 'high',
    expectedClose: '2026-09-10',
    stage: 'reviewing',
    approval: 'approved',
    margin: 31.5,
    convertedSo: null,
    lines: [
      {
        item: 'RM-AB-060',
        name: 'ABS Heat Resistant Grade (Automotive Trim)',
        customerItemCode: 'APX-ABS-HT',
        qty: 15000,
        uom: 'KG',
        price: 135.0,
        discountPct: 4,
        color: 'Black 9005',
        grade: 'Injection Mold Grade - Heat Stabilized',
        resinType: 'ABS Acrylonitrile Butadiene Styrene',
        moq: 3000,
        coaRequired: true,
      },
    ],
    terms: {
      payment: 'Net 45 Days',
      incoterm: 'DAP Apex Plant Chennai',
      shipping: 'Dedicated 20ft Container (25kg Bags on Pallets)',
      delivery: '15 Sep 2026',
    },
    history: [
      { event: 'Quote generated for automotive compound contract', time: '25 Aug 2026, 11:00 AM' },
      { event: 'IATF 16949 PPAP level 3 documentation bundle attached', time: '25 Aug 2026, 03:00 PM' },
      { event: 'Sent for customer procurement review', time: '26 Aug 2026, 10:00 AM' },
    ],
  },
];

// ----------------------------------------------------
// EXTENDED SALES ORDERS WITH FULL INTEGRATION
// ----------------------------------------------------
export const SALES_ORDERS_SEED: SalesOrder[] = [
  {
    id: 'SO-501',
    customer: 'CUST-001',
    customerPO: 'PO-METRO-4471',
    priority: 'high',
    quoteRef: 'QT-3001',
    orderDate: '2026-08-15',
    deliveryDate: '2026-08-25',
    approval: 'approved',
    lines: [
      {
        item: 'FG-CTN-500',
        name: '500ml HDPE Dispenser Container',
        qty: 10000,
        uom: 'PCS',
        price: 9.5,
        dispatched: 6000,
      },
    ],
    dispatchLogs: [
      {
        date: '2026-08-20',
        item: '500ml HDPE Dispenser Container',
        qty: 6000,
        uom: 'PCS',
        txnId: 'ISS-1050',
      },
    ],
    history: [
      { event: 'Sales order confirmed from Quote QT-3001', time: '15 Aug 2026, 09:30 AM' },
      { event: 'Credit check passed (Exposure: ₹4.8L / Limit: ₹20.0L)', time: '15 Aug 2026, 09:31 AM' },
      { event: 'Work Order WO-1192 generated for 10,000 PCS', time: '15 Aug 2026, 10:00 AM' },
      { event: 'Partial delivery note DN-8801 dispatched (6,000 PCS)', time: '20 Aug 2026, 03:30 PM' },
    ],
  },
  {
    id: 'SO-502',
    customer: 'CUST-002',
    customerPO: 'GP-PO-8821',
    priority: 'medium',
    orderDate: '2026-08-17',
    deliveryDate: '2026-08-27',
    approval: 'pending',
    lines: [
      {
        item: 'FG-BKT-010',
        name: 'Household Bucket 10L',
        qty: 2000,
        uom: 'PCS',
        price: 42.0,
        dispatched: 0,
      },
    ],
    dispatchLogs: [],
    history: [
      { event: 'Order received via customer portal', time: '17 Aug 2026, 11:00 AM' },
      { event: 'Awaiting credit control clearance (Invoice #INV-2109 overdue 5 days)', time: '17 Aug 2026, 11:05 AM' },
    ],
  },
  {
    id: 'SO-503',
    customer: 'CUST-003',
    customerPO: 'BAT-2026-119',
    priority: 'medium',
    quoteRef: 'QT-3002',
    orderDate: '2026-08-12',
    deliveryDate: '2026-08-22',
    approval: 'approved',
    lines: [
      {
        item: 'FG-PET-030',
        name: 'PET Bottle Preform 28g',
        qty: 40000,
        uom: 'PCS',
        price: 2.6,
        dispatched: 40000,
      },
    ],
    dispatchLogs: [
      {
        date: '2026-08-21',
        item: 'PET Bottle Preform 28g',
        qty: 40000,
        uom: 'PCS',
        txnId: 'ISS-1051',
      },
    ],
    history: [
      { event: 'Order confirmed and released to plant', time: '12 Aug 2026, 04:30 PM' },
      { event: 'Production completed on Machine EXT-LINE-02 (WO-1189)', time: '19 Aug 2026, 02:00 PM' },
      { event: 'Quality batch release QA-COA-981 issued', time: '20 Aug 2026, 10:00 AM' },
      { event: 'Full shipment dispatched under DN-8802 (40,000 PCS)', time: '21 Aug 2026, 01:00 PM' },
      { event: 'Invoice INV-2202 generated & emailed', time: '22 Aug 2026, 09:15 AM' },
    ],
  },
  {
    id: 'SO-504',
    customer: 'CUST-004',
    customerPO: 'UH-PO-556',
    priority: 'low',
    orderDate: '2026-08-10',
    deliveryDate: '2026-08-18',
    approval: 'rejected',
    rejectReason: 'Customer has exceeded total credit limit of ₹5,00,000. Outstanding unpaid balance is ₹5,42,000.',
    lines: [
      {
        item: 'FG-CTN-500',
        name: 'Plastic Container 500ml',
        qty: 5000,
        uom: 'PCS',
        price: 9.5,
        dispatched: 0,
      },
    ],
    dispatchLogs: [],
    history: [
      { event: 'Sales order drafted', time: '10 Aug 2026, 08:30 AM' },
      { event: 'Auto credit gate triggered: exposure violation', time: '10 Aug 2026, 08:31 AM' },
      { event: 'Credit hold placed by Finance', time: '16 Aug 2026, 04:00 PM' },
    ],
  },
  {
    id: 'SO-505',
    customer: 'CUST-005',
    customerPO: 'APEX-PO-90021',
    priority: 'high',
    quoteRef: 'QT-3005',
    orderDate: '2026-08-26',
    deliveryDate: '2026-09-05',
    approval: 'approved',
    lines: [
      {
        item: 'RM-AB-060',
        name: 'ABS Heat Resistant Grade',
        qty: 12000,
        uom: 'KG',
        price: 135.0,
        dispatched: 0,
      },
    ],
    dispatchLogs: [],
    history: [
      { event: 'Sales order confirmed against blanket release CTR-102', time: '26 Aug 2026, 10:00 AM' },
      { event: 'Raw material reservation: 12,000 KG allocated in RM-WH-01', time: '26 Aug 2026, 10:05 AM' },
      { event: 'Shipping schedule registered for 05 Sep 2026', time: '26 Aug 2026, 10:30 AM' },
    ],
  },
  {
    id: 'SO-506',
    customer: 'CUST-006',
    customerPO: 'MED-PO-1142',
    priority: 'high',
    orderDate: '2026-08-27',
    deliveryDate: '2026-09-08',
    approval: 'approved',
    lines: [
      {
        item: 'FG-CTN-500',
        name: 'Pharma Grade Sterile Container 500ml',
        qty: 25000,
        uom: 'PCS',
        price: 11.2,
        dispatched: 0,
      },
    ],
    dispatchLogs: [],
    history: [
      { event: 'Medical pharma order registered with Class 100k cleanroom spec', time: '27 Aug 2026, 09:00 AM' },
      { event: 'USP Class VI & FDA 21 CFR compliance certificates linked', time: '27 Aug 2026, 09:30 AM' },
    ],
  },
];

// ----------------------------------------------------
// PRICE LISTS & SIMULATOR DATA
// ----------------------------------------------------
export const SALES_PRICE_LISTS: PriceListEntry[] = [
  {
    id: 'PL-STD-2026',
    name: 'Standard Catalog Price List 2026',
    customerOrGroup: 'All Standard Customers',
    itemOrGroup: 'All Finished Goods & Resins',
    currency: 'INR',
    unitPrice: 10.0,
    basePrice: 10.0,
    discountPct: 0,
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    moq: 1000,
    priority: 'Tier 3',
    status: 'active',
    freightIncluded: false,
    packagingIncluded: true,
    marginFloorPct: 18,
    requiresApproval: false,
  },
  {
    id: 'PL-OEM-TIER1',
    name: 'Automotive & Tier 1 OEM Preferred Pricing',
    customerOrGroup: 'Automotive & OEM Group',
    itemOrGroup: 'Engineering Polymers & Custom Molded',
    currency: 'INR',
    unitPrice: 135.0,
    basePrice: 145.0,
    discountPct: 6.9,
    effectiveFrom: '2026-04-01',
    effectiveTo: '2027-03-31',
    moq: 5000,
    priority: 'Tier 1',
    status: 'active',
    freightIncluded: true,
    packagingIncluded: true,
    marginFloorPct: 22,
    requiresApproval: true,
  },
  {
    id: 'PL-RETAIL-VOL',
    name: 'FMCG & Retail High-Volume Bracket',
    customerOrGroup: 'FMCG / Retail Chains',
    itemOrGroup: 'Bottles, Preforms, Containers',
    currency: 'INR',
    unitPrice: 8.9,
    basePrice: 9.8,
    discountPct: 9.1,
    effectiveFrom: '2026-06-01',
    effectiveTo: '2026-12-31',
    moq: 10000,
    priority: 'Tier 2',
    status: 'active',
    freightIncluded: false,
    packagingIncluded: true,
    marginFloorPct: 16,
    requiresApproval: true,
  },
  {
    id: 'PL-MEDIX-SPECIAL',
    name: 'Medix Pharma Cleanroom Agreement',
    customerOrGroup: 'Medix Pharma Containers',
    itemOrGroup: 'Medical Grade Containers & Vials',
    currency: 'INR',
    unitPrice: 11.2,
    basePrice: 12.5,
    discountPct: 10.4,
    effectiveFrom: '2026-07-01',
    effectiveTo: '2027-06-30',
    moq: 20000,
    priority: 'Contract',
    status: 'active',
    freightIncluded: true,
    packagingIncluded: true,
    marginFloorPct: 25,
    requiresApproval: true,
  },
];

export const SALES_REBATES: RebateProgram[] = [
  {
    id: 'REB-2026-01',
    name: 'Metro Annual Volume Growth Rebate',
    customer: 'CUST-001',
    productGroup: 'HDPE Containers',
    volumeTarget: 200000,
    rebatePct: 3.5,
    currentVolume: 124000,
    accruedRebate: 41230,
    validity: '2026-01-01 to 2026-12-31',
    status: 'active',
  },
  {
    id: 'REB-2026-02',
    name: 'Bharat Agro Seasonal Preform Incentive',
    customer: 'CUST-003',
    productGroup: 'PET Preforms',
    volumeTarget: 500000,
    rebatePct: 2.0,
    currentVolume: 512000,
    accruedRebate: 26624,
    validity: '2026-04-01 to 2026-09-30',
    status: 'achieved',
  },
  {
    id: 'REB-2026-03',
    name: 'Apex Tier 1 High Engineering Compound Incentive',
    customer: 'CUST-005',
    productGroup: 'ABS / PC-ABS Compounds',
    volumeTarget: 100000,
    rebatePct: 4.0,
    currentVolume: 42000,
    accruedRebate: 22680,
    validity: '2026-04-01 to 2027-03-31',
    status: 'active',
  },
];

// ----------------------------------------------------
// CUSTOMER CREDIT EXPOSURE RECORDS
// ----------------------------------------------------
export const CUSTOMER_CREDIT_EXPOSURES: CreditExposure[] = [
  {
    customerCode: 'CUST-001',
    customerName: 'Metro Retail Distributors',
    creditLimit: 2000000,
    currentBalance: 480000,
    openOrdersValue: 95000,
    availableCredit: 1425000,
    overdueAmount: 0,
    riskRating: 'AAA',
    paymentBehavior: 'Prompt',
    lastPaymentDate: '2026-08-18',
    creditStatus: 'good_standing',
    reviewDueDate: '2026-11-15',
  },
  {
    customerCode: 'CUST-002',
    customerName: 'GreenPack FMCG Pvt Ltd',
    creditLimit: 1500000,
    currentBalance: 1280000,
    openOrdersValue: 84000,
    availableCredit: 136000,
    overdueAmount: 142000,
    riskRating: 'BBB',
    paymentBehavior: 'Slow 15d',
    lastPaymentDate: '2026-07-28',
    creditStatus: 'near_limit',
    reviewDueDate: '2026-09-10',
  },
  {
    customerCode: 'CUST-003',
    customerName: 'Bharat AgroTech Systems',
    creditLimit: 800000,
    currentBalance: 210000,
    openOrdersValue: 104000,
    availableCredit: 486000,
    overdueAmount: 0,
    riskRating: 'AA',
    paymentBehavior: 'Normal',
    lastPaymentDate: '2026-08-20',
    creditStatus: 'good_standing',
    reviewDueDate: '2026-12-01',
  },
  {
    customerCode: 'CUST-004',
    customerName: 'UrbanHome Essentials',
    creditLimit: 500000,
    currentBalance: 542000,
    openOrdersValue: 47500,
    availableCredit: 0,
    overdueAmount: 380000,
    riskRating: 'High Risk',
    paymentBehavior: 'Chronic Overdue',
    lastPaymentDate: '2026-06-12',
    creditStatus: 'credit_blocked',
    reviewDueDate: 'Immediate',
  },
  {
    customerCode: 'CUST-005',
    customerName: 'Apex Automotive Components',
    creditLimit: 3500000,
    currentBalance: 820000,
    openOrdersValue: 1620000,
    availableCredit: 1060000,
    overdueAmount: 0,
    riskRating: 'AAA',
    paymentBehavior: 'Prompt',
    lastPaymentDate: '2026-08-24',
    creditStatus: 'good_standing',
    reviewDueDate: '2027-02-10',
  },
  {
    customerCode: 'CUST-006',
    customerName: 'Medix Pharma Containers',
    creditLimit: 2500000,
    currentBalance: 310000,
    openOrdersValue: 280000,
    availableCredit: 1910000,
    overdueAmount: 0,
    riskRating: 'AAA',
    paymentBehavior: 'Prompt',
    lastPaymentDate: '2026-08-25',
    creditStatus: 'good_standing',
    reviewDueDate: '2026-10-30',
  },
];

// ----------------------------------------------------
// BILLING / INVOICE REQUESTS
// ----------------------------------------------------
export const SALES_BILLING_RECORDS: BillingRecord[] = [
  {
    id: 'BIL-9001',
    soId: 'SO-501',
    customer: 'Metro Retail Distributors',
    deliveryNote: 'DN-8801',
    deliveryDate: '2026-08-20',
    deliveredQty: 6000,
    deliveredValue: 57000,
    invoiceStatus: 'ready_to_bill',
    invoiceId: 'INV-2201',
    invoiceDate: '2026-08-21',
    dueDate: '2026-09-20',
    paymentStatus: 'unpaid',
    hasCOA: true,
    hasPOD: true,
  },
  {
    id: 'BIL-9002',
    soId: 'SO-503',
    customer: 'Bharat AgroTech Systems',
    deliveryNote: 'DN-8802',
    deliveryDate: '2026-08-21',
    deliveredQty: 40000,
    deliveredValue: 104000,
    invoiceStatus: 'invoiced',
    invoiceId: 'INV-2202',
    invoiceDate: '2026-08-22',
    dueDate: '2026-09-06',
    paymentStatus: 'unpaid',
    hasCOA: true,
    hasPOD: true,
  },
  {
    id: 'BIL-9003',
    soId: 'SO-498',
    customer: 'Apex Automotive Components',
    deliveryNote: 'DN-8794',
    deliveryDate: '2026-08-14',
    deliveredQty: 8500,
    deliveredValue: 1147500,
    invoiceStatus: 'paid',
    invoiceId: 'INV-2195',
    invoiceDate: '2026-08-15',
    dueDate: '2026-09-29',
    paymentStatus: 'paid',
    hasCOA: true,
    hasPOD: true,
  },
  {
    id: 'BIL-9004',
    soId: 'SO-490',
    customer: 'UrbanHome Essentials',
    deliveryNote: 'DN-8750',
    deliveryDate: '2026-07-10',
    deliveredQty: 10000,
    deliveredValue: 95000,
    invoiceStatus: 'overdue',
    invoiceId: 'INV-2160',
    invoiceDate: '2026-07-11',
    dueDate: '2026-08-10',
    paymentStatus: 'overdue',
    hasCOA: true,
    hasPOD: false,
  },
];

// ----------------------------------------------------
// BACKORDERS & STOCK ALLOCATIONS
// ----------------------------------------------------
export const SALES_BACKORDERS: BackorderRecord[] = [
  {
    id: 'BO-401',
    soId: 'SO-501',
    customer: 'Metro Retail Distributors',
    item: 'FG-CTN-500',
    itemName: '500ml HDPE Dispenser Container',
    orderedQty: 10000,
    allocatedQty: 6000,
    shortageQty: 4000,
    uom: 'PCS',
    requestedDate: '2026-08-25',
    feasibleDate: '2026-08-31',
    supplySource: 'incoming_production',
    priority: 'High',
    status: 'awaiting_production',
    notes: 'Blow molding mold IMM-250T-03 scheduled on 28 Aug',
  },
  {
    id: 'BO-402',
    soId: 'SO-502',
    customer: 'GreenPack FMCG Pvt Ltd',
    item: 'FG-BKT-010',
    itemName: 'Household Bucket 10L',
    orderedQty: 2000,
    allocatedQty: 860,
    shortageQty: 1140,
    uom: 'PCS',
    requestedDate: '2026-08-27',
    feasibleDate: '2026-09-03',
    supplySource: 'available_stock',
    priority: 'Medium',
    status: 'open',
    notes: 'Blocked by credit hold; 860 PCS staged in FG-WH-01',
  },
  {
    id: 'BO-403',
    soId: 'SO-505',
    customer: 'Apex Automotive Components',
    item: 'RM-AB-060',
    itemName: 'ABS Heat Resistant Grade',
    orderedQty: 12000,
    allocatedQty: 9000,
    shortageQty: 3000,
    uom: 'KG',
    requestedDate: '2026-09-05',
    feasibleDate: '2026-09-04',
    supplySource: 'incoming_po',
    priority: 'Critical',
    status: 'awaiting_purchase',
    notes: 'PO-3393 delivery expected 02 Sep from Reliance Polymers',
  },
];

// ----------------------------------------------------
// SALES FORECAST VS ACTUAL DATA
// ----------------------------------------------------
export const SALES_FORECAST_DATA: SalesForecastRecord[] = [
  {
    id: 'FC-2026-08-01',
    customer: 'Metro Retail Distributors',
    item: 'FG-CTN-500 (HDPE Container 500ml)',
    category: 'Packaging',
    forecastMonth: 'August 2026',
    forecastQty: 25000,
    actualOrderQty: 28000,
    actualDeliveredQty: 24000,
    uom: 'PCS',
    varianceQty: 3000,
    variancePct: 12.0,
    accuracyPct: 88.0,
    status: 'Locked',
  },
  {
    id: 'FC-2026-08-02',
    customer: 'Bharat AgroTech Systems',
    item: 'FG-PET-030 (PET Preform 28g)',
    category: 'Finished Goods',
    forecastMonth: 'August 2026',
    forecastQty: 80000,
    actualOrderQty: 85000,
    actualDeliveredQty: 85000,
    uom: 'PCS',
    varianceQty: 5000,
    variancePct: 6.25,
    accuracyPct: 93.75,
    status: 'Locked',
  },
  {
    id: 'FC-2026-08-03',
    customer: 'Apex Automotive Components',
    item: 'RM-AB-060 (ABS Heat Resistant Compound)',
    category: 'Raw Resin',
    forecastMonth: 'August 2026',
    forecastQty: 20000,
    actualOrderQty: 18500,
    actualDeliveredQty: 18500,
    uom: 'KG',
    varianceQty: -1500,
    variancePct: -7.5,
    accuracyPct: 92.5,
    status: 'Locked',
  },
  {
    id: 'FC-2026-08-04',
    customer: 'GreenPack FMCG Pvt Ltd',
    item: 'FG-BKT-010 (10L Household Bucket)',
    category: 'Finished Goods',
    forecastMonth: 'August 2026',
    forecastQty: 10000,
    actualOrderQty: 6000,
    actualDeliveredQty: 4860,
    uom: 'PCS',
    varianceQty: -4000,
    variancePct: -40.0,
    accuracyPct: 60.0,
    status: 'Locked',
  },
  {
    id: 'FC-2026-09-01',
    customer: 'Metro Retail Distributors',
    item: 'FG-CTN-500 (HDPE Container 500ml)',
    category: 'Packaging',
    forecastMonth: 'September 2026',
    forecastQty: 30000,
    actualOrderQty: 12000,
    actualDeliveredQty: 0,
    uom: 'PCS',
    varianceQty: -18000,
    variancePct: -60.0,
    accuracyPct: 75.0,
    status: 'Approved',
  },
  {
    id: 'FC-2026-09-02',
    customer: 'Medix Pharma Containers',
    item: 'FG-CTN-500 (Pharma Grade 500ml)',
    category: 'Packaging',
    forecastMonth: 'September 2026',
    forecastQty: 50000,
    actualOrderQty: 25000,
    actualDeliveredQty: 0,
    uom: 'PCS',
    varianceQty: -25000,
    variancePct: -50.0,
    accuracyPct: 82.0,
    status: 'Approved',
  },
];

// ----------------------------------------------------
// CUSTOMER COMPLAINTS / NCR LINKAGES
// ----------------------------------------------------
export const CUSTOMER_COMPLAINTS: CustomerComplaint[] = [
  {
    id: 'CMP-2026-01',
    customer: 'Bharat AgroTech Systems',
    date: '2026-08-23',
    product: 'FG-PET-030 PET Preform 28g',
    batch: 'LOT-2026-A',
    issue: 'Neck crystallization and hazy preform wall in 1,200 pcs (Moisture in PET resin)',
    status: 'CAPA Initiated',
    ncrRef: 'NCR-2026-042',
  },
  {
    id: 'CMP-2026-02',
    customer: 'Metro Retail Distributors',
    date: '2026-08-21',
    product: 'FG-CTN-500 Container 500ml',
    batch: 'LOT-2026-B',
    issue: 'Crushed cartons on pallet bottom layer during third-party logistics transit',
    status: 'Resolved',
    ncrRef: 'NCR-2026-039',
  },
];
