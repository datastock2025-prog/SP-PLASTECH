// ============================================================================
// DOMAIN MODULE: FINANCE & COST ACCOUNTING
// Modular Monolithic Architecture — Reboot ERP
// ============================================================================

export {
  FinanceViews,
  useFinance,
  useAccounts,
  useSaveAccount,
  useJournalEntries,
  useSaveJournalEntry,
  financeApi,
  financeRoutes,
  FinanceDashboardView,
  ChartOfAccountsView,
  JournalEntriesView,
  AccountsPayableDashView,
  AccountsReceivableDashView,
  CustomerInvoicesView,
  CostCentersView,
  ProductCostingView,
  ProductionVarianceView,
  PeriodCloseView,
  FixedAssetsView,
  UnifiedLedgerWorkspace,
} from '../../../apps/web/src/modules/finance';

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
