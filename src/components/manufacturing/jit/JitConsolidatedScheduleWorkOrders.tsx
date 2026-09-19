import React, { useState, useMemo } from 'react';
import {
  Layers,
  Calendar,
  CalendarDays,
  Cpu,
  Clock,
  Boxes,
  Package,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  Send,
  Eye,
  ExternalLink,
  Copy,
  Check,
  Building2,
  User,
  Sliders,
  Sparkles,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';
import { MachineMaster, ItemMaster, BomMaster, WorkOrder } from '../../../types';
import { MoldMaster } from '../../../data/manufacturingData';
import { PlannedMachineJob, StoreInventoryNode } from './jitTypes';
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
  activeScheduleDate: string;
  onSelectScheduleDate: (date: string) => void;
  onNavigateToScheduleGrid: (date: string) => void;
  onReleaseSingleJob: (job: PlannedMachineJob, onlyWo?: boolean) => void;
  onReleaseSchedule: (date: string, scheduleNumber: string, onlyWo?: boolean) => void;
  onViewRecipe: (job: PlannedMachineJob) => void;
  onExportExcel?: (date: string, scheduleNumber: string) => void;
  onExportCsv?: (date: string, scheduleNumber: string) => void;
}

export interface ConsolidatedScheduleSummary {
  scheduleNumber: string;
  planDate: string;
  displayDate: string;
  relativeLabel: string;
  jobs: PlannedMachineJob[];
  machines: MachineMaster[];
  items: ItemMaster[];
  totalPlannedHours: number;
  totalTargetPcs: number;
  totalMachinesCount: number;
  releasedCount: number;
  isAllReleased: boolean;
  hasShortage: boolean;
  shortageCount: number;
  shifts: string[];
  plantNames: string[];
}

export const JitConsolidatedScheduleWorkOrders: React.FC<Props> = ({
  jobs,
  machines,
  items,
  molds,
  boms,
  stores,
  workOrders,
  activeScheduleDate,
  onSelectScheduleDate,
  onNavigateToScheduleGrid,
  onReleaseSingleJob,
  onReleaseSchedule,
  onViewRecipe,
  onExportExcel,
  onExportCsv,
}) => {
  const [isOnlyWoChecked, setIsOnlyWoChecked] = useState<boolean>(false);
  const [selectedScheduleNumber, setSelectedScheduleNumber] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'RELEASED' | 'SHORTAGE' | 'FEASIBLE'>('ALL');
  const [viewMode, setViewMode] = useState<'grouped_schedules' | 'flat_work_orders'>('grouped_schedules');
  const [copiedSchedule, setCopiedSchedule] = useState<string | null>(null);
  const [expandedWorkOrderIds, setExpandedWorkOrderIds] = useState<Record<string, boolean>>({});

  // Lookup maps for fast access
  const machineMap = useMemo(() => new Map<string, MachineMaster>(machines.map((m) => [m.id, m])), [machines]);
  const itemMap = useMemo(() => new Map<string, ItemMaster>(items.map((i) => [i.code, i])), [items]);
  const moldMap = useMemo(() => new Map<string, MoldMaster>(molds.map((m) => [m.id, m])), [molds]);
  const storeMap = useMemo(() => new Map<string, StoreInventoryNode>(stores.map((s) => [s.code, s])), [stores]);

  // Helper: compute recipe breakdown and check shortages for a single job
  const getJobRecipeSpecs = (job: PlannedMachineJob) => {
    const item = itemMap.get(job.itemCode);
    const bom = boms.find((b) => b.parent === job.itemCode);

    const lines =
      bom && bom.lines && bom.lines.length > 0
        ? bom.lines
        : item
        ? getSyntheticRecipeForPart(item)
        : [];

    let totalResinKg = 0;
    let totalMasterbatchKg = 0;
    let totalPackagingBoxes = 0;
    let isShortage = false;

    const materials = lines.map((line) => {
      const matItem = itemMap.get(line.item);
      const catInfo = categorizeBomLine(line, matItem);
      const scrapFactor = 1 + (line.scrap || 0) / 100;
      const requiredQty = (line.qty || 0) * scrapFactor * job.calculatedPcs;
      const available = matItem ? parseStockNumber(matItem.avail || matItem.stock) : 0;
      const storeCode = matItem?.wh || catInfo.defaultStore;
      const storeObj = storeMap.get(storeCode);
      const storeLocation = storeObj ? `${storeObj.code} (${storeObj.name})` : storeCode;
      const hasShortage = available < requiredQty;

      if (hasShortage) isShortage = true;

      if (catInfo.cat === 'RM') totalResinKg += requiredQty;
      else if (catInfo.cat === 'MB') totalMasterbatchKg += requiredQty;
      else if (catInfo.cat === 'PCK') totalPackagingBoxes += requiredQty;

      return {
        materialCode: line.item,
        materialName: line.name || matItem?.name || line.item,
        category: catInfo.cat,
        categoryLabel: catInfo.label,
        uom: line.uom || matItem?.baseUOM || 'KG',
        requiredQty,
        availableStock: available,
        storeLocation,
        hasShortage,
      };
    });

    return {
      materials,
      totalResinKg,
      totalMasterbatchKg,
      totalPackagingBoxes,
      isShortage,
    };
  };

  // Group all jobs by planDate / Schedule Number
  const consolidatedSchedules: ConsolidatedScheduleSummary[] = useMemo(() => {
    // Map of date -> PlannedMachineJob[]
    const dateGroups = new Map<string, PlannedMachineJob[]>();

    jobs.forEach((job) => {
      const dateKey = job.planDate || activeScheduleDate || '2026-09-16';
      if (!dateGroups.has(dateKey)) {
        dateGroups.set(dateKey, []);
      }
      dateGroups.get(dateKey)!.push(job);
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Build schedule objects
    const list: ConsolidatedScheduleSummary[] = [];

    dateGroups.forEach((dateJobs, planDate) => {
      const cleanDate = planDate.replace(/-/g, '');
      const scheduleNumber = `SCH-${cleanDate}-01`;

      const machineIds = Array.from(new Set(dateJobs.map((j) => j.machineId)));
      const scheduledMachines = machineIds
        .map((id) => machineMap.get(id))
        .filter((m): m is MachineMaster => Boolean(m));

      const itemCodes = Array.from(new Set(dateJobs.map((j) => j.itemCode)));
      const scheduledItems = itemCodes
        .map((code) => itemMap.get(code))
        .filter((i): i is ItemMaster => Boolean(i));

      const totalPlannedHours = dateJobs.reduce((acc, j) => acc + (j.plannedHours || 0), 0);
      const totalTargetPcs = dateJobs.reduce((acc, j) => acc + (j.calculatedPcs || 0), 0);
      const releasedCount = dateJobs.filter((j) => j.status === 'Released').length;
      const isAllReleased = releasedCount === dateJobs.length && dateJobs.length > 0;

      // Check material shortages
      let shortageCount = 0;
      dateJobs.forEach((j) => {
        const specs = getJobRecipeSpecs(j);
        if (specs.isShortage) shortageCount++;
      });
      const hasShortage = shortageCount > 0;

      const shifts = Array.from(new Set(dateJobs.map((j) => j.shift).filter(Boolean)));
      const plantNames = Array.from(
        new Set(dateJobs.map((j) => j.plantName || j.plant || 'Plant 01: Injection Molding Unit'))
      );

      // Relative date label
      let relativeLabel = '';
      if (planDate === todayStr) relativeLabel = 'Today';
      else if (planDate === tomorrowStr) relativeLabel = 'Tomorrow';
      else {
        const d = new Date(planDate);
        relativeLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      }

      list.push({
        scheduleNumber,
        planDate,
        displayDate: planDate,
        relativeLabel,
        jobs: dateJobs,
        machines: scheduledMachines,
        items: scheduledItems,
        totalPlannedHours,
        totalTargetPcs,
        totalMachinesCount: machineIds.length,
        releasedCount,
        isAllReleased,
        hasShortage,
        shortageCount,
        shifts,
        plantNames,
      });
    });

    // Sort by planDate ascending
    return list.sort((a, b) => a.planDate.localeCompare(b.planDate));
  }, [jobs, activeScheduleDate, machineMap, itemMap]);

  // Filtered schedules for search & status
  const filteredSchedules = useMemo(() => {
    return consolidatedSchedules.filter((sch) => {
      // Status filter
      if (statusFilter === 'DRAFT' && sch.isAllReleased) return false;
      if (statusFilter === 'RELEASED' && !sch.isAllReleased) return false;
      if (statusFilter === 'SHORTAGE' && !sch.hasShortage) return false;
      if (statusFilter === 'FEASIBLE' && sch.hasShortage) return false;

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();

      const matchSch = sch.scheduleNumber.toLowerCase().includes(q);
      const matchDate = sch.planDate.toLowerCase().includes(q) || sch.relativeLabel.toLowerCase().includes(q);
      const matchMachine = sch.machines.some(
        (m) => m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q)
      );
      const matchItem = sch.items.some(
        (i) => i.code.toLowerCase().includes(q) || i.name.toLowerCase().includes(q)
      );
      const matchPlant = sch.plantNames.some((p) => p.toLowerCase().includes(q));

      return matchSch || matchDate || matchMachine || matchItem || matchPlant;
    });
  }, [consolidatedSchedules, statusFilter, searchQuery]);

  // Active selected schedule for drill-down view
  const currentSchedule = useMemo(() => {
    if (!selectedScheduleNumber) return null;
    return consolidatedSchedules.find((s) => s.scheduleNumber === selectedScheduleNumber) || null;
  }, [selectedScheduleNumber, consolidatedSchedules]);

  // Copy schedule number helper
  const handleCopySchedule = (num: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(num);
      setCopiedSchedule(num);
      setTimeout(() => setCopiedSchedule(null), 2000);
    }
  };

  // Toggle work order accordion row
  const toggleWorkOrderExpand = (jobId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedWorkOrderIds((prev) => ({
      ...prev,
      [jobId]: !prev[jobId],
    }));
  };

  // Export CSV of the consolidated schedules
  const handleDownloadSchedulesCsv = () => {
    const headers = [
      'Schedule Number',
      'Production Date',
      'Plant',
      'Total Work Orders',
      'Scheduled Machines',
      'Scheduled Items',
      'Total Runtime (Hours)',
      'Total Forecast Output (PCS)',
      'Store Feasibility',
      'Status',
    ];

    const rows = filteredSchedules.map((s) => [
      s.scheduleNumber,
      s.planDate,
      `"${s.plantNames.join(', ')}"`,
      s.jobs.length,
      `"${s.machines.map((m) => m.id).join(', ')}"`,
      `"${s.items.map((i) => i.code).join(', ')}"`,
      s.totalPlannedHours.toFixed(1),
      s.totalTargetPcs.toLocaleString(),
      s.hasShortage ? 'Material Shortage' : 'Feasible',
      s.isAllReleased ? 'Released' : 'Planning (Draft)',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `consolidated_schedules_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export CSV of Work Orders inside a specific schedule
  const handleDownloadWorkOrdersCsv = (sch: ConsolidatedScheduleSummary) => {
    const headers = [
      'Work Order #',
      'Schedule Number',
      'Production Date',
      'Machine ID',
      'Machine Name',
      'Item Code',
      'Item Description',
      'Mold Tool',
      'Cavities',
      'Cycle Time (s)',
      'Shift',
      'Planned Hours',
      'Target Output (PCS)',
      'Resin Required (KG)',
      'Masterbatch Required (KG)',
      'Feasibility',
      'Operator',
      'Priority',
      'Status',
    ];

    const rows = sch.jobs.map((job, idx) => {
      const woNum = job.workOrderId || `WO-${sch.planDate.replace(/-/g, '')}-0${idx + 1}`;
      const machine = machineMap.get(job.machineId);
      const specs = getJobRecipeSpecs(job);

      return [
        woNum,
        sch.scheduleNumber,
        sch.planDate,
        job.machineId,
        `"${machine?.name || job.machineId}"`,
        job.itemCode,
        `"${job.itemName}"`,
        `"${job.moldName}"`,
        job.cavities,
        job.cycleTimeSec,
        `"${job.shift}"`,
        job.plannedHours,
        job.calculatedPcs,
        specs.totalResinKg.toFixed(1),
        specs.totalMasterbatchKg.toFixed(2),
        specs.isShortage ? 'Shortage' : 'Feasible',
        job.operator || 'Assigned',
        job.priority,
        job.status,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `work_orders_${sch.scheduleNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate Overall Aggregate KPIs
  const totalSchedulesCount = consolidatedSchedules.length;
  const totalWorkOrdersCount = consolidatedSchedules.reduce((acc, s) => acc + s.jobs.length, 0);
  const totalGlobalHours = consolidatedSchedules.reduce((acc, s) => acc + s.totalPlannedHours, 0);
  const totalGlobalPcs = consolidatedSchedules.reduce((acc, s) => acc + s.totalTargetPcs, 0);

  // =========================================================================
  // VIEW 2: DETAIL WORK ORDER LIST FOR A SPECIFIC SCHEDULE NUMBER & DATE
  // =========================================================================
  if (currentSchedule) {
    return (
      <div className="space-y-4">
        {/* Navigation & Header Banner for the Single Clicked Schedule */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setSelectedScheduleNumber(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to All Schedules</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onSelectScheduleDate(currentSchedule.planDate);
                  onNavigateToScheduleGrid(currentSchedule.planDate);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                title="Switch to active date and open in Machine Schedule Grid"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Open in Machine Schedule Grid</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownloadWorkOrdersCsv(currentSchedule)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                title="Export Work Orders for this schedule to CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Export WO CSV</span>
              </button>

              {/* Task 1: Checkbox for Only WO */}
              <label
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer border border-slate-200 select-none"
                title="When checked, releases work orders ONLY to the Work Order management screen (omits from Daily Production entry until floor dispatch)"
              >
                <input
                  type="checkbox"
                  checked={isOnlyWoChecked}
                  onChange={(e) => setIsOnlyWoChecked(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer w-3.5 h-3.5"
                />
                <span className="text-[11px] font-bold">Only WO</span>
              </label>

              <button
                type="button"
                disabled={currentSchedule.isAllReleased}
                onClick={() => onReleaseSchedule(currentSchedule.planDate, currentSchedule.scheduleNumber, isOnlyWoChecked)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  currentSchedule.isAllReleased
                    ? 'bg-emerald-600 text-white opacity-90 cursor-default'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-xs'
                }`}
                title={`Release work orders (${isOnlyWoChecked ? 'Work Orders Only' : 'Both Work Orders & Daily Production'})`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>{currentSchedule.isAllReleased ? 'Released to Floor' : isOnlyWoChecked ? 'Release to WO Only' : 'Release All WOs'}</span>
              </button>
            </div>
          </div>

          {/* Schedule Detail Badge and Metrics Bar */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white rounded-xl p-4 border border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-400/30">
                    SCHEDULE DRILLDOWN
                  </span>
                  <span className="text-slate-400 text-xs">•</span>
                  <span className="text-slate-300 text-xs font-medium">
                    Production Date: <strong className="text-white">{currentSchedule.planDate}</strong> ({currentSchedule.relativeLabel})
                  </span>
                  <span className="text-slate-400 text-xs">•</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${
                      currentSchedule.isAllReleased
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                    }`}
                  >
                    {currentSchedule.isAllReleased ? 'Work Orders Released' : 'Planning (Draft)'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <h2 className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-400" />
                    <span>{currentSchedule.scheduleNumber}</span>
                  </h2>
                  <button
                    type="button"
                    onClick={(e) => handleCopySchedule(currentSchedule.scheduleNumber, e)}
                    className="p-1.5 hover:bg-slate-700/60 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Copy schedule number"
                  >
                    {copiedSchedule === currentSchedule.scheduleNumber ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Quick Metrics */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs">
                <div className="bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700/60">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Scheduled Work Orders</div>
                  <div className="text-base font-extrabold font-mono text-white">
                    {currentSchedule.jobs.length} <span className="text-xs font-normal text-slate-400">WOs ({currentSchedule.totalMachinesCount} IMMs)</span>
                  </div>
                </div>

                <div className="bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700/60">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Runtime</div>
                  <div className="text-base font-extrabold font-mono text-indigo-300">
                    {currentSchedule.totalPlannedHours.toFixed(1)} <span className="text-xs font-normal text-slate-400">hrs</span>
                  </div>
                </div>

                <div className="bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700/60">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Forecast Output</div>
                  <div className="text-base font-extrabold font-mono text-emerald-400">
                    {currentSchedule.totalTargetPcs.toLocaleString()} <span className="text-xs font-normal text-slate-400">PCS</span>
                  </div>
                </div>

                <div className="bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700/60">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Store Feasibility</div>
                  <div className="text-sm font-bold flex items-center gap-1.5 mt-0.5">
                    {currentSchedule.hasShortage ? (
                      <span className="text-red-400 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                        <span>Shortage ({currentSchedule.shortageCount} items)</span>
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>All Feasible</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* WORK ORDER LISTING TABLE FOR THIS SPECIFIC SCHEDULE */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                <span>Work Orders Generated Under {currentSchedule.scheduleNumber}</span>
              </span>
              <span className="bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full text-[11px]">
                {currentSchedule.jobs.length} Work Orders
              </span>
            </div>

            <div className="text-[11px] text-slate-500">
              Showing detailed machine tooling, cycle, shift runtime, batch recipe dosage & store availability
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3.5 w-12 text-center">#</th>
                  <th className="py-3 px-4">Work Order #</th>
                  <th className="py-3 px-4">Injection Machine</th>
                  <th className="py-3 px-4">Scheduled Item / Part</th>
                  <th className="py-3 px-4">Tooling & Cycle</th>
                  <th className="py-3 px-4">Shift & Runtime</th>
                  <th className="py-3 px-4 text-right">Target Output</th>
                  <th className="py-3 px-4">Store Feasibility</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentSchedule.jobs.map((job, index) => {
                  const machine = machineMap.get(job.machineId);
                  const item = itemMap.get(job.itemCode);
                  const mold = moldMap.get(job.moldId);
                  const specs = getJobRecipeSpecs(job);
                  const isExpanded = Boolean(expandedWorkOrderIds[job.id]);
                  const woNumber = job.workOrderId || `WO-${currentSchedule.planDate.replace(/-/g, '')}-0${index + 1}`;

                  return (
                    <React.Fragment key={job.id}>
                      <tr className="hover:bg-slate-50/90 transition-colors">
                        {/* Row # */}
                        <td className="py-3 px-3.5 text-center font-mono text-slate-400 font-semibold">
                          {index + 1}
                        </td>

                        {/* Work Order # */}
                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-slate-900 text-xs">
                                {woNumber}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                  job.priority === 'High' || job.priority === 'Urgent'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {job.priority}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Schedule: <span className="font-mono text-slate-600">{currentSchedule.scheduleNumber}</span>
                            </div>
                          </div>
                        </td>

                        {/* Injection Machine */}
                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <Cpu className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <span>{job.machineId}</span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {machine?.tonnage ? `${machine.tonnage}T • ` : ''}
                              {machine?.line || 'Line 1'}
                            </div>
                          </div>
                        </td>

                        {/* Scheduled Item / Part */}
                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            <div className="font-mono font-bold text-indigo-900">{job.itemCode}</div>
                            <div className="font-medium text-slate-800 text-[11px] max-w-[200px] truncate" title={job.itemName}>
                              {job.itemName}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {item?.category || 'Plastic Components'}
                            </div>
                          </div>
                        </td>

                        {/* Tooling & Cycle */}
                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            <div className="font-medium text-slate-800 max-w-[190px] truncate" title={job.moldName}>
                              {job.moldName}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2">
                              <span><strong>{job.cavities}</strong> Cav</span>
                              <span>•</span>
                              <span><strong>{job.cycleTimeSec}s</strong> cycle</span>
                            </div>
                          </div>
                        </td>

                        {/* Shift & Runtime */}
                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            <div className="font-semibold text-slate-800">{job.shift}</div>
                            <div className="text-[11px] font-mono text-indigo-700 font-bold">
                              {job.plannedHours.toFixed(1)} hrs
                            </div>
                          </div>
                        </td>

                        {/* Target Output */}
                        <td className="py-3 px-4 text-right">
                          <div className="space-y-0.5">
                            <div className="font-extrabold font-mono text-emerald-700 text-sm">
                              {job.calculatedPcs.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">PCS</span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Yield: {job.efficiencyPct || 95}%
                            </div>
                          </div>
                        </td>

                        {/* Store Feasibility */}
                        <td className="py-3 px-4">
                          {specs.isShortage ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.8 rounded-md text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                              <span>Shortage</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.8 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Feasible</span>
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.8 rounded-md text-[11px] font-bold ${
                              job.status === 'Released'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {job.status === 'Released' ? 'Released' : 'Planned (Draft)'}
                          </span>
                        </td>

                        {/* Row Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => onViewRecipe(job)}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md font-bold text-[11px] transition-colors cursor-pointer"
                              title="Inspect recipe, polymer resin and masterbatch dosage"
                            >
                              Recipe & Specs
                            </button>

                            {job.status !== 'Released' && (
                              <button
                                type="button"
                                onClick={() => onReleaseSingleJob(job)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                                title="Release single work order to shopfloor"
                              >
                                <Send className="w-3 h-3" />
                                <span>Release WO</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={(e) => toggleWorkOrderExpand(job.id, e)}
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                              title="Toggle expanded details"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Recipe & BOM Requirements Row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/90 border-b border-slate-200">
                          <td colSpan={10} className="p-4">
                            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-3">
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                                <div className="font-bold text-slate-800 text-xs flex items-center gap-2">
                                  <Boxes className="w-4 h-4 text-indigo-600" />
                                  <span>Material Explosion & Store Feasibility for {woNumber}</span>
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  Operator: <strong>{job.operator || 'Assigned'}</strong> • Plant: <strong>{job.plantName || 'Plant 01'}</strong>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Polymer Resin Requirement</div>
                                  <div className="text-sm font-mono font-bold text-slate-800 mt-0.5">
                                    {specs.totalResinKg.toFixed(1)} KG
                                  </div>
                                </div>

                                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Masterbatch (Colorant)</div>
                                  <div className="text-sm font-mono font-bold text-slate-800 mt-0.5">
                                    {specs.totalMasterbatchKg.toFixed(2)} KG
                                  </div>
                                </div>

                                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Packaging Corrugated Boxes</div>
                                  <div className="text-sm font-mono font-bold text-slate-800 mt-0.5">
                                    {Math.round(specs.totalPackagingBoxes)} Units
                                  </div>
                                </div>
                              </div>

                              {/* Material list table */}
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-[11px]">
                                  <thead className="bg-slate-100 text-slate-600 font-bold">
                                    <tr>
                                      <th className="py-1.5 px-3">Material Code</th>
                                      <th className="py-1.5 px-3">Category</th>
                                      <th className="py-1.5 px-3 text-right">Required Qty</th>
                                      <th className="py-1.5 px-3 text-right">Available Store Stock</th>
                                      <th className="py-1.5 px-3">Store Location</th>
                                      <th className="py-1.5 px-3">Availability Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {specs.materials.map((m, mIdx) => (
                                      <tr key={mIdx}>
                                        <td className="py-1.5 px-3 font-mono font-bold text-slate-900">
                                          {m.materialCode} <span className="font-normal text-slate-500">({m.materialName})</span>
                                        </td>
                                        <td className="py-1.5 px-3 text-slate-600">{m.categoryLabel}</td>
                                        <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900">
                                          {m.requiredQty.toFixed(1)} {m.uom}
                                        </td>
                                        <td className="py-1.5 px-3 text-right font-mono text-slate-700">
                                          {m.availableStock.toLocaleString()} {m.uom}
                                        </td>
                                        <td className="py-1.5 px-3 text-slate-600">{m.storeLocation}</td>
                                        <td className="py-1.5 px-3">
                                          {m.hasShortage ? (
                                            <span className="text-red-700 font-bold bg-red-50 px-1.5 py-0.5 rounded text-[10px]">
                                              Shortage (-{(m.requiredQty - m.availableStock).toFixed(1)})
                                            </span>
                                          ) : (
                                            <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                                              Sufficient In Stock
                                            </span>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
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
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: MASTER CONSOLIDATED SCHEDULE DIRECTORY GRID
  // =========================================================================
  return (
    <div className="space-y-4">
      {/* Top Horizon KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 font-semibold text-[11px] mb-1">
            <span>Total Production Schedules</span>
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="text-lg font-black font-mono text-slate-900">
            {totalSchedulesCount} <span className="text-xs font-normal text-slate-500">Dates</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 font-semibold text-[11px] mb-1">
            <span>Total Scheduled WOs</span>
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="text-lg font-black font-mono text-indigo-700">
            {totalWorkOrdersCount} <span className="text-xs font-normal text-slate-500">Work Orders</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 font-semibold text-[11px] mb-1">
            <span>Total Machine Hours</span>
            <Clock className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-lg font-black font-mono text-slate-900">
            {totalGlobalHours.toFixed(1)} <span className="text-xs font-normal text-slate-500">hrs</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 font-semibold text-[11px] mb-1">
            <span>Total Forecast Output</span>
            <Boxes className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-lg font-black font-mono text-emerald-700">
            {totalGlobalPcs.toLocaleString()} <span className="text-xs font-normal text-slate-500">PCS</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search Input */}
          <div className="relative min-w-[220px] max-w-sm flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search schedule #, date, item, machine..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {(['ALL', 'DRAFT', 'RELEASED', 'SHORTAGE', 'FEASIBLE'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'ALL'
                  ? 'All Schedules'
                  : st === 'DRAFT'
                  ? 'Draft'
                  : st === 'RELEASED'
                  ? 'Released'
                  : st === 'SHORTAGE'
                  ? 'Shortage'
                  : 'Feasible'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadSchedulesCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
            title="Download consolidated schedules as CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Consolidated Schedule Grid Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Consolidated Schedule & Work Order Directory</span>
            </span>
            <span className="bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full text-[11px]">
              {filteredSchedules.length} Schedules
            </span>
          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            💡 Click any schedule row or schedule number to drill down into its associated Work Orders
          </div>
        </div>

        {filteredSchedules.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Schedules Match Filter</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search query or status filter to see other production schedules.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3.5 w-12 text-center">#</th>
                  <th className="py-3 px-4">Schedule #</th>
                  <th className="py-3 px-4">Production Date</th>
                  <th className="py-3 px-4">Plant Facility</th>
                  <th className="py-3 px-4">Scheduled WOs / IMMs</th>
                  <th className="py-3 px-4">Total Runtime</th>
                  <th className="py-3 px-4 text-right">Forecast Output</th>
                  <th className="py-3 px-4">Store Feasibility</th>
                  <th className="py-3 px-4">Schedule Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSchedules.map((sch, index) => {
                  const isCurrentActiveDate = sch.planDate === activeScheduleDate;

                  return (
                    <tr
                      key={sch.scheduleNumber}
                      onClick={() => setSelectedScheduleNumber(sch.scheduleNumber)}
                      className={`hover:bg-indigo-50/50 cursor-pointer transition-colors ${
                        isCurrentActiveDate ? 'bg-indigo-50/30' : ''
                      }`}
                    >
                      {/* # */}
                      <td className="py-3 px-3.5 text-center font-mono text-slate-400 font-semibold">
                        {index + 1}
                      </td>

                      {/* Schedule Number */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-indigo-950 text-xs hover:text-indigo-600 transition-colors">
                              {sch.scheduleNumber}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleCopySchedule(sch.scheduleNumber, e)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                              title="Copy schedule number"
                            >
                              {copiedSchedule === sch.scheduleNumber ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          {isCurrentActiveDate && (
                            <span className="inline-block text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded">
                              Active Planner Date
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Production Date */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <CalendarDays className="w-3.5 h-3.5 text-slate-500" />
                            <span>{sch.planDate}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            {sch.relativeLabel}
                          </div>
                        </div>
                      </td>

                      {/* Plant Facility */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-slate-700 max-w-[160px] truncate" title={sch.plantNames.join(', ')}>
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{sch.plantNames[0] || 'Plant 01'}</span>
                        </div>
                      </td>

                      {/* Work Orders / Machines count */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-mono text-[11px]">
                              {sch.jobs.length} WOs
                            </span>
                            <span className="text-slate-500 text-[11px]">({sch.totalMachinesCount} IMMs)</span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[140px]" title={sch.machines.map((m) => m.id).join(', ')}>
                            {sch.machines.map((m) => m.id).join(', ')}
                          </div>
                        </div>
                      </td>

                      {/* Runtime */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="font-mono font-bold text-slate-900">
                            {sch.totalPlannedHours.toFixed(1)} hrs
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[100px]">
                            {sch.shifts.join(', ')}
                          </div>
                        </div>
                      </td>

                      {/* Forecast Output */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-mono font-extrabold text-emerald-700 text-sm">
                          {sch.totalTargetPcs.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">PCS</span>
                        </div>
                      </td>

                      {/* Store Feasibility */}
                      <td className="py-3 px-4">
                        {sch.hasShortage ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.8 rounded-md text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                            <span>Shortage</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.8 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Feasible</span>
                          </span>
                        )}
                      </td>

                      {/* Schedule Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.8 rounded-md text-[11px] font-bold ${
                            sch.isAllReleased
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {sch.isAllReleased ? 'Released' : 'Planning (Draft)'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => onNavigateToScheduleGrid(sch.planDate)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
                            title={`Switch active planner date to ${sch.planDate} and open Machine Schedule Grid`}
                          >
                            <Cpu className="w-3 h-3 text-slate-500" />
                            <span>Grid</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedScheduleNumber(sch.scheduleNumber)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-[11px] font-bold transition-all shadow-2xs cursor-pointer"
                            title="Drill into Work Orders list"
                          >
                            <span>View WOs ({sch.jobs.length})</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
