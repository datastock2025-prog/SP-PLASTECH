// ============================================================================
// DOMAIN MODULE: PROCUREMENT & SUPPLIER SOURCING
// Modular Monolithic Architecture — Reboot ERP
// ============================================================================

export { ProcurementViews } from '../../components/ProcurementViews';
export { initialPurchaseOrders } from '../../data/initialData';
export {
  INITIAL_PROCUREMENT_SUPPLIERS,
  INITIAL_PURCHASE_REQUISITIONS,
  INITIAL_PROCUREMENT_RFQS,
  INITIAL_QUOTATION_COMPARISONS,
  INITIAL_EXTENDED_POS,
  INITIAL_PROCUREMENT_GRNS,
  INITIAL_SUPPLIER_INVOICES,
  INITIAL_PROCUREMENT_RETURNS,
  INITIAL_PROCUREMENT_CONTRACTS,
  INITIAL_SUPPLIER_PRICE_LISTS,
  INITIAL_MRP_SUGGESTIONS,
  INITIAL_SUPPLIER_RISKS,
  PROCUREMENT_SPEND_BY_CATEGORY,
  PROCUREMENT_MONTHLY_SPEND_TREND,
} from '../../data/procurementData';

export type {
  SupplierMaster,
  PurchaseRequisition,
  RequestForQuotation,
  QuotationComparisonSession,
  ExtendedPurchaseOrder,
  GoodsReceiptNote,
  SupplierInvoiceRecord,
  SupplierReturnRecord,
  SupplierContractRecord,
  SupplierPriceListEntry,
  MrpPurchaseSuggestion,
  SupplierRiskItem,
} from '../../types/procurement';
