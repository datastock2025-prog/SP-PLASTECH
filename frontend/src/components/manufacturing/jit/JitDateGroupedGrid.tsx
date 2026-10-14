import React, { useState } from 'react';
import {
  Calendar,
  Cpu,
  ChevronDown,
  ChevronRight,
  Send,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  Package,
  Boxes,
  Trash2,
  Copy,
  ExternalLink,
  ShieldCheck,
  User,
  Hash,
  ArrowRight,
  Sliders,
  Store,
} from 'lucide-react';
import { MachineMaster, ItemMaster, BomMaster, WorkOrder } from '../../../types';
import { MoldMaster } from '../../../data/manufacturingData';
import { PlannedMachineJob, StoreInventoryNode, ExplodedMaterialRequirement } from './jitTypes';
import {
  categorizeBomLine,
  parseStockNumber,
  getSyntheticRecipeForPart,
} from './jitCalculations';

interface Props {
  jobs: PlannedMachineJob[];
  machines: MachineMaster[];
  items: ItemMaster[];
  molds: MoldMaster[];
  boms: BomMaster[];
  stores: StoreInventoryNode[];
  workOrders: WorkOrder[];
  onUpdateJob: (job: PlannedMachineJob) => void;
  onDeleteJob: (jobId: string) => void;
  onDuplicateJob: (job: PlannedMachineJob) => void;
  onReleaseSingleJob: (job: PlannedMachineJob) => void;
  onReleaseDateJobs: (date: string) => void;
  onViewRecipe: (job: PlannedMachineJob) => void;
  onExportDateExcel: (date: string) => void;
  onExportDateCsv: (date: string) => void;
}

export const JitDateGroupedGrid: React.FC<Props> = ({
  jobs,
  machines,
  items,
  molds,
  boms,
  stores,
  workOrders,
  onUpdateJob,
  onDeleteJob,
  onDuplicateJob,
  onReleaseSingleJob,
  onReleaseDateJobs,
  onViewRecipe,
  onExportDateExcel,
  onExportDateCsv,
}) => {
  // Set of expanded dates
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  // Set of expanded machine job rows (to see workorder and item details)
  const [expandedJobIds, setExpandedJobIds] = useState<Record<string, boolean>>({});

  // Group jobs by planDate
  const groupedByDate = React.useMemo(() => {
    const map = new Map<string, PlannedMachineJob[]>();
    jobs.forEach((job) => {
      const d = job.planDate || 'Unassigned';
      if (!map.has(d)) {
        map.set(d, []);
      }
      map.get(d)!.push(job);
    });

    // Sort dates descending (e.g. tomorrow, today, earlier)
    const sortedEntries = Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
    return sortedEntries;
  }, [jobs]);

  // Default expand all dates on first render if empty
  React.useEffect(() => {
    if (Object.keys(expandedDates).length === 0 && groupedByDate.length > 0) {
      const initial: Record<string, boolean> = {};
      groupedByDate.forEach(([dateStr]) => {
        initial[dateStr] = true;
      });
      setExpandedDates(initial);
    }
  }, [groupedByDate]);

  const toggleDate = (dateStr: string) => {
    setExpandedDates((prev) => ({
      ...prev,
      [dateStr]: !prev[dateStr],
    }));
  };

  const toggleJobDetails = (jobId: string) => {
    setExpandedJobIds((prev) => ({
      ...prev,
      [jobId]: !prev[jobId],
    }));
  };

  // Helper: compute recipe breakdown for a specific item job
  const getItemRecipeBreakdown = (job: PlannedMachineJob) => {
    const item = items.find((i) => i.code === job.itemCode);
    const bom = boms.find((b) => b.parent === job.itemCode);
    const storeMap = new Map<string, StoreInventoryNode>(stores.map((s) => [s.code, s]));
    const itemMap = new Map<string, ItemMaster>(items.map((i) => [i.code, i]));

    const lines =
      bom && bom.lines && bom.lines.length > 0
        ? bom.lines
        : item
        ? getSyntheticRecipeForPart(item)
        : [];

    return lines.map((line) => {
      const matItem = itemMap.get(line.item);
      const catInfo = categorizeBomLine(line, matItem);
      const scrapFactor = 1 + (line.scrap || 0) / 100;
      const requiredQty = (line.qty || 0) * scrapFactor * job.calculatedPcs;
      const available = matItem ? parseStockNumber(matItem.avail || matItem.stock) : 0;
      const storeCode = matItem?.wh || catInfo.defaultStore;
      const storeObj = storeMap.get(storeCode);
      const storeLocation = storeObj ? `${storeObj.code} (${storeObj.name})` : storeCode;
      const isShortage = available < requiredQty;

      return {
        materialCode: line.item,
        materialName: line.name || matItem?.name || line.item,
        category: catInfo.cat,
        categoryLabel: catInfo.label,
        uom: line.uom || matItem?.baseUOM || 'KG',
        requiredQty,
        availableStock: available,
        storeLocation,
        isShortage,
      };
    });
  };

  if (jobs.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
        <Cpu className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">No Machine Jobs Scheduled</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
          Use the common configuration block above to select an injection machine, target item, shift hours, and click <strong>ADD</strong> to build your production schedule.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groupedByDate.map(([dateStr, dateJobs]) => {
        const isExpanded = expandedDates[dateStr] ?? true;

        // Group totals
        const dateTotalHours = dateJobs.reduce((acc, j) => acc + j.plannedHours, 0);
        const dateTotalPcs = dateJobs.reduce((acc, j) => acc + j.calculatedPcs, 0);
        const releasedCount = dateJobs.filter((j) => j.status === 'Released').length;
        const allReleased = releasedCount === dateJobs.length && dateJobs.length > 0;

        // Check if date has material shortages
        const hasAnyShortage = dateJobs.some((j) => {
          const breakdown = getItemRecipeBreakdown(j);
          return breakdown.some((m) => m.isShortage);
        });

        return (
          <div
            key={dateStr}
            className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden transition-all"
          >
            {/* Date Group Master Row */}
            <div
              className={`px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none transition-colors ${
                isExpanded ? 'bg-slate-900 text-white' : 'bg-slate-800 text-white hover:bg-slate-850'
              }`}
              onClick={() => toggleDate(dateStr)}
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="p-1 text-slate-300 hover:text-white transition-colors"
                  aria-label="Expand or collapse date"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-indigo-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <span className="font-extrabold text-sm tracking-tight text-white">
                    Production Date: {dateStr}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                    {dateJobs.length} {dateJobs.length === 1 ? 'Machine' : 'Machines'} Scheduled
                  </span>
                </div>
              </div>

              {/* Group Summary Metrics and Actions */}
              <div className="flex items-center gap-3 text-xs" onClick={(e) => e.stopPropagation()}>
                <div className="hidden sm:flex items-center gap-4 text-slate-300 mr-2">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Planned Load:</span>
                    <span className="font-bold font-mono text-white">{dateTotalHours.toFixed(1)} hrs</span>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] block">Forecast Output:</span>
                    <span className="font-extrabold font-mono text-emerald-400">
                      {dateTotalPcs.toLocaleString()} PCS
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] block">Store Feasibility:</span>
                    {hasAnyShortage ? (
                      <span className="font-bold text-rose-400 flex items-center gap-1 text-[11px]">
                        <AlertTriangle className="w-3.5 h-3.5" /> Shortage
                      </span>
                    ) : (
                      <span className="font-bold text-emerald-400 flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 100% Feasible
                      </span>
                    )}
                  </div>
                </div>

                {/* Export actions */}
                <button
                  type="button"
                  onClick={() => onExportDateExcel(dateStr)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700"
                  title="Export Excel for this date"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                </button>

                <button
                  type="button"
                  onClick={() => onExportDateCsv(dateStr)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700"
                  title="Export CSV for this date"
                >
                  <Download className="w-4 h-4 text-slate-300" />
                </button>

                {/* Release all for this date */}
                <button
                  type="button"
                  onClick={() => onReleaseDateJobs(dateStr)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                    allReleased
                      ? 'bg-emerald-600 text-white opacity-80 cursor-default'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                  title="Release all machine jobs on this date as Work Orders"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{allReleased ? 'Released to Floor' : 'Release All WOs'}</span>
                </button>
              </div>
            </div>

            {/* Machines Table Grid under this Date */}
            {isExpanded && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/90 text-slate-700 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-4 w-10 text-center">#</th>
                      <th className="py-2.5 px-4">Injection Machine</th>
                      <th className="py-2.5 px-4">Scheduled Item / Part</th>
                      <th className="py-2.5 px-4">Tooling & Cycle</th>
                      <th className="py-2.5 px-4">Shift & Runtime</th>
                      <th className="py-2.5 px-4 text-right">Target Output</th>
                      <th className="py-2.5 px-4 text-center">Store Feasibility</th>
                      <th className="py-2.5 px-4 text-center">Work Order Status</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80">
                    {dateJobs.map((job, idx) => {
                      const machine = machines.find((m) => m.id === job.machineId);
                      const item = items.find((i) => i.code === job.itemCode);
                      const isDetailsExpanded = expandedJobIds[job.id] ?? false;
                      const recipeBreakdown = getItemRecipeBreakdown(job);
                      const hasShortage = recipeBreakdown.some((m) => m.isShortage);
                      const isReleased = job.status === 'Released';

                      // Find linked work order if created
                      const linkedWO = workOrders.find(
                        (w) => w.machine === job.machineId && w.day === job.planDate && w.item === job.itemCode
                      );
                      const woNumber = linkedWO?.id || job.workOrderId || `WO-JIT-${job.planDate.replace(/-/g, '').slice(2)}-${idx + 1}`;

                      return (
                        <React.Fragment key={job.id}>
                          {/* Main Row */}
                          <tr
                            onClick={() => toggleJobDetails(job.id)}
                            className={`hover:bg-indigo-50/40 cursor-pointer transition-colors ${
                              isDetailsExpanded ? 'bg-indigo-50/50' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                            }`}
                          >
                            {/* Sequence number */}
                            <td className="py-3 px-4 text-center">
                              <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold inline-flex items-center justify-center text-[10px]">
                                {idx + 1}
                              </span>
                            </td>

                            {/* Machine Info */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <Cpu className="w-4 h-4 text-indigo-600 shrink-0" />
                                <div>
                                  <div className="font-bold text-slate-900">{job.machineId}</div>
                                  <div className="text-[11px] text-slate-500">
                                    {machine?.tonnage || '250T'} • {machine?.line || 'Line 3'}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Target Item */}
                            <td className="py-3 px-4">
                              <div>
                                <div className="font-bold text-slate-900">{job.itemCode}</div>
                                <div className="text-[11px] text-slate-600 truncate max-w-xs">{job.itemName}</div>
                                <div className="text-[10px] text-slate-400">{item?.cat || 'Molded Component'}</div>
                              </div>
                            </td>

                            {/* Tooling */}
                            <td className="py-3 px-4">
                              <div>
                                <div className="font-semibold text-slate-800">{job.moldName}</div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                  <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-mono">
                                    {job.cavities} Cav
                                  </span>
                                  <span>{job.cycleTimeSec}s cycle</span>
                                </div>
                              </div>
                            </td>

                            {/* Shift & Runtime */}
                            <td className="py-3 px-4">
                              <div>
                                <div className="font-semibold text-slate-800">{job.shift}</div>
                                <div className="text-[11px] text-indigo-700 font-mono font-bold mt-0.5">
                                  {job.plannedHours.toFixed(1)} hrs{' '}
                                  <span className="text-slate-400 font-normal">
                                    ({Math.round((job.plannedHours / 24) * 100)}% load)
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Target Output */}
                            <td className="py-3 px-4 text-right">
                              <div className="font-black text-indigo-900 font-mono text-sm">
                                {job.calculatedPcs.toLocaleString()}{' '}
                                <span className="text-[10px] font-bold text-slate-500">PCS</span>
                              </div>
                              <div className="text-[10px] text-slate-400">Yield: {job.efficiencyPct}%</div>
                            </td>

                            {/* Store Feasibility */}
                            <td className="py-3 px-4 text-center">
                              {hasShortage ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                                  Shortage
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Feasible
                                </span>
                              )}
                            </td>

                            {/* Work Order Status */}
                            <td className="py-3 px-4 text-center">
                              {isReleased ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-md">
                                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                                  WO Released
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md">
                                  Planned (Draft)
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => toggleJobDetails(job.id)}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border transition-all ${
                                    isDetailsExpanded
                                      ? 'bg-indigo-600 text-white border-indigo-600'
                                      : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
                                  }`}
                                  title="View Work Order details & materials required to finish this item"
                                >
                                  <span>WO & Materials</span>
                                  {isDetailsExpanded ? (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => onDuplicateJob(job)}
                                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                                  title="Duplicate this machine job"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => onDeleteJob(job.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                  title="Remove machine from schedule"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Detail Row: Work Order & Materials Needed to Finish this Item */}
                          {isDetailsExpanded && (
                            <tr className="bg-slate-50/80 border-y-2 border-indigo-100">
                              <td colSpan={9} className="p-4 sm:p-5">
                                <div className="space-y-4">
                                  {/* Header banner of the item's Work Order details */}
                                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                                        <Hash className="w-5 h-5" />
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            Work Order Reference:
                                          </span>
                                          <span className="font-extrabold text-sm text-indigo-900 font-mono">
                                            {woNumber}
                                          </span>
                                          <span
                                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                              isReleased
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : 'bg-amber-100 text-amber-800'
                                            }`}
                                          >
                                            {isReleased ? 'DISPATCHED TO SHOPFLOOR' : 'PLANNED READY'}
                                          </span>
                                        </div>
                                        <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3 mt-1">
                                          <span>Machine: <strong className="text-slate-800">{job.machineId}</strong></span>
                                          <span>•</span>
                                          <span>Assigned Operator: <strong className="text-slate-800">{job.operator || 'Assigned Lead'}</strong></span>
                                          <span>•</span>
                                          <span>Due Date: <strong className="text-slate-800">{job.planDate}</strong></span>
                                          <span>•</span>
                                          <span>Priority: <strong className="text-indigo-700">{job.priority}</strong></span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Action Buttons for this single Work Order */}
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => onViewRecipe(job)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-colors"
                                      >
                                        <FileSpreadsheet className="w-3.5 h-3.5" />
                                        <span>Full Recipe Specs</span>
                                      </button>

                                      {!isReleased && (
                                        <button
                                          type="button"
                                          onClick={() => onReleaseSingleJob(job)}
                                          className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                                        >
                                          <Send className="w-3.5 h-3.5" />
                                          <span>Release This Work Order</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* BOM Recipe Materials required to finish this particular item */}
                                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                                    <div className="bg-slate-100/70 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800">
                                      <div className="flex items-center gap-2">
                                        <Boxes className="w-4 h-4 text-indigo-600" />
                                        <span>
                                          Bill of Materials (BOM) Requirements to Finish {job.calculatedPcs.toLocaleString()} PCS of {job.itemCode}
                                        </span>
                                      </div>
                                      <span className="text-[11px] font-normal text-slate-500">
                                        Exploded across connected factory stores & warehouses
                                      </span>
                                    </div>

                                    <table className="w-full text-left text-xs">
                                      <thead>
                                        <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px] uppercase font-bold">
                                          <th className="py-2 px-4">Material Code & Description</th>
                                          <th className="py-2 px-4">Category</th>
                                          <th className="py-2 px-4">Required Quantity</th>
                                          <th className="py-2 px-4">Assigned Store / WH</th>
                                          <th className="py-2 px-4">Available Stock</th>
                                          <th className="py-2 px-4 text-center">Store Feasibility</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {recipeBreakdown.map((mat) => {
                                          return (
                                            <tr key={mat.materialCode} className="hover:bg-slate-50/60">
                                              <td className="py-2.5 px-4">
                                                <div className="font-bold text-slate-800">{mat.materialCode}</div>
                                                <div className="text-[11px] text-slate-500">{mat.materialName}</div>
                                              </td>
                                              <td className="py-2.5 px-4">
                                                <span
                                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                    mat.category === 'RM'
                                                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                      : mat.category === 'MB'
                                                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                                      : mat.category === 'INSERT'
                                                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                  }`}
                                                >
                                                  {mat.categoryLabel}
                                                </span>
                                              </td>
                                              <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                                                {mat.requiredQty.toFixed(3)} {mat.uom}
                                              </td>
                                              <td className="py-2.5 px-4 text-slate-600 flex items-center gap-1.5 pt-3">
                                                <Store className="w-3.5 h-3.5 text-slate-400" />
                                                <span className="font-medium text-slate-800">{mat.storeLocation}</span>
                                              </td>
                                              <td className="py-2.5 px-4 font-mono font-semibold text-slate-700">
                                                {mat.availableStock.toLocaleString()} {mat.uom}
                                              </td>
                                              <td className="py-2.5 px-4 text-center">
                                                {mat.isShortage ? (
                                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                                                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                                                    Deficit (Shortage)
                                                  </span>
                                                ) : (
                                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                    Sufficient Stock
                                                  </span>
                                                )}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
