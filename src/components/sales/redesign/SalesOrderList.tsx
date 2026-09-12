import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit2,
  Copy,
  Truck,
  ShieldCheck,
  Package,
  FileText,
  FileCheck,
  Link as LinkIcon,
  XCircle,
  MoreVertical,
  Calendar,
  AlertTriangle,
  ArrowUpDown,
  Download,
} from 'lucide-react';
import {
  PlasticSalesOrder,
  SalesOrderType,
  SalesOrderStatus,
} from '../../../types/salesOrderDeliveryTypes';

interface SalesOrderListProps {
  orders: PlasticSalesOrder[];
  onSelectOrder: (orderId: string) => void;
  onCreateOrder: (orderType?: SalesOrderType) => void;
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const SalesOrderList: React.FC<SalesOrderListProps> = ({
  orders,
  onSelectOrder,
  onCreateOrder,
  onNavigate,
  showToast,
}) => {
  // 13 Specified Tabs
  const [activeTab, setActiveTab] = useState<string>('All Orders');

  // Filter Bar state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('All');
  const [selectedOrderType, setSelectedOrderType] = useState('All');
  const [selectedPlant, setSelectedPlant] = useState('All');
  const [selectedFgStore, setSelectedFgStore] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedDeliveryStatus, setSelectedDeliveryStatus] = useState('All');
  const [selectedInvoiceStatus, setSelectedInvoiceStatus] = useState('All');
  const [selectedEInvoiceStatus, setSelectedEInvoiceStatus] = useState('All');
  const [selectedEwbStatus, setSelectedEwbStatus] = useState('All');
  const [selectedLinkType, setSelectedLinkType] = useState('All');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Filter options derived from data
  const customers = useMemo(() => Array.from(new Set(orders.map((o) => o.customer))), [orders]);
  const plants = useMemo(() => Array.from(new Set(orders.map((o) => o.plant))), [orders]);
  const fgStores = useMemo(() => Array.from(new Set(orders.map((o) => o.fgStore))), [orders]);

  // Tab Filtering Logic
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Tab matching
      if (activeTab === 'Daily Orders' && order.orderType !== 'Daily Sales Order') return false;
      if (activeTab === 'Monthly Plan Orders' && order.orderType !== 'Monthly Plan Order') return false;
      if (activeTab === 'Draft' && order.status !== 'Draft') return false;
      if (activeTab === 'Pending Approval' && order.status !== 'Pending Approval') return false;
      if (activeTab === 'Credit Hold' && order.status !== 'Credit Hold' && order.creditStatus !== 'Hold') return false;
      if (activeTab === 'Confirmed' && order.status !== 'Confirmed') return false;
      if (activeTab === 'Partially Delivered' && order.deliveryStatus !== 'Partially Delivered') return false;
      if (activeTab === 'Delivered' && order.status !== 'Delivered') return false;
      if (activeTab === 'Invoiced' && order.invoiceStatus !== 'Fully Invoiced') return false;
      if (activeTab === 'Closed' && order.status !== 'Closed') return false;
      if (activeTab === 'Cancelled' && order.status !== 'Cancelled') return false;
      if (activeTab === 'Compliance Exceptions' && order.eInvoiceStatus !== 'Failed' && order.eWayBillStatus !== 'Expired') return false;

      // Search matching
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchNumber = order.id.toLowerCase().includes(query);
        const matchCustomer = order.customer.toLowerCase().includes(query);
        const matchPo = order.customerPoNumber?.toLowerCase().includes(query);
        const matchItem = order.lines.some((l) => l.itemName.toLowerCase().includes(query) || l.itemCode.toLowerCase().includes(query));
        if (!matchNumber && !matchCustomer && !matchPo && !matchItem) return false;
      }

      // Filter Bar dropdowns
      if (selectedCustomer !== 'All' && order.customer !== selectedCustomer) return false;
      if (selectedOrderType !== 'All' && order.orderType !== selectedOrderType) return false;
      if (selectedPlant !== 'All' && order.plant !== selectedPlant) return false;
      if (selectedFgStore !== 'All' && order.fgStore !== selectedFgStore) return false;
      if (selectedStatus !== 'All' && order.status !== selectedStatus) return false;
      if (selectedDeliveryStatus !== 'All' && order.deliveryStatus !== selectedDeliveryStatus) return false;
      if (selectedInvoiceStatus !== 'All' && order.invoiceStatus !== selectedInvoiceStatus) return false;
      if (selectedEInvoiceStatus !== 'All' && order.eInvoiceStatus !== selectedEInvoiceStatus) return false;
      if (selectedEwbStatus !== 'All' && order.eWayBillStatus !== selectedEwbStatus) return false;
      if (selectedLinkType === 'Linked' && order.linkType === 'Not Linked') return false;
      if (selectedLinkType === 'Unlinked' && order.linkType !== 'Not Linked') return false;

      return true;
    });
  }, [
    orders,
    activeTab,
    searchQuery,
    selectedCustomer,
    selectedOrderType,
    selectedPlant,
    selectedFgStore,
    selectedStatus,
    selectedDeliveryStatus,
    selectedInvoiceStatus,
    selectedEInvoiceStatus,
    selectedEwbStatus,
    selectedLinkType,
  ]);

  // Order Type Badge helper
  const renderOrderTypeBadge = (type: SalesOrderType) => {
    switch (type) {
      case 'Monthly Plan Order':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">Monthly Plan</span>;
      case 'Daily Sales Order':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Daily Order</span>;
      case 'Blanket/Contract Order':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">Blanket/Contract</span>;
    }
  };

  // Compliance Badges helper
  const renderEInvoiceBadge = (status: string) => {
    switch (status) {
      case 'Generated':
        return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">E-Inv Done</span>;
      case 'Failed':
        return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-800 animate-pulse">E-Inv Failed</span>;
      case 'Pending':
        return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">E-Inv Pend</span>;
      default:
        return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">N/A</span>;
    }
  };

  const renderEwbBadge = (status: string) => {
    switch (status) {
      case 'Generated':
      case 'Vehicle Updated':
        return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">EWB Active</span>;
      case 'Expired':
        return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-800">EWB Expired</span>;
      case 'Pending':
        return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">EWB Pend</span>;
      default:
        return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500">EWB Not Req</span>;
    }
  };

  const tabsList = [
    'All Orders',
    'Daily Orders',
    'Monthly Plan Orders',
    'Draft',
    'Pending Approval',
    'Credit Hold',
    'Confirmed',
    'Partially Delivered',
    'Delivered',
    'Invoiced',
    'Closed',
    'Cancelled',
    'Compliance Exceptions',
  ];

  return (
    <div className="space-y-4">
      {/* Top Banner & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-['Space_Grotesk']">
            Sales Orders Repository (GST Compliant)
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Managing independent daily sales orders alongside monthly demand forecasts and contract schedules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('dailyQuickEntry')}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
          >
            <Zap className="w-3.5 h-3.5 text-[#0F8B8D]" /> Quick Entry
          </button>
          <button
            onClick={() => onCreateOrder('Daily Sales Order')}
            className="px-3.5 py-2 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Sales Order
          </button>
        </div>
      </div>

      {/* 13 Tabs Navigation */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-1 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {tabsList.map((tab) => {
            const isActive = activeTab === tab;
            let count = 0;
            if (tab === 'All Orders') count = orders.length;
            else if (tab === 'Daily Orders') count = orders.filter((o) => o.orderType === 'Daily Sales Order').length;
            else if (tab === 'Monthly Plan Orders') count = orders.filter((o) => o.orderType === 'Monthly Plan Order').length;
            else if (tab === 'Credit Hold') count = orders.filter((o) => o.status === 'Credit Hold' || o.creditStatus === 'Hold').length;
            else if (tab === 'Compliance Exceptions') count = orders.filter((o) => o.eInvoiceStatus === 'Failed' || o.eWayBillStatus === 'Expired').length;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#14213D] text-white shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span>{tab}</span>
                {count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Comprehensive Filter Bar (13 Filter Attributes) */}
      <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search SO #, Customer, PO #, or item description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#0F8B8D]"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <span>Filters:</span>
          </div>

          {/* Customer */}
          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700"
          >
            <option value="All">All Customers</option>
            {customers.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Order Type */}
          <select
            value={selectedOrderType}
            onChange={(e) => setSelectedOrderType(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700"
          >
            <option value="All">All Order Types</option>
            <option value="Daily Sales Order">Daily Sales Order</option>
            <option value="Monthly Plan Order">Monthly Plan Order</option>
            <option value="Blanket/Contract Order">Blanket/Contract Order</option>
          </select>

          {/* Plant */}
          <select
            value={selectedPlant}
            onChange={(e) => setSelectedPlant(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700"
          >
            <option value="All">All Plants</option>
            {plants.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          {/* FG Store */}
          <select
            value={selectedFgStore}
            onChange={(e) => setSelectedFgStore(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700"
          >
            <option value="All">All FG Stores</option>
            {fgStores.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* E-Invoice Status */}
          <select
            value={selectedEInvoiceStatus}
            onChange={(e) => setSelectedEInvoiceStatus(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700"
          >
            <option value="All">All E-Invoice</option>
            <option value="Generated">Generated</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
            <option value="Not Required">Not Required</option>
          </select>

          {/* E-Way Bill Status */}
          <select
            value={selectedEwbStatus}
            onChange={(e) => setSelectedEwbStatus(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700"
          >
            <option value="All">All E-Way Bill</option>
            <option value="Generated">Generated / Active</option>
            <option value="Vehicle Updated">Vehicle Updated</option>
            <option value="Expired">Expired</option>
            <option value="Pending">Pending</option>
          </select>

          {/* Linked / Unlinked */}
          <select
            value={selectedLinkType}
            onChange={(e) => setSelectedLinkType(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700"
          >
            <option value="All">Plan Link: All</option>
            <option value="Linked">Linked to Monthly Plan</option>
            <option value="Unlinked">Unlinked (Independent)</option>
          </select>

          {(selectedCustomer !== 'All' || selectedOrderType !== 'All' || selectedPlant !== 'All' || searchQuery) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCustomer('All');
                setSelectedOrderType('All');
                setSelectedPlant('All');
                setSelectedFgStore('All');
                setSelectedEInvoiceStatus('All');
                setSelectedEwbStatus('All');
                setSelectedLinkType('All');
              }}
              className="text-xs text-red-600 hover:underline font-medium ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Orders Table with Complete Specifications */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50/80 text-[11px] uppercase tracking-wider text-gray-500 font-bold border-b border-gray-200">
              <tr>
                <th className="py-3 px-3">SO Number</th>
                <th className="py-3 px-3">Order Type</th>
                <th className="py-3 px-3">Customer & PO</th>
                <th className="py-3 px-3">Order & Req Date</th>
                <th className="py-3 px-3">Plant & FG Store</th>
                <th className="py-3 px-3 text-right">Quantities (Tot/Del/Rem)</th>
                <th className="py-3 px-3 text-right">Order Value</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Compliance (E-Inv / EWB)</th>
                <th className="py-3 px-3">Monthly Plan Ref</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-gray-400">
                    No sales orders matched the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const totalQty = order.lines.reduce((sum, l) => sum + l.orderedQty, 0);
                  const deliveredQty = order.lines.reduce((sum, l) => sum + l.deliveredQty, 0);
                  const remainingQty = totalQty - deliveredQty;

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50/70 transition-colors group cursor-pointer"
                      onClick={() => onSelectOrder(order.id)}
                    >
                      {/* SO Number */}
                      <td className="py-3 px-3 font-semibold text-gray-900 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#0F8B8D] hover:underline">{order.id}</span>
                          {order.creditStatus === 'Hold' && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-100 text-red-700">
                              HOLD
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-400 font-sans">{order.salesperson}</div>
                      </td>

                      {/* Order Type */}
                      <td className="py-3 px-3">
                        {renderOrderTypeBadge(order.orderType)}
                      </td>

                      {/* Customer & PO */}
                      <td className="py-3 px-3 max-w-[180px]">
                        <div className="font-semibold text-gray-900 truncate" title={order.customer}>
                          {order.customer}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          PO: {order.customerPoNumber || 'N/A'}
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="text-gray-700">Ord: {order.orderDate}</div>
                        <div className="text-[10px] text-gray-500 font-medium">
                          Req: <span className="text-[#14213D] font-semibold">{order.requiredDeliveryDate}</span>
                        </div>
                      </td>

                      {/* Plant & FG Store */}
                      <td className="py-3 px-3 max-w-[160px]">
                        <div className="truncate text-gray-800 font-medium" title={order.plant}>
                          {order.plant.split('-')[0]}
                        </div>
                        <div className="text-[10px] text-gray-400 truncate" title={order.fgStore}>
                          {order.fgStore}
                        </div>
                      </td>

                      {/* Quantities */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="font-semibold text-gray-900">{totalQty.toLocaleString()} PCS</div>
                        <div className="text-[10px] text-gray-400">
                          <span className="text-emerald-600">{deliveredQty.toLocaleString()}</span> /{' '}
                          <span className="text-amber-600">{remainingQty.toLocaleString()} rem</span>
                        </div>
                      </td>

                      {/* Order Value */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="font-bold text-gray-900">
                          ₹{order.totalOrderValue.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          Taxable: ₹{order.taxableAmount.toLocaleString()}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${
                            order.status === 'Ready to Dispatch'
                              ? 'bg-purple-100 text-purple-800'
                              : order.status === 'Credit Hold'
                              ? 'bg-red-100 text-red-800'
                              : order.status === 'Delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : order.status === 'Partially Allocated'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>

                      {/* Compliance Statuses */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          {renderEInvoiceBadge(order.eInvoiceStatus)}
                          {renderEwbBadge(order.eWayBillStatus)}
                        </div>
                      </td>

                      {/* Monthly Plan Reference */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {order.monthlyPlanRef ? (
                          <div className="flex items-center gap-1 text-[11px] text-blue-700 font-semibold">
                            <LinkIcon className="w-3 h-3" />
                            {order.monthlyPlanRef}
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-400 italic">Independent Order</span>
                        )}
                      </td>

                      {/* Row Actions Menu */}
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block text-left">
                          <button
                            onClick={() => setActiveMenuId(activeMenuId === order.id ? null : order.id)}
                            className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {activeMenuId === order.id && (
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1 text-left text-xs">
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onSelectOrder(order.id);
                                }}
                                className="w-full px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                              >
                                <Eye className="w-3.5 h-3.5 text-gray-500" /> View Order Detail
                              </button>
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onNavigate('createDelivery', { soId: order.id });
                                }}
                                className="w-full px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                              >
                                <Truck className="w-3.5 h-3.5 text-amber-600" /> Create Delivery Note
                              </button>
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  showToast(`Customer credit verified for ${order.customer}: ₹85.8L Available.`);
                                }}
                                className="w-full px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                              >
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Check Credit Limit
                              </button>
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onNavigate('reconciliation', { soId: order.id });
                                }}
                                className="w-full px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                              >
                                <LinkIcon className="w-3.5 h-3.5 text-blue-600" /> Link to Monthly Plan
                              </button>
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onNavigate('eInvoiceMgmt');
                                }}
                                className="w-full px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                              >
                                <FileCheck className="w-3.5 h-3.5 text-indigo-600" /> View E-Invoice Status
                              </button>
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onNavigate('eWayBillMgmt');
                                }}
                                className="w-full px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                              >
                                <FileText className="w-3.5 h-3.5 text-orange-600" /> View E-Way Bill
                              </button>
                              <div className="border-t border-gray-100 my-1"></div>
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  showToast(`Order ${order.id} duplicate template created.`);
                                }}
                                className="w-full px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                              >
                                <Copy className="w-3.5 h-3.5 text-gray-400" /> Duplicate Order
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Zap icon component
function Zap(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
