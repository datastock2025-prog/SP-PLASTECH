import React from 'react';
import {
  Account,
  JournalEntry,
  CostCenter,
  CustomerInvoice,
  SupplierInvoice,
  FixedAsset,
  Customer,
  Supplier,
  PurchaseOrder,
  ProductionVariance,
} from '../types';
import { FinanceDashboardView } from './finance/FinanceDashboardView';
import { ChartOfAccountsView } from './finance/ChartOfAccountsView';
import { JournalEntriesView } from './finance/JournalEntriesView';
import { AccountsPayableDashView } from './finance/AccountsPayableDashView';
import { AccountsReceivableDashView } from './finance/AccountsReceivableDashView';
import { CustomerInvoicesView } from './finance/CustomerInvoicesView';
import { CostCentersView } from './finance/CostCentersView';
import { ProductCostingView } from './finance/ProductCostingView';
import { ProductionVarianceView } from './finance/ProductionVarianceView';
import { PeriodCloseView } from './finance/PeriodCloseView';
import { FixedAssetsView } from './finance/FixedAssetsView';
import { UnifiedLedgerWorkspace } from './ledger/UnifiedLedgerWorkspace';
import { useAccounts, useJournalEntries } from '../hooks/useFinance';

interface FinanceProps {
  view: string;
  accounts: Account[];
  journalEntries: JournalEntry[];
  costCenters: CostCenter[];
  invoices?: any[];
  supplierInvoices?: SupplierInvoice[];
  fixedAssets?: FixedAsset[];
  customers?: Customer[];
  suppliers?: Supplier[];
  purchaseOrders?: PurchaseOrder[];
  variances?: ProductionVariance[];
  selectedId?: string;
  onNavigate: (view: string, param?: any) => void;
  onUpdateAccount: (acc: Account) => void;
  onCreateAccount?: (acc: Account) => void;
  onCreateJE: (je: JournalEntry) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  openConfirm: (title: string, message: string, onConfirm: () => void) => void;
  showToast: (msg: string) => void;
}

export const FinanceViews: React.FC<FinanceProps> = ({
  view,
  accounts,
  journalEntries,
  costCenters,
  invoices = [],
  supplierInvoices,
  fixedAssets,
  customers = [],
  suppliers = [],
  purchaseOrders = [],
  variances,
  selectedId,
  onNavigate,
  onUpdateAccount,
  onCreateAccount,
  onCreateJE,
  openDrawer,
  closeDrawer,
  openConfirm,
  showToast,
}) => {
  // TanStack Query SSOT (Rule 1 & Rule 3)
  const { data: queryAccounts } = useAccounts();
  const { data: queryJournalEntries } = useJournalEntries();

  const effectiveAccounts = (accounts && accounts.length > 0 ? accounts : queryAccounts) || [];
  const effectiveJournalEntries = (journalEntries && journalEntries.length > 0 ? journalEntries : queryJournalEntries) || [];

  switch (view) {
    case 'financeDash':
      return (
        <FinanceDashboardView
          accounts={effectiveAccounts}
          journalEntries={effectiveJournalEntries}
          costCenters={costCenters}
          invoices={invoices as any}
          supplierInvoices={supplierInvoices}
          customers={customers}
          onNavigate={onNavigate}
          openDrawer={openDrawer}
          closeDrawer={closeDrawer}
          showToast={showToast}
        />
      );

    case 'coaList':
      return (
        <ChartOfAccountsView
          accounts={effectiveAccounts}
          journalEntries={effectiveJournalEntries}
          onUpdateAccount={onUpdateAccount}
          onCreateAccount={onCreateAccount}
          openDrawer={openDrawer}
          closeDrawer={closeDrawer}
          showToast={showToast}
        />
      );

    case 'jeList':
    case 'jeDetail':
    case 'jeCreate':
      return (
        <JournalEntriesView
          journalEntries={effectiveJournalEntries}
          accounts={effectiveAccounts}
          costCenters={costCenters}
          onCreateJE={onCreateJE}
          openDrawer={openDrawer}
          closeDrawer={closeDrawer}
          showToast={showToast}
        />
      );

    case 'apDash':
    case 'apMatch':
    case 'paymentRun':
      return (
        <AccountsPayableDashView
          supplierInvoices={supplierInvoices}
          suppliers={suppliers}
          purchaseOrders={purchaseOrders}
          onCreateJE={onCreateJE}
          openDrawer={openDrawer}
          closeDrawer={closeDrawer}
          showToast={showToast}
        />
      );

    case 'arDash':
    case 'arCollections':
      return (
        <AccountsReceivableDashView
          invoices={invoices as any}
          customers={customers}
          onCreateJE={onCreateJE}
          openDrawer={openDrawer}
          closeDrawer={closeDrawer}
          showToast={showToast}
        />
      );

    case 'invoiceList':
    case 'invoiceDetail':
      return (
        <CustomerInvoicesView
          invoices={invoices as any}
          customers={customers}
          openDrawer={openDrawer}
          closeDrawer={closeDrawer}
          showToast={showToast}
        />
      );

    case 'costCenterList':
    case 'costCenterDetail':
      return (
        <CostCentersView
          costCenters={costCenters}
          accounts={effectiveAccounts}
          openDrawer={openDrawer}
          closeDrawer={closeDrawer}
          showToast={showToast}
        />
      );

    case 'productCosting':
      return (
        <ProductCostingView
          onNavigate={onNavigate}
          openDrawer={openDrawer}
          closeDrawer={closeDrawer}
          showToast={showToast}
        />
      );

    case 'varianceAnalysis':
      return (
        <ProductionVarianceView
          variances={variances}
          onCreateJE={onCreateJE}
          openDrawer={openDrawer}
          closeDrawer={closeDrawer}
          showToast={showToast}
        />
      );

    case 'periodClose':
      return (
        <PeriodCloseView
          accounts={accounts}
          journalEntries={journalEntries}
          onCreateJE={onCreateJE}
          openDrawer={openDrawer}
          closeDrawer={closeDrawer}
          showToast={showToast}
        />
      );

    case 'assetList':
    case 'assetDetail':
      return (
        <FixedAssetsView
          fixedAssets={fixedAssets}
          onCreateJE={onCreateJE}
          openDrawer={openDrawer}
          closeDrawer={closeDrawer}
          showToast={showToast}
        />
      );

    case 'unifiedLedger':
    case 'operationsLedger':
    case 'ledgerWorkspace':
    case 'controlTower':
      return <UnifiedLedgerWorkspace />;

    default:
      return (
        <FinanceDashboardView
          accounts={accounts}
          journalEntries={journalEntries}
          costCenters={costCenters}
          invoices={invoices as any}
          supplierInvoices={supplierInvoices}
          customers={customers}
          onNavigate={onNavigate}
          openDrawer={openDrawer}
          closeDrawer={closeDrawer}
          showToast={showToast}
        />
      );
  }
};
