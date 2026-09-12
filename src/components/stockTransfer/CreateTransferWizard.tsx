import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeftRight,
  Truck,
  RotateCcw,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Search,
  Barcode,
  Printer,
  ShieldCheck,
  Calendar,
  Building2,
  Layers,
  FileText,
  User,
  Clock,
  Info,
  QrCode,
  Sparkles,
} from 'lucide-react';
import {
  TransferType,
  MaterialType,
  StockTransferItem,
  AssetMoldItem,
  StockTransferRecord,
  LogisticsDetails,
  PlantMaster,
  StoreMaster,
  UserRolePerspective,
} from '../../types/stockTransferTypes';
import {
  MASTER_PLANTS,
  MASTER_STORES,
  MASTER_ITEMS_CATALOG,
  MASTER_MOLDS_CATALOG,
} from '../../data/stockTransferData';

interface CreateTransferWizardProps {
  initialType?: TransferType;
  preselectedType?: TransferType;
  preselectedAsset?: AssetMoldItem;
  currentUserRole?: UserRolePerspective;
  onSaveTransfer: (transfer: StockTransferRecord, action?: 'DRAFT' | 'DISPATCH') => void;
  onCancel: () => void;
  showToast: (msg: string) => void;
}

export const CreateTransferWizard: React.FC<CreateTransferWizardProps> = ({
  initialType,
  preselectedType,
  preselectedAsset,
  currentUserRole = 'Logistics & Dispatch Manager',
  onSaveTransfer,
  onCancel,
  showToast,
}) => {
  const effectiveInitialType = initialType || preselectedType || 'INTRA_PLANT';
  // Wizard Navigation Step (1 to 4)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Transfer Context & Type
  const [transferType, setTransferType] = useState<TransferType>(effectiveInitialType);

  // Step 2: Source & Destination
  const [fromPlantId, setFromPlantId] = useState<string>('PLANT-01');
  const [fromStoreId, setFromStoreId] = useState<string>('STR-PMP-RM');
  const [toPlantId, setToPlantId] = useState<string>('PLANT-01');
  const [toStoreId, setToStoreId] = useState<string>('STR-PMP-HOP');
  const [transferDate, setTransferDate] = useState<string>('2026-09-12');
  const [transferTime, setTransferTime] = useState<string>('10:30');
  const [priority, setPriority] = useState<'Routine' | 'Urgent' | 'Line Stoppage'>('Routine');
  const [requestedBy, setRequestedBy] = useState<string>('Shop Floor Supervisor Line 2');
  const [department, setDepartment] = useState<string>('Injection Molding Operations');
  const [remarks, setRemarks] = useState<string>('');

  // Step 3: Items, Batches or Assets
  const [selectedItems, setSelectedItems] = useState<StockTransferItem[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<AssetMoldItem | null>(preselectedAsset || null);
  const [itemSearchQuery, setItemSearchQuery] = useState<string>('');
  const [barcodeInput, setBarcodeInput] = useState<string>('');

  // Step 4: Logistics & Indian Tax Compliance
  const [vehicleNumber, setVehicleNumber] = useState<string>('MH-12-RN-8833');
  const [transportMode, setTransportMode] = useState<'Road' | 'Rail' | 'Air'>('Road');
  const [transporterName, setTransporterName] = useState<string>('VRL Logistics Express');
  const [transporterGstin, setTransporterGstin] = useState<string>('27AABCV1234F1Z1');
  const [driverName, setDriverName] = useState<string>('Kashinath Pawar');
  const [driverMobile, setDriverMobile] = useState<string>('+91 98223 99120');
  const [lrNumber, setLrNumber] = useState<string>('LR-PUN-2026-904');
  const [taxDocType, setTaxDocType] = useState<'Stock Transfer Delivery Challan' | 'Tax Invoice'>('Stock Transfer Delivery Challan');
  const [eWayBillRequired, setEWayBillRequired] = useState<boolean>(true);
  const [manualAssessableOverride, setManualAssessableOverride] = useState<boolean>(false);
  const [customAssessableValue, setCustomAssessableValue] = useState<number>(0);
  const [overrideReason, setOverrideReason] = useState<string>('');

  // Print Preview Modal State
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // Unique Number Generation
  const generatedTransferId = useMemo(() => {
    const year = '2026';
    const rand = Math.floor(10000 + Math.random() * 90000);
    switch (transferType) {
      case 'INTRA_PLANT':
        return `ISTN-${year}-${rand}`;
      case 'INTER_PLANT':
        return `XSTN-${year}-${rand}`;
      case 'RETURNABLE_DC':
        return `RDC-${year}-${rand}`;
      case 'ASSET_MOLD':
        return `ATN-${year}-${rand}`;
    }
  }, [transferType]);

  // Adjust source/dest when transfer type changes
  useEffect(() => {
    if (transferType === 'INTRA_PLANT') {
      setToPlantId(fromPlantId);
      const plantStores = MASTER_STORES.filter((s) => s.plantId === fromPlantId);
      if (plantStores.length > 1) {
        setToStoreId(plantStores[1].id);
      }
    } else if (transferType === 'INTER_PLANT') {
      if (toPlantId === fromPlantId) {
        const otherPlant = MASTER_PLANTS.find((p) => p.id !== fromPlantId);
        if (otherPlant) setToPlantId(otherPlant.id);
      }
    } else if (transferType === 'RETURNABLE_DC') {
      // Pick returnable packaging store
      const retStore = MASTER_STORES.find((s) => s.plantId === fromPlantId && s.type === 'Returnable Packaging Store');
      if (retStore) setFromStoreId(retStore.id);
    } else if (transferType === 'ASSET_MOLD') {
      // Pick tool room
      const toolStore = MASTER_STORES.find((s) => s.plantId === fromPlantId && s.type === 'Tool Room');
      if (toolStore) setFromStoreId(toolStore.id);
      if (!selectedAsset && MASTER_MOLDS_CATALOG.length > 0) {
        setSelectedAsset(MASTER_MOLDS_CATALOG[0]);
      }
    }
  }, [transferType, fromPlantId]);

  // When plant changes in Inter-Plant, default to store to destination transit store
  useEffect(() => {
    if (transferType === 'INTER_PLANT') {
      const destTransit = MASTER_STORES.find((s) => s.plantId === toPlantId && s.isTransitStore);
      if (destTransit) {
        setToStoreId(destTransit.id);
      } else {
        const destStores = MASTER_STORES.filter((s) => s.plantId === toPlantId);
        if (destStores.length > 0) setToStoreId(destStores[0].id);
      }
    }
  }, [toPlantId, transferType]);

  // Dynamic Store Selection Logic (Screen 3 Rules)
  const fromPlant = MASTER_PLANTS.find((p) => p.id === fromPlantId) || MASTER_PLANTS[0];
  const toPlant = MASTER_PLANTS.find((p) => p.id === toPlantId) || MASTER_PLANTS[0];

  const availableFromStores = useMemo(() => {
    return MASTER_STORES.filter((s) => s.plantId === fromPlantId && s.canIssue);
  }, [fromPlantId]);

  const availableToStores = useMemo(() => {
    return MASTER_STORES.filter((s) => s.plantId === toPlantId && s.canReceive);
  }, [toPlantId]);

  const activeFromStore = MASTER_STORES.find((s) => s.id === fromStoreId);
  const activeToStore = MASTER_STORES.find((s) => s.id === toStoreId);

  // Incompatibility Warning Logic (Rule 2: e.g. RM to FG Store)
  const storeCompatibilityWarning = useMemo(() => {
    if (!activeFromStore || !activeToStore) return null;

    if (transferType === 'ASSET_MOLD') {
      return null;
    }

    const hasRmInItems = selectedItems.some((i) => i.materialType === 'RM');
    const hasFgInItems = selectedItems.some((i) => i.materialType === 'FG');

    if (
      (activeFromStore.type === 'RM Store' || hasRmInItems) &&
      activeToStore.type === 'FG Store'
    ) {
      return 'Warning: Transferring Raw Material to a Finished Goods store. Please confirm reason and QA approval.';
    }

    if (
      (activeFromStore.type === 'FG Store' || hasFgInItems) &&
      (activeToStore.type === 'RM Store' || activeToStore.type === 'Machine Hopper')
    ) {
      return 'Warning: Transferring Finished Goods to a Raw Material Store/Hopper. Potential segregation breach.';
    }

    if (
      activeFromStore.type === 'Returnable Packaging Store' &&
      activeToStore.type === 'Machine Hopper'
    ) {
      return 'Warning: Returnable packaging cannot be routed directly to machine injection hoppers.';
    }

    return null;
  }, [activeFromStore, activeToStore, selectedItems, transferType]);

  // Inter-Plant Tax Calculation (Screen 4 Rules)
  // Distance calculation mock: Pimpri <-> Chakan = 34km, Pimpri <-> Sanand = 645km
  const calculatedDistance = useMemo(() => {
    if (fromPlant.city === toPlant.city) return 34;
    if (fromPlant.state === toPlant.state) return 55;
    return 645;
  }, [fromPlant, toPlant]);

  const isInterState = fromPlant.stateCode !== toPlant.stateCode;

  // Auto-calculated assessable value from standard costs
  const baseAssessableValue = useMemo(() => {
    if (transferType === 'ASSET_MOLD') {
      return selectedAsset?.insuranceDeclaredValue || 4500000;
    }
    if (transferType === 'RETURNABLE_DC') {
      return 0; // zero / notional valuation for returnable assets
    }
    return selectedItems.reduce((sum, item) => sum + item.transferQty * item.standardCost, 0);
  }, [selectedItems, selectedAsset, transferType]);

  const effectiveAssessableValue = manualAssessableOverride
    ? customAssessableValue
    : baseAssessableValue;

  // Tax calculations
  const taxCalculations = useMemo(() => {
    if (transferType === 'INTRA_PLANT' || transferType === 'ASSET_MOLD' || transferType === 'RETURNABLE_DC') {
      return { cgst: 0, sgst: 0, igst: 0, totalTax: 0, grandTotal: effectiveAssessableValue };
    }

    // Inter-Plant Delivery Challan / Tax Invoice
    const gstRate = 18; // standard 18% polymer rate
    if (isInterState) {
      const igst = Math.round(effectiveAssessableValue * (gstRate / 100));
      return {
        cgst: 0,
        sgst: 0,
        igst,
        totalTax: igst,
        grandTotal: effectiveAssessableValue + igst,
      };
    } else {
      const cgst = Math.round(effectiveAssessableValue * (gstRate / 200));
      const sgst = Math.round(effectiveAssessableValue * (gstRate / 200));
      return {
        cgst,
        sgst,
        igst: 0,
        totalTax: cgst + sgst,
        grandTotal: effectiveAssessableValue + cgst + sgst,
      };
    }
  }, [effectiveAssessableValue, isInterState, transferType]);

  // Add Item to Line Grid
  const handleAddItem = (catalogItem: StockTransferItem) => {
    if (selectedItems.some((i) => i.itemCode === catalogItem.itemCode)) {
      showToast(`Item ${catalogItem.itemCode} is already added in line items.`);
      return;
    }
    setSelectedItems((prev) => [
      ...prev,
      {
        ...catalogItem,
        transferQty: catalogItem.transferQty || 100,
        netWeightKg: catalogItem.netWeightKg || 100,
      },
    ]);
    showToast(`Added ${catalogItem.itemCode} to transfer list`);
  };

  const handleRemoveItem = (id: string) => {
    setSelectedItems((prev) => (prev || []).filter((i) => i.id !== id));
  };

  const handleUpdateItemQty = (id: string, qty: number) => {
    setSelectedItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, transferQty: Math.max(1, qty) } : i))
    );
  };

  // Barcode Scanner Handler
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    if (transferType === 'ASSET_MOLD') {
      const foundMold = MASTER_MOLDS_CATALOG.find(
        (m) =>
          m.assetId.toLowerCase() === barcodeInput.trim().toLowerCase() ||
          m.serialNumber.toLowerCase().includes(barcodeInput.trim().toLowerCase())
      );
      if (foundMold) {
        setSelectedAsset(foundMold);
        showToast(`Asset identified: ${foundMold.assetId} - ${foundMold.moldName}`);
        setBarcodeInput('');
        return;
      }
    }

    const foundItem = MASTER_ITEMS_CATALOG.find(
      (i) =>
        i.itemCode.toLowerCase() === barcodeInput.trim().toLowerCase() ||
        i.batchLotNumber.toLowerCase().includes(barcodeInput.trim().toLowerCase())
    );

    if (foundItem) {
      handleAddItem(foundItem);
      setBarcodeInput('');
    } else {
      showToast(`Scan Error: No matching item or batch found for "${barcodeInput}"`);
    }
  };

  // Dispatch / Save Handlers
  const handleDispatchAction = (actionType: 'DRAFT' | 'DISPATCH') => {
    // Validation
    if (transferType !== 'ASSET_MOLD' && selectedItems.length === 0) {
      showToast('Please add at least one line item to transfer.');
      return;
    }
    if (transferType === 'ASSET_MOLD' && !selectedAsset) {
      showToast('Please select a mold/asset for transfer.');
      return;
    }

    // Step 4 Inter-Plant Validation Rule:
    if (transferType === 'INTER_PLANT' && actionType === 'DISPATCH') {
      if (calculatedDistance > 50 && !vehicleNumber.trim()) {
        showToast('Validation Error: Vehicle Number is mandatory for Inter-Plant movements > 50km.');
        return;
      }
    }

    const newRecord: StockTransferRecord = {
      id: generatedTransferId,
      transferType,
      status:
        actionType === 'DRAFT'
          ? 'Draft'
          : transferType === 'INTRA_PLANT'
          ? 'Picked / Staged'
          : 'Dispatched / In Transit',
      assetStatus:
        transferType === 'ASSET_MOLD'
          ? actionType === 'DRAFT'
            ? 'In Tool Room'
            : 'In Transit'
          : undefined,
      createdDate: transferDate,
      createdTime: transferTime + ':00',
      createdBy: 'Current User',
      requestedBy,
      department,
      priority,
      fromPlantId,
      fromPlantName: fromPlant.name,
      fromStoreId,
      fromStoreName: activeFromStore?.name || '',
      toPlantId,
      toPlantName: toPlant.name,
      toStoreId,
      toStoreName: activeToStore?.name || '',
      items: selectedItems,
      assetDetails: transferType === 'ASSET_MOLD' && selectedAsset ? selectedAsset : undefined,
      logistics:
        transferType !== 'INTRA_PLANT'
          ? {
              vehicleNumber,
              transportMode,
              transporterName,
              transporterGstin,
              driverName,
              driverMobile,
              lrNumber,
              lrDate: transferDate,
              distanceKm: calculatedDistance,
              eWayBillRequired,
              eWayBillNumber: eWayBillRequired ? `2410${Math.floor(10000000 + Math.random() * 90000000)}` : undefined,
              eWayBillDate: `${transferDate} ${transferTime}:00`,
              eWayBillValidUntil: '2026-09-14 23:59:59',
              eWayBillStatus: eWayBillRequired ? 'Generated' : 'Not Applicable',
              taxDocType,
              assessableValue: effectiveAssessableValue,
              cgstAmount: taxCalculations.cgst,
              sgstAmount: taxCalculations.sgst,
              igstAmount: taxCalculations.igst,
              totalTaxAmount: taxCalculations.totalTax,
              grandTotalValue: taxCalculations.grandTotal,
              hsnSummary: [
                {
                  hsnCode: selectedItems[0]?.hsnCode || '39021000',
                  taxableValue: effectiveAssessableValue,
                  gstRate: 18,
                  cgst: taxCalculations.cgst,
                  sgst: taxCalculations.sgst,
                  igst: taxCalculations.igst,
                },
              ],
            }
          : undefined,
      remarks,
      gatePassNumber: `${transferType === 'ASSET_MOLD' ? 'ATN' : 'GP'}-${Math.floor(10000 + Math.random() * 90000)}`,
      auditTrail: [
        {
          id: `AUD-${Date.now()}`,
          timestamp: `${transferDate} ${transferTime}:00`,
          userName: 'Current User',
          userRole: currentUserRole,
          action: actionType === 'DRAFT' ? 'Created' : 'Dispatched',
          location: `${fromPlant.name} - ${activeFromStore?.name}`,
          deviceIp: '192.168.1.144 (Secure Terminal)',
          changesMade: `${actionType === 'DRAFT' ? 'Saved draft' : 'Dispatched'} transfer note ${generatedTransferId}`,
        },
      ],
    };

    onSaveTransfer(newRecord, actionType);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Wizard Header with Auto-Generated Transfer Number */}
      <div className="bg-slate-900 text-white p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 font-mono">
              {generatedTransferId}
            </span>
            <span className="text-xs text-slate-400">Context-Aware Stock Movement Engine</span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1">Create Stock Transfer &amp; Logistics Note</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Auto-adjusts fields, tax calculations, and compliance rules based on movement context.
          </p>
        </div>

        {/* 4-Step Progress Indicator */}
        <div className="flex items-center gap-1.5 self-stretch md:self-auto overflow-x-auto pb-1 md:pb-0">
          {[
            { num: 1, label: 'Context & Type' },
            { num: 2, label: 'Source & Dest' },
            { num: 3, label: 'Items & Assets' },
            { num: 4, label: 'Logistics & Review' },
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => s.num < currentStep && setCurrentStep(s.num)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                currentStep === s.num
                  ? 'bg-blue-600 text-white shadow-sm'
                  : currentStep > s.num
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'bg-slate-800/50 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  currentStep === s.num
                    ? 'bg-white text-blue-600'
                    : currentStep > s.num
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {currentStep > s.num ? '✓' : s.num}
              </span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="p-6">
        {/* ================= STEP 1: Transfer Context & Type ================= */}
        {currentStep === 1 && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="text-center max-w-xl mx-auto">
              <h3 className="text-base font-bold text-slate-900">Select Movement Paradigm</h3>
              <p className="text-xs text-slate-500 mt-1">
                Choose the operational paradigm. The wizard will automatically reconfigure field rules,
                statutory tax parameters, and receiving requirements.
              </p>
            </div>

            {/* 4 Large Visual Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Intra-Plant */}
              <div
                onClick={() => setTransferType('INTRA_PLANT')}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  transferType === 'INTRA_PLANT'
                    ? 'border-blue-600 bg-blue-50/40 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700">
                      <ArrowLeftRight className="w-5 h-5" />
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      ISTN-YYYY-XXXXX
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-3">1. Standard Intra-Plant Transfer</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Store-to-store movements within the same manufacturing plant (e.g. RM Silo to Machine Hopper,
                    WIP Floor Holding to FG Store).
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Tax &amp; E-Way Bill: <strong>Exempt (No Tax)</strong></span>
                  <span className="text-blue-700 font-semibold">Immediate Execution &rarr;</span>
                </div>
              </div>

              {/* 2. Inter-Plant */}
              <div
                onClick={() => setTransferType('INTER_PLANT')}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  transferType === 'INTER_PLANT'
                    ? 'border-blue-600 bg-blue-50/40 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700">
                      <Truck className="w-5 h-5" />
                    </div>
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      XSTN-YYYY-XXXXX
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-3">2. Inter-Plant Transfer (Facility-to-Facility)</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Moving inventory from Plant A to Plant B (e.g. Pimpri Auto Unit to Sanand Packaging Facility).
                    Enforces statutory Indian GST Delivery Challan, E-Way Bill, and logistics tracking.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-amber-700 font-medium">Triggers GST Delivery Challan &amp; EWB</span>
                  <span className="text-indigo-700 font-semibold">Statutory Tracking &rarr;</span>
                </div>
              </div>

              {/* 3. Returnable DC */}
              <div
                onClick={() => setTransferType('RETURNABLE_DC')}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  transferType === 'RETURNABLE_DC'
                    ? 'border-teal-600 bg-teal-50/40 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-700">
                      <RotateCcw className="w-5 h-5" />
                    </div>
                    <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                      RDC-YYYY-XXXXX
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-3">3. Returnable Delivery Challan (Packaging)</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Dispatching returnable packaging (heavy duty plastic pallets, steel wire bins, 200L polymer drums)
                    to customers or sister plants that must be tracked and returned within aging limits.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Valuation: <strong>Zero / Notional Tax Basis</strong></span>
                  <span className="text-teal-700 font-semibold">Lifecycle Aging &rarr;</span>
                </div>
              </div>

              {/* 4. Asset / Mold Transfer */}
              <div
                onClick={() => setTransferType('ASSET_MOLD')}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  transferType === 'ASSET_MOLD'
                    ? 'border-purple-600 bg-purple-50/40 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                      ATN-YYYY-XXXXX
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-3">4. Asset / Mold Transfer (Tooling &amp; Machinery)</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Relocating static capital assets: Injection Molds, Extrusion Dies, and Auxiliary Equipment.
                    Tracks serial tags, shot counts, maintenance status, and requires Tool Room digital sign-off.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-purple-700 font-medium">Updates Mold Passport &amp; Asset Registry</span>
                  <span className="text-purple-700 font-semibold">Engineering Protocol &rarr;</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 2: Source & Destination (Screen 3 Dynamic Logic) ================= */}
        {currentStep === 2 && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div>
              <h3 className="text-base font-bold text-slate-900">Source &amp; Destination Stores</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Dynamic contextual filtering enforces compatibility rules between Plant locations and Store types.
              </p>
            </div>

            {/* Incompatible Store Warning (Inline UX Rule from Section 4) */}
            {storeCompatibilityWarning && (
              <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2.5 text-amber-900 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">{storeCompatibilityWarning}</div>
                  <div className="text-[11px] text-amber-700 mt-0.5">
                    Operational protocol advises routing raw materials only to RM Stores, WIP holding, or Machine Hoppers.
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              {/* SOURCE SECTION */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  Originating Point (Source)
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">From Plant</label>
                  <select
                    value={fromPlantId}
                    onChange={(e) => setFromPlantId(e.target.value)}
                    disabled={transferType === 'INTRA_PLANT'}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-600"
                  >
                    {MASTER_PLANTS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.name} ({p.state})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    From Store (Issue Rights Only)
                  </label>
                  <select
                    value={fromStoreId}
                    onChange={(e) => setFromStoreId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    {availableFromStores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} | {s.name} ({s.type})
                      </option>
                    ))}
                  </select>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Store Type: <span className="font-semibold text-slate-700">{activeFromStore?.type}</span>
                  </div>
                </div>
              </div>

              {/* DESTINATION SECTION */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  Receiving Point (Destination)
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">To Plant</label>
                  <select
                    value={toPlantId}
                    onChange={(e) => setToPlantId(e.target.value)}
                    disabled={transferType === 'INTRA_PLANT'}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-600"
                  >
                    {MASTER_PLANTS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.name} ({p.state})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    To Store (Receipt Rights Only)
                  </label>
                  <select
                    value={toStoreId}
                    onChange={(e) => setToStoreId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    {availableToStores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} | {s.name} ({s.type}) {s.isTransitStore ? '★ Default Transit' : ''}
                      </option>
                    ))}
                  </select>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Store Type: <span className="font-semibold text-slate-700">{activeToStore?.type}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Transfer Metadata Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Transfer Date</label>
                <input
                  type="date"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Transfer Time</label>
                <input
                  type="time"
                  value={transferTime}
                  onChange={(e) => setTransferTime(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium"
                >
                  <option value="Routine">Routine</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Line Stoppage">Line Stoppage (Emergency)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Requested By</label>
                <input
                  type="text"
                  value={requestedBy}
                  onChange={(e) => setRequestedBy(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Internal Purpose &amp; Remarks</label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Reason for transfer, work order reference, or customer lot requirements..."
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900"
              />
            </div>
          </div>
        )}

        {/* ================= STEP 3: Items, Batches, or Assets ================= */}
        {currentStep === 3 && (
          <div className="space-y-6">
            {transferType === 'ASSET_MOLD' ? (
              /* Asset & Mold Selection View */
              <div className="space-y-5 max-w-4xl mx-auto">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Select Tooling / Mold Asset</h3>
                    <p className="text-xs text-slate-500">
                      Static tangible assets are tracked by Serial Number and Tool Passport, not standard consumption.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {MASTER_MOLDS_CATALOG.map((m) => (
                    <div
                      key={m.assetId}
                      onClick={() => setSelectedAsset(m)}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        selectedAsset?.assetId === m.assetId
                          ? 'border-purple-600 bg-purple-50/40 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                            {m.assetId}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              m.maintenanceStatus === 'OK'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {m.maintenanceStatus}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900">{m.moldName}</h4>
                        <div className="text-[11px] text-slate-500 font-mono">SN: {m.serialNumber}</div>
                        <div className="text-[11px] text-slate-600">
                          Cavities: <strong>{m.cavities}</strong> | Tonnage: <strong>{m.tonnageRequired}</strong>
                        </div>
                        <div className="text-[11px] text-slate-600">
                          Shot Count:{' '}
                          <strong className="text-slate-800">
                            {m.currentShotCount.toLocaleString()} / {m.ratedShotLife.toLocaleString()}
                          </strong>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500 flex justify-between items-center">
                        <span>Insurance: ₹{(m.insuranceDeclaredValue / 100000).toFixed(1)} Lakh</span>
                        <span className="font-bold text-purple-700">
                          {selectedAsset?.assetId === m.assetId ? '✓ Selected' : 'Select'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedAsset && (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-purple-900">
                      <Wrench className="w-4 h-4 text-purple-700" />
                      Active Mold Passport Details: {selectedAsset.moldName}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500">Declared Insurance Value:</span>
                        <div className="font-bold text-slate-900">
                          ₹{selectedAsset.insuranceDeclaredValue.toLocaleString('en-IN')}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500">Last Preventative Maintenance:</span>
                        <div className="font-bold text-slate-900">{selectedAsset.lastMaintenanceDate}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Compatible Presses:</span>
                        <div className="font-medium text-slate-800 text-[11px]">
                          {selectedAsset.compatibleMachines.join(', ')}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-purple-800 bg-purple-100/50 p-2.5 rounded-lg border border-purple-200">
                      <strong>Rigging &amp; Transport Directive:</strong> {selectedAsset.transportInstructions}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Standard / Returnable Material Item Grid */
              <div className="space-y-4">
                {/* Search & Barcode Quick Add Toolbar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="relative w-full md:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search code, polymer grade, batch..."
                      value={itemSearchQuery}
                      onChange={(e) => setItemSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Barcode Scanner Simulator Input */}
                  <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                      <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Scan barcode / LOT tag..."
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold whitespace-nowrap shadow-2xs"
                    >
                      Scan Add
                    </button>
                  </form>
                </div>

                {/* Quick Catalog Picker Dropdown / Suggestions */}
                <div className="border border-slate-200 rounded-xl p-3 bg-white">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Available Catalog Items (Click to Add to Line Grid):
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {MASTER_ITEMS_CATALOG.filter((i) =>
                      itemSearchQuery
                        ? i.itemName.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
                          i.itemCode.toLowerCase().includes(itemSearchQuery.toLowerCase())
                        : true
                    ).map((catItem) => (
                      <button
                        key={catItem.id}
                        type="button"
                        onClick={() => handleAddItem(catItem)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/50 text-left text-xs transition-colors flex items-center gap-2"
                      >
                        <span className="font-mono font-bold text-blue-700">{catItem.itemCode}</span>
                        <span className="text-slate-700 max-w-xs truncate">{catItem.itemName}</span>
                        <span className="text-[10px] text-slate-400">({catItem.uom})</span>
                        <Plus className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected Transfer Lines Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Transfer Line Items ({selectedItems.length})
                    </span>
                    <span className="text-xs text-slate-500">
                      Total Weight:{' '}
                      <strong className="text-slate-800">
                        {selectedItems.reduce((acc, i) => acc + (i.transferQty * 1), 0)} KG
                      </strong>
                    </span>
                  </div>

                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 font-bold">Item Code &amp; Description</th>
                        <th className="py-2.5 px-3 font-bold">Type</th>
                        <th className="py-2.5 px-3 font-bold">Batch / Lot #</th>
                        <th className="py-2.5 px-3 font-bold">Pick Bin</th>
                        <th className="py-2.5 px-3 font-bold text-right">Avail. Qty</th>
                        <th className="py-2.5 px-3 font-bold text-right w-28">Transfer Qty</th>
                        <th className="py-2.5 px-3 font-bold">UOM</th>
                        <th className="py-2.5 px-3 font-bold text-right">Standard Cost</th>
                        <th className="py-2.5 px-3 font-bold text-right">Total (₹)</th>
                        <th className="py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedItems.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-8 text-center text-slate-400">
                            No items added yet. Search or click above catalog items to add to transfer.
                          </td>
                        </tr>
                      ) : (
                        selectedItems.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3">
                              <div className="font-mono font-bold text-blue-700">{item.itemCode}</div>
                              <div className="text-[11px] text-slate-600">{item.itemName}</div>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                                {item.materialType}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">
                              {item.batchLotNumber}
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-slate-600 font-mono">
                              {item.pickLocation}
                            </td>
                            <td className="py-2.5 px-3 text-right font-medium text-slate-600">
                              {item.availableStock.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <input
                                type="number"
                                min={1}
                                max={item.availableStock}
                                value={item.transferQty}
                                onChange={(e) =>
                                  handleUpdateItemQty(item.id, parseFloat(e.target.value) || 0)
                                }
                                className="w-24 text-right bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold text-slate-900 focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-700">{item.uom}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                              ₹{item.standardCost.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                              ₹{(item.transferQty * item.standardCost).toLocaleString('en-IN')}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= STEP 4: Logistics, Tax & Review (Screen 4 Rules) ================= */}
        {currentStep === 4 && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div>
              <h3 className="text-base font-bold text-slate-900">Logistics, Statutory Tax &amp; Final Review</h3>
              <p className="text-xs text-slate-500">
                GST Delivery Challan / E-Way Bill generation rules applied based on distance and route state codes.
              </p>
            </div>

            {/* Intra-Plant Mode Simple Notification */}
            {transferType === 'INTRA_PLANT' ? (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2 text-xs text-blue-900">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" /> Standard Intra-Plant Movement (Non-Taxable)
                </div>
                <div>
                  No GST Delivery Challan or E-Way Bill is required for internal store-to-store movements within the same
                  facility premises. Stock balances will transfer directly upon staging pick confirmation.
                </div>
              </div>
            ) : (
              /* Inter-Plant / Returnable / Asset Tax & Logistics Panel (Screen 4) */
              <div className="space-y-5">
                {/* Logistics Input Grid */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Logistics &amp; Fleet Allocation
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Vehicle Number <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={vehicleNumber}
                        onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                        placeholder="e.g. MH-12-RN-8833"
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Transport Mode</label>
                      <select
                        value={transportMode}
                        onChange={(e) => setTransportMode(e.target.value as any)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium"
                      >
                        <option value="Road">Road (Truck / Trailer)</option>
                        <option value="Rail">Rail Freight</option>
                        <option value="Air">Air Express</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Transporter Name</label>
                      <input
                        type="text"
                        value={transporterName}
                        onChange={(e) => setTransporterName(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Transporter GSTIN</label>
                      <input
                        type="text"
                        value={transporterGstin}
                        onChange={(e) => setTransporterGstin(e.target.value.toUpperCase())}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Driver Name</label>
                      <input
                        type="text"
                        value={driverName}
                        onChange={(e) => setDriverName(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Driver Mobile</label>
                      <input
                        type="text"
                        value={driverMobile}
                        onChange={(e) => setDriverMobile(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">LR / Bilty Number</label>
                      <input
                        type="text"
                        value={lrNumber}
                        onChange={(e) => setLrNumber(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Transit Distance (KM)
                      </label>
                      <div className="p-2 bg-slate-100 rounded-lg text-xs font-bold text-slate-800 font-mono">
                        {calculatedDistance} KM (Auto-Calculated via Pincode)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tax & Statutory Document Section */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Statutory GST &amp; Valuation Details
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-600 font-medium flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={eWayBillRequired}
                          onChange={(e) => setEWayBillRequired(e.target.checked)}
                          className="rounded text-blue-600"
                        />
                        Generate E-Way Bill on Dispatch
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Tax Document Type
                      </label>
                      <select
                        value={taxDocType}
                        onChange={(e) => setTaxDocType(e.target.value as any)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900"
                      >
                        <option value="Stock Transfer Delivery Challan">
                          Stock Transfer Delivery Challan (Same GSTIN / Branch)
                        </option>
                        <option value="Tax Invoice">Tax Invoice (Cross Charge / Distinct Person)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Assessable Value Basis
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          disabled={!manualAssessableOverride}
                          value={effectiveAssessableValue}
                          onChange={(e) => setCustomAssessableValue(parseFloat(e.target.value) || 0)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 disabled:bg-slate-100"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setManualAssessableOverride(!manualAssessableOverride);
                            if (!manualAssessableOverride) setCustomAssessableValue(baseAssessableValue);
                          }}
                          className="px-2 py-2 text-[11px] font-bold rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 whitespace-nowrap"
                        >
                          {manualAssessableOverride ? 'Auto Calc' : 'Override'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">GST Tax Jurisdiction</label>
                      <div className="p-2 bg-white border border-slate-200 rounded-lg text-xs">
                        {isInterState ? (
                          <span className="font-bold text-indigo-700">
                            Inter-State (IGST 18%) : {fromPlant.state} &rarr; {toPlant.state}
                          </span>
                        ) : (
                          <span className="font-bold text-emerald-700">
                            Intra-State (CGST 9% + SGST 9%) : {fromPlant.state}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {manualAssessableOverride && (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Reason for Manual Valuation Override <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        placeholder="e.g., Transfer pricing agreement schedule 4, or zero notional packaging asset..."
                        className="w-full bg-white border border-amber-300 rounded-lg px-3 py-2 text-xs text-slate-900"
                      />
                    </div>
                  )}

                  {/* Summary Tax Amounts */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-slate-500">Assessable Value:</span>
                      <div className="font-mono font-bold text-slate-900 mt-0.5">
                        ₹{effectiveAssessableValue.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-slate-500">CGST + SGST:</span>
                      <div className="font-mono font-bold text-slate-900 mt-0.5">
                        ₹{(taxCalculations.cgst + taxCalculations.sgst).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-slate-500">IGST Amount:</span>
                      <div className="font-mono font-bold text-indigo-700 mt-0.5">
                        ₹{taxCalculations.igst.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200">
                      <span className="text-blue-700 font-semibold">Total Invoice / DC Value:</span>
                      <div className="font-mono font-black text-blue-900 mt-0.5">
                        ₹{taxCalculations.grandTotal.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Printable Preview Trigger */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900">Pre-Dispatch Gate Pass &amp; Delivery Challan</div>
                <div className="text-[11px] text-slate-500">
                  Preview printable statutory document with barcode/QR and security sign-off before official dispatch.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" /> Print Preview
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Wizard Footer Navigation */}
      <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          Cancel
        </button>

        <div className="flex items-center gap-2">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          )}

          <button
            type="button"
            onClick={() => handleDispatchAction('DRAFT')}
            className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors shadow-2xs"
          >
            Save Draft
          </button>

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={() => {
                if (currentStep === 2 && storeCompatibilityWarning) {
                  showToast('Note: Proceeding with cross-store category override.');
                }
                setCurrentStep(currentStep + 1);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors shadow-sm"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleDispatchAction('DISPATCH')}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-colors shadow-md flex items-center gap-1.5"
            >
              <Truck className="w-4 h-4" /> Dispatch &amp; Print Challan
            </button>
          )}
        </div>
      </div>

      {/* Printable Delivery Challan / Gate Pass Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-blue-700">{generatedTransferId}</span>
                <h3 className="text-base font-bold text-slate-900">
                  {transferType === 'RETURNABLE_DC'
                    ? 'Returnable Delivery Challan'
                    : transferType === 'ASSET_MOLD'
                    ? 'Delivery Challan for Asset / Tooling Movement'
                    : 'Stock Transfer Delivery Challan'}
                </h3>
              </div>
              <button
                onClick={() => setShowPrintModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Physical Print Sheet Content */}
            <div className="p-4 border border-slate-300 rounded-xl space-y-4 text-xs font-sans">
              {/* Returnable DC statutory notice */}
              {transferType === 'RETURNABLE_DC' && (
                <div className="p-2 bg-amber-50 border border-amber-300 rounded text-center font-bold text-amber-900 text-xs">
                  "Goods sent on returnable basis. Not for sale."
                </div>
              )}

              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-slate-900">{fromPlant.name}</div>
                  <div className="text-slate-600 text-[11px]">{fromPlant.address}</div>
                  <div className="font-mono text-[11px] text-slate-700">GSTIN: {fromPlant.gstin}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-slate-900">{generatedTransferId}</div>
                  <div className="text-slate-500 text-[11px]">Date: {transferDate} {transferTime}</div>
                  <div className="font-mono text-[11px] text-emerald-700 font-bold">
                    Vehicle: {vehicleNumber || 'Internal Trolley'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-2 bg-slate-50 rounded border border-slate-200 text-[11px]">
                <div>
                  <strong className="text-slate-700">From Store:</strong> {activeFromStore?.name}
                </div>
                <div>
                  <strong className="text-slate-700">Destination Store:</strong> {activeToStore?.name} ({toPlant.name})
                </div>
              </div>

              {/* Items or Asset Summary */}
              {transferType === 'ASSET_MOLD' && selectedAsset ? (
                <div className="p-3 border border-purple-200 bg-purple-50 rounded space-y-1 text-xs">
                  <div className="font-bold text-purple-900">
                    {selectedAsset.assetId} - {selectedAsset.moldName}
                  </div>
                  <div>Serial Number: <strong className="font-mono">{selectedAsset.serialNumber}</strong></div>
                  <div>Current Shot Count: <strong>{selectedAsset.currentShotCount.toLocaleString()}</strong></div>
                  <div>Insurance Declared Value: <strong>₹{selectedAsset.insuranceDeclaredValue.toLocaleString('en-IN')}</strong></div>
                </div>
              ) : (
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="p-1.5 border border-slate-200">Item</th>
                      <th className="p-1.5 border border-slate-200">Batch</th>
                      <th className="p-1.5 border border-slate-200 text-right">Qty</th>
                      <th className="p-1.5 border border-slate-200">UOM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItems.map((item) => (
                      <tr key={item.id}>
                        <td className="p-1.5 border border-slate-200 font-medium">{item.itemName}</td>
                        <td className="p-1.5 border border-slate-200 font-mono text-[11px]">{item.batchLotNumber}</td>
                        <td className="p-1.5 border border-slate-200 text-right font-bold">{item.transferQty}</td>
                        <td className="p-1.5 border border-slate-200">{item.uom}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-3 pt-6 border-t border-slate-200 text-center text-[10px]">
                <div>
                  <div className="border-b border-slate-400 h-8 mb-1" />
                  <span>Prepared / Store Keeper</span>
                </div>
                <div>
                  <div className="border-b border-slate-400 h-8 mb-1" />
                  <span>Security Gate Out Officer</span>
                </div>
                <div>
                  <div className="border-b border-slate-400 h-8 mb-1" />
                  <span>Receiving Store In-Charge</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => {
                  showToast('Sent Delivery Challan to thermal printer.');
                  setShowPrintModal(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-xs font-bold flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" /> Print Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
