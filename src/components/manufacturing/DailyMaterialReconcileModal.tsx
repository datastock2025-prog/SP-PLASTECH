import React, { useState, useMemo } from 'react';
import { WorkOrder, ItemMaster, BomMaster, BomLine } from '../../types';
import {
  X,
  Layers,
  Package,
  Boxes,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Minus,
  Save,
  Check,
  ShieldCheck,
  Factory,
  Database,
  RefreshCw,
  Tag,
  Scale,
  FileSpreadsheet,
  Sun,
  Moon,
  Flame,
  Clock,
  Plus,
} from 'lucide-react';
import { categorizeBomLine, getSyntheticRecipeForPart, getFormulaRecipeId } from './jit/jitCalculations';
import { BomVersionRecipeDeveloperModal } from './bom/BomVersionRecipeDeveloperModal';
import { BomVersionApprovalGrid } from './bom/BomVersionApprovalGrid';

interface DailyMaterialReconcileModalProps {
  workOrder: WorkOrder;
  isOpen: boolean;
  onClose: () => void;
  items: ItemMaster[];
  boms: BomMaster[];
  onUpdateWO: (wo: WorkOrder) => void;
  onDeductMaterialStore?: (woId: string, deductions: Array<{ itemCode: string; qty: number; uom: string; store: string }>) => void;
  showToast: (msg: string) => void;
}

export const DailyMaterialReconcileModal: React.FC<DailyMaterialReconcileModalProps> = ({
  workOrder,
  isOpen,
  onClose,
  items,
  boms,
  onUpdateWO,
  onDeductMaterialStore,
  showToast,
}) => {
  if (!isOpen || !workOrder) return null;

  // Plant & Target Store determination
  const targetPlant = workOrder.plant || 'PLANT-01';
  const targetStore = targetPlant.includes('02') || targetPlant.includes('2') ? 'PRD-UNIT-2' : 'PRD-UNIT-1';

  // Task 1: 2 Tabs for Shift-1 (Shift A - Day) and Shift-2 (Shift B - Night)
  const [activeShiftTab, setActiveShiftTab] = useState<'shift1' | 'shift2'>(
    workOrder.shift?.includes('Shift B') || workOrder.shift?.includes('Shift C') ? 'shift2' : 'shift1'
  );

  // Local BOM versions list
  const [localBoms, setLocalBoms] = useState<BomMaster[]>(boms);
  const [isBomDevModalOpen, setIsBomDevModalOpen] = useState<boolean>(false);
  const [isBomApprovalGridOpen, setIsBomApprovalGridOpen] = useState<boolean>(false);

  // Find all available BOMs / versions for this parent product
  const productBoms = useMemo(() => {
    const matched = localBoms.filter(
      (b) => b.parent === workOrder.item || b.parentName === workOrder.item || (b.id && b.id === workOrder.bomId)
    );
    if (matched.length > 0) return matched;

    // Default fallback BOMs with version options
    return [
      {
        id: workOrder.bomId || 'BOM-1042-V1',
        parent: workOrder.item,
        parentName: items.find((i) => i.code === workOrder.item)?.name || workOrder.item,
        version: 'v1.0 (Standard Virgin 100%)',
        status: 'released' as any,
        updated: '2026-08-20',
        lines: getSyntheticRecipeForPart(items.find((i) => i.code === workOrder.item) || ({ code: workOrder.item, name: 'Standard Part' } as any)),
      } as BomMaster,
      {
        id: 'BOM-1042-V2',
        parent: workOrder.item,
        parentName: items.find((i) => i.code === workOrder.item)?.name || workOrder.item,
        version: 'v2.0 (Regrind 20% Blend Recipe)',
        status: 'released' as any,
        updated: '2026-08-21',
        lines: [
          { item: 'RM-PP-NAT-001', name: 'PP Natural Granules (Virgin 80%)', qty: 0.388, uom: 'KG', scrap: 1.5, cost: 32 },
          { item: 'RG-PP-011', name: 'In-House Regrind PP (20%)', qty: 0.097, uom: 'KG', scrap: 1.0, cost: 8 },
          { item: 'MB-BLU-001', name: 'Cyan Blue Masterbatch 2%', qty: 0.0097, uom: 'KG', scrap: 0.5, cost: 2.5 },
          { item: 'PK-CTN-021', name: 'Heavy Duty 5-Ply Corrugated Master Carton', qty: 0.02, uom: 'NOS', scrap: 0.5, cost: 4.5 },
          { item: 'PK-STRETCH-01', name: 'LLDPE Machine Stretch Wrap & Top Cover', qty: 0.005, uom: 'ROLL', scrap: 0, cost: 1.2 },
          { item: 'SP-INS-001', name: 'Threaded Brass Insert M6 (BOP)', qty: 1.0, uom: 'NOS', scrap: 0.2, cost: 3.5 },
          { item: 'CON-LBL-01', name: 'Barcoded Floor Dispatch Label (Consumable)', qty: 1.0, uom: 'NOS', scrap: 1.0, cost: 0.2 },
        ],
      } as BomMaster,
      {
        id: 'BOM-1042-V3',
        parent: workOrder.item,
        parentName: items.find((i) => i.code === workOrder.item)?.name || workOrder.item,
        version: 'v3.0 (Alternate Masterbatch & Packaging Spec)',
        status: 'released' as any,
        updated: '2026-08-22',
        lines: [
          { item: 'RM-PP-NAT-001', name: 'PP Natural Granules', qty: 0.485, uom: 'KG', scrap: 2.0, cost: 38 },
          { item: 'MB-RED-004', name: 'Crimson Red Masterbatch 2.5%', qty: 0.012, uom: 'KG', scrap: 0.5, cost: 3.2 },
          { item: 'PK-BOX-002', name: 'Export Grade Heavy Octabin Box', qty: 0.01, uom: 'NOS', scrap: 0, cost: 6.0 },
          { item: 'SP-INS-001', name: 'Threaded Brass Insert M6 (BOP)', qty: 1.0, uom: 'NOS', scrap: 0.2, cost: 3.5 },
          { item: 'CON-PURGE-01', name: 'Ultra-Clean Barrel Purge Granules', qty: 0.002, uom: 'KG', scrap: 0, cost: 1.8 },
        ],
      } as BomMaster,
    ];
  }, [localBoms, workOrder.item, workOrder.bomId, items]);

  // Active Selected BOM Version for this specific daily production log (Task 4)
  const [selectedBomId, setSelectedBomId] = useState<string>(
    workOrder.bomId || productBoms[0]?.id || 'BOM-1042-V1'
  );

  const activeBom = useMemo(() => {
    return productBoms.find((b) => b.id === selectedBomId) || productBoms[0];
  }, [productBoms, selectedBomId]);

  // Unified Formula ID linked to this active BOM version (Task 7b)
  const activeFormulaId = useMemo(() => {
    return (
      workOrder.formulaId ||
      getFormulaRecipeId(
        workOrder.item,
        items.find((i) => i.code === workOrder.item)?.name,
        activeBom?.version
      )
    );
  }, [workOrder.formulaId, workOrder.item, items, activeBom?.version]);

  // Status of store deduction in this session
  const [isDeducted, setIsDeducted] = useState<boolean>(false);

  // Shift-Specific Quantities
  const plannedTarget = Number(workOrder.qty) || 1;
  const plannedQty = plannedTarget;
  const cumulativeGood = Number(workOrder.completed) || 0;

  // Shift 1 vs Shift 2 values
  const shiftGood = Number(workOrder.completed) || 0;
  const shiftScrap = Number(workOrder.scrap) || 0;
  
  // Task 3: Runner & Lumps in KG
  const runnerKg = Number(workOrder.runnerWeightKg || workOrder.runnerQty) || 0;
  const lumpsKg = Number(workOrder.lumpsWeightKg || workOrder.lumbesQty) || 0;

  // Shift multiplier (Shift-1 uses current shift input; Shift-2 shows planned shift slice or entry)
  const currentShiftGood = activeShiftTab === 'shift1' ? shiftGood : Math.round(plannedTarget * 0.5);
  const currentShiftScrap = activeShiftTab === 'shift1' ? shiftScrap : 0;
  const currentShiftRunner = activeShiftTab === 'shift1' ? runnerKg : 0;
  const currentShiftLumps = activeShiftTab === 'shift1' ? lumpsKg : 0;
  const shiftTotalProduced = currentShiftGood + currentShiftScrap;
  const balanceToFinish = Math.max(0, plannedTarget - cumulativeGood);

  // Item stock helper
  const getItemStoreStock = (code: string): number => {
    const itm = items.find((i) => i.code === code);
    if (!itm) return 850; // default floor inventory stock
    const num = parseFloat(String(itm.stock || itm.avail || '850').replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 850 : num;
  };

  // Exploded Material Requirements with Categorization (+pck +bop +con + runner + lumps) (Tasks 2 & 3)
  const recipeLines = useMemo(() => {
    const rawLines = activeBom?.lines && activeBom.lines.length > 0
      ? activeBom.lines
      : getSyntheticRecipeForPart(items.find((i) => i.code === workOrder.item) || ({ code: workOrder.item, name: 'Standard Part' } as any));

    return rawLines.map((line: BomLine) => {
      const itm = items.find((i) => i.code === line.item);
      const catInfo = categorizeBomLine(line, itm, targetPlant);

      // Refined Category Mapping: RM, MB, PCK, BOP, CON
      let categoryType: 'RM' | 'MB' | 'PCK' | 'BOP' | 'CON' = 'RM';
      const codeUpper = (line.item || '').toUpperCase();
      const nameUpper = (line.name || '').toUpperCase();

      if (catInfo.cat === 'MB' || codeUpper.startsWith('MB-') || nameUpper.includes('MASTERBATCH') || nameUpper.includes('COLOR')) {
        categoryType = 'MB';
      } else if (catInfo.cat === 'PCK' || codeUpper.startsWith('PK-') || nameUpper.includes('CARTON') || nameUpper.includes('BOX') || nameUpper.includes('STRETCH') || nameUpper.includes('POLYBAG')) {
        categoryType = 'PCK';
      } else if (codeUpper.startsWith('SP-') || codeUpper.startsWith('INS-') || codeUpper.startsWith('BOP-') || nameUpper.includes('INSERT') || nameUpper.includes('HANDLE') || nameUpper.includes('SCREW')) {
        categoryType = 'BOP';
      } else if (codeUpper.startsWith('CON-') || nameUpper.includes('PURGE') || nameUpper.includes('LABEL') || nameUpper.includes('SPRAY') || nameUpper.includes('CONSUMABLE')) {
        categoryType = 'CON';
      } else {
        categoryType = 'RM';
      }

      const unitRatio = Number(line.qty) || 0.1;
      
      // Task 3: Sum runner and lumps kg into primary Raw Material / Resin consumption
      const extraWasteKg = (categoryType === 'RM' && line.uom?.toUpperCase() === 'KG')
        ? (currentShiftRunner + currentShiftLumps)
        : 0;

      const baseConsumed = shiftTotalProduced > 0 ? (shiftTotalProduced * unitRatio) : (plannedQty * unitRatio);
      const shiftConsumedQty = Number((baseConsumed + extraWasteKg).toFixed(3));
      const totalPlannedReq = Number((plannedQty * unitRatio).toFixed(3));
      const balanceReq = Number((balanceToFinish * unitRatio).toFixed(3));
      const storeStock = getItemStoreStock(line.item);
      const isMatched = storeStock >= shiftConsumedQty;
      const deficit = Math.max(0, shiftConsumedQty - storeStock);

      return {
        itemCode: line.item,
        itemName: line.name || itm?.name || line.item,
        category: categoryType,
        uom: line.uom || 'KG',
        unitRatio,
        shiftConsumedQty,
        extraWasteKg,
        totalPlannedReq,
        balanceReq,
        storeStock,
        isMatched,
        deficit,
        storeCode: targetStore,
      };
    });
  }, [
    activeBom,
    items,
    targetPlant,
    targetStore,
    shiftTotalProduced,
    plannedQty,
    balanceToFinish,
    workOrder.item,
    currentShiftRunner,
    currentShiftLumps,
  ]);

  // Check if any material is in shortage in PRD-UNIT-1 store
  const hasShortage = recipeLines.some((r) => !r.isMatched);
  const shortageItems = recipeLines.filter((r) => !r.isMatched);

  // Handle Save BOM Version Override for this Work Order (Task 4)
  const handleSaveBomVersion = () => {
    const updatedWO: WorkOrder = {
      ...workOrder,
      bomId: activeBom.id,
      formulaId: activeFormulaId,
      history: [
        ...(workOrder.history || []),
        {
          event: `Daily Production BOM version switched to ${activeBom.version} (${activeBom.id}) and Formula ${activeFormulaId} for shift execution`,
          time: new Date().toLocaleTimeString(),
        },
      ],
    };
    onUpdateWO(updatedWO);
    showToast(`✅ Updated BOM version to "${activeBom.version}" (Formula: ${activeFormulaId}) for Work Order ${workOrder.id}.`);
  };

  // Handle Minus / Deduct from Production Store (Task 1 & Task 2 & Task 7)
  const handleDeductFromStore = () => {
    if (isDeducted) {
      showToast('⚠️ Store stock for this shift has already been deducted.');
      return;
    }

    // Task 1: If shortage exists, notify shortage and warn before proceeding
    if (hasShortage) {
      const shortageSummary = shortageItems.map((s) => `${s.itemCode} (Need +${s.deficit} ${s.uom})`).join(', ');
      showToast(`⚠️ Store Shortage Detected in ${targetStore}! Deficit items: ${shortageSummary}. Please replenish store stock before deducting.`);
      return;
    }

    const deductions = recipeLines.map((r) => ({
      itemCode: r.itemCode,
      qty: r.shiftConsumedQty,
      uom: r.uom,
      store: targetStore,
    }));

    if (onDeductMaterialStore) {
      onDeductMaterialStore(workOrder.id, deductions);
    }

    // Log the transaction in the Work Order history
    const summaryStr = deductions.map((d) => `${d.qty} ${d.uom} of ${d.itemCode}`).join(', ');
    const updatedWO: WorkOrder = {
      ...workOrder,
      bomId: activeBom.id,
      formulaId: activeFormulaId,
      history: [
        ...(workOrder.history || []),
        {
          event: `Production Store Deduction (${targetStore}, ${activeShiftTab === 'shift1' ? 'Shift A' : 'Shift B'} under Formula ${activeFormulaId}): Minused ${summaryStr} based on ${shiftTotalProduced} PCS produced (${currentShiftGood} Good + ${currentShiftScrap} Scrap) + ${currentShiftRunner}kg runner + ${currentShiftLumps}kg lumps.`,
          time: new Date().toLocaleTimeString(),
        },
      ],
    };
    onUpdateWO(updatedWO);
    setIsDeducted(true);

    showToast(`🎉 Stock Verified & Matched! Successfully deducted ${deductions.length} materials from ${targetStore} store.`);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* 1. Senior Executive Header */}
        <div className="p-5 bg-gradient-to-r from-[#14213D] via-[#1E293B] to-[#0F8B8D] text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-teal-300 border border-white/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-teal-400/20 text-teal-300 border border-teal-400/30">
                  Material &amp; Store Reconciliation
                </span>
                <span className="text-xs text-slate-300">&bull;</span>
                <span className="text-xs font-mono font-bold text-amber-300">{workOrder.id}</span>
                <span className="text-xs text-slate-300">&bull;</span>
                <span className="text-xs font-semibold text-slate-200">
                  Connected Store: <strong className="text-white">{targetStore}</strong>
                </span>
              </div>
              <h2 className="text-xl font-black tracking-tight text-white mt-0.5">
                Recipe Material Requirement &amp; Store Stock Deduction
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Task 1: 2 Tabs for Shift-1 and Shift-2 */}
        <div className="bg-slate-100 px-5 pt-3 pb-0 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveShiftTab('shift1');
                setIsDeducted(false);
              }}
              className={`px-4 py-2 rounded-t-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer border-t border-x ${
                activeShiftTab === 'shift1'
                  ? 'bg-white text-slate-900 border-slate-200 shadow-2xs -mb-px'
                  : 'bg-slate-200 text-slate-600 border-transparent hover:bg-slate-300'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Shift-1 (Day / Shift A)</span>
              {currentShiftGood > 0 && activeShiftTab === 'shift1' && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-teal-100 text-teal-800 font-mono font-bold">
                  {currentShiftGood} PCS
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveShiftTab('shift2');
                setIsDeducted(false);
              }}
              className={`px-4 py-2 rounded-t-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer border-t border-x ${
                activeShiftTab === 'shift2'
                  ? 'bg-white text-slate-900 border-slate-200 shadow-2xs -mb-px'
                  : 'bg-slate-200 text-slate-600 border-transparent hover:bg-slate-300'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-indigo-500" />
              <span>Shift-2 (Night / Shift B)</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 pb-2 hidden sm:block">
            Shift-specific material consumption &amp; store stock deduction engine
          </div>
        </div>

        {/* 2. Cockpit Strip: Output Basis, Runner & Lumps kg Sum (Task 3), and BOM Version */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          
          {/* Work Order & Part Info */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Product Part</span>
            <div className="font-extrabold text-slate-900 text-sm truncate" title={workOrder.item}>
              {items.find((i) => i.code === workOrder.item)?.name || workOrder.item}
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              Item: {workOrder.item} &bull; Bay: {workOrder.machine || 'Unassigned'}
            </div>
          </div>

          {/* Shift Output Basis (Good + Scrap + Runner + Lumps) (Task 3) */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {activeShiftTab === 'shift1' ? 'Shift-1 Production Basis' : 'Shift-2 Production Basis'}
              </span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                Good + Scrap + Runner/Lumps
              </span>
            </div>
            <div className="flex items-baseline gap-2 font-mono mt-0.5 flex-wrap">
              <span className="text-base font-black text-slate-900">
                {shiftTotalProduced.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">PCS</span>
              </span>
              <span className="text-xs text-slate-400">
                ({currentShiftGood.toLocaleString()} Good + {currentShiftScrap.toLocaleString()} Scrap)
              </span>
            </div>
            {(currentShiftRunner > 0 || currentShiftLumps > 0) && (
              <div className="text-[10px] text-amber-700 font-bold flex items-center gap-1.5 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                <Scale className="w-3 h-3 text-amber-600" />
                <span>+ {currentShiftRunner} kg Runner &bull; + {currentShiftLumps} kg Lumps added to RM mass</span>
              </div>
            )}
            <div className="text-[10px] text-slate-500">
              Target: {plannedTarget.toLocaleString()} PCS &bull; Balance: {balanceToFinish.toLocaleString()} PCS
            </div>
          </div>

          {/* Task 4: Dynamic BOM Version Switcher */}
          <div className="bg-white p-3 rounded-2xl border border-indigo-200 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-indigo-900 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-600" /> Active BOM Version
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                Daily Override
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <select
                value={selectedBomId}
                onChange={(e) => {
                  setSelectedBomId(e.target.value);
                  setIsDeducted(false);
                }}
                className="w-full px-2 py-1.5 rounded-xl border border-indigo-300 bg-indigo-50/30 text-xs font-bold text-indigo-950 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              >
                {productBoms.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.version || b.id} &mdash; {b.id}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleSaveBomVersion}
                className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shrink-0 shadow-2xs cursor-pointer transition-colors"
                title="Save BOM version for this work order"
              >
                Set
              </button>
            </div>
            <div className="text-[10px] text-indigo-700 truncate">
              {activeBom.version} ({recipeLines.length} material lines)
            </div>
            <div className="pt-1.5 border-t border-indigo-100 flex items-center justify-between gap-1 text-[10px]">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-slate-500">Formula:</span>
                <span className="font-mono font-extrabold text-cyan-800 bg-cyan-100 px-1.5 py-0.2 rounded border border-cyan-300">
                  {activeFormulaId}
                </span>
              </div>
              <span className="font-mono font-bold text-slate-600">
                {hasShortage ? (
                  <span className="text-rose-600 font-bold">⚠️ Store Deficit</span>
                ) : (
                  <span className="text-emerald-700 font-bold">✅ PRD Store Ready</span>
                )}
              </span>
            </div>

            {/* Task 3: Develop New BOM Version & Approvals triggers */}
            <div className="pt-1.5 border-t border-indigo-50 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsBomDevModalOpen(true)}
                className="px-2 py-1 rounded-lg bg-cyan-100 hover:bg-cyan-200 text-cyan-950 font-extrabold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                title="Create or adjust recipe ratios to develop a new BOM version"
              >
                <Plus className="w-3 h-3 text-cyan-700" />
                <span>+ Develop Recipe</span>
              </button>

              <button
                type="button"
                onClick={() => setIsBomApprovalGridOpen(true)}
                className="px-2 py-1 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-950 font-extrabold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                title="Open BOM Version Approval Grid"
              >
                <ShieldCheck className="w-3 h-3 text-indigo-700" />
                <span>Approval Grid</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. Detailed Material Breakdown Table (+pck +bop +con + runner + lumps) */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Boxes className="w-4 h-4 text-teal-600" />
                <span>Exploded Material Requirements ({activeShiftTab === 'shift1' ? 'Shift-1' : 'Shift-2'})</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Quantities consumed for shift output (including Runner &amp; Lumps kg) vs remaining target in <strong>{targetStore}</strong> store.
              </p>
            </div>

            {hasShortage ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                Store Shortage in {targetStore} ({shortageItems.length} item{shortageItems.length > 1 ? 's' : ''})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                100% Stock Matched in {targetStore} (Ready to Save &amp; Deduct)
              </span>
            )}
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs bg-white">
            <table className="w-full text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 select-none">
                <tr>
                  <th className="p-3 text-left">Category</th>
                  <th className="p-3 text-left">Component Item</th>
                  <th className="p-3 text-right">BOM Ratio</th>
                  <th className="p-3 text-right">Shift Consumed</th>
                  <th className="p-3 text-right">Balance to Finish</th>
                  <th className="p-3 text-right bg-slate-200/60">Store Stock ({targetStore})</th>
                  <th className="p-3 text-center">Store Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recipeLines.map((line, idx) => {
                  return (
                    <tr key={`${line.itemCode}-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                      {/* Category Badge */}
                      <td className="p-3 font-semibold">
                        {line.category === 'RM' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-200">
                            RM &bull; Resin
                          </span>
                        )}
                        {line.category === 'MB' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200">
                            MB &bull; Colorant
                          </span>
                        )}
                        {line.category === 'PCK' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-teal-100 text-teal-900 border border-teal-200">
                            +PCK &bull; Packaging
                          </span>
                        )}
                        {line.category === 'BOP' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-200">
                            +BOP &bull; Hardware
                          </span>
                        )}
                        {line.category === 'CON' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-200 text-slate-800 border border-slate-300">
                            +CON &bull; Consumable
                          </span>
                        )}
                      </td>

                      {/* Component Info */}
                      <td className="p-3">
                        <div className="font-bold text-slate-900 text-xs">{line.itemName}</div>
                        <div className="text-[10px] font-mono text-slate-400">{line.itemCode}</div>
                        {line.extraWasteKg > 0 && (
                          <div className="text-[9px] text-amber-700 font-bold font-mono mt-0.5">
                            Includes +{line.extraWasteKg} kg Runner/Lumps
                          </div>
                        )}
                      </td>

                      {/* Unit Ratio */}
                      <td className="p-3 text-right font-mono text-slate-600">
                        {line.unitRatio} <span className="text-[10px]">{line.uom} / PC</span>
                      </td>

                      {/* Shift Consumed (Good + Scrap + Runner/Lumps kg) (Tasks 2 & 3) */}
                      <td className="p-3 text-right font-mono font-bold text-slate-900 bg-amber-50/30">
                        {line.shiftConsumedQty.toLocaleString()}{' '}
                        <span className="text-[10px] text-amber-800 font-normal">{line.uom}</span>
                      </td>

                      {/* Balance to Finish Target */}
                      <td className="p-3 text-right font-mono text-slate-600">
                        {line.balanceReq.toLocaleString()}{' '}
                        <span className="text-[10px] text-slate-400 font-normal">{line.uom}</span>
                      </td>

                      {/* Store Available Stock */}
                      <td className="p-3 text-right font-mono font-bold text-slate-900 bg-slate-50">
                        {line.storeStock.toLocaleString()}{' '}
                        <span className="text-[10px] text-slate-500 font-normal">{line.uom}</span>
                      </td>

                      {/* Verification Status (Task 1) */}
                      <td className="p-3 text-center">
                        {line.isMatched ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-700" /> Matched
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-300 animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-rose-600" /> Shortage (-{line.deficit} {line.uom})
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

        {/* 4. Executive Action Footer: Minus & Deduct from Store (Task 1 Shortage Safeguard) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">
              Total Materials for {activeShiftTab === 'shift1' ? 'Shift-1' : 'Shift-2'}:{' '}
              <strong className="text-slate-900 font-mono">{recipeLines.length} components</strong>
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">
              Target Store: <strong className="text-teal-800 font-mono">{targetStore}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleDeductFromStore}
              disabled={isDeducted}
              className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
                isDeducted
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-not-allowed'
                  : hasShortage
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-[#0F8B8D] hover:bg-[#0c7072] text-white'
              }`}
            >
              {isDeducted ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Store Stock Deducted (-)</span>
                </>
              ) : hasShortage ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Notify Shortage in {targetStore} &amp; Deduct Available</span>
                </>
              ) : (
                <>
                  <Minus className="w-3.5 h-3.5" />
                  <span>Deduct &amp; Minus from {targetStore} Store</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>

    {/* Task 3: BOM Version Recipe Developer Modal */}
    {isBomDevModalOpen && (
      <BomVersionRecipeDeveloperModal
        isOpen={isBomDevModalOpen}
        onClose={() => setIsBomDevModalOpen(false)}
        items={items}
        initialItemCode={workOrder.item}
        initialBom={activeBom}
        onSubmitForApproval={(newBom) => {
          setLocalBoms((prev) => [newBom, ...prev]);
          setSelectedBomId(newBom.id);
          showToast(`🚀 New BOM recipe version "${newBom.version}" submitted to approval grid!`);
        }}
        showToast={showToast}
      />
    )}

    {/* Task 3: BOM Version Approval Grid Modal */}
    {isBomApprovalGridOpen && (
      <BomVersionApprovalGrid
        isOpen={isBomApprovalGridOpen}
        onClose={() => setIsBomApprovalGridOpen(false)}
        boms={localBoms}
        items={items}
        onApproveBom={(bomId) => {
          setLocalBoms((prev) =>
            prev.map((b) => (b.id === bomId ? { ...b, status: 'approved' } : b))
          );
        }}
        onStageToPrdStore={(bom, formula) => {
          showToast(`📦 Recipe staged to PRD Store under Formula ID ${formula}!`);
        }}
        onCreateNewBom={(newBom) => {
          setLocalBoms((prev) => [newBom, ...prev]);
        }}
        showToast={showToast}
      />
    )}
  </>
);
};

