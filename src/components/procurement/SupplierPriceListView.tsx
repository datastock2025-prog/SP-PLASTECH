import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Scale,
  Calendar,
  Layers,
  Sparkles,
  Building2,
  Package,
  Calculator,
  ExternalLink,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  LayoutGrid,
  List,
  Edit2,
  Copy,
  ChevronRight,
  Info,
  DollarSign,
  ShieldCheck,
  UserPlus,
  X,
  Sliders,
  Check,
  ArrowUpRight,
} from 'lucide-react';
import { SupplierPriceListEntry, SupplierMaster } from '../../types/procurement';
import { ItemMaster } from '../../types';
import { ProcurementStatusBadge } from './ProcurementStatusBadge';
import { INITIAL_SUPPLIER_PRICE_LISTS } from '../../data/procurementData';
import { itemService } from '../../services/itemService';
import { SupabaseDataService } from '../../services/supabaseService';

interface Props {
  priceLists?: SupplierPriceListEntry[];
  suppliers?: SupplierMaster[];
  items?: ItemMaster[];
  onNavigate: (view: string, param?: any) => void;
  onUpdatePriceList?: (updated: SupplierPriceListEntry) => void;
  onCreatePriceList?: (newEntry: SupplierPriceListEntry) => void;
  showToast: (msg: string) => void;
}

// Helper to safely format numbers and prevent .toFixed crash on undefined/null
const safeNum = (val: any): number => {
  if (typeof val === 'number' && !isNaN(val)) return val;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? 0 : parsed;
};

const safeFormatCurrency = (val: any): string => {
  return safeNum(val).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const SupplierPriceListView: React.FC<Props> = ({
  priceLists: propPriceLists = INITIAL_SUPPLIER_PRICE_LISTS,
  suppliers = [],
  items = INITIAL_ITEMS,
  onNavigate,
  onUpdatePriceList,
  onCreatePriceList,
  showToast,
}) => {
  const [priceLists, setPriceLists] = useState<SupplierPriceListEntry[]>(propPriceLists);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [supplierFilter, setSupplierFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Interactive Live Simulator State
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simulatedIndexShift, setSimulatedIndexShift] = useState<number>(0); // ₹/kg +/- delta

  // Modal State for Add/Edit Formula
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<SupplierPriceListEntry | null>(null);

  // Autocomplete Dropdown Focus States for Item Master Linkage
  const [isItemCodeFocused, setIsItemCodeFocused] = useState(false);
  const [isItemNameFocused, setIsItemNameFocused] = useState(false);

  const activeItemsList = items && items.length > 0 ? items : itemService.getItemsSync();

  // Sync prop changes
  React.useEffect(() => {
    if (propPriceLists) {
      setPriceLists(propPriceLists);
    }
  }, [propPriceLists]);

  // Unique lists for filtering
  const uniqueSuppliers = useMemo(() => {
    const list = Array.from(new Set(priceLists.map((p) => p.supplierName || 'Unknown')));
    return list.filter(Boolean);
  }, [priceLists]);

  // Filtered List
  const filtered = useMemo(() => {
    return priceLists.filter((pl) => {
      const matchSearch =
        pl.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pl.itemCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pl.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pl.priceListId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pl.indexReference && pl.indexReference.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchType = typeFilter === 'All' || pl.priceType === typeFilter;
      const matchStatus = statusFilter === 'All' || pl.status === statusFilter;
      const matchSupplier = supplierFilter === 'All' || pl.supplierName === supplierFilter;

      return matchSearch && matchType && matchStatus && matchSupplier;
    });
  }, [priceLists, searchTerm, typeFilter, statusFilter, supplierFilter]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalSchedules = priceLists.length;
    const indexedContracts = priceLists.filter((p) => p.priceType === 'Indexed').length;
    const activeContracts = priceLists.filter((p) => p.status === 'Active').length;
    const avgBaseRate =
      priceLists.length > 0
        ? priceLists.reduce((sum, p) => sum + safeNum(p.unitPrice), 0) / priceLists.length
        : 0;

    return {
      totalSchedules,
      indexedContracts,
      activeContracts,
      avgBaseRate,
    };
  }, [priceLists]);

  // Form State for Add / Edit Modal
  const [formData, setFormData] = useState<Partial<SupplierPriceListEntry>>({
    priceListId: `PL-${new Date().getFullYear()}-00${priceLists.length + 1}`,
    supplierId: suppliers[0]?.id || 'SUP-001',
    supplierName: suppliers[0]?.name || 'Reliance Polymers Ltd',
    itemCode: items[0]?.code || 'RM-PP-NAT-001',
    itemName: items[0]?.name || 'PP Natural Granules H110MA',
    uom: 'KG',
    currency: 'INR (₹)',
    unitPrice: 82.5,
    effectiveFrom: new Date().toISOString().split('T')[0],
    effectiveTo: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
    moq: 5000,
    leadTimeDays: 5,
    priceType: 'Indexed',
    indexReference: 'Platts CFR South Asia PP Raffia Monthly Average',
    baseIndexValue: 78.0,
    adjustmentFormula: 'P = Platts_PP_Index + ₹4.50/kg conversion adder',
    freightIncluded: false,
    packingIncluded: true,
    taxPct: 18,
    status: 'Active',
  });

  const handleOpenAddModal = (entryToEdit?: SupplierPriceListEntry) => {
    if (entryToEdit) {
      setEditingEntry(entryToEdit);
      setFormData({ ...entryToEdit });
    } else {
      setEditingEntry(null);
      const defaultSupplier = suppliers[0] || { id: 'SUP-001', name: 'Reliance Polymers Ltd' };
      const defaultItem = items[0] || { code: 'RM-PP-NAT-001', name: 'PP Natural Granules H110MA' };
      setFormData({
        priceListId: `PL-${new Date().getFullYear()}-00${priceLists.length + 1}`,
        supplierId: defaultSupplier.id,
        supplierName: defaultSupplier.name,
        itemCode: defaultItem.code,
        itemName: defaultItem.name,
        uom: 'KG',
        currency: 'INR (₹)',
        unitPrice: 82.5,
        effectiveFrom: new Date().toISOString().split('T')[0],
        effectiveTo: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
        moq: 5000,
        leadTimeDays: 5,
        priceType: 'Indexed',
        indexReference: 'Platts CFR South Asia PP Raffia Monthly Average',
        baseIndexValue: 78.0,
        adjustmentFormula: 'P = Platts_PP_Index + ₹4.50/kg conversion adder',
        freightIncluded: false,
        packingIncluded: true,
        taxPct: 18,
        status: 'Active',
      });
    }
    setIsAddModalOpen(true);
  };

  const handleSavePriceList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.itemName || !formData.supplierName || safeNum(formData.unitPrice) <= 0) {
      showToast('Please fill in valid supplier, item, and rate details');
      return;
    }

    if (editingEntry) {
      const updated: SupplierPriceListEntry = {
        ...editingEntry,
        ...(formData as SupplierPriceListEntry),
        unitPrice: safeNum(formData.unitPrice),
        baseIndexValue: safeNum(formData.baseIndexValue),
        moq: safeNum(formData.moq),
        leadTimeDays: safeNum(formData.leadTimeDays),
        taxPct: safeNum(formData.taxPct),
      };
      setPriceLists((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      onUpdatePriceList?.(updated);
      SupabaseDataService.upsertSupplierPriceList({
        id: updated.id,
        price_list_id: updated.priceListId,
        supplier_id: updated.supplierId,
        supplier_name: updated.supplierName,
        item_code: updated.itemCode,
        item_name: updated.itemName,
        uom: updated.uom,
        currency: updated.currency,
        unit_price: updated.unitPrice,
        effective_from: updated.effectiveFrom,
        effective_to: updated.effectiveTo,
        moq: updated.moq,
        lead_time_days: updated.leadTimeDays,
        price_type: updated.priceType,
        index_reference: updated.indexReference,
        base_index_value: updated.baseIndexValue,
        adjustment_formula: updated.adjustmentFormula,
        freight_included: updated.freightIncluded,
        packing_included: updated.packingIncluded,
        tax_pct: updated.taxPct,
        status: updated.status,
        tiers: updated.tiers || []
      }).catch(console.warn);
      showToast(`Price schedule ${updated.priceListId} updated successfully`);
    } else {
      const newEntry: SupplierPriceListEntry = {
        id: `PL-${Date.now()}`,
        priceListId: formData.priceListId || `PL-${Date.now()}`,
        supplierId: formData.supplierId || 'SUP-001',
        supplierName: formData.supplierName || 'Reliance Polymers Ltd',
        itemCode: formData.itemCode || 'RM-PP-001',
        itemName: formData.itemName || 'Polymer Resin',
        uom: formData.uom || 'KG',
        currency: formData.currency || 'INR (₹)',
        unitPrice: safeNum(formData.unitPrice),
        effectiveFrom: formData.effectiveFrom || new Date().toISOString().split('T')[0],
        effectiveTo: formData.effectiveTo || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
        moq: safeNum(formData.moq) || 1000,
        leadTimeDays: safeNum(formData.leadTimeDays) || 7,
        priceType: formData.priceType || 'Indexed',
        indexReference: formData.indexReference || 'Platts Benchmark Index',
        baseIndexValue: safeNum(formData.baseIndexValue) || 75,
        adjustmentFormula: formData.adjustmentFormula || 'P = Benchmark_Index + Margin',
        freightIncluded: Boolean(formData.freightIncluded),
        packingIncluded: Boolean(formData.packingIncluded),
        taxPct: safeNum(formData.taxPct) || 18,
        status: formData.status || 'Active',
      };
      setPriceLists((prev) => [newEntry, ...prev]);
      onCreatePriceList?.(newEntry);
      SupabaseDataService.upsertSupplierPriceList({
        id: newEntry.id,
        price_list_id: newEntry.priceListId,
        supplier_id: newEntry.supplierId,
        supplier_name: newEntry.supplierName,
        item_code: newEntry.itemCode,
        item_name: newEntry.itemName,
        uom: newEntry.uom,
        currency: newEntry.currency,
        unit_price: newEntry.unitPrice,
        effective_from: newEntry.effectiveFrom,
        effective_to: newEntry.effectiveTo,
        moq: newEntry.moq,
        lead_time_days: newEntry.leadTimeDays,
        price_type: newEntry.priceType,
        index_reference: newEntry.indexReference,
        base_index_value: newEntry.baseIndexValue,
        adjustment_formula: newEntry.adjustmentFormula,
        freight_included: newEntry.freightIncluded,
        packing_included: newEntry.packingIncluded,
        tax_pct: newEntry.taxPct,
        status: newEntry.status,
        tiers: newEntry.tiers || []
      }).catch(console.warn);
      showToast(`New price schedule ${newEntry.priceListId} for ${newEntry.supplierName} created!`);
    }
    setIsAddModalOpen(false);
  };

  const handleDuplicate = (entry: SupplierPriceListEntry) => {
    const duplicated: SupplierPriceListEntry = {
      ...entry,
      id: `PL-${Date.now()}`,
      priceListId: `${entry.priceListId}-COPY`,
      status: 'Pending Approval',
    };
    setPriceLists((prev) => [duplicated, ...prev]);
    onCreatePriceList?.(duplicated);
    showToast(`Duplicated ${entry.priceListId} to ${duplicated.priceListId}`);
  };

  return (
    <div className="space-y-6 pb-14 font-sans max-w-full">
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0F8B8D]/10 text-[#0F8B8D] uppercase tracking-wider">
                Procurement Intelligence
              </span>
              <span className="text-slate-300 text-xs">•</span>
              <span className="text-xs font-semibold text-slate-500">Commodity Indices (Platts / ICIS / Panipat)</span>
            </div>
            <h1 className="text-2xl font-black font-['Space_Grotesk'] text-[#14213D] tracking-tight">
              Supplier Price Lists & Contract Formulas
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Manage indexed commodity pricing formulas tied to global polymer benchmarks (Platts CFR South Asia, ICIS,
              RIL Panipat basic) with live landed rate calculations and automated PO price population.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
            {/* Direct Link to Onboard New Vendor */}
            <button
              onClick={() => onNavigate('suppliers', { openOnboard: true })}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold shadow-xs transition active:scale-95"
              title="Launch the comprehensive 5-step vendor onboarding wizard"
            >
              <UserPlus className="w-3.5 h-3.5 text-amber-700" />
              <span>Onboard New Vendor</span>
            </button>

            {/* Live Commodity Simulation Toggle */}
            <button
              onClick={() => setIsSimulatorOpen(!isSimulatorOpen)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition active:scale-95 ${
                isSimulatorOpen
                  ? 'bg-purple-700 text-white border-purple-800 shadow-md'
                  : 'bg-purple-50 hover:bg-purple-100 text-purple-900 border-purple-200'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Index Simulation</span>
            </button>

            {/* Add Price Schedule Button */}
            <button
              onClick={() => handleOpenAddModal()}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#0F8B8D] hover:bg-[#0d797b] text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Price Formula</span>
            </button>
          </div>
        </div>

        {/* Live Index Simulator Drawer / Ribbon */}
        {isSimulatorOpen && (
          <div className="mt-5 p-4 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border border-purple-200 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-600 text-white rounded-lg">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-purple-950">Commodity Market Index Stress Tester & Simulator</h4>
                  <p className="text-[11px] text-purple-700">
                    Adjust benchmark index shift to observe real-time landed contract rate adjustments across active formulas.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-purple-900">
                  Simulated Delta: {simulatedIndexShift > 0 ? `+₹${simulatedIndexShift.toFixed(2)}/kg` : simulatedIndexShift < 0 ? `-₹${Math.abs(simulatedIndexShift).toFixed(2)}/kg` : '₹0.00 (Current)'}
                </span>
                <button
                  onClick={() => setSimulatedIndexShift(0)}
                  className="text-[10px] font-semibold text-purple-700 hover:text-purple-950 underline"
                >
                  Reset Delta
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-1">
              <span className="text-xs text-slate-500 font-medium">-₹10/kg</span>
              <input
                type="range"
                min="-10"
                max="15"
                step="0.5"
                value={simulatedIndexShift}
                onChange={(e) => setSimulatedIndexShift(parseFloat(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <span className="text-xs text-slate-500 font-medium">+₹15/kg</span>
            </div>
          </div>
        )}
      </div>

      {/* KPI Metrics Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-[#0F8B8D]/10 text-[#0F8B8D]">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Active Formulas</div>
            <div className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D]">
              {metrics.activeContracts} / {metrics.totalSchedules}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-700">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Indexed Commodity Links</div>
            <div className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D]">
              {metrics.indexedContracts} Schedules
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Avg Landed Rate</div>
            <div className="text-xl font-bold font-['Space_Grotesk'] text-emerald-700">
              ₹{safeFormatCurrency(metrics.avgBaseRate)}/kg
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-700">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Qualified Vendors</div>
            <div className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D]">
              {uniqueSuppliers.length} Vendors Linked
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by material name, SKU code, supplier name, benchmark index, or contract ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F8B8D]/20 focus:border-[#0F8B8D] transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Price Type */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:border-[#0F8B8D]"
            >
              <option value="All">All Pricing Types</option>
              <option value="Indexed">Indexed (Platts / ICIS)</option>
              <option value="Fixed">Fixed Contract</option>
              <option value="Tiered">Tiered Volume</option>
              <option value="Contract">Annual Blanket</option>
            </select>

            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:border-[#0F8B8D]"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Expired">Expired</option>
            </select>

            {/* Supplier */}
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:border-[#0F8B8D] max-w-[160px] truncate"
            >
              <option value="All">All Vendors</option>
              {uniqueSuppliers.map((sup) => (
                <option key={sup} value={sup}>
                  {sup}
                </option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === 'cards' ? 'bg-white text-[#14213D] shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Formula Cards View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === 'table' ? 'bg-white text-[#14213D] shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Slider-Free Table Registry View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Rendering: Empty State */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-3">
            <Scale className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#14213D]">No Price Schedules Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            No contract price lists match the applied search query or filters. You can create a new formula or onboard a new vendor.
          </p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('All');
                setStatusFilter('All');
                setSupplierFilter('All');
              }}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Reset Filters
            </button>
            <button
              onClick={() => onNavigate('suppliers', { openOnboard: true })}
              className="px-3.5 py-2 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-xl transition"
            >
              Onboard Vendor
            </button>
            <button
              onClick={() => handleOpenAddModal()}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-[#0F8B8D] hover:bg-[#0d797b] rounded-xl shadow-xs transition"
            >
              Create Formula
            </button>
          </div>
        </div>
      ) : viewMode === 'cards' ? (
        /* Formula Cards Grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filtered.map((pl) => {
            const baseRate = safeNum(pl.unitPrice);
            const simulatedRate = baseRate + (pl.priceType === 'Indexed' ? simulatedIndexShift : 0);
            const baseIndex = safeNum(pl.baseIndexValue);
            const simulatedIndex = baseIndex + simulatedIndexShift;

            return (
              <div
                key={pl.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-[#0F8B8D] hover:shadow-md transition group"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs text-[#0F8B8D] bg-[#0F8B8D]/10 px-2 py-0.5 rounded-lg">
                        {pl.itemCode || 'SKU-GEN'}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">{pl.priceListId}</span>
                      <ProcurementStatusBadge status={pl.status} size="xs" />
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-semibold">
                        {pl.priceType} Pricing
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-[#14213D] mt-1.5 group-hover:text-[#0F8B8D] transition">
                      {pl.itemName}
                    </h3>
                    {/* Clickable Link to Supplier Detail */}
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() =>
                          onNavigate('supplierDetail', {
                            id: pl.supplierId || 'SUP-001',
                            supplierName: pl.supplierName,
                          })
                        }
                        className="text-xs font-semibold text-[#14213D] hover:text-[#0F8B8D] hover:underline flex items-center gap-1"
                        title="View Full Supplier Profile & Compliance"
                      >
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>{pl.supplierName || 'Primary Polymer Supplier'}</span>
                        <ArrowUpRight className="w-3 h-3 text-slate-400" />
                      </button>
                      <span className="text-slate-300 text-xs">•</span>
                      <span className="text-[11px] text-slate-500 font-mono">{pl.currency || 'INR (₹)'}</span>
                    </div>
                  </div>

                  {/* Rate Display */}
                  <div className="text-right shrink-0 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">
                      {simulatedIndexShift !== 0 && pl.priceType === 'Indexed' ? 'Simulated Rate' : 'Contract Rate'}
                    </div>
                    <div
                      className={`text-lg font-bold font-['Space_Grotesk'] ${
                        simulatedIndexShift !== 0 && pl.priceType === 'Indexed' ? 'text-purple-700' : 'text-emerald-700'
                      }`}
                    >
                      ₹{safeFormatCurrency(simulatedRate)} <span className="text-xs font-normal text-slate-500">/ {pl.uom || 'KG'}</span>
                    </div>
                    {simulatedIndexShift !== 0 && pl.priceType === 'Indexed' && (
                      <div className="text-[10px] text-purple-700 font-semibold mt-0.5">
                        Base: ₹{safeFormatCurrency(baseRate)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Benchmark Formula Block */}
                {pl.priceType === 'Indexed' ? (
                  <div className="p-3.5 bg-gradient-to-br from-amber-50/80 via-orange-50/40 to-amber-50/80 border border-amber-200/90 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-amber-900 font-bold text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-amber-700" />
                        <span>Benchmark Index Reference</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 bg-amber-200/60 rounded text-amber-900 font-mono">
                        Formula Model
                      </span>
                    </div>

                    <div className="text-slate-700 text-[11px] space-y-1">
                      <div className="font-semibold text-[#14213D]">{pl.indexReference || 'Global Commodity Benchmark'}</div>
                      <div className="flex items-center justify-between pt-1 border-t border-amber-200/60 text-[11px]">
                        <span>
                          Base Benchmark: <strong className="text-slate-900">₹{safeFormatCurrency(baseIndex)}/kg</strong>
                          {simulatedIndexShift !== 0 && (
                            <span className="text-purple-700 font-bold ml-1.5">
                              (Sim: ₹{safeFormatCurrency(simulatedIndex)}/kg)
                            </span>
                          )}
                        </span>
                        <span className="font-mono text-amber-950 font-bold text-xs bg-white/70 px-2 py-0.5 rounded border border-amber-200">
                          {pl.adjustmentFormula || 'P = Index + Conversion Adder'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Fixed Rate Commitment with Annual Volume SLA</span>
                    </div>
                    <span className="font-semibold text-slate-700">GST: {safeNum(pl.taxPct)}%</span>
                  </div>
                )}

                {/* Commercial Terms & Validity */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100 text-[11px]">
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <div className="text-[10px] text-slate-400 font-medium">Validity</div>
                    <div className="font-semibold text-slate-800 truncate">
                      {pl.effectiveFrom || 'N/A'} ~ {pl.effectiveTo || 'N/A'}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <div className="text-[10px] text-slate-400 font-medium">MOQ Break</div>
                    <div className="font-semibold text-slate-800">
                      {safeNum(pl.moq).toLocaleString()} {pl.uom || 'KG'}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <div className="text-[10px] text-slate-400 font-medium">Lead Time</div>
                    <div className="font-semibold text-slate-800">{safeNum(pl.leadTimeDays)} Working Days</div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <div className="text-[10px] text-slate-400 font-medium">Inclusions</div>
                    <div className="font-semibold text-slate-800">
                      {pl.freightIncluded ? 'Freight Paid' : 'Ex-Works'} • {pl.packingIncluded ? 'Packing Inc.' : 'Extra'}
                    </div>
                  </div>
                </div>

                {/* Action Row */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenAddModal(pl)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3 text-slate-500" />
                      <span>Edit Formula</span>
                    </button>
                    <button
                      onClick={() => handleDuplicate(pl)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                      title="Duplicate Schedule for new period"
                    >
                      <Copy className="w-3 h-3 text-slate-500" />
                      <span>Duplicate</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Create PO with this Formula */}
                    <button
                      onClick={() => {
                        onNavigate('poCreate', {
                          supplierId: pl.supplierId,
                          supplierName: pl.supplierName,
                          itemCode: pl.itemCode,
                          itemName: pl.itemName,
                          unitPrice: safeNum(pl.unitPrice),
                          uom: pl.uom,
                        });
                        showToast(`Initiating Purchase Order for ${pl.itemName} with rate ₹${safeFormatCurrency(pl.unitPrice)}`);
                      }}
                      className="px-3 py-1.5 bg-[#0F8B8D] hover:bg-[#0d797b] text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1"
                    >
                      <span>Create PO</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Slider-Free Structured Table Registry */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs border-collapse table-fixed">
            <colgroup>
              <col className="w-[12%]" />
              <col className="w-[20%]" />
              <col className="w-[22%]" />
              <col className="w-[12%]" />
              <col className="w-[12%]" />
              <col className="w-[10%]" />
              <col className="w-[12%]" />
            </colgroup>
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-3.5 px-4">Schedule ID</th>
                <th className="py-3.5 px-3">Supplier Name</th>
                <th className="py-3.5 px-3">Material & Code</th>
                <th className="py-3.5 px-3">Pricing Model</th>
                <th className="py-3.5 px-3 text-right">Landed Rate</th>
                <th className="py-3.5 px-3 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filtered.map((pl) => (
                <tr key={pl.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-xs text-slate-800">{pl.priceListId}</span>
                    <div className="text-[10px] text-slate-400">{pl.effectiveFrom} ~ {pl.effectiveTo}</div>
                  </td>
                  <td className="py-3.5 px-3">
                    <button
                      onClick={() =>
                        onNavigate('supplierDetail', {
                          id: pl.supplierId || 'SUP-001',
                          supplierName: pl.supplierName,
                        })
                      }
                      className="font-bold text-xs text-[#14213D] hover:text-[#0F8B8D] hover:underline text-left block truncate"
                    >
                      {pl.supplierName}
                    </button>
                    <div className="text-[10px] text-slate-400">MOQ: {safeNum(pl.moq).toLocaleString()} {pl.uom || 'KG'}</div>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="font-semibold text-slate-800 truncate">{pl.itemName}</div>
                    <span className="font-mono text-[10px] text-[#0F8B8D] bg-[#0F8B8D]/10 px-1.5 py-0.2 rounded font-bold">
                      {pl.itemCode}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      {pl.priceType}
                    </span>
                    {pl.indexReference && (
                      <div className="text-[10px] text-slate-500 truncate mt-0.5" title={pl.indexReference}>
                        {pl.indexReference}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <div className="font-bold font-['Space_Grotesk'] text-sm text-emerald-700">
                      ₹{safeFormatCurrency(pl.unitPrice)}
                    </div>
                    <div className="text-[10px] text-slate-400">per {pl.uom || 'KG'}</div>
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <ProcurementStatusBadge status={pl.status} size="xs" />
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1">
                    <button
                      onClick={() => handleOpenAddModal(pl)}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                      title="Edit Schedule"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        onNavigate('poCreate', {
                          supplierId: pl.supplierId,
                          supplierName: pl.supplierName,
                          itemCode: pl.itemCode,
                          itemName: pl.itemName,
                          unitPrice: safeNum(pl.unitPrice),
                          uom: pl.uom,
                        });
                        showToast(`Initiating Purchase Order for ${pl.itemName}`);
                      }}
                      className="px-2.5 py-1 bg-[#0F8B8D] hover:bg-[#0d797b] text-white rounded-lg text-xs font-semibold shadow-xs transition inline-flex items-center gap-1"
                    >
                      <span>PO</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Add / Edit Price Schedule Formula */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base font-['Space_Grotesk'] text-[#14213D]">
                  {editingEntry ? 'Edit Commodity Price Schedule' : 'Create Commodity Price Schedule & Formula'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set baseline commodity indices, conversion premiums, and purchase order automated formulas
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSavePriceList} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Schedule ID */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Price Schedule ID *</label>
                  <input
                    type="text"
                    required
                    value={formData.priceListId || ''}
                    onChange={(e) => setFormData({ ...formData, priceListId: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-none focus:border-[#0F8B8D]"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contract Status</label>
                  <select
                    value={formData.status || 'Active'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#0F8B8D]"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending Approval">Pending Approval</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>
              </div>

              {/* Supplier Selection with Direct Onboard Link */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Contracted Supplier / Vendor *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      onNavigate('suppliers', { openOnboard: true });
                    }}
                    className="text-[11px] font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 hover:underline"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>+ Onboard New Vendor</span>
                  </button>
                </div>
                <select
                  value={formData.supplierId || ''}
                  onChange={(e) => {
                    const selected = suppliers.find((s) => s.id === e.target.value);
                    if (selected) {
                      setFormData({
                        ...formData,
                        supplierId: selected.id,
                        supplierName: selected.name,
                      });
                    }
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#0F8B8D]"
                >
                  {suppliers.length > 0 ? (
                    suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code || s.id}) - {s.category || 'Vendor'}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="SUP-001">Reliance Polymers Ltd (SUP-001)</option>
                      <option value="SUP-002">Clariant Masterbatches Ltd (SUP-002)</option>
                      <option value="SUP-003">Indian Oil Corporation Ltd (SUP-003)</option>
                      <option value="SUP-004">Haldia Petrochemicals Ltd (SUP-004)</option>
                    </>
                  )}
                </select>
              </div>

              {/* Item Selection from Item Master with Interactive Autocomplete */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Item Master SKU Linkage *</label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {activeItemsList.length} Items in Master Catalog
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Item Code Input with Autocomplete */}
                  <div className="relative">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Material Item Code *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="Type to search (e.g. RM-PP-NAT-001)..."
                        value={formData.itemCode || ''}
                        onFocus={() => setIsItemCodeFocused(true)}
                        onBlur={() => setTimeout(() => setIsItemCodeFocused(false), 250)}
                        onChange={(e) => {
                          const code = e.target.value;
                          const matched = activeItemsList.find(
                            (i) => i.code.toLowerCase() === code.trim().toLowerCase()
                          );
                          if (matched) {
                            setFormData({
                              ...formData,
                              itemCode: matched.code,
                              itemName: matched.name,
                              uom: matched.baseUOM || 'KG',
                            });
                          } else {
                            setFormData({ ...formData, itemCode: code });
                          }
                        }}
                        className="w-full pl-3 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-[#0F8B8D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F8B8D]/20 focus:border-[#0F8B8D] transition"
                      />
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {/* Autocomplete Dropdown for Item Code */}
                    {isItemCodeFocused && (
                      <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden max-h-56 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                        <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Matching Items in Catalog
                        </div>
                        {activeItemsList
                          .filter((i) => {
                            const q = (formData.itemCode || '').trim().toLowerCase();
                            if (!q) return true;
                            return (
                              i.code.toLowerCase().includes(q) ||
                              i.name.toLowerCase().includes(q) ||
                              (i.cat && i.cat.toLowerCase().includes(q))
                            );
                          })
                          .slice(0, 10)
                          .map((item) => (
                            <div
                              key={item.code}
                              onMouseDown={() => {
                                const parsedVal = item.valuation
                                  ? parseFloat(item.valuation.replace(/[^0-9.]/g, ''))
                                  : 0;
                                setFormData((prev) => ({
                                  ...prev,
                                  itemCode: item.code,
                                  itemName: item.name,
                                  uom: item.baseUOM || 'KG',
                                  unitPrice:
                                    prev.unitPrice && prev.unitPrice > 0
                                      ? prev.unitPrice
                                      : parsedVal > 0
                                      ? parsedVal
                                      : 80.0,
                                }));
                                setIsItemCodeFocused(false);
                                showToast(`Item ${item.code} selected`);
                              }}
                              className="px-3 py-2 hover:bg-teal-50/70 border-b border-slate-100 last:border-none cursor-pointer transition flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-xs text-[#0F8B8D] bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                                    {item.code}
                                  </span>
                                  <span className="text-xs font-semibold text-slate-800 truncate">{item.name}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  {item.cat || item.type} &bull; UOM: {item.baseUOM || 'KG'} {item.stock ? `&bull; Stock: ${item.stock}` : ''}
                                </div>
                              </div>
                              <span className="text-[10px] font-bold text-emerald-700 whitespace-nowrap">
                                {item.valuation ? `₹${item.valuation}` : ''}
                              </span>
                            </div>
                          ))}
                        {activeItemsList.filter((i) => {
                          const q = (formData.itemCode || '').trim().toLowerCase();
                          if (!q) return true;
                          return i.code.toLowerCase().includes(q) || i.name.toLowerCase().includes(q);
                        }).length === 0 && (
                          <div className="p-3 text-center text-xs text-slate-400">
                            No matching SKU found in Item Master.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Item Name / Description Input with Autocomplete */}
                  <div className="relative">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Item Description / Name *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="Type description (e.g. PP Natural Granules)..."
                        value={formData.itemName || ''}
                        onFocus={() => setIsItemNameFocused(true)}
                        onBlur={() => setTimeout(() => setIsItemNameFocused(false), 250)}
                        onChange={(e) => {
                          const name = e.target.value;
                          const matched = activeItemsList.find(
                            (i) => i.name.toLowerCase() === name.trim().toLowerCase()
                          );
                          if (matched) {
                            setFormData({
                              ...formData,
                              itemName: matched.name,
                              itemCode: matched.code,
                              uom: matched.baseUOM || 'KG',
                            });
                          } else {
                            setFormData({ ...formData, itemName: name });
                          }
                        }}
                        className="w-full pl-3 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F8B8D]/20 focus:border-[#0F8B8D] transition"
                      />
                      <Package className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {/* Autocomplete Dropdown for Item Name */}
                    {isItemNameFocused && (
                      <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden max-h-56 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                        <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Select Item from Catalog
                        </div>
                        {activeItemsList
                          .filter((i) => {
                            const q = (formData.itemName || '').trim().toLowerCase();
                            if (!q) return true;
                            return (
                              i.name.toLowerCase().includes(q) ||
                              i.code.toLowerCase().includes(q) ||
                              (i.cat && i.cat.toLowerCase().includes(q))
                            );
                          })
                          .slice(0, 10)
                          .map((item) => (
                            <div
                              key={item.code}
                              onMouseDown={() => {
                                const parsedVal = item.valuation
                                  ? parseFloat(item.valuation.replace(/[^0-9.]/g, ''))
                                  : 0;
                                setFormData((prev) => ({
                                  ...prev,
                                  itemCode: item.code,
                                  itemName: item.name,
                                  uom: item.baseUOM || 'KG',
                                  unitPrice:
                                    prev.unitPrice && prev.unitPrice > 0
                                      ? prev.unitPrice
                                      : parsedVal > 0
                                      ? parsedVal
                                      : 80.0,
                                }));
                                setIsItemNameFocused(false);
                                showToast(`Item ${item.name} selected`);
                              }}
                              className="px-3 py-2 hover:bg-teal-50/70 border-b border-slate-100 last:border-none cursor-pointer transition flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <div className="font-semibold text-xs text-slate-800 truncate">{item.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                                  <span className="text-[#0F8B8D] font-bold">{item.code}</span>
                                  <span>&bull;</span>
                                  <span>{item.cat || item.type}</span>
                                  <span>&bull;</span>
                                  <span>UOM: {item.baseUOM || 'KG'}</span>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold text-emerald-700 whitespace-nowrap">
                                {item.valuation ? `₹${item.valuation}` : ''}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Item Master Connection Badge */}
                {activeItemsList.some(
                  (i) => i.code.toLowerCase() === (formData.itemCode || '').trim().toLowerCase()
                ) ? (
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      Linked to Master Catalog: <strong>{activeItemsList.find((i) => i.code.toLowerCase() === (formData.itemCode || '').trim().toLowerCase())?.cat || 'Polymer'}</strong> &bull; Base UOM: <strong>{formData.uom || 'KG'}</strong> &bull; Auto-Sync Enabled
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200">
                    <Search className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>Type in Item Code or Description to browse and autocomplete from Item Master</span>
                  </div>
                )}
              </div>

              {/* Pricing Model & Rates */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Pricing Model *</label>
                    <select
                      value={formData.priceType || 'Indexed'}
                      onChange={(e) => setFormData({ ...formData, priceType: e.target.value as any })}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0F8B8D]"
                    >
                      <option value="Indexed">Indexed (Formula Benchmark)</option>
                      <option value="Fixed">Fixed Contract</option>
                      <option value="Tiered">Tiered Volume</option>
                      <option value="Contract">Blanket Agreement</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Base Contract Rate (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.unitPrice ?? 80}
                      onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-mono font-bold text-emerald-700 focus:outline-none focus:border-[#0F8B8D]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">UOM</label>
                    <input
                      type="text"
                      value={formData.uom || 'KG'}
                      onChange={(e) => setFormData({ ...formData, uom: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl uppercase focus:outline-none focus:border-[#0F8B8D]"
                    />
                  </div>
                </div>

                {/* Indexed Details if Selected */}
                {formData.priceType === 'Indexed' && (
                  <div className="pt-2 border-t border-slate-200 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-amber-900 mb-1">Commodity Index Ref</label>
                        <select
                          value={formData.indexReference || 'Platts CFR South Asia PP Raffia Monthly Average'}
                          onChange={(e) => setFormData({ ...formData, indexReference: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-xl focus:outline-none focus:border-[#0F8B8D]"
                        >
                          <option value="Platts CFR South Asia PP Raffia Monthly Average">Platts CFR South Asia PP Raffia</option>
                          <option value="ICIS Domestic HDPE Blow Molding Index">ICIS Domestic HDPE Blow Molding</option>
                          <option value="IOCL Panipat Monthly Basic Price Notification">IOCL Panipat Monthly Basic</option>
                          <option value="Reliance Del-Credere PP/HDPE Price Bulletin">Reliance Del-Credere Price Bulletin</option>
                          <option value="Haldia Petrochem Polymer Index (HPL)">Haldia Petrochem Polymer Index (HPL)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-amber-900 mb-1">Base Index Benchmark (₹/kg)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.baseIndexValue ?? 75}
                          onChange={(e) => setFormData({ ...formData, baseIndexValue: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-xl font-mono text-slate-800 focus:outline-none focus:border-[#0F8B8D]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-amber-900 mb-1">Pricing Adjustment Formula Expression</label>
                      <input
                        type="text"
                        value={formData.adjustmentFormula || 'P = Benchmark_Index + ₹4.50/kg conversion adder'}
                        onChange={(e) => setFormData({ ...formData, adjustmentFormula: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-xl font-mono font-bold text-amber-950 focus:outline-none focus:border-[#0F8B8D]"
                        placeholder="e.g. P = Platts_PP_Index + ₹3.50/kg conversion adder"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Commercials: Validity & Quantities */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Effective From</label>
                  <input
                    type="date"
                    value={formData.effectiveFrom || ''}
                    onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#0F8B8D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Effective To</label>
                  <input
                    type="date"
                    value={formData.effectiveTo || ''}
                    onChange={(e) => setFormData({ ...formData, effectiveTo: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#0F8B8D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">MOQ Break</label>
                  <input
                    type="number"
                    value={formData.moq ?? 1000}
                    onChange={(e) => setFormData({ ...formData, moq: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-none focus:border-[#0F8B8D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lead Time (Days)</label>
                  <input
                    type="number"
                    value={formData.leadTimeDays ?? 7}
                    onChange={(e) => setFormData({ ...formData, leadTimeDays: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-none focus:border-[#0F8B8D]"
                  />
                </div>
              </div>

              {/* Inclusions & GST */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.freightIncluded)}
                    onChange={(e) => setFormData({ ...formData, freightIncluded: e.target.checked })}
                    className="rounded text-[#0F8B8D] focus:ring-[#0F8B8D]"
                  />
                  <span className="font-semibold text-slate-700">Freight Included (FOR Destination)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.packingIncluded)}
                    onChange={(e) => setFormData({ ...formData, packingIncluded: e.target.checked })}
                    className="rounded text-[#0F8B8D] focus:ring-[#0F8B8D]"
                  />
                  <span className="font-semibold text-slate-700">Palletized / 25kg Bag Packing Included</span>
                </label>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">GST Tax %:</span>
                  <select
                    value={formData.taxPct ?? 18}
                    onChange={(e) => setFormData({ ...formData, taxPct: parseInt(e.target.value, 10) || 18 })}
                    className="px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#0F8B8D]"
                  >
                    <option value={18}>18% GST (Polymers / Masterbatches)</option>
                    <option value={12}>12% GST</option>
                    <option value={5}>5% GST (Scrap / Regrind)</option>
                    <option value={0}>0% (Tax Exempt)</option>
                  </select>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#0F8B8D] hover:bg-[#0d797b] rounded-xl shadow-xs transition"
                >
                  {editingEntry ? 'Save Changes' : 'Create Price Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
