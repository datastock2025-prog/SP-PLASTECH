import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Layers,
  Info,
  TrendingUp,
  AlertTriangle,
  Plus,
  Eye,
  CheckCircle,
  Link as LinkIcon,
  Search,
  Filter,
  ArrowUpRight,
  Clock,
  Building2,
  Package,
  X,
} from 'lucide-react';
import {
  MonthlyPlanOrder,
  PlasticSalesOrder,
} from '../../../types/salesOrderDeliveryTypes';

interface MonthlyPlanOrdersViewProps {
  monthlyPlans: MonthlyPlanOrder[];
  dailyOrders: PlasticSalesOrder[];
  onNavigate: (view: string, param?: any) => void;
  onCreatePlan?: (plan: MonthlyPlanOrder) => void;
  initialCreateOpen?: boolean;
  onCloseCreateModal?: () => void;
  showToast: (msg: string) => void;
}

export const MonthlyPlanOrdersView: React.FC<MonthlyPlanOrdersViewProps> = ({
  monthlyPlans,
  dailyOrders,
  onNavigate,
  onCreatePlan,
  initialCreateOpen = false,
  onCloseCreateModal,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<string>('All Plans');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(initialCreateOpen);

  useEffect(() => {
    if (initialCreateOpen) {
      setIsCreateModalOpen(true);
    }
  }, [initialCreateOpen]);

  // Form State for creating a new plan
  const [newPlanCustomer, setNewPlanCustomer] = useState('Tata Motors Passenger Vehicles Ltd');
  const [newPlanMonth, setNewPlanMonth] = useState('October 2026');
  const [newPlanType, setNewPlanType] = useState<'Monthly supply plan' | 'Forecast' | 'Rate contract' | 'Billable monthly order'>('Monthly supply plan');
  const [newPlanPlant, setNewPlanPlant] = useState('Plant 1 - Pimpri Auto-Hub');
  const [newPlanItemCode, setNewPlanItemCode] = useState('FG-AUTO-012');
  const [newPlanItemName, setNewPlanItemName] = useState('ABS Dashboard Trim Bezel (Matte Black)');
  const [newPlanQty, setNewPlanQty] = useState('25000');
  const [newPlanRate, setNewPlanRate] = useState('42.50');
  const [newPlanNotes, setNewPlanNotes] = useState('Committed monthly call-off schedule based on OEM production forecasts.');

  // Summary Metrics
  const totalActivePlans = monthlyPlans.filter((p) => !['Closed', 'Expired'].includes(p.status)).length;
  const totalPlannedQty = monthlyPlans.reduce((sum, p) => sum + p.totalPlannedQty, 0);
  const totalDailySupplied = monthlyPlans.reduce((sum, p) => sum + p.totalDailySuppliedQty, 0);
  const remainingPlanQty = monthlyPlans.reduce((sum, p) => sum + p.remainingPlanQty, 0);
  const totalPlannedValue = monthlyPlans.reduce((sum, p) => sum + p.totalPlannedValue, 0);
  const overallVariancePct = (
    ((totalDailySupplied - totalPlannedQty) / totalPlannedQty) *
    100
  ).toFixed(1);

  // Filter tabs
  const filteredPlans = monthlyPlans.filter((plan) => {
    if (activeTab === 'Active Plans' && plan.status === 'Closed') return false;
    if (activeTab === 'Partially Supplied' && plan.status !== 'Partially Supplied') return false;
    if (activeTab === 'Fully Supplied' && plan.status !== 'Fully Supplied') return false;
    if (activeTab === 'Variance (>10%)' && Math.abs(plan.variancePct) < 10) return false;
    if (activeTab === 'Closed/Expired' && !['Closed', 'Expired'].includes(plan.status)) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchId = plan.id.toLowerCase().includes(q);
      const matchCust = plan.customer.toLowerCase().includes(q);
      const matchPeriod = plan.monthPeriod.toLowerCase().includes(q);
      if (!matchId && !matchCust && !matchPeriod) return false;
    }
    return true;
  });

  const selectedPlan = monthlyPlans.find((p) => p.id === selectedPlanId);

  // Daily orders that belong to the selected plan customer
  const relatedDailyOrders = selectedPlan
    ? dailyOrders.filter((d) => d.customer === selectedPlan.customer)
    : [];

  const tabs = [
    'All Plans',
    'Active Plans',
    'Partially Supplied',
    'Fully Supplied',
    'Variance (>10%)',
    'Closed/Expired',
  ];

  return (
    <div className="space-y-5">
      {/* Mandated Prominent Architectural Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
        <div className="p-2 bg-blue-600 text-white rounded-lg shrink-0">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-blue-950">
            Monthly Supply Plans & Demand Forecast Reconciliation
          </h2>
          <p className="text-xs text-blue-800 mt-0.5 leading-relaxed">
            <strong>Key Architecture Rule:</strong> Monthly Plan Orders are customer demand forecasts and supply commitments. Daily Sales Orders are completely independent and do <strong>not</strong> automatically deduct from Monthly Plans unless manually mapped during reconciliation.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-gray-500">Active Plans</div>
          <div className="text-xl font-bold text-gray-900 mt-1">{totalActivePlans}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Automotive & FMCG</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-gray-500">Total Planned Qty</div>
          <div className="text-xl font-bold text-blue-700 mt-1">{totalPlannedQty.toLocaleString()}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Target supply PCS</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-gray-500">Total Daily Supplied</div>
          <div className="text-xl font-bold text-emerald-700 mt-1">{totalDailySupplied.toLocaleString()}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Delivered via Daily SOs</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-gray-500">Remaining Plan Qty</div>
          <div className="text-xl font-bold text-amber-700 mt-1">{remainingPlanQty.toLocaleString()}</div>
          <div className="text-[10px] text-amber-600 mt-0.5">Pending call-offs</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-gray-500">Total Planned Value</div>
          <div className="text-xl font-bold text-gray-900 mt-1">₹{(totalPlannedValue / 100000).toFixed(1)}L</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Commitment total</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-gray-500">Overall Variance</div>
          <div className="text-xl font-bold text-purple-700 mt-1">{overallVariancePct}%</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Forecast alignment</div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSelectedPlanId(null);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-[#14213D] text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Search plan #, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none"
            />
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3 py-1.5 bg-[#14213D] hover:bg-[#1f335e] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" /> Create Monthly Plan
          </button>
          <button
            onClick={() => onNavigate('reconciliation')}
            className="px-3 py-1.5 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors whitespace-nowrap"
          >
            <Layers className="w-3.5 h-3.5" /> Reconcile Hub
          </button>
        </div>
      </div>

      {/* Main List Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden text-xs">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider text-[11px] border-b border-gray-200">
            <tr>
              <th className="p-3">Plan ID</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Month Period</th>
              <th className="p-3">Plant & FG Store</th>
              <th className="p-3 text-right">Planned Qty</th>
              <th className="p-3 text-right">Daily Supplied</th>
              <th className="p-3 text-right">Remaining</th>
              <th className="p-3 text-right">Variance %</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredPlans.map((plan) => (
              <tr
                key={plan.id}
                className={`hover:bg-gray-50/70 transition-colors cursor-pointer ${
                  selectedPlanId === plan.id ? 'bg-blue-50/40' : ''
                }`}
                onClick={() => setSelectedPlanId(plan.id)}
              >
                <td className="p-3 font-mono font-bold text-[#0F8B8D]">{plan.id}</td>
                <td className="p-3 font-semibold text-gray-900">{plan.customer}</td>
                <td className="p-3 text-gray-700 font-medium">{plan.monthPeriod}</td>
                <td className="p-3 text-gray-600">
                  <div>{plan.plant.split('-')[0]}</div>
                  <div className="text-[10px] text-gray-400">{plan.fgStore}</div>
                </td>
                <td className="p-3 text-right font-bold text-gray-900">
                  {plan.totalPlannedQty.toLocaleString()}
                </td>
                <td className="p-3 text-right font-semibold text-emerald-700">
                  {plan.totalDailySuppliedQty.toLocaleString()}
                </td>
                <td className="p-3 text-right font-semibold text-amber-700">
                  {plan.remainingPlanQty.toLocaleString()}
                </td>
                <td className="p-3 text-right font-mono font-bold">
                  <span
                    className={
                      plan.variancePct > 0
                        ? 'text-red-600'
                        : plan.variancePct < 0
                        ? 'text-amber-600'
                        : 'text-gray-600'
                    }
                  >
                    {plan.variancePct > 0 ? `+${plan.variancePct}%` : `${plan.variancePct}%`}
                  </span>
                </td>
                <td className="p-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      plan.status === 'Fully Supplied'
                        ? 'bg-emerald-100 text-emerald-800'
                        : plan.status === 'Variance'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {plan.status}
                  </span>
                </td>
                <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setSelectedPlanId(plan.id)}
                    className="px-2.5 py-1 text-xs font-semibold text-[#0F8B8D] hover:bg-[#0F8B8D]/10 rounded"
                  >
                    View Breakdown
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Selected Plan In-depth Breakdown */}
      {selectedPlan && (
        <div className="bg-white p-5 rounded-xl border border-[#0F8B8D]/30 shadow-md space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <div className="text-[11px] font-semibold text-[#0F8B8D] uppercase tracking-wider">
                Detailed Product-Wise Reconciliation Breakdown
              </div>
              <h3 className="text-lg font-bold text-gray-900 mt-0.5">
                {selectedPlan.id} &bull; {selectedPlan.customer} ({selectedPlan.monthPeriod})
              </h3>
            </div>
            <button
              onClick={() => onNavigate('reconciliation')}
              className="px-3 py-1.5 bg-[#14213D] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <LinkIcon className="w-3.5 h-3.5" /> Open Reconciliation Matrix
            </button>
          </div>

          {/* Line items in Plan */}
          <div className="space-y-2 text-xs">
            <h4 className="font-bold text-gray-700 uppercase text-[11px]">Product Commitments</h4>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-100 text-gray-600 font-semibold text-[11px]">
                  <tr>
                    <th className="p-2.5">Item Code</th>
                    <th className="p-2.5">Description</th>
                    <th className="p-2.5 text-right">Planned Qty</th>
                    <th className="p-2.5 text-right">Delivered Qty</th>
                    <th className="p-2.5 text-right">Invoiced Qty</th>
                    <th className="p-2.5 text-right">Remaining</th>
                    <th className="p-2.5 text-right">Unit Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedPlan.items.map((item) => (
                    <tr key={item.itemCode} className="hover:bg-gray-50">
                      <td className="p-2.5 font-mono font-bold text-gray-900">{item.itemCode}</td>
                      <td className="p-2.5 font-semibold text-gray-800">{item.itemName}</td>
                      <td className="p-2.5 text-right font-bold text-gray-900">{item.plannedQty.toLocaleString()} {item.uom}</td>
                      <td className="p-2.5 text-right font-bold text-emerald-700">{item.deliveredQty.toLocaleString()}</td>
                      <td className="p-2.5 text-right text-indigo-700 font-semibold">{item.invoicedQty.toLocaleString()}</td>
                      <td className="p-2.5 text-right font-bold text-amber-700">{item.remainingQty.toLocaleString()}</td>
                      <td className="p-2.5 text-right font-mono">₹{item.rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Related Daily Orders Section with One-Click Mapping */}
          <div className="space-y-2 text-xs pt-2">
            <h4 className="font-bold text-gray-700 uppercase text-[11px]">
              Daily Orders for this Customer ({relatedDailyOrders.length})
            </h4>
            <div className="space-y-2">
              {relatedDailyOrders.map((doOrder) => {
                const isLinked = doOrder.monthlyPlanRef === selectedPlan.id;
                return (
                  <div
                    key={doOrder.id}
                    className="p-3 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-gray-900">{doOrder.id}</span>
                      <span className="text-gray-500">PO: {doOrder.customerPoNumber}</span>
                      <span className="text-gray-500">Date: {doOrder.orderDate}</span>
                      <span className="font-semibold text-gray-900">
                        ₹{doOrder.totalOrderValue.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isLinked ? (
                        <span className="flex items-center gap-1 text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                          <CheckCircle className="w-3.5 h-3.5" /> Mapped to Plan
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            showToast(`Mapped Daily SO ${doOrder.id} to Monthly Plan ${selectedPlan.id}.`);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-semibold"
                        >
                          <LinkIcon className="w-3 h-3" /> Map to Plan
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {/* Create Monthly Plan Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#14213D] text-white rounded-xl">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Create Monthly Plan Order (Demand Forecast)
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Supply commitment & customer forecast schedule. Not auto-deducted by daily dispatches.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  if (onCloseCreateModal) onCloseCreateModal();
                }}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Target Customer</label>
                  <select
                    value={newPlanCustomer}
                    onChange={(e) => setNewPlanCustomer(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-[#14213D] focus:outline-none"
                  >
                    <option value="Tata Motors Passenger Vehicles Ltd">Tata Motors Passenger Vehicles Ltd</option>
                    <option value="Marico Consumer Goods Ltd">Marico Consumer Goods Ltd</option>
                    <option value="Bajaj Auto Ltd">Bajaj Auto Ltd</option>
                    <option value="Mahindra Automotive Div">Mahindra Automotive Div</option>
                    <option value="Motherson Sumi Systems">Motherson Sumi Systems</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Plan Month Period</label>
                  <input
                    type="text"
                    value={newPlanMonth}
                    onChange={(e) => setNewPlanMonth(e.target.value)}
                    placeholder="e.g. October 2026"
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-[#14213D] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Manufacturing Plant</label>
                  <select
                    value={newPlanPlant}
                    onChange={(e) => setNewPlanPlant(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-[#14213D] focus:outline-none"
                  >
                    <option value="Plant 1 - Pimpri Auto-Hub">Plant 1 - Pimpri Auto-Hub</option>
                    <option value="Plant 2 - Chakan Moulding">Plant 2 - Chakan Moulding</option>
                    <option value="Plant 3 - Sanand Polymers">Plant 3 - Sanand Polymers</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Plan Classification</label>
                  <select
                    value={newPlanType}
                    onChange={(e) => setNewPlanType(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-[#14213D] focus:outline-none"
                  >
                    <option value="Monthly supply plan">Monthly supply plan</option>
                    <option value="Forecast">Forecast</option>
                    <option value="Rate contract">Rate contract</option>
                    <option value="Billable monthly order">Billable monthly order</option>
                  </select>
                </div>
              </div>

              {/* Item Details */}
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                <div className="font-bold text-gray-800 flex items-center justify-between">
                  <span>Planned Line Item</span>
                  <span className="text-[11px] font-normal text-gray-500">Auto-calculated value</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-600 mb-1">Item Code</label>
                    <select
                      value={newPlanItemCode}
                      onChange={(e) => {
                        setNewPlanItemCode(e.target.value);
                        if (e.target.value === 'FG-AUTO-012') {
                          setNewPlanItemName('ABS Dashboard Trim Bezel (Matte Black)');
                          setNewPlanRate('42.50');
                        } else if (e.target.value === 'FG-AUTO-045') {
                          setNewPlanItemName('PP Air Duct Housing - Front Left');
                          setNewPlanRate('28.75');
                        } else if (e.target.value === 'FG-CAP-28-WHT') {
                          setNewPlanItemName('28mm Flip-Top Oil Dispenser Cap (White)');
                          setNewPlanRate('3.40');
                        } else if (e.target.value === 'FG-BTL-HDPE-500') {
                          setNewPlanItemName('500ml HDPE Shampoo Bottle Container');
                          setNewPlanRate('12.80');
                        }
                      }}
                      className="w-full border border-gray-300 rounded-lg p-2 bg-white"
                    >
                      <option value="FG-AUTO-012">FG-AUTO-012 (Dashboard Trim Bezel)</option>
                      <option value="FG-AUTO-045">FG-AUTO-045 (Air Duct Housing)</option>
                      <option value="FG-CAP-28-WHT">FG-CAP-28-WHT (28mm Flip-Top Cap)</option>
                      <option value="FG-BTL-HDPE-500">FG-BTL-HDPE-500 (500ml HDPE Bottle)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-600 mb-1">Item Description</label>
                    <input
                      type="text"
                      value={newPlanItemName}
                      onChange={(e) => setNewPlanItemName(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-600 mb-1">Planned Quantity (PCS)</label>
                    <input
                      type="number"
                      min="1"
                      value={newPlanQty}
                      onChange={(e) => setNewPlanQty(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-600 mb-1">Unit Rate (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newPlanRate}
                      onChange={(e) => setNewPlanRate(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-xs">
                  <span className="text-gray-600 font-medium">Estimated Monthly Commitment Value:</span>
                  <span className="text-base font-extrabold text-[#14213D]">
                    ₹{((parseFloat(newPlanQty) || 0) * (parseFloat(newPlanRate) || 0)).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Commitment Notes & Call-off Rules</label>
                <textarea
                  rows={2}
                  value={newPlanNotes}
                  onChange={(e) => setNewPlanNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  if (onCloseCreateModal) onCloseCreateModal();
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const qty = parseInt(newPlanQty, 10) || 10000;
                  const rate = parseFloat(newPlanRate) || 35;
                  const totalVal = qty * rate;
                  const randomSuffix = Math.floor(10 + Math.random() * 90);
                  const generatedId = `PLN-2026-10-${randomSuffix}`;

                  const newPlanObj: MonthlyPlanOrder = {
                    id: generatedId,
                    customer: newPlanCustomer,
                    customerGstin: '27AAACG0943A1ZX',
                    monthPeriod: newPlanMonth || 'October 2026',
                    planType: newPlanType,
                    consumptionMode: 'Manual reconciliation',
                    billingMode: 'Reconciliation only',
                    status: 'Published',
                    plant: newPlanPlant,
                    fgStore: 'FG-Automotive Cell',
                    createdDate: '2026-09-15',
                    items: [
                      {
                        itemCode: newPlanItemCode,
                        itemName: newPlanItemName,
                        hsn: '39269099',
                        plannedQty: qty,
                        deliveredQty: 0,
                        invoicedQty: 0,
                        remainingQty: qty,
                        rate,
                        uom: 'PCS',
                        plant: newPlanPlant,
                        fgStore: 'FG-Automotive Cell',
                      },
                    ],
                    totalPlannedQty: qty,
                    totalDailySuppliedQty: 0,
                    remainingPlanQty: qty,
                    varianceQty: -qty,
                    variancePct: -100,
                    totalPlannedValue: totalVal,
                    notes: newPlanNotes,
                    auditTrail: [
                      {
                        action: 'Monthly Plan Created',
                        user: 'Supply Planning Executive',
                        timestamp: '2026-09-15 11:30',
                        note: 'Created via Monthly Demand Planning Center',
                      },
                    ],
                  };

                  if (onCreatePlan) {
                    onCreatePlan(newPlanObj);
                  }
                  showToast(`Monthly Plan Order ${generatedId} created successfully.`);
                  setIsCreateModalOpen(false);
                  if (onCloseCreateModal) onCloseCreateModal();
                }}
                className="px-4 py-2 bg-[#14213D] hover:bg-[#1f335e] text-white rounded-lg font-semibold shadow-sm transition-colors"
              >
                Confirm & Create Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
