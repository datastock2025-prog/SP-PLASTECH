import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Save,
  UploadCloud,
  FileText,
  Plus,
  Trash2,
  HelpCircle,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Layers,
  Box,
  Wrench,
  Droplet,
  RefreshCw,
  FlaskConical,
  Package,
  Fuel,
  Palette,
  Sparkles,
  GitPullRequest,
  Lock,
  Building,
  Image as ImageIcon,
} from 'lucide-react';
import { ItemMaster, ItemType, ApprovalStatus, ItemStatus } from '../../types';

interface ConversionRow {
  id: string;
  from: string;
  to: string;
  factor: number;
}

interface CreateItemWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveItem: (item: ItemMaster) => void;
  editItem?: ItemMaster | null;
  showToast: (msg: string) => void;
}

export const CreateItemWizardModal: React.FC<CreateItemWizardProps> = ({
  isOpen,
  onClose,
  onSaveItem,
  editItem = null,
  showToast,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<string>('12:04');

  // Step 1: Item Type
  const [selectedType, setSelectedType] = useState<ItemType>(editItem?.type || 'Finished Good');

  // Step 2: Basic Information
  const [autoGenerateCode, setAutoGenerateCode] = useState<boolean>(!editItem);
  const [itemCode, setItemCode] = useState<string>(editItem?.code || '');
  const [itemName, setItemName] = useState<string>(editItem?.name || '');
  const [category, setCategory] = useState<string>(editItem?.cat || '');
  const [itemGroup, setItemGroup] = useState<string>('');
  const [status, setStatus] = useState<string>(editItem?.approval === 'approved' ? 'Active' : 'Active');
  const [description, setDescription] = useState<string>(editItem?.desc || '');
  const [itemImage, setItemImage] = useState<string | null>(null);

  // Finished Good Technical & Injection Molding Parameters
  const [cycleTime, setCycleTime] = useState<number | string>(
    editItem?.cycleTime ?? editItem?.standardCycleTime ?? ''
  );
  const [partWeight, setPartWeight] = useState<number | string>(
    editItem?.partWeightGrams ?? editItem?.netWeightGrams ?? ''
  );
  const [cavityCount, setCavityCount] = useState<number | string>(
    editItem?.cavityCount ?? 1
  );
  const [runnerWeight, setRunnerWeight] = useState<number | string>(
    editItem?.runnerWeightGrams ?? 0
  );

  // Computed Shot Weight Formula: Part Weight + Runner Weight = Single Shot Weight
  const numPartWeight = Number(partWeight) || 0;
  const numRunnerWeight = Number(runnerWeight) || 0;
  const numCavities = Number(cavityCount) || 1;
  const calculatedSingleShotWeight = Number((numPartWeight + numRunnerWeight).toFixed(2));
  const calculatedTotalShotWeight = Number(((numPartWeight * numCavities) + numRunnerWeight).toFixed(2));

  // Step 3: Units & Conversions
  const [baseUOM, setBaseUOM] = useState<string>(editItem?.baseUOM || (selectedType === 'Raw Material' ? 'KG' : 'PCS'));
  const [purchaseUOM, setPurchaseUOM] = useState<string>(editItem?.baseUOM || (selectedType === 'Raw Material' ? 'KG' : 'PCS'));
  const [salesUOM, setSalesUOM] = useState<string>(editItem?.baseUOM || (selectedType === 'Raw Material' ? 'KG' : 'PCS'));
  const [stockUOM, setStockUOM] = useState<string>(editItem?.baseUOM || (selectedType === 'Raw Material' ? 'KG' : 'PCS'));
  const [productionUOM, setProductionUOM] = useState<string>(editItem?.baseUOM || (selectedType === 'Raw Material' ? 'KG' : 'PCS'));
  const [conversions, setConversions] = useState<ConversionRow[]>([]);

  // Step 4: Manufacturing Attributes
  const [resinType, setResinType] = useState<string>(editItem?.resinType || '');
  const [polymerGrade, setPolymerGrade] = useState<string>('');
  const [color, setColor] = useState<string>('');
  const [mfi, setMfi] = useState<string>(editItem?.mfi || '');
  const [density, setDensity] = useState<string>(editItem?.density || '');
  const [additivePercentage, setAdditivePercentage] = useState<string>('');
  const [masterbatchDosage, setMasterbatchDosage] = useState<string>('');
  const [regrindAllowance, setRegrindAllowance] = useState<string>(editItem?.regrind || '');
  const [moistureSensitive, setMoistureSensitive] = useState<boolean>(editItem?.moistureSensitive ?? false);
  const [processingMethod, setProcessingMethod] = useState<string>('Injection Molding');

  // Step 5: Inventory Settings
  const [lotControlled, setLotControlled] = useState<boolean>(editItem?.lot ?? true);
  const [expiryControlled, setExpiryControlled] = useState<boolean>(false);
  const [fefoPicking, setFefoPicking] = useState<boolean>(false);
  const [shelfLifeDays, setShelfLifeDays] = useState<number>(0);
  const [defaultWarehouse, setDefaultWarehouse] = useState<string>(editItem?.wh || (selectedType === 'Raw Material' ? 'RM-WH-01' : 'FG-WH-01'));
  const [defaultBin, setDefaultBin] = useState<string>(editItem?.locationCode || '');
  const [reorderLevel, setReorderLevel] = useState<number>(
    editItem?.reorderLevel ? parseInt(editItem.reorderLevel) : 0
  );
  const [safetyStock, setSafetyStock] = useState<number>(
    editItem?.safetyStock ? parseInt(editItem.safetyStock) : 0
  );

  // Post-Molding Routing Destination Checkboxes: DOL, ASSEMPLY, DEFLASH
  const initialRouting: 'DOL' | 'ASSEMBLY' | 'DEFLASH' = editItem?.routingDestination ||
    (editItem?.isDeflash ? 'DEFLASH' : editItem?.isAssembly ? 'ASSEMBLY' : editItem?.isDol ? 'DOL' : 'DOL');

  const [routingDestination, setRoutingDestination] = useState<'DOL' | 'ASSEMBLY' | 'DEFLASH'>(initialRouting);
  const [isDol, setIsDol] = useState<boolean>(editItem?.isDol ?? (initialRouting === 'DOL'));
  const [isAssembly, setIsAssembly] = useState<boolean>(editItem?.isAssembly ?? (initialRouting === 'ASSEMBLY'));
  const [isDeflash, setIsDeflash] = useState<boolean>(editItem?.isDeflash ?? (initialRouting === 'DEFLASH'));

  const handleToggleDol = (checked: boolean) => {
    if (checked) {
      setIsDol(true);
      setIsAssembly(false);
      setIsDeflash(false);
      setRoutingDestination('DOL');
      if (selectedType === 'Finished Good') {
        setDefaultWarehouse('FG-WH-01');
      }
    } else {
      setIsDol(false);
      setIsDeflash(true);
      setRoutingDestination('DEFLASH');
    }
  };

  const handleToggleAssembly = (checked: boolean) => {
    if (checked) {
      setIsDol(false);
      setIsAssembly(true);
      setIsDeflash(false);
      setRoutingDestination('ASSEMBLY');
    } else {
      setIsAssembly(false);
      setIsDol(true);
      setRoutingDestination('DOL');
    }
  };

  const handleToggleDeflash = (checked: boolean) => {
    if (checked) {
      setIsDol(false);
      setIsAssembly(false);
      setIsDeflash(true);
      setRoutingDestination('DEFLASH');
    } else {
      setIsDeflash(false);
      setIsDol(true);
      setRoutingDestination('DOL');
    }
  };

  // Step 6: Quality Settings
  const [iqcMandatory, setIqcMandatory] = useState<boolean>(editItem?.qc ?? false);
  const [coaRequired, setCoaRequired] = useState<boolean>(false);
  const [samplingPlan, setSamplingPlan] = useState<string>('ISO 2859-1 Level II Normal');
  const [approvedLab, setApprovedLab] = useState<string>('');
  const [qualityTestParams, setQualityTestParams] = useState<string[]>([]);

  // Step 7: Purchasing
  const [preferredSupplier, setPreferredSupplier] = useState<string>(
    editItem?.supplier || ''
  );
  const [standardPurchasePrice, setStandardPurchasePrice] = useState<number>(0);
  const [hsnCode, setHsnCode] = useState<string>(editItem?.hsCode || '');
  const [leadTimeDays, setLeadTimeDays] = useState<number>(editItem?.leadTime ? parseInt(editItem.leadTime) : 0);
  const [purchaseMoq, setPurchaseMoq] = useState<number>(0);
  const [gstRate, setGstRate] = useState<string>('18%');

  // Step 8: Sales
  const [standardSalesPrice, setStandardSalesPrice] = useState<number>(0);
  const [priceTier, setPriceTier] = useState<string>('Tier 1 OEM Standard');
  const [salesMoq, setSalesMoq] = useState<number>(0);
  const [packagingStandard, setPackagingStandard] = useState<string>('');

  // Step 9: Documents
  const [documents, setDocuments] = useState<
    { name: string; type: string; size: string; uploadedOn: string }[]
  >([]);

  // Step 10: Review & Workflow
  const [workflowRoute, setWorkflowRoute] = useState<string>(
    'Multi-Tier: Engineering Author -> QA Lead -> Plant Operations Manager'
  );
  const [workflowPriority, setWorkflowPriority] = useState<'Normal' | 'Urgent' | 'Expedited'>('Normal');
  const [creationNotes, setCreationNotes] = useState<string>('');

  const [isAutoSaving, setIsAutoSaving] = useState<boolean>(false);
  const [existingDraftFound, setExistingDraftFound] = useState<any | null>(null);

  // Reset form or initialize when modal opens
  useEffect(() => {
    if (isOpen) {
      if (editItem) {
        setSelectedType(editItem.type || 'Finished Good');
        setItemCode(editItem.code || '');
        setItemName(editItem.name || '');
        setCategory(editItem.cat || '');
        setDescription(editItem.desc || '');
        setCycleTime(editItem.cycleTime ?? editItem.standardCycleTime ?? '');
        setPartWeight(editItem.partWeightGrams ?? editItem.netWeightGrams ?? '');
        setCavityCount(editItem.cavityCount ?? 1);
        setRunnerWeight(editItem.runnerWeightGrams ?? 0);
        setBaseUOM(editItem.baseUOM || 'PCS');
        setResinType(editItem.resinType || '');
        setMfi(editItem.mfi || '');
        setDensity(editItem.density || '');
        setDefaultWarehouse(editItem.wh || '');
        setDefaultBin(editItem.locationCode || '');
        setReorderLevel(editItem.reorderLevel ? parseInt(editItem.reorderLevel) : 0);
        setSafetyStock(editItem.safetyStock ? parseInt(editItem.safetyStock) : 0);
        setPreferredSupplier(editItem.supplier || '');
        setHsnCode(editItem.hsCode || '');
        setLeadTimeDays(editItem.leadTime ? parseInt(editItem.leadTime) : 0);
        setAutoGenerateCode(false);
      } else {
        // Clean blank slate for new live item entry
        setCurrentStep(1);
        setItemName('');
        setCategory('');
        setItemGroup('');
        setDescription('');
        setCycleTime('');
        setPartWeight('');
        setCavityCount(1);
        setRunnerWeight(0);
        setConversions([]);
        setResinType('');
        setPolymerGrade('');
        setColor('');
        setMfi('');
        setDensity('');
        setAdditivePercentage('');
        setMasterbatchDosage('');
        setRegrindAllowance('');
        setMoistureSensitive(false);
        setLotControlled(true);
        setExpiryControlled(false);
        setFefoPicking(false);
        setShelfLifeDays(0);
        setDefaultWarehouse(selectedType === 'Raw Material' ? 'RM-WH-01' : 'FG-WH-01');
        setDefaultBin('');
        setReorderLevel(0);
        setSafetyStock(0);
        setIqcMandatory(false);
        setCoaRequired(false);
        setApprovedLab('');
        setQualityTestParams([]);
        setPreferredSupplier('');
        setStandardPurchasePrice(0);
        setHsnCode('');
        setLeadTimeDays(0);
        setPurchaseMoq(0);
        setStandardSalesPrice(0);
        setSalesMoq(0);
        setPackagingStandard('');
        setDocuments([]);
        setCreationNotes('');
        setAutoGenerateCode(true);
      }
    }
  }, [isOpen, editItem]);

  // Check for existing saved draft on open
  useEffect(() => {
    if (isOpen && !editItem) {
      try {
        const raw = localStorage.getItem('reboot_erp_item_draft_auto');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.itemCode && parsed.itemCode.trim() !== '') {
            setExistingDraftFound(parsed);
          }
        }
      } catch (err) {
        console.warn('Failed to parse auto-draft', err);
      }
    }
  }, [isOpen, editItem]);

  // Restore draft
  const handleRestoreDraft = () => {
    if (!existingDraftFound) return;
    setSelectedType(existingDraftFound.selectedType || 'Finished Good');
    setItemCode(existingDraftFound.itemCode || '');
    setItemName(existingDraftFound.itemName || '');
    setCategory(existingDraftFound.category || '');
    setItemGroup(existingDraftFound.itemGroup || '');
    setDescription(existingDraftFound.description || '');
    setCycleTime(existingDraftFound.cycleTime ?? '');
    setPartWeight(existingDraftFound.partWeight ?? '');
    setCavityCount(existingDraftFound.cavityCount ?? 1);
    setRunnerWeight(existingDraftFound.runnerWeight ?? 0);
    setBaseUOM(existingDraftFound.baseUOM || 'PCS');
    setCurrentStep(existingDraftFound.currentStep || 2);
    setExistingDraftFound(null);
    showToast(`Restored draft for ${existingDraftFound.itemCode || 'item'}.`);
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem('reboot_erp_item_draft_auto');
    setExistingDraftFound(null);
    showToast('Discarded previous draft.');
  };

  // Auto-generate item code when type changes and toggle is on
  useEffect(() => {
    if (autoGenerateCode && !editItem) {
      const prefixes: Record<string, string> = {
        'Raw Material': 'RM-PP-NAT',
        'Additive': 'ADD-SLP',
        'Masterbatch': 'MB-COL',
        'Colorant': 'COL-PIG',
        'Regrind': 'RG-PP-REC',
        'Semi-Finished Good': 'SFG-MOLD',
        'Finished Good': 'FG-AUTO',
        'Packaging Material': 'PKG-BOX',
        'Spare Part': 'SPR-MOLD',
        'Consumable': 'CON-OIL',
      };
      const prefix = prefixes[selectedType] || 'ITM-GEN';
      const randNum = Math.floor(100 + Math.random() * 900);
      setItemCode(`${prefix}-${randNum}`);
    }
  }, [selectedType, autoGenerateCode, editItem]);

  // 30-Second Auto-save Timer Execution
  useEffect(() => {
    if (!isOpen) return;

    const performAutoSave = () => {
      setIsAutoSaving(true);
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      const draftPayload = {
        selectedType,
        itemCode,
        itemName,
        category,
        itemGroup,
        status,
        description,
        cycleTime,
        partWeight,
        cavityCount,
        runnerWeight,
        baseUOM,
        purchaseUOM,
        salesUOM,
        stockUOM,
        productionUOM,
        resinType,
        polymerGrade,
        color,
        mfi,
        density,
        defaultWarehouse,
        defaultBin,
        reorderLevel,
        safetyStock,
        leadTimeDays,
        preferredSupplier,
        hsnCode,
        routingDestination,
        isDol,
        isAssembly,
        isDeflash,
        currentStep,
        savedAt: timeStr,
      };

      try {
        localStorage.setItem('reboot_erp_item_draft_auto', JSON.stringify(draftPayload));
      } catch (err) {
        console.warn('Auto-save write error', err);
      }

      setLastAutoSaveTime(timeStr);
      setTimeout(() => setIsAutoSaving(false), 1200);
    };

    // Trigger auto-save every 30 seconds
    const timer = setInterval(performAutoSave, 30000);
    return () => clearInterval(timer);
  }, [
    isOpen,
    selectedType,
    itemCode,
    itemName,
    category,
    itemGroup,
    status,
    description,
    cycleTime,
    partWeight,
    cavityCount,
    runnerWeight,
    baseUOM,
    purchaseUOM,
    salesUOM,
    stockUOM,
    productionUOM,
    resinType,
    polymerGrade,
    color,
    mfi,
    density,
    defaultWarehouse,
    defaultBin,
    reorderLevel,
    safetyStock,
    leadTimeDays,
    preferredSupplier,
    hsnCode,
    routingDestination,
    isDol,
    isAssembly,
    isDeflash,
    currentStep,
  ]);

  if (!isOpen) return null;

  // Item Types List with Icons
  const itemTypesList: { type: ItemType; label: string; desc: string; icon: React.FC<any> }[] = [
    { type: 'Raw Material', label: 'Raw Material', desc: 'Resins and compounds bought by weight', icon: FlaskConical },
    { type: 'Additive', label: 'Additive', desc: 'Standard master record', icon: Fuel },
    { type: 'Masterbatch', label: 'Masterbatch', desc: 'Standard master record', icon: Palette },
    { type: 'Colorant', label: 'Colorant', desc: 'Standard master record', icon: Droplet },
    { type: 'Regrind', label: 'Regrind', desc: 'Reprocessed in-house material', icon: RefreshCw },
    { type: 'Semi-Finished Good', label: 'Semi-Finished Good', desc: 'Standard master record', icon: Layers },
    { type: 'Finished Good', label: 'Finished Good', desc: 'Standard master record', icon: Box },
    { type: 'Packaging Material', label: 'Packaging Material', desc: 'Standard master record', icon: Package },
    { type: 'Spare Part', label: 'Spare Part', desc: 'Machine and mold spares', icon: Wrench },
    { type: 'Consumable', label: 'Consumable', desc: 'Standard master record', icon: Fuel },
  ];

  const steps = [
    { id: 1, label: 'Item type' },
    { id: 2, label: 'Basic information' },
    { id: 3, label: 'Units & conversions' },
    { id: 4, label: 'Manufacturing attributes' },
    { id: 5, label: 'Inventory settings' },
    { id: 6, label: 'Quality settings' },
    { id: 7, label: 'Purchasing' },
    { id: 8, label: 'Sales' },
    { id: 9, label: 'Documents' },
    { id: 10, label: 'Review & submit' },
  ];

  const handleNext = () => {
    if (currentStep < 10) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAddConversion = () => {
    setConversions([
      ...conversions,
      { id: Date.now().toString(), from: baseUOM, to: 'Custom Unit', factor: 1.0 },
    ]);
  };

  const handleRemoveConversion = (id: string) => {
    setConversions(conversions.filter((c) => c.id !== id));
  };

  const handleSaveDraft = () => {
    const draftItem: ItemMaster = {
      code: itemCode,
      name: itemName || 'Untitled Draft Item',
      type: selectedType,
      cat: category,
      stock: `0 ${baseUOM}`,
      avail: `0 ${baseUOM}`,
      wh: defaultWarehouse,
      lot: lotControlled,
      qc: iqcMandatory,
      status: 'inactive',
      icon: selectedType === 'Finished Good' ? '▣' : selectedType === 'Masterbatch' ? '●' : '◇',
      baseUOM,
      approval: 'draft',
      createdOn: 'Today',
      standardCycleTime: Number(cycleTime) || 0,
      cycleTime: Number(cycleTime) || 0,
      partWeightGrams: numPartWeight,
      cavityCount: numCavities,
      runnerWeightGrams: numRunnerWeight,
      shotWeightGrams: calculatedSingleShotWeight,
      netWeightGrams: numPartWeight,
      locationCode: defaultBin,
      desc: description,
      resinType,
      mfi,
      density,
      regrind: regrindAllowance,
      reorderLevel: reorderLevel.toString(),
      safetyStock: safetyStock.toString(),
      leadTime: `${leadTimeDays}d`,
      supplier: preferredSupplier,
      hsCode: hsnCode,
      moistureSensitive,
      routingDestination,
      isDol,
      isAssembly,
      isDeflash,
    };
    onSaveItem(draftItem);
    showToast(`Draft item ${draftItem.code} saved successfully.`);
    onClose();
  };

  const handleSubmitFinal = (isApprovedDirectly = false) => {
    if (!itemCode.trim() || !itemName.trim()) {
      showToast('Item code and name are required before submitting.');
      setCurrentStep(2);
      return;
    }

    const finalItem: ItemMaster = {
      code: itemCode.trim(),
      name: itemName.trim(),
      type: selectedType,
      cat: category,
      stock: editItem?.stock || `0 ${baseUOM}`,
      avail: editItem?.avail || `0 ${baseUOM}`,
      wh: defaultWarehouse,
      lot: lotControlled,
      qc: iqcMandatory,
      status: 'active',
      icon: selectedType === 'Finished Good' ? '▣' : selectedType === 'Masterbatch' ? '●' : '◇',
      baseUOM,
      approval: isApprovedDirectly ? 'approved' : 'pending',
      createdOn: editItem?.createdOn || 'Today',
      standardCycleTime: Number(cycleTime) || (selectedType === 'Finished Good' ? 24.5 : 0),
      cycleTime: Number(cycleTime) || 0,
      partWeightGrams: numPartWeight,
      cavityCount: numCavities,
      runnerWeightGrams: numRunnerWeight,
      shotWeightGrams: calculatedSingleShotWeight,
      netWeightGrams: numPartWeight,
      cycleTimeUOM: 'sec/pc',
      locationCode: defaultBin,
      desc: description,
      resinType,
      mfi,
      density,
      regrind: regrindAllowance,
      reorderLevel: reorderLevel.toString(),
      safetyStock: safetyStock.toString(),
      leadTime: `${leadTimeDays}d`,
      supplier: preferredSupplier,
      hsCode: hsnCode,
      moistureSensitive,
      routingDestination,
      isDol,
      isAssembly,
      isDeflash,
    };

    onSaveItem(finalItem);
    showToast(
      isApprovedDirectly
        ? `Item ${finalItem.code} released directly to Active Master catalog.`
        : `Item ${finalItem.code} submitted for ${workflowRoute.split(':')[0]} approval.`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-6xl min-h-[640px] flex flex-col overflow-hidden my-auto animate-fade-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {editItem ? `Edit item — ${editItem.code}` : 'Create item'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Guided setup — fields adapt to the selected item type. Draft auto-saves every 30 seconds.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              Save as draft
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2 py-1.5 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Wizard Main Body */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 bg-slate-50/50">
          {/* Left Column: Vertical Stepper & Auto-Save */}
          <div className="p-5 border-r border-slate-200 bg-white flex flex-col justify-between">
            <div className="space-y-4">
              {/* Progress Bar & Step Counter */}
              <div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#0066CC] h-full transition-all duration-300"
                    style={{ width: `${(currentStep / 10) * 100}%` }}
                  />
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-2 font-semibold">
                  Step {currentStep} of 10
                </div>
              </div>

              {/* Steps List */}
              <div className="space-y-1">
                {steps.map((s) => {
                  const isCompleted = currentStep > s.id;
                  const isActive = currentStep === s.id;

                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setCurrentStep(s.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs transition-all ${
                        isActive
                          ? 'bg-[#F0F7FF] text-[#0066CC] font-bold shadow-xs'
                          : isCompleted
                          ? 'text-slate-700 font-medium hover:bg-slate-50'
                          : 'text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold ${
                          isActive
                            ? 'bg-[#0066CC] text-white'
                            : isCompleted
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'border border-slate-300 text-slate-400'
                        }`}
                      >
                        {isCompleted ? <Check className="w-3 h-3" /> : s.id}
                      </div>
                      <span className="truncate">{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Left Timestamp Status with active auto-save indicator */}
            <div className="pt-4 border-t border-slate-100 text-[11px] font-mono text-slate-500 flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isAutoSaving ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'
                }`}
              />
              <span className="truncate">
                {isAutoSaving
                  ? 'Auto-saving progress...'
                  : `Auto-saved ${lastAutoSaveTime} • draft ${itemCode}`}
              </span>
            </div>
          </div>

          {/* Right Column (3 Cols): Main Step Form Content */}
          <div className="md:col-span-3 p-6 flex flex-col justify-between overflow-y-auto max-h-[640px] bg-white">
            <div className="space-y-5">
              {/* Draft Restoration Banner if found */}
              {existingDraftFound && (
                <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs animate-in fade-in">
                  <div className="flex items-center gap-2 text-amber-900">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      <strong>Unsaved draft detected:</strong> "{existingDraftFound.itemCode || 'Untitled'}" (Saved at {existingDraftFound.savedAt || 'recently'}).
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleRestoreDraft}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                    >
                      Resume Draft
                    </button>
                    <button
                      type="button"
                      onClick={handleDiscardDraft}
                      className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      Discard
                    </button>
                  </div>
                </div>
              )}
              {/* ========================================================= */}
              {/* STEP 1: ITEM TYPE                                         */}
              {/* ========================================================= */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h2 className="text-sm font-bold text-slate-900">Item type</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {itemTypesList.map((itm) => {
                      const Icon = itm.icon;
                      const isSelected = selectedType === itm.type;

                      return (
                        <button
                          key={itm.type}
                          type="button"
                          onClick={() => setSelectedType(itm.type)}
                          className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'border-[#0066CC] bg-[#F0F7FF]/60 ring-2 ring-[#0066CC]/20 shadow-xs'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                          }`}
                        >
                          <div
                            className={`p-2 rounded-lg shrink-0 ${
                              isSelected ? 'bg-[#0066CC] text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-xs text-slate-900">{itm.label}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                              {itm.desc}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* STEP 2: BASIC INFORMATION                                 */}
              {/* ========================================================= */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <h2 className="text-sm font-bold text-slate-900">Basic information</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Item Code + Auto-generate toggle */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-slate-700 flex items-center gap-1">
                          Item code
                          <HelpCircle className="w-3 h-3 text-slate-400" />
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={autoGenerateCode}
                            onChange={(e) => setAutoGenerateCode(e.target.checked)}
                            className="rounded text-[#0066CC] focus:ring-[#0066CC]"
                          />
                          <span className="text-[11px] text-slate-600">Auto-generate item code</span>
                        </label>
                      </div>
                      <input
                        type="text"
                        value={itemCode}
                        onChange={(e) => setItemCode(e.target.value)}
                        disabled={autoGenerateCode}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs disabled:bg-slate-50 disabled:text-slate-600"
                        placeholder="e.g. RM-PP-NAT-014"
                      />
                    </div>

                    {/* Item Name */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Item name *</label>
                      <input
                        type="text"
                        required
                        value={itemName}
                        onChange={(e) => setItemName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-[#0066CC]"
                        placeholder="e.g. PP Natural Granules"
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                      >
                        <option value="Raw Material / PP">Raw Material / PP</option>
                        <option value="Polypropylene Copolymer">Polypropylene Copolymer</option>
                        <option value="HDPE Blow Grade">HDPE Blow Grade</option>
                        <option value="Color Masterbatch">Color Masterbatch</option>
                        <option value="Black Masterbatch">Black Masterbatch</option>
                        <option value="Regrind PP Reprocessed">Regrind PP Reprocessed</option>
                        <option value="Molded Automotive Parts">Molded Automotive Parts</option>
                        <option value="Packaging Materials">Packaging Materials</option>
                        <option value="Mold & Machine Spares">Mold &amp; Machine Spares</option>
                      </select>
                    </div>

                    {/* Item Group */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Item group</label>
                      <input
                        type="text"
                        value={itemGroup}
                        onChange={(e) => setItemGroup(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                        placeholder="e.g. Polymer feedstock"
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Status</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                      >
                        <option value="Pending Approval">Pending Approval</option>
                        <option value="Active">Active</option>
                        <option value="Draft">Draft</option>
                        <option value="Quarantine Hold">Quarantine Hold</option>
                        <option value="Obsolete">Obsolete</option>
                      </select>
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">Description</label>
                      <textarea
                        rows={2}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                        placeholder="Grade, application and processing notes"
                      />
                    </div>

                    {/* ========================================================================= */}
                    {/* FINISHED GOOD / INJECTION MOLDING PROCESS & TOOLING PARAMETERS            */}
                    {/* ========================================================================= */}
                    {selectedType === 'Finished Good' && (
                      <div className="md:col-span-2 p-4 bg-gradient-to-br from-blue-50/70 via-slate-50 to-teal-50/40 rounded-xl border border-blue-200/80 shadow-xs space-y-3 animate-fade-in">
                        <div className="flex items-center justify-between pb-2 border-b border-blue-200/60">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-[#0066CC] text-white flex items-center justify-center font-bold text-xs">
                              <Box className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <h3 className="font-bold text-xs text-slate-900">
                                Finished Good &mdash; Injection Molding Tooling &amp; Process Parameters
                              </h3>
                              <p className="text-[11px] text-slate-500">
                                Core rheology, cycle timing, mold cavity metrics, and automatic shot weight balancing.
                              </p>
                            </div>
                          </div>

                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-[#0066CC] border border-blue-200">
                            Mold Spec Gate
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                          {/* Cycle Time */}
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">
                              Cycle Time <span className="text-slate-400 font-normal">(seconds)</span> *
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                step="0.1"
                                min="1"
                                required
                                value={cycleTime}
                                onChange={(e) => setCycleTime(e.target.value)}
                                className="w-full pl-3 pr-10 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:ring-1 focus:ring-[#0066CC] bg-white"
                                placeholder="e.g. 24.5"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-slate-400 font-semibold">
                                sec
                              </span>
                            </div>
                          </div>

                          {/* Part Weight */}
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">
                              Part Weight <span className="text-slate-400 font-normal">(grams/pc)</span> *
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                step="0.01"
                                min="0.1"
                                required
                                value={partWeight}
                                onChange={(e) => setPartWeight(e.target.value)}
                                className="w-full pl-3 pr-10 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:ring-1 focus:ring-[#0066CC] bg-white"
                                placeholder="e.g. 142.5"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-slate-400 font-semibold">
                                g
                              </span>
                            </div>
                          </div>

                          {/* Cavity Count */}
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">
                              Mold Cavities <span className="text-slate-400 font-normal">(count)</span> *
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                min="1"
                                max="128"
                                required
                                value={cavityCount}
                                onChange={(e) => setCavityCount(e.target.value)}
                                className="w-full pl-3 pr-12 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:ring-1 focus:ring-[#0066CC] bg-white"
                                placeholder="e.g. 2"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-slate-400 font-semibold">
                                cav
                              </span>
                            </div>
                          </div>

                          {/* Runner Weight */}
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">
                              Runner Weight <span className="text-slate-400 font-normal">(grams)</span> *
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                value={runnerWeight}
                                onChange={(e) => setRunnerWeight(e.target.value)}
                                className="w-full pl-3 pr-10 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:ring-1 focus:ring-[#0066CC] bg-white"
                                placeholder="e.g. 18.0"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-slate-400 font-semibold">
                                g
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Calculated Shot Weight Dynamic Readout & Formula Banner */}
                        <div className="p-3 bg-white rounded-xl border border-blue-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-[#0066CC]" />
                                Calculated Shot Weight:
                              </span>
                              <span className="font-mono text-sm font-bold text-[#0066CC] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                {calculatedSingleShotWeight} g / pc shot
                              </span>
                              <span className="text-slate-400">&bull;</span>
                              <span className="font-mono text-xs font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                                {calculatedTotalShotWeight} g (Total {numCavities}-Cavity Shot)
                              </span>
                            </div>

                            {/* Mathematical formula badge */}
                            <div className="font-mono text-[11px] text-slate-600 flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-700">Formula:</span>
                              <span className="bg-slate-100 px-1.5 py-0.2 rounded text-slate-800">
                                Part Weight ({numPartWeight}g) + Runner Weight ({numRunnerWeight}g) = {calculatedSingleShotWeight}g
                              </span>
                              <span className="text-slate-400">&bull;</span>
                              <span className="bg-slate-100 px-1.5 py-0.2 rounded text-slate-800">
                                ({numPartWeight}g &times; {numCavities} Cavities) + {numRunnerWeight}g = {calculatedTotalShotWeight}g Total Mold Shot
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0 text-right font-mono text-[11px] text-slate-500">
                            <div>Est. Hourly Output:</div>
                            <strong className="text-slate-900 text-xs">
                              {Number(cycleTime) > 0
                                ? Math.round((3600 / Number(cycleTime)) * numCavities).toLocaleString()
                                : 0}{' '}
                              pcs / hr
                            </strong>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Image Upload Box */}
                    <div className="md:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">Item image</label>
                      <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors flex flex-col items-center justify-center gap-2">
                        <UploadCloud className="w-8 h-8 text-slate-400" />
                        <div className="font-semibold text-slate-800 text-xs">Drop item photo</div>
                        <p className="text-[11px] text-slate-400">PNG or JPG, 1:1 preferred</p>
                        <label className="mt-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer">
                          Browse files
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setItemImage(URL.createObjectURL(e.target.files[0]));
                                showToast('Photo uploaded.');
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* STEP 3: UNITS & CONVERSIONS                               */}
              {/* ========================================================= */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <h2 className="text-sm font-bold text-slate-900">Units &amp; conversions</h2>

                  {/* 5 UOM Selectors */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Base UOM</label>
                      <select
                        value={baseUOM}
                        onChange={(e) => setBaseUOM(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-medium"
                      >
                        <option value="KG">KG</option>
                        <option value="MT">MT</option>
                        <option value="PCS">PCS</option>
                        <option value="LTR">LTR</option>
                        <option value="BOX">BOX</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Purchase UOM</label>
                      <select
                        value={purchaseUOM}
                        onChange={(e) => setPurchaseUOM(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-medium"
                      >
                        <option value="KG">KG</option>
                        <option value="Bag">Bag (25 KG)</option>
                        <option value="MT">MT</option>
                        <option value="Pallet">Pallet</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Sales UOM</label>
                      <select
                        value={salesUOM}
                        onChange={(e) => setSalesUOM(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-medium"
                      >
                        <option value="KG">KG</option>
                        <option value="PCS">PCS</option>
                        <option value="BOX">BOX</option>
                        <option value="Pallet">Pallet</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Stock UOM</label>
                      <select
                        value={stockUOM}
                        onChange={(e) => setStockUOM(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-medium"
                      >
                        <option value="KG">KG</option>
                        <option value="Bag">Bag</option>
                        <option value="Silo">Silo</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Production UOM</label>
                      <select
                        value={productionUOM}
                        onChange={(e) => setProductionUOM(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-medium"
                      >
                        <option value="KG">KG</option>
                        <option value="GMS">GMS</option>
                        <option value="PCS">PCS</option>
                        <option value="Shot">Shot</option>
                      </select>
                    </div>
                  </div>

                  {/* Conversions Table */}
                  <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-slate-500 font-semibold border-b border-slate-200 text-[11px]">
                          <th className="py-2">From</th>
                          <th className="py-2">To</th>
                          <th className="py-2 text-right">Factor</th>
                          <th className="py-2 text-right w-12"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {conversions.map((conv) => (
                          <tr key={conv.id}>
                            <td className="py-2.5">{conv.from}</td>
                            <td className="py-2.5 font-sans font-medium">{conv.to}</td>
                            <td className="py-2.5 text-right font-bold">
                              {conv.factor.toLocaleString(undefined, { minimumFractionDigits: 3 })}
                            </td>
                            <td className="py-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveConversion(conv.id)}
                                className="text-slate-400 hover:text-rose-600 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <button
                      type="button"
                      onClick={handleAddConversion}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
                    >
                      Add conversion
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* STEP 4: MANUFACTURING ATTRIBUTES                          */}
              {/* ========================================================= */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <h2 className="text-sm font-bold text-slate-900">Manufacturing attributes</h2>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Resin type</label>
                      <input
                        type="text"
                        value={resinType}
                        onChange={(e) => setResinType(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300"
                        placeholder="Polypropylene (PP)"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Polymer grade</label>
                      <input
                        type="text"
                        value={polymerGrade}
                        onChange={(e) => setPolymerGrade(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300"
                        placeholder="Repol H110MA"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Color</label>
                      <input
                        type="text"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300"
                        placeholder="Natural"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        Melt flow index (g/10min)
                        <HelpCircle className="w-3 h-3 text-slate-400" />
                      </label>
                      <input
                        type="text"
                        value={mfi}
                        onChange={(e) => setMfi(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                        placeholder="11.0"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Density (g/cm³)</label>
                      <input
                        type="text"
                        value={density}
                        onChange={(e) => setDensity(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                        placeholder="0.905"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Additive percentage</label>
                      <input
                        type="text"
                        value={additivePercentage}
                        onChange={(e) => setAdditivePercentage(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                        placeholder="1.2"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Masterbatch dosage %</label>
                      <input
                        type="text"
                        value={masterbatchDosage}
                        onChange={(e) => setMasterbatchDosage(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                        placeholder="3.5"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Regrind allowance %</label>
                      <input
                        type="text"
                        value={regrindAllowance}
                        onChange={(e) => setRegrindAllowance(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                        placeholder="20"
                      />
                    </div>

                    <div className="flex flex-col justify-end">
                      <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                        <span className="font-semibold text-slate-700">Moisture sensitive (pre-dry)</span>
                        <input
                          type="checkbox"
                          checked={moistureSensitive}
                          onChange={(e) => setMoistureSensitive(e.target.checked)}
                          className="rounded text-[#0066CC] w-4 h-4 focus:ring-[#0066CC]"
                        />
                      </label>
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block font-semibold text-slate-700 mb-1">Processing method</label>
                      <select
                        value={processingMethod}
                        onChange={(e) => setProcessingMethod(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                      >
                        <option value="Injection Molding">Injection Molding</option>
                        <option value="Extrusion Blow Molding">Extrusion Blow Molding</option>
                        <option value="Sheet Extrusion">Sheet Extrusion</option>
                        <option value="Thermoforming">Thermoforming</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* STEP 5: INVENTORY SETTINGS                                */}
              {/* ========================================================= */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <h2 className="text-sm font-bold text-slate-900">Inventory settings</h2>

                  {/* Top Row Toggles */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/70 cursor-pointer">
                      <span className="font-semibold text-slate-800">Lot / batch controlled</span>
                      <input
                        type="checkbox"
                        checked={lotControlled}
                        onChange={(e) => setLotControlled(e.target.checked)}
                        className="w-4 h-4 rounded text-[#0066CC] focus:ring-[#0066CC]"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/70 cursor-pointer">
                      <span className="font-semibold text-slate-800">Expiry controlled</span>
                      <input
                        type="checkbox"
                        checked={expiryControlled}
                        onChange={(e) => setExpiryControlled(e.target.checked)}
                        className="w-4 h-4 rounded text-[#0066CC] focus:ring-[#0066CC]"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/70 cursor-pointer">
                      <span className="font-semibold text-slate-800">FEFO picking (else FIFO)</span>
                      <input
                        type="checkbox"
                        checked={fefoPicking}
                        onChange={(e) => setFefoPicking(e.target.checked)}
                        className="w-4 h-4 rounded text-[#0066CC] focus:ring-[#0066CC]"
                      />
                    </label>
                  </div>

                  {/* Shelf life, Warehouse, Bin, Reorder */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Shelf life (days)</label>
                      <input
                        type="number"
                        value={shelfLifeDays}
                        onChange={(e) => setShelfLifeDays(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                        placeholder="365"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Default warehouse</label>
                      <select
                        value={defaultWarehouse}
                        onChange={(e) => setDefaultWarehouse(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="RM-WH-01">RM-WH-01 (Polymer Silo &amp; Bags)</option>
                        <option value="RM-WH-02">RM-WH-02 (Additives Store)</option>
                        <option value="MB-STORE-01">MB-STORE-01 (Masterbatch Store)</option>
                        <option value="RG-WH-01">RG-WH-01 (Regrind Bay)</option>
                        <option value="FG-WH-01">FG-WH-01 (Finished Goods)</option>
                        <option value="SP-WH-01">SP-WH-01 (Molds &amp; Spares)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Default bin</label>
                      <input
                        type="text"
                        value={defaultBin}
                        onChange={(e) => setDefaultBin(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                        placeholder="A-01-03"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Reorder level</label>
                      <input
                        type="number"
                        value={reorderLevel}
                        onChange={(e) => setReorderLevel(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                        placeholder="10000"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Safety stock</label>
                      <input
                        type="number"
                        value={safetyStock}
                        onChange={(e) => setSafetyStock(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                        placeholder="6000"
                      />
                    </div>
                  </div>

                  {/* Post-Production Routing & Store Destination (DOL, ASSEMPLY, DEFLASH) */}
                  <div className="pt-3 border-t border-slate-200 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <span>Post-Molding Routing Destination Checkboxes</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200 uppercase tracking-wide">
                            Daily Production Direct Routing
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Select the destination store for this item. When daily production entry is saved, output is automatically routed to this store.
                        </p>
                      </div>
                      <div className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center gap-1.5">
                        <span className="text-slate-500">Destination:</span>
                        <span className={`font-bold ${
                          routingDestination === 'DOL' ? 'text-emerald-700' :
                          routingDestination === 'ASSEMBLY' ? 'text-purple-700' : 'text-amber-700'
                        }`}>
                          {routingDestination === 'DOL' ? 'FG-STORE (Direct to FG)' :
                           routingDestination === 'ASSEMBLY' ? 'ASSEMBLY-STORE (Assembly Store)' :
                           'DEFLASH-STORE (Deflash Store)'}
                        </span>
                      </div>
                    </div>

                    {/* 3 Checkbox Cards: DOL, ASSEMPLY, DEFLASH */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      {/* 1. DOL Checkbox */}
                      <label className={`relative flex flex-col justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all select-none ${
                        isDol
                          ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}>
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isDol}
                                onChange={(e) => handleToggleDol(e.target.checked)}
                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                              />
                              <span className="font-bold text-slate-900 text-sm">DOL</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isDol ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              &rarr; FG-STORE
                            </span>
                          </div>
                          <div className="text-[11px] font-semibold text-emerald-800">
                            Direct On Line &rarr; FG-store
                          </div>
                          <p className="mt-1.5 text-[11px] text-slate-600 leading-snug">
                            When <strong>DOL</strong> is checked, daily production entry directly deposits finished output into <strong>FG-STORE</strong> (Finished Goods), bypassing secondary finishing.
                          </p>
                        </div>
                        <div className="mt-2.5 pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[10px]">
                          <span className="text-emerald-700 font-medium">Status: {isDol ? 'Active Target Store' : 'Inactive'}</span>
                          <span className="font-mono text-emerald-900 font-bold">Store: FG-STORE</span>
                        </div>
                      </label>

                      {/* 2. ASSEMPLY Checkbox */}
                      <label className={`relative flex flex-col justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all select-none ${
                        isAssembly
                          ? 'border-purple-600 bg-purple-50/70 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}>
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isAssembly}
                                onChange={(e) => handleToggleAssembly(e.target.checked)}
                                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600"
                              />
                              <span className="font-bold text-slate-900 text-sm">ASSEMPLY</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isAssembly ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              &rarr; ASSEMBLY-STORE
                            </span>
                          </div>
                          <div className="text-[11px] font-semibold text-purple-800">
                            Assembly &rarr; Assembly Inventory Store
                          </div>
                          <p className="mt-1.5 text-[11px] text-slate-600 leading-snug">
                            When <strong>ASSEMPLY</strong> is checked, daily production entry routes output to <strong>ASSEMBLY-STORE</strong> for secondary inserts, fittings, or multi-component assembly.
                          </p>
                        </div>
                        <div className="mt-2.5 pt-2 border-t border-purple-200/60 flex items-center justify-between text-[10px]">
                          <span className="text-purple-700 font-medium">Status: {isAssembly ? 'Active Target Store' : 'Inactive'}</span>
                          <span className="font-mono text-purple-900 font-bold">Store: ASSEMBLY-STORE</span>
                        </div>
                      </label>

                      {/* 3. DEFLASH Checkbox */}
                      <label className={`relative flex flex-col justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all select-none ${
                        isDeflash
                          ? 'border-amber-600 bg-amber-50/70 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}>
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isDeflash}
                                onChange={(e) => handleToggleDeflash(e.target.checked)}
                                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer accent-amber-600"
                              />
                              <span className="font-bold text-slate-900 text-sm">DEFLASH</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isDeflash ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              &rarr; DEFLASH-STORE
                            </span>
                          </div>
                          <div className="text-[11px] font-semibold text-amber-800">
                            Deflash &rarr; Deflash Inventory Store
                          </div>
                          <p className="mt-1.5 text-[11px] text-slate-600 leading-snug">
                            When <strong>DEFLASH</strong> is checked, daily production entry routes output to <strong>DEFLASH-STORE</strong> for runner gate cutting, burr deburring, or flame polishing.
                          </p>
                        </div>
                        <div className="mt-2.5 pt-2 border-t border-amber-200/60 flex items-center justify-between text-[10px]">
                          <span className="text-amber-700 font-medium">Status: {isDeflash ? 'Active Target Store' : 'Inactive'}</span>
                          <span className="font-mono text-amber-900 font-bold">Store: DEFLASH-STORE</span>
                        </div>
                      </label>
                    </div>

                    {/* Routing Visual Process Path */}
                    <div className={`p-3 rounded-xl border text-xs flex items-center justify-between flex-wrap gap-2 ${
                      routingDestination === 'DOL' ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950' :
                      routingDestination === 'ASSEMBLY' ? 'bg-purple-50/90 border-purple-300 text-purple-950' :
                      'bg-amber-50/90 border-amber-300 text-amber-950'
                    }`}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-white border shadow-2xs">
                          Direct Flow
                        </span>
                        <span className="font-medium text-slate-700">Molding Production</span>
                        <span className="text-slate-400">&rarr;</span>
                        <span className="font-medium text-slate-700">Daily Production Entry</span>
                        <span className="text-slate-400">&rarr;</span>
                        <span className="px-2 py-0.5 rounded-md font-bold bg-white shadow-xs border text-slate-900">
                          {routingDestination === 'DOL' && 'Directly Received in FG-STORE (Finished Goods)'}
                          {routingDestination === 'ASSEMBLY' && 'Received in ASSEMBLY-STORE (Assembly Inventory)'}
                          {routingDestination === 'DEFLASH' && 'Received in DEFLASH-STORE (Deflash Inventory)'}
                        </span>
                      </div>
                      <div className="text-[11px] font-bold">
                        {routingDestination === 'DOL' && '✓ Bypasses WIP staging directly to customer dispatch ready'}
                        {routingDestination === 'ASSEMBLY' && '⚡ Queued for assembly hardware & packaging lines'}
                        {routingDestination === 'DEFLASH' && '⚡ Queued for secondary deflashing & gate trimming'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* STEP 6: QUALITY SETTINGS                                  */}
              {/* ========================================================= */}
              {currentStep === 6 && (
                <div className="space-y-4">
                  <h2 className="text-sm font-bold text-slate-900">Quality settings &amp; Inspection</h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/70 cursor-pointer">
                      <span className="font-semibold text-slate-800">Inward QC Inspection Mandatory</span>
                      <input
                        type="checkbox"
                        checked={iqcMandatory}
                        onChange={(e) => setIqcMandatory(e.target.checked)}
                        className="w-4 h-4 rounded text-[#0066CC]"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/70 cursor-pointer">
                      <span className="font-semibold text-slate-800">COA Required from Supplier</span>
                      <input
                        type="checkbox"
                        checked={coaRequired}
                        onChange={(e) => setCoaRequired(e.target.checked)}
                        className="w-4 h-4 rounded text-[#0066CC]"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Sampling Plan (AQL)</label>
                      <select
                        value={samplingPlan}
                        onChange={(e) => setSamplingPlan(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="ISO 2859-1 Level II Normal">ISO 2859-1 Level II Normal (General AQL 1.0)</option>
                        <option value="100% Critical Inspection">100% Critical Inspection (Automotive Zero Defect)</option>
                        <option value="Skip-Lot Certified Vendor">Skip-Lot Certified Vendor Audit</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Approved Quality Testing Lab</label>
                      <input
                        type="text"
                        value={approvedLab}
                        onChange={(e) => setApprovedLab(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300"
                        placeholder="e.g. In-House Spectrophotometer & MFI Lab"
                      />
                    </div>
                  </div>

                  <div className="pt-2 text-xs space-y-2">
                    <label className="block font-semibold text-slate-700">Mandatory Lot Test Checklist</label>
                    <div className="space-y-1.5 p-3 rounded-xl border border-slate-200 bg-slate-50">
                      {[
                        'Melt Flow Index (ASTM D1238)',
                        'Density Gradient (ASTM D792)',
                        'Moisture Content PPM (Karl Fischer)',
                        'Color Delta E Spectrophotometer Scan',
                        'Ash / Filler Content % (Thermogravimetric)',
                      ].map((t) => (
                        <label key={t} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={qualityTestParams.includes(t)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setQualityTestParams([...qualityTestParams, t]);
                              } else {
                                setQualityTestParams(qualityTestParams.filter((x) => x !== t));
                              }
                            }}
                            className="rounded text-[#0066CC]"
                          />
                          <span className="text-slate-800">{t}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* STEP 7: PURCHASING                                        */}
              {/* ========================================================= */}
              {currentStep === 7 && (
                <div className="space-y-4">
                  <h2 className="text-sm font-bold text-slate-900">Purchasing &amp; Sourcing Attributes</h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Primary Preferred Supplier</label>
                      <input
                        type="text"
                        value={preferredSupplier}
                        onChange={(e) => setPreferredSupplier(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300"
                        placeholder="e.g. Reliance Industries Ltd"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Standard Purchase Cost (₹ / UOM)</label>
                      <input
                        type="number"
                        step={0.5}
                        value={standardPurchasePrice}
                        onChange={(e) => setStandardPurchasePrice(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                        placeholder="112.50"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">HSN / Tariff Code</label>
                      <input
                        type="text"
                        value={hsnCode}
                        onChange={(e) => setHsnCode(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                        placeholder="39021000"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Supplier Lead Time (Days)</label>
                      <input
                        type="number"
                        value={leadTimeDays}
                        onChange={(e) => setLeadTimeDays(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                        placeholder="7"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Minimum Order Qty (MOQ)</label>
                      <input
                        type="number"
                        value={purchaseMoq}
                        onChange={(e) => setPurchaseMoq(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                        placeholder="5000"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">GST Tax Rate</label>
                      <select
                        value={gstRate}
                        onChange={(e) => setGstRate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium"
                      >
                        <option value="18%">18% (Standard Resins &amp; Chemicals)</option>
                        <option value="12%">12% (Specified Polymer Articles)</option>
                        <option value="5%">5% (Recycled Polyolefins)</option>
                        <option value="0%">0% (Exempt Export Supply)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* STEP 8: SALES                                             */}
              {/* ========================================================= */}
              {currentStep === 8 && (
                <div className="space-y-4">
                  <h2 className="text-sm font-bold text-slate-900">Commercial &amp; Sales Pricing</h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Standard List Price (₹ / UOM)</label>
                      <input
                        type="number"
                        step={1}
                        value={standardSalesPrice}
                        onChange={(e) => setStandardSalesPrice(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                        placeholder="145.00"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Pricing Tier / Matrix</label>
                      <select
                        value={priceTier}
                        onChange={(e) => setPriceTier(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium"
                      >
                        <option value="Tier 1 OEM Standard">Tier 1 OEM Standard (Cost Plus 22%)</option>
                        <option value="Tier 2 Volume Discount">Tier 2 Volume Discount (&gt; 10 MT)</option>
                        <option value="Distributor Bracket">Distributor Bracket (FOB Factory)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Min Sales Order Qty (MOQ)</label>
                      <input
                        type="number"
                        value={salesMoq}
                        onChange={(e) => setSalesMoq(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                        placeholder="1000"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Finished Goods Packaging Standard</label>
                      <input
                        type="text"
                        value={packagingStandard}
                        onChange={(e) => setPackagingStandard(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300"
                        placeholder="e.g. 25 KG Moisture Barrier Paper Bags"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* STEP 9: DOCUMENTS                                         */}
              {/* ========================================================= */}
              {currentStep === 9 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-900">Technical Documentation &amp; Compliance</h2>
                    <button
                      type="button"
                      onClick={() => {
                        setDocuments([
                          ...documents,
                          {
                            name: `RoHS_REACH_Certificate_${itemCode}.pdf`,
                            type: 'RoHS / REACH Declaration',
                            size: '850 KB',
                            uploadedOn: 'Today',
                          },
                        ]);
                        showToast('Sample RoHS / REACH document attached.');
                      }}
                      className="px-2.5 py-1 text-xs font-semibold text-[#0066CC] bg-[#F0F7FF] rounded-lg hover:bg-blue-100"
                    >
                      + Attach RoHS Compliance
                    </button>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    {documents.map((doc, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-red-100 text-red-700 font-bold text-[10px]">PDF</div>
                          <div>
                            <div className="font-bold text-slate-900">{doc.name}</div>
                            <div className="text-[11px] text-slate-500">
                              {doc.type} &bull; {doc.size} &bull; {doc.uploadedOn}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setDocuments(documents.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 cursor-pointer">
                    <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <div className="font-semibold text-xs text-slate-800">Upload additional technical documents</div>
                    <p className="text-[11px] text-slate-400 mt-0.5">TDS, MSDS, 2D Part Drawings, CAD STEP models</p>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* STEP 10: REVIEW & SUBMIT + WORKFLOW                      */}
              {/* ========================================================= */}
              {currentStep === 10 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-900">Review &amp; Approval Workflow</h2>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#F0F7FF] text-[#0066CC]">
                      Ready for Submission
                    </span>
                  </div>

                  {/* Summary Review Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Item Identity</div>
                      <div className="font-mono font-bold text-[#0066CC]">{itemCode}</div>
                      <div className="font-bold text-slate-900">{itemName}</div>
                      <div className="text-slate-500 text-[11px]">{selectedType} &bull; {category}</div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Units &amp; Manufacturing</div>
                      <div className="text-slate-800">Base UOM: <strong>{baseUOM}</strong></div>
                      {selectedType === 'Finished Good' ? (
                        <>
                          <div className="text-slate-800 font-mono text-[11px]">
                            Cycle: <strong>{cycleTime}s</strong> &bull; Cavities: <strong>{cavityCount}</strong>
                          </div>
                          <div className="text-[#0066CC] font-mono text-[11px] font-semibold">
                            Part: {partWeight}g + Runner: {runnerWeight}g = Shot: {calculatedSingleShotWeight}g
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-slate-800">MFI: <strong>{mfi} g/10min</strong> &bull; Density: <strong>{density}</strong></div>
                          <div className="text-slate-500 text-[11px]">Resin: {resinType} ({polymerGrade})</div>
                        </>
                      )}
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Inventory &amp; Quality</div>
                      <div className="text-slate-800">Warehouse: <strong>{defaultWarehouse}</strong> ({defaultBin})</div>
                      <div className="text-slate-800">
                        Routing: <strong className={
                          routingDestination === 'DOL' ? 'text-emerald-700 font-bold' :
                          routingDestination === 'ASSEMBLY' ? 'text-purple-700 font-bold' : 'text-amber-700 font-bold'
                        }>
                          {routingDestination === 'DOL' ? 'DOL (FG-STORE)' :
                           routingDestination === 'ASSEMBLY' ? 'ASSEMPLY (ASSEMBLY-STORE)' :
                           'DEFLASH (DEFLASH-STORE)'}
                        </strong>
                      </div>
                      <div className="text-slate-800">Reorder: <strong>{reorderLevel.toLocaleString()} {baseUOM}</strong></div>
                      <div className="text-emerald-700 text-[11px] font-semibold">IQC Mandatory &bull; COA Required</div>
                    </div>
                  </div>

                  {/* Workflow Sign-off Section */}
                  <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-3 text-xs">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <GitPullRequest className="w-4 h-4 text-[#0066CC]" />
                      Master Data Governance &amp; Multi-Tier Sign-Off Route
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Approval Workflow Route</label>
                        <select
                          value={workflowRoute}
                          onChange={(e) => setWorkflowRoute(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                        >
                          <option value="Multi-Tier: Engineering Author -> QA Lead -> Plant Operations Manager">
                            Multi-Tier: Engineering Author &rarr; QA Lead &rarr; Plant Head
                          </option>
                          <option value="Direct Release: QA Director Immediate Approval">
                            Direct Release: QA Director Immediate Approval
                          </option>
                          <option value="Standard Procurement: Sourcing Lead -> Finance Controller">
                            Standard Procurement: Sourcing Lead &rarr; Finance Controller
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Submission Priority</label>
                        <select
                          value={workflowPriority}
                          onChange={(e) => setWorkflowPriority(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                        >
                          <option value="Normal">Normal (48-hour SLA)</option>
                          <option value="Urgent">Urgent (24-hour SLA - Production Scheduled)</option>
                          <option value="Expedited">Expedited (Same-Day Emergency Lot)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Audit Trail Submission Notes</label>
                      <input
                        type="text"
                        value={creationNotes}
                        onChange={(e) => setCreationNotes(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                        placeholder="Describe program, change request, or rationale..."
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Nav Buttons Bar */}
            <div className="pt-5 border-t border-slate-200 flex items-center justify-between mt-6">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Save as draft
                </button>

                {currentStep < 10 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#0066CC] hover:bg-[#0052a3] text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    Continue
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSubmitFinal(true)}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      Save as Active Master
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSubmitFinal(false)}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#0066CC] hover:bg-[#0052a3] text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Submit for Approval
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
