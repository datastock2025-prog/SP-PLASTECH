import React, { useState, useMemo } from 'react';
import { ItemMaster, BomMaster, BomLine } from '../../../types';
import {
  X,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Layers,
  Scale,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Package,
  Boxes,
  HelpCircle,
} from 'lucide-react';
import { getFormulaRecipeId } from '../jit/jitCalculations';

export interface BomRecipeLineDraft {
  id: string;
  itemCode: string;
  itemName: string;
  materialType: 'Raw Polymer' | 'Regrind' | 'Masterbatch' | 'Additive' | 'Packaging' | 'Bought-Out' | 'Consumable';
  qtyPerUnit: number;
  uom: string;
  scrapPct: number;
  unitCostInr: number;
  lotNumber?: string;
}

interface BomVersionRecipeDeveloperModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ItemMaster[];
  initialItemCode?: string;
  initialItemName?: string;
  initialBom?: BomMaster | null;
  onSubmitForApproval: (newBom: BomMaster, formulaId: string) => void;
  showToast: (msg: string) => void;
}

export const BomVersionRecipeDeveloperModal: React.FC<BomVersionRecipeDeveloperModalProps> = ({
  isOpen,
  onClose,
  items,
  initialItemCode,
  initialItemName,
  initialBom,
  onSubmitForApproval,
  showToast,
}) => {
  if (!isOpen) return null;

  // Selected Parent Finished Good / Molded Part (Strictly bound to row item)
  const selectedParentCode = initialItemCode || initialBom?.parent || 'FG-CTN-500';

  const parentItem = useMemo(() => {
    const found = items.find((i) => i.code === selectedParentCode);
    return {
      code: selectedParentCode,
      name: initialItemName || found?.name || (selectedParentCode === 'FG-CTN-500' ? 'Plastic Container 500ml (PP Food Grade)' : selectedParentCode === 'FG-BKT-010' ? 'Household Bucket 10L (Virgin Grade Red)' : selectedParentCode === 'FG-PAL-010' ? 'Plastic Pallet Heavy Duty (Reinforced HDPE)' : 'Molded Plastic Component'),
      type: found?.type || 'Finished Good',
      baseUOM: found?.baseUOM || 'PCS',
    } as ItemMaster;
  }, [items, selectedParentCode, initialItemName]);

  // Version Name Input - Auto increment from current version
  const [versionTag, setVersionTag] = useState<string>(() => {
    if (initialBom?.version) {
      const vNum = parseFloat(initialBom.version.replace(/[^0-9.]/g, '')) || 1.0;
      return `v${(vNum + 0.1).toFixed(1)} (Custom Blend)`;
    }
    return 'v1.1 (Optimized Recipe Blend)';
  });

  const [revisionNotes, setRevisionNotes] = useState<string>(
    'Optimized polymer blend with 12.8% regrind ratio & UV stabilizer for improved tensile strength and cost efficiency.'
  );

  const [batchBaseQty, setBatchBaseQty] = useState<number>(1000); // Base calculation reference batch

  // Initial Recipe Draft Lines (Pre-populated from BOM or item profile)
  const [recipeLines, setRecipeLines] = useState<BomRecipeLineDraft[]>(() => {
    if (initialBom?.lines && initialBom.lines.length > 0) {
      return initialBom.lines.map((l, idx) => {
        const itm = items.find((i) => i.code === l.item);
        const codeUpper = (l.item || '').toUpperCase();
        let matType: BomRecipeLineDraft['materialType'] = 'Raw Polymer';

        if (codeUpper.startsWith('RG-') || (l.name || '').toUpperCase().includes('REGRIND')) {
          matType = 'Regrind';
        } else if (codeUpper.startsWith('MB-') || (l.name || '').toUpperCase().includes('MASTERBATCH')) {
          matType = 'Masterbatch';
        } else if (codeUpper.startsWith('AD-') || (l.name || '').toUpperCase().includes('ADDITIVE')) {
          matType = 'Additive';
        } else if (codeUpper.startsWith('PK-') || (l.name || '').toUpperCase().includes('CARTON')) {
          matType = 'Packaging';
        } else if (codeUpper.startsWith('SP-') || codeUpper.startsWith('BOP-')) {
          matType = 'Bought-Out';
        }

        return {
          id: `line-${idx + 1}-${Date.now()}`,
          itemCode: l.item,
          itemName: l.name || itm?.name || l.item,
          materialType: matType,
          qtyPerUnit: Number(l.qty) || 0.05,
          uom: l.uom || 'KG',
          scrapPct: Number(l.scrap) || 1.0,
          unitCostInr: Number(l.cost) || 110,
          lotNumber: `LOT-${l.item.slice(0, 6)}-2026`,
        };
      });
    }

    // Default template recipe lines based on SKU
    if (selectedParentCode.includes('BKT')) {
      return [
        {
          id: 'line-1',
          itemCode: 'RAW-HD-INJ-002',
          itemName: 'High-Density Polyethylene (HDPE) Injection Grade',
          materialType: 'Raw Polymer',
          qtyPerUnit: 0.28,
          uom: 'KG',
          scrapPct: 1.5,
          unitCostInr: 108.0,
          lotNumber: 'LOT-HDPE-2026-002',
        },
        {
          id: 'line-2',
          itemCode: 'MB-RED-001',
          itemName: 'Signal Red Masterbatch 2.5%',
          materialType: 'Masterbatch',
          qtyPerUnit: 0.007,
          uom: 'KG',
          scrapPct: 0.5,
          unitCostInr: 240.0,
          lotNumber: 'LOT-MB-RED-01',
        },
        {
          id: 'line-3',
          itemCode: 'RG-HD-001',
          itemName: 'Clean In-House HDPE Regrind',
          materialType: 'Regrind',
          qtyPerUnit: 0.02,
          uom: 'KG',
          scrapPct: 1.0,
          unitCostInr: 42.0,
          lotNumber: 'LOT-RG-HD-01',
        },
      ];
    }

    return [
      {
        id: 'line-1',
        itemCode: 'RAW-PP-INJ-001',
        itemName: 'Polypropylene Copolymer (PPCP) Repol H030SG',
        materialType: 'Raw Polymer',
        qtyPerUnit: 0.0425, // 42.5g
        uom: 'KG',
        scrapPct: 1.5,
        unitCostInr: 112.5,
        lotNumber: 'LOT-PPCP-2026-004',
      },
      {
        id: 'line-2',
        itemCode: 'MB-BLU-001',
        itemName: 'Cyan Blue Masterbatch (TiO2 60%)',
        materialType: 'Masterbatch',
        qtyPerUnit: 0.0012, // 1.2g
        uom: 'KG',
        scrapPct: 0.5,
        unitCostInr: 220.0,
        lotNumber: 'LOT-MB-CYAN-09',
      },
      {
        id: 'line-3',
        itemCode: 'AD-UV-STAB-003',
        itemName: 'UV Stabilizer & Clarifier Additive',
        materialType: 'Additive',
        qtyPerUnit: 0.0004, // 0.4g
        uom: 'KG',
        scrapPct: 0.2,
        unitCostInr: 340.0,
        lotNumber: 'LOT-AD-UV-01',
      },
      {
        id: 'line-4',
        itemCode: 'RG-PP-CLN-010',
        itemName: 'Clean PP Regrind (Internal Sprues / Runners)',
        materialType: 'Regrind',
        qtyPerUnit: 0.0065, // 6.5g
        uom: 'KG',
        scrapPct: 2.0,
        unitCostInr: 45.0,
        lotNumber: 'LOT-RG-PP-01',
      },
    ];
  });

  // Pure RM Mass calculation: Strictly RM + RG + MB + Additives in KG (Excludes Packaging, Bought-Out, Consumables)
  const pureRmMetrics = useMemo(() => {
    let virginResinKg = 0;
    let regrindKg = 0;
    let masterbatchKg = 0;
    let additivesKg = 0;
    let totalPackagingCost = 0;
    let totalHardwareCost = 0;
    let totalMaterialCostPerUnit = 0;

    recipeLines.forEach((l) => {
      const lineCost = l.qtyPerUnit * l.unitCostInr * (1 + l.scrapPct / 100);
      totalMaterialCostPerUnit += lineCost;

      if (l.uom.toUpperCase() === 'KG') {
        if (l.materialType === 'Raw Polymer') virginResinKg += l.qtyPerUnit;
        else if (l.materialType === 'Regrind') regrindKg += l.qtyPerUnit;
        else if (l.materialType === 'Masterbatch') masterbatchKg += l.qtyPerUnit;
        else if (l.materialType === 'Additive') additivesKg += l.qtyPerUnit;
      }

      if (l.materialType === 'Packaging') totalPackagingCost += lineCost;
      if (l.materialType === 'Bought-Out') totalHardwareCost += lineCost;
    });

    const pureRmMassPerUnitKg = virginResinKg + regrindKg + masterbatchKg + additivesKg;
    const pureRmMassBatchKg = pureRmMassPerUnitKg * batchBaseQty;
    const regrindPct = pureRmMassPerUnitKg > 0 ? (regrindKg / pureRmMassPerUnitKg) * 100 : 0;
    const masterbatchPct = pureRmMassPerUnitKg > 0 ? (masterbatchKg / pureRmMassPerUnitKg) * 100 : 0;

    return {
      virginResinKg,
      regrindKg,
      masterbatchKg,
      additivesKg,
      pureRmMassPerUnitKg,
      pureRmMassBatchKg,
      regrindPct,
      masterbatchPct,
      totalMaterialCostPerUnit,
      batchTotalCost: totalMaterialCostPerUnit * batchBaseQty,
    };
  }, [recipeLines, batchBaseQty]);

  // Unified Formula ID calculation
  const generatedFormulaId = useMemo(() => {
    return getFormulaRecipeId(parentItem.code, parentItem.name, versionTag);
  }, [parentItem, versionTag]);

  // Add a new line
  const handleAddLine = () => {
    const newLine: BomRecipeLineDraft = {
      id: `line-${Date.now()}`,
      itemCode: 'RAW-PP-NEW',
      itemName: 'New Recipe Component Ingredient',
      materialType: 'Raw Polymer',
      qtyPerUnit: 0.01,
      uom: 'KG',
      scrapPct: 1.0,
      unitCostInr: 100,
      lotNumber: 'LOT-NEW-2026',
    };
    setRecipeLines((prev) => [...prev, newLine]);
  };

  // Remove a line
  const handleRemoveLine = (id: string) => {
    if (recipeLines.length <= 1) {
      showToast('⚠️ A BOM recipe must have at least one raw material line.');
      return;
    }
    setRecipeLines((prev) => prev.filter((l) => l.id !== id));
  };

  // Update line field
  const handleUpdateLine = (id: string, field: keyof BomRecipeLineDraft, val: any) => {
    setRecipeLines((prev) =>
      prev.map((l) => {
        if (l.id === id) {
          const updated = { ...l, [field]: val };
          // If material type changes to packaging, default UOM to NOS
          if (field === 'materialType') {
            if (val === 'Packaging' || val === 'Bought-Out') {
              updated.uom = 'NOS';
            } else if (val === 'Raw Polymer' || val === 'Regrind' || val === 'Masterbatch' || val === 'Additive') {
              updated.uom = 'KG';
            }
          }
          return updated;
        }
        return l;
      })
    );
  };

  // Submit to BOM Version Approval Grid
  const handleSubmit = () => {
    if (pureRmMetrics.pureRmMassPerUnitKg <= 0) {
      showToast('⚠️ Total Pure RM Mass must be greater than 0 KG.');
      return;
    }

    const newBomId = `BOM-${parentItem.code.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now().toString().slice(-4)}`;

    const convertedLines: BomLine[] = recipeLines.map((r) => ({
      item: r.itemCode,
      name: r.itemName,
      qty: r.qtyPerUnit,
      uom: r.uom,
      scrap: r.scrapPct,
      cost: r.unitCostInr,
    }));

    const newBom: BomMaster = {
      id: newBomId,
      parent: parentItem.code,
      parentName: parentItem.name,
      version: versionTag,
      status: 'pending',
      approvalStage: 'Quality Review',
      formulaCode: generatedFormulaId,
      recipeCode: generatedFormulaId,
      updated: new Date().toISOString().split('T')[0],
      createdDate: new Date().toISOString().split('T')[0],
      batchSize: batchBaseQty,
      standardCost: pureRmMetrics.totalMaterialCostPerUnit,
      materialCost: pureRmMetrics.totalMaterialCostPerUnit,
      yieldPct: 100 - (recipeLines[0]?.scrapPct || 1),
      scrapPct: recipeLines[0]?.scrapPct || 1,
      itemNetWeightGrams: pureRmMetrics.pureRmMassPerUnitKg * 1000,
      totalShotWeightGrams: pureRmMetrics.pureRmMassPerUnitKg * 1000 * 1.05,
      notes: `${revisionNotes} | Generated Formula ID: ${generatedFormulaId}`,
      lines: convertedLines,
    };

    onSubmitForApproval(newBom, generatedFormulaId);
    showToast(`🚀 New BOM Version "${versionTag}" with Formula ID "${generatedFormulaId}" submitted to BOM Approval Grid!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0E7490] text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-cyan-300 border border-white/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                  Recipe &amp; Formulation Lab
                </span>
                <span className="text-slate-400 text-xs">&bull;</span>
                <span className="font-mono text-xs text-amber-300 font-bold">{generatedFormulaId}</span>
              </div>
              <h2 className="text-lg font-black tracking-tight text-white mt-0.5">
                Develop &amp; Create New BOM Version Recipe
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Cockpit */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Target Part (Locked to Machine Row SKU) */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Target Molded Part / SKU
              </label>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                Row Bound
              </span>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
              <div className="w-7 h-7 rounded-lg bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold text-xs shrink-0">
                <Package className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-mono font-black text-slate-900 text-xs truncate">{selectedParentCode}</div>
                <div className="text-[10px] text-slate-500 font-medium truncate" title={parentItem.name}>
                  {parentItem.name}
                </div>
              </div>
            </div>
          </div>

          {/* New BOM Version Tag */}
          <div className="bg-white p-3 rounded-2xl border border-cyan-200 shadow-2xs space-y-1.5">
            <label className="text-[10px] font-extrabold text-cyan-900 uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3 h-3 text-cyan-600" /> New Version Tag
            </label>
            <input
              type="text"
              value={versionTag}
              onChange={(e) => setVersionTag(e.target.value)}
              placeholder="e.g. v2.0 (20% Regrind Blend)"
              className="w-full px-2.5 py-1.5 rounded-xl border border-cyan-300 bg-cyan-50/30 font-bold text-cyan-950 text-xs focus:ring-1 focus:ring-cyan-500"
            />
            <div className="text-[10px] text-slate-500 flex items-center justify-between">
              <span>Formula ID:</span>
              <strong className="font-mono text-cyan-800 font-bold">{generatedFormulaId}</strong>
            </div>
          </div>

          {/* Pure RM Mass Live Metrics */}
          <div className="bg-white p-3 rounded-2xl border border-emerald-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1">
                <Scale className="w-3 h-3 text-emerald-600" /> Pure RM Mass
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                RM + RG + MB only
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-base font-black text-slate-900 font-mono">
                {(pureRmMetrics.pureRmMassPerUnitKg * 1000).toFixed(1)}{' '}
                <span className="text-[10px] text-slate-500 font-normal">Grams / PC</span>
              </span>
              <span className="text-xs font-mono font-bold text-emerald-700">
                ({pureRmMetrics.pureRmMassBatchKg.toFixed(1)} KG / 1k pcs)
              </span>
            </div>
            <div className="text-[10px] text-slate-500 flex items-center gap-2 pt-0.5">
              <span>Regrind: <strong className="text-purple-700">{pureRmMetrics.regrindPct.toFixed(1)}%</strong></span>
              <span>&bull;</span>
              <span>MB Dosage: <strong className="text-blue-700">{pureRmMetrics.masterbatchPct.toFixed(2)}%</strong></span>
            </div>
          </div>
        </div>

        {/* Recipe Formulation Lines Table */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Boxes className="w-4 h-4 text-cyan-600" />
                <span>Recipe Component Ingredients &amp; Ratios</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Define the pure polymer resin, masterbatch dosage, regrind percentage, and secondary items. Formula ID represents pure polymer RM mass.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddLine}
              className="px-3 py-1.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Component</span>
            </button>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs bg-white">
            <table className="w-full text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 select-none">
                <tr>
                  <th className="p-2.5 text-left">Category</th>
                  <th className="p-2.5 text-left">Material SKU &amp; Name</th>
                  <th className="p-2.5 text-right">Qty / PC</th>
                  <th className="p-2.5 text-center">UOM</th>
                  <th className="p-2.5 text-right">Scrap %</th>
                  <th className="p-2.5 text-right">Unit Cost (₹)</th>
                  <th className="p-2.5 text-right">Total RM Cost / PC</th>
                  <th className="p-2.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recipeLines.map((line) => {
                  const lineCost = line.qtyPerUnit * line.unitCostInr * (1 + line.scrapPct / 100);
                  const isPureRm = line.uom.toUpperCase() === 'KG' && ['Raw Polymer', 'Regrind', 'Masterbatch', 'Additive'].includes(line.materialType);

                  return (
                    <tr key={line.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Material Category */}
                      <td className="p-2.5">
                        <select
                          value={line.materialType}
                          onChange={(e) => handleUpdateLine(line.id, 'materialType', e.target.value)}
                          className="px-2 py-1 rounded-lg border border-slate-300 bg-white text-[11px] font-bold text-slate-800 focus:ring-1 focus:ring-cyan-500"
                        >
                          <option value="Raw Polymer">Raw Polymer (RM)</option>
                          <option value="Regrind">Regrind (RG)</option>
                          <option value="Masterbatch">Masterbatch (MB)</option>
                          <option value="Additive">Additive (AD)</option>
                          <option value="Packaging">+Packaging (PCK)</option>
                          <option value="Bought-Out">+Bought-Out (BOP)</option>
                          <option value="Consumable">+Consumable (CON)</option>
                        </select>
                      </td>

                      {/* Item SKU & Name */}
                      <td className="p-2.5 space-y-1">
                        <input
                          type="text"
                          value={line.itemCode}
                          onChange={(e) => handleUpdateLine(line.id, 'itemCode', e.target.value)}
                          placeholder="Item Code"
                          className="w-full px-2 py-1 rounded-lg border border-slate-300 font-mono font-bold text-[11px] text-slate-900 focus:ring-1 focus:ring-cyan-500"
                        />
                        <input
                          type="text"
                          value={line.itemName}
                          onChange={(e) => handleUpdateLine(line.id, 'itemName', e.target.value)}
                          placeholder="Description"
                          className="w-full px-2 py-0.5 rounded-lg border border-slate-200 text-[10px] text-slate-600 focus:ring-1 focus:ring-cyan-500"
                        />
                      </td>

                      {/* Qty Per Unit */}
                      <td className="p-2.5 text-right">
                        <input
                          type="number"
                          step="0.0001"
                          value={line.qtyPerUnit}
                          onChange={(e) => handleUpdateLine(line.id, 'qtyPerUnit', parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-1 rounded-lg border border-slate-300 text-right font-mono font-bold text-xs text-slate-900 focus:ring-1 focus:ring-cyan-500"
                        />
                      </td>

                      {/* UOM */}
                      <td className="p-2.5 text-center">
                        <select
                          value={line.uom}
                          onChange={(e) => handleUpdateLine(line.id, 'uom', e.target.value)}
                          className="px-2 py-1 rounded-lg border border-slate-300 bg-white font-mono text-[11px] font-bold text-slate-700"
                        >
                          <option value="KG">KG</option>
                          <option value="NOS">NOS</option>
                          <option value="ROLL">ROLL</option>
                          <option value="BOX">BOX</option>
                          <option value="SET">SET</option>
                        </select>
                      </td>

                      {/* Scrap % */}
                      <td className="p-2.5 text-right">
                        <input
                          type="number"
                          step="0.1"
                          value={line.scrapPct}
                          onChange={(e) => handleUpdateLine(line.id, 'scrapPct', parseFloat(e.target.value) || 0)}
                          className="w-16 px-2 py-1 rounded-lg border border-slate-300 text-right font-mono text-xs text-slate-700"
                        />
                      </td>

                      {/* Unit Cost */}
                      <td className="p-2.5 text-right">
                        <input
                          type="number"
                          step="0.5"
                          value={line.unitCostInr}
                          onChange={(e) => handleUpdateLine(line.id, 'unitCostInr', parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 rounded-lg border border-slate-300 text-right font-mono text-xs text-slate-700"
                        />
                      </td>

                      {/* Line Total Cost */}
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                        ₹{lineCost.toFixed(2)}
                        {isPureRm && (
                          <span className="block text-[9px] text-emerald-700 font-normal">RM Blend</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(line.id)}
                          className="p-1 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Formulation Notes */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Engineering Revision Rationale &amp; Approval Justification
            </label>
            <textarea
              rows={2}
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 focus:ring-1 focus:ring-cyan-500"
              placeholder="State reasons for this recipe revision (e.g. regrind blend test, alternative masterbatch shade match, cost reduction)..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-500">
              Total Pure RM Mass (1 PC):{' '}
              <strong className="text-emerald-700 font-mono font-bold">
                {(pureRmMetrics.pureRmMassPerUnitKg * 1000).toFixed(1)} g (
                {pureRmMetrics.pureRmMassPerUnitKg.toFixed(4)} kg)
              </strong>
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">
              Est. Material Cost / PC:{' '}
              <strong className="text-slate-900 font-mono font-bold">
                ₹{pureRmMetrics.totalMaterialCostPerUnit.toFixed(2)}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2 rounded-xl bg-[#0E7490] hover:bg-[#0c627a] text-white font-extrabold flex items-center gap-2 shadow-sm cursor-pointer transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Submit to BOM Version Approval Grid</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
