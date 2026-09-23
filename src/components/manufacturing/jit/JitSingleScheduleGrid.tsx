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
  CalendarDays,
  FileCheck2,
  Plus,
  MoreVertical,
  Printer,
  Edit2,
  Save,
  X,
  Lock,
  Unlock,
  Shield,
  Barcode,
  CalendarCheck,
} from 'lucide-react';
import { MachineMaster, ItemMaster, BomMaster, WorkOrder } from '../../../types';
import { MoldMaster } from '../../../data/manufacturingData';
import { PlannedMachineJob, StoreInventoryNode, CrudEligibilityUser, JitShift } from './jitTypes';
import {
  categorizeBomLine,
  parseStockNumber,
  getSyntheticRecipeForPart,
  calculateExpectedFinish,
  calculatePcsFromHours,
  calculateHoursFromPcs,
  buildConsolidatedMaterialMatrix,
  exportSingleJobToExcel,
  exportSingleJobToCsv,
  isWorkOrderInputStarted,
  canUserModifyInputActiveOrder,
  generateUniqueScheduleNumber,
} from './jitCalculations';
import { JitMachineRecipeConsolidation } from './JitMachineRecipeConsolidation';
import { JitConsolidatedScheduleWorkOrders } from './JitConsolidatedScheduleWorkOrders';
import { JitConsolidatedMaterialReqModal } from './JitConsolidatedMaterialReqModal';
import { JitTravelerModal } from './JitTravelerModal';
import { JitAdminCrudEligibilityModal } from './JitAdminCrudEligibilityModal';

interface Props {
  selectedDate: string;
  onChangeDate: (date: string) => void;
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
  onReleaseSingleJob: (job: PlannedMachineJob, onlyWo?: boolean) => void;
  onReleaseSchedule: (date: string, scheduleNumber: string, onlyWo?: boolean) => void;
  onViewRecipe: (job: PlannedMachineJob) => void;
  onNavigateToStockTransfer?: (scheduleNumber: string, date: string) => void;
  onExportExcel: (date: string, scheduleNumber: string) => void;
  onExportCsv: (date: string, scheduleNumber: string) => void;
}

export const JitSingleScheduleGrid: React.FC<Props> = ({
  selectedDate,
  onChangeDate,
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
  onReleaseSchedule,
  onViewRecipe,
  onNavigateToStockTransfer,
  onExportExcel,
  onExportCsv,
}) => {
  // Expanded job row IDs to inspect Work Order & Item completion details
  const [expandedJobIds, setExpandedJobIds] = useState<Record<string, boolean>>({});
  const [copiedScheduleNo, setCopiedScheduleNo] = useState<boolean>(false);
  const [activeSubView, setActiveSubView] = useState<'schedule_grid' | 'recipe_consolidation' | 'consolidated_schedules'>('schedule_grid');

  // Modals state
  const [isCmrModalOpen, setIsCmrModalOpen] = useState(false);
  const [travelerJob, setTravelerJob] = useState<PlannedMachineJob | null>(null);
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  // Editing state for Task 4 (Machine Schedule Grid directly editable)
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PlannedMachineJob>>({});

  // Task 6: Admin CRUD Eligibility & Lock State
  const [isAdminBypassActive, setIsAdminBypassActive] = useState<boolean>(false);
  const [eligibleUsers, setEligibleUsers] = useState<CrudEligibilityUser[]>([
    {
      id: 'admin-01',
      name: 'System Administrator (Admin)',
      role: 'Administrator',
      department: 'IT & Governance',
      canEditReleased: true,
      canDeleteReleased: true,
      canAddReleased: true,
    },
    {
      id: 'planner-lead-01',
      name: 'Priya Rao (Planner Lead)',
      role: 'Senior Production Planner',
      department: 'Planning & Control',
      canEditReleased: true,
      canDeleteReleased: false,
      canAddReleased: true,
    },
  ]);

  // Task 1: Checkbox state for "Only WO" (default false / unchecked)
  const [isOnlyWoChecked, setIsOnlyWoChecked] = useState<boolean>(false);

  // Filter jobs for the selected dynamic date
  const dateJobs = jobs.filter((j) => (j.planDate || selectedDate) === selectedDate);

  // Generate day-wise unique schedule number
  const scheduleNumber = React.useMemo(() => {
    const existingJobWithSch = dateJobs.find((j) => j.scheduleNumber);
    if (existingJobWithSch && existingJobWithSch.scheduleNumber) {
      return existingJobWithSch.scheduleNumber;
    }
    return generateUniqueScheduleNumber(jobs, selectedDate);
  }, [dateJobs, jobs, selectedDate]);

  // Find all distinct dates across all jobs for quick dynamic switching
  const distinctDatesWithJobs = React.useMemo(() => {
    const dates = new Set<string>();
    jobs.forEach((j) => {
      if (j.planDate) dates.add(j.planDate);
    });
    return Array.from(dates).sort();
  }, [jobs]);

  // Aggregate metrics for this particular day schedule
  const totalHours = dateJobs.reduce((acc, j) => acc + j.plannedHours, 0);
  const totalPcs = dateJobs.reduce((acc, j) => acc + j.calculatedPcs, 0);
  const releasedCount = dateJobs.filter((j) => j.status === 'Released').length;
  const isScheduleReleased = releasedCount === dateJobs.length && dateJobs.length > 0;

  // Task 2: Helper to find mapped Work Order for a machine job
  const getJobWorkOrder = (job: PlannedMachineJob): WorkOrder | undefined => {
    return workOrders.find(
      (w) =>
        w.id === job.workOrderId ||
        w.id === job.workOrderGenerated ||
        (w.planDate === (job.planDate || selectedDate) && w.machine === job.machineId && w.item === job.itemCode)
    );
  };

  // Task 2: Check if current user is permitted to perform CRUD on released schedule
  const canPerformCrud = !isScheduleReleased || isAdminBypassActive;

  // Toggle row expansion
  const toggleJobDetails = (jobId: string) => {
    setExpandedJobIds((prev) => ({
      ...prev,
      [jobId]: !prev[jobId],
    }));
  };

  // Copy schedule number to clipboard
  const handleCopyScheduleNumber = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(scheduleNumber);
      setCopiedScheduleNo(true);
      setTimeout(() => setCopiedScheduleNo(false), 2000);
    }
  };

  // Helper: compute recipe breakdown for a specific item job
  const getItemRecipeBreakdown = (job: PlannedMachineJob) => {
    const item = items.find((i) => i.code === job.itemCode);
    const bom = job.bomId ? boms.find((b) => b.id === job.bomId) : boms.find((b) => b.parent === job.itemCode);
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
      const catInfo = categorizeBomLine(line, matItem, job.plant);
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

  // Check overall date feasibility
  const hasAnyShortage = dateJobs.some((j) => {
    const breakdown = getItemRecipeBreakdown(j);
    return breakdown.some((m) => m.isShortage);
  });

  // Start row editing (Task 4 & Task 2)
  const handleStartEdit = (job: PlannedMachineJob, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // Task 2: If work order has started receiving floor input, editing is locked
    const mappedWO = getJobWorkOrder(job);
    if (mappedWO && isWorkOrderInputStarted(mappedWO)) {
      const perm = canUserModifyInputActiveOrder(mappedWO, isAdminBypassActive, eligibleUsers);
      if (!perm.allowed) {
        alert(
          `🔒 Floor Active Lock: Work Order ${mappedWO.id} has already started receiving production input (${mappedWO.completed || 0} Good, ${mappedWO.scrap || 0} Scrap) and cannot be modified or rolled back. Only Admin or users granted permission by Admin can modify.`
        );
        setIsAdminAuthModalOpen(true);
        return;
      }
    }

    if (!canPerformCrud) {
      alert('This schedule is Released to Shop Floor. Only Admin or designated authorized planners can edit.');
      return;
    }
    setEditingJobId(job.id);
    setEditForm({
      ...job,
    });
    setOpenActionMenuId(null);
  };

  // Save row editing (Task 4 & 3)
  const handleSaveEdit = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!editingJobId) return;

    const original = dateJobs.find((j) => j.id === editingJobId);
    if (!original) return;

    const updatedJob: PlannedMachineJob = {
      ...original,
      ...editForm,
      isCustomOverride: true,
      auditLog: [
        ...(original.auditLog || []),
        {
          timestamp: new Date().toLocaleTimeString(),
          action: 'Updated row values in Machine Schedule Grid',
          user: editForm.operator || original.operator || 'Planner',
        },
      ],
    } as PlannedMachineJob;

    onUpdateJob(updatedJob);
    setEditingJobId(null);
    setEditForm({});
  };

  const handleCancelEdit = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingJobId(null);
    setEditForm({});
  };

  // Handle Protected Delete (Task 2)
  const handleProtectedDelete = (jobId: string) => {
    const job = dateJobs.find((j) => j.id === jobId);
    const mappedWO = job ? getJobWorkOrder(job) : undefined;
    if (mappedWO && isWorkOrderInputStarted(mappedWO)) {
      const perm = canUserModifyInputActiveOrder(mappedWO, isAdminBypassActive, eligibleUsers);
      if (!perm.allowed) {
        alert(
          `🔒 Floor Active Lock: Work Order ${mappedWO.id} has already started receiving production input and cannot be deleted or rolled back from schedule. Only Admin or users granted permission by Admin can modify.`
        );
        setIsAdminAuthModalOpen(true);
        return;
      }
    }

    if (!canPerformCrud) {
      alert('Schedule is Released to Shop Floor. Only Admin or designated authorized planners can delete jobs.');
      return;
    }
    onDeleteJob(jobId);
    setOpenActionMenuId(null);
  };

  // Handle Protected Duplicate (Task 2)
  const handleProtectedDuplicate = (job: PlannedMachineJob) => {
    if (!canPerformCrud) {
      alert('Schedule is Released to Shop Floor. Only Admin or designated authorized planners can duplicate jobs.');
      return;
    }
    onDuplicateJob(job);
    setOpenActionMenuId(null);
  };

  // Build CMR Matrix
  const cmrMatrix = React.useMemo(() => {
    return buildConsolidatedMaterialMatrix(dateJobs, boms, items, machines, scheduleNumber, selectedDate);
  }, [dateJobs, boms, items, machines, scheduleNumber, selectedDate]);

  return (
    <div className="space-y-4">
      {/* Modals */}
      {isCmrModalOpen && (
        <JitConsolidatedMaterialReqModal
          matrix={cmrMatrix}
          onClose={() => setIsCmrModalOpen(false)}
        />
      )}

      {travelerJob && (
        <JitTravelerModal
          job={travelerJob}
          scheduleNumber={scheduleNumber}
          items={items}
          boms={boms}
          machines={machines}
          molds={molds}
          stores={stores}
          onClose={() => setTravelerJob(null)}
        />
      )}

      {isAdminAuthModalOpen && (
        <JitAdminCrudEligibilityModal
          eligibleUsers={eligibleUsers}
          onUpdateEligibleUsers={setEligibleUsers}
          isAdminUnlocked={isAdminBypassActive}
          onToggleAdminUnlock={setIsAdminBypassActive}
          onClose={() => setIsAdminAuthModalOpen(false)}
        />
      )}

      {/* Dynamic Date Selection & Horizon Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-slate-700 flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4 text-indigo-600" />
            <span>Select Schedule Date:</span>
          </span>

          {/* Dynamic Native Date Picker */}
          <div className="relative flex items-center">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && onChangeDate(e.target.value)}
              className="bg-slate-50 hover:bg-white border-2 border-indigo-200 focus:border-indigo-600 text-slate-900 font-extrabold text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all shadow-2xs cursor-pointer"
            />
          </div>

          {/* Quick Date Chips */}
          <div className="flex flex-wrap items-center gap-1.5 ml-1">
            {distinctDatesWithJobs.map((dateStr) => {
              const count = jobs.filter((j) => (j.planDate || selectedDate) === dateStr).length;
              const isSelected = selectedDate === dateStr;
              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => onChangeDate(dateStr)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-300'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{dateStr}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isSelected ? 'bg-white text-indigo-700' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Governance status */}
        <div className="flex items-center gap-2">
          {isScheduleReleased && (
            <button
              type="button"
              onClick={() => setIsAdminAuthModalOpen(true)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isAdminBypassActive
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs'
                  : 'bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs'
              }`}
              title="Admin CRUD Governance & Permission Controls"
            >
              {isAdminBypassActive ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Admin CRUD: Unlocked</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-700" />
                  <span>CRUD Locked (Admin Governance)</span>
                </>
              )}
            </button>
          )}

          <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
            <span>Active View:</span>
            <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
              {selectedDate}
            </span>
          </div>
        </div>
      </div>

      {/* Prominent Day Schedule Unique Number Header Card matching Screenshot 5 */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white rounded-2xl shadow-md border border-slate-800 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Left: Schedule Unique Number & Status */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-400/30">
                DAY-WISE SCHEDULE
              </span>
              <span className="text-slate-400 text-xs">&bull;</span>
              <span className="text-slate-300 text-xs font-medium">Production Date: <strong>{selectedDate}</strong></span>
              <span className="text-slate-400 text-xs">&bull;</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${
                  isScheduleReleased
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                }`}
              >
                {isScheduleReleased ? 'ALL WOS RELEASED' : 'Planning (Draft)'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <FileCheck2 className="w-5 h-5 text-indigo-400" />
                <h2 className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white">
                  {scheduleNumber}
                </h2>
              </div>

              <button
                type="button"
                onClick={handleCopyScheduleNumber}
                className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition-colors text-xs flex items-center gap-1 cursor-pointer"
                title="Copy Schedule Number"
              >
                <Copy className="w-3.5 h-3.5" />
                <span className="text-[11px]">{copiedScheduleNo ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Right: Key Day Summary Metrics & Action Buttons (Screenshot 5) */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
              <div>
                <span className="text-slate-400 text-[10px] block">Scheduled Machines:</span>
                <span className="font-extrabold font-mono text-white text-sm">
                  {dateJobs.length} <span className="text-xs font-normal text-slate-400">IMMs</span>
                </span>
              </div>

              <div className="border-l border-white/10 pl-4">
                <span className="text-slate-400 text-[10px] block">Total Runtime:</span>
                <span className="font-extrabold font-mono text-indigo-300 text-sm">
                  {totalHours.toFixed(1)} hrs
                </span>
              </div>

              <div className="border-l border-white/10 pl-4">
                <span className="text-slate-400 text-[10px] block">Forecast Output:</span>
                <span className="font-black font-mono text-emerald-400 text-sm">
                  {totalPcs.toLocaleString()} <span className="text-[10px] font-bold">PCS</span>
                </span>
              </div>

              <div className="border-l border-white/10 pl-4 hidden md:block">
                <span className="text-slate-400 text-[10px] block">Store Feasibility:</span>
                {hasAnyShortage ? (
                  <span className="font-bold text-rose-400 flex items-center gap-1 text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5" /> Shortage
                  </span>
                ) : (
                  <span className="font-bold text-emerald-400 flex items-center gap-1 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Feasible
                  </span>
                )}
              </div>
            </div>

            {/* Schedule Actions matching Screenshot 5 */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setActiveSubView(
                    activeSubView === 'schedule_grid' ? 'recipe_consolidation' : 'schedule_grid'
                  )
                }
                className="px-3 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 hover:text-white rounded-lg transition-colors border border-indigo-400/30 font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="Consolidated machine-by-machine recipe requirements"
              >
                <Boxes className="w-4 h-4 text-indigo-300" />
                <span className="hidden sm:inline">
                  {activeSubView === 'schedule_grid' ? 'Consolidated Recipe' : 'Machine Grid'}
                </span>
              </button>

              {/* Task 7: Consolidated Material Requirement (CMR) PDF / In-App Matrix Screen */}
              <button
                type="button"
                onClick={() => setIsCmrModalOpen(true)}
                className="p-2 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-lg transition-colors border border-indigo-400/50 shadow-2xs cursor-pointer flex items-center gap-1.5 px-3 font-bold text-xs"
                title="Open Consolidated Material Requirement Matrix & Print/PDF View (Screenshot 4)"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                <span>Consolidated Material Req (CMR)</span>
              </button>

              <button
                type="button"
                onClick={() => onExportExcel(selectedDate, scheduleNumber)}
                className="p-2 bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white rounded-lg transition-colors border border-white/10 cursor-pointer"
                title={`Export Excel for Schedule ${scheduleNumber}`}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              </button>

              <button
                type="button"
                onClick={() => onExportCsv(selectedDate, scheduleNumber)}
                className="p-2 bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white rounded-lg transition-colors border border-white/10 cursor-pointer"
                title={`Export CSV for Schedule ${scheduleNumber}`}
              >
                <Download className="w-4 h-4 text-slate-300" />
              </button>

              {/* Task 1: Checkbox for "Only WO" (default unchecked / empty) */}
              <label
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-white/15 rounded-lg text-xs font-semibold text-slate-200 cursor-pointer border border-white/10 transition-colors select-none"
                title="When checked, generates active work orders ONLY in the Work Order screen (omits from Daily Production entry until floor dispatch)"
              >
                <input
                  type="checkbox"
                  checked={isOnlyWoChecked}
                  onChange={(e) => setIsOnlyWoChecked(e.target.checked)}
                  className="rounded text-indigo-400 focus:ring-0 focus:ring-offset-0 cursor-pointer w-3.5 h-3.5"
                />
                <span className="text-[11px] font-bold text-white">Only WO</span>
              </label>

              <button
                type="button"
                onClick={() => onReleaseSchedule(selectedDate, scheduleNumber, isOnlyWoChecked)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer ${
                  isScheduleReleased
                    ? 'bg-emerald-600 text-white opacity-90 cursor-default'
                    : 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white hover:shadow'
                }`}
                title={`Release all machine jobs under ${scheduleNumber} as Work Orders (${isOnlyWoChecked ? 'Work Orders Only' : 'Both Work Orders & Daily Production'})`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isScheduleReleased ? 'Released to Floor' : isOnlyWoChecked ? 'Release to WO Only' : 'Release Schedule WOs'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* View Switcher: Single Schedule Grid vs Consolidated Machine Recipe Demand vs Consolidated Schedules */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs">
        <div className="flex items-center flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setActiveSubView('schedule_grid')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubView === 'schedule_grid'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Machine Schedule Grid</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeSubView === 'schedule_grid'
                  ? 'bg-indigo-700 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {dateJobs.length} IMMs
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubView('recipe_consolidation')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubView === 'recipe_consolidation'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Consolidated Recipe by Machine</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeSubView === 'recipe_consolidation'
                  ? 'bg-indigo-700 text-white'
                  : 'bg-indigo-50 text-indigo-700'
              }`}
            >
              Each Machine Demand
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubView('consolidated_schedules')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubView === 'consolidated_schedules'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Consolidated Schedule &amp; Work Orders</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeSubView === 'consolidated_schedules'
                  ? 'bg-indigo-700 text-white'
                  : 'bg-indigo-50 text-indigo-700'
              }`}
            >
              Schedule # &amp; Date Wise
            </span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          {activeSubView === 'schedule_grid' ? (
            <span>💡 Click any machine row to view Work Order specs &amp; material availability &bull; Double click or click Edit to modify values</span>
          ) : activeSubView === 'recipe_consolidation' ? (
            <span>
              💡 Showing per-machine recipe dosage (Resin KG, Masterbatch KG, boxes) for{' '}
              <strong>{selectedDate}</strong>
            </span>
          ) : (
            <span>
              💡 Click any schedule row or schedule number to drill into all work orders for that date
            </span>
          )}
        </div>
      </div>

      {/* RENDER VIEW BASED ON SELECTION */}
      {activeSubView === 'recipe_consolidation' ? (
        <JitMachineRecipeConsolidation
          scheduleNumber={scheduleNumber}
          selectedDate={selectedDate}
          jobs={dateJobs}
          machines={machines}
          items={items}
          molds={molds}
          boms={boms}
          stores={stores}
        />
      ) : activeSubView === 'consolidated_schedules' ? (
        <JitConsolidatedScheduleWorkOrders
          jobs={jobs}
          machines={machines}
          items={items}
          molds={molds}
          boms={boms}
          stores={stores}
          workOrders={workOrders}
          activeScheduleDate={selectedDate}
          onSelectScheduleDate={(date) => onChangeDate(date)}
          onNavigateToScheduleGrid={(date) => {
            onChangeDate(date);
            setActiveSubView('schedule_grid');
          }}
          onReleaseSingleJob={onReleaseSingleJob}
          onReleaseSchedule={onReleaseSchedule}
          onViewRecipe={onViewRecipe}
          onNavigateToStockTransfer={onNavigateToStockTransfer}
          onExportExcel={onExportExcel}
          onExportCsv={onExportCsv}
        />
      ) : (
        /* SINGLE MASTER GRID: Listed out on this particular date under Schedule Number */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {dateJobs.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                No Production Jobs Scheduled on {selectedDate}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Schedule <strong className="text-slate-700">{scheduleNumber}</strong> is currently empty. Use the Common Configurator block above to select an injection machine, item, shift runtime, and click <strong>ADD</strong> to schedule production for this date!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-4 w-10 text-center">#</th>
                    <th className="py-2.5 px-4">Injection Machine</th>
                    <th className="py-2.5 px-4">Scheduled Item / Part</th>
                    <th className="py-2.5 px-4">Tooling &amp; Cycle</th>
                    <th className="py-2.5 px-4">Shift &amp; Runtime</th>
                    <th className="py-2.5 px-4 text-right">Target Output</th>
                    <th className="py-2.5 px-4 text-center">Store Feasibility</th>
                    <th className="py-2.5 px-4 text-center">Work Order Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80">
                  {dateJobs.map((job, idx) => {
                    const isEditing = editingJobId === job.id;
                    const machine = machines.find((m) => m.id === (isEditing ? editForm.machineId : job.machineId));
                    const item = items.find((i) => i.code === job.itemCode);
                    const isDetailsExpanded = expandedJobIds[job.id] ?? false;
                    const recipeBreakdown = getItemRecipeBreakdown(job);
                    const hasShortage = recipeBreakdown.some((m) => m.isShortage);
                    const isReleased = job.status === 'Released';

                    // Linked work order reference
                    const linkedWO = workOrders.find(
                      (w) => w.machine === job.machineId && w.day === job.planDate && w.item === job.itemCode
                    );
                    const cleanDate = (job.planDate || selectedDate || '2026-08-21').replace(/-/g, '');
                    const woNumber =
                      linkedWO?.id || job.workOrderId || `WO-JIT-${cleanDate.slice(2)}-${idx + 1}`;

                    // Matching BOM
                    const matchingBoms = boms.filter((b) => b.parent === job.itemCode);
                    const bom = matchingBoms.find((b) => b.id === job.bomId) || matchingBoms[0] || boms.find((b) => b.parent === job.itemCode);

                    return (
                      <React.Fragment key={job.id}>
                        {/* Main Job Row */}
                        <tr
                          onClick={() => !isEditing && toggleJobDetails(job.id)}
                          className={`hover:bg-indigo-50/40 cursor-pointer transition-colors ${
                            isEditing
                              ? 'bg-amber-50/60 ring-2 ring-amber-400'
                              : isDetailsExpanded
                              ? 'bg-indigo-50/60'
                              : idx % 2 === 0
                              ? 'bg-white'
                              : 'bg-slate-50/40'
                          }`}
                        >
                          {/* Seq Number */}
                          <td className="py-3 px-4 text-center">
                            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold inline-flex items-center justify-center text-[10px]">
                              {idx + 1}
                            </span>
                          </td>

                          {/* Machine */}
                          <td className="py-3 px-4" onClick={(e) => isEditing && e.stopPropagation()}>
                            {isEditing ? (
                              <select
                                value={editForm.machineId || job.machineId}
                                onChange={(e) => setEditForm({ ...editForm, machineId: e.target.value })}
                                className="bg-white border border-indigo-300 rounded px-2 py-1 text-xs font-bold text-slate-900"
                              >
                                {machines.map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.id} ({m.tonnage})
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Cpu className="w-4 h-4 text-indigo-600 shrink-0" />
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-900">{job.machineId}</span>
                                    {job.plant && (
                                      <span
                                        className="font-mono text-[9px] font-bold bg-slate-800 text-white px-1.5 py-0.2 rounded shadow-2xs"
                                        title={job.plantName || job.plant}
                                      >
                                        {job.plant}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    {machine?.tonnage || '250T'} &bull; {machine?.line || 'Line 3'}
                                  </div>
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Scheduled Item & Linked BOM */}
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-bold text-slate-900">{job.itemCode}</div>
                              <div className="text-[11px] text-slate-600 truncate max-w-xs">{job.itemName}</div>
                              <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                                <span className="text-slate-400">BOM:</span>
                                <strong className="text-indigo-700">{job.bomId || bom?.id || 'BOM-1001'}</strong>
                              </div>
                            </div>
                          </td>

                          {/* Tooling & Cycle (Task 4 Editable) */}
                          <td className="py-3 px-4" onClick={(e) => isEditing && e.stopPropagation()}>
                            {isEditing ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-slate-500">Cav:</span>
                                  <input
                                    type="number"
                                    min="1"
                                    max="64"
                                    value={editForm.cavities ?? job.cavities}
                                    onChange={(e) => {
                                      const cav = Math.max(1, parseInt(e.target.value) || 1);
                                      const ct = editForm.cycleTimeSec ?? job.cycleTimeSec;
                                      const hrs = editForm.plannedHours ?? job.plannedHours;
                                      const calcPcs = calculatePcsFromHours(hrs, ct, cav, job.efficiencyPct);
                                      setEditForm({
                                        ...editForm,
                                        cavities: cav,
                                        calculatedPcs: calcPcs,
                                        targetPcs: calcPcs,
                                        isCustomCavity: true,
                                      });
                                    }}
                                    className="w-14 bg-white border border-slate-300 rounded px-1.5 py-0.5 font-mono text-xs font-bold"
                                  />
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-slate-500">Cycle:</span>
                                  <input
                                    type="number"
                                    min="1"
                                    step="0.5"
                                    value={editForm.cycleTimeSec ?? job.cycleTimeSec}
                                    onChange={(e) => {
                                      const ct = Math.max(1, parseFloat(e.target.value) || 1);
                                      const cav = editForm.cavities ?? job.cavities;
                                      const hrs = editForm.plannedHours ?? job.plannedHours;
                                      const calcPcs = calculatePcsFromHours(hrs, ct, cav, job.efficiencyPct);
                                      setEditForm({
                                        ...editForm,
                                        cycleTimeSec: ct,
                                        calculatedPcs: calcPcs,
                                        targetPcs: calcPcs,
                                        isCustomCycleTime: true,
                                      });
                                    }}
                                    className="w-14 bg-white border border-slate-300 rounded px-1.5 py-0.5 font-mono text-xs font-bold"
                                  />
                                  <span className="text-[10px] text-slate-400">s</span>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="font-semibold text-slate-800">{job.moldName}</div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                  <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-mono font-medium">
                                    {job.cavities} Cav
                                  </span>
                                  <span>{job.cycleTimeSec}s cycle</span>
                                  {job.isCustomOverride && (
                                    <span className="text-[9px] bg-amber-100 text-amber-800 px-1 rounded font-bold">
                                      Custom
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Shift & Runtime (Task 4 Editable) */}
                          <td className="py-3 px-4" onClick={(e) => isEditing && e.stopPropagation()}>
                            {isEditing ? (
                              <div className="space-y-1">
                                <select
                                  value={editForm.shift || job.shift}
                                  onChange={(e) => {
                                    const sh = e.target.value as JitShift;
                                    let hrs = editForm.plannedHours ?? job.plannedHours;
                                    if (sh === 'Full Day 24H') hrs = 24.0;
                                    else if (sh.includes('Shift')) hrs = 8.0;
                                    const ct = editForm.cycleTimeSec ?? job.cycleTimeSec;
                                    const cav = editForm.cavities ?? job.cavities;
                                    const calcPcs = calculatePcsFromHours(hrs, ct, cav, job.efficiencyPct);
                                    const finish = calculateExpectedFinish(job.planDate, hrs, sh);
                                    setEditForm({
                                      ...editForm,
                                      shift: sh,
                                      plannedHours: hrs,
                                      calculatedPcs: calcPcs,
                                      targetPcs: calcPcs,
                                      expectedFinishDate: finish.expectedFinishDate,
                                      expectedFinishTime: finish.expectedFinishTime,
                                    });
                                  }}
                                  className="w-full bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs font-semibold"
                                >
                                  <option value="Full Day 24H">Full Day 24H</option>
                                  <option value="Shift A (06:00 - 14:00)">Shift A (8h)</option>
                                  <option value="Shift B (14:00 - 22:00)">Shift B (8h)</option>
                                  <option value="Shift C (22:00 - 06:00)">Shift C (8h)</option>
                                  <option value="Custom Hours">Custom Hours</option>
                                </select>
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min="0.5"
                                    max="24"
                                    step="0.5"
                                    value={editForm.plannedHours ?? job.plannedHours}
                                    onChange={(e) => {
                                      const hrs = Math.max(0.5, Math.min(24, parseFloat(e.target.value) || 0.5));
                                      const ct = editForm.cycleTimeSec ?? job.cycleTimeSec;
                                      const cav = editForm.cavities ?? job.cavities;
                                      const calcPcs = calculatePcsFromHours(hrs, ct, cav, job.efficiencyPct);
                                      const finish = calculateExpectedFinish(job.planDate, hrs, editForm.shift || job.shift);
                                      setEditForm({
                                        ...editForm,
                                        plannedHours: hrs,
                                        calculatedPcs: calcPcs,
                                        targetPcs: calcPcs,
                                        expectedFinishDate: finish.expectedFinishDate,
                                        expectedFinishTime: finish.expectedFinishTime,
                                      });
                                    }}
                                    className="w-16 bg-white border border-slate-300 rounded px-1.5 py-0.5 font-mono text-xs font-bold text-indigo-700"
                                  />
                                  <span className="text-[10px] text-slate-500">hrs</span>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="font-semibold text-slate-800">{job.shift}</div>
                                <div className="text-[11px] text-indigo-700 font-mono font-bold mt-0.5">
                                  {job.plannedHours.toFixed(1)} hrs{' '}
                                  <span className="text-slate-400 font-normal">
                                    ({Math.round((job.plannedHours / 24) * 100)}% load)
                                  </span>
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Target Output (Task 4 Editable) */}
                          <td className="py-3 px-4 text-right" onClick={(e) => isEditing && e.stopPropagation()}>
                            {isEditing ? (
                              <div className="space-y-1 text-right">
                                <input
                                  type="number"
                                  min="1"
                                  value={editForm.calculatedPcs ?? job.calculatedPcs}
                                  onChange={(e) => {
                                    const pcs = Math.max(1, parseInt(e.target.value) || 1);
                                    const ct = editForm.cycleTimeSec ?? job.cycleTimeSec;
                                    const cav = editForm.cavities ?? job.cavities;
                                    const hrs = calculateHoursFromPcs(pcs, ct, cav, job.efficiencyPct);
                                    const finish = calculateExpectedFinish(job.planDate, hrs, editForm.shift || job.shift);
                                    setEditForm({
                                      ...editForm,
                                      targetPcs: pcs,
                                      calculatedPcs: pcs,
                                      plannedHours: hrs,
                                      expectedFinishDate: finish.expectedFinishDate,
                                      expectedFinishTime: finish.expectedFinishTime,
                                    });
                                  }}
                                  className="w-24 bg-white border border-indigo-300 rounded px-1.5 py-0.5 text-right font-mono font-bold text-xs text-indigo-900"
                                />
                                <div className="text-[10px] text-slate-400">PCS</div>
                              </div>
                            ) : (
                              <div>
                                <div className="font-black text-indigo-900 font-mono text-sm">
                                  {job.calculatedPcs.toLocaleString()}{' '}
                                  <span className="text-[10px] font-bold text-slate-500">PCS</span>
                                </div>
                                <div className="text-[10px] text-slate-400">Yield: {job.efficiencyPct}%</div>
                              </div>
                            )}
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

                          {/* Work Order Status & Floor Input Active Indicator (Task 2) */}
                          <td className="py-3 px-4 text-center">
                            {(() => {
                              const mappedWO = getJobWorkOrder(job);
                              const inputStarted = mappedWO && isWorkOrderInputStarted(mappedWO);
                              if (inputStarted) {
                                return (
                                  <span
                                    className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-md shadow-2xs"
                                    title={`Work order has active floor production input (${mappedWO.completed || 0} Good, ${mappedWO.scrap || 0} Scrap). Editing locked for non-admin users.`}
                                  >
                                    <Lock className="w-3 h-3 text-amber-700" />
                                    Floor Active ({mappedWO.completed || 0} PCS)
                                  </span>
                                );
                              }
                              if (isReleased) {
                                return (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-md">
                                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                                    WO Released
                                  </span>
                                );
                              }
                              return (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md">
                                  Planned (Draft)
                                </span>
                              );
                            })()}
                          </td>

                          {/* Actions (Task 1, 4, 6) */}
                          <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            {isEditing ? (
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={handleSaveEdit}
                                  className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1 px-2.5 text-xs font-bold cursor-pointer"
                                  title="Save Changes"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                  <span>Save</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelEdit}
                                  className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors cursor-pointer"
                                  title="Cancel"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => toggleJobDetails(job.id)}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                                    isDetailsExpanded
                                      ? 'bg-indigo-600 text-white border-indigo-600'
                                      : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
                                  }`}
                                  title="View Work Order details & materials required to finish this item"
                                >
                                  <span>WO &amp; Materials</span>
                                  {isDetailsExpanded ? (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  )}
                                </button>

                                {/* Edit Button (Task 4) */}
                                <button
                                  type="button"
                                  onClick={(e) => handleStartEdit(job, e)}
                                  className="p-1.5 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                  title="Edit machine job parameters inline"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                {/* 3-Dot Dropdown Options (Task 1) */}
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setOpenActionMenuId(openActionMenuId === job.id ? null : job.id)
                                    }
                                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                    title="More Options (Traveler, Excel, CSV, Duplicate, Delete)"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </button>

                                  {openActionMenuId === job.id && (
                                    <div
                                      className="absolute right-0 top-full mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-40 py-1 text-xs text-left"
                                      onClick={() => setOpenActionMenuId(null)}
                                    >
                                      {/* Work Order Traveler */}
                                      <button
                                        type="button"
                                        onClick={() => setTravelerJob(job)}
                                        className="w-full text-left px-3 py-2 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 flex items-center gap-2 font-medium"
                                      >
                                        <Barcode className="w-3.5 h-3.5 text-indigo-600" />
                                        <span>Work Order Traveler</span>
                                      </button>

                                      {/* Export Single Job to Excel */}
                                      <button
                                        type="button"
                                        onClick={() => exportSingleJobToExcel(job, boms, items, stores)}
                                        className="w-full text-left px-3 py-2 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 flex items-center gap-2 font-medium"
                                      >
                                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Export to Excel (.xlsx)</span>
                                      </button>

                                      {/* Export Single Job to CSV */}
                                      <button
                                        type="button"
                                        onClick={() => exportSingleJobToCsv(job, boms, items)}
                                        className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 hover:text-slate-900 flex items-center gap-2 font-medium"
                                      >
                                        <Download className="w-3.5 h-3.5 text-slate-500" />
                                        <span>Export to CSV (.csv)</span>
                                      </button>

                                      <div className="border-t border-slate-100 my-1" />

                                      {/* Edit Job */}
                                      <button
                                        type="button"
                                        onClick={(e) => handleStartEdit(job, e)}
                                        className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 hover:text-slate-900 flex items-center gap-2 font-medium"
                                      >
                                        <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                                        <span>Edit Machine Job</span>
                                      </button>

                                      {/* Duplicate Job */}
                                      <button
                                        type="button"
                                        onClick={() => handleProtectedDuplicate(job)}
                                        className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 hover:text-slate-900 flex items-center gap-2 font-medium"
                                      >
                                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                                        <span>Duplicate Job</span>
                                      </button>

                                      {/* Delete Job */}
                                      <button
                                        type="button"
                                        onClick={() => handleProtectedDelete(job.id)}
                                        className="w-full text-left px-3 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2 font-medium"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                        <span>Remove from Schedule</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>

                        {/* Expanded Details: Work Order and materials to finish this particular item */}
                        {isDetailsExpanded && (
                          <tr className="bg-slate-50/90 border-y-2 border-indigo-100">
                            <td colSpan={9} className="p-4 sm:p-5">
                              <div className="space-y-4">
                                {/* Header Card for this specific Work Order */}
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
                                        {job.plant && (
                                          <>
                                            <span>&bull;</span>
                                            <span>Plant: <strong className="text-indigo-900 font-bold">{job.plant}</strong> {job.plantName && `(${job.plantName})`}</span>
                                          </>
                                        )}
                                        <span>&bull;</span>
                                        <span>Schedule No: <strong className="text-indigo-700 font-mono">{scheduleNumber}</strong></span>
                                        <span>&bull;</span>
                                        <span>Operator: <strong className="text-slate-800">{job.operator || 'Assigned Lead'}</strong></span>
                                        <span>&bull;</span>
                                        <span>Due Date: <strong className="text-slate-800">{job.planDate}</strong></span>
                                        <span>&bull;</span>
                                        <span>Expected Finish: <strong className="text-indigo-900">{job.expectedFinishDate || job.planDate}</strong></span>
                                        <span>&bull;</span>
                                        <span>Priority: <strong className="text-indigo-700">{job.priority}</strong></span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Work Order Actions */}
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setTravelerJob(job)}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                      title="Open Printable Work Order Traveler"
                                    >
                                      <Barcode className="w-3.5 h-3.5 text-indigo-600" />
                                      <span>Traveler Router</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => onViewRecipe(job)}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                    >
                                      <FileSpreadsheet className="w-3.5 h-3.5" />
                                      <span>Full Recipe Specs</span>
                                    </button>

                                    {!isReleased && (
                                      <button
                                        type="button"
                                        onClick={() => onReleaseSingleJob(job, isOnlyWoChecked)}
                                        className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
                                        title={isOnlyWoChecked ? 'Release to Work Orders screen only' : 'Release to both Work Orders and Daily Production Entry'}
                                      >
                                        <Send className="w-3.5 h-3.5" />
                                        <span>{isOnlyWoChecked ? 'Release to WO Only' : 'Release This Work Order'}</span>
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
                                      Connected Plant Stores Coverage Check
                                    </span>
                                  </div>

                                  <table className="w-full text-left text-xs">
                                    <thead>
                                      <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px] uppercase font-bold">
                                        <th className="py-2 px-4">Material Code &amp; Description</th>
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
                                              <span className="font-medium text-slate-800 font-mono">{mat.storeLocation}</span>
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
      )}
    </div>
  );
};

