// ============================================================================
// DOMAIN MODULE: FINANCE & COST ACCOUNTING
// Modular Monolithic Architecture — Reboot ERP
// ============================================================================

export { FinanceViews } from '../../components/FinanceViews';
export {
  initialAccounts,
  initialJournalEntries,
  initialCostCenters,
} from '../../data/initialData';

export type {
  Account,
  JournalEntry,
  CostCenter,
  FixedAsset,
  ProductionVariance,
  CustomerInvoice,
  SupplierInvoice,
} from '../../types';
