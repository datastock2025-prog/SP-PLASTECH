import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  RotateCcw,
  Scale,
  Camera,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Printer,
  Boxes,
  Cpu,
  Calendar,
  Clock,
  Search,
  Filter,
  ArrowRight,
  Plus,
  Trash2,
  Tag,
  Info,
  ChevronDown,
  Warehouse,
  Check,
  RefreshCw,
  Sliders,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { WorkOrder, ItemMaster, BomMaster, MachineMaster } from '../../types';
import {
  regrindMaterialService,
  RegrindMaterialEntry,
  WoScrapConsolidatedSummary,
  DailyMixingSummary,
} from '../../services/regrindMaterialService';

interface Props {
  workOrders: WorkOrder[];
  items: ItemMaster[];
  machines: MachineMaster[];
  boms: BomMaster[];
  onNavigate?: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const RegrindMaterialEntryView: React.FC<Props> = ({
  workOrders,
  items,
  machines,
  boms,
  onNavigate,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'entry' | 'consolidation' | 'mixingHub' | 'rgWarehouse'>('entry');
  const [entries, setEntries] = useState<RegrindMaterialEntry[]>(() => regrindMaterialService.getEntriesSync());

  // Form State (Transitional RG Entry Blueprint)
  const todayDate = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState<string>(todayDate);
  const [shift, setShift] = useState<'Shift A' | 'Shift B' | 'Shift C'>('Shift A');

  const [machineId, setMachineId] = useState<string>(machines[0]?.id || 'IMM-250T-01');
  const [workOrderId, setWorkOrderId] = useState<string>(workOrders[0]?.id || 'WO-2026-0814');
  const [moldId, setMoldId] = useState<string>('M-104-ABS-2C');
  const [itemCode, setItemCode] = useState<string>('FG-AUTO-012');
  const [itemName, setItemName] = useState<string>('ABS Dashboard Trim Bezel');

  const [baseResin, setBaseResin] = useState<string>('LG Chem ABS-121H');
  const [colorMasterbatch, setColorMasterbatch] = useState<string>('Jet Black MB-01 (2%)');
  const [regrindType, setRegrindType] = useState<'Sprues/Runners' | 'Rejected Parts' | 'Purging' | 'Mixed'>('Sprues/Runners');
  const [qualityCondition, setQualityCondition] = useState<'Clean' | 'Dusty/Flash' | 'Contaminated'>('Clean');

  const [bagTagId, setBagTagId] = useState<string>(`BAG-RG-${todayDate.replace(/-/g, '').slice(2)}-001`);
  const [tareWeightKg, setTareWeightKg] = useState<number>(0.50);
  const [grossWeightKg, setGrossWeightKg] = useState<number>(25.50);
  const [rgStoreLocation, setRgStoreLocation] = useState<string>('RG-BIN-01 (Auto-Cell)');
  const [bomId, setBomId] = useState<string>('BOM-FG-AUTO-012');
  const [maxBlendRatioPct, setMaxBlendRatioPct] = useState<number>(15);
  const [remarks, setRemarks] = useState<string>('');
  const [operator, setOperator] = useState<string>('Floor Operator');

  // Mixing ID (single ID for daily entries connected to BOM)
  const [mixingId, setMixingId] = useState<string>(() => regrindMaterialService.generateNextMixingId(baseResin, todayDate));

  // Modals & success feedback
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [lastSavedEntry, setLastSavedEntry] = useState<RegrindMaterialEntry | null>(null);
  const [showSuccessCheck, setShowSuccessCheck] = useState(false);

  // Search filters for consolidation table
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedMachineFilter, setSelectedMachineFilter] = useState('ALL');

  // Input refs for Enter-key navigation flow
  const tareInputRef = useRef<HTMLInputElement>(null);
  const grossInputRef = useRef<HTMLInputElement>(null);
  const submitBtnRef = useRef<HTMLButtonElement>(null);

  // Auto-calculated Net Weight (Gross - Tare)
  const netWeightKg = useMemo(() => {
    const net = Number(grossWeightKg || 0) - Number(tareWeightKg || 0);
    return Number(Math.max(0, net).toFixed(2));
  }, [grossWeightKg, tareWeightKg]);

  const isWeightValid = grossWeightKg > tareWeightKg && netWeightKg > 0;

  // Auto-fill from selected Work Order
  useEffect(() => {
    const selectedWo = workOrders.find((w) => w.id === workOrderId);
    if (selectedWo) {
      const targetItem = items.find((i) => i.code === selectedWo.item);
      const targetBom = boms.find((b) => b.id === selectedWo.bomId || b.itemCode === selectedWo.item);

      if (selectedWo.machine) setMachineId(selectedWo.machine);
      setItemCode(selectedWo.item);
      setItemName(targetItem?.name || selectedWo.item);
      setMoldId(selectedWo.moldId || (targetItem as any)?.moldCode || 'M-104-ABS-2C');
      setBomId(selectedWo.bomId || `BOM-${selectedWo.item}`);

      const resin = targetItem?.rawMaterialGrade || targetItem?.grade || 'Polypropylene Homopolymer (Grade H110FU)';
      const color = targetItem?.color || 'Natural / Standard Tone';
      setBaseResin(resin);
      setColorMasterbatch(color);
      setMixingId(regrindMaterialService.generateNextMixingId(resin, date));
    }
  }, [workOrderId, workOrders, items, boms, date]);

  // Consolidated Work Order Scrap Summary (rejections, runners, lumps in KG)
  const consolidatedSummaries = useMemo(() => {
    return regrindMaterialService.calculateWoScrapConsolidated(workOrders, items, boms);
  }, [workOrders, items, boms, entries]);

  const dailyMixingSummaries = useMemo(() => {
    return regrindMaterialService.getDailyMixingSummaries();
  }, [entries]);

  // Quick Chips for recently used materials
  const recentMaterialChips = [
    { label: 'PP Natural (H110MA)', resin: 'Reliance Repol H110MA', color: 'Natural / Uncolored', blend: 20 },
    { label: 'ABS Jet Black (121H)', resin: 'LG Chem ABS-121H', color: 'Jet Black MB-01 (2%)', blend: 15 },
    { label: 'HDPE Natural (M5018)', resin: 'IOCL HDPE M5018', color: 'Natural Tone', blend: 25 },
    { label: 'PP Royal Blue', resin: 'Reliance Repol H110MA', color: 'Royal Blue MB-05 (1.5%)', blend: 15 },
    { label: 'PC Clear Optical', resin: 'Sabic Lexan 141R (PC)', color: 'Water Clear (0%)', blend: 10 },
  ];

  const handleSelectChip = (chip: typeof recentMaterialChips[0]) => {
    setBaseResin(chip.resin);
    setColorMasterbatch(chip.color);
    setMaxBlendRatioPct(chip.blend);
    showToast(`Applied material preset: ${chip.label}`);
  };

  // Quick action from Consolidated Table to load WO into Form
  const handleLoadWoToEntry = (summary: WoScrapConsolidatedSummary) => {
    setWorkOrderId(summary.workOrderId);
    setMachineId(summary.machineId);
    setItemCode(summary.itemCode);
    setItemName(summary.itemName);
    setMoldId(summary.moldId);
    setBaseResin(summary.baseResin);
    setColorMasterbatch(summary.color);
    setGrossWeightKg(Number((summary.pendingRgKg > 0 ? summary.pendingRgKg + 0.5 : 20.5).toFixed(2)));
    setTareWeightKg(0.50);
    setMixingId(summary.mixingId || regrindMaterialService.generateNextMixingId(summary.baseResin, todayDate));
    setActiveTab('entry');
    showToast(`Loaded WO ${summary.workOrderId} for Regrind Material Entry`);
  };

  // Handle Form Submission
  const handleSubmitEntry = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isWeightValid) {
      showToast('Gross weight must be strictly greater than Tare weight.');
      return;
    }

    const newEntry = regrindMaterialService.addEntry({
      mixingId: mixingId.trim(),
      date,
      shift,
      machineId,
      workOrderId,
      moldId,
      itemCode,
      itemName,
      baseResin,
      colorMasterbatch,
      regrindType,
      qualityCondition,
      bagTagId: bagTagId.trim(),
      tareWeightKg: Number(tareWeightKg),
      grossWeightKg: Number(grossWeightKg),
      netWeightKg: Number(netWeightKg),
      rgStoreLocation,
      bomId,
      bomItemId: `RM-RG-${baseResin.slice(0, 3).toUpperCase()}-MIX`,
      maxBlendRatioPct: Number(maxBlendRatioPct),
      remarks: remarks.trim(),
      operator,
      status: 'Stored',
    });

    setEntries(regrindMaterialService.getEntriesSync());
    setLastSavedEntry(newEntry);
    setShowSuccessCheck(true);

    // Increment next bag tag
    const nextSeq = Math.floor(100 + Math.random() * 900);
    setBagTagId(`BAG-RG-${todayDate.replace(/-/g, '').slice(2)}-${nextSeq}`);

    setTimeout(() => {
      setShowSuccessCheck(false);
      setIsLabelModalOpen(true);
    }, 600);

    showToast(`✓ Regrind Entry Logged: ${newEntry.netWeightKg} KG allocated to Mixing ID ${newEntry.mixingId}!`);
  };

  const handleClearForm = () => {
    setTareWeightKg(0.50);
    setGrossWeightKg(0);
    setRemarks('');
    showToast('Cleared weight and remarks fields.');
  };

  return (
    <div className="space-y-5 animate-fade-in p-2 sm:p-4 bg-slate-50/50 min-h-screen">
      {/* Header & Tabs */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0F8B8D]/10 text-[#0F8B8D] uppercase tracking-wider flex items-center gap-1">
              <RotateCcw className="w-3 h-3" /> Regrind (RG) Material &amp; Mixing Hub
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <Zap className="w-2.5 h-2.5" /> Progressive IoT &amp; Touch-Ready
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-purple-50 text-purple-700 border border-purple-200">
              Active Mixing ID: {mixingId}
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 font-['Space_Grotesk'] tracking-tight">
            Transitional Regrind (RG) Material Entry &amp; Mixing Screen
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Shop floor manual typing today with weighing scale &amp; barcode IoT hooks ready for tomorrow. Work order scrap consolidation converted to KG.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 self-start md:self-center overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('entry')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'entry'
                ? 'bg-white text-[#0F8B8D] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scale className="w-3.5 h-3.5" /> RG Material Entry
          </button>
          <button
            onClick={() => setActiveTab('consolidation')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'consolidation'
                ? 'bg-white text-[#0F8B8D] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> WO Scrap Consolidation (KG)
          </button>
          <button
            onClick={() => setActiveTab('mixingHub')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'mixingHub'
                ? 'bg-white text-[#0F8B8D] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" /> Daily Mixing IDs &amp; BOM
          </button>
          <button
            onClick={() => setActiveTab('rgWarehouse')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'rgWarehouse'
                ? 'bg-white text-[#0F8B8D] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Warehouse className="w-3.5 h-3.5" /> RG Warehouse Bins
          </button>
        </div>
      </div>

      {/* TAB 1: Transitional RG Material Entry (Manual Now, Smart Later) */}
      {activeTab === 'entry' && (
        <form onSubmit={handleSubmitEntry} className="space-y-5">
          {/* Recently Used Materials Quick Chips */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap flex items-center gap-1 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-[#0F8B8D]" /> Quick Material Presets:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {recentMaterialChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectChip(chip)}
                  className="px-2.5 py-1 bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 hover:border-teal-300 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1"
                >
                  <span>{chip.label}</span>
                  <span className="text-[10px] text-teal-600 font-bold">({chip.blend}% max)</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2-Column Dashboard Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* LEFT COLUMN: Source & Context (Zone 1) + Material & Quality (Zone 2) */}
            <div className="space-y-5">
              {/* ZONE 1: Source & Context */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-[#0F8B8D]" /> ZONE 1: Source &amp; Context
                  </h3>
                  <span className="text-[11px] text-slate-400">Identify where regrind came from</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Date & Shift (Auto-filled read-only) */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Date &amp; Shift (Auto-filled)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={date}
                        readOnly
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-600 font-mono"
                      />
                      <select
                        value={shift}
                        onChange={(e) => setShift(e.target.value as any)}
                        className="bg-white border border-slate-300 rounded-lg p-2.5 text-xs font-semibold text-slate-800"
                      >
                        <option value="Shift A">Shift A (06-14)</option>
                        <option value="Shift B">Shift B (14-22)</option>
                        <option value="Shift C">Shift C (22-06)</option>
                      </select>
                    </div>
                  </div>

                  {/* Machine ID with IoT Scan Hook */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-slate-700">Machine ID *</label>
                      <button
                        type="button"
                        disabled
                        className="opacity-50 text-[10px] text-slate-400 flex items-center gap-1 cursor-not-allowed"
                        title="IoT barcode scanner integration coming soon"
                      >
                        <Camera className="w-3 h-3" /> [ Scan ]
                      </button>
                    </div>
                    <select
                      value={machineId}
                      onChange={(e) => setMachineId(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-semibold text-slate-900 bg-white focus:ring-1 focus:ring-[#0F8B8D]"
                    >
                      {machines.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.id} ({m.name}) - {m.tonnage || 250}T
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Work Order (WO) with IoT Scan Hook */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-slate-700">Work Order (WO) *</label>
                      <button
                        type="button"
                        disabled
                        className="opacity-50 text-[10px] text-slate-400 flex items-center gap-1 cursor-not-allowed"
                        title="Job card barcode scanner integration coming soon"
                      >
                        <Camera className="w-3 h-3" /> [ Scan ]
                      </button>
                    </div>
                    <select
                      value={workOrderId}
                      onChange={(e) => setWorkOrderId(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-mono font-bold text-slate-900 bg-white focus:ring-1 focus:ring-[#0F8B8D]"
                    >
                      {workOrders.map((wo) => (
                        <option key={wo.id} value={wo.id}>
                          {wo.id} - {wo.item} ({wo.qty} PCS)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Mold / Tool ID with IoT Scan Hook */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-slate-700">Mold / Tool ID</label>
                      <button
                        type="button"
                        disabled
                        className="opacity-50 text-[10px] text-slate-400 flex items-center gap-1 cursor-not-allowed"
                        title="Tooling QR scanner integration coming soon"
                      >
                        <Camera className="w-3 h-3" /> [ Scan ]
                      </button>
                    </div>
                    <input
                      type="text"
                      value={moldId}
                      onChange={(e) => setMoldId(e.target.value)}
                      placeholder="e.g. M-104-ABS-2C"
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-mono text-slate-900 focus:ring-1 focus:ring-[#0F8B8D]"
                    />
                  </div>
                </div>
              </div>

              {/* ZONE 2: Material & Quality */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-[#0F8B8D]" /> ZONE 2: Material &amp; Quality
                  </h3>
                  <span className="text-[11px] text-slate-400">Identify exact polymer &amp; scrap grade</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Base Resin (Auto-fills from WO BOM) *
                    </label>
                    <input
                      type="text"
                      value={baseResin}
                      onChange={(e) => setBaseResin(e.target.value)}
                      placeholder="e.g. LG Chem ABS-121H"
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-semibold text-slate-900 focus:ring-1 focus:ring-[#0F8B8D]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Color / Masterbatch (From WO BOM) *
                    </label>
                    <input
                      type="text"
                      value={colorMasterbatch}
                      onChange={(e) => setColorMasterbatch(e.target.value)}
                      placeholder="e.g. Jet Black MB-01"
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-1 focus:ring-[#0F8B8D]"
                    />
                  </div>
                </div>

                {/* Regrind Type (Large touch-ready radio cards) */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Regrind Scrap Type *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'Sprues/Runners', label: 'Sprues & Runners', desc: 'Cold Runners' },
                      { id: 'Rejected Parts', label: 'Rejected Parts', desc: 'Molded Scrap' },
                      { id: 'Purging', label: 'Purge / Lumps', desc: 'Startup Material' },
                      { id: 'Mixed', label: 'Mixed Regrind', desc: 'Regrind Blend' },
                    ].map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setRegrindType(t.id as any)}
                        className={`p-2.5 rounded-xl border text-center cursor-pointer transition ${
                          regrindType === t.id
                            ? 'border-[#0F8B8D] bg-teal-50/70 text-[#0F8B8D] font-bold ring-1 ring-[#0F8B8D]'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xs">{t.label}</div>
                        <div className="text-[10px] opacity-70 font-normal">{t.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quality Condition (Large touch-ready radio cards) */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Quality Condition &amp; Cleanliness *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'Clean', label: 'Clean (Grade A)', color: 'text-emerald-700', badge: '100% Usable' },
                      { id: 'Dusty/Flash', label: 'Dusty / Flash', color: 'text-amber-700', badge: 'Needs Sifting' },
                      { id: 'Contaminated', label: 'Contaminated', color: 'text-rose-700', badge: 'Quarantine / Degrade' },
                    ].map((q) => (
                      <div
                        key={q.id}
                        onClick={() => setQualityCondition(q.id as any)}
                        className={`p-2.5 rounded-xl border text-center cursor-pointer transition ${
                          qualityCondition === q.id
                            ? 'border-[#0F8B8D] bg-teal-50/70 text-[#0F8B8D] font-bold ring-1 ring-[#0F8B8D]'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className={`text-xs ${q.color}`}>{q.label}</div>
                        <div className="text-[10px] text-slate-500 font-normal mt-0.5">{q.badge}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Weighing & Measurement (Zone 3) + Destination & Actions (Zone 4) */}
            <div className="space-y-5">
              {/* ZONE 3: Weighing & Measurement (Most Critical Zone) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-[#0F8B8D]" /> ZONE 3: Weighing &amp; Measurement
                  </h3>
                  <span className="text-[11px] text-emerald-600 font-bold">Auto-Calculates Net Weight</span>
                </div>

                {/* Bag / Tag ID with IoT Scan Hook */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700">Bag / Tag ID *</label>
                    <button
                      type="button"
                      disabled
                      className="opacity-50 text-[10px] text-slate-400 flex items-center gap-1 cursor-not-allowed"
                      title="Scan bag QR/Barcode"
                    >
                      <Camera className="w-3 h-3" /> [ Scan ]
                    </button>
                  </div>
                  <input
                    type="text"
                    value={bagTagId}
                    onChange={(e) => setBagTagId(e.target.value)}
                    placeholder="e.g. BAG-RG-2609-001"
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-mono font-bold text-slate-900 focus:ring-1 focus:ring-[#0F8B8D]"
                  />
                </div>

                {/* Weights Grid (Tare & Gross with Scale IoT Hooks) */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-slate-700">Tare Weight (KG) *</label>
                      <button
                        type="button"
                        disabled
                        className="opacity-50 text-[10px] text-slate-400 flex items-center gap-1 cursor-not-allowed"
                        title="Capture tare weight from digital scale"
                      >
                        <Scale className="w-3 h-3" /> [ Scale ]
                      </button>
                    </div>
                    <input
                      ref={tareInputRef}
                      type="number"
                      step="0.01"
                      min="0"
                      value={tareWeightKg}
                      onChange={(e) => setTareWeightKg(Number(e.target.value))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          grossInputRef.current?.focus();
                        }
                      }}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-bold text-slate-900 focus:ring-1 focus:ring-[#0F8B8D]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-slate-700">Gross Weight (KG) *</label>
                      <button
                        type="button"
                        disabled
                        className="opacity-50 text-[10px] text-slate-400 flex items-center gap-1 cursor-not-allowed"
                        title="Capture gross weight from digital scale"
                      >
                        <Scale className="w-3 h-3" /> [ Scale ]
                      </button>
                    </div>
                    <input
                      ref={grossInputRef}
                      type="number"
                      step="0.01"
                      min="0"
                      value={grossWeightKg}
                      onChange={(e) => setGrossWeightKg(Number(e.target.value))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          submitBtnRef.current?.focus();
                        }
                      }}
                      className={`w-full border rounded-lg p-2.5 text-sm font-bold text-slate-900 focus:ring-1 focus:ring-[#0F8B8D] ${
                        grossWeightKg > 0 && grossWeightKg <= tareWeightKg
                          ? 'border-red-500 bg-red-50/30'
                          : 'border-slate-300'
                      }`}
                    />
                  </div>
                </div>

                {/* Validation Warning */}
                {grossWeightKg > 0 && grossWeightKg <= tareWeightKg && (
                  <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 animate-shake">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Gross weight must be greater than Tare weight ({tareWeightKg} KG).</span>
                  </div>
                )}

                {/* NET WEIGHT CARD (Large Bold Green Display) */}
                <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-2 border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                      Net Regrind Weight (KG)
                    </div>
                    <div className="text-[11px] text-emerald-700 mt-0.5">
                      Auto-Calculated (Gross: {grossWeightKg} - Tare: {tareWeightKg})
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black font-mono text-emerald-800">
                      {netWeightKg.toFixed(2)}{' '}
                      <span className="text-lg font-bold">KG</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ZONE 4: Destination & Actions */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Warehouse className="w-4 h-4 text-[#0F8B8D]" /> ZONE 4: Destination &amp; Mixing Link
                  </h3>
                  <span className="text-[11px] text-slate-400">Route to RG Bin &amp; Link to BOM</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* RG Store Location / Bin */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-slate-700">RG Storage Bin *</label>
                      <button
                        type="button"
                        disabled
                        className="opacity-50 text-[10px] text-slate-400 flex items-center gap-1 cursor-not-allowed"
                        title="Scan Bin barcode"
                      >
                        <Camera className="w-3 h-3" /> [ Scan ]
                      </button>
                    </div>
                    <select
                      value={rgStoreLocation}
                      onChange={(e) => setRgStoreLocation(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-semibold text-slate-900 bg-white"
                    >
                      <option value="RG-BIN-01 (Auto-Cell)">RG-BIN-01 (Auto-Cell Bay)</option>
                      <option value="RG-BIN-02 (PP Bay)">RG-BIN-02 (PP Virgin/Regrind Bay)</option>
                      <option value="RG-BIN-03 (ABS Bay)">RG-BIN-03 (ABS Injection Bay)</option>
                      <option value="RG-BIN-04 (White/Clear)">RG-BIN-04 (Natural / Clear Silo)</option>
                      <option value="SILO-A (Bulk Regrind)">SILO-A (Central Regrind Silo)</option>
                      <option value="SILO-B (Utility Poly)">SILO-B (Utility Polymer Silo)</option>
                    </select>
                  </div>

                  {/* Daily Mixing ID / BOM Link */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Mixing ID (Connected to BOM) *
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={mixingId}
                        onChange={(e) => setMixingId(e.target.value)}
                        placeholder="e.g. MIX-260929-001"
                        className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-mono font-bold text-purple-900 bg-purple-50/40"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Aggregates daily entries into BOM item number
                    </span>
                  </div>
                </div>

                {/* Target BOM & Blend Ratio */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Connected BOM ID
                    </label>
                    <input
                      type="text"
                      value={bomId}
                      onChange={(e) => setBomId(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-mono text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Recommended Max Blend %
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={maxBlendRatioPct}
                        onChange={(e) => setMaxBlendRatioPct(Number(e.target.value))}
                        className="w-24 border border-slate-300 rounded-lg p-2.5 text-xs font-bold text-slate-800"
                      />
                      <span className="text-xs text-slate-500 font-medium">% in Recipe BOM</span>
                    </div>
                  </div>
                </div>

                {/* Remarks */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Remarks / Operator Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="e.g. Clean virgin-like runners, crushed on 6mm screen, zero moisture."
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:ring-1 focus:ring-[#0F8B8D]"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClearForm}
                    className="px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Clear Form
                  </button>

                  <button
                    ref={submitBtnRef}
                    type="submit"
                    disabled={!isWeightValid}
                    className={`px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer ${
                      isWeightValid
                        ? 'bg-[#0F8B8D] hover:bg-[#0d7678] text-white'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {showSuccessCheck ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-300 animate-bounce" />
                        <span>Saved to Mixing ID!</span>
                      </>
                    ) : (
                      <>
                        <Printer className="w-4 h-4" />
                        <span>Save &amp; Print Label ({netWeightKg} KG)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: Production WO Scrap-to-KG Consolidated Grid */}
      {activeTab === 'consolidation' && (
        <div className="space-y-4 animate-fade-in">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[11px] text-slate-500 font-medium">Work Orders Analyzed</div>
              <div className="text-xl font-black text-slate-900 mt-1 font-mono">
                {consolidatedSummaries.length} <span className="text-xs font-normal text-slate-400">WOs</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[11px] text-rose-600 font-medium">Rejections (KG)</div>
              <div className="text-xl font-black text-rose-700 mt-1 font-mono">
                {consolidatedSummaries.reduce((s, c) => s + c.rejectionKg, 0).toFixed(1)}{' '}
                <span className="text-xs font-normal text-slate-400">KG</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[11px] text-teal-600 font-medium">Runners Recovered (KG)</div>
              <div className="text-xl font-black text-teal-700 mt-1 font-mono">
                {consolidatedSummaries.reduce((s, c) => s + c.runnerKg, 0).toFixed(1)}{' '}
                <span className="text-xs font-normal text-slate-400">KG</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[11px] text-amber-600 font-medium">Purge Lumps (KG)</div>
              <div className="text-xl font-black text-amber-700 mt-1 font-mono">
                {consolidatedSummaries.reduce((s, c) => s + c.lumpsKg, 0).toFixed(1)}{' '}
                <span className="text-xs font-normal text-slate-400">KG</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[11px] text-purple-600 font-medium">Total Scrap Potential</div>
              <div className="text-xl font-black text-purple-700 mt-1 font-mono">
                {consolidatedSummaries.reduce((s, c) => s + c.totalScrapKg, 0).toFixed(1)}{' '}
                <span className="text-xs font-normal text-slate-400">KG</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[11px] text-emerald-600 font-medium">Reground &amp; Stored</div>
              <div className="text-xl font-black text-emerald-700 mt-1 font-mono">
                {consolidatedSummaries.reduce((s, c) => s + c.rgLoggedKg, 0).toFixed(1)}{' '}
                <span className="text-xs font-normal text-slate-400">KG</span>
              </div>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search WO, Part, Polymer, or Machine..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <select
                value={selectedMachineFilter}
                onChange={(e) => setSelectedMachineFilter(e.target.value)}
                className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-700"
              >
                <option value="ALL">All Machines</option>
                {machines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-500">
              Showing{' '}
              <strong>
                {
                  consolidatedSummaries.filter(
                    (s) =>
                      (selectedMachineFilter === 'ALL' || s.machineId === selectedMachineFilter) &&
                      (s.workOrderId.toLowerCase().includes(searchFilter.toLowerCase()) ||
                        s.itemCode.toLowerCase().includes(searchFilter.toLowerCase()) ||
                        s.itemName.toLowerCase().includes(searchFilter.toLowerCase()) ||
                        s.baseResin.toLowerCase().includes(searchFilter.toLowerCase()))
                  ).length
                }
              </strong>{' '}
              Work Orders
            </div>
          </div>

          {/* Consolidated Grid Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-3">Work Order &amp; Machine</th>
                    <th className="py-3 px-3">Part / Item Master</th>
                    <th className="py-3 px-3">Base Resin &amp; Color</th>
                    <th className="py-3 px-3 text-right">Good Qty</th>
                    <th className="py-3 px-3 text-right text-rose-700">Rejections (KG)</th>
                    <th className="py-3 px-3 text-right text-teal-700">Runners (KG)</th>
                    <th className="py-3 px-3 text-right text-amber-700">Lumps (KG)</th>
                    <th className="py-3 px-3 text-right font-black text-purple-900 bg-purple-50/50">Total Scrap (KG)</th>
                    <th className="py-3 px-3 text-right text-emerald-700">Reground (KG)</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {consolidatedSummaries
                    .filter(
                      (s) =>
                        (selectedMachineFilter === 'ALL' || s.machineId === selectedMachineFilter) &&
                        (s.workOrderId.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          s.itemCode.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          s.itemName.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          s.baseResin.toLowerCase().includes(searchFilter.toLowerCase()))
                    )
                    .map((summary) => (
                      <tr key={summary.workOrderId} className="hover:bg-slate-50/70 transition">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900 font-mono flex items-center gap-1.5">
                            {summary.workOrderId}
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 font-sans text-slate-600">
                              {summary.shift}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Machine: <strong>{summary.machineId}</strong> • Mold: {summary.moldId}
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{summary.itemName}</div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {summary.itemCode} • {summary.partWeightGrams}g part ({summary.cavities} cav)
                          </div>
                        </td>

                        <td className="py-2.5 px-3 max-w-[200px]">
                          <div className="font-medium text-slate-800 line-clamp-1">{summary.baseResin}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{summary.color}</div>
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-700">
                          {summary.goodQty.toLocaleString()} PCS
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700">
                          {summary.rejectionKg} KG
                          <div className="text-[10px] text-slate-400 font-normal">({summary.rejectionQty} pcs)</div>
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-bold text-teal-700">
                          {summary.runnerKg} KG
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-700">
                          {summary.lumpsKg} KG
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-black text-purple-900 bg-purple-50/40 text-xs">
                          {summary.totalScrapKg} KG
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                          {summary.rgLoggedKg} KG
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              summary.status === 'Fully Reground'
                                ? 'bg-emerald-100 text-emerald-800'
                                : summary.status === 'Partial Reground'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {summary.status}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleLoadWoToEntry(summary)}
                            className="px-2.5 py-1 bg-[#0F8B8D] hover:bg-[#0d7678] text-white rounded-lg text-xs font-bold transition flex items-center gap-1 mx-auto cursor-pointer shadow-xs"
                          >
                            <span>Regrind</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Daily Mixing IDs & BOM Registry */}
      {activeTab === 'mixingHub' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Boxes className="w-4 h-4 text-[#0F8B8D]" /> Daily Mixing IDs &amp; BOM Item Allocation
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every daily regrinding input sums into a unique Mixing ID, which connects directly to the BOM recipe for resin recycling blends.
              </p>
            </div>
            <div className="text-xs text-purple-800 font-bold bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200">
              {dailyMixingSummaries.length} Active Mixing Batches
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dailyMixingSummaries.map((mix) => (
              <div
                key={mix.mixingId}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3 relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[10px] font-bold text-purple-700 uppercase tracking-wider font-mono">
                      Mixing ID (BOM Item #)
                    </div>
                    <div className="text-lg font-black font-mono text-slate-900 mt-0.5">
                      {mix.mixingId}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {mix.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-2.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Base Polymer:</span>
                    <span className="font-bold text-slate-900 text-right">{mix.baseResin}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Color Tone:</span>
                    <span className="font-medium text-slate-700">{mix.colorMasterbatch}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Net Weight:</span>
                    <span className="font-black font-mono text-emerald-700 text-sm">{mix.totalNetKg} KG</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Daily Log Entries:</span>
                    <span className="font-bold text-slate-800">{mix.entryCount} Bag/Bin Logs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Rec. Max Blend:</span>
                    <span className="font-bold text-purple-700">{mix.recommendedBlendPct}% in BOM</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl text-xs space-y-1">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Linked BOMs:</div>
                  <div className="flex flex-wrap gap-1">
                    {mix.targetBoms.map((b) => (
                      <span key={b} className="px-1.5 py-0.5 bg-white border rounded text-[10px] font-mono text-teal-700 font-bold">
                        {b}
                      </span>
                    ))}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase pt-1">Stored In Bins:</div>
                  <div className="text-[11px] text-slate-700 font-mono">{mix.storageBins.join(', ')}</div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMixingId(mix.mixingId);
                    setActiveTab('entry');
                    showToast(`Active Mixing ID set to ${mix.mixingId}`);
                  }}
                  className="w-full py-2 bg-slate-100 hover:bg-[#0F8B8D] text-slate-700 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Add More Entries to this Mixing ID</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: RG Warehouse Stock & Bin Map */}
      {activeTab === 'rgWarehouse' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-[#0F8B8D]" /> RG Warehouse Inventory &amp; Storage Bin Allocation
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Physical bins synchronized with regrind recycling stock and ready for closed-loop injection blending.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate?.('regrindScrap')}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-[#0F8B8D] hover:bg-teal-50 flex items-center gap-1 cursor-pointer"
            >
              <span>Open Closed-Loop Recycle View</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { bin: 'RG-BIN-01 (Auto-Cell)', polymer: 'ABS (LG Chem 121H)', color: 'Black', stockKg: 41.7, capKg: 100, mixingId: 'MIX-2026-0901' },
              { bin: 'RG-BIN-02 (PP Bay)', polymer: 'PP Homo (H110MA)', color: 'Natural', stockKg: 30.0, capKg: 150, mixingId: 'MIX-2026-0902' },
              { bin: 'RG-BIN-03 (ABS Bay)', polymer: 'ABS (Toray 100)', color: 'Grey', stockKg: 18.5, capKg: 100, mixingId: 'MIX-2026-0903' },
              { bin: 'RG-BIN-04 (White/Clear)', polymer: 'PP Copolymer', color: 'White', stockKg: 25.0, capKg: 120, mixingId: 'MIX-2026-0904' },
              { bin: 'SILO-A (Central)', polymer: 'PP / HDPE Blends', color: 'Mixed', stockKg: 220.0, capKg: 500, mixingId: 'MIX-SILO-A' },
              { bin: 'SILO-B (Utility Poly)', polymer: 'Purge / Heavy Lumps', color: 'Dark Mixed', stockKg: 95.0, capKg: 300, mixingId: 'MIX-SILO-B' },
            ].map((bin, idx) => {
              const fillPct = Math.min(100, Math.round((bin.stockKg / bin.capKg) * 100));
              return (
                <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-xs font-mono">{bin.bin}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{bin.polymer} ({bin.color})</div>
                    </div>
                    <span className="text-[10px] font-mono bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-bold">
                      {bin.mixingId}
                    </span>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-600">Bin Fill Level:</span>
                      <span className="font-mono font-bold text-slate-900">{bin.stockKg} / {bin.capKg} KG ({fillPct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          fillPct > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Label Print Preview Modal */}
      {isLabelModalOpen && lastSavedEntry && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#0F8B8D]" />
                <h3 className="font-black text-slate-900 text-base">Regrind Bag / Bin Barcode Label</h3>
              </div>
              <button
                onClick={() => setIsLabelModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            {/* Printable Tag Preview */}
            <div className="p-4 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 space-y-3 font-mono text-xs text-slate-800">
              <div className="text-center font-bold text-slate-900 border-b pb-2">
                <div>SP-PLASTECH ERP • REGRIND RECYCLING TAG</div>
                <div className="text-[10px] text-slate-500 font-sans font-normal mt-0.5">
                  Traceable Closed-Loop Polymer Control
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">TAG ID:</span>
                  <span className="font-bold text-slate-900">{lastSavedEntry.bagTagId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">MIXING ID:</span>
                  <span className="font-black text-purple-700">{lastSavedEntry.mixingId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">DATE &amp; SHIFT:</span>
                  <span>{lastSavedEntry.date} ({lastSavedEntry.shift})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">SOURCE WO:</span>
                  <span>{lastSavedEntry.workOrderId} ({lastSavedEntry.machineId})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">POLYMER:</span>
                  <span className="font-bold text-slate-900">{lastSavedEntry.baseResin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">TYPE / QUALITY:</span>
                  <span>{lastSavedEntry.regrindType} • {lastSavedEntry.qualityCondition}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">STORAGE BIN:</span>
                  <span className="font-bold text-teal-800">{lastSavedEntry.rgStoreLocation}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-1 font-bold text-emerald-800">
                  <span>NET WEIGHT:</span>
                  <span className="text-base">{lastSavedEntry.netWeightKg} KG</span>
                </div>
              </div>

              {/* Barcode Mock */}
              <div className="pt-2 text-center">
                <div className="h-10 bg-slate-800 rounded flex items-center justify-center text-white tracking-[0.3em] font-black text-sm">
                  ||||| {lastSavedEntry.bagTagId} |||||
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">Scan to verify batch at injection feed hopper</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  window.print();
                  setIsLabelModalOpen(false);
                  showToast('Printed label successfully.');
                }}
                className="w-full py-2.5 bg-[#0F8B8D] hover:bg-[#0d7678] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print Label
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
