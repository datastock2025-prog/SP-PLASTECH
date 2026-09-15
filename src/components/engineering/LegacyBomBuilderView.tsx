import React, { useState, useMemo, useEffect } from 'react';
import {
  BomMaster,
  BomLine,
  ItemMaster,
  ApprovalStatus,
  BomRouting,
  AlternateMaterial,
  RegrindUsageSpec,
  MachineMoldRequirement,
  EngineeringChangeRequest,
  EngineeringChangeOrder,
  BomApprovalHistory,
} from '../../types';
import {
  ArrowLeft,
  Search,
  Plus,
  Trash2,
  Copy,
  Save,
  CheckCircle,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Layers,
  Sparkles,
  DollarSign,
  Download,
  Printer,
  Shield,
  ShieldCheck,
  Cpu,
  Package,
  Scale,
  ChevronDown,
  ChevronRight,
  Filter,
  RefreshCw,
  GitBranch,
  FileSpreadsheet,
  Check,
  X,
  ExternalLink,
  HelpCircle,
  ArrowUpRight,
  Sliders,
  Maximize2,
  Tag,
  Boxes,
  Lock,
  Unlock,
  Percent,
} from 'lucide-react';

interface LegacyBomBuilderViewProps {
  boms: BomMaster[];
  items: ItemMaster[];
  selectedId?: string;
  routings?: BomRouting[];
  alternates?: AlternateMaterial[];
  regrindSpecs?: RegrindUsageSpec[];
  machineReqs?: MachineMoldRequirement[];
  ecrs?: EngineeringChangeRequest[];
  ecos?: EngineeringChangeOrder[];
  onUpdateBom: (bom: BomMaster) => void;
  onCreateBom?: (bom: BomMaster) => void;
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
  onOpenWizard?: (parentItem: ItemMaster) => void;
}

type TabMode = 'costRollup' | 'validation' | 'processTooling' | 'approvals';

export const LegacyBomBuilderView: React.FC<LegacyBomBuilderViewProps> = ({
  boms,
  items,
  selectedId,
  routings = [],
  alternates = [],
  regrindSpecs = [],
  machineReqs = [],
  ecrs = [],
  ecos = [],
  onUpdateBom,
  onCreateBom,
  onNavigate,
  showToast,
  onOpenWizard,
}) => {
  // 1. Current Active BOM Selection
  const [activeBomId, setActiveBomId] = useState<string>(
    selectedId || boms[0]?.id || 'BOM-1001'
  );

  // Sync when selectedId prop changes externally
  useEffect(() => {
    if (selectedId) {
      setActiveBomId(selectedId);
    }
  }, [selectedId]);

  // Find base BOM
  const matchedBom = useMemo(() => {
    return boms.find((b) => b.id === activeBomId) || boms[0];
  }, [boms, activeBomId]);

  // Working state copy of the BOM (supports live edits, adding/removing lines, adjustments)
  const [currentBom, setCurrentBom] = useState<BomMaster>(matchedBom);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // When activeBomId changes, re-seed working state
  useEffect(() => {
    if (matchedBom) {
      setCurrentBom(JSON.parse(JSON.stringify(matchedBom)));
      setHasUnsavedChanges(false);
    }
  }, [matchedBom?.id]);

  // 2. Right Inspector Active Tab
  const [activeTab, setActiveTab] = useState<TabMode>('costRollup');

  // 3. Batch Scaling Multiplier
  const [batchMultiplier, setBatchMultiplier] = useState<number>(1); // 1 = per single unit
  const [displayUnit, setDisplayUnit] = useState<'kg' | 'g'>('kg');

  // 4. Catalog Search & Filter State
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [catalogCategory, setCatalogCategory] = useState<string>('all');
  const [catalogResinType, setCatalogResinType] = useState<string>('all');

  // 5. Grid Filter State
  const [gridFilter, setGridFilter] = useState<string>('all'); // all, critical, resin, mb, regrind, packaging

  // 6. Modals State
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState<boolean>(false);
  const [nextRevType, setNextRevType] = useState<'minor' | 'major'>('minor');
  const [revChangeReason, setRevChangeReason] = useState<string>('Formula & cycle time optimization');
  const [revEcoNumber, setRevEcoNumber] = useState<string>('ECO-2026-001');

  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState<boolean>(false);
  const [stageToApproveIndex, setStageToApproveIndex] = useState<number | null>(null);
  const [approvalComment, setApprovalComment] = useState<string>('IATF 16949 formulation & cost verified.');

  const [isAddCustomLineOpen, setIsAddCustomLineOpen] = useState<boolean>(false);
  const [customItemCode, setCustomItemCode] = useState<string>('');
  const [customItemName, setCustomItemName] = useState<string>('');
  const [customCategory, setCustomCategory] = useState<string>('Raw Material');
  const [customQty, setCustomQty] = useState<number>(0.05);
  const [customUom, setCustomUom] = useState<string>('KG');
  const [customCost, setCustomCost] = useState<number>(30);
  const [customPhase, setCustomPhase] = useState<BomLine['additionPhase']>('Main Hopper');

  // 7. Parent Finished Good item data from Item Master
  const parentItem = useMemo(() => {
    return items.find((i) => i.code === currentBom.parent) || null;
  }, [items, currentBom.parent]);

  /* =========================================================================
     LIVE COMPUTATIONS & FORMULATION CALCULATIONS (NO MOCK DATA)
  ========================================================================= */

  // Helper classification functions
  const isResinLine = (line: BomLine) => {
    const cat = (line.category || '').toLowerCase();
    const itm = (line.item || '').toLowerCase();
    return (
      (cat.includes('raw') || cat.includes('resin') || itm.startsWith('rm-')) &&
      !cat.includes('regrind') &&
      !itm.startsWith('rg-')
    );
  };

  const isRegrindLine = (line: BomLine) => {
    const cat = (line.category || '').toLowerCase();
    const itm = (line.item || '').toLowerCase();
    return cat.includes('regrind') || itm.startsWith('rg-') || (line.regrindPct !== undefined && line.regrindPct > 0);
  };

  const isMasterbatchLine = (line: BomLine) => {
    const cat = (line.category || '').toLowerCase();
    const itm = (line.item || '').toLowerCase();
    return cat.includes('masterbatch') || cat.includes('colorant') || itm.startsWith('mb-');
  };

  const isAdditiveLine = (line: BomLine) => {
    const cat = (line.category || '').toLowerCase();
    const itm = (line.item || '').toLowerCase();
    return cat.includes('additive') || itm.startsWith('ad-') || cat.includes('stabilizer');
  };

  const isPackagingLine = (line: BomLine) => {
    const cat = (line.category || '').toLowerCase();
    const itm = (line.item || '').toLowerCase();
    return cat.includes('pack') || itm.startsWith('pk-') || line.uom === 'PCS' || line.uom === 'BOX';
  };

  // Live Formula Mass & Fraction Breakdown
  const formulaBreakdown = useMemo(() => {
    let virginResinWeight = 0;
    let regrindWeight = 0;
    let masterbatchWeight = 0;
    let additiveWeight = 0;
    let packagingQty = 0;
    let otherWeight = 0;

    currentBom.lines.forEach((line) => {
      // Normalize weight in KG (if grams, convert)
      const qtyInKg = line.uom === 'G' ? line.qty / 1000 : line.qty;

      if (isRegrindLine(line)) {
        regrindWeight += qtyInKg;
      } else if (isMasterbatchLine(line)) {
        masterbatchWeight += qtyInKg;
      } else if (isAdditiveLine(line)) {
        additiveWeight += qtyInKg;
      } else if (isPackagingLine(line)) {
        packagingQty += line.qty;
      } else if (isResinLine(line)) {
        virginResinWeight += qtyInKg;
      } else {
        otherWeight += qtyInKg;
      }
    });

    const totalPolymerWeight = virginResinWeight + regrindWeight + masterbatchWeight + additiveWeight + otherWeight;

    const virginPct = totalPolymerWeight > 0 ? (virginResinWeight / totalPolymerWeight) * 100 : 0;
    const regrindPct = totalPolymerWeight > 0 ? (regrindWeight / totalPolymerWeight) * 100 : 0;
    const mbPct = totalPolymerWeight > 0 ? (masterbatchWeight / totalPolymerWeight) * 100 : 0;
    const additivePct = totalPolymerWeight > 0 ? (additiveWeight / totalPolymerWeight) * 100 : 0;
    const otherPct = totalPolymerWeight > 0 ? (otherWeight / totalPolymerWeight) * 100 : 0;
    const totalPct = virginPct + regrindPct + mbPct + additivePct + otherPct;

    // Nominal Shot Weight / Unit Weight in Grams
    const nominalWeightGrams = totalPolymerWeight * 1000;

    return {
      virginResinWeight,
      regrindWeight,
      masterbatchWeight,
      additiveWeight,
      packagingQty,
      otherWeight,
      totalPolymerWeight,
      virginPct,
      regrindPct,
      mbPct,
      additivePct,
      otherPct,
      totalPct,
      nominalWeightGrams,
    };
  }, [currentBom.lines]);

  // Live Unit Cost Rollup Engine (Derived from real lines, master prices, cycle times, machine tonnage)
  const costRollupEngine = useMemo(() => {
    let virginResinCost = 0;
    let regrindGrossCost = 0;
    let masterbatchCost = 0;
    let additiveCost = 0;
    let packagingCost = 0;
    let otherMaterialCost = 0;

    // Calculate line by line extended costs
    currentBom.lines.forEach((line) => {
      // Find item master cost fallback
      const matchedItem = items.find((i) => i.code === line.item);
      const unitRate = line.cost > 0 ? line.cost : (matchedItem?.cost || matchedItem?.standardCost || 25.0);
      const scrapFactor = 1 + (line.scrap || 0) / 100;
      const extCost = line.qty * scrapFactor * unitRate;

      if (isRegrindLine(line)) {
        regrindGrossCost += extCost;
      } else if (isMasterbatchLine(line)) {
        masterbatchCost += extCost;
      } else if (isAdditiveLine(line)) {
        additiveCost += extCost;
      } else if (isPackagingLine(line)) {
        packagingCost += extCost;
      } else if (isResinLine(line)) {
        virginResinCost += extCost;
      } else {
        otherMaterialCost += extCost;
      }
    });

    // In injection molding, regrind is internal runner/sprue reground in-house.
    // Regrind Credit = Savings of regrind vs virgin polymer baseline
    const avgVirginPricePerKg =
      formulaBreakdown.virginResinWeight > 0
        ? virginResinCost / formulaBreakdown.virginResinWeight
        : 85.0; // fallback ₹/kg
    const avgRegrindPricePerKg =
      formulaBreakdown.regrindWeight > 0
        ? regrindGrossCost / formulaBreakdown.regrindWeight
        : 22.0;

    // Savings = (virgin price - regrind price) * regrind weight
    const regrindSavingsCredit =
      formulaBreakdown.regrindWeight > 0
        ? Math.max(0, (avgVirginPricePerKg - avgRegrindPricePerKg) * formulaBreakdown.regrindWeight)
        : 0;

    const totalRawMaterialCost = virginResinCost + regrindGrossCost + masterbatchCost + additiveCost + otherMaterialCost;
    const netMaterialCost = totalRawMaterialCost + packagingCost;

    // Live Labor, Machine, Mold Amortization, Utilities
    const cycleTimeSec = currentBom.cycleTimeSec || 14.5;
    const cavities = Math.max(currentBom.cavities || 4, 1);
    
    // Direct Labor: ₹240/hr operator rate / (parts produced per hour)
    const partsPerHour = (3600 / cycleTimeSec) * cavities;
    const directLaborCost = currentBom.laborCost !== undefined && currentBom.laborCost > 0
      ? currentBom.laborCost
      : parseFloat((240 / partsPerHour).toFixed(2));

    // Machine Overhead: ₹550/hr for 250T injection molding press
    const machineOverheadCost = currentBom.machineOverhead !== undefined && currentBom.machineOverhead > 0
      ? currentBom.machineOverhead
      : parseFloat((550 / partsPerHour).toFixed(2));

    // Mold Amortization: ₹350,000 mold tool cost over 300,000 shots / cavities
    const moldAmortizationCost = currentBom.moldAmortization !== undefined && currentBom.moldAmortization > 0
      ? currentBom.moldAmortization
      : parseFloat((350000 / (300000 * cavities)).toFixed(2));

    // Energy / Chiller / Auxiliary Utilities
    const energyCost = currentBom.energyCost !== undefined && currentBom.energyCost > 0
      ? currentBom.energyCost
      : 1.80;

    // Secondary Operations (trimming, printing, insert fitting)
    const secondaryOpsCost = (currentBom.secondaryOperations || []).reduce((acc, op) => {
      return acc + (op.standardTimeMin ? (op.standardTimeMin / 60) * 180 : 0.85);
    }, 0);

    const totalStandardCost =
      netMaterialCost +
      directLaborCost +
      machineOverheadCost +
      moldAmortizationCost +
      energyCost +
      secondaryOpsCost;

    return {
      virginResinCost,
      regrindGrossCost,
      regrindSavingsCredit,
      masterbatchCost,
      additiveCost,
      packagingCost,
      otherMaterialCost,
      totalRawMaterialCost,
      netMaterialCost,
      directLaborCost,
      machineOverheadCost,
      moldAmortizationCost,
      energyCost,
      secondaryOpsCost,
      totalStandardCost,
      partsPerHour,
    };
  }, [currentBom, items, formulaBreakdown]);

  // Live IATF 16949 / ISO 9001 Validation Rules Audit
  const validationAudit = useMemo(() => {
    const checks: Array<{
      id: string;
      title: string;
      description: string;
      passed: boolean;
      severity: 'success' | 'warning' | 'error';
      details: string;
    }> = [];

    // 1. Mass Balance Check
    const balanceDiff = Math.abs(formulaBreakdown.totalPct - 100);
    const isBalanced = balanceDiff <= 0.5;
    checks.push({
      id: 'mass-balance',
      title: 'Formula 100% Mass Balance',
      description: 'Sum of virgin resin, regrind, masterbatch, and additives equals 100.0%.',
      passed: isBalanced,
      severity: isBalanced ? 'success' : 'error',
      details: `Current formula sum: ${formulaBreakdown.totalPct.toFixed(2)}% (Delta: ${balanceDiff.toFixed(2)}%)`,
    });

    // 2. Regrind Tolerance Compliance (15% Max for food packaging/IATF)
    const isRegrindWithinLimit = formulaBreakdown.regrindPct <= 15.0;
    checks.push({
      id: 'regrind-limit',
      title: 'Internal Regrind Compliance (≤15% Max Ceiling)',
      description: 'Clean internal runner regrind must stay within regulatory/customer ceiling for food-contact items.',
      passed: isRegrindWithinLimit,
      severity: isRegrindWithinLimit ? 'success' : 'warning',
      details: `Regrind fraction is ${formulaBreakdown.regrindPct.toFixed(1)}% (Allowable limit: 15.0%)`,
    });

    // 3. Masterbatch Letdown Ratio (LDR) Check
    const isLdrReasonable = formulaBreakdown.mbPct >= 0.5 && formulaBreakdown.mbPct <= 5.0;
    checks.push({
      id: 'mb-ldr',
      title: 'Masterbatch Letdown Ratio (0.5% - 5.0% LDR)',
      description: 'Colorant dosage verified against pigment dispersion and opacity limits.',
      passed: isLdrReasonable,
      severity: isLdrReasonable ? 'success' : 'warning',
      details: `Active MB dosage: ${formulaBreakdown.mbPct.toFixed(2)}% LDR`,
    });

    // 4. Machine & Tooling Assignment
    const hasMoldAndMachine = Boolean(currentBom.moldId && currentBom.machineGroup);
    checks.push({
      id: 'tooling-assigned',
      title: 'Injection Mold & Machine Cell Linkage',
      description: 'Production cell assignment verified for tool dimensions, clamp force, and shot volume.',
      passed: hasMoldAndMachine,
      severity: hasMoldAndMachine ? 'success' : 'warning',
      details: `Mold: ${currentBom.moldId || 'Unassigned'} | Machine: ${currentBom.machineGroup || 'Unassigned'}`,
    });

    // 5. Critical Material Substitutes
    const criticalLines = currentBom.lines.filter((l) => l.isCritical);
    const criticalWithoutSubstitutes = criticalLines.filter((l) => !l.substituteItem && !l.substituteGroup);
    const hasSubstitutes = criticalWithoutSubstitutes.length === 0;
    checks.push({
      id: 'critical-substitutes',
      title: 'Critical Materials Alternate Qualification',
      description: 'Critical polymer resins must have pre-qualified substitute groups to safeguard against supply disruptions.',
      passed: hasSubstitutes,
      severity: hasSubstitutes ? 'success' : 'warning',
      details: hasSubstitutes
        ? `All ${criticalLines.length} critical components have qualified alternates.`
        : `${criticalWithoutSubstitutes.length} critical component(s) lack a pre-approved substitute group.`,
    });

    // 6. Live Stock Availability for Target Batch
    const batchSize = (currentBom.batchSize || 1000) * batchMultiplier;
    const stockShortages: string[] = [];
    currentBom.lines.forEach((line) => {
      const itm = items.find((i) => i.code === line.item);
      if (itm) {
        const requiredQty = line.qty * batchSize;
        const availableStockNum = parseFloat((itm.avail || itm.stock || '0').replace(/[^0-9.]/g, '')) || 0;
        if (availableStockNum < requiredQty) {
          stockShortages.push(`${line.item} (Needs: ${requiredQty.toFixed(1)} ${line.uom}, Avail: ${itm.avail})`);
        }
      }
    });

    checks.push({
      id: 'stock-availability',
      title: `Warehouse Stock Verification (${batchSize.toLocaleString()} Unit Batch)`,
      description: 'Raw material and masterbatch availability checked against live warehouse inventory.',
      passed: stockShortages.length === 0,
      severity: stockShortages.length === 0 ? 'success' : 'warning',
      details:
        stockShortages.length === 0
          ? `Sufficient raw material on hand for ${batchSize.toLocaleString()} units.`
          : `Inventory warning on: ${stockShortages.join(', ')}`,
    });

    const passedCount = checks.filter((c) => c.passed).length;
    const allPassed = passedCount === checks.length;

    return {
      checks,
      passedCount,
      totalCount: checks.length,
      allPassed,
    };
  }, [currentBom, items, formulaBreakdown, batchMultiplier]);

  /* =========================================================================
     INTERACTIVE LINE ACTIONS & DATA HANDLERS
  ========================================================================= */

  // Update a single line field
  const handleUpdateLine = (index: number, field: keyof BomLine, value: any) => {
    const updatedLines = [...currentBom.lines];
    const targetLine = { ...updatedLines[index], [field]: value };

    // Auto update extended cost if qty, scrap, or cost changed
    if (field === 'qty' || field === 'scrap' || field === 'cost') {
      const q = field === 'qty' ? parseFloat(value) || 0 : targetLine.qty;
      const s = field === 'scrap' ? parseFloat(value) || 0 : targetLine.scrap;
      const c = field === 'cost' ? parseFloat(value) || 0 : targetLine.cost;
      targetLine.extendedCost = parseFloat((q * (1 + s / 100) * c).toFixed(2));
    }

    updatedLines[index] = targetLine;
    setCurrentBom({ ...currentBom, lines: updatedLines });
    setHasUnsavedChanges(true);
  };

  // Remove line
  const handleRemoveLine = (index: number) => {
    const target = currentBom.lines[index];
    const updated = currentBom.lines.filter((_, i) => i !== index);
    setCurrentBom({ ...currentBom, lines: updated });
    setHasUnsavedChanges(true);
    showToast(`Removed component ${target.item} from BOM`);
  };

  // Duplicate line
  const handleDuplicateLine = (index: number) => {
    const lineToCopy = currentBom.lines[index];
    const newLine: BomLine = {
      ...lineToCopy,
      id: `L-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sequence: (currentBom.lines.length + 1) * 10,
    };
    const updated = [...currentBom.lines, newLine];
    setCurrentBom({ ...currentBom, lines: updated });
    setHasUnsavedChanges(true);
    showToast(`Duplicated ${lineToCopy.item}`);
  };

  // Add Item from Component Catalog
  const handleAddFromCatalog = (item: ItemMaster) => {
    // Check if already in BOM
    const alreadyExists = currentBom.lines.some((l) => l.item === item.code);
    if (alreadyExists) {
      showToast(`${item.code} is already in the BOM. Consider adjusting quantity.`);
      return;
    }

    // Default addition phase based on item type
    let defaultPhase: BomLine['additionPhase'] = 'Main Hopper';
    if (item.type.toLowerCase().includes('masterbatch') || item.code.startsWith('MB-')) {
      defaultPhase = 'Side Feeder';
    } else if (item.type.toLowerCase().includes('additive') || item.code.startsWith('AD-')) {
      defaultPhase = 'Liquid Dosing';
    } else if (item.type.toLowerCase().includes('regrind') || item.code.startsWith('RG-')) {
      defaultPhase = 'Pre-mix';
    }

    // Determine default quantity based on category
    let defaultQty = 0.04;
    if (item.type.toLowerCase().includes('masterbatch')) defaultQty = 0.0012;
    else if (item.type.toLowerCase().includes('additive')) defaultQty = 0.0004;
    else if (item.type.toLowerCase().includes('regrind')) defaultQty = 0.006;
    else if (item.type.toLowerCase().includes('packaging')) defaultQty = 0.005;

    const unitPrice = item.cost || item.standardCost || 25.0;

    const newLine: BomLine = {
      id: `L-${Date.now()}`,
      sequence: (currentBom.lines.length + 1) * 10,
      level: 1,
      item: item.code,
      name: item.name,
      category: item.type,
      qty: defaultQty,
      uom: item.baseUOM || 'KG',
      scrap: item.type.toLowerCase().includes('packaging') ? 0.5 : 1.5,
      yield: item.type.toLowerCase().includes('packaging') ? 99.5 : 98.5,
      cost: unitPrice,
      extendedCost: parseFloat((defaultQty * 1.015 * unitPrice).toFixed(2)),
      additionPhase: defaultPhase,
      isCritical: item.type.toLowerCase().includes('raw material') || item.type.toLowerCase().includes('masterbatch'),
      backflush: true,
      issueMethod: 'Auto Backflush',
      status: 'active',
    };

    setCurrentBom({
      ...currentBom,
      lines: [...currentBom.lines, newLine],
    });
    setHasUnsavedChanges(true);
    showToast(`Added ${item.code} (${item.name}) to BOM`);
  };

  // Add Custom Unlisted Item
  const handleAddCustomLine = () => {
    if (!customItemCode.trim() || !customItemName.trim()) {
      showToast('Please provide both Item Code and Name.');
      return;
    }

    const newLine: BomLine = {
      id: `L-${Date.now()}`,
      sequence: (currentBom.lines.length + 1) * 10,
      level: 1,
      item: customItemCode.trim().toUpperCase(),
      name: customItemName.trim(),
      category: customCategory,
      qty: customQty,
      uom: customUom,
      scrap: 1.0,
      yield: 99.0,
      cost: customCost,
      extendedCost: parseFloat((customQty * 1.01 * customCost).toFixed(2)),
      additionPhase: customPhase,
      isCritical: false,
      backflush: true,
      issueMethod: 'Auto Backflush',
      status: 'active',
    };

    setCurrentBom({
      ...currentBom,
      lines: [...currentBom.lines, newLine],
    });
    setHasUnsavedChanges(true);
    setIsAddCustomLineOpen(false);
    setCustomItemCode('');
    setCustomItemName('');
    showToast(`Added custom material ${newLine.item} to BOM`);
  };

  // Save changes back to root application state
  const handleSaveChanges = () => {
    const updatedBom: BomMaster = {
      ...currentBom,
      standardCost: costRollupEngine.totalStandardCost,
      materialCost: costRollupEngine.netMaterialCost,
      laborCost: costRollupEngine.directLaborCost,
      machineOverhead: costRollupEngine.machineOverheadCost,
      moldAmortization: costRollupEngine.moldAmortizationCost,
      energyCost: costRollupEngine.energyCost,
      updated: new Date().toISOString().slice(0, 10),
      lastCostRollupDate: new Date().toISOString().slice(0, 10),
    };

    onUpdateBom(updatedBom);
    setCurrentBom(updatedBom);
    setHasUnsavedChanges(false);
    showToast(`Successfully saved ${updatedBom.id} (${updatedBom.version}) with live standard cost ₹${updatedBom.standardCost.toFixed(2)}/unit`);
  };

  // Execute Live Cost Rollup and Commit
  const handleRunCostRollup = () => {
    const updatedBom: BomMaster = {
      ...currentBom,
      standardCost: costRollupEngine.totalStandardCost,
      materialCost: costRollupEngine.netMaterialCost,
      laborCost: costRollupEngine.directLaborCost,
      machineOverhead: costRollupEngine.machineOverheadCost,
      moldAmortization: costRollupEngine.moldAmortizationCost,
      energyCost: costRollupEngine.energyCost,
      lastCostRollupDate: new Date().toISOString().slice(0, 10),
      updated: new Date().toISOString().slice(0, 10),
    };

    onUpdateBom(updatedBom);
    setCurrentBom(updatedBom);
    setHasUnsavedChanges(false);
    showToast(`Live Standard Cost Rollup completed: ₹${costRollupEngine.totalStandardCost.toFixed(2)}/unit (Material: ₹${costRollupEngine.netMaterialCost.toFixed(2)}, Conversion: ₹${(costRollupEngine.directLaborCost + costRollupEngine.machineOverheadCost + costRollupEngine.moldAmortizationCost + costRollupEngine.energyCost).toFixed(2)})`);
  };

  // Bump BOM Revision Modal confirm
  const handleConfirmBumpRevision = () => {
    const currentVerNum = parseFloat(currentBom.version.replace(/[^0-9.]/g, '')) || 1.0;
    let nextVersion = '';
    let nextRev = '';

    if (nextRevType === 'major') {
      nextVersion = `v${Math.floor(currentVerNum + 1)}.0`;
      const currentRevChar = (currentBom.revision || 'Rev A').replace(/[^A-Z]/g, '');
      const nextChar = String.fromCharCode((currentRevChar.charCodeAt(0) || 65) + 1);
      nextRev = `Rev ${nextChar}`;
    } else {
      nextVersion = `v${(currentVerNum + 0.1).toFixed(1)}`;
      nextRev = currentBom.revision || 'Rev B';
    }

    const newApprovalHistory: BomApprovalHistory = {
      stage: 'Engineering Revision Bump',
      approver: 'Lead Engineer',
      role: 'Product Engineering',
      status: 'Approved',
      comments: `${revChangeReason} [Ref: ${revEcoNumber}]`,
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
      signature: `SIG-${Date.now().toString().slice(-4)}`,
    };

    const updatedBom: BomMaster = {
      ...currentBom,
      version: nextVersion,
      revision: nextRev,
      status: 'under_review',
      approvalStage: 'Engineering Review',
      updated: new Date().toISOString().slice(0, 10),
      approvals: [newApprovalHistory, ...(currentBom.approvals || [])],
    };

    onUpdateBom(updatedBom);
    setCurrentBom(updatedBom);
    setIsRevisionModalOpen(false);
    showToast(`BOM Revision bumped to ${nextVersion} (${nextRev}) under change order ${revEcoNumber}.`);
  };

  // Stage-gate approval confirm
  const handleConfirmApproveStage = () => {
    if (stageToApproveIndex === null) return;
    const updatedApprovals = [...(currentBom.approvals || [])];
    if (updatedApprovals[stageToApproveIndex]) {
      updatedApprovals[stageToApproveIndex] = {
        ...updatedApprovals[stageToApproveIndex],
        status: 'Approved',
        comments: approvalComment,
        timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
        signature: `SIG-APP-${Date.now().toString().slice(-4)}`,
      };
    }

    // Check if all approvals are complete
    const allApproved = updatedApprovals.every((a) => a.status === 'Approved');
    const newStatus: ApprovalStatus = allApproved ? 'released' : 'under_review';
    const newApprovalStage = allApproved ? 'Released' : currentBom.approvalStage;

    const updatedBom: BomMaster = {
      ...currentBom,
      status: newStatus,
      approvalStage: newApprovalStage,
      approvals: updatedApprovals,
      updated: new Date().toISOString().slice(0, 10),
    };

    onUpdateBom(updatedBom);
    setCurrentBom(updatedBom);
    setIsApprovalModalOpen(false);
    setStageToApproveIndex(null);
    showToast(`Stage approval recorded. Status updated to ${(newStatus || '').toUpperCase()}`);
  };

  // Export formulation sheet to CSV
  const handleExportCsv = () => {
    const headers = [
      'Seq',
      'Item Code',
      'Item Description',
      'Category',
      'Addition Phase',
      'Unit Qty (KG/UOM)',
      'Batch Qty',
      'UOM',
      'Scrap %',
      'Yield %',
      'Unit Cost (INR)',
      'Extended Cost (INR)',
      'Formula %',
    ];

    const currentBatchSize = (currentBom.batchSize || 1000) * batchMultiplier;

    const rows = currentBom.lines.map((line) => {
      const matchedItem = items.find((i) => i.code === line.item);
      const unitRate = line.cost > 0 ? line.cost : (matchedItem?.cost || 25.0);
      const extCost = line.qty * (1 + (line.scrap || 0) / 100) * unitRate;
      const batchQty = line.qty * currentBatchSize;
      const formulaPct =
        formulaBreakdown.totalPolymerWeight > 0
          ? ((line.qty / formulaBreakdown.totalPolymerWeight) * 100).toFixed(2)
          : '0.00';

      return [
        line.sequence,
        line.item,
        `"${line.name}"`,
        line.category || '-',
        line.additionPhase || 'Main Hopper',
        line.qty,
        batchQty,
        line.uom,
        line.scrap,
        100 - (line.scrap || 0),
        unitRate,
        extCost.toFixed(2),
        `${formulaPct}%`,
      ];
    });

    const summarySection = [
      [],
      ['--- FORMULATION COST SUMMARY ---'],
      ['Total Nominal Part Weight (g)', formulaBreakdown.nominalWeightGrams.toFixed(2)],
      ['Virgin Polymer Fraction', `${formulaBreakdown.virginPct.toFixed(2)}%`],
      ['Internal Regrind Fraction', `${formulaBreakdown.regrindPct.toFixed(2)}%`],
      ['Masterbatch Colorant LDR', `${formulaBreakdown.mbPct.toFixed(2)}%`],
      ['Additive Dosage', `${formulaBreakdown.additivePct.toFixed(2)}%`],
      ['Net Material Cost (INR/pc)', `Rs. ${costRollupEngine.netMaterialCost.toFixed(2)}`],
      ['Direct Labor Cost (INR/pc)', `Rs. ${costRollupEngine.directLaborCost.toFixed(2)}`],
      ['Machine Overhead (INR/pc)', `Rs. ${costRollupEngine.machineOverheadCost.toFixed(2)}`],
      ['Mold Amortization (INR/pc)', `Rs. ${costRollupEngine.moldAmortizationCost.toFixed(2)}`],
      ['Total Standard BOM Cost (INR/pc)', `Rs. ${costRollupEngine.totalStandardCost.toFixed(2)}`],
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        headers.join(','),
        ...rows.map((e) => e.join(',')),
        ...summarySection.map((e) => e.join(',')),
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${currentBom.id}_${currentBom.version}_Formulation_Specification.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported formulation specification for ${currentBom.id}`);
  };

  // Filtered Catalog Items
  const filteredCatalogItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        catalogSearch === '' ||
        item.code.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        item.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        (item.resinType && item.resinType.toLowerCase().includes(catalogSearch.toLowerCase())) ||
        (item.cat && item.cat.toLowerCase().includes(catalogSearch.toLowerCase()));

      const matchesCategory =
        catalogCategory === 'all' ||
        item.type.toLowerCase().includes(catalogCategory.toLowerCase()) ||
        (catalogCategory === 'regrind' && (item.code.startsWith('RG-') || item.type.toLowerCase().includes('regrind'))) ||
        (catalogCategory === 'masterbatch' && (item.code.startsWith('MB-') || item.type.toLowerCase().includes('masterbatch'))) ||
        (catalogCategory === 'additive' && (item.code.startsWith('AD-') || item.type.toLowerCase().includes('additive'))) ||
        (catalogCategory === 'raw' && (item.code.startsWith('RM-') || item.type.toLowerCase().includes('raw')));

      const matchesResin =
        catalogResinType === 'all' ||
        (item.cat && item.cat.toLowerCase().includes(catalogResinType.toLowerCase())) ||
        (item.resinType && item.resinType.toLowerCase().includes(catalogResinType.toLowerCase()));

      return matchesSearch && matchesCategory && matchesResin;
    });
  }, [items, catalogSearch, catalogCategory, catalogResinType]);

  // Filtered Grid Lines
  const filteredGridLines = useMemo(() => {
    return currentBom.lines.filter((line) => {
      if (gridFilter === 'all') return true;
      if (gridFilter === 'critical') return Boolean(line.isCritical);
      if (gridFilter === 'resin') return isResinLine(line);
      if (gridFilter === 'regrind') return isRegrindLine(line);
      if (gridFilter === 'mb') return isMasterbatchLine(line);
      if (gridFilter === 'packaging') return isPackagingLine(line);
      return true;
    });
  }, [currentBom.lines, gridFilter]);

  return (
    <div className="space-y-4" id="legacy-bom-builder-workspace">
      {/* 1. Senior Executive Header Command Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E4E0D6] shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Navigation, Title & BOM Selector */}
          <div className="flex items-start sm:items-center gap-3">
            <button
              onClick={() => onNavigate('bomList')}
              className="p-2 text-[#6B7280] hover:text-[#14213D] hover:bg-gray-100 rounded-xl border border-[#E4E0D6] transition-colors"
              title="Return to BOM Registry"
              id="btn-back-to-bom-list"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#E8622C] font-bold bg-orange-50 px-2 py-0.5 rounded border border-orange-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#E8622C]" /> IATF 16949 / ISO 9001
                </span>

                {/* Real BOM Switcher Dropdown */}
                <div className="relative inline-block">
                  <select
                    value={activeBomId}
                    onChange={(e) => setActiveBomId(e.target.value)}
                    className="font-mono text-xs font-bold bg-[#F6F4EF] text-[#0F8B8D] border border-[#E4E0D6] rounded-lg px-2.5 py-1 pr-6 cursor-pointer focus:outline-hidden hover:border-[#0F8B8D] transition-colors"
                    id="select-active-bom-switcher"
                  >
                    {boms.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.id} &mdash; {b.version} ({b.parentName || b.parent})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Version & Revision Tag */}
                <button
                  onClick={() => setIsRevisionModalOpen(true)}
                  className="font-mono text-[11px] font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors"
                  title="Bump Revision / Version Control"
                  id="btn-bump-revision-open"
                >
                  <GitBranch className="w-3 h-3 text-[#E8622C]" />
                  <span>{currentBom.version} ({currentBom.revision || 'Rev A'})</span>
                </button>

                {/* Status Pill */}
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    currentBom.status === 'released'
                      ? 'bg-blue-100 text-blue-800'
                      : currentBom.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : currentBom.status === 'under_review'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {currentBom.status}
                </span>

                {hasUnsavedChanges && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1 animate-pulse">
                    <AlertCircle className="w-3 h-3" /> Unsaved Changes
                  </span>
                )}
              </div>

              {/* Finished Good Information */}
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <h1 className="text-base font-bold text-[#14213D]">
                  {currentBom.parentName}
                </h1>
                <span className="font-mono text-xs text-gray-500 font-semibold">({currentBom.parent})</span>
                <span className="text-gray-300">&bull;</span>
                <span className="text-xs text-gray-600 font-medium">
                  Process: <b className="text-[#0F8B8D]">{currentBom.processType || 'Injection Molding'}</b>
                </span>
                <span className="text-gray-300">&bull;</span>
                <span className="text-xs text-gray-600 font-medium">
                  Tool: <b className="font-mono text-[#14213D]">{currentBom.moldId || 'MOLD-INJ-084'}</b> ({currentBom.cavities || 4} Cavities)
                </span>
                <span className="text-gray-300">&bull;</span>
                <span className="text-xs text-gray-600 font-medium">
                  Cycle: <b className="font-mono text-[#14213D]">{currentBom.cycleTimeSec || 14.5}s</b>
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Command Suite */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* 9-Step Wizard Option */}
            <button
              onClick={() => {
                if (onOpenWizard && parentItem) {
                  onOpenWizard(parentItem);
                } else {
                  showToast('Launching 9-Step Manufacturing Wizard...');
                }
              }}
              className="btn btn-sm btn-ghost border border-[#E4E0D6] text-xs py-1.5 flex items-center gap-1.5 shadow-2xs hover:border-[#0F8B8D] text-gray-700"
              title="Launch Guided 9-Step Setup"
              id="btn-launch-mfg-wizard"
            >
              <Layers className="w-3.5 h-3.5 text-[#0F8B8D]" />
              <span className="hidden sm:inline">9-Step Wizard</span>
            </button>

            {/* Run Cost Rollup (Live Engine) */}
            <button
              onClick={handleRunCostRollup}
              className="btn btn-sm btn-ghost border border-[#E4E0D6] text-xs py-1.5 flex items-center gap-1.5 shadow-2xs hover:border-[#E8622C] text-gray-700"
              title="Recalculate Standard Costs across direct materials, labor, machine rates & regrind"
              id="btn-run-cost-rollup"
            >
              <DollarSign className="w-3.5 h-3.5 text-[#E8622C]" />
              <span>Cost Rollup</span>
            </button>

            {/* Export Formulation CSV */}
            <button
              onClick={handleExportCsv}
              className="btn btn-sm btn-ghost border border-[#E4E0D6] text-xs py-1.5 flex items-center gap-1.5 shadow-2xs hover:bg-gray-50 text-gray-700"
              title="Export BOM formulation to CSV"
              id="btn-export-bom-csv"
            >
              <Download className="w-3.5 h-3.5 text-gray-600" />
              <span className="hidden md:inline">Export</span>
            </button>

            {/* Save Changes */}
            <button
              onClick={handleSaveChanges}
              className={`btn btn-sm text-xs py-1.5 flex items-center gap-1.5 shadow-xs font-semibold ${
                hasUnsavedChanges
                  ? 'btn-primary ring-2 ring-[#E8622C]/40 animate-pulse'
                  : 'btn-primary'
              }`}
              id="btn-save-bom-changes"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Formulation</span>
            </button>
          </div>
        </div>

        {/* Dynamic Polymer Formulation Status Banner */}
        <div className="pt-2 border-t border-[#F3F4F6] flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Segmented formulation bar */}
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="font-semibold text-gray-600 flex items-center gap-1.5">
                <Percent className="w-3 h-3 text-[#0F8B8D]" /> Polymer Formulation Mix Balance:
              </span>
              <span className={`font-bold ${validationAudit.checks[0]?.passed ? 'text-emerald-700' : 'text-rose-600'}`}>
                {formulaBreakdown.totalPct.toFixed(1)}% Total ({validationAudit.checks[0]?.passed ? '100% Normalized' : 'Unbalanced'})
              </span>
            </div>

            {/* Color-coded proportional visual bar */}
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
              <div
                style={{ width: `${Math.min(formulaBreakdown.virginPct, 100)}%` }}
                className="bg-[#14213D] h-full transition-all"
                title={`Virgin Resin: ${formulaBreakdown.virginPct.toFixed(1)}%`}
              />
              <div
                style={{ width: `${Math.min(formulaBreakdown.regrindPct, 100)}%` }}
                className="bg-[#0F8B8D] h-full transition-all"
                title={`Regrind: ${formulaBreakdown.regrindPct.toFixed(1)}%`}
              />
              <div
                style={{ width: `${Math.min(formulaBreakdown.mbPct, 100)}%` }}
                className="bg-[#E8622C] h-full transition-all"
                title={`Masterbatch: ${formulaBreakdown.mbPct.toFixed(1)}%`}
              />
              <div
                style={{ width: `${Math.min(formulaBreakdown.additivePct, 100)}%` }}
                className="bg-purple-600 h-full transition-all"
                title={`Additives: ${formulaBreakdown.additivePct.toFixed(1)}%`}
              />
            </div>
          </div>

          {/* Quick Metrics Legend */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-gray-600">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#14213D] inline-block" />
              <span>Virgin Resin: <b className="text-[#14213D]">{formulaBreakdown.virginPct.toFixed(1)}%</b></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0F8B8D] inline-block" />
              <span>Regrind: <b className="text-[#0F8B8D]">{formulaBreakdown.regrindPct.toFixed(1)}%</b></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E8622C] inline-block" />
              <span>MB Color: <b className="text-[#E8622C]">{formulaBreakdown.mbPct.toFixed(1)}%</b></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
              <span>Additives: <b className="text-purple-700">{formulaBreakdown.additivePct.toFixed(1)}%</b></span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Executive Dynamic Metrics Ribbon (LIVE DATA) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Nominal Part Weight */}
        <div className="p-3 bg-white border border-[#E4E0D6] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Nominal Shot Wt</span>
            <Scale className="w-3.5 h-3.5 text-[#0F8B8D]" />
          </div>
          <div className="text-lg font-bold font-mono text-[#14213D]">
            {formulaBreakdown.nominalWeightGrams.toFixed(2)} g
          </div>
          <div className="text-[10px] text-gray-400">
            {(formulaBreakdown.totalPolymerWeight).toFixed(4)} kg / piece
          </div>
        </div>

        {/* Virgin Resin Base */}
        <div className="p-3 bg-white border border-[#E4E0D6] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Virgin Resin Base</span>
            <Boxes className="w-3.5 h-3.5 text-[#14213D]" />
          </div>
          <div className="text-lg font-bold font-mono text-[#14213D]">
            {formulaBreakdown.virginPct.toFixed(1)}%
          </div>
          <div className="text-[10px] text-gray-400">
            {(formulaBreakdown.virginResinWeight * 1000).toFixed(1)} g nominal
          </div>
        </div>

        {/* Regrind Fraction */}
        <div className="p-3 bg-white border border-[#E4E0D6] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Regrind Fraction</span>
            <RefreshCw className={`w-3.5 h-3.5 ${formulaBreakdown.regrindPct <= 15.0 ? 'text-emerald-600' : 'text-amber-500'}`} />
          </div>
          <div className={`text-lg font-bold font-mono ${formulaBreakdown.regrindPct <= 15.0 ? 'text-emerald-700' : 'text-amber-600'}`}>
            {formulaBreakdown.regrindPct.toFixed(1)}%
          </div>
          <div className="text-[10px] text-gray-400">
            Limit: ≤15% {formulaBreakdown.regrindPct <= 15.0 ? '✓' : '⚠️'}
          </div>
        </div>

        {/* Masterbatch & Additive LDR */}
        <div className="p-3 bg-white border border-[#E4E0D6] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>MB &amp; Additives</span>
            <Sparkles className="w-3.5 h-3.5 text-[#E8622C]" />
          </div>
          <div className="text-lg font-bold font-mono text-[#E8622C]">
            {(formulaBreakdown.mbPct + formulaBreakdown.additivePct).toFixed(2)}%
          </div>
          <div className="text-[10px] text-gray-400">
            LDR Color + Chemical
          </div>
        </div>

        {/* Direct Material Cost */}
        <div className="p-3 bg-white border border-[#E4E0D6] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Direct Material</span>
            <DollarSign className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-lg font-bold font-mono text-blue-700">
            ₹{costRollupEngine.netMaterialCost.toFixed(2)}
          </div>
          <div className="text-[10px] text-gray-400">
            With scrap allowances
          </div>
        </div>

        {/* Total Standard Unit Cost */}
        <div className="p-3 bg-white border border-[#E4E0D6] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>Standard BOM Cost</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-lg font-bold font-mono text-emerald-700">
            ₹{costRollupEngine.totalStandardCost.toFixed(2)}
          </div>
          <div className="text-[10px] text-gray-400">
            Full conversion rollup
          </div>
        </div>
      </div>

      {/* 3. Main 3-Panel Senior Workstation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* =========================================================================
            LEFT PANEL: Smart Material & Component Catalog (3.5 cols)
        ========================================================================= */}
        <div className="lg:col-span-3 bg-white p-3.5 rounded-2xl border border-[#E4E0D6] shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-xs text-[#14213D] flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-[#0F8B8D]" /> Material Catalog
              </h2>
              <p className="text-[10.5px] text-[#6B7280]">Live warehouse inventory</p>
            </div>
            <button
              onClick={() => setIsAddCustomLineOpen(true)}
              className="text-[10px] font-bold text-[#E8622C] hover:underline flex items-center gap-1"
              title="Add an unlisted compound or custom item"
              id="btn-open-custom-item-modal"
            >
              <Plus className="w-3 h-3" /> Custom
            </button>
          </div>

          {/* Live Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search code, polymer, grade..."
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-[#F6F4EF] border border-[#E4E0D6] rounded-xl focus:outline-hidden focus:ring-1 focus:ring-[#0F8B8D]"
              id="input-catalog-search"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1 text-[10px]">
            {[
              { id: 'all', label: 'All' },
              { id: 'raw', label: 'Resins' },
              { id: 'masterbatch', label: 'MB / Color' },
              { id: 'additive', label: 'Additives' },
              { id: 'regrind', label: 'Regrind' },
              { id: 'packaging', label: 'Packaging' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCatalogCategory(cat.id)}
                className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                  catalogCategory === cat.id
                    ? 'bg-[#14213D] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Scrollable Live Items List */}
          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {filteredCatalogItems.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-400 space-y-1">
                <AlertCircle className="w-5 h-5 mx-auto text-gray-300" />
                <p>No catalog items match filter.</p>
              </div>
            ) : (
              filteredCatalogItems.map((item) => {
                const isAlreadyInBom = currentBom.lines.some((l) => l.item === item.code);
                const itemCost = item.cost || item.standardCost || 25.0;

                return (
                  <div
                    key={item.code}
                    className={`p-2.5 rounded-xl border text-xs transition-all ${
                      isAlreadyInBom
                        ? 'bg-slate-50 border-slate-200 opacity-80'
                        : 'bg-white border-[#E4E0D6] hover:border-[#0F8B8D] hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <span className="font-mono text-[11px] font-bold text-[#0F8B8D]">
                          {item.code}
                        </span>
                        <h4 className="font-semibold text-gray-800 text-[11px] leading-snug line-clamp-1">
                          {item.name}
                        </h4>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-gray-100 text-gray-600 shrink-0">
                        {item.type}
                      </span>
                    </div>

                    {/* Stock, Location, Cost */}
                    <div className="mt-2 pt-1.5 border-t border-[#F3F4F6] flex items-center justify-between text-[10px] text-gray-500 font-mono">
                      <span>Stock: <b className="text-gray-700">{item.stock || item.avail || '0 KG'}</b></span>
                      <span>Rate: <b className="text-[#14213D]">₹{itemCost.toFixed(1)}/{item.baseUOM || 'KG'}</b></span>
                    </div>

                    {/* Action button */}
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] text-gray-400 font-sans">
                        {item.wh || 'RM-WH-01'}
                      </span>
                      <button
                        onClick={() => handleAddFromCatalog(item)}
                        disabled={isAlreadyInBom}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors ${
                          isAlreadyInBom
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-[#0F8B8D] hover:bg-[#0d787a] text-white'
                        }`}
                        id={`btn-add-item-${item.code}`}
                      >
                        {isAlreadyInBom ? (
                          <>
                            <Check className="w-3 h-3" /> In BOM
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" /> Add to BOM
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* =========================================================================
            CENTER PANEL: Formulation Grid & Line Item Workstation (5.5 cols)
        ========================================================================= */}
        <div className="lg:col-span-6 bg-white p-4 rounded-2xl border border-[#E4E0D6] shadow-2xs space-y-4">
          {/* Grid Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E4E0D6]">
            <div>
              <h3 className="font-bold text-sm text-[#14213D] flex items-center gap-2">
                <span>Formulation Lines</span>
                <span className="font-mono text-xs px-2 py-0.2 bg-gray-100 rounded text-gray-700">
                  {currentBom.lines.length} Components
                </span>
              </h3>
              <p className="text-[11px] text-[#6B7280]">
                Configure addition phase, quantity per unit, runner scrap % and unit valuation.
              </p>
            </div>

            {/* Batch Multiplier / Scaling Controller */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono">
                Scale:
              </span>
              <select
                value={batchMultiplier}
                onChange={(e) => setBatchMultiplier(parseFloat(e.target.value) || 1)}
                className="text-xs font-mono font-semibold bg-[#F6F4EF] border border-[#E4E0D6] rounded-lg px-2 py-1 text-[#14213D] focus:outline-hidden"
                id="select-batch-multiplier"
              >
                <option value={1}>1 Pc (Unit BOM)</option>
                <option value={100}>100 Pcs Pilot Lot</option>
                <option value={1000}>1,000 Pcs Production Batch</option>
                <option value={5000}>5,000 Pcs Full Run</option>
              </select>
            </div>
          </div>

          {/* Grid Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 text-[10px]">
              {[
                { id: 'all', label: 'All Lines' },
                { id: 'critical', label: 'Critical Only' },
                { id: 'resin', label: 'Resins' },
                { id: 'regrind', label: 'Regrind' },
                { id: 'mb', label: 'Colorants' },
                { id: 'packaging', label: 'Packaging' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setGridFilter(f.id)}
                  className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                    gridFilter === f.id
                      ? 'bg-[#14213D] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsAddCustomLineOpen(true)}
              className="text-[11px] font-semibold text-[#0F8B8D] hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Blank Row
            </button>
          </div>

          {/* Formulation Grid Table */}
          <div className="overflow-x-auto border border-[#E4E0D6] rounded-xl shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#F6F4EF] border-b border-[#E4E0D6] text-[#4B5563] font-bold text-[11px]">
                  <th className="p-2.5 w-10">Seq</th>
                  <th className="p-2.5">Component / Description</th>
                  <th className="p-2.5">Addition Phase</th>
                  <th className="p-2.5">
                    Qty / Unit {batchMultiplier > 1 && `(${batchMultiplier.toLocaleString()}x)`}
                  </th>
                  <th className="p-2.5">Formula %</th>
                  <th className="p-2.5">Scrap %</th>
                  <th className="p-2.5 text-right">Ext Cost (₹)</th>
                  <th className="p-2.5 w-12 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E0D6]">
                {filteredGridLines.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-xs text-gray-400">
                      No components match the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredGridLines.map((line, idx) => {
                    const originalIndex = currentBom.lines.findIndex((l) => l.id === line.id || l.item === line.item);
                    const matchedItem = items.find((i) => i.code === line.item);
                    const unitRate = line.cost > 0 ? line.cost : (matchedItem?.cost || 25.0);
                    const scaledQty = line.qty * batchMultiplier;

                    // Calculate live percentage of total polymer weight
                    const formulaPct =
                      formulaBreakdown.totalPolymerWeight > 0 && !isPackagingLine(line)
                        ? (line.qty / formulaBreakdown.totalPolymerWeight) * 100
                        : 0;

                    return (
                      <tr key={line.id || idx} className="hover:bg-[#F9F8F5] transition-colors">
                        {/* Seq */}
                        <td className="p-2.5 font-mono text-gray-500 text-[11px]">
                          <input
                            type="number"
                            value={line.sequence || (idx + 1) * 10}
                            onChange={(e) => handleUpdateLine(originalIndex, 'sequence', parseInt(e.target.value) || 10)}
                            className="w-10 px-1 py-0.5 bg-transparent border border-transparent hover:border-gray-300 focus:border-[#0F8B8D] rounded text-center font-mono text-xs focus:outline-hidden"
                          />
                        </td>

                        {/* Component Details */}
                        <td className="p-2.5 min-w-[170px]">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-xs text-[#0F8B8D]">
                              {line.item}
                            </span>
                            {line.isCritical && (
                              <span
                                className="text-[9px] px-1 py-0.2 rounded font-bold bg-amber-100 text-amber-800"
                                title="Critical Material - Requires approved substitute"
                              >
                                Critical
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-700 truncate max-w-[210px]" title={line.name}>
                            {line.name}
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            ₹{unitRate.toFixed(2)} / {line.uom} &bull; {line.category || 'Raw Material'}
                          </div>
                        </td>

                        {/* Addition Phase */}
                        <td className="p-2.5">
                          <select
                            value={line.additionPhase || 'Main Hopper'}
                            onChange={(e) => handleUpdateLine(originalIndex, 'additionPhase', e.target.value)}
                            className="text-[10.5px] border border-[#E4E0D6] rounded-lg px-2 py-1 bg-white text-gray-700 focus:outline-hidden focus:ring-1 focus:ring-[#0F8B8D]"
                          >
                            <option value="Main Hopper">Main Hopper</option>
                            <option value="Side Feeder">Side Feeder</option>
                            <option value="Liquid Dosing">Liquid Dosing</option>
                            <option value="Pre-mix">Pre-mix</option>
                            <option value="Post-mix">Post-mix</option>
                            <option value="Rework Addition">Rework Addition</option>
                          </select>
                        </td>

                        {/* Quantity / Unit */}
                        <td className="p-2.5">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.0001"
                              value={scaledQty}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                const unscaled = batchMultiplier > 1 ? val / batchMultiplier : val;
                                handleUpdateLine(originalIndex, 'qty', unscaled);
                              }}
                              className="w-20 px-2 py-1 border border-[#E4E0D6] rounded-lg font-mono text-xs text-[#14213D] font-bold focus:outline-hidden focus:ring-1 focus:ring-[#0F8B8D]"
                            />
                            <span className="text-[10px] text-gray-500 font-mono font-bold">
                              {line.uom}
                            </span>
                          </div>
                          {line.uom === 'KG' && (
                            <div className="text-[10px] text-gray-400 font-mono">
                              {(scaledQty * 1000).toFixed(1)} g
                            </div>
                          )}
                        </td>

                        {/* Formula % */}
                        <td className="p-2.5 font-mono text-xs">
                          {!isPackagingLine(line) ? (
                            <span
                              className={`font-bold ${
                                isRegrindLine(line)
                                  ? 'text-[#0F8B8D]'
                                  : isMasterbatchLine(line)
                                  ? 'text-[#E8622C]'
                                  : 'text-[#14213D]'
                              }`}
                            >
                              {formulaPct.toFixed(2)}%
                            </span>
                          ) : (
                            <span className="text-gray-400 text-[10px] font-sans">Packaging</span>
                          )}
                        </td>

                        {/* Scrap % */}
                        <td className="p-2.5 font-mono">
                          <div className="flex items-center gap-0.5">
                            <input
                              type="number"
                              step="0.1"
                              value={line.scrap ?? 1.0}
                              onChange={(e) => handleUpdateLine(originalIndex, 'scrap', parseFloat(e.target.value) || 0)}
                              className="w-12 px-1.5 py-1 border border-[#E4E0D6] rounded-lg font-mono text-xs text-center focus:outline-hidden"
                            />
                            <span className="text-[10px] text-gray-500">%</span>
                          </div>
                        </td>

                        {/* Ext Cost (₹) */}
                        <td className="p-2.5 text-right font-mono font-bold text-xs text-[#14213D]">
                          ₹{(line.qty * (1 + (line.scrap || 0) / 100) * unitRate * batchMultiplier).toFixed(2)}
                        </td>

                        {/* Row Actions */}
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleDuplicateLine(originalIndex)}
                              className="p-1 text-gray-400 hover:text-[#0F8B8D] rounded hover:bg-gray-100"
                              title="Duplicate Line"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleRemoveLine(originalIndex)}
                              className="p-1 text-gray-400 hover:text-rose-600 rounded hover:bg-rose-50"
                              title="Delete Component"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Real Live Formula Summary Footer Bar */}
          <div className="p-3 bg-[#FAF9F5] rounded-xl border border-[#E4E0D6] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <div className="font-bold text-[#14213D]">
                Total Batch Shot Weight: <span className="font-mono text-[#0F8B8D]">{(formulaBreakdown.totalPolymerWeight * batchMultiplier).toFixed(3)} KG</span>
              </div>
              <div className="text-[11px] text-gray-500 font-mono">
                Virgin Base: {(formulaBreakdown.virginResinWeight * batchMultiplier).toFixed(3)} KG &bull; Regrind: {(formulaBreakdown.regrindWeight * batchMultiplier).toFixed(3)} KG &bull; MB: {(formulaBreakdown.masterbatchWeight * batchMultiplier).toFixed(3)} KG
              </div>
            </div>

            <div className="text-right font-mono">
              <div className="text-[11px] text-gray-500">Total Material Cost:</div>
              <div className="text-sm font-bold text-[#14213D]">
                ₹{(costRollupEngine.netMaterialCost * batchMultiplier).toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            RIGHT PANEL: Real-Time Cost Rollup, IATF Audit & Tooling (3 cols)
        ========================================================================= */}
        <div className="lg:col-span-3 bg-white p-4 rounded-2xl border border-[#E4E0D6] shadow-2xs space-y-4">
          {/* Segmented Tab Bar */}
          <div className="flex border-b border-[#E4E0D6] text-xs font-semibold">
            {[
              { id: 'costRollup', label: 'Cost Rollup' },
              { id: 'validation', label: 'IATF Audit' },
              { id: 'processTooling', label: 'Cell & Tool' },
              { id: 'approvals', label: 'Approvals' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabMode)}
                className={`pb-2 px-2 transition-colors border-b-2 text-[11px] ${
                  activeTab === tab.id
                    ? 'border-[#0F8B8D] text-[#0F8B8D] font-bold'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 1. Cost Rollup Tab (Completely Derived & Live) */}
          {activeTab === 'costRollup' && (
            <div className="space-y-3 text-xs" id="tab-cost-rollup-pane">
              <div className="flex items-center justify-between pb-2 border-b border-[#F3F4F6]">
                <span className="font-bold text-[#14213D]">Standard Unit Cost:</span>
                <span className="text-base font-bold font-mono text-emerald-700">
                  ₹{costRollupEngine.totalStandardCost.toFixed(2)}
                </span>
              </div>

              {/* Breakdown Table */}
              <div className="divide-y divide-[#F3F4F6] text-[11px] font-mono">
                <div className="py-1.5 flex justify-between">
                  <span className="text-gray-600 font-sans">Virgin Resin:</span>
                  <span className="font-bold text-[#14213D]">₹{costRollupEngine.virginResinCost.toFixed(2)}</span>
                </div>

                <div className="py-1.5 flex justify-between">
                  <span className="text-gray-600 font-sans">Masterbatch &amp; Additives:</span>
                  <span className="font-bold text-[#14213D]">
                    ₹{(costRollupEngine.masterbatchCost + costRollupEngine.additiveCost).toFixed(2)}
                  </span>
                </div>

                <div className="py-1.5 flex justify-between text-[#0F8B8D]">
                  <span className="font-sans">Regrind Runner Stock:</span>
                  <span className="font-bold">₹{costRollupEngine.regrindGrossCost.toFixed(2)}</span>
                </div>

                {costRollupEngine.regrindSavingsCredit > 0 && (
                  <div className="py-1.5 flex justify-between text-emerald-700 bg-emerald-50 px-1.5 rounded">
                    <span className="font-sans">Regrind Net Credit:</span>
                    <span className="font-bold">-₹{costRollupEngine.regrindSavingsCredit.toFixed(2)}</span>
                  </div>
                )}

                <div className="py-1.5 flex justify-between">
                  <span className="text-gray-600 font-sans">Packaging &amp; Boxing:</span>
                  <span className="font-bold text-[#14213D]">₹{costRollupEngine.packagingCost.toFixed(2)}</span>
                </div>

                <div className="py-1.5 flex justify-between bg-slate-50 px-1.5 rounded font-bold text-slate-800">
                  <span className="font-sans">Total Direct Material:</span>
                  <span>₹{costRollupEngine.netMaterialCost.toFixed(2)}</span>
                </div>

                <div className="py-1.5 flex justify-between pt-2">
                  <span className="text-gray-600 font-sans">Direct Labor (IMM Tech):</span>
                  <span className="font-bold text-[#14213D]">₹{costRollupEngine.directLaborCost.toFixed(2)}</span>
                </div>

                <div className="py-1.5 flex justify-between">
                  <span className="text-gray-600 font-sans">Machine Overhead (250T):</span>
                  <span className="font-bold text-[#14213D]">₹{costRollupEngine.machineOverheadCost.toFixed(2)}</span>
                </div>

                <div className="py-1.5 flex justify-between">
                  <span className="text-gray-600 font-sans">Mold Amortization ({currentBom.cavities || 4}-Cav):</span>
                  <span className="font-bold text-[#14213D]">₹{costRollupEngine.moldAmortizationCost.toFixed(2)}</span>
                </div>

                <div className="py-1.5 flex justify-between">
                  <span className="text-gray-600 font-sans">Auxiliary Energy &amp; Chiller:</span>
                  <span className="font-bold text-[#14213D]">₹{costRollupEngine.energyCost.toFixed(2)}</span>
                </div>

                {costRollupEngine.secondaryOpsCost > 0 && (
                  <div className="py-1.5 flex justify-between">
                    <span className="text-gray-600 font-sans">Secondary Ops:</span>
                    <span className="font-bold text-[#14213D]">₹{costRollupEngine.secondaryOpsCost.toFixed(2)}</span>
                  </div>
                )}

                <div className="py-2.5 flex justify-between text-xs font-bold text-[#14213D] border-t-2 border-[#14213D]">
                  <span className="font-sans">Standard Cost / Unit:</span>
                  <span className="text-emerald-700">₹{costRollupEngine.totalStandardCost.toFixed(2)}</span>
                </div>
              </div>

              {/* Commit Rollup Button */}
              <button
                onClick={handleRunCostRollup}
                className="w-full btn btn-sm btn-ghost border border-[#E4E0D6] text-xs py-2 flex items-center justify-center gap-1.5 text-gray-700 hover:bg-[#FAF9F5]"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#0F8B8D]" />
                <span>Save Standard Cost to BOM</span>
              </button>
            </div>
          )}

          {/* 2. IATF 16949 / ISO 9001 Validation Tab (Completely Real) */}
          {activeTab === 'validation' && (
            <div className="space-y-3 text-xs" id="tab-validation-pane">
              <div className="flex items-center justify-between pb-2 border-b border-[#F3F4F6]">
                <span className="font-bold text-[#14213D]">Formulation Health:</span>
                <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded-full ${
                  validationAudit.allPassed
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {validationAudit.passedCount} / {validationAudit.totalCount} Passed
                </span>
              </div>

              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {validationAudit.checks.map((check) => (
                  <div
                    key={check.id}
                    className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                      check.passed
                        ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                        : 'bg-amber-50/50 border-amber-200 text-amber-900'
                    }`}
                  >
                    <div className="flex items-start gap-1.5 font-bold">
                      {check.passed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      )}
                      <span>{check.title}</span>
                    </div>
                    <p className="text-[10.5px] text-gray-600 leading-snug">{check.description}</p>
                    <div className="text-[10px] font-mono font-semibold pt-1 border-t border-gray-200/50">
                      {check.details}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Process & Tooling Cell Tab */}
          {activeTab === 'processTooling' && (
            <div className="space-y-3 text-xs" id="tab-tooling-pane">
              <span className="font-bold text-[11px] uppercase tracking-wider text-[#0F8B8D] block">
                Assigned Tooling &amp; Mold Parameters
              </span>

              <div className="p-3 bg-[#FAF9F5] rounded-xl border border-[#E4E0D6] space-y-2 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-gray-500 font-sans">Mold ID:</span>
                  <b className="text-[#14213D]">{currentBom.moldId || 'MOLD-INJ-084'}</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-sans">Tool Cavitation:</span>
                  <b className="text-[#14213D]">{currentBom.cavities || 4} Cavities</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-sans">Machine Group:</span>
                  <b className="text-[#0F8B8D]">{currentBom.machineGroup || 'IMM 250T - Line 1'}</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-sans">Cycle Time:</span>
                  <b className="text-[#14213D]">{currentBom.cycleTimeSec || 14.5} sec</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-sans">Production Rate:</span>
                  <b className="text-emerald-700">{costRollupEngine.partsPerHour.toFixed(0)} pcs / hr</b>
                </div>
              </div>

              {/* Linked Engineering Routings */}
              <div className="space-y-1.5 pt-2">
                <span className="font-bold text-[11px] uppercase tracking-wider text-[#14213D] block">
                  Linked Routing Operations
                </span>
                <div className="space-y-1 text-[11px]">
                  <div className="p-2 bg-white rounded-lg border border-[#E4E0D6] flex justify-between items-center">
                    <div>
                      <div className="font-bold text-gray-800">10 &bull; Material Blending</div>
                      <div className="text-[10px] text-gray-500 font-mono">Hopper Dryer &bull; 0.20 min</div>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 bg-teal-50 text-teal-800 rounded">Pre-Op</span>
                  </div>

                  <div className="p-2 bg-white rounded-lg border border-[#E4E0D6] flex justify-between items-center">
                    <div>
                      <div className="font-bold text-gray-800">20 &bull; Injection Molding</div>
                      <div className="text-[10px] text-gray-500 font-mono">IMM 250T &bull; {currentBom.cycleTimeSec || 14.5}s</div>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 bg-blue-50 text-blue-800 rounded">Primary</span>
                  </div>

                  <div className="p-2 bg-white rounded-lg border border-[#E4E0D6] flex justify-between items-center">
                    <div>
                      <div className="font-bold text-gray-800">30 &bull; Degating &amp; Regrind</div>
                      <div className="text-[10px] text-gray-500 font-mono">Granulator &bull; 0.15 min</div>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 bg-orange-50 text-orange-800 rounded">Closed-Loop</span>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('routingList', { selectedId: currentBom.parent })}
                  className="w-full mt-2 text-center text-xs font-semibold text-[#0F8B8D] hover:underline flex items-center justify-center gap-1"
                >
                  Inspect Full Routing <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* 4. Approvals & Stage-Gate Tab */}
          {activeTab === 'approvals' && (
            <div className="space-y-3 text-xs" id="tab-approvals-pane">
              <div className="flex items-center justify-between pb-2 border-b border-[#F3F4F6]">
                <span className="font-bold text-[#14213D]">Stage-Gate Signoffs:</span>
                <span className="text-[10px] font-mono text-gray-500">IATF 16949 Audit Log</span>
              </div>

              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {(currentBom.approvals || []).length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-400">
                    No approval workflow initiated.
                  </div>
                ) : (
                  currentBom.approvals?.map((app, idx) => {
                    const isApproved = app.status === 'Approved';
                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                          isApproved
                            ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                            : 'bg-amber-50/50 border-amber-200 text-amber-950'
                        }`}
                      >
                        <div className="flex justify-between items-center font-bold">
                          <span>{app.stage}</span>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full ${
                              isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {app.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-600">
                          {app.approver} &bull; <span className="font-medium">{app.role}</span>
                        </div>
                        {app.comments && (
                          <div className="text-[10px] text-gray-500 italic">"{app.comments}"</div>
                        )}
                        <div className="text-[9px] text-gray-400 font-mono pt-1 flex justify-between">
                          <span>{app.timestamp}</span>
                          <span>{app.signature || 'Digital Sign'}</span>
                        </div>

                        {!isApproved && (
                          <button
                            onClick={() => {
                              setStageToApproveIndex(idx);
                              setIsApprovalModalOpen(true);
                            }}
                            className="mt-1 w-full py-1 text-[10px] font-bold bg-[#0F8B8D] text-white rounded-lg hover:bg-[#0d787a] flex items-center justify-center gap-1"
                          >
                            <Check className="w-3 h-3" /> Sign &amp; Approve Stage
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          MODAL: Bump BOM Revision & Version Control
      ========================================================================= */}
      {isRevisionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-[#E4E0D6] shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E4E0D6]">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-[#E8622C]" />
                <h3 className="font-bold text-sm text-[#14213D]">Bump BOM Revision</h3>
              </div>
              <button
                onClick={() => setIsRevisionModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Create an official engineering revision for <b>{currentBom.id}</b> under IATF 16949 version control.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Revision Increment Type:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNextRevType('minor')}
                    className={`p-2.5 rounded-xl border text-left font-semibold ${
                      nextRevType === 'minor'
                        ? 'border-[#0F8B8D] bg-teal-50 text-[#0F8B8D]'
                        : 'border-[#E4E0D6] bg-white text-gray-700'
                    }`}
                  >
                    <div className="font-bold">Minor Revision</div>
                    <div className="text-[10px] font-normal text-gray-500">e.g., v2.1 &rarr; v2.2 (Cycle time / MB tweak)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNextRevType('major')}
                    className={`p-2.5 rounded-xl border text-left font-semibold ${
                      nextRevType === 'major'
                        ? 'border-[#0F8B8D] bg-teal-50 text-[#0F8B8D]'
                        : 'border-[#E4E0D6] bg-white text-gray-700'
                    }`}
                  >
                    <div className="font-bold">Major Revision</div>
                    <div className="text-[10px] font-normal text-gray-500">e.g., v2.1 &rarr; v3.0, Rev B &rarr; Rev C</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Associated Engineering Change Order (ECO):
                </label>
                <input
                  type="text"
                  value={revEcoNumber}
                  onChange={(e) => setRevEcoNumber(e.target.value)}
                  placeholder="e.g. ECO-2026-001"
                  className="w-full p-2 border border-[#E4E0D6] rounded-xl font-mono text-xs focus:outline-hidden focus:ring-1 focus:ring-[#0F8B8D]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Technical Justification / Change Notes:
                </label>
                <textarea
                  rows={2}
                  value={revChangeReason}
                  onChange={(e) => setRevChangeReason(e.target.value)}
                  placeholder="Reason for revision bump..."
                  className="w-full p-2 border border-[#E4E0D6] rounded-xl text-xs focus:outline-hidden focus:ring-1 focus:ring-[#0F8B8D]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E4E0D6]">
              <button
                type="button"
                onClick={() => setIsRevisionModalOpen(false)}
                className="btn btn-sm btn-ghost text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBumpRevision}
                className="btn btn-sm btn-primary text-xs flex items-center gap-1"
                id="btn-confirm-bump-revision"
              >
                <Check className="w-3.5 h-3.5" /> Confirm Revision Bump
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: Stage-Gate Signoff Approval
      ========================================================================= */}
      {isApprovalModalOpen && stageToApproveIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-[#E4E0D6] shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E4E0D6]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0F8B8D]" />
                <h3 className="font-bold text-sm text-[#14213D]">
                  Approve Stage: {currentBom.approvals?.[stageToApproveIndex]?.stage}
                </h3>
              </div>
              <button
                onClick={() => setIsApprovalModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Engineering Review &amp; Compliance Comments:
                </label>
                <textarea
                  rows={3}
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  className="w-full p-2 border border-[#E4E0D6] rounded-xl text-xs focus:outline-hidden focus:ring-1 focus:ring-[#0F8B8D]"
                />
              </div>

              <div className="p-3 bg-[#FAF9F5] rounded-xl border border-[#E4E0D6] text-[11px] text-gray-600 space-y-1">
                <div>Digital Signoff Timestamp: <b>{new Date().toLocaleString()}</b></div>
                <div>IATF 16949 Traceability ID: <b className="font-mono">SIG-BOM-{currentBom.id}</b></div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E4E0D6]">
              <button
                type="button"
                onClick={() => setIsApprovalModalOpen(false)}
                className="btn btn-sm btn-ghost text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApproveStage}
                className="btn btn-sm btn-primary text-xs flex items-center gap-1"
                id="btn-confirm-approve-stage"
              >
                <Check className="w-3.5 h-3.5" /> Sign &amp; Commit Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: Add Custom / Unlisted Material
      ========================================================================= */}
      {isAddCustomLineOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-[#E4E0D6] shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E4E0D6]">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#0F8B8D]" />
                <h3 className="font-bold text-sm text-[#14213D]">Add Custom Material</h3>
              </div>
              <button
                onClick={() => setIsAddCustomLineOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Item Code:</label>
                  <input
                    type="text"
                    value={customItemCode}
                    onChange={(e) => setCustomItemCode(e.target.value)}
                    placeholder="e.g. RM-CUSTOM-01"
                    className="w-full p-2 border border-[#E4E0D6] rounded-xl font-mono text-xs focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Category:</label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full p-2 border border-[#E4E0D6] rounded-xl text-xs focus:outline-hidden bg-white"
                  >
                    <option value="Raw Material">Raw Material (Polymer)</option>
                    <option value="Masterbatch">Masterbatch / Colorant</option>
                    <option value="Additive">Additive / Chemical</option>
                    <option value="Regrind">Regrind / Reprocessed</option>
                    <option value="Packaging">Packaging</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Item Name / Description:</label>
                <input
                  type="text"
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  placeholder="e.g. Nucleating Agent Masterbatch"
                  className="w-full p-2 border border-[#E4E0D6] rounded-xl text-xs focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Qty / Unit:</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={customQty}
                    onChange={(e) => setCustomQty(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-[#E4E0D6] rounded-xl font-mono text-xs focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Base UOM:</label>
                  <select
                    value={customUom}
                    onChange={(e) => setCustomUom(e.target.value)}
                    className="w-full p-2 border border-[#E4E0D6] rounded-xl text-xs focus:outline-hidden bg-white font-mono"
                  >
                    <option value="KG">KG</option>
                    <option value="G">G</option>
                    <option value="PCS">PCS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Rate (₹):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={customCost}
                    onChange={(e) => setCustomCost(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-[#E4E0D6] rounded-xl font-mono text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Addition Phase:</label>
                <select
                  value={customPhase}
                  onChange={(e) => setCustomPhase(e.target.value as any)}
                  className="w-full p-2 border border-[#E4E0D6] rounded-xl text-xs focus:outline-hidden bg-white"
                >
                  <option value="Main Hopper">Main Hopper</option>
                  <option value="Side Feeder">Side Feeder</option>
                  <option value="Liquid Dosing">Liquid Dosing</option>
                  <option value="Pre-mix">Pre-mix</option>
                  <option value="Post-mix">Post-mix</option>
                  <option value="Rework Addition">Rework Addition</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E4E0D6]">
              <button
                type="button"
                onClick={() => setIsAddCustomLineOpen(false)}
                className="btn btn-sm btn-ghost text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCustomLine}
                className="btn btn-sm btn-primary text-xs flex items-center gap-1"
                id="btn-confirm-add-custom-material"
              >
                <Plus className="w-3.5 h-3.5" /> Add Component
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
