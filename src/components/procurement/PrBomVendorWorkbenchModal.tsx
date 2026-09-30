import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Sparkles,
  Layers,
  Package,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Lock,
  Unlock,
  Check,
  Building2,
  Clock,
  Send,
  RefreshCw,
  Info,
  DollarSign,
  TrendingUp,
  FileCheck,
  ExternalLink,
  ChevronDown,
  Warehouse,
} from 'lucide-react';
import { PurchaseRequisition } from '../../types';
import {
  PlantBomExplodedItem,
  PrFinishedGoodItem,
  computeConsolidatedBomExplosion,
  getBomVersionsForFgItem,
  APPROVED_SUPPLIERS_CATALOG,
  STANDARD_FG_BOM_MATRIX,
} from '../../services/procurement/bomExplosionService';
import { adminEventBus } from '../../services/adminService';

interface Props {
  pr: PurchaseRequisition;
  onClose: () => void;
  onNavigate?: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const PrBomVendorWorkbenchModal: React.FC<Props> = ({
  pr,
  onClose,
  onNavigate,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'consolidatedRecipe' | 'itemBomVersions'>(
    'consolidatedRecipe'
  );

  // Admin Provision & Permission Toggle
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [showAdminKeyPrompt, setShowAdminKeyPrompt] = useState<boolean>(false);
  const [adminPinInput, setAdminPinInput] = useState<string>('');

  // 1. Finished Goods Line Items with active BOM Recipe Version selection
  const [fgItems, setFgItems] = useState<PrFinishedGoodItem[]>(() => {
    if (pr.lines && pr.lines.length > 0) {
      return pr.lines.map((line: any, idx: number) => {
        const itemCode = line.itemCode || line.code || `FG-PLAST-${idx + 1}`;
        const versions = getBomVersionsForFgItem(itemCode);
        return {
          itemCode: itemCode,
          itemName: line.itemName || line.description || line.name || `Finished Good Item ${idx + 1}`,
          plannedQty: Number(line.quantity) || Number(line.plannedQty) || 15000,
          uom: line.uom || 'PCS',
          selectedBomVersion: line.bomVersion || versions[0].versionCode,
          availableBomVersions: versions,
          lastCreatedPo: line.poNumber || undefined,
          lastModified: new Date().toISOString().slice(0, 10),
          isLocked: false,
        };
      });
    }

    // Default sample Finished Goods in Unit Plan if lines are empty
    return [
      {
        itemCode: 'FG-AUTO-012',
        itemName: 'Automotive Door Trim Armpad Insert - RH',
        plannedQty: 45000,
        uom: 'PCS',
        selectedBomVersion: 'BOM-v1.0 (Prime Virgin Standard)',
        availableBomVersions: STANDARD_FG_BOM_MATRIX.DEFAULT,
        lastModified: '2026-09-28',
      },
      {
        itemCode: 'FG-FLIP-28',
        itemName: '28mm Fliptop Dispenser Cap (FMCG Grade)',
        plannedQty: 60000,
        uom: 'PCS',
        selectedBomVersion: 'BOM-v2.1 (Eco PCR 30% Blend)',
        availableBomVersions: STANDARD_FG_BOM_MATRIX.DEFAULT,
        lastModified: '2026-09-29',
      },
      {
        itemCode: '708027010001',
        itemName: 'ARMPAD INSERT - 50MM NYLON REINFORCED',
        plannedQty: 25000,
        uom: 'PCS',
        selectedBomVersion: 'BOM-v3.0 (High Impact GF 15%)',
        availableBomVersions: STANDARD_FG_BOM_MATRIX.DEFAULT,
        lastModified: '2026-09-30',
      },
    ];
  });

  // 2. Overrides for consolidated raw material lines (Order Qty, Supplier, Confirmed PO state)
  const [poOverrides, setPoOverrides] = useState<Record<string, Partial<PlantBomExplodedItem>>>({});

  // Re-compute consolidated raw materials whenever fgItems (or BOM versions) or poOverrides change
  const consolidatedExplosion = useMemo(() => {
    return computeConsolidatedBomExplosion(pr.plantWarehouse || 'Plant 1', fgItems, poOverrides);
  }, [pr.plantWarehouse, fgItems, poOverrides]);

  // Overall KPIs
  const totalGrossKg = useMemo(() => {
    return consolidatedExplosion.reduce(
      (sum, it) => sum + (it.uom === 'KG' ? it.grossRequiredKg : 0),
      0
    );
  }, [consolidatedExplosion]);

  const totalFreeStockKg = useMemo(() => {
    return consolidatedExplosion.reduce(
      (sum, it) => sum + (it.uom === 'KG' ? it.unitStock.totalFreeStock : 0),
      0
    );
  }, [consolidatedExplosion]);

  const totalNetNeedKg = useMemo(() => {
    return consolidatedExplosion.reduce(
      (sum, it) => sum + (it.uom === 'KG' ? it.netNeedKg : 0),
      0
    );
  }, [consolidatedExplosion]);

  const totalEstimatedCost = useMemo(() => {
    return consolidatedExplosion.reduce((sum, it) => sum + it.totalCost, 0);
  }, [consolidatedExplosion]);

  const confirmedPoCount = useMemo(() => {
    return consolidatedExplosion.filter((it) => it.isPoConfirmed).length;
  }, [consolidatedExplosion]);

  // Handler for changing BOM recipe version on Tab 2
  const handleBomVersionChange = (fgIndex: number, newVersionCode: string) => {
    const item = fgItems[fgIndex];
    if (item.isLocked && !isAdminMode) {
      showToast('⚠️ Row is locked because PO has already proceeded. Enable Admin Provision to change.');
      return;
    }

    const updated = [...fgItems];
    updated[fgIndex] = {
      ...updated[fgIndex],
      selectedBomVersion: newVersionCode,
      lastModified: new Date().toISOString().slice(0, 10),
    };
    setFgItems(updated);
    showToast(`✓ Changed BOM Recipe for ${item.itemCode} to ${newVersionCode}. Consolidator re-exploded!`);
  };

  // Handler for changing Order Qty on Tab 1
  const handleOrderQtyChange = (rawItemCode: string, qty: number) => {
    const item = consolidatedExplosion.find((it) => it.rawItemCode === rawItemCode);
    if (item?.isPoConfirmed && !isAdminMode) {
      showToast('⚠️ Item is locked because PO has already been sent to vendor.');
      return;
    }

    setPoOverrides((prev) => ({
      ...prev,
      [rawItemCode]: {
        ...prev[rawItemCode],
        orderQty: Math.max(0, qty),
      },
    }));
  };

  // Handler for changing Selected Supplier on Tab 1
  const handleSupplierChange = (rawItemCode: string, supplierId: string) => {
    const item = consolidatedExplosion.find((it) => it.rawItemCode === rawItemCode);
    if (item?.isPoConfirmed && !isAdminMode) {
      showToast('⚠️ Item is locked because PO has already been sent.');
      return;
    }

    const suppliers = APPROVED_SUPPLIERS_CATALOG[item?.category || 'Polymer Granules'] || [];
    const sup = suppliers.find((s) => s.supplierId === supplierId);

    setPoOverrides((prev) => ({
      ...prev,
      [rawItemCode]: {
        ...prev[rawItemCode],
        selectedSupplierId: supplierId,
        selectedSupplierName: sup?.supplierName || 'RELIANCE INDUSTRIES LIMITED',
        unitPrice: sup?.ratePerUom,
      },
    }));

    if (sup) {
      showToast(`✓ Selected Vendor: ${sup.supplierName} (Rate: ₹${sup.ratePerUom}/${item?.uom || 'KG'}, Rating: ${sup.rating}%)`);
    }
  };

  // Handler for Proceed to PO button on Tab 1
  const handleProceedToPo = (item: PlantBomExplodedItem) => {
    if (item.orderQty <= 0) {
      showToast('⚠️ Order Quantity must be greater than 0 to generate PO');
      return;
    }

    const nextPoNum = `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toLocaleDateString('en-GB');

    setPoOverrides((prev) => ({
      ...prev,
      [item.rawItemCode]: {
        ...prev[item.rawItemCode],
        isPoConfirmed: true,
        confirmedPoNumber: nextPoNum,
        confirmedAt: now,
        confirmedBy: 'Procurement Officer (PO Desk)',
        isLocked: true,
      },
    }));

    // Lock linked FG lines
    setFgItems((prev) =>
      prev.map((fg) => ({
        ...fg,
        lastCreatedPo: nextPoNum,
        isLocked: true,
      }))
    );

    adminEventBus.emit('PO_GENERATED_FROM_BOM', {
      poNumber: nextPoNum,
      rawItemCode: item.rawItemCode,
      rawItemName: item.rawItemName,
      supplierName: item.selectedSupplierName,
      quantity: item.orderQty,
      rate: item.unitPrice,
      totalAmount: item.totalCost,
      sourcePr: pr.prNumber,
    });

    showToast(`✓ Success: ${nextPoNum} generated & sent to Confirmed PO Area for ${item.selectedSupplierName}! Row is now Locked.`);
  };

  // Handler for Bulk Proceed All Pending to PO
  const handleBulkProceedToPo = () => {
    const unconfirmed = consolidatedExplosion.filter((it) => !it.isPoConfirmed && it.orderQty > 0);
    if (unconfirmed.length === 0) {
      showToast('All raw material lines are already confirmed or have 0 qty.');
      return;
    }

    const updatedOverrides = { ...poOverrides };
    const now = new Date().toLocaleDateString('en-GB');

    unconfirmed.forEach((it, idx) => {
      const poNum = `PO-2026-${Math.floor(1100 + idx * 100 + Math.random() * 50)}`;
      updatedOverrides[it.rawItemCode] = {
        ...updatedOverrides[it.rawItemCode],
        isPoConfirmed: true,
        confirmedPoNumber: poNum,
        confirmedAt: now,
        confirmedBy: 'Procurement Officer (Bulk Release)',
        isLocked: true,
      };
    });

    setPoOverrides(updatedOverrides);
    setFgItems((prev) => prev.map((fg) => ({ ...fg, isLocked: true })));
    showToast(`✓ Successfully generated ${unconfirmed.length} Purchase Orders in Confirmed PO Register!`);
  };

  // Admin Unlock Single Item
  const handleAdminUnlockItem = (rawItemCode: string) => {
    setPoOverrides((prev) => ({
      ...prev,
      [rawItemCode]: {
        ...prev[rawItemCode],
        isPoConfirmed: false,
        isLocked: false,
      },
    }));
    showToast(`🔓 Admin Override: Unlocked ${rawItemCode} for modifications.`);
  };

  const handleToggleAdminMode = () => {
    if (isAdminMode) {
      setIsAdminMode(false);
      showToast('Admin Provision mode deactivated.');
    } else {
      setShowAdminKeyPrompt(true);
    }
  };

  const handleVerifyAdminPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPinInput.trim() === '9999' || adminPinInput.trim() === 'admin') {
      setIsAdminMode(true);
      setShowAdminKeyPrompt(false);
      setAdminPinInput('');
      showToast('🔓 Admin Authorization Verified! Full override permissions enabled.');
    } else {
      showToast('❌ Invalid Admin Key/PIN. Access denied.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs animate-fade-in text-xs font-sans">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-[#14213D] via-[#1c2d52] to-[#0F8B8D] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl">
              <Sparkles className="w-6 h-6 text-teal-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold tracking-tight">
                  PR BOM Recipe &amp; Consolidated Vendor Intelligence Workbench
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-teal-500/30 text-teal-200 border border-teal-400/40 text-[11px] font-mono font-bold">
                  {pr.prNumber}
                </span>
                {pr.plantWarehouse && (
                  <span className="px-2 py-0.5 rounded bg-white/10 text-slate-200 text-[10px] font-semibold flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> {pr.plantWarehouse}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Consolidated Formulation MRP &bull; Multi-Recipe Versions &bull; Unit-Wise Stock &bull; Direct PO Dispatch
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* Admin Provision Switch */}
            <button
              onClick={handleToggleAdminMode}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition border cursor-pointer ${
                isAdminMode
                  ? 'bg-amber-400 text-slate-900 border-amber-300 shadow-md animate-pulse'
                  : 'bg-white/10 hover:bg-white/20 text-slate-200 border-white/20'
              }`}
              title={isAdminMode ? 'Admin Provision Active: You can edit and unlock any confirmed PO item' : 'Enable Admin Mode to unlock or edit confirmed PO lines'}
            >
              {isAdminMode ? <Unlock className="w-3.5 h-3.5 text-slate-900" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{isAdminMode ? 'Admin Mode: ACTIVE' : 'Admin Provision'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Admin PIN Prompt Modal */}
        {showAdminKeyPrompt && (
          <div className="p-3 bg-amber-50 border-b border-amber-200 flex items-center justify-between gap-3 text-amber-900 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Enter Admin Security PIN (e.g. <b>admin</b> or <b>9999</b>) to unlock full edit provision:</span>
            </div>
            <form onSubmit={handleVerifyAdminPin} className="flex items-center gap-2">
              <input
                type="password"
                placeholder="PIN"
                value={adminPinInput}
                onChange={(e) => setAdminPinInput(e.target.value)}
                autoFocus
                className="px-2 py-1 bg-white border border-amber-300 rounded text-xs w-24 font-mono font-bold"
              />
              <button
                type="submit"
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold cursor-pointer"
              >
                Authorize
              </button>
              <button
                type="button"
                onClick={() => setShowAdminKeyPrompt(false)}
                className="px-2 py-1 text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {/* 2 Main Tabs Navigation */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 bg-slate-50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('consolidatedRecipe')}
              className={`py-3.5 px-4 font-bold border-b-2 text-xs transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'consolidatedRecipe'
                  ? 'border-[#0F8B8D] text-[#0F8B8D] bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
              }`}
            >
              <Layers className="w-4 h-4 text-[#0F8B8D]" />
              <span>Tab 1: Consolidated Recipe &amp; PO Conversion Engine</span>
              <span className="px-1.5 py-0.2 bg-teal-100 text-teal-800 rounded-full text-[10px] font-mono">
                {consolidatedExplosion.length} Raw Materials
              </span>
            </button>

            <button
              onClick={() => setActiveTab('itemBomVersions')}
              className={`py-3.5 px-4 font-bold border-b-2 text-xs transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'itemBomVersions'
                  ? 'border-[#0F8B8D] text-[#0F8B8D] bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
              }`}
            >
              <Package className="w-4 h-4 text-purple-600" />
              <span>Tab 2: PR Line Items &amp; BOM Recipe Version Controller</span>
              <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded-full text-[10px] font-mono">
                {fgItems.length} Finished Goods
              </span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-500 font-medium">
            <Warehouse className="w-3.5 h-3.5 text-teal-600" />
            <span>Unit-Wise Stock Live Sync Active</span>
          </div>
        </div>

        {/* Workbench Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 bg-slate-50/50">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Consolidated Gross Needed
              </div>
              <div className="text-lg font-bold text-slate-900 mt-1">
                {totalGrossKg.toLocaleString()} <span className="text-xs font-normal text-slate-500">KG</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Aggregated across all {fgItems.length} FG items</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
              <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">
                Multi-Unit Available Stock
              </div>
              <div className="text-lg font-bold text-emerald-700 mt-1">
                {totalFreeStockKg.toLocaleString()} <span className="text-xs font-normal text-slate-500">KG</span>
              </div>
              <div className="text-[10px] text-emerald-600 mt-0.5">Plant 1 + Plant 2 + Central WH</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-2xs bg-amber-50/30">
              <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wide">
                Net Requisition Need
              </div>
              <div className="text-lg font-bold text-amber-900 mt-1">
                {totalNetNeedKg.toLocaleString()} <span className="text-xs font-normal text-slate-500">KG</span>
              </div>
              <div className="text-[10px] text-amber-700 mt-0.5">Gross &minus; Free Stock + 12% Safety Buffer</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-teal-200 shadow-2xs bg-teal-50/30">
              <div className="text-[10px] font-bold text-teal-800 uppercase tracking-wide">
                Est. Procurement Budget
              </div>
              <div className="text-lg font-bold text-[#0F8B8D] mt-1">
                ₹{(totalEstimatedCost / 100000).toFixed(2)} Lakhs
              </div>
              <div className="text-[10px] text-teal-700 mt-0.5">
                {confirmedPoCount} of {consolidatedExplosion.length} POs Dispatched
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: CONSOLIDATED RECIPE / RAW MATERIALS & PO CONVERSION */}
          {/* ========================================================================= */}
          {activeTab === 'consolidatedRecipe' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden space-y-0">
              <div className="p-3 bg-gradient-to-r from-slate-50 to-teal-50/40 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#0F8B8D]" />
                    Consolidated Raw Material Formulation &amp; Purchase Order Conversion Table
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Edit Requisition Qty, select approved vendor, and click &quot;Proceed to PO&quot; to send directly to Confirmed PO Register.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBulkProceedToPo}
                    className="px-3 py-1.5 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Proceed All Pending to PO</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] border-b border-gray-200">
                    <tr>
                      <th className="py-2.5 px-3">Raw Material Code &amp; Name</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-right">Available Stock (Unit Breakdown)</th>
                      <th className="py-2.5 px-3 text-right">Gross Needed</th>
                      <th className="py-2.5 px-3 text-right">Net Shortage</th>
                      <th className="py-2.5 px-3 text-center min-w-[120px]">Order / PR Qty</th>
                      <th className="py-2.5 px-3 min-w-[200px]">Selected Supplier / Vendor</th>
                      <th className="py-2.5 px-3 text-right">Unit Rate</th>
                      <th className="py-2.5 px-3 text-right">Total Est. (₹)</th>
                      <th className="py-2.5 px-3 text-right min-w-[140px]">PO Dispatch Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {consolidatedExplosion.map((mat) => (
                      <tr
                        key={mat.rawItemCode}
                        className={`transition-colors ${
                          mat.isPoConfirmed
                            ? 'bg-emerald-50/40 hover:bg-emerald-50/60'
                            : 'hover:bg-teal-50/20'
                        }`}
                      >
                        {/* Raw Item Code & Name */}
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900 font-mono text-[11px] flex items-center gap-1">
                            {mat.rawItemCode}
                            {mat.isPoConfirmed && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                          </div>
                          <div className="text-[11px] text-slate-600 font-medium max-w-[220px]">
                            {mat.rawItemName}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                            {mat.category}
                          </span>
                        </td>

                        {/* Unit-Wise Stock Breakdown */}
                        <td className="py-3 px-3 text-right">
                          <div className="font-bold text-emerald-700">
                            {mat.unitStock.totalFreeStock.toLocaleString()} {mat.uom}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-mono flex items-center justify-end gap-1">
                            <span title="Plant 1 Stock">P1: {(mat.unitStock.plant1Stock / 1000).toFixed(1)}k</span>
                            <span>&bull;</span>
                            <span title="Plant 2 Stock">P2: {(mat.unitStock.plant2Stock / 1000).toFixed(1)}k</span>
                            <span>&bull;</span>
                            <span title="Central WH Stock">CWH: {(mat.unitStock.centralWarehouseStock / 1000).toFixed(1)}k</span>
                          </div>
                        </td>

                        {/* Gross Needed */}
                        <td className="py-3 px-3 text-right font-semibold text-slate-800">
                          {mat.grossRequiredKg.toLocaleString()} {mat.uom}
                        </td>

                        {/* Net Shortage */}
                        <td className="py-3 px-3 text-right font-bold font-mono">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              mat.netNeedKg > 0
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {mat.netNeedKg.toLocaleString()} {mat.uom}
                          </span>
                        </td>

                        {/* Editable Order Qty */}
                        <td className="py-3 px-3 text-center">
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              value={mat.orderQty}
                              disabled={mat.isPoConfirmed && !isAdminMode}
                              onChange={(e) =>
                                handleOrderQtyChange(mat.rawItemCode, Number(e.target.value))
                              }
                              className={`w-24 text-center px-2 py-1 border rounded-md font-bold font-mono text-xs focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none ${
                                mat.isPoConfirmed && !isAdminMode
                                  ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-gray-200'
                                  : 'bg-white text-slate-900 border-teal-300 shadow-2xs'
                              }`}
                            />
                            <span className="text-[10px] text-slate-400 ml-1 font-semibold">
                              {mat.uom}
                            </span>
                          </div>
                        </td>

                        {/* Editable Supplier Dropdown */}
                        <td className="py-3 px-3">
                          <div className="space-y-1">
                            <select
                              value={mat.selectedSupplierId}
                              disabled={mat.isPoConfirmed && !isAdminMode}
                              onChange={(e) => handleSupplierChange(mat.rawItemCode, e.target.value)}
                              className={`w-full px-2 py-1 border rounded-md text-xs font-semibold focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none ${
                                mat.isPoConfirmed && !isAdminMode
                                  ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-gray-200'
                                  : 'bg-white text-slate-900 border-gray-300'
                              }`}
                            >
                              {mat.availableSuppliers.map((sup) => (
                                <option key={sup.supplierId} value={sup.supplierId}>
                                  {sup.supplierName} (₹{sup.ratePerUom}/{mat.uom})
                                </option>
                              ))}
                            </select>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                              <span>Lead: {mat.leadTimeDays}d</span>
                              <span>&bull;</span>
                              <span className="text-emerald-700 font-bold">
                                Score: {mat.supplierRating}%
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Unit Rate */}
                        <td className="py-3 px-3 text-right font-semibold text-slate-800">
                          ₹{mat.unitPrice.toFixed(2)}
                        </td>

                        {/* Total Cost */}
                        <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono">
                          ₹{(mat.totalCost / 100000).toFixed(2)}L
                        </td>

                        {/* Action / PO Dispatch Button */}
                        <td className="py-3 px-3 text-right">
                          {mat.isPoConfirmed ? (
                            <div className="flex flex-col items-end gap-1">
                              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md font-bold text-[11px] inline-flex items-center gap-1 shadow-2xs">
                                <FileCheck className="w-3 h-3 text-emerald-700" />
                                {mat.confirmedPoNumber || 'PO Sent'}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {mat.confirmedAt || 'Confirmed'}
                              </span>
                              {isAdminMode && (
                                <button
                                  onClick={() => handleAdminUnlockItem(mat.rawItemCode)}
                                  className="text-[10px] text-amber-700 hover:underline font-bold flex items-center gap-0.5 cursor-pointer mt-0.5"
                                >
                                  <Unlock className="w-2.5 h-2.5" /> Unlock Line
                                </button>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => handleProceedToPo(mat)}
                              className="px-3 py-1.5 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-2xs transition cursor-pointer ml-auto"
                              title="Proceed to generate Purchase Order and send to Confirmed PO Register"
                            >
                              <span>Proceed PO</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: PR ITEM LIST & BOM RECIPE VERSION CONTROLLER */}
          {/* ========================================================================= */}
          {activeTab === 'itemBomVersions' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden space-y-0">
              <div className="p-3 bg-gradient-to-r from-slate-50 to-purple-50/40 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-purple-600" />
                    PR Finished Goods Line Items &amp; Active BOM Recipe Version Controller
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Switch the active formulation version (Virgin, Recycled PCR Blend, High Impact Glass-Filled). Changes automatically recalculate Tab 1!
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-purple-100 text-purple-800 text-[11px] font-bold">
                    {fgItems.length} Product Lines Configured
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] border-b border-gray-200">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Finished Good Item Code &amp; Name</th>
                      <th className="py-2.5 px-3 text-right">Planned PR Qty</th>
                      <th className="py-2.5 px-3 min-w-[280px]">Active BOM Recipe Version (Selector)</th>
                      <th className="py-2.5 px-3">Recipe Formulation Description</th>
                      <th className="py-2.5 px-3 text-center">Lock Status</th>
                      <th className="py-2.5 px-3 text-right">Last Modified / PO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {fgItems.map((fg, idx) => {
                      const selectedVer =
                        fg.availableBomVersions.find((v) => v.versionCode === fg.selectedBomVersion) ||
                        fg.availableBomVersions[0];

                      return (
                        <tr key={fg.itemCode} className="hover:bg-purple-50/20 transition-colors">
                          <td className="py-3 px-3 text-slate-400 font-mono">{idx + 1}</td>

                          {/* FG Item Code & Name */}
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900 font-mono text-[11px]">
                              {fg.itemCode}
                            </div>
                            <div className="text-[11px] text-slate-700 font-medium">
                              {fg.itemName}
                            </div>
                          </td>

                          {/* Planned Qty */}
                          <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono">
                            {fg.plannedQty.toLocaleString()} {fg.uom}
                          </td>

                          {/* Active BOM Recipe Version Dropdown */}
                          <td className="py-3 px-3">
                            <div className="relative">
                              <select
                                value={fg.selectedBomVersion}
                                disabled={fg.isLocked && !isAdminMode}
                                onChange={(e) => handleBomVersionChange(idx, e.target.value)}
                                className={`w-full px-2.5 py-1.5 border rounded-lg text-xs font-bold focus:ring-1 focus:ring-purple-500 focus:outline-none ${
                                  fg.isLocked && !isAdminMode
                                    ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-gray-200'
                                    : 'bg-purple-50/40 text-purple-900 border-purple-300'
                                }`}
                              >
                                {fg.availableBomVersions.map((ver) => (
                                  <option key={ver.versionId} value={ver.versionCode}>
                                    {ver.versionCode} - {ver.versionName}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>

                          {/* Formulation Description & Component Chips */}
                          <td className="py-3 px-3">
                            <p className="text-[11px] text-slate-600">{selectedVer.description}</p>
                            <div className="flex items-center gap-1.5 flex-wrap mt-1">
                              {selectedVer.components.map((comp) => (
                                <span
                                  key={comp.rawItemCode}
                                  className="px-1.5 py-0.2 bg-slate-100 border border-slate-200 text-slate-700 rounded text-[9px] font-mono"
                                >
                                  {comp.rawItemCode}: {(comp.ratioPerPiece * 1000).toFixed(0)}g/pc
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* Lock Status */}
                          <td className="py-3 px-3 text-center">
                            {fg.isLocked ? (
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300 text-[10px] font-bold inline-flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" /> Locked (PO Active)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold inline-flex items-center gap-1">
                                <Check className="w-2.5 h-2.5" /> Editable
                              </span>
                            )}
                          </td>

                          {/* Last Modified / PO */}
                          <td className="py-3 px-3 text-right">
                            <div className="font-mono text-slate-600 text-[11px]">
                              {fg.lastCreatedPo || 'Not Dispatched'}
                            </div>
                            <div className="text-[10px] text-slate-400">{fg.lastModified}</div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <Info className="w-4 h-4 text-[#0F8B8D]" />
            <span>
              <b>Note:</b> Changes to BOM versions and quantities automatically synchronize across procurement and production schedules.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-gray-300 rounded-lg font-bold transition cursor-pointer"
            >
              Close Workbench
            </button>
            {onNavigate && (
              <button
                onClick={() => {
                  onClose();
                  onNavigate('poList');
                }}
                className="px-4 py-2 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <span>View Confirmed Purchase Orders</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
