import React, { useState, useEffect } from 'react';
import {
  SalesOrder,
  SalesQuotation,
  Customer,
  ReturnMerchandise,
  SalesContract,
} from '../types';
import { SalesDashboardView } from './sales/SalesDashboardView';
import { SalesQuotationListView } from './sales/SalesQuotationListView';
import { QuotationDetailView } from './sales/QuotationDetailView';
import { SalesOrderListView } from './sales/SalesOrderListView';
import { SalesOrderDetailView } from './sales/SalesOrderDetailView';
import { SalesOrderConfirmationView } from './sales/SalesOrderConfirmationView';
import { SalesPricingMatrixView } from './sales/SalesPricingMatrixView';
import { SalesDeliveryScheduleView } from './sales/SalesDeliveryScheduleView';
import { CustomerCreditControlView } from './sales/CustomerCreditControlView';
import { SalesBillingStatusView } from './sales/SalesBillingStatusView';
import { CustomerReturnsRMAView } from './sales/CustomerReturnsRMAView';
import { SalesOrderTrackingTimelineView } from './sales/SalesOrderTrackingTimelineView';
import { SalesBackordersAndForecastsView } from './sales/SalesBackordersAndForecastsView';
import { SalesContractListView } from './sales/SalesContractListView';
import { CustomerMasterListView } from './sales/CustomerMasterListView';
import { CustomerDetailView } from './sales/CustomerDetailView';

// Redesigned Indian ERP Compliance Modules
import { SalesOrderDashboard } from './sales/redesign/SalesOrderDashboard';
import { SalesOrderList } from './sales/redesign/SalesOrderList';
import { SalesOrderWizard } from './sales/redesign/SalesOrderWizard';
import { SalesOrderDetail } from './sales/redesign/SalesOrderDetail';
import { MonthlyPlanOrdersView } from './sales/redesign/MonthlyPlanOrdersView';
import { DailyOrderQuickEntry } from './sales/redesign/DailyOrderQuickEntry';
import { MonthlyDailyReconciliation } from './sales/redesign/MonthlyDailyReconciliation';
import { FgStockModal } from './sales/redesign/FgStockModal';

import { DispatchDashboard } from './dispatch/DispatchDashboard';
import { DeliveryChallanManagement } from './dispatch/DeliveryChallanManagement';
import { CreateDeliveryChallan } from './dispatch/CreateDeliveryChallan';
import { DeliveryChallanDetail } from './dispatch/DeliveryChallanDetail';
import { GatePassVerification } from './dispatch/GatePassVerification';
import { EWayBillManagement } from './dispatch/EWayBillManagement';
import { EInvoiceManagement } from './dispatch/EInvoiceManagement';
import { ComplianceExceptionsDashboard } from './compliance/ComplianceExceptionsDashboard';

import {
  INITIAL_PLASTIC_SALES_ORDERS,
  INITIAL_MONTHLY_PLANS,
  INITIAL_ORDER_RELATIONSHIPS,
  INITIAL_DELIVERY_NOTES,
  INITIAL_FG_BATCHES,
  INITIAL_E_INVOICES,
  INITIAL_E_WAY_BILLS,
  INITIAL_GATE_PASSES,
  INITIAL_COMPLIANCE_EXCEPTIONS,
} from '../data/salesOrderDeliveryData';

import {
  PlasticSalesOrder,
  MonthlyPlanOrder,
  OrderRelationship,
  DeliveryNoteChallan,
  FgBatchStock,
  EInvoiceRecord,
  EWayBillRecord,
  GatePassRecord,
  ComplianceExceptionRecord,
} from '../types/salesOrderDeliveryTypes';

interface SalesProps {
  view: string;
  sos: SalesOrder[];
  quotes: SalesQuotation[];
  customers: Customer[];
  rmas: ReturnMerchandise[];
  contracts?: SalesContract[];
  selectedId?: string;
  onNavigate: (view: string, param?: any) => void;
  onUpdateSO: (so: SalesOrder) => void;
  onCreateSO: (so: SalesOrder) => void;
  onUpdateQuote: (q: SalesQuotation) => void;
  onCreateQuote: (q: SalesQuotation) => void;
  onUpdateRMA?: (rma: ReturnMerchandise) => void;
  onCreateRMA?: (rma: ReturnMerchandise) => void;
  onUpdateCustomer?: (c: Customer) => void;
  onCreateCustomer?: (c: Customer) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  openConfirm: (title: string, message: string, onConfirm: () => void) => void;
  showToast: (msg: string) => void;
}

export const SalesViews: React.FC<SalesProps> = ({
  view,
  sos,
  quotes,
  customers,
  rmas,
  contracts,
  selectedId,
  onNavigate,
  onUpdateSO,
  onCreateSO,
  onUpdateQuote,
  onCreateQuote,
  onUpdateRMA,
  onCreateRMA,
  onUpdateCustomer,
  onCreateCustomer,
  openDrawer,
  closeDrawer,
  openConfirm,
  showToast,
}) => {
  // Redesigned Indian ERP Compliance Data State
  const [plasticSalesOrders, setPlasticSalesOrders] = useState<PlasticSalesOrder[]>(INITIAL_PLASTIC_SALES_ORDERS);
  const [monthlyPlans, setMonthlyPlans] = useState<MonthlyPlanOrder[]>(INITIAL_MONTHLY_PLANS);
  const [relationships, setRelationships] = useState<OrderRelationship[]>(INITIAL_ORDER_RELATIONSHIPS);
  const [deliveries, setDeliveries] = useState<DeliveryNoteChallan[]>(INITIAL_DELIVERY_NOTES);
  const [batches, setBatches] = useState<FgBatchStock[]>(INITIAL_FG_BATCHES);
  const [eInvoices, setEInvoices] = useState<EInvoiceRecord[]>(INITIAL_E_INVOICES);
  const [eWayBills, setEWayBills] = useState<EWayBillRecord[]>(INITIAL_E_WAY_BILLS);
  const [gatePasses, setGatePasses] = useState<GatePassRecord[]>(INITIAL_GATE_PASSES);
  const [exceptions, setExceptions] = useState<ComplianceExceptionRecord[]>(INITIAL_COMPLIANCE_EXCEPTIONS);

  // Sub-navigation states
  const [salesSubNav, setSalesSubNav] = useState<'list' | 'dashboard' | 'wizard' | 'plans' | 'quickEntry' | 'reconciliation'>(() => {
    if (view === 'soDashboard') return 'dashboard';
    if (view === 'soWizard' || view === 'soCreate') return 'wizard';
    if (view === 'monthlyPlanOrders' || view === 'monthlyPlan') return 'plans';
    if (view === 'dailyQuickEntry') return 'quickEntry';
    if (view === 'monthlyReconciliation' || view === 'reconciliation') return 'reconciliation';
    if (view === 'soList' || view === 'salesOrders') return 'list';
    return 'dashboard';
  });
  const [dispatchSubNav, setDispatchSubNav] = useState<'dashboard' | 'challans' | 'createChallan' | 'gatePass' | 'ewb' | 'eInvoice' | 'compliance'>(() => {
    if (view === 'createChallan' || view === 'createDelivery') return 'createChallan';
    if (view === 'deliveryChallans' || view === 'deliveryChallan') return 'challans';
    if (view === 'gatePass' || view === 'gatePassMgmt' || view === 'issueGatePass') return 'gatePass';
    if (view === 'eWayBillMgmt' || view === 'eWayBills') return 'ewb';
    if (view === 'eInvoiceMgmt' || view === 'eInvoices') return 'eInvoice';
    if (view === 'complianceDashboard' || view === 'complianceExceptions' || view === 'exceptions') return 'compliance';
    return 'dashboard';
  });
  const [selectedPlasticSoId, setSelectedPlasticSoId] = useState<string>(selectedId || 'SO-5001');
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryNoteChallan | null>(null);
  const [isFgStockModalOpen, setIsFgStockModalOpen] = useState(false);
  const [isCreatePlanModalOpen, setIsCreatePlanModalOpen] = useState(false);
  const [wizardDefaultType, setWizardDefaultType] = useState<'Daily Sales Order' | 'Monthly Plan Order' | 'Blanket/Contract Order'>('Daily Sales Order');

  // Synchronize internal views with route view prop
  useEffect(() => {
    if (view === 'soDashboard') {
      setSalesSubNav('dashboard');
    } else if (view === 'soList' || view === 'salesOrders') {
      setSalesSubNav('list');
    } else if (view === 'soWizard' || view === 'soCreate') {
      setSalesSubNav('wizard');
    } else if (view === 'monthlyPlanOrders' || view === 'monthlyPlan') {
      setSalesSubNav('plans');
    } else if (view === 'dailyQuickEntry') {
      setSalesSubNav('quickEntry');
    } else if (view === 'monthlyReconciliation' || view === 'reconciliation') {
      setSalesSubNav('reconciliation');
    } else if (view === 'createChallan' || view === 'createDelivery') {
      setDispatchSubNav('createChallan');
      setSelectedDelivery(null);
    } else if (view === 'deliveryChallans' || view === 'deliveryChallan' || view === 'challanDetail' || view === 'deliveryDetail') {
      setDispatchSubNav('challans');
    } else if (view === 'gatePass' || view === 'gatePassMgmt' || view === 'issueGatePass') {
      setDispatchSubNav('gatePass');
      setSelectedDelivery(null);
    } else if (view === 'eWayBillMgmt' || view === 'eWayBills') {
      setDispatchSubNav('ewb');
      setSelectedDelivery(null);
    } else if (view === 'eInvoiceMgmt' || view === 'eInvoices') {
      setDispatchSubNav('eInvoice');
      setSelectedDelivery(null);
    } else if (view === 'complianceDashboard' || view === 'complianceExceptions' || view === 'exceptions') {
      setDispatchSubNav('compliance');
      setSelectedDelivery(null);
    } else if (
      view === 'deliverySchedule' ||
      view === 'salesDeliveries' ||
      view === 'dispatch' ||
      view === 'dispatchDash'
    ) {
      setDispatchSubNav('dashboard');
      setSelectedDelivery(null);
    }
  }, [view]);

  // Business Action Handlers
  const handleSaveOrder = (newOrder: PlasticSalesOrder) => {
    setPlasticSalesOrders((prev) => [newOrder, ...(prev || []).filter((o) => o.id !== newOrder.id)]);
    setSalesSubNav('list');
    showToast(`Sales Order ${newOrder.id} successfully saved & confirmed.`);
  };

  const handleSaveMonthlyPlan = (newPlan: MonthlyPlanOrder) => {
    setMonthlyPlans((prev) => [newPlan, ...prev]);
    showToast(`Monthly Plan Order ${newPlan.id} successfully committed.`);
  };

  const handleSaveDelivery = (
    newDeliv: DeliveryNoteChallan,
    newEInv?: EInvoiceRecord,
    newEwb?: EWayBillRecord,
    newGatePass?: GatePassRecord
  ) => {
    setDeliveries((prev) => [newDeliv, ...prev]);
    if (newEInv) {
      setEInvoices((prev) => [newEInv, ...prev.filter((x) => x.invoiceNumber !== newEInv.invoiceNumber)]);
    }
    if (newEwb) {
      setEWayBills((prev) => [newEwb, ...prev.filter((x) => x.ewbNumber !== newEwb.ewbNumber)]);
    }
    if (newGatePass) {
      setGatePasses((prev) => [newGatePass, ...prev.filter((x) => x.gatePassNumber !== newGatePass.gatePassNumber)]);
    }
    setSelectedDelivery(null);
    setDispatchSubNav('challans');
    showToast(`Delivery Challan ${newDeliv.id} created. All-in-One E-Invoice, E-Way Bill & Gate Pass generated!`);
    onNavigate('deliveryChallans');
  };

  const handleApproveGateOut = (passId: string) => {
    setGatePasses((prev) =>
      prev.map((g) =>
        g.id === passId
          ? { ...g, securityCheckStatus: 'Cleared', gateOutTimestamp: '2026-09-12 12:00:00' }
          : g
      )
    );
    showToast(`Gate Pass ${passId} security verified. Boom barrier cleared for exit.`);
  };

  const handleHoldGatePass = (passId: string, reason: string) => {
    setGatePasses((prev) =>
      prev.map((g) =>
        g.id === passId
          ? { ...g, securityCheckStatus: 'Security Hold', holdReason: reason }
          : g
      )
    );
    showToast(`Vehicle held at gate: ${reason}`);
  };

  const handleIssueGatePass = (newGatePass: GatePassRecord, deliveryId?: string) => {
    setGatePasses((prev) => [
      newGatePass,
      ...prev.filter((g) => (g.id || g.gatePassNumber) !== (newGatePass.id || newGatePass.gatePassNumber)),
    ]);
    if (deliveryId) {
      setDeliveries((prev) =>
        prev.map((d) =>
          d.id === deliveryId
            ? {
                ...d,
                gatePassNumber: newGatePass.gatePassNumber || newGatePass.id,
                gatePassStatus: 'Generated',
                status: d.status === 'Delivered' ? 'Delivered' : 'Gate Pass Issued',
              }
            : d
        )
      );
    }
    showToast(`Gate Pass ${newGatePass.gatePassNumber || newGatePass.id} issued successfully for vehicle ${newGatePass.vehicleNumber}.`);
  };

  const handleDispatchNavigate = (targetView: string, param?: any) => {
    if (targetView === 'challanDetail' || targetView === 'deliveryDetail') {
      if (param?.delivery) {
        setSelectedDelivery(param.delivery);
      } else if (param?.deliveryId) {
        const found = deliveries.find((d) => d.id === param.deliveryId);
        if (found) setSelectedDelivery(found);
      }
      setDispatchSubNav('challans');
      onNavigate(targetView, param);
      return;
    }

    if (targetView === 'createDelivery' || targetView === 'createChallan') {
      setSelectedDelivery(null);
      setDispatchSubNav('createChallan');
    } else if (targetView === 'gatePass' || targetView === 'gatePassMgmt' || targetView === 'issueGatePass') {
      setSelectedDelivery(null);
      setDispatchSubNav('gatePass');
    } else if (targetView === 'deliveryChallans' || targetView === 'deliveryChallan' || targetView === 'challans') {
      setSelectedDelivery(null);
      setDispatchSubNav('challans');
    } else if (targetView === 'eWayBillMgmt' || targetView === 'eWayBills' || targetView === 'ewb') {
      setSelectedDelivery(null);
      setDispatchSubNav('ewb');
    } else if (targetView === 'eInvoiceMgmt' || targetView === 'eInvoices' || targetView === 'eInvoice') {
      setSelectedDelivery(null);
      setDispatchSubNav('eInvoice');
    } else if (targetView === 'complianceDashboard' || targetView === 'complianceExceptions' || targetView === 'exceptions') {
      setSelectedDelivery(null);
      setDispatchSubNav('compliance');
    } else if (
      targetView === 'dispatchDash' ||
      targetView === 'dashboard' ||
      targetView === 'deliverySchedule' ||
      targetView === 'salesDeliveries' ||
      targetView === 'dispatch'
    ) {
      setSelectedDelivery(null);
      setDispatchSubNav('dashboard');
    }
    onNavigate(targetView, param);
  };

  const handleGenerateIrn = (invNum: string) => {
    setEInvoices((prev) =>
      prev.map((inv) =>
        inv.invoiceNumber === invNum
          ? {
              ...inv,
              status: 'Generated',
              irn: 'b78a994c1f9302194857dc820a45719bc40192e472093849102830fca1029148',
              ackNo: '112026090014521',
              ackDate: '2026-09-12 11:15:00',
              errorMessage: undefined,
            }
          : inv
      )
    );
    showToast(`IRN successfully obtained from NIC Invoice Registration Portal for ${invNum}.`);
  };

  const handleCancelIrn = (invNum: string, reason: string) => {
    setEInvoices((prev) =>
      prev.map((inv) =>
        inv.invoiceNumber === invNum ? { ...inv, status: 'Cancelled' } : inv
      )
    );
    showToast(`IRN for ${invNum} cancelled: ${reason}`);
  };

  const handleUpdateEwb = (updated: EWayBillRecord) => {
    setEWayBills((prev) => prev.map((e) => (e.ewbNumber === updated.ewbNumber ? updated : e)));
    showToast(`E-Way Bill ${updated.ewbNumber} updated.`);
  };

  const handleResolveException = (id: string) => {
    setExceptions((prev) =>
      prev.map((x) => (x.id === id ? { ...x, status: 'Resolved' } : x))
    );
    showToast(`Compliance Exception ${id} resolved.`);
  };

  /* ----------------------------------------------------
     1. SALES DASHBOARD (Command Center)
  ---------------------------------------------------- */
  if (view === 'salesDash' || view === 'sales') {
    return (
      <SalesDashboardView
        sos={sos}
        quotes={quotes}
        customers={customers}
        onNavigate={onNavigate}
        openDrawer={openDrawer}
        closeDrawer={closeDrawer}
        showToast={showToast}
      />
    );
  }

  /* ----------------------------------------------------
     2. QUOTATION LIST
  ---------------------------------------------------- */
  if (view === 'quoteList' || view === 'quotations') {
    return (
      <SalesQuotationListView
        quotes={quotes}
        customers={customers}
        onNavigate={onNavigate}
        onCreateQuote={onCreateQuote}
        onUpdateQuote={onUpdateQuote}
        openDrawer={openDrawer}
        closeDrawer={closeDrawer}
        showToast={showToast}
      />
    );
  }

  /* ----------------------------------------------------
     3. QUOTATION DETAIL & BUILDER
  ---------------------------------------------------- */
  if (view === 'quoteDetail') {
    return (
      <QuotationDetailView
        quoteId={selectedId || quotes[0]?.id || 'QT-3001'}
        quotes={quotes}
        customers={customers}
        onNavigate={onNavigate}
        onUpdateQuote={onUpdateQuote}
        onCreateSO={onCreateSO}
        showToast={showToast}
      />
    );
  }

  /* ----------------------------------------------------
     4. REDESIGNED SALES ORDER MODULE
  ---------------------------------------------------- */
  if (
    view === 'soList' ||
    view === 'salesOrders' ||
    view === 'soDashboard' ||
    view === 'soWizard' ||
    view === 'soCreate' ||
    view === 'monthlyPlanOrders' ||
    view === 'monthlyPlan' ||
    view === 'dailyQuickEntry' ||
    view === 'monthlyReconciliation' ||
    view === 'reconciliation'
  ) {
    const currentSub =
      view === 'soDashboard'
        ? 'dashboard'
        : view === 'soWizard' || view === 'soCreate'
        ? 'wizard'
        : view === 'monthlyPlanOrders' || view === 'monthlyPlan'
        ? 'plans'
        : view === 'dailyQuickEntry'
        ? 'quickEntry'
        : view === 'monthlyReconciliation' || view === 'reconciliation'
        ? 'reconciliation'
        : view === 'soList' || view === 'salesOrders'
        ? 'list'
        : salesSubNav;

    return (
      <div className="space-y-4">
        {/* Top Module Sub-Navigation Bar */}
        <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => {
                setSalesSubNav('dashboard');
                onNavigate('soDashboard');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                currentSub === 'dashboard'
                  ? 'bg-[#14213D] text-white shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Command Center
            </button>
            <button
              onClick={() => {
                setSalesSubNav('list');
                onNavigate('soList');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                currentSub === 'list'
                  ? 'bg-[#14213D] text-white shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Order Register
            </button>
            <button
              onClick={() => {
                setWizardDefaultType('Daily Sales Order');
                setSalesSubNav('wizard');
                onNavigate('soWizard');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                currentSub === 'wizard'
                  ? 'bg-[#0F8B8D] text-white shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              + Create Order (6-Step)
            </button>
            <button
              onClick={() => {
                setSalesSubNav('plans');
                onNavigate('monthlyPlanOrders');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                currentSub === 'plans'
                  ? 'bg-[#14213D] text-white shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Monthly Plan Orders
            </button>
            <button
              onClick={() => {
                setSalesSubNav('quickEntry');
                onNavigate('dailyQuickEntry');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                currentSub === 'quickEntry'
                  ? 'bg-[#14213D] text-white shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Daily Quick Entry
            </button>
            <button
              onClick={() => {
                setSalesSubNav('reconciliation');
                onNavigate('monthlyReconciliation');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                currentSub === 'reconciliation'
                  ? 'bg-[#14213D] text-white shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Monthly vs Daily Reconciliation
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('deliverySchedule')}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              🚚 Deliveries & Dispatch &rarr;
            </button>
          </div>
        </div>

        {/* Sub-view switcher */}
        {currentSub === 'dashboard' && (
          <SalesOrderDashboard
            orders={plasticSalesOrders}
            monthlyPlans={monthlyPlans}
            deliveries={deliveries}
            exceptions={exceptions}
            onNavigate={(targetView, param) => {
              if (targetView === 'soList' || targetView === 'salesOrders') {
                setSalesSubNav('list');
              } else if (targetView === 'monthlyPlan' || targetView === 'monthlyPlanOrders') {
                setSalesSubNav('plans');
              } else if (targetView === 'dailyQuickEntry') {
                setSalesSubNav('quickEntry');
              } else if (targetView === 'reconciliation' || targetView === 'monthlyReconciliation') {
                setSalesSubNav('reconciliation');
              } else if (targetView === 'soWizard' || targetView === 'soCreate') {
                setWizardDefaultType('Daily Sales Order');
                setSalesSubNav('wizard');
              } else if (targetView === 'createChallan') {
                setDispatchSubNav('createChallan');
              } else if (targetView === 'gatePass' || targetView === 'gatePassMgmt') {
                setDispatchSubNav('gatePass');
              } else if (targetView === 'eWayBillMgmt' || targetView === 'eWayBills') {
                setDispatchSubNav('ewb');
              } else if (targetView === 'eInvoiceMgmt' || targetView === 'eInvoices') {
                setDispatchSubNav('eInvoice');
              } else if (targetView === 'complianceExceptions' || targetView === 'complianceDashboard') {
                setDispatchSubNav('compliance');
              }
              onNavigate(targetView, param);
            }}
            onQuickAction={(action) => {
              if (action === 'createDailySo' || action === 'newOrder') {
                setWizardDefaultType('Daily Sales Order');
                setSalesSubNav('wizard');
              } else if (action === 'createMonthlyPlan' || action === 'newPlan') {
                setWizardDefaultType('Monthly Plan Order');
                setSalesSubNav('plans');
                setIsCreatePlanModalOpen(true);
              } else if (action === 'createDelivery' || action === 'dispatch') {
                setDispatchSubNav('createChallan');
                onNavigate('createChallan');
              } else if (action === 'checkStock') {
                setIsFgStockModalOpen(true);
              } else if (action === 'quickEntry') {
                setSalesSubNav('quickEntry');
              } else if (action === 'compliance') {
                setDispatchSubNav('compliance');
                onNavigate('complianceExceptions');
              }
            }}
          />
        )}

        {currentSub === 'list' && (
          <SalesOrderList
            orders={plasticSalesOrders}
            onSelectOrder={(orderId) => {
              setSelectedPlasticSoId(orderId);
              onNavigate('soDetail', { id: orderId });
            }}
            onCreateOrder={() => {
              setWizardDefaultType('Daily Sales Order');
              setSalesSubNav('wizard');
            }}
            onNavigate={onNavigate}
            showToast={showToast}
          />
        )}

        {currentSub === 'wizard' && (
          <SalesOrderWizard
            defaultOrderType={wizardDefaultType}
            monthlyPlans={monthlyPlans}
            onSave={handleSaveOrder}
            onCancel={() => setSalesSubNav('list')}
            showToast={showToast}
          />
        )}

        {currentSub === 'plans' && (
          <MonthlyPlanOrdersView
            monthlyPlans={monthlyPlans}
            dailyOrders={plasticSalesOrders}
            onNavigate={onNavigate}
            onCreatePlan={handleSaveMonthlyPlan}
            initialCreateOpen={isCreatePlanModalOpen}
            onCloseCreateModal={() => setIsCreatePlanModalOpen(false)}
            showToast={showToast}
          />
        )}

        {currentSub === 'quickEntry' && (
          <DailyOrderQuickEntry
            onSaveOrder={(order, autoDelivery) => {
              handleSaveOrder(order);
              if (autoDelivery) {
                onNavigate('deliverySchedule');
              }
            }}
            onCancel={() => setSalesSubNav('list')}
            showToast={showToast}
          />
        )}

        {currentSub === 'reconciliation' && (
          <MonthlyDailyReconciliation
            monthlyPlans={monthlyPlans}
            dailyOrders={plasticSalesOrders}
            relationships={relationships}
            onUpdateRelationships={(newRels) => {
              setRelationships(newRels);
              showToast('Demand reconciliation mappings saved successfully.');
            }}
            showToast={showToast}
          />
        )}

        {/* FG Batch Stock & FEFO Modal */}
        <FgStockModal
          isOpen={isFgStockModalOpen}
          onClose={() => setIsFgStockModalOpen(false)}
          batches={batches}
          onNavigate={(targetView, param) => {
            if (targetView === 'stockList') {
              onNavigate('stockList', param);
            } else {
              onNavigate(targetView, param);
            }
          }}
          onCreateOrderForItem={(itemCode) => {
            setWizardDefaultType('Daily Sales Order');
            setSalesSubNav('wizard');
          }}
          onCreateDelivery={() => {
            setDispatchSubNav('createChallan');
            onNavigate('createChallan');
          }}
        />
      </div>
    );
  }

  /* ----------------------------------------------------
     5. REDESIGNED SALES ORDER DETAIL (10 TABS)
  ---------------------------------------------------- */
  if (view === 'soDetail') {
    const activeOrder =
      plasticSalesOrders.find((o) => o.id === (selectedId || selectedPlasticSoId)) ||
      plasticSalesOrders[0];

    return (
      <SalesOrderDetail
        order={activeOrder}
        monthlyPlans={monthlyPlans}
        deliveries={deliveries}
        batches={batches}
        eInvoices={eInvoices}
        eWayBills={eWayBills}
        onBack={() => onNavigate('soList')}
        onNavigate={onNavigate}
        showToast={showToast}
      />
    );
  }

  /* ----------------------------------------------------
     6. SALES ORDER CONFIRMATION DOCUMENT
  ---------------------------------------------------- */
  if (view === 'soConfirm' || view === 'soPrint') {
    return (
      <SalesOrderConfirmationView
        soId={selectedId || sos[0]?.id || 'SO-5001'}
        sos={sos}
        onNavigate={onNavigate}
        showToast={showToast}
      />
    );
  }

  /* ----------------------------------------------------
     7. PRICING MATRIX & REBATES
  ---------------------------------------------------- */
  if (view === 'pricingMgmt' || view === 'pricingMatrix' || view === 'rebates') {
    return <SalesPricingMatrixView showToast={showToast} />;
  }

  /* ----------------------------------------------------
     8. REDESIGNED DELIVERIES & DISPATCH SUITE
  ---------------------------------------------------- */
  if (
    view === 'deliverySchedule' ||
    view === 'salesDeliveries' ||
    view === 'dispatch' ||
    view === 'dispatchDash' ||
    view === 'deliveryChallan' ||
    view === 'deliveryChallans' ||
    view === 'createChallan' ||
    view === 'createDelivery' ||
    view === 'challanDetail' ||
    view === 'gatePass' ||
    view === 'gatePassMgmt' ||
    view === 'issueGatePass' ||
    view === 'deliveryTracking' ||
    view === 'eWayBillMgmt' ||
    view === 'eWayBills' ||
    view === 'eInvoiceMgmt' ||
    view === 'eInvoices' ||
    view === 'complianceDashboard' ||
    view === 'complianceExceptions' ||
    view === 'exceptions'
  ) {
    // Determine current sub-view
    const currentSub =
      view === 'createChallan' || view === 'createDelivery'
        ? 'createChallan'
        : view === 'deliveryChallans' || view === 'deliveryChallan'
        ? 'challans'
        : view === 'gatePass' || view === 'gatePassMgmt' || view === 'issueGatePass'
        ? 'gatePass'
        : view === 'eWayBillMgmt' || view === 'eWayBills'
        ? 'ewb'
        : view === 'eInvoiceMgmt' || view === 'eInvoices'
        ? 'eInvoice'
        : view === 'complianceDashboard' || view === 'complianceExceptions' || view === 'exceptions'
        ? 'compliance'
        : view === 'deliverySchedule' || view === 'salesDeliveries' || view === 'dispatch' || view === 'dispatchDash'
        ? 'dashboard'
        : dispatchSubNav;

    // If viewing single challan detail (ONLY when explicitly in challans or challanDetail)
    if (view === 'challanDetail' || (selectedDelivery && currentSub === 'challans')) {
      const activeDelivery =
        selectedDelivery ||
        deliveries.find((d) => d.id === selectedId) ||
        deliveries[0];

      return (
        <DeliveryChallanDetail
          delivery={activeDelivery}
          onBack={() => {
            setSelectedDelivery(null);
            setDispatchSubNav('challans');
            if (view === 'challanDetail') {
              onNavigate('deliveryChallans');
            }
          }}
          onNavigate={handleDispatchNavigate}
          showToast={showToast}
        />
      );
    }

    return (
      <div className="space-y-4">
        {/* Top Module Sub-Navigation Bar */}
        <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => {
                setSelectedDelivery(null);
                setDispatchSubNav('dashboard');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                currentSub === 'dashboard'
                  ? 'bg-[#14213D] text-white shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Dispatch Command Center
            </button>
            <button
              onClick={() => {
                setSelectedDelivery(null);
                setDispatchSubNav('challans');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                currentSub === 'challans'
                  ? 'bg-[#14213D] text-white shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Delivery Notes / Challans
            </button>
            <button
              onClick={() => {
                setSelectedDelivery(null);
                setDispatchSubNav('createChallan');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                currentSub === 'createChallan'
                  ? 'bg-[#0F8B8D] text-white shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              + Create Challan (Wizard)
            </button>
            <button
              onClick={() => {
                setSelectedDelivery(null);
                setDispatchSubNav('gatePass');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                currentSub === 'gatePass'
                  ? 'bg-[#14213D] text-white shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Security Gate Pass
            </button>
            <button
              onClick={() => {
                setSelectedDelivery(null);
                setDispatchSubNav('ewb');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                currentSub === 'ewb'
                  ? 'bg-[#14213D] text-white shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              E-Way Bill Hub
            </button>
            <button
              onClick={() => {
                setSelectedDelivery(null);
                setDispatchSubNav('eInvoice');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                currentSub === 'eInvoice'
                  ? 'bg-[#14213D] text-white shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              E-Invoice Portal
            </button>
            <button
              onClick={() => {
                setSelectedDelivery(null);
                setDispatchSubNav('compliance');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                currentSub === 'compliance'
                  ? 'bg-red-700 text-white shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Compliance & Exceptions
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('soList')}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              📦 Sales Orders &rarr;
            </button>
          </div>
        </div>

        {/* Sub-view switcher */}
        {currentSub === 'dashboard' && (
          <DispatchDashboard
            deliveries={deliveries}
            eInvoices={eInvoices}
            eWayBills={eWayBills}
            gatePasses={gatePasses}
            exceptions={exceptions}
            onNavigate={handleDispatchNavigate}
            onIssueGatePass={handleIssueGatePass}
            showToast={showToast}
          />
        )}

        {currentSub === 'challans' && (
          selectedDelivery ? (
            <DeliveryChallanDetail
              delivery={selectedDelivery}
              onBack={() => setSelectedDelivery(null)}
              onNavigate={handleDispatchNavigate}
              showToast={showToast}
            />
          ) : (
            <DeliveryChallanManagement
              deliveries={deliveries}
              onSelectDelivery={(deliv) => {
                setSelectedDelivery(deliv);
              }}
              onNavigate={handleDispatchNavigate}
              showToast={showToast}
            />
          )
        )}

        {currentSub === 'createChallan' && (
          <CreateDeliveryChallan
            salesOrders={plasticSalesOrders}
            onSaveDelivery={handleSaveDelivery}
            onCancel={() => {
              setSelectedDelivery(null);
              setDispatchSubNav('challans');
              onNavigate('deliveryChallans');
            }}
            onNavigate={(targetView, param) => {
              handleDispatchNavigate(targetView, param);
            }}
            showToast={showToast}
          />
        )}

        {currentSub === 'gatePass' && (
          <GatePassVerification
            gatePasses={gatePasses}
            deliveries={deliveries}
            onApproveGateOut={handleApproveGateOut}
            onHoldGatePass={handleHoldGatePass}
            onIssueGatePass={handleIssueGatePass}
            onNavigate={handleDispatchNavigate}
            showToast={showToast}
          />
        )}

        {currentSub === 'ewb' && (
          <EWayBillManagement
            eWayBills={eWayBills}
            onUpdateEwb={handleUpdateEwb}
            showToast={showToast}
          />
        )}

        {currentSub === 'eInvoice' && (
          <EInvoiceManagement
            eInvoices={eInvoices}
            onGenerateIrn={handleGenerateIrn}
            onCancelIrn={handleCancelIrn}
            showToast={showToast}
          />
        )}

        {currentSub === 'compliance' && (
          <ComplianceExceptionsDashboard
            exceptions={exceptions}
            onResolveException={handleResolveException}
            onNavigate={handleDispatchNavigate}
            showToast={showToast}
          />
        )}
      </div>
    );
  }

  /* ----------------------------------------------------
     9. CUSTOMER CREDIT CONTROL & EXPOSURE
  ---------------------------------------------------- */
  if (view === 'creditControl' || view === 'creditExposure') {
    return (
      <CustomerCreditControlView
        showToast={showToast}
        openDrawer={openDrawer}
        closeDrawer={closeDrawer}
      />
    );
  }

  /* ----------------------------------------------------
     10. BILLING & INVOICE STATUS
  ---------------------------------------------------- */
  if (view === 'billingStatus' || view === 'salesBilling') {
    return <SalesBillingStatusView showToast={showToast} />;
  }

  /* ----------------------------------------------------
     11. CUSTOMER RETURNS (RMA)
  ---------------------------------------------------- */
  if (view === 'rmaList' || view === 'rmaDetail' || view === 'returnsRMA' || view === 'salesRMA') {
    return (
      <CustomerReturnsRMAView
        returns={rmas}
        onCreateRMA={onCreateRMA || (() => {})}
        onUpdateRMA={onUpdateRMA || (() => {})}
        openDrawer={openDrawer}
        closeDrawer={closeDrawer}
        showToast={showToast}
      />
    );
  }

  /* ----------------------------------------------------
     12. 13-STAGE ORDER TRACKING TIMELINE
  ---------------------------------------------------- */
  if (view === 'orderTracking' || view === 'salesTracking') {
    return (
      <SalesOrderTrackingTimelineView
        sos={sos}
        onNavigate={onNavigate}
      />
    );
  }

  /* ----------------------------------------------------
     13. BACKORDERS & 12-MONTH SALES FORECASTS
  ---------------------------------------------------- */
  if (
    view === 'backorderMgmt' ||
    view === 'backordersForecast' ||
    view === 'salesBackorders' ||
    view === 'salesForecast' ||
    view === 'forecast'
  ) {
    return <SalesBackordersAndForecastsView showToast={showToast} />;
  }

  /* ----------------------------------------------------
     14. SALES CONTRACTS & BLANKET AGREEMENTS
  ---------------------------------------------------- */
  if (
    view === 'contractList' ||
    view === 'contractDetail' ||
    view === 'contracts' ||
    view === 'salesContracts'
  ) {
    return (
      <SalesContractListView
        contracts={contracts}
        customers={customers}
        onNavigate={onNavigate}
        onCreateSO={onCreateSO}
        openDrawer={openDrawer}
        closeDrawer={closeDrawer}
        showToast={showToast}
      />
    );
  }

  /* ----------------------------------------------------
     15. CUSTOMER 360° PROFILE DETAIL
  ---------------------------------------------------- */
  if (view === 'customerDetail' || view === 'customer360') {
    return (
      <CustomerDetailView
        customerId={selectedId || customers[0]?.code || 'CUST-001'}
        customers={customers}
        sos={sos}
        quotes={quotes}
        rmas={rmas}
        onNavigate={onNavigate}
        onUpdateCustomer={onUpdateCustomer}
        openDrawer={openDrawer}
        closeDrawer={closeDrawer}
        showToast={showToast}
      />
    );
  }

  /* ----------------------------------------------------
     16. CUSTOMERS MASTER DIRECTORY
  ---------------------------------------------------- */
  if (view === 'customerList' || view === 'customers') {
    return (
      <CustomerMasterListView
        customers={customers}
        sos={sos}
        quotes={quotes}
        onNavigate={onNavigate}
        onCreateCustomer={onCreateCustomer}
        onUpdateCustomer={onUpdateCustomer}
        openDrawer={openDrawer}
        closeDrawer={closeDrawer}
        showToast={showToast}
      />
    );
  }

  /* ----------------------------------------------------
     FALLBACK ROUTER
  ---------------------------------------------------- */
  return (
    <div className="space-y-5">
      <div className="bg-white p-5 rounded-xl border border-[#E4E0D6] shadow-sm">
        <div className="font-mono text-[10px] uppercase font-bold text-[#0F8B8D]">
          Sales &middot; Commercial Module
        </div>
        <h1 className="text-xl font-bold text-[#14213D] font-['Space_Grotesk'] mt-0.5">{view}</h1>
        <p className="text-xs text-[#6B7280] mt-2">
          Displaying specialized sales operations view for <b>{view}</b>.
        </p>
      </div>
    </div>
  );
};
