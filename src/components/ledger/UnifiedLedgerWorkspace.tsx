// ============================================================================
// UNIFIED OPERATIONS-TO-LEDGER WORKSPACE: PRIMARY WORKBENCH CONTROLLER
// Seamless Integration across Stock, PO, GRN, QC, Dispatch, Invoicing, & General Ledger
// ============================================================================

import React, { useState } from 'react';
import {
  LedgerWorkspaceTab,
  GlobalWorkspaceContext,
  DocumentAccountingImpact,
  ExceptionItem,
} from '../../types/unifiedLedgerTypes';
import { mockExceptions } from '../../data/unifiedLedgerData';
import { UnifiedLedgerHeader } from './UnifiedLedgerHeader';
import { ControlTowerTab } from './ControlTowerTab';
import { StockLedgerTab } from './StockLedgerTab';
import { PurchaseOrderTab } from './PurchaseOrderTab';
import { GrnLedgerTab } from './GrnLedgerTab';
import { QcLedgerTab } from './QcLedgerTab';
import { DispatchLedgerTab } from './DispatchLedgerTab';
import { InvoiceLedgerTab } from './InvoiceLedgerTab';
import { AccountingLedgerTab } from './AccountingLedgerTab';
import { TraceabilityTab } from './TraceabilityTab';
import { ReconciliationTab } from './ReconciliationTab';
import { ExceptionsAuditTab } from './ExceptionsAuditTab';
import { AccountingImpactDrawer } from './AccountingImpactDrawer';
import { DocumentPreviewDrawer } from './DocumentPreviewDrawer';
import { ExceptionResolutionModal } from './ExceptionResolutionModal';
import { QuickActionModal } from './QuickActionModal';

export const UnifiedLedgerWorkspace: React.FC = () => {
  // Navigation & Context State
  const [activeTab, setActiveTab] = useState<LedgerWorkspaceTab>('controlTower');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [traceSearchTarget, setTraceSearchTarget] = useState<string>('PO-2026-0842');

  const [context, setContext] = useState<GlobalWorkspaceContext>({
    entity: 'Reboot Polymers Ltd',
    plantId: 'ALL',
    period: 'FY 2026-27 / P-06 (Sep 2026)',
    currency: 'INR',
    userRole: 'finance_manager',
    savedView: 'Operations Control',
  });

  // Exception State
  const [exceptions, setExceptions] = useState<ExceptionItem[]>(mockExceptions);
  const [selectedExceptionForModal, setSelectedExceptionForModal] = useState<ExceptionItem | null>(null);

  // Quick Action Modal State
  const [quickActionType, setQuickActionType] = useState<string | null>(null);

  // Accounting Impact Drawer State
  const [accountingImpactData, setAccountingImpactData] = useState<DocumentAccountingImpact | null>(null);
  const [isImpactDrawerOpen, setIsImpactDrawerOpen] = useState(false);

  // Document Preview Drawer State
  const [previewDocState, setPreviewDocState] = useState<{
    isOpen: boolean;
    docType: string;
    docNumber: string;
    data: any;
  }>({
    isOpen: false,
    docType: '',
    docNumber: '',
    data: null,
  });

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Handlers
  const handleOpenAccountingImpact = (impact: DocumentAccountingImpact) => {
    setAccountingImpactData(impact);
    setIsImpactDrawerOpen(true);
  };

  const handleOpenDocPreview = (docType: string, docNumber: string, data: any) => {
    setPreviewDocState({
      isOpen: true,
      docType,
      docNumber,
      data,
    });
  };

  const handleTraceDoc = (docNumber: string) => {
    setTraceSearchTarget(docNumber);
    setActiveTab('traceability');
  };

  const handleQuickAction = (action: string) => {
    if (action === 'run_recon') {
      setActiveTab('reconciliation');
    } else {
      setQuickActionType(action);
    }
  };

  const handleQuickActionSubmit = (actionType: string, formData: any) => {
    showToast(`Successfully created ${formData.docRef} with automatic GL accrual posting.`);
  };

  const handleResolveException = (id: string, actionName: string, notes: string) => {
    setExceptions((prev) => prev.filter((e) => e.id !== id));
    showToast(`Exception [${id}] successfully resolved via ${actionName}. Audit trail updated.`);
  };

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col">
      {/* Universal Workspace Header */}
      <UnifiedLedgerHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        context={context}
        onContextChange={(newCtx) => setContext((prev) => ({ ...prev, ...newCtx }))}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onQuickAction={handleQuickAction}
        openExceptionsCount={exceptions.length}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6">
        {activeTab === 'controlTower' && (
          <ControlTowerTab
            onNavigateTab={(tab) => setActiveTab(tab)}
            exceptions={exceptions}
            onOpenExceptionModal={(exc) => setSelectedExceptionForModal(exc)}
            onOpenAccountingImpact={(type, num) => {
              handleOpenAccountingImpact({
                documentType: type as any,
                documentNumber: num,
                postingDate: '2026-09-14',
                status: 'Posted',
                totalDebit: 1250000,
                totalCredit: 1250000,
                lines: [
                  {
                    id: 'act-sample-1',
                    lineNo: 1,
                    accountCode: '1310-00',
                    accountName: 'Inventory Physical Stock Asset',
                    accountType: 'Asset',
                    debit: 1250000,
                    credit: 0,
                  },
                  {
                    id: 'act-sample-2',
                    lineNo: 2,
                    accountCode: '2120-00',
                    accountName: 'GRNI Clearing Accrual',
                    accountType: 'Liability',
                    debit: 0,
                    credit: 1250000,
                  },
                ],
              });
            }}
          />
        )}

        {activeTab === 'stock' && (
          <StockLedgerTab
            onOpenAccountingImpact={handleOpenAccountingImpact}
            onOpenDocPreview={handleOpenDocPreview}
            onTraceDoc={handleTraceDoc}
          />
        )}

        {activeTab === 'purchaseOrder' && (
          <PurchaseOrderTab
            onOpenAccountingImpact={handleOpenAccountingImpact}
            onOpenDocPreview={handleOpenDocPreview}
            onTraceDoc={handleTraceDoc}
          />
        )}

        {activeTab === 'grn' && (
          <GrnLedgerTab
            onOpenAccountingImpact={handleOpenAccountingImpact}
            onOpenDocPreview={handleOpenDocPreview}
            onTraceDoc={handleTraceDoc}
            onNavigateToQc={(qcId) => setActiveTab('qc')}
          />
        )}

        {activeTab === 'qc' && (
          <QcLedgerTab
            onOpenDocPreview={handleOpenDocPreview}
            onTraceDoc={handleTraceDoc}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'dispatch' && (
          <DispatchLedgerTab
            onOpenAccountingImpact={handleOpenAccountingImpact}
            onOpenDocPreview={handleOpenDocPreview}
            onTraceDoc={handleTraceDoc}
          />
        )}

        {activeTab === 'invoiceLedger' && (
          <InvoiceLedgerTab
            onOpenAccountingImpact={handleOpenAccountingImpact}
            onOpenDocPreview={handleOpenDocPreview}
            onTraceDoc={handleTraceDoc}
          />
        )}

        {activeTab === 'accountingLedger' && (
          <AccountingLedgerTab
            onOpenAccountingImpact={handleOpenAccountingImpact}
            onOpenDocPreview={handleOpenDocPreview}
            onTraceDoc={handleTraceDoc}
          />
        )}

        {activeTab === 'traceability' && (
          <TraceabilityTab
            onOpenAccountingImpact={handleOpenAccountingImpact}
            onOpenDocPreview={handleOpenDocPreview}
            selectedIdentifier={traceSearchTarget}
          />
        )}

        {activeTab === 'reconciliation' && (
          <ReconciliationTab
            onShowToast={showToast}
            onOpenDocPreview={handleOpenDocPreview}
          />
        )}

        {activeTab === 'exceptions' && (
          <ExceptionsAuditTab
            exceptions={exceptions}
            onOpenExceptionModal={(exc) => setSelectedExceptionForModal(exc)}
            onTraceDoc={handleTraceDoc}
            onShowToast={showToast}
          />
        )}
      </div>

      {/* Accounting Impact Drawer */}
      <AccountingImpactDrawer
        isOpen={isImpactDrawerOpen}
        onClose={() => setIsImpactDrawerOpen(false)}
        impact={accountingImpactData}
        onOpenTraceDoc={handleTraceDoc}
      />

      {/* Document Drill-down Preview Drawer */}
      <DocumentPreviewDrawer
        isOpen={previewDocState.isOpen}
        onClose={() => setPreviewDocState((prev) => ({ ...prev, isOpen: false }))}
        docType={previewDocState.docType}
        docNumber={previewDocState.docNumber}
        data={previewDocState.data}
        onOpenAccountingImpact={handleOpenAccountingImpact}
        onOpenTrace={handleTraceDoc}
      />

      {/* Exception Resolution Modal */}
      <ExceptionResolutionModal
        exception={selectedExceptionForModal}
        onClose={() => setSelectedExceptionForModal(null)}
        onResolve={handleResolveException}
      />

      {/* Quick Action Modal */}
      <QuickActionModal
        actionType={quickActionType}
        onClose={() => setQuickActionType(null)}
        onSubmit={handleQuickActionSubmit}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200 border border-slate-700 dark:border-slate-300">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white dark:hover:text-slate-900 ml-2"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
