import React from 'react';
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
     4. SALES ORDER LIST
  ---------------------------------------------------- */
  if (view === 'soList' || view === 'salesOrders') {
    return (
      <SalesOrderListView
        sos={sos}
        customers={customers}
        onNavigate={onNavigate}
        onCreateSO={onCreateSO}
        onUpdateSO={onUpdateSO}
        openDrawer={openDrawer}
        closeDrawer={closeDrawer}
        showToast={showToast}
      />
    );
  }

  /* ----------------------------------------------------
     5. SALES ORDER DETAIL
  ---------------------------------------------------- */
  if (view === 'soDetail') {
    return (
      <SalesOrderDetailView
        soId={selectedId || sos[0]?.id || 'SO-5001'}
        sos={sos}
        customers={customers}
        onNavigate={onNavigate}
        onUpdateSO={onUpdateSO}
        openDrawer={openDrawer}
        closeDrawer={closeDrawer}
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
     8. DELIVERY SCHEDULE & SHIPPING
  ---------------------------------------------------- */
  if (view === 'deliverySchedule' || view === 'salesDeliveries') {
    return (
      <SalesDeliveryScheduleView
        sos={sos}
        onNavigate={onNavigate}
        showToast={showToast}
      />
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
