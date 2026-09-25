import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  Plus,
  ArrowUpDown,
  Eye,
  SlidersHorizontal,
  Package,
  Layers,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  X,
  ArrowLeftRight,
  ArrowDownLeft,
  ArrowUpRight,
  History,
  Building2,
  Truck,
  Factory,
  ShieldCheck,
  Tag,
  FileText,
  UserCheck,
  RotateCcw,
  Sparkles,
  Box,
  Wrench,
  Boxes,
  Cpu,
  Clock,
  RefreshCw,
} from 'lucide-react';
import {
  InventoryStockItem,
  InventoryStockLot,
  StockMovementLedgerEntry,
  LedgerTransactionStatus,
} from '../../types/warehouse';
import { INITIAL_INVENTORY_STOCK, INITIAL_STOCK_MOVEMENT_LEDGER } from '../../data/warehouseData';
import { getStockMovementLedger, getWarehouseStock } from '../../utils/warehouseSync';
import { WarehouseStatusBadge } from './WarehouseStatusBadge';
import { PaginationBar } from '../common/PaginationBar';
import { ItemLotLedgerModal } from './ItemLotLedgerModal';

interface Props {
  stockItems?: InventoryStockItem[];
  onNavigate?: (view: string, param?: any) => void;
  openDrawer?: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer?: () => void;
  showToast?: (msg: string) => void;
  onUpdateItem?: (updated: InventoryStockItem) => void;
}

export const StockLedgerListView: React.FC<Props> = ({
  stockItems = INITIAL_INVENTORY_STOCK,
  onNavigate = (_view?: string, _param?: any) => {},
  openDrawer = (_title?: string, _content?: React.ReactNode, _footer?: React.ReactNode) => {},
  closeDrawer = () => {},
  showToast = (_msg?: string) => {},
  onUpdateItem,
}) => {
  // Navigation Tabs: 'overview' | 'ledger_items' | 'inward' | 'outward'
  const [activeLedgerTab, setActiveLedgerTab] = useState<'overview' | 'ledger_items' | 'inward' | 'outward'>('overview');

  // Store Filter for Task-3: 'ALL' | 'RM' | 'WIP' | 'CON' | 'PCK' | 'BOP' | 'FG'
  const [selectedStoreType, setSelectedStoreType] = useState<string>('ALL');

  // Common and Overview State
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedItemForLots, setSelectedItemForLots] = useState<InventoryStockItem | null>(null);

  // Status Filter for Ledger Items (Task-4): 'ALL' | 'OPEN' | 'CLOSED' | 'IN TRANSIT'
  const [selectedLedgerStatus, setSelectedLedgerStatus] = useState<string>('ALL');

  // Inward Ledger Filter State ("Where From In")
  const [inwardSourceFilter, setInwardSourceFilter] = useState<string>('ALL');

  // Outward Ledger Filter State ("What Purpose Is Out")
  const [outwardPurposeFilter, setOutwardPurposeFilter] = useState<string>('ALL');

  // Customer Filter State for 100,000+ Customer Accounts
  const [ledgerCustomerSearch, setLedgerCustomerSearch] = useState<string>('');
  const [modalCustomerSearch, setModalCustomerSearch] = useState<string>('');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [expandedModalRowId, setExpandedModalRowId] = useState<string | null>(null);

  // Movement Ledger Entries state (synchronized with warehouse storage)
  const [movementLedger, setMovementLedger] = useState<StockMovementLedgerEntry[]>(() => getStockMovementLedger());
  const [internalStock, setInternalStock] = useState<InventoryStockItem[]>(() => getWarehouseStock());

  // Listen for real-time ledger and stock updates from GRN Putaway and Daily Production
  useEffect(() => {
    const handleLedgerUpdate = (e: any) => {
      if (e.detail?.ledger) {
        setMovementLedger(e.detail.ledger);
      }
    };
    const handleStockUpdate = (e: any) => {
      if (e.detail?.stock) {
        setInternalStock(e.detail.stock);
      }
    };
    window.addEventListener('warehouse_ledger_updated', handleLedgerUpdate);
    window.addEventListener('warehouse_stock_updated', handleStockUpdate);
    return () => {
      window.removeEventListener('warehouse_ledger_updated', handleLedgerUpdate);
      window.removeEventListener('warehouse_stock_updated', handleStockUpdate);
    };
  }, []);

  const activeStockList = internalStock.length > 0 ? internalStock : (stockItems || []);

  // Store Type Definitions (Task 4: Add Assembly Store and De-Flash Store)
  const storeTypes = [
    { id: 'ALL', label: 'All Stores', icon: Building2 },
    { id: 'RM', label: 'RM (Raw Materials)', icon: Package },
    { id: 'WIP', label: 'WIP (Work In Progress)', icon: Factory },
    { id: 'ASM', label: 'ASM (Assembly Store)', icon: Layers },
    { id: 'DFL', label: 'DFL (De-Flash Store)', icon: Sparkles },
    { id: 'CON', label: 'CON (Consumables)', icon: Wrench },
    { id: 'PCK', label: 'PCK (Packaging)', icon: Box },
    { id: 'BOP', label: 'BOP (Bought-Out Parts)', icon: Cpu },
    { id: 'FG', label: 'FG (Finished Goods)', icon: Boxes },
  ];

  const categories = [
    'ALL',
    'Virgin Polymer',
    'Masterbatch',
    'Regrind Polymer',
    'WIP Store',
    'Assembly Store',
    'De-Flash Store',
    'Consumables',
    'Packaging Store',
    'BOP Store',
    'Molded Part (FG)',
  ];

  const inwardSources = [
    { label: 'ALL ORIGINS', value: 'ALL' },
    { label: 'Vendor GRN Inward', value: 'VENDOR_GRN' },
    { label: 'Molding Output Inward', value: 'PRODUCTION_OUTPUT' },
    { label: 'Deflash / QC Return', value: 'DEFLASH_RETURN' },
    { label: 'Granulator Regrind', value: 'REGRIND_RECOVERY' },
    { label: 'Inter-Plant Transfer', value: 'INTER_PLANT_TRANSFER' },
  ];

  const outwardPurposes = [
    { label: 'ALL PURPOSES', value: 'ALL' },
    { label: 'Molding WO Production Issue', value: 'PRODUCTION_ISSUE' },
    { label: 'Assembly Line Requisition', value: 'ASSEMBLY_REQUISITION' },
    { label: 'Deflash & Trimming Issue', value: 'DEFLASH_TRIMMING' },
    { label: 'Customer Tax Invoice Dispatch', value: 'CUSTOMER_DISPATCH' },
    { label: 'QC Scrap & Defect Quarantine', value: 'QC_REJECTION_SCRAP' },
    { label: 'Subcontracting Job Work', value: 'SUBCONTRACT_JOB' },
  ];

  // Helper to identify storeType from category if not explicitly set
  const resolveStoreType = (item: InventoryStockItem): string => {
    if (item.storeType) return item.storeType;
    if (item.category === 'WIP Store') return 'WIP';
    if (item.category === 'Assembly Store') return 'ASM';
    if (item.category === 'De-Flash Store' || (item.category as string) === 'Deflash Store') return 'DFL';
    if (item.category === 'Consumables') return 'CON';
    if (item.category === 'Packaging Store' || item.category === 'Packaging Material') return 'PCK';
    if (item.category === 'BOP Store' || item.category === 'Insert / Hardware') return 'BOP';
    if (item.category === 'Molded Part (FG)') return 'FG';
    return 'RM';
  };

  // Filter Stock Overview Items by Search, Store Type (Task-3 & Task-4), and Category
  const filteredItems = useMemo(() => {
    return activeStockList.filter((item) => {
      const matchSearch =
        item.sku.toLowerCase().includes(search.toLowerCase()) ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.primaryBin.toLowerCase().includes(search.toLowerCase()) ||
        (item.resinGrade && item.resinGrade.toLowerCase().includes(search.toLowerCase()));

      const itemStore = resolveStoreType(item);
      const matchStore = selectedStoreType === 'ALL' || itemStore === selectedStoreType;
      const matchCat = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchStatus = selectedStatus === 'ALL' || item.status === selectedStatus;

      return matchSearch && matchStore && matchCat && matchStatus;
    });
  }, [activeStockList, search, selectedStoreType, selectedCategory, selectedStatus]);

  // Filter Master "Ledger Items" Grid (Task-2 & Task-4: search, status OPEN/CLOSED/IN TRANSIT)
  const filteredLedgerEntries = useMemo(() => {
    return movementLedger.filter((entry) => {
      const matchSearch =
        entry.docNumber.toLowerCase().includes(search.toLowerCase()) ||
        entry.sku.toLowerCase().includes(search.toLowerCase()) ||
        entry.itemName.toLowerCase().includes(search.toLowerCase()) ||
        (entry.lotNumber && entry.lotNumber.toLowerCase().includes(search.toLowerCase())) ||
        entry.location.toLowerCase().includes(search.toLowerCase()) ||
        (entry.supplier && entry.supplier.toLowerCase().includes(search.toLowerCase())) ||
        (entry.customer && entry.customer.toLowerCase().includes(search.toLowerCase())) ||
        (entry.referenceNumber && entry.referenceNumber.toLowerCase().includes(search.toLowerCase())) ||
        (entry.parentDocNumber && entry.parentDocNumber.toLowerCase().includes(search.toLowerCase()));

      const matchStatus = selectedLedgerStatus === 'ALL' || entry.status === selectedLedgerStatus;
      return matchSearch && matchStatus;
    });
  }, [movementLedger, search, selectedLedgerStatus]);

  // Filter "Where From In" Entries
  const filteredInwardEntries = useMemo(() => {
    return movementLedger
      .filter((m) => m.movementType === 'IN' || m.qtyIn > 0)
      .filter((entry) => {
        const matchSearch =
          entry.sku.toLowerCase().includes(search.toLowerCase()) ||
          entry.itemName.toLowerCase().includes(search.toLowerCase()) ||
          (entry.lotNumber && entry.lotNumber.toLowerCase().includes(search.toLowerCase())) ||
          (entry.sourceOrigin && entry.sourceOrigin.toLowerCase().includes(search.toLowerCase())) ||
          (entry.sourceReference && entry.sourceReference.toLowerCase().includes(search.toLowerCase())) ||
          (entry.sourceLocation && entry.sourceLocation.toLowerCase().includes(search.toLowerCase())) ||
          (entry.authorizedBy && entry.authorizedBy.toLowerCase().includes(search.toLowerCase()));

        const matchSource = inwardSourceFilter === 'ALL' || entry.sourceType === inwardSourceFilter;
        return matchSearch && matchSource;
      });
  }, [movementLedger, search, inwardSourceFilter]);

  // Filter "What Purpose Is Out" Entries
  const filteredOutwardEntries = useMemo(() => {
    return movementLedger
      .filter((m) => m.movementType === 'OUT' || m.qtyOut > 0)
      .filter((entry) => {
        const matchSearch =
          entry.sku.toLowerCase().includes(search.toLowerCase()) ||
          entry.itemName.toLowerCase().includes(search.toLowerCase()) ||
          (entry.lotNumber && entry.lotNumber.toLowerCase().includes(search.toLowerCase())) ||
          (entry.purposeDescription && entry.purposeDescription.toLowerCase().includes(search.toLowerCase())) ||
          (entry.destinationStore && entry.destinationStore.toLowerCase().includes(search.toLowerCase())) ||
          (entry.outwardReference && entry.outwardReference.toLowerCase().includes(search.toLowerCase())) ||
          (entry.authorizedBy && entry.authorizedBy.toLowerCase().includes(search.toLowerCase()));

        const matchPurpose = outwardPurposeFilter === 'ALL' || entry.purposeType === outwardPurposeFilter;
        return matchSearch && matchPurpose;
      });
  }, [movementLedger, search, outwardPurposeFilter]);

  // Active items count based on tab
  const activeItemsCount =
    activeLedgerTab === 'overview'
      ? filteredItems.length
      : activeLedgerTab === 'ledger_items'
      ? filteredLedgerEntries.length
      : activeLedgerTab === 'inward'
      ? filteredInwardEntries.length
      : filteredOutwardEntries.length;

  const totalPages = Math.ceil(activeItemsCount / pageSize) || 1;

  const paginatedOverviewItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  const paginatedLedgerItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLedgerEntries.slice(start, start + pageSize);
  }, [filteredLedgerEntries, currentPage, pageSize]);

  const paginatedInwardItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredInwardEntries.slice(start, start + pageSize);
  }, [filteredInwardEntries, currentPage, pageSize]);

  const paginatedOutwardItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOutwardEntries.slice(start, start + pageSize);
  }, [filteredOutwardEntries, currentPage, pageSize]);

  // Open Quick Stock Adjustment Drawer
  const openStockAdjustmentDrawer = (item: InventoryStockItem) => {
    let adjustmentQty = 0;
    let reason = 'Physical Count Cycle Variance';
    let targetBin = item.primaryBin;

    openDrawer(
      `Quick Stock Adjustment &mdash; ${item.sku}`,
      <div className="space-y-4 text-xs">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
          <div className="font-bold text-slate-800 text-sm">{item.name}</div>
          <div className="text-slate-500 font-mono">
            Current On Hand: <span className="font-bold text-[#14213D]">{item.totalOnHand.toLocaleString()} {item.uom}</span>
          </div>
          <div className="text-slate-500">
            Warehouse: {item.primaryWarehouse} &bull; Bin: {item.primaryBin}
          </div>
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-slate-700">Adjustment Quantity (+ for inward, - for writeoff)</label>
          <input
            type="number"
            defaultValue={adjustmentQty}
            onChange={(e) => (adjustmentQty = parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#0F8B8D] outline-none"
            placeholder="e.g. +500 or -25"
          />
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-slate-700">Adjustment Reason</label>
          <select
            defaultValue={reason}
            onChange={(e) => (reason = e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#0F8B8D] outline-none"
          >
            <option value="Physical Count Cycle Variance">Physical Count Cycle Variance</option>
            <option value="Hopper / Conveying Spillage Write-off">Hopper / Conveying Spillage Write-off</option>
            <option value="Lab Moisture Sample Consumption">Lab Moisture Sample Consumption</option>
            <option value="Manual GRN Correction">Manual GRN Correction</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-slate-700">Storage Location Bin</label>
          <input
            type="text"
            defaultValue={targetBin}
            onChange={(e) => (targetBin = e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#0F8B8D] outline-none"
          />
        </div>
      </div>,
      <div className="flex items-center justify-end gap-2 w-full">
        <button
          onClick={closeDrawer}
          className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            const updatedOnHand = Math.max(0, item.totalOnHand + adjustmentQty);
            const updatedItem: InventoryStockItem = {
              ...item,
              totalOnHand: updatedOnHand,
              availableToPromise: Math.max(0, updatedOnHand - item.allocatedToProduction - item.reservedForOrders),
              totalValuationInr: updatedOnHand * item.unitCostInr,
              primaryBin: targetBin,
            };
            if (onUpdateItem) onUpdateItem(updatedItem);

            // Record to movement ledger
            const newMovement: StockMovementLedgerEntry = {
              id: `MOV-${Date.now()}`,
              timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
              ledgerDate: new Date().toLocaleDateString('en-GB'),
              docType: adjustmentQty >= 0 ? 'RECEIPTS' : 'ISSUES',
              docNumber: `ADJ26-${Date.now().toString().slice(-4)}`,
              location: targetBin,
              locationType: 'WAREHOUSE',
              supplier: adjustmentQty >= 0 ? 'Physical Audit Correction' : '',
              customer: '',
              sku: item.sku,
              itemName: item.name,
              lotNumber: item.lots?.[0]?.lotNumber || 'BULK-STOCK',
              unitPrice: item.unitCostInr,
              movementType: adjustmentQty >= 0 ? 'IN' : 'OUT',
              quantity: Math.abs(adjustmentQty),
              qtyIn: adjustmentQty >= 0 ? adjustmentQty : 0,
              qtyOut: adjustmentQty < 0 ? Math.abs(adjustmentQty) : 0,
              uom: item.uom,
              status: 'CLOSED',
              sourceOrigin: adjustmentQty >= 0 ? `Physical Inventory Adjustment (+${adjustmentQty})` : item.primaryBin,
              sourceReference: `ADJ-${Date.now().toString().slice(-6)}`,
              sourceLocation: targetBin,
              purposeDescription: `Adjustment: ${reason}`,
              destinationStore: adjustmentQty >= 0 ? targetBin : 'SCRAP-VARIANCE-LOG',
              outwardReference: `ADJ-${Date.now().toString().slice(-6)}`,
              authorizedBy: 'Warehouse Manager (Audit)',
              runningBalance: updatedOnHand,
              notes: `Adjustment posted on ${new Date().toLocaleDateString()}: ${reason}`,
            };
            setMovementLedger((prev) => [newMovement, ...prev]);

            closeDrawer();
            showToast(`Adjusted ${item.sku} by ${adjustmentQty > 0 ? '+' : ''}${adjustmentQty} ${item.uom}`);
          }}
          className="px-4 py-2 bg-[#14213D] hover:bg-[#1f325c] text-white rounded-lg text-xs font-semibold"
        >
          Post Inventory Adjustment
        </button>
      </div>
    );
  };

  // Export to CSV helper for the current active tab
  const handleExportCSV = () => {
    if (activeLedgerTab === 'overview') {
      const headers = ['SKU', 'Item Name', 'Store Type', 'Category', 'Primary Bin', 'On Hand', 'Allocated', 'Available', 'Unit Cost (INR)', 'Total Valuation (INR)', 'Status'];
      const rows = filteredItems.map((i) => [
        i.sku,
        `"${i.name.replace(/"/g, '""')}"`,
        resolveStoreType(i),
        i.category,
        i.primaryBin,
        i.totalOnHand,
        i.allocatedToProduction,
        i.availableToPromise,
        i.unitCostInr,
        i.totalValuationInr,
        i.status,
      ]);

      downloadCSV(headers, rows, `Reboot_Stock_Overview_${new Date().toISOString().slice(0, 10)}.csv`);
      showToast('Stock Overview exported to CSV');
    } else if (activeLedgerTab === 'ledger_items') {
      const headers = ['Ledger Date', 'Doc. Type', 'Doc #', 'Location', 'Location Type', 'Customer', 'Supplier', 'Lot #', 'Unit Price', 'Parent Doc. Type', 'Parent Doc #', 'Reference #', 'Qty/UOM', 'UOM', 'Qty IN', 'Qty OUT', 'Status'];
      const rows = filteredLedgerEntries.map((e) => [
        `"${e.ledgerDate}"`,
        e.docType,
        e.docNumber,
        e.location,
        e.locationType,
        `"${(e.customer || '').replace(/"/g, '""')}"`,
        `"${(e.supplier || '').replace(/"/g, '""')}"`,
        e.lotNumber || '',
        e.unitPrice !== undefined ? e.unitPrice.toFixed(2) : '',
        e.parentDocType || '',
        e.parentDocNumber || '',
        e.referenceNumber || '',
        e.qtyPerUom || 1,
        e.uom,
        e.qtyIn ? e.qtyIn.toFixed(4) : '',
        e.qtyOut ? e.qtyOut.toFixed(4) : '',
        e.status,
      ]);

      downloadCSV(headers, rows, `Reboot_Ledger_Items_${new Date().toISOString().slice(0, 10)}.csv`);
      showToast('Ledger Items exported to CSV');
    } else if (activeLedgerTab === 'inward') {
      const headers = ['Date & Time', 'SKU', 'Item Name', 'Lot / Batch #', 'Origin Source (Where From In)', 'Source Location', 'Doc / GRN Ref', 'Inward Qty', 'UOM', 'Received By', 'Notes'];
      const rows = filteredInwardEntries.map((e) => [
        `"${e.timestamp}"`,
        e.sku,
        `"${e.itemName.replace(/"/g, '""')}"`,
        e.lotNumber || 'N/A',
        `"${(e.sourceOrigin || '').replace(/"/g, '""')}"`,
        `"${(e.sourceLocation || '').replace(/"/g, '""')}"`,
        `"${(e.sourceReference || '').replace(/"/g, '""')}"`,
        e.qtyIn || e.quantity,
        e.uom,
        `"${(e.authorizedBy || '').replace(/"/g, '""')}"`,
        `"${(e.notes || '').replace(/"/g, '""')}"`,
      ]);

      downloadCSV(headers, rows, `Reboot_Where_From_In_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
      showToast('Where-From-In Origin Ledger exported to CSV');
    } else {
      const headers = ['Date & Time', 'SKU', 'Item Name', 'Lot / Batch #', 'Purpose of Issue (What Purpose Is Out)', 'Destination Store / Station', 'Reference (WO/Inv)', 'Issued Qty', 'UOM', 'Authorized By', 'Running Bal', 'Notes'];
      const rows = filteredOutwardEntries.map((e) => [
        `"${e.timestamp}"`,
        e.sku,
        `"${e.itemName.replace(/"/g, '""')}"`,
        e.lotNumber || 'N/A',
        `"${(e.purposeDescription || '').replace(/"/g, '""')}"`,
        `"${(e.destinationStore || '').replace(/"/g, '""')}"`,
        `"${(e.outwardReference || '').replace(/"/g, '""')}"`,
        e.qtyOut || e.quantity,
        e.uom,
        `"${(e.authorizedBy || '').replace(/"/g, '""')}"`,
        e.runningBalance,
        `"${(e.notes || '').replace(/"/g, '""')}"`,
      ]);

      downloadCSV(headers, rows, `Reboot_What_Purpose_Is_Out_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
      showToast('What-Purpose-Is-Out Purpose Ledger exported to CSV');
    }
  };

  const downloadCSV = (headers: string[], rows: (string | number)[][], filename: string) => {
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Status Badge for Ledger Table (Task-4: OPEN, CLOSED, IN TRANSIT)
  const renderLedgerStatusBadge = (status: LedgerTransactionStatus) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            OPEN
          </span>
        );
      case 'IN TRANSIT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Truck className="w-2.5 h-2.5 text-amber-700" />
            IN TRANSIT
          </span>
        );
      case 'CLOSED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            CLOSED
          </span>
        );
    }
  };

  // Helper badge for Inward origin type
  const renderInwardSourceBadge = (type?: string) => {
    switch (type) {
      case 'VENDOR_GRN':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200"><Truck className="w-3 h-3" /> Vendor GRN</span>;
      case 'PRODUCTION_OUTPUT':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><Factory className="w-3 h-3" /> Molding Output</span>;
      case 'DEFLASH_RETURN':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200"><RotateCcw className="w-3 h-3" /> Deflash / QC Return</span>;
      case 'REGRIND_RECOVERY':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200"><Sparkles className="w-3 h-3" /> Regrind Recovery</span>;
      case 'INTER_PLANT_TRANSFER':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200"><ArrowLeftRight className="w-3 h-3" /> Plant Transfer</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700"><Building2 className="w-3 h-3" /> Inward Receipt</span>;
    }
  };

  // Helper badge for Outward purpose type
  const renderOutwardPurposeBadge = (type?: string) => {
    switch (type) {
      case 'PRODUCTION_ISSUE':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"><Factory className="w-3 h-3" /> Production Issue</span>;
      case 'ASSEMBLY_REQUISITION':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200"><Layers className="w-3 h-3" /> Assembly Line</span>;
      case 'DEFLASH_TRIMMING':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200"><RotateCcw className="w-3 h-3" /> Deflash / Trimming</span>;
      case 'CUSTOMER_DISPATCH':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><Truck className="w-3 h-3" /> Customer Dispatch</span>;
      case 'QC_REJECTION_SCRAP':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200"><AlertCircle className="w-3 h-3" /> Scrap Quarantine</span>;
      case 'SUBCONTRACT_JOB':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200"><Building2 className="w-3 h-3" /> Subcontracting</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700"><ArrowUpRight className="w-3 h-3" /> Material Issue</span>;
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#0F8B8D]/10 text-[#0F8B8D] border border-[#0F8B8D]/30 uppercase tracking-wider">
              Warehouse Inventory &middot; Lot Ledger &middot; Stores
            </span>
          </div>
          <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D]">
            Warehouse Stock Overview &amp; Lot Ledger
          </h1>
          <p className="text-xs text-slate-500">
            Real-time stock balance across <span className="font-semibold text-slate-700">RM, WIP, CON, PCK, BOP &amp; FG Stores</span> with complete transaction ledger
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" /> Export {activeLedgerTab === 'overview' ? 'Overview' : activeLedgerTab === 'ledger_items' ? 'Ledger Items' : activeLedgerTab === 'inward' ? 'Where From In' : 'What Purpose Out'} CSV
          </button>
          <button
            onClick={() => onNavigate('stockTransfer')}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#0F8B8D] hover:bg-[#0d787a] text-white rounded-lg text-xs font-bold shadow-sm transition"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" /> Stock Transfer &amp; Movement
          </button>
          <button
            onClick={() => onNavigate('binMap')}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Layers className="w-3.5 h-3.5 text-[#0F8B8D]" /> Bin Map
          </button>
          <button
            onClick={() => onNavigate('poList')}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#14213D] hover:bg-[#1f325c] text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" /> + Purchase Requisition
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
        {/* TAB 1: STOCK BALANCES OVERVIEW */}
        <button
          onClick={() => {
            setActiveLedgerTab('overview');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeLedgerTab === 'overview'
              ? 'bg-[#14213D] text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Stock Balances Overview</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              activeLedgerTab === 'overview' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {activeStockList.length}
          </span>
        </button>

        {/* TAB 2: LEDGER ITEMS (ATTACHED SCREENSHOT FORMAT - Task-2 & Task-4) */}
        <button
          onClick={() => {
            setActiveLedgerTab('ledger_items');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeLedgerTab === 'ledger_items'
              ? 'bg-[#2563EB] text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4 text-blue-200" />
          <span>Ledger Items &middot; Full Master Grid</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              activeLedgerTab === 'ledger_items' ? 'bg-white/20 text-white' : 'bg-blue-50 text-[#2563EB] border border-blue-200'
            }`}
          >
            {movementLedger.length}
          </span>
        </button>

        {/* TAB 3: WHERE FROM IN */}
        <button
          onClick={() => {
            setActiveLedgerTab('inward');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeLedgerTab === 'inward'
              ? 'bg-[#0F8B8D] text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4 text-emerald-300" />
          <span>Where From In &middot; Inward Origin</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              activeLedgerTab === 'inward' ? 'bg-white/20 text-white' : 'bg-teal-50 text-[#0F8B8D] border border-teal-200'
            }`}
          >
            {movementLedger.filter((m) => m.movementType === 'IN' || m.qtyIn > 0).length} IN
          </span>
        </button>

        {/* TAB 4: WHAT PURPOSE IS OUT */}
        <button
          onClick={() => {
            setActiveLedgerTab('outward');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeLedgerTab === 'outward'
              ? 'bg-[#E8622C] text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 text-amber-200" />
          <span>What Purpose Is Out &middot; Outward Purpose</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              activeLedgerTab === 'outward' ? 'bg-white/20 text-white' : 'bg-orange-50 text-[#E8622C] border border-orange-200'
            }`}
          >
            {movementLedger.filter((m) => m.movementType === 'OUT' || m.qtyOut > 0).length} OUT
          </span>
        </button>
      </div>

      {/* Task-3: Store Type Selector for Stock Overview & Stores */}
      {activeLedgerTab === 'overview' && (
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap mr-1">
            Store Location:
          </span>
          {storeTypes.map((st) => {
            const Icon = st.icon;
            const count =
              st.id === 'ALL'
                ? activeStockList.length
                : activeStockList.filter((item) => resolveStoreType(item) === st.id).length;

            return (
              <button
                key={st.id}
                onClick={() => {
                  setSelectedStoreType(st.id);
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  selectedStoreType === st.id
                    ? 'bg-[#14213D] text-white shadow-sm ring-2 ring-[#0F8B8D]/30'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${selectedStoreType === st.id ? 'text-[#0F8B8D]' : 'text-slate-500'}`} />
                <span>{st.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                    selectedStoreType === st.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Task-4: Status Filter for Ledger Items (OPEN / CLOSED / IN TRANSIT) */}
      {activeLedgerTab === 'ledger_items' && (
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap mr-1">
            Ledger Status:
          </span>
          {[
            { id: 'ALL', label: 'All Statuses', count: movementLedger.length },
            { id: 'CLOSED', label: 'CLOSED', count: movementLedger.filter((m) => m.status === 'CLOSED').length },
            { id: 'OPEN', label: 'OPEN', count: movementLedger.filter((m) => m.status === 'OPEN').length },
            { id: 'IN TRANSIT', label: 'IN TRANSIT', count: movementLedger.filter((m) => m.status === 'IN TRANSIT').length },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => {
                setSelectedLedgerStatus(st.id);
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedLedgerStatus === st.id
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{st.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                  selectedLedgerStatus === st.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {st.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={
              activeLedgerTab === 'overview'
                ? 'Search by SKU, description, store bin, or resin grade...'
                : activeLedgerTab === 'ledger_items'
                ? 'Search ledger by Doc #, SKU, Lot #, location, supplier, customer, or reference #...'
                : activeLedgerTab === 'inward'
                ? 'Search inward by SKU, batch lot, origin source (vendor/machine), GRN doc ref, or receiver...'
                : 'Search outward by SKU, batch lot, purpose (WO/dispatch/scrap), destination, or supervisor...'
            }
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-[#0F8B8D] outline-none"
          />
        </div>

        {/* Tab Specific Filter Pills */}
        {activeLedgerTab === 'overview' && (
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-[#14213D] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {activeLedgerTab === 'inward' && (
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
            {inwardSources.map((src) => (
              <button
                key={src.value}
                onClick={() => {
                  setInwardSourceFilter(src.value);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  inwardSourceFilter === src.value
                    ? 'bg-[#0F8B8D] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {src.label}
              </button>
            ))}
          </div>
        )}

        {activeLedgerTab === 'outward' && (
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
            {outwardPurposes.map((purp) => (
              <button
                key={purp.value}
                onClick={() => {
                  setOutwardPurposeFilter(purp.value);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  outwardPurposeFilter === purp.value
                    ? 'bg-[#E8622C] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {purp.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TAB 1: STOCK BALANCES OVERVIEW TABLE */}
      {activeLedgerTab === 'overview' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto scrollbar-none">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold text-[11px]">
                  <th className="py-3 px-4">Item SKU / Code</th>
                  <th className="py-3 px-4">Description &amp; Store</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">On Hand</th>
                  <th className="py-3 px-4 text-right">Allocated</th>
                  <th className="py-3 px-4 text-right">Available</th>
                  <th className="py-3 px-4">Primary Bin</th>
                  <th className="py-3 px-4 text-right">Valuation (₹)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedOverviewItems.map((item) => {
                  const store = resolveStoreType(item);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-blue-50/40 transition group cursor-pointer"
                      onClick={() => setSelectedItemForLots(item)}
                    >
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-[#0F8B8D] group-hover:underline">
                          {item.sku}
                        </span>
                        <div className="text-[10px] text-slate-400">Class {item.abcClassification}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#14213D]">{item.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              store === 'WIP'
                                ? 'bg-purple-100 text-purple-700'
                                : store === 'CON'
                                ? 'bg-amber-100 text-amber-800'
                                : store === 'PCK'
                                ? 'bg-blue-100 text-blue-800'
                                : store === 'BOP'
                                ? 'bg-teal-100 text-teal-800'
                                : store === 'FG'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {store} STORE
                          </span>
                          {item.resinGrade && (
                            <span className="text-[10px] text-slate-500 font-mono">{item.resinGrade}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {item.totalOnHand.toLocaleString()} <span className="text-[10px] text-slate-400">{item.uom}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">
                        {item.allocatedToProduction.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                        {item.availableToPromise.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-xs text-[#0F8B8D] px-1.5 py-0.5 bg-teal-50 rounded border border-teal-200">
                          {item.primaryBin}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                        ₹{item.totalValuationInr.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <WarehouseStatusBadge status={item.status} size="xs" />
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedItemForLots(item)}
                            title="Click row to view Ledger Grid & Provenance"
                            className="flex items-center gap-1 px-2 py-1 text-slate-600 hover:text-[#2563EB] hover:bg-blue-50 rounded-lg transition text-[11px] font-semibold"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Ledger</span>
                          </button>
                          <button
                            onClick={() => openStockAdjustmentDrawer(item)}
                            title="Adjust Stock"
                            className="p-1.5 text-slate-600 hover:text-[#E8622C] hover:bg-slate-100 rounded-lg transition"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {paginatedOverviewItems.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Package className="w-8 h-8 mx-auto mb-2 text-slate-300 opacity-60" />
                      <div className="font-semibold text-slate-600 text-xs">No stock items in this store location</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Stock entries will populate automatically when production shift output is saved or GRN putaway is completed.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-3 border-t border-slate-100">
            <PaginationBar
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredItems.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(sz) => {
                setPageSize(sz);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      )}

      {/* TAB 2: LEDGER ITEMS (SLIDER-FREE FORMAT WITH CUSTOMER SEARCH FOR 100,000+ ACCOUNTS) */}
      {activeLedgerTab === 'ledger_items' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header Bar: Blue gradient bar with Ledger Items, Customer Search & Pagination */}
          <div className="bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#60A5FA] px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-white/90" />
              <h3 className="font-bold text-sm tracking-wide">Master Ledger Items</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-mono font-semibold">
                {filteredLedgerEntries.length} Records
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-white/90 font-medium hidden md:inline">
                Page <strong className="text-white">{currentPage}</strong> of <strong>{totalPages}</strong>
              </span>
              <div className="flex items-center gap-1 bg-white/20 rounded-lg p-0.5">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1 hover:bg-white/30 rounded disabled:opacity-30 transition"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1 hover:bg-white/30 rounded disabled:opacity-30 transition"
                  title="Next Page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Slider-Free Proportional Table */}
          <div className="overflow-hidden">
            <table className="w-full text-left text-xs border-collapse font-sans table-fixed">
              <colgroup>
                <col className="w-[15%]" />
                <col className="w-[20%]" />
                <col className="w-[18%]" />
                <col className="w-[20%]" />
                <col className="w-[14%]" />
                <col className="w-[13%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-slate-200 bg-[#EFF6FF] text-slate-700 font-bold text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 px-3 border-r border-slate-200">Date &amp; Doc #</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">Material &amp; SKU</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">Lot # &amp; Location</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">Customer / Supplier</th>
                  <th className="py-2.5 px-3 text-right border-r border-slate-200">Movement Qty</th>
                  <th className="py-2.5 px-3 text-center">Status &amp; Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedLedgerItems.map((row, idx) => {
                  const isExpanded = expandedRowId === row.id;

                  return (
                    <React.Fragment key={row.id}>
                      <tr
                        onClick={() => setExpandedRowId(isExpanded ? null : row.id)}
                        className={`hover:bg-blue-50/70 transition cursor-pointer font-mono text-[11px] ${
                          idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                        } ${isExpanded ? 'bg-blue-50/60 border-l-4 border-l-[#2563EB]' : ''}`}
                      >
                        {/* Date & Doc */}
                        <td className="py-2.5 px-3 border-r border-slate-100">
                          <div className="font-bold text-[#2563EB] truncate">{row.docNumber}</div>
                          <div className="text-[10px] text-slate-500 font-sans flex items-center gap-1 mt-0.5">
                            <span>{row.ledgerDate}</span>
                            <span className="text-slate-300">&bull;</span>
                            <span className="font-semibold text-slate-600 uppercase text-[9px]">{row.docType}</span>
                          </div>
                        </td>

                        {/* Material & SKU */}
                        <td className="py-2.5 px-3 border-r border-slate-100 font-sans">
                          <div className="font-bold text-slate-800 text-xs truncate">{row.itemName}</div>
                          <div className="font-mono text-[10px] text-[#0F8B8D] font-bold mt-0.5">{row.sku}</div>
                        </td>

                        {/* Lot & Location */}
                        <td className="py-2.5 px-3 border-r border-slate-100">
                          <span className="font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                            {row.lotNumber || 'BULK'}
                          </span>
                          <div className="text-[10px] text-slate-500 font-sans mt-0.5 truncate" title={row.location}>
                            {row.location}
                          </div>
                        </td>

                        {/* Customer / Supplier Party */}
                        <td className="py-2.5 px-3 border-r border-slate-100 font-sans">
                          {row.customer ? (
                            <div className="flex items-center gap-1.5 text-blue-900 font-semibold truncate" title={row.customer}>
                              <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span className="truncate">{row.customer}</span>
                            </div>
                          ) : row.supplier ? (
                            <div className="flex items-center gap-1.5 text-slate-800 font-semibold truncate" title={row.supplier}>
                              <Truck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span className="truncate">{row.supplier}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[10px]">Internal Transfer</span>
                          )}
                          {row.parentDocNumber && (
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                              Ref: {row.parentDocNumber}
                            </div>
                          )}
                        </td>

                        {/* Movement Qty */}
                        <td className="py-2.5 px-3 border-r border-slate-100 text-right">
                          {row.qtyIn > 0 ? (
                            <span className="inline-block font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                              +{row.qtyIn.toLocaleString()} {row.uom}
                            </span>
                          ) : row.qtyOut > 0 ? (
                            <span className="inline-block font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[11px]">
                              -{row.qtyOut.toLocaleString()} {row.uom}
                            </span>
                          ) : (
                            <span className="text-slate-400">0.00</span>
                          )}
                          {row.unitPrice !== undefined && (
                            <div className="text-[10px] text-slate-500 font-sans mt-0.5">
                              @ ₹{row.unitPrice.toFixed(2)}
                            </div>
                          )}
                        </td>

                        {/* Status & Audit */}
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {renderLedgerStatusBadge(row.status)}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedRowId(isExpanded ? null : row.id);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                              title={isExpanded ? 'Collapse details' : 'Expand full details'}
                            >
                              <ChevronRight
                                className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90 text-[#2563EB]' : ''}`}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Audit Lineage Details */}
                      {isExpanded && (
                        <tr className="bg-gradient-to-r from-blue-50/50 to-indigo-50/30 font-sans text-xs">
                          <td colSpan={6} className="p-3.5 border-b border-blue-200/60">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-blue-100 shadow-xs">
                              <div>
                                <div className="text-[10px] text-slate-400 font-semibold uppercase">Parent Document</div>
                                <div className="font-mono font-bold text-slate-800 text-xs">
                                  {row.parentDocType || 'N/A'}: {row.parentDocNumber || '—'}
                                </div>
                              </div>
                              <div>
                                <div className="text-[10px] text-slate-400 font-semibold uppercase">External Reference #</div>
                                <div className="font-mono font-semibold text-slate-800 text-xs">
                                  {row.referenceNumber || 'N/A'}
                                </div>
                              </div>
                              <div>
                                <div className="text-[10px] text-slate-400 font-semibold uppercase">Location Type &amp; Facility</div>
                                <div className="font-semibold text-slate-800 text-xs">
                                  {row.location} ({row.locationType || 'WAREHOUSE'})
                                </div>
                              </div>
                              <div>
                                <div className="text-[10px] text-slate-400 font-semibold uppercase">Line Valuation</div>
                                <div className="font-mono font-bold text-emerald-700 text-xs">
                                  ₹{((row.qtyIn || row.qtyOut || 0) * (row.unitPrice || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {paginatedLedgerItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <FileText className="w-8 h-8 mx-auto mb-2 text-blue-300 opacity-60" />
                      <div className="font-semibold text-slate-600 text-xs">No ledger movement transactions recorded yet</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Transactions log in real time on production shift saves, material issues, and receipts.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Ledger Pagination */}
          <div className="p-3 border-t border-slate-100">
            <PaginationBar
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredLedgerEntries.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(sz) => {
                setPageSize(sz);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      )}

      {/* TAB 3: WHERE FROM IN (INWARD ORIGIN LEDGER) */}
      {activeLedgerTab === 'inward' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-teal-50/50 border-b border-teal-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowDownLeft className="w-5 h-5 text-[#0F8B8D]" />
              <div>
                <h3 className="font-bold text-sm text-[#14213D]">&quot;Where From In&quot; &mdash; Inward Material Origin Ledger</h3>
                <p className="text-[11px] text-slate-600">
                  Full lineage trace of stock entries from Supplier GRNs, Molding Line Outputs, Secondary Deflash Returns, and Regrind Reprocessing.
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-[#0F8B8D] font-mono">{filteredInwardEntries.length} Inward Transactions</span>
            </div>
          </div>

          <div className="overflow-x-auto scrollbar-none">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold text-[11px]">
                  <th className="py-3 px-4">Date &amp; Time</th>
                  <th className="py-3 px-4">Item SKU / Description</th>
                  <th className="py-3 px-4">Traceable Batch / Lot #</th>
                  <th className="py-3 px-4">Where From In (Origin Source)</th>
                  <th className="py-3 px-4">Source Dock / Location</th>
                  <th className="py-3 px-4">Inward Doc / GRN #</th>
                  <th className="py-3 px-4 text-right">Inward Qty</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Received / Verified By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedInwardItems.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {entry.timestamp || entry.ledgerDate}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-[#0F8B8D]">{entry.sku}</span>
                      <div className="font-semibold text-slate-800 text-[11px]">{entry.itemName}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                        {entry.lotNumber || 'BULK-UNBATCHED'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="mb-1">{renderInwardSourceBadge(entry.sourceType)}</div>
                      <div className="font-semibold text-slate-900">{entry.sourceOrigin || entry.supplier}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      <div className="flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>{entry.sourceLocation || entry.location}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-[#14213D] bg-blue-50/80 px-2 py-0.5 rounded border border-blue-200 text-[11px]">
                        {entry.sourceReference || entry.docNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                      +{(entry.qtyIn || entry.quantity).toLocaleString()} <span className="text-[10px] text-slate-500">{entry.uom}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {renderLedgerStatusBadge(entry.status)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-slate-700 font-medium">
                        <UserCheck className="w-3 h-3 text-emerald-600" />
                        <span>{entry.authorizedBy || 'Warehouse Team'}</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedInwardItems.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <ArrowDownLeft className="w-8 h-8 mx-auto mb-2 text-teal-300 opacity-60" />
                      <div className="font-semibold text-slate-600 text-xs">No inward origin transactions recorded yet</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Inward receipts from vendor GRNs and molding production outputs will appear here.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Inward Pagination */}
          <div className="p-3 border-t border-slate-100">
            <PaginationBar
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredInwardEntries.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(sz) => {
                setPageSize(sz);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      )}

      {/* TAB 4: WHAT PURPOSE IS OUT (OUTWARD PURPOSE LEDGER) */}
      {activeLedgerTab === 'outward' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-orange-50/50 border-b border-orange-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-[#E8622C]" />
              <div>
                <h3 className="font-bold text-sm text-[#14213D]">&quot;What Purpose Is Out&quot; &mdash; Outward Material Purpose Ledger</h3>
                <p className="text-[11px] text-slate-600">
                  Comprehensive disposition records of stock issues for Molding Work Orders, Assembly Lines, Trimming, Customer Dispatches, and Scrap Quarantine.
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-[#E8622C] font-mono">{filteredOutwardEntries.length} Outward Transactions</span>
            </div>
          </div>

          <div className="overflow-x-auto scrollbar-none">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold text-[11px]">
                  <th className="py-3 px-4">Date &amp; Time</th>
                  <th className="py-3 px-4">Item SKU / Description</th>
                  <th className="py-3 px-4">Traceable Batch / Lot #</th>
                  <th className="py-3 px-4">What Purpose Is Out (Purpose of Issue)</th>
                  <th className="py-3 px-4">Destination Store / Station</th>
                  <th className="py-3 px-4">Reference (WO / Invoice #)</th>
                  <th className="py-3 px-4 text-right">Issued Qty</th>
                  <th className="py-3 px-4 text-right">Running Bal</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Authorized By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedOutwardItems.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {entry.timestamp || entry.ledgerDate}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-[#0F8B8D]">{entry.sku}</span>
                      <div className="font-semibold text-slate-800 text-[11px]">{entry.itemName}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                        {entry.lotNumber || 'BULK-UNBATCHED'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="mb-1">{renderOutwardPurposeBadge(entry.purposeType)}</div>
                      <div className="font-semibold text-slate-900">{entry.purposeDescription}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      <div className="flex items-center gap-1">
                        <Layers className="w-3 h-3 text-[#E8622C]" />
                        <span>{entry.destinationStore || entry.location}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-[#14213D] bg-orange-50 px-2 py-0.5 rounded border border-orange-200 text-[11px]">
                        {entry.outwardReference || entry.docNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-600 whitespace-nowrap">
                      -{(entry.qtyOut || entry.quantity).toLocaleString()} <span className="text-[10px] text-slate-500">{entry.uom}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                      {entry.runningBalance?.toLocaleString()} <span className="text-[10px] text-slate-400">{entry.uom}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {renderLedgerStatusBadge(entry.status)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-slate-700 font-medium">
                        <UserCheck className="w-3 h-3 text-[#E8622C]" />
                        <span>{entry.authorizedBy || 'Warehouse Team'}</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedOutwardItems.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      <ArrowUpRight className="w-8 h-8 mx-auto mb-2 text-orange-300 opacity-60" />
                      <div className="font-semibold text-slate-600 text-xs">No outward purpose transactions recorded yet</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Outward issues for Work Orders, assembly lines, and customer dispatches will appear here.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Outward Pagination */}
          <div className="p-3 border-t border-slate-100">
            <PaginationBar
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredOutwardEntries.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(sz) => {
                setPageSize(sz);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      )}

      {/* Row Click / Modal: LEDGER ITEMS & LOT PROVENANCE FOR SELECTED ITEM (100k+ High Scale Support) */}
      {selectedItemForLots && (
        <ItemLotLedgerModal
          item={selectedItemForLots}
          movementLedger={movementLedger}
          onClose={() => setSelectedItemForLots(null)}
          resolveStoreType={resolveStoreType}
          showToast={showToast}
        />
      )}
    </div>
  );
};
