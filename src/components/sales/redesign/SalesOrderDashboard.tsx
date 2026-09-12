import React, { useState } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Plus,
  ShoppingBag,
  Calendar,
  Truck,
  CheckCircle,
  Clock,
  ShieldAlert,
  FileText,
  FileCheck,
  AlertOctagon,
  Layers,
  ArrowUpRight,
  Filter,
  BarChart3,
  Building2,
  Package,
  Eye,
  RefreshCw,
} from 'lucide-react';
import {
  PlasticSalesOrder,
  MonthlyPlanOrder,
  DeliveryNoteChallan,
  ComplianceExceptionRecord,
} from '../../../types/salesOrderDeliveryTypes';

interface SalesOrderDashboardProps {
  orders: PlasticSalesOrder[];
  monthlyPlans: MonthlyPlanOrder[];
  deliveries: DeliveryNoteChallan[];
  exceptions: ComplianceExceptionRecord[];
  onNavigate: (view: string, param?: any) => void;
  onQuickAction: (action: string) => void;
}

export const SalesOrderDashboard: React.FC<SalesOrderDashboardProps> = ({
  orders,
  monthlyPlans,
  deliveries,
  exceptions,
  onNavigate,
  onQuickAction,
}) => {
  const [selectedPlantFilter, setSelectedPlantFilter] = useState<string>('All');

  // KPI Calculations
  const openOrders = orders.filter((o) => !['Delivered', 'Invoiced', 'Closed', 'Cancelled'].includes(o.status));
  const dailyOrdersToday = orders.filter((o) => o.orderType === 'Daily Sales Order');
  const activeMonthlyPlans = monthlyPlans.filter((p) => !['Expired', 'Closed'].includes(p.status));
  const pendingConfirmation = orders.filter((o) => o.status === 'Draft' || o.status === 'Pending Approval');
  const creditHold = orders.filter((o) => o.status === 'Credit Hold' || o.creditStatus === 'Hold');
  const pendingStock = orders.filter((o) => o.lines.some((l) => l.shortageQty > 0));
  const pendingDispatch = orders.filter((o) => o.status === 'Ready to Dispatch');
  const partiallyDelivered = orders.filter((o) => o.deliveryStatus === 'Partially Delivered');
  const deliveredOrders = orders.filter((o) => o.status === 'Delivered');
  const invoicedOrders = orders.filter((o) => o.invoiceStatus === 'Fully Invoiced');
  const eInvoicePending = orders.filter((o) => o.eInvoiceStatus === 'Pending');
  const eInvoiceFailed = orders.filter((o) => o.eInvoiceStatus === 'Failed');
  const ewbPending = orders.filter((o) => o.eWayBillStatus === 'Pending');
  const ewbExpired = deliveries.filter((d) => d.eWayBillStatus === 'Expired');
  const overdueDeliveries = orders.filter((o) => new Date(o.requiredDeliveryDate) < new Date('2026-09-12'));

  return (
    <div className="space-y-6">
      {/* Header & Quick Actions Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#E4E0D6] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-[#0F8B8D]/10 text-[#0F8B8D]">
              COMMERCIAL & DISPATCH OPERATIONS
            </span>
            <span className="text-xs text-gray-400">&bull;</span>
            <span className="text-xs text-gray-500 font-medium">Indian Plastic Manufacturing ERP</span>
          </div>
          <h1 className="text-2xl font-bold text-[#14213D] font-['Space_Grotesk'] mt-1">
            Sales Order & Demand Command Center
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Real-time synchronization across independent daily orders, monthly demand reconciliation, FEFO stock, and GST/E-Way compliance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onQuickAction('createDailySo')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Daily Sales Order
          </button>
          <button
            onClick={() => onQuickAction('createMonthlyPlan')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#14213D] hover:bg-[#1f335e] text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <Calendar className="w-4 h-4" />
            Create Monthly Plan
          </button>
          <button
            onClick={() => onQuickAction('createDelivery')}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <Truck className="w-4 h-4" />
            Create Delivery Note
          </button>
          <button
            onClick={() => onQuickAction('checkStock')}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold transition-all"
          >
            <Package className="w-4 h-4 text-gray-600" />
            Check FG Stock
          </button>
        </div>
      </div>

      {/* 15 KPI Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Order Lifecycle & Compliance KPIs (15 Metrics)
          </h2>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400">Filter Plant:</span>
            <select
              value={selectedPlantFilter}
              onChange={(e) => setSelectedPlantFilter(e.target.value)}
              className="bg-white border border-gray-200 rounded px-2 py-1 text-xs text-gray-700 focus:outline-none"
            >
              <option value="All">All Plants & Warehouses</option>
              <option value="Plant 1">Plant 1 - Pimpri Auto-Hub</option>
              <option value="Plant 2">Plant 2 - Chakan Packaging</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {/* 1. Open Sales Orders */}
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm hover:border-[#0F8B8D] transition-colors">
            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Open Sales Orders</div>
            <div className="text-xl font-bold text-gray-900 mt-1">{openOrders.length}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Active in processing pipeline</div>
          </div>

          {/* 2. Daily Orders Today */}
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm hover:border-emerald-500 transition-colors">
            <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Daily Orders Today</div>
            <div className="text-xl font-bold text-emerald-700 mt-1">{dailyOrdersToday.length}</div>
            <div className="text-[10px] text-emerald-600 mt-0.5">Transactional daily flow</div>
          </div>

          {/* 3. Monthly Plan Orders Active */}
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm hover:border-blue-500 transition-colors">
            <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">Monthly Plan Active</div>
            <div className="text-xl font-bold text-blue-700 mt-1">{activeMonthlyPlans.length}</div>
            <div className="text-[10px] text-blue-600 mt-0.5">Demand reconciliation</div>
          </div>

          {/* 4. Orders Pending Confirmation */}
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm hover:border-amber-500 transition-colors">
            <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Pending Confirm</div>
            <div className="text-xl font-bold text-amber-700 mt-1">{pendingConfirmation.length}</div>
            <div className="text-[10px] text-amber-600 mt-0.5">Draft / approval review</div>
          </div>

          {/* 5. Orders on Credit Hold */}
          <div className="bg-red-50/50 p-3.5 rounded-xl border border-red-200 shadow-sm">
            <div className="text-[11px] font-semibold text-red-700 uppercase tracking-wider flex items-center justify-between">
              Credit Hold <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
            </div>
            <div className="text-xl font-bold text-red-700 mt-1">{creditHold.length}</div>
            <div className="text-[10px] text-red-600 mt-0.5">Exposure blocked</div>
          </div>

          {/* 6. Orders Pending Stock */}
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">Pending Stock</div>
            <div className="text-xl font-bold text-amber-600 mt-1">{pendingStock.length}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Shortage awaiting WIP</div>
          </div>

          {/* 7. Orders Pending Dispatch */}
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider">Pending Dispatch</div>
            <div className="text-xl font-bold text-purple-700 mt-1">{pendingDispatch.length}</div>
            <div className="text-[10px] text-purple-600 mt-0.5">Ready at dock</div>
          </div>

          {/* 8. Partially Delivered Orders */}
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">Partially Delivered</div>
            <div className="text-xl font-bold text-blue-600 mt-1">{partiallyDelivered.length}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Multiple drop shipments</div>
          </div>

          {/* 9. Delivered Orders */}
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Delivered Orders</div>
            <div className="text-xl font-bold text-emerald-700 mt-1">{deliveredOrders.length}</div>
            <div className="text-[10px] text-emerald-600 mt-0.5">Completed supply cycle</div>
          </div>

          {/* 10. Invoiced Orders */}
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider">Invoiced Orders</div>
            <div className="text-xl font-bold text-indigo-700 mt-1">{invoicedOrders.length}</div>
            <div className="text-[10px] text-indigo-600 mt-0.5">Commercial bill booked</div>
          </div>

          {/* 11. E-Invoice Pending */}
          <div className="bg-amber-50/40 p-3.5 rounded-xl border border-amber-200 shadow-sm">
            <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">E-Invoice Pending</div>
            <div className="text-xl font-bold text-amber-800 mt-1">{eInvoicePending.length}</div>
            <div className="text-[10px] text-amber-700 mt-0.5">IRP queue pending</div>
          </div>

          {/* 12. E-Invoice Failed */}
          <div className="bg-red-50 p-3.5 rounded-xl border border-red-300 shadow-sm">
            <div className="text-[11px] font-semibold text-red-800 uppercase tracking-wider flex items-center justify-between">
              E-Invoice Failed <AlertOctagon className="w-3.5 h-3.5 text-red-600" />
            </div>
            <div className="text-xl font-bold text-red-700 mt-1">{eInvoiceFailed.length}</div>
            <div className="text-[10px] text-red-600 mt-0.5">Dispatch blocked</div>
          </div>

          {/* 13. E-Way Bill Pending */}
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">E-Way Bill Pending</div>
            <div className="text-xl font-bold text-amber-700 mt-1">{ewbPending.length}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Part A / Part B pending</div>
          </div>

          {/* 14. E-Way Bill Expired */}
          <div className="bg-red-50/60 p-3.5 rounded-xl border border-red-200 shadow-sm">
            <div className="text-[11px] font-semibold text-red-700 uppercase tracking-wider">EWB Expired</div>
            <div className="text-xl font-bold text-red-700 mt-1">{ewbExpired.length}</div>
            <div className="text-[10px] text-red-600 mt-0.5">Requires extension</div>
          </div>

          {/* 15. Overdue Deliveries */}
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-[11px] font-semibold text-gray-700 uppercase tracking-wider">Overdue Deliveries</div>
            <div className="text-xl font-bold text-gray-800 mt-1">{overdueDeliveries.length}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Past promised date</div>
          </div>
        </div>
      </div>

      {/* Alert Panel */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              Operational Exception Alert Panel (Requires Attention)
            </span>
          </div>
          <span className="text-[11px] bg-amber-200/60 text-amber-900 font-semibold px-2 py-0.5 rounded-full">
            8 Live Triggers
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white p-3 rounded-lg border border-red-200 shadow-2xs flex items-start gap-2.5">
            <div className="p-1.5 bg-red-100 text-red-700 rounded-md shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900">Credit Hold Order</div>
              <div className="text-[11px] text-gray-600">SO-5003 Bajaj Auto exceeded limit by ₹4.5L</div>
              <button
                onClick={() => onNavigate('soDetail', { id: 'SO-5003' })}
                className="text-[10px] text-red-700 font-semibold mt-1 hover:underline flex items-center gap-0.5"
              >
                Review Exposure <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-amber-200 shadow-2xs flex items-start gap-2.5">
            <div className="p-1.5 bg-amber-100 text-amber-700 rounded-md shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900">Stock Shortage</div>
              <div className="text-[11px] text-gray-600">SO-5002 Marico short 5,000 caps in Chakan</div>
              <button
                onClick={() => onNavigate('soDetail', { id: 'SO-5002' })}
                className="text-[10px] text-amber-700 font-semibold mt-1 hover:underline flex items-center gap-0.5"
              >
                Check Stock / WIP <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-blue-200 shadow-2xs flex items-start gap-2.5">
            <div className="p-1.5 bg-blue-100 text-blue-700 rounded-md shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900">Monthly Plan Variance</div>
              <div className="text-[11px] text-gray-600">PLN-2026-09-03 has +10% order surge</div>
              <button
                onClick={() => onNavigate('monthlyPlan')}
                className="text-[10px] text-blue-700 font-semibold mt-1 hover:underline flex items-center gap-0.5"
              >
                Reconcile Demand <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-red-200 shadow-2xs flex items-start gap-2.5">
            <div className="p-1.5 bg-red-100 text-red-700 rounded-md shrink-0">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900">E-Invoice Failed</div>
              <div className="text-[11px] text-gray-600">DN-4003 IRP Error 2184: GSTIN POS mismatch</div>
              <button
                onClick={() => onNavigate('eInvoiceMgmt')}
                className="text-[10px] text-red-700 font-semibold mt-1 hover:underline flex items-center gap-0.5"
              >
                Fix & Retry IRP <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-amber-200 shadow-2xs flex items-start gap-2.5">
            <div className="p-1.5 bg-amber-100 text-amber-700 rounded-md shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900">EWB Expiring Soon</div>
              <div className="text-[11px] text-gray-600">EWB 241088492019 has 38 hrs validity left</div>
              <button
                onClick={() => onNavigate('eWayBillMgmt')}
                className="text-[10px] text-amber-700 font-semibold mt-1 hover:underline flex items-center gap-0.5"
              >
                Monitor EWB <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-2xs flex items-start gap-2.5">
            <div className="p-1.5 bg-gray-100 text-gray-700 rounded-md shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900">Dispatch Delayed</div>
              <div className="text-[11px] text-gray-600">DN-4004 transshipment in Gwalior bypass</div>
              <button
                onClick={() => onNavigate('deliveryTracking')}
                className="text-[10px] text-gray-700 font-semibold mt-1 hover:underline flex items-center gap-0.5"
              >
                Live GPS Status <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-emerald-200 shadow-2xs flex items-start gap-2.5">
            <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-md shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900">Vehicle Waiting at Gate</div>
              <div className="text-[11px] text-gray-600">MH-14-GH-8821 verified & at Gate 2</div>
              <button
                onClick={() => onNavigate('gatePassMgmt')}
                className="text-[10px] text-emerald-700 font-semibold mt-1 hover:underline flex items-center gap-0.5"
              >
                Security Gate Release <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-purple-200 shadow-2xs flex items-start gap-2.5">
            <div className="p-1.5 bg-purple-100 text-purple-700 rounded-md shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900">Unlinked Daily Order</div>
              <div className="text-[11px] text-gray-600">SO-5002 independent order not mapped</div>
              <button
                onClick={() => onNavigate('reconciliation')}
                className="text-[10px] text-purple-700 font-semibold mt-1 hover:underline flex items-center gap-0.5"
              >
                Map to Monthly Plan <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 8 Specialized Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Widget 1: Sales orders by status */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">1. Orders by Status</h3>
            <BarChart3 className="w-4 h-4 text-gray-400" />
          </div>
          <div className="space-y-2">
            {[
              { label: 'Ready to Dispatch', count: 1, color: 'bg-purple-600' },
              { label: 'Partially Allocated', count: 1, color: 'bg-blue-600' },
              { label: 'Credit Hold', count: 1, color: 'bg-red-600' },
              { label: 'In Production', count: 1, color: 'bg-amber-500' },
              { label: 'Delivered / Invoiced', count: 1, color: 'bg-emerald-600' },
            ].map((st) => (
              <div key={st.label} className="flex items-center justify-between text-xs">
                <span className="text-gray-600 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${st.color}`}></span>
                  {st.label}
                </span>
                <span className="font-semibold text-gray-900">{st.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Widget 2: Daily Order Trend */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">2. Daily Order Trend</h3>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Today (12 Sep)</span>
              <span className="font-bold text-gray-900">₹8.95 L (3 orders)</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Yesterday (11 Sep)</span>
              <span className="font-medium text-gray-800">₹14.20 L (5 orders)</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>MTD Daily Orders</span>
              <span className="font-bold text-[#0F8B8D]">₹1.28 Cr (48 orders)</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
              <div className="bg-[#0F8B8D] h-2 rounded-full" style={{ width: '68%' }}></div>
            </div>
            <div className="text-[10px] text-gray-400">68% of targeted daily volume achieved</div>
          </div>
        </div>

        {/* Widget 3: Monthly Plan vs Actual Supply */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">3. Plan vs Actual</h3>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Planned</span>
              <span className="font-bold text-gray-900">195,000 PCS</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Actual Daily Supplied</span>
              <span className="font-bold text-emerald-600">92,500 PCS</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Remaining Plan</span>
              <span className="font-semibold text-gray-700">102,500 PCS</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '47.4%' }}></div>
            </div>
            <div className="text-[10px] text-blue-600 font-medium">47.4% supplied &bull; Independent by default</div>
          </div>
        </div>

        {/* Widget 4: Orders by Plant */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">4. Orders by Plant</h3>
            <Building2 className="w-4 h-4 text-gray-400" />
          </div>
          <div className="space-y-2.5 text-xs">
            <div>
              <div className="flex justify-between text-gray-700 font-medium mb-1">
                <span>Plant 1 - Pimpri Auto</span>
                <span className="font-bold">₹29.6 L (3 SOs)</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div className="bg-[#14213D] h-1.5 rounded-full" style={{ width: '82%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-gray-700 font-medium mb-1">
                <span>Plant 2 - Chakan Pack</span>
                <span className="font-bold">₹4.49 L (1 SO)</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '18%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Widget 5: Orders by FG Store */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">5. Orders by FG Store</h3>
            <Package className="w-4 h-4 text-gray-400" />
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between border-b border-gray-100 pb-1">
              <span className="text-gray-600">FG-Automotive Cell (P1)</span>
              <span className="font-semibold text-gray-900">2 Orders &bull; 8,500 pcs</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-1">
              <span className="text-gray-600">FG-Main Warehouse (P2)</span>
              <span className="font-semibold text-gray-900">1 Order &bull; 25,000 pcs</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">FG-Export Hub (P1)</span>
              <span className="font-semibold text-gray-900">1 Order &bull; 10,000 pcs</span>
            </div>
          </div>
        </div>

        {/* Widget 6: Top Customers by Order Value */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">6. Top Customers</h3>
            <ShoppingBag className="w-4 h-4 text-gray-400" />
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="font-medium text-gray-800 truncate max-w-[130px]">Maruti Suzuki India</span>
              <span className="font-bold text-gray-900">₹15.38 L</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-800 truncate max-w-[130px]">Bajaj Auto Chakan</span>
              <span className="font-bold text-gray-900">₹9.14 L</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-800 truncate max-w-[130px]">Tata Motors PV</span>
              <span className="font-bold text-gray-900">₹5.11 L</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-800 truncate max-w-[130px]">Marico FMCG</span>
              <span className="font-bold text-gray-900">₹4.49 L</span>
            </div>
          </div>
        </div>

        {/* Widget 7: Delivery Performance */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">7. Delivery SLA & OTIF</h3>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">On-Time In-Full (OTIF)</span>
              <span className="font-bold text-emerald-700">96.4%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Average Dispatch TAT</span>
              <span className="font-semibold text-gray-900">14.2 Hours</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Active Shipments In-Transit</span>
              <span className="font-bold text-blue-600">1 Truck</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">POD Return Rate</span>
              <span className="font-semibold text-gray-800">98.1% within 48h</span>
            </div>
          </div>
        </div>

        {/* Widget 8: Compliance Exceptions */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">8. Compliance Status</h3>
            <ShieldAlert className="w-4 h-4 text-red-500" />
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">E-Invoice IRP Success</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">67% (2/3)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Failed IRP Submissions</span>
              <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800 font-bold text-[10px]">1 Error</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">EWB Active & Valid</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">2 Bills</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Expired EWB</span>
              <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800 font-bold text-[10px]">1 Bill</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Shortcuts into Specialized Screens */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs font-bold text-gray-700 uppercase tracking-wider">
          Quick Workbenches Mentioned in Specification:
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('soList')}
            className="px-3 py-1.5 bg-white border border-gray-300 hover:border-gray-400 rounded-lg text-xs font-medium text-gray-700 shadow-2xs"
          >
            Sales Order List (13 Tabs)
          </button>
          <button
            onClick={() => onNavigate('monthlyPlan')}
            className="px-3 py-1.5 bg-white border border-gray-300 hover:border-gray-400 rounded-lg text-xs font-medium text-gray-700 shadow-2xs"
          >
            Monthly Plan Orders
          </button>
          <button
            onClick={() => onNavigate('dailyQuickEntry')}
            className="px-3 py-1.5 bg-white border border-gray-300 hover:border-gray-400 rounded-lg text-xs font-medium text-gray-700 shadow-2xs"
          >
            Daily Order Quick Entry
          </button>
          <button
            onClick={() => onNavigate('reconciliation')}
            className="px-3 py-1.5 bg-white border border-gray-300 hover:border-gray-400 rounded-lg text-xs font-medium text-gray-700 shadow-2xs"
          >
            Monthly vs Daily Reconciliation
          </button>
          <button
            onClick={() => onNavigate('deliverySchedule')}
            className="px-3 py-1.5 bg-white border border-gray-300 hover:border-gray-400 rounded-lg text-xs font-medium text-gray-700 shadow-2xs"
          >
            Delivery & Dispatch Hub
          </button>
          <button
            onClick={() => onNavigate('complianceExceptions')}
            className="px-3 py-1.5 bg-red-50 border border-red-200 hover:bg-red-100 rounded-lg text-xs font-medium text-red-800 shadow-2xs"
          >
            Compliance Exceptions ({exceptions.length})
          </button>
        </div>
      </div>
    </div>
  );
};
