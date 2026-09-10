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
  const [selectedType, setSelectedType] = useState<ItemType>(editItem?.type || 'Raw Material');

  // Step 2: Basic Information
  const [autoGenerateCode, setAutoGenerateCode] = useState<boolean>(!editItem);
  const [itemCode, setItemCode] = useState<string>(editItem?.code || 'RM-PP-NAT-014');
  const [itemName, setItemName] = useState<string>(editItem?.name || 'PP Natural Granules');
  const [category, setCategory] = useState<string>(editItem?.cat || 'Raw Material / PP');
  const [itemGroup, setItemGroup] = useState<string>('Polymer feedstock');
  const [status, setStatus] = useState<string>(editItem?.approval === 'approved' ? 'Active' : 'Pending Approval');
  const [description, setDescription] = useState<string>(
    editItem?.desc || 'Grade, application and processing notes for standard injection molding.'
  );
  const [itemImage, setItemImage] = useState<string | null>(null);

  // Step 3: Units & Conversions
  const [baseUOM, setBaseUOM] = useState<string>(editItem?.baseUOM || 'KG');
  const [purchaseUOM, setPurchaseUOM] = useState<string>('KG');
  const [salesUOM, setSalesUOM] = useState<string>('KG');
  const [stockUOM, setStockUOM] = useState<string>('KG');
  const [productionUOM, setProductionUOM] = useState<string>('KG');
  const [conversions, setConversions] = useState<ConversionRow[]>([
    { id: '1', from: 'KG', to: 'Bag', factor: 25.0 },
    { id: '2', from: 'KG', to: 'Pallet', factor: 1000.0 },
  ]);

  // Step 4: Manufacturing Attributes
  const [resinType, setResinType] = useState<string>(editItem?.resinType || 'Polypropylene (PP)');
  const [polymerGrade, setPolymerGrade] = useState<string>('Repol H110MA');
  const [color, setColor] = useState<string>('Natural');
  const [mfi, setMfi] = useState<string>(editItem?.mfi || '11.0');
  const [density, setDensity] = useState<string>(editItem?.density || '0.905');
  const [additivePercentage, setAdditivePercentage] = useState<string>('1.2');
  const [masterbatchDosage, setMasterbatchDosage] = useState<string>('3.5');
  const [regrindAllowance, setRegrindAllowance] = useState<string>(editItem?.regrind || '20');
  const [moistureSensitive, setMoistureSensitive] = useState<boolean>(editItem?.moistureSensitive ?? true);
  const [processingMethod, setProcessingMethod] = useState<string>('Injection Molding');

  // Step 5: Inventory Settings
  const [lotControlled, setLotControlled] = useState<boolean>(editItem?.lot ?? true);
  const [expiryControlled, setExpiryControlled] = useState<boolean>(true);
  const [fefoPicking, setFefoPicking] = useState<boolean>(true);
  const [shelfLifeDays, setShelfLifeDays] = useState<number>(365);
  const [defaultWarehouse, setDefaultWarehouse] = useState<string>(editItem?.wh || 'RM-WH-01');
  const [defaultBin, setDefaultBin] = useState<string>(editItem?.locationCode || 'A-01-03');
  const [reorderLevel, setReorderLevel] = useState<number>(
    editItem?.reorderLevel ? parseInt(editItem.reorderLevel) : 10000
  );
  const [safetyStock, setSafetyStock] = useState<number>(
    editItem?.safetyStock ? parseInt(editItem.safetyStock) : 6000
  );

  // Step 6: Quality Settings
  const [iqcMandatory, setIqcMandatory] = useState<boolean>(editItem?.qc ?? true);
  const [coaRequired, setCoaRequired] = useState<boolean>(true);
  const [samplingPlan, setSamplingPlan] = useState<string>('ISO 2859-1 Level II Normal');
  const [approvedLab, setApprovedLab] = useState<string>('In-House Spectrophotometer & MFI Lab');
  const [qualityTestParams, setQualityTestParams] = useState<string[]>([
    'Melt Flow Index (ASTM D1238)',
    'Density Gradient (ASTM D792)',
    'Moisture Content PPM (Karl Fischer)',
  ]);

  // Step 7: Purchasing
  const [preferredSupplier, setPreferredSupplier] = useState<string>(
    editItem?.supplier || 'Reliance Industries Ltd'
  );
  const [standardPurchasePrice, setStandardPurchasePrice] = useState<number>(112.5);
  const [hsnCode, setHsnCode] = useState<string>(editItem?.hsCode || '39021000');
  const [leadTimeDays, setLeadTimeDays] = useState<number>(editItem?.leadTime ? parseInt(editItem.leadTime) : 7);
  const [purchaseMoq, setPurchaseMoq] = useState<number>(5000);
  const [gstRate, setGstRate] = useState<string>('18%');

  // Step 8: Sales
  const [standardSalesPrice, setStandardSalesPrice] = useState<number>(145.0);
  const [priceTier, setPriceTier] = useState<string>('Tier 1 OEM Standard');
  const [salesMoq, setSalesMoq] = useState<number>(1000);
  const [packagingStandard, setPackagingStandard] = useState<string>(
    '25 KG Moisture Barrier Paper Bags on Shrink-Wrapped Wooden Pallets'
  );

  // Step 9: Documents
  const [documents, setDocuments] = useState<
    { name: string; type: string; size: string; uploadedOn: string }[]
  >([
    { name: 'TDS_PP_Repol_H110MA_v3.pdf', type: 'Technical Data Sheet (TDS)', size: '1.2 MB', uploadedOn: 'Today' },
    { name: 'MSDS_Polypropylene_Homopolymer_2026.pdf', type: 'Material Safety Data Sheet (MSDS)', size: '2.4 MB', uploadedOn: 'Today' },
  ]);

  // Step 10: Review & Workflow
  const [workflowRoute, setWorkflowRoute] = useState<string>(
    'Multi-Tier: Engineering Author -> QA Lead -> Plant Operations Manager'
  );
  const [workflowPriority, setWorkflowPriority] = useState<'Normal' | 'Urgent' | 'Expedited'>('Normal');
  const [creationNotes, setCreationNotes] = useState<string>(
    'New masterbatch & resin qualification for Tier-1 automotive bumper program.'
  );

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

  // Auto-save timer simulation
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setLastAutoSaveTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    }, 30000);
    return () => clearInterval(timer);
  }, []);

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
      standardCycleTime: selectedType === 'Finished Good' ? 14 : 0,
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

            {/* Bottom Left Timestamp Status */}
            <div className="pt-4 border-t border-slate-100 text-[11px] font-mono text-slate-400">
              Auto-saved {lastAutoSaveTime} &bull; draft {itemCode}
            </div>
          </div>

          {/* Right Column (3 Cols): Main Step Form Content */}
          <div className="md:col-span-3 p-6 flex flex-col justify-between overflow-y-auto max-h-[640px] bg-white">
            <div className="space-y-5">
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
                      <div className="text-slate-800">MFI: <strong>{mfi} g/10min</strong> &bull; Density: <strong>{density}</strong></div>
                      <div className="text-slate-500 text-[11px]">Resin: {resinType} ({polymerGrade})</div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Inventory &amp; Quality</div>
                      <div className="text-slate-800">Warehouse: <strong>{defaultWarehouse}</strong> ({defaultBin})</div>
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
