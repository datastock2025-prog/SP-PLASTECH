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
  Sparkles,
  Factory,
  Cpu,
  Check,
  CheckSquare,
  Square,
  Send,
  ListPlus,
  X,
  MoreVertical,
  CalendarDays,
  SlidersHorizontal,
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
  ProductionScheduleCMR,
} from '../../types/stockTransferTypes';
import {
  MASTER_PLANTS,
  MASTER_STORES,
  MASTER_ITEMS_CATALOG,
  MASTER_MOLDS_CATALOG,
  INITIAL_PRODUCTION_CMRS,
  INITIAL_ASSEMBLY_REQUISITIONS,
  INITIAL_DEFLASH_REQUISITIONS,
} from '../../data/stockTransferData';
import { calculatePureRmMassKg } from '../manufacturing/jit/jitCalculations';
import { BomVersionRecipeDeveloperModal } from '../manufacturing/bom/BomVersionRecipeDeveloperModal';
import { BomVersionApprovalGrid } from '../manufacturing/bom/BomVersionApprovalGrid';
import { INITIAL_BOMS } from '../../data/engineeringData';
import { BomMaster, ItemMaster } from '../../types';

interface CreateTransferWizardProps {
  initialType?: TransferType;
  preselectedType?: TransferType;
  preselectedAsset?: AssetMoldItem;
  initialSourceTab?: 'REQUISITIONS' | 'CATALOG' | 'SCHEDULE';
  currentUserRole?: UserRolePerspective;
  onSaveTransfer: (transfer: StockTransferRecord, action?: 'DRAFT' | 'DISPATCH') => void;
  onCancel: () => void;
  showToast: (msg: string) => void;
}

export const CreateTransferWizard: React.FC<CreateTransferWizardProps> = ({
  initialType,
  preselectedType,
  preselectedAsset,
  initialSourceTab = 'SCHEDULE',
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
  const [toStoreId, setToStoreId] = useState<string>('STR-PMP-PRD1');
  const [transferDate, setTransferDate] = useState<string>('2026-09-17');
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

  // Step 3: Source Tabs (Task 5: Requisitions, Catalog, Day-wise Production Schedule)
  const [itemSourceTab, setItemSourceTab] = useState<'REQUISITIONS' | 'CATALOG' | 'SCHEDULE'>(initialSourceTab);
  const [inspectedScheduleRecipe, setInspectedScheduleRecipe] = useState<ProductionScheduleCMR | null>(null);
  const [reqFilterCategory, setReqFilterCategory] = useState<'ALL' | 'CMR' | 'ASSEMBLY' | 'DEFLASH'>('ALL');
  const [selectedReqKeys, setSelectedReqKeys] = useState<Set<string>>(new Set());
  const [inlineReqQuantities, setInlineReqQuantities] = useState<{ [key: string]: number }>({});

  // Task 1, 3 & 4: Row-specific BOM Management, Date Range Selection & Row Checkboxes
  const [bomsList, setBomsList] = useState<BomMaster[]>(INITIAL_BOMS);
  const [isBomDevModalOpen, setIsBomDevModalOpen] = useState<boolean>(false);
  const [isBomApprovalGridOpen, setIsBomApprovalGridOpen] = useState<boolean>(false);
  const [selectedRowForBom, setSelectedRowForBom] = useState<{
    itemCode: string;
    itemName: string;
    bomVersion?: string;
    formulaId?: string;
    cmr?: ProductionScheduleCMR;
  } | null>(null);
  const [bomApprovalFilterItem, setBomApprovalFilterItem] = useState<string | undefined>(undefined);

  // Dynamic schedule CMR state for recipe version overrides (Task 4)
  const [productionCmrs, setProductionCmrs] = useState<ProductionScheduleCMR[]>(INITIAL_PRODUCTION_CMRS);

  // Task 3: Date Range Filter (FROM Date to TO Date) default to last 1 day schedule
  const [dateRangeFrom, setDateRangeFrom] = useState<string>('2026-09-17');
  const [dateRangeTo, setDateRangeTo] = useState<string>('2026-09-17');
  const [scheduleShiftFilter, setScheduleShiftFilter] = useState<string>('ALL');
  const [scheduleStatusFilter, setScheduleStatusFilter] = useState<string>('ALL');
  const [schedulePage, setSchedulePage] = useState<number>(1);
  const [schedulePageSize, setSchedulePageSize] = useState<number>(10);

  // Task 4: Checkbox selection for single / multiple / select all machine schedules
  const [selectedCmrIds, setSelectedCmrIds] = useState<Set<string>>(new Set());

  // Task 3 (Line Grid): Checkbox selection for Transfer Line Items
  const [selectedTransferLineIds, setSelectedTransferLineIds] = useState<Set<string>>(new Set());

  // Task 1: 3-dot dropdown menu active row
  const [activeRowMenuId, setActiveRowMenuId] = useState<string | null>(null);

  // Flattened Available Requisitions & CMR Items (Task 2)
  const availableRequisitionItems = useMemo(() => {
    const list: Array<{
      key: string;
      category: 'CMR' | 'ASSEMBLY' | 'DEFLASH';
      requisitionRef: string;
      scheduleNumber: string;
      finishedGoodSku?: string;
      finishedGoodName?: string;
      itemCode: string;
      itemName: string;
      materialType: MaterialType;
      targetStore: string;
      targetStoreId: string;
      lotNumber: string;
      pickLocation: string;
      requiredQty: number;
      availableStock: number;
      uom: string;
      unitCost: number;
      hsnCode: string;
    }> = [];

    // 1. CMR mixing materials
    productionCmrs.forEach((cmr) => {
      cmr.mixingMaterials.forEach((mat) => {
        list.push({
          key: `cmr-${cmr.id}-${mat.materialSku}`,
          category: 'CMR',
          requisitionRef: cmr.id,
          scheduleNumber: cmr.scheduleNumber,
          finishedGoodSku: cmr.finishedGoodSku,
          finishedGoodName: cmr.finishedGoodName,
          itemCode: mat.materialSku,
          itemName: `${mat.materialName} (for ${cmr.finishedGoodSku})`,
          materialType: 'RM',
          targetStore: cmr.targetProductionStore || 'PRD-UNIT-1',
          targetStoreId: 'STR-PMP-PRD1',
          lotNumber: mat.lotNumber,
          pickLocation: 'WH-RM-SILO-01',
          requiredQty: mat.requiredQtyKg,
          availableStock: 5000,
          uom: mat.uom,
          unitCost: mat.unitCostInr,
          hsnCode: '39021000',
        });
      });
    });

    // 2. Assembly Requisitions
    INITIAL_ASSEMBLY_REQUISITIONS.forEach((asm) => {
      asm.requiredParts.forEach((part) => {
        list.push({
          key: `asm-${asm.id}-${part.sku}`,
          category: 'ASSEMBLY',
          requisitionRef: asm.id,
          scheduleNumber: asm.scheduleNumber,
          finishedGoodSku: asm.finishedGoodSku,
          finishedGoodName: asm.finishedGoodName,
          itemCode: part.sku,
          itemName: `${part.name} (for ${asm.finishedGoodSku})`,
          materialType: 'BOP',
          targetStore: asm.targetLine,
          targetStoreId: 'STR-PMP-ASM',
          lotNumber: part.lot,
          pickLocation: part.storeLocation,
          requiredQty: part.qty,
          availableStock: 1200,
          uom: part.uom,
          unitCost: 14.5,
          hsnCode: '84099900',
        });
      });
    });

    // 3. Deflash Requisitions
    INITIAL_DEFLASH_REQUISITIONS.forEach((dfl) => {
      list.push({
        key: `dfl-${dfl.id}-${dfl.wipItemSku}`,
        category: 'DEFLASH',
        requisitionRef: dfl.id,
        scheduleNumber: dfl.scheduleNumber,
        finishedGoodSku: dfl.wipItemSku,
        finishedGoodName: dfl.wipItemName,
        itemCode: dfl.wipItemSku,
        itemName: `${dfl.wipItemName} (Deflash Stage)`,
        materialType: 'WIP',
        targetStore: dfl.targetBay,
        targetStoreId: 'STR-PMP-DFL',
        lotNumber: 'LOT-WIP-2026-042',
        pickLocation: 'WIP-AREA-STG',
        requiredQty: dfl.qty,
        availableStock: 1500,
        uom: dfl.uom,
        unitCost: 48.0,
        hsnCode: '39269099',
      });
    });

    return list;
  }, []);

  // Filtered Requisitions for Step 3
  const filteredRequisitionItems = useMemo(() => {
    return availableRequisitionItems.filter((item) => {
      const matchCat = reqFilterCategory === 'ALL' || item.category === reqFilterCategory;
      const matchQuery =
        !itemSearchQuery ||
        item.itemCode.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
        item.itemName.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
        item.requisitionRef.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
        item.scheduleNumber.toLowerCase().includes(itemSearchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [availableRequisitionItems, reqFilterCategory, itemSearchQuery]);

  // Toggle Requisition Selection
  const handleToggleReqSelect = (key: string) => {
    setSelectedReqKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Select All Requisitions in current filter
  const handleSelectAllReqs = () => {
    if (selectedReqKeys.size === filteredRequisitionItems.length) {
      setSelectedReqKeys(new Set());
    } else {
      setSelectedReqKeys(new Set(filteredRequisitionItems.map((i) => i.key)));
    }
  };

  // Update inline quantity for a requisition
  const handleInlineReqQtyChange = (key: string, val: number) => {
    setInlineReqQuantities((prev) => ({
      ...prev,
      [key]: Math.max(0, val),
    }));
  };

  // Bulk Add Selected Requisitions to Transfer Lines (Task 2)
  const handleBulkAddRequisitions = () => {
    if (selectedReqKeys.size === 0) {
      showToast('Please select at least one requisition item for bulk transfer.');
      return;
    }

    const itemsToAdd: StockTransferItem[] = [];
    let hasCmr = false;

    availableRequisitionItems.forEach((reqItem) => {
      if (selectedReqKeys.has(reqItem.key)) {
        const qtyToTransfer =
          inlineReqQuantities[reqItem.key] !== undefined
            ? inlineReqQuantities[reqItem.key]
            : reqItem.requiredQty;

        if (qtyToTransfer > 0) {
          if (reqItem.category === 'CMR') hasCmr = true;

          const existingIdx = selectedItems.findIndex(
            (i) => i.id === reqItem.key || (i.itemCode === reqItem.itemCode && i.requisitionRefNumber === reqItem.requisitionRef)
          );

          if (existingIdx === -1) {
            const cleanSku = (reqItem.finishedGoodSku || reqItem.itemCode).replace('FG-', '').replace('RM-', '');
            const dateStr = transferDate.replace(/-/g, '');
            const seq = Math.floor(10 + Math.random() * 90);
            const mixRef = reqItem.category === 'CMR' ? `MIX-${cleanSku}-${dateStr}-${seq}` : undefined;

            itemsToAdd.push({
              id: reqItem.key,
              itemCode: reqItem.itemCode,
              itemName: reqItem.itemName,
              materialType: reqItem.materialType,
              batchLotNumber: reqItem.lotNumber,
              pickLocation: reqItem.pickLocation,
              availableStock: reqItem.availableStock,
              requiredQty: reqItem.requiredQty,
              transferQty: qtyToTransfer,
              uom: reqItem.uom,
              standardCost: reqItem.unitCost,
              hsnCode: reqItem.hsnCode,
              gstRatePct: 18,
              requisitionRefNumber: reqItem.requisitionRef,
              scheduleNumber: reqItem.scheduleNumber,
              mixingRefNumber: mixRef,
              targetStoreCode: reqItem.targetStore,
              netWeightKg: qtyToTransfer,
            });
          }
        }
      }
    });

    if (itemsToAdd.length === 0) {
      showToast('Selected items are already present in line items.');
      return;
    }

    if (hasCmr) {
      setToStoreId('STR-PMP-PRD1');
    }

    setSelectedItems((prev) => [...prev, ...itemsToAdd]);
    showToast(`Bulk added ${itemsToAdd.length} requisition item(s) to transfer lines.`);
  };

  // Day-wise Production Schedules Grouped by Date & Schedule Number (Task 5 & Task 6)
  const dayWiseProductionSchedules = useMemo(() => {
    const groups: Record<
      string,
      {
        date: string;
        scheduleNumber: string;
        cmrs: ProductionScheduleCMR[];
        totalPlannedPcs: number;
        machinesCount: number;
      }
    > = {};

    productionCmrs.forEach((cmr) => {
      const key = `${cmr.scheduleDate}_${cmr.scheduleNumber}`;
      if (!groups[key]) {
        groups[key] = {
          date: cmr.scheduleDate,
          scheduleNumber: cmr.scheduleNumber,
          cmrs: [],
          totalPlannedPcs: 0,
          machinesCount: 0,
        };
      }
      groups[key].cmrs.push(cmr);
      groups[key].totalPlannedPcs += cmr.plannedQty || 0;
    });

    return Object.values(groups)
      .map((g) => ({
        ...g,
        machinesCount: Array.from(new Set(g.cmrs.map((c) => c.machineId))).length,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [productionCmrs]);

  // Admin Batch/LOT override permission state (Task 3)
  const [isAdminLotAccess, setIsAdminLotAccess] = useState<boolean>(true);

  // Helper to generate secondary BOM items (+PCK, +BOP, +CON) based on scheduled item
  const getSecondaryBomItemsForSchedule = (cmr: ProductionScheduleCMR) => {
    const plannedPcs = cmr.plannedQty;
    const sku = cmr.finishedGoodSku;

    return [
      {
        code: sku.includes('CTN') ? 'PK-CTN-021' : sku.includes('BKT') ? 'PK-CTN-045' : 'PK-PAL-WRAP-01',
        name: sku.includes('CTN') ? 'Master 5-Ply Corrugated Carton Box (50 Pcs/Box)' : sku.includes('BKT') ? 'Heavy Duty Outer Carton (20 Pcs)' : 'Heavy Duty Stretch Wrap Film (23 Micron)',
        type: 'Packaging (PCK)',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
        pickLocation: 'WH-PCK-01 (Aisle 3)',
        requiredQty: sku.includes('PAL') ? Math.ceil(plannedPcs / 100) : Math.ceil(plannedPcs / (sku.includes('CTN') ? 50 : 20)),
        uom: sku.includes('PAL') ? 'ROLL' : 'BOX',
        unitCost: sku.includes('PAL') ? 350.0 : 45.0,
        lotNumber: 'LOT-PCK-2026-08',
      },
      {
        code: 'PK-LINER-HD-01',
        name: 'Food Grade LDPE Anti-Dust Liner Bag',
        type: 'Packaging (PCK)',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
        pickLocation: 'WH-PCK-02 (Aisle 1)',
        requiredQty: Math.ceil(plannedPcs / (sku.includes('CTN') ? 50 : 20)),
        uom: 'NOS',
        unitCost: 3.5,
        lotNumber: 'LOT-LNR-2026-14',
      },
      {
        code: sku.includes('BKT') ? 'SP-INS-001' : sku.includes('PAL') ? 'BOP-BRASS-M4-01' : 'BOP-RUB-GASKET-01',
        name: sku.includes('BKT') ? 'Galvanized Steel Bucket Handle with Red Ergonomic Grip' : sku.includes('PAL') ? 'M8 High-Tensile Fastener Kit' : 'Silicone Sealing Ring (Food Contact Grade)',
        type: 'Bought-Out (BOP)',
        badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
        pickLocation: 'WH-BOP-STORE (Shelf B2)',
        requiredQty: sku.includes('PAL') ? plannedPcs * 4 : plannedPcs,
        uom: 'NOS',
        unitCost: sku.includes('BKT') ? 12.0 : sku.includes('PAL') ? 8.5 : 2.2,
        lotNumber: 'LOT-BOP-2026-99',
      },
      {
        code: 'CON-LBL-01',
        name: 'Thermal Barcode & QR Batch Traceability Labels',
        type: 'Consumables (CON)',
        badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
        pickLocation: 'WH-CON-STORE (Shelf A1)',
        requiredQty: plannedPcs,
        uom: 'NOS',
        unitCost: 0.45,
        lotNumber: 'LOT-LBL-2026-01',
      },
    ];
  };

  // 1-Click Release Complete BOM Kit (Pure RM under Formula ID + PCK + BOP + CON) to Shop Floor PRD Store (STR-PMP-PRD1) (Task 1)
  const handleReleaseCompleteKitToPrdStore = (cmr: ProductionScheduleCMR) => {
    const itemsToAdd: StockTransferItem[] = [];

    // 1. Add Pure RM Mixing Lines governed by Formula ID
    cmr.mixingMaterials.forEach((mat) => {
      const cleanItemKey = `frm-rec-${cmr.id}-${mat.materialSku}`;
      const isAlreadyAdded = selectedItems.some(
        (i) => i.id === cleanItemKey || (i.itemCode === mat.materialSku && i.scheduleNumber === cmr.scheduleNumber)
      );

      if (!isAlreadyAdded) {
        itemsToAdd.push({
          id: cleanItemKey,
          itemCode: mat.materialSku,
          itemName: `${mat.materialName} (for ${cmr.finishedGoodSku})`,
          materialType: 'RM',
          batchLotNumber: mat.lotNumber || 'LOT-WH-2026-09',
          pickLocation: 'WH-RM-SILO-01',
          availableStock: 5000,
          requiredQty: mat.requiredQtyKg,
          transferQty: mat.requiredQtyKg,
          uom: mat.uom || 'KG',
          standardCost: mat.unitCostInr || 95.0,
          hsnCode: '39021000',
          gstRatePct: 18,
          formulaId: cmr.formulaId || `FRM-${cmr.finishedGoodSku.replace('FG-', '')}-v1.0`,
          bomVersion: cmr.bomVersion || 'BOM-v1.0',
          requisitionRefNumber: cmr.id,
          scheduleNumber: cmr.scheduleNumber,
          mixingRefNumber: cmr.mixingReferenceNumber,
          targetStoreCode: 'STR-PMP-PRD1',
          netWeightKg: mat.requiredQtyKg,
        });
      }
    });

    // 2. Add Secondary BOM Items (+PCK, +BOP, +CON) linked to item code
    const secondaryItems = getSecondaryBomItemsForSchedule(cmr);
    secondaryItems.forEach((sec) => {
      const cleanSecKey = `bom-sec-${cmr.id}-${sec.code}`;
      const isAlreadyAdded = selectedItems.some(
        (i) => i.id === cleanSecKey || (i.itemCode === sec.code && i.scheduleNumber === cmr.scheduleNumber)
      );

      if (!isAlreadyAdded) {
        itemsToAdd.push({
          id: cleanSecKey,
          itemCode: sec.code,
          itemName: `${sec.name} (for ${cmr.finishedGoodSku})`,
          materialType: (sec.type.includes('PCK') ? 'PCK' : sec.type.includes('BOP') ? 'BOP' : 'CON') as MaterialType,
          batchLotNumber: sec.lotNumber,
          pickLocation: sec.pickLocation,
          availableStock: 5000,
          requiredQty: sec.requiredQty,
          transferQty: sec.requiredQty,
          uom: sec.uom,
          standardCost: sec.unitCost,
          hsnCode: sec.type.includes('PCK') ? '48191000' : '84099900',
          gstRatePct: 18,
          formulaId: cmr.formulaId,
          bomVersion: cmr.bomVersion,
          targetStoreCode: 'STR-PMP-PRD1',
          scheduleNumber: cmr.scheduleNumber,
          lineItemStatus: 'PENDING',
        });
      }
    });

    if (itemsToAdd.length === 0) {
      showToast(`Recipe & Secondary BOM kit for ${cmr.finishedGoodSku} is already staged.`);
    } else {
      setToStoreId('STR-PMP-PRD1');
      setSelectedItems((prev) => [...prev, ...itemsToAdd]);
      showToast(
        `🎉 Staged Complete BOM Kit (${itemsToAdd.length} items: Pure RM + PCK + BOP + CON) for ${cmr.finishedGoodSku} under Formula ${cmr.formulaId || cmr.finishedGoodSku} to PRD Store!`
      );
    }
    setInspectedScheduleRecipe(null);
  };

  // Update Batch/LOT number on transfer item (Admin only) (Task 3)
  const handleUpdateItemBatchLot = (itemId: string, newBatchLot: string) => {
    setSelectedItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, batchLotNumber: newBatchLot } : i))
    );
  };

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
      toStoreId:
        selectedItems.some((i) => i.targetStoreCode === 'PRD-UNIT-1' || i.requisitionRefNumber?.startsWith('CMR'))
          ? 'STR-PMP-PRD1'
          : toStoreId,
      toStoreName:
        selectedItems.some((i) => i.targetStoreCode === 'PRD-UNIT-1' || i.requisitionRefNumber?.startsWith('CMR'))
          ? 'PRD-UNIT-1 (Production Store Unit 1 - Shop Floor Hopper & Mixing Bay)'
          : activeToStore?.name || '',
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
              /* Standard / Requisition Material Item View (Task 2) */
              <div className="space-y-4">
                {/* Item Source Tabs: Schedule Requisitions & CMRs vs Manual Catalog vs Day-wise Production Schedule */}
                <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-2 gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setItemSourceTab('SCHEDULE')}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                        itemSourceTab === 'SCHEDULE'
                          ? 'bg-[#14213D] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Day-wise Production Schedule &amp; Formulas</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-cyan-500/30 text-white font-bold">
                        {dayWiseProductionSchedules.reduce((acc, g) => acc + g.cmrs.length, 0)} Runs
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setItemSourceTab('REQUISITIONS')}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                        itemSourceTab === 'REQUISITIONS'
                          ? 'bg-[#14213D] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <Factory className="w-3.5 h-3.5 text-blue-400" />
                      <span>Requisitions &amp; CMRs</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-blue-500/30 text-white">
                        {availableRequisitionItems.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setItemSourceTab('CATALOG')}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                        itemSourceTab === 'CATALOG'
                          ? 'bg-[#14213D] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Item Master Catalog &amp; Barcode</span>
                    </button>
                  </div>

                  <div className="text-xs text-slate-500 hidden sm:block">
                    Target Store: <strong className="text-cyan-700 font-mono">STR-PMP-PRD1 (Shopfloor PRD Store)</strong>
                  </div>
                </div>

                {/* ================= SUB-VIEW 0: DAY-WISE PRODUCTION SCHEDULE & FORMULA TRANSFERS ================= */}
                {itemSourceTab === 'SCHEDULE' && (() => {
                  // Unique list of schedule dates
                  const uniqueDates = Array.from(new Set(dayWiseProductionSchedules.map((g) => g.date))).sort();

                  // Task 3: Filtered Groups by Date Range (From/To), Shift, Status, and Search Query
                  const filteredScheduleGroups = dayWiseProductionSchedules.filter((grp) => {
                    const matchDate =
                      (!dateRangeFrom || grp.date >= dateRangeFrom) && (!dateRangeTo || grp.date <= dateRangeTo);
                    const matchShift = scheduleShiftFilter === 'ALL' || grp.cmrs.some((c) => c.shift === scheduleShiftFilter);
                    const q = itemSearchQuery.toLowerCase().trim();
                    const matchQuery =
                      !q ||
                      grp.date.toLowerCase().includes(q) ||
                      grp.scheduleNumber.toLowerCase().includes(q) ||
                      grp.cmrs.some(
                        (c) =>
                          c.finishedGoodSku.toLowerCase().includes(q) ||
                          c.finishedGoodName.toLowerCase().includes(q) ||
                          (c.formulaId && c.formulaId.toLowerCase().includes(q)) ||
                          c.machineId.toLowerCase().includes(q)
                      );

                    const matchStatus =
                      scheduleStatusFilter === 'ALL' ||
                      (scheduleStatusFilter === 'STAGED' &&
                        grp.cmrs.every((c) =>
                          selectedItems.some((i) => i.scheduleNumber === c.scheduleNumber && i.formulaId === c.formulaId)
                        )) ||
                      (scheduleStatusFilter === 'WAITING' &&
                        grp.cmrs.some(
                          (c) =>
                            !selectedItems.some((i) => i.scheduleNumber === c.scheduleNumber && i.formulaId === c.formulaId)
                        ));

                    return matchDate && matchShift && matchQuery && matchStatus;
                  });

                  // Task 3: Pending Transfers KPI Calculation
                  const allPendingCmrList = productionCmrs.filter(
                    (c) => !selectedItems.some((i) => i.scheduleNumber === c.scheduleNumber && i.formulaId === c.formulaId)
                  );
                  const pendingSchedulesCount = dayWiseProductionSchedules.filter((grp) =>
                    grp.cmrs.some((c) => !selectedItems.some((i) => i.scheduleNumber === c.scheduleNumber && i.formulaId === c.formulaId))
                  ).length;
                  const pendingMachinesCount = allPendingCmrList.length;

                  // Paginated slice
                  const totalCount = filteredScheduleGroups.length;
                  const totalPages = Math.max(1, Math.ceil(totalCount / schedulePageSize));
                  const validPage = Math.min(schedulePage, totalPages);
                  const startIndex = (validPage - 1) * schedulePageSize;
                  const paginatedGroups = filteredScheduleGroups.slice(startIndex, startIndex + schedulePageSize);

                  // Task 4: Checkbox Selection Handlers
                  const handleToggleCmrSelect = (cmrId: string) => {
                    setSelectedCmrIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(cmrId)) next.delete(cmrId);
                      else next.add(cmrId);
                      return next;
                    });
                  };

                  const handleToggleGroupSelect = (groupCmrs: ProductionScheduleCMR[]) => {
                    const allInGroupSelected = groupCmrs.every((c) => selectedCmrIds.has(c.id));
                    setSelectedCmrIds((prev) => {
                      const next = new Set(prev);
                      if (allInGroupSelected) {
                        groupCmrs.forEach((c) => next.delete(c.id));
                      } else {
                        groupCmrs.forEach((c) => next.add(c.id));
                      }
                      return next;
                    });
                  };

                  const handleToggleAllVisibleSelect = () => {
                    const allVisibleCmrs = paginatedGroups.flatMap((g) => g.cmrs);
                    const allSelected = allVisibleCmrs.every((c) => selectedCmrIds.has(c.id));
                    setSelectedCmrIds((prev) => {
                      const next = new Set(prev);
                      if (allSelected) {
                        allVisibleCmrs.forEach((c) => next.delete(c.id));
                      } else {
                        allVisibleCmrs.forEach((c) => next.add(c.id));
                      }
                      return next;
                    });
                  };

                  // Stage checked machine runs
                  const handleStageSelectedCmrs = () => {
                    if (selectedCmrIds.size === 0) return;
                    let stagedCount = 0;
                    productionCmrs.filter((c) => selectedCmrIds.has(c.id)).forEach((cmr) => {
                      handleReleaseCompleteKitToPrdStore(cmr);
                      stagedCount++;
                    });
                    setSelectedCmrIds(new Set());
                    showToast(`🚀 Successfully staged ${stagedCount} selected machine recipes (Pure RM + PCK + BOP + CON) to Shopfloor PRD Store (STR-PMP-PRD1)!`);
                  };

                  const allVisibleCmrs = paginatedGroups.flatMap((g) => g.cmrs);
                  const isAllVisibleSelected = allVisibleCmrs.length > 0 && allVisibleCmrs.every((c) => selectedCmrIds.has(c.id));
                  const isSomeVisibleSelected = allVisibleCmrs.some((c) => selectedCmrIds.has(c.id));

                  return (
                    <div className="space-y-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-200" onClick={() => setActiveRowMenuId(null)}>
                      {/* Top Header with Task 5 Pending KPI Button and Task 4 Bulk Actions */}
                      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-1">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-cyan-600" />
                              <span>Day-wise Master Production Schedules</span>
                            </h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-100 text-cyan-900 border border-cyan-300">
                              High-Volume 100+ Presses Engine
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Each machine run and item BOM recipe is governed by a unified Formula ID. Formula ID represents <strong className="text-slate-800">pure RM mass (RM + RG + MB)</strong> only.
                          </p>
                        </div>

                        {/* Task 5 Interactive KPI Filter Button & Task 4 Bulk Action */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Task 5: Interactive Pending Transfers Toggle Button */}
                          <button
                            type="button"
                            onClick={() => {
                              if (scheduleStatusFilter === 'WAITING') {
                                setScheduleStatusFilter('ALL');
                                showToast('Showing all production schedules.');
                              } else {
                                setScheduleStatusFilter('WAITING');
                                setSchedulePage(1);
                                showToast(`Filtering to ${pendingSchedulesCount} pending RM transfer schedules.`);
                              }
                            }}
                            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-2xs cursor-pointer transition-all active:scale-95 border ${
                              scheduleStatusFilter === 'WAITING'
                                ? 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-300'
                                : 'bg-amber-50 hover:bg-amber-100/80 text-amber-900 border-amber-300'
                            }`}
                            title="Click to filter pending recipe transfers"
                          >
                            <Clock
                              className={`w-3.5 h-3.5 ${
                                scheduleStatusFilter === 'WAITING' ? 'text-white' : 'text-amber-600'
                              } shrink-0 animate-pulse`}
                            />
                            <span>
                              Pending RM Recipe Transfers:{' '}
                              <strong
                                className={`font-mono underline ${
                                  scheduleStatusFilter === 'WAITING' ? 'text-white' : 'text-amber-950'
                                }`}
                              >
                                {pendingSchedulesCount} Schedules
                              </strong>{' '}
                              ({pendingMachinesCount} IMMs)
                            </span>
                            {scheduleStatusFilter === 'WAITING' && (
                              <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full font-black ml-1">
                                Filtering Active ✕
                              </span>
                            )}
                          </button>

                          {/* Task 4: Bulk Stage Checked CMRs */}
                          {selectedCmrIds.size > 0 && (
                            <button
                              type="button"
                              onClick={handleStageSelectedCmrs}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all active:scale-98 animate-in fade-in"
                              title="Stage all checked machine run recipes to PRD store"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Stage Selected ({selectedCmrIds.size}) to PRD Store</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Scalable Multi-Filter Bar with Task 3 Calendar Date Picker (FROM to TO) */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs text-xs">
                        {/* Search Input */}
                        <div className="md:col-span-3 relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                          <input
                            type="text"
                            placeholder="Search schedule #, formula, SKU..."
                            value={itemSearchQuery}
                            onChange={(e) => {
                              setItemSearchQuery(e.target.value);
                              setSchedulePage(1);
                            }}
                            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-1 focus:ring-cyan-500"
                          />
                        </div>

                        {/* Task 3: Calendar Date Range (FROM to TO) */}
                        <div className="md:col-span-5 flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                          <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-xl px-2 py-1 flex-1">
                            <CalendarDays className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="text-[10px] text-slate-400 font-semibold uppercase">From:</span>
                            <input
                              type="date"
                              value={dateRangeFrom}
                              onChange={(e) => {
                                setDateRangeFrom(e.target.value);
                                setSchedulePage(1);
                              }}
                              className="w-full bg-transparent border-0 p-0 text-xs font-mono font-bold text-slate-800 focus:ring-0"
                            />
                          </div>

                          <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-xl px-2 py-1 flex-1">
                            <span className="text-[10px] text-slate-400 font-semibold uppercase">To:</span>
                            <input
                              type="date"
                              value={dateRangeTo}
                              onChange={(e) => {
                                setDateRangeTo(e.target.value);
                                setSchedulePage(1);
                              }}
                              className="w-full bg-transparent border-0 p-0 text-xs font-mono font-bold text-slate-800 focus:ring-0"
                            />
                          </div>

                          {/* Quick Preset Buttons */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setDateRangeFrom('2026-09-17');
                                setDateRangeTo('2026-09-17');
                                setSchedulePage(1);
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                              title="Show only last 1 day schedule"
                            >
                              Last 1 Day
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDateRangeFrom('');
                                setDateRangeTo('');
                                setSchedulePage(1);
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                              title="Show all available dates"
                            >
                              All
                            </button>
                          </div>
                        </div>

                        {/* Shift Filter */}
                        <div className="md:col-span-2">
                          <select
                            value={scheduleShiftFilter}
                            onChange={(e) => {
                              setScheduleShiftFilter(e.target.value);
                              setSchedulePage(1);
                            }}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs focus:ring-1 focus:ring-cyan-500"
                          >
                            <option value="ALL">All Shifts</option>
                            <option value="Shift A">Shift A (Day)</option>
                            <option value="Shift B">Shift B (Night)</option>
                            <option value="Shift C">Shift C (Graveyard)</option>
                          </select>
                        </div>

                        {/* Status Filter */}
                        <div className="md:col-span-2">
                          <select
                            value={scheduleStatusFilter}
                            onChange={(e) => {
                              setScheduleStatusFilter(e.target.value);
                              setSchedulePage(1);
                            }}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs focus:ring-1 focus:ring-cyan-500"
                          >
                            <option value="ALL">All Statuses</option>
                            <option value="WAITING">Waiting Recipe Transfer</option>
                            <option value="STAGED">Staged in Lines</option>
                          </select>
                        </div>
                      </div>

                      {/* Day-Wise Grouped Schedule Accordions / Cards */}
                      <div className="space-y-3.5">
                        {paginatedGroups.length === 0 ? (
                          <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 text-slate-400">
                            No production schedules found for the selected date range ({dateRangeFrom || 'Any'} to {dateRangeTo || 'Any'}).
                          </div>
                        ) : (
                          paginatedGroups.map((grp) => {
                            const isGroupAllSelected = grp.cmrs.every((c) => selectedCmrIds.has(c.id));
                            const isGroupSomeSelected = grp.cmrs.some((c) => selectedCmrIds.has(c.id));

                            return (
                              <div
                                key={`${grp.date}_${grp.scheduleNumber}`}
                                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs"
                              >
                                {/* Schedule Group Header Banner */}
                                <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                                  <div className="flex items-center gap-3">
                                    {/* Task 4: Schedule Group Checkbox */}
                                    <div
                                      onClick={(e) => e.stopPropagation()}
                                      className="cursor-pointer"
                                      title="Select / Deselect all machines in this schedule"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isGroupAllSelected}
                                        ref={(el) => {
                                          if (el) el.indeterminate = isGroupSomeSelected && !isGroupAllSelected;
                                        }}
                                        onChange={() => handleToggleGroupSelect(grp.cmrs)}
                                        className="w-4 h-4 rounded text-cyan-600 bg-slate-800 border-slate-600 focus:ring-cyan-500 cursor-pointer"
                                      />
                                    </div>

                                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 font-mono text-xs font-black">
                                      <Layers className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-mono text-sm font-black text-cyan-300 tracking-tight">
                                          {grp.scheduleNumber}
                                        </span>
                                        <span className="text-slate-400 text-xs">&bull;</span>
                                        <span className="text-xs font-bold text-slate-200">
                                          Date: {grp.date}
                                        </span>
                                        <span className="px-2 py-0.2 rounded-full text-[10px] font-extrabold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                                          Waiting for Production Recipe Transfer
                                        </span>
                                      </div>
                                      <div className="text-[11px] text-slate-400 mt-0.5">
                                        Target Plant: <strong className="text-slate-200">PLANT-01 (Injection Molding)</strong> &bull; Staging Destination:{' '}
                                        <strong className="text-cyan-300">STR-PMP-PRD1</strong>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-4 text-xs font-mono">
                                    <div className="text-right">
                                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Planned Output</div>
                                      <div className="text-emerald-400 font-bold">{grp.totalPlannedPcs.toLocaleString()} PCS</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Allocated Presses</div>
                                      <div className="text-indigo-300 font-bold">{grp.machinesCount} IMMs</div>
                                    </div>
                                  </div>
                                </div>

                                {/* Scheduled Jobs & Formula IDs Table with Task 4 Checkboxes & Task 1 3-Dot Actions */}
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-600 font-bold border-b border-slate-200">
                                      <tr>
                                        {/* Task 4: Checkbox Column */}
                                        <th className="py-2.5 px-3 w-10 text-center">
                                          <input
                                            type="checkbox"
                                            checked={isGroupAllSelected}
                                            ref={(el) => {
                                              if (el) el.indeterminate = isGroupSomeSelected && !isGroupAllSelected;
                                            }}
                                            onChange={() => handleToggleGroupSelect(grp.cmrs)}
                                            className="w-3.5 h-3.5 rounded text-cyan-600 border-slate-300 focus:ring-cyan-500 cursor-pointer"
                                            title="Select all machines in this schedule"
                                          />
                                        </th>
                                        <th className="py-2.5 px-3">Machine &amp; Bay</th>
                                        <th className="py-2.5 px-3">Scheduled Item &bull; SKU</th>
                                        <th className="py-2.5 px-3 text-right">Target Output</th>
                                        <th className="py-2.5 px-3">Linked Approved BOM</th>
                                        <th className="py-2.5 px-3">Recipe / Formula ID</th>
                                        <th className="py-2.5 px-3 text-right">Pure RM Mass</th>
                                        <th className="py-2.5 px-3 text-right">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {grp.cmrs.map((cmr) => {
                                        const pureRmMass = calculatePureRmMassKg(cmr.mixingMaterials);
                                        const isStaged = selectedItems.some(
                                          (i) => i.scheduleNumber === cmr.scheduleNumber && i.formulaId === cmr.formulaId
                                        );
                                        const isChecked = selectedCmrIds.has(cmr.id);

                                        return (
                                          <tr
                                            key={cmr.id}
                                            className={`transition-colors ${
                                              isChecked ? 'bg-cyan-50/60' : 'hover:bg-slate-50/60'
                                            }`}
                                          >
                                            {/* Task 4: Individual Row Checkbox */}
                                            <td className="py-3 px-3 text-center">
                                              <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => handleToggleCmrSelect(cmr.id)}
                                                className="w-3.5 h-3.5 rounded text-cyan-600 border-slate-300 focus:ring-cyan-500 cursor-pointer"
                                              />
                                            </td>

                                            <td className="py-3 px-3">
                                              <div className="font-mono font-bold text-slate-900">{cmr.machineId}</div>
                                              <div className="text-[10px] text-slate-500">{cmr.machineBay}</div>
                                              <div className="text-[10px] text-indigo-700 font-semibold">{cmr.shift}</div>
                                            </td>

                                            <td className="py-3 px-3">
                                              <div className="font-bold text-slate-900 text-xs">{cmr.finishedGoodName}</div>
                                              <div className="font-mono text-[11px] text-slate-500">{cmr.finishedGoodSku}</div>
                                              {cmr.mixingReferenceNumber && (
                                                <div className="font-mono text-[9px] text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200 inline-block mt-0.5">
                                                  {cmr.mixingReferenceNumber}
                                                </div>
                                              )}
                                            </td>

                                            <td className="py-3 px-3 text-right">
                                              <div className="font-mono font-black text-emerald-700 text-sm">
                                                {cmr.plannedQty.toLocaleString()}{' '}
                                                <span className="text-[10px] font-normal text-slate-500">{cmr.uom}</span>
                                              </div>
                                            </td>

                                            <td className="py-3 px-3">
                                              <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 inline-flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                <span>{cmr.bomVersion}</span>
                                              </span>
                                            </td>

                                            <td className="py-3 px-3">
                                              <button
                                                type="button"
                                                onClick={() => setInspectedScheduleRecipe(cmr)}
                                                className="px-2.5 py-1 rounded-lg font-mono text-xs font-black bg-cyan-100 hover:bg-cyan-200 text-cyan-950 border border-cyan-300 transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs group"
                                                title="Click to view consolidated RM recipe and release to PRD store"
                                              >
                                                <Sparkles className="w-3 h-3 text-cyan-700 group-hover:scale-110 transition-transform" />
                                                <span>{cmr.formulaId || `FRM-${cmr.finishedGoodSku.slice(3, 8)}-v1.0`}</span>
                                              </button>
                                            </td>

                                            <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                                              {pureRmMass.toFixed(1)} <span className="text-[10px] font-normal text-slate-500">KG</span>
                                            </td>

                                            {/* Task 1: Actions with Row-Level 3-Dots Menu */}
                                            <td className="py-3 px-3 text-right relative">
                                              <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                  type="button"
                                                  onClick={() => setInspectedScheduleRecipe(cmr)}
                                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-bold text-[11px] transition-colors cursor-pointer"
                                                  title="Inspect pure RM and secondary BOM breakdown"
                                                >
                                                  Recipe
                                                </button>

                                                <button
                                                  type="button"
                                                  onClick={() => handleReleaseCompleteKitToPrdStore(cmr)}
                                                  className={`px-3 py-1 rounded-md font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1 shadow-2xs ${
                                                    isStaged
                                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                                      : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                                                  }`}
                                                  title="Stage complete recipe kit (Pure RM + PCK + BOP + CON) to Shopfloor PRD Store"
                                                >
                                                  {isStaged ? (
                                                    <>
                                                      <Check className="w-3 h-3 text-emerald-700" />
                                                      <span>Staged in Lines</span>
                                                    </>
                                                  ) : (
                                                    <>
                                                      <Send className="w-3 h-3" />
                                                      <span>Stage to PRD Store</span>
                                                    </>
                                                  )}
                                                </button>

                                                {/* Task 1: 3-Dots Row Action Button */}
                                                <div className="relative">
                                                  <button
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setActiveRowMenuId(activeRowMenuId === cmr.id ? null : cmr.id);
                                                    }}
                                                    className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
                                                    title="More BOM & Recipe Actions"
                                                  >
                                                    <MoreVertical className="w-4 h-4" />
                                                  </button>

                                                  {/* Floating 3-Dot Menu */}
                                                  {activeRowMenuId === cmr.id && (
                                                    <div
                                                      className="absolute right-0 top-full mt-1 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-left animate-in fade-in zoom-in-95 duration-100"
                                                      onClick={(e) => e.stopPropagation()}
                                                    >
                                                      <div className="px-3 py-1.5 border-b border-slate-100">
                                                        <div className="text-[10px] font-bold uppercase text-slate-400">BOM Engineering & Lab</div>
                                                        <div className="font-bold text-slate-800 text-xs truncate">{cmr.finishedGoodSku}</div>
                                                      </div>

                                                      <button
                                                        type="button"
                                                        onClick={() => {
                                                          setActiveRowMenuId(null);
                                                          setSelectedRowForBom({
                                                            itemCode: cmr.finishedGoodSku,
                                                            itemName: cmr.finishedGoodName,
                                                            bomVersion: cmr.bomVersion,
                                                            formulaId: cmr.formulaId,
                                                            cmr: cmr,
                                                          });
                                                          setIsBomDevModalOpen(true);
                                                        }}
                                                        className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-cyan-50 hover:text-cyan-900 flex items-center gap-2 transition-colors cursor-pointer"
                                                      >
                                                        <Plus className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                                                        <div>
                                                          <div className="font-bold">Develop New BOM Version</div>
                                                          <div className="text-[10px] text-slate-400 font-normal">Auto-fills item &amp; recipe, creates formula ID</div>
                                                        </div>
                                                      </button>

                                                      <button
                                                        type="button"
                                                        onClick={() => {
                                                          setActiveRowMenuId(null);
                                                          setBomApprovalFilterItem(cmr.finishedGoodSku);
                                                          setIsBomApprovalGridOpen(true);
                                                        }}
                                                        className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-900 flex items-center gap-2 transition-colors cursor-pointer"
                                                      >
                                                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                                        <div>
                                                          <div className="font-bold">BOM Version Approvals</div>
                                                          <div className="text-[10px] text-slate-400 font-normal">View approval workflow for {cmr.finishedGoodSku}</div>
                                                        </div>
                                                      </button>
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Pagination Bar for Heavy Volume 100+ Machine Schedules */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 text-xs">
                          <div className="text-slate-500">
                            Showing <strong className="text-slate-800">{startIndex + 1}</strong> &ndash;{' '}
                            <strong className="text-slate-800">
                              {Math.min(startIndex + schedulePageSize, totalCount)}
                            </strong>{' '}
                            of <strong className="text-slate-800">{totalCount}</strong> day-wise schedule groups
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSchedulePage((p) => Math.max(1, p - 1))}
                              disabled={validPage <= 1}
                              className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold transition-colors cursor-pointer"
                            >
                              Previous
                            </button>
                            <span className="font-bold text-slate-800">
                              Page {validPage} of {totalPages}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSchedulePage((p) => Math.min(totalPages, p + 1))}
                              disabled={validPage >= totalPages}
                              className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold transition-colors cursor-pointer"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}


                {/* ================= SUB-VIEW A: REQUISITIONS & CMRs ================= */}
                {itemSourceTab === 'REQUISITIONS' && (
                  <div className="space-y-3 bg-slate-50/50 p-3.5 rounded-2xl border border-slate-200">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                      {/* Category Filter Pills */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
                        <span className="text-[11px] font-bold text-slate-500 mr-1">Filter:</span>
                        {[
                          { id: 'ALL', label: 'All Requests' },
                          { id: 'CMR', label: 'Production CMRs (PRD-UNIT-1)' },
                          { id: 'ASSEMBLY', label: 'Assembly Requisitions' },
                          { id: 'DEFLASH', label: 'Deflash Requisitions' },
                        ].map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setReqFilterCategory(cat.id as any)}
                            className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition whitespace-nowrap ${
                              reqFilterCategory === cat.id
                                ? 'bg-blue-600 text-white shadow-2xs'
                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>

                      {/* Search */}
                      <div className="relative w-full md:w-64">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          placeholder="Search requisition, SKU, schedule..."
                          value={itemSearchQuery}
                          onChange={(e) => setItemSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Requisitions Grid with Inline Editable Transfer Quantities */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                      <div className="overflow-x-auto w-full">
                        <table className="w-full text-left text-xs min-w-[850px]">
                        <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 text-[11px]">
                          <tr>
                            <th className="py-2.5 px-3 text-center w-10">
                              <input
                                type="checkbox"
                                aria-label="Select All Requisitions"
                                checked={
                                  filteredRequisitionItems.length > 0 &&
                                  selectedReqKeys.size === filteredRequisitionItems.length
                                }
                                onChange={handleSelectAllReqs}
                                className="rounded text-blue-600 focus:ring-blue-500"
                              />
                            </th>
                            <th className="py-2.5 px-3">Item Code &amp; Description</th>
                            <th className="py-2.5 px-3">Requisition &bull; Schedule</th>
                            <th className="py-2.5 px-3">Type</th>
                            <th className="py-2.5 px-3">Target Store</th>
                            <th className="py-2.5 px-3 font-mono">Lot #</th>
                            <th className="py-2.5 px-3 text-right">Required</th>
                            <th className="py-2.5 px-3 text-right">Avail. Stock</th>
                            <th className="py-2.5 px-3 text-right w-36">Transfer Qty (Inline)</th>
                            <th className="py-2.5 px-3 text-center">Quick Fill</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredRequisitionItems.length === 0 ? (
                            <tr>
                              <td colSpan={10} className="py-8 text-center text-slate-400">
                                No pending requisitions found matching your filter.
                              </td>
                            </tr>
                          ) : (
                            filteredRequisitionItems.map((reqItem) => {
                              const isSelected = selectedReqKeys.has(reqItem.key);
                              const currentQty =
                                inlineReqQuantities[reqItem.key] !== undefined
                                  ? inlineReqQuantities[reqItem.key]
                                  : reqItem.requiredQty;

                              return (
                                <tr
                                  key={reqItem.key}
                                  className={`transition-colors ${
                                    isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50/70'
                                  }`}
                                >
                                  <td className="py-2 px-3 text-center">
                                    <input
                                      type="checkbox"
                                      aria-label={`Select ${reqItem.itemCode} from ${reqItem.requisitionRef}`}
                                      checked={isSelected}
                                      onChange={() => handleToggleReqSelect(reqItem.key)}
                                      className="rounded text-blue-600 focus:ring-blue-500"
                                    />
                                  </td>
                                  <td className="py-2 px-3">
                                    <div className="font-mono font-bold text-slate-900">{reqItem.itemCode}</div>
                                    <div className="text-[11px] text-slate-600 truncate max-w-xs">{reqItem.itemName}</div>
                                  </td>
                                  <td className="py-2 px-3">
                                    <div className="font-mono font-bold text-blue-700">{reqItem.requisitionRef}</div>
                                    <div className="text-[10px] text-slate-500">SCH: {reqItem.scheduleNumber}</div>
                                  </td>
                                  <td className="py-2 px-3">
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                        reqItem.materialType === 'RM'
                                          ? 'bg-blue-100 text-blue-800'
                                          : reqItem.materialType === 'BOP'
                                          ? 'bg-purple-100 text-purple-800'
                                          : 'bg-orange-100 text-orange-800'
                                      }`}
                                    >
                                      {reqItem.materialType}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-[11px] font-semibold text-blue-700">
                                    {reqItem.targetStore}
                                  </td>
                                  <td className="py-2 px-3 font-mono text-[11px] text-teal-700">
                                    {reqItem.lotNumber}
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                                    {reqItem.requiredQty.toFixed(1)} {reqItem.uom}
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono text-slate-600">
                                    {reqItem.availableStock.toLocaleString()} {reqItem.uom}
                                  </td>
                                  <td className="py-2 px-3 text-right">
                                    <input
                                      type="number"
                                      min={0}
                                      max={reqItem.availableStock}
                                      value={currentQty}
                                      onChange={(e) =>
                                        handleInlineReqQtyChange(reqItem.key, parseFloat(e.target.value) || 0)
                                      }
                                      className="w-28 text-right bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono font-bold text-slate-900 focus:ring-1 focus:ring-blue-500"
                                    />
                                  </td>
                                  <td className="py-2 px-3 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleInlineReqQtyChange(reqItem.key, reqItem.requiredQty)}
                                        className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded"
                                        title="Fill Required Quantity"
                                      >
                                        Req
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleInlineReqQtyChange(reqItem.key, reqItem.availableStock)}
                                        className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded"
                                        title="Fill Maximum Available Stock"
                                      >
                                        Max
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
                  </div>

                    {/* Bulk Transfer Action Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
                      <div className="text-xs text-slate-600">
                        <strong className="text-blue-700">{selectedReqKeys.size}</strong> item(s) selected for bulk transfer
                      </div>

                      <button
                        type="button"
                        onClick={handleBulkAddRequisitions}
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                      >
                        <ListPlus className="w-4 h-4" />
                        <span>Bulk Add Selected Items to Transfer Lines</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* ================= SUB-VIEW B: MANUAL CATALOG & BARCODE ================= */}
                {itemSourceTab === 'CATALOG' && (
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
                  </div>
                )}

                {/* Task 3: Selected Transfer Lines Table with Multiple Selection Checkboxes & Admin LOT Override */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                  <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-800">
                        Transfer Line Items ({selectedItems.length})
                      </span>
                      <span className="text-[11px] text-slate-500">
                        (Ready for dispatch to requested store)
                      </span>
                      
                      {/* Task 3: Admin Batch/LOT Access Indicator & Toggle */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsAdminLotAccess(!isAdminLotAccess);
                          showToast(isAdminLotAccess ? '🔒 Batch/LOT override locked to Read-Only mode.' : '🔓 Admin Batch/LOT override access granted! LOT numbers can now be modified.');
                        }}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-black border transition-all cursor-pointer flex items-center gap-1 shadow-2xs ${
                          isAdminLotAccess
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
                            : 'bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-300'
                        }`}
                        title="Click to toggle Admin Batch/LOT number editing permissions"
                      >
                        {isAdminLotAccess ? (
                          <>
                            <ShieldCheck className="w-3 h-3 text-emerald-700" />
                            <span>Admin LOT Edit: Active</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3 text-slate-500" />
                            <span>LOT Locked (Admin Only)</span>
                          </>
                        )}
                      </button>

                      {selectedTransferLineIds.size > 0 && (
                        <div className="flex items-center gap-1.5 ml-2">
                          <span className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-800 font-bold text-[11px] border border-blue-200">
                            {selectedTransferLineIds.size} Selected
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedItems((prev) => prev.filter((i) => !selectedTransferLineIds.has(i.id)));
                              setSelectedTransferLineIds(new Set());
                              showToast(`🗑️ Removed ${selectedTransferLineIds.size} selected transfer lines.`);
                            }}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove Selected ({selectedTransferLineIds.size})</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedTransferLineIds(new Set())}
                            className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">
                      Total Weight:{' '}
                      <strong className="text-slate-800">
                        {selectedItems.reduce((acc, i) => acc + (i.transferQty * 1), 0).toFixed(1)} KG
                      </strong>
                    </span>
                  </div>

                  {/* Table with responsive horizontal scroll and proper column fitting */}
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left text-xs min-w-[960px]">
                      <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                        <tr>
                          {/* Task 3: Select All Checkbox Header */}
                          <th className="py-2.5 px-2 w-9 text-center">
                            <input
                              type="checkbox"
                              checked={selectedItems.length > 0 && selectedItems.every((i) => selectedTransferLineIds.has(i.id))}
                              ref={(el) => {
                                if (el) {
                                  const all = selectedItems.length > 0 && selectedItems.every((i) => selectedTransferLineIds.has(i.id));
                                  const some = selectedItems.some((i) => selectedTransferLineIds.has(i.id));
                                  el.indeterminate = some && !all;
                                }
                              }}
                              onChange={() => {
                                if (selectedItems.every((i) => selectedTransferLineIds.has(i.id))) {
                                  setSelectedTransferLineIds(new Set());
                                } else {
                                  setSelectedTransferLineIds(new Set(selectedItems.map((i) => i.id)));
                                }
                              }}
                              className="w-3.5 h-3.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                              title="Select all transfer lines"
                            />
                          </th>
                          <th className="py-2.5 px-2.5 font-bold min-w-[170px]">Item Code &amp; Description</th>
                          <th className="py-2.5 px-2 font-bold min-w-[130px]">Requisition &bull; Mix Ref</th>
                          <th className="py-2.5 px-2 font-bold text-center w-12">Type</th>
                          <th className="py-2.5 px-2 font-bold min-w-[145px]">Batch / Lot #</th>
                          <th className="py-2.5 px-2 font-bold min-w-[100px]">Pick Bin</th>
                          <th className="py-2.5 px-2 font-bold text-right min-w-[75px]">Avail. Qty</th>
                          <th className="py-2.5 px-2 font-bold text-right min-w-[90px]">Transfer Qty</th>
                          <th className="py-2.5 px-2 font-bold w-12">UOM</th>
                          <th className="py-2.5 px-2 font-bold text-right min-w-[85px]">Standard Cost</th>
                          <th className="py-2.5 px-2.5 font-bold text-right min-w-[90px]">Total (₹)</th>
                          <th className="py-2.5 px-2 font-bold text-center w-14 sticky right-0 bg-slate-50 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] md:shadow-none md:static">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {selectedItems.length === 0 ? (
                          <tr>
                            <td colSpan={12} className="py-8 text-center text-slate-400">
                              No items added yet. Select pending requisitions above or click catalog items.
                            </td>
                          </tr>
                        ) : (
                          selectedItems.map((item) => {
                            const isChecked = selectedTransferLineIds.has(item.id);
                            return (
                              <tr key={item.id} className={`transition-colors ${isChecked ? 'bg-blue-50/50' : 'hover:bg-slate-50/70'}`}>
                                {/* Task 3: Row Checkbox */}
                                <td className="py-2 px-2 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      setSelectedTransferLineIds((prev) => {
                                        const next = new Set(prev);
                                        if (next.has(item.id)) next.delete(item.id);
                                        else next.add(item.id);
                                        return next;
                                      });
                                    }}
                                    className="w-3.5 h-3.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                                  />
                                </td>

                                <td className="py-2 px-2.5">
                                  <div className="font-mono font-bold text-blue-700">{item.itemCode}</div>
                                  <div className="text-[11px] text-slate-600 truncate max-w-[200px]" title={item.itemName}>{item.itemName}</div>
                                  {item.formulaId && (
                                    <span className="font-mono text-[9px] font-black text-cyan-800 bg-cyan-100 px-1.5 py-0.2 rounded border border-cyan-300 inline-block mt-0.5">
                                      FRM: {item.formulaId}
                                    </span>
                                  )}
                                </td>

                                <td className="py-2 px-2">
                                  {item.requisitionRefNumber ? (
                                    <div>
                                      <div className="font-mono font-bold text-blue-700 text-[11px]">
                                        {item.requisitionRefNumber}
                                      </div>
                                      {item.mixingRefNumber && (
                                        <div className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 inline-block">
                                          {item.mixingRefNumber}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 text-[11px] italic">Ad-hoc Issue</span>
                                  )}
                                </td>

                                <td className="py-2 px-2 text-center">
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                                    {item.materialType}
                                  </span>
                                </td>

                                <td className="py-2 px-2">
                                  {isAdminLotAccess ? (
                                    <input
                                      type="text"
                                      value={item.batchLotNumber || ''}
                                      onChange={(e) => handleUpdateItemBatchLot(item.id, e.target.value)}
                                      className="w-32 px-2 py-1 bg-white border border-teal-300 rounded font-mono text-[11px] font-bold text-teal-900 focus:ring-1 focus:ring-teal-500 shadow-2xs"
                                      placeholder="LOT #"
                                      title="Admin authorized: Edit Batch/LOT number"
                                    />
                                  ) : (
                                    <div className="flex items-center gap-1 font-mono text-[11px] text-teal-700">
                                      <Lock className="w-3 h-3 text-slate-400" />
                                      <span>{item.batchLotNumber}</span>
                                    </div>
                                  )}
                                </td>

                                <td className="py-2 px-2 text-[11px] text-slate-600 font-mono">
                                  {item.pickLocation}
                                </td>

                                <td className="py-2 px-2 text-right font-medium text-slate-600">
                                  {item.availableStock.toLocaleString()}
                                </td>

                                <td className="py-2 px-2 text-right">
                                  <input
                                    type="number"
                                    min={1}
                                    max={item.availableStock}
                                    value={item.transferQty}
                                    onChange={(e) =>
                                      handleUpdateItemQty(item.id, parseFloat(e.target.value) || 0)
                                    }
                                    className="w-20 text-right bg-white border border-slate-300 rounded px-1.5 py-1 text-xs font-bold text-slate-900 focus:ring-1 focus:ring-blue-500"
                                  />
                                </td>

                                <td className="py-2 px-2 font-semibold text-slate-700">{item.uom}</td>

                                <td className="py-2 px-2 text-right font-mono text-slate-600">
                                  ₹{item.standardCost.toFixed(2)}
                                </td>

                                <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-900">
                                  ₹{(item.transferQty * item.standardCost).toLocaleString('en-IN')}
                                </td>

                                <td className="py-2 px-2 text-center sticky right-0 bg-white/95 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] md:shadow-none md:static">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItem(item.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                    title="Remove transfer line item"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
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

      {/* Task 2: Consolidated Recipe Material Requirements Modal (Pure RM + PCK + BOP + CON Breakdown) */}
      {inspectedScheduleRecipe && (() => {
        const plannedPcs = inspectedScheduleRecipe.plannedQty;
        const sku = inspectedScheduleRecipe.finishedGoodSku;

        // Task 2: Secondary Packaging (PCK), Bought-Out Parts (BOP) & Consumables (CON) based on BOM
        const secondaryBomItems = getSecondaryBomItemsForSchedule(inspectedScheduleRecipe);

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh]">
              {/* Header */}
              <div className="p-5 bg-gradient-to-r from-[#14213D] via-[#1E293B] to-[#0F8B8D] text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-cyan-300 border border-white/20">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-black bg-cyan-400/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-400/30">
                        Formula: {inspectedScheduleRecipe.formulaId || `FRM-${inspectedScheduleRecipe.finishedGoodSku}-v1.0`}
                      </span>
                      <span className="text-slate-400 text-xs">&bull;</span>
                      <span className="font-mono text-xs text-slate-300">{inspectedScheduleRecipe.scheduleNumber}</span>
                      <span className="text-slate-400 text-xs">&bull;</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        BOM Version: {inspectedScheduleRecipe.bomVersion}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-white mt-0.5">
                      Exploded BOM Recipe &amp; Pure RM Formulation Breakdown
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectedScheduleRecipe(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content Cockpit */}
              <div className="p-5 space-y-4 overflow-y-auto text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Target Item / SKU</span>
                    <div className="font-bold text-slate-900 text-xs truncate" title={inspectedScheduleRecipe.finishedGoodName}>
                      {inspectedScheduleRecipe.finishedGoodName}
                    </div>
                    <div className="font-mono text-[10px] text-slate-500">{inspectedScheduleRecipe.finishedGoodSku}</div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Machine &amp; Schedule Date</span>
                    <div className="font-bold text-slate-900 text-xs">
                      {inspectedScheduleRecipe.machineId} &bull; {inspectedScheduleRecipe.shift}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">Date: {inspectedScheduleRecipe.scheduleDate}</div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Batch Target &amp; Store</span>
                    <div className="font-mono font-bold text-emerald-700 text-xs">
                      {inspectedScheduleRecipe.plannedQty.toLocaleString()} {inspectedScheduleRecipe.uom}
                    </div>
                    <div className="text-[10px] font-mono text-cyan-700 font-bold">
                      To: {inspectedScheduleRecipe.targetProductionStore || 'STR-PMP-PRD1'}
                    </div>
                  </div>
                </div>

                {/* Section 1: Pure Polymer RM Formulation (Governed strictly by Formula ID) */}
                <div className="border border-cyan-200 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="bg-gradient-to-r from-cyan-900 to-slate-900 text-white px-3.5 py-2.5 font-bold text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>1. Pure Polymer RM Formulation (Governed by Formula ID: {inspectedScheduleRecipe.formulaId})</span>
                    </div>
                    <span className="text-cyan-300 font-mono text-[11px] font-bold">
                      Source: STR-PMP-RM (WH-RM-SILO-01)
                    </span>
                  </div>
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3">Material SKU &amp; Name</th>
                        <th className="py-2.5 px-3">RM Category</th>
                        <th className="py-2.5 px-3 font-mono">Lot #</th>
                        <th className="py-2.5 px-3 text-right">Required Qty</th>
                        <th className="py-2.5 px-3 text-right">Warehouse Avail.</th>
                        <th className="py-2.5 px-3 text-right">Unit Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {inspectedScheduleRecipe.mixingMaterials.map((mat) => (
                        <tr key={mat.materialSku} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3">
                            <div className="font-mono font-bold text-slate-900">{mat.materialSku}</div>
                            <div className="text-[11px] text-slate-600">{mat.materialName}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                mat.materialType === 'Raw Polymer'
                                  ? 'bg-blue-100 text-blue-800'
                                  : mat.materialType === 'Masterbatch'
                                  ? 'bg-cyan-100 text-cyan-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {mat.materialType}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-teal-700 text-[11px]">{mat.lotNumber}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            {mat.requiredQtyKg.toFixed(1)} {mat.uom}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600">5,000 {mat.uom}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600">₹{mat.unitCostInr.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {/* Pure RM Banner */}
                  <div className="bg-cyan-50/80 border-t border-cyan-200 px-3.5 py-2 flex items-center justify-between text-xs text-cyan-950 font-medium">
                    <span>
                      Formula ID represents <strong className="font-bold text-cyan-900">pure RM mass only (Resin + Regrind + Masterbatch)</strong> for automated hopper feeding.
                    </span>
                    <span className="font-mono font-extrabold text-cyan-900 shrink-0 text-sm">
                      Pure RM Total: {calculatePureRmMassKg(inspectedScheduleRecipe.mixingMaterials).toFixed(1)} KG
                    </span>
                  </div>
                </div>

                {/* Section 2: Secondary Packaging (+PCK), Hardware (+BOP) & Consumables (+CON) BOM Requirements */}
                <div className="border border-amber-200 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="bg-gradient-to-r from-slate-800 to-amber-950 text-white px-3.5 py-2.5 font-bold text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-amber-400" />
                      <span>2. Secondary BOM Requirements: Packaging (+PCK), Hardware (+BOP) &amp; Consumables (+CON)</span>
                    </div>
                    <span className="text-amber-300 font-mono text-[11px] font-bold">
                      Kit Requirements for {inspectedScheduleRecipe.plannedQty.toLocaleString()} PCS
                    </span>
                  </div>
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3">Item SKU &amp; Name</th>
                        <th className="py-2.5 px-3">BOM Category</th>
                        <th className="py-2.5 px-3">Pick Location</th>
                        <th className="py-2.5 px-3 text-right">Required Qty</th>
                        <th className="py-2.5 px-3 text-right">Est. Unit Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {secondaryBomItems.map((sec) => (
                        <tr key={sec.code} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3">
                            <div className="font-mono font-bold text-slate-900">{sec.code}</div>
                            <div className="text-[11px] text-slate-600">{sec.name}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${sec.badgeClass}`}>
                              {sec.type}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">{sec.pickLocation}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            {sec.requiredQty.toLocaleString()} {sec.uom}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600">₹{sec.unitCost.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={() => setInspectedScheduleRecipe(null)}
                  className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>

                {/* Task 2: Single Unified Staging Button for both Pure RM (Formula ID) and Secondary BOM (PCK/BOP/CON) */}
                <button
                  type="button"
                  onClick={() => handleReleaseCompleteKitToPrdStore(inspectedScheduleRecipe)}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 hover:from-emerald-500 hover:to-cyan-600 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-98"
                  title="Stage Pure RM (Formula ID) and Secondary Items (PCK/BOP/CON) to Shopfloor PRD Store"
                >
                  <Send className="w-4 h-4 text-emerald-200" />
                  <span>Stage Recipe &amp; BOM Materials to PRD Store</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Task 1: BOM Version Recipe Developer Modal (Pre-populated from machine row) */}
      {isBomDevModalOpen && (
        <BomVersionRecipeDeveloperModal
          isOpen={isBomDevModalOpen}
          onClose={() => {
            setIsBomDevModalOpen(false);
            setSelectedRowForBom(null);
          }}
          items={MASTER_ITEMS_CATALOG as any}
          initialItemCode={selectedRowForBom?.itemCode}
          initialItemName={selectedRowForBom?.itemName}
          initialBom={bomsList.find((b) => b.parent === selectedRowForBom?.itemCode) || null}
          onSubmitForApproval={(newBom, formulaId) => {
            setBomsList((prev) => [newBom, ...prev]);
            showToast(`🚀 BOM Recipe Version "${newBom.version}" (${formulaId}) submitted to Approval Grid for ${newBom.parent}!`);
          }}
          showToast={showToast}
        />
      )}

      {/* Task 4: BOM Version Approval Grid Modal (Pre-filtered for specific item from machine row with schedule override) */}
      {isBomApprovalGridOpen && (
        <BomVersionApprovalGrid
          isOpen={isBomApprovalGridOpen}
          onClose={() => {
            setIsBomApprovalGridOpen(false);
            setBomApprovalFilterItem(undefined);
          }}
          boms={bomsList}
          items={MASTER_ITEMS_CATALOG as any}
          initialItemFilter={bomApprovalFilterItem}
          onApproveBom={(bomId) => {
            setBomsList((prev) =>
              prev.map((b) => (b.id === bomId ? { ...b, status: 'approved' } : b))
            );
            showToast(`✅ BOM ${bomId} approved! New BOM version is now ready for production schedules.`);
          }}
          onApplyVersionToSchedule={(bom, formulaId) => {
            if (selectedRowForBom?.cmr) {
              const targetCmrId = selectedRowForBom.cmr.id;
              setProductionCmrs((prev) =>
                prev.map((c) =>
                  c.id === targetCmrId
                    ? {
                        ...c,
                        bomVersion: bom.version,
                        formulaId: formulaId,
                      }
                    : c
                )
              );

              const updatedCmr = {
                ...selectedRowForBom.cmr,
                bomVersion: bom.version,
                formulaId: formulaId,
              };
              handleReleaseCompleteKitToPrdStore(updatedCmr);
              showToast(`🚀 Overrode machine ${selectedRowForBom.cmr.machineId} with BOM Version "${bom.version}" (${formulaId}) & staged materials!`);
            }
          }}
          onStageToPrdStore={(bom, formula) => {
            // Stage approved recipe to PRD Store (STR-PMP-PRD1)
            const itemsToAdd: StockTransferItem[] = (bom.lines || []).map((l, idx) => ({
              id: `bom-rec-${bom.id}-${l.item}-${idx}`,
              itemCode: l.item,
              itemName: `${l.name || l.item} (Recipe for ${bom.parent})`,
              materialType: 'RM',
              batchLotNumber: `LOT-${l.item.slice(0, 6)}-2026`,
              pickLocation: 'WH-RM-SILO-01',
              availableStock: 5000,
              requiredQty: (Number(l.qty) || 0.05) * 1000,
              transferQty: (Number(l.qty) || 0.05) * 1000,
              uom: l.uom || 'KG',
              standardCost: l.cost || 95.0,
              hsnCode: '39021000',
              gstRatePct: 18,
              formulaId: formula,
              bomVersion: bom.version,
              targetStoreCode: 'PRD-UNIT-1',
              netWeightKg: (Number(l.qty) || 0.05) * 1000,
            }));

            setToStoreId('STR-PMP-PRD1');
            setSelectedItems((prev) => [...prev, ...itemsToAdd]);
            showToast(`🎉 Staged ${itemsToAdd.length} recipe items for Formula ${formula} into PRD Store!`);
          }}
          onCreateNewBom={(newBom) => {
            setBomsList((prev) => [newBom, ...prev]);
          }}
          showToast={showToast}
        />
      )}
    </div>
  );
};

