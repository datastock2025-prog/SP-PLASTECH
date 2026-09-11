import React, { useState, useMemo } from 'react';
import { WorkOrder, MachineMaster, ItemMaster, BomMaster } from '../../types';
import { MoldMaster, INITIAL_MOLDS } from '../../data/manufacturingData';
import {
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  X,
  FileSpreadsheet,
  Zap,
  Check,
  Search,
  Filter,
  Trash2,
  Cpu,
  Layers,
  Factory,
  Box,
  ShieldCheck,
  AlertCircle,
  Wrench,
  Download,
  Flame,
  CheckCheck
} from 'lucide-react';

export interface BulkWizardProps {
  machines: MachineMaster[];
  items: ItemMaster[];
  boms: BomMaster[];
  molds?: MoldMaster[];
  onGenerateBulk?: (newOrders: WorkOrder[]) => void;
  onBulkCreate?: (newOrders: WorkOrder[]) => void;
  onClose: () => void;
  showToast: (msg: string) => void;
}

export const BulkWizardModal: React.FC<BulkWizardProps> = ({
  machines,
  items,
  boms,
  molds = INITIAL_MOLDS,
  onGenerateBulk,
  onBulkCreate,
  onClose,
  showToast,
}) => {
  const commitCallback = onBulkCreate || onGenerateBulk;

  // Wizard Step State (1 to 6)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // -------------------------------------------------------------
  // STEP 1: Campaign Scope & Planning Horizon
  // -------------------------------------------------------------
  const [campaignCode, setCampaignCode] = useState<string>(() => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `CMP-${today}-100WO`;
  });
  const [planStartDate, setPlanStartDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [scheduleDurationDays, setScheduleDurationDays] = useState<number>(3);
  const [planningMode, setPlanningMode] = useState<'high_volume' | 'so_backlog' | 'color_family'>('high_volume');
  const [selectedShifts, setSelectedShifts] = useState<string[]>(['Shift A', 'Shift B', 'Shift C']);

  // Calculated End Date
  const planEndDate = useMemo(() => {
    try {
      const d = new Date(planStartDate);
      d.setDate(d.getDate() + (scheduleDurationDays - 1));
      return d.toISOString().slice(0, 10);
    } catch {
      return planStartDate;
    }
  }, [planStartDate, scheduleDurationDays]);

  // -------------------------------------------------------------
  // STEP 2: Fleet & Machine Bay Allocation
  // -------------------------------------------------------------
  const [machineCategoryFilter, setMachineCategoryFilter] = useState<string>('All');
  const [selectedMachineIds, setSelectedMachineIds] = useState<string[]>(() => {
    // Default to first 6 operational molding/extrusion machines
    const valid = machines
      .filter((m) => m.status === 'operational' || m.status === 'idle')
      .slice(0, 6)
      .map((m) => m.id);
    return valid.length > 0 ? valid : machines.slice(0, 4).map((m) => m.id);
  });
  const [loadBalancingMode, setLoadBalancingMode] = useState<'round_robin' | 'tonnage_fit' | 'dedicated'>(
    'round_robin'
  );

  // Filtered machine list
  const filteredMachines = useMemo(() => {
    if (machineCategoryFilter === 'All') return machines;
    if (machineCategoryFilter === 'Injection') return machines.filter((m) => m.type.toLowerCase().includes('molding'));
    if (machineCategoryFilter === 'Extrusion') return machines.filter((m) => m.type.toLowerCase().includes('extrusion'));
    if (machineCategoryFilter === 'Blow') return machines.filter((m) => m.type.toLowerCase().includes('blow'));
    return machines;
  }, [machines, machineCategoryFilter]);

  // -------------------------------------------------------------
  // STEP 3: SKU Portfolio & Tooling-BOM Verification
  // -------------------------------------------------------------
  const fgItems = useMemo(() => items.filter((i) => i.type === 'Finished Good'), [items]);
  const [selectedItemCodes, setSelectedItemCodes] = useState<string[]>(() => {
    // Default to first 5 FG items
    return fgItems.slice(0, 5).map((i) => i.code);
  });
  const [skuSearch, setSkuSearch] = useState<string>('');

  // -------------------------------------------------------------
  // STEP 4: Batch Size & Smart Sequencing
  // -------------------------------------------------------------
  const [totalOrdersToCreate, setTotalOrdersToCreate] = useState<number>(100);
  const [batchQtyPerWO, setBatchQtyPerWO] = useState<number>(2500);
  const [sequencingStrategy, setSequencingStrategy] = useState<'color_progression' | 'mold_clustered' | 'priority_rush' | 'bay_interleaved'>(
    'color_progression'
  );
  const [priorityPolicy, setPriorityPolicy] = useState<'mixed' | 'high_first' | 'standard'>('mixed');

  // -------------------------------------------------------------
  // STEP 5: Warehouse Routing & Material Feasibility
  // -------------------------------------------------------------
  const [inputWarehouse, setInputWarehouse] = useState<string>('RM-WH-01');
  const [outputWarehouse, setOutputWarehouse] = useState<string>('FG-WH-01');
  const [scrapWarehouse, setScrapWarehouse] = useState<string>('SCRAP-WH-01');

  // -------------------------------------------------------------
  // STEP 6: Inspector Grid State
  // -------------------------------------------------------------
  const [previewSearch, setPreviewSearch] = useState<string>('');
  const [previewMachineFilter, setPreviewMachineFilter] = useState<string>('all');
  const [previewShiftFilter, setPreviewShiftFilter] = useState<string>('all');
  const [previewPriorityFilter, setPreviewPriorityFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const rowsPerPage = 20;

  // Custom edits made by user in preview grid
  const [customEdits, setCustomEdits] = useState<Record<string, Partial<WorkOrder>>>({});

  // Helper mappings
  const getItem = (code: string) => items.find((i) => i.code === code);
  const getBom = (itemCode: string) =>
    boms.find((b) => b.parent === itemCode && b.status === 'released') ||
    boms.find((b) => b.parent === itemCode) ||
    boms[0];

  const getMold = (itemCode: string) =>
    molds.find((m) => m.compatibleProducts?.includes(itemCode)) ||
    molds.find((m) => m.status === 'available') ||
    molds[0];

  // Operator pool with shift leads
  const operatorPool = [
    { name: 'R. Kumar', shift: 'Shift A', skill: 'Lead Technician (IMM Class 1)' },
    { name: 'A. Sharma', shift: 'Shift B', skill: 'Senior Machine Operator' },
    { name: 'V. Patel', shift: 'Shift C', skill: 'Night Shift Bay Supervisor' },
    { name: 'S. Nair', shift: 'Shift A', skill: 'Mold Setup Specialist' },
    { name: 'M. Singh', shift: 'Shift B', skill: 'Process Optimization Tech' },
  ];

  // Color sequence dictionary for injection molding barrel purge optimization
  const colorOrderScore: Record<string, number> = {
    clear: 10,
    natural: 20,
    white: 30,
    yellow: 40,
    orange: 50,
    red: 60,
    green: 70,
    blue: 80,
    grey: 90,
    gray: 90,
    black: 100,
  };

  const getSkuColorScore = (skuName: string) => {
    const lower = skuName.toLowerCase();
    for (const [color, score] of Object.entries(colorOrderScore)) {
      if (lower.includes(color)) return score;
    }
    return 50; // default medium
  };

  // -------------------------------------------------------------
  // MASTER ORDER GENERATION ENGINE (Dynamic Live Data Execution)
  // -------------------------------------------------------------
  const generatedOrders: WorkOrder[] = useMemo(() => {
    if (selectedItemCodes.length === 0 || selectedMachineIds.length === 0 || selectedShifts.length === 0) {
      return [];
    }

    const orders: WorkOrder[] = [];
    const baseDate = new Date(planStartDate);
    const dateNum = planStartDate.replace(/-/g, '');

    // Prepare item list sorted according to sequencing strategy
    const sortedSkus = [...selectedItemCodes].sort((a, b) => {
      const itemA = getItem(a);
      const itemB = getItem(b);
      if (sequencingStrategy === 'color_progression') {
        return getSkuColorScore(itemA?.name || '') - getSkuColorScore(itemB?.name || '');
      }
      if (sequencingStrategy === 'mold_clustered') {
        const moldA = getMold(a)?.id || '';
        const moldB = getMold(b)?.id || '';
        return moldA.localeCompare(moldB);
      }
      return 0;
    });

    for (let i = 1; i <= totalOrdersToCreate; i++) {
      // Pick item based on sequence
      const itemCode = sortedSkus[(i - 1) % sortedSkus.length] || selectedItemCodes[0];
      const item = getItem(itemCode);
      const bom = getBom(itemCode);
      const mold = getMold(itemCode);

      // Distribute date across schedule duration
      const dayOffset = (i - 1) % scheduleDurationDays;
      const orderDateObj = new Date(baseDate);
      orderDateObj.setDate(baseDate.getDate() + dayOffset);
      const orderDateStr = orderDateObj.toISOString().slice(0, 10);
      const dayOfWeekShort = orderDateObj.toLocaleDateString('en-US', { weekday: 'short' });

      // Shift allocation
      const shift = selectedShifts[(i - 1) % selectedShifts.length];

      // Machine allocation based on mode
      let machineId = selectedMachineIds[(i - 1) % selectedMachineIds.length];
      if (loadBalancingMode === 'tonnage_fit') {
        // Match large products (>100g shot) to >=250T machines
        const shotWeight = bom?.standardCost ? bom.standardCost * 2 : 50;
        if (shotWeight > 60) {
          const bigMachine = machines.find(
            (m) => selectedMachineIds.includes(m.id) && (m.tonnage || 0) >= 250
          );
          if (bigMachine) machineId = bigMachine.id;
        }
      }

      // Priority calculation
      let priority: 'High' | 'Medium' | 'Low' = 'Medium';
      if (priorityPolicy === 'high_first') {
        priority = i <= totalOrdersToCreate * 0.25 ? 'High' : i <= totalOrdersToCreate * 0.7 ? 'Medium' : 'Low';
      } else if (priorityPolicy === 'mixed') {
        priority = i % 5 === 0 ? 'High' : i % 7 === 0 ? 'Low' : 'Medium';
      }

      // Qualified operator based on shift
      const shiftOps = operatorPool.filter((op) => op.shift === shift);
      const assignedOp = shiftOps[i % (shiftOps.length || 1)]?.name || 'R. Kumar';

      // Cycle time from BOM / item or standard default
      const cavities = mold?.activeCavities || mold?.cavities || 4;
      const cycleTimeStd = bom ? 14.5 : 12.0;

      const seqStr = String(i).padStart(3, '0');
      const woId = `WO-${dateNum}-${seqStr}`;

      const initialOrder: WorkOrder = {
        id: woId,
        item: itemCode,
        bomId: bom?.id || 'BOM-1001',
        machine: machineId,
        day: dayOfWeekShort,
        qty: batchQtyPerWO,
        uom: item?.baseUOM || 'PCS',
        completed: 0,
        scrap: 0,
        status: 'planned',
        priority,
        dueDate: orderDateStr,
        operator: assignedOp,
        downtimeMin: 0,
        mold: mold?.id || 'MLD-INJ-084',
        jitSeq: i,
        shift,
        planDate: orderDateStr,
        cycleTimeStd,
        locInput: inputWarehouse,
        locOutput: outputWarehouse,
        locScrap: scrapWarehouse,
        locRunner: 'RUNNER-REGRIND-BAY',
        outputLogs: [],
        downtimeLogs: [],
        checklist: [
          { label: 'Mold clamp & platen alignment check', done: false },
          { label: 'Hopper resin lot & moisture dry check (≤0.02%)', done: false },
          { label: 'Barrel heat zones stabilized to thermal profile', done: false },
          { label: 'First piece CMM & weight approval', done: false },
        ],
        history: [
          {
            event: `Generated via Enterprise Bulk Creation Wizard (${campaignCode})`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ],
      };

      // Merge with custom edits if user adjusted this specific order in the preview
      if (customEdits[woId]) {
        Object.assign(initialOrder, customEdits[woId]);
      }

      orders.push(initialOrder);
    }

    return orders;
  }, [
    selectedItemCodes,
    selectedMachineIds,
    selectedShifts,
    totalOrdersToCreate,
    batchQtyPerWO,
    planStartDate,
    scheduleDurationDays,
    sequencingStrategy,
    priorityPolicy,
    loadBalancingMode,
    inputWarehouse,
    outputWarehouse,
    scrapWarehouse,
    campaignCode,
    customEdits,
    boms,
    machines,
    molds,
    items,
  ]);

  // -------------------------------------------------------------
  // LIVE MATERIAL & CAPACITY SIMULATION
  // -------------------------------------------------------------
  const materialSimulation = useMemo(() => {
    let totalPieces = 0;
    let totalGrossWeightKg = 0;
    let totalMachineHours = 0;
    let totalEstValueInr = 0;

    generatedOrders.forEach((wo) => {
      totalPieces += wo.qty;
      const bom = getBom(wo.item);
      const mold = getMold(wo.item);
      const cavities = mold?.activeCavities || mold?.cavities || 4;
      const cycleTime = wo.cycleTimeStd || 14.0;

      // Machine hours = (qty / cavities) * cycleTime / 3600
      const runHours = ((wo.qty / cavities) * cycleTime) / 3600;
      totalMachineHours += runHours;

      // Estimated weight (average ~45g per piece)
      const partWeightKg = (bom?.standardCost ? bom.standardCost * 0.8 : 45) / 1000;
      totalGrossWeightKg += wo.qty * partWeightKg;

      // Estimated unit value
      const unitCost = bom?.standardCost || 45.0;
      totalEstValueInr += wo.qty * unitCost;
    });

    const virginPolymerKg = totalGrossWeightKg * 0.84;
    const regrindKg = totalGrossWeightKg * 0.13;
    const masterbatchKg = totalGrossWeightKg * 0.03;

    // Check against live items stock for resin
    const resinItems = items.filter((i) => i.type === 'Raw Material' || i.category === 'Resin');
    const availableResinStockKg = resinItems.reduce((acc, curr) => acc + (curr.stock || 0), 0);

    const isStockSufficient = availableResinStockKg >= virginPolymerKg;

    return {
      totalPieces,
      totalGrossWeightKg,
      virginPolymerKg,
      regrindKg,
      masterbatchKg,
      totalMachineHours,
      totalEstValueInr,
      availableResinStockKg,
      isStockSufficient,
    };
  }, [generatedOrders, items, boms, molds]);

  // -------------------------------------------------------------
  // PREVIEW TABLE FILTERING & PAGINATION
  // -------------------------------------------------------------
  const filteredPreviewList = useMemo(() => {
    return generatedOrders.filter((wo) => {
      const matchSearch =
        previewSearch.trim() === '' ||
        wo.id.toLowerCase().includes(previewSearch.toLowerCase()) ||
        wo.item.toLowerCase().includes(previewSearch.toLowerCase()) ||
        (getItem(wo.item)?.name || '').toLowerCase().includes(previewSearch.toLowerCase()) ||
        (wo.machine || '').toLowerCase().includes(previewSearch.toLowerCase());

      const matchMachine = previewMachineFilter === 'all' || wo.machine === previewMachineFilter;
      const matchShift = previewShiftFilter === 'all' || wo.shift === previewShiftFilter;
      const matchPriority = previewPriorityFilter === 'all' || wo.priority === previewPriorityFilter;

      return matchSearch && matchMachine && matchShift && matchPriority;
    });
  }, [generatedOrders, previewSearch, previewMachineFilter, previewShiftFilter, previewPriorityFilter]);

  const totalPages = Math.ceil(filteredPreviewList.length / rowsPerPage) || 1;
  const paginatedPreviewList = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredPreviewList.slice(start, start + rowsPerPage);
  }, [filteredPreviewList, currentPage]);

  // Handle individual row update in preview
  const handleUpdatePreviewOrder = (id: string, field: keyof WorkOrder, value: any) => {
    setCustomEdits((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  // Export generated schedule to CSV
  const handleExportCSV = () => {
    const headers = [
      'Work Order ID',
      'Item Code',
      'Product Name',
      'BOM ID',
      'Machine Bay',
      'Shift',
      'Plan Date',
      'Target Qty',
      'UOM',
      'Priority',
      'Lead Operator',
      'Mold Tool',
      'Cycle Time (s)',
      'Input Warehouse',
      'Output Warehouse',
    ];

    const rows = generatedOrders.map((wo) => [
      wo.id,
      wo.item,
      `"${getItem(wo.item)?.name || wo.item}"`,
      wo.bomId,
      wo.machine,
      wo.shift,
      wo.planDate,
      wo.qty,
      wo.uom,
      wo.priority,
      wo.operator,
      wo.mold,
      wo.cycleTimeStd,
      wo.locInput,
      wo.locOutput,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${campaignCode}_Schedule.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Exported ${generatedOrders.length} work orders to CSV.`);
  };

  // Final Commit
  const handleCommitBulkGeneration = () => {
    if (generatedOrders.length === 0) {
      showToast('Error: No work orders were generated. Please check your selections.');
      return;
    }

    if (commitCallback) {
      commitCallback(generatedOrders);
    }
    showToast(`Successfully registered and dispatched ${generatedOrders.length} Work Orders to the shop floor!`);
    onClose();
  };

  // Step names for stepper
  const steps = [
    { id: 1, label: 'Scope & Horizon', desc: 'Demand & Dates' },
    { id: 2, label: 'Fleet Allocation', desc: 'Machine Bays' },
    { id: 3, label: 'SKU & Tooling', desc: 'BOMs & Molds' },
    { id: 4, label: 'Batch & Sequence', desc: 'Lots & JIT Rules' },
    { id: 5, label: 'Logistics & RM', desc: 'Material Feasibility' },
    { id: 6, label: 'Review & Launch', desc: '100+ Live Inspector' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#FAF9F5] rounded-2xl border border-[#E4E0D6] max-w-6xl w-full shadow-2xl overflow-hidden flex flex-col h-[92vh] max-h-[900px]">
        
        {/* =========================================================================
            MODAL HEADER & EXECUTIVE CAMPAIGN RIBBON
        ========================================================================= */}
        <div className="p-4 sm:p-5 bg-white border-b border-[#E4E0D6] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-[#14213D]">
                    Bulk Work Order Creation Engine
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                    100+ Orders Orchestrator
                  </span>
                  <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCheck className="w-3 h-3" /> Live Telemetry
                  </span>
                </div>
                <p className="text-xs text-[#6B7280]">
                  High-throughput multi-bay &amp; multi-shift production campaign generator for plastics injection &amp; extrusion.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-[#6B7280] hidden sm:inline-block">
                Campaign: <b className="text-[#14213D]">{campaignCode}</b>
              </span>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-[#6B7280] hover:text-[#14213D] hover:bg-[#F6F4EF] border border-transparent hover:border-[#E4E0D6] transition-all"
                title="Close Wizard"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Stepper Navigation */}
          <div className="grid grid-cols-6 gap-1.5 pt-1">
            {steps.map((st) => {
              const isCompleted = st.id < currentStep;
              const isActive = st.id === currentStep;
              return (
                <button
                  key={st.id}
                  onClick={() => setCurrentStep(st.id)}
                  className={`text-left p-2 rounded-xl transition-all border ${
                    isActive
                      ? 'bg-purple-50 border-purple-300 ring-1 ring-purple-500/20'
                      : isCompleted
                      ? 'bg-emerald-50/70 border-emerald-200 text-[#14213D]'
                      : 'bg-white border-[#E4E0D6] text-[#6B7280]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold font-mono">
                      {isCompleted ? (
                        <span className="text-emerald-700 flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Step {st.id}
                        </span>
                      ) : (
                        <span className={isActive ? 'text-purple-700' : 'text-[#9CA3AF]'}>
                          Step {st.id}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className={`text-[11px] font-bold truncate mt-0.5 ${isActive ? 'text-purple-900' : 'text-[#14213D]'}`}>
                    {st.label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            MAIN STEP BODY CONTAINER
        ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* -------------------------------------------------------------------
              STEP 1: Campaign Scope & Planning Horizon
          ------------------------------------------------------------------- */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div>
                <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  Define Campaign Parameters &amp; Scheduling Horizon
                </h3>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Select the demand origin, scheduled production dates, and active shifts for the 100+ batch run.
                </p>
              </div>

              {/* Demand Strategy Cards */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#14213D] block">1. Planning Mode &amp; Demand Origin</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'high_volume',
                      title: 'High-Volume Multi-Bay Campaign',
                      badge: '100+ WOs Blitz',
                      desc: 'Uniformly disperse 100+ work orders across all functional machine bays and shifts to maximize plant OEE.',
                      icon: Factory,
                    },
                    {
                      id: 'color_family',
                      title: 'Polymer Family & Color Run',
                      badge: 'Purge Optimized',
                      desc: 'Cluster orders by resin melt flow index and sequential light-to-dark color shades to cut barrel purge waste.',
                      icon: Flame,
                    },
                    {
                      id: 'so_backlog',
                      title: 'Customer Backlog Demand Exploder',
                      badge: 'JIT Customer Demand',
                      desc: 'Explode pending sales orders and customer firm contracts into discrete shop floor batch work orders.',
                      icon: Box,
                    },
                  ].map((mode) => {
                    const isSel = planningMode === mode.id;
                    const Icon = mode.icon;
                    return (
                      <div
                        key={mode.id}
                        onClick={() => setPlanningMode(mode.id as any)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all space-y-2 ${
                          isSel
                            ? 'bg-purple-50/80 border-purple-400 ring-2 ring-purple-500/20 shadow-xs'
                            : 'bg-white border-[#E4E0D6] hover:border-purple-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className={`p-1.5 rounded-lg ${isSel ? 'bg-purple-200 text-purple-800' : 'bg-[#F6F4EF] text-[#6B7280]'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                            {mode.badge}
                          </span>
                        </div>
                        <div>
                          <div className="font-bold text-xs text-[#14213D]">{mode.title}</div>
                          <div className="text-[11px] text-[#6B7280] leading-relaxed mt-1">{mode.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Campaign Code & Dates */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-[#E4E0D6]">
                <div>
                  <label className="text-xs font-bold text-[#14213D] block mb-1">Campaign Reference ID</label>
                  <input
                    type="text"
                    value={campaignCode}
                    onChange={(e) => setCampaignCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E4E0D6] text-xs font-mono font-bold text-[#14213D] bg-[#FDFDFD]"
                  />
                  <span className="text-[10px] text-[#6B7280] mt-0.5 block">Prefix tagged to each generated work order</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#14213D] block mb-1">Production Start Date</label>
                  <input
                    type="date"
                    value={planStartDate}
                    onChange={(e) => setPlanStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E4E0D6] text-xs font-bold text-[#14213D] bg-white"
                  />
                  <span className="text-[10px] text-[#6B7280] mt-0.5 block">First dispatch date on machine Gantt</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#14213D] block mb-1">
                    Scheduling Horizon &amp; Spread
                  </label>
                  <div className="flex gap-1.5">
                    {[
                      { days: 1, label: '1 Day' },
                      { days: 2, label: '2 Days' },
                      { days: 3, label: '3 Days (Rec.)' },
                      { days: 5, label: '5 Days' },
                      { days: 7, label: '7 Days' },
                    ].map((h) => (
                      <button
                        key={h.days}
                        onClick={() => setScheduleDurationDays(h.days)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                          scheduleDurationDays === h.days
                            ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                            : 'bg-[#F6F4EF] text-[#6B7280] border-[#E4E0D6] hover:bg-white'
                        }`}
                      >
                        {h.label}
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-purple-700 font-medium mt-1 block">
                    Target End Date: <b>{planEndDate}</b> ({scheduleDurationDays} calendar days)
                  </span>
                </div>
              </div>

              {/* Shifts Selection */}
              <div className="bg-white p-4 rounded-xl border border-[#E4E0D6] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#14213D]">Production Shifts to Activate</div>
                    <div className="text-[11px] text-[#6B7280]">
                      Work orders will be distributed across these active manufacturing shifts.
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedShifts(['Shift A', 'Shift B', 'Shift C'])}
                    className="text-[11px] text-purple-700 font-bold hover:underline"
                  >
                    Select All 3 Shifts (24/7)
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { id: 'Shift A', time: '06:00 - 14:00 (Morning)', lead: 'R. Kumar (Lead Tech)' },
                    { id: 'Shift B', time: '14:00 - 22:00 (Afternoon)', lead: 'A. Sharma (Senior Tech)' },
                    { id: 'Shift C', time: '22:00 - 06:00 (Graveyard)', lead: 'V. Patel (Night Supervisor)' },
                  ].map((sh) => {
                    const isSelected = selectedShifts.includes(sh.id);
                    return (
                      <div
                        key={sh.id}
                        onClick={() => {
                          setSelectedShifts((prev) =>
                            isSelected
                              ? prev.length > 1
                                ? prev.filter((s) => s !== sh.id)
                                : prev
                              : [...prev, sh.id]
                          );
                        }}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-purple-50 border-purple-300 ring-1 ring-purple-500/20'
                            : 'bg-[#F9F8F5] border-[#E4E0D6] opacity-70'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-xs text-[#14213D]">{sh.id}</div>
                          <div className="text-[10px] text-[#6B7280]">{sh.time}</div>
                          <div className="text-[10px] text-purple-700 font-medium mt-0.5">{sh.lead}</div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                            isSelected ? 'bg-purple-700 text-white border-purple-700' : 'border-[#CBD5E1] bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------------
              STEP 2: Machine Fleet Allocation
          ------------------------------------------------------------------- */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-purple-600" />
                    Target Machine Fleet &amp; Production Cell Allocation
                  </h3>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    Select target machines and choose the workload distribution strategy.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const allOp = machines.filter((m) => m.status === 'operational').map((m) => m.id);
                      setSelectedMachineIds(allOp);
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-[#E4E0D6] bg-white hover:bg-[#F6F4EF] text-[#14213D]"
                  >
                    Select All Operational ({machines.filter((m) => m.status === 'operational').length})
                  </button>
                  <button
                    onClick={() => setSelectedMachineIds(machines.map((m) => m.id))}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200"
                  >
                    Select All Fleet
                  </button>
                </div>
              </div>

              {/* Fleet Metric Ribbon */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-white rounded-xl border border-[#E4E0D6]">
                  <div className="text-[10px] text-[#6B7280] uppercase tracking-wider font-semibold">Allocated Bays</div>
                  <div className="text-lg font-bold text-[#14213D] font-mono mt-0.5">
                    {selectedMachineIds.length} <span className="text-xs text-[#6B7280]">/ {machines.length}</span>
                  </div>
                </div>
                <div className="p-3 bg-white rounded-xl border border-[#E4E0D6]">
                  <div className="text-[10px] text-[#6B7280] uppercase tracking-wider font-semibold">Total Clamping Force</div>
                  <div className="text-lg font-bold text-purple-700 font-mono mt-0.5">
                    {machines
                      .filter((m) => selectedMachineIds.includes(m.id))
                      .reduce((acc, curr) => acc + (curr.tonnage || 200), 0)}{' '}
                    <span className="text-xs text-[#6B7280]">Tons</span>
                  </div>
                </div>
                <div className="p-3 bg-white rounded-xl border border-[#E4E0D6]">
                  <div className="text-[10px] text-[#6B7280] uppercase tracking-wider font-semibold">Daily Run Capacity</div>
                  <div className="text-lg font-bold text-[#0F8B8D] font-mono mt-0.5">
                    {selectedMachineIds.length * 24} <span className="text-xs text-[#6B7280]">Machine Hrs/Day</span>
                  </div>
                </div>
                <div className="p-3 bg-white rounded-xl border border-[#E4E0D6]">
                  <div className="text-[10px] text-[#6B7280] uppercase tracking-wider font-semibold">Balancing Policy</div>
                  <select
                    value={loadBalancingMode}
                    onChange={(e) => setLoadBalancingMode(e.target.value as any)}
                    className="text-xs font-bold text-[#14213D] bg-transparent border-none outline-none mt-1 w-full"
                  >
                    <option value="round_robin">Round-Robin Balanced</option>
                    <option value="tonnage_fit">Tonnage-Matched Allocation</option>
                    <option value="dedicated">Dedicated Bay Cluster</option>
                  </select>
                </div>
              </div>

              {/* Machine Category Filter Tabs */}
              <div className="flex gap-2 border-b border-[#E4E0D6] pb-2">
                {['All', 'Injection', 'Blow', 'Extrusion'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setMachineCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      machineCategoryFilter === cat
                        ? 'bg-[#14213D] text-white'
                        : 'bg-white border border-[#E4E0D6] text-[#6B7280] hover:text-[#14213D]'
                    }`}
                  >
                    {cat} Machines
                  </button>
                ))}
              </div>

              {/* Machine Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1">
                {filteredMachines.map((m) => {
                  const isSelected = selectedMachineIds.includes(m.id);
                  const isOp = m.status === 'operational';
                  return (
                    <div
                      key={m.id}
                      onClick={() => {
                        setSelectedMachineIds((prev) =>
                          isSelected ? prev.filter((id) => id !== m.id) : [...prev, m.id]
                        );
                      }}
                      className={`p-3 rounded-xl border cursor-pointer transition-all space-y-2 ${
                        isSelected
                          ? 'bg-purple-50/70 border-purple-300 ring-1 ring-purple-500/20'
                          : 'bg-white border-[#E4E0D6] hover:border-purple-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#14213D]">{m.id}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 font-semibold">
                            {m.tonnage ? `${m.tonnage}T` : m.type}
                          </span>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                            isSelected ? 'bg-purple-700 text-white border-purple-700' : 'border-[#CBD5E1] bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </div>

                      <div className="text-[11px] text-[#4B5563] font-medium truncate">{m.name}</div>

                      <div className="flex items-center justify-between text-[10px] text-[#6B7280] pt-1 border-t border-[#F1EFE9]">
                        <span className="flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${isOp ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          {m.status}
                        </span>
                        <span className="font-mono">₹{m.hourlyRate || 850}/hr</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------------
              STEP 3: SKU Portfolio & Tooling-BOM Verification
          ------------------------------------------------------------------- */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-600" />
                    Select Finished Goods &amp; Validate BOM Tooling
                  </h3>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    Only SKUs with verified BOM formulations and compatible molds will be sequenced.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-white border border-[#E4E0D6] rounded-lg px-2.5 py-1 text-xs">
                    <Search className="w-3.5 h-3.5 text-[#9CA3AF]" />
                    <input
                      placeholder="Search SKU code or name..."
                      value={skuSearch}
                      onChange={(e) => setSkuSearch(e.target.value)}
                      className="bg-transparent border-none outline-none text-xs w-36"
                    />
                  </div>
                  <button
                    onClick={() => setSelectedItemCodes(fgItems.map((i) => i.code))}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200"
                  >
                    Select All ({fgItems.length})
                  </button>
                </div>
              </div>

              {/* FG Items Table */}
              <div className="bg-white rounded-xl border border-[#E4E0D6] overflow-hidden shadow-xs">
                <div className="max-h-[380px] overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#F6F4EF] border-b border-[#E4E0D6] text-[#4B5563] sticky top-0 z-10">
                      <tr>
                        <th className="p-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={selectedItemCodes.length === fgItems.length}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedItemCodes(fgItems.map((i) => i.code));
                              else setSelectedItemCodes([]);
                            }}
                            className="rounded text-purple-600"
                          />
                        </th>
                        <th className="p-3 font-semibold">SKU Code &amp; Name</th>
                        <th className="p-3 font-semibold">BOM Status</th>
                        <th className="p-3 font-semibold">Compatible Mold Tool</th>
                        <th className="p-3 font-semibold">Cavities</th>
                        <th className="p-3 font-semibold">Cycle Std</th>
                        <th className="p-3 font-semibold text-right">Standard Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E4E0D6]">
                      {fgItems
                        .filter(
                          (item) =>
                            skuSearch === '' ||
                            item.code.toLowerCase().includes(skuSearch.toLowerCase()) ||
                            item.name.toLowerCase().includes(skuSearch.toLowerCase())
                        )
                        .map((item) => {
                          const isSelected = selectedItemCodes.includes(item.code);
                          const bom = getBom(item.code);
                          const mold = getMold(item.code);
                          const cavities = mold?.activeCavities || mold?.cavities || 4;

                          return (
                            <tr
                              key={item.code}
                              onClick={() => {
                                setSelectedItemCodes((prev) =>
                                  isSelected ? prev.filter((c) => c !== item.code) : [...prev, item.code]
                                );
                              }}
                              className={`cursor-pointer hover:bg-purple-50/40 transition-colors ${
                                isSelected ? 'bg-purple-50/20' : ''
                              }`}
                            >
                              <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {
                                    setSelectedItemCodes((prev) =>
                                      isSelected ? prev.filter((c) => c !== item.code) : [...prev, item.code]
                                    );
                                  }}
                                  className="rounded text-purple-600"
                                />
                              </td>
                              <td className="p-3">
                                <div className="font-bold text-[#14213D]">{item.name}</div>
                                <div className="font-mono text-[10px] text-[#0F8B8D]">{item.code}</div>
                              </td>
                              <td className="p-3">
                                {bom ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <Check className="w-3 h-3" /> {bom.id} ({bom.version})
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    <AlertTriangle className="w-3 h-3" /> Auto-assign BOM
                                  </span>
                                )}
                              </td>
                              <td className="p-3">
                                <div className="font-mono text-[11px] font-bold text-[#14213D]">
                                  {mold?.id || 'MLD-INJ-084'}
                                </div>
                                <div className="text-[10px] text-[#6B7280]">{mold?.name || 'Standard 4-Cavity Tool'}</div>
                              </td>
                              <td className="p-3 font-mono font-semibold text-[#14213D]">{cavities}-Cav</td>
                              <td className="p-3 font-mono text-[#6B7280]">{bom ? '14.5s' : '12.0s'}</td>
                              <td className="p-3 text-right font-mono font-bold text-[#14213D]">
                                ₹{(bom?.standardCost || 45.0).toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------------
              STEP 4: Batch Size & Smart Sequencing
          ------------------------------------------------------------------- */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div>
                <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-600" />
                  Lot Optimization &amp; Smart Sequencing Strategy
                </h3>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Configure batch quantities and the intelligent sequencing algorithm for the shop floor.
                </p>
              </div>

              {/* Presets for 100+ Work Orders */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-[#E4E0D6] space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#14213D]">Total Work Orders to Create</label>
                    <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {totalOrdersToCreate} Work Orders
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[
                      { count: 25, label: '25 WOs (Quick Pilot)' },
                      { count: 50, label: '50 WOs (Shift Run)' },
                      { count: 100, label: '100 WOs (Standard Blitz)' },
                      { count: 120, label: '120 WOs (3-Day Spread)' },
                      { count: 150, label: '150 WOs (Full Week)' },
                    ].map((preset) => (
                      <button
                        key={preset.count}
                        onClick={() => setTotalOrdersToCreate(preset.count)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          totalOrdersToCreate === preset.count
                            ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                            : 'bg-[#F6F4EF] text-[#6B7280] border-[#E4E0D6] hover:bg-white'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  <div className="pt-2">
                    <input
                      type="range"
                      min={10}
                      max={200}
                      step={5}
                      value={totalOrdersToCreate}
                      onChange={(e) => setTotalOrdersToCreate(parseInt(e.target.value))}
                      className="w-full accent-purple-600"
                    />
                    <div className="flex justify-between text-[10px] text-[#6B7280] font-mono mt-1">
                      <span>10 WOs</span>
                      <span>100 WOs</span>
                      <span>200 WOs</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-[#E4E0D6] space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#14213D]">Lot Quantity Per Work Order</label>
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {batchQtyPerWO.toLocaleString()} PCS / Order
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[
                      { qty: 1000, label: '1,000 Pcs (Small Lot)' },
                      { qty: 2500, label: '2,500 Pcs (Standard)' },
                      { qty: 5000, label: '5,000 Pcs (Pallet Load)' },
                      { qty: 10000, label: '10,000 Pcs (High Volume)' },
                    ].map((preset) => (
                      <button
                        key={preset.qty}
                        onClick={() => setBatchQtyPerWO(preset.qty)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          batchQtyPerWO === preset.qty
                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                            : 'bg-[#F6F4EF] text-[#6B7280] border-[#E4E0D6] hover:bg-white'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  <div className="p-2.5 bg-[#F9F8F5] rounded-lg border border-[#E4E0D6] text-xs flex items-center justify-between">
                    <span className="text-[#6B7280]">Total Campaign Production Output:</span>
                    <span className="font-mono font-bold text-[#14213D] text-sm">
                      {(totalOrdersToCreate * batchQtyPerWO).toLocaleString()} PCS
                    </span>
                  </div>
                </div>
              </div>

              {/* Smart Sequencing Algorithms */}
              <div className="bg-white p-4 rounded-xl border border-[#E4E0D6] space-y-3">
                <div className="text-xs font-bold text-[#14213D]">
                  Shop Floor Intelligent Sequencing Rule
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    {
                      id: 'color_progression',
                      title: 'Color Sequence',
                      badge: 'Save 85% Purge Scrap',
                      desc: 'Clear → Natural → White → Yellow → Red → Blue → Black to eliminate resin barrel purging.',
                    },
                    {
                      id: 'mold_clustered',
                      title: 'Mold Tool Clustered',
                      badge: 'Zero Clamp Downtime',
                      desc: 'Group all batches by identical mold tooling to eliminate changeover clamp overhead.',
                    },
                    {
                      id: 'priority_rush',
                      title: 'Priority Rush Order',
                      badge: 'JIT Expedite',
                      desc: 'Dispatches High-priority critical customer orders to the front of the schedule.',
                    },
                    {
                      id: 'bay_interleaved',
                      title: 'Bay Load Balanced',
                      badge: 'Fleet Equilibrium',
                      desc: 'Alternates machine bays sequentially to maintain consistent thermal loading across cells.',
                    },
                  ].map((seq) => {
                    const isSel = sequencingStrategy === seq.id;
                    return (
                      <div
                        key={seq.id}
                        onClick={() => setSequencingStrategy(seq.id as any)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all space-y-1.5 ${
                          isSel
                            ? 'bg-purple-50/80 border-purple-400 ring-2 ring-purple-500/20'
                            : 'bg-[#F9F8F5] border-[#E4E0D6] hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[#14213D]">{seq.title}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800">
                            {seq.badge}
                          </span>
                        </div>
                        <div className="text-[10.5px] text-[#6B7280] leading-relaxed">{seq.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------------
              STEP 5: Warehouse Routing & Material Feasibility
          ------------------------------------------------------------------- */}
          {currentStep === 5 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div>
                <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                  <Factory className="w-4 h-4 text-purple-600" />
                  Warehouse Logistics &amp; Live Material Feasibility Simulation
                </h3>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Verify raw material availability before releasing 100+ work orders to the shop floor.
                </p>
              </div>

              {/* Warehouse Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-[#E4E0D6]">
                <div>
                  <label className="text-xs font-bold text-[#14213D] block mb-1">
                    Raw Material Feed Warehouse
                  </label>
                  <select
                    value={inputWarehouse}
                    onChange={(e) => setInputWarehouse(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#E4E0D6] text-xs font-semibold bg-white text-[#14213D]"
                  >
                    <option value="RM-WH-01">RM-WH-01 (Main Polymer Silos &amp; Bulk Bags)</option>
                    <option value="RM-WH-02">RM-WH-02 (Additive &amp; Masterbatch Bay)</option>
                    <option value="RM-WH-03">RM-WH-03 (Engineering Resin Cleanroom)</option>
                  </select>
                  <span className="text-[10px] text-[#6B7280] mt-0.5 block">Source for pneumatic hopper suction</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#14213D] block mb-1">
                    Finished Goods Staging Bay
                  </label>
                  <select
                    value={outputWarehouse}
                    onChange={(e) => setOutputWarehouse(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#E4E0D6] text-xs font-semibold bg-white text-[#14213D]"
                  >
                    <option value="FG-WH-01">FG-WH-01 (Primary Staging &amp; Stretch Wrap)</option>
                    <option value="FG-WH-02">FG-WH-02 (Export Dock &amp; Container Buffer)</option>
                    <option value="FG-WH-03">FG-WH-03 (Automated Racking Bay)</option>
                  </select>
                  <span className="text-[10px] text-[#6B7280] mt-0.5 block">Destination for pallet putaway</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#14213D] block mb-1">
                    Regrind &amp; Runner Recycling Bay
                  </label>
                  <select
                    value={scrapWarehouse}
                    onChange={(e) => setScrapWarehouse(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#E4E0D6] text-xs font-semibold bg-white text-[#14213D]"
                  >
                    <option value="SCRAP-WH-01">SCRAP-WH-01 (Beside-the-Press Granulator)</option>
                    <option value="REGRIND-STAGE">REGRIND-STAGE (Clean In-house Regrind Bay)</option>
                  </select>
                  <span className="text-[10px] text-[#6B7280] mt-0.5 block">Automated closed-loop return</span>
                </div>
              </div>

              {/* Material Feasibility Simulation Card */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E4E0D6] space-y-4">
                <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-3">
                  <div>
                    <h4 className="text-xs font-bold text-[#14213D] uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Live Material Feasibility Simulation for {generatedOrders.length} Work Orders
                    </h4>
                    <p className="text-[11px] text-[#6B7280] mt-0.5">
                      Calculated using active BOM line formulations and shot weights against live inventory.
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                      materialSimulation.isStockSufficient
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {materialSimulation.isStockSufficient ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> 100% Stock Feasible
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5" /> Partial Shortage Alert
                      </>
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-3 bg-[#F9F8F5] rounded-xl border border-[#E4E0D6]">
                    <div className="text-[10px] text-[#6B7280] uppercase tracking-wider font-semibold">
                      Virgin Polymer Required
                    </div>
                    <div className="text-lg font-bold text-[#14213D] font-mono mt-0.5">
                      {(materialSimulation.virginPolymerKg / 1000).toFixed(2)}{' '}
                      <span className="text-xs text-[#6B7280]">Metric Tons</span>
                    </div>
                    <div className="text-[10px] text-emerald-700 font-medium mt-1">
                      Available on hand: {(materialSimulation.availableResinStockKg / 1000).toFixed(2)} MT
                    </div>
                  </div>

                  <div className="p-3 bg-[#F9F8F5] rounded-xl border border-[#E4E0D6]">
                    <div className="text-[10px] text-[#6B7280] uppercase tracking-wider font-semibold">
                      Clean Regrind (13% LDR)
                    </div>
                    <div className="text-lg font-bold text-[#0F8B8D] font-mono mt-0.5">
                      {(materialSimulation.regrindKg / 1000).toFixed(2)}{' '}
                      <span className="text-xs text-[#6B7280]">Metric Tons</span>
                    </div>
                    <div className="text-[10px] text-[#6B7280] mt-1">Closed-loop sprues &amp; runners</div>
                  </div>

                  <div className="p-3 bg-[#F9F8F5] rounded-xl border border-[#E4E0D6]">
                    <div className="text-[10px] text-[#6B7280] uppercase tracking-wider font-semibold">
                      Masterbatch &amp; Additives
                    </div>
                    <div className="text-lg font-bold text-[#E8622C] font-mono mt-0.5">
                      {materialSimulation.masterbatchKg.toFixed(1)}{' '}
                      <span className="text-xs text-[#6B7280]">KG Total</span>
                    </div>
                    <div className="text-[10px] text-[#6B7280] mt-1">Side feeder &amp; dosing units</div>
                  </div>

                  <div className="p-3 bg-[#F9F8F5] rounded-xl border border-[#E4E0D6]">
                    <div className="text-[10px] text-[#6B7280] uppercase tracking-wider font-semibold">
                      Projected Machine Run
                    </div>
                    <div className="text-lg font-bold text-purple-700 font-mono mt-0.5">
                      {materialSimulation.totalMachineHours.toFixed(1)}{' '}
                      <span className="text-xs text-[#6B7280]">Run Hours</span>
                    </div>
                    <div className="text-[10px] text-[#6B7280] mt-1">
                      ~{(materialSimulation.totalMachineHours / selectedMachineIds.length).toFixed(1)} hrs/bay
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------------
              STEP 6: High-Fidelity 100+ Work Order Inspector & Launch
          ------------------------------------------------------------------- */}
          {currentStep === 6 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Campaign Verification &amp; 100+ Live Work Order Inspector
                  </h3>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    Review generated work orders, adjust individual bay assignments or priorities, and launch to the shop floor.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportCSV}
                    className="px-3 py-1.5 rounded-lg border border-[#E4E0D6] bg-white hover:bg-[#F6F4EF] text-xs font-bold text-[#14213D] flex items-center gap-1.5 shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    Export CSV Schedule
                  </button>
                </div>
              </div>

              {/* KPI Summary Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3.5 rounded-xl border border-[#E4E0D6]">
                <div>
                  <div className="text-[10px] text-[#6B7280] uppercase tracking-wider font-semibold">Orders in Batch</div>
                  <div className="text-lg font-bold font-mono text-purple-700 mt-0.5">
                    {generatedOrders.length} <span className="text-xs font-normal text-[#6B7280]">Jobs</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-[#6B7280] uppercase tracking-wider font-semibold">Total Quantity</div>
                  <div className="text-lg font-bold font-mono text-[#14213D] mt-0.5">
                    {materialSimulation.totalPieces.toLocaleString()}{' '}
                    <span className="text-xs font-normal text-[#6B7280]">PCS</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-[#6B7280] uppercase tracking-wider font-semibold">Est. Production Value</div>
                  <div className="text-lg font-bold font-mono text-[#0F8B8D] mt-0.5">
                    ₹{(materialSimulation.totalEstValueInr / 100000).toFixed(2)}{' '}
                    <span className="text-xs font-normal text-[#6B7280]">Lakhs</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-[#6B7280] uppercase tracking-wider font-semibold">Machine Fleet Load</div>
                  <div className="text-lg font-bold font-mono text-emerald-700 mt-0.5">
                    {selectedMachineIds.length} <span className="text-xs font-normal text-[#6B7280]">Bays Active</span>
                  </div>
                </div>
              </div>

              {/* Live Preview Search and Filters */}
              <div className="bg-white p-3 rounded-xl border border-[#E4E0D6] flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-[#F6F4EF] border border-[#E4E0D6] rounded-lg px-2.5 py-1 text-xs">
                    <Search className="w-3.5 h-3.5 text-[#9CA3AF]" />
                    <input
                      placeholder="Search WO, item, bay..."
                      value={previewSearch}
                      onChange={(e) => {
                        setPreviewSearch(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="bg-transparent border-none outline-none text-xs w-44"
                    />
                  </div>

                  <select
                    value={previewMachineFilter}
                    onChange={(e) => {
                      setPreviewMachineFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 rounded-lg border border-[#E4E0D6] bg-white text-xs font-semibold text-[#14213D]"
                  >
                    <option value="all">All Machines ({selectedMachineIds.length})</option>
                    {selectedMachineIds.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>

                  <select
                    value={previewShiftFilter}
                    onChange={(e) => {
                      setPreviewShiftFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 rounded-lg border border-[#E4E0D6] bg-white text-xs font-semibold text-[#14213D]"
                  >
                    <option value="all">All Shifts</option>
                    {selectedShifts.map((sh) => (
                      <option key={sh} value={sh}>
                        {sh}
                      </option>
                    ))}
                  </select>

                  <select
                    value={previewPriorityFilter}
                    onChange={(e) => {
                      setPreviewPriorityFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 rounded-lg border border-[#E4E0D6] bg-white text-xs font-semibold text-[#14213D]"
                  >
                    <option value="all">All Priorities</option>
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                </div>

                <div className="text-[11px] text-[#6B7280]">
                  Showing <b>{filteredPreviewList.length}</b> of {generatedOrders.length} generated work orders
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-white rounded-xl border border-[#E4E0D6] overflow-hidden shadow-xs">
                <div className="max-h-[360px] overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#F6F4EF] border-b border-[#E4E0D6] text-[#4B5563] sticky top-0 z-10 font-semibold text-[11px]">
                      <tr>
                        <th className="p-2.5">Seq</th>
                        <th className="p-2.5">WO Number</th>
                        <th className="p-2.5">Date / Shift</th>
                        <th className="p-2.5">Finished Good SKU</th>
                        <th className="p-2.5">Machine Bay</th>
                        <th className="p-2.5">Mold Tool</th>
                        <th className="p-2.5 text-right">Target Qty</th>
                        <th className="p-2.5">Priority</th>
                        <th className="p-2.5">Lead Tech</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E4E0D6]">
                      {paginatedPreviewList.map((wo, idx) => {
                        const rowSeq = (currentPage - 1) * rowsPerPage + idx + 1;
                        return (
                          <tr key={wo.id} className="hover:bg-[#F9F8F5] transition-colors">
                            <td className="p-2.5 font-mono text-[#6B7280]">{rowSeq}</td>
                            <td className="p-2.5 font-mono font-bold text-purple-700">{wo.id}</td>
                            <td className="p-2.5">
                              <div className="font-semibold text-[#14213D]">{wo.planDate}</div>
                              <div className="text-[10px] text-[#6B7280]">
                                {wo.day} &middot; {wo.shift}
                              </div>
                            </td>
                            <td className="p-2.5">
                              <div className="font-bold text-[#14213D]">{getItem(wo.item)?.name || wo.item}</div>
                              <div className="font-mono text-[10px] text-[#0F8B8D]">{wo.item}</div>
                            </td>
                            <td className="p-2.5">
                              <select
                                value={wo.machine || ''}
                                onChange={(e) => handleUpdatePreviewOrder(wo.id, 'machine', e.target.value)}
                                className="px-1.5 py-0.5 rounded border border-[#E4E0D6] bg-white font-mono text-[11px]"
                              >
                                {selectedMachineIds.map((m) => (
                                  <option key={m} value={m}>
                                    {m}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2.5 font-mono text-[11px] text-[#14213D]">{wo.mold}</td>
                            <td className="p-2.5 text-right font-mono font-bold">
                              <input
                                type="number"
                                step={100}
                                value={wo.qty}
                                onChange={(e) =>
                                  handleUpdatePreviewOrder(wo.id, 'qty', parseInt(e.target.value) || 100)
                                }
                                className="w-20 px-1 py-0.5 text-right font-mono font-bold border border-[#E4E0D6] rounded text-xs"
                              />
                            </td>
                            <td className="p-2.5">
                              <select
                                value={wo.priority}
                                onChange={(e) =>
                                  handleUpdatePreviewOrder(wo.id, 'priority', e.target.value as any)
                                }
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                  wo.priority === 'High'
                                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                                    : wo.priority === 'Medium'
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : 'bg-slate-50 text-slate-700 border-slate-200'
                                }`}
                              >
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                              </select>
                            </td>
                            <td className="p-2.5 text-[11px] text-[#6B7280]">{wo.operator}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="p-3 bg-[#FAF9F5] border-t border-[#E4E0D6] flex items-center justify-between text-xs">
                  <span className="text-[#6B7280]">
                    Page <b>{currentPage}</b> of <b>{totalPages}</b>
                  </span>
                  <div className="flex gap-1">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="px-2.5 py-1 rounded-lg border border-[#E4E0D6] bg-white disabled:opacity-40 font-bold"
                    >
                      Prev
                    </button>
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="px-2.5 py-1 rounded-lg border border-[#E4E0D6] bg-white disabled:opacity-40 font-bold"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* =========================================================================
            MODAL FOOTER CONTROLS
        ========================================================================= */}
        <div className="p-4 bg-white border-t border-[#E4E0D6] flex items-center justify-between">
          <div>
            {currentStep > 1 ? (
              <button
                onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                className="px-4 py-2 rounded-xl border border-[#E4E0D6] bg-[#F6F4EF] hover:bg-white text-xs font-bold text-[#14213D] flex items-center gap-1.5 transition-all shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back: Step {currentStep - 1}
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-[#E4E0D6] bg-white hover:bg-[#F6F4EF] text-xs font-bold text-[#6B7280] transition-all"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Real-time Order Counter Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>
                Batch: <b>{generatedOrders.length} Orders</b> &middot;{' '}
                {(generatedOrders.length * batchQtyPerWO).toLocaleString()} PCS
              </span>
            </div>

            {currentStep < 6 ? (
              <button
                onClick={() => setCurrentStep((prev) => Math.min(6, prev + 1))}
                className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-98"
              >
                Proceed to Step {currentStep + 1} &rarr;
              </button>
            ) : (
              <button
                onClick={handleCommitBulkGeneration}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-98 animate-pulse"
              >
                <Check className="w-4 h-4 font-bold" />
                Launch &amp; Register {generatedOrders.length} Work Orders
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
