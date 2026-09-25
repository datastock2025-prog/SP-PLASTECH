import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Cpu,
  Plus,
  FileSpreadsheet,
  Download,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  RotateCcw,
  Send,
  Sliders,
  Store,
  ChevronRight,
  Clock,
  Package,
  MoreVertical,
  FileText,
} from 'lucide-react';
import {
  WorkOrder,
  MachineMaster,
  ItemMaster,
  BomMaster,
  AuthUser,
} from '../../types';
import { useAuthContext } from '../../shared/components/RequireAuth';
import { MoldMaster } from '../../data/manufacturingData';
import {
  PlannedMachineJob,
  ExplodedMaterialRequirement,
  StoreInventoryNode,
} from './jit/jitTypes';
import {
  DEFAULT_CONNECTED_STORES,
  getPlantConnectedStores,
  calculateExpectedFinish,
  calculatePcsFromHours,
  calculateHoursFromPcs,
  explodePlanRequirements,
  exportConsolidatedMatrixToExcel,
  exportSingleJobToExcel,
  exportSingleJobToCsv,
  generateUniqueWorkOrderId,
  generateUniqueScheduleNumber,
  getFormulaRecipeId,
} from './jit/jitCalculations';
import { JitCommonComposer } from './jit/JitCommonComposer';
import { JitSingleScheduleGrid } from './jit/JitSingleScheduleGrid';
import { JitConsolidatedScheduleWorkOrders } from './jit/JitConsolidatedScheduleWorkOrders';
import { JitRecipeModal } from './jit/JitRecipeModal';
import { JitStoreInventoryModal } from './jit/JitStoreInventoryModal';
import { JitStoreFeasibilityView } from './jit/JitStoreFeasibilityView';

interface Props {
  workOrders: WorkOrder[];
  machines: MachineMaster[];
  items: ItemMaster[];
  molds?: MoldMaster[];
  boms?: BomMaster[];
  currentUser?: AuthUser | null;
  onNavigate: (view: string, params?: any) => void;
  onUpdateWO: (wo: WorkOrder) => void;
  onCreateWO: (wo: WorkOrder) => void;
  openDrawer?: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer?: () => void;
  openConfirm?: (title: string, message: string, onConfirm: () => void) => void;
  showToast: (msg: string) => void;
}

export const JitSchedulingPlanner: React.FC<Props> = ({
  workOrders,
  machines,
  items,
  molds = [],
  boms = [],
  currentUser: propUser,
  onNavigate,
  onUpdateWO,
  onCreateWO,
  openConfirm,
  showToast,
}) => {
  const authContext = useAuthContext();
  const effectiveUser = propUser || authContext.currentUser;

  // Top 3-dot menu state (Task 2)
  const [isTopMenuOpen, setIsTopMenuOpen] = useState(false);

  // Compute Tomorrow's Date (Default for next-day production plan)
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const todayStr = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  const dayAfterTomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  }, []);

  // State: Target Production Plan Date & Plant
  const [planDate, setPlanDate] = useState<string>(tomorrowStr);
  const defaultPlant = effectiveUser?.plantId || localStorage.getItem('sp_active_plant') || 'PLANT-01';
  const [plannerPlant, setPlannerPlant] = useState<string>(defaultPlant);
  const [activeTab, setActiveTab] = useState<'schedule' | 'feasibility' | 'summary'>('schedule');

  // Stores state (default connected + custom future stores)
  const [stores, setStores] = useState<StoreInventoryNode[]>(DEFAULT_CONNECTED_STORES);

  // Modal states
  const [inspectedJob, setInspectedJob] = useState<PlannedMachineJob | null>(null);

  // Task 2: No dummy next-day schedule, schedules are created manually
  const [jobs, setJobs] = useState<PlannedMachineJob[]>([]);

  // Filter jobs for currently selected dynamic plan date
  const currentPlanJobs = useMemo(() => {
    return jobs.filter((j) => (j.planDate || planDate) === planDate);
  }, [jobs, planDate]);

  // Aggregate Exploded Material Requirements for selected plan date
  const materialRequirements = useMemo(() => {
    return explodePlanRequirements(currentPlanJobs, boms, items, stores);
  }, [currentPlanJobs, boms, items, stores]);

  // High-level KPIs for selected plan date
  const totalPlannedHours = currentPlanJobs.reduce((acc, j) => acc + j.plannedHours, 0);
  const totalProducedPcs = currentPlanJobs.reduce((acc, j) => acc + j.calculatedPcs, 0);
  const totalResinKg = materialRequirements
    .filter((r) => r.category === 'RM')
    .reduce((acc, r) => acc + r.requiredQty, 0);
  const totalMasterbatchKg = materialRequirements
    .filter((r) => r.category === 'MB')
    .reduce((acc, r) => acc + r.requiredQty, 0);
  const totalInsertsNos = materialRequirements
    .filter((r) => r.category === 'INSERT')
    .reduce((acc, r) => acc + r.requiredQty, 0);
  const totalPackagingBoxes = materialRequirements
    .filter((r) => r.category === 'PCK')
    .reduce((acc, r) => acc + r.requiredQty, 0);

  const shortageCount = materialRequirements.filter((r) => r.feasibility === 'Critical_Shortage').length;
  const isAllFeasible = shortageCount === 0 && materialRequirements.length > 0;

  // Handlers for Jobs
  const handleUpdateJob = (updated: PlannedMachineJob) => {
    setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
  };

  // Add job submitted from Common Composer
  const handleAddJobFromComposer = (newJob: PlannedMachineJob) => {
    setJobs((prev) => [newJob, ...prev]);
    showToast(`Added ${newJob.machineId} (${newJob.itemCode}, ${newJob.calculatedPcs.toLocaleString()} PCS) to ${newJob.planDate} schedule!`);
  };

  const handleDuplicateJob = (jobToDup: PlannedMachineJob) => {
    const dup: PlannedMachineJob = {
      ...jobToDup,
      id: `job-${Date.now()}`,
      shift: 'Shift B (14:00 - 22:00)',
      status: 'Draft',
    };
    setJobs((prev) => [dup, ...prev]);
    showToast(`Duplicated ${jobToDup.itemCode} on ${dup.machineId}`);
  };

  const handleDeleteJob = (jobId: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
    showToast('Removed machine from daily plan');
  };

  // Release a single machine job as a Work Order (Task 1 & Task 3)
  const handleReleaseSingleJob = (job: PlannedMachineJob, onlyWo: boolean = false) => {
    const targetDate = job.planDate || planDate;
    const datePrefix = targetDate.replace(/-/g, '').slice(2);
    const woId = generateUniqueWorkOrderId(workOrders, `WO-JIT-${datePrefix}`);
    const woPriority: 'Low' | 'Medium' | 'High' =
      job.priority === 'High' || job.priority === 'Urgent' ? 'High' : 'Medium';
    const targetPlant = job.plant || plannerPlant || 'PLANT-01';
    const targetPlantName = job.plantName || 'Plant 01: Injection Molding Unit';
    const schId = job.scheduleNumber || `SCH-${targetDate.replace(/-/g, '')}-01`;

    const matchingBom = boms.find((b) => b.parent === job.itemCode);
    const calculatedFormulaId =
      job.formulaId || getFormulaRecipeId(job.itemCode, job.itemName, matchingBom?.version);

    const newWO: WorkOrder = {
      id: woId,
      item: job.itemCode,
      bomId: matchingBom?.id || 'BOM-1001',
      formulaId: calculatedFormulaId,
      machine: job.machineId,
      day: targetDate,
      planDate: targetDate,
      qty: job.calculatedPcs,
      uom: 'PCS',
      completed: 0,
      scrap: 0,
      status: onlyWo ? 'planned' : 'in_progress',
      sentToDailyProd: !onlyWo,
      priority: woPriority,
      dueDate: targetDate,
      operator: job.operator || '',
      downtimeMin: 0,
      mold: job.moldId,
      jitSeq: 1,
      shift: job.shift,
      plant: targetPlant,
      plantName: targetPlantName,
      jitScheduleId: schId,
      outputLogs: [],
      downtimeLogs: [],
      checklist: [
        { label: 'Mold mounted & clamped to tonnage', done: true },
        { label: 'Cooling water lines & temperature controller connected', done: true },
        { label: 'Material hopper loaded with verified resin & masterbatch', done: true },
      ],
      history: [
        {
          event: `JIT Work Order dispatched for ${targetDate} (${onlyWo ? 'Released to Work Orders Only' : 'Dispatched to Floor & Daily Production'})`,
          time: new Date().toISOString().replace('T', ' ').slice(0, 19),
        },
      ],
    };

    onCreateWO(newWO);
    setJobs((prev) =>
      prev.map((j) => (j.id === job.id ? { ...j, status: 'Released', workOrderId: woId, sentToDailyProd: !onlyWo } : j))
    );

    if (onlyWo) {
      showToast(`📋 Released ${woId} ONLY to Work Order Management. Navigating to Work Orders...`);
      setTimeout(() => onNavigate('workOrders', { id: woId }), 600);
    } else {
      showToast(`🎉 Dispatched ${woId} to both Work Orders & Daily Production grids! Navigating to Daily Production...`);
      setTimeout(() => onNavigate('prodEntryGrid', { date: targetDate, id: woId }), 600);
    }
  };

  // Release all jobs under a specific date (Task 1 & Task 3)
  const handleReleaseDateJobs = (targetDate: string, scheduleNumber?: string, onlyWo: boolean = false) => {
    const targetJobs = jobs.filter((j) => (j.planDate || planDate) === targetDate);
    if (targetJobs.length === 0) return;

    const schId = scheduleNumber || generateUniqueScheduleNumber(jobs, targetDate);

    const executeRelease = () => {
      let count = 0;
      const currentOrders = [...workOrders];
      targetJobs.forEach((job) => {
        if (job.status === 'Released') return;
        const datePrefix = targetDate.replace(/-/g, '').slice(2);
        const woId = generateUniqueWorkOrderId(currentOrders, `WO-JIT-${datePrefix}`);
        const woPriority: 'Low' | 'Medium' | 'High' =
          job.priority === 'High' || job.priority === 'Urgent' ? 'High' : 'Medium';
        const targetPlant = job.plant || plannerPlant || 'PLANT-01';
        const targetPlantName = job.plantName || 'Plant 01: Injection Molding Unit';

        const matchingBom = boms.find((b) => b.parent === job.itemCode);
        const calculatedFormulaId =
          job.formulaId || getFormulaRecipeId(job.itemCode, job.itemName, matchingBom?.version);

        const newWO: WorkOrder = {
          id: woId,
          item: job.itemCode,
          bomId: matchingBom?.id || 'BOM-1001',
          formulaId: calculatedFormulaId,
          machine: job.machineId,
          day: targetDate,
          planDate: targetDate,
          qty: job.calculatedPcs,
          uom: 'PCS',
          completed: 0,
          scrap: 0,
          status: onlyWo ? 'planned' : 'in_progress',
          sentToDailyProd: !onlyWo,
          priority: woPriority,
          dueDate: targetDate,
          operator: job.operator || '',
          downtimeMin: 0,
          mold: job.moldId,
          jitSeq: count + 1,
          shift: job.shift,
          plant: targetPlant,
          plantName: targetPlantName,
          jitScheduleId: schId,
          outputLogs: [],
          downtimeLogs: [],
          checklist: [
            { label: 'Mold mounted & clamped to tonnage', done: true },
            { label: 'Cooling water lines & temperature controller connected', done: true },
            { label: 'Material hopper loaded with verified resin & masterbatch', done: true },
          ],
          history: [
            {
              event: `JIT Schedule ${schId} dispatched for ${targetDate} (${onlyWo ? 'Released to Work Orders Only' : 'Dispatched to Floor & Daily Production'})`,
              time: new Date().toISOString().replace('T', ' ').slice(0, 19),
            },
          ],
        };
        onCreateWO(newWO);
        currentOrders.push(newWO);
        count++;
      });

      setJobs((prev) =>
        prev.map((j) =>
          (j.planDate || planDate) === targetDate ? { ...j, status: 'Released', sentToDailyProd: !onlyWo } : j
        )
      );

      if (onlyWo) {
        showToast(`📋 Released ${count} Work Orders for Schedule ${schId} ONLY to Work Order Management!`);
        setTimeout(() => onNavigate('workOrders', { date: targetDate }), 600);
      } else {
        showToast(`🎉 Released ${count} Work Orders for Schedule ${schId} to both Work Orders and Daily Production Entry!`);
        setTimeout(() => onNavigate('prodEntryGrid', { date: targetDate }), 600);
      }
    };

    if (openConfirm) {
      openConfirm(
        `Release Work Orders for Schedule ${schId}?`,
        `This will dispatch official active Work Orders for all ${targetJobs.length} scheduled machines on ${targetDate} (${onlyWo ? 'Destination: Work Orders Only' : 'Destination: Both Work Orders & Daily Production Entry'}).`,
        executeRelease
      );
    } else {
      executeRelease();
    }
  };

  // Date specific exports
  const handleExportDateExcel = (targetDate: string, scheduleNumber?: string) => {
    const targetJobs = jobs.filter((j) => (j.planDate || planDate) === targetDate);
    const targetReqs = explodePlanRequirements(targetJobs, boms, items, stores);
    exportJitPlanToExcel(targetDate, targetJobs, targetReqs, machines, stores);
    showToast(`Downloaded ${scheduleNumber || 'JIT_Plan_' + targetDate.replace(/-/g, '')}.xlsx`);
  };

  const handleExportDateCsv = (targetDate: string, scheduleNumber?: string) => {
    const targetJobs = jobs.filter((j) => (j.planDate || planDate) === targetDate);
    const targetReqs = explodePlanRequirements(targetJobs, boms, items, stores);
    exportJitPlanToCsv(targetDate, targetJobs, targetReqs);
    showToast(`Downloaded ${scheduleNumber || 'JIT_Plan_' + targetDate.replace(/-/g, '')}.csv`);
  };

  // Run full stock verification
  const handleVerifyStockFeasibility = () => {
    const shortageItems = materialRequirements.filter((r) => r.shortageQty > 0);
    if (shortageItems.length > 0) {
      showToast(`⚠️ Feasibility Alert: ${shortageItems.length} materials in shortage! Check Store Feasibility tab.`);
    } else {
      showToast('✅ 100% Stock Feasible! All resins, colorants & packaging verified across factory stores.');
    }
  };

  // Release Schedule & Generate Work Orders in System
  const handleReleaseScheduleToShopfloor = (onlyWo: boolean = false) => {
    const executeRelease = () => {
      const schId = generateUniqueScheduleNumber(jobs, planDate);
      let createdCount = 0;
      const currentOrders = [...workOrders];
      jobs.forEach((job) => {
        const datePrefix = planDate.replace(/-/g, '').slice(2);
        const woId = generateUniqueWorkOrderId(currentOrders, `WO-JIT-${datePrefix}`);
        const woPriority: 'Low' | 'Medium' | 'High' =
          job.priority === 'High' || job.priority === 'Critical'
            ? 'High'
            : job.priority === 'Low'
            ? 'Low'
            : 'Medium';
        const targetPlant = job.plant || plannerPlant || 'PLANT-01';
        const targetPlantName = job.plantName || 'Plant 01: Injection Molding Unit';

        const matchingBom = boms.find((b) => b.parent === job.itemCode);
        const calculatedFormulaId =
          job.formulaId || getFormulaRecipeId(job.itemCode, job.itemName, matchingBom?.version);

        const newWO: WorkOrder = {
          id: woId,
          item: job.itemCode,
          bomId: matchingBom?.id || 'BOM-1042',
          formulaId: calculatedFormulaId,
          machine: job.machineId,
          day: planDate,
          planDate: planDate,
          qty: job.calculatedPcs,
          uom: 'PCS',
          completed: 0,
          scrap: 0,
          status: onlyWo ? 'planned' : 'in_progress',
          sentToDailyProd: !onlyWo,
          priority: woPriority,
          dueDate: planDate,
          operator: job.operator || '',
          downtimeMin: 0,
          mold: job.moldId,
          jitSeq: createdCount + 1,
          shift: job.shift,
          plant: targetPlant,
          plantName: targetPlantName,
          jitScheduleId: schId,
          outputLogs: [],
          downtimeLogs: [],
          checklist: [
            { label: 'Mold mounted & clamped to tonnage', done: true },
            { label: 'Cooling water lines & temperature controller connected', done: true },
            { label: 'Material hopper loaded with verified resin & masterbatch', done: true },
          ],
          history: [
            {
              event: `JIT Schedule created for ${planDate} (${onlyWo ? 'Released to Work Orders Only' : 'Dispatched to Floor & Daily Production'})`,
              time: new Date().toISOString().replace('T', ' ').slice(0, 19),
            },
          ],
        };
        onCreateWO(newWO);
        currentOrders.push(newWO);
        createdCount++;
      });

      setJobs((prev) =>
        prev.map((j) => ({
          ...j,
          status: 'Released',
          sentToDailyProd: !onlyWo,
        }))
      );

      if (onlyWo) {
        showToast(`📋 Successfully released ${createdCount} Work Orders ONLY to Work Order Management!`);
        setTimeout(() => onNavigate('workOrders', { date: planDate }), 600);
      } else {
        showToast(`🎉 Successfully released ${createdCount} Work Orders to both Work Orders & Daily Production grids!`);
        setTimeout(() => onNavigate('prodEntryGrid', { date: planDate }), 600);
      }
    };

    if (openConfirm) {
      openConfirm(
        'Release Next-Day Schedule to Production?',
        `This will formalize the ${jobs.length} scheduled machine jobs for ${planDate} into official active Work Orders (${onlyWo ? 'Destination: Work Orders Only' : 'Destination: Both Work Orders & Daily Production Entry'}).`,
        executeRelease
      );
    } else {
      executeRelease();
    }
  };

  // Export handlers
  const handleExportExcel = () => {
    exportJitPlanToExcel(planDate, jobs, materialRequirements, machines, stores);
    showToast(`Downloaded JIT_Production_Plan_${planDate.replace(/-/g, '')}.xlsx`);
  };

  const handleExportCsv = () => {
    exportJitPlanToCsv(planDate, jobs, materialRequirements);
    showToast(`Downloaded JIT_Production_Plan_${planDate.replace(/-/g, '')}.csv`);
  };

  const handlePrintPlan = () => {
    window.print();
  };

  // Store Management
  const handleAddStore = (newStore: StoreInventoryNode) => {
    setStores((prev) => [...prev, newStore]);
    showToast(`Registered new factory store: ${newStore.code} (${newStore.name})`);
  };

  const handleRemoveStore = (storeId: string) => {
    setStores((prev) => prev.filter((s) => s.id !== storeId));
    showToast('Custom store removed');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Day Selector Cockpit */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-indigo-100 text-indigo-800">
                JIT Production Planner
              </span>
              <span className="text-xs text-slate-400">|</span>
              <span className="text-xs font-semibold text-slate-600">
                Daily Injection Molding Schedule &amp; Feasibility Engine
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              Production Schedule &amp; Feasibility Engine
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Plan machine jobs, calculate output by run hours, explode BOM recipes, and verify stock feasibility for {planDate}.
            </p>
          </div>

          {/* Task 2: 3-dot Dropdown Options Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsTopMenuOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition-colors"
              title="More Actions &amp; Export Options"
            >
              <MoreVertical className="w-4 h-4 text-slate-600" />
              <span>Actions &amp; Export</span>
            </button>

            {isTopMenuOpen && (
              <div
                className="absolute right-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 text-xs divide-y divide-slate-100"
                onClick={() => setIsTopMenuOpen(false)}
              >
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="w-full text-left px-3.5 py-2 hover:bg-emerald-50 text-emerald-800 font-semibold flex items-center gap-2 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Export Excel (.xlsx)</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-800 font-semibold flex items-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4 text-slate-600" />
                  <span>Export CSV</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintPlan}
                  className="w-full text-left px-3.5 py-2 hover:bg-indigo-50 text-indigo-800 font-semibold flex items-center gap-2 transition-colors"
                >
                  <Printer className="w-4 h-4 text-indigo-600" />
                  <span>Print Traveler Sheet</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Date Selector & Planning Horizon Strip */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Target Production Date:
            </span>

            <button
              type="button"
              onClick={() => setPlanDate(tomorrowStr)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                planDate === tomorrowStr
                  ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-300'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              ⚡ Tomorrow (Next-Day Plan)
            </button>

            <button
              type="button"
              onClick={() => setPlanDate(todayStr)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                planDate === todayStr
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => setPlanDate(dayAfterTomorrowStr)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                planDate === dayAfterTomorrowStr
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Day After Tomorrow
            </button>

            <div className="relative flex items-center ml-1">
              <input
                type="date"
                value={planDate}
                onChange={(e) => e.target.value && setPlanDate(e.target.value)}
                className="bg-white border border-slate-300 text-slate-800 text-xs font-semibold rounded-lg px-2.5 py-1 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleVerifyStockFeasibility}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-lg transition-colors shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Verify Stock Feasibility</span>
            </button>

            <button
              type="button"
              onClick={handleReleaseScheduleToShopfloor}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Release to Shop Floor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Aggregate KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-1">
          <span className="text-slate-500 font-medium text-[11px] block truncate">Scheduled IMMs</span>
          <div className="text-xl font-extrabold text-slate-900 font-mono">
            {jobs.length}{' '}
            <span className="text-xs font-normal text-slate-500">of {machines.length}</span>
          </div>
          <div className="text-[10px] text-slate-400">Multiple machines on date</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-1">
          <span className="text-slate-500 font-medium text-[11px] block truncate">Total Run Hours</span>
          <div className="text-xl font-extrabold text-indigo-700 font-mono">
            {totalPlannedHours.toFixed(1)} <span className="text-xs font-normal text-slate-500">hrs</span>
          </div>
          <div className="text-[10px] text-indigo-600 font-medium">
            {((totalPlannedHours / (jobs.length * 24)) * 100).toFixed(0)}% Shop Allocation
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-1">
          <span className="text-slate-500 font-medium text-[11px] block truncate">Total Forecast Yield</span>
          <div className="text-xl font-extrabold text-emerald-700 font-mono">
            {totalProducedPcs.toLocaleString()} <span className="text-xs font-bold text-slate-500">PCS</span>
          </div>
          <div className="text-[10px] text-emerald-600">Based on cycle & cavities</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-1">
          <span className="text-slate-500 font-medium text-[11px] block truncate">Raw Material (Resin)</span>
          <div className="text-xl font-extrabold text-slate-800 font-mono">
            {Math.round(totalResinKg).toLocaleString()} <span className="text-xs text-slate-500">KG</span>
          </div>
          <div className="text-[10px] text-slate-400">Polymer demands</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-1">
          <span className="text-slate-500 font-medium text-[11px] block truncate">Masterbatch & Color</span>
          <div className="text-xl font-extrabold text-purple-700 font-mono">
            {totalMasterbatchKg.toFixed(1)} <span className="text-xs text-slate-500">KG</span>
          </div>
          <div className="text-[10px] text-slate-400">Color concentrates</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-1">
          <span className="text-slate-500 font-medium text-[11px] block truncate">Store Feasibility</span>
          <div className="text-sm font-extrabold font-mono pt-1">
            {shortageCount > 0 ? (
              <span className="inline-flex items-center gap-1 text-rose-600">
                <AlertTriangle className="w-4 h-4" /> {shortageCount} Shortages
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" /> 100% Feasible
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-400">Across all connected stores</div>
        </div>
      </div>

      {/* Navigation View Switcher (Tabs) */}
      <div className="border-b border-slate-200 flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={`pb-3 px-3 text-xs font-bold transition-colors flex items-center gap-2 border-b-2 ${
              activeTab === 'schedule'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>1. Injection Machine Daily Schedule ({jobs.length} Machines)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('feasibility')}
            className={`pb-3 px-3 text-xs font-bold transition-colors flex items-center gap-2 border-b-2 ${
              activeTab === 'feasibility'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>2. Store Availability & Shortage Analysis ({materialRequirements.length} Materials)</span>
            {shortageCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                {shortageCount}
              </span>
            )}
          </button>
        </div>

        <div className="pb-2">
          {activeTab === 'schedule' && (
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              Configure above and click <strong className="text-indigo-700">ADD</strong> to schedule
            </span>
          )}
        </div>
      </div>

      {/* Tab 1: Machine Production Schedule & Grouped Date Grid */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          {/* Section 1: Common Machine Job Composer matching Reference Image */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs px-1">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-indigo-600" />
                <span>Common Machine Job Configurator (Configure & Click ADD)</span>
              </span>
              <span className="text-[11px] text-indigo-700 font-semibold">
                Formula: (Hours × 3600 / Cycle Time) × Cavities × Efficiency
              </span>
            </div>

            <JitCommonComposer
              planDate={planDate}
              onChangePlanDate={setPlanDate}
              selectedPlant={plannerPlant}
              onChangePlant={setPlannerPlant}
              currentUser={effectiveUser}
              machines={machines}
              items={items}
              molds={molds}
              boms={boms}
              stores={stores}
              onAddJob={handleAddJobFromComposer}
              onOpenRecipeModal={(j) => setInspectedJob(j)}
            />
          </div>

          {/* Section 2: Single Master Production Schedule Grid Under Unique Day-Wise Schedule Number */}
          <div className="space-y-3 pt-2">
            <JitSingleScheduleGrid
              selectedDate={planDate}
              onChangeDate={setPlanDate}
              jobs={jobs}
              machines={machines}
              items={items}
              molds={molds}
              boms={boms}
              stores={stores}
              workOrders={workOrders}
              onUpdateJob={handleUpdateJob}
              onDeleteJob={handleDeleteJob}
              onDuplicateJob={handleDuplicateJob}
              onReleaseSingleJob={handleReleaseSingleJob}
              onReleaseSchedule={handleReleaseDateJobs}
              onViewRecipe={(j) => setInspectedJob(j)}
              onNavigateToStockTransfer={(scheduleNumber, date) =>
                onNavigate('stockTransfers', {
                  initialTab: 'wizard',
                  sourceTab: 'SCHEDULE',
                  scheduleNumber,
                  date,
                })
              }
              onExportExcel={handleExportDateExcel}
              onExportCsv={handleExportDateCsv}
            />
          </div>
        </div>
      )}

      {/* Tab 2: Store Availability & Multi-Store Analysis */}
      {activeTab === 'feasibility' && (
        <JitStoreFeasibilityView
          requirements={materialRequirements}
          items={items}
          stores={stores}
          onAddStore={handleAddStore}
          onRemoveStore={handleRemoveStore}
        />
      )}

      {/* Detailed Recipe Modal */}
      {inspectedJob && (
        <JitRecipeModal
          job={inspectedJob}
          items={items}
          boms={boms}
          onClose={() => setInspectedJob(null)}
        />
      )}
    </div>
  );
};
