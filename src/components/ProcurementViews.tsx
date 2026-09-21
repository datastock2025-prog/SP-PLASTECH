import React, { useState } from 'react';
import {
  SupplierMaster,
  PurchaseRequisition,
  RequestForQuotation,
  ExtendedPurchaseOrder,
  GoodsReceiptNote,
  SupplierInvoiceRecord,
  MrpPurchaseSuggestion,
  SupplierReturnRecord,
  SupplierContractRecord,
  SupplierPriceListEntry,
  SupplierRiskItem,
} from '../types/procurement';

import {
  INITIAL_PROCUREMENT_SUPPLIERS,
  INITIAL_PURCHASE_REQUISITIONS,
  INITIAL_PROCUREMENT_RFQS,
  INITIAL_EXTENDED_POS,
  INITIAL_PROCUREMENT_GRNS,
  INITIAL_SUPPLIER_INVOICES,
  INITIAL_PROCUREMENT_RETURNS,
  INITIAL_PROCUREMENT_CONTRACTS,
  INITIAL_SUPPLIER_PRICE_LISTS,
  INITIAL_MRP_SUGGESTIONS,
  INITIAL_SUPPLIER_RISKS,
} from '../data/procurementData';

// Subviews
import { ProcurementDashboardView } from './procurement/ProcurementDashboardView';
import { SupplierMasterListView } from './procurement/SupplierMasterListView';
import { SupplierDetailView } from './procurement/SupplierDetailView';
import { PurchaseRequisitionListView } from './procurement/PurchaseRequisitionListView';
import { PurchaseRequisitionFormView } from './procurement/PurchaseRequisitionFormView';
import { RfqManagementView } from './procurement/RfqManagementView';
import { SupplierQuotationComparisonView } from './procurement/SupplierQuotationComparisonView';
import { PurchaseOrderListView } from './procurement/PurchaseOrderListView';
import { PurchaseOrderDetailView } from './procurement/PurchaseOrderDetailView';
import { PurchaseOrderPrintView } from './procurement/PurchaseOrderPrintView';
import { PurchaseApprovalWorkflowView } from './procurement/PurchaseApprovalWorkflowView';
import { GoodsReceiptNoteView } from './procurement/GoodsReceiptNoteView';
import { SupplierInvoiceManagementView } from './procurement/SupplierInvoiceManagementView';
import { ProcurementPlanningMrpView } from './procurement/ProcurementPlanningMrpView';
import { SupplierPerformanceScorecardView } from './procurement/SupplierPerformanceScorecardView';
import { SupplierContractManagementView } from './procurement/SupplierContractManagementView';
import { SupplierPriceListView } from './procurement/SupplierPriceListView';
import { PurchaseReturnsView } from './procurement/PurchaseReturnsView';
import { SupplierRiskComplianceView } from './procurement/SupplierRiskComplianceView';
import { ProcurementReportsAnalyticsView } from './procurement/ProcurementReportsAnalyticsView';
import { ProcurementSettingsView } from './procurement/ProcurementSettingsView';

import { ItemMaster } from '../types';
import { INITIAL_ITEMS } from '../data/initialData';

interface Props {
  view?: string;
  currentSubView?: string;
  viewParams?: any;
  selectedParam?: any;
  items?: ItemMaster[];
  suppliers?: SupplierMaster[];
  prs?: PurchaseRequisition[];
  rfqs?: RequestForQuotation[];
  pos?: ExtendedPurchaseOrder[];
  grns?: GoodsReceiptNote[];
  invoices?: SupplierInvoiceRecord[];
  mrpSuggestions?: MrpPurchaseSuggestion[];
  onNavigate: (view: string, param?: any) => void;
  onUpdateItem?: (item: ItemMaster) => void;
  onUpdateSupplier?: (s: SupplierMaster) => void;
  onCreateSupplier?: (s: SupplierMaster) => void;
  onUpdatePR?: (pr: PurchaseRequisition) => void;
  onCreatePR?: (pr: PurchaseRequisition) => void;
  onUpdateRFQ?: (rfq: RequestForQuotation) => void;
  onCreatePO?: (po: ExtendedPurchaseOrder) => void;
  onUpdatePO?: (po: ExtendedPurchaseOrder) => void;
  onUpdateGRN?: (grn: GoodsReceiptNote) => void;
  onUpdateInvoice?: (inv: SupplierInvoiceRecord) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  openConfirm?: (options: any) => void;
  showToast: (msg: string) => void;
}

export const ProcurementViews: React.FC<Props> = ({
  view,
  currentSubView,
  viewParams,
  selectedParam,
  items: propItems,
  suppliers: propSuppliers,
  prs: propPrs,
  rfqs: propRfqs,
  pos: propPos,
  grns: propGrns,
  invoices: propInvoices,
  mrpSuggestions: propMrpSuggestions,
  onNavigate,
  onUpdateItem: propOnUpdateItem,
  onUpdateSupplier: propOnUpdateSupplier,
  onCreateSupplier: propOnCreateSupplier,
  onUpdatePR: propOnUpdatePR,
  onCreatePR: propOnCreatePR,
  onUpdateRFQ: propOnUpdateRFQ,
  onCreatePO: propOnCreatePO,
  onUpdatePO: propOnUpdatePO,
  onUpdateGRN: propOnUpdateGRN,
  onUpdateInvoice: propOnUpdateInvoice,
  openDrawer,
  closeDrawer,
  showToast,
}) => {
  // Determine active view & param supporting both naming conventions
  const activeView = view || currentSubView || 'procurementDash';
  const activeParam = viewParams || selectedParam;

  // Local state for full interactive procurement lifecycle
  const [items, setItems] = useState<ItemMaster[]>(propItems || INITIAL_ITEMS);
  const [suppliers, setSuppliers] = useState<SupplierMaster[]>(propSuppliers || INITIAL_PROCUREMENT_SUPPLIERS);
  const [prs, setPrs] = useState<PurchaseRequisition[]>(propPrs || INITIAL_PURCHASE_REQUISITIONS);
  const [rfqs, setRfqs] = useState<RequestForQuotation[]>(propRfqs || INITIAL_PROCUREMENT_RFQS);
  const [pos, setPos] = useState<ExtendedPurchaseOrder[]>(propPos || INITIAL_EXTENDED_POS);
  const [grns, setGrns] = useState<GoodsReceiptNote[]>(propGrns || INITIAL_PROCUREMENT_GRNS);
  const [invoices, setInvoices] = useState<SupplierInvoiceRecord[]>(propInvoices || INITIAL_SUPPLIER_INVOICES);
  const [returns, setReturns] = useState<SupplierReturnRecord[]>(INITIAL_PROCUREMENT_RETURNS);
  const [contracts] = useState<SupplierContractRecord[]>(INITIAL_PROCUREMENT_CONTRACTS);
  const [priceLists, setPriceLists] = useState<SupplierPriceListEntry[]>(INITIAL_SUPPLIER_PRICE_LISTS);
  const [mrpSuggestions] = useState<MrpPurchaseSuggestion[]>(propMrpSuggestions || INITIAL_MRP_SUGGESTIONS);
  const [risks] = useState<SupplierRiskItem[]>(INITIAL_SUPPLIER_RISKS);

  // Updaters with optional prop delegators
  const handleUpdateItem = (updated: ItemMaster) => {
    setItems((prev) => prev.map((i) => (i.code === updated.code ? updated : i)));
    propOnUpdateItem?.(updated);
  };

  const handleUpdateSupplier = (updated: SupplierMaster) => {
    setSuppliers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    propOnUpdateSupplier?.(updated);
  };

  const handleCreateSupplier = (created: SupplierMaster) => {
    setSuppliers((prev) => [created, ...prev]);
    propOnCreateSupplier?.(created);
  };

  const handleUpdatePR = (updated: PurchaseRequisition) => {
    setPrs((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    propOnUpdatePR?.(updated);
  };

  const handleCreatePR = (created: PurchaseRequisition) => {
    setPrs((prev) => [created, ...prev]);
    propOnCreatePR?.(created);
  };

  const handleUpdateRFQ = (updated: RequestForQuotation) => {
    setRfqs((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    propOnUpdateRFQ?.(updated);
  };

  const handleUpdatePO = (updated: ExtendedPurchaseOrder) => {
    setPos((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    propOnUpdatePO?.(updated);
  };

  const handleCreatePO = (created: ExtendedPurchaseOrder) => {
    setPos((prev) => [created, ...prev]);
    propOnCreatePO?.(created);
  };

  const handleUpdateGRN = (updated: GoodsReceiptNote) => {
    setGrns((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    propOnUpdateGRN?.(updated);
  };

  const handleUpdateInvoice = (updated: SupplierInvoiceRecord) => {
    setInvoices((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    propOnUpdateInvoice?.(updated);
  };

  const handleUpdateReturn = (updated: SupplierReturnRecord) => {
    setReturns((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const handleCreateReturn = (created: SupplierReturnRecord) => {
    setReturns((prev) => [created, ...prev]);
  };

  const handleUpdatePriceList = (updated: SupplierPriceListEntry) => {
    setPriceLists((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleCreatePriceList = (created: SupplierPriceListEntry) => {
    setPriceLists((prev) => [created, ...prev]);
  };

  // View Router mapping all alias variations
  switch (activeView) {
    case 'supplierList':
    case 'suppliers':
    case 'supplierMaster':
      return (
        <SupplierMasterListView
          suppliers={suppliers}
          activeParam={activeParam}
          onNavigate={onNavigate}
          onUpdateSupplier={handleUpdateSupplier}
          onCreateSupplier={handleCreateSupplier}
          openDrawer={openDrawer}
          closeDrawer={closeDrawer}
          showToast={showToast}
        />
      );

    case 'supplierDetail':
    case 'supplierView':
      return (
        <SupplierDetailView
          supplierId={activeParam?.id || suppliers[0]?.id || 'SUP-001'}
          suppliers={suppliers}
          pos={pos}
          grns={grns}
          invoices={invoices}
          returns={returns}
          onNavigate={onNavigate}
          onUpdateSupplier={handleUpdateSupplier}
          openDrawer={openDrawer}
          closeDrawer={closeDrawer}
          showToast={showToast}
        />
      );

    case 'purchaseReqList':
    case 'prList':
    case 'requisitions':
    case 'purchaseRequisitions':
      return (
        <PurchaseRequisitionListView
          prs={prs}
          onNavigate={onNavigate}
          onUpdatePR={handleUpdatePR}
          showToast={showToast}
        />
      );

    case 'purchaseReqForm':
    case 'prDetail':
    case 'prCreate':
    case 'newPR':
    case 'purchaseRequisitionForm':
      return (
        <PurchaseRequisitionFormView
          prId={activeParam?.id}
          prs={prs}
          suppliers={suppliers}
          onNavigate={onNavigate}
          onSavePR={(savedPR) => {
            const exists = prs.some((p) => p.id === savedPR.id);
            if (exists) {
              handleUpdatePR(savedPR);
            } else {
              handleCreatePR(savedPR);
            }
          }}
          showToast={showToast}
        />
      );

    case 'rfqList':
    case 'rfqs':
    case 'requestForQuotation':
      return (
        <RfqManagementView
          rfqs={rfqs}
          suppliers={suppliers}
          onNavigate={onNavigate}
          onUpdateRFQ={handleUpdateRFQ}
          openDrawer={openDrawer}
          closeDrawer={closeDrawer}
          showToast={showToast}
        />
      );

    case 'rfqCompare':
    case 'rfqComparison':
    case 'quotationComparison':
      return (
        <SupplierQuotationComparisonView
          rfqNumber={activeParam?.rfqNumber || rfqs[0]?.rfqNumber || 'RFQ-2026-018'}
          rfqs={rfqs}
          onNavigate={onNavigate}
          onCreatePO={handleCreatePO}
          showToast={showToast}
        />
      );

    case 'poCreate':
    case 'newPO':
    case 'poList':
    case 'pos':
    case 'purchaseOrders':
      return (
        <PurchaseOrderListView
          pos={pos}
          suppliers={suppliers}
          items={items}
          prs={prs}
          activeParam={activeParam || (activeView === 'poCreate' || activeView === 'newPO' ? { openCreateModal: true } : undefined)}
          onNavigate={onNavigate}
          onUpdatePO={handleUpdatePO}
          onCreatePO={handleCreatePO}
          onUpdatePR={handleUpdatePR}
          openDrawer={openDrawer}
          closeDrawer={closeDrawer}
          showToast={showToast}
        />
      );

    case 'poDetail':
    case 'purchaseOrderDetail':
      return (
        <PurchaseOrderDetailView
          poId={activeParam?.id || activeParam?.poNumber || (typeof activeParam === 'string' ? activeParam : undefined) || pos[0]?.id || 'PO-2026-001'}
          pos={pos}
          grns={grns}
          invoices={invoices}
          onNavigate={onNavigate}
          onUpdatePO={handleUpdatePO}
          showToast={showToast}
        />
      );

    case 'poPrint':
    case 'purchaseOrderPrint':
      return (
        <PurchaseOrderPrintView
          poId={activeParam?.id || activeParam?.poNumber || (typeof activeParam === 'string' ? activeParam : undefined) || pos[0]?.id || 'PO-2026-001'}
          pos={pos}
          onNavigate={onNavigate}
        />
      );

    case 'poApprovals':
    case 'procApprovals':
    case 'procApprovalQueue':
    case 'approvalWorkflow':
    case 'approvals':
      return (
        <PurchaseApprovalWorkflowView
          prs={prs}
          pos={pos}
          suppliers={suppliers}
          onNavigate={onNavigate}
          onUpdatePR={handleUpdatePR}
          onUpdatePO={handleUpdatePO}
          showToast={showToast}
        />
      );

    case 'grnList':
    case 'grns':
    case 'goodsReceipt':
    case 'goodsReceiptNote':
      return (
        <GoodsReceiptNoteView
          grns={grns}
          pos={pos}
          items={items}
          onNavigate={onNavigate}
          onUpdateGRN={handleUpdateGRN}
          onUpdatePO={handleUpdatePO}
          onUpdateItem={handleUpdateItem}
          openDrawer={openDrawer}
          closeDrawer={closeDrawer}
          showToast={showToast}
        />
      );

    case 'supplierInvoices':
    case 'invoiceMatching':
    case 'supplierInvoiceList':
    case 'invoices':
      return (
        <SupplierInvoiceManagementView
          invoices={invoices}
          pos={pos}
          onNavigate={onNavigate}
          onUpdateInvoice={handleUpdateInvoice}
          showToast={showToast}
        />
      );

    case 'procurementMrp':
    case 'procMrp':
    case 'mrpSuggestions':
    case 'mrpPlanning':
      return (
        <ProcurementPlanningMrpView
          mrpSuggestions={mrpSuggestions}
          onNavigate={onNavigate}
          showToast={showToast}
        />
      );

    case 'supplierScorecard':
    case 'supplierScorecards':
    case 'vendorScorecard':
      return (
        <SupplierPerformanceScorecardView
          suppliers={suppliers}
          onNavigate={onNavigate}
          showToast={showToast}
        />
      );

    case 'supplierContracts':
    case 'contracts':
    case 'blanketOrders':
      return (
        <SupplierContractManagementView
          contracts={contracts}
          onNavigate={onNavigate}
          showToast={showToast}
        />
      );

    case 'supplierPriceList':
    case 'supplierPriceLists':
    case 'priceLists':
    case 'priceIndex':
      return (
        <SupplierPriceListView
          priceLists={priceLists}
          suppliers={suppliers}
          items={items}
          onNavigate={onNavigate}
          onUpdatePriceList={handleUpdatePriceList}
          onCreatePriceList={handleCreatePriceList}
          showToast={showToast}
        />
      );

    case 'purchaseReturns':
    case 'debitNotes':
    case 'returns':
      return (
        <PurchaseReturnsView
          returns={returns}
          suppliers={suppliers}
          pos={pos}
          grns={grns}
          onNavigate={onNavigate}
          onUpdateReturn={handleUpdateReturn}
          onCreateReturn={handleCreateReturn}
          showToast={showToast}
        />
      );

    case 'supplierRisk':
    case 'supplierRiskCompliance':
    case 'procRiskCompliance':
    case 'vendorRisk':
      return (
        <SupplierRiskComplianceView
          suppliers={suppliers}
          onNavigate={onNavigate}
          showToast={showToast}
        />
      );

    case 'procurementReports':
    case 'procReports':
    case 'procAnalytics':
    case 'spendReports':
      return (
        <ProcurementReportsAnalyticsView
          pos={pos}
          suppliers={suppliers}
          showToast={showToast}
        />
      );

    case 'procurementSettings':
    case 'procSettings':
    case 'procurementConfig':
      return <ProcurementSettingsView showToast={showToast} />;

    case 'procurement':
    case 'procurementDash':
    case 'procDashboard':
    case 'procurementDashboard':
    case 'procurementHub':
    case 'procHub':
    default:
      return (
        <ProcurementDashboardView
          suppliers={suppliers}
          prs={prs}
          rfqs={rfqs}
          pos={pos}
          grns={grns}
          invoices={invoices}
          mrpSuggestions={mrpSuggestions}
          risks={risks}
          onNavigate={onNavigate}
          openDrawer={openDrawer}
          closeDrawer={closeDrawer}
          showToast={showToast}
        />
      );
  }
};
