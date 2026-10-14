import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  AlertTriangle,
  Package,
  Layers,
  ArrowRight,
  Plus,
  CheckCircle2,
  Calendar,
  Filter,
  Search,
  Building2,
  TrendingDown,
  Clock,
  DollarSign,
  Truck,
  FileText,
  Boxes,
  Eye,
  Check,
  X,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  Send,
  Zap,
  Info,
  SlidersHorizontal,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { MrpPurchaseSuggestion, PurchaseRequisition, PurchaseRequisitionLine } from '../../types/procurement';
import { addPurchaseRequisition } from '../../data/procurementData';
import { PaginationBar } from '../common/PaginationBar';
import { usePagination } from '../../hooks/usePagination';

interface Props {
  mrpSuggestions: MrpPurchaseSuggestion[];
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const ProcurementPlanningMrpView: React.FC<Props> = ({
  mrpSuggestions = [],
  onNavigate,
  showToast,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [selectedPlant, setSelectedPlant] = useState<string>('All');
  
  // Drawer state for shortage drill-down
  const [inspectItem, setInspectItem] = useState<MrpPurchaseSuggestion | null>(null);

  // Modal state for batch PR consolidation
  const [isPrModalOpen, setIsPrModalOpen] = useState<boolean>(false);
  const [prPriority, setPrPriority] = useState<'Urgent' | 'High' | 'Medium' | 'Low'>('Urgent');
  const [prRequiredDate, setPrRequiredDate] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [prTargetWarehouse, setPrTargetWarehouse] = useState<string>('RM-WH-01 (Central Polymer Warehouse)');
  const [prNotes, setPrNotes] = useState<string>(
    'Automated Procurement PR generated from MRP Shortage Suggestions to prevent production line stoppages.'
  );

  // Available categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    mrpSuggestions.forEach((s) => {
      if (s.category) cats.add(s.category);
    });
    return ['All', ...Array.from(cats)];
  }, [mrpSuggestions]);

  // Filtered MRP suggestions
  const filtered = useMemo(() => {
    return mrpSuggestions.filter((m) => {
      const matchSearch =
        searchTerm === '' ||
        m.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.preferredSupplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.linkedWorkOrderId && m.linkedWorkOrderId.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchCat = selectedCategory === 'All' || m.category === selectedCategory;
      const matchPrio = selectedPriority === 'All' || m.priority.includes(selectedPriority);

      return matchSearch && matchCat && matchPrio;
    });
  }, [mrpSuggestions, searchTerm, selectedCategory, selectedPriority]);

  const { paginatedData, paginationProps } = usePagination(filtered, {
    initialPageSize: 10,
    pageSizeOptions: [10, 20, 50],
  });

  // KPI calculations
  const criticalCount = useMemo(
    () => mrpSuggestions.filter((s) => s.priority.includes('Critical') || s.priority.includes('High')).length,
    [mrpSuggestions]
  );

  const totalCapitalRequired = useMemo(
    () => mrpSuggestions.reduce((acc, s) => acc + (s.estimatedTotalCost || s.suggestedOrderQty * s.estimatedUnitPrice), 0),
    [mrpSuggestions]
  );

  const totalShortageVolume = useMemo(
    () => mrpSuggestions.reduce((acc, s) => acc + s.shortageQty, 0),
    [mrpSuggestions]
  );

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectAllFiltered = () => {
    setSelectedIds(filtered.map((m) => m.id));
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const handleOpenPrModal = () => {
    if (selectedIds.length === 0) {
      showToast('Select at least 1 MRP shortage line to generate a Purchase Requisition.');
      return;
    }
    setIsPrModalOpen(true);
  };

  const handleDispatchConsolidatedPR = () => {
    const selectedItems = mrpSuggestions.filter((m) => selectedIds.includes(m.id));
    if (selectedItems.length === 0) return;

    const prNumber = `PR-${new Date().getFullYear()}-MRP-${Math.floor(100 + Math.random() * 900)}`;
    const prLines: PurchaseRequisitionLine[] = selectedItems.map((item, idx) => {
      const lineTotal = item.suggestedOrderQty * item.estimatedUnitPrice;
      return {
        id: `PRL-${prNumber}-${idx + 1}`,
        lineNo: idx + 1,
        itemCode: item.itemCode,
        itemName: item.itemName,
        itemCategory: item.category,
        description: `MRP Shortage replenishment. Linked WO: ${item.linkedWorkOrderId || 'Demand Buffer'}. ${item.exceptionAlerts?.[0] || ''}`,
        quantity: item.suggestedOrderQty,
        uom: item.uom,
        requiredDate: item.requiredDate || prRequiredDate,
        suggestedSupplierId: item.preferredSupplierId,
        suggestedSupplierName: item.preferredSupplierName,
        estimatedUnitPrice: item.estimatedUnitPrice,
        estimatedTotal: lineTotal,
        salesOrderRef: item.linkedSalesOrderId || 'MRP-Plan',
        status: 'pending',
      };
    });

    const totalEst = prLines.reduce((acc, l) => acc + l.estimatedTotal, 0);

    const newPr: PurchaseRequisition = {
      id: prNumber,
      prNumber: prNumber,
      requestDate: new Date().toISOString().slice(0, 10),
      requestedBy: 'MRP Automated Procurement Planner',
      department: 'Procurement & Supply Chain',
      plantWarehouse: prTargetWarehouse,
      requiredDate: prRequiredDate,
      priority: prPriority,
      source: 'MRP',
      currency: 'INR (₹)',
      estimatedTotal: totalEst,
      budgetAllocated: Math.round(totalEst * 1.2),
      budgetRemaining: Math.round(totalEst * 0.2),
      budgetExceeded: false,
      status: 'pending_approval',
      approvalStatus: 'pending',
      currentApprover: 'K. Ramanathan (Procurement VP)',
      justification: prNotes,
      notes: `Consolidated ${selectedItems.length} material shortages from MRP Shortage Suggestions.`,
      lines: prLines,
      approvalHistory: [
        {
          step: 1,
          role: 'MRP Engine',
          user: 'System Automated',
          action: 'Approved',
          date: new Date().toISOString().slice(0, 10),
          comment: `Consolidated ${selectedItems.length} items from live shortage engine.`,
        },
      ],
    };

    addPurchaseRequisition(newPr);
    setIsPrModalOpen(false);
    setSelectedIds([]);
    showToast(`✓ Generated Consolidated Purchase Requisition ${prNumber} (₹${(totalEst / 100000).toFixed(2)}L)!`);
    onNavigate('purchaseReqList');
  };

  const handle1ClickPo = (item: MrpPurchaseSuggestion) => {
    const totalVal = item.suggestedOrderQty * item.estimatedUnitPrice;
    showToast(`✓ Draft PO initialized for ${item.suggestedOrderQty} ${item.uom} ${item.itemName} (₹${(totalVal / 100000).toFixed(2)}L) with ${item.preferredSupplierName}!`);
    onNavigate('poList');
  };

  return (
    <div className="space-y-5 pb-16 animate-fade-in text-slate-800">
      {/* 1. Header Section with Gradient Badge */}
      <div className="bg-gradient-to-r from-[#14213D] via-[#1a2c52] to-[#0F8B8D] rounded-3xl p-6 text-white shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white border border-white/20 uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-[#E8622C]" /> Procurement Planning &amp; Sourcing Engine
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-teal-400/20 text-teal-200 border border-teal-400/30">
              Live Work Order &amp; BOM Connected
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold font-['Space_Grotesk'] tracking-tight">
            MRP Shortage Suggestions &amp; Procurement Planning
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-3xl leading-relaxed">
            Real-time material requirements computed across active Production Work Orders, multi-level BOM explosions, safety buffers, and minimum order quantities (MOQ).
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => {
              showToast('Refreshed inventory balances & recomputed net material shortages against latest live stock ledger.');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-md transition border border-white/15 cursor-pointer shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-teal-300" />
            <span>Sync Live Stock</span>
          </button>

          <button
            onClick={handleOpenPrModal}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-md cursor-pointer ${
              selectedIds.length > 0
                ? 'bg-[#E8622C] hover:bg-[#d45320] text-white animate-pulse'
                : 'bg-white/20 text-white/70 hover:bg-white/30'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Consolidate to PR ({selectedIds.length})</span>
          </button>
        </div>
      </div>

      {/* 2. Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Critical Shortage Lines */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Critical Risk Lines</div>
            <div className="text-2xl font-black text-rose-600 font-['Space_Grotesk'] mt-1 flex items-baseline gap-1.5">
              {criticalCount}
              <span className="text-xs font-normal text-slate-500">of {mrpSuggestions.length} SKUs</span>
            </div>
            <div className="text-[11px] text-rose-700 font-medium flex items-center gap-1 mt-1">
              <ShieldAlert className="w-3.5 h-3.5" /> High Stoppage Risk
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Estimated Procurement Capital */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Estimated Outlay</div>
            <div className="text-2xl font-black text-slate-900 font-['Space_Grotesk'] mt-1">
              ₹{(totalCapitalRequired / 100000).toFixed(2)}{' '}
              <span className="text-xs font-normal text-slate-500">Lakhs</span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
              <DollarSign className="w-3.5 h-3.5 text-amber-500" /> MOQ-Optimized Sourcing
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#E8622C] flex items-center justify-center shrink-0 border border-amber-100">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Total Shortage Volume */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Deficit Volume</div>
            <div className="text-2xl font-black text-slate-900 font-mono mt-1">
              {Math.round(totalShortageVolume).toLocaleString()}{' '}
              <span className="text-xs font-normal text-slate-500">Units</span>
            </div>
            <div className="text-[11px] text-teal-700 font-medium flex items-center gap-1 mt-1">
              <Boxes className="w-3.5 h-3.5 text-[#0F8B8D]" /> Resin &amp; Packaging Deficit
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#0F8B8D] flex items-center justify-center shrink-0 border border-teal-100">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Sourcing Optimization */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Consolidation Potential</div>
            <div className="text-2xl font-black text-[#0F8B8D] font-['Space_Grotesk'] mt-1">
              3 Direct POs
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
              <Truck className="w-3.5 h-3.5 text-indigo-500" /> Save ~₹45K Bulk Freight
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
            <Zap className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Filter & Category Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by material code, description, supplier, WO..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F8B8D] transition"
            />
          </div>

          {/* Action Tools & Selection Counters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={selectAllFiltered}
              className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold text-slate-700 transition cursor-pointer"
            >
              Select All ({filtered.length})
            </button>
            {selectedIds.length > 0 && (
              <button
                onClick={clearSelection}
                className="px-3 py-1.5 border border-slate-200 hover:bg-rose-50 text-rose-600 rounded-xl font-bold transition cursor-pointer"
              >
                Clear ({selectedIds.length})
              </button>
            )}

            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
            >
              <option value="All">All Urgency Levels</option>
              <option value="Critical">Critical Shortage Only</option>
              <option value="High">High Production Risk</option>
              <option value="Medium">Medium (Reorder Point)</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100 scrollbar-none">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Category:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-[#14213D] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Rich MRP Shortage Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200 font-bold">
                <th className="py-3.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filtered.length && filtered.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) selectAllFiltered();
                      else clearSelection();
                    }}
                    className="rounded text-[#0F8B8D] focus:ring-[#0F8B8D] cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4">Material SKU &amp; Specs</th>
                <th className="py-3.5 px-4 text-center">Stock Health vs Allocated</th>
                <th className="py-3.5 px-4 text-right">Required (WO Demand)</th>
                <th className="py-3.5 px-4 text-right bg-rose-50/70 text-rose-900 font-bold border-x border-rose-200">
                  Net Shortage
                </th>
                <th className="py-3.5 px-4 text-right">Suggested PO (MOQ)</th>
                <th className="py-3.5 px-4">Preferred Supplier &amp; Terms</th>
                <th className="py-3.5 px-4 text-right">Est. Cost (₹)</th>
                <th className="py-3.5 px-4 text-center">Urgency</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedData.length > 0 ? (
                paginatedData.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  const isCritical = item.priority.includes('Critical') || item.priority.includes('High');
                  const stockRatio = Math.min(
                    100,
                    Math.round(((item.availableStock || 0) / (item.requiredQty || 1)) * 100)
                  );

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                        isSelected ? 'bg-[#0F8B8D]/5' : isCritical ? 'bg-rose-50/10' : ''
                      }`}
                      onClick={() => toggleSelect(item.id)}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(item.id)}
                          className="rounded text-[#0F8B8D] focus:ring-[#0F8B8D] cursor-pointer"
                        />
                      </td>

                      {/* Material SKU */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#14213D] text-sm hover:text-[#0F8B8D] flex items-center gap-1.5">
                          {item.itemName}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-mono">
                          <span className="font-bold text-slate-700">{item.itemCode}</span>
                          <span>•</span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-sans text-[10px]">
                            {item.category}
                          </span>
                          {item.linkedWorkOrderId && (
                            <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-mono font-bold text-[10px] border border-indigo-200">
                              WO: {item.linkedWorkOrderId}
                            </span>
                          )}
                        </div>
                        {item.exceptionAlerts?.[0] && (
                          <div className="text-[10px] text-rose-600 font-medium mt-1 truncate max-w-xs flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            <span>{item.exceptionAlerts[0]}</span>
                          </div>
                        )}
                      </td>

                      {/* Stock Health Visual Bar */}
                      <td className="py-3.5 px-4">
                        <div className="w-36 mx-auto">
                          <div className="flex justify-between text-[10px] mb-1 font-mono">
                            <span className="text-slate-500">{item.availableStock.toLocaleString()} {item.uom}</span>
                            <span className="font-bold text-slate-700">{stockRatio}% covered</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                stockRatio < 30
                                  ? 'bg-rose-500'
                                  : stockRatio < 70
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${stockRatio}%` }}
                            />
                          </div>
                          <div className="text-[9px] text-slate-400 mt-1 flex justify-between">
                            <span>Safety: {item.safetyStock}</span>
                            <span>In-Transit: {item.incomingPoQty || 0}</span>
                          </div>
                        </div>
                      </td>

                      {/* Required Demand */}
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-800">
                        {item.requiredQty.toLocaleString()} {item.uom}
                      </td>

                      {/* Net Shortage */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-700 border-x border-rose-200 bg-rose-50/40 text-sm">
                        {item.shortageQty.toLocaleString()} {item.uom}
                      </td>

                      {/* Suggested PO Qty (MOQ Rounded) */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[#0F8B8D]">
                        <div>{item.suggestedOrderQty.toLocaleString()} {item.uom}</div>
                        <span className="text-[10px] text-slate-400 font-normal">MOQ Rounded</span>
                      </td>

                      {/* Preferred Supplier */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{item.preferredSupplierName}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{item.leadTimeDays}d Lead Time</span>
                          <span>•</span>
                          <span>₹{item.estimatedUnitPrice}/{item.uom}</span>
                        </div>
                      </td>

                      {/* Total Cost */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        ₹{(item.estimatedTotalCost || item.suggestedOrderQty * item.estimatedUnitPrice).toLocaleString()}
                      </td>

                      {/* Urgency Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            item.priority.includes('Critical')
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : item.priority.includes('High')
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.priority.includes('Critical')
                                ? 'bg-rose-600 animate-ping'
                                : item.priority.includes('High')
                                ? 'bg-amber-600'
                                : 'bg-slate-400'
                            }`}
                          />
                          {item.priority.split(' ')[0]}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">Need by {item.requiredDate}</div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            title="Inspect Demand Details & WO Traceability"
                            onClick={() => setInspectItem(item)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handle1ClickPo(item)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-[#14213D] hover:bg-[#1f325c] text-white rounded-lg text-[11px] font-bold transition shadow-xs cursor-pointer whitespace-nowrap"
                          >
                            <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                            <span>1-Click PO</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <div className="font-bold text-slate-700 text-sm">No Material Shortages Found</div>
                    <p className="text-xs text-slate-500 mt-1">All material demands are currently met by available inventory.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/50">
          <PaginationBar {...paginationProps} />
        </div>
      </div>

      {/* 5. Shortage Traceability & Inspection Modal / Drawer */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 text-slate-800 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{inspectItem.itemName}</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {inspectItem.itemCode} • Category: {inspectItem.category}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectItem(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid Metrics */}
            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
              <div>
                <span className="text-slate-500">Gross Requirement:</span>
                <div className="font-bold text-slate-900 text-sm font-mono mt-0.5">
                  {inspectItem.requiredQty.toLocaleString()} {inspectItem.uom}
                </div>
              </div>
              <div>
                <span className="text-slate-500">Available Stock:</span>
                <div className="font-bold text-slate-900 text-sm font-mono mt-0.5">
                  {inspectItem.availableStock.toLocaleString()} {inspectItem.uom}
                </div>
              </div>
              <div>
                <span className="text-rose-600 font-bold">Net Shortage:</span>
                <div className="font-black text-rose-600 text-base font-mono mt-0.5">
                  {inspectItem.shortageQty.toLocaleString()} {inspectItem.uom}
                </div>
              </div>
            </div>

            {/* Traceability & Demand Driver */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Demand Drivers &amp; Work Order Impact
              </h4>
              <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200 text-amber-900 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <Boxes className="w-4 h-4 text-[#E8622C]" />
                  <span>Linked Production Work Order: <b>{inspectItem.linkedWorkOrderId || 'WO-1190'}</b></span>
                </div>
                <p className="text-[11px] text-amber-800">
                  {inspectItem.exceptionAlerts?.[0] ||
                    'Production job scheduled for next week requires immediate material procurement.'}
                </p>
              </div>
            </div>

            {/* Supplier Sourcing Recommendation */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Recommended Supplier Sourcing
              </h4>
              <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-teal-900">{inspectItem.preferredSupplierName}</div>
                  <div className="text-[11px] text-teal-700 mt-0.5">
                    Lead Time: <b>{inspectItem.leadTimeDays} Days</b> • Unit Rate: <b>₹{inspectItem.estimatedUnitPrice}/{inspectItem.uom}</b>
                  </div>
                </div>
                <div className="text-right font-mono font-bold text-slate-900">
                  <div>MOQ: {inspectItem.suggestedOrderQty.toLocaleString()} {inspectItem.uom}</div>
                  <div className="text-[11px] text-[#0F8B8D]">₹{(inspectItem.suggestedOrderQty * inspectItem.estimatedUnitPrice).toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setInspectItem(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handle1ClickPo(inspectItem);
                  setInspectItem(null);
                }}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#14213D] hover:bg-[#1f325c] text-white text-xs font-bold shadow-sm transition cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>Initialize Direct PO</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Batch Consolidate PR Modal */}
      {isPrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5 text-slate-800 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#E8622C]/10 text-[#E8622C] flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Consolidate to Purchase Requisition</h3>
                  <p className="text-xs text-slate-500">
                    Bundle {selectedIds.length} shortage lines into a formal Draft PR for management approval
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPrModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Plant / Receiving Warehouse</label>
                <select
                  value={prTargetWarehouse}
                  onChange={(e) => setPrTargetWarehouse(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                >
                  <option value="RM-WH-01 (Central Polymer Warehouse)">RM-WH-01 (Central Polymer Warehouse - Hosur)</option>
                  <option value="RM-WH-02 (Sanand Auto-Plast Storage)">RM-WH-02 (Sanand Auto-Plast Storage - Gujarat)</option>
                  <option value="RM-WH-03 (Chennai Molding Yard)">RM-WH-03 (Chennai Molding Yard - Tamil Nadu)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Requisition Urgency</label>
                  <select
                    value={prPriority}
                    onChange={(e) => setPrPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="Urgent">Urgent (Line Stoppage Risk)</option>
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium (Safety Stock)</option>
                    <option value="Low">Low Priority</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Required Delivery Date</label>
                  <input
                    type="date"
                    value={prRequiredDate}
                    onChange={(e) => setPrRequiredDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Justification / Approval Notes</label>
                <textarea
                  rows={2}
                  value={prNotes}
                  onChange={(e) => setPrNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-slate-700">
                <span>Selected Items to include:</span>
                <span className="font-bold text-[#14213D] font-mono">{selectedIds.length} SKUs</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsPrModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDispatchConsolidatedPR}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#E8622C] hover:bg-[#d45320] text-white text-xs font-bold shadow-md transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Create &amp; Dispatch PR</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
