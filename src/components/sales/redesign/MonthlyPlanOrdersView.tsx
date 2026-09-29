import React, { useState, useEffect, useMemo } from 'react';
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
  Copy,
  ChevronDown,
  ChevronRight,
  ShoppingCart,
  ArrowRight,
  Sparkles,
  Check,
  FilePlus,
  Factory,
  CheckCircle2,
} from 'lucide-react';
import {
  MonthlyPlanOrder,
  PlasticSalesOrder,
} from '../../../types/salesOrderDeliveryTypes';
import { addPurchaseRequisition } from '../../../data/procurementData';
import { adminEventBus } from '../../../services/adminService';
import { PurchaseRequisition } from '../../../types/procurement';

interface MonthlyPlanOrdersViewProps {
  monthlyPlans: MonthlyPlanOrder[];
  dailyOrders: PlasticSalesOrder[];
  onNavigate: (view: string, param?: any) => void;
  onCreatePlan?: (plan: MonthlyPlanOrder) => void;
  initialCreateOpen?: boolean;
  onCloseCreateModal?: () => void;
  showToast: (msg: string) => void;
}

// Helper to advance month string e.g. "October 2026" -> "November 2026"
function getNextMonthPeriod(currentPeriod: string): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const parts = (currentPeriod || '').trim().split(' ');
  if (parts.length >= 2) {
    const monthName = parts[0];
    const year = parseInt(parts[1], 10);
    const mIdx = months.findIndex((m) => m.toLowerCase() === monthName.toLowerCase());
    if (mIdx >= 0) {
      const nextIdx = (mIdx + 1) % 12;
      const nextYear = nextIdx === 0 ? year + 1 : year;
      return `${months[nextIdx]} ${nextYear}`;
    }
  }
  return 'November 2026';
}

export const MonthlyPlanOrdersView: React.FC<MonthlyPlanOrdersViewProps> = ({
  monthlyPlans: propPlans,
  dailyOrders,
  onNavigate,
  onCreatePlan,
  initialCreateOpen = false,
  onCloseCreateModal,
  showToast,
}) => {
  const [plans, setPlans] = useState<MonthlyPlanOrder[]>(propPlans);
  const [activeTab, setActiveTab] = useState<string>('All Plans');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(propPlans[0]?.id || null);
  const [expandedPlanIds, setExpandedPlanIds] = useState<Record<string, boolean>>({
    [propPlans[0]?.id || '']: true,
  });

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(initialCreateOpen);
  const [duplicateModalPlan, setDuplicateModalPlan] = useState<MonthlyPlanOrder | null>(null);

  // Synchronize with parent props
  useEffect(() => {
    if (propPlans && propPlans.length > 0) {
      setPlans(propPlans);
    }
  }, [propPlans]);

  useEffect(() => {
    if (initialCreateOpen) {
      setIsCreateModalOpen(true);
    }
  }, [initialCreateOpen]);

  // Form State for creating a brand new plan
  const [newPlanCustomer, setNewPlanCustomer] = useState('Tata Motors Passenger Vehicles Ltd');
  const [newPlanMonth, setNewPlanMonth] = useState('October 2026');
  const [newPlanType, setNewPlanType] = useState<'Monthly supply plan' | 'Forecast' | 'Rate contract' | 'Billable monthly order'>('Monthly supply plan');
  const [newPlanPlant, setNewPlanPlant] = useState('Plant 1 - Pimpri Auto-Hub');
  const [newPlanItemCode, setNewPlanItemCode] = useState('FG-AUTO-012');
  const [newPlanItemName, setNewPlanItemName] = useState('ABS Dashboard Trim Bezel (Matte Black)');
  const [newPlanQty, setNewPlanQty] = useState('25000');
  const [newPlanRate, setNewPlanRate] = useState('42.50');
  const [newPlanNotes, setNewPlanNotes] = useState('Committed monthly call-off schedule based on OEM production forecasts.');

  // Form State for Duplicate to Next Month Modal
  const [dupMonth, setDupMonth] = useState('');
  const [dupNotes, setDupNotes] = useState('');
  const [dupItems, setDupItems] = useState<
    Array<{
      itemCode: string;
      itemName: string;
      prevPlannedQty: number;
      prevDispatchedQty: number;
      newPlannedQty: number;
      rate: number;
      uom: string;
      plant: string;
      fgStore: string;
    }>
  >([]);

  // Summary Metrics
  const totalActivePlans = plans.filter((p) => !['Closed', 'Expired'].includes(p.status)).length;
  const totalPlannedQty = plans.reduce((sum, p) => sum + p.totalPlannedQty, 0);
  const totalDailySupplied = plans.reduce((sum, p) => sum + p.totalDailySuppliedQty, 0);
  const remainingPlanQty = plans.reduce((sum, p) => sum + (p.totalPlannedQty - p.totalDailySuppliedQty), 0);
  const totalPlannedValue = plans.reduce((sum, p) => sum + p.totalPlannedValue, 0);
  const overallVariancePct = totalPlannedQty > 0
    ? (((totalDailySupplied - totalPlannedQty) / totalPlannedQty) * 100).toFixed(1)
    : '0.0';

  // Filter tabs
  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
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
        const matchItem = plan.items?.some(
          (i) => i.itemCode.toLowerCase().includes(q) || i.itemName.toLowerCase().includes(q)
        );
        if (!matchId && !matchCust && !matchPeriod && !matchItem) return false;
      }
      return true;
    });
  }, [plans, activeTab, searchQuery]);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || filteredPlans[0];

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

  // Open Duplicate Modal for a given plan
  const handleOpenDuplicate = (plan: MonthlyPlanOrder, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDuplicateModalPlan(plan);
    const nextM = getNextMonthPeriod(plan.monthPeriod);
    setDupMonth(nextM);
    setDupNotes(`Rolled forward commitment from ${plan.monthPeriod} (${plan.id}). Planned quantities adjusted for next month forecast.`);
    setDupItems(
      (plan.items || []).map((i) => ({
        itemCode: i.itemCode,
        itemName: i.itemName,
        prevPlannedQty: i.plannedQty,
        prevDispatchedQty: i.deliveredQty || 0,
        newPlannedQty: i.plannedQty, // default same as prev planned, user can edit
        rate: i.rate,
        uom: i.uom || 'PCS',
        plant: i.plant || plan.plant,
        fgStore: i.fgStore || plan.fgStore,
      }))
    );
  };

  // Confirm Duplication to Next Month
  const handleConfirmDuplicate = () => {
    if (!duplicateModalPlan) return;

    const newTotalPlanned = dupItems.reduce((sum, item) => sum + Number(item.newPlannedQty || 0), 0);
    const newTotalVal = dupItems.reduce((sum, item) => sum + (Number(item.newPlannedQty || 0) * (Number(item.rate) || 0)), 0);
    const randSuffix = Math.floor(10 + Math.random() * 90);
    const monthCode = dupMonth.slice(0, 3).toUpperCase();
    const newPlanId = `PLN-2026-${monthCode}-${randSuffix}`;

    const newPlanObj: MonthlyPlanOrder = {
      id: newPlanId,
      customer: duplicateModalPlan.customer,
      customerGstin: duplicateModalPlan.customerGstin || '27AAACG0943A1ZX',
      monthPeriod: dupMonth || 'November 2026',
      planType: duplicateModalPlan.planType,
      consumptionMode: duplicateModalPlan.consumptionMode || 'Manual reconciliation',
      billingMode: duplicateModalPlan.billingMode || 'Reconciliation only',
      status: 'Published',
      plant: duplicateModalPlan.plant,
      fgStore: duplicateModalPlan.fgStore,
      createdDate: new Date().toISOString().slice(0, 10),
      items: dupItems.map((item) => ({
        itemCode: item.itemCode,
        itemName: item.itemName,
        hsn: '39269099',
        plannedQty: Number(item.newPlannedQty) || 0,
        deliveredQty: 0,
        invoicedQty: 0,
        remainingQty: Number(item.newPlannedQty) || 0,
        rate: Number(item.rate) || 0,
        uom: item.uom || 'PCS',
        plant: item.plant || duplicateModalPlan.plant,
        fgStore: item.fgStore || duplicateModalPlan.fgStore,
      })),
      totalPlannedQty: newTotalPlanned,
      totalDailySuppliedQty: 0,
      remainingPlanQty: newTotalPlanned,
      varianceQty: -newTotalPlanned,
      variancePct: -100,
      totalPlannedValue: newTotalVal,
      notes: dupNotes,
      auditTrail: [
        {
          action: `Duplicated from ${duplicateModalPlan.id} (${duplicateModalPlan.monthPeriod})`,
          user: 'Sales Planning Head',
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          note: `Rolled over with edited planned quantities (Total ${newTotalPlanned.toLocaleString()} PCS)`,
        },
      ],
    };

    setPlans((prev) => [newPlanObj, ...prev]);
    if (onCreatePlan) onCreatePlan(newPlanObj);
    setSelectedPlanId(newPlanId);
    setExpandedPlanIds((prev) => ({ ...prev, [newPlanId]: true }));
    setDuplicateModalPlan(null);

    showToast(`✓ Monthly Plan ${newPlanId} for ${dupMonth} created successfully! Planned Qty tallied.`);
  };

  // Convert Monthly Plan to Purchase Module (Generate Purchase Requisition)
  const handleSendToPurchase = (plan: MonthlyPlanOrder, e?: React.MouseEvent) => {
    e?.stopPropagation();

    const prNumber = `PR-2026-${Math.floor(100 + Math.random() * 900)}`;
    const totalPlasticQty = plan.items.reduce((sum, item) => sum + (item.plannedQty || 0), 0);
    // Standard plastic injection raw material calculation: ~0.45 kg polymer per PCS
    const estimatedRawResinKg = Math.round(totalPlasticQty * 0.45);
    const estimatedMasterbatchKg = Math.round(estimatedRawResinKg * 0.02);

    const newPR: PurchaseRequisition = {
      id: prNumber,
      prNumber: prNumber,
      requestDate: new Date().toISOString().slice(0, 10),
      requestedBy: 'SCM MRP Shortage Engine (Sales Plan Rollup)',
      department: 'Store & Procurement',
      plantWarehouse: `${plan.plant.split(' - ')[0]} Store`,
      requiredDate: new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10),
      priority: 'High',
      source: 'Monthly Plan Order',
      currency: 'INR (₹)',
      estimatedTotal: estimatedRawResinKg * 88.5 + estimatedMasterbatchKg * 340,
      budgetAllocated: 2500000,
      budgetRemaining: 1200000,
      budgetExceeded: false,
      status: 'pending_approval',
      approvalStatus: 'pending',
      currentApprover: 'K. Ramanathan (Procurement VP)',
      justification: `Automated raw material requisition generated for Consolidated Monthly Sales Plan ${plan.id} (${plan.monthPeriod}) — ${plan.customer}.`,
      notes: `Direct MRP calculation for ${plan.items.map((i) => i.itemCode).join(', ')}. Planned output: ${totalPlasticQty.toLocaleString()} PCS.`,
      lines: [
        {
          id: `PRL-${Math.floor(100 + Math.random() * 900)}`,
          lineNo: 1,
          itemCode: 'RM-PP-NAT-001',
          itemName: 'Polypropylene Injection Grade Virgin Resin H110MA',
          itemCategory: 'Polymer Granules',
          description: `Virgin raw resin for ${plan.customer} monthly delivery commitments`,
          quantity: estimatedRawResinKg,
          uom: 'KG',
          requiredDate: new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10),
          suggestedSupplierId: 'SUP-S0128',
          suggestedSupplierName: 'RELIANCE INDUSTRIES LIMITED',
          estimatedUnitPrice: 88.5,
          estimatedTotal: estimatedRawResinKg * 88.5,
          salesOrderRef: plan.id,
          status: 'pending',
        },
        {
          id: `PRL-${Math.floor(100 + Math.random() * 900)}`,
          lineNo: 2,
          itemCode: 'MB-BLK-002',
          itemName: 'Carbon Black Masterbatch 40% Concentration',
          itemCategory: 'Color Masterbatch',
          description: 'High-dispersion black colorant for automotive trim parts',
          quantity: estimatedMasterbatchKg,
          uom: 'KG',
          requiredDate: new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10),
          suggestedSupplierId: 'SUP-S0045',
          suggestedSupplierName: 'CLARIANT COLORANTS CHEMICALS INDIA',
          estimatedUnitPrice: 340.0,
          estimatedTotal: estimatedMasterbatchKg * 340.0,
          salesOrderRef: plan.id,
          status: 'pending',
        },
      ],
      approvalHistory: [
        {
          step: 1,
          role: 'SCM Demand Planner',
          user: 'Sales & Operations Consensus',
          action: 'Approved',
          date: new Date().toISOString().slice(0, 10),
          comment: `Material requirement rollup from Sales Monthly Plan ${plan.id}`,
        },
        {
          step: 2,
          role: 'Purchase Manager',
          user: 'Purchase Manager (You)',
          action: 'Pending',
          comment: 'Under commercial vendor rate review in Enterprise Approvals Hub',
        },
      ],
    };

    addPurchaseRequisition(newPR);
    adminEventBus.emit('PR_SAVED', newPR);
    adminEventBus.emit('PR_CREATED', newPR);
    adminEventBus.emit('PR_SUBMITTED_FOR_APPROVAL', newPR);

    showToast(`✓ Monthly Plan ${plan.id} sent to Purchase Module! Generated PR ${prNumber} (${estimatedRawResinKg.toLocaleString()} KG Resin).`);
  };

  const toggleExpand = (planId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedPlanIds((prev) => ({ ...prev, [planId]: !prev[planId] }));
    setSelectedPlanId(planId);
  };

  return (
    <div className="space-y-5">
      {/* Prominent Architectural Banner */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-cyan-50 border border-blue-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-[#14213D] text-white rounded-xl shrink-0 shadow-sm">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-blue-950">
                Consolidated Monthly Sales Plan &amp; Plant-Wise Demand Forecast Grid
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                MRP Integrated
              </span>
            </div>
            <p className="text-xs text-blue-800 mt-0.5 leading-relaxed">
              Consolidated demand commitments by plant. Click any plan row to view plant-wise line items, previous month dispatch tally, duplicate to next month, or generate purchase requisitions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-2 bg-[#14213D] hover:bg-[#1f335e] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Create Monthly Plan
          </button>
          <button
            onClick={() => onNavigate('purchaseReqList')}
            className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-[#0F8B8D]" />
            <span>Procurement PRs</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-gray-500">Active Plans</div>
          <div className="text-xl font-bold text-gray-900 mt-1">{totalActivePlans}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Automotive &amp; FMCG</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-gray-500">Total Planned Qty</div>
          <div className="text-xl font-bold text-blue-700 mt-1">{totalPlannedQty.toLocaleString()}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Committed Supply PCS</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-gray-500">Total Dispatched</div>
          <div className="text-xl font-bold text-emerald-700 mt-1">{totalDailySupplied.toLocaleString()}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Delivered via Daily SOs</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-gray-500">Balance Tally Pending</div>
          <div className="text-xl font-bold text-amber-700 mt-1">{remainingPlanQty.toLocaleString()}</div>
          <div className="text-[10px] text-amber-600 mt-0.5">Planned &minus; Dispatched</div>
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
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
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
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search plan #, customer, item code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
            />
          </div>
          <button
            onClick={() => onNavigate('reconciliation')}
            className="px-3 py-1.5 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors whitespace-nowrap cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" /> Reconcile Hub
          </button>
        </div>
      </div>

      {/* Consolidated Monthly Plan Grid with Expandable Plant-Wise Rows */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-gray-200">
              <tr>
                <th className="p-3 w-8 text-center"></th>
                <th className="p-3">Plan ID</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Month Period</th>
                <th className="p-3">Manufacturing Plant</th>
                <th className="p-3 text-right">Planned Qty</th>
                <th className="p-3 text-right">Dispatched Qty</th>
                <th className="p-3 text-right">Pending Balance (Tally)</th>
                <th className="p-3 text-right">Plan Value</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-gray-400">
                    No monthly plan orders found matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredPlans.map((plan) => {
                  const isExpanded = Boolean(expandedPlanIds[plan.id]);
                  const isSelected = selectedPlanId === plan.id;
                  const balanceQty = plan.totalPlannedQty - plan.totalDailySuppliedQty;

                  return (
                    <React.Fragment key={plan.id}>
                      {/* Master Consolidated Plan Row */}
                      <tr
                        className={`hover:bg-blue-50/40 transition-colors cursor-pointer group ${
                          isSelected ? 'bg-blue-50/50 font-medium' : ''
                        }`}
                        onClick={() => toggleExpand(plan.id)}
                      >
                        <td className="p-3 text-center" onClick={(e) => toggleExpand(plan.id, e)}>
                          <button className="text-slate-400 group-hover:text-slate-700 transition">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-[#0F8B8D]" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        <td className="p-3 font-mono font-bold text-[#0F8B8D] whitespace-nowrap">
                          {plan.id}
                        </td>
                        <td className="p-3 font-semibold text-gray-900">
                          <div>{plan.customer}</div>
                          <div className="text-[10px] text-gray-400 font-normal">
                            {plan.items?.length || 1} Planned SKU(s)
                          </div>
                        </td>
                        <td className="p-3 text-gray-800 font-medium whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100 text-[11px]">
                            {plan.monthPeriod}
                          </span>
                        </td>
                        <td className="p-3 text-gray-600">
                          <div className="flex items-center gap-1 font-medium text-slate-800">
                            <Factory className="w-3.5 h-3.5 text-slate-400" />
                            <span>{plan.plant}</span>
                          </div>
                          <div className="text-[10px] text-gray-400">{plan.fgStore}</div>
                        </td>
                        <td className="p-3 text-right font-bold text-gray-900">
                          {plan.totalPlannedQty.toLocaleString()} <span className="text-[10px] text-gray-500 font-normal">PCS</span>
                        </td>
                        <td className="p-3 text-right font-semibold text-emerald-700">
                          {plan.totalDailySuppliedQty.toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-bold font-mono">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              balanceQty <= 0
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {balanceQty.toLocaleString()} PCS
                          </span>
                        </td>
                        <td className="p-3 text-right font-bold text-gray-900">
                          ₹{((plan.totalPlannedValue || 0) / 100000).toFixed(2)}L
                        </td>
                        <td className="p-3 text-center">
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
                        <td className="p-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Duplicate Plan to Next Month Button */}
                            <button
                              onClick={(e) => handleOpenDuplicate(plan, e)}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow-2xs cursor-pointer"
                              title="Duplicate this plan to the next month with previous month dispatch comparison and editable planned quantity"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Duplicate to Next Month</span>
                            </button>

                            {/* Move to Purchase Module Button */}
                            <button
                              onClick={(e) => handleSendToPurchase(plan, e)}
                              className="px-2.5 py-1 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow-2xs cursor-pointer"
                              title="Generate Purchase Requisition (PR) for raw polymer materials and send to Procurement Module"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span>Send to Purchase</span>
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Plant-Wise Expanded Item Breakdown Row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/90 border-b border-gray-200">
                          <td colSpan={11} className="p-4 pl-10">
                            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-2xs">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 uppercase">
                                    Plant-Wise Item Commitments
                                  </span>
                                  <span className="text-xs font-bold text-slate-800">
                                    {plan.plant} &bull; {plan.monthPeriod}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  Tally Calculation: <b>Planned Qty &minus; Dispatched Qty = Pending Balance</b>
                                </div>
                              </div>

                              <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                  <thead className="bg-slate-100/80 text-slate-600 font-semibold text-[10px] uppercase">
                                    <tr>
                                      <th className="p-2">Item Code</th>
                                      <th className="p-2">Description</th>
                                      <th className="p-2">Plant &amp; Location</th>
                                      <th className="p-2 text-right">Planned Qty</th>
                                      <th className="p-2 text-right">Dispatched Qty</th>
                                      <th className="p-2 text-right">Invoiced</th>
                                      <th className="p-2 text-right font-bold text-amber-800">Pending Tally Balance</th>
                                      <th className="p-2 text-right">Unit Rate</th>
                                      <th className="p-2 text-right">Item Value</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {plan.items?.map((item, idx) => {
                                      const itemPending = (item.plannedQty || 0) - (item.deliveredQty || 0);
                                      const lineVal = (item.plannedQty || 0) * (item.rate || 0);

                                      return (
                                        <tr key={idx} className="hover:bg-slate-50">
                                          <td className="p-2 font-mono font-bold text-slate-900">{item.itemCode}</td>
                                          <td className="p-2 font-medium text-slate-800">{item.itemName}</td>
                                          <td className="p-2 text-slate-600">
                                            <div>{item.plant || plan.plant}</div>
                                            <div className="text-[10px] text-slate-400">{item.fgStore || plan.fgStore}</div>
                                          </td>
                                          <td className="p-2 text-right font-bold text-slate-900">
                                            {item.plannedQty.toLocaleString()} {item.uom || 'PCS'}
                                          </td>
                                          <td className="p-2 text-right font-semibold text-emerald-700">
                                            {(item.deliveredQty || 0).toLocaleString()}
                                          </td>
                                          <td className="p-2 text-right text-indigo-700 font-medium">
                                            {(item.invoicedQty || 0).toLocaleString()}
                                          </td>
                                          <td className="p-2 text-right font-mono font-bold text-amber-700">
                                            {itemPending.toLocaleString()} {item.uom || 'PCS'}
                                          </td>
                                          <td className="p-2 text-right font-mono text-slate-700">
                                            ₹{Number(item.rate).toFixed(2)}
                                          </td>
                                          <td className="p-2 text-right font-bold text-slate-900">
                                            ₹{(lineVal / 100000).toFixed(2)} Lakhs
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>

                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                                <div>
                                  <b>Notes:</b> {plan.notes || 'Committed monthly forecast schedule.'}
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => onNavigate('reconciliation')}
                                    className="text-xs font-semibold text-[#0F8B8D] hover:underline"
                                  >
                                    Reconcile with Daily Orders &rarr;
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Duplicate Plan to Next Month Modal (matching User requirements & Image 3) */}
      {duplicateModalPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#14213D] text-white rounded-xl shadow-sm">
                  <Copy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Duplicate Monthly Plan Order to Next Month
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Roll forward <b>{duplicateModalPlan.id}</b> ({duplicateModalPlan.customer}). Edit planned quantities and confirm commitment.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDuplicateModalPlan(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Previous Month Performance Card */}
              <div className="bg-gradient-to-r from-slate-50 to-indigo-50/50 p-3.5 rounded-xl border border-slate-200 grid grid-cols-3 gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500">Previous Period</span>
                  <div className="font-bold text-slate-900 text-xs mt-0.5">{duplicateModalPlan.monthPeriod}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500">Prev Planned Qty</span>
                  <div className="font-bold text-blue-700 text-sm mt-0.5">{duplicateModalPlan.totalPlannedQty.toLocaleString()} PCS</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500">Prev Dispatched Qty</span>
                  <div className="font-bold text-emerald-700 text-sm mt-0.5">{duplicateModalPlan.totalDailySuppliedQty.toLocaleString()} PCS</div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Customer</label>
                  <input
                    type="text"
                    disabled
                    value={duplicateModalPlan.customer}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-100 text-slate-700 font-semibold cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">New Plan Month Period *</label>
                  <input
                    type="text"
                    value={dupMonth}
                    onChange={(e) => setDupMonth(e.target.value)}
                    placeholder="e.g. November 2026"
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-[#14213D] focus:outline-none font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Manufacturing Plant</label>
                  <input
                    type="text"
                    disabled
                    value={duplicateModalPlan.plant}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-100 text-slate-700 font-semibold cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Plan Classification</label>
                  <input
                    type="text"
                    disabled
                    value={duplicateModalPlan.planType}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-100 text-slate-700 font-semibold cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Editable Planned Line Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">
                    Planned Line Items (Edit quantities for {dupMonth})
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Dispatched starts at 0 PCS
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-semibold">
                      <tr>
                        <th className="p-2.5">Item Code &amp; Description</th>
                        <th className="p-2.5 text-right">Prev Planned</th>
                        <th className="p-2.5 text-right">Prev Dispatched</th>
                        <th className="p-2.5 text-right w-28">New Planned (PCS) *</th>
                        <th className="p-2.5 text-right">Unit Rate (₹)</th>
                        <th className="p-2.5 text-right">Tally Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dupItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2.5">
                            <div className="font-mono font-bold text-slate-900">{item.itemCode}</div>
                            <div className="text-[11px] text-slate-500">{item.itemName}</div>
                          </td>
                          <td className="p-2.5 text-right font-medium text-slate-600">
                            {item.prevPlannedQty.toLocaleString()}
                          </td>
                          <td className="p-2.5 text-right font-semibold text-emerald-700">
                            {item.prevDispatchedQty.toLocaleString()}
                          </td>
                          <td className="p-2.5 text-right">
                            <input
                              type="number"
                              min="1"
                              value={item.newPlannedQty}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10) || 0;
                                setDupItems((prev) =>
                                  prev.map((it, i) => (i === idx ? { ...it, newPlannedQty: val } : it))
                                );
                              }}
                              className="w-24 border border-indigo-300 rounded-lg p-1.5 text-right font-bold text-blue-900 bg-white focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="p-2.5 text-right font-mono">
                            <input
                              type="number"
                              step="0.01"
                              value={item.rate}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setDupItems((prev) =>
                                  prev.map((it, i) => (i === idx ? { ...it, rate: val } : it))
                                );
                              }}
                              className="w-20 border border-slate-200 rounded-lg p-1.5 text-right font-mono text-slate-800 bg-white"
                            />
                          </td>
                          <td className="p-2.5 text-right font-bold font-mono text-amber-700">
                            {Number(item.newPlannedQty).toLocaleString()} PCS
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Estimated New Monthly Commitment Value:</span>
                  <span className="text-base font-extrabold text-[#14213D]">
                    ₹{dupItems
                      .reduce((sum, item) => sum + (Number(item.newPlannedQty || 0) * (Number(item.rate) || 0)), 0)
                      .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Commitment Notes &amp; Call-off Rules</label>
                <textarea
                  rows={2}
                  value={dupNotes}
                  onChange={(e) => setDupNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={() => setDuplicateModalPlan(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDuplicate}
                className="px-5 py-2 bg-[#14213D] hover:bg-[#1f335e] text-white rounded-lg font-semibold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Confirm &amp; Create Plan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Brand New Monthly Plan Modal (Initial Create) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-[#14213D] text-white rounded-xl shadow-sm">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Create Monthly Plan Order (Demand Forecast)
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Supply commitment &amp; customer forecast schedule. Not auto-deducted by daily dispatches.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  if (onCloseCreateModal) onCloseCreateModal();
                }}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition"
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
                <label className="block font-bold text-gray-700 mb-1">Commitment Notes &amp; Call-off Rules</label>
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
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition"
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
                    createdDate: new Date().toISOString().slice(0, 10),
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
                        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
                        note: 'Created via Monthly Demand Planning Center',
                      },
                    ],
                  };

                  setPlans((prev) => [newPlanObj, ...prev]);
                  if (onCreatePlan) onCreatePlan(newPlanObj);
                  showToast(`Monthly Plan Order ${generatedId} created successfully.`);
                  setIsCreateModalOpen(false);
                  if (onCloseCreateModal) onCloseCreateModal();
                }}
                className="px-4 py-2 bg-[#14213D] hover:bg-[#1f335e] text-white rounded-lg font-semibold shadow-sm transition"
              >
                Confirm &amp; Create Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
