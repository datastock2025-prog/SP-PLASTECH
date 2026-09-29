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
  ArrowLeft,
  Sparkles,
  Check,
  FilePlus,
  Factory,
  CheckCircle2,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  SlidersHorizontal,
  FileSpreadsheet,
  Download,
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

// Helper to advance month string e.g. "September 2026" -> "October 2026"
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
  return 'October 2026';
}

// Flat Planned Line Item with parent metadata
export interface ConsolidatedPlanItem {
  id: string;
  planId: string;
  monthPeriod: string;
  customer: string;
  customerGstin: string;
  plant: string;
  fgStore: string;
  itemCode: string;
  itemName: string;
  customerItemCode?: string;
  hsn: string;
  plannedQty: number;
  deliveredQty: number;
  invoicedQty: number;
  remainingQty: number; // Tally: planned - delivered
  rate: number;
  totalValue: number;
  uom: string;
  status: string;
}

// Month-Level Consolidated Master Plan
export interface MonthMasterPlan {
  monthKey: string; // e.g. "September 2026"
  planId: string; // e.g. "PLN-2026-09"
  monthPeriod: string;
  customers: string[];
  plants: string[];
  totalPlannedQty: number;
  totalDispatchedQty: number;
  pendingBalanceQty: number;
  totalPlannedValue: number;
  totalItemsCount: number;
  status: 'Partially Supplied' | 'Fully Supplied' | 'Active' | 'Variance';
  items: ConsolidatedPlanItem[];
  rawPlans: MonthlyPlanOrder[];
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

  // Page View: 'master' (Master Month Grid) vs 'monthDetail' (Detailed Items Page Grid)
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);

  // Pagination for Master Grid
  const [masterPage, setMasterPage] = useState(1);
  const [masterPageSize, setMasterPageSize] = useState(5);

  // Pagination for Month Detailed Items Grid
  const [itemPage, setItemPage] = useState(1);
  const [itemPageSize, setItemPageSize] = useState(10);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [itemPlantFilter, setItemPlantFilter] = useState('All');
  const [itemCustomerFilter, setItemCustomerFilter] = useState('All');

  // Selected item checkboxes for batch operations
  const [selectedItemIds, setSelectedItemIds] = useState<Record<string, boolean>>({});

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(initialCreateOpen);
  const [duplicateModalMonth, setDuplicateModalMonth] = useState<MonthMasterPlan | null>(null);

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
  const [dupTargetMonth, setDupTargetMonth] = useState('');
  const [dupNotes, setDupNotes] = useState('');
  const [dupItems, setDupItems] = useState<
    Array<{
      id: string;
      customer: string;
      plant: string;
      fgStore: string;
      itemCode: string;
      itemName: string;
      prevPlannedQty: number;
      prevDispatchedQty: number;
      newPlannedQty: number;
      rate: number;
      uom: string;
    }>
  >([]);

  // Consolidated Master Plans: Grouped as One Plan ID per Month Period
  const monthMasterPlans: MonthMasterPlan[] = useMemo(() => {
    const monthGroups: Record<string, MonthlyPlanOrder[]> = {};

    plans.forEach((plan) => {
      const mPeriod = (plan.monthPeriod || 'September 2026').trim();
      if (!monthGroups[mPeriod]) {
        monthGroups[mPeriod] = [];
      }
      monthGroups[mPeriod].push(plan);
    });

    return Object.entries(monthGroups).map(([monthPeriod, groupPlans]) => {
      const monthsMap: Record<string, string> = {
        january: '01', february: '02', march: '03', april: '04',
        may: '05', june: '06', july: '07', august: '08',
        september: '09', october: '10', november: '11', december: '12',
      };
      const parts = monthPeriod.split(' ');
      const mName = (parts[0] || '').toLowerCase();
      const yr = parts[1] || '2026';
      const mCode = monthsMap[mName] || '09';
      const consolidatedPlanId = `PLN-${yr}-${mCode}`;

      const allItems: ConsolidatedPlanItem[] = [];
      const customersSet = new Set<string>();
      const plantsSet = new Set<string>();

      let totalPlanned = 0;
      let totalDispatched = 0;
      let totalVal = 0;

      groupPlans.forEach((plan) => {
        customersSet.add(plan.customer);
        if (plan.plant) plantsSet.add(plan.plant);

        (plan.items || []).forEach((it, idx) => {
          const planned = Number(it.plannedQty) || 0;
          const dispatched = Number(it.deliveredQty) || 0;
          const invoiced = Number(it.invoicedQty) || 0;
          const pending = planned - dispatched;
          const rate = Number(it.rate) || 0;
          const lineVal = planned * rate;

          totalPlanned += planned;
          totalDispatched += dispatched;
          totalVal += lineVal;

          allItems.push({
            id: `${plan.id}-ITM-${idx + 1}`,
            planId: plan.id,
            monthPeriod,
            customer: plan.customer,
            customerGstin: plan.customerGstin || '27AAACG0943A1ZX',
            plant: it.plant || plan.plant,
            fgStore: it.fgStore || plan.fgStore,
            itemCode: it.itemCode,
            itemName: it.itemName,
            customerItemCode: it.customerItemCode,
            hsn: it.hsn || '39269099',
            plannedQty: planned,
            deliveredQty: dispatched,
            invoicedQty: invoiced,
            remainingQty: pending,
            rate,
            totalValue: lineVal,
            uom: it.uom || 'PCS',
            status:
              dispatched >= planned
                ? 'Fully Supplied'
                : dispatched > 0
                ? 'Partially Supplied'
                : 'Pending Supply',
          });
        });
      });

      const pendingBal = totalPlanned - totalDispatched;
      let status: 'Partially Supplied' | 'Fully Supplied' | 'Active' | 'Variance' = 'Active';
      if (totalDispatched >= totalPlanned && totalPlanned > 0) {
        status = 'Fully Supplied';
      } else if (totalDispatched > 0) {
        status = 'Partially Supplied';
      }

      return {
        monthKey: monthPeriod,
        planId: consolidatedPlanId,
        monthPeriod,
        customers: Array.from(customersSet),
        plants: Array.from(plantsSet),
        totalPlannedQty: totalPlanned,
        totalDispatchedQty: totalDispatched,
        pendingBalanceQty: pendingBal,
        totalPlannedValue: totalVal,
        totalItemsCount: allItems.length,
        status,
        items: allItems,
        rawPlans: groupPlans,
      };
    });
  }, [plans]);

  // Active Selected Month Master Plan (if drilled down)
  const currentSelectedMonthPlan = useMemo(() => {
    if (!selectedMonthKey) return null;
    return monthMasterPlans.find((m) => m.monthKey === selectedMonthKey) || null;
  }, [monthMasterPlans, selectedMonthKey]);

  // Summary Metrics across all months
  const totalMonthlyMasterPlans = monthMasterPlans.length;
  const overallPlannedQty = monthMasterPlans.reduce((sum, p) => sum + p.totalPlannedQty, 0);
  const overallDispatchedQty = monthMasterPlans.reduce((sum, p) => sum + p.totalDispatchedQty, 0);
  const overallRemainingTally = overallPlannedQty - overallDispatchedQty;
  const overallPlannedValue = monthMasterPlans.reduce((sum, p) => sum + p.totalPlannedValue, 0);

  // Tabs
  const tabs = [
    'All Plans',
    'Partially Supplied',
    'Fully Supplied',
    'Active',
  ];

  // Filter Master Monthly Plans
  const filteredMasterPlans = useMemo(() => {
    return monthMasterPlans.filter((plan) => {
      if (activeTab === 'Partially Supplied' && plan.status !== 'Partially Supplied') return false;
      if (activeTab === 'Fully Supplied' && plan.status !== 'Fully Supplied') return false;
      if (activeTab === 'Active' && plan.status !== 'Active') return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchId = plan.planId.toLowerCase().includes(q);
        const matchPeriod = plan.monthPeriod.toLowerCase().includes(q);
        const matchCust = plan.customers.some((c) => c.toLowerCase().includes(q));
        const matchPlant = plan.plants.some((p) => p.toLowerCase().includes(q));
        const matchItem = plan.items.some(
          (i) => i.itemCode.toLowerCase().includes(q) || i.itemName.toLowerCase().includes(q)
        );
        if (!matchId && !matchPeriod && !matchCust && !matchPlant && !matchItem) return false;
      }
      return true;
    });
  }, [monthMasterPlans, activeTab, searchQuery]);

  // Master Pagination
  const totalMasterPages = Math.ceil(filteredMasterPlans.length / masterPageSize) || 1;
  const paginatedMasterPlans = useMemo(() => {
    const start = (masterPage - 1) * masterPageSize;
    return filteredMasterPlans.slice(start, start + masterPageSize);
  }, [filteredMasterPlans, masterPage, masterPageSize]);

  // Month Detail Page: Filter & Paginate Items
  const filteredMonthItems = useMemo(() => {
    if (!currentSelectedMonthPlan) return [];
    return currentSelectedMonthPlan.items.filter((item) => {
      if (itemPlantFilter !== 'All' && item.plant !== itemPlantFilter) return false;
      if (itemCustomerFilter !== 'All' && item.customer !== itemCustomerFilter) return false;

      if (itemSearchQuery) {
        const q = itemSearchQuery.toLowerCase();
        const matchCode = item.itemCode.toLowerCase().includes(q);
        const matchName = item.itemName.toLowerCase().includes(q);
        const matchCust = item.customer.toLowerCase().includes(q);
        const matchPlant = item.plant.toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchCust && !matchPlant) return false;
      }
      return true;
    });
  }, [currentSelectedMonthPlan, itemPlantFilter, itemCustomerFilter, itemSearchQuery]);

  const totalItemPages = Math.ceil(filteredMonthItems.length / itemPageSize) || 1;
  const paginatedMonthItems = useMemo(() => {
    const start = (itemPage - 1) * itemPageSize;
    return filteredMonthItems.slice(start, start + itemPageSize);
  }, [filteredMonthItems, itemPage, itemPageSize]);

  // Handle Master Row Click to Drill Down into Month Detail Grid
  const handleOpenMonthDetail = (monthKey: string) => {
    setSelectedMonthKey(monthKey);
    setItemPage(1);
    setItemSearchQuery('');
    setItemPlantFilter('All');
    setItemCustomerFilter('All');
    setSelectedItemIds({});
  };

  // Open Duplicate Modal for a Month Master Plan
  const handleOpenDuplicateMonth = (monthPlan: MonthMasterPlan, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDuplicateModalMonth(monthPlan);
    const nextM = getNextMonthPeriod(monthPlan.monthPeriod);
    setDupTargetMonth(nextM);
    setDupNotes(`Consolidated monthly demand roll-forward from ${monthPlan.monthPeriod} (${monthPlan.planId}) with tuned production forecast.`);
    setDupItems(
      monthPlan.items.map((i) => ({
        id: i.id,
        customer: i.customer,
        plant: i.plant,
        fgStore: i.fgStore,
        itemCode: i.itemCode,
        itemName: i.itemName,
        prevPlannedQty: i.plannedQty,
        prevDispatchedQty: i.deliveredQty,
        newPlannedQty: i.plannedQty, // User can edit
        rate: i.rate,
        uom: i.uom,
      }))
    );
  };

  // Confirm Duplicating Month Plan to Next Month
  const handleConfirmDuplicateMonth = () => {
    if (!duplicateModalMonth) return;

    // Group items by customer & plant to create child plan records for next month
    const groups: Record<string, typeof dupItems> = {};
    dupItems.forEach((item) => {
      const key = `${item.customer}__${item.plant}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    const monthsMap: Record<string, string> = {
      january: '01', february: '02', march: '03', april: '04',
      may: '05', june: '06', july: '07', august: '08',
      september: '09', october: '10', november: '11', december: '12',
    };
    const parts = (dupTargetMonth || '').split(' ');
    const mName = (parts[0] || '').toLowerCase();
    const yr = parts[1] || '2026';
    const mCode = monthsMap[mName] || '10';

    const newCreatedPlans: MonthlyPlanOrder[] = [];
    let counter = 1;

    Object.entries(groups).forEach(([key, itemsList]) => {
      const first = itemsList[0];
      const planId = `PLN-${yr}-${mCode}-${String(counter).padStart(2, '0')}`;
      counter++;

      const totalPlanned = itemsList.reduce((sum, it) => sum + (Number(it.newPlannedQty) || 0), 0);
      const totalVal = itemsList.reduce((sum, it) => sum + ((Number(it.newPlannedQty) || 0) * (Number(it.rate) || 0)), 0);

      const newPlan: MonthlyPlanOrder = {
        id: planId,
        customer: first.customer,
        customerGstin: '27AAACG0943A1ZX',
        monthPeriod: dupTargetMonth || 'October 2026',
        planType: 'Monthly supply plan',
        consumptionMode: 'Manual reconciliation',
        billingMode: 'Reconciliation only',
        status: 'Published',
        plant: first.plant,
        fgStore: first.fgStore || 'FG-Automotive Cell',
        createdDate: new Date().toISOString().slice(0, 10),
        items: itemsList.map((it) => ({
          itemCode: it.itemCode,
          itemName: it.itemName,
          hsn: '39269099',
          plannedQty: Number(it.newPlannedQty) || 0,
          deliveredQty: 0,
          invoicedQty: 0,
          remainingQty: Number(it.newPlannedQty) || 0,
          rate: Number(it.rate) || 0,
          uom: it.uom || 'PCS',
          plant: it.plant,
          fgStore: it.fgStore || 'FG-Automotive Cell',
        })),
        totalPlannedQty: totalPlanned,
        totalDailySuppliedQty: 0,
        remainingPlanQty: totalPlanned,
        varianceQty: -totalPlanned,
        variancePct: -100,
        totalPlannedValue: totalVal,
        notes: dupNotes,
        auditTrail: [
          {
            action: `Duplicated from ${duplicateModalMonth.planId} (${duplicateModalMonth.monthPeriod})`,
            user: 'Sales Operations Manager',
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
            note: `Monthly forecast rolled over to ${dupTargetMonth} (Total ${totalPlanned.toLocaleString()} PCS)`,
          },
        ],
      };

      newCreatedPlans.push(newPlan);
      if (onCreatePlan) onCreatePlan(newPlan);
    });

    setPlans((prev) => [...newCreatedPlans, ...prev]);
    setDuplicateModalMonth(null);
    setSelectedMonthKey(dupTargetMonth);
    showToast(`✓ Master Monthly Plan for ${dupTargetMonth} duplicated successfully! All item planned quantities tallied.`);
  };

  // Centralized "Move Monthly Plan to Purchase Team" Action
  const handleCentralizedSendToPurchase = (monthPlan: MonthMasterPlan, itemsToConvert?: ConsolidatedPlanItem[]) => {
    const targetItems = itemsToConvert && itemsToConvert.length > 0 ? itemsToConvert : monthPlan.items;
    if (targetItems.length === 0) {
      showToast('No items selected to send to Purchase.');
      return;
    }

    const prNumber = `PR-2026-${Math.floor(100 + Math.random() * 900)}`;
    const totalPlasticPieces = targetItems.reduce((sum, it) => sum + (it.plannedQty || 0), 0);

    // Standard plastic injection raw material calculation:
    // ~0.45 kg polymer resin per PCS + 2% Masterbatch colorant
    const estimatedRawResinKg = Math.round(totalPlasticPieces * 0.45);
    const estimatedMasterbatchKg = Math.round(estimatedRawResinKg * 0.02);

    const newPR: PurchaseRequisition = {
      id: prNumber,
      prNumber: prNumber,
      requestDate: new Date().toISOString().slice(0, 10),
      requestedBy: 'Consolidated Sales Monthly Plan Engine (MRP)',
      department: 'Store & Procurement',
      plantWarehouse: `${monthPlan.plants[0]?.split(' - ')[0] || 'Plant 1'} Central Store`,
      requiredDate: new Date(Date.now() + 12 * 86400000).toISOString().slice(0, 10),
      priority: 'High',
      source: 'Monthly Plan Order',
      currency: 'INR (₹)',
      estimatedTotal: estimatedRawResinKg * 88.5 + estimatedMasterbatchKg * 340,
      budgetAllocated: 3500000,
      budgetRemaining: 1850000,
      budgetExceeded: false,
      status: 'pending_approval',
      approvalStatus: 'pending',
      currentApprover: 'K. Ramanathan (Procurement VP)',
      justification: `Centralized automated raw polymer requirement generated for Master Monthly Sales Plan ${monthPlan.planId} (${monthPlan.monthPeriod}).`,
      notes: `Consolidated requirements for ${targetItems.length} planned SKUs across ${monthPlan.customers.join(', ')}. Planned plastic output: ${totalPlasticPieces.toLocaleString()} PCS.`,
      lines: [
        {
          id: `PRL-${Math.floor(100 + Math.random() * 900)}`,
          lineNo: 1,
          itemCode: 'RM-PP-NAT-001',
          itemName: 'Polypropylene Injection Grade Virgin Resin H110MA',
          itemCategory: 'Polymer Granules',
          description: `Virgin raw resin for ${monthPlan.monthPeriod} consolidated sales commitment`,
          quantity: estimatedRawResinKg,
          uom: 'KG',
          requiredDate: new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10),
          suggestedSupplierId: 'SUP-S0128',
          suggestedSupplierName: 'RELIANCE INDUSTRIES LIMITED',
          estimatedUnitPrice: 88.5,
          estimatedTotal: estimatedRawResinKg * 88.5,
          salesOrderRef: monthPlan.planId,
          status: 'pending',
        },
        {
          id: `PRL-${Math.floor(100 + Math.random() * 900)}`,
          lineNo: 2,
          itemCode: 'MB-BLK-002',
          itemName: 'Carbon Black Masterbatch 40% Concentration',
          itemCategory: 'Color Masterbatch',
          description: 'High-dispersion black colorant for automotive trim and consumer parts',
          quantity: estimatedMasterbatchKg,
          uom: 'KG',
          requiredDate: new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10),
          suggestedSupplierId: 'SUP-S0045',
          suggestedSupplierName: 'CLARIANT COLORANTS CHEMICALS INDIA',
          estimatedUnitPrice: 340.0,
          estimatedTotal: estimatedMasterbatchKg * 340.0,
          salesOrderRef: monthPlan.planId,
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
          comment: `Rollup from Consolidated Master Monthly Plan ${monthPlan.planId} (${monthPlan.monthPeriod})`,
        },
        {
          step: 2,
          role: 'Purchase Manager',
          user: 'Purchase Manager (You)',
          action: 'Pending',
          comment: 'Pending commercial rate validation in Enterprise Approvals Hub',
        },
      ],
    };

    addPurchaseRequisition(newPR);
    adminEventBus.emit('PR_SAVED', newPR);
    adminEventBus.emit('PR_CREATED', newPR);
    adminEventBus.emit('PR_SUBMITTED_FOR_APPROVAL', newPR);

    showToast(`✓ Monthly Plan ${monthPlan.planId} sent to Purchase Module! Generated PR ${prNumber} (${estimatedRawResinKg.toLocaleString()} KG Polymer Resin).`);
  };

  // Toggle Single Item Selection
  const toggleSelectItem = (itemId: string) => {
    setSelectedItemIds((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  // Select / Deselect All Items on current page
  const handleSelectAllPageItems = (checked: boolean) => {
    const updated = { ...selectedItemIds };
    paginatedMonthItems.forEach((it) => {
      updated[it.id] = checked;
    });
    setSelectedItemIds(updated);
  };

  const isAllPageSelected =
    paginatedMonthItems.length > 0 &&
    paginatedMonthItems.every((it) => selectedItemIds[it.id]);

  const selectedItemsCount = Object.values(selectedItemIds).filter(Boolean).length;

  return (
    <div className="space-y-5">
      {/* View Mode 1: Detailed Items Page Grid for a Selected Month Period */}
      {currentSelectedMonthPlan ? (
        <div className="space-y-5 animate-fade-in">
          {/* Breadcrumb & Navigation Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedMonthKey(null)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Return to Master Monthly Plans Grid"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Monthly Plans</span>
              </button>
              <div className="h-5 w-px bg-slate-200 hidden sm:block" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-[#0F8B8D]">
                    {currentSelectedMonthPlan.planId}
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    &bull; {currentSelectedMonthPlan.monthPeriod} Detailed Sales Commitments
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {currentSelectedMonthPlan.items.length} Planned SKUs
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Plant-wise item sales forecast, dispatched tally, and centralized procurement conversion.
                </p>
              </div>
            </div>

            {/* Centralized Action Buttons in Detailed View */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={(e) => handleOpenDuplicateMonth(currentSelectedMonthPlan, e)}
                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                title="Duplicate this month plan to next month with previous dispatch tally comparison"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplicate to Next Month</span>
              </button>

              {/* Centralized Button: Move Monthly Plan to Purchase Team */}
              <button
                onClick={() => {
                  const selectedList = currentSelectedMonthPlan.items.filter((it) => selectedItemIds[it.id]);
                  handleCentralizedSendToPurchase(
                    currentSelectedMonthPlan,
                    selectedList.length > 0 ? selectedList : currentSelectedMonthPlan.items
                  );
                }}
                className="px-4 py-2 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition cursor-pointer"
                title="Calculate BOM raw material resin requirements and create Purchase Requisition in Procurement module"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>
                  {selectedItemsCount > 0
                    ? `Send ${selectedItemsCount} Selected to Purchase Team`
                    : 'Send Monthly Plan to Purchase Team'}
                </span>
                <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                  ~{Math.round(currentSelectedMonthPlan.totalPlannedQty * 0.45).toLocaleString()} KG Resin
                </span>
              </button>
            </div>
          </div>

          {/* Month Summary KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-[10px] uppercase font-bold text-gray-500">Plan Period</div>
              <div className="text-base font-bold text-slate-900 mt-1">{currentSelectedMonthPlan.monthPeriod}</div>
              <div className="text-[10px] text-indigo-600 mt-0.5">{currentSelectedMonthPlan.customers.length} Customers Enrolled</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-[10px] uppercase font-bold text-gray-500">Total Planned Qty</div>
              <div className="text-lg font-bold text-blue-700 mt-1">
                {currentSelectedMonthPlan.totalPlannedQty.toLocaleString()} <span className="text-xs text-gray-500 font-normal">PCS</span>
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">{currentSelectedMonthPlan.items.length} Product Lines</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-[10px] uppercase font-bold text-gray-500">Total Dispatched</div>
              <div className="text-lg font-bold text-emerald-700 mt-1">
                {currentSelectedMonthPlan.totalDispatchedQty.toLocaleString()} <span className="text-xs text-gray-500 font-normal">PCS</span>
              </div>
              <div className="text-[10px] text-emerald-600 mt-0.5">Delivered via Daily SOs</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-[10px] uppercase font-bold text-gray-500">Pending Balance Tally</div>
              <div className="text-lg font-bold text-amber-700 mt-1">
                {currentSelectedMonthPlan.pendingBalanceQty.toLocaleString()} <span className="text-xs text-gray-500 font-normal">PCS</span>
              </div>
              <div className="text-[10px] text-amber-600 mt-0.5">Planned &minus; Dispatched</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm col-span-2 sm:col-span-1">
              <div className="text-[10px] uppercase font-bold text-gray-500">Total Planned Value</div>
              <div className="text-lg font-bold text-slate-900 mt-1">
                ₹{(currentSelectedMonthPlan.totalPlannedValue / 100000).toFixed(2)}L
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">Monthly Commitment</div>
            </div>
          </div>

          {/* Filter & Search Bar for Month Items Grid */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search item code, description, customer..."
                  value={itemSearchQuery}
                  onChange={(e) => {
                    setItemSearchQuery(e.target.value);
                    setItemPage(1);
                  }}
                  className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F8B8D] text-xs w-64"
                />
              </div>

              {/* Plant Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-gray-500 font-semibold text-[11px]">Plant:</span>
                <select
                  value={itemPlantFilter}
                  onChange={(e) => {
                    setItemPlantFilter(e.target.value);
                    setItemPage(1);
                  }}
                  className="border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-xs text-slate-700"
                >
                  <option value="All">All Plants</option>
                  {currentSelectedMonthPlan.plants.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Customer Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-gray-500 font-semibold text-[11px]">Customer:</span>
                <select
                  value={itemCustomerFilter}
                  onChange={(e) => {
                    setItemCustomerFilter(e.target.value);
                    setItemPage(1);
                  }}
                  className="border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-xs text-slate-700 max-w-[180px] truncate"
                >
                  <option value="All">All Customers</option>
                  {currentSelectedMonthPlan.customers.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-500">Rows per page:</span>
              <select
                value={itemPageSize}
                onChange={(e) => {
                  setItemPageSize(Number(e.target.value));
                  setItemPage(1);
                }}
                className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Month Detailed Items Table Grid */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-gray-200">
                  <tr>
                    <th className="p-3 w-8 text-center">
                      <input
                        type="checkbox"
                        checked={isAllPageSelected}
                        onChange={(e) => handleSelectAllPageItems(e.target.checked)}
                        className="rounded text-[#0F8B8D] focus:ring-[#0F8B8D]"
                      />
                    </th>
                    <th className="p-3">Item Code &amp; Description</th>
                    <th className="p-3">Target Customer</th>
                    <th className="p-3">Manufacturing Plant &amp; Store</th>
                    <th className="p-3 text-right">Planned Qty</th>
                    <th className="p-3 text-right">Dispatched Qty</th>
                    <th className="p-3 text-right">Invoiced Qty</th>
                    <th className="p-3 text-right font-bold text-amber-800">Pending Tally Balance</th>
                    <th className="p-3 text-right">Unit Rate</th>
                    <th className="p-3 text-right">Item Value</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedMonthItems.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-gray-400">
                        No sales planned line items found for this month matching filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedMonthItems.map((item) => {
                      const isSelected = Boolean(selectedItemIds[item.id]);

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-blue-50/30 transition-colors ${
                            isSelected ? 'bg-blue-50/50' : ''
                          }`}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectItem(item.id)}
                              className="rounded text-[#0F8B8D] focus:ring-[#0F8B8D]"
                            />
                          </td>
                          <td className="p-3">
                            <div className="font-mono font-bold text-slate-900 flex items-center gap-1">
                              <span>{item.itemCode}</span>
                              {item.customerItemCode && (
                                <span className="text-[10px] text-gray-400 font-normal">
                                  ({item.customerItemCode})
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-600 mt-0.5">{item.itemName}</div>
                          </td>
                          <td className="p-3 font-semibold text-gray-900">
                            <div>{item.customer}</div>
                            <div className="text-[10px] text-gray-400 font-mono font-normal">
                              GSTIN: {item.customerGstin}
                            </div>
                          </td>
                          <td className="p-3 text-slate-600">
                            <div className="flex items-center gap-1 font-medium text-slate-800">
                              <Factory className="w-3.5 h-3.5 text-slate-400" />
                              <span>{item.plant}</span>
                            </div>
                            <div className="text-[10px] text-slate-400">{item.fgStore}</div>
                          </td>
                          <td className="p-3 text-right font-bold text-gray-900">
                            {item.plannedQty.toLocaleString()} <span className="text-[10px] text-gray-500 font-normal">{item.uom}</span>
                          </td>
                          <td className="p-3 text-right font-semibold text-emerald-700">
                            {item.deliveredQty.toLocaleString()}
                          </td>
                          <td className="p-3 text-right text-indigo-700 font-medium">
                            {item.invoicedQty.toLocaleString()}
                          </td>
                          <td className="p-3 text-right font-mono font-bold">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                item.remainingQty <= 0
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-900'
                              }`}
                            >
                              {item.remainingQty.toLocaleString()} {item.uom}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono text-slate-700">
                            ₹{item.rate.toFixed(2)}
                          </td>
                          <td className="p-3 text-right font-bold text-gray-900">
                            ₹{(item.totalValue / 100000).toFixed(2)}L
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.status === 'Fully Supplied'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.status === 'Partially Supplied'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls for Item Grid */}
            <div className="p-3 border-t border-gray-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
              <div>
                Showing <b>{filteredMonthItems.length === 0 ? 0 : (itemPage - 1) * itemPageSize + 1}</b> to{' '}
                <b>{Math.min(itemPage * itemPageSize, filteredMonthItems.length)}</b> of{' '}
                <b>{filteredMonthItems.length}</b> line item records
              </div>

              <div className="flex items-center gap-1">
                <button
                  disabled={itemPage <= 1}
                  onClick={() => setItemPage(1)}
                  className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={itemPage <= 1}
                  onClick={() => setItemPage((p) => Math.max(p - 1, 1))}
                  className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 py-1 text-xs font-semibold text-slate-800">
                  Page {itemPage} of {totalItemPages}
                </span>
                <button
                  disabled={itemPage >= totalItemPages}
                  onClick={() => setItemPage((p) => Math.min(p + 1, totalItemPages))}
                  className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={itemPage >= totalItemPages}
                  onClick={() => setItemPage(totalItemPages)}
                  className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* View Mode 2: Master Monthly Plan Grid (One Month Period = One Master Plan ID) */
        <div className="space-y-5">
          {/* Prominent Architectural Banner */}
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-cyan-50 border border-blue-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-[#14213D] text-white rounded-xl shrink-0 shadow-sm">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-blue-950">
                    Monthly Sales Plan Management &bull; One Month Master Plan Engine
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    MRP Integrated
                  </span>
                </div>
                <p className="text-xs text-blue-800 mt-0.5 leading-relaxed">
                  One Master Plan ID per month period. Click any monthly plan row to open the full item commitments grid, duplicate the plan to next month, or convert all planned demand directly into Procurement Purchase Requisitions.
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

          {/* Top Level Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-[10px] uppercase font-bold text-gray-500">Monthly Master Plans</div>
              <div className="text-xl font-bold text-gray-900 mt-1">{totalMonthlyMasterPlans}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">One Plan ID Per Month</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-[10px] uppercase font-bold text-gray-500">Total Planned Qty</div>
              <div className="text-xl font-bold text-blue-700 mt-1">{overallPlannedQty.toLocaleString()}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">Committed Supply PCS</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-[10px] uppercase font-bold text-gray-500">Total Dispatched</div>
              <div className="text-xl font-bold text-emerald-700 mt-1">{overallDispatchedQty.toLocaleString()}</div>
              <div className="text-[10px] text-emerald-600 mt-0.5">Delivered via Daily SOs</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-[10px] uppercase font-bold text-gray-500">Pending Tally Balance</div>
              <div className="text-xl font-bold text-amber-700 mt-1">{overallRemainingTally.toLocaleString()}</div>
              <div className="text-[10px] text-amber-600 mt-0.5">Planned &minus; Dispatched</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm col-span-2 sm:col-span-1">
              <div className="text-[10px] uppercase font-bold text-gray-500">Total Planned Value</div>
              <div className="text-xl font-bold text-gray-900 mt-1">₹{(overallPlannedValue / 100000).toFixed(1)}L</div>
              <div className="text-[10px] text-gray-400 mt-0.5">Commitment total</div>
            </div>
          </div>

          {/* Filter Tabs & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm text-xs">
            <div className="flex items-center gap-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setMasterPage(1);
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
                  placeholder="Search plan #, month, customer, SKU..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setMasterPage(1);
                  }}
                  className="text-xs pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F8B8D] w-60"
                />
              </div>

              <div className="flex items-center gap-1 text-[11px] text-gray-500">
                <span>Page size:</span>
                <select
                  value={masterPageSize}
                  onChange={(e) => {
                    setMasterPageSize(Number(e.target.value));
                    setMasterPage(1);
                  }}
                  className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>
            </div>
          </div>

          {/* Master Monthly Plan Grid (One Month = One Row) */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-gray-200">
                  <tr>
                    <th className="p-3.5">Plan ID</th>
                    <th className="p-3.5">Month Period</th>
                    <th className="p-3.5">Enrolled Customers &amp; SKUs</th>
                    <th className="p-3.5">Manufacturing Plants</th>
                    <th className="p-3.5 text-right">Planned Qty</th>
                    <th className="p-3.5 text-right">Dispatched Qty</th>
                    <th className="p-3.5 text-right">Pending Balance (Tally)</th>
                    <th className="p-3.5 text-right">Plan Value</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedMasterPlans.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-gray-400">
                        No monthly master plans found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedMasterPlans.map((mPlan) => {
                      const balanceQty = mPlan.pendingBalanceQty;

                      return (
                        <tr
                          key={mPlan.monthKey}
                          onClick={() => handleOpenMonthDetail(mPlan.monthKey)}
                          className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                        >
                          <td className="p-3.5 font-mono font-bold text-[#0F8B8D] whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-900 group-hover:text-[#0F8B8D] font-bold">
                                {mPlan.planId}
                              </span>
                              <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#0F8B8D] transition-transform group-hover:translate-x-0.5" />
                            </div>
                          </td>
                          <td className="p-3.5 font-semibold text-gray-900 whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-bold border border-indigo-100 text-xs">
                              {mPlan.monthPeriod}
                            </span>
                          </td>
                          <td className="p-3.5 text-gray-800">
                            <div className="font-semibold text-slate-900 truncate max-w-xs">
                              {mPlan.customers.join(', ')}
                            </div>
                            <div className="text-[10px] text-gray-400">
                              {mPlan.totalItemsCount} Planned SKU Line(s)
                            </div>
                          </td>
                          <td className="p-3.5 text-gray-600">
                            <div className="flex items-center gap-1 font-medium text-slate-800">
                              <Factory className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate max-w-xs">{mPlan.plants.join(', ')}</span>
                            </div>
                          </td>
                          <td className="p-3.5 text-right font-bold text-gray-900">
                            {mPlan.totalPlannedQty.toLocaleString()} <span className="text-[10px] text-gray-500 font-normal">PCS</span>
                          </td>
                          <td className="p-3.5 text-right font-semibold text-emerald-700">
                            {mPlan.totalDispatchedQty.toLocaleString()}
                          </td>
                          <td className="p-3.5 text-right font-bold font-mono">
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
                          <td className="p-3.5 text-right font-bold text-gray-900">
                            ₹{((mPlan.totalPlannedValue || 0) / 100000).toFixed(2)}L
                          </td>
                          <td className="p-3.5 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                mPlan.status === 'Fully Supplied'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : mPlan.status === 'Partially Supplied'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-indigo-100 text-indigo-800'
                              }`}
                            >
                              {mPlan.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Open Detail Page Grid Button */}
                              <button
                                onClick={() => handleOpenMonthDetail(mPlan.monthKey)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                                title="Open full month item sales planned grid"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-600" />
                                <span>View Items Grid</span>
                              </button>

                              {/* Duplicate Plan to Next Month */}
                              <button
                                onClick={(e) => handleOpenDuplicateMonth(mPlan, e)}
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow-2xs cursor-pointer"
                                title="Duplicate this month plan to next month"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                <span>Duplicate</span>
                              </button>

                              {/* Move to Purchase Module Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCentralizedSendToPurchase(mPlan);
                                }}
                                className="px-2.5 py-1 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow-2xs cursor-pointer"
                                title="Generate Purchase Requisition (PR) for raw materials"
                              >
                                <ShoppingCart className="w-3.5 h-3.5" />
                                <span>Send to Purchase</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls for Master Grid */}
            <div className="p-3.5 border-t border-gray-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
              <div>
                Showing <b>{filteredMasterPlans.length === 0 ? 0 : (masterPage - 1) * masterPageSize + 1}</b> to{' '}
                <b>{Math.min(masterPage * masterPageSize, filteredMasterPlans.length)}</b> of{' '}
                <b>{filteredMasterPlans.length}</b> monthly master plans
              </div>

              <div className="flex items-center gap-1">
                <button
                  disabled={masterPage <= 1}
                  onClick={() => setMasterPage(1)}
                  className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={masterPage <= 1}
                  onClick={() => setMasterPage((p) => Math.max(p - 1, 1))}
                  className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 py-1 text-xs font-semibold text-slate-800">
                  Page {masterPage} of {totalMasterPages}
                </span>
                <button
                  disabled={masterPage >= totalMasterPages}
                  onClick={() => setMasterPage((p) => Math.min(p + 1, totalMasterPages))}
                  className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={masterPage >= totalMasterPages}
                  onClick={() => setMasterPage(totalMasterPages)}
                  className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Plan to Next Month Modal */}
      {duplicateModalMonth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
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
                    Roll forward <b>{duplicateModalMonth.planId}</b> ({duplicateModalMonth.monthPeriod}). Edit planned quantities and confirm commitment.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDuplicateModalMonth(null)}
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
                  <div className="font-bold text-slate-900 text-xs mt-0.5">{duplicateModalMonth.monthPeriod}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500">Prev Planned Qty</span>
                  <div className="font-bold text-blue-700 text-sm mt-0.5">{duplicateModalMonth.totalPlannedQty.toLocaleString()} PCS</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500">Prev Dispatched Qty</span>
                  <div className="font-bold text-emerald-700 text-sm mt-0.5">{duplicateModalMonth.totalDispatchedQty.toLocaleString()} PCS</div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">New Plan Month Period *</label>
                  <input
                    type="text"
                    value={dupTargetMonth}
                    onChange={(e) => setDupTargetMonth(e.target.value)}
                    placeholder="e.g. October 2026"
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-[#14213D] focus:outline-none font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Enrolled Customers</label>
                  <input
                    type="text"
                    disabled
                    value={duplicateModalMonth.customers.join(', ')}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-100 text-slate-700 font-semibold cursor-not-allowed truncate"
                  />
                </div>
              </div>

              {/* Editable Planned Line Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">
                    Planned Line Items (Edit quantities for {dupTargetMonth})
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Dispatched starts at 0 PCS
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-semibold sticky top-0">
                      <tr>
                        <th className="p-2.5">Item &amp; Customer</th>
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
                            <div className="text-[11px] text-slate-600">{item.itemName}</div>
                            <div className="text-[10px] text-gray-400">{item.customer} &bull; {item.plant}</div>
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
                onClick={() => setDuplicateModalMonth(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDuplicateMonth}
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
                    <option value="Marico FMCG Consumer Products">Marico FMCG Consumer Products</option>
                    <option value="Bajaj Auto Ltd Chakan Works">Bajaj Auto Ltd Chakan Works</option>
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
                        } else if (e.target.value === 'FG-FLIP-28') {
                          setNewPlanItemName('28mm PP Flip-Top Dispenser Cap (Parachute Blue)');
                          setNewPlanRate('15.00');
                        } else if (e.target.value === 'FG-MOTO-088') {
                          setNewPlanItemName('Nylon-6 Reinforced Rear Mudguard Cowl');
                          setNewPlanRate('95.00');
                        }
                      }}
                      className="w-full border border-gray-300 rounded-lg p-2 bg-white"
                    >
                      <option value="FG-AUTO-012">FG-AUTO-012 (Dashboard Trim Bezel)</option>
                      <option value="FG-AUTO-045">FG-AUTO-045 (Air Duct Housing)</option>
                      <option value="FG-FLIP-28">FG-FLIP-28 (28mm Flip-Top Cap)</option>
                      <option value="FG-MOTO-088">FG-MOTO-088 (Rear Mudguard Cowl)</option>
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


