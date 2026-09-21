import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  Copy,
  DollarSign,
  Calendar,
  Building,
  FileText,
  Truck,
  Sparkles,
  Layers,
  Search,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Info,
  ChevronDown,
} from 'lucide-react';
import {
  ExtendedPurchaseOrder,
  SupplierMaster,
  PurchaseRequisition,
} from '../../types/procurement';
import { ItemMaster } from '../../types';

interface PoLineDraft {
  id: string;
  itemCode: string;
  itemName: string;
  category: string;
  description: string;
  uom: string;
  orderedQty: number;
  unitPrice: number;
  discountPct: number;
  taxPct: number;
  warehouse: string;
  binLocation: string;
  mfiSpec?: string;
  coaRequired: boolean;
  msdsRequired: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  suppliers: SupplierMaster[];
  items: ItemMaster[];
  prs?: PurchaseRequisition[];
  preselectedPr?: PurchaseRequisition;
  onCreatePO: (newPo: ExtendedPurchaseOrder) => void;
  onUpdatePR?: (pr: PurchaseRequisition) => void;
  showToast: (msg: string) => void;
}

export const PurchaseOrderCreateModal: React.FC<Props> = ({
  isOpen,
  onClose,
  suppliers,
  items,
  prs = [],
  preselectedPr,
  onCreatePO,
  onUpdatePR,
  showToast,
}) => {
  // Filter items to strictly approved / released items from Item Master
  const approvedItems = useMemo(
    () =>
      items.filter(
        (i) =>
          (i.approval === 'approved' || i.approval === 'released') &&
          i.status !== 'blocked' &&
          i.status !== 'inactive'
      ),
    [items]
  );

  // Form State
  const [poNumber, setPoNumber] = useState(
    () => `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [selectedPrId, setSelectedPrId] = useState<string>(preselectedPr?.id || '');
  const [supplierId, setSupplierId] = useState<string>(
    (preselectedPr as any)?.suggestedSupplier || suppliers[0]?.id || ''
  );
  const [orderType, setOrderType] = useState<ExtendedPurchaseOrder['orderType']>('Standard PO');
  const [poDate, setPoDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  });
  const [plantWarehouse, setPlantWarehouse] = useState<string>('RM-WH-01');
  const [receivingDock, setReceivingDock] = useState<string>('Dock 2 (Heavy Resin Ramp)');
  const [buyer, setBuyer] = useState<string>('Vikram Seth');
  const [paymentTerms, setPaymentTerms] = useState<string>('Net 30 Days');
  const [deliveryTerms, setDeliveryTerms] = useState<string>('FOR Destination Plant Gate');
  const [freightAmount, setFreightAmount] = useState<number>(0);
  const [specialInstructions, setSpecialInstructions] = useState<string>(
    'Manufacturer Certificate of Analysis (MFI, Density) and weighbridge slip mandatory with delivery challan.'
  );
  const [notes, setNotes] = useState<string>('');

  // Draft Lines State
  const [lines, setLines] = useState<PoLineDraft[]>(() => {
    if (preselectedPr && preselectedPr.lines.length > 0) {
      return preselectedPr.lines.map((l, idx) => {
        const matchedItem = approvedItems.find(
          (i) => i.code === l.itemCode || i.name.toLowerCase() === l.itemName.toLowerCase()
        );
        const stdCost = (matchedItem as any)?.standardCost || parseFloat(matchedItem?.valuation || '80') || 80;
        return {
          id: `line-${Date.now()}-${idx}`,
          itemCode: l.itemCode,
          itemName: l.itemName,
          category: matchedItem?.type || (matchedItem as any)?.category || 'Raw Material Resin',
          description: (l as any).specification || matchedItem?.desc || (matchedItem as any)?.description || 'Standard Grade Polymer',
          uom: l.uom || matchedItem?.baseUOM || (matchedItem as any)?.uom || 'KG',
          orderedQty: l.quantity,
          unitPrice: l.estimatedUnitPrice || stdCost,
          discountPct: 0,
          taxPct: 18,
          warehouse: 'RM-WH-01',
          binLocation: 'RM-WH-01-A1',
          coaRequired: true,
          msdsRequired: true,
        };
      });
    }

    const defaultItem = approvedItems[0];
    const defaultCost = (defaultItem as any)?.standardCost || parseFloat(defaultItem?.valuation || '78.5') || 78.5;
    return [
      {
        id: `line-${Date.now()}-0`,
        itemCode: defaultItem?.code || 'RM-PP-NAT-001',
        itemName: defaultItem?.name || 'PP Natural Granules H110MA',
        category: defaultItem?.type || (defaultItem as any)?.category || 'Raw Material Resin',
        description: defaultItem?.desc || (defaultItem as any)?.description || 'Polymer injection grade granules',
        uom: defaultItem?.baseUOM || (defaultItem as any)?.uom || 'KG',
        orderedQty: 5000,
        unitPrice: defaultCost,
        discountPct: 0,
        taxPct: 18,
        warehouse: 'RM-WH-01',
        binLocation: 'RM-WH-01-A1',
        coaRequired: true,
        msdsRequired: true,
      },
    ];
  });

  // Autocomplete dropdown index tracking
  const [activeItemSearchIdx, setActiveItemSearchIdx] = useState<number | null>(null);
  const [itemSearchQuery, setItemSearchQuery] = useState<string>('');

  // When supplier changes, update payment terms if available
  useEffect(() => {
    const s = suppliers.find((sup) => sup.id === supplierId || sup.code === supplierId);
    if (s?.paymentTerms) {
      setPaymentTerms(s.paymentTerms);
    }
  }, [supplierId, suppliers]);

  // When PR changes from selector, auto-populate details
  const handleSelectPr = (prId: string) => {
    setSelectedPrId(prId);
    if (!prId) return;

    const targetPr = prs.find((p) => p.id === prId || p.prNumber === prId);
    if (!targetPr) return;

    const suggestedSup = (targetPr as any).suggestedSupplier;
    if (suggestedSup) {
      const sup = suppliers.find(
        (s) =>
          s.id === suggestedSup ||
          s.name.toLowerCase().includes(suggestedSup.toLowerCase())
      );
      if (sup) setSupplierId(sup.id);
    }

    if (targetPr.plantWarehouse) {
      setPlantWarehouse(targetPr.plantWarehouse);
    }

    if (targetPr.requiredDate) {
      setExpectedDeliveryDate(targetPr.requiredDate);
    }

    // Auto-fill lines from PR while letting the buyer customize quantity/rates
    if (targetPr.lines && targetPr.lines.length > 0) {
      const newLines: PoLineDraft[] = targetPr.lines.map((l, idx) => {
        const matchedItem = approvedItems.find(
          (i) => i.code === l.itemCode || i.name.toLowerCase() === l.itemName.toLowerCase()
        );
        const stdCost = (matchedItem as any)?.standardCost || parseFloat(matchedItem?.valuation || '80') || 80;
        return {
          id: `line-${Date.now()}-${idx}`,
          itemCode: l.itemCode,
          itemName: l.itemName,
          category: matchedItem?.type || (matchedItem as any)?.category || 'Raw Material Resin',
          description: (l as any).specification || matchedItem?.desc || (matchedItem as any)?.description || 'Standard Grade',
          uom: l.uom || matchedItem?.baseUOM || (matchedItem as any)?.uom || 'KG',
          orderedQty: l.quantity,
          unitPrice: l.estimatedUnitPrice || stdCost,
          discountPct: 0,
          taxPct: 18,
          warehouse: targetPr.plantWarehouse || 'RM-WH-01',
          binLocation: 'RM-WH-01-A1',
          coaRequired: true,
          msdsRequired: true,
        };
      });
      setLines(newLines);
    }

    showToast(`Loaded ${targetPr.lines.length} material lines from Requisition ${targetPr.prNumber}`);
  };

  // Line item manipulation
  const handleAddLine = () => {
    const defaultItem = approvedItems[0];
    const defaultCost = (defaultItem as any)?.standardCost || parseFloat(defaultItem?.valuation || '84.0') || 84.0;
    const newLine: PoLineDraft = {
      id: `line-${Date.now()}-${lines.length}`,
      itemCode: defaultItem?.code || 'RM-HD-GRN-014',
      itemName: defaultItem?.name || 'HDPE Granules B56003',
      category: defaultItem?.type || (defaultItem as any)?.category || 'Raw Material Resin',
      description: defaultItem?.desc || (defaultItem as any)?.description || 'Standard Grade Polymer',
      uom: defaultItem?.baseUOM || (defaultItem as any)?.uom || 'KG',
      orderedQty: 1000,
      unitPrice: defaultCost,
      discountPct: 0,
      taxPct: 18,
      warehouse: plantWarehouse,
      binLocation: 'RM-WH-01-A1',
      coaRequired: true,
      msdsRequired: true,
    };
    setLines((prev) => [...prev, newLine]);
  };

  const handleDuplicateLine = (idx: number) => {
    const target = lines[idx];
    const dup: PoLineDraft = {
      ...target,
      id: `line-${Date.now()}-${lines.length}`,
    };
    setLines((prev) => [...prev, dup]);
    showToast(`Duplicated line #${idx + 1}`);
  };

  const handleRemoveLine = (idx: number) => {
    if (lines.length === 1) {
      showToast('Purchase Order must contain at least 1 line item.');
      return;
    }
    setLines((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleLineFieldChange = (idx: number, field: keyof PoLineDraft, value: any) => {
    setLines((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const handleSelectItemForLine = (idx: number, item: ItemMaster) => {
    const stdCost = (item as any)?.standardCost || parseFloat(item.valuation || '80') || 80;
    setLines((prev) => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        itemCode: item.code,
        itemName: item.name,
        category: item.type || (item as any).category || 'Raw Material',
        description: item.desc || (item as any).description || 'Standard Grade Polymer',
        uom: item.baseUOM || (item as any).uom || 'KG',
        unitPrice: stdCost || next[idx].unitPrice || 80,
      };
      return next;
    });
    setActiveItemSearchIdx(null);
    setItemSearchQuery('');
  };

  // Financial Calculations
  const totalVolumeKg = useMemo(
    () => lines.reduce((sum, l) => sum + (Number(l.orderedQty) || 0), 0),
    [lines]
  );

  const subtotal = useMemo(
    () =>
      lines.reduce((sum, l) => {
        const qty = Number(l.orderedQty) || 0;
        const rate = Number(l.unitPrice) || 0;
        const discount = (rate * (Number(l.discountPct) || 0)) / 100;
        return sum + qty * (rate - discount);
      }, 0),
    [lines]
  );

  const totalTaxAmount = useMemo(
    () =>
      lines.reduce((sum, l) => {
        const qty = Number(l.orderedQty) || 0;
        const rate = Number(l.unitPrice) || 0;
        const discount = (rate * (Number(l.discountPct) || 0)) / 100;
        const lineNet = qty * (rate - discount);
        return sum + (lineNet * (Number(l.taxPct) || 0)) / 100;
      }, 0),
    [lines]
  );

  const grandTotal = subtotal + totalTaxAmount + Number(freightAmount || 0);

  const handleCreatePoSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!poNumber.trim()) {
      showToast('Validation Error: PO Number is required.');
      return;
    }

    if (!supplierId) {
      showToast('Validation Error: Please select a supplier.');
      return;
    }

    if (lines.length === 0) {
      showToast('Validation Error: Add at least one line item.');
      return;
    }

    const selectedSup = suppliers.find((s) => s.id === supplierId || s.code === supplierId) || suppliers[0];
    const sourcePr = prs.find((p) => p.id === selectedPrId || p.prNumber === selectedPrId);

    const newPo: ExtendedPurchaseOrder = {
      id: poNumber.trim(),
      poNumber: poNumber.trim(),
      supplierId: selectedSup?.id || 'SUP-001',
      supplierName: selectedSup?.name || 'Authorized Supplier',
      supplierCode: selectedSup?.code || 'SUP-001',
      buyer: buyer || 'Vikram Seth',
      plantWarehouse: plantWarehouse,
      poDate: poDate,
      expectedDeliveryDate: expectedDeliveryDate,
      promisedDeliveryDate: expectedDeliveryDate,
      currency: 'INR (₹)',
      exchangeRate: 1.0,
      paymentTerms: paymentTerms,
      deliveryTerms: deliveryTerms,
      orderType: orderType,
      sourcePrNumber: sourcePr?.prNumber || (selectedPrId ? selectedPrId : undefined),
      status: 'sent_to_supplier',
      approvalStatus: 'approved',
      totalSubtotal: subtotal,
      totalDiscount: 0,
      totalTax: totalTaxAmount,
      freightAmount: Number(freightAmount || 0),
      totalAmount: grandTotal,
      receivedAmount: 0,
      invoicedAmount: 0,
      outstandingAmount: grandTotal,
      shippingAddress: `Reboot Plastic Mfg Plant 1, Plot 42, GIDC Industrial Estate, Vapi 396195`,
      billingAddress: `Reboot Polymer Solutions Ltd, Corporate Suite 800, Mumbai 400051`,
      notes: notes || 'Standard commercial purchase order.',
      specialInstructions: specialInstructions,
      lines: lines.map((l, idx) => {
        const qty = Number(l.orderedQty) || 0;
        const rate = Number(l.unitPrice) || 0;
        const discount = (rate * (Number(l.discountPct) || 0)) / 100;
        const lineTot = qty * (rate - discount);
        return {
          lineNo: idx + 1,
          itemCode: l.itemCode,
          itemName: l.itemName,
          description: l.description,
          orderedQty: qty,
          receivedQty: 0,
          invoicedQty: 0,
          remainingQty: qty,
          uom: l.uom,
          unitPrice: rate,
          discountPct: Number(l.discountPct) || 0,
          taxPct: Number(l.taxPct) || 18,
          lineTotal: lineTot,
          expectedDate: expectedDeliveryDate,
          warehouse: l.warehouse || plantWarehouse,
          binLocation: l.binLocation || 'RM-WH-01-A1',
          lotRequired: true,
          coaRequired: l.coaRequired,
          msdsRequired: l.msdsRequired,
          status: 'open',
        };
      }),
      grnList: [],
      invoiceList: [],
      approvals: [
        {
          level: 'Level 1: Procurement Officer',
          approver: buyer,
          status: 'Approved',
          date: poDate,
        },
      ],
      activityHistory: [
        {
          date: poDate,
          event: `PO Created and Issued${sourcePr ? ` from ${sourcePr.prNumber}` : ''}`,
          by: buyer,
        },
      ],
    };

    // Update PR status if linked
    if (sourcePr && onUpdatePR) {
      onUpdatePR({
        ...sourcePr,
        status: 'converted_po',
      });
    }

    onCreatePO(newPo);
    showToast(`Purchase Order ${newPo.poNumber} issued successfully to ${selectedSup.name}!`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-linear-to-r from-[#14213D] to-[#1E293B] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0F8B8D] text-white flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">Issue New Purchase Order (PO)</h2>
                <span className="text-[10px] uppercase font-bold bg-white/20 text-white px-2 py-0.5 rounded">
                  Direct Material
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Multi-line material purchase commitment with Item Master autocomplete and PR linking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleCreatePoSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Section 1: PR Linking & Commercial Header Info */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#0F8B8D]" />
                1. Order Reference & Supplier Details
              </span>
              <span className="text-[11px] text-slate-500 font-medium">All fields marked * are required</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* PO Number */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">PO Number *</label>
                <input
                  type="text"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs font-bold text-[#14213D] bg-white focus:ring-2 focus:ring-[#0F8B8D] focus:border-transparent outline-hidden"
                  placeholder="PO-2026-XXXX"
                  required
                />
              </div>

              {/* Optional PR Selector */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1 flex items-center justify-between">
                  <span>Link Requisition (PR)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                </label>
                <select
                  value={selectedPrId}
                  onChange={(e) => handleSelectPr(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-[#0F8B8D] outline-hidden text-[#14213D] font-medium"
                >
                  <option value="">-- Direct Purchase (No PR) --</option>
                  {prs.map((pr) => (
                    <option key={pr.id} value={pr.id}>
                      {pr.prNumber} ({pr.requestedBy} • {pr.department}) [{pr.status}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Supplier Selector */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Supplier Vendor *</label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-[#0F8B8D] outline-hidden text-[#14213D] font-bold"
                  required
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Expected Delivery Date */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Promised Delivery Date *</label>
                <input
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-[#0F8B8D] outline-hidden font-medium"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
              {/* Receiving Warehouse */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Receiving Warehouse</label>
                <select
                  value={plantWarehouse}
                  onChange={(e) => setPlantWarehouse(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  <option value="RM-WH-01">RM-WH-01 (Main Plant Vapi)</option>
                  <option value="RM-WH-02">RM-WH-02 (Color & Additive Bay)</option>
                  <option value="ENG-SPARE-01">ENG-SPARE-01 (Molds & Spares)</option>
                </select>
              </div>

              {/* Receiving Dock */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Inward Gate / Dock</label>
                <input
                  type="text"
                  value={receivingDock}
                  onChange={(e) => setReceivingDock(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                />
              </div>

              {/* Commercial Payment Terms */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Payment Terms</label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium"
                  placeholder="Net 30 Days / Advance LC"
                />
              </div>

              {/* Delivery Terms / Incoterms */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Delivery Incoterms</label>
                <input
                  type="text"
                  value={deliveryTerms}
                  onChange={(e) => setDeliveryTerms(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium"
                  placeholder="FOR Destination Gate / Ex-Works"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Multi-Line Items with Connected Autocomplete */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#14213D] flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#0F8B8D]" />
                  2. Purchased Material Lines & Autocomplete ({lines.length})
                </h3>
                <p className="text-slate-500 text-[11px]">
                  Select approved items from the Item Master or search by item code/name. You decide the order quantity and rate.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddLine}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F8B8D] hover:bg-[#0d797b] active:scale-[0.98] text-white rounded-xl text-xs font-semibold shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Line Item</span>
              </button>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-visible bg-white shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-8">#</th>
                    <th className="py-2.5 px-3 min-w-[240px]">Material / Item Master Autocomplete *</th>
                    <th className="py-2.5 px-3 w-28 text-right">Order Qty *</th>
                    <th className="py-2.5 px-3 w-20 text-center">UOM</th>
                    <th className="py-2.5 px-3 w-28 text-right">Unit Price (₹) *</th>
                    <th className="py-2.5 px-3 w-20 text-right">GST %</th>
                    <th className="py-2.5 px-3 w-32 text-right">Line Total (₹)</th>
                    <th className="py-2.5 px-2 text-center w-16">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lines.map((line, idx) => {
                    const lineNet =
                      (Number(line.orderedQty) || 0) * (Number(line.unitPrice) || 0);
                    const lineTot = lineNet * (1 + (Number(line.taxPct) || 18) / 100);

                    return (
                      <tr key={line.id} className="hover:bg-slate-50/60 transition group">
                        <td className="py-3 px-3 text-center font-bold text-slate-400">
                          {idx + 1}
                        </td>

                        {/* Material Autocomplete Search Cell */}
                        <td className="py-3 px-3 relative">
                          <div className="space-y-1">
                            <div className="relative">
                              <input
                                type="text"
                                value={line.itemName}
                                onFocus={() => {
                                  setActiveItemSearchIdx(idx);
                                  setItemSearchQuery('');
                                }}
                                onChange={(e) => {
                                  handleLineFieldChange(idx, 'itemName', e.target.value);
                                  setItemSearchQuery(e.target.value);
                                  setActiveItemSearchIdx(idx);
                                }}
                                placeholder="Search item code or name..."
                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-[#14213D] bg-white focus:ring-2 focus:ring-[#0F8B8D] outline-hidden"
                                required
                              />
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                {line.itemCode}
                              </span>
                              <span className="text-[10px] text-slate-400 truncate max-w-[140px]">
                                {line.category}
                              </span>
                            </div>
                          </div>

                          {/* Autocomplete Dropdown Menu */}
                          {activeItemSearchIdx === idx && (
                            <div className="absolute left-3 right-3 top-14 z-50 bg-white rounded-xl shadow-xl border border-slate-200 max-h-56 overflow-y-auto p-1 animate-fade-in">
                              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
                                <span>Select Approved Item ({approvedItems.length})</span>
                                <button
                                  type="button"
                                  onClick={() => setActiveItemSearchIdx(null)}
                                  className="text-slate-400 hover:text-slate-600"
                                >
                                  Close ✕
                                </button>
                              </div>
                              {approvedItems
                                .filter(
                                  (item) =>
                                    item.code.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
                                    item.name.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
                                    (item.type && item.type.toLowerCase().includes(itemSearchQuery.toLowerCase())) ||
                                    (item.cat && item.cat.toLowerCase().includes(itemSearchQuery.toLowerCase()))
                                )
                                .map((item) => (
                                  <button
                                    type="button"
                                    key={item.code}
                                    onClick={() => handleSelectItemForLine(idx, item)}
                                    className="w-full text-left px-2.5 py-2 hover:bg-blue-50/80 rounded-lg flex items-center justify-between transition text-xs"
                                  >
                                    <div>
                                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                        <span className="font-mono text-blue-700">{item.code}</span>
                                        <span>•</span>
                                        <span>{item.name}</span>
                                      </div>
                                      <div className="text-[10px] text-slate-400">
                                        {item.type || item.cat} • Std Cost: ₹{(item as any).standardCost || item.valuation || 0}/{item.baseUOM}
                                      </div>
                                    </div>
                                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                      Approved
                                    </span>
                                  </button>
                                ))}
                            </div>
                          )}
                        </td>

                        {/* Order Quantity */}
                        <td className="py-3 px-3 text-right">
                          <input
                            type="number"
                            min="1"
                            step="any"
                            value={line.orderedQty}
                            onChange={(e) =>
                              handleLineFieldChange(idx, 'orderedQty', parseFloat(e.target.value) || 0)
                            }
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-right font-bold text-xs text-[#14213D] focus:ring-2 focus:ring-[#0F8B8D] outline-hidden"
                            required
                          />
                        </td>

                        {/* UOM */}
                        <td className="py-3 px-3 text-center font-bold text-slate-600">
                          {line.uom}
                        </td>

                        {/* Unit Price */}
                        <td className="py-3 px-3 text-right">
                          <input
                            type="number"
                            min="0.01"
                            step="any"
                            value={line.unitPrice}
                            onChange={(e) =>
                              handleLineFieldChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)
                            }
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-right font-mono font-bold text-xs text-[#14213D] focus:ring-2 focus:ring-[#0F8B8D] outline-hidden"
                            required
                          />
                        </td>

                        {/* GST % */}
                        <td className="py-3 px-3 text-right">
                          <select
                            value={line.taxPct}
                            onChange={(e) =>
                              handleLineFieldChange(idx, 'taxPct', parseFloat(e.target.value) || 0)
                            }
                            className="w-full px-1.5 py-1.5 border border-slate-300 rounded-lg text-right font-mono text-xs bg-white"
                          >
                            <option value="18">18%</option>
                            <option value="12">12%</option>
                            <option value="5">5%</option>
                            <option value="0">0%</option>
                          </select>
                        </td>

                        {/* Line Total */}
                        <td className="py-3 px-3 text-right font-mono font-bold text-sm text-[#14213D]">
                          ₹{lineTot.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDuplicateLine(idx)}
                              title="Duplicate Line"
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveLine(idx)}
                              title="Remove Line"
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Financial Totals & Directives */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Special Instructions */}
            <div className="md:col-span-7 bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 space-y-3">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                3. Quality Requirements & Gate Directives
              </span>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Gate Receipt & COA Instructions</label>
                <textarea
                  rows={2}
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  placeholder="e.g. Weighbridge slip mandatory, moisture cert required..."
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-semibold">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded text-[#0F8B8D] focus:ring-[#0F8B8D]"
                  />
                  <span>Mandatory QC Before GRN</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-semibold">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded text-[#0F8B8D] focus:ring-[#0F8B8D]"
                  />
                  <span>E-Way Bill Verification Required</span>
                </label>
              </div>
            </div>

            {/* Financial Summary Calculation Panel */}
            <div className="md:col-span-5 bg-linear-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200 space-y-2.5">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Total Lines & Volume:</span>
                <span className="font-semibold text-slate-800">
                  {lines.length} Lines • {totalVolumeKg.toLocaleString()} KG
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Material Subtotal:</span>
                <span className="font-mono font-semibold text-[#14213D]">
                  ₹{subtotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-600">
                <span>Freight & Transit (₹):</span>
                <input
                  type="number"
                  min="0"
                  value={freightAmount}
                  onChange={(e) => setFreightAmount(parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 border border-slate-300 rounded text-right font-mono text-xs bg-white"
                />
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>GST / Taxes:</span>
                <span className="font-mono font-semibold text-[#14213D]">
                  ₹{totalTaxAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-300 flex justify-between items-center text-sm font-bold text-[#14213D]">
                <span>Grand Total:</span>
                <div className="text-right">
                  <div className="font-mono text-base font-black text-[#14213D]">
                    ₹{grandTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-slate-500 font-normal">
                    ≈ ₹{((grandTotal || 0) / 100000).toFixed(2)} Lakhs
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#0F8B8D] hover:bg-[#0d797b] active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Authorize & Issue Purchase Order</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
