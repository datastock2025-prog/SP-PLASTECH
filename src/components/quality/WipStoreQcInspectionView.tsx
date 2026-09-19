import React, { useState, useMemo } from 'react';
import {
  WipInventoryRecord,
  OperationalStoreType,
  PlantStoreInventoryItem,
} from '../../types/operationsWipTypes';
import { ItemMaster, WorkOrder } from '../../types';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Building2,
  Calendar,
  UserCheck,
  Package,
  Layers,
  Scissors,
  Wrench,
  Boxes,
  FileCheck2,
  RefreshCw,
  Plus,
  Trash2,
  ChevronDown,
  Info,
  BadgeAlert,
  ArrowLeft,
} from 'lucide-react';

interface WipStoreQcInspectionViewProps {
  wipRecords: WipInventoryRecord[];
  items: ItemMaster[];
  workOrders?: WorkOrder[];
  onUpdateWipRecord: (record: WipInventoryRecord) => void;
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export interface DefectAllocation {
  reason: string;
  qty: number;
}

export const STANDARD_DEFECT_REASONS = [
  'Flash / Parting Line Burr',
  'Short Shot / Incomplete Fill',
  'Sink Marks / Shrinkage',
  'Silver Streaks / Moisture Mark',
  'Burning / Black Specks',
  'Weld Line / Knit Weakness',
  'Warpage / Dimensional Drift',
  'Flow Marks / Jetting',
  'Surface Scratches / Drag Marks',
  'Insert Tilt / Thread Stripping',
  'Color Variation / Swirl',
  'Trimming Overcut / Undercut',
];

export const REJECTION_STORES = [
  { id: 'REJ-STORE-01', name: 'Quarantine Scrap Holding (REJ-STORE-01)' },
  { id: 'MRB-STORE-01', name: 'Material Review Board (MRB-STORE-01)' },
  { id: 'REGRIND-HOLDING-01', name: 'Purge & Regrind Store (REGRIND-01)' },
  { id: 'REWORK-DEFLASH-01', name: 'Rework Trimming Bay (REWORK-01)' },
];

export const WipStoreQcInspectionView: React.FC<WipStoreQcInspectionViewProps> = ({
  wipRecords,
  items,
  workOrders = [],
  onUpdateWipRecord,
  onNavigate,
  showToast,
}) => {
  // Common Header Control Fields
  const [inspectionDate, setInspectionDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [selectedPlant, setSelectedPlant] = useState<string>('PLANT-01');
  const [inspectorName, setInspectorName] = useState<string>('Pooja V. (Lead QC Inspector)');
  const [rejectionStore, setRejectionStore] = useState<string>('REJ-STORE-01');

  // Filters
  const [storeFilter, setStoreFilter] = useState<'all' | 'PRD-STORE' | 'DEFLASH-STORE' | 'ASSEMBLY-STORE'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Per-record inspection state buffer
  // RecordId -> { qtyTaken: number, defectAllocations: DefectAllocation[], customNotes: string }
  const [inspectionDrafts, setInspectionDrafts] = useState<
    Record<
      string,
      {
        qtyTaken: number;
        defectAllocations: DefectAllocation[];
        customNotes: string;
      }
    >
  >({});

  // Active modal for detailed defect breakdown
  const [activeDefectModalRecordId, setActiveDefectModalRecordId] = useState<string | null>(null);

  // Filter eligible store items (WIP, Deflash, Assembly stores)
  const consolidatedStoreRecords = useMemo(() => {
    return wipRecords.filter((rec) => {
      // Must be in WIP, Deflash, or Assembly store
      const isTargetStore =
        rec.currentStore === 'PRD-STORE' ||
        rec.currentStore === 'DEFLASH-STORE' ||
        rec.currentStore === 'ASSEMBLY-STORE';

      if (!isTargetStore) return false;
      if (selectedPlant !== 'all' && rec.plantId && rec.plantId !== selectedPlant) return false;
      if (storeFilter !== 'all' && rec.currentStore !== storeFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchItem = rec.itemCode.toLowerCase().includes(q) || (rec.itemName && rec.itemName.toLowerCase().includes(q));
        const matchWO = rec.workOrderId && rec.workOrderId.toLowerCase().includes(q);
        const matchLot = rec.batchLotNo && rec.batchLotNo.toLowerCase().includes(q);
        if (!matchItem && !matchWO && !matchLot) return false;
      }

      return rec.goodQty > 0;
    });
  }, [wipRecords, selectedPlant, storeFilter, searchQuery]);

  // Helper to get or init draft state
  const getDraft = (rec: WipInventoryRecord) => {
    const existing = inspectionDrafts[rec.id];
    if (existing) return existing;
    return {
      qtyTaken: rec.goodQty,
      defectAllocations: [],
      customNotes: '',
    };
  };

  const handleUpdateDraft = (
    recId: string,
    updates: Partial<{ qtyTaken: number; defectAllocations: DefectAllocation[]; customNotes: string }>
  ) => {
    setInspectionDrafts((prev) => {
      const current = prev[recId] || {
        qtyTaken: wipRecords.find((r) => r.id === recId)?.goodQty || 0,
        defectAllocations: [],
        customNotes: '',
      };
      return {
        ...prev,
        [recId]: { ...current, ...updates },
      };
    });
  };

  // Compute stats across all store items
  const stats = useMemo(() => {
    let totalPartsInStore = 0;
    let totalInspected = 0;
    let totalRejected = 0;
    let totalAccepted = 0;

    consolidatedStoreRecords.forEach((rec) => {
      const draft = getDraft(rec);
      const rej = draft.defectAllocations.reduce((sum, d) => sum + (d.qty || 0), 0);
      const acc = Math.max(0, draft.qtyTaken - rej);

      totalPartsInStore += rec.goodQty;
      totalInspected += draft.qtyTaken;
      totalRejected += rej;
      totalAccepted += acc;
    });

    return {
      totalPartsInStore,
      totalInspected,
      totalRejected,
      totalAccepted,
      rejectionRate: totalInspected > 0 ? ((totalRejected / totalInspected) * 100).toFixed(1) : '0.0',
    };
  }, [consolidatedStoreRecords, inspectionDrafts]);

  // Handle Commit & Release to FG Store
  const handleCommitSingleInspection = (rec: WipInventoryRecord) => {
    const draft = getDraft(rec);
    const totalRejected = draft.defectAllocations.reduce((sum, d) => sum + (d.qty || 0), 0);

    if (draft.qtyTaken <= 0) {
      showToast(`Please specify a valid quantity taken for ${rec.itemCode}`);
      return;
    }

    if (draft.qtyTaken > rec.goodQty) {
      showToast(`Quantity taken (${draft.qtyTaken}) exceeds available store stock (${rec.goodQty})`);
      return;
    }

    if (totalRejected > draft.qtyTaken) {
      showToast(`Rejected quantity (${totalRejected}) cannot exceed quantity taken (${draft.qtyTaken})`);
      return;
    }

    const acceptedQty = draft.qtyTaken - totalRejected;
    const remainingStoreQty = rec.goodQty - draft.qtyTaken;

    const defectSummary =
      draft.defectAllocations.length > 0
        ? draft.defectAllocations.map((d) => `${d.reason}: ${d.qty} PCS`).join(', ')
        : 'Zero Defects (100% Quality Pass)';

    const updatedRecord: WipInventoryRecord = {
      ...rec,
      goodQty: remainingStoreQty,
      producedQty: remainingStoreQty + rec.scrapQty + totalRejected,
      scrapQty: rec.scrapQty + totalRejected,
      currentStore: remainingStoreQty > 0 ? rec.currentStore : 'FG-STORE',
      currentStage: remainingStoreQty > 0 ? rec.currentStage : 'FG Inventory',
      qcStatus: remainingStoreQty === 0 && acceptedQty > 0 ? 'moved_to_fg' : rec.qcStatus,
      lastUpdated: new Date().toISOString(),
      history: [
        {
          event: `Consolidated Store QC Passed: +${acceptedQty} PCS dispatched to FG-STORE`,
          time: new Date().toLocaleTimeString(),
          by: inspectorName,
          store: 'FG-STORE',
          details: `Inspected ${draft.qtyTaken} PCS from ${rec.currentStore} on ${inspectionDate} (${selectedPlant}). Accepted: ${acceptedQty} PCS &rarr; FG-STORE (Ready for Invoice). Rejected: ${totalRejected} PCS &rarr; ${rejectionStore}. Defects: [${defectSummary}]. Notes: ${draft.customNotes || 'Passed final quality release.'}`,
        },
        ...(rec.history || []),
      ],
    };

    onUpdateWipRecord(updatedRecord);

    // Clear draft
    setInspectionDrafts((prev) => {
      const next = { ...prev };
      delete next[rec.id];
      return next;
    });

    showToast(
      `QC Release Confirmed! ${acceptedQty} PCS transferred to FG-STORE for Invoicing. ${totalRejected} PCS routed to ${rejectionStore}.`
    );
  };

  // Active record for defect breakdown modal
  const activeDefectRecord = useMemo(() => {
    if (!activeDefectModalRecordId) return null;
    return wipRecords.find((r) => r.id === activeDefectModalRecordId) || null;
  }, [activeDefectModalRecordId, wipRecords]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-white border border-[#E4E0D6] rounded-2xl p-5 md:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('wipInventoryGate')}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Back to WIP Inventory & Stores"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  Quality Management &bull; In-Process &amp; Store Gate
                </span>
                <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                  Consolidated Store Quality Check (WIP, Deflash &amp; Assembly)
                </h1>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2 max-w-3xl">
              Consolidates all manufactured parts across <strong>WIP Store (PRD-STORE)</strong>, <strong>Deflash Trimming Store</strong>, and <strong>Assembly Floor Store</strong>. Inspect batch quantities, assign multi-reason defect breakdowns, and release approved pieces directly to <strong>FG-STORE for Invoice &amp; Customer Dispatch</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('wipInventoryGate')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Layers className="w-4 h-4 text-slate-600" />
              WIP Stores Screen
            </button>
            <button
              type="button"
              onClick={() => onNavigate('finalInspection')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4 text-emerald-600" />
              FQC Release Gate
            </button>
          </div>
        </div>

        {/* Common Header Fields (Task 4) */}
        <div className="mt-6 pt-5 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
          {/* 1. Date */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              Inspection Date
            </label>
            <input
              type="date"
              value={inspectionDate}
              onChange={(e) => setInspectionDate(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 shadow-2xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* 2. Plant Facility */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              Plant Facility
            </label>
            <select
              value={selectedPlant}
              onChange={(e) => setSelectedPlant(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 shadow-2xs focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="PLANT-01">Plant 01 - Pune (Injection Molding Unit)</option>
              <option value="PLANT-02">Plant 02 - Sanand (Secondary Ops &amp; Assembly)</option>
              <option value="all">All Plants (Cross-Facility)</option>
            </select>
          </div>

          {/* 3. QC Person Name */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
              QC Inspector / Person
            </label>
            <input
              type="text"
              value={inspectorName}
              onChange={(e) => setInspectorName(e.target.value)}
              placeholder="Enter Inspector Name"
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 shadow-2xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* 4. Rejection Part Store */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              Rejection Part Store
            </label>
            <select
              value={rejectionStore}
              onChange={(e) => setRejectionStore(e.target.value)}
              className="w-full bg-white border border-rose-300 rounded-lg px-3 py-2 text-xs font-bold text-rose-900 bg-rose-50/40 shadow-2xs focus:ring-2 focus:ring-rose-500 focus:outline-none cursor-pointer"
            >
              {REJECTION_STORES.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Parts In Floor Stores</span>
          <span className="text-2xl font-black text-slate-900 font-mono block mt-1">
            {stats.totalPartsInStore.toLocaleString()} <span className="text-xs font-normal text-slate-500">PCS</span>
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">WIP, Deflash &amp; Assembly stores</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider block">Qty Taken for Inspection</span>
          <span className="text-2xl font-black text-indigo-700 font-mono block mt-1">
            {stats.totalInspected.toLocaleString()} <span className="text-xs font-normal text-slate-500">PCS</span>
          </span>
          <span className="text-[11px] text-indigo-600 font-medium mt-1 block">Selected sample / batch</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider block">Total Defective / Rejected</span>
          <span className="text-2xl font-black text-rose-600 font-mono block mt-1">
            {stats.totalRejected.toLocaleString()} <span className="text-xs font-normal text-slate-500">PCS</span>
          </span>
          <span className="text-[11px] text-rose-600 font-medium mt-1 block">
            {stats.rejectionRate}% Rejection Rate
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider block">Net Approved for FG Invoice</span>
          <span className="text-2xl font-black text-emerald-700 font-mono block mt-1">
            {stats.totalAccepted.toLocaleString()} <span className="text-xs font-normal text-slate-500">PCS</span>
          </span>
          <span className="text-[11px] text-emerald-600 font-medium mt-1 block">Ready for FG-STORE &amp; Dispatch</span>
        </div>
      </div>

      {/* Grid Filters & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Part #, Item Name, Work Order, or Lot..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Store Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setStoreFilter('all')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                storeFilter === 'all'
                  ? 'bg-white text-indigo-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Stores ({consolidatedStoreRecords.length})
            </button>
            <button
              type="button"
              onClick={() => setStoreFilter('PRD-STORE')}
              className={`px-3 py-1.5 rounded-md font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                storeFilter === 'PRD-STORE'
                  ? 'bg-white text-blue-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              Molding WIP
            </button>
            <button
              type="button"
              onClick={() => setStoreFilter('DEFLASH-STORE')}
              className={`px-3 py-1.5 rounded-md font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                storeFilter === 'DEFLASH-STORE'
                  ? 'bg-white text-purple-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Scissors className="w-3.5 h-3.5 text-purple-600" />
              Deflash Store
            </button>
            <button
              type="button"
              onClick={() => setStoreFilter('ASSEMBLY-STORE')}
              className={`px-3 py-1.5 rounded-md font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                storeFilter === 'ASSEMBLY-STORE'
                  ? 'bg-white text-amber-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wrench className="w-3.5 h-3.5 text-amber-600" />
              Assembly Store
            </button>
          </div>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Showing <strong>{consolidatedStoreRecords.length}</strong> active store inventory batches
        </span>
      </div>

      {/* Main Consolidated Store Inspection Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-slate-800 font-bold border-b border-slate-200">
                <th className="py-3 px-4">Item &amp; Part Specs</th>
                <th className="py-3 px-3">Store Location</th>
                <th className="py-3 px-3">Lot / Work Order</th>
                <th className="py-3 px-3 text-right">Available in Store</th>
                <th className="py-3 px-3 text-right">Qty Taken</th>
                <th className="py-3 px-3 text-right">Qty Rejected</th>
                <th className="py-3 px-4">Defect Reasons Breakdown</th>
                <th className="py-3 px-3 text-right">Accepted &rarr; FG</th>
                <th className="py-3 px-4 text-center">Release Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {consolidatedStoreRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <ShieldCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-700">No pending store items found for inspection</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      All parts in WIP, Deflash, and Assembly stores have been inspected and released to FG-STORE.
                    </p>
                  </td>
                </tr>
              ) : (
                consolidatedStoreRecords.map((rec) => {
                  const draft = getDraft(rec);
                  const totalRejected = draft.defectAllocations.reduce((sum, d) => sum + (d.qty || 0), 0);
                  const acceptedQty = Math.max(0, draft.qtyTaken - totalRejected);

                  const storeBadge =
                    rec.currentStore === 'DEFLASH-STORE' ? (
                      <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-[10px] font-bold border border-purple-200">
                        <Scissors className="w-3 h-3" /> Deflash Store
                      </span>
                    ) : rec.currentStore === 'ASSEMBLY-STORE' ? (
                      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-200">
                        <Wrench className="w-3 h-3" /> Assembly Store
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-[10px] font-bold border border-blue-200">
                        <Layers className="w-3 h-3" /> Molding WIP
                      </span>
                    );

                  return (
                    <tr key={rec.id} className="hover:bg-indigo-50/20 transition-colors">
                      {/* Item & Part Specs */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-900 block text-xs">{rec.itemCode}</span>
                        <span className="text-[11px] text-slate-600 block">{rec.itemName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">BOM: {rec.bomId}</span>
                      </td>

                      {/* Store Location */}
                      <td className="py-3.5 px-3">
                        {storeBadge}
                        <span className="text-[10px] text-slate-400 block mt-0.5">{rec.plantName?.split('-')[0]}</span>
                      </td>

                      {/* Lot / Work Order */}
                      <td className="py-3.5 px-3">
                        <span className="font-mono font-bold text-indigo-700 block text-[11px]">{rec.batchLotNo}</span>
                        <span className="font-mono text-slate-500 text-[10px] block">WO: {rec.workOrderId}</span>
                        <span className="text-[10px] text-slate-400">{rec.productionDate}</span>
                      </td>

                      {/* Available Stock in Store */}
                      <td className="py-3.5 px-3 text-right">
                        <span className="font-mono font-bold text-slate-900 text-sm block">
                          {rec.goodQty.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">PCS in Store</span>
                      </td>

                      {/* Qty Taken for Inspection */}
                      <td className="py-3.5 px-3 text-right">
                        <input
                          type="number"
                          min="0"
                          max={rec.goodQty}
                          value={draft.qtyTaken === 0 ? '' : draft.qtyTaken}
                          placeholder="0"
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : Math.max(0, Math.min(rec.goodQty, parseInt(e.target.value) || 0));
                            handleUpdateDraft(rec.id, { qtyTaken: val });
                          }}
                          className="w-20 py-1.5 px-2 text-right font-mono font-bold text-indigo-900 border border-indigo-200 rounded-lg bg-indigo-50/40 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs"
                        />
                      </td>

                      {/* Qty Rejected */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <input
                            type="number"
                            min="0"
                            max={draft.qtyTaken}
                            value={totalRejected === 0 ? '' : totalRejected}
                            placeholder="0"
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : Math.max(0, Math.min(draft.qtyTaken, parseInt(e.target.value) || 0));
                              // If user edits total rejection directly, allocate to generic or first reason
                              if (val === 0) {
                                handleUpdateDraft(rec.id, { defectAllocations: [] });
                              } else {
                                handleUpdateDraft(rec.id, {
                                  defectAllocations: [
                                    {
                                      reason: draft.defectAllocations[0]?.reason || 'Dimensional Drift / Visual Defect',
                                      qty: val,
                                    },
                                  ],
                                });
                              }
                            }}
                            className={`w-18 py-1.5 px-2 text-right font-mono font-bold border rounded-lg focus:ring-2 focus:outline-none text-xs ${
                              totalRejected > 0
                                ? 'bg-rose-50 text-rose-800 border-rose-300 ring-1 ring-rose-300'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                          />
                        </div>
                      </td>

                      {/* Defect Reasons Breakdown */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5">
                          {draft.defectAllocations.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {draft.defectAllocations.map((d, dIdx) => (
                                <span
                                  key={dIdx}
                                  className="inline-flex items-center gap-1 bg-rose-100 text-rose-900 px-2 py-0.5 rounded text-[10px] font-bold border border-rose-200"
                                >
                                  {d.reason}: <strong className="font-mono">{d.qty}</strong>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">No defects assigned</span>
                          )}

                          <button
                            type="button"
                            onClick={() => setActiveDefectModalRecordId(rec.id)}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 hover:text-indigo-900 hover:underline cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            {draft.defectAllocations.length > 0 ? 'Edit Multi-Defect Breakdown' : 'Assign Defect Breakdown'}
                          </button>
                        </div>
                      </td>

                      {/* Accepted Qty -> Handover to FG */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="inline-block bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1 text-right">
                          <span className="font-mono font-black text-emerald-800 text-sm block">
                            {acceptedQty.toLocaleString()}
                          </span>
                          <span className="text-[9px] text-emerald-600 font-bold uppercase block">&rarr; FG Store</span>
                        </div>
                      </td>

                      {/* Action Button */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleCommitSingleInspection(rec)}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Release to FG
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: MULTI-REASON DEFECT ALLOCATION (Task 4) */}
      {/* ========================================================================= */}
      {activeDefectRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-bold text-rose-700 uppercase bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  Defect Allocation Matrix
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                  Multi-Reason Rejection &bull; {activeDefectRecord.itemCode}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveDefectModalRecordId(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Context Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs grid grid-cols-3 gap-2">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Lot Number</span>
                <span className="font-mono font-bold text-slate-800">{activeDefectRecord.batchLotNo}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Qty Inspected</span>
                <span className="font-mono font-bold text-indigo-700">{getDraft(activeDefectRecord).qtyTaken} PCS</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Rejection Destination</span>
                <span className="font-mono font-bold text-rose-800">{rejectionStore}</span>
              </div>
            </div>

            {/* Multi-reason selection list */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Specify Defective Quantity per Reason:
              </h4>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {STANDARD_DEFECT_REASONS.map((reason) => {
                  const draft = getDraft(activeDefectRecord);
                  const existingAllocation = draft.defectAllocations.find((d) => d.reason === reason);
                  const qty = existingAllocation ? existingAllocation.qty : 0;

                  return (
                    <div
                      key={reason}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-colors ${
                        qty > 0
                          ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-300'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="font-semibold text-slate-800">{reason}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max={draft.qtyTaken}
                          value={qty === 0 ? '' : qty}
                          placeholder="0"
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value) || 0);
                            const updatedList = draft.defectAllocations.filter((d) => d.reason !== reason);
                            if (val > 0) {
                              updatedList.push({ reason, qty: val });
                            }
                            handleUpdateDraft(activeDefectRecord.id, { defectAllocations: updatedList });
                          }}
                          className="w-20 py-1 px-2 text-right font-mono font-bold border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                        />
                        <span className="text-[10px] font-bold text-slate-400">PCS</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Inspection Notes */}
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">Inspector Notes &amp; Disposition Remarks</label>
              <input
                type="text"
                value={getDraft(activeDefectRecord).customNotes}
                onChange={(e) => handleUpdateDraft(activeDefectRecord.id, { customNotes: e.target.value })}
                placeholder="e.g. Flash defect localized to Cavity 4 parting line. Purge scrap to REJ-STORE-01."
                className="w-full py-2 px-3 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            {/* Summary & Footer */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <div className="text-xs font-medium text-slate-700">
                Total Rejected:{' '}
                <strong className="text-rose-700 font-mono text-sm">
                  {getDraft(activeDefectRecord).defectAllocations.reduce((sum, d) => sum + (d.qty || 0), 0)} PCS
                </strong>{' '}
                &bull; Net Accepted:{' '}
                <strong className="text-emerald-700 font-mono text-sm">
                  {Math.max(
                    0,
                    getDraft(activeDefectRecord).qtyTaken -
                      getDraft(activeDefectRecord).defectAllocations.reduce((sum, d) => sum + (d.qty || 0), 0)
                  )}{' '}
                  PCS
                </strong>
              </div>

              <button
                type="button"
                onClick={() => setActiveDefectModalRecordId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xs cursor-pointer"
              >
                Done &amp; Save Breakdown
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
