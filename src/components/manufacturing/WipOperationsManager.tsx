import React, { useState, useMemo } from 'react';
import {
  WipInventoryRecord,
  OperationalStoreType,
  MainWarehouseStoreType,
  MaterialCategoryType,
  WipQcStatus,
  PlantStoreInventoryItem,
  MaterialTransferRecord,
} from '../../types/operationsWipTypes';
import {
  STANDARD_QC_REJECTION_REASONS,
  STANDARD_QC_HOLD_REASONS,
  ASSEMBLY_RECIPES,
  DEFLASH_RECIPES,
} from '../../data/operationsWipData';
import { WorkOrder, ItemMaster, MachineMaster } from '../../types';
import { RequireAuth } from '../../shared/components/RequireAuth';
import {
  Layers,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  ArrowLeftRight,
  Package,
  Wrench,
  Scissors,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Clock,
  Building2,
  Boxes,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  Download,
  Upload,
  Sparkles,
  Info,
  Check,
  X,
  Flame,
  Scale,
} from 'lucide-react';

interface WipOperationsManagerProps {
  wipRecords: WipInventoryRecord[];
  plantStoreItems: PlantStoreInventoryItem[];
  materialTransfers: MaterialTransferRecord[];
  workOrders: WorkOrder[];
  items: ItemMaster[];
  machines: MachineMaster[];
  onUpdateWipRecord: (record: WipInventoryRecord) => void;
  onAddWipRecord: (record: WipInventoryRecord) => void;
  onUpdatePlantStoreItems: (items: PlantStoreInventoryItem[]) => void;
  onAddMaterialTransfer: (transfer: MaterialTransferRecord) => void;
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
  initialTab?: 'wip' | 'deflash' | 'assembly' | 'fg' | 'transfers';
}

export const WipOperationsManager: React.FC<WipOperationsManagerProps> = ({
  wipRecords,
  plantStoreItems,
  materialTransfers,
  workOrders,
  items,
  machines,
  onUpdateWipRecord,
  onAddWipRecord,
  onUpdatePlantStoreItems,
  onAddMaterialTransfer,
  onNavigate,
  showToast,
  initialTab = 'wip',
}) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'wip' | 'deflash' | 'assembly' | 'fg' | 'transfers'>(initialTab);

  // Filters
  const [selectedPlant, setSelectedPlant] = useState<string>('PLANT-01');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [qcStatusFilter, setQcStatusFilter] = useState<string>('all');
  const [storeFilter, setStoreFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'grid_entry' | 'excel_csv_upload'>('all');

  // QC Inspection Modal
  const [inspectingRecord, setInspectingRecord] = useState<WipInventoryRecord | null>(null);
  const [qcDecision, setQcDecision] = useState<'approve_fg' | 'route_deflash' | 'route_assembly' | 'hold' | 'reject'>('approve_fg');
  const [qcRejectionReason, setQcRejectionReason] = useState<string>('');
  const [qcRejectionCategory, setQcRejectionCategory] = useState<string>('Molding Process');
  const [qcCustomReason, setQcCustomReason] = useState<string>('');
  const [qcHoldReason, setQcHoldReason] = useState<string>('');
  const [qcInspectorName, setQcInspectorName] = useState<string>('Pooja V. (QC Inspector)');
  const [qcScrapQty, setQcScrapQty] = useState<number>(0);
  const [qcNotes, setQcNotes] = useState<string>('');

  // Secondary Deflash Process Modal
  const [deflashLot, setDeflashLot] = useState<WipInventoryRecord | null>(null);
  const [deflashPassedQty, setDeflashPassedQty] = useState<number>(0);
  const [deflashScrapQty, setDeflashScrapQty] = useState<number>(0);
  const [deflashRejectReason, setDeflashRejectReason] = useState<string>('Deflash Over-cut / Gouging in Trimming');
  const [deflashDestination, setDeflashDestination] = useState<'ASSEMBLY-STORE' | 'FG-STORE'>('FG-STORE');

  // Secondary Assembly Process Modal
  const [assemblyLot, setAssemblyLot] = useState<WipInventoryRecord | null>(null);
  const [assemblyPassedQty, setAssemblyPassedQty] = useState<number>(0);
  const [assemblyScrapQty, setAssemblyScrapQty] = useState<number>(0);
  const [assemblyRejectReason, setAssemblyRejectReason] = useState<string>('Assembly Hardware Stripped Thread / Brass Insert Misaligned');

  // Material Transfer Modal
  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  const [transferFromStore, setTransferFromStore] = useState<MainWarehouseStoreType>('MAIN-RM-STORE');
  const [transferToStore, setTransferToStore] = useState<OperationalStoreType>('PRD-STORE');
  const [transferCategory, setTransferCategory] = useState<MaterialCategoryType>('RM');
  const [transferItemCode, setTransferItemCode] = useState<string>('RM-PP-CP380');
  const [transferQty, setTransferQty] = useState<number>(500);
  const [transferWorkOrderRef, setTransferWorkOrderRef] = useState<string>('WO-1042');
  const [transferNotes, setTransferNotes] = useState<string>('');

  // Plants list
  const PLANTS = [
    { id: 'PLANT-01', name: 'Plant 01 - Pune Precision Molding' },
    { id: 'PLANT-02', name: 'Plant 02 - Chennai Auto Plastics' },
    { id: 'PLANT-03', name: 'Plant 03 - Manesar Components' },
  ];

  // Filtered WIP Records
  const filteredWipRecords = useMemo(() => {
    return wipRecords.filter((rec) => {
      if (selectedPlant !== 'all' && rec.plantId !== selectedPlant) return false;
      if (storeFilter !== 'all' && rec.currentStore !== storeFilter) return false;
      if (qcStatusFilter !== 'all' && rec.qcStatus !== qcStatusFilter) return false;
      if (sourceFilter !== 'all' && rec.source !== sourceFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = rec.itemCode.toLowerCase().includes(q);
        const matchName = rec.itemName.toLowerCase().includes(q);
        const matchWo = rec.workOrderId.toLowerCase().includes(q);
        const matchBatch = rec.batchLotNo.toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchWo && !matchBatch) return false;
      }
      return true;
    });
  }, [wipRecords, selectedPlant, storeFilter, qcStatusFilter, sourceFilter, searchQuery]);

  // Specific store views
  const deflashStoreRecords = useMemo(() => {
    return wipRecords.filter((r) => r.currentStore === 'DEFLASH-STORE' && r.plantId === selectedPlant);
  }, [wipRecords, selectedPlant]);

  const assemblyStoreRecords = useMemo(() => {
    return wipRecords.filter((r) => r.currentStore === 'ASSEMBLY-STORE' && r.plantId === selectedPlant);
  }, [wipRecords, selectedPlant]);

  const fgStoreRecords = useMemo(() => {
    return wipRecords.filter((r) => r.currentStore === 'FG-STORE' && (selectedPlant === 'all' || r.plantId === selectedPlant));
  }, [wipRecords, selectedPlant]);

  // Inventory items for active plant
  const currentPlantStoreInventory = useMemo(() => {
    return plantStoreItems.filter((p) => p.plantId === selectedPlant);
  }, [plantStoreItems, selectedPlant]);

  // Transfers for active plant
  const currentPlantTransfers = useMemo(() => {
    return materialTransfers.filter((t) => t.plantId === selectedPlant);
  }, [materialTransfers, selectedPlant]);

  // KPI Metrics
  const metrics = useMemo(() => {
    const totalLots = wipRecords.length;
    const pendingQc = wipRecords.filter((r) => r.qcStatus === 'pending_qc').length;
    const inDeflash = wipRecords.filter((r) => r.currentStore === 'DEFLASH-STORE').length;
    const inAssembly = wipRecords.filter((r) => r.currentStore === 'ASSEMBLY-STORE').length;
    const movedToFg = wipRecords.filter((r) => r.currentStore === 'FG-STORE').length;
    const qcRejected = wipRecords.filter((r) => r.qcStatus === 'qc_rejected').length;
    const qcHold = wipRecords.filter((r) => r.qcStatus === 'qc_hold').length;

    return { totalLots, pendingQc, inDeflash, inAssembly, movedToFg, qcRejected, qcHold };
  }, [wipRecords]);

  // Open QC Inspection Modal
  const handleOpenQcInspection = (record: WipInventoryRecord) => {
    setInspectingRecord(record);
    setQcDecision(record.requiresDeflash ? 'route_deflash' : record.requiresAssembly ? 'route_assembly' : 'approve_fg');
    setQcRejectionReason(record.qcRejectionReason || STANDARD_QC_REJECTION_REASONS[0].reason);
    setQcRejectionCategory(STANDARD_QC_REJECTION_REASONS[0].category);
    setQcCustomReason('');
    setQcHoldReason(STANDARD_QC_HOLD_REASONS[0]);
    setQcScrapQty(record.scrapQty || 0);
    setQcNotes('');
  };

  // Commit QC Inspection Decision
  const handleCommitQcDecision = () => {
    if (!inspectingRecord) return;

    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    let updatedRecord: WipInventoryRecord = { ...inspectingRecord, lastUpdated: now };

    if (qcDecision === 'reject') {
      const finalReason = qcCustomReason.trim() ? `${qcRejectionReason} - ${qcCustomReason}` : qcRejectionReason;
      if (!finalReason) {
        showToast('Error: QC Rejection reason is required.');
        return;
      }

      updatedRecord = {
        ...updatedRecord,
        qcStatus: 'qc_rejected',
        currentStage: 'QC Inspection',
        qcRejectionReason: finalReason,
        qcRejectionCategory,
        qcRejectionNotes: qcNotes,
        qcInspectedBy: qcInspectorName,
        qcInspectedAt: now,
        scrapQty: qcScrapQty > 0 ? qcScrapQty : updatedRecord.producedQty,
        goodQty: Math.max(0, updatedRecord.producedQty - (qcScrapQty > 0 ? qcScrapQty : updatedRecord.producedQty)),
        history: [
          ...updatedRecord.history,
          {
            event: 'QC REJECTED',
            time: now,
            by: qcInspectorName,
            store: updatedRecord.currentStore,
            details: `Reason: ${finalReason}. Scrap Qty: ${qcScrapQty || updatedRecord.producedQty} pcs. Notes: ${qcNotes || 'None'}`,
          },
        ],
      };
      showToast(`Lot ${inspectingRecord.batchLotNo} marked as QC REJECTED.`);
    } else if (qcDecision === 'hold') {
      if (!qcHoldReason) {
        showToast('Error: QC Hold reason is required.');
        return;
      }
      updatedRecord = {
        ...updatedRecord,
        qcStatus: 'qc_hold',
        currentStage: 'QC Inspection',
        qcHoldReason,
        qcRejectionNotes: qcNotes,
        qcInspectedBy: qcInspectorName,
        qcInspectedAt: now,
        history: [
          ...updatedRecord.history,
          {
            event: 'QC QUARANTINE HOLD',
            time: now,
            by: qcInspectorName,
            store: updatedRecord.currentStore,
            details: `Hold Reason: ${qcHoldReason}. Notes: ${qcNotes || 'Awaiting investigation'}`,
          },
        ],
      };
      showToast(`Lot ${inspectingRecord.batchLotNo} placed on QC Quarantine Hold.`);
    } else if (qcDecision === 'approve_fg') {
      updatedRecord = {
        ...updatedRecord,
        qcStatus: 'moved_to_fg',
        currentStore: 'FG-STORE',
        currentStage: 'FG Inventory',
        qcInspectedBy: qcInspectorName,
        qcInspectedAt: now,
        history: [
          ...updatedRecord.history,
          {
            event: 'QC Approved & Transferred to FG Inventory',
            time: now,
            by: qcInspectorName,
            store: 'FG-STORE',
            details: `Cleared 100% inspection. Moved ${updatedRecord.goodQty} pcs to FG-STORE. Ready for warehouse palletizing.`,
          },
        ],
      };
      showToast(`Lot ${inspectingRecord.batchLotNo} QC Approved & Moved to FG-STORE.`);
    } else if (qcDecision === 'route_deflash') {
      updatedRecord = {
        ...updatedRecord,
        qcStatus: 'transferred_deflash',
        currentStore: 'DEFLASH-STORE',
        currentStage: 'Deflashing',
        deflashStatus: 'in_progress',
        qcInspectedBy: qcInspectorName,
        qcInspectedAt: now,
        history: [
          ...updatedRecord.history,
          {
            event: 'Transferred to Deflash Area Store',
            time: now,
            by: qcInspectorName,
            store: 'DEFLASH-STORE',
            details: `Gate trimming & deflashing required for ${updatedRecord.goodQty} pcs.`,
          },
        ],
      };
      showToast(`Lot ${inspectingRecord.batchLotNo} transferred to DEFLASH-STORE.`);
    } else if (qcDecision === 'route_assembly') {
      updatedRecord = {
        ...updatedRecord,
        qcStatus: 'transferred_assembly',
        currentStore: 'ASSEMBLY-STORE',
        currentStage: 'Assembly',
        assemblyStatus: 'in_progress',
        qcInspectedBy: qcInspectorName,
        qcInspectedAt: now,
        history: [
          ...updatedRecord.history,
          {
            event: 'Transferred to Assembly Floor Store',
            time: now,
            by: qcInspectorName,
            store: 'ASSEMBLY-STORE',
            details: `Hardware installation & sub-assembly required for ${updatedRecord.goodQty} pcs.`,
          },
        ],
      };
      showToast(`Lot ${inspectingRecord.batchLotNo} transferred to ASSEMBLY-STORE.`);
    }

    onUpdateWipRecord(updatedRecord);
    setInspectingRecord(null);
  };

  // Open Deflash Execution
  const handleOpenDeflashModal = (rec: WipInventoryRecord) => {
    setDeflashLot(rec);
    setDeflashPassedQty(rec.goodQty);
    setDeflashScrapQty(0);
    setDeflashRejectReason('Deflash Over-cut / Gouging in Trimming');
    setDeflashDestination(rec.requiresAssembly ? 'ASSEMBLY-STORE' : 'FG-STORE');
  };

  // Commit Deflash Run & Secondary QC
  const handleCommitDeflash = () => {
    if (!deflashLot) return;

    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const targetStore: OperationalStoreType = deflashDestination;
    const targetStatus: WipQcStatus = targetStore === 'FG-STORE' ? 'moved_to_fg' : 'transferred_assembly';
    const hasRejections = deflashScrapQty > 0;

    if (hasRejections && !deflashRejectReason.trim()) {
      showToast('Error: Deflash QC Rejection reason is required.');
      return;
    }

    // Automatically minus deflash consumables recipe if scrap/rejection occurs!
    if (hasRejections) {
      // Deduct from DEFLASH-STORE consumables
      const updatedStoreItems = plantStoreItems.map((item) => {
        if (item.plantId === deflashLot.plantId && item.storeCode === 'DEFLASH-STORE' && item.itemCode === 'CON-BLD-TRI') {
          return { ...item, stockQty: Math.max(0, item.stockQty - 1) };
        }
        return item;
      });
      onUpdatePlantStoreItems(updatedStoreItems);
    }

    const updatedRecord: WipInventoryRecord = {
      ...deflashLot,
      goodQty: deflashPassedQty,
      scrapQty: deflashLot.scrapQty + deflashScrapQty,
      deflashScrapQty: deflashScrapQty,
      deflashRejectionReason: hasRejections ? deflashRejectReason : undefined,
      currentStore: targetStore,
      currentStage: targetStore === 'FG-STORE' ? 'FG Inventory' : 'Assembly',
      qcStatus: targetStatus,
      deflashStatus: hasRejections && deflashPassedQty === 0 ? 'qc_rejected' : 'qc_approved',
      reversalRecipeDeducted: hasRejections,
      lastUpdated: now,
      history: [
        ...deflashLot.history,
        {
          event: `Deflash Completed & Inspected (${deflashPassedQty} Approved, ${deflashScrapQty} Rejected)`,
          time: now,
          by: 'V. Jadhav (Deflash Operator / QC)',
          store: targetStore,
          details: hasRejections
            ? `Rejection Reason: "${deflashRejectReason}". Auto-minused deflash tooling recipe consumables. Transferred ${deflashPassedQty} approved pcs to ${targetStore}.`
            : `Deflash 100% clean. Transferred ${deflashPassedQty} pcs to ${targetStore}.`,
        },
      ],
    };

    onUpdateWipRecord(updatedRecord);
    setDeflashLot(null);
    showToast(`Deflash completed: ${deflashPassedQty} pcs approved and moved to ${targetStore}.`);
  };

  // Open Assembly Execution
  const handleOpenAssemblyModal = (rec: WipInventoryRecord) => {
    setAssemblyLot(rec);
    setAssemblyPassedQty(rec.goodQty);
    setAssemblyScrapQty(0);
    setAssemblyRejectReason('Assembly Hardware Stripped Thread / Brass Insert Misaligned');
  };

  // Commit Assembly Run & Secondary QC
  const handleCommitAssembly = () => {
    if (!assemblyLot) return;

    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const hasRejections = assemblyScrapQty > 0;

    if (hasRejections && !assemblyRejectReason.trim()) {
      showToast('Error: Assembly QC Rejection reason is required.');
      return;
    }

    // Auto-minus the assembly recipe from ASSEMBLY-STORE for rejected units!
    // Example: If 10 units rejected, minus 10 * 4 = 40 brass inserts, 40 screws, 10 gaskets
    if (hasRejections) {
      const recipe = ASSEMBLY_RECIPES[assemblyLot.itemCode] || ASSEMBLY_RECIPES['FG-CTN-500'];
      const updatedStoreItems = plantStoreItems.map((stk) => {
        if (stk.plantId === assemblyLot.plantId && stk.storeCode === 'ASSEMBLY-STORE') {
          const matchedLine = recipe.find((r) => r.itemCode === stk.itemCode);
          if (matchedLine) {
            const consumedDeduction = matchedLine.qtyPerUnit * assemblyScrapQty;
            return {
              ...stk,
              stockQty: Math.max(0, stk.stockQty - consumedDeduction),
            };
          }
        }
        return stk;
      });
      onUpdatePlantStoreItems(updatedStoreItems);
    }

    const updatedRecord: WipInventoryRecord = {
      ...assemblyLot,
      goodQty: assemblyPassedQty,
      scrapQty: assemblyLot.scrapQty + assemblyScrapQty,
      assemblyScrapQty,
      assemblyRejectionReason: hasRejections ? assemblyRejectReason : undefined,
      currentStore: 'FG-STORE',
      currentStage: 'FG Inventory',
      qcStatus: 'moved_to_fg',
      assemblyStatus: hasRejections && assemblyPassedQty === 0 ? 'qc_rejected' : 'qc_approved',
      reversalRecipeDeducted: hasRejections,
      lastUpdated: now,
      history: [
        ...assemblyLot.history,
        {
          event: `Assembly & QC Completed (${assemblyPassedQty} Good, ${assemblyScrapQty} Rejected)`,
          time: now,
          by: 'G. Deshmukh (Assembly Lead & Inspector)',
          store: 'FG-STORE',
          details: hasRejections
            ? `Assembly Rejection Reason: "${assemblyRejectReason}". Auto-minused ${assemblyScrapQty} units of BOP hardware from assembly store ledger. Moved ${assemblyPassedQty} approved units to FG-STORE.`
            : `Assembly & testing 100% passed. Moved ${assemblyPassedQty} units to FG-STORE as complete Finished Goods.`,
        },
      ],
    };

    onUpdateWipRecord(updatedRecord);
    setAssemblyLot(null);
    showToast(
      hasRejections
        ? `Assembly logged: ${assemblyPassedQty} FG approved. Minused assembly recipe for ${assemblyScrapQty} rejected parts.`
        : `Assembly completed: ${assemblyPassedQty} completed units moved to FG-STORE!`
    );
  };

  // Execute Material Transfer Note (MTN) from Main Plant Warehouse to Operational Store
  const handleExecuteMaterialTransfer = () => {
    if (transferQty <= 0) {
      showToast('Error: Transfer quantity must be greater than zero.');
      return;
    }

    // Find source store item
    const sourceItem = plantStoreItems.find(
      (s) => s.plantId === selectedPlant && s.storeCode === transferFromStore && s.itemCode === transferItemCode
    );

    if (!sourceItem || sourceItem.stockQty < transferQty) {
      showToast(`Error: Insufficient stock in ${transferFromStore}. Available: ${sourceItem?.stockQty || 0} ${sourceItem?.uom || ''}`);
      return;
    }

    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const mtnNumber = `MTN-P${selectedPlant.slice(-1)}-${Date.now().toString().slice(-6)}`;

    // Update balances: deduct from source store, credit to destination operational store
    let targetFound = false;
    const updatedStoreItems = plantStoreItems.map((item) => {
      if (item.plantId === selectedPlant && item.itemCode === transferItemCode) {
        if (item.storeCode === transferFromStore) {
          return { ...item, stockQty: item.stockQty - transferQty };
        }
        if (item.storeCode === transferToStore) {
          targetFound = true;
          return { ...item, stockQty: item.stockQty + transferQty };
        }
      }
      return item;
    });

    // If destination store didn't have this item yet, create an entry
    if (!targetFound) {
      updatedStoreItems.push({
        id: `STK-${Date.now()}`,
        plantId: selectedPlant,
        plantName: PLANTS.find((p) => p.id === selectedPlant)?.name || selectedPlant,
        storeCode: transferToStore,
        itemCode: sourceItem.itemCode,
        itemName: sourceItem.itemName,
        category: sourceItem.category,
        stockQty: transferQty,
        uom: sourceItem.uom,
        allocatedQty: 0,
        minSafetyStock: sourceItem.minSafetyStock / 5,
        unitCost: sourceItem.unitCost,
      });
    }

    onUpdatePlantStoreItems(updatedStoreItems);

    // Record the Transfer Note
    const newTransfer: MaterialTransferRecord = {
      id: mtnNumber,
      transferNo: mtnNumber,
      plantId: selectedPlant,
      plantName: PLANTS.find((p) => p.id === selectedPlant)?.name || selectedPlant,
      date: now.split(' ')[0],
      category: transferCategory,
      fromStore: transferFromStore,
      toStore: transferToStore,
      itemCode: sourceItem.itemCode,
      itemName: sourceItem.itemName,
      qty: transferQty,
      uom: sourceItem.uom,
      workOrderRef: transferWorkOrderRef,
      requestedBy: 'Floor Supervisor',
      transferredBy: 'Santosh M. (Plant Stores In-Charge)',
      status: 'received',
      notes: transferNotes || `BOM scheduled transfer for ${transferWorkOrderRef}`,
    };

    onAddMaterialTransfer(newTransfer);
    setIsTransferModalOpen(false);
    showToast(`Material Transfer Note ${mtnNumber} successfully issued! Transferred ${transferQty} ${sourceItem.uom} to ${transferToStore}.`);
  };

  // Quick 1-Click BOM Requisition Dispense for active Work Orders
  const handleQuickBomDispense = (wo: WorkOrder) => {
    const defaultResinItem = plantStoreItems.find((s) => s.plantId === selectedPlant && s.storeCode === 'MAIN-RM-STORE' && s.category === 'RM');
    if (!defaultResinItem) {
      showToast('No raw material found in Main RM Store.');
      return;
    }

    const calculatedResinKg = Math.round(wo.qty * 0.048); // ~48g per shot
    const mtnNumber = `MTN-P${selectedPlant.slice(-1)}-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const updatedStoreItems = plantStoreItems.map((item) => {
      if (item.plantId === selectedPlant && item.itemCode === defaultResinItem.itemCode) {
        if (item.storeCode === 'MAIN-RM-STORE') {
          return { ...item, stockQty: Math.max(0, item.stockQty - calculatedResinKg) };
        }
        if (item.storeCode === 'PRD-STORE') {
          return { ...item, stockQty: item.stockQty + calculatedResinKg };
        }
      }
      return item;
    });

    onUpdatePlantStoreItems(updatedStoreItems);

    const newTransfer: MaterialTransferRecord = {
      id: mtnNumber,
      transferNo: mtnNumber,
      plantId: selectedPlant,
      plantName: PLANTS.find((p) => p.id === selectedPlant)?.name || selectedPlant,
      date: now.split(' ')[0],
      category: 'RM',
      fromStore: 'MAIN-RM-STORE',
      toStore: 'PRD-STORE',
      itemCode: defaultResinItem.itemCode,
      itemName: defaultResinItem.itemName,
      qty: calculatedResinKg,
      uom: 'KG',
      workOrderRef: wo.id,
      bomRefId: wo.bomId || 'BOM-1042',
      requestedBy: wo.operator || 'Production Lead',
      transferredBy: 'Santosh M. (Plant Stores)',
      status: 'received',
      notes: `Automated BOM batch dispense for Work Order ${wo.id} (${wo.qty} pcs)`,
    };

    onAddMaterialTransfer(newTransfer);
    showToast(`Quick Dispensed ${calculatedResinKg} KG of ${defaultResinItem.itemCode} to PRD-STORE for ${wo.id}!`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Title Banner */}
      <div className="bg-white border border-[#E4E0D6] rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                Operations &amp; Quality Control Hub
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#14213D] text-white">
                Multi-Store Topology
              </span>
            </div>
            <h1 className="text-2xl font-black text-[#14213D] tracking-tight flex items-center gap-2">
              <Layers className="w-6 h-6 text-[#E8622C]" />
              WIP Inventory, Deflash/Assembly Stores &amp; QC Gate
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Validates Daily Production Grid vs CSV imports, prevents duplicates, enforces mandatory QC inspection reasons, routes items to Deflash &amp; Assembly stores, and deducts secondary recipes on rejection.
            </p>
          </div>

          {/* Plant Selector & Quick Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-[#F9F8F5] border border-[#E4E0D6] rounded-xl px-3 py-1.5">
              <Building2 className="w-4 h-4 text-[#0F8B8D]" />
              <div className="text-left">
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Active Plant Facility</span>
                <select
                  value={selectedPlant}
                  onChange={(e) => setSelectedPlant(e.target.value)}
                  className="bg-transparent text-xs font-bold text-[#14213D] focus:outline-none cursor-pointer"
                >
                  {PLANTS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                  <option value="all">All Plants Overview</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('prodEntryGrid')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FAF9F5] text-gray-700 border border-[#E4E0D6] hover:bg-gray-100 flex items-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#0F8B8D]" />
              Daily Production Grid
            </button>

            <RequireAuth roles={['admin', 'manager', 'store_incharge']}>
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#E8622C] text-white hover:bg-[#d45320] shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeftRight className="w-4 h-4" />
                Issue Material Transfer Note (MTN)
              </button>
            </RequireAuth>
          </div>
        </div>

        {/* Operational Flow Indicator */}
        <div className="mt-5 pt-4 border-t border-[#E4E0D6] flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#14213D]">Standard Lifecycle:</span>
            <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-mono font-semibold">1. Grid/CSV Entry</span>
            <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-mono font-semibold">2. WIP (PRD-STORE)</span>
            <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="bg-purple-50 text-purple-800 px-2 py-0.5 rounded font-mono font-semibold">3. QC Inspection</span>
            <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded font-mono font-semibold">4. Deflash / Assembly</span>
            <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-mono font-semibold">5. FG-STORE</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Duplicate Prevention: <strong className="text-gray-700">Strict Key Hash</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> QC Rejection Reason: <strong className="text-gray-700">Mandatory</strong>
            </span>
          </div>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 text-xs">
        <div className="bg-white border border-[#E4E0D6] rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] text-gray-400 font-bold uppercase block">Total WIP Lots</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-[#14213D]">{metrics.totalLots}</span>
            <Layers className="w-4 h-4 text-gray-400" />
          </div>
          <span className="text-[10px] text-gray-500">Active tracked batches</span>
        </div>

        <div className="bg-white border border-amber-200 rounded-xl p-3.5 shadow-xs bg-amber-50/40">
          <span className="text-[10px] text-amber-700 font-bold uppercase block">Pending QC</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-amber-900">{metrics.pendingQc}</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-[10px] text-amber-700">Awaiting inspection</span>
        </div>

        <div className="bg-white border border-indigo-200 rounded-xl p-3.5 shadow-xs bg-indigo-50/40">
          <span className="text-[10px] text-indigo-700 font-bold uppercase block">In Deflash Store</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-indigo-900">{metrics.inDeflash}</span>
            <Scissors className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-[10px] text-indigo-700">Gate trimming floor</span>
        </div>

        <div className="bg-white border border-purple-200 rounded-xl p-3.5 shadow-xs bg-purple-50/40">
          <span className="text-[10px] text-purple-700 font-bold uppercase block">In Assembly Store</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-purple-900">{metrics.inAssembly}</span>
            <Wrench className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-[10px] text-purple-700">Hardware insertion</span>
        </div>

        <div className="bg-white border border-emerald-200 rounded-xl p-3.5 shadow-xs bg-emerald-50/40">
          <span className="text-[10px] text-emerald-700 font-bold uppercase block">Moved to FG Store</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-emerald-900">{metrics.movedToFg}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-[10px] text-emerald-700">100% Accepted FG</span>
        </div>

        <div className="bg-white border border-rose-200 rounded-xl p-3.5 shadow-xs bg-rose-50/40">
          <span className="text-[10px] text-rose-700 font-bold uppercase block">QC Rejected</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-rose-900">{metrics.qcRejected}</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <span className="text-[10px] text-rose-700">Recipe minused</span>
        </div>

        <div className="bg-white border border-amber-300 rounded-xl p-3.5 shadow-xs bg-amber-50/60">
          <span className="text-[10px] text-amber-800 font-bold uppercase block">QC Hold</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-black text-amber-950">{metrics.qcHold}</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-[10px] text-amber-800">Quarantined lots</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-[#E4E0D6] space-x-2">
        <button
          type="button"
          onClick={() => setActiveTab('wip')}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'wip'
              ? 'border-[#E8622C] text-[#E8622C] bg-white rounded-t-lg'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          WIP Grid &amp; QC Gate ({wipRecords.filter((r) => r.currentStore === 'PRD-STORE').length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('deflash')}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'deflash'
              ? 'border-[#E8622C] text-[#E8622C] bg-white rounded-t-lg'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Scissors className="w-4 h-4" />
          Deflash Area Store ({deflashStoreRecords.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('assembly')}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'assembly'
              ? 'border-[#E8622C] text-[#E8622C] bg-white rounded-t-lg'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Wrench className="w-4 h-4" />
          Assembly Area Store ({assemblyStoreRecords.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('fg')}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'fg'
              ? 'border-[#E8622C] text-[#E8622C] bg-white rounded-t-lg'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          FG Inventory Grid ({fgStoreRecords.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('transfers')}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'transfers'
              ? 'border-[#E8622C] text-[#E8622C] bg-white rounded-t-lg'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          Plant Material Transfers (RM / BOP / PCK / CON)
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: WIP INVENTORY GRID & QC GATE */}
      {/* ========================================================================= */}
      {activeTab === 'wip' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white border border-[#E4E0D6] rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Part Code, Lot #, Work Order..."
                  className="pl-9 pr-3 py-2 border border-[#E4E0D6] rounded-lg w-64 text-xs focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')} className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-gray-500 font-semibold">QC Status:</span>
                <select
                  value={qcStatusFilter}
                  onChange={(e) => setQcStatusFilter(e.target.value)}
                  className="border border-[#E4E0D6] rounded-lg py-1.5 px-2.5 bg-white text-xs text-[#14213D] focus:outline-none"
                >
                  <option value="all">All QC Statuses</option>
                  <option value="pending_qc">Pending QC</option>
                  <option value="qc_approved">QC Approved</option>
                  <option value="qc_hold">QC Hold / Quarantine</option>
                  <option value="qc_rejected">QC Rejected</option>
                  <option value="transferred_deflash">Transferred Deflash</option>
                  <option value="transferred_assembly">Transferred Assembly</option>
                  <option value="moved_to_fg">Moved to FG</option>
                </select>
              </div>

              {/* Store Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-gray-500 font-semibold">Store:</span>
                <select
                  value={storeFilter}
                  onChange={(e) => setStoreFilter(e.target.value)}
                  className="border border-[#E4E0D6] rounded-lg py-1.5 px-2.5 bg-white text-xs text-[#14213D] focus:outline-none font-mono"
                >
                  <option value="all">All Stores</option>
                  <option value="PRD-STORE">PRD-STORE (Molding Floor)</option>
                  <option value="DEFLASH-STORE">DEFLASH-STORE</option>
                  <option value="ASSEMBLY-STORE">ASSEMBLY-STORE</option>
                  <option value="FG-STORE">FG-STORE</option>
                </select>
              </div>

              {/* Source Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-gray-500 font-semibold">Entry Source:</span>
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value as any)}
                  className="border border-[#E4E0D6] rounded-lg py-1.5 px-2.5 bg-white text-xs text-[#14213D] focus:outline-none"
                >
                  <option value="all">All Sources</option>
                  <option value="grid_entry">Manual Grid Entry</option>
                  <option value="excel_csv_upload">Excel / CSV Import</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Showing <strong>{filteredWipRecords.length}</strong> WIP lots</span>
            </div>
          </div>

          {/* WIP Records Table */}
          <div className="bg-white border border-[#E4E0D6] rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAF9F5] border-b border-[#E4E0D6] text-[11px] font-bold text-[#14213D] uppercase tracking-wider">
                    <th className="p-3">Batch Lot / Source</th>
                    <th className="p-3">Work Order &amp; Item</th>
                    <th className="p-3">Machine / Shift</th>
                    <th className="p-3 text-right">Gross Output</th>
                    <th className="p-3 text-right">Good Qty</th>
                    <th className="p-3 text-right">Scrap / Runner</th>
                    <th className="p-3">Current Store</th>
                    <th className="p-3">QC Status</th>
                    <th className="p-3 text-center">QC Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E0D6]">
                  {filteredWipRecords.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-gray-500">
                        <Layers className="w-8 h-8 text-gray-400 mx-auto mb-2 opacity-60" />
                        <p className="font-semibold text-gray-700">No WIP inventory records found</p>
                        <p className="text-[11px] text-gray-400 mt-1">
                          Log production from the Daily Production Grid or import Excel/CSV to populate WIP lots.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredWipRecords.map((rec) => (
                      <tr key={rec.id} className="hover:bg-[#FAF9F5]/80 transition-colors">
                        {/* Lot & Source */}
                        <td className="p-3">
                          <div className="font-mono font-bold text-[#14213D]">{rec.batchLotNo}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {rec.source === 'grid_entry' ? (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                Grid Entry
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                                <FileSpreadsheet className="w-2.5 h-2.5" /> CSV Upload
                              </span>
                            )}
                            <span className="text-[10px] text-gray-400">{rec.productionDate}</span>
                          </div>
                          {rec.deduplicationNotes && (
                            <span className="text-[9px] text-emerald-700 block mt-0.5 font-semibold">
                              ✓ {rec.deduplicationNotes}
                            </span>
                          )}
                        </td>

                        {/* WO & Item */}
                        <td className="p-3">
                          <div className="font-mono font-bold text-gray-800">{rec.workOrderId}</div>
                          <div className="font-semibold text-[#14213D] truncate max-w-[200px]">{rec.itemCode}</div>
                          <div className="text-[10px] text-gray-500 truncate max-w-[220px]">{rec.itemName}</div>
                        </td>

                        {/* Machine & Shift */}
                        <td className="p-3">
                          <div className="font-semibold text-gray-800">{rec.machineId}</div>
                          <div className="text-[10px] text-gray-500">{rec.shift} &bull; {rec.operator}</div>
                        </td>

                        {/* Gross */}
                        <td className="p-3 text-right font-mono font-bold text-gray-900">
                          {rec.producedQty.toLocaleString()}
                        </td>

                        {/* Good Qty */}
                        <td className="p-3 text-right">
                          <span className="font-mono font-bold text-emerald-700 text-sm">
                            {rec.goodQty.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-gray-400 block font-normal">PCS</span>
                        </td>

                        {/* Scrap & Runner */}
                        <td className="p-3 text-right">
                          <div className="font-mono font-bold text-rose-600">{rec.scrapQty} pcs</div>
                          <div className="text-[10px] text-gray-500 font-mono">{rec.runnerKg} kg runner</div>
                        </td>

                        {/* Current Store */}
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-gray-100 text-gray-800 border border-gray-300">
                            {rec.currentStore}
                          </span>
                          <span className="text-[10px] text-gray-500 block mt-0.5">{rec.currentStage}</span>
                        </td>

                        {/* QC Status */}
                        <td className="p-3">
                          {rec.qcStatus === 'pending_qc' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 w-fit">
                              <Clock className="w-3 h-3" /> Pending QC
                            </span>
                          )}
                          {rec.qcStatus === 'qc_approved' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3" /> Approved
                            </span>
                          )}
                          {rec.qcStatus === 'transferred_deflash' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1 w-fit">
                              <Scissors className="w-3 h-3" /> In Deflash
                            </span>
                          )}
                          {rec.qcStatus === 'transferred_assembly' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1 w-fit">
                              <Wrench className="w-3 h-3" /> In Assembly
                            </span>
                          )}
                          {rec.qcStatus === 'moved_to_fg' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-900 border border-teal-200 flex items-center gap-1 w-fit">
                              <Check className="w-3 h-3" /> In FG-STORE
                            </span>
                          )}
                          {rec.qcStatus === 'qc_hold' && (
                            <div>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 border border-amber-300 flex items-center gap-1 w-fit">
                                <AlertTriangle className="w-3 h-3" /> QC Quarantine
                              </span>
                              {rec.qcHoldReason && (
                                <span className="text-[9px] text-amber-800 block mt-0.5 truncate max-w-[150px]">
                                  {rec.qcHoldReason}
                                </span>
                              )}
                            </div>
                          )}
                          {rec.qcStatus === 'qc_rejected' && (
                            <div>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1 w-fit">
                                <XCircle className="w-3 h-3" /> QC Rejected
                              </span>
                              {rec.qcRejectionReason && (
                                <span className="text-[9px] text-rose-700 block mt-0.5 font-semibold truncate max-w-[150px]">
                                  Reason: {rec.qcRejectionReason}
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-3 text-center">
                          <RequireAuth roles={['admin', 'manager', 'qc_inspector', 'user']}>
                            <button
                              type="button"
                              onClick={() => handleOpenQcInspection(rec)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#14213D] text-white hover:bg-[#0F8B8D] transition-colors shadow-2xs flex items-center gap-1 mx-auto"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              QC Check
                            </button>
                          </RequireAuth>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DEFLASH AREA STORE & TRIMMING QC */}
      {/* ========================================================================= */}
      {activeTab === 'deflash' && (
        <div className="space-y-4">
          <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-4 flex items-start gap-3 text-xs text-indigo-950">
            <Scissors className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-indigo-900 text-sm">Deflash &amp; Trimming Area Floor Store (DEFLASH-STORE)</h4>
              <p className="mt-0.5 text-indigo-800">
                Parts requiring parting line gate trimming, cryogenic deburring, or flash removal arrive here after daily production entry.
                Quality Control checks all deflashed lots. <strong>If any item quantity is rejected here, the secondary deflash consumables recipe is automatically minused and reversed.</strong>
              </p>
            </div>
          </div>

          <div className="bg-white border border-[#E4E0D6] rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF9F5] border-b border-[#E4E0D6] text-[11px] font-bold text-[#14213D] uppercase tracking-wider">
                  <th className="p-3">Batch Lot #</th>
                  <th className="p-3">Item Code &amp; Name</th>
                  <th className="p-3">Origin Work Order</th>
                  <th className="p-3 text-right">Available for Deflash</th>
                  <th className="p-3">Deflash Recipe Consumables</th>
                  <th className="p-3">Deflash QC Status</th>
                  <th className="p-3 text-center">Deflash Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E0D6]">
                {deflashStoreRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      <Scissors className="w-8 h-8 text-gray-400 mx-auto mb-2 opacity-60" />
                      <p className="font-semibold text-gray-700">No parts currently in DEFLASH-STORE</p>
                      <p className="text-[11px] text-gray-400 mt-1">
                        Use the WIP Grid QC Check to route parts requiring deflashing here.
                      </p>
                    </td>
                  </tr>
                ) : (
                  deflashStoreRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-[#FAF9F5]/80 transition-colors">
                      <td className="p-3 font-mono font-bold text-[#14213D]">{rec.batchLotNo}</td>
                      <td className="p-3">
                        <div className="font-bold text-[#14213D]">{rec.itemCode}</div>
                        <div className="text-[10px] text-gray-500">{rec.itemName}</div>
                      </td>
                      <td className="p-3 font-mono text-gray-700">{rec.workOrderId}</td>
                      <td className="p-3 text-right">
                        <span className="font-mono font-bold text-indigo-700 text-sm">
                          {rec.goodQty.toLocaleString()}
                        </span>{' '}
                        PCS
                      </td>
                      <td className="p-3">
                        <span className="text-[11px] text-gray-700 block">
                          &bull; Carbide Trimming Blade: 0.001 PAC/pc
                        </span>
                        <span className="text-[11px] text-gray-700 block">
                          &bull; Antistatic Degreasing Wipe: 0.005 ROL/pc
                        </span>
                      </td>
                      <td className="p-3">
                        {rec.deflashStatus === 'in_progress' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Ready for Trimming
                          </span>
                        ) : rec.deflashStatus === 'qc_approved' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Deflash Approved
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-800 border border-gray-200">
                            Pending Deflash
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenDeflashModal(rec)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-2xs flex items-center gap-1 mx-auto"
                        >
                          <Scissors className="w-3.5 h-3.5" />
                          Execute Deflash &amp; QC
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

      {/* ========================================================================= */}
      {/* TAB 3: ASSEMBLY AREA STORE & SECONDARY QC */}
      {/* ========================================================================= */}
      {activeTab === 'assembly' && (
        <div className="space-y-4">
          <div className="bg-purple-50/60 border border-purple-200 rounded-xl p-4 flex items-start gap-3 text-xs text-purple-950">
            <Wrench className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-purple-900 text-sm">Assembly &amp; Secondary Integration Store (ASSEMBLY-STORE)</h4>
              <p className="mt-0.5 text-purple-800">
                Molded shells combine with BOP bought-out hardware (brass ultrasonic threaded inserts, screws, O-ring seals, springs) in this area.
                <strong>If parts are rejected during assembly or testing, the consumed hardware recipe is automatically minused and reversed from the assembly store ledger.</strong>
              </p>
            </div>
          </div>

          <div className="bg-white border border-[#E4E0D6] rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF9F5] border-b border-[#E4E0D6] text-[11px] font-bold text-[#14213D] uppercase tracking-wider">
                  <th className="p-3">Batch Lot #</th>
                  <th className="p-3">Item Code &amp; Name</th>
                  <th className="p-3">Origin Work Order</th>
                  <th className="p-3 text-right">Available Shells</th>
                  <th className="p-3">Linked Assembly Recipe (BOP / Consumables)</th>
                  <th className="p-3">Assembly QC Status</th>
                  <th className="p-3 text-center">Assembly Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E0D6]">
                {assemblyStoreRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      <Wrench className="w-8 h-8 text-gray-400 mx-auto mb-2 opacity-60" />
                      <p className="font-semibold text-gray-700">No parts currently in ASSEMBLY-STORE</p>
                      <p className="text-[11px] text-gray-400 mt-1">
                        Use the WIP Grid QC Check to transfer molded parts requiring hardware insertion here.
                      </p>
                    </td>
                  </tr>
                ) : (
                  assemblyStoreRecords.map((rec) => {
                    const recipe = ASSEMBLY_RECIPES[rec.itemCode] || ASSEMBLY_RECIPES['FG-CTN-500'];
                    return (
                      <tr key={rec.id} className="hover:bg-[#FAF9F5]/80 transition-colors">
                        <td className="p-3 font-mono font-bold text-[#14213D]">{rec.batchLotNo}</td>
                        <td className="p-3">
                          <div className="font-bold text-[#14213D]">{rec.itemCode}</div>
                          <div className="text-[10px] text-gray-500">{rec.itemName}</div>
                        </td>
                        <td className="p-3 font-mono text-gray-700">{rec.workOrderId}</td>
                        <td className="p-3 text-right">
                          <span className="font-mono font-bold text-purple-700 text-sm">
                            {rec.goodQty.toLocaleString()}
                          </span>{' '}
                          PCS
                        </td>
                        <td className="p-3">
                          <div className="space-y-0.5">
                            {recipe.map((r) => (
                              <div key={r.itemCode} className="text-[11px] text-gray-700 flex items-center justify-between gap-2">
                                <span>&bull; {r.itemName}</span>
                                <span className="font-mono font-semibold text-purple-800">
                                  {r.qtyPerUnit} {r.uom}/pc
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="p-3">
                          {rec.assemblyStatus === 'in_progress' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              Assembly In Progress
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-800 border border-gray-200">
                              Staged for Assembly
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleOpenAssemblyModal(rec)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-700 text-white hover:bg-purple-800 transition-colors shadow-2xs flex items-center gap-1 mx-auto"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                            Assemble &amp; Move to FG
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: FG INVENTORY GRID */}
      {/* ========================================================================= */}
      {activeTab === 'fg' && (
        <div className="space-y-4">
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 flex items-center justify-between gap-3 text-xs text-emerald-950">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <h4 className="font-bold text-emerald-900 text-sm">Finished Goods Warehouse Inventory (FG-STORE)</h4>
                <p className="mt-0.5 text-emerald-800">
                  Cleared all quality control checkpoints across Molding, Deflash, and Assembly. Stored and ready for customer dispatch.
                </p>
              </div>
            </div>
            <span className="font-mono font-bold text-base text-emerald-800 bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-300">
              {fgStoreRecords.reduce((acc, r) => acc + r.goodQty, 0).toLocaleString()} Total Units FG
            </span>
          </div>

          <div className="bg-white border border-[#E4E0D6] rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF9F5] border-b border-[#E4E0D6] text-[11px] font-bold text-[#14213D] uppercase tracking-wider">
                  <th className="p-3">FG Lot / Batch #</th>
                  <th className="p-3">Item Code &amp; Name</th>
                  <th className="p-3">Plant Facility</th>
                  <th className="p-3 text-right">Accepted FG Qty</th>
                  <th className="p-3">QC Release Certificate</th>
                  <th className="p-3">Packaging &amp; Bin</th>
                  <th className="p-3">Cleared Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E0D6]">
                {fgStoreRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      <CheckCircle2 className="w-8 h-8 text-gray-400 mx-auto mb-2 opacity-60" />
                      <p className="font-semibold text-gray-700">No Finished Goods currently in FG-STORE</p>
                      <p className="text-[11px] text-gray-400 mt-1">
                        Inspect lots in the WIP Grid or complete Assembly to release finished parts to FG.
                      </p>
                    </td>
                  </tr>
                ) : (
                  fgStoreRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-[#FAF9F5]/80 transition-colors">
                      <td className="p-3 font-mono font-bold text-[#14213D]">{rec.batchLotNo}</td>
                      <td className="p-3">
                        <div className="font-bold text-[#14213D]">{rec.itemCode}</div>
                        <div className="text-[10px] text-gray-500">{rec.itemName}</div>
                      </td>
                      <td className="p-3 text-gray-700 font-medium">{rec.plantName}</td>
                      <td className="p-3 text-right">
                        <span className="font-mono font-bold text-emerald-800 text-sm">
                          {rec.goodQty.toLocaleString()}
                        </span>{' '}
                        PCS
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          COA-PASS-2026
                        </span>
                        <span className="text-[10px] text-gray-500 block mt-0.5">
                          By: {rec.qcInspectedBy || 'Pooja V. (QC)'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="font-mono text-gray-700 text-[11px] font-semibold">FG-WH1-B02</span>
                        <span className="text-[10px] text-gray-400 block">5-Ply Box Partitioned</span>
                      </td>
                      <td className="p-3 font-mono text-gray-500 text-[11px]">{rec.lastUpdated}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: PLANT-WISE STORE MATERIAL TRANSFERS (RM / BOP / PCK / CON) */}
      {/* ========================================================================= */}
      {activeTab === 'transfers' && (
        <div className="space-y-6">
          <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs text-amber-950">
            <div>
              <h4 className="font-bold text-amber-900 text-sm flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-amber-700" />
                Plant Material Transfer System (RM, BOP, PCK, CON)
              </h4>
              <p className="mt-0.5 text-amber-800">
                Each plant ({selectedPlant}) maintains identical store topology. Transfer materials from Main Warehouse Stores
                (<code>MAIN-RM-STORE</code>, <code>MAIN-BOP-STORE</code>, <code>MAIN-PCK-STORE</code>, <code>MAIN-CON-STORE</code>)
                to operational floor stores (<code>PRD-STORE</code>, <code>ASSEMBLY-STORE</code>, <code>DEFLASH-STORE</code>).
              </p>
            </div>
            <RequireAuth roles={['admin', 'manager', 'store_incharge']}>
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#14213D] text-white hover:bg-[#0F8B8D] transition-colors shadow-xs shrink-0 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                New Transfer Note (MTN)
              </button>
            </RequireAuth>
          </div>

          {/* Quick BOM Requisition Dispense Assistant */}
          <div className="bg-white border border-[#E4E0D6] rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#E8622C]" />
                <h3 className="text-sm font-bold text-[#14213D]">BOM-Linked Material Requisition Assistant</h3>
              </div>
              <span className="text-[11px] text-gray-500">
                Auto-calculates required RM, BOP, PCK &amp; CON based on active Work Order BOM batch
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {workOrders.slice(0, 3).map((wo) => {
                const reqResinKg = Math.round(wo.qty * 0.048);
                return (
                  <div key={wo.id} className="p-3.5 bg-[#FAF9F5] border border-[#E4E0D6] rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-[#14213D]">{wo.id}</span>
                      <span className="text-[10px] font-bold text-[#0F8B8D] bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {wo.qty} PCS Scheduled
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-gray-800 truncate">{wo.item}</div>
                    <div className="text-[11px] text-gray-600 space-y-0.5">
                      <div>&bull; RM Req: <strong>{reqResinKg} KG</strong> PP Granules &rarr; <code>PRD-STORE</code></div>
                      <div>&bull; BOP Req: <strong>{wo.qty * 4} PCS</strong> Brass Inserts &rarr; <code>ASSEMBLY-STORE</code></div>
                      <div>&bull; CON Req: <strong>2 CAN</strong> Release Spray &rarr; <code>PRD-STORE</code></div>
                    </div>
                    <RequireAuth roles={['admin', 'manager', 'store_incharge']}>
                      <button
                        type="button"
                        onClick={() => handleQuickBomDispense(wo)}
                        className="w-full mt-1 py-1.5 px-3 rounded-lg text-xs font-bold bg-[#E8622C] text-white hover:bg-[#d45320] transition-colors shadow-2xs flex items-center justify-center gap-1"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        1-Click Dispense to Floor Stores
                      </button>
                    </RequireAuth>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Plant Store Inventory Balances Table */}
          <div className="bg-white border border-[#E4E0D6] rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 bg-[#FAF9F5] border-b border-[#E4E0D6] flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#14213D] uppercase tracking-wider">
                Store Inventory Balances &bull; {selectedPlant}
              </h3>
              <span className="text-[11px] text-gray-500 font-medium">
                {currentPlantStoreInventory.length} Tracked Material Items
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAF9F5] border-b border-[#E4E0D6] text-[11px] font-bold text-[#14213D] uppercase tracking-wider">
                    <th className="p-3">Store Location</th>
                    <th className="p-3">Material Category</th>
                    <th className="p-3">Item Code &amp; Name</th>
                    <th className="p-3 text-right">Available Stock</th>
                    <th className="p-3 text-right">Min Safety Stock</th>
                    <th className="p-3 text-right">Standard Cost</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E0D6]">
                  {currentPlantStoreInventory.map((item) => {
                    const isLow = item.stockQty <= item.minSafetyStock;
                    return (
                      <tr key={item.id} className="hover:bg-[#FAF9F5]/80 transition-colors">
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                            item.storeCode.startsWith('MAIN-')
                              ? 'bg-blue-50 text-blue-900 border border-blue-200'
                              : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                          }`}>
                            {item.storeCode}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-gray-700">{item.category}</span>
                        </td>
                        <td className="p-3">
                          <div className="font-mono font-bold text-[#14213D]">{item.itemCode}</div>
                          <div className="text-[10px] text-gray-500">{item.itemName}</div>
                        </td>
                        <td className="p-3 text-right">
                          <span className="font-mono font-bold text-[#14213D] text-sm">
                            {item.stockQty.toLocaleString()}
                          </span>{' '}
                          <span className="text-[10px] text-gray-400">{item.uom}</span>
                        </td>
                        <td className="p-3 text-right font-mono text-gray-500">
                          {item.minSafetyStock.toLocaleString()} {item.uom}
                        </td>
                        <td className="p-3 text-right font-mono text-gray-700">
                          ${item.unitCost.toFixed(2)}
                        </td>
                        <td className="p-3 text-center">
                          {isLow ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              Low Stock
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Adequate
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

          {/* Transfer History Log */}
          <div className="bg-white border border-[#E4E0D6] rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 bg-[#FAF9F5] border-b border-[#E4E0D6] flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#14213D] uppercase tracking-wider">
                Material Transfer History (MTN Ledger)
              </h3>
              <span className="text-[11px] text-gray-500 font-medium">
                {currentPlantTransfers.length} Executed Transfers
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAF9F5] border-b border-[#E4E0D6] text-[11px] font-bold text-[#14213D] uppercase tracking-wider">
                    <th className="p-3">Transfer Note #</th>
                    <th className="p-3">Source Store</th>
                    <th className="p-3">Destination Store</th>
                    <th className="p-3">Item Details</th>
                    <th className="p-3 text-right">Transferred Qty</th>
                    <th className="p-3">WO Reference</th>
                    <th className="p-3">Authorized By</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E0D6]">
                  {currentPlantTransfers.map((t) => (
                    <tr key={t.id} className="hover:bg-[#FAF9F5]/80 transition-colors">
                      <td className="p-3 font-mono font-bold text-[#14213D]">{t.transferNo}</td>
                      <td className="p-3 font-mono text-blue-900 font-semibold">{t.fromStore}</td>
                      <td className="p-3 font-mono text-emerald-900 font-semibold">{t.toStore}</td>
                      <td className="p-3">
                        <div className="font-bold text-[#14213D]">{t.itemCode}</div>
                        <div className="text-[10px] text-gray-500">{t.itemName}</div>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-[#14213D]">
                        {t.qty.toLocaleString()} {t.uom}
                      </td>
                      <td className="p-3 font-mono text-gray-700">{t.workOrderRef || 'General Staging'}</td>
                      <td className="p-3 text-gray-600 text-[11px]">
                        <div>{t.transferredBy}</div>
                        <span className="text-[10px] text-gray-400">{t.date}</span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {(t.status || 'COMPLETED').toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: QC INSPECTION & ROUTING GATE */}
      {/* ========================================================================= */}
      {inspectingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#E4E0D6] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-3">
              <div>
                <span className="text-[10px] text-amber-700 font-bold uppercase bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Quality Assurance Gatekeeper
                </span>
                <h3 className="text-base font-black text-[#14213D] mt-1 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#0F8B8D]" />
                  QC Inspection &bull; Lot {inspectingRecord.batchLotNo}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectingRecord(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lot Summary Card */}
            <div className="bg-[#FAF9F5] border border-[#E4E0D6] rounded-xl p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-semibold block">Part Number</span>
                <span className="font-mono font-bold text-[#14213D]">{inspectingRecord.itemCode}</span>
              </div>
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-semibold block">Work Order</span>
                <span className="font-mono font-bold text-gray-800">{inspectingRecord.workOrderId}</span>
              </div>
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-semibold block">Produced Gross</span>
                <span className="font-mono font-bold text-emerald-700">{inspectingRecord.producedQty} PCS</span>
              </div>
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-semibold block">Machine / Shift</span>
                <span className="font-semibold text-gray-700">{inspectingRecord.machineId} ({inspectingRecord.shift})</span>
              </div>
            </div>

            {/* QC Decision Options */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#14213D] block">
                Select QC Disposition Decision:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {/* 1. Direct Move to FG */}
                <label className={`p-3 rounded-xl border cursor-pointer flex items-start gap-2.5 transition-colors ${
                  qcDecision === 'approve_fg' ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold' : 'border-[#E4E0D6] hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="qc_decision"
                    checked={qcDecision === 'approve_fg'}
                    onChange={() => setQcDecision('approve_fg')}
                    className="mt-0.5 accent-emerald-600"
                  />
                  <div>
                    <span className="block font-bold">Approve &amp; Move to FG Inventory</span>
                    <span className="text-[10px] text-gray-500 font-normal">
                      Direct molding completion &bull; Moves to <code>FG-STORE</code>
                    </span>
                  </div>
                </label>

                {/* 2. Route to Deflash */}
                <label className={`p-3 rounded-xl border cursor-pointer flex items-start gap-2.5 transition-colors ${
                  qcDecision === 'route_deflash' ? 'bg-indigo-50 border-indigo-500 text-indigo-950 font-bold' : 'border-[#E4E0D6] hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="qc_decision"
                    checked={qcDecision === 'route_deflash'}
                    onChange={() => setQcDecision('route_deflash')}
                    className="mt-0.5 accent-indigo-600"
                  />
                  <div>
                    <span className="block font-bold">Route to Deflash Floor Store</span>
                    <span className="text-[10px] text-gray-500 font-normal">
                      Part requires trimming &bull; Moves to <code>DEFLASH-STORE</code>
                    </span>
                  </div>
                </label>

                {/* 3. Route to Assembly */}
                <label className={`p-3 rounded-xl border cursor-pointer flex items-start gap-2.5 transition-colors ${
                  qcDecision === 'route_assembly' ? 'bg-purple-50 border-purple-500 text-purple-950 font-bold' : 'border-[#E4E0D6] hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="qc_decision"
                    checked={qcDecision === 'route_assembly'}
                    onChange={() => setQcDecision('route_assembly')}
                    className="mt-0.5 accent-purple-600"
                  />
                  <div>
                    <span className="block font-bold">Route to Assembly Floor Store</span>
                    <span className="text-[10px] text-gray-500 font-normal">
                      Requires secondary hardware &bull; Moves to <code>ASSEMBLY-STORE</code>
                    </span>
                  </div>
                </label>

                {/* 4. QC Hold */}
                <label className={`p-3 rounded-xl border cursor-pointer flex items-start gap-2.5 transition-colors ${
                  qcDecision === 'hold' ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold' : 'border-[#E4E0D6] hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="qc_decision"
                    checked={qcDecision === 'hold'}
                    onChange={() => setQcDecision('hold')}
                    className="mt-0.5 accent-amber-600"
                  />
                  <div>
                    <span className="block font-bold text-amber-900">Place on QC Quarantine Hold</span>
                    <span className="text-[10px] text-gray-500 font-normal">
                      CMM dimension verification or lab test pending
                    </span>
                  </div>
                </label>

                {/* 5. Reject */}
                <label className={`p-3 rounded-xl border cursor-pointer flex items-start gap-2.5 sm:col-span-2 transition-colors ${
                  qcDecision === 'reject' ? 'bg-rose-50 border-rose-500 text-rose-950 font-bold' : 'border-[#E4E0D6] hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="qc_decision"
                    checked={qcDecision === 'reject'}
                    onChange={() => setQcDecision('reject')}
                    className="mt-0.5 accent-rose-600"
                  />
                  <div>
                    <span className="block font-bold text-rose-900">Reject Lot (Scrap / Regrind)</span>
                    <span className="text-[10px] text-gray-500 font-normal">
                      MANDATORY QC Rejection reason required &bull; Auto-deducts related recipe
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Conditional: QC Rejection Reason Form */}
            {qcDecision === 'reject' && (
              <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Mandatory QC Rejection Details:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-bold text-rose-950 block mb-1">
                      Standard Rejection Reason Code <span className="text-rose-600">*</span>
                    </label>
                    <select
                      value={qcRejectionReason}
                      onChange={(e) => {
                        setQcRejectionReason(e.target.value);
                        const found = STANDARD_QC_REJECTION_REASONS.find((r) => r.reason === e.target.value);
                        if (found) setQcRejectionCategory(found.category);
                      }}
                      className="w-full py-2 px-3 border border-rose-300 rounded-lg bg-white text-xs text-rose-950 font-semibold focus:outline-none"
                    >
                      {STANDARD_QC_REJECTION_REASONS.map((r) => (
                        <option key={r.code} value={r.reason}>
                          [{r.code}] {r.reason} ({r.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-rose-950 block mb-1">
                      Scrap Quantity to Reject (PCS) <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={inspectingRecord.producedQty}
                      value={qcScrapQty || inspectingRecord.producedQty}
                      onChange={(e) => setQcScrapQty(parseInt(e.target.value) || 0)}
                      className="w-full py-2 px-3 border border-rose-300 rounded-lg bg-white text-xs font-mono font-bold text-rose-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-rose-950 block mb-1">
                    Specific Inspector Finding / Root Cause Description
                  </label>
                  <input
                    type="text"
                    value={qcCustomReason}
                    onChange={(e) => setQcCustomReason(e.target.value)}
                    placeholder="e.g. Cavity 3 gate splay due to dryer hopper heater failure"
                    className="w-full py-2 px-3 border border-rose-300 rounded-lg bg-white text-xs focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Conditional: QC Hold Reason */}
            {qcDecision === 'hold' && (
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-2 text-xs">
                <label className="text-[11px] font-bold text-amber-950 block">
                  Mandatory Quarantine Reason <span className="text-rose-600">*</span>
                </label>
                <select
                  value={qcHoldReason}
                  onChange={(e) => setQcHoldReason(e.target.value)}
                  className="w-full py-2 px-3 border border-amber-300 rounded-lg bg-white text-xs text-amber-950 font-semibold focus:outline-none"
                >
                  {STANDARD_QC_HOLD_REASONS.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Inspector Identity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-xs font-bold text-[#14213D] block mb-1">QC Inspector Sign-off</label>
                <input
                  type="text"
                  value={qcInspectorName}
                  onChange={(e) => setQcInspectorName(e.target.value)}
                  className="w-full py-2 px-3 border border-[#E4E0D6] rounded-lg text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#14213D] block mb-1">Inspection Notes / COA Remarks</label>
                <input
                  type="text"
                  value={qcNotes}
                  onChange={(e) => setQcNotes(e.target.value)}
                  placeholder="Optional inspector remarks..."
                  className="w-full py-2 px-3 border border-[#E4E0D6] rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E4E0D6]">
              <button
                type="button"
                onClick={() => setInspectingRecord(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCommitQcDecision}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#14213D] text-white hover:bg-[#0F8B8D] shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Check className="w-4 h-4" />
                Commit QC Disposition
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: DEFLASH PROCESS & QC EXECUTION */}
      {/* ========================================================================= */}
      {deflashLot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#E4E0D6] rounded-2xl w-full max-w-lg shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-3">
              <h3 className="text-base font-black text-[#14213D] flex items-center gap-2">
                <Scissors className="w-5 h-5 text-indigo-600" />
                Execute Deflash &amp; Trimming &bull; {deflashLot.batchLotNo}
              </h3>
              <button type="button" onClick={() => setDeflashLot(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#E4E0D6] text-xs space-y-1">
              <div>Part: <strong>{deflashLot.itemCode}</strong> &bull; {deflashLot.itemName}</div>
              <div>Available Staged: <strong className="font-mono text-indigo-700">{deflashLot.goodQty} PCS</strong></div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-xs font-bold text-emerald-800 block mb-1">Approved Deflashed Qty</label>
                <input
                  type="number"
                  min="0"
                  max={deflashLot.goodQty}
                  value={deflashPassedQty}
                  onChange={(e) => {
                    const passed = parseInt(e.target.value) || 0;
                    setDeflashPassedQty(passed);
                    setDeflashScrapQty(Math.max(0, deflashLot.goodQty - passed));
                  }}
                  className="w-full py-2 px-3 border border-[#E4E0D6] rounded-lg font-mono font-bold text-emerald-700"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-rose-800 block mb-1">Deflash Scrap / Rejected</label>
                <input
                  type="number"
                  min="0"
                  max={deflashLot.goodQty}
                  value={deflashScrapQty}
                  onChange={(e) => {
                    const scrap = parseInt(e.target.value) || 0;
                    setDeflashScrapQty(scrap);
                    setDeflashPassedQty(Math.max(0, deflashLot.goodQty - scrap));
                  }}
                  className="w-full py-2 px-3 border border-rose-300 rounded-lg font-mono font-bold text-rose-700 bg-rose-50/40"
                />
              </div>
            </div>

            {deflashScrapQty > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5 text-xs text-rose-950">
                <label className="font-bold block">
                  Mandatory Deflash Rejection Reason <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={deflashRejectReason}
                  onChange={(e) => setDeflashRejectReason(e.target.value)}
                  placeholder="e.g. Over-cut on gate trimming, gouged seal surface"
                  className="w-full py-2 px-3 border border-rose-300 rounded-lg bg-white"
                />
                <span className="text-[10px] text-rose-700 block mt-1">
                  ⚡ Auto-deduction: Deflash tooling blade consumable rate will be minused from DEFLASH-STORE.
                </span>
              </div>
            )}

            <div className="text-xs">
              <label className="text-xs font-bold text-[#14213D] block mb-1">Forward Approved Units To:</label>
              <select
                value={deflashDestination}
                onChange={(e) => setDeflashDestination(e.target.value as any)}
                className="w-full py-2 px-3 border border-[#E4E0D6] rounded-lg bg-white font-mono font-bold text-xs"
              >
                <option value="FG-STORE">FG-STORE (Finished Goods Ready for Warehouse)</option>
                <option value="ASSEMBLY-STORE">ASSEMBLY-STORE (Requires Secondary Hardware / BOP)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E4E0D6]">
              <button type="button" onClick={() => setDeflashLot(null)} className="px-4 py-2 text-xs font-bold text-gray-600">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCommitDeflash}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Commit Deflash &amp; Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ASSEMBLY PROCESS & QC EXECUTION */}
      {/* ========================================================================= */}
      {assemblyLot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#E4E0D6] rounded-2xl w-full max-w-lg shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-3">
              <h3 className="text-base font-black text-[#14213D] flex items-center gap-2">
                <Wrench className="w-5 h-5 text-purple-600" />
                Assembly Run &amp; QC &bull; {assemblyLot.batchLotNo}
              </h3>
              <button type="button" onClick={() => setAssemblyLot(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#E4E0D6] text-xs space-y-1">
              <div>Part: <strong>{assemblyLot.itemCode}</strong> &bull; {assemblyLot.itemName}</div>
              <div>Available Shells: <strong className="font-mono text-purple-700">{assemblyLot.goodQty} PCS</strong></div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-xs font-bold text-emerald-800 block mb-1">Passed Assembled FG</label>
                <input
                  type="number"
                  min="0"
                  max={assemblyLot.goodQty}
                  value={assemblyPassedQty}
                  onChange={(e) => {
                    const passed = parseInt(e.target.value) || 0;
                    setAssemblyPassedQty(passed);
                    setAssemblyScrapQty(Math.max(0, assemblyLot.goodQty - passed));
                  }}
                  className="w-full py-2 px-3 border border-[#E4E0D6] rounded-lg font-mono font-bold text-emerald-700"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-rose-800 block mb-1">Assembly Rejection / Scrap</label>
                <input
                  type="number"
                  min="0"
                  max={assemblyLot.goodQty}
                  value={assemblyScrapQty}
                  onChange={(e) => {
                    const scrap = parseInt(e.target.value) || 0;
                    setAssemblyScrapQty(scrap);
                    setAssemblyPassedQty(Math.max(0, assemblyLot.goodQty - scrap));
                  }}
                  className="w-full py-2 px-3 border border-rose-300 rounded-lg font-mono font-bold text-rose-700 bg-rose-50/40"
                />
              </div>
            </div>

            {assemblyScrapQty > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5 text-xs text-rose-950">
                <label className="font-bold block">
                  Mandatory Assembly Rejection Reason <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={assemblyRejectReason}
                  onChange={(e) => setAssemblyRejectReason(e.target.value)}
                  placeholder="e.g. Ultrasonic brass insert tilt >1°, stripped screw thread"
                  className="w-full py-2 px-3 border border-rose-300 rounded-lg bg-white"
                />
                <span className="text-[10px] text-rose-700 block mt-1">
                  ⚡ Auto-deduction: {assemblyScrapQty * 4}x BOP Inserts &amp; {assemblyScrapQty * 4}x Torx Screws will be minused from ASSEMBLY-STORE.
                </span>
              </div>
            )}

            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900">
              <span className="font-bold">Destination:</span> Passed units will be promoted to <strong>FG-STORE</strong> as complete Finished Good inventory!
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E4E0D6]">
              <button type="button" onClick={() => setAssemblyLot(null)} className="px-4 py-2 text-xs font-bold text-gray-600">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCommitAssembly}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-700 text-white hover:bg-purple-800"
              >
                Complete Assembly &amp; Move to FG
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ISSUE MATERIAL TRANSFER NOTE (MTN) */}
      {/* ========================================================================= */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#E4E0D6] rounded-2xl w-full max-w-lg shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-3">
              <h3 className="text-base font-black text-[#14213D] flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-[#E8622C]" />
                Issue Material Transfer Note (MTN)
              </h3>
              <button type="button" onClick={() => setIsTransferModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#14213D] block mb-1">From Main Store</label>
                  <select
                    value={transferFromStore}
                    onChange={(e) => {
                      const from = e.target.value as MainWarehouseStoreType;
                      setTransferFromStore(from);
                      if (from === 'MAIN-RM-STORE') {
                        setTransferCategory('RM');
                        setTransferToStore('PRD-STORE');
                        setTransferItemCode('RM-PP-CP380');
                      } else if (from === 'MAIN-BOP-STORE') {
                        setTransferCategory('BOP');
                        setTransferToStore('ASSEMBLY-STORE');
                        setTransferItemCode('BOP-INS-M4');
                      } else if (from === 'MAIN-PCK-STORE') {
                        setTransferCategory('PCK');
                        setTransferToStore('PRD-STORE');
                        setTransferItemCode('PCK-BOX-5PLY');
                      } else {
                        setTransferCategory('CON');
                        setTransferToStore('DEFLASH-STORE');
                        setTransferItemCode('CON-BLD-TRI');
                      }
                    }}
                    className="w-full py-2 px-3 border border-[#E4E0D6] rounded-lg bg-white font-mono font-bold"
                  >
                    <option value="MAIN-RM-STORE">MAIN-RM-STORE (Raw Materials)</option>
                    <option value="MAIN-BOP-STORE">MAIN-BOP-STORE (Bought-Out Parts)</option>
                    <option value="MAIN-PCK-STORE">MAIN-PCK-STORE (Packaging)</option>
                    <option value="MAIN-CON-STORE">MAIN-CON-STORE (Consumables)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#14213D] block mb-1">To Operational Store</label>
                  <select
                    value={transferToStore}
                    onChange={(e) => setTransferToStore(e.target.value as OperationalStoreType)}
                    className="w-full py-2 px-3 border border-[#E4E0D6] rounded-lg bg-white font-mono font-bold"
                  >
                    <option value="PRD-STORE">PRD-STORE (Molding Floor)</option>
                    <option value="DEFLASH-STORE">DEFLASH-STORE (Trimming Floor)</option>
                    <option value="ASSEMBLY-STORE">ASSEMBLY-STORE (Assembly Line)</option>
                    <option value="FG-STORE">FG-STORE (Finished Goods Packaging)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#14213D] block mb-1">Select Item to Transfer</label>
                <select
                  value={transferItemCode}
                  onChange={(e) => setTransferItemCode(e.target.value)}
                  className="w-full py-2 px-3 border border-[#E4E0D6] rounded-lg bg-white font-mono"
                >
                  {plantStoreItems
                    .filter((s) => s.plantId === selectedPlant && s.storeCode === transferFromStore)
                    .map((item) => (
                      <option key={item.id} value={item.itemCode}>
                        [{item.itemCode}] {item.itemName} (Available: {item.stockQty} {item.uom})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#14213D] block mb-1">Transfer Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={transferQty}
                    onChange={(e) => setTransferQty(parseFloat(e.target.value) || 0)}
                    className="w-full py-2 px-3 border border-[#E4E0D6] rounded-lg font-mono font-bold text-[#14213D]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#14213D] block mb-1">Linked Work Order #</label>
                  <select
                    value={transferWorkOrderRef}
                    onChange={(e) => setTransferWorkOrderRef(e.target.value)}
                    className="w-full py-2 px-3 border border-[#E4E0D6] rounded-lg bg-white font-mono"
                  >
                    {workOrders.map((wo) => (
                      <option key={wo.id} value={wo.id}>
                        {wo.id} ({wo.item})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#14213D] block mb-1">Transfer Notes</label>
                <input
                  type="text"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="e.g. Scheduled shift requisition for high-speed molding line"
                  className="w-full py-2 px-3 border border-[#E4E0D6] rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E4E0D6]">
              <button type="button" onClick={() => setIsTransferModalOpen(false)} className="px-4 py-2 text-xs font-bold text-gray-600">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteMaterialTransfer}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#E8622C] text-white hover:bg-[#d45320] shadow-xs"
              >
                Confirm Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
