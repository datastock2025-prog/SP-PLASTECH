// ============================================================================
// FINANCE MODULE: PUBLIC API
// Modular Monolithic Architecture — apps/web/src/modules/finance/index.ts
// ============================================================================

export { FinanceViews } from './screens/FinanceViews';

export {
  useFinance,
  useAccounts,
  useSaveAccount,
  useJournalEntries,
  useSaveJournalEntry,
} from './api/useFinance';

export { financeApi } from './api/financeApi';
export { financeRoutes } from './routes';

export {
  AccountSchema,
  CreateAccountInputSchema,
  UpdateAccountInputSchema,
  JournalEntryLineSchema,
  JournalEntrySchema,
  CreateJournalEntryInputSchema,
  CostCenterSchema,
  FixedAssetSchema,
  journalEntryFormSchema,
} from './model/financeSchemas';

export type {
  AccountContract,
  CreateAccountContract,
  UpdateAccountContract,
  JournalEntryLineContract,
  JournalEntryContract,
  CreateJournalEntryContract,
  CostCenterContract,
  FixedAssetContract,
  JournalEntryFormValues,
  Account,
  JournalEntry,
} from './model/financeSchemas';

// Core finance & ledger Sub-components
export { FinanceDashboardView } from './components/FinanceDashboardView';
export { ChartOfAccountsView } from './components/ChartOfAccountsView';
export { JournalEntriesView } from './components/JournalEntriesView';
export { AccountsPayableDashView } from './components/AccountsPayableDashView';
export { AccountsReceivableDashView } from './components/AccountsReceivableDashView';
export { CustomerInvoicesView } from './components/CustomerInvoicesView';
export { CostCentersView } from './components/CostCentersView';
export { ProductCostingView } from './components/ProductCostingView';
export { ProductionVarianceView } from './components/ProductionVarianceView';
export { PeriodCloseView } from './components/PeriodCloseView';
export { FixedAssetsView } from './components/FixedAssetsView';
export { UnifiedLedgerWorkspace } from './components/ledger/UnifiedLedgerWorkspace';
