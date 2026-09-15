import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { WorkOrder, MachineMaster, ItemMaster, RejectionBreakdownItem, DowntimeIntervalItem } from '../../types';
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
  X
} from 'lucide-react';
import { MultiRejectionModal } from './MultiRejectionModal';
import { MultiDowntimeModal } from './MultiDowntimeModal';
import { DailyProductionExcelModal } from './DailyProductionExcelModal';

interface ProductionGridProps {
  workOrders: WorkOrder[];
  machines: MachineMaster[];
  items: ItemMaster[];
  molds: MoldMaster[];
  onNavigate: (view: string, param?: any) => void;
  onUpdateWO: (wo: WorkOrder) => void;
  onCreateWO: (wo: WorkOrder) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
  onSyncWipLot?: (wo: WorkOrder, source: 'grid_entry' | 'excel_csv_upload', notes?: string) => void;
}

export const DailyProductionGrid: React.FC<ProductionGridProps> = ({
  workOrders,
  machines,
  items,
  molds,
  onNavigate,
  onUpdateWO,
  onCreateWO,
  openDrawer,
  closeDrawer,
  showToast,
  onSyncWipLot,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('2026-08-21');
  const [selectedShift, setSelectedShift] = useState<string>('all');
  const [selectedMachineFilter, setSelectedMachineFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'rejections' | 'downtime' | 'runner' | 'dirty'>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [gridPage, setGridPage] = useState<number>(1);
  const [gridPageSize, setGridPageSize] = useState<number>(20);
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

  // Editable local rows buffer
  const [gridData, setGridData] = useState<WorkOrder[]>(workOrders);
  const [dirtyRowIds, setDirtyRowIds] = useState<Set<string>>(new Set());

  const itemName = (code: string) => items.find((i) => i.code === code)?.name || code;

  // Helper to extract clean YYYY-MM-DD date from WorkOrder
  const getRowDate = (wo: WorkOrder): string => {
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

  // Distinct dates available in the work order dataset for quick day-to-day switching
  const availableDates = useMemo(() => {
    const dates = new Set<string>();
    gridData.forEach((wo) => {
      const d = getRowDate(wo);
      if (d) dates.add(d);
    });
    return Array.from(dates).sort().reverse();
  }, [gridData]);

  // Filtered rows: if specific date is selected in top of grid, only that specific date's work orders are displayed
  const filteredGridRows = useMemo(() => {
    return gridData.filter((wo) => {
      // Specific Date Filter
      if (selectedDate && selectedDate !== 'all' && selectedDate.trim() !== '') {
        const rowDate = getRowDate(wo);
        if (rowDate !== selectedDate && wo.planDate !== selectedDate) {
          return false;
        }
      }

      // Global Search
      if (searchFilter) {
        const q = searchFilter.toLowerCase();
        const matchId = wo.id.toLowerCase().includes(q);
        const matchItem = wo.item.toLowerCase().includes(q);
        const matchName = itemName(wo.item).toLowerCase().includes(q);
        const matchMachine = (wo.machine || '').toLowerCase().includes(q);
        const matchOp = (wo.operator || '').toLowerCase().includes(q);
        const matchDate = (wo.planDate || getRowDate(wo)).includes(q);
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
        const hasRunner = (wo.runnerQty && wo.runnerQty > 0) || (wo.lumbesQty && wo.lumbesQty > 0) || (wo.runnerWeightKg && wo.runnerWeightKg > 0) || (wo.lumpsWeightKg && wo.lumpsWeightKg > 0);
        if (!hasRunner) return false;
      } else if (activeFilterTab === 'dirty') {
        if (!dirtyRowIds.has(wo.id)) return false;
      }

      return true;
    });
  }, [gridData, selectedDate, searchFilter, selectedShift, selectedMachineFilter, selectedStatusFilter, activeFilterTab, dirtyRowIds, items]);

  const handleCellChange = (id: string, field: keyof WorkOrder, value: any) => {
    setGridData((prev) =>
      prev.map((row) => {
        if (row.id === id) {
          const updated = { ...row, [field]: value };
          // If runner or lumps updated, synchronize both aliases
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
          return updated;
        }
        return row;
      })
    );
    setDirtyRowIds((prev) => new Set(prev).add(id));
  };

  const getItemStoreDestination = (itemCode: string) => {
    const itm = items.find((i) => i.code === itemCode);
    if (itm?.isDeflash || itm?.routingDestination === 'DEFLASH') {
      return { code: 'DEFLASH-STORE', label: 'DEFLASH (Deflash Store)', type: 'deflash' };
    }
    if (itm?.isAssembly || itm?.routingDestination === 'ASSEMBLY') {
      return { code: 'ASSEMBLY-STORE', label: 'ASSEMPLY (Assembly Store)', type: 'assembly' };
    }
    return { code: 'FG-STORE', label: 'DOL (Direct to FG-Store)', type: 'dol' };
  };

  const handleSaveRow = (id: string) => {
    const row = gridData.find((r) => r.id === id);
    if (row) {
      onUpdateWO(row);
      onSyncWipLot?.(row, 'grid_entry', 'Updated via Daily Production Grid manual entry');
      setDirtyRowIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      const dest = getItemStoreDestination(row.item);
      showToast(`Work Order ${id} saved & routed to ${dest.code} [${dest.label}]`);
    }
  };

  const handleSaveAllDirty = () => {
    let count = 0;
    gridData.forEach((row) => {
      if (dirtyRowIds.has(row.id)) {
        onUpdateWO(row);
        onSyncWipLot?.(row, 'grid_entry', 'Batch saved via Daily Production Grid');
        count++;
      }
    });
    setDirtyRowIds(new Set());
    showToast(`Saved and auto-routed ${count} production records to their destination inventory stores.`);
  };

  // Rejection Modal Callback
  const handleSaveRejectionBreakdown = (woId: string, breakdown: RejectionBreakdownItem[], totalScrap: number) => {
    setGridData((prev) =>
      prev.map((row) => {
        if (row.id === woId) {
          const updated: WorkOrder = {
            ...row,
            scrap: totalScrap,
            rejectionBreakdown: breakdown,
            rejectionReason: breakdown.map((b) => `${b.reason}: ${b.qty}`).join('; '),
          };
          onUpdateWO(updated);
          return updated;
        }
        return row;
      })
    );
    setDirtyRowIds((prev) => new Set(prev).add(woId));
  };

  // Downtime Modal Callback
  const handleSaveDowntimeIntervals = (woId: string, intervals: DowntimeIntervalItem[], totalDowntimeMin: number) => {
    setGridData((prev) =>
      prev.map((row) => {
        if (row.id === woId) {
          const updated: WorkOrder = {
            ...row,
            downtimeMin: totalDowntimeMin,
            downtimeIntervals: intervals,
            downtimeLogs: intervals.map((i) => ({
              time: i.fromTime,
              reason: i.reason,
              min: i.min,
              by: i.by || row.operator,
            })),
          };
          onUpdateWO(updated);
          return updated;
        }
        return row;
      })
    );
    setDirtyRowIds((prev) => new Set(prev).add(woId));
  };

  // Manual Row Addition for Floor Operators
  const handleAddNewManualRow = () => {
    const nextSeq = gridData.length + 1;
    const newWoId = `WO-MAN-${String(nextSeq).padStart(3, '0')}`;
    const defaultItem = items[0]?.code || 'FG-CTN-500';
    const defaultMachine = machines[0]?.id || 'IMM-250T-03';

    const newRow: WorkOrder = {
      id: newWoId,
      item: defaultItem,
      bomId: 'BOM-1042',
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
      priority: 'Medium',
      dueDate: selectedDate,
      operator: 'Lead Operator',
      shift: selectedShift !== 'all' ? selectedShift : 'Shift A',
      planDate: selectedDate,
      rejectionBreakdown: [],
      downtimeIntervals: [],
      outputLogs: [],
      downtimeLogs: [],
      checklist: [],
      history: [{ event: 'Manual production log entry created', time: 'Just now' }],
    };

    setGridData((prev) => [newRow, ...prev]);
    setDirtyRowIds((prev) => new Set(prev).add(newWoId));
    onCreateWO(newRow);
    showToast(`Added manual entry row ${newWoId}`);
  };

  // Duplicate Row
  const handleDuplicateRow = (row: WorkOrder) => {
    const nextSeq = gridData.length + 1;
    const duplicatedId = `WO-${row.id.replace('WO-', '')}-B`;
    const duplicatedRow: WorkOrder = {
      ...row,
      id: duplicatedId,
      completed: 0,
      scrap: 0,
      runnerQty: 0,
      lumbesQty: 0,
      downtimeMin: 0,
      rejectionBreakdown: [],
      downtimeIntervals: [],
      status: 'in_progress',
      history: [{ event: `Cloned from ${row.id}`, time: 'Just now' }],
    };

    setGridData((prev) => [duplicatedRow, ...prev]);
    setDirtyRowIds((prev) => new Set(prev).add(duplicatedId));
    onCreateWO(duplicatedRow);
    showToast(`Duplicated ${row.id} as ${duplicatedId}`);
  };

  // Bulk Field Apply
  const handleApplyBulkUpdate = () => {
    if (!selectedRowIds.length || !bulkValue) return;

    setGridData((prev) =>
      prev.map((row) => {
        if (selectedRowIds.includes(row.id)) {
          const updated = { ...row, [bulkField]: bulkValue };
          onUpdateWO(updated);
          return updated;
        }
        return row;
      })
    );

    setIsBulkModalOpen(false);
    showToast(`Bulk updated ${selectedRowIds.length} work orders: ${bulkField} = ${bulkValue}`);
    setSelectedRowIds([]);
  };

  // Excel / CSV Import Handler
  const handleImportProductionData = (importedRows: Partial<WorkOrder>[], mode: 'update' | 'append') => {
    if (mode === 'update') {
      setGridData((prev) => {
        const map = new Map<string, WorkOrder>(prev.map((r) => [r.id.toLowerCase(), r]));
        const newDirty = new Set(dirtyRowIds);

        importedRows.forEach((imp) => {
          if (!imp.id) return;
          const existing = map.get(imp.id.toLowerCase());
          if (existing) {
            const merged: WorkOrder = {
              ...existing,
              completed: imp.completed !== undefined ? imp.completed : existing.completed,
              scrap: imp.scrap !== undefined ? imp.scrap : existing.scrap,
              runnerQty: imp.runnerQty !== undefined ? imp.runnerQty : existing.runnerQty,
              lumbesQty: imp.lumbesQty !== undefined ? imp.lumbesQty : existing.lumbesQty,
              runnerWeightKg: imp.runnerWeightKg !== undefined ? imp.runnerWeightKg : existing.runnerWeightKg,
              lumpsWeightKg: imp.lumpsWeightKg !== undefined ? imp.lumpsWeightKg : existing.lumpsWeightKg,
              downtimeMin: imp.downtimeMin !== undefined ? imp.downtimeMin : existing.downtimeMin,
              rejectionBreakdown: imp.rejectionBreakdown || existing.rejectionBreakdown,
              downtimeIntervals: imp.downtimeIntervals || existing.downtimeIntervals,
              operator: imp.operator || existing.operator,
              shift: imp.shift || existing.shift,
              machine: imp.machine || existing.machine,
              status: imp.status || existing.status,
            };
            map.set(imp.id.toLowerCase(), merged);
            newDirty.add(existing.id);
            onUpdateWO(merged);
            onSyncWipLot?.(merged, 'excel_csv_upload', `Reconciled and imported from Excel/CSV upload for ${merged.id}`);
          } else {
            // Append if not found
            const newRow: WorkOrder = {
              id: imp.id,
              item: imp.item || 'FG-CTN-500',
              bomId: 'BOM-1042',
              machine: imp.machine || 'IMM-250T-03',
              day: 'Fri',
              qty: imp.qty || 1000,
              uom: 'PCS',
              completed: imp.completed || 0,
              scrap: imp.scrap || 0,
              runnerQty: imp.runnerQty || 0,
              lumbesQty: imp.lumbesQty || 0,
              downtimeMin: imp.downtimeMin || 0,
              status: imp.status || 'in_progress',
              priority: 'Medium',
              dueDate: selectedDate,
              operator: imp.operator || 'Operator',
              shift: imp.shift || 'Shift A',
              planDate: selectedDate,
              rejectionBreakdown: imp.rejectionBreakdown || [],
              downtimeIntervals: imp.downtimeIntervals || [],
              outputLogs: [],
              downtimeLogs: imp.downtimeLogs || [],
              checklist: [],
              history: [{ event: 'Imported from Excel', time: 'Just now' }],
            };
            map.set(imp.id.toLowerCase(), newRow);
            newDirty.add(newRow.id);
            onCreateWO(newRow);
            onSyncWipLot?.(newRow, 'excel_csv_upload', `Imported new batch from Excel/CSV upload for ${newRow.id}`);
          }
        });

        setDirtyRowIds(newDirty);
        return Array.from(map.values());
      });
    } else {
      // Append mode
      const newItems: WorkOrder[] = importedRows.map((imp) => ({
        id: imp.id || `WO-IMP-${Date.now()}`,
        item: imp.item || 'FG-CTN-500',
        bomId: 'BOM-1042',
        machine: imp.machine || 'IMM-250T-03',
        day: 'Fri',
        qty: imp.qty || 1000,
        uom: 'PCS',
        completed: imp.completed || 0,
        scrap: imp.scrap || 0,
        runnerQty: imp.runnerQty || 0,
        lumbesQty: imp.lumbesQty || 0,
        downtimeMin: imp.downtimeMin || 0,
        status: imp.status || 'in_progress',
        priority: 'Medium',
        dueDate: selectedDate,
        operator: imp.operator || 'Operator',
        shift: imp.shift || 'Shift A',
        planDate: selectedDate,
        rejectionBreakdown: imp.rejectionBreakdown || [],
        downtimeIntervals: imp.downtimeIntervals || [],
        outputLogs: [],
        downtimeLogs: imp.downtimeLogs || [],
        checklist: [],
        history: [{ event: 'Imported from Excel as new record', time: 'Just now' }],
      }));

      newItems.forEach((item) => {
        onCreateWO(item);
        onSyncWipLot?.(item, 'excel_csv_upload', `Appended from Excel/CSV upload for ${item.id}`);
      });
      setGridData((prev) => [...newItems, ...prev]);
      setDirtyRowIds((prev) => {
        const next = new Set(prev);
        newItems.forEach((item) => next.add(item.id));
        return next;
      });
    }
  };

  // Export Filtered Records to Excel
  const handleExportToExcel = () => {
    const exportData = filteredGridRows.map((r) => {
      const rejStr = (r.rejectionBreakdown || []).map((rej) => `${rej.reason}:${rej.qty}`).join('; ');
      const dwnStr = (r.downtimeIntervals || []).map((d) => `${d.fromTime}-${d.toTime}:${d.reason}`).join('; ');
      const totalProduced = (r.completed || 0) + (r.scrap || 0);
      const scrapPct = totalProduced > 0 ? (((r.scrap || 0) / totalProduced) * 100).toFixed(1) : '0.0';

      return {
        'WO Number': r.id,
        'Date': r.planDate || getRowDate(r),
        'Item Code': r.item,
        'Item Name': itemName(r.item),
        'Machine Bay': r.machine || 'Unassigned',
        'Shift': r.shift || 'Shift A',
        'Planned Qty': r.qty,
        'Actual Good': r.completed,
        'Scrap Qty': r.scrap,
        'Scrap %': `${scrapPct}%`,
        'Rejection Reasons': rejStr || r.rejectionReason || '',
        'Downtime (min)': r.downtimeMin,
        'Downtime Intervals': dwnStr || '',
        'Runner Regrind (kg)': r.runnerQty || r.runnerWeightKg || 0,
        'Lumps Purge (kg)': r.lumbesQty || r.lumpsWeightKg || 0,
        'Lead Operator': r.operator,
        'Status': r.status,
        'Remarks': r.remark || '',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Production_Data');
    XLSX.writeFile(workbook, `Daily_Production_Export_${selectedDate}_${selectedShift}.xlsx`);
    showToast(`Exported ${exportData.length} production rows to Excel`);
  };

  // Summary Totals for KPI Telemetry Bar
  const totalPlanned = filteredGridRows.reduce((sum, r) => sum + (r.qty || 0), 0);
  const totalGood = filteredGridRows.reduce((sum, r) => sum + (r.completed || 0), 0);
  const totalScrap = filteredGridRows.reduce((sum, r) => sum + (r.scrap || 0), 0);
  const totalRunner = filteredGridRows.reduce((sum, r) => sum + (Number(r.runnerQty || r.runnerWeightKg) || 0), 0);
  const totalLumps = filteredGridRows.reduce((sum, r) => sum + (Number(r.lumbesQty || r.lumpsWeightKg) || 0), 0);
  const totalDowntimeMin = filteredGridRows.reduce((sum, r) => sum + (r.downtimeMin || 0), 0);
  const totalDowntimeHours = (totalDowntimeMin / 60).toFixed(1);

  const totalProduced = totalGood + totalScrap;
  const overallScrapRate = totalProduced > 0 ? ((totalScrap / totalProduced) * 100).toFixed(1) : '0.0';
  const planCompletionRate = totalPlanned > 0 ? ((totalGood / totalPlanned) * 100).toFixed(1) : '0.0';

  const totalGridPages = Math.ceil(filteredGridRows.length / gridPageSize) || 1;
  const pagedGridRows = filteredGridRows.slice((gridPage - 1) * gridPageSize, gridPage * gridPageSize);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. Senior Executive Header & Action Hub */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E4E0D6] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#0F8B8D]/10 text-[#0F8B8D] border border-[#0F8B8D]/20">
              Shift Operations &bull; High-Speed Plant Entry
            </span>
            <span className="text-[11px] text-[#6B7280]">
              Manual Grid Entry &bull; Excel/CSV Ingestion &bull; Multi-Defects &bull; Downtime From-To &bull; Runner &amp; Lumps
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#14213D] tracking-tight">Daily Production Data Grid</h1>
        </div>

        {/* Global Toolbar Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {dirtyRowIds.size > 0 && (
            <button
              type="button"
              onClick={handleSaveAllDirty}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all animate-pulse"
            >
              <Save className="w-3.5 h-3.5" /> Save Changes ({dirtyRowIds.size})
            </button>
          )}

          <button
            type="button"
            onClick={handleAddNewManualRow}
            className="px-3 py-2 rounded-xl bg-white hover:bg-[#F6F4EF] border border-[#E4E0D6] text-[#14213D] text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            + Add Manual Row
          </button>

          <button
            type="button"
            onClick={() => setIsExcelModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-[#0F8B8D] hover:bg-[#0c7072] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Excel / CSV
          </button>

          <button
            type="button"
            onClick={handleExportToExcel}
            className="px-3 py-2 rounded-xl bg-white hover:bg-[#F6F4EF] border border-[#E4E0D6] text-[#14213D] text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
            title="Export filtered records to Excel"
          >
            <Download className="w-3.5 h-3.5 text-[#0F8B8D]" />
            Export
          </button>

          <button
            type="button"
            onClick={() => onNavigate('wipOperations')}
            className="px-3 py-2 rounded-xl bg-[#E8622C] hover:bg-[#d45320] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            title="Open WIP Inventory, Deflash/Assembly Stores & QC Gate"
          >
            <Layers className="w-3.5 h-3.5" />
            WIP &amp; QC Stores
          </button>

          <button
            type="button"
            onClick={() => onNavigate('createWoGrid')}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            Bulk Wizard (100+)
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
            {filteredGridRows.length} active work orders
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
            {Number(overallScrapRate) > 5 && <span className="text-[9px] px-1 bg-rose-100 rounded text-rose-900 font-bold">High</span>}
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
            {totalDowntimeMin} <span className="text-xs font-sans font-normal text-[#6B7280]">min</span>
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

          {/* Date Picker Filter */}
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
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#14213D] p-0.5 rounded transition-colors"
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
              { id: 'all', label: `All Records (${gridData.length})` },
              { id: 'rejections', label: 'Has Rejections' },
              { id: 'downtime', label: 'Has Downtime' },
              { id: 'runner', label: 'With Runner/Lumps' },
              { id: 'dirty', label: `Unsaved Changes (${dirtyRowIds.size})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilterTab(tab.id as any)}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition-all whitespace-nowrap ${
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
                className="px-2.5 py-1 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-[11px] font-bold transition-colors"
              >
                Bulk Update &rarr;
              </button>
              <button
                type="button"
                onClick={() => setSelectedRowIds([])}
                className="text-[#6B7280] hover:text-[#14213D] text-[11px] underline ml-1"
              >
                Deselect
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. High-Performance Editable Grid Table */}
      <div className="bg-white rounded-2xl border border-[#E4E0D6] shadow-xs overflow-hidden">
        {/* User-Friendly Top Operational Bar (Replaces bottom bar for day-to-day use) */}
        <div className="bg-[#FAF9F5] px-4 py-3 border-b border-[#E4E0D6] flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Left: Active Records Count & Date Filter Tag */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 font-medium text-[#14213D]">
              <span className="font-bold text-sm font-mono bg-white px-2 py-0.5 rounded-md border border-[#E4E0D6] text-[#14213D]">
                {filteredGridRows.length}
              </span>
              <span className="text-[#6B7280]">
                {filteredGridRows.length === 1 ? 'Work Order' : 'Work Orders'}
              </span>
              {selectedDate && selectedDate !== 'all' && selectedDate.trim() !== '' ? (
                <span className="inline-flex items-center gap-1 bg-teal-50 text-[#0F8B8D] border border-teal-200 px-2 py-0.5 rounded-md font-mono font-bold text-[11px]">
                  <Calendar className="w-3 h-3 text-[#0F8B8D]" />
                  {selectedDate}
                </span>
              ) : (
                <span className="text-[#6B7280] text-[11px] font-medium bg-[#F6F4EF] px-2 py-0.5 rounded border border-[#E4E0D6]">
                  All Dates
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
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white hover:bg-[#F6F4EF] border border-[#E4E0D6] text-[11px] font-semibold text-[#6B7280] hover:text-[#14213D] transition-colors"
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
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-colors"
                >
                  <Save className="w-3 h-3" /> Save All
                </button>
              </div>
            )}
          </div>

          {/* Right: Quick Rows Selector & Pagination Controls */}
          <div className="flex items-center gap-2.5 font-medium ml-auto flex-wrap">
            {/* View Mode Toggle: Floor vs Full */}
            <div className="flex items-center bg-white rounded-lg border border-[#E4E0D6] p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setIsCompactView(false)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  !isCompactView
                    ? 'bg-[#14213D] text-white shadow-2xs'
                    : 'text-[#6B7280] hover:text-[#14213D]'
                }`}
                title="Full Grid View: All columns including Runner kg, Lumps kg and Remarks"
              >
                Full Grid
              </button>
              <button
                type="button"
                onClick={() => setIsCompactView(true)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  isCompactView
                    ? 'bg-[#0F8B8D] text-white shadow-2xs'
                    : 'text-[#6B7280] hover:text-[#14213D]'
                }`}
                title="Floor View: Essential columns for fast shift entry with zero horizontal scroll"
              >
                Floor View
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-[#6B7280]">
              <span className="text-[11px]">Rows:</span>
              <select
                value={gridPageSize}
                onChange={(e) => {
                  setGridPageSize(Number(e.target.value));
                  setGridPage(1);
                }}
                className="px-2 py-1 rounded-lg border border-[#E4E0D6] bg-white font-semibold text-[#14213D] text-xs focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={1000}>All</option>
              </select>
            </div>

            {totalGridPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={gridPage <= 1}
                  onClick={() => setGridPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded-lg bg-white border border-[#E4E0D6] text-xs font-bold text-[#14213D] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F6F4EF] transition-colors"
                >
                  &larr; Prev
                </button>
                <span className="text-[11px] font-mono text-[#6B7280] px-1.5">
                  {gridPage} / {totalGridPages}
                </span>
                <button
                  type="button"
                  disabled={gridPage >= totalGridPages}
                  onClick={() => setGridPage((p) => Math.min(totalGridPages, p + 1))}
                  className="px-2.5 py-1 rounded-lg bg-white border border-[#E4E0D6] text-xs font-bold text-[#14213D] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F6F4EF] transition-colors"
                >
                  Next &rarr;
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable table container with no visible bottom scroll/side bar */}
        <div className="overflow-x-auto max-h-[660px] overflow-y-auto scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <table className={`w-full text-xs border-collapse ${isCompactView ? 'min-w-full' : 'min-w-[1180px]'}`}>
            <thead className="sticky top-0 z-20 bg-[#F6F4EF] text-[#6B7280] shadow-xs select-none">
              <tr className="border-b border-[#E4E0D6]">
                <th className="p-2.5 text-center w-9 sticky left-0 bg-[#F6F4EF] z-30">
                  <input
                    type="checkbox"
                    checked={selectedRowIds.length === filteredGridRows.length && filteredGridRows.length > 0}
                    onChange={() => {
                      if (selectedRowIds.length === filteredGridRows.length) {
                        setSelectedRowIds([]);
                      } else {
                        setSelectedRowIds(filteredGridRows.map((r) => r.id));
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
                <th className="p-2.5 text-left font-bold w-36">
                  <div className="flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                    <span>Scrap / Defects</span>
                  </div>
                </th>
                <th className="p-2.5 text-left font-bold w-36">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Downtime</span>
                  </div>
                </th>
                {!isCompactView && (
                  <>
                    <th className="p-2.5 text-right font-bold w-24">
                      <div className="flex items-center justify-end gap-1">
                        <Scale className="w-3.5 h-3.5 text-teal-600" />
                        <span>Runner (kg)</span>
                      </div>
                    </th>
                    <th className="p-2.5 text-right font-bold w-24">
                      <div className="flex items-center justify-end gap-1">
                        <Flame className="w-3.5 h-3.5 text-amber-600" />
                        <span>Lumps (kg)</span>
                      </div>
                    </th>
                  </>
                )}
                <th className="p-2.5 text-left font-bold w-28">Status</th>
                <th className="p-2.5 text-left font-bold w-28">Lead Operator</th>
                {!isCompactView && <th className="p-2.5 text-left font-bold w-32">Remarks</th>}
                <th className="p-2.5 text-center font-bold w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E0D6]">
              {pagedGridRows.length > 0 ? (
                pagedGridRows.map((row, idx) => {
                  const globalIdx = (gridPage - 1) * gridPageSize + idx + 1;
                  const isDirty = dirtyRowIds.has(row.id);
                  const isSelected = selectedRowIds.includes(row.id);
                  const totalProduced = (row.completed || 0) + (row.scrap || 0);
                  const scrapPct = totalProduced > 0 ? (((row.scrap || 0) / totalProduced) * 100).toFixed(1) : '0.0';

                  const rejectionsCount = row.rejectionBreakdown ? row.rejectionBreakdown.length : (row.scrap > 0 ? 1 : 0);
                  const downtimeStopsCount = row.downtimeIntervals ? row.downtimeIntervals.length : (row.downtimeMin > 0 ? 1 : 0);

                  return (
                    <tr
                      key={row.id}
                      className={`hover:bg-[#FDFBF7] transition-colors ${
                        isDirty ? 'bg-amber-50/40' : ''
                      } ${isSelected ? 'bg-purple-50/40' : ''}`}
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

                      {/* WO # (Sticky) */}
                      <td className="p-2 font-mono font-bold text-[#0F8B8D] sticky left-9 bg-white z-10 text-xs">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onNavigate('woDetail', { id: row.id })}
                            className="hover:underline font-bold text-left flex items-center gap-1"
                            title="Open Work Order Details Traveler"
                          >
                            <span>{row.id}</span>
                            <ExternalLink className="w-3 h-3 text-[#9CA3AF] opacity-60 hover:opacity-100" />
                          </button>
                        </div>
                      </td>

                      {/* Date Field */}
                      <td className="p-1.5">
                        <input
                          type="date"
                          value={row.planDate || getRowDate(row)}
                          onChange={(e) => handleCellChange(row.id, 'planDate', e.target.value)}
                          className="w-full px-2 py-1 rounded-md border border-[#E4E0D6] bg-white font-mono text-xs font-semibold text-[#14213D] focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none"
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

                      {/* Machine Bay Select */}
                      <td className="p-1.5">
                        <select
                          value={row.machine || ''}
                          onChange={(e) => handleCellChange(row.id, 'machine', e.target.value)}
                          className="w-full px-1.5 py-1 rounded-md border border-[#E4E0D6] bg-white font-mono text-xs font-semibold text-[#14213D] focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none"
                        >
                          <option value="">Unassigned</option>
                          {machines.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.id}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Shift Select */}
                      <td className="p-1.5">
                        <select
                          value={row.shift || 'Shift A'}
                          onChange={(e) => handleCellChange(row.id, 'shift', e.target.value)}
                          className="w-full px-1.5 py-1 rounded-md border border-[#E4E0D6] bg-white text-xs font-semibold text-[#14213D] focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none"
                        >
                          <option value="Shift A">Shift A</option>
                          <option value="Shift B">Shift B</option>
                          <option value="Shift C">Shift C</option>
                        </select>
                      </td>

                      {/* Planned Qty */}
                      <td className="p-1.5">
                        <input
                          type="number"
                          value={row.qty}
                          onChange={(e) => handleCellChange(row.id, 'qty', parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1 rounded-md border border-[#E4E0D6] bg-white font-mono text-right font-bold text-[#14213D] text-xs focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none"
                        />
                      </td>

                      {/* Actual Good */}
                      <td className="p-1.5">
                        <input
                          type="number"
                          value={row.completed}
                          onChange={(e) => handleCellChange(row.id, 'completed', parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1 rounded-md border border-emerald-300 bg-emerald-50/40 font-mono text-right font-bold text-emerald-800 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </td>

                      {/* Rejection & Multi-Defect Reasons */}
                      <td className="p-1.5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              value={row.scrap}
                              onChange={(e) => handleCellChange(row.id, 'scrap', parseInt(e.target.value) || 0)}
                              className="w-16 px-1.5 py-1 rounded-md border border-rose-300 bg-rose-50/40 font-mono text-right font-bold text-rose-800 text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none"
                              placeholder="0"
                            />
                            <button
                              type="button"
                              onClick={() => setRejectionModalWO(row)}
                              className={`px-1.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-0.5 border whitespace-nowrap transition-all ${
                                rejectionsCount > 0
                                  ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-800 shadow-2xs'
                                  : 'bg-slate-100 hover:bg-rose-50 border-[#E4E0D6] text-[#6B7280] hover:text-rose-700'
                              }`}
                              title="Manage defect reasons"
                            >
                              <ShieldAlert className="w-3 h-3 text-rose-600" />
                              <span>{rejectionsCount > 0 ? `${rejectionsCount}` : '+ Defect'}</span>
                            </button>
                          </div>

                          {/* Quick Tooltip / Preview of Rejection Reasons */}
                          {row.rejectionBreakdown && row.rejectionBreakdown.length > 0 && (
                            <div className="text-[10px] text-rose-900 truncate max-w-[150px] font-medium" title={row.rejectionReason}>
                              {row.rejectionBreakdown.map((r) => `${r.reason.split('/')[0].trim()}: ${r.qty}`).join(', ')}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Downtime (Min) & Multi-Interval Stops (From & To) */}
                      <td className="p-1.5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <div className="relative w-16">
                              <input
                                type="number"
                                min="0"
                                value={row.downtimeMin}
                                onChange={(e) => handleCellChange(row.id, 'downtimeMin', parseInt(e.target.value) || 0)}
                                className="w-full px-1.5 py-1 pr-4 rounded-md border border-amber-300 bg-amber-50/40 font-mono text-right font-bold text-amber-900 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                              />
                              <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] font-mono text-[#9CA3AF]">
                                m
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setDowntimeModalWO(row)}
                              className={`px-1.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-0.5 border whitespace-nowrap transition-all ${
                                downtimeStopsCount > 0
                                  ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-900 shadow-2xs'
                                  : 'bg-slate-100 hover:bg-amber-50 border-[#E4E0D6] text-[#6B7280] hover:text-amber-800'
                              }`}
                              title="Manage downtime intervals"
                            >
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>{downtimeStopsCount > 0 ? `${downtimeStopsCount}` : '+ Stop'}</span>
                            </button>
                          </div>

                          {/* Quick Preview of Downtime Intervals */}
                          {row.downtimeIntervals && row.downtimeIntervals.length > 0 && (
                            <div className="text-[10px] text-amber-900 truncate max-w-[150px] font-medium">
                              {row.downtimeIntervals.map((d) => `${d.fromTime}-${d.toTime} (${d.min}m)`).join(', ')}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Secondary Engineering Columns: Hidden in Floor View */}
                      {!isCompactView && (
                        <>
                          {/* Runner Scrap (kg) */}
                          <td className="p-1.5">
                            <div className="relative">
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={row.runnerQty || row.runnerWeightKg || ''}
                                onChange={(e) =>
                                  handleCellChange(row.id, 'runnerQty', parseFloat(e.target.value) || 0)
                                }
                                placeholder="0.0"
                                className="w-full px-1.5 py-1 pr-5 rounded-md border border-teal-200 bg-teal-50/20 font-mono text-right font-bold text-teal-800 text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                              />
                              <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] font-mono text-teal-600 font-bold">
                                kg
                              </span>
                            </div>
                          </td>

                          {/* Lumps / Lumbes (kg) */}
                          <td className="p-1.5">
                            <div className="relative">
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={row.lumbesQty || row.lumpsWeightKg || ''}
                                onChange={(e) =>
                                  handleCellChange(row.id, 'lumbesQty', parseFloat(e.target.value) || 0)
                                }
                                placeholder="0.0"
                                className="w-full px-1.5 py-1 pr-5 rounded-md border border-amber-200 bg-amber-50/20 font-mono text-right font-bold text-amber-900 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                              />
                              <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] font-mono text-amber-700 font-bold">
                                kg
                              </span>
                            </div>
                          </td>
                        </>
                      )}

                      {/* Status Select */}
                      <td className="p-1.5">
                        <select
                          value={row.status}
                          onChange={(e) => handleCellChange(row.id, 'status', e.target.value as any)}
                          className="w-full px-1.5 py-1 rounded-md border border-[#E4E0D6] bg-white text-xs font-semibold text-[#14213D] focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none"
                        >
                          <option value="planned">Planned</option>
                          <option value="released">Released</option>
                          <option value="in_progress">In Progress</option>
                          <option value="quality_hold">Quality Hold</option>
                          <option value="completed">Completed</option>
                        </select>
                      </td>

                      {/* Lead Operator */}
                      <td className="p-1.5">
                        <input
                          type="text"
                          value={row.operator || ''}
                          onChange={(e) => handleCellChange(row.id, 'operator', e.target.value)}
                          className="w-full px-2 py-1 rounded-md border border-[#E4E0D6] bg-white text-xs font-medium text-[#14213D] focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none"
                        />
                      </td>

                      {/* Shift Remarks (Hidden in Floor View) */}
                      {!isCompactView && (
                        <td className="p-1.5">
                          <input
                            type="text"
                            placeholder="Log notes..."
                            value={row.remark || ''}
                            onChange={(e) => handleCellChange(row.id, 'remark', e.target.value)}
                            className="w-full px-2 py-1 rounded-md border border-[#E4E0D6] bg-white text-[11px] text-[#4B5563] placeholder:text-[#9CA3AF] focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none"
                          />
                        </td>
                      )}

                      {/* Action Cell */}
                      <td className="p-1.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {isDirty ? (
                            <button
                              type="button"
                              onClick={() => handleSaveRow(row.id)}
                              className="p-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-2xs transition-transform active:scale-95"
                              title="Save Changes to Work Order"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="p-1 text-emerald-600 font-bold" title="Synchronized">
                              <Check className="w-4 h-4" />
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDuplicateRow(row)}
                            className="p-1 text-[#9CA3AF] hover:text-[#14213D] hover:bg-slate-100 rounded-md transition-colors"
                            title="Duplicate row for next run"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={isCompactView ? 14 : 17} className="py-16 text-center text-xs text-[#9CA3AF] bg-[#FAF9F5]">
                    <div className="max-w-sm mx-auto space-y-2">
                      <div className="w-10 h-10 rounded-2xl bg-white border border-[#E4E0D6] text-[#9CA3AF] flex items-center justify-center mx-auto shadow-2xs">
                        <Search className="w-5 h-5" />
                      </div>
                      <div className="font-bold text-[#14213D]">No production records match criteria</div>
                      <p className="text-[11px] text-[#6B7280]">
                        Try clearing search filters or click "+ Add Manual Row" or "Upload Excel / CSV" to begin logging shift output.
                      </p>
                      <button
                        type="button"
                        onClick={handleAddNewManualRow}
                        className="mt-2 px-3.5 py-1.5 rounded-xl bg-[#0F8B8D] text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs"
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
          workOrders={workOrders}
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
                  placeholder="Enter new value (e.g. R. Kumar, Shift B, released, IMM-250T-03)..."
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
                className="px-4 py-2 rounded-xl bg-white border border-[#E4E0D6] font-bold text-xs hover:bg-[#F6F4EF]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyBulkUpdate}
                className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs"
              >
                Apply to {selectedRowIds.length} Orders
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
