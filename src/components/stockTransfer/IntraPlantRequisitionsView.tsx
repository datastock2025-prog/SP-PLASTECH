import React, { useState } from 'react';
import {
  Calendar,
  Layers,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Clock,
  Building2,
  Factory,
  Package,
  Cpu,
  Wrench,
  Search,
  Filter,
  Plus,
  ArrowLeftRight,
  FileText,
  Sparkles,
  Printer,
  Eye,
  AlertCircle,
  Truck,
  Check,
  ChevronDown,
  ChevronRight,
  Send,
} from 'lucide-react';
import {
  ProductionScheduleCMR,
  AssemblyRequisition,
  DeflashRequisition,
  ProductionStoreReturnRecord,
} from '../../types/stockTransferTypes';
import {
  INITIAL_PRODUCTION_CMRS,
  INITIAL_ASSEMBLY_REQUISITIONS,
  INITIAL_DEFLASH_REQUISITIONS,
  INITIAL_PRODUCTION_RETURNS,
} from '../../data/stockTransferData';

interface Props {
  onTransferCMRSuccess?: (cmr: ProductionScheduleCMR, mixRefNumber: string) => void;
  onReturnSuccess?: (returnRecord: ProductionStoreReturnRecord) => void;
  showToast?: (msg: string) => void;
}

export const IntraPlantRequisitionsView: React.FC<Props> = ({
  onTransferCMRSuccess,
  onReturnSuccess,
  showToast = () => {},
}) => {
  // Main Tab State
  const [subTab, setSubTab] = useState<'CMR' | 'ASSEMBLY' | 'DEFLASH' | 'RETURNS'>('CMR');

  // Datasets
  const [cmrs, setCmrs] = useState<ProductionScheduleCMR[]>(INITIAL_PRODUCTION_CMRS);
  const [assemblyReqs, setAssemblyReqs] = useState<AssemblyRequisition[]>(INITIAL_ASSEMBLY_REQUISITIONS);
  const [deflashReqs, setDeflashReqs] = useState<DeflashRequisition[]>(INITIAL_DEFLASH_REQUISITIONS);
  const [returns, setReturns] = useState<ProductionStoreReturnRecord[]>(INITIAL_PRODUCTION_RETURNS);

  // Filters
  const [selectedDate, setSelectedDate] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Collapsible Row States (Task 1 - Default collapsed for high scalability)
  const [expandedCmrIds, setExpandedCmrIds] = useState<Set<string>>(new Set());
  const [expandedAsmIds, setExpandedAsmIds] = useState<Set<string>>(new Set());
  const [expandedDeflashIds, setExpandedDeflashIds] = useState<Set<string>>(new Set());

  // Pagination States (Task 1 - Smooth handling of 100+ daily schedule rows)
  const [cmrPage, setCmrPage] = useState<number>(1);
  const [cmrPageSize, setCmrPageSize] = useState<number>(10);
  const [asmPage, setAsmPage] = useState<number>(1);
  const [asmPageSize, setAsmPageSize] = useState<number>(10);
  const [deflashPage, setDeflashPage] = useState<number>(1);
  const [deflashPageSize, setDeflashPageSize] = useState<number>(10);

  // Toggle Single Row Expand
  const toggleCmrExpand = (id: string) => {
    setExpandedCmrIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAsmExpand = (id: string) => {
    setExpandedAsmIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleDeflashExpand = (id: string) => {
    setExpandedDeflashIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Expand / Collapse All
  const handleToggleAllCmrs = (expand: boolean) => {
    if (expand) {
      setExpandedCmrIds(new Set(filteredCmrs.map((c) => c.id)));
    } else {
      setExpandedCmrIds(new Set());
    }
  };

  // Modal State for Transferring CMR to PRD-UNIT-1 (Task-1 & Task-4)
  const [selectedCmrForTransfer, setSelectedCmrForTransfer] = useState<ProductionScheduleCMR | null>(null);
  const [generatedMixRef, setGeneratedMixRef] = useState<string>('');
  const [targetStore, setTargetStore] = useState<string>('PRD-UNIT-1');

  // Modal State for Return from PRD-UNIT-1 (Task-6)
  const [isReturnModalOpen, setIsReturnModalOpen] = useState<boolean>(false);
  const [returnSelectedMixRef, setReturnSelectedMixRef] = useState<string>('');
  const [returnQty, setReturnQty] = useState<{ [materialSku: string]: number }>({});
  const [returnReason, setReturnReason] = useState<string>('Work Order Run Completed - Leftover Material in Sealed Container');

  // Helper to generate unique Mixing Reference Number (Task-4)
  const generateMixingReference = (cmr: ProductionScheduleCMR): string => {
    const cleanSku = cmr.finishedGoodSku.replace('FG-', '').replace('RM-', '');
    const dateStr = cmr.scheduleDate.replace(/-/g, '');
    const seq = Math.floor(10 + Math.random() * 90);
    return `MIX-${cleanSku}-${dateStr}-${seq}`;
  };

  // Open Transfer Modal for CMR
  const handleOpenTransferModal = (cmr: ProductionScheduleCMR) => {
    setSelectedCmrForTransfer(cmr);
    const mixRef = cmr.mixingReferenceNumber || generateMixingReference(cmr);
    setGeneratedMixRef(mixRef);
  };

  // Execute CMR Transfer to PRD-UNIT-1 (Task-1 & Task-4)
  const handleConfirmTransferCMR = () => {
    if (!selectedCmrForTransfer) return;

    const updatedCmr: ProductionScheduleCMR = {
      ...selectedCmrForTransfer,
      targetProductionStore: targetStore,
      mixingReferenceNumber: generatedMixRef,
      transferStatus: 'TRANSFERRED',
      transferredAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      transferredBy: 'Warehouse Transfer Operator (Central RM Store)',
      mixingMaterials: selectedCmrForTransfer.mixingMaterials.map((mat) => ({
        ...mat,
        issuedQtyKg: mat.requiredQtyKg,
      })),
    };

    setCmrs((prev) => prev.map((c) => (c.id === updatedCmr.id ? updatedCmr : c)));
    if (onTransferCMRSuccess) onTransferCMRSuccess(updatedCmr, generatedMixRef);

    showToast(`CMR ${updatedCmr.id} transferred to ${targetStore}. Generated Mixing Ref: ${generatedMixRef}`);
    setSelectedCmrForTransfer(null);
  };

  // Execute Material Return from PRD-UNIT-1 to Main Warehouse (Task-6)
  const handleConfirmReturn = () => {
    if (!returnSelectedMixRef) {
      showToast('Please select an active Mixing Reference Number');
      return;
    }

    const linkedCmr = cmrs.find((c) => c.mixingReferenceNumber === returnSelectedMixRef);
    if (!linkedCmr) {
      showToast('No active CMR found for this Mixing Reference Number');
      return;
    }

    const returnItems = linkedCmr.mixingMaterials
      .filter((mat) => (returnQty[mat.materialSku] || 0) > 0)
      .map((mat) => ({
        sku: mat.materialSku,
        name: mat.materialName,
        lotNumber: mat.lotNumber,
        returnedQty: returnQty[mat.materialSku] || 0,
        uom: mat.uom,
        unitCostInr: mat.unitCostInr,
        reason: returnReason,
      }));

    if (returnItems.length === 0) {
      showToast('Please enter a return quantity greater than 0 for at least one material.');
      return;
    }

    const newReturn: ProductionStoreReturnRecord = {
      id: `MRN-2026-PRD1-${Date.now().toString().slice(-4)}`,
      returnDate: new Date().toLocaleDateString('en-GB'),
      returnTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mixingReferenceNumber: returnSelectedMixRef,
      cmrReference: linkedCmr.id,
      scheduleNumber: linkedCmr.scheduleNumber,
      sourceStore: 'PRD-UNIT-1',
      destinationWarehouse: 'WH-RM-01 / Silo Zone A',
      finishedGoodSku: linkedCmr.finishedGoodSku,
      finishedGoodName: linkedCmr.finishedGoodName,
      returnedItems: returnItems,
      authorizedBy: 'Shift Production In-Charge (PRD-UNIT-1)',
      receivedBy: 'Central RM Storekeeper (WH-RM-01)',
      status: 'COMPLETED',
      notes: returnReason,
    };

    setReturns((prev) => [newReturn, ...prev]);

    // Update CMR status
    setCmrs((prev) =>
      prev.map((c) => (c.mixingReferenceNumber === returnSelectedMixRef ? { ...c, transferStatus: 'RETURNED' } : c))
    );

    if (onReturnSuccess) onReturnSuccess(newReturn);

    showToast(`Return ${newReturn.id} processed for Mixing Ref ${returnSelectedMixRef}. Stock returned to WH-RM-01.`);
    setIsReturnModalOpen(false);
    setReturnQty({});
  };

  // Filtered CMRs
  const filteredCmrs = cmrs.filter((c) => {
    const matchSearch =
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.scheduleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.finishedGoodSku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.finishedGoodName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.machineId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.mixingReferenceNumber && c.mixingReferenceNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchDate = selectedDate === 'ALL' || c.scheduleDate === selectedDate;
    const matchStatus = statusFilter === 'ALL' || c.transferStatus === statusFilter;

    return matchSearch && matchDate && matchStatus;
  });

  // Unique Schedule Dates for pill selector
  const availableDates = ['ALL', '2026-09-19', '2026-09-20', '2026-09-18'];

  return (
    <div className="space-y-4">
      {/* Sub Header / Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
              Intra-Plant Transfers &middot; Schedule Requisitions
            </span>
          </div>
          <h2 className="text-base font-bold text-slate-900">
            Requisitions for Production Schedule (CMR), Assembly &amp; Deflash
          </h2>
          <p className="text-xs text-slate-500">
            Send consolidated BOM mixing materials to <span className="font-semibold text-blue-700">PRD-UNIT-1</span> with traceable Mixing Reference Numbers &amp; process reverse returns to Main Warehouse
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsReturnModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-bold shadow-xs transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
            <span>Return from PRD-UNIT-1 to Main WH</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setSubTab('CMR')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            subTab === 'CMR'
              ? 'bg-[#14213D] text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Factory className="w-4 h-4 text-blue-400" />
          <span>Production Schedule CMRs</span>
          <span
            className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
              subTab === 'CMR' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {cmrs.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('ASSEMBLY')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            subTab === 'ASSEMBLY'
              ? 'bg-[#0F8B8D] text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Cpu className="w-4 h-4 text-teal-300" />
          <span>Assembly Line Requisitions</span>
          <span
            className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
              subTab === 'ASSEMBLY' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {assemblyReqs.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('DEFLASH')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            subTab === 'DEFLASH'
              ? 'bg-[#E8622C] text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Wrench className="w-4 h-4 text-amber-300" />
          <span>Deflash &amp; Trimming Requisitions</span>
          <span
            className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
              subTab === 'DEFLASH' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {deflashReqs.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('RETURNS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            subTab === 'RETURNS'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <RotateCcw className="w-4 h-4 text-amber-200" />
          <span>Production Store Returns (MRN)</span>
          <span
            className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
              subTab === 'RETURNS' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {returns.length}
          </span>
        </button>
      </div>

      {/* Date & Search Filters */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Schedule #, CMR #, Part SKU, Mixing Ref #, or Machine..."
            className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Date:
          </span>
          {availableDates.map((dt) => (
            <button
              key={dt}
              onClick={() => setSelectedDate(dt)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedDate === dt
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {dt === 'ALL' ? 'All Dates' : dt}
            </button>
          ))}
        </div>
      </div>

      {/* SUB-TAB 1: PRODUCTION SCHEDULE CMRs (Task-1 & Task-4) */}
      {subTab === 'CMR' && (
        <div className="space-y-3">
          {/* List Toolbar & Expand / Collapse Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
            <div className="text-slate-600 font-medium">
              Showing <strong className="text-slate-900">{Math.min(filteredCmrs.length, (cmrPage - 1) * cmrPageSize + 1)}</strong> to{' '}
              <strong className="text-slate-900">{Math.min(filteredCmrs.length, cmrPage * cmrPageSize)}</strong> of{' '}
              <strong className="text-slate-900">{filteredCmrs.length}</strong> Schedule CMRs
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleToggleAllCmrs(true)}
                className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition"
              >
                Expand All
              </button>
              <button
                type="button"
                onClick={() => handleToggleAllCmrs(false)}
                className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition"
              >
                Collapse All
              </button>
              <select
                value={cmrPageSize}
                onChange={(e) => {
                  setCmrPageSize(Number(e.target.value));
                  setCmrPage(1);
                }}
                aria-label="CMR Page Size"
                className="bg-white border border-slate-300 text-xs rounded-lg px-2 py-1 text-slate-700 focus:ring-1 focus:ring-blue-500"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
          </div>

          {filteredCmrs
            .slice((cmrPage - 1) * cmrPageSize, cmrPage * cmrPageSize)
            .map((cmr) => {
              const isExpanded = expandedCmrIds.has(cmr.id);
              const totalBlendWeight = cmr.mixingMaterials.reduce((acc, m) => acc + m.requiredQtyKg, 0);

              return (
                <div
                  key={cmr.id}
                  className={`bg-white rounded-2xl border transition-all duration-150 overflow-hidden shadow-xs ${
                    isExpanded ? 'border-blue-400 ring-2 ring-blue-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Collapsible Clickable Summary Header */}
                  <div
                    onClick={() => toggleCmrExpand(cmr.id)}
                    className={`p-3.5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                      isExpanded ? 'bg-blue-50/40 border-b border-blue-100' : 'bg-white hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-start md:items-center gap-3">
                      <button
                        type="button"
                        aria-label={isExpanded ? 'Collapse CMR' : 'Expand CMR'}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCmrExpand(cmr.id);
                        }}
                        className="p-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700 transition shrink-0 mt-0.5 md:mt-0"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-blue-700" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-600" />
                        )}
                      </button>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            {cmr.id}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 text-slate-800">
                            SCH: {cmr.scheduleNumber}
                          </span>
                          <span className="text-xs text-slate-500">
                            Date: <strong className="text-slate-800">{cmr.scheduleDate}</strong> ({cmr.shift})
                          </span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          <span className="font-mono font-bold text-slate-900">{cmr.finishedGoodSku}</span>
                          <span className="text-slate-400">&bull;</span>
                          <span className="font-medium text-slate-700 truncate max-w-xs">{cmr.finishedGoodName}</span>
                          <span className="text-slate-400">&bull;</span>
                          <span className="font-semibold text-slate-900">
                            {cmr.plannedQty.toLocaleString()} {cmr.uom}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">({cmr.bomVersion})</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-auto flex-wrap">
                      <div className="text-right hidden sm:block">
                        <div className="text-[11px] text-slate-500">Machine &bull; Store</div>
                        <div className="text-xs font-bold text-slate-800">
                          {cmr.machineId} &rarr; <span className="text-blue-700">{cmr.targetProductionStore || 'PRD-UNIT-1'}</span>
                        </div>
                      </div>

                      {cmr.mixingReferenceNumber ? (
                        <span className="px-2 py-1 rounded text-[11px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {cmr.mixingReferenceNumber}
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200 italic">
                          Ref Pending
                        </span>
                      )}

                      {cmr.transferStatus === 'TRANSFERRED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Transferred</span>
                        </span>
                      ) : cmr.transferStatus === 'RETURNED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
                          <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                          <span>Returned</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Pending Transfer</span>
                        </span>
                      )}

                      {cmr.transferStatus === 'PENDING_TRANSFER' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenTransferModal(cmr);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F8B8D] hover:bg-[#0c7274] text-white rounded-xl text-xs font-bold shadow-2xs transition whitespace-nowrap"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Send to PRD-UNIT-1</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Content View (BOM Mixing Breakdown) */}
                  {isExpanded && (
                    <div className="p-4 space-y-3 bg-white">
                      {/* Finished Good Target Info & Mixing Ref */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                        <div>
                          <div className="text-slate-500 text-[11px]">Finished Good Part SKU</div>
                          <div className="font-mono font-bold text-slate-900">{cmr.finishedGoodSku}</div>
                          <div className="font-semibold text-slate-700 text-[11px] truncate">{cmr.finishedGoodName}</div>
                        </div>

                        <div>
                          <div className="text-slate-500 text-[11px]">Planned Quantity &bull; BOM</div>
                          <div className="font-mono font-bold text-slate-900">
                            {cmr.plannedQty.toLocaleString()} {cmr.uom}
                          </div>
                          <div className="text-slate-500 text-[11px]">Version: <strong className="text-slate-700">{cmr.bomVersion}</strong></div>
                        </div>

                        <div>
                          <div className="text-slate-500 text-[11px]">Machine &bull; Target Store</div>
                          <div className="font-bold text-slate-800">{cmr.machineId}</div>
                          <div className="text-slate-600 text-[11px] font-semibold text-blue-700">
                            Destination: {cmr.targetProductionStore || 'PRD-UNIT-1'}
                          </div>
                        </div>

                        <div>
                          <div className="text-slate-500 text-[11px]">Mixing Material Reference #</div>
                          {cmr.mixingReferenceNumber ? (
                            <div className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block text-[11px]">
                              {cmr.mixingReferenceNumber}
                            </div>
                          ) : (
                            <div className="text-slate-400 italic text-[11px]">Generated on Transfer to PRD-UNIT-1</div>
                          )}
                        </div>
                      </div>

                      {/* Mixing Materials Table (BOM Specified Polymer, MB, Regrind) */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5 text-blue-600" />
                            BOM Mixing Material Breakdown (Raw Polymer + Color MB + Additive/Regrind)
                          </span>
                          <span className="text-[11px] text-slate-600 font-semibold">
                            Total Blend Weight: <strong className="text-slate-900">{totalBlendWeight.toFixed(1)} KG</strong>
                          </span>
                        </div>

                        <div className="border border-slate-200 rounded-xl overflow-hidden text-xs shadow-2xs">
                          <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                              <tr>
                                <th className="py-2 px-3">Material Type</th>
                                <th className="py-2 px-3">Material Code / Description</th>
                                <th className="py-2 px-3">Traceable Lot #</th>
                                <th className="py-2 px-3 text-right">Required (KG)</th>
                                <th className="py-2 px-3 text-right">Issued (KG)</th>
                                <th className="py-2 px-3 text-right">Rate (₹)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {cmr.mixingMaterials.map((mat) => (
                                <tr key={mat.materialSku} className="hover:bg-slate-50/50">
                                  <td className="py-2 px-3">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        mat.materialType === 'Raw Polymer'
                                          ? 'bg-blue-100 text-blue-800'
                                          : mat.materialType === 'Masterbatch'
                                          ? 'bg-purple-100 text-purple-800'
                                          : 'bg-amber-100 text-amber-800'
                                      }`}
                                    >
                                      {mat.materialType}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3">
                                    <span className="font-mono font-bold text-slate-800">{mat.materialSku}</span>
                                    <div className="text-[11px] text-slate-600 font-medium">{mat.materialName}</div>
                                  </td>
                                  <td className="py-2 px-3 font-mono font-bold text-teal-700">{mat.lotNumber}</td>
                                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                                    {mat.requiredQtyKg.toFixed(1)} {mat.uom}
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                                    {mat.issuedQtyKg !== undefined ? `${mat.issuedQtyKg.toFixed(1)} ${mat.uom}` : '-'}
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono text-slate-700">₹{mat.unitCostInr}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Transfer Action Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <div className="text-slate-500 text-[11px]">
                          {cmr.transferredAt ? (
                            <span>
                              Transferred by <strong className="text-slate-700">{cmr.transferredBy}</strong> at {cmr.transferredAt}
                            </span>
                          ) : (
                            <span>Ready for dispatch from Central RM Warehouse to PRD-UNIT-1 day hopper</span>
                          )}
                        </div>

                        {cmr.transferStatus === 'PENDING_TRANSFER' && (
                          <button
                            type="button"
                            onClick={() => handleOpenTransferModal(cmr)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-[#0F8B8D] hover:bg-[#0c7274] text-white rounded-xl text-xs font-bold shadow-xs transition"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Send Required CMR to Production Store (PRD-UNIT-1)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

          {filteredCmrs.length === 0 && (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
              No Production Schedule CMRs found matching your search criteria.
            </div>
          )}

          {/* Pagination Controls */}
          {filteredCmrs.length > cmrPageSize && (
            <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-2xs text-xs">
              <span className="text-slate-500 font-medium">
                Page <strong className="text-slate-800">{cmrPage}</strong> of{' '}
                <strong className="text-slate-800">{Math.ceil(filteredCmrs.length / cmrPageSize)}</strong>
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={cmrPage === 1}
                  onClick={() => setCmrPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: Math.ceil(filteredCmrs.length / cmrPageSize) }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCmrPage(p)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                      cmrPage === p ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={cmrPage >= Math.ceil(filteredCmrs.length / cmrPageSize)}
                  onClick={() => setCmrPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: ASSEMBLY REQUISITIONS (Task-1 - Collapsible & Scalable) */}
      {subTab === 'ASSEMBLY' && (
        <div className="space-y-3">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
            <div className="text-slate-600 font-medium">
              Showing <strong className="text-slate-900">{assemblyReqs.length}</strong> Assembly Requisitions
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setExpandedAsmIds(new Set(assemblyReqs.map((r) => r.id)))}
                className="px-2.5 py-1 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 transition"
              >
                Expand All
              </button>
              <button
                type="button"
                onClick={() => setExpandedAsmIds(new Set())}
                className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition"
              >
                Collapse All
              </button>
            </div>
          </div>

          {assemblyReqs
            .slice((asmPage - 1) * asmPageSize, asmPage * asmPageSize)
            .map((req) => {
              const isExpanded = expandedAsmIds.has(req.id);
              return (
                <div
                  key={req.id}
                  className={`bg-white rounded-2xl border transition-all duration-150 overflow-hidden shadow-xs ${
                    isExpanded ? 'border-teal-400 ring-2 ring-teal-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div
                    onClick={() => toggleAsmExpand(req.id)}
                    className={`p-3.5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                      isExpanded ? 'bg-teal-50/40 border-b border-teal-100' : 'bg-white hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        aria-label={isExpanded ? 'Collapse Assembly Requisition' : 'Expand Assembly Requisition'}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAsmExpand(req.id);
                        }}
                        className="p-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-teal-100 hover:text-teal-700 transition shrink-0"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-teal-700" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-600" />
                        )}
                      </button>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-xs bg-teal-100 text-teal-800 px-2.5 py-0.5 rounded-lg border border-teal-200">
                            {req.id}
                          </span>
                          <span className="text-xs font-semibold text-slate-700">
                            Target: <strong className="text-slate-900">{req.targetLine}</strong> &bull; Date: {req.date}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600">
                          Finished Good: <span className="font-mono font-bold text-blue-700">{req.finishedGoodSku}</span> &mdash; {req.finishedGoodName} ({req.plannedQty} {req.uom})
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-auto">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          req.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {req.status}
                      </span>
                      {req.status === 'PENDING' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAssemblyReqs((prev) =>
                              prev.map((r) =>
                                r.id === req.id
                                  ? { ...r, status: 'ISSUED', issuedAt: new Date().toLocaleTimeString(), issuedBy: 'Assembly Storekeeper' }
                                  : r
                              )
                            );
                            showToast(`Assembly Kit ${req.id} issued to ${req.targetLine}`);
                          }}
                          className="px-3 py-1.5 bg-[#0F8B8D] text-white rounded-xl text-xs font-bold shadow-2xs hover:bg-[#0c7274] transition whitespace-nowrap"
                        >
                          Transfer Kit
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 space-y-3 bg-white">
                      <div className="border border-slate-200 rounded-xl overflow-hidden text-xs shadow-2xs">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                            <tr>
                              <th className="py-2 px-3">Part SKU</th>
                              <th className="py-2 px-3">Part Description</th>
                              <th className="py-2 px-3">Store Bin Location</th>
                              <th className="py-2 px-3 font-mono">Lot #</th>
                              <th className="py-2 px-3 text-right">Required Qty</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {req.requiredParts.map((p) => (
                              <tr key={p.sku}>
                                <td className="py-2 px-3 font-mono font-bold text-slate-900">{p.sku}</td>
                                <td className="py-2 px-3 font-medium text-slate-700">{p.name}</td>
                                <td className="py-2 px-3 font-mono text-teal-700">{p.storeLocation}</td>
                                <td className="py-2 px-3 font-mono text-slate-600">{p.lot}</td>
                                <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{p.qty.toLocaleString()} {p.uom}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* SUB-TAB 3: DEFLASH & TRIMMING REQUISITIONS (Task-1 - Collapsible & Scalable) */}
      {subTab === 'DEFLASH' && (
        <div className="space-y-3">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
            <div className="text-slate-600 font-medium">
              Showing <strong className="text-slate-900">{deflashReqs.length}</strong> Deflash Requisitions
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setExpandedDeflashIds(new Set(deflashReqs.map((r) => r.id)))}
                className="px-2.5 py-1 text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition"
              >
                Expand All
              </button>
              <button
                type="button"
                onClick={() => setExpandedDeflashIds(new Set())}
                className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition"
              >
                Collapse All
              </button>
            </div>
          </div>

          {deflashReqs
            .slice((deflashPage - 1) * deflashPageSize, deflashPage * deflashPageSize)
            .map((dfl) => {
              const isExpanded = expandedDeflashIds.has(dfl.id);
              return (
                <div
                  key={dfl.id}
                  className={`bg-white rounded-2xl border transition-all duration-150 overflow-hidden shadow-xs ${
                    isExpanded ? 'border-orange-400 ring-2 ring-orange-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div
                    onClick={() => toggleDeflashExpand(dfl.id)}
                    className={`p-3.5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                      isExpanded ? 'bg-orange-50/40 border-b border-orange-100' : 'bg-white hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        aria-label={isExpanded ? 'Collapse Deflash Requisition' : 'Expand Deflash Requisition'}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDeflashExpand(dfl.id);
                        }}
                        className="p-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-orange-100 hover:text-orange-700 transition shrink-0"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-orange-700" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-600" />
                        )}
                      </button>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-xs bg-orange-100 text-orange-800 px-2.5 py-0.5 rounded-lg border border-orange-200">
                            {dfl.id}
                          </span>
                          <span className="text-xs font-semibold text-slate-700">
                            Target: <strong className="text-slate-900">{dfl.targetBay}</strong> &bull; Date: {dfl.date}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600">
                          WIP Molded Part: <strong className="font-mono text-orange-700">{dfl.wipItemSku}</strong> &mdash; {dfl.wipItemName} (<strong>{dfl.qty} {dfl.uom}</strong>)
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-auto">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          dfl.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {dfl.status}
                      </span>
                      {dfl.status === 'PENDING' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeflashReqs((prev) =>
                              prev.map((r) =>
                                r.id === dfl.id
                                  ? { ...r, status: 'COMPLETED', issuedAt: new Date().toLocaleTimeString(), issuedBy: 'Deflash Supervisor' }
                                  : r
                              )
                            );
                            showToast(`Issued WIP parts and blades for ${dfl.id}`);
                          }}
                          className="px-3 py-1.5 bg-[#E8622C] text-white rounded-xl text-xs font-bold shadow-2xs hover:bg-[#d45522] transition whitespace-nowrap"
                        >
                          Issue WIP &amp; Tools
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 space-y-3 bg-white">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                        <span className="font-bold text-slate-700">Consumables &amp; Tools Required from CON Store:</span>
                        <div className="flex items-center gap-2 mt-1">
                          {dfl.toolsRequired.map((tool) => (
                            <span key={tool} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-medium text-slate-700">
                              {tool}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* SUB-TAB 4: PRODUCTION STORE RETURNS (MRN) (Task-6) */}
      {subTab === 'RETURNS' && (
        <div className="space-y-3">
          <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-700" />
              <div>
                <h4 className="font-bold text-xs text-amber-900">
                  Leftover Material Returns from PRD-UNIT-1 to Main Warehouse
                </h4>
                <p className="text-[11px] text-slate-600">
                  All reverse transfers reference the original <span className="font-mono font-bold text-slate-800">Mixing Reference Number</span> for reverse audit &amp; batch genealogy.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsReturnModalOpen(true)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs"
            >
              + Create Material Return (MRN)
            </button>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">MRN #</th>
                  <th className="py-2.5 px-3">Return Date &amp; Time</th>
                  <th className="py-2.5 px-3">Mixing Reference #</th>
                  <th className="py-2.5 px-3">Source Store &rarr; Dest</th>
                  <th className="py-2.5 px-3">Returned Materials</th>
                  <th className="py-2.5 px-3">Authorized By</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {returns.map((ret) => (
                  <tr key={ret.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#2563EB]">{ret.id}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">
                      {ret.returnDate} {ret.returnTime}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                      {ret.mixingReferenceNumber}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 font-medium">
                      <span className="font-bold text-blue-700">{ret.sourceStore}</span> &rarr; {ret.destinationWarehouse}
                    </td>
                    <td className="py-2.5 px-3">
                      {ret.returnedItems.map((item) => (
                        <div key={item.sku} className="text-[11px]">
                          <strong className="text-slate-800">{item.returnedQty} {item.uom}</strong> &bull; {item.name} (<span className="font-mono text-slate-500">Lot {item.lotNumber}</span>)
                        </div>
                      ))}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 text-[11px]">{ret.authorizedBy}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {ret.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: TRANSFER CMR TO PRODUCTION STORE PRD-UNIT-1 (Task-1 & Task-4) */}
      {selectedCmrForTransfer && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-blue-600">{selectedCmrForTransfer.id}</span>
                <h3 className="font-bold text-base text-slate-900">
                  Transfer CMR to Production Store (PRD-UNIT-1)
                </h3>
              </div>
              <button
                onClick={() => setSelectedCmrForTransfer(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Generated Mixing Reference Number Box (Task-4) */}
            <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Generated Mixing Material Reference Number (BOM Linked):</span>
              </div>
              <input
                type="text"
                value={generatedMixRef}
                onChange={(e) => setGeneratedMixRef(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-blue-300 rounded-lg text-sm font-mono font-bold text-blue-800 outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-blue-700">
                This unique reference links the polymer resin, color masterbatch, and regrind ratios directly to Part <strong className="font-mono">{selectedCmrForTransfer.finishedGoodSku}</strong> and Schedule <strong className="font-mono">{selectedCmrForTransfer.scheduleNumber}</strong>.
              </p>
            </div>

            {/* Target Store Selection (Task-5) */}
            <div className="space-y-1 text-xs">
              <label className="font-bold text-slate-700">Target Production Store</label>
              <select
                value={targetStore}
                onChange={(e) => setTargetStore(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="PRD-UNIT-1">PRD-UNIT-1 (Production Store Unit 1 - Shop Floor Hopper &amp; Mixing Bay)</option>
                <option value="STR-PMP-HOP">STR-PMP-HOP (Injection Machine Day Hoppers)</option>
              </select>
            </div>

            {/* Material List to Dispatch */}
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-700">Mixing Materials to Issue from Main Warehouse</label>
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
                {selectedCmrForTransfer.mixingMaterials.map((mat) => (
                  <div key={mat.materialSku} className="flex items-center justify-between text-xs border-b border-slate-200/60 pb-1.5">
                    <div>
                      <span className="font-mono font-bold text-slate-900">{mat.materialSku}</span> &mdash; {mat.materialName}
                      <div className="text-[10px] text-slate-500 font-mono">Lot: {mat.lotNumber}</div>
                    </div>
                    <div className="text-right font-mono font-bold text-emerald-700">
                      {mat.requiredQtyKg} {mat.uom}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedCmrForTransfer(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmTransferCMR}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm"
              >
                Confirm Dispatch to {targetStore}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: RETURN FROM PRD-UNIT-1 TO MAIN WAREHOUSE (Task-6) */}
      {isReturnModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Return Material from PRD-UNIT-1 to Main Warehouse
                </h3>
                <p className="text-xs text-slate-500">
                  Select the original Mixing Reference Number to return unconsumed resin or masterbatch
                </p>
              </div>
              <button
                onClick={() => setIsReturnModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Select Active Mixing Reference (Task-6) */}
            <div className="space-y-1 text-xs">
              <label className="font-bold text-slate-700">Select Mixing Reference Number (Active Issues)</label>
              <select
                value={returnSelectedMixRef}
                onChange={(e) => {
                  setReturnSelectedMixRef(e.target.value);
                  setReturnQty({});
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:ring-1 focus:ring-amber-500 outline-none"
              >
                <option value="">-- Select Active Mixing Reference # --</option>
                {cmrs
                  .filter((c) => c.mixingReferenceNumber)
                  .map((c) => (
                    <option key={c.id} value={c.mixingReferenceNumber}>
                      {c.mixingReferenceNumber} &mdash; {c.finishedGoodSku} ({c.scheduleNumber})
                    </option>
                  ))}
              </select>
            </div>

            {/* Returned Items Input Form */}
            {returnSelectedMixRef && (
              <div className="space-y-2 text-xs">
                <label className="font-bold text-slate-700">Enter Returned Quantities (KG)</label>
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-3">
                  {cmrs
                    .find((c) => c.mixingReferenceNumber === returnSelectedMixRef)
                    ?.mixingMaterials.map((mat) => (
                      <div key={mat.materialSku} className="flex items-center justify-between gap-3 text-xs">
                        <div className="flex-1">
                          <div className="font-mono font-bold text-slate-900">{mat.materialSku}</div>
                          <div className="text-[11px] text-slate-600">{mat.materialName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">Lot: {mat.lotNumber}</div>
                        </div>
                        <div className="w-32">
                          <input
                            type="number"
                            placeholder="Qty (KG)"
                            value={returnQty[mat.materialSku] || ''}
                            onChange={(e) =>
                              setReturnQty((prev) => ({
                                ...prev,
                                [mat.materialSku]: parseFloat(e.target.value) || 0,
                              }))
                            }
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-right outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Return Reason */}
            <div className="space-y-1 text-xs">
              <label className="font-bold text-slate-700">Return Reason / Quality Notes</label>
              <select
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none"
              >
                <option value="Work Order Run Completed - Leftover Material in Sealed Container">
                  Work Order Run Completed - Leftover Material in Sealed Container
                </option>
                <option value="Mold Cavity Change / Machine Breakdown Return">
                  Mold Cavity Change / Machine Breakdown Return
                </option>
                <option value="Shift Handover Balance Material Reversal">
                  Shift Handover Balance Material Reversal
                </option>
                <option value="Excess Material Issued (Order Quantity Trimmed)">
                  Excess Material Issued (Order Quantity Trimmed)
                </option>
              </select>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsReturnModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReturn}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-sm"
              >
                Post Material Return (MRN)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
