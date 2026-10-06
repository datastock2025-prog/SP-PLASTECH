import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ArrowLeft,
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Layers,
  Save,
  Send,
  Sparkles,
  Calendar,
  Building,
  User,
  DollarSign,
  Lock,
  Search,
  Package,
  Check,
  ChevronDown,
  Info,
  ShieldCheck,
} from 'lucide-react';
import {
  PurchaseRequisition,
  PurchaseRequisitionLine,
  SupplierMaster,
} from '../../types/procurement';
import { ItemMaster, AuthUser } from '../../types';
import { ProcurementStatusBadge } from './ProcurementStatusBadge';
import { itemService } from '../../services/itemService';
import { supplierService } from '../../services/procurement/supplierService';
import { adminService, adminEventBus } from '../../services/adminService';
import { CreateItemWizardModal } from '../masterdata/CreateItemWizardModal';
import { addPurchaseRequisition, INITIAL_PROCUREMENT_SUPPLIERS } from '../../data/procurementData';

interface Props {
  prId?: string;
  prs?: PurchaseRequisition[];
  suppliers?: SupplierMaster[];
  items?: ItemMaster[];
  currentUser?: AuthUser | null;
  onNavigate: (view: string, param?: any) => void;
  onSavePR: (pr: PurchaseRequisition) => void;
  showToast: (msg: string) => void;
}

export const PurchaseRequisitionFormView: React.FC<Props> = ({
  prId,
  prs = [],
  suppliers = [],
  items: propItems,
  currentUser: propUser,
  onNavigate,
  onSavePR,
  showToast,
}) => {
  const activeUser = propUser || {
    id: 'usr-admin-01',
    name: 'SP-PLASTECH Master Admin',
    role: 'Super Administrator',
    department: 'Store & Procurement',
    plantName: 'Main Plant - Hosur',
    plantId: 'RM-WH-01',
  };

  // Live suppliers state - supplierService as single source of truth
  const [suppliersList, setSuppliersList] = useState<SupplierMaster[]>(() => {
    const list = supplierService.getSuppliersSync();
    if (list && list.length > 0) return list;
    if (suppliers && suppliers.length > 0) return suppliers;
    return INITIAL_PROCUREMENT_SUPPLIERS;
  });

  useEffect(() => {
    const handleSuppliersUpdate = () => {
      const refreshed = supplierService.getSuppliersSync();
      if (refreshed && refreshed.length > 0) {
        setSuppliersList(refreshed);
      }
    };
    adminEventBus.on('SUPPLIER_SAVED', handleSuppliersUpdate);
    adminEventBus.on('SUPPLIER_DELETED', handleSuppliersUpdate);
    adminEventBus.on('CATALOG_RELOADED', handleSuppliersUpdate);
    return () => {
      adminEventBus.off('SUPPLIER_SAVED', handleSuppliersUpdate);
      adminEventBus.off('SUPPLIER_DELETED', handleSuppliersUpdate);
      adminEventBus.off('CATALOG_RELOADED', handleSuppliersUpdate);
    };
  }, []);

  const existingPr = prs.find((p) => p && (p.id === prId || p.prNumber === prId));
  const isEditing = Boolean(existingPr);

  // Live items state - itemService as single source of truth
  const [itemsList, setItemsList] = useState<ItemMaster[]>(() => {
    const list = itemService.getItemsSync();
    if (list && list.length > 0) return list;
    if (propItems && propItems.length > 0) return propItems;
    return [];
  });

  // Listen for real-time Item Master events across ERP
  useEffect(() => {
    const handleUpdate = () => {
      const refreshed = itemService.getItemsSync();
      if (refreshed && refreshed.length > 0) {
        setItemsList(refreshed);
      }
    };
    adminEventBus.on('ITEM_SAVED', handleUpdate);
    adminEventBus.on('ITEM_DELETED', handleUpdate);
    adminEventBus.on('CATALOG_RELOADED', handleUpdate);
    return () => {
      adminEventBus.off('ITEM_SAVED', handleUpdate);
      adminEventBus.off('ITEM_DELETED', handleUpdate);
      adminEventBus.off('CATALOG_RELOADED', handleUpdate);
    };
  }, []);

  // Admin PR sequence generator
  const [prNumber, setPrNumber] = useState<string>(() => {
    if (existingPr?.prNumber) return existingPr.prNumber;
    return `PR-2026-${Math.floor(100 + Math.random() * 900)}`;
  });

  useEffect(() => {
    if (!existingPr) {
      adminService.generateNextNumber('Procurement & Sourcing', 'Purchase Requisition')
        .then((generated) => {
          if (generated) setPrNumber(generated);
        })
        .catch(() => {
          setPrNumber(`PR-2026-${Math.floor(100 + Math.random() * 900)}`);
        });
    }
  }, [existingPr]);

  // Form State
  const defaultRequester = activeUser
    ? `${activeUser.name} (${activeUser.role || activeUser.department || 'Store Manager'})`
    : 'Priya Rao (Store Manager)';
  const defaultDept = activeUser?.department || 'Warehouse & Inventory';
  const defaultPlant = activeUser?.plantName
    ? `${activeUser.plantId || 'RM-WH-01'} (${activeUser.plantName})`
    : 'RM-WH-01 (Main Plant)';

  const [requestedBy, setRequestedBy] = useState(existingPr?.requestedBy || defaultRequester);
  const [department, setDepartment] = useState(existingPr?.department || defaultDept);
  const [plantWarehouse, setPlantWarehouse] = useState(existingPr?.plantWarehouse || defaultPlant);
  const [requestDate, setRequestDate] = useState(existingPr?.requestDate || new Date().toISOString().slice(0, 10));
  const [requiredDate, setRequiredDate] = useState(
    existingPr?.requiredDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  );
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>(existingPr?.priority || 'High');
  const [source, setSource] = useState(existingPr?.source || 'Manual');
  const [justification, setJustification] = useState(existingPr?.justification || '');
  const [notes, setNotes] = useState(existingPr?.notes || '');
  const [status, setStatus] = useState(existingPr?.status || 'draft');

  // Sync state if existingPr changes
  useEffect(() => {
    if (existingPr) {
      setPrNumber(existingPr.prNumber || prId || '');
      setRequestedBy(existingPr.requestedBy || defaultRequester);
      setDepartment(existingPr.department || defaultDept);
      setPlantWarehouse(existingPr.plantWarehouse || defaultPlant);
      setRequestDate(existingPr.requestDate || new Date().toISOString().slice(0, 10));
      setRequiredDate(existingPr.requiredDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
      setPriority(existingPr.priority || 'High');
      setSource(existingPr.source || 'Manual');
      setJustification(existingPr.justification || '');
      setNotes(existingPr.notes || '');
      setStatus(existingPr.status || 'draft');
      setLines(existingPr.lines && existingPr.lines.length > 0 ? existingPr.lines : []);
    } else if (!prId) {
      setRequestedBy(defaultRequester);
      setDepartment(defaultDept);
      setPlantWarehouse(defaultPlant);
      setRequestDate(new Date().toISOString().slice(0, 10));
      setRequiredDate(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
      setPriority('High');
      setSource('Manual');
      setJustification('');
      setNotes('');
      setStatus('draft');
      setLines([]);
    }
  }, [existingPr, prId]);

  // Budget Allocation
  const [budgetAllocated] = useState<number>(existingPr?.budgetAllocated || 1500000);

  // Line items state - Starts empty for a fresh PR to receive new items cleanly
  const [lines, setLines] = useState<PurchaseRequisitionLine[]>(() => {
    if (existingPr?.lines && existingPr.lines.length > 0) {
      return existingPr.lines;
    }
    return [];
  });

  // Top Search & Quick-Add Item Master state
  const [topSearchQuery, setTopSearchQuery] = useState<string>('');
  const [isTopSearchOpen, setIsTopSearchOpen] = useState<boolean>(false);
  const topSearchContainerRef = useRef<HTMLDivElement | null>(null);

  // In-table row autocomplete states
  const [activeSearchIdx, setActiveSearchIdx] = useState<number | null>(null);
  const [rowSearchQuery, setRowSearchQuery] = useState<string>('');
  const [isCreateItemModalOpen, setIsCreateItemModalOpen] = useState<boolean>(false);
  const [itemToCreate, setItemToCreate] = useState<ItemMaster | null>(null);
  const [activeCreatingItemLineIdx, setActiveCreatingItemLineIdx] = useState<number>(-1);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  // Close search dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (topSearchContainerRef.current && !topSearchContainerRef.current.contains(e.target as Node)) {
        setIsTopSearchOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setActiveSearchIdx(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Top search filtered items
  const topFilteredItems = useMemo(() => {
    const q = topSearchQuery.toLowerCase().trim();
    if (!q) return itemsList.slice(0, 15);
    return itemsList
      .filter(
        (i) =>
          (i.code && i.code.toLowerCase().includes(q)) ||
          (i.name && i.name.toLowerCase().includes(q)) ||
          ((i as any).category && (i as any).category.toLowerCase().includes(q)) ||
          (i.type && i.type.toLowerCase().includes(q)) ||
          ((i as any).grade && (i as any).grade.toLowerCase().includes(q)) ||
          ((i as any).hsn && (i as any).hsn.toLowerCase().includes(q)) ||
          (i.desc && i.desc.toLowerCase().includes(q)) ||
          ((i as any).description && (i as any).description.toLowerCase().includes(q))
      )
      .slice(0, 15);
  }, [itemsList, topSearchQuery]);

  // Row autocomplete filtered items
  const rowFilteredItems = useMemo(() => {
    const q = rowSearchQuery.toLowerCase().trim();
    if (!q) return itemsList.slice(0, 12);
    return itemsList
      .filter(
        (i) =>
          (i.code && i.code.toLowerCase().includes(q)) ||
          (i.name && i.name.toLowerCase().includes(q)) ||
          ((i as any).category && (i as any).category.toLowerCase().includes(q)) ||
          (i.type && i.type.toLowerCase().includes(q)) ||
          ((i as any).grade && (i as any).grade.toLowerCase().includes(q)) ||
          ((i as any).hsn && (i as any).hsn.toLowerCase().includes(q)) ||
          (i.desc && i.desc.toLowerCase().includes(q)) ||
          ((i as any).description && (i as any).description.toLowerCase().includes(q))
      )
      .slice(0, 12);
  }, [itemsList, rowSearchQuery]);

  // Open item creation modal pre-populated
  const handleOpenCreateItemModal = (initialQuery = '', lineIdx = -1) => {
    setActiveCreatingItemLineIdx(lineIdx);
    const trimmed = initialQuery.trim();
    const isCodeLike = /^[A-Z0-9_-]{3,15}$/i.test(trimmed);
    setItemToCreate({
      id: `item-${Date.now()}`,
      code: isCodeLike ? trimmed.toUpperCase() : '',
      name: trimmed || '',
      type: 'Raw Material',
      cat: 'Raw Material',
      desc: trimmed ? `${trimmed} - Polymer Raw Material` : '',
      baseUOM: 'KG',
      standardCost: 0,
      approval: 'approved',
      status: 'Active',
    } as any);
    setIsCreateItemModalOpen(true);
    setIsTopSearchOpen(false);
    setActiveSearchIdx(null);
  };

  // Add line item from top search bar
  const handleAddFromTopSearch = (item: ItemMaster) => {
    const unitPrice =
      (item as any).standardCost ||
      (item as any).lastPurchasePrice ||
      parseFloat((item as any).valuation || '0') ||
      0;

    const preferredSupplier = suppliersList.find(
      (s) =>
        (item as any).preferredSupplier === s.id ||
        (item as any).preferredSupplier === s.code ||
        (item as any).preferredSupplier === s.name ||
        (item as any).supplierName === s.name
    ) || suppliersList[0];

    const newLine: PurchaseRequisitionLine = {
      id: `PRL-${Date.now()}-${lines.length + 1}`,
      lineNo: lines.length + 1,
      itemCode: item.code,
      itemName: item.name,
      itemCategory: (item as any).category || item.type || 'Polymer Resin',
      description: item.desc || (item as any).description || (item as any).grade || (item as any).specifications || '',
      quantity: 1,
      uom: item.baseUOM || (item as any).uom || 'KG',
      requiredDate: requiredDate,
      suggestedSupplierId: preferredSupplier?.id || preferredSupplier?.code || '',
      suggestedSupplierName: preferredSupplier?.name || (preferredSupplier as any)?.companyName || '',
      estimatedUnitPrice: unitPrice,
      estimatedTotal: 1 * unitPrice,
      workOrderRef: '',
      status: 'pending',
    };

    setLines((prev) => [...prev, newLine]);
    setTopSearchQuery('');
    setIsTopSearchOpen(false);
    showToast(`✓ Added ${item.code} (${item.name}) to Requisition`);
  };

  // Live calculation of Estimated Total
  const totalEstimated = useMemo(() => {
    return lines.reduce((acc, l) => acc + (Number(l.estimatedTotal) || 0), 0);
  }, [lines]);

  const budgetRemaining = budgetAllocated - totalEstimated;
  const budgetExceeded = totalEstimated > budgetAllocated;

  // Add line item
  const handleAddLine = () => {
    const newLine: PurchaseRequisitionLine = {
      id: `PRL-${Date.now()}-${lines.length + 1}`,
      lineNo: lines.length + 1,
      itemCode: '',
      itemName: '',
      itemCategory: '',
      description: '',
      quantity: 1,
      uom: 'KG',
      requiredDate: requiredDate,
      suggestedSupplierId: '',
      suggestedSupplierName: '',
      estimatedUnitPrice: 0,
      estimatedTotal: 0,
      workOrderRef: '',
      status: 'pending',
    };
    setLines((prev) => [...prev, newLine]);
    setActiveSearchIdx(lines.length);
    setRowSearchQuery('');
  };

  // Delete line item with clean index handling
  const handleRemoveLine = (idx: number) => {
    const filtered = lines
      .filter((_, i) => i !== idx)
      .map((l, i) => ({ ...l, lineNo: i + 1 }));
    setLines(filtered);
    showToast(`Removed line item #${idx + 1}`);
  };

  // Update line item and recalculate row total
  const handleUpdateLine = (idx: number, field: keyof PurchaseRequisitionLine, value: any) => {
    const updated = [...lines];
    updated[idx] = { ...updated[idx], [field]: value };

    if (field === 'quantity' || field === 'estimatedUnitPrice') {
      const q = field === 'quantity' ? Number(value) || 0 : Number(updated[idx].quantity) || 0;
      const p = field === 'estimatedUnitPrice' ? Number(value) || 0 : Number(updated[idx].estimatedUnitPrice) || 0;
      updated[idx].estimatedTotal = q * p;
    }
    setLines(updated);
  };

  // Select item from autocomplete
  const handleSelectItem = (idx: number, item: ItemMaster) => {
    const unitPrice =
      (item as any).standardCost ||
      (item as any).lastPurchasePrice ||
      parseFloat((item as any).valuation || '0') ||
      0;

    const preferredSupplier = suppliersList.find(
      (s) =>
        (item as any).preferredSupplier === s.id ||
        (item as any).preferredSupplier === s.code ||
        (item as any).preferredSupplier === s.name ||
        (item as any).supplierName === s.name
    );

    const updated = [...lines];
    const qty = Number(updated[idx]?.quantity) || 1;
    updated[idx] = {
      ...updated[idx],
      itemCode: item.code,
      itemName: item.name,
      itemCategory: (item as any).category || item.type || 'Polymer Resin',
      description: item.desc || (item as any).description || (item as any).grade || (item as any).specifications || '',
      uom: item.baseUOM || (item as any).uom || 'KG',
      estimatedUnitPrice: unitPrice,
      estimatedTotal: qty * unitPrice,
      ...(preferredSupplier ? {
        suggestedSupplierId: preferredSupplier.id || preferredSupplier.code,
        suggestedSupplierName: preferredSupplier.name || (preferredSupplier as any).companyName,
      } : {}),
    };
    setLines(updated);
    setActiveSearchIdx(null);
    setRowSearchQuery('');
    showToast(`Selected item: ${item.code} (${item.name})`);
  };

  // Handle newly created item from wizard
  const handleSaveCreatedItem = (newItem: ItemMaster) => {
    itemService.saveItem(newItem).catch(console.warn);
    setItemsList((prev) => [newItem, ...prev.filter((i) => i.code !== newItem.code)]);

    if (activeCreatingItemLineIdx >= 0 && activeCreatingItemLineIdx < lines.length) {
      handleSelectItem(activeCreatingItemLineIdx, newItem);
    } else {
      handleAddFromTopSearch(newItem);
    }
    setIsCreateItemModalOpen(false);
    showToast(`✓ Created & added new item: ${newItem.code} - ${newItem.name}`);
  };

  // Save PR (Draft or Submit for Approval)
  const handleSave = (submitForApproval = false) => {
    // Basic validation
    const validLines = lines.filter((l) => l.itemName.trim() !== '');
    if (validLines.length === 0) {
      showToast('Please select or specify at least one material line item before saving.');
      return;
    }

    const newPr: PurchaseRequisition = {
      id: existingPr?.id || prNumber,
      prNumber: prNumber.trim(),
      requestDate,
      requestedBy,
      department,
      plantWarehouse,
      requiredDate,
      priority,
      source,
      currency: 'INR (₹)',
      estimatedTotal: totalEstimated,
      budgetAllocated,
      budgetRemaining,
      budgetExceeded,
      status: submitForApproval ? 'pending_approval' : (existingPr?.status || 'draft'),
      approvalStatus: submitForApproval ? 'pending' : (existingPr?.approvalStatus || 'pending'),
      justification,
      notes,
      lines: validLines.map((l, i) => ({
        ...l,
        lineNo: i + 1,
        estimatedTotal: (Number(l.quantity) || 0) * (Number(l.estimatedUnitPrice) || 0),
      })),
      approvalHistory: existingPr?.approvalHistory || [
        {
          step: 1,
          role: department || 'Department Head',
          user: requestedBy,
          action: submitForApproval ? ('Approved' as const) : ('Pending' as const),
          date: new Date().toISOString().slice(0, 10),
          comment: submitForApproval
            ? 'Submitted for multi-level approval and PO authorization'
            : 'Draft purchase requisition created',
        },
      ],
    };

    // Store in global helper and localStorage
    addPurchaseRequisition(newPr);
    onSavePR(newPr);
    adminEventBus.emit('PR_SAVED', newPr);
    adminEventBus.emit('PR_CREATED', newPr);

    showToast(
      submitForApproval
        ? `✓ Purchase Requisition ${prNumber} submitted for approval & recorded in DB!`
        : `✓ Purchase Requisition ${prNumber} saved as draft in DB`
    );
    onNavigate('purchaseReqList');
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => onNavigate('purchaseReqList')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#14213D] transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to PR List
        </button>

        <div className="flex items-center gap-2">
          {existingPr && existingPr.status === 'pending_approval' && (
            <>
              <button
                onClick={() => {
                  const updated: PurchaseRequisition = {
                    ...existingPr,
                    status: 'rejected',
                    approvalStatus: 'rejected',
                  };
                  addPurchaseRequisition(updated);
                  onSavePR(updated);
                  adminEventBus.emit('PR_SAVED', updated);
                  showToast(`PR ${prNumber} Rejected`);
                  onNavigate('purchaseReqList');
                }}
                className="px-3.5 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Reject PR
              </button>

              <button
                onClick={() => {
                  const updated: PurchaseRequisition = {
                    ...existingPr,
                    status: 'approved',
                    approvalStatus: 'approved',
                  };
                  addPurchaseRequisition(updated);
                  onSavePR(updated);
                  adminEventBus.emit('PR_SAVED', updated);
                  showToast(`PR ${prNumber} Approved for PO creation`);
                  onNavigate('purchaseReqList');
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm cursor-pointer"
              >
                Approve PR
              </button>
            </>
          )}

          <button
            onClick={() => handleSave(false)}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-[#14213D] rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" /> Save Draft
          </button>

          <button
            onClick={() => handleSave(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0F8B8D] hover:bg-[#0d797b] text-white rounded-lg text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" /> Submit for Approval
          </button>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        {/* Header Summary */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-slate-100 pb-4 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D]">
                {isEditing ? `Purchase Requisition: ${prNumber}` : 'Create Purchase Requisition'}
              </h1>
              {existingPr && <ProcurementStatusBadge status={existingPr.status} />}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Specify raw materials, required delivery dates, estimated budget, and linked production work orders
            </p>
          </div>

          <div className="text-right bg-slate-50 p-3 rounded-xl border border-slate-100 min-w-[180px]">
            <div className="text-[10px] uppercase font-semibold text-slate-400">Estimated Total</div>
            <div className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D]">
              ₹{(totalEstimated / 100000).toFixed(2)} Lakhs
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              (₹{totalEstimated.toLocaleString('en-IN')})
            </div>
          </div>
        </div>

        {/* Requisition Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {/* PR Number - Non-editable, Governed by Admin Backend */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-600">PR Number</label>
              <span className="text-[10px] text-amber-600 font-medium flex items-center gap-0.5">
                <Lock className="w-2.5 h-2.5" /> Admin Governed
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={prNumber}
                readOnly
                disabled
                className="w-full px-3 py-2 border rounded-lg bg-slate-100 text-slate-700 font-mono text-xs font-bold cursor-not-allowed border-slate-200"
                title="PR Number is auto-generated sequentially by Admin Numbering Sequences"
              />
              <Lock className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Requester & Dept - Auto-populated from logged-in user */}
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Requester & Dept</label>
            <div className="relative">
              <input
                type="text"
                value={requestedBy}
                onChange={(e) => setRequestedBy(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border rounded-lg text-xs font-medium text-slate-800"
                placeholder="User Name (Department)"
              />
              <User className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/* Plant / Receiving Warehouse */}
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Plant / Receiving Warehouse</label>
            <select
              value={plantWarehouse}
              onChange={(e) => setPlantWarehouse(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-xs bg-white text-slate-800"
            >
              <option value="RM-WH-01 (Main Plant)">RM-WH-01 (Main Plant - Hosur)</option>
              <option value="RM-WH-02 (Additive Store)">RM-WH-02 (Additive & Masterbatch Store)</option>
              <option value="SP-WH-01 (Tooling Store)">SP-WH-01 (Tooling & Spares Store)</option>
              <option value="FG-WH-01 (Finished Goods)">FG-WH-01 (Finished Goods Warehouse)</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full px-3 py-2 border rounded-lg text-xs bg-white font-semibold text-slate-800"
            >
              <option value="Urgent">Urgent (Production Stop Risk)</option>
              <option value="High">High (Standard Replenishment)</option>
              <option value="Medium">Medium (Scheduled Buffer)</option>
              <option value="Low">Low (Non-critical / General)</option>
            </select>
          </div>

          {/* Request Date */}
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Request Date</label>
            <input
              type="date"
              value={requestDate}
              onChange={(e) => setRequestDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-xs bg-white text-slate-800"
            />
          </div>

          {/* Required Delivery Date */}
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Required Delivery Date</label>
            <input
              type="date"
              value={requiredDate}
              onChange={(e) => setRequiredDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-xs bg-white text-slate-800"
            />
          </div>

          {/* Requisition Source */}
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Requisition Source</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as any)}
              className="w-full px-3 py-2 border rounded-lg text-xs bg-white text-slate-800"
            >
              <option value="MRP">MRP Shortage Calculation</option>
              <option value="Production Work Order">Production Work Order</option>
              <option value="Warehouse Reorder">Warehouse Safety Buffer</option>
              <option value="Maintenance Job">Maintenance Job</option>
              <option value="Manual">Manual Entry</option>
            </select>
          </div>

          {/* Budget Allocation Status */}
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Budget Allocation Status</label>
            <div
              className={`p-2 border rounded-lg text-[11px] font-semibold flex items-center justify-between ${
                budgetExceeded
                  ? 'bg-red-50 text-red-800 border-red-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              <span>₹{(budgetAllocated / 100000).toFixed(1)}L Budget</span>
              <span className="font-bold">
                {budgetExceeded
                  ? `Exceeded (+₹${((totalEstimated - budgetAllocated) / 100000).toFixed(2)}L)`
                  : `Within Limit (₹${(budgetRemaining / 100000).toFixed(2)}L left)`}
              </span>
            </div>
          </div>
        </div>

        {/* Requisition Line Items Section */}
        <div className="space-y-4">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#14213D]">
                  Requisition Line Items ({lines.length})
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 text-[#0F8B8D] border border-teal-200 font-semibold flex items-center gap-1">
                  <Package className="w-2.5 h-2.5" /> Item Master ({itemsList.length} Catalogued)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Search item by code/name to add instantly, or create a new item directly into Item Master
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenCreateItemModal('', -1)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E8622C] hover:bg-[#d45320] text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>+ Create New Item</span>
              </button>

              <button
                type="button"
                onClick={handleAddLine}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F8B8D] hover:bg-[#0d797b] text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Blank Row</span>
              </button>
            </div>
          </div>

          {/* Quick-Add Item Master Search Bar */}
          <div ref={topSearchContainerRef} className="relative">
            <div className="relative flex items-center">
              <div className="absolute left-3 text-slate-400 pointer-events-none">
                <Search className="w-4 h-4 text-[#0F8B8D]" />
              </div>
              <input
                type="text"
                placeholder="🔍 Search & Add Item by Code (e.g. IN-RM-01, HDPE-5502) or Name, Grade, Category..."
                value={topSearchQuery}
                onFocus={() => setIsTopSearchOpen(true)}
                onClick={() => setIsTopSearchOpen(true)}
                onChange={(e) => {
                  setTopSearchQuery(e.target.value);
                  setIsTopSearchOpen(true);
                }}
                className="w-full pl-9 pr-24 py-2.5 bg-white border-2 border-slate-200 hover:border-[#0F8B8D]/60 focus:border-[#0F8B8D] rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F8B8D]/20 transition shadow-xs"
              />
              <div className="absolute right-2 flex items-center gap-1.5">
                {topSearchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setTopSearchQuery('');
                      setIsTopSearchOpen(false);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer text-xs"
                  >
                    ✕
                  </button>
                )}
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-md font-mono font-medium">
                  {topFilteredItems.length} found
                </span>
              </div>
            </div>

            {/* Quick-Add Dropdown Popover */}
            {isTopSearchOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-2xl border border-slate-200 z-[100] overflow-hidden animate-fade-in max-h-80 flex flex-col">
                <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-600 font-semibold">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <Package className="w-3.5 h-3.5 text-[#0F8B8D]" /> Select Material from Item Master
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    Click any item to add to PR
                  </span>
                </div>

                <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
                  {topFilteredItems.length === 0 ? (
                    <div className="p-5 text-center space-y-2">
                      <p className="text-xs font-semibold text-slate-700">
                        No item found matching "{topSearchQuery}"
                      </p>
                      <p className="text-[11px] text-slate-500">
                        This item does not exist in Master Data. Click below to create it now.
                      </p>
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleOpenCreateItemModal(topSearchQuery, -1);
                        }}
                        onClick={() => handleOpenCreateItemModal(topSearchQuery, -1)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#E8622C] hover:bg-[#d45320] text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>+ Create "{topSearchQuery}" in Item Master</span>
                      </button>
                    </div>
                  ) : (
                    topFilteredItems.map((item) => (
                      <div
                        key={item.code}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleAddFromTopSearch(item);
                        }}
                        onClick={() => handleAddFromTopSearch(item)}
                        className="p-3 hover:bg-teal-50/80 cursor-pointer transition flex items-center justify-between gap-3 group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-[#14213D] group-hover:text-[#0F8B8D] transition">
                              {item.name}
                            </span>
                            <span className="text-[10px] font-mono text-teal-800 bg-teal-100 px-1.5 py-0.5 rounded font-bold border border-teal-200">
                              {item.code}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                              {item.type || (item as any).category || 'Raw Material'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {item.desc || (item as any).description || (item as any).grade || 'Polymer raw material specification'}
                          </div>
                        </div>

                        <div className="text-right shrink-0 flex items-center gap-3">
                          <div>
                            <div className="font-bold text-[#0F8B8D] text-xs font-mono">
                              ₹{((item as any).standardCost || (item as any).lastPurchasePrice || (item as any).valuation || 0).toLocaleString('en-IN')}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              / {item.baseUOM || (item as any).uom || 'KG'}
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-[#0F8B8D] text-white opacity-0 group-hover:opacity-100 transition shadow-xs">
                            + Add
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {topFilteredItems.length > 0 && (
                  <div className="p-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">
                      Need an unlisted material?
                    </span>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleOpenCreateItemModal(topSearchQuery, -1);
                      }}
                      onClick={() => handleOpenCreateItemModal(topSearchQuery, -1)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#E8622C] hover:underline cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>+ Create New Item in Item Master</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Lines Table or Empty State */}
          {lines.length === 0 ? (
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50/50 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 text-[#0F8B8D] mx-auto flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto">
                <h4 className="text-sm font-bold text-[#14213D]">
                  No Requisition Line Items Added
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Use the search bar above to quickly search and add items from Item Master, or click below to add a blank row or create a new item.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleAddLine}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0F8B8D] hover:bg-[#0d797b] text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Material Line
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenCreateItemModal('', -1)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#E8622C] hover:bg-[#d45320] text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" /> + Create New Item in Master
                </button>
              </div>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-visible min-h-[300px] pb-20">
              <div className="overflow-x-auto overflow-y-visible">
                <table className="w-full text-xs text-left min-w-[900px]">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 w-10">#</th>
                      <th className="py-2.5 px-3 min-w-[280px]">Item / Description</th>
                      <th className="py-2.5 px-3 text-right w-28">Quantity</th>
                      <th className="py-2.5 px-3 w-20">UOM</th>
                      <th className="py-2.5 px-3 min-w-[200px]">Suggested Vendor</th>
                      <th className="py-2.5 px-3 text-right w-32">Est. Unit Price (₹)</th>
                      <th className="py-2.5 px-3 text-right w-32">Total (₹)</th>
                      <th className="py-2.5 px-3 text-center w-28">Work Order</th>
                      <th className="py-2.5 px-3 text-center w-12">Del</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lines.map((line, idx) => {
                      const isSearchingThisLine = activeSearchIdx === idx;
                      return (
                        <tr key={line.id} className="hover:bg-slate-50/60 relative">
                          <td className="py-2 px-3 font-semibold text-slate-400">{idx + 1}</td>

                          {/* Item / Description with Searchable Autocomplete & + Create New Item */}
                          <td className="py-2 px-3 relative">
                            <div
                              ref={isSearchingThisLine ? searchContainerRef : undefined}
                              className="relative"
                            >
                              <div className="flex items-center relative">
                                <input
                                  type="text"
                                  placeholder="Search live item name or SKU..."
                                  value={line.itemName}
                                  onFocus={() => {
                                    setActiveSearchIdx(idx);
                                    setRowSearchQuery(line.itemName || '');
                                  }}
                                  onClick={() => {
                                    setActiveSearchIdx(idx);
                                    setRowSearchQuery(line.itemName || '');
                                  }}
                                  onChange={(e) => {
                                    handleUpdateLine(idx, 'itemName', e.target.value);
                                    setRowSearchQuery(e.target.value);
                                    setActiveSearchIdx(idx);
                                  }}
                                  className="w-full pl-2.5 pr-20 py-1.5 border rounded-lg text-xs font-semibold text-[#14213D] focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none bg-white"
                                />
                                <div className="absolute right-1.5 flex items-center gap-1">
                                  {line.itemCode && (
                                    <span className="px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 text-[9px] font-mono font-bold border border-teal-200">
                                      {line.itemCode}
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (activeSearchIdx === idx) {
                                        setActiveSearchIdx(null);
                                      } else {
                                        setActiveSearchIdx(idx);
                                        setRowSearchQuery(line.itemName || '');
                                      }
                                    }}
                                    className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                                    title="Browse item catalog"
                                  >
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <input
                                type="text"
                                placeholder="Polymer specs / MFI / Grade / Tooling details"
                                value={line.description || ''}
                                onChange={(e) => handleUpdateLine(idx, 'description', e.target.value)}
                                className="w-full px-2.5 py-1 border rounded-lg text-[11px] text-slate-600 mt-1 focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none bg-slate-50/50"
                              />

                              {/* Live Autocomplete Popover */}
                              {isSearchingThisLine && (
                                <div
                                  className="absolute left-0 top-full mt-1 w-[420px] bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-fade-in"
                                >
                                  <div className="p-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                                      <Search className="w-3 h-3 text-[#0F8B8D]" /> Item Master Single Source ({itemsList.length} Total)
                                    </span>
                                    <span className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-mono font-bold">
                                      {rowFilteredItems.length} matching
                                    </span>
                                  </div>

                                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 text-xs">
                                    {rowFilteredItems.length === 0 ? (
                                      <div className="p-4 text-center text-slate-400 text-xs space-y-1">
                                        <p>No matching item found in Item Master catalog.</p>
                                        <p className="text-[10px] text-slate-400">Click below to create this new item directly into Item Master.</p>
                                      </div>
                                    ) : (
                                      rowFilteredItems.map((item) => (
                                        <div
                                          key={item.code}
                                          onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleSelectItem(idx, item);
                                          }}
                                          onClick={() => handleSelectItem(idx, item)}
                                          className="p-2.5 hover:bg-teal-50/70 cursor-pointer transition flex items-start justify-between gap-2"
                                        >
                                          <div className="min-w-0 flex-1">
                                            <div className="font-bold text-[#14213D] flex items-center gap-1.5 flex-wrap">
                                              <span>{item.name}</span>
                                              <span className="text-[10px] font-mono text-teal-700 bg-teal-100/70 px-1.5 py-0.2 rounded font-bold">
                                                {item.code}
                                              </span>
                                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                                                {item.type || (item as any).category || 'Resin'}
                                              </span>
                                            </div>
                                            <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                                              {item.desc || (item as any).description || (item as any).grade || 'Standard Item Specification'}
                                            </div>
                                          </div>

                                          <div className="text-right shrink-0 pl-2">
                                            <div className="font-bold text-[#0F8B8D] text-xs font-mono">
                                              ₹{(item as any).standardCost || (item as any).lastPurchasePrice || (item as any).valuation || 0}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-mono">
                                              / {item.baseUOM || (item as any).uom || 'KG'}
                                            </div>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>

                                  {/* + Create New Item action trigger */}
                                  <div className="p-2 bg-slate-50 border-t border-slate-100">
                                    <button
                                      type="button"
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleOpenCreateItemModal(rowSearchQuery, idx);
                                      }}
                                      onClick={() => handleOpenCreateItemModal(rowSearchQuery, idx)}
                                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-[#E8622C] hover:bg-[#d45320] text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                                    >
                                      <Sparkles className="w-3.5 h-3.5" />
                                      <span>
                                        + Create New Item in Master Data{' '}
                                        {rowSearchQuery.trim() ? `"${rowSearchQuery.trim()}"` : ''}
                                      </span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Quantity */}
                          <td className="py-2 px-3 text-right">
                            <input
                              type="number"
                              min="1"
                              step="any"
                              value={line.quantity}
                              onChange={(e) => handleUpdateLine(idx, 'quantity', e.target.value)}
                              className="w-full px-2 py-1.5 border rounded-lg text-xs text-right font-bold text-[#14213D] focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none"
                            />
                          </td>

                          {/* UOM */}
                          <td className="py-2 px-3">
                            <select
                              value={line.uom}
                              onChange={(e) => handleUpdateLine(idx, 'uom', e.target.value)}
                              className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white text-slate-800"
                            >
                              <option value="KG">KG</option>
                              <option value="PCS">PCS</option>
                              <option value="SET">SET</option>
                              <option value="MTR">MTR</option>
                              <option value="LTR">LTR</option>
                              <option value="BOX">BOX</option>
                              <option value="BAG">BAG</option>
                            </select>
                          </td>

                          {/* Suggested Vendor */}
                          <td className="py-2 px-3">
                            <select
                              value={
                                line.suggestedSupplierId ||
                                suppliersList.find(
                                  (sup) =>
                                    sup.name === line.suggestedSupplierName ||
                                    (sup as any).companyName === line.suggestedSupplierName ||
                                    (sup as any).supplierName === line.suggestedSupplierName
                                )?.id ||
                                line.suggestedSupplierName ||
                                ''
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                const s = suppliersList.find(
                                  (sup) =>
                                    sup.id === val ||
                                    sup.code === val ||
                                    sup.name === val ||
                                    (sup as any).supplierName === val ||
                                    (sup as any).companyName === val
                                );
                                handleUpdateLine(idx, 'suggestedSupplierId', s ? (s.id || s.code) : val);
                                handleUpdateLine(
                                  idx,
                                  'suggestedSupplierName',
                                  s ? (s.name || (s as any).companyName || (s as any).supplierName) : val
                                );
                              }}
                              className="w-full px-2 py-1.5 border border-slate-200 hover:border-slate-300 rounded-lg text-xs bg-white text-slate-800 focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none transition shadow-2xs font-medium"
                            >
                              <option value="">-- Select Vendor --</option>
                              {suppliersList.map((s) => {
                                const sId = s.id || s.code || s.name;
                                const sName = s.name || (s as any).companyName || (s as any).supplierName || sId;
                                const sCode = s.code || s.id || '';
                                return (
                                  <option key={sId} value={sId}>
                                    {sName} {sCode && sCode !== sName ? `(${sCode})` : ''}
                                  </option>
                                );
                              })}
                            </select>
                          </td>

                          {/* Estimated Unit Price */}
                          <td className="py-2 px-3 text-right">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={line.estimatedUnitPrice}
                              onChange={(e) =>
                                handleUpdateLine(idx, 'estimatedUnitPrice', e.target.value)
                              }
                              className="w-full px-2 py-1.5 border rounded-lg text-xs text-right font-semibold text-slate-800 focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none"
                            />
                          </td>

                          {/* Line Total (₹) */}
                          <td className="py-2 px-3 text-right font-bold text-[#14213D] font-mono">
                            ₹{(line.estimatedTotal || 0).toLocaleString('en-IN')}
                          </td>

                          {/* Work Order Ref */}
                          <td className="py-2 px-3 text-center">
                            <input
                              type="text"
                              placeholder="WO-1188"
                              value={line.workOrderRef || ''}
                              onChange={(e) => handleUpdateLine(idx, 'workOrderRef', e.target.value)}
                              className="w-full px-1.5 py-1 border rounded text-[11px] font-mono text-center text-slate-700"
                            />
                          </td>

                          {/* Delete Line Action */}
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveLine(idx)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                              title="Delete Line Item"
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
            </div>
          )}
        </div>

        {/* Justification & Approval Status Trail */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-600 mb-1">
              Business Justification / Procurement Notes
            </label>
            <textarea
              rows={3}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="State clear operational reason for requisition (e.g. safety stock breach, export work order commitment, maintenance overhaul)..."
              className="w-full p-2.5 border rounded-lg text-xs text-slate-800 focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Approval Workflow Status</label>
            <div className="p-3 bg-slate-50 border rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">1. Department Verification</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Approved
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">2. Plant Budget Approval</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Approved
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">3. Procurement VP Sign-off</span>
                <span className="text-amber-600 font-bold">
                  {isEditing && existingPr?.status === 'approved' ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Approved
                    </span>
                  ) : (
                    'Pending Review'
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Item Wizard Modal integration */}
      {isCreateItemModalOpen && (
        <CreateItemWizardModal
          isOpen={isCreateItemModalOpen}
          onClose={() => {
            setIsCreateItemModalOpen(false);
            setItemToCreate(null);
          }}
          onSaveItem={handleSaveCreatedItem}
          editItem={itemToCreate}
          allItems={itemsList}
          showToast={showToast}
        />
      )}
    </div>
  );
};
