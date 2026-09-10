import React, { useState } from 'react';
import { WorkOrder, MachineMaster, ItemMaster, BomMaster } from '../../types';
import { MoldMaster } from '../../data/manufacturingData';
import {
  Search,
  Filter,
  Plus,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  Layers,
  ChevronRight,
  Sparkles,
  Calendar,
  Clock,
  Inbox,
  UserCheck,
  Zap,
  Tag,
  Eye,
  SlidersHorizontal,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { PaginationBar } from '../common/PaginationBar';

interface WorkOrderManagerProps {
  workOrders: WorkOrder[];
  machines: MachineMaster[];
  items: ItemMaster[];
  boms: BomMaster[];
  molds: MoldMaster[];
  onNavigate: (view: string, param?: any) => void;
  onUpdateWO: (wo: WorkOrder) => void;
  onCreateWO: (wo: WorkOrder) => void;
  onDeleteWO: (id: string) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  openConfirm: (title: string, message: string, onConfirm: () => void) => void;
  showToast: (msg: string) => void;
}

export const WorkOrderManager: React.FC<WorkOrderManagerProps> = ({
  workOrders,
  machines,
  items,
  boms,
  molds,
  onNavigate,
  onUpdateWO,
  onCreateWO,
  onDeleteWO,
  openDrawer,
  closeDrawer,
  openConfirm,
  showToast,
}) => {
  const [activeSavedView, setActiveSavedView] = useState<string>('all');
  const [searchQuery, setSearchTerm] = useState<string>('');
  const [selectedMachine, setSelectedMachine] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [sortKey, setSortKey] = useState<string>('dueDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const itemName = (code: string) => items.find((i) => i.code === code)?.name || code;

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  // Filter & Sort logic
  const filteredOrders = workOrders.filter((wo) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchId = wo.id.toLowerCase().includes(q);
      const matchItem = wo.item.toLowerCase().includes(q) || itemName(wo.item).toLowerCase().includes(q);
      const matchOp = wo.operator?.toLowerCase().includes(q);
      if (!matchId && !matchItem && !matchOp) return false;
    }
    if (selectedMachine !== 'all' && wo.machine !== selectedMachine) return false;
    if (selectedStatus !== 'all' && wo.status !== selectedStatus) return false;
    if (selectedPriority !== 'all' && wo.priority !== selectedPriority) return false;

    if (activeSavedView === 'today') return wo.planDate === '2026-08-21' || wo.dueDate?.includes('22');
    if (activeSavedView === 'in_progress') return wo.status === 'in_progress';
    if (activeSavedView === 'pending_mat') return wo.status === 'material_wait';
    if (activeSavedView === 'quality_hold') return wo.status === 'quality_hold';
    if (activeSavedView === 'completed') return wo.status === 'completed';

    return true;
  }).sort((a, b) => {
    let aVal: any = a[sortKey as keyof WorkOrder] ?? '';
    let bVal: any = b[sortKey as keyof WorkOrder] ?? '';
    if (sortKey === 'product') {
      aVal = itemName(a.item);
      bVal = itemName(b.item);
    }
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    }
    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();
    return sortDir === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
  });

  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
  const pagedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSelectRow = (id: string) => {
    setSelectedRowIds((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedRowIds.length === filteredOrders.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(filteredOrders.map((w) => w.id));
    }
  };

  const handleBatchRelease = () => {
    if (!selectedRowIds.length) {
      showToast('Select at least one work order');
      return;
    }
    selectedRowIds.forEach((id) => {
      const wo = workOrders.find((w) => w.id === id);
      if (wo && wo.status === 'planned') {
        onUpdateWO({
          ...wo,
          status: 'released',
          releasedBy: 'Priya Rao (Planner)',
          releasedDate: 'Just now',
          history: [{ event: 'Batch released to production floor', time: 'Just now' }, ...(wo.history || [])]
        });
      }
    });
    showToast(`Batch released ${selectedRowIds.length} work orders to production`);
    setSelectedRowIds([]);
  };

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + ["WO Number,Item Code,Product Name,Planned Qty,Completed Qty,Scrap Qty,Status,Machine,Priority,Due Date"]
        .concat(filteredOrders.map(w => `${w.id},${w.item},"${itemName(w.item)}",${w.qty},${w.completed},${w.scrap},${w.status},${w.machine || 'Unassigned'},${w.priority},${w.dueDate}`))
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `work_orders_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Work Orders CSV exported successfully');
  };

  const openCreateModal = () => {
    let itemCode = items.find((i) => i.type === 'Finished Good')?.code || 'FG-CTN-500';
    let machine = 'IMM-250T-03';
    let qty = 5000;
    let uom = 'PCS';
    let priority: 'Low' | 'Medium' | 'High' = 'Medium';
    let dueDate = '2026-08-30';
    let shift = 'Shift A';

    const handleSave = () => {
      const itemObj = items.find((i) => i.code === itemCode);
      const bom = boms.find((b) => b.parent === itemCode && b.status === 'released');

      const newWO: WorkOrder = {
        id: `WO-${1193 + workOrders.length}`,
        item: itemCode,
        bomId: bom ? bom.id : null,
        machine,
        day: 'Fri',
        qty,
        uom,
        completed: 0,
        scrap: 0,
        status: 'planned',
        priority,
        dueDate,
        operator: 'R. Kumar',
        downtimeMin: 0,
        mold: 'MLD-1001',
        jitSeq: workOrders.length + 1,
        shift,
        planDate: dueDate,
        cycleTimeStd: itemObj?.standardCycleTime || 12.0,
        locInput: 'RM-WH-01',
        locOutput: 'FG-WH-01',
        outputLogs: [],
        downtimeLogs: [],
        checklist: [
          { label: 'Visual inspection — no flash/burrs', done: false },
          { label: 'Wall thickness within tolerance', done: false },
          { label: 'Weight check (±2g)', done: false },
        ],
        history: [{ event: 'Work order created', time: 'Today' }],
        parameters: [
          { zone: 'Barrel Zone 1', target: '205°C', actual: '205°C', inSpec: true },
          { zone: 'Injection pressure', target: '850 bar', actual: '850 bar', inSpec: true },
        ],
        signoffs: { operator: false, supervisor: false, qa: false },
      };
      onCreateWO(newWO);
      closeDrawer();
      showToast(`Work order ${newWO.id} created`);
    };

    openDrawer(
      'Create Single Work Order',
      <div className="space-y-4 text-xs">
        <div className="space-y-1">
          <label className="font-bold text-[#14213D]">Finished Good Item</label>
          <select
            defaultValue={itemCode}
            onChange={(e) => (itemCode = e.target.value)}
            className="w-full p-2.5 rounded-xl border border-[#E4E0D6] bg-white font-medium"
          >
            {items.filter((i) => i.type === 'Finished Good').map((i) => (
              <option key={i.code} value={i.code}>{i.code} &mdash; {i.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="font-bold text-[#14213D]">Planned Quantity</label>
            <input
              type="number"
              defaultValue={qty}
              onChange={(e) => (qty = parseInt(e.target.value) || 0)}
              className="w-full p-2.5 rounded-xl border border-[#E4E0D6] bg-white font-medium"
            />
          </div>
          <div className="space-y-1">
            <label className="font-bold text-[#14213D]">UOM</label>
            <input
              type="text"
              defaultValue={uom}
              disabled
              className="w-full p-2.5 rounded-xl border border-[#E4E0D6] bg-[#F6F4EF] font-medium"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="font-bold text-[#14213D]">Assigned Machine Bay</label>
            <select
              defaultValue={machine}
              onChange={(e) => (machine = e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[#E4E0D6] bg-white font-medium"
            >
              {machines.filter(m => m.type.includes('Molding') || m.type.includes('Extrusion')).map((m) => (
                <option key={m.id} value={m.id}>{m.id} &mdash; {m.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="font-bold text-[#14213D]">Shift Assignment</label>
            <select
              defaultValue={shift}
              onChange={(e) => (shift = e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[#E4E0D6] bg-white font-medium"
            >
              <option value="Shift A">Shift A (06:00 - 14:00)</option>
              <option value="Shift B">Shift B (14:00 - 22:00)</option>
              <option value="Shift C">Shift C (22:00 - 06:00)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="font-bold text-[#14213D]">Priority</label>
            <select
              defaultValue={priority}
              onChange={(e) => (priority = e.target.value as any)}
              className="w-full p-2.5 rounded-xl border border-[#E4E0D6] bg-white font-medium"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High (Urgent)</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="font-bold text-[#14213D]">Target Due Date</label>
            <input
              type="date"
              defaultValue={dueDate}
              onChange={(e) => (dueDate = e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[#E4E0D6] bg-white font-medium"
            />
          </div>
        </div>
      </div>,
      <div className="flex justify-end gap-2 w-full">
        <button className="px-3 py-1.5 rounded-xl bg-slate-100 font-bold text-xs" onClick={closeDrawer}>
          Cancel
        </button>
        <button className="px-4 py-1.5 rounded-xl bg-[#0F8B8D] text-white font-bold text-xs" onClick={handleSave}>
          Create &amp; Save
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E4E0D6] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#0F8B8D]/10 text-[#0F8B8D]">
              Shop Floor Execution
            </span>
            <span className="text-[11px] text-[#6B7280]">
              Total {workOrders.length} Work Orders Registered
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#14213D]">Work Order Management</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('createWoGrid')}
            className="px-3 py-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            Bulk Creation Wizard (100+)
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-[#E4E0D6] text-xs font-bold text-[#14213D] flex items-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Export Excel/CSV
          </button>
          <button
            onClick={openCreateModal}
            className="px-3 py-2 rounded-xl bg-[#0F8B8D] text-white hover:bg-[#0c7072] text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            + New Work Order
          </button>
        </div>
      </div>

      {/* Saved Views Filter Tabs */}
      <div className="flex bg-[#F6F4EF] p-1.5 rounded-2xl border border-[#E4E0D6] overflow-x-auto text-xs font-semibold gap-1">
        {[
          { id: 'all', label: 'All Orders' },
          { id: 'today', label: "Today's Schedule" },
          { id: 'in_progress', label: 'In Progress' },
          { id: 'pending_mat', label: 'Pending Material' },
          { id: 'quality_hold', label: 'Quality Hold' },
          { id: 'completed', label: 'Completed' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSavedView(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              activeSavedView === tab.id
                ? 'bg-white text-[#14213D] shadow-xs font-bold'
                : 'text-[#6B7280] hover:text-[#14213D]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Multi-Faceted Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E4E0D6] shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search WO#, item code, operator..."
              value={searchQuery}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E4E0D6] bg-white font-medium"
            />
          </div>

          <select
            value={selectedMachine}
            onChange={(e) => setSelectedMachine(e.target.value)}
            className="w-full p-2 rounded-xl border border-[#E4E0D6] bg-white font-semibold text-[#14213D]"
          >
            <option value="all">All Machines / Bays</option>
            {machines.map((m) => (
              <option key={m.id} value={m.id}>{m.id} &mdash; {m.name}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full p-2 rounded-xl border border-[#E4E0D6] bg-white font-semibold text-[#14213D]"
          >
            <option value="all">All Statuses</option>
            <option value="planned">Planned</option>
            <option value="released">Released</option>
            <option value="in_progress">In Progress</option>
            <option value="material_wait">Material Wait</option>
            <option value="quality_hold">Quality Hold</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="w-full p-2 rounded-xl border border-[#E4E0D6] bg-white font-semibold text-[#14213D]"
          >
            <option value="all">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
        </div>

        {/* Selected Batch Action Toolbar */}
        {selectedRowIds.length > 0 && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs animate-in fade-in">
            <div className="font-bold text-purple-950 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping" />
              {selectedRowIds.length} Work Orders Selected
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBatchRelease}
                className="px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold"
              >
                Batch Release to Floor
              </button>
              <button
                onClick={() => {
                  showToast(`Sent ${selectedRowIds.length} digital travelers to thermal router printer`);
                }}
                className="px-3 py-1.5 rounded-lg bg-white border border-purple-300 text-purple-900 font-bold flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" /> Print Travelers
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Work Order Table */}
      <div className="bg-white rounded-2xl border border-[#E4E0D6] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-[#F6F4EF] text-[#6B7280] border-b border-[#E4E0D6] select-none text-[11px] uppercase tracking-wider font-bold">
                <th className="p-3 text-center w-10">
                  <input
                    type="checkbox"
                    checked={selectedRowIds.length === filteredOrders.length && filteredOrders.length > 0}
                    onChange={handleSelectAll}
                    className="rounded text-[#0F8B8D] cursor-pointer"
                  />
                </th>
                <th
                  onClick={() => handleSort('id')}
                  className="p-3 text-left cursor-pointer hover:bg-[#EDE9E0] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>WO #</span>
                    {sortKey === 'id' ? (
                      sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-[#0F8B8D]" /> : <ArrowDown className="w-3 h-3 text-[#0F8B8D]" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-30" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('product')}
                  className="p-3 text-left cursor-pointer hover:bg-[#EDE9E0] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Finished Good / Product</span>
                    {sortKey === 'product' ? (
                      sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-[#0F8B8D]" /> : <ArrowDown className="w-3 h-3 text-[#0F8B8D]" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-30" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('machine')}
                  className="p-3 text-left cursor-pointer hover:bg-[#EDE9E0] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Bay / Mold</span>
                    {sortKey === 'machine' ? (
                      sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-[#0F8B8D]" /> : <ArrowDown className="w-3 h-3 text-[#0F8B8D]" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-30" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('qty')}
                  className="p-3 text-right cursor-pointer hover:bg-[#EDE9E0] transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Target</span>
                    {sortKey === 'qty' ? (
                      sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-[#0F8B8D]" /> : <ArrowDown className="w-3 h-3 text-[#0F8B8D]" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-30" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('completed')}
                  className="p-3 text-right cursor-pointer hover:bg-[#EDE9E0] transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Completed</span>
                    {sortKey === 'completed' ? (
                      sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-[#0F8B8D]" /> : <ArrowDown className="w-3 h-3 text-[#0F8B8D]" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-30" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('scrap')}
                  className="p-3 text-right cursor-pointer hover:bg-[#EDE9E0] transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Scrap</span>
                    {sortKey === 'scrap' ? (
                      sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-[#0F8B8D]" /> : <ArrowDown className="w-3 h-3 text-[#0F8B8D]" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-30" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('status')}
                  className="p-3 text-center cursor-pointer hover:bg-[#EDE9E0] transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Status</span>
                    {sortKey === 'status' ? (
                      sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-[#0F8B8D]" /> : <ArrowDown className="w-3 h-3 text-[#0F8B8D]" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-30" />
                    )}
                  </div>
                </th>
                <th className="p-3 text-left">Shift &bull; Op</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedOrders.length > 0 ? (
                pagedOrders.map((wo) => {
                const isSelected = selectedRowIds.includes(wo.id);
                const progressPct = Math.min(100, Math.round((wo.completed / wo.qty) * 100));

                let badgeCls = 'bg-slate-100 text-slate-800 border-slate-200';
                if (wo.status === 'in_progress') badgeCls = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                if (wo.status === 'quality_hold') badgeCls = 'bg-rose-100 text-rose-800 border-rose-200';
                if (wo.status === 'material_wait') badgeCls = 'bg-amber-100 text-amber-800 border-amber-200';
                if (wo.status === 'completed') badgeCls = 'bg-blue-100 text-blue-800 border-blue-200';
                if (wo.status === 'released') badgeCls = 'bg-teal-100 text-teal-800 border-teal-200';

                return (
                  <tr
                    key={wo.id}
                    className={`border-b border-[#E4E0D6] hover:bg-[#FAF9F5] transition-colors cursor-pointer ${
                      isSelected ? 'bg-purple-50/40' : ''
                    }`}
                    onClick={() => onNavigate('woDetail', { id: wo.id })}
                  >
                    <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(wo.id)}
                        className="rounded text-[#0F8B8D]"
                      />
                    </td>

                    <td className="p-3">
                      <div className="font-mono font-bold text-[#0F8B8D]">{wo.id}</div>
                      <div className="text-[10px] text-[#6B7280]">Due {wo.dueDate}</div>
                    </td>

                    <td className="p-3">
                      <div className="font-bold text-[#14213D]">{itemName(wo.item)}</div>
                      <div className="text-[10px] font-mono text-[#6B7280]">{wo.item}</div>
                    </td>

                    <td className="p-3">
                      <div className="font-mono font-semibold text-[#14213D]">{wo.machine || 'Unassigned'}</div>
                      <div className="text-[10px] text-[#6B7280]">{wo.mold || 'No mold set'}</div>
                    </td>

                    <td className="p-3 text-right font-mono font-semibold">
                      {wo.qty.toLocaleString()} {wo.uom}
                    </td>

                    <td className="p-3 text-right">
                      <div className="font-mono font-bold text-[#1F8A5F]">{wo.completed.toLocaleString()}</div>
                      <div className="text-[10px] text-[#6B7280]">{progressPct}%</div>
                    </td>

                    <td className="p-3 text-right font-mono font-bold text-[#C4433A]">
                      {wo.scrap > 0 ? `+${wo.scrap}` : '0'}
                    </td>

                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${badgeCls}`}>
                        {wo.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="p-3">
                      <div className="font-semibold text-[#14213D]">{wo.shift || 'Shift A'}</div>
                      <div className="text-[10px] text-[#6B7280]">{wo.operator}</div>
                    </td>

                    <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onNavigate('woDetail', { id: wo.id })}
                          className="p-1.5 rounded-lg bg-[#F6F4EF] hover:bg-[#FAF9F5] text-[#14213D]"
                          title="Open Traveler"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onNavigate('shopFloor', { id: wo.id })}
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                          title="Shop Floor Terminal"
                        >
                          <Zap className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={10} className="py-12 text-center text-xs text-[#9CA3AF]">
                  No work orders found matching the filter criteria.
                </td>
              </tr>
            )}
            </tbody>
          </table>
        </div>
        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredOrders.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemName="work orders"
        />
      </div>
    </div>
  );
};
