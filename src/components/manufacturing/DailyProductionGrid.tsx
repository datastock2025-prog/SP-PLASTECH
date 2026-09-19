import React, { useState, useMemo, useEffect, Component, ErrorInfo } from 'react';
import * as XLSX from 'xlsx';
import { WorkOrder, MachineMaster, ItemMaster, BomMaster, RejectionBreakdownItem, DowntimeIntervalItem } from '../../types';
import { MoldMaster } from '../../data/manufacturingData';
import {
  Save,
  Plus,
  Trash2,
  Filter,
  Search,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Layers,
  Calendar,
  Clock,
  ArrowDownUp,
  Sliders,
  Check,
  RefreshCw,
  Zap,
  Download,
  Upload,
  ShieldAlert,
  Scale,
  Flame,
  Copy,
  ExternalLink,
  ChevronDown,
  Info,
  X,
  Minus,
  Lock,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCcw,
  Home,
  Boxes,
} from 'lucide-react';
import { MultiRejectionModal } from './MultiRejectionModal';
import { MultiDowntimeModal } from './MultiDowntimeModal';
import { DailyProductionExcelModal } from './DailyProductionExcelModal';
import { DailyMaterialReconcileModal } from './DailyMaterialReconcileModal';
import { JitOperatorAutocomplete } from './jit/JitOperatorAutocomplete';
import { generateUniqueWorkOrderId } from './jit/jitCalculations';

// ==========================================
// 1. Enterprise Component Error Boundary
// ==========================================
interface ErrorBoundaryProps {
  children: React.ReactNode;
  onResetState?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class DailyProductionErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[DailyProductionGrid ErrorBoundary]', error, errorInfo);
  }

  handleRecover = () => {
    this.setState({ hasError: false, error: null });
    this.props.onResetState?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[380px] flex items-center justify-center p-6 bg-slate-50/80 rounded-3xl border border-dashed border-slate-300 m-2">
          <div className="max-w-lg w-full bg-white p-7 rounded-3xl border border-slate-200 shadow-xl text-center space-y-4">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200 shadow-inner">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Daily Production View Recovered
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                A data irregularity was intercepted in the high-volume grid engine. The system protected your active session and floor data integrity.
              </p>
              {this.state.error && (
                <div className="mt-3 p-2.5 bg-slate-50 rounded-xl text-left font-mono text-[11px] text-rose-700 max-h-24 overflow-y-auto border border-slate-200">
                  {this.state.error.message || String(this.state.error)}
                </div>
              )}
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleRecover}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#14213D] hover:bg-[#1f335e] text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Recover &amp; Reset View
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                <Home className="w-3.5 h-3.5 text-slate-500" /> Reload Workspace
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ==========================================
// 2. High-Performance Daily Production Screen
// ==========================================
interface ProductionGridProps {
  workOrders: WorkOrder[];
  machines: MachineMaster[];
  items: ItemMaster[];
  molds: MoldMaster[];
  boms?: BomMaster[];
  onNavigate: (view: string, param?: any) => void;
  onUpdateWO: (wo: WorkOrder) => void;
  onCreateWO: (wo: WorkOrder) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
  onSyncWipLot?: (wo: WorkOrder, source: 'grid_entry' | 'excel_csv_upload', notes?: string) => void;
}

export const DailyProductionGridInner: React.FC<ProductionGridProps> = ({
  workOrders,
  machines,
  items,
  molds,
  boms = [],
  onNavigate,
  onUpdateWO,
  onCreateWO,
  openDrawer,
  closeDrawer,
  showToast,
  onSyncWipLot,
}) => {
  // Date Helpers
  const getTodayDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>('2026-08-21');
  const [selectedShift, setSelectedShift] = useState<string>('all');
  const [selectedMachineFilter, setSelectedMachineFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'rejections' | 'downtime' | 'runner' | 'dirty'>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  
  // Enterprise Pagination State (Default 20, up to 500 per page for floor speed)
  const [gridPage, setGridPage] = useState<number>(1);
  const [gridPageSize, setGridPageSize] = useState<number>(20);
  const [jumpPageInput, setJumpPageInput] = useState<string>('');
  const [isCompactView, setIsCompactView] = useState<boolean>(false);

  // Modals state
  const [isExcelModalOpen, setIsExcelModalOpen] = useState<boolean>(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState<boolean>(false);
  const [bulkField, setBulkField] = useState<'operator' | 'shift' | 'status' | 'machine' | 'planDate'>('operator');
  const [bulkValue, setBulkValue] = useState<string>('');

  // Target Work Order for Rejection Breakdown Modal
  const [rejectionModalWO, setRejectionModalWO] = useState<WorkOrder | null>(null);

  // Target Work Order for Downtime Intervals Modal
  const [downtimeModalWO, setDowntimeModalWO] = useState<WorkOrder | null>(null);

  // Target Work Order for Material & Store Reconciliation (+pck +bop +con, BOM version) (Tasks 2 & 4)
  const [materialReconcileWO, setMaterialReconcileWO] = useState<WorkOrder | null>(null);

  // High-Volume Lightweight Edits Buffer (Avoids copying 200,000+ objects on every keystroke)
  const [editedRowsMap, setEditedRowsMap] = useState<Record<string, Partial<WorkOrder>>>({});
  const [dirtyRowIds, setDirtyRowIds] = useState<Set<string>>(new Set());
  const [manualRows, setManualRows] = useState<WorkOrder[]>([]);
  const [expandedRowIds, setExpandedRowIds] = useState<string[]>([]);

  // Fast Lookup Maps (Memoized O(1) Lookups for 200,000 items)
  const itemMap = useMemo(() => {
    const map = new Map<string, ItemMaster>();
    items.forEach((itm) => {
      if (itm && itm.code) map.set(itm.code, itm);
    });
    return map;
  }, [items]);

  const machineMap = useMemo(() => {
    const map = new Map<string, MachineMaster>();
    machines.forEach((m) => {
      if (m && m.id) map.set(m.id, m);
    });
    return map;
  }, [machines]);

  // Helper to extract clean YYYY-MM-DD date from WorkOrder safely
  const getRowDate = (wo: WorkOrder): string => {
    if (!wo) return '';
    if (wo.planDate && /^\d{4}-\d{2}-\d{2}$/.test(wo.planDate)) {
      return wo.planDate;
    }
    if (wo.dueDate) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(wo.dueDate)) return wo.dueDate;
      const parsed = Date.parse(wo.dueDate);
      if (!isNaN(parsed)) {
        const d = new Date(parsed);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }
    return '';
  };

  const itemName = (code: string) => itemMap.get(code)?.name || code || 'Standard Molded Part';

  // High-Volume Date Index Map: O(1) day partitioning across 2 Lakh+ records
  const { dateIndexMap, allCombinedOrders } = useMemo(() => {
    const dMap = new Map<string, WorkOrder[]>();
    // Task 1: Exclude work orders that were explicitly dispatched ONLY to Work Orders screen
    const eligibleOrders = workOrders.filter((w) => w && w.sentToDailyProd !== false);
    const combined = [...manualRows, ...eligibleOrders];

    for (let i = 0; i < combined.length; i++) {
      const wo = combined[i];
      if (!wo) continue;
      const d = getRowDate(wo);
      if (d) {
        let bucket = dMap.get(d);
        if (!bucket) {
          bucket = [];
          dMap.set(d, bucket);
        }
        bucket.push(wo);
      }
    }

    return { dateIndexMap: dMap, allCombinedOrders: combined };
  }, [workOrders, manualRows]);

  // Distinct dates available in the work order dataset
  const availableDates = useMemo(() => {
    const dates = Array.from(dateIndexMap.keys()).sort().reverse();
    return dates;
  }, [dateIndexMap]);

  // Fast Memoized Filtered Dataset (O(1) partitioned when date is selected)
  const filteredGridRows = useMemo(() => {
    const targetPool =
      selectedDate && selectedDate !== 'all' && selectedDate.trim() !== ''
        ? dateIndexMap.get(selectedDate) || []
        : allCombinedOrders;

    const lowerSearch = searchFilter.trim().toLowerCase();

    return targetPool
      .map((masterWO) => {
        const edits = editedRowsMap[masterWO.id];
        if (edits) {
          return { ...masterWO, ...edits };
        }
        const isTargetMet = (masterWO.completed || 0) >= (masterWO.qty || 1);
        return {
          ...masterWO,
          operator:
            masterWO.operator === 'Assigned Operator' || masterWO.operator === 'Operator'
              ? ''
              : masterWO.operator || '',
          status: isTargetMet ? 'completed' : masterWO.status === 'released' ? 'in_progress' : masterWO.status || 'in_progress',
        };
      })
      .filter((wo) => {
        // Date match safeguard
        if (selectedDate && selectedDate !== 'all' && selectedDate.trim() !== '') {
          const rowDate = getRowDate(wo);
          if (rowDate !== selectedDate && wo.planDate !== selectedDate) {
            return false;
          }
        }

        // Global Search
        if (lowerSearch) {
          const matchId = (wo.id || '').toLowerCase().includes(lowerSearch);
          const matchItem = (wo.item || '').toLowerCase().includes(lowerSearch);
          const matchName = itemName(wo.item).toLowerCase().includes(lowerSearch);
          const matchMachine = (wo.machine || '').toLowerCase().includes(lowerSearch);
          const matchOp = (wo.operator || '').toLowerCase().includes(lowerSearch);
          const matchDate = (wo.planDate || getRowDate(wo)).includes(lowerSearch);
          if (!matchId && !matchItem && !matchName && !matchMachine && !matchOp && !matchDate) {
            return false;
          }
        }

        // Shift Filter
        if (selectedShift !== 'all' && wo.shift !== selectedShift) return false;

        // Machine Filter
        if (selectedMachineFilter !== 'all' && wo.machine !== selectedMachineFilter) return false;

        // Status Filter
        if (selectedStatusFilter !== 'all' && wo.status !== selectedStatusFilter) return false;

        // Category tab filters
        if (activeFilterTab === 'rejections') {
          const hasRej = (wo.scrap && wo.scrap > 0) || (wo.rejectionBreakdown && wo.rejectionBreakdown.length > 0);
          if (!hasRej) return false;
        } else if (activeFilterTab === 'downtime') {
          const hasDwn = (wo.downtimeMin && wo.downtimeMin > 0) || (wo.downtimeIntervals && wo.downtimeIntervals.length > 0);
          if (!hasDwn) return false;
        } else if (activeFilterTab === 'runner') {
          const hasRunner =
            (wo.runnerQty && wo.runnerQty > 0) ||
            (wo.lumbesQty && wo.lumbesQty > 0) ||
            (wo.runnerWeightKg && wo.runnerWeightKg > 0) ||
            (wo.lumpsWeightKg && wo.lumpsWeightKg > 0);
          if (!hasRunner) return false;
        } else if (activeFilterTab === 'dirty') {
          if (!dirtyRowIds.has(wo.id)) return false;
        }

        return true;
      });
  }, [
    selectedDate,
    dateIndexMap,
    allCombinedOrders,
    editedRowsMap,
    dirtyRowIds,
    searchFilter,
    selectedShift,
    selectedMachineFilter,
    selectedStatusFilter,
    activeFilterTab,
    itemMap,
  ]);

  // Reset to page 1 whenever search, date, or filter parameters change
  useEffect(() => {
    setGridPage(1);
  }, [selectedDate, selectedShift, selectedMachineFilter, selectedStatusFilter, activeFilterTab, searchFilter]);

  // Master Work Order Index Map for O(1) row resolution
  const masterWorkOrderMap = useMemo(() => {
    const map = new Map<string, WorkOrder>();
    for (let i = 0; i < allCombinedOrders.length; i++) {
      const wo = allCombinedOrders[i];
      if (wo && wo.id) map.set(wo.id, wo);
    }
    return map;
  }, [allCombinedOrders]);

  const toggleExpandRow = (id: string) => {
    setExpandedRowIds((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  };

  // High-Speed Cell Change Handler (Modifies only the row delta map)
  const handleCellChange = (id: string, field: keyof WorkOrder, value: any) => {
    try {
      const originalWO = masterWorkOrderMap.get(id);
      const existingMasterGood = Number(originalWO?.completed) || 0;
      const plannedQty = Number(originalWO?.qty) || 1;

      // Task 4: Validate Good Output cannot exceed Planned Target
      if (field === 'completed') {
        const numVal = Math.max(0, parseInt(value, 10) || 0);
        const remainingTarget = Math.max(0, plannedQty - existingMasterGood);
        if (numVal > plannedQty || existingMasterGood + numVal > plannedQty) {
          const maxAllowed = remainingTarget > 0 ? remainingTarget : plannedQty;
          showToast(
            `⚠️ Validation Warning: Good Output (${numVal} pcs) cannot exceed Planned Target of ${plannedQty} pcs! Remaining shift allowance: ${maxAllowed} pcs.`
          );
          value = Math.min(numVal, maxAllowed);
        } else {
          value = numVal;
        }
      }

      setEditedRowsMap((prev) => {
        const currentEdits = prev[id] || {};
        const updated: Partial<WorkOrder> = { ...currentEdits, [field]: value };

        // Synchronize runner and lumps aliases
        if (field === 'runnerQty') {
          updated.runnerWeightKg = value;
        } else if (field === 'runnerWeightKg') {
          updated.runnerQty = value;
        } else if (field === 'lumbesQty') {
          updated.lumpsWeightKg = value;
        } else if (field === 'lumpsWeightKg') {
          updated.lumbesQty = value;
        } else if (field === 'planDate') {
          updated.planDate = value;
          if (!updated.dueDate || /^\d{4}-\d{2}-\d{2}$/.test(updated.dueDate)) {
            updated.dueDate = value;
          }
        }
        return { ...prev, [id]: updated };
      });

      setDirtyRowIds((prev) => new Set(prev).add(id));
    } catch (err: any) {
      console.error('[handleCellChange error]', err);
      showToast(`⚠️ Error updating cell: ${err?.message || 'Invalid input'}`);
    }
  };

  const getItemStoreDestination = (itemCode: string) => {
    const itm = itemMap.get(itemCode);
    if (itm?.isDeflash || itm?.routingDestination === 'DEFLASH') {
      return { code: 'DEFLASH-STORE', label: 'DEFLASH (Deflash Store)', type: 'deflash' };
    }
    if (itm?.isAssembly || itm?.routingDestination === 'ASSEMBLY') {
      return { code: 'ASSEMBLY-STORE', label: 'ASSEMPLY (Assembly Store)', type: 'assembly' };
    }
    return { code: 'FG-STORE', label: 'DOL (Direct to FG-Store)', type: 'dol' };
  };

  // Task 1, 6 & 7: On Save, accumulate shift output into master WO record and clear ALL shift entry fields for next input
  const handleSaveRow = (id: string) => {
    try {
      const masterWO = masterWorkOrderMap.get(id);
      if (!masterWO) {
        showToast(`⚠️ Work order ${id} not found.`);
        return;
      }

      const edits = editedRowsMap[id] || {};
      const row: WorkOrder = { ...masterWO, ...edits };

      const prevGood = Number(masterWO.completed) || 0;
      const prevScrap = Number(masterWO.scrap) || 0;
      const prevDowntime = Number(masterWO.downtimeMin) || 0;
      const prevRunner = Number(masterWO.runnerWeightKg || masterWO.runnerQty) || 0;
      const prevLumps = Number(masterWO.lumpsWeightKg || masterWO.lumbesQty) || 0;

      const shiftGood = Number(row.completed) || 0;
      const shiftScrap = Number(row.scrap) || 0;
      const shiftDowntime = Number(row.downtimeMin) || 0;
      const shiftRunner = Number(row.runnerWeightKg || row.runnerQty) || 0;
      const shiftLumps = Number(row.lumpsWeightKg || row.lumbesQty) || 0;

      const newTotalGood = prevGood + shiftGood;
      const newTotalScrap = prevScrap + shiftScrap;
      const newTotalDowntime = prevDowntime + shiftDowntime;
      const newTotalRunner = prevRunner + shiftRunner;
      const newTotalLumps = prevLumps + shiftLumps;

      const plannedQty = Number(row.qty) || 1;
      const isTargetMatched = newTotalGood >= plannedQty;
      const newStatus = isTargetMatched ? 'completed' : 'in_progress';

      const updatedMasterWO: WorkOrder = {
        ...masterWO,
        completed: newTotalGood,
        scrap: newTotalScrap,
        downtimeMin: newTotalDowntime,
        runnerQty: newTotalRunner,
        runnerWeightKg: newTotalRunner,
        lumbesQty: newTotalLumps,
        lumpsWeightKg: newTotalLumps,
        status: newStatus as any,
        outputLogs: [
          ...(masterWO.outputLogs || []),
          {
            time: new Date().toLocaleTimeString(),
            good: shiftGood,
            scrap: shiftScrap,
            by: row.operator || 'Operator',
            rejReason: row.rejectionReason || '',
          },
        ],
        history: [
          ...(masterWO.history || []),
          {
            event: `Shift Log Saved: +${shiftGood} Good, +${shiftScrap} Scrap, +${shiftDowntime}m Downtime. Total: ${newTotalGood}/${plannedQty} PCS.`,
            time: new Date().toLocaleTimeString(),
          },
        ],
      };

      onUpdateWO(updatedMasterWO);
      onSyncWipLot?.(updatedMasterWO, 'grid_entry', `Accumulated shift production: +${shiftGood} Good PCS for ${id}`);

      // Task 1: Empty ALL shift entry fields in local edits buffer for the next shift entry
      setEditedRowsMap((prev) => {
        const next = { ...prev };
        next[id] = {
          completed: 0,
          scrap: 0,
          downtimeMin: 0,
          runnerQty: 0,
          runnerWeightKg: 0,
          lumbesQty: 0,
          lumpsWeightKg: 0,
          operator: '', // default empty operator for next shift
          remark: '',   // empty remark notes for next shift
          status: newStatus as any,
          rejectionBreakdown: [],
          downtimeIntervals: [],
        };
        return next;
      });

      setDirtyRowIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      const dest = getItemStoreDestination(row.item);
      showToast(
        `✅ Shift saved & summed for ${id}: +${shiftGood} Good PCS. Cumulative progress: ${newTotalGood.toLocaleString()}/${plannedQty.toLocaleString()} PCS (${dest.code}). All fields reset for next shift entry.${
          isTargetMatched ? ' 🔒 Target reached — Work Order completed & locked!' : ''
        }`
      );
    } catch (err: any) {
      console.error('[handleSaveRow error]', err);
      showToast(`❌ Error saving shift row: ${err?.message || 'Transaction failed'}`);
    }
  };

  const handleSaveAllDirty = () => {
    try {
      const idsToSave = Array.from(dirtyRowIds);
      if (!idsToSave.length) return;

      let savedCount = 0;
      idsToSave.forEach((id) => {
        handleSaveRow(id);
        savedCount++;
      });
      showToast(`🎉 Successfully saved, accumulated shift logs, and reset entry fields for ${savedCount} work orders.`);
    } catch (err: any) {
      console.error('[handleSaveAllDirty error]', err);
      showToast(`❌ Bulk save error: ${err?.message || 'Partial failure'}`);
    }
  };

  const handleDiscardAllDirty = () => {
    setEditedRowsMap({});
    setDirtyRowIds(new Set());
    showToast('Discarded all unsaved local changes.');
  };

  // Rejection Modal Callback
  const handleSaveRejectionBreakdown = (woId: string, breakdown: RejectionBreakdownItem[], totalScrap: number) => {
    try {
      const masterWO = masterWorkOrderMap.get(woId);
      if (!masterWO) return;

      const updated: WorkOrder = {
        ...masterWO,
        scrap: totalScrap,
        rejectionBreakdown: breakdown,
        rejectionReason: breakdown.map((b) => `${b.reason}: ${b.qty}`).join('; '),
      };
      onUpdateWO(updated);

      setEditedRowsMap((prev) => ({
        ...prev,
        [woId]: {
          ...(prev[woId] || {}),
          scrap: totalScrap,
          rejectionBreakdown: breakdown,
          rejectionReason: updated.rejectionReason,
        },
      }));
      setDirtyRowIds((prev) => new Set(prev).add(woId));
      showToast(`Saved ${breakdown.length} defect reasons (${totalScrap} pcs scrap) for ${woId}`);
    } catch (err: any) {
      console.error('[handleSaveRejectionBreakdown error]', err);
      showToast(`❌ Error saving defect breakdown: ${err?.message}`);
    }
  };

  // Downtime Modal Callback
  const handleSaveDowntimeIntervals = (woId: string, intervals: DowntimeIntervalItem[], totalDowntimeMin: number) => {
    try {
      const masterWO = masterWorkOrderMap.get(woId);
      if (!masterWO) return;

      const updated: WorkOrder = {
        ...masterWO,
        downtimeMin: totalDowntimeMin,
        downtimeIntervals: intervals,
        downtimeLogs: intervals.map((i) => ({
          time: i.fromTime,
          reason: i.reason,
          min: i.min,
          by: i.by || masterWO.operator,
        })),
      };
      onUpdateWO(updated);

      setEditedRowsMap((prev) => ({
        ...prev,
        [woId]: {
          ...(prev[woId] || {}),
          downtimeMin: totalDowntimeMin,
          downtimeIntervals: intervals,
          downtimeLogs: updated.downtimeLogs,
        },
      }));
      setDirtyRowIds((prev) => new Set(prev).add(woId));
      showToast(`Saved ${intervals.length} downtime intervals (${totalDowntimeMin} mins) for ${woId}`);
    } catch (err: any) {
      console.error('[handleSaveDowntimeIntervals error]', err);
      showToast(`❌ Error saving downtime: ${err?.message}`);
    }
  };

  // Manual Row Addition for Floor Operators (Task 3 Unique ID)
  const handleAddNewManualRow = () => {
    try {
      const newWoId = generateUniqueWorkOrderId([...manualRows, ...workOrders], 'WO-MAN');
      const defaultItem = items[0]?.code || 'FG-CTN-500';
      const defaultMachine = machines[0]?.id || 'IMM-250T-03';
      const dateToUse = selectedDate && selectedDate !== 'all' ? selectedDate : getTodayDateStr();

      const newRow: WorkOrder = {
        id: newWoId,
        item: defaultItem,
        bomId: 'BOM-1042-V1',
        machine: defaultMachine,
        day: 'Fri',
        qty: 1000,
        uom: 'PCS',
        completed: 0,
        scrap: 0,
        runnerQty: 0,
        lumbesQty: 0,
        runnerWeightKg: 0,
        lumpsWeightKg: 0,
        downtimeMin: 0,
        status: 'in_progress',
        sentToDailyProd: true,
        priority: 'Medium',
        dueDate: dateToUse,
        operator: '',
        shift: selectedShift !== 'all' ? selectedShift : 'Shift A',
        planDate: dateToUse,
        rejectionBreakdown: [],
        downtimeIntervals: [],
        outputLogs: [],
        downtimeLogs: [],
        checklist: [],
        history: [{ event: 'Manual production log entry created', time: new Date().toLocaleTimeString() }],
      };

      setManualRows((prev) => [newRow, ...prev]);
      setDirtyRowIds((prev) => new Set(prev).add(newWoId));
      onCreateWO(newRow);
      showToast(`➕ Added manual entry row ${newWoId}`);
    } catch (err: any) {
      console.error('[handleAddNewManualRow error]', err);
      showToast(`❌ Error creating manual row: ${err?.message}`);
    }
  };

  // Duplicate Row (Task 3 Unique ID)
  const handleDuplicateRow = (row: WorkOrder) => {
    try {
      const basePrefix = (row.id || 'COPY').replace(/^WO-/, '');
      const duplicatedId = generateUniqueWorkOrderId([...manualRows, ...workOrders], `WO-${basePrefix}-B`);
      const duplicatedRow: WorkOrder = {
        ...row,
        id: duplicatedId,
        completed: 0,
        scrap: 0,
        runnerQty: 0,
        lumbesQty: 0,
        runnerWeightKg: 0,
        lumpsWeightKg: 0,
        downtimeMin: 0,
        rejectionBreakdown: [],
        downtimeIntervals: [],
        status: 'in_progress',
        sentToDailyProd: true,
        operator: '',
        history: [{ event: `Cloned from ${row.id}`, time: new Date().toLocaleTimeString() }],
      };

      setManualRows((prev) => [duplicatedRow, ...prev]);
      setDirtyRowIds((prev) => new Set(prev).add(duplicatedId));
      onCreateWO(duplicatedRow);
      showToast(`📋 Duplicated ${row.id} as unique ${duplicatedId}`);
    } catch (err: any) {
      console.error('[handleDuplicateRow error]', err);
      showToast(`❌ Error duplicating row: ${err?.message}`);
    }
  };

  // Bulk Field Apply
  const handleApplyBulkUpdate = () => {
    try {
      if (!selectedRowIds.length || !bulkValue) return;

      selectedRowIds.forEach((id) => {
        const masterWO = masterWorkOrderMap.get(id);
        if (masterWO) {
          const updated = { ...masterWO, [bulkField]: bulkValue };
          onUpdateWO(updated);
        }
      });

      setEditedRowsMap((prev) => {
        const next = { ...prev };
        selectedRowIds.forEach((id) => {
          next[id] = { ...(next[id] || {}), [bulkField]: bulkValue };
        });
        return next;
      });

      setIsBulkModalOpen(false);
      showToast(`Bulk updated ${selectedRowIds.length} work orders: ${bulkField} = ${bulkValue}`);
      setSelectedRowIds([]);
    } catch (err: any) {
      console.error('[handleApplyBulkUpdate error]', err);
      showToast(`❌ Bulk update failed: ${err?.message}`);
    }
  };

  // Excel / CSV Import Handler
  const handleImportProductionData = (importedRows: Partial<WorkOrder>[], mode: 'update' | 'append') => {
    try {
      const dateToUse = selectedDate && selectedDate !== 'all' ? selectedDate : getTodayDateStr();

      if (mode === 'update') {
        const newDirty = new Set(dirtyRowIds);
        importedRows.forEach((imp) => {
          if (!imp.id) return;
          const masterWO = masterWorkOrderMap.get(imp.id) || masterWorkOrderMap.get(imp.id.toLowerCase());
          if (masterWO) {
            const merged: WorkOrder = {
              ...masterWO,
              completed: imp.completed !== undefined ? imp.completed : masterWO.completed,
              scrap: imp.scrap !== undefined ? imp.scrap : masterWO.scrap,
              runnerQty: imp.runnerQty !== undefined ? imp.runnerQty : masterWO.runnerQty,
              lumbesQty: imp.lumbesQty !== undefined ? imp.lumbesQty : masterWO.lumbesQty,
              runnerWeightKg: imp.runnerWeightKg !== undefined ? imp.runnerWeightKg : masterWO.runnerWeightKg,
              lumpsWeightKg: imp.lumpsWeightKg !== undefined ? imp.lumpsWeightKg : masterWO.lumpsWeightKg,
              downtimeMin: imp.downtimeMin !== undefined ? imp.downtimeMin : masterWO.downtimeMin,
              rejectionBreakdown: imp.rejectionBreakdown || masterWO.rejectionBreakdown,
              downtimeIntervals: imp.downtimeIntervals || masterWO.downtimeIntervals,
              operator: imp.operator || masterWO.operator,
              shift: imp.shift || masterWO.shift,
              machine: imp.machine || masterWO.machine,
              status: imp.status || masterWO.status,
            };
            onUpdateWO(merged);
            newDirty.add(merged.id);
            onSyncWipLot?.(merged, 'excel_csv_upload', `Reconciled from Excel/CSV for ${merged.id}`);
          }
        });
        setDirtyRowIds(newDirty);
        showToast(`Import reconciled ${importedRows.length} work orders from spreadsheet.`);
      } else {
        // Append mode
        const newItems: WorkOrder[] = importedRows.map((imp, idx) => ({
          id: imp.id || `WO-IMP-${Date.now()}-${idx + 1}`,
          item: imp.item || 'FG-CTN-500',
          bomId: 'BOM-1042-V1',
          machine: imp.machine || 'IMM-250T-03',
          day: 'Fri',
          qty: imp.qty || 1000,
          uom: 'PCS',
          completed: imp.completed || 0,
          scrap: imp.scrap || 0,
          runnerQty: imp.runnerQty || 0,
          lumbesQty: imp.lumbesQty || 0,
          runnerWeightKg: imp.runnerWeightKg || 0,
          lumpsWeightKg: imp.lumpsWeightKg || 0,
          downtimeMin: imp.downtimeMin || 0,
          status: imp.status || 'in_progress',
          priority: 'Medium',
          dueDate: dateToUse,
          operator: imp.operator || '',
          shift: imp.shift || 'Shift A',
          planDate: dateToUse,
          rejectionBreakdown: imp.rejectionBreakdown || [],
          downtimeIntervals: imp.downtimeIntervals || [],
          outputLogs: [],
          downtimeLogs: imp.downtimeLogs || [],
          checklist: [],
          history: [{ event: 'Imported from Excel as new batch record', time: new Date().toLocaleTimeString() }],
        }));

        newItems.forEach((item) => {
          onCreateWO(item);
          onSyncWipLot?.(item, 'excel_csv_upload', `Appended from Excel/CSV for ${item.id}`);
        });
        setManualRows((prev) => [...newItems, ...prev]);
        showToast(`Imported and dispatched ${newItems.length} new production orders.`);
      }
    } catch (err: any) {
      console.error('[handleImportProductionData error]', err);
      showToast(`❌ Error during Excel/CSV import: ${err?.message}`);
    }
  };

  // Export Filtered Records to Excel
  const handleExportToExcel = () => {
    try {
      const exportData = filteredGridRows.map((r) => {
        const rejStr = (r.rejectionBreakdown || []).map((rej) => `${rej.reason}:${rej.qty}`).join('; ');
        const dwnStr = (r.downtimeIntervals || []).map((d) => `${d.fromTime}-${d.toTime}:${d.reason}`).join('; ');
        const master = masterWorkOrderMap.get(r.id) || r;
        const totalCumGood = master.completed || 0;
        const totalProduced = totalCumGood + (master.scrap || 0);
        const scrapPct = totalProduced > 0 ? (((master.scrap || 0) / totalProduced) * 100).toFixed(1) : '0.0';

        return {
          'WO Number': r.id,
          Date: r.planDate || getRowDate(r),
          'Item Code': r.item,
          'Item Name': itemName(r.item),
          'Machine Bay': r.machine || 'Unassigned',
          Shift: r.shift || 'Shift A',
          'Planned Qty': r.qty,
          'Cumulative Good (Master)': totalCumGood,
          'Current Shift Good Entry': r.completed,
          'Scrap Qty': r.scrap,
          'Scrap %': `${scrapPct}%`,
          'Rejection Reasons': rejStr || r.rejectionReason || '',
          'Downtime (min)': r.downtimeMin,
          'Downtime Intervals': dwnStr || '',
          'Runner Regrind (kg)': r.runnerQty || r.runnerWeightKg || 0,
          'Lumps Purge (kg)': r.lumbesQty || r.lumpsWeightKg || 0,
          'Lead Operator': r.operator,
          Status: r.status,
          Remarks: r.remark || '',
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Production_Data');
      const filename = `Daily_Production_Export_${selectedDate || 'all'}_${selectedShift}.xlsx`;
      XLSX.writeFile(workbook, filename);
      showToast(`Exported ${exportData.length} production rows to ${filename}`);
    } catch (err: any) {
      console.error('[handleExportToExcel error]', err);
      showToast(`❌ Export failed: ${err?.message}`);
    }
  };

  // Summary Totals for KPI Telemetry Bar
  const totalPlanned = filteredGridRows.reduce((sum, r) => sum + (Number(r.qty) || 0), 0);
  const totalGood = filteredGridRows.reduce((sum, r) => {
    const master = masterWorkOrderMap.get(r.id) || r;
    return sum + (Number(master.completed) || 0);
  }, 0);
  const totalScrap = filteredGridRows.reduce((sum, r) => {
    const master = masterWorkOrderMap.get(r.id) || r;
    return sum + (Number(master.scrap) || 0);
  }, 0);
  const totalRunner = filteredGridRows.reduce((sum, r) => {
    const master = masterWorkOrderMap.get(r.id) || r;
    return sum + (Number(master.runnerWeightKg || master.runnerQty) || 0);
  }, 0);
  const totalLumps = filteredGridRows.reduce((sum, r) => {
    const master = masterWorkOrderMap.get(r.id) || r;
    return sum + (Number(master.lumpsWeightKg || master.lumbesQty) || 0);
  }, 0);
  const totalDowntimeMin = filteredGridRows.reduce((sum, r) => {
    const master = masterWorkOrderMap.get(r.id) || r;
    return sum + (Number(master.downtimeMin) || 0);
  }, 0);
  const totalDowntimeHours = (totalDowntimeMin / 60).toFixed(1);

  const totalProduced = totalGood + totalScrap;
  const overallScrapRate = totalProduced > 0 ? ((totalScrap / totalProduced) * 100).toFixed(1) : '0.0';
  const planCompletionRate = totalPlanned > 0 ? ((totalGood / totalPlanned) * 100).toFixed(1) : '0.0';

  // Enterprise Pagination Calculations
  const totalRecordsCount = filteredGridRows.length;
  const totalGridPages = Math.max(1, Math.ceil(totalRecordsCount / gridPageSize));
  const safeCurrentPage = Math.min(Math.max(1, gridPage), totalGridPages);
  
  const startIndex = (safeCurrentPage - 1) * gridPageSize;
  const endIndex = Math.min(startIndex + gridPageSize, totalRecordsCount);
  const pagedGridRows = filteredGridRows.slice(startIndex, endIndex);

  // Jump to Page Handler
  const handleJumpToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(jumpPageInput, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalGridPages) {
      setGridPage(pageNum);
      setJumpPageInput('');
    } else {
      showToast(`⚠️ Please enter a valid page between 1 and ${totalGridPages}`);
    }
  };

  // Generate Page Numbers with smart ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalGridPages <= 7) {
      for (let i = 1; i <= totalGridPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safeCurrentPage > 3) pages.push('...');
      const start = Math.max(2, safeCurrentPage - 1);
      const end = Math.min(totalGridPages - 1, safeCurrentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (safeCurrentPage < totalGridPages - 2) pages.push('...');
      pages.push(totalGridPages);
    }
    return pages;
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. Senior Executive Header & Action Hub (Task 3: Title is strictly 'Daily Production') */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E4E0D6] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#0F8B8D]/10 text-[#0F8B8D] border border-[#0F8B8D]/20">
              Shift Operations &bull; High-Speed Plant Entry Engine
            </span>
            <span className="text-[11px] text-[#6B7280]">
              200K+ High-Throughput Engine &bull; Dual-Level Pagination &bull; Auto-Sync Shop Floor
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#14213D] tracking-tight">Daily Production</h1>
        </div>

        {/* Global Toolbar Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {dirtyRowIds.size > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 p-1 rounded-xl">
              <button
                type="button"
                onClick={handleSaveAllDirty}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all animate-pulse cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" /> Save Changes ({dirtyRowIds.size})
              </button>
              <button
                type="button"
                onClick={handleDiscardAllDirty}
                className="px-2.5 py-1.5 rounded-lg hover:bg-amber-100 text-amber-900 text-xs font-semibold transition-colors cursor-pointer"
                title="Discard all unsaved edits"
              >
                Discard
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsExcelModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-[#0F8B8D] hover:bg-[#0c7072] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Excel / CSV
          </button>

          <button
            type="button"
            onClick={handleExportToExcel}
            className="px-3 py-2 rounded-xl bg-white hover:bg-[#F6F4EF] border border-[#E4E0D6] text-[#14213D] text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Export filtered records to Excel"
          >
            <Download className="w-3.5 h-3.5 text-[#0F8B8D]" />
            Export Excel
          </button>
        </div>
      </div>

      {/* 2. Executive Shift KPI Telemetry Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Planned Target */}
        <div className="bg-white p-3.5 rounded-2xl border border-[#E4E0D6] shadow-2xs">
          <div className="text-[10px] uppercase font-bold tracking-wider text-[#6B7280] flex items-center justify-between">
            <span>Planned Target</span>
            <Layers className="w-3.5 h-3.5 text-[#9CA3AF]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#14213D] mt-1">
            {totalPlanned.toLocaleString()} <span className="text-xs font-sans font-normal text-[#6B7280]">pcs</span>
          </div>
          <div className="text-[10px] text-[#6B7280] mt-0.5">
            {totalRecordsCount.toLocaleString()} matching orders
          </div>
        </div>

        {/* Actual Good Output */}
        <div className="bg-white p-3.5 rounded-2xl border border-[#E4E0D6] shadow-2xs">
          <div className="text-[10px] uppercase font-bold tracking-wider text-[#6B7280] flex items-center justify-between">
            <span>Actual Good</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
            {totalGood.toLocaleString()} <span className="text-xs font-sans font-normal text-[#6B7280]">pcs</span>
          </div>
          <div className="text-[10px] font-semibold text-emerald-800 mt-0.5">
            {planCompletionRate}% of target plan
          </div>
        </div>

        {/* Total Rejections / Scrap */}
        <div className="bg-white p-3.5 rounded-2xl border border-[#E4E0D6] shadow-2xs">
          <div className="text-[10px] uppercase font-bold tracking-wider text-[#6B7280] flex items-center justify-between">
            <span>Scrap &amp; Defect Pcs</span>
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-700 mt-1">
            {totalScrap.toLocaleString()} <span className="text-xs font-sans font-normal text-[#6B7280]">pcs</span>
          </div>
          <div className="text-[10px] font-semibold text-rose-800 mt-0.5 flex items-center gap-1">
            <span>{overallScrapRate}% scrap rate</span>
            {Number(overallScrapRate) > 5 && (
              <span className="text-[9px] px-1 bg-rose-100 rounded text-rose-900 font-bold">High</span>
            )}
          </div>
        </div>

        {/* Cold Runner Scrap */}
        <div className="bg-white p-3.5 rounded-2xl border border-[#E4E0D6] shadow-2xs">
          <div className="text-[10px] uppercase font-bold tracking-wider text-[#6B7280] flex items-center justify-between">
            <span>Runner Scrap</span>
            <Scale className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div className="text-xl font-bold font-mono text-teal-800 mt-1">
            {totalRunner.toFixed(1)} <span className="text-xs font-sans font-normal text-[#6B7280]">kg</span>
          </div>
          <div className="text-[10px] text-[#6B7280] mt-0.5">
            Cold runner regrind mass
          </div>
        </div>

        {/* Purge Lumps / Lumbs */}
        <div className="bg-white p-3.5 rounded-2xl border border-[#E4E0D6] shadow-2xs">
          <div className="text-[10px] uppercase font-bold tracking-wider text-[#6B7280] flex items-center justify-between">
            <span>Lumps / Purge</span>
            <Flame className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-800 mt-1">
            {totalLumps.toFixed(1)} <span className="text-xs font-sans font-normal text-[#6B7280]">kg</span>
          </div>
          <div className="text-[10px] text-[#6B7280] mt-0.5">
            Startup &amp; barrel flush lumps
          </div>
        </div>

        {/* Machine Downtime */}
        <div className="bg-white p-3.5 rounded-2xl border border-[#E4E0D6] shadow-2xs">
          <div className="text-[10px] uppercase font-bold tracking-wider text-[#6B7280] flex items-center justify-between">
            <span>Lost Downtime</span>
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="text-xl font-bold font-mono text-indigo-900 mt-1">
            {totalDowntimeMin.toLocaleString()} <span className="text-xs font-sans font-normal text-[#6B7280]">min</span>
          </div>
          <div className="text-[10px] text-[#6B7280] mt-0.5">
            {totalDowntimeHours} hrs total stops
          </div>
        </div>
      </div>

      {/* 3. Comprehensive Control Toolbar & Quick Filters */}
      <div className="bg-white p-4 rounded-2xl border border-[#E4E0D6] shadow-xs space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Search Query */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search WO#, item SKU, bay machine, operator..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E4E0D6] bg-white font-medium text-[#14213D] focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none"
            />
          </div>

          {/* Date Picker Filter with Preset Bar */}
          <div className="relative flex items-center">
            <Calendar className="w-4 h-4 text-[#0F8B8D] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setGridPage(1);
              }}
              title="Filter grid by specific production date"
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-[#E4E0D6] font-semibold text-[#14213D] bg-white focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none"
            />
            {selectedDate && selectedDate !== 'all' && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDate('');
                  setGridPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#14213D] p-0.5 rounded transition-colors cursor-pointer"
                title="Clear date filter (show all dates)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Shift Filter */}
          <select
            value={selectedShift}
            onChange={(e) => setSelectedShift(e.target.value)}
            className="w-full p-2 rounded-xl border border-[#E4E0D6] bg-white font-semibold text-[#14213D] focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none"
          >
            <option value="all">All Shifts (24 Hours)</option>
            <option value="Shift A">Shift A (06:00 - 14:00)</option>
            <option value="Shift B">Shift B (14:00 - 22:00)</option>
            <option value="Shift C">Shift C (22:00 - 06:00)</option>
          </select>

          {/* Machine Filter */}
          <select
            value={selectedMachineFilter}
            onChange={(e) => setSelectedMachineFilter(e.target.value)}
            className="w-full p-2 rounded-xl border border-[#E4E0D6] bg-white font-semibold text-[#14213D] focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none"
          >
            <option value="all">All Machine Bays</option>
            {machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.id} &mdash; {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Filter Pills & Batch Selection Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#F1EFE9]">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <span className="text-[11px] font-bold text-[#6B7280] mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> View:
            </span>
            {[
              { id: 'all', label: `All Records (${totalRecordsCount.toLocaleString()})` },
              { id: 'rejections', label: 'Has Rejections' },
              { id: 'downtime', label: 'Has Downtime' },
              { id: 'runner', label: 'With Runner/Lumps' },
              { id: 'dirty', label: `Unsaved Changes (${dirtyRowIds.size})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilterTab(tab.id as any)}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
                  activeFilterTab === tab.id
                    ? 'bg-[#14213D] text-white shadow-2xs'
                    : 'bg-[#FAF9F5] text-[#6B7280] hover:text-[#14213D] hover:bg-[#F6F4EF] border border-[#E4E0D6]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Selected Rows Batch Bar */}
          {selectedRowIds.length > 0 && (
            <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-xl text-xs font-bold text-purple-950 shadow-2xs">
              <span>{selectedRowIds.length} Rows Selected</span>
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-[11px] font-bold transition-colors cursor-pointer"
              >
                Bulk Update &rarr;
              </button>
              <button
                type="button"
                onClick={() => setSelectedRowIds([])}
                className="text-[#6B7280] hover:text-[#14213D] text-[11px] underline ml-1 cursor-pointer"
              >
                Deselect
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. High-Performance Editable Grid Table with Dual Pagination */}
      <div className="bg-white rounded-2xl border border-[#E4E0D6] shadow-xs overflow-hidden">
        {/* User-Friendly Top Operational & Pagination Bar */}
        <div className="bg-[#FAF9F5] px-4 py-3 border-b border-[#E4E0D6] flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Left: Active Records Count & Date Filter Tag */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 font-medium text-[#14213D]">
              <span className="font-bold text-sm font-mono bg-white px-2.5 py-0.5 rounded-md border border-[#E4E0D6] text-[#14213D] shadow-2xs">
                {totalRecordsCount.toLocaleString()}
              </span>
              <span className="text-[#6B7280]">
                {totalRecordsCount === 1 ? 'Work Order' : 'Work Orders'}
              </span>
              {selectedDate && selectedDate !== 'all' && selectedDate.trim() !== '' ? (
                <span className="inline-flex items-center gap-1 bg-teal-50 text-[#0F8B8D] border border-teal-200 px-2 py-0.5 rounded-md font-mono font-bold text-[11px]">
                  <Calendar className="w-3 h-3 text-[#0F8B8D]" />
                  {selectedDate}
                </span>
              ) : (
                <span className="text-[#6B7280] text-[11px] font-medium bg-[#F6F4EF] px-2 py-0.5 rounded border border-[#E4E0D6]">
                  All Dates ({allCombinedOrders.length.toLocaleString()} total)
                </span>
              )}
            </div>

            {selectedDate && selectedDate !== 'all' && selectedDate.trim() !== '' && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDate('');
                  setGridPage(1);
                }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white hover:bg-[#F6F4EF] border border-[#E4E0D6] text-[11px] font-semibold text-[#6B7280] hover:text-[#14213D] transition-colors cursor-pointer"
                title="Clear date filter to show all work orders"
              >
                <X className="w-3 h-3 text-[#9CA3AF]" />
                Show All Dates
              </button>
            )}

            {dirtyRowIds.size > 0 && (
              <div className="flex items-center gap-1.5 ml-2">
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold animate-pulse">
                  {dirtyRowIds.size} modified
                </span>
                <button
                  type="button"
                  onClick={handleSaveAllDirty}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                >
                  <Save className="w-3 h-3" /> Save All
                </button>
              </div>
            )}
          </div>

          {/* Right: Rows Per Page & Fast Pagination Controls */}
          <div className="flex items-center gap-2.5 font-medium ml-auto flex-wrap">
            {/* View Mode Toggle: Floor vs Full */}
            <div className="flex items-center bg-white rounded-lg border border-[#E4E0D6] p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setIsCompactView(false)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  !isCompactView
                    ? 'bg-[#14213D] text-white shadow-2xs'
                    : 'text-[#6B7280] hover:text-[#14213D]'
                }`}
                title="Full Grid View: All operational columns"
              >
                Full Grid
              </button>
              <button
                type="button"
                onClick={() => setIsCompactView(true)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  isCompactView
                    ? 'bg-[#0F8B8D] text-white shadow-2xs'
                    : 'text-[#6B7280] hover:text-[#14213D]'
                }`}
                title="Floor View: Essential columns for fast shift entry with zero horizontal scroll"
              >
                Floor View
              </button>
            </div>

            {/* Page Size Selector (20, 50, 100, 250, 500) */}
            <div className="flex items-center gap-1.5 text-[#6B7280]">
              <span className="text-[11px]">Page Size:</span>
              <select
                value={gridPageSize}
                onChange={(e) => {
                  setGridPageSize(Number(e.target.value));
                  setGridPage(1);
                }}
                className="px-2 py-1 rounded-lg border border-[#E4E0D6] bg-white font-semibold text-[#14213D] text-xs focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none"
              >
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
                <option value={250}>250 / page</option>
                <option value={500}>500 / page</option>
              </select>
            </div>

            {/* Top Quick Navigation Buttons */}
            {totalGridPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={safeCurrentPage <= 1}
                  onClick={() => setGridPage(1)}
                  className="p-1 rounded-md bg-white border border-[#E4E0D6] text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#F6F4EF] transition-colors cursor-pointer"
                  title="First Page"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={safeCurrentPage <= 1}
                  onClick={() => setGridPage((p) => Math.max(1, p - 1))}
                  className="p-1 rounded-md bg-white border border-[#E4E0D6] text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#F6F4EF] transition-colors cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono text-[#6B7280] px-1.5 font-bold">
                  {safeCurrentPage} / {totalGridPages}
                </span>
                <button
                  type="button"
                  disabled={safeCurrentPage >= totalGridPages}
                  onClick={() => setGridPage((p) => Math.min(totalGridPages, p + 1))}
                  className="p-1 rounded-md bg-white border border-[#E4E0D6] text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#F6F4EF] transition-colors cursor-pointer"
                  title="Next Page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={safeCurrentPage >= totalGridPages}
                  onClick={() => setGridPage(totalGridPages)}
                  className="p-1 rounded-md bg-white border border-[#E4E0D6] text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#F6F4EF] transition-colors cursor-pointer"
                  title="Last Page"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable table container */}
        <div className="overflow-x-auto max-h-[660px] overflow-y-auto scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <table className={`w-full text-xs border-collapse ${isCompactView ? 'min-w-full' : 'min-w-[1180px]'}`}>
            <thead className="sticky top-0 z-20 bg-[#F6F4EF] text-[#6B7280] shadow-xs select-none">
              <tr className="border-b border-[#E4E0D6]">
                <th className="p-2.5 text-center w-9 sticky left-0 bg-[#F6F4EF] z-30">
                  <input
                    type="checkbox"
                    checked={selectedRowIds.length === pagedGridRows.length && pagedGridRows.length > 0}
                    onChange={() => {
                      if (selectedRowIds.length === pagedGridRows.length) {
                        setSelectedRowIds([]);
                      } else {
                        setSelectedRowIds(pagedGridRows.map((r) => r.id));
                      }
                    }}
                    className="rounded text-[#0F8B8D] cursor-pointer"
                  />
                </th>
                <th className="p-2.5 text-center font-bold w-10">Seq</th>
                <th className="p-2.5 text-left font-bold w-28 sticky left-9 bg-[#F6F4EF] z-30">WO #</th>
                <th className="p-2.5 text-left font-bold w-32">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#0F8B8D]" />
                    <span>Date</span>
                  </div>
                </th>
                <th className="p-2.5 text-left font-bold min-w-[140px]">Product Item</th>
                <th className="p-2.5 text-left font-bold w-28">Bay Machine</th>
                <th className="p-2.5 text-left font-bold w-24">Shift</th>
                <th className="p-2.5 text-right font-bold w-20">Planned</th>
                <th className="p-2.5 text-right font-bold w-22">Good Output</th>
                <th className="p-2.5 text-left font-bold w-28">Status</th>
                <th className="p-2.5 text-left font-bold w-28">Lead Operator</th>
                {!isCompactView && <th className="p-2.5 text-left font-bold w-32">Remarks</th>}
                <th className="p-2.5 text-center font-bold w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E0D6]">
              {pagedGridRows.length > 0 ? (
                pagedGridRows.map((row, idx) => {
                  const globalIdx = (safeCurrentPage - 1) * gridPageSize + idx + 1;
                  const isDirty = dirtyRowIds.has(row.id);
                  const isSelected = selectedRowIds.includes(row.id);
                  const masterWO = masterWorkOrderMap.get(row.id) || row;
                  const isExpanded = expandedRowIds.includes(row.id);
                  const masterCompleted = Number(masterWO.completed) || 0;
                  const plannedTarget = Number(row.qty) || 1;
                  const isCompletedLocked = masterCompleted >= plannedTarget || row.status === 'completed';

                  const totalProduced = masterCompleted + (Number(masterWO.scrap) || 0);
                  const scrapPct = totalProduced > 0 ? (((Number(masterWO.scrap) || 0) / totalProduced) * 100).toFixed(1) : '0.0';

                  return (
                    <React.Fragment key={row.id || `row-${idx}`}>
                      <tr
                        className={`hover:bg-[#FDFBF7] transition-colors ${
                          isDirty ? 'bg-amber-50/40' : ''
                        } ${isSelected ? 'bg-purple-50/40' : ''} ${isCompletedLocked ? 'bg-emerald-50/20' : ''}`}
                      >
                        {/* Checkbox */}
                        <td className="p-2 text-center sticky left-0 bg-white z-10">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              setSelectedRowIds((prev) =>
                                prev.includes(row.id) ? prev.filter((r) => r !== row.id) : [...prev, row.id]
                              );
                            }}
                            className="rounded text-[#0F8B8D] cursor-pointer"
                          />
                        </td>

                        {/* Sequence */}
                        <td className="p-2 font-mono text-center text-[#6B7280] text-xs">#{globalIdx}</td>

                        {/* WO # (Task 5: Click leads to Work Order screen) */}
                        <td className="p-2 font-mono font-bold text-[#0F8B8D] sticky left-9 bg-white z-10 text-xs">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onNavigate('woDetail', { id: row.id })}
                              className="hover:underline font-bold text-left flex items-center gap-1 text-[#0F8B8D] hover:text-[#0c7072] cursor-pointer"
                              title="Click to view full Work Order details screen"
                            >
                              <span>{row.id}</span>
                              <ExternalLink className="w-3 h-3 text-[#9CA3AF] opacity-70 hover:opacity-100" />
                            </button>
                            {isCompletedLocked && (
                              <span className="px-1 py-0.2 rounded text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                DONE
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Date Field */}
                        <td className="p-1.5">
                          <input
                            type="date"
                            disabled={isCompletedLocked}
                            value={row.planDate || getRowDate(row)}
                            onChange={(e) => handleCellChange(row.id, 'planDate', e.target.value)}
                            className="w-full px-2 py-1 rounded-md border border-[#E4E0D6] bg-white font-mono text-xs font-semibold text-[#14213D] focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none disabled:bg-slate-100"
                            title="Production Date"
                          />
                        </td>

                        {/* Product Item */}
                        <td className="p-1.5">
                          <div className="font-semibold text-[#14213D] truncate max-w-[170px] text-xs" title={itemName(row.item)}>
                            {itemName(row.item)}
                          </div>
                          <div className="text-[10px] font-mono text-[#6B7280] truncate max-w-[170px]">{row.item}</div>
                          {(() => {
                            const dest = getItemStoreDestination(row.item);
                            return (
                              <div className="mt-0.5">
                                {dest.type === 'dol' && (
                                  <span
                                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    title="DOL: Direct On Line to FG-STORE"
                                  >
                                    DOL &rarr; FG-Store
                                  </span>
                                )}
                                {dest.type === 'assembly' && (
                                  <span
                                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200"
                                    title="ASSEMPLY: Routed to ASSEMBLY-STORE"
                                  >
                                    ASSEMPLY &rarr; Assembly Store
                                  </span>
                                )}
                                {dest.type === 'deflash' && (
                                  <span
                                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200"
                                    title="DEFLASH: Routed to DEFLASH-STORE"
                                  >
                                    DEFLASH &rarr; Deflash Store
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </td>

                        {/* Machine Bay (Task 1: Read-Only / Non-Editable by default) */}
                        <td className="p-1.5">
                          <span
                            className="px-2 py-1 bg-slate-100/90 rounded-md font-mono text-xs font-semibold text-[#14213D] border border-[#E4E0D6] block truncate"
                            title={`Assigned Machine Bay: ${row.machine || 'Unassigned'}`}
                          >
                            {row.machine || 'Unassigned'}
                          </span>
                        </td>

                        {/* Shift Select */}
                        <td className="p-1.5">
                          <select
                            disabled={isCompletedLocked}
                            value={row.shift || 'Shift A'}
                            onChange={(e) => handleCellChange(row.id, 'shift', e.target.value)}
                            className="w-full px-1.5 py-1 rounded-md border border-[#E4E0D6] bg-white text-xs font-semibold text-[#14213D] focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none disabled:bg-slate-100"
                          >
                            <option value="Shift A">Shift A</option>
                            <option value="Shift B">Shift B</option>
                            <option value="Shift C">Shift C</option>
                          </select>
                        </td>

                        {/* Planned Qty (Task 4: NOT editable; Task 5: Plus button for cumulative sum) */}
                        <td className="p-1.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => toggleExpandRow(row.id)}
                              className={`p-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                                isExpanded
                                  ? 'bg-indigo-600 text-white shadow-2xs'
                                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                              }`}
                              title="Click (+) to view cumulative Good Output, Scrap, Downtime & Runner breakdown"
                            >
                              {isExpanded ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3 stroke-[3]" />}
                            </button>
                            <span
                              className="w-16 px-1.5 py-1 rounded-md border border-[#E4E0D6] bg-slate-100/90 font-mono text-right font-bold text-[#14213D] text-xs inline-block"
                              title="Fixed Planned Target"
                            >
                              {plannedTarget.toLocaleString()}
                            </span>
                          </div>
                        </td>

                        {/* Actual Good Output Shift Entry */}
                        <td className="p-1.5">
                          <div className="flex items-center gap-1">
                            {isCompletedLocked ? (
                              <div
                                className="flex items-center justify-center gap-1 px-1.5 py-1 bg-emerald-100/90 border border-emerald-300 rounded-md text-[11px] font-bold text-emerald-900 flex-1"
                                title="Work order target fulfilled and locked"
                              >
                                <Lock className="w-3 h-3 text-emerald-700 shrink-0" />
                                <span>{masterCompleted.toLocaleString()}</span>
                              </div>
                            ) : (
                              <input
                                type="number"
                                min="0"
                                max={plannedTarget}
                                value={row.completed || ''}
                                placeholder="0"
                                onChange={(e) => handleCellChange(row.id, 'completed', parseInt(e.target.value, 10) || 0)}
                                className="w-full min-w-[56px] px-2 py-1 rounded-md border border-emerald-300 bg-emerald-50/40 font-mono text-right font-bold text-emerald-800 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                title={`Enter shift good output (Max remaining: ${Math.max(0, plannedTarget - masterCompleted)} PCS)`}
                              />
                            )}
                            <button
                              type="button"
                              onClick={() => toggleExpandRow(row.id)}
                              className={`p-1 rounded-md text-xs font-bold transition-all cursor-pointer shrink-0 ${
                                isExpanded
                                  ? 'bg-amber-600 text-white shadow-2xs'
                                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                              }`}
                              title="Click (+) to open Scrap, Downtime, Runner & Lumps Entry and details"
                            >
                              {isExpanded ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3 stroke-[3]" />}
                            </button>
                          </div>
                        </td>

                        {/* Status Select */}
                        <td className="p-1.5">
                          <select
                            disabled={isCompletedLocked}
                            value={row.status}
                            onChange={(e) => handleCellChange(row.id, 'status', e.target.value as any)}
                            className="w-full px-1.5 py-1 rounded-md border border-[#E4E0D6] bg-white text-xs font-semibold text-[#14213D] focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none disabled:bg-slate-100"
                          >
                            <option value="planned">Planned</option>
                            <option value="released">Released</option>
                            <option value="in_progress">In Progress</option>
                            <option value="quality_hold">Quality Hold</option>
                            <option value="completed">Completed</option>
                          </select>
                        </td>

                        {/* Lead Operator Autocomplete */}
                        <td className="p-1.5 min-w-[130px]">
                          {isCompletedLocked ? (
                            <span className="text-xs text-slate-400 italic">Locked</span>
                          ) : (
                            <JitOperatorAutocomplete
                              value={row.operator || ''}
                              onChange={(op) => handleCellChange(row.id, 'operator', op)}
                              placeholder="Operator..."
                              allowCreate={true}
                            />
                          )}
                        </td>

                        {/* Shift Remarks (Hidden in Floor View) */}
                        {!isCompactView && (
                          <td className="p-1.5">
                            <input
                              type="text"
                              disabled={isCompletedLocked}
                              placeholder="Log notes..."
                              value={row.remark || ''}
                              onChange={(e) => handleCellChange(row.id, 'remark', e.target.value)}
                              className="w-full px-2 py-1 rounded-md border border-[#E4E0D6] bg-white text-[11px] text-[#4B5563] placeholder:text-[#9CA3AF] focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none disabled:bg-slate-100"
                            />
                          </td>
                        )}

                        {/* Action Cell (Task 2 & 4: Save + Material & BOM Reconcile Plus Button + Duplicate) */}
                        <td className="p-1.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {isDirty ? (
                              <button
                                type="button"
                                onClick={() => handleSaveRow(row.id)}
                                className="p-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-2xs transition-transform active:scale-95 cursor-pointer"
                                title="Save & Accumulate Shift Log into Master Work Order"
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="p-1 text-emerald-600 font-bold" title="Synchronized">
                                <Check className="w-4 h-4" />
                              </span>
                            )}

                            {/* Task 2 & 4: Material & Store Reconcile / BOM Version Switcher Plus Button */}
                            <button
                              type="button"
                              onClick={() => setMaterialReconcileWO(row)}
                              className="p-1.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-0.5"
                              title="Verify Material (+pck +bop +con), Switch BOM Version & Minus from Store"
                            >
                              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                              <Layers className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDuplicateRow(row)}
                              className="p-1 text-[#9CA3AF] hover:text-[#14213D] hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                              title="Duplicate row for next run"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Interactive Entry & Cumulative Panel shown when (+) clicked */}
                      {isExpanded && (
                        <tr className="bg-amber-50/30 border-b border-amber-200/60">
                          <td colSpan={isCompactView ? 10 : 11} className="p-3">
                            <div className="bg-white border border-amber-200/80 rounded-xl p-4 shadow-sm space-y-3.5">
                              {/* Header */}
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-extrabold text-amber-950 text-xs px-2 py-0.5 rounded bg-amber-100 border border-amber-300">
                                    {row.id}
                                  </span>
                                  <span className="text-slate-400">&bull;</span>
                                  <span className="text-xs font-bold text-slate-800">{itemName(row.item)}</span>
                                  <span className="text-[10px] font-mono text-slate-400">({row.item})</span>
                                  <span className="text-slate-400">&bull;</span>
                                  <span className="text-xs font-medium text-slate-600">
                                    Machine: {row.machine || 'Unassigned'} ({row.shift || 'Shift A'})
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => onNavigate('woDetail', { id: row.id })}
                                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <span>Open Full Work Order Screen</span>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Interactive Shift Entry Section for Scrap, Downtime, Runner & Lumps */}
                              <div className="bg-gradient-to-r from-amber-50/60 via-white to-slate-50 border border-amber-200/60 rounded-xl p-3">
                                <div className="flex items-center justify-between gap-2 mb-2.5">
                                  <span className="text-xs font-extrabold text-[#14213D] flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Direct Shift Entry: Scrap, Downtime, Runner &amp; Lumps</span>
                                  </span>
                                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                                    Current Shift Values
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                  {/* 1. Scrap Entry with Reason Breakdown */}
                                  <div className="bg-white border border-rose-200 rounded-lg p-2.5 shadow-2xs">
                                    <div className="flex items-center justify-between mb-1.5">
                                      <span className="text-[11px] font-bold text-rose-900 flex items-center gap-1">
                                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                                        <span>Scrap / Defects</span>
                                      </span>
                                      <button
                                        type="button"
                                        disabled={isCompletedLocked}
                                        onClick={() => setRejectionModalWO(row)}
                                        className="text-[10px] font-bold text-rose-700 hover:underline bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 cursor-pointer"
                                      >
                                        Reasons ({row.rejectionBreakdown?.length || (row.scrap ? 1 : 0)}) &rarr;
                                      </button>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <input
                                        type="number"
                                        min="0"
                                        disabled={isCompletedLocked}
                                        value={row.scrap || ''}
                                        onChange={(e) => handleCellChange(row.id, 'scrap', parseInt(e.target.value, 10) || 0)}
                                        placeholder="0"
                                        className="w-full px-2 py-1.5 rounded-md border border-rose-300 bg-rose-50/40 font-mono text-right font-black text-rose-900 text-sm focus:ring-1 focus:ring-rose-500 focus:outline-none disabled:bg-slate-100"
                                      />
                                      <span className="text-[11px] font-bold text-rose-800 font-mono">PCS</span>
                                    </div>
                                  </div>

                                  {/* 2. Downtime Minutes with Intervals */}
                                  <div className="bg-white border border-indigo-200 rounded-lg p-2.5 shadow-2xs">
                                    <div className="flex items-center justify-between mb-1.5">
                                      <span className="text-[11px] font-bold text-indigo-900 flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                                        <span>Downtime Stops</span>
                                      </span>
                                      <button
                                        type="button"
                                        disabled={isCompletedLocked}
                                        onClick={() => setDowntimeModalWO(row)}
                                        className="text-[10px] font-bold text-indigo-700 hover:underline bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 cursor-pointer"
                                      >
                                        From-To ({row.downtimeIntervals?.length || (row.downtimeMin ? 1 : 0)}) &rarr;
                                      </button>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <input
                                        type="number"
                                        min="0"
                                        disabled={isCompletedLocked}
                                        value={row.downtimeMin || ''}
                                        onChange={(e) => handleCellChange(row.id, 'downtimeMin', parseInt(e.target.value, 10) || 0)}
                                        placeholder="0"
                                        className="w-full px-2 py-1.5 rounded-md border border-indigo-300 bg-indigo-50/40 font-mono text-right font-black text-indigo-900 text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-100"
                                      />
                                      <span className="text-[11px] font-bold text-indigo-800 font-mono">MIN</span>
                                    </div>
                                  </div>

                                  {/* 3. Runner Weight Entry */}
                                  <div className="bg-white border border-teal-200 rounded-lg p-2.5 shadow-2xs">
                                    <div className="flex items-center justify-between mb-1.5">
                                      <span className="text-[11px] font-bold text-teal-900 flex items-center gap-1">
                                        <Scale className="w-3.5 h-3.5 text-teal-600" />
                                        <span>Runner (Cold)</span>
                                      </span>
                                      <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-1 rounded">Regrind</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        disabled={isCompletedLocked}
                                        value={row.runnerWeightKg !== undefined ? row.runnerWeightKg : row.runnerQty || ''}
                                        onChange={(e) => handleCellChange(row.id, 'runnerWeightKg', parseFloat(e.target.value) || 0)}
                                        placeholder="0.0"
                                        className="w-full px-2 py-1.5 rounded-md border border-teal-300 bg-teal-50/40 font-mono text-right font-black text-teal-950 text-sm focus:ring-1 focus:ring-teal-500 focus:outline-none disabled:bg-slate-100"
                                      />
                                      <span className="text-[11px] font-bold text-teal-800 font-mono">KG</span>
                                    </div>
                                  </div>

                                  {/* 4. Lumps / Purge Weight Entry */}
                                  <div className="bg-white border border-amber-300 rounded-lg p-2.5 shadow-2xs">
                                    <div className="flex items-center justify-between mb-1.5">
                                      <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                                        <Flame className="w-3.5 h-3.5 text-amber-600" />
                                        <span>Lumps (Purge)</span>
                                      </span>
                                      <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1 rounded">Purge</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        disabled={isCompletedLocked}
                                        value={row.lumpsWeightKg !== undefined ? row.lumpsWeightKg : row.lumbesQty || ''}
                                        onChange={(e) => handleCellChange(row.id, 'lumpsWeightKg', parseFloat(e.target.value) || 0)}
                                        placeholder="0.0"
                                        className="w-full px-2 py-1.5 rounded-md border border-amber-300 bg-amber-50/40 font-mono text-right font-black text-amber-950 text-sm focus:ring-1 focus:ring-amber-500 focus:outline-none disabled:bg-slate-100"
                                      />
                                      <span className="text-[11px] font-bold text-amber-800 font-mono">KG</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Save Bar in Quick Entry */}
                                {isDirty && !isCompletedLocked && (
                                  <div className="mt-2.5 pt-2 border-t border-amber-200/50 flex items-center justify-end gap-2">
                                    <span className="text-xs text-amber-800 font-medium">Unsaved shift entries will accumulate to master Work Order:</span>
                                    <button
                                      type="button"
                                      onClick={() => handleSaveRow(row.id)}
                                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                                    >
                                      <Save className="w-3.5 h-3.5" />
                                      <span>Save &amp; Log Shift Output</span>
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Cumulative KPIs Strip */}
                              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
                                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-center">
                                  <span className="text-[10px] text-emerald-700 block font-semibold uppercase">Cumulative Good</span>
                                  <div className="font-mono font-black text-emerald-900 text-sm">
                                    {masterCompleted.toLocaleString()} <span className="text-[10px] font-normal">PCS</span>
                                  </div>
                                  <span className="text-[10px] font-bold text-emerald-600">
                                    {Math.min(100, Math.round((masterCompleted / plannedTarget) * 100))}% of {plannedTarget.toLocaleString()}
                                  </span>
                                </div>

                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center">
                                  <span className="text-[10px] text-slate-500 block font-semibold uppercase">Remaining Target</span>
                                  <div className="font-mono font-black text-slate-800 text-sm">
                                    {Math.max(0, plannedTarget - masterCompleted).toLocaleString()} <span className="text-[10px] font-normal">PCS</span>
                                  </div>
                                  <span className="text-[10px] text-slate-400">Balance to produce</span>
                                </div>

                                <div className="bg-rose-50 border border-rose-200 rounded-lg p-2 text-center">
                                  <span className="text-[10px] text-rose-700 block font-semibold uppercase">Cumulative Scrap</span>
                                  <div className="font-mono font-black text-rose-900 text-sm">
                                    {(Number(masterWO.scrap) || 0).toLocaleString()} <span className="text-[10px] font-normal">PCS</span>
                                  </div>
                                  <span className="text-[10px] text-rose-500">Defects across shifts</span>
                                </div>

                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-center">
                                  <span className="text-[10px] text-amber-700 block font-semibold uppercase">Cumulative Downtime</span>
                                  <div className="font-mono font-black text-amber-900 text-sm">
                                    {(Number(masterWO.downtimeMin) || 0).toLocaleString()} <span className="text-[10px] font-normal">min</span>
                                  </div>
                                  <span className="text-[10px] text-amber-600">{((Number(masterWO.downtimeMin) || 0) / 60).toFixed(1)} hrs total</span>
                                </div>

                                <div className="bg-teal-50 border border-teal-200 rounded-lg p-2 text-center">
                                  <span className="text-[10px] text-teal-700 block font-semibold uppercase">Cumulative Runner</span>
                                  <div className="font-mono font-black text-teal-900 text-sm">
                                    {(Number(masterWO.runnerWeightKg || masterWO.runnerQty) || 0).toFixed(1)} <span className="text-[10px] font-normal">KG</span>
                                  </div>
                                  <span className="text-[10px] text-teal-600">Regrind material</span>
                                </div>

                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-center">
                                  <span className="text-[10px] text-amber-800 block font-semibold uppercase">Cumulative Lumps</span>
                                  <div className="font-mono font-black text-amber-950 text-sm">
                                    {(Number(masterWO.lumpsWeightKg || masterWO.lumbesQty) || 0).toFixed(1)} <span className="text-[10px] font-normal">KG</span>
                                  </div>
                                  <span className="text-[10px] text-amber-700">Purge waste</span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={isCompactView ? 10 : 11} className="py-16 text-center text-xs text-[#9CA3AF] bg-[#FAF9F5]">
                    <div className="max-w-sm mx-auto space-y-2">
                      <div className="w-10 h-10 rounded-2xl bg-white border border-[#E4E0D6] text-[#9CA3AF] flex items-center justify-center mx-auto shadow-2xs">
                        <Search className="w-5 h-5" />
                      </div>
                      <div className="font-bold text-[#14213D]">No production records match criteria</div>
                      <p className="text-[11px] text-[#6B7280]">
                        Try clearing search filters or click "+ Insert First Production Row" to begin logging shift output.
                      </p>
                      <button
                        type="button"
                        onClick={handleAddNewManualRow}
                        className="mt-2 px-3.5 py-1.5 rounded-xl bg-[#0F8B8D] text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> + Insert First Production Row
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Enterprise Bottom Sticky Pagination Bar */}
        <div className="bg-[#FAF9F5] px-4 py-3 border-t border-[#E4E0D6] flex flex-wrap items-center justify-between gap-4 text-xs select-none">
          {/* Left: Telemetry & Record Slices */}
          <div className="flex items-center gap-2 text-[#6B7280]">
            <span>
              Showing{' '}
              <strong className="text-[#14213D] font-mono">
                {totalRecordsCount > 0 ? (startIndex + 1).toLocaleString() : 0}
              </strong>{' '}
              to{' '}
              <strong className="text-[#14213D] font-mono">
                {endIndex.toLocaleString()}
              </strong>{' '}
              of{' '}
              <strong className="text-[#14213D] font-mono">
                {totalRecordsCount.toLocaleString()}
              </strong>{' '}
              Work Orders
            </span>
            <span className="text-slate-300">|</span>
            <span>
              Page <strong className="text-[#14213D] font-mono">{safeCurrentPage}</strong> of{' '}
              <strong className="text-[#14213D] font-mono">{totalGridPages}</strong>
            </span>
          </div>

          {/* Center/Right: Numeric Page Buttons with Ellipsis & Jump Controls */}
          <div className="flex items-center gap-3 flex-wrap ml-auto">
            {/* Direct Jump to Page Form */}
            <form onSubmit={handleJumpToPage} className="flex items-center gap-1.5">
              <span className="text-[11px] text-[#6B7280]">Go to:</span>
              <input
                type="number"
                min={1}
                max={totalGridPages}
                value={jumpPageInput}
                onChange={(e) => setJumpPageInput(e.target.value)}
                placeholder={String(safeCurrentPage)}
                className="w-14 px-2 py-1 rounded-lg border border-[#E4E0D6] bg-white font-mono text-center font-bold text-[#14213D] text-xs focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none"
              />
              <button
                type="submit"
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#F6F4EF] border border-[#E4E0D6] font-bold text-[11px] text-[#14213D] transition-colors cursor-pointer"
              >
                Go
              </button>
            </form>

            {/* Comprehensive Page Navigation Suite */}
            <div className="flex items-center gap-1">
              {/* First Page */}
              <button
                type="button"
                disabled={safeCurrentPage <= 1}
                onClick={() => setGridPage(1)}
                className="p-1.5 rounded-lg bg-white border border-[#E4E0D6] text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#F6F4EF] transition-colors cursor-pointer"
                title="First Page"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>

              {/* Prev Page */}
              <button
                type="button"
                disabled={safeCurrentPage <= 1}
                onClick={() => setGridPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-[#E4E0D6] text-xs font-bold text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#F6F4EF] transition-colors cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>

              {/* Numeric Page Buttons with Ellipsis */}
              <div className="hidden sm:flex items-center gap-1">
                {getPageNumbers().map((pNum, pIdx) => {
                  if (pNum === '...') {
                    return (
                      <span key={`ellipsis-${pIdx}`} className="px-1.5 py-1 text-slate-400 font-bold">
                        ...
                      </span>
                    );
                  }
                  const isCur = pNum === safeCurrentPage;
                  return (
                    <button
                      key={`page-${pNum}`}
                      type="button"
                      onClick={() => setGridPage(Number(pNum))}
                      className={`min-w-[32px] px-2 py-1.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                        isCur
                          ? 'bg-[#14213D] text-white shadow-2xs'
                          : 'bg-white text-slate-700 hover:bg-[#F6F4EF] border border-[#E4E0D6]'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              {/* Next Page */}
              <button
                type="button"
                disabled={safeCurrentPage >= totalGridPages}
                onClick={() => setGridPage((p) => Math.min(totalGridPages, p + 1))}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-[#E4E0D6] text-xs font-bold text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#F6F4EF] transition-colors cursor-pointer flex items-center gap-1"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>

              {/* Last Page */}
              <button
                type="button"
                disabled={safeCurrentPage >= totalGridPages}
                onClick={() => setGridPage(totalGridPages)}
                className="p-1.5 rounded-lg bg-white border border-[#E4E0D6] text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#F6F4EF] transition-colors cursor-pointer"
                title="Last Page"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Multi-Rejection Defect Reason Modal */}
      {rejectionModalWO && (
        <MultiRejectionModal
          workOrder={rejectionModalWO}
          isOpen={!!rejectionModalWO}
          onClose={() => setRejectionModalWO(null)}
          onSave={handleSaveRejectionBreakdown}
          showToast={showToast}
        />
      )}

      {/* 7. Multi-Interval Downtime Tracking Modal */}
      {downtimeModalWO && (
        <MultiDowntimeModal
          workOrder={downtimeModalWO}
          isOpen={!!downtimeModalWO}
          onClose={() => setDowntimeModalWO(null)}
          onSave={handleSaveDowntimeIntervals}
          showToast={showToast}
        />
      )}

      {/* 8. Excel & CSV Importer Modal */}
      {isExcelModalOpen && (
        <DailyProductionExcelModal
          isOpen={isExcelModalOpen}
          onClose={() => setIsExcelModalOpen(false)}
          workOrders={allCombinedOrders}
          machines={machines}
          items={items}
          onImportProductionData={handleImportProductionData}
          showToast={showToast}
        />
      )}

      {/* 9. Bulk Update Modal for Selected Rows */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF9F5] rounded-3xl border border-[#E4E0D6] p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#14213D]">Bulk Update ({selectedRowIds.length} Orders)</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#6B7280]">Select Field to Update</label>
                <select
                  value={bulkField}
                  onChange={(e) => setBulkField(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-[#E4E0D6] mt-1 bg-white font-semibold text-[#14213D]"
                >
                  <option value="operator">Operator Assignment</option>
                  <option value="shift">Shift Assignment</option>
                  <option value="status">Status Workflow</option>
                  <option value="machine">Machine Allocation</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#6B7280]">New Value</label>
                <input
                  type="text"
                  placeholder="Enter new value (e.g. R. Kumar, Shift B, in_progress, IMM-250T-03)..."
                  value={bulkValue}
                  onChange={(e) => setBulkValue(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E4E0D6] mt-1 bg-white font-semibold text-[#14213D]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white border border-[#E4E0D6] font-bold text-xs hover:bg-[#F6F4EF] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyBulkUpdate}
                className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs cursor-pointer"
              >
                Apply to {selectedRowIds.length} Orders
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. Material & Store Stock Reconciliation Modal (Tasks 2 & 4) */}
      {materialReconcileWO && (
        <DailyMaterialReconcileModal
          workOrder={materialReconcileWO}
          isOpen={!!materialReconcileWO}
          onClose={() => setMaterialReconcileWO(null)}
          items={items}
          boms={boms || []}
          onUpdateWO={onUpdateWO}
          showToast={showToast}
        />
      )}
    </div>
  );
};

// Export Component Wrapped with Dedicated Error Boundary
export const DailyProductionGrid: React.FC<ProductionGridProps> = (props) => {
  return (
    <DailyProductionErrorBoundary>
      <DailyProductionGridInner {...props} />
    </DailyProductionErrorBoundary>
  );
};
