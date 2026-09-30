import React, { useState, useMemo } from 'react';
import {
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Link as LinkIcon,
  Unlink,
  Search,
  Filter,
  Download,
  Calendar,
  Building2,
  TrendingUp,
  Clock,
  Sparkles,
  Info,
  Check,
  RefreshCw,
  Zap,
  BarChart3,
  ShieldCheck,
  Eye,
  FileSpreadsheet,
} from 'lucide-react';
import {
  MonthlyPlanOrder,
  PlasticSalesOrder,
  OrderRelationship,
} from '../../../types/salesOrderDeliveryTypes';

interface MonthlyDailyReconciliationProps {
  monthlyPlans: MonthlyPlanOrder[];
  dailyOrders: PlasticSalesOrder[];
  relationships: OrderRelationship[];
  onUpdateRelationships: (newRels: OrderRelationship[]) => void;
  showToast: (msg: string) => void;
}

export const MonthlyDailyReconciliation: React.FC<MonthlyDailyReconciliationProps> = ({
  monthlyPlans = [],
  dailyOrders = [],
  relationships = [],
  onUpdateRelationships,
  showToast,
}) => {
  const [selectedCustomer, setSelectedCustomer] = useState<string>('All Customers');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('September 2026');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [selectedDailySoIds, setSelectedDailySoIds] = useState<string[]>([]);
  const [mappingReason, setMappingReason] = useState<string>(
    'JIT Call-Off synchronization against committed monthly sales forecast'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'workbench' | 'audit' | 'analytics'>('workbench');

  // Available unique periods
  const availablePeriods = useMemo(() => {
    const periods = Array.from(new Set(monthlyPlans.map((p) => p.monthPeriod || 'September 2026')));
    return periods.length > 0 ? periods : ['September 2026', 'October 2026'];
  }, [monthlyPlans]);

  // Unique customer options
  const customers = useMemo(() => {
    const custs = Array.from(new Set(monthlyPlans.map((p) => p.customer).filter(Boolean)));
    return ['All Customers', ...custs];
  }, [monthlyPlans]);

  // Filtered monthly plans for selected customer / period
  const filteredPlans = useMemo(() => {
    return monthlyPlans.filter((p) => {
      const matchCust = selectedCustomer === 'All Customers' || p.customer === selectedCustomer;
      const matchPeriod = !selectedPeriod || p.monthPeriod === selectedPeriod;
      return matchCust && matchPeriod;
    });
  }, [monthlyPlans, selectedCustomer, selectedPeriod]);

  // Active target plan
  const activePlan = useMemo(() => {
    if (selectedPlanId) {
      const found = monthlyPlans.find((p) => p.id === selectedPlanId);
      if (found) return found;
    }
    return filteredPlans[0] || monthlyPlans[0] || null;
  }, [monthlyPlans, filteredPlans, selectedPlanId]);

  // Month-end SO vs Dispatch vs Invoiced Totals across all plans in selected period
  const monthPeriodTotals = useMemo(() => {
    const plansForPeriod = monthlyPlans.filter(
      (p) =>
        (!selectedPeriod || p.monthPeriod === selectedPeriod) &&
        (selectedCustomer === 'All Customers' || p.customer === selectedCustomer)
    );
    const totalPlanned = plansForPeriod.reduce((sum, p) => sum + (p.totalPlannedQty || 0), 0);
    const totalDispatched = plansForPeriod.reduce((sum, p) => sum + (p.totalDailySuppliedQty || 0), 0);
    const totalRemaining = plansForPeriod.reduce((sum, p) => sum + (p.remainingPlanQty || (p.totalPlannedQty - (p.totalDailySuppliedQty || 0))), 0);
    const totalVal = plansForPeriod.reduce((sum, p) => sum + (p.totalPlannedValue || 0), 0);
    const fulfillPct = totalPlanned > 0 ? Math.min(100, Math.round((totalDispatched / totalPlanned) * 100)) : 0;

    return {
      totalPlanned,
      totalDispatched,
      totalRemaining,
      totalVal,
      fulfillPct,
      planCount: plansForPeriod.length,
    };
  }, [monthlyPlans, selectedPeriod, selectedCustomer]);

  // Filtered daily orders available for linkage
  const availableDailyOrders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return dailyOrders.filter((d) => {
      const matchCust =
        selectedCustomer === 'All Customers' ||
        (d.customer && d.customer.toLowerCase().includes(selectedCustomer.toLowerCase())) ||
        (activePlan && d.customer === activePlan.customer);

      const matchSearch =
        !q ||
        (d.id && d.id.toLowerCase().includes(q)) ||
        (d.customer && d.customer.toLowerCase().includes(q)) ||
        (d.customerPoNumber && d.customerPoNumber.toLowerCase().includes(q)) ||
        d.lines.some(
          (l) =>
            l.itemCode.toLowerCase().includes(q) ||
            l.itemName.toLowerCase().includes(q)
        );

      return matchCust && matchSearch;
    });
  }, [dailyOrders, selectedCustomer, activePlan, searchQuery]);

  // Calculate selected daily SOs total quantity
  const selectedSoTotalQty = useMemo(() => {
    return dailyOrders
      .filter((d) => selectedDailySoIds.includes(d.id))
      .reduce((sum, d) => sum + d.lines.reduce((ls, l) => ls + (l.orderedQty || 0), 0), 0);
  }, [dailyOrders, selectedDailySoIds]);

  // Toggle single SO selection
  const handleToggleSo = (soId: string) => {
    if (selectedDailySoIds.includes(soId)) {
      setSelectedDailySoIds(selectedDailySoIds.filter((id) => id !== soId));
    } else {
      setSelectedDailySoIds([...selectedDailySoIds, soId]);
    }
  };

  // Select all visible SOs
  const handleSelectAllVisibleSos = () => {
    if (selectedDailySoIds.length === availableDailyOrders.length) {
      setSelectedDailySoIds([]);
    } else {
      setSelectedDailySoIds(availableDailyOrders.map((d) => d.id));
    }
  };

  // Perform Reconciliation Mapping
  const handleMapOrders = () => {
    if (!activePlan) {
      showToast('Please select a Monthly Target Plan first.');
      return;
    }
    if (selectedDailySoIds.length === 0) {
      showToast('Please select at least one Daily Sales Order to reconcile.');
      return;
    }

    const newRelationships: OrderRelationship[] = [...relationships];
    let totalLinked = 0;

    selectedDailySoIds.forEach((soId) => {
      const so = dailyOrders.find((d) => d.id === soId);
      if (so) {
        so.lines.forEach((line) => {
          totalLinked += line.orderedQty;
          newRelationships.push({
            id: `MAP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            monthlyPlanId: activePlan.id,
            monthlyPlanLineItem: line.itemCode,
            linkedDailySoId: so.id,
            linkedDailySoLineItem: line.itemCode,
            linkType: 'Manually Mapped',
            linkedQuantity: line.orderedQty,
            remainingMonthlyQuantity: Math.max(0, activePlan.remainingPlanQty - line.orderedQty),
            mappingReason,
            mappedBy: 'Commercial Operations Manager',
            mappingDate: new Date().toISOString().slice(0, 16).replace('T', ' '),
            approvalStatus: 'Approved',
          });
        });
      }
    });

    onUpdateRelationships(newRelationships);
    setSelectedDailySoIds([]);
    showToast(
      `✓ Successfully reconciled ${selectedDailySoIds.length} Daily Order(s) (${totalLinked.toLocaleString()} PCS) against Monthly Plan ${activePlan.id}.`
    );
  };

  // Unmap an existing relationship
  const handleUnmap = (relId: string) => {
    const updated = relationships.filter((r) => r.id !== relId);
    onUpdateRelationships(updated);
    showToast('✓ Linkage detached: Daily order restored to unlinked independent status.');
  };

  // Export CSV summary
  const handleExportCsv = () => {
    const rows = [
      ['Monthly Plan ID', 'Customer', 'Period', 'Planned Qty', 'Dispatched Qty', 'Remaining Qty', 'Fulfillment %', 'Status'],
      ...filteredPlans.map((p) => [
        p.id,
        p.customer,
        p.monthPeriod,
        p.totalPlannedQty,
        p.totalDailySuppliedQty,
        p.remainingPlanQty,
        `${Math.round(((p.totalDailySuppliedQty || 0) / (p.totalPlannedQty || 1)) * 100)}%`,
        p.status,
      ]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Monthly_Daily_Reconciliation_${selectedPeriod.replace(' ', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('✓ Reconciliation summary downloaded as CSV.');
  };

  return (
    <div className="space-y-5">
      {/* Modern Top Header with Glassmorphic Gradient */}
      <div className="bg-gradient-to-r from-[#14213D] via-[#1c2e56] to-[#0F8B8D] text-white p-5 rounded-2xl shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-teal-400/20 text-teal-200 border border-teal-300/30">
              S&amp;OP Demand Balancing &bull; Live Reconciliation
            </span>
            <span className="text-teal-300 text-xs">&bull;</span>
            <span className="text-xs text-slate-300 font-medium">Independent Daily SOs vs Forecast</span>
          </div>
          <h1 className="text-2xl font-bold font-['Space_Grotesk'] mt-1.5 tracking-tight text-white flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-teal-400" />
            Monthly vs. Daily Demand Reconciliation
          </h1>
          <p className="text-xs text-slate-200 mt-1 max-w-2xl leading-relaxed">
            Consolidate daily customer call-offs against contracted monthly plans. View real-time dispatch progress, detect fulfillment gaps, and bind transactional dispatches into master account tally.
          </p>
        </div>

        {/* Global Period & Customer Selectors */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-300" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
            >
              {availablePeriods.map((period) => (
                <option key={period} value={period} className="bg-slate-900 text-white">
                  {period}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-teal-300" />
            <select
              value={selectedCustomer}
              onChange={(e) => {
                setSelectedCustomer(e.target.value);
                setSelectedDailySoIds([]);
              }}
              className="bg-transparent text-white font-bold text-xs focus:outline-none max-w-[200px] truncate cursor-pointer"
            >
              {customers.map((c) => (
                <option key={c} value={c} className="bg-slate-900 text-white">
                  {c}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white border border-white/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-teal-300" /> Export CSV
          </button>
        </div>
      </div>

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-[#0F8B8D] transition">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Planned Commitment
          </div>
          <div className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D] mt-1">
            {monthPeriodTotals.totalPlanned.toLocaleString()} <span className="text-xs text-slate-500">PCS</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>{monthPeriodTotals.planCount} Active Plan(s)</span>
            <span className="font-bold text-slate-700 font-mono">₹{(monthPeriodTotals.totalVal / 100000).toFixed(2)}L</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-500 transition">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
            Dispatched &amp; Delivered
          </div>
          <div className="text-xl font-bold font-['Space_Grotesk'] text-emerald-700 mt-1">
            {monthPeriodTotals.totalDispatched.toLocaleString()} <span className="text-xs text-emerald-600">PCS</span>
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 flex items-center justify-between">
            <span>Fulfilled via Daily SOs</span>
            <span className="font-bold font-mono">{monthPeriodTotals.fulfillPct}% Supplied</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-500 transition">
          <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
            Pending Balance Tally
          </div>
          <div className="text-xl font-bold font-['Space_Grotesk'] text-amber-900 mt-1">
            {monthPeriodTotals.totalRemaining.toLocaleString()} <span className="text-xs text-amber-700">PCS</span>
          </div>
          <div className="text-[11px] text-amber-700 mt-1">
            Remaining unsupplied allocation
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Fulfillment Velocity</span>
              <span className="text-teal-600 font-mono font-bold">{monthPeriodTotals.fulfillPct}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 mt-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#0F8B8D] to-emerald-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${monthPeriodTotals.fulfillPct}%` }}
              />
            </div>
          </div>
          <div className="text-[10px] text-slate-500 mt-2 flex items-center justify-between">
            <span>Target: 100% by Month-End</span>
            <span className="font-semibold text-emerald-700">On Track</span>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('workbench')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'workbench'
                ? 'bg-[#14213D] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Interactive 2-Pane Reconciliation Workbench</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-[#14213D] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Active Linked Relationships ({relationships.length})</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 hidden sm:block">
          Select customer &amp; check daily sales orders to link against monthly forecast
        </div>
      </div>

      {/* Tab 1: Interactive 2-Pane Reconciliation Workbench */}
      {activeTab === 'workbench' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Pane (5 Cols): Monthly Master Plans */}
          <div className="lg:col-span-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#0F8B8D]" />
                Target Monthly Commitments ({filteredPlans.length})
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">Click plan to reconcile</span>
            </div>

            <div className="space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
              {filteredPlans.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400 text-xs">
                  No monthly plans found for {selectedPeriod} and {selectedCustomer}.
                </div>
              ) : (
                filteredPlans.map((plan) => {
                  const isSelected = activePlan?.id === plan.id;
                  const fulfillRatio =
                    plan.totalPlannedQty > 0
                      ? Math.min(100, Math.round(((plan.totalDailySuppliedQty || 0) / plan.totalPlannedQty) * 100))
                      : 0;

                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-teal-50/40 border-[#0F8B8D] shadow-md ring-1 ring-[#0F8B8D]'
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-slate-900">{plan.id}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                              {plan.monthPeriod}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-[#14213D] mt-1">{plan.customer}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{plan.plantWarehouse || 'Plant 1 - Pimpri Auto-Hub'}</div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            plan.status === 'Fully Supplied'
                              ? 'bg-emerald-100 text-emerald-800'
                              : plan.status === 'Partially Supplied'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {plan.status}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="text-slate-500">
                            Dispatched: <b>{(plan.totalDailySuppliedQty || 0).toLocaleString()}</b> / {plan.totalPlannedQty.toLocaleString()} PCS
                          </span>
                          <span className="font-bold text-[#0F8B8D] font-mono">{fulfillRatio}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              fulfillRatio >= 100 ? 'bg-emerald-500' : 'bg-[#0F8B8D]'
                            }`}
                            style={{ width: `${fulfillRatio}%` }}
                          />
                        </div>
                      </div>

                      {/* SKU Items in Plan */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-1.5">
                        {plan.items.map((it) => (
                          <span
                            key={it.itemCode}
                            className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] text-slate-700 font-mono"
                          >
                            {it.itemCode}: <b>{it.plannedQty.toLocaleString()}</b>
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Pane (7 Cols): Daily Sales Orders Available for Reconciling */}
          <div className="lg:col-span-7 space-y-3.5">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Unreconciled / Daily Sales Orders ({availableDailyOrders.length})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Target Plan: <b className="text-slate-900 font-mono">{activePlan?.id || 'Select Plan'}</b> &bull; Customer: <b className="text-slate-900">{activePlan?.customer || selectedCustomer}</b>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search SO #, SKU..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs w-44 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                    />
                  </div>

                  <button
                    onClick={handleSelectAllVisibleSos}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    {selectedDailySoIds.length === availableDailyOrders.length && availableDailyOrders.length > 0
                      ? 'Deselect All'
                      : 'Select All'}
                  </button>
                </div>
              </div>

              {/* Daily SOs List Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[420px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="p-2.5 text-center w-10">Select</th>
                      <th className="p-2.5 font-bold">SO Number</th>
                      <th className="p-2.5 font-bold">Customer &amp; PO</th>
                      <th className="p-2.5 font-bold">Line Items</th>
                      <th className="p-2.5 font-bold text-right">Order Qty</th>
                      <th className="p-2.5 font-bold text-right">Amount</th>
                      <th className="p-2.5 font-bold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {availableDailyOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          No daily sales orders found matching selection.
                        </td>
                      </tr>
                    ) : (
                      availableDailyOrders.map((so) => {
                        const isChecked = selectedDailySoIds.includes(so.id);
                        const totalQty = so.lines.reduce((s, l) => s + (l.orderedQty || 0), 0);

                        return (
                          <tr
                            key={so.id}
                            onClick={() => handleToggleSo(so.id)}
                            className={`hover:bg-teal-50/30 transition cursor-pointer ${
                              isChecked ? 'bg-teal-50/50 font-medium' : ''
                            }`}
                          >
                            <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleSo(so.id)}
                                className="rounded text-[#0F8B8D] focus:ring-[#0F8B8D] cursor-pointer"
                              />
                            </td>
                            <td className="p-2.5">
                              <span className="font-mono font-bold text-slate-900">{so.id}</span>
                              <div className="text-[10px] text-slate-500">{so.orderDate || '2026-09-12'}</div>
                            </td>
                            <td className="p-2.5">
                              <div className="font-semibold text-slate-800 truncate max-w-[150px]">{so.customer}</div>
                              <div className="text-[10px] text-slate-500 font-mono">PO: {so.customerPoNumber || 'N/A'}</div>
                            </td>
                            <td className="p-2.5">
                              <div className="text-slate-700 truncate max-w-[160px]">
                                {so.lines[0]?.itemName || so.lines[0]?.itemCode || 'SKU'}
                              </div>
                              {so.lines.length > 1 && (
                                <div className="text-[10px] text-slate-400">+{so.lines.length - 1} more SKU(s)</div>
                              )}
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                              {totalQty.toLocaleString()} {so.lines[0]?.uom || 'PCS'}
                            </td>
                            <td className="p-2.5 text-right font-mono text-slate-800">
                              ₹{(so.totalOrderValue || 0).toLocaleString()}
                            </td>
                            <td className="p-2.5 text-center">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                {so.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Action Banner to Commit Mapping */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold uppercase text-slate-600 block">
                      Reconciliation Action Summary
                    </span>
                    <div className="text-xs text-slate-700 mt-0.5">
                      Selected <b>{selectedDailySoIds.length} Daily SO(s)</b> totaling{' '}
                      <b className="text-[#0F8B8D] font-mono">{selectedSoTotalQty.toLocaleString()} PCS</b> to bind to{' '}
                      <b className="font-mono">{activePlan?.id}</b>
                    </div>
                  </div>

                  <button
                    disabled={selectedDailySoIds.length === 0 || !activePlan}
                    onClick={handleMapOrders}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm ${
                      selectedDailySoIds.length === 0 || !activePlan
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-[#0F8B8D] hover:bg-[#0c7072] text-white active:scale-95 cursor-pointer'
                    }`}
                  >
                    <LinkIcon className="w-4 h-4" />
                    <span>Reconcile &amp; Bind Selected SOs</span>
                  </button>
                </div>

                <div>
                  <label className="text-[11px] text-slate-500 font-semibold block mb-1">
                    Audit Note / Business Justification:
                  </label>
                  <input
                    type="text"
                    value={mappingReason}
                    onChange={(e) => setMappingReason(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Active Linked Relationships Audit Grid */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-['Space_Grotesk'] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Audited Monthly Plan to Daily SO Bindings ({relationships.length})
              </h3>
              <p className="text-xs text-slate-500">
                Full traceability of all reconciled daily sales orders against customer master demand forecasts.
              </p>
            </div>

            <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 font-mono text-xs font-bold border border-emerald-200">
              {relationships.length} Linkages Active
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#14213D] text-white uppercase text-[10px]">
                <tr>
                  <th className="p-3 font-bold">Linkage ID</th>
                  <th className="p-3 font-bold">Target Monthly Plan</th>
                  <th className="p-3 font-bold">Linked Daily SO</th>
                  <th className="p-3 font-bold">SKU Code</th>
                  <th className="p-3 font-bold text-right">Reconciled Qty</th>
                  <th className="p-3 font-bold">Mapping Reason</th>
                  <th className="p-3 font-bold">Timestamp &amp; User</th>
                  <th className="p-3 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {relationships.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No mapped relationships recorded yet. Use the Interactive Workbench tab to link orders.
                    </td>
                  </tr>
                ) : (
                  relationships.map((rel) => (
                    <tr key={rel.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono font-bold text-slate-900">{rel.id}</td>
                      <td className="p-3 font-mono text-blue-700 font-bold">{rel.monthlyPlanId}</td>
                      <td className="p-3 font-mono text-emerald-700 font-bold">{rel.linkedDailySoId}</td>
                      <td className="p-3 font-mono text-slate-700">{rel.linkedDailySoLineItem || rel.monthlyPlanLineItem}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        {rel.linkedQuantity.toLocaleString()} PCS
                      </td>
                      <td className="p-3 text-slate-600 max-w-[220px] truncate">{rel.mappingReason}</td>
                      <td className="p-3 text-[11px] text-slate-500">
                        <div>{rel.mappingDate || '2026-09-12 11:50'}</div>
                        <div className="text-[10px] text-slate-400">{rel.mappedBy || 'Commercial User'}</div>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleUnmap(rel.id)}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ml-auto cursor-pointer"
                          title="Unlink and detach relationship"
                        >
                          <Unlink className="w-3 h-3" /> Unlink
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
