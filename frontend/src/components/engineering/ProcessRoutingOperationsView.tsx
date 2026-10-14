import React, { useState, useMemo } from 'react';
import { BomRouting, RoutingOperationItem, BomMaster, ItemMaster } from '../../types';
import {
  GitFork,
  ArrowLeft,
  ChevronDown,
  Search,
  Filter,
  Plus,
  Download,
  Printer,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Cpu,
  Boxes,
  Eye,
  Sliders,
  Sparkles,
  ExternalLink,
  Shield,
  Gauge,
  Zap,
  Users,
  Activity,
  Layers,
  FileText,
  X,
  Save,
  Check,
  ArrowRight,
  TrendingUp,
  Maximize2,
} from 'lucide-react';

interface ProcessRoutingOperationsViewProps {
  routings: BomRouting[];
  boms: BomMaster[];
  items: ItemMaster[];
  selectedId?: string;
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
  openDrawer?: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer?: () => void;
}

type ViewMode = 'pipeline' | 'table' | 'capacity';

export const ProcessRoutingOperationsView: React.FC<ProcessRoutingOperationsViewProps> = ({
  routings: initialRoutings,
  boms,
  items,
  selectedId,
  onNavigate,
  showToast,
}) => {
  // Local state for routings so user can add/edit operations live
  const [routingsList, setRoutingsList] = useState<BomRouting[]>(initialRoutings);

  // Active routing ID
  const [activeRoutingId, setActiveRoutingId] = useState<string>(() => {
    if (selectedId && initialRoutings.some((r) => r.id === selectedId || r.linkedBomId === selectedId)) {
      const match = initialRoutings.find((r) => r.id === selectedId || r.linkedBomId === selectedId);
      return match ? match.id : initialRoutings[0]?.id || '';
    }
    return initialRoutings[0]?.id || '';
  });

  const [isRoutingDropdownOpen, setIsRoutingDropdownOpen] = useState(false);
  const [routingSearchQuery, setRoutingSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('pipeline');

  // Operation filters within the active routing
  const [operationSearch, setOperationSearch] = useState('');
  const [workCenterFilter, setWorkCenterFilter] = useState<string>('all');
  const [qaGateOnly, setQaGateOnly] = useState(false);

  // Selected operation for slide-over inspection or editing
  const [inspectedOp, setInspectedOp] = useState<RoutingOperationItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingOp, setEditingOp] = useState<RoutingOperationItem | null>(null);
  const [isNewOp, setIsNewOp] = useState(false);

  // Active Routing Object
  const activeRouting = useMemo(() => {
    return routingsList.find((r) => r.id === activeRoutingId) || routingsList[0];
  }, [routingsList, activeRoutingId]);

  // Linked BOM
  const linkedBom = useMemo(() => {
    if (!activeRouting) return null;
    return boms.find((b) => b.id === activeRouting.linkedBomId || b.parent === activeRouting.itemCode);
  }, [boms, activeRouting]);

  // Unique Work Centers in active routing
  const workCenters = useMemo(() => {
    if (!activeRouting) return [];
    const set = new Set<string>();
    activeRouting.operations.forEach((op) => {
      if (op.workCenter) set.add(op.workCenter);
    });
    return Array.from(set);
  }, [activeRouting]);

  // Filtered Operations
  const filteredOperations = useMemo(() => {
    if (!activeRouting) return [];
    return activeRouting.operations.filter((op) => {
      if (qaGateOnly && !op.qualityCheckpoint) return false;
      if (workCenterFilter !== 'all' && op.workCenter !== workCenterFilter) return false;
      if (operationSearch.trim()) {
        const q = operationSearch.toLowerCase();
        const matchName = op.name.toLowerCase().includes(q);
        const matchMachine = (op.machineName || '').toLowerCase().includes(q) || (op.machineId || '').toLowerCase().includes(q);
        const matchWorkCenter = op.workCenter.toLowerCase().includes(q);
        const matchInstr = (op.instructions || '').toLowerCase().includes(q);
        const matchMold = (op.moldId || '').toLowerCase().includes(q);
        return matchName || matchMachine || matchWorkCenter || matchInstr || matchMold;
      }
      return true;
    });
  }, [activeRouting, operationSearch, workCenterFilter, qaGateOnly]);

  // Executive KPI Calculations
  const metrics = useMemo(() => {
    if (!activeRouting || activeRouting.operations.length === 0) {
      return {
        totalCycleTimeSec: 0,
        bottleneckCycleTimeSec: 0,
        bottleneckOp: null as RoutingOperationItem | null,
        totalSetupTimeMin: 0,
        maxThroughputPerHour: 0,
        totalCrew: 0,
        qaGatesCount: 0,
        cumulativeScrapPct: 0,
        operationsCount: 0,
      };
    }

    const ops = activeRouting.operations;
    let totalCycle = 0;
    let totalSetup = 0;
    let totalCrew = 0;
    let qaCount = 0;
    let cumulativeScrap = 0;
    let maxCycle = 0;
    let bottleneck: RoutingOperationItem | null = null;

    ops.forEach((op) => {
      const cycle = op.cycleTimeSec || 0;
      totalCycle += cycle;
      totalSetup += op.setupTimeMin || 0;
      totalCrew += op.crewSize || 0;
      if (op.qualityCheckpoint) qaCount++;
      cumulativeScrap += op.scrapPct || 0;

      if (cycle > maxCycle) {
        maxCycle = cycle;
        bottleneck = op;
      }
    });

    // Max line throughput is determined by bottleneck cycle time
    const throughput = bottleneck && (bottleneck.outputPerHour || (maxCycle > 0 ? Math.round(3600 / maxCycle) : 0));

    return {
      totalCycleTimeSec: Number(totalCycle.toFixed(1)),
      bottleneckCycleTimeSec: Number(maxCycle.toFixed(1)),
      bottleneckOp: bottleneck,
      totalSetupTimeMin: totalSetup,
      maxThroughputPerHour: throughput || 0,
      totalCrew,
      qaGatesCount: qaCount,
      cumulativeScrapPct: Number(cumulativeScrap.toFixed(2)),
      operationsCount: ops.length,
    };
  }, [activeRouting]);

  // Handle Save / Add Operation
  const handleSaveOperation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOp || !activeRouting) return;

    if (!editingOp.name.trim()) {
      showToast('Operation name is required');
      return;
    }

    const updatedOperations = [...activeRouting.operations];
    if (isNewOp) {
      updatedOperations.push({
        ...editingOp,
        seq: editingOp.seq || (updatedOperations.length + 1) * 10,
        status: editingOp.status || 'active',
      });
      // Sort by sequence
      updatedOperations.sort((a, b) => a.seq - b.seq);
      showToast(`Added operation Seq ${editingOp.seq}: ${editingOp.name}`);
    } else {
      const idx = updatedOperations.findIndex((o) => o.seq === editingOp.seq);
      if (idx >= 0) {
        updatedOperations[idx] = editingOp;
        showToast(`Updated operation Seq ${editingOp.seq}: ${editingOp.name}`);
      }
    }

    const updatedRouting = {
      ...activeRouting,
      operations: updatedOperations,
    };

    setRoutingsList((prev) => prev.map((r) => (r.id === activeRouting.id ? updatedRouting : r)));
    setIsEditModalOpen(false);
    setEditingOp(null);
  };

  // Delete operation
  const handleDeleteOperation = (seq: number) => {
    if (!activeRouting) return;
    if (activeRouting.operations.length <= 1) {
      showToast('At least one operation step must remain in routing.');
      return;
    }
    const updated = activeRouting.operations.filter((o) => o.seq !== seq);
    const updatedRouting = { ...activeRouting, operations: updated };
    setRoutingsList((prev) => prev.map((r) => (r.id === activeRouting.id ? updatedRouting : r)));
    if (inspectedOp?.seq === seq) setInspectedOp(null);
    showToast(`Removed operation sequence ${seq}`);
  };

  // Export Routing CSV
  const handleExportCSV = () => {
    if (!activeRouting) return;
    const headers = [
      'Sequence',
      'Operation Name',
      'Work Center',
      'Machine ID',
      'Machine Name',
      'Mold / Tooling ID',
      'Setup Time (min)',
      'Cycle Time (sec)',
      'Crew Size',
      'Labor Skill',
      'Output Per Hour',
      'Scrap %',
      'QA Checkpoint',
      'Work Instructions',
    ];
    const rows = activeRouting.operations.map((op) => [
      op.seq,
      `"${op.name}"`,
      `"${op.workCenter}"`,
      `"${op.machineId || ''}"`,
      `"${op.machineName || ''}"`,
      `"${op.moldId || ''}"`,
      op.setupTimeMin,
      op.cycleTimeSec,
      op.crewSize,
      `"${op.laborSkill}"`,
      op.outputPerHour,
      `${op.scrapPct}%`,
      op.qualityCheckpoint ? 'Yes' : 'No',
      `"${(op.instructions || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Routing_Operations_${activeRouting.id}_${activeRouting.itemCode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported routing operations for ${activeRouting.itemCode} to CSV`);
  };

  // Open New Op Form
  const handleOpenNewOp = () => {
    if (!activeRouting) return;
    const maxSeq = activeRouting.operations.reduce((m, o) => Math.max(m, o.seq), 0);
    setEditingOp({
      seq: maxSeq + 10,
      name: '',
      workCenter: workCenters[0] || 'IMM Bay 01',
      machineId: '',
      machineName: '',
      setupTimeMin: 15,
      runTimeSec: 10,
      cycleTimeSec: 10,
      crewSize: 1,
      laborSkill: 'Machine Operator',
      outputPerHour: 360,
      scrapPct: 0.5,
      qualityCheckpoint: false,
      instructions: '',
      status: 'active',
    });
    setIsNewOp(true);
    setIsEditModalOpen(true);
  };

  // Open Edit Form
  const handleOpenEditOp = (op: RoutingOperationItem) => {
    setEditingOp({ ...op });
    setIsNewOp(false);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-5" id="process-routing-screen">
      {/* 1. Header Bar: Navigation, Breadcrumbs, Routing Combobox & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-[#E4E0D6]">
        {/* Left Side */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('bomList')}
            className="p-2 text-gray-500 hover:text-[#14213D] hover:bg-white rounded-xl border border-[#E4E0D6] transition-colors shadow-2xs"
            title="Back to BOM Master List"
            id="btn-routing-back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#0F8B8D] font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200 flex items-center gap-1">
                <GitFork className="w-3 h-3" /> Process Routing Engine
              </span>
              <span className="text-[11px] text-gray-400">&bull;</span>
              <span className="text-[11px] text-gray-500 font-mono">Work Center &amp; Machine Sequence</span>
            </div>
            <h1 className="text-xl font-bold text-[#14213D] flex items-center gap-2">
              <span>Process Routing Operations</span>
              <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {activeRouting.version}
              </span>
            </h1>
          </div>
        </div>

        {/* Right Side: Active Routing Switcher & View Mode Toggles */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Routing Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsRoutingDropdownOpen(!isRoutingDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-[#E4E0D6] rounded-xl text-xs font-bold text-[#14213D] hover:border-[#0F8B8D] transition-all shadow-2xs"
              id="btn-select-routing-dropdown"
            >
              <div className="w-2 h-2 rounded-full bg-teal-500" />
              <span className="text-gray-400 font-normal">Routing:</span>
              <span className="font-mono text-[#0F8B8D]">{activeRouting.id}</span>
              <span className="text-gray-700 hidden sm:inline">&mdash; {activeRouting.itemCode}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-1" />
            </button>

            {/* Dropdown Menu */}
            {isRoutingDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsRoutingDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-[#E4E0D6] p-2.5 z-30 space-y-2">
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 pt-1 flex items-center justify-between">
                    <span>Select Product Routing</span>
                    <span className="font-mono text-[10px] text-gray-500">{routingsList.length} Routings</span>
                  </div>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search by routing ID or product..."
                      value={routingSearchQuery}
                      onChange={(e) => setRoutingSearchQuery(e.target.value)}
                      className="w-full text-xs pl-8 pr-3 py-1.5 border rounded-lg bg-[#FAF9F5] border-[#E4E0D6] focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                    />
                  </div>
                  <div className="max-h-56 overflow-y-auto divide-y divide-gray-100">
                    {routingsList
                      .filter((r) => {
                        if (!routingSearchQuery) return true;
                        const q = routingSearchQuery.toLowerCase();
                        return (
                          r.id.toLowerCase().includes(q) ||
                          r.itemCode.toLowerCase().includes(q) ||
                          r.itemName.toLowerCase().includes(q)
                        );
                      })
                      .map((r) => {
                        const isCurrent = r.id === activeRouting.id;
                        return (
                          <div
                            key={r.id}
                            onClick={() => {
                              setActiveRoutingId(r.id);
                              setIsRoutingDropdownOpen(false);
                              setRoutingSearchQuery('');
                              showToast(`Switched routing to ${r.id} (${r.itemCode})`);
                            }}
                            className={`p-2 rounded-lg cursor-pointer text-xs flex items-center justify-between transition-colors ${
                              isCurrent ? 'bg-teal-50/80 font-bold border-l-4 border-l-[#0F8B8D]' : 'hover:bg-[#F6F4EF]'
                            }`}
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[#0F8B8D] font-bold">{r.id}</span>
                                <span className="font-mono text-gray-800 text-[11px]">{r.itemCode}</span>
                                <span className="text-[10px] px-1.5 py-0.2 bg-gray-100 rounded text-gray-600 font-mono">
                                  {r.version}
                                </span>
                              </div>
                              <div className="text-[11px] text-gray-600 truncate max-w-[200px]">
                                {r.itemName}
                              </div>
                            </div>
                            <div className="text-right text-[10px]">
                              <span className="font-semibold text-gray-700 block">
                                {r.operations.length} Steps
                              </span>
                              <span className="text-emerald-600 font-medium capitalize">{r.status}</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Quick Real Navigation Link to Linked BOM & Standard Cost */}
          <div className="flex items-center gap-1">
            {linkedBom && (
              <button
                onClick={() => onNavigate('bomDetail', { id: linkedBom.id })}
                className="px-2.5 py-1.5 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold flex items-center gap-1 transition-colors shadow-2xs"
                title={`Open BOM ${linkedBom.id}`}
                id="btn-nav-linked-bom"
              >
                <Layers className="w-3.5 h-3.5 text-teal-600" />
                <span>BOM {linkedBom.parent}</span>
              </button>
            )}
            <button
              onClick={() => onNavigate('productCosting')}
              className="px-2.5 py-1.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-semibold flex items-center gap-1 transition-colors shadow-2xs"
              title="Open Standard Cost Rollup Screen"
              id="btn-nav-cost-rollup"
            >
              <Activity className="w-3.5 h-3.5 text-purple-600" />
              <span>Cost Rollup</span>
            </button>
          </div>

          {/* View Modes */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E4E0D6] shadow-2xs">
            <button
              onClick={() => setViewMode('pipeline')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === 'pipeline' ? 'bg-[#14213D] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
              }`}
              id="btn-view-pipeline"
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Pipeline Flow</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === 'table' ? 'bg-[#14213D] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
              }`}
              id="btn-view-table"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Operations Grid</span>
            </button>
            <button
              onClick={() => setViewMode('capacity')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === 'capacity' ? 'bg-[#14213D] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
              }`}
              id="btn-view-capacity"
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>Takt &amp; Bottleneck</span>
            </button>
          </div>

          {/* New Operation & Export */}
          <button
            onClick={handleOpenNewOp}
            className="btn btn-sm btn-primary text-xs flex items-center gap-1 py-1.5 shadow-xs"
            id="btn-add-operation-step"
          >
            <Plus className="w-3.5 h-3.5" /> Add Step
          </button>
          <button
            onClick={handleExportCSV}
            className="btn btn-sm btn-ghost border-[#E4E0D6] text-xs py-1.5 flex items-center gap-1 shadow-2xs"
            title="Export Routing Sheet (CSV)"
            id="btn-export-routing-csv"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* 2. Executive Routing Metadata & KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 bg-white border border-[#E4E0D6] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Total Operations</span>
            <GitFork className="w-3.5 h-3.5 text-[#0F8B8D]" />
          </div>
          <div className="text-lg font-bold font-mono text-[#14213D]">
            {metrics.operationsCount} <span className="text-xs font-normal text-gray-500 font-sans">Stages</span>
          </div>
          <div className="text-[10px] text-gray-400 font-mono">Seq 10 &rarr; {metrics.operationsCount * 10}</div>
        </div>

        <div className="p-3.5 bg-white border border-[#E4E0D6] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Total Cycle Time</span>
            <Clock className="w-3.5 h-3.5 text-[#0F8B8D]" />
          </div>
          <div className="text-lg font-bold font-mono text-[#14213D]">
            {metrics.totalCycleTimeSec} <span className="text-xs font-normal text-gray-500 font-sans">sec</span>
          </div>
          <div className="text-[10px] text-gray-400">Sum across all stages</div>
        </div>

        <div className="p-3.5 bg-white border border-[#E4E0D6] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Critical Bottleneck</span>
            <AlertTriangle className="w-3.5 h-3.5 text-[#E8622C]" />
          </div>
          <div className="text-lg font-bold font-mono text-[#E8622C]">
            {metrics.bottleneckCycleTimeSec} <span className="text-xs font-normal text-gray-500 font-sans">s / part</span>
          </div>
          <div className="text-[10px] text-gray-500 truncate max-w-[140px]" title={metrics.bottleneckOp?.name || ''}>
            {metrics.bottleneckOp ? `Seq ${metrics.bottleneckOp.seq}: ${metrics.bottleneckOp.name}` : 'N/A'}
          </div>
        </div>

        <div className="p-3.5 bg-white border border-[#E4E0D6] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Peak Throughput</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-lg font-bold font-mono text-emerald-700">
            {metrics.maxThroughputPerHour.toLocaleString()} <span className="text-xs font-normal text-gray-500 font-sans">pcs/hr</span>
          </div>
          <div className="text-[10px] text-gray-400">At bottleneck capacity</div>
        </div>

        <div className="p-3.5 bg-white border border-[#E4E0D6] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Total Setup Time</span>
            <Sliders className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-lg font-bold font-mono text-slate-800">
            {metrics.totalSetupTimeMin} <span className="text-xs font-normal text-gray-500 font-sans">min</span>
          </div>
          <div className="text-[10px] text-gray-400">Tooling &amp; line prep</div>
        </div>

        <div className="p-3.5 bg-white border border-[#E4E0D6] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>QA Gate Checkpoints</span>
            <Shield className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div className="text-lg font-bold font-mono text-teal-800">
            {metrics.qaGatesCount} <span className="text-xs font-normal text-gray-500 font-sans">Gates</span>
          </div>
          <div className="text-[10px] text-gray-400">Mandatory signoffs</div>
        </div>
      </div>

      {/* 3. Filter and Search Toolbar */}
      <div className="panel bg-white p-3 rounded-xl border border-[#E4E0D6] shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search operation, machine, SOP instructions..."
            value={operationSearch}
            onChange={(e) => setOperationSearch(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 border rounded-lg bg-[#FAF9F5] border-[#E4E0D6] focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
          />
          {operationSearch && (
            <button
              onClick={() => setOperationSearch('')}
              className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto text-xs pb-1 md:pb-0">
          <span className="text-gray-400 text-[11px] font-semibold mr-1 shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Work Center:
          </span>
          <button
            onClick={() => setWorkCenterFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition-colors whitespace-nowrap ${
              workCenterFilter === 'all'
                ? 'bg-[#0F8B8D] text-white shadow-2xs'
                : 'bg-[#F6F4EF] text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Centers ({activeRouting.operations.length})
          </button>
          {workCenters.map((wc) => (
            <button
              key={wc}
              onClick={() => setWorkCenterFilter(wc)}
              className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition-colors whitespace-nowrap ${
                workCenterFilter === wc
                  ? 'bg-[#0F8B8D] text-white shadow-2xs'
                  : 'bg-[#F6F4EF] text-gray-700 hover:bg-gray-200'
              }`}
            >
              {wc}
            </button>
          ))}

          <div className="h-4 w-px bg-gray-200 mx-1" />

          {/* QA Toggle */}
          <button
            onClick={() => setQaGateOnly(!qaGateOnly)}
            className={`px-2.5 py-1 rounded-lg font-medium text-[11px] flex items-center gap-1 transition-colors whitespace-nowrap border ${
              qaGateOnly
                ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-2xs'
                : 'bg-[#F6F4EF] text-gray-600 border-transparent hover:bg-gray-200'
            }`}
          >
            <Shield className="w-3 h-3 text-amber-500" />
            <span>QA Gates Only</span>
          </button>
        </div>
      </div>

      {/* 4. Active View Mode */}
      {viewMode === 'pipeline' && (
        <div className="space-y-4">
          {/* Header Banner */}
          <div className="p-4 bg-gradient-to-r from-[#14213D] to-[#1E2E4E] text-white rounded-2xl shadow-md border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-base font-bold text-amber-300">
                  {activeRouting.itemCode}
                </span>
                <span className="text-white/80 font-semibold text-sm">
                  &mdash; {activeRouting.itemName}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono uppercase">
                  {activeRouting.status}
                </span>
              </div>
              <div className="text-xs text-white/60 flex items-center gap-3 mt-1 flex-wrap">
                <span>Routing ID: <strong className="text-white/90 font-mono">{activeRouting.id}</strong></span>
                <span>&bull;</span>
                <span>Batch Size: <strong className="text-white/90 font-mono">{activeRouting.standardBatchSize.toLocaleString()} units</strong></span>
                <span>&bull;</span>
                <span>Effective Date: <strong className="text-white/90 font-mono">{activeRouting.effectiveDate}</strong></span>
                {linkedBom && (
                  <>
                    <span>&bull;</span>
                    <span>Linked BOM: <strong className="text-teal-300 font-mono">{linkedBom.id}</strong></span>
                  </>
                )}
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-[10px] text-white/50 uppercase tracking-wider">Line Capacity / Pace</div>
              <div className="text-base font-mono font-bold text-emerald-300">
                {metrics.maxThroughputPerHour.toLocaleString()} <span className="text-xs font-normal text-white/70">pcs/hr</span>
              </div>
            </div>
          </div>

          {/* Pipeline Cards with Connection Flow */}
          <div className="space-y-3 relative">
            {filteredOperations.map((op, idx) => {
              const isBottleneck = metrics.bottleneckOp?.seq === op.seq;
              const isSelected = inspectedOp?.seq === op.seq;

              return (
                <div key={op.seq} className="relative group">
                  {/* Step Card */}
                  <div
                    className={`p-4 rounded-xl border transition-all shadow-2xs ${
                      isSelected
                        ? 'bg-amber-50/40 border-[#E8622C] ring-1 ring-[#E8622C]'
                        : isBottleneck
                        ? 'bg-white border-orange-200 hover:border-orange-400'
                        : 'bg-white border-[#E4E0D6] hover:border-[#0F8B8D]'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      {/* Left: Sequence, Title & Badges */}
                      <div className="flex items-start sm:items-center gap-3">
                        <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 text-[#14213D] shrink-0 font-mono">
                          <span className="text-[10px] text-gray-400 uppercase font-bold">Seq</span>
                          <span className="text-sm font-bold">{op.seq}</span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-[#14213D] group-hover:text-[#0F8B8D] transition-colors">
                              {op.name}
                            </h3>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                              {op.workCenter}
                            </span>
                            {op.machineId && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-50 text-[#0F8B8D] border border-teal-200 flex items-center gap-1">
                                <Cpu className="w-3 h-3" />
                                <span>{op.machineId} &middot; {op.machineName}</span>
                              </span>
                            )}
                            {op.moldId && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                                <Boxes className="w-3 h-3" />
                                <span>{op.moldId}</span>
                              </span>
                            )}
                            {isBottleneck && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-300 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Critical Bottleneck
                              </span>
                            )}
                            {op.qualityCheckpoint && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                <Shield className="w-3 h-3 text-emerald-600" /> Mandatory QA Gate
                              </span>
                            )}
                          </div>

                          {/* Detail specs */}
                          <div className="text-[11px] text-gray-500 flex items-center gap-3 flex-wrap">
                            <span>
                              Cycle: <strong className="font-mono text-[#14213D]">{op.cycleTimeSec}s</strong>
                            </span>
                            <span>&bull;</span>
                            <span>
                              Setup: <strong className="font-mono text-gray-700">{op.setupTimeMin} min</strong>
                            </span>
                            <span>&bull;</span>
                            <span>
                              Crew: <strong className="text-gray-700">{op.crewSize} ({op.laborSkill})</strong>
                            </span>
                            <span>&bull;</span>
                            <span>
                              Output: <strong className="font-mono text-emerald-700">{op.outputPerHour.toLocaleString()} pcs/hr</strong>
                            </span>
                            <span>&bull;</span>
                            <span>
                              Scrap: <strong className="font-mono text-rose-600">{op.scrapPct}%</strong>
                            </span>
                          </div>

                          {op.instructions && (
                            <div className="text-[11px] text-gray-600 bg-[#FAF9F5] p-2 rounded-lg border border-[#E4E0D6] flex items-start gap-1.5 mt-1.5">
                              <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{op.instructions}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100">
                        <button
                          onClick={() => setInspectedOp(op)}
                          className="btn btn-sm btn-ghost border border-[#E4E0D6] text-xs py-1 px-2.5 flex items-center gap-1 hover:border-[#0F8B8D]"
                          title="Inspect Operation Parameters"
                        >
                          <Eye className="w-3.5 h-3.5 text-gray-500" />
                          <span>Inspect</span>
                        </button>
                        <button
                          onClick={() => handleOpenEditOp(op)}
                          className="p-1.5 rounded-lg border border-[#E4E0D6] text-gray-500 hover:text-purple-700 hover:bg-purple-50 transition-colors"
                          title="Edit Operation Parameters"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteOperation(op.seq)}
                          className="p-1.5 rounded-lg border border-[#E4E0D6] text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Operation Step"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Flow Connector Arrow between steps */}
                  {idx < filteredOperations.length - 1 && (
                    <div className="flex justify-center my-1 text-gray-300">
                      <div className="flex items-center gap-1 text-[10px] font-mono text-gray-400 bg-[#FAF9F5] px-2 py-0.5 rounded-full border border-gray-200">
                        <span>Flow Transfer</span>
                        <ArrowRight className="w-3 h-3 text-[#0F8B8D]" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Table View Mode */}
      {viewMode === 'table' && (
        <div className="panel bg-white rounded-2xl border border-[#E4E0D6] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF9F5] border-b border-[#E4E0D6] text-gray-600 uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-3 px-3">Seq</th>
                  <th className="py-3 px-3">Operation Name</th>
                  <th className="py-3 px-3">Work Center</th>
                  <th className="py-3 px-3">Machine / Tooling</th>
                  <th className="py-3 px-3 text-right">Setup (min)</th>
                  <th className="py-3 px-3 text-right">Cycle (sec)</th>
                  <th className="py-3 px-3 text-center">Crew</th>
                  <th className="py-3 px-3">Labor Skill</th>
                  <th className="py-3 px-3 text-right">Output/Hr</th>
                  <th className="py-3 px-3 text-right">Scrap %</th>
                  <th className="py-3 px-3 text-center">QA Gate</th>
                  <th className="py-3 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E0D6]">
                {filteredOperations.map((op) => {
                  const isBottleneck = metrics.bottleneckOp?.seq === op.seq;
                  return (
                    <tr
                      key={op.seq}
                      className={`hover:bg-[#FAF9F5] transition-colors ${
                        isBottleneck ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-[#14213D]">{op.seq}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-[#14213D] flex items-center gap-1.5">
                          <span>{op.name}</span>
                          {isBottleneck && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-orange-100 text-orange-800 font-bold uppercase">
                              Pacer
                            </span>
                          )}
                        </div>
                        {op.instructions && (
                          <div className="text-[10px] text-gray-500 truncate max-w-[220px]">
                            {op.instructions}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-gray-700">{op.workCenter}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-gray-600">
                        {op.machineId ? (
                          <div>
                            <span className="text-[#0F8B8D] font-bold">{op.machineId}</span>
                            {op.moldId && <span className="text-gray-400 ml-1">({op.moldId})</span>}
                          </div>
                        ) : (
                          <span className="text-gray-400">Manual Station</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-gray-700">{op.setupTimeMin}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#14213D]">
                        {op.cycleTimeSec}s
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-gray-700">{op.crewSize}</td>
                      <td className="py-2.5 px-3 text-gray-600">{op.laborSkill}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                        {op.outputPerHour.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-rose-600">{op.scrapPct}%</td>
                      <td className="py-2.5 px-3 text-center">
                        {op.qualityCheckpoint ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                            <Shield className="w-2.5 h-2.5 text-emerald-600" /> Yes
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[10px]">No</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setInspectedOp(op)}
                            className="p-1 hover:bg-gray-100 rounded text-gray-500"
                            title="Inspect Operation"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditOp(op)}
                            className="p-1 hover:bg-gray-100 rounded text-purple-700"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteOperation(op.seq)}
                            className="p-1 hover:bg-gray-100 rounded text-rose-600"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Bottleneck & Capacity Analysis View */}
      {viewMode === 'capacity' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Cycle Time Bar Chart Breakdown */}
          <div className="lg:col-span-2 panel bg-white p-5 rounded-2xl border border-[#E4E0D6] shadow-2xs space-y-4">
            <div className="border-b border-[#E4E0D6] pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-[#0F8B8D]" /> Stage Cycle Time &amp; Line Takt Pace
                </h3>
                <p className="text-xs text-gray-500">
                  Critical path bottleneck limits total line velocity to {metrics.maxThroughputPerHour.toLocaleString()} pcs/hr.
                </p>
              </div>
              <div className="text-right font-mono text-xs">
                <span className="text-gray-400">Total Cycle:</span>{' '}
                <strong className="text-[#14213D]">{metrics.totalCycleTimeSec}s</strong>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {activeRouting.operations.map((op) => {
                const maxCycle = metrics.bottleneckCycleTimeSec || 1;
                const pctOfMax = (op.cycleTimeSec / maxCycle) * 100;
                const isBottleneck = metrics.bottleneckOp?.seq === op.seq;

                return (
                  <div key={op.seq} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-gray-500">Seq {op.seq}</span>
                        <span className="font-semibold text-[#14213D]">{op.name}</span>
                        {isBottleneck && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-orange-100 text-orange-800 font-bold">
                            Bottleneck Pacer
                          </span>
                        )}
                      </div>
                      <div className="font-mono font-bold text-[#14213D] flex items-center gap-2">
                        <span>{op.cycleTimeSec}s</span>
                        <span className="text-[10px] text-gray-400 font-normal">
                          ({op.outputPerHour.toLocaleString()} pcs/hr)
                        </span>
                      </div>
                    </div>

                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                      <div
                        style={{ width: `${Math.max(pctOfMax, 4)}%` }}
                        className={`h-full transition-all ${
                          isBottleneck ? 'bg-[#E8622C]' : 'bg-[#0F8B8D]'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Work Center & Staffing Summary Card */}
          <div className="lg:col-span-1 panel bg-white p-5 rounded-2xl border border-[#E4E0D6] shadow-2xs space-y-4">
            <div className="border-b border-[#E4E0D6] pb-3">
              <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#0F8B8D]" /> Operator Crew Allocation
              </h3>
              <p className="text-xs text-gray-500">Direct labor staffing per production run</p>
            </div>

            <div className="space-y-2.5 divide-y divide-gray-100">
              {activeRouting.operations.map((op) => (
                <div key={op.seq} className="pt-2 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-[#14213D]">{op.laborSkill}</div>
                    <div className="text-[10px] text-gray-400">{op.workCenter}</div>
                  </div>
                  <div className="font-mono font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                    {op.crewSize} Operator{op.crewSize === 1 ? '' : 's'}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-[#E4E0D6] flex items-center justify-between text-xs font-bold">
              <span className="text-gray-700">Total Direct Crew Required:</span>
              <span className="font-mono text-[#0F8B8D] text-sm">{metrics.totalCrew} Persons</span>
            </div>
          </div>
        </div>
      )}

      {/* 7. Slide-over Inspector Drawer for Selected Operation */}
      {inspectedOp && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-2xs transition-opacity"
            onClick={() => setInspectedOp(null)}
          />
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl border-l border-[#E4E0D6] flex flex-col">
              {/* Drawer Header */}
              <div className="p-4 border-b border-[#E4E0D6] flex items-center justify-between bg-[#FAF9F5]">
                <div>
                  <div className="font-mono text-[10px] text-[#0F8B8D] uppercase tracking-wider font-bold">
                    Operation Specifications &bull; Seq {inspectedOp.seq}
                  </div>
                  <h2 className="text-base font-bold text-[#14213D]">{inspectedOp.name}</h2>
                </div>
                <button
                  onClick={() => setInspectedOp(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
                {/* Status & Work Center */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block">Work Center</span>
                    <strong className="text-gray-800">{inspectedOp.workCenter}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block">Station Status</span>
                    <span className="inline-block text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                      {inspectedOp.status}
                    </span>
                  </div>
                </div>

                {/* Machine & Tooling specs */}
                <div className="space-y-2">
                  <h4 className="font-bold text-[#14213D] uppercase text-[10px] tracking-wider text-gray-400">
                    Machine &amp; Tooling Setup
                  </h4>
                  <div className="p-3 border border-[#E4E0D6] rounded-xl space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Machine Name:</span>
                      <strong className="text-[#14213D]">{inspectedOp.machineName || 'Manual Workstation'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Machine ID:</span>
                      <span className="font-mono text-[#0F8B8D] font-bold">{inspectedOp.machineId || 'N/A'}</span>
                    </div>
                    {inspectedOp.moldId && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Tooling / Mold ID:</span>
                        <span className="font-mono text-purple-700 font-bold">{inspectedOp.moldId}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Kinetics & Throughput */}
                <div className="space-y-2">
                  <h4 className="font-bold text-[#14213D] uppercase text-[10px] tracking-wider text-gray-400">
                    Production Kinetics &amp; Scrap
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 border border-[#E4E0D6] rounded-lg">
                      <span className="text-[10px] text-gray-400 block">Cycle Time</span>
                      <strong className="font-mono text-sm text-[#14213D]">{inspectedOp.cycleTimeSec} sec</strong>
                    </div>
                    <div className="p-2.5 border border-[#E4E0D6] rounded-lg">
                      <span className="text-[10px] text-gray-400 block">Setup Time</span>
                      <strong className="font-mono text-sm text-gray-700">{inspectedOp.setupTimeMin} min</strong>
                    </div>
                    <div className="p-2.5 border border-[#E4E0D6] rounded-lg">
                      <span className="text-[10px] text-gray-400 block">Output Rate</span>
                      <strong className="font-mono text-sm text-emerald-700">
                        {inspectedOp.outputPerHour.toLocaleString()} pcs/hr
                      </strong>
                    </div>
                    <div className="p-2.5 border border-[#E4E0D6] rounded-lg">
                      <span className="text-[10px] text-gray-400 block">Scrap Allowance</span>
                      <strong className="font-mono text-sm text-rose-600">{inspectedOp.scrapPct}%</strong>
                    </div>
                  </div>
                </div>

                {/* Operator Skill & Crew */}
                <div className="p-3 border border-[#E4E0D6] rounded-xl space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Crew Size:</span>
                    <span className="font-mono font-bold text-gray-800">{inspectedOp.crewSize} Operator(s)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Required Skill Level:</span>
                    <strong className="text-[#14213D]">{inspectedOp.laborSkill}</strong>
                  </div>
                </div>

                {/* QA Checkpoint Callout */}
                {inspectedOp.qualityCheckpoint && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-emerald-900">
                    <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-xs">Mandatory Quality Gate</strong>
                      <p className="text-[11px] text-emerald-700 mt-0.5">
                        Batch cannot advance to subsequent operation without electronic QA inspector signoff on shop-floor terminal.
                      </p>
                    </div>
                  </div>
                )}

                {/* Work Instructions / SOP */}
                {inspectedOp.instructions && (
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-[#14213D] uppercase text-[10px] tracking-wider text-gray-400">
                      Standard Operating Procedure (SOP)
                    </h4>
                    <div className="p-3 bg-[#FAF9F5] border border-[#E4E0D6] rounded-xl text-gray-700 leading-relaxed font-sans text-xs">
                      {inspectedOp.instructions}
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-[#E4E0D6] bg-gray-50 flex items-center justify-between">
                <button
                  onClick={() => {
                    handleOpenEditOp(inspectedOp);
                    setInspectedOp(null);
                  }}
                  className="btn btn-sm btn-primary text-xs flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit Parameters
                </button>
                <button
                  onClick={() => setInspectedOp(null)}
                  className="btn btn-sm btn-ghost text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. Add / Edit Operation Modal */}
      {isEditModalOpen && editingOp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E4E0D6] max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#14213D]">
                  {isNewOp ? 'Add New Operation Step' : `Edit Operation Seq ${editingOp.seq}`}
                </h3>
                <p className="text-xs text-gray-500">Configure parameters for {activeRouting.itemCode}</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveOperation} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Sequence #</label>
                  <input
                    type="number"
                    value={editingOp.seq}
                    onChange={(e) => setEditingOp({ ...editingOp, seq: parseInt(e.target.value) || 10 })}
                    className="w-full p-2 border border-[#E4E0D6] rounded-lg font-mono bg-[#FAF9F5]"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-gray-600 font-semibold mb-1">Operation Name</label>
                  <input
                    type="text"
                    placeholder="e.g. High-Precision Injection Molding"
                    value={editingOp.name}
                    onChange={(e) => setEditingOp({ ...editingOp, name: e.target.value })}
                    className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-[#FAF9F5]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Work Center</label>
                  <input
                    type="text"
                    value={editingOp.workCenter}
                    onChange={(e) => setEditingOp({ ...editingOp, workCenter: e.target.value })}
                    className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-[#FAF9F5]"
                    placeholder="e.g. IMM Cell A"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Machine Name / ID</label>
                  <input
                    type="text"
                    value={editingOp.machineName || ''}
                    onChange={(e) => setEditingOp({ ...editingOp, machineName: e.target.value, machineId: e.target.value ? `MC-${editingOp.seq}` : '' })}
                    className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-[#FAF9F5]"
                    placeholder="e.g. Engel 250T (IMM-01)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Cycle Time (sec)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingOp.cycleTimeSec}
                    onChange={(e) => {
                      const c = parseFloat(e.target.value) || 0;
                      const throughput = c > 0 ? Math.round(3600 / c) : 0;
                      setEditingOp({ ...editingOp, cycleTimeSec: c, outputPerHour: throughput });
                    }}
                    className="w-full p-2 border border-[#E4E0D6] rounded-lg font-mono bg-[#FAF9F5]"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Setup Time (min)</label>
                  <input
                    type="number"
                    value={editingOp.setupTimeMin}
                    onChange={(e) => setEditingOp({ ...editingOp, setupTimeMin: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border border-[#E4E0D6] rounded-lg font-mono bg-[#FAF9F5]"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Scrap %</label>
                  <input
                    type="number"
                    step="0.05"
                    value={editingOp.scrapPct}
                    onChange={(e) => setEditingOp({ ...editingOp, scrapPct: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border border-[#E4E0D6] rounded-lg font-mono bg-[#FAF9F5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Crew Size (operators)</label>
                  <input
                    type="number"
                    value={editingOp.crewSize}
                    onChange={(e) => setEditingOp({ ...editingOp, crewSize: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border border-[#E4E0D6] rounded-lg font-mono bg-[#FAF9F5]"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Labor Skill Grade</label>
                  <input
                    type="text"
                    value={editingOp.laborSkill}
                    onChange={(e) => setEditingOp({ ...editingOp, laborSkill: e.target.value })}
                    className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-[#FAF9F5]"
                    placeholder="e.g. IMM Senior Operator"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-600 font-semibold mb-1">Standard Operating Instructions (SOP)</label>
                <textarea
                  rows={3}
                  value={editingOp.instructions}
                  onChange={(e) => setEditingOp({ ...editingOp, instructions: e.target.value })}
                  className="w-full p-2 border border-[#E4E0D6] rounded-lg bg-[#FAF9F5]"
                  placeholder="Specific shop-floor instructions, cooling water temperature, pressure checkpoints..."
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chk-qa-checkpoint"
                  checked={editingOp.qualityCheckpoint}
                  onChange={(e) => setEditingOp({ ...editingOp, qualityCheckpoint: e.target.checked })}
                  className="w-4 h-4 text-[#0F8B8D] rounded accent-[#0F8B8D]"
                />
                <label htmlFor="chk-qa-checkpoint" className="text-gray-700 font-semibold cursor-pointer">
                  Mandatory Quality Gate Checkpoint (Requires QC release before next sequence)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E4E0D6]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="btn btn-sm btn-ghost text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-sm btn-primary text-xs flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" /> Save Operation Step
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
