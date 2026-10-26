import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ItemMaster,
  BomMaster,
  BomLine,
  MachineMaster,
  ApprovalStatus,
  ItemType,
  AuthUser,
} from '@/src/types';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Clock,
  Printer,
  Copy,
  ArrowLeft,
  FileSpreadsheet,
  Check,
  CheckSquare,
  Square,
  Sparkles,
  X,
  ThumbsUp,
  ThumbsDown,
  Layers,
  History,
  ShieldCheck,
  Lock,
  Unlock,
  Settings,
  Box,
  Sliders,
  FileText,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  Download,
  Upload,
  Paperclip,
  ExternalLink,
  Activity,
  TrendingUp,
  CheckCircle2,
  Cpu,
  Wrench,
  FileCheck2,
  ShieldAlert,
  Boxes,
  MoreVertical,
  MoreHorizontal,
  Fingerprint,
  FlaskConical,
  Palette,
  Package,
  Factory,
} from 'lucide-react';
import { PaginationBar } from '@/src/components/common/PaginationBar';
import { QueryErrorState } from '@/src/shared/components/QueryErrorState';
import { CreateItemWizardModal } from '../components/CreateItemWizardModal';
import { ItemGridImportModal } from '../components/ItemGridImportModal';
import { ManufacturingBomWizardModal } from '@/src/components/engineering/bomWizard/ManufacturingBomWizardModal';
import {
  AuditHistoryModal,
  GovernancePermissionsModal,
} from '../components/GovernanceModals';
import { AdminApprovalsModal } from '../components/AdminApprovalsModal';
import { useQueryClient } from '@tanstack/react-query';
import {
  usePaginatedItems,
  useItemCatalogStats,
  useItemDetail,
  useSaveItem,
  useDeleteItem,
  useApproveItem,
  useRejectItem,
  useSubmitForApproval,
  useItemAuditHistory,
  useBulkImportItems,
  useBulkSyncCatalog,
} from '../api/useMasterData';
import {
  masterDataGovernanceService,
  MasterDataChangeRecord,
  MasterDataGovernancePermissions,
  MasterDataChangeRequest,
} from '../api/masterDataGovernanceService';
import { adminEventBus } from '@/src/services/adminService';
import { useGridUrlSync } from '@/src/shared/hooks';

interface MasterDataProps {
  view: string;
  items: ItemMaster[];
  boms: BomMaster[];
  machines: MachineMaster[];
  currentUser?: AuthUser | null;
  selectedCode?: string;
  selectedId?: string;
  onNavigate: (view: string, param?: any, isNavTraversing?: boolean | string) => void;
  onUpdateItem: (item: ItemMaster) => void;
  onDeleteItem: (code: string) => void;
  onCreateItem: (item: ItemMaster) => void;
  onUpdateBom: (bom: BomMaster) => void;
  onDeleteBom: (id: string) => void;
  onCreateBom: (bom: BomMaster) => void;
  onUpdateMachine: (machine: MachineMaster) => void;
  onDeleteMachine: (id: string) => void;
  onCreateMachine: (machine: MachineMaster) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  openConfirm: (title: string, message: string, onConfirm: () => void) => void;
  showToast: (msg: string) => void;
}

import { getItemStockData, getWarehouseStockItem, syncItemsWithWarehouseStock } from '@/src/hooks/useWarehouse';

// Re-export getItemStockData so all child and external consumers resolve real warehouse stock
export { getItemStockData };

import { renderRoutingBadge, ItemMasterGridRow } from '../components/ItemMasterGridRow';
export { renderRoutingBadge };
import { QuickModifyItemModal } from '../components/QuickModifyItemModal';
import { EditPurchasingSpecsModal } from '../components/EditPurchasingSpecsModal';
import { ItemAuditHistoryTab } from '../components/ItemAuditHistoryTab';
import { ItemApprovalTab } from '../components/ItemApprovalTab';

export function normalizeItemMaster(i: any): ItemMaster {
  if (!i) return i;
  const cycle = Number(i.standardCycleTime ?? i.standard_cycle_time ?? i.cycleTime ?? i.cycle_time ?? 0);
  const cavities = Number(i.cavityCount ?? i.cavity_count ?? 1);
  const partWt = Number(i.partWeightGrams ?? i.part_weight_grams ?? i.netWeightGrams ?? 0);
  const runnerWt = Number(i.runnerWeightGrams ?? i.runner_weight_grams ?? 0);
  const shotWt = Number(i.shotWeightGrams ?? i.shot_weight_grams ?? ((partWt * cavities) + runnerWt) ?? 0);
  const resin = i.resinType || i.resin_type || i.polymerGrade || i.polymer_grade || '';
  const costVal = Number(i.standardCost ?? i.standard_cost ?? i.cost ?? 0);

  // Auto-detect finished goods if type is missing or generic
  let itemType: ItemType = (i.type || i.item_type || i.category || 'Finished Good') as ItemType;
  if (!itemType || (itemType as any) === 'STORE' || (itemType as any) === 'Plant Asset' || (itemType as any) === 'Other') {
    if (String(i.code || '').startsWith('120') || i.cat === 'SACL' || i.cat === 'INJECTION MOLDING' || cycle > 0) {
      itemType = 'Finished Good';
    } else if (String(i.code || '').startsWith('RM-') || i.cat?.includes('RESIN')) {
      itemType = 'Raw Material';
    } else if (String(i.code || '').startsWith('MB-') || i.cat?.includes('COLOR')) {
      itemType = 'Masterbatch';
    }
  }

  return {
    ...i,
    code: (i.code || i.item_code || '').trim(),
    name: (i.name || i.item_name || '').trim(),
    type: itemType,
    cat: i.cat || i.category || '',
    wh: i.wh || i.warehouse || '',
    plant: i.plant || '',
    stock: String(i.stock ?? i.on_hand_stock ?? '0'),
    avail: String(i.avail ?? i.available_stock ?? '0'),
    baseUOM: i.baseUOM || i.base_uom || 'PCS',
    standardCycleTime: cycle > 0 ? cycle : 0,
    cycleTime: cycle > 0 ? cycle : 0,
    cavityCount: cavities,
    partWeightGrams: partWt > 0 ? partWt : undefined,
    runnerWeightGrams: runnerWt > 0 ? runnerWt : undefined,
    shotWeightGrams: shotWt > 0 ? shotWt : undefined,
    netWeightGrams: partWt > 0 ? partWt : undefined,
    resinType: resin || '',
    polymerGrade: resin || i.polymerGrade || '',
    mfi: i.mfi || i.melt_flow_index || '',
    density: i.density || i.specific_density || '',
    safetyStock: i.safetyStock ? String(i.safetyStock) : (i.safety_stock ? String(i.safety_stock) : ''),
    reorderLevel: i.reorderLevel ? String(i.reorderLevel) : (i.reorder_level ? String(i.reorder_level) : ''),
    leadTime: i.leadTime || i.lead_time || '',
    supplier: i.supplier || '',
    standardCost: costVal,
    cost: costVal,
    moldToolId: i.moldToolId || i.mold_tool_id || '',
    approval: (i.approval || i.approval_status || 'draft') as ApprovalStatus,
    status: (i.status || (i.approval === 'approved' ? 'active' : 'inactive')) as any,
    lot: i.lot ?? true,
    qc: i.qc ?? false,
    icon: i.icon || (itemType === 'Finished Good' ? '📦' : itemType === 'Raw Material' ? '🧪' : '◇'),
    createdOn: i.createdOn || i.created_at || 'Today',
  };
}


export const MasterDataViews: React.FC<MasterDataProps> = ({
  view,
  items,
  boms,
  machines,
  currentUser,
  selectedCode,
  selectedId,
  onNavigate,
  onUpdateItem,
  onDeleteItem,
  onCreateItem,
  onUpdateBom,
  onDeleteBom,
  onCreateBom,
  onUpdateMachine,
  onDeleteMachine,
  onCreateMachine,
  openDrawer,
  closeDrawer,
  openConfirm,
  showToast,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const {
    page: itemPage,
    pageSize: itemPageSize,
    search: searchQuery,
    debouncedSearch: debouncedSearchQuery,
    sortBy: itemSortField = 'code',
    sortOrder: itemSortDirection = 'asc',
    setPage: setItemPage,
    setPageSize: setItemPageSize,
    setSearch: setSearchQuery,
    setSorting: setItemSorting,
  } = useGridUrlSync({
    prefix: 'item',
    defaultPage: 1,
    defaultPageSize: 25,
    defaultSortBy: 'code',
    defaultSortOrder: 'asc',
    debounceMs: 300,
  });
  const [activeTab, setActiveTab] = useState<string>('Overview');
  const [selectedItemCodes, setSelectedItemCodes] = useState<string[]>([]);
  const [jumpItemPageInput, setJumpItemPageInput] = useState<string>('');
  const [quickModifyItem, setQuickModifyItem] = useState<ItemMaster | null>(null);
  const [machinePage, setMachinePage] = useState<number>(1);
  const [machinePageSize, setMachinePageSize] = useState<number>(10);

  // TanStack Query SSOT Queries & Mutations (Rule 1 & Rule 2: Bounded Queries)
  const queryClient = useQueryClient();
  const gridApproval =
    filterType === 'pending_approval' || filterType === 'draft' || filterType === 'rejected'
      ? filterType === 'pending_approval' ? 'pending' : filterType
      : undefined;
  const gridItemType = ['Finished Good', 'Raw Material', 'Masterbatch', 'Regrind'].includes(filterType)
    ? filterType
    : undefined;
  const grid = usePaginatedItems({
    page: itemPage,
    limit: Math.min(100, itemPageSize),
    search: debouncedSearchQuery,
    itemType: gridItemType,
    approval: gridApproval,
    sortBy: itemSortField,
    sortOrder: itemSortDirection,
  });
  const { data: itemCatalogStats, isLoading: isItemStatsLoading } = useItemCatalogStats();
  const effectiveDetailCode =
    view === 'itemDetail'
      ? typeof selectedCode === 'object'
        ? (selectedCode as any)?.code
        : selectedCode
      : undefined;
  const { data: itemDetailData, isLoading: isItemDetailLoading } = useItemDetail(effectiveDetailCode);
  const effectiveItemsList = useMemo(() => {
    if (grid.data?.items && grid.data.items.length > 0) {
      return grid.data.items.map((item) => normalizeItemMaster(item));
    }
    if ((grid.isLoading || grid.isPending) && items && items.length > 0) {
      return items.map((item) => normalizeItemMaster(item));
    }
    return (grid.data?.items || []).map((item) => normalizeItemMaster(item));
  }, [grid.data?.items, grid.isLoading, grid.isPending, items]);

  const displayTotalCount = grid.data?.totalCount ?? (effectiveItemsList.length > 0 ? effectiveItemsList.length : items?.length || 0);
  const isInitialCatalogLoading =
    (grid.isLoading || grid.isPending) && effectiveItemsList.length === 0;

  const saveItemMutation = useSaveItem();
  const deleteItemMutation = useDeleteItem();
  const syncCatalogMutation = useBulkSyncCatalog();
  const approveItemMutation = useApproveItem();
  const rejectItemMutation = useRejectItem();
  const submitForApprovalMutation = useSubmitForApproval();
  const bulkImportMutation = useBulkImportItems();

  // 10-Step Item Wizard State
  const [isItemWizardOpen, setIsItemWizardOpen] = useState<boolean>(false);
  const [wizardEditItem, setWizardEditItem] = useState<ItemMaster | null>(null);

  // Dedicated Purchasing Specs Modal State
  const [isPurchasingSpecsModalOpen, setIsPurchasingSpecsModalOpen] = useState<boolean>(false);
  const [purchasingSpecsItem, setPurchasingSpecsItem] = useState<ItemMaster | null>(null);

  // Grid In / Out (Bulk Import & Export) State
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);

  const handleBulkImport = async (importedItems: any[]) => {
    // 1. Centralized type-safe API mutation via TanStack Query
    await bulkImportMutation.mutateAsync(importedItems);
    // 2. Hydrate local UI items
    importedItems.forEach((dto) => {
      const converted: ItemMaster = {
        code: dto.code,
        name: dto.name,
        type: (dto.type as any) || 'Finished Good',
        cat: dto.category || dto.cat || '',
        wh: dto.wh || '',
        plant: dto.plant || '',
        stock: String(dto.stock || '0'),
        avail: String(dto.avail || '0'),
        lot: dto.lot ?? true,
        qc: dto.qc ?? true,
        icon: dto.icon || '◇',
        desc: dto.desc || '',
        baseUOM: dto.base_uom || dto.baseUOM || 'PCS',
        standardCycleTime: dto.cycle_time || dto.standardCycleTime || dto.cycleTimeSec || 0,
        cavityCount: dto.cavity_count || dto.cavityCount || 1,
        partWeightGrams: dto.part_weight_grams || dto.partWeightGrams || 0,
        runnerWeightGrams: dto.runner_weight_grams || dto.runnerWeightGrams || 0,
        shotWeightGrams: dto.shot_weight_grams || dto.shotWeightGrams || 0,
        resinType: dto.resin_type || dto.resinType || '',
        standardCost: dto.standard_cost || dto.standardCost || dto.cost || 0,
        cost: dto.standard_cost || dto.standardCost || dto.cost || 0,
        safetyStock: String(dto.safety_stock || dto.safetyStock || '0'),
        reorderLevel: String(dto.reorder_level || dto.reorderLevel || '0'),
        leadTime: dto.lead_time || dto.leadTime || '3 Days',
        supplier: dto.supplier || '',
        status: (dto.status as any) || 'active',
        approval: (dto.approval_status as any) || (dto.approval as any) || 'approved',
        createdOn: dto.createdOn || new Date().toISOString(),
      };
      onUpdateItem(converted);
    });
  };

  // Task 1: 3-Dots Action Dropdown Menu State
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState<boolean>(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Task 2: Admin Approvals & CRUD Change Request Center
  const [isAdminApprovalsOpen, setIsAdminApprovalsOpen] = useState<boolean>(false);
  const [pendingCrqCount, setPendingCrqCount] = useState<number>(() =>
    masterDataGovernanceService.getChangeRequests('pending').length
  );
  const [isRaiseDeleteModalOpen, setIsRaiseDeleteModalOpen] = useState<boolean>(false);
  const [deleteTargetItem, setDeleteTargetItem] = useState<ItemMaster | null>(null);
  const [deleteReason, setDeleteReason] = useState<string>('');

  // Task 3: Audit Change History Modal State
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [auditTarget, setAuditTarget] = useState<{ type?: string; code?: string; name?: string }>({});

  // Task 4: Governance & RBAC Configuration Modal State
  const [isGovModalOpen, setIsGovModalOpen] = useState<boolean>(false);
  const [govPerms, setGovPerms] = useState<MasterDataGovernancePermissions>(
    masterDataGovernanceService.getGovernancePermissions()
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const updateCount = () => {
      setPendingCrqCount(masterDataGovernanceService.getChangeRequests('pending').length);
    };
    const unsubGov = adminEventBus.on('GOVERNANCE_PERMISSIONS_SAVED', (updated) => {
      if (updated) setGovPerms(updated);
    });
    const unsub1 = adminEventBus.on('CHANGE_REQUEST_SUBMITTED', updateCount);
    const unsub2 = adminEventBus.on('CHANGE_REQUEST_APPROVED', updateCount);
    const unsub3 = adminEventBus.on('CHANGE_REQUEST_REJECTED', updateCount);
    const unsub4 = adminEventBus.on('CATALOG_RELOADED', (newItems) => {
      if (newItems && Array.isArray(newItems)) {
        newItems.forEach((i: ItemMaster) => onUpdateItem(i));
      }
    });
    const unsubItemSaved = adminEventBus.on('ITEM_SAVED', (savedItem: ItemMaster) => {
      if (savedItem) {
        onUpdateItem(savedItem);
        queryClient.setQueriesData({ queryKey: ['masterData', 'items'] }, (old: ItemMaster[] | undefined) => {
          if (!old) return [savedItem];
          const exists = old.some((i) => i.code === savedItem.code);
          return exists ? old.map((i) => (i.code === savedItem.code ? savedItem : i)) : [savedItem, ...old];
        });
        queryClient.invalidateQueries({ queryKey: ['masterData'] });
      }
    });
    const unsubItemDeleted = adminEventBus.on('ITEM_DELETED', ({ code }: { code: string }) => {
      if (code) {
        onDeleteItem(code);
        queryClient.setQueriesData({ queryKey: ['masterData', 'items'] }, (old: ItemMaster[] | undefined) => {
          if (!old) return [];
          return old.filter((i) => i.code !== code);
        });
        queryClient.invalidateQueries({ queryKey: ['masterData'] });
      }
    });

    // Reactive Stock Sync: Update table when warehouse stock changes anywhere in ERP
    const handleWarehouseUpdate = () => {
      // Force refresh of stock view calculations
      setPendingCrqCount(masterDataGovernanceService.getChangeRequests('pending').length);
    };
    window.addEventListener('warehouse_stock_updated', handleWarehouseUpdate);
    window.addEventListener('storage', handleWarehouseUpdate);

    return () => {
      unsubGov();
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      unsubItemSaved();
      unsubItemDeleted();
      window.removeEventListener('warehouse_stock_updated', handleWarehouseUpdate);
      window.removeEventListener('storage', handleWarehouseUpdate);
    };
  }, [queryClient, onUpdateItem, onDeleteItem]);

  // RBAC Permission checks
  const isSuperAdmin =
    !currentUser ||
    currentUser.roleType === 'admin' ||
    (currentUser.role || '').toLowerCase().includes('admin') ||
    (currentUser.role || '').toLowerCase().includes('director');

  const canCreateItem = masterDataGovernanceService.canUserPerformAction('create_item', currentUser?.role);
  const canEditItem = masterDataGovernanceService.canUserPerformAction('edit_item', currentUser?.role);
  const canApproveItem = masterDataGovernanceService.canUserPerformAction('approve_item', currentUser?.role);
  const canDeleteItem = masterDataGovernanceService.canUserPerformAction('delete_item', currentUser?.role);
  const canCreateBom = masterDataGovernanceService.canUserPerformAction('create_bom', currentUser?.role);
  const canEditBom = masterDataGovernanceService.canUserPerformAction('edit_bom', currentUser?.role);

  const handleOpenCreateItemWizard = () => {
    setWizardEditItem(null);
    setIsItemWizardOpen(true);
  };

  const handleOpenEditItemWizard = (item: ItemMaster) => {
    setWizardEditItem(item);
    setIsItemWizardOpen(true);
  };

  const handleApplyApproval = (req: MasterDataChangeRequest) => {
    if (req.requestType === 'CREATE' && req.payload) {
      const approvedItem = { ...req.payload, approval: 'approved' as const, status: 'active' as const };
      saveItemMutation.mutate(approvedItem);
      onCreateItem(approvedItem);
    } else if (req.requestType === 'UPDATE' && req.payload) {
      const approvedItem = { ...req.payload, approval: 'approved' as const, status: 'active' as const };
      saveItemMutation.mutate(approvedItem);
      onUpdateItem(approvedItem);
    } else if (req.requestType === 'DELETE') {
      deleteItemMutation.mutate(req.itemCode);
      onDeleteItem(req.itemCode);
    }
  };

  const handleApplyRejection = (req: MasterDataChangeRequest) => {
    const itm = items.find((i) => i.code === req.itemCode);
    if (itm && itm.approval === 'pending') {
      const rejectedItem = { ...itm, approval: 'rejected' as const, status: 'inactive' as const };
      saveItemMutation.mutate(rejectedItem);
      onUpdateItem(rejectedItem);
    }
  };

  const handleSaveWizardItem = async (savedItem: ItemMaster) => {
    const prevItem =
      effectiveItemsList.find((i) => i.code === savedItem.code) ||
      items.find((i) => i.code === savedItem.code) ||
      (wizardEditItem?.code === savedItem.code ? wizardEditItem : undefined);
    const exists = !!prevItem;
    const isDraft = savedItem.approval === 'draft';
    const isAlreadyApproved = prevItem?.approval === 'approved';
    const finalApproval = isDraft ? 'draft' : (isAlreadyApproved ? 'approved' : (savedItem.approval || 'pending'));
    const finalStatus = finalApproval === 'approved' ? 'active' : 'inactive';
    const isApproved = finalApproval === 'approved';

    const itemToSave: ItemMaster = {
      ...savedItem,
      approval: finalApproval,
      status: finalStatus,
      approvedBy: finalApproval === 'approved' ? (prevItem?.approvedBy || currentUser?.name) : undefined,
    };

    try {
      const persisted = await saveItemMutation.mutateAsync(itemToSave);
      if (exists) {
        onUpdateItem(persisted || itemToSave);
      } else {
        onCreateItem(persisted || itemToSave);
      }
      showToast(`✓ SKU ${itemToSave.code} saved to database successfully!`);
    } catch (err: any) {
      console.error('[MasterDataViews.handleSaveWizardItem] Save error:', err);
      showToast(`⚠️ Failed to save SKU: ${err?.message || 'Database mutation error'}`);
      throw err;
    }

    // Submit CRUD Change Request if non-admin or record audit trail
    if (!isApproved && !isDraft) {
      masterDataGovernanceService.submitChangeRequest({
        requestType: exists ? 'UPDATE' : 'CREATE',
        itemCode: savedItem.code,
        itemName: savedItem.name,
        requestedBy: currentUser?.name || 'Production Engineer',
        userRole: currentUser?.role || 'engineer',
        reason: exists ? 'Item master tooling specifications & attribute update' : 'New SKU registration in live catalog',
        payload: itemToSave,
        currentSnapshot: prevItem,
      });
    }

    // Record immutable audit ledger entry
    masterDataGovernanceService.recordAudit({
      entityType: 'ITEM_MASTER',
      entityCode: itemToSave.code,
      entityName: itemToSave.name,
      action: exists ? 'UPDATE' : 'CREATE',
      changedBy: currentUser?.name || 'Admin Authority',
      raisedBy: currentUser?.name || 'Admin Authority',
      approvedBy: isApproved ? (currentUser?.name || 'Admin Authority') : undefined,
      userRole: currentUser?.role || 'admin',
      changeSummary: isApproved
        ? `${isDraft ? 'Saved draft' : exists ? 'Updated' : 'Registered and approved'} SKU ${itemToSave.code} (${itemToSave.name}) in live operational catalog.`
        : `${exists ? 'Updated' : 'Registered'} SKU ${itemToSave.code} (${itemToSave.name}). Queued for approval gate before live release.`,
      diff: prevItem
        ? {
            name: { before: prevItem.name, after: itemToSave.name },
            type: { before: prevItem.type, after: itemToSave.type },
            cycleTime: { before: prevItem.cycleTime, after: itemToSave.cycleTime },
            shotWeightGrams: { before: prevItem.shotWeightGrams, after: itemToSave.shotWeightGrams },
            approval: { before: prevItem.approval, after: itemToSave.approval },
          }
        : undefined,
    });

    showToast(
      isDraft
        ? `✓ Draft SKU ${savedItem.code} saved.`
        : isApproved
        ? `✓ SKU ${savedItem.code} saved & stored in live database!`
        : `✓ SKU ${savedItem.code} saved! Status set to Pending Approval for review.`
    );
    setIsItemWizardOpen(false);
    setWizardEditItem(null);
  };

  const handleApproveItem = (item: ItemMaster) => {
    if (!canApproveItem && !isSuperAdmin) {
      showToast('Only Admin or Authorized Approvers can approve items.');
      return;
    }
    const updated: ItemMaster = { ...item, approval: 'approved', status: 'active' };
    approveItemMutation.mutate({
      item: updated,
      reviewerName: currentUser?.name || 'Admin Authority',
      comment: 'Approved and released SKU to live shopfloor',
    });
    onUpdateItem(updated);
    masterDataGovernanceService.recordAudit({
      entityType: 'ITEM_MASTER',
      entityCode: item.code,
      entityName: item.name,
      action: 'APPROVE',
      changedBy: currentUser?.name || 'Priya Rao (Admin Lead)',
      raisedBy: 'Production Team',
      approvedBy: currentUser?.name || 'Priya Rao (Admin Lead)',
      userRole: currentUser?.role || 'admin',
      changeSummary: `Approved Item ${item.code} (${item.name}) - Released to live operational modules.`,
      diff: { approval: { before: item.approval, after: 'approved' } },
    });
    showToast(`✓ Approved ${item.code} - Released to all operational modules!`);
  };

  const handleRejectItem = (item: ItemMaster) => {
    if (!canApproveItem && !isSuperAdmin) {
      showToast('Only Admin or Authorized Approvers can reject items.');
      return;
    }
    const updated: ItemMaster = { ...item, approval: 'rejected', status: 'inactive' };
    rejectItemMutation.mutate({
      item: updated,
      reviewerName: currentUser?.name || 'Admin Authority',
      reason: 'Rejected in QA / Engineering review',
    });
    onUpdateItem(updated);
    masterDataGovernanceService.recordAudit({
      entityType: 'ITEM_MASTER',
      entityCode: item.code,
      entityName: item.name,
      action: 'REJECT',
      changedBy: currentUser?.name || 'Priya Rao (Admin Lead)',
      raisedBy: 'Production Team',
      approvedBy: currentUser?.name || 'Priya Rao (Admin Lead)',
      userRole: currentUser?.role || 'admin',
      changeSummary: `Rejected Item ${item.code} (${item.name}). Quarantined and hidden from all operational modules.`,
      diff: { approval: { before: item.approval, after: 'rejected' } },
    });
    showToast(`Rejected ${item.code}. Hidden from operational modules.`);
  };

  const handleSubmitForApproval = (item: ItemMaster) => {
    const updated: ItemMaster = { ...item, approval: 'pending', status: 'inactive' };
    submitForApprovalMutation.mutate({
      item: updated,
      requestedBy: currentUser?.name || 'Production Engineer',
      note: 'Submitted SKU for QA and Engineering approval',
    });
    onUpdateItem(updated);
    masterDataGovernanceService.recordAudit({
      entityType: 'ITEM_MASTER',
      entityCode: item.code,
      entityName: item.name,
      action: 'UPDATE',
      changedBy: currentUser?.name || 'Production Engineer',
      raisedBy: currentUser?.name || 'Production Engineer',
      userRole: currentUser?.role || 'engineer',
      changeSummary: `Submitted ${item.code} (${item.name}) for technical review & approval.`,
      diff: { approval: { before: item.approval, after: 'pending' } },
    });
    showToast(`✓ Submitted ${item.code} for technical & QA review.`);
  };

  // Manufacturing BOM Wizard State
  const [isMfgBomWizardOpen, setIsMfgBomWizardOpen] = useState<boolean>(false);
  const [bomWizardParentItem, setBomWizardParentItem] = useState<ItemMaster | null>(null);

  const handleOpenMfgBomWizard = (targetItem: ItemMaster) => {
    if (!canCreateBom && !isSuperAdmin) {
      showToast('Admin or Tooling Lead permission required to create BOMs.');
      return;
    }
    setBomWizardParentItem(targetItem);
    setIsMfgBomWizardOpen(true);
  };

  const handleExportCatalogCsv = () => {
    setIsMoreMenuOpen(false);
    const headers = [
      'Item Code',
      'Item Name',
      'Item Type',
      'Plant',
      'Category',
      'Warehouse',
      'Base UOM',
      'On Hand Stock',
      'Available Stock',
      'Safety Stock',
      'Reorder Level',
      'Lead Time',
      'Cycle Time (s)',
      'Mold Tool ID',
      'Cavities',
      'Part Weight (g)',
      'Runner Weight (g)',
      'Shot Weight (g)',
      'Resin / Material',
      'MFI',
      'Density',
      'Supplier',
      'Standard Cost (INR)',
      'Approval Status',
      'Record Status',
    ];

    const rows = items.map((i) => {
      const stock = getItemStockData(i);
      return [
        `"${i.code || ''}"`,
        `"${(i.name || '').replace(/"/g, '""')}"`,
        `"${i.type || ''}"`,
        `"${i.plant || ''}"`,
        `"${i.cat || ''}"`,
        `"${i.wh || ''}"`,
        `"${i.baseUOM || 'PCS'}"`,
        `"${stock.onHandNum}"`,
        `"${stock.availNum}"`,
        `"${i.safetyStock || 0}"`,
        `"${i.reorderLevel || 0}"`,
        `"${i.leadTime || ''}"`,
        `"${i.cycleTime || i.standardCycleTime || 0}"`,
        `"${i.moldToolId || ''}"`,
        `"${i.cavityCount || 1}"`,
        `"${i.partWeightGrams || i.netWeightGrams || 0}"`,
        `"${i.runnerWeightGrams || 0}"`,
        `"${i.shotWeightGrams || 0}"`,
        `"${i.resinType || i.polymerGrade || ''}"`,
        `"${i.mfi || ''}"`,
        `"${i.density || ''}"`,
        `"${(i.supplier || '').replace(/"/g, '""')}"`,
        `"${(i.standardCost || i.cost || 0).toFixed(2)}"`,
        `"${i.approval || 'approved'}"`,
        `"${i.status || 'active'}"`,
      ].join(',');
    });

    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `item_master_catalog_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`✓ Exported ${items.length} dynamic items with technical & tooling specs to CSV!`);
  };

  const handlePrintLabel = (item: ItemMaster) => {
    const printWindow = window.open('', '_blank', 'width=450,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Zebra Barcode Label - ${item.code}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; padding: 20px; text-align: center; }
              .card { border: 2px solid #000; padding: 15px; border-radius: 8px; max-width: 380px; margin: 0 auto; }
              .header { font-size: 14px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 10px; }
              .code { font-size: 18px; font-weight: bold; margin: 8px 0; font-family: monospace; }
              .name { font-size: 12px; margin-bottom: 8px; font-weight: 600; }
              .barcode { font-size: 28px; letter-spacing: 4px; margin: 15px 0; font-family: monospace; }
              .meta { font-size: 11px; display: flex; justify-content: space-between; border-top: 1px dashed #000; padding-top: 8px; font-weight: 500; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="header">DATASTOCK PLASTICS &bull; ${item.plant || 'PLANT 1'}</div>
              <div class="code">${item.code}</div>
              <div class="name">${item.name}</div>
              <div>Type: ${item.type} | Store: ${item.wh || 'STORE'}</div>
              <div class="barcode">||| | ||||| | ||| ||||</div>
              <div class="meta">
                <span>UOM: ${item.baseUOM || 'PCS'}</span>
                <span>Status: ${(item.approval || 'APPROVED').toUpperCase()}</span>
              </div>
            </div>
            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
    showToast(`✓ Zebra thermal label generated for SKU ${item.code}`);
  };

  // Status helper badge
  const renderStatusBadge = (status: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      active: { cls: 'green', label: 'Active' },
      low: { cls: 'amber', label: 'Low stock' },
      hold: { cls: 'purple', label: 'Quality hold' },
      blocked: { cls: 'red', label: 'Blocked' },
      inactive: { cls: 'gray', label: 'Inactive' },
    };
    const res = map[status] || { cls: 'gray', label: status };
    return <span className={`badge ${res.cls}`}>{res.label}</span>;
  };

  const renderApprovalBadge = (approval: ApprovalStatus, itm?: ItemMaster) => {
    const map: Record<string, { cls: string; label: string }> = {
      draft: { cls: 'gray', label: 'Draft' },
      pending: { cls: 'amber', label: 'Pending approval' },
      approved: { cls: 'green', label: 'Approved' },
      released: { cls: 'green', label: 'Released' },
      under_review: { cls: 'teal', label: 'Under review' },
      rejected: { cls: 'red', label: 'Rejected' },
      obsolete: { cls: 'gray', label: 'Obsolete' },
    };
    const res = map[approval] || { cls: 'gray', label: approval };
    return (
      <div className="flex items-center justify-center gap-1.5 flex-wrap">
        <span className={`badge ${res.cls}`}>{res.label}</span>
        {approval === 'pending' && itm && (canApproveItem || isSuperAdmin) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleApproveItem(itm);
            }}
            className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs inline-flex items-center gap-1 transition-all cursor-pointer"
            title="Approve SKU & Release to Shopfloor"
          >
            <Check className="w-2.5 h-2.5" /> Approve
          </button>
        )}
      </div>
    );
  };

  /* ----------------------------------------------------
     ITEM MASTER LIST & DETAIL (100k+ Scalable Architecture & Mold Tooling Specs)
  ---------------------------------------------------- */
  const renderViewContent = () => {
    const normalizedItems = (effectiveItemsList || []).map(normalizeItemMaster);

    if (view === 'itemList') {
      const filteredItems = normalizedItems.filter((i) => {
        if (!i) return false;

        // Task 5: Never show rejected items to non-admins
        if (!isSuperAdmin && (i.approval === 'rejected' || i.status === 'rejected')) {
          return false;
        }

        return true;
      });

      const totalItemPages = Math.max(1, Math.ceil(displayTotalCount / itemPageSize));
      const safeItemPage = Math.min(Math.max(1, itemPage), totalItemPages);
      const startItemIdx = (safeItemPage - 1) * itemPageSize;
      const pagedItems = filteredItems;

      const handleItemSort = (field: string) => {
        setItemSorting(field);
      };

      const handleJumpItemPage = (e: React.FormEvent) => {
        e.preventDefault();
        const p = parseInt(jumpItemPageInput, 10);
        if (!isNaN(p) && p >= 1 && p <= totalItemPages) {
          setItemPage(p);
          setJumpItemPageInput('');
        } else {
          showToast(`Please enter a valid page between 1 and ${totalItemPages}`);
        }
      };

      return (
        <div className="space-y-5 max-w-[1600px] mx-auto pb-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-wider text-[#0F8B8D] font-bold flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5" /> Master Data &bull; Items
              </div>
              <h1 className="text-xl font-bold text-[#14213D] flex items-center gap-2 flex-wrap">
                Item Master
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {/* Grid In (Bulk Import) Button */}
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="btn btn-secondary border border-teal-300 bg-teal-50 text-[#0F8B8D] hover:bg-teal-100 flex items-center gap-1.5 px-3 py-2 text-xs font-bold shadow-xs cursor-pointer"
                title="Bulk Import Items (CSV / Excel) with Zod Validation"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Grid In</span>
              </button>

              {/* Grid Out (Export Catalog) Button */}
              <button
                type="button"
                onClick={handleExportCatalogCsv}
                className="btn btn-secondary border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 px-3 py-2 text-xs font-bold shadow-xs cursor-pointer"
                title="Export Catalog to CSV / Excel"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Grid Out</span>
              </button>

              {/* + Create Item Primary 3D Button */}
              <button
                className="btn btn-primary shadow-md flex items-center gap-2 px-4 py-2 text-xs font-bold"
                onClick={handleOpenCreateItemWizard}
              >
                <Plus className="w-4 h-4" />
                <span>Create Item</span>
              </button>

              {/* Task 1: 3-Dots Action Dropdown Menu */}
              <div className="relative" ref={moreMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                  className={`btn p-2 rounded-xl flex items-center justify-center transition-all ${
                    isMoreMenuOpen || pendingCrqCount > 0
                      ? 'bg-slate-100 border-slate-400 text-slate-900 shadow-sm ring-2 ring-amber-400/50'
                      : 'btn-ghost text-slate-700 hover:bg-slate-50'
                  }`}
                  title="More Master Catalog Operations"
                >
                  <MoreVertical className="w-4 h-4 text-slate-700" />
                  {pendingCrqCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-600 text-white text-[9px] font-mono font-extrabold flex items-center justify-center shadow-xs border border-white animate-pulse">
                      {pendingCrqCount}
                    </span>
                  )}
                </button>

                {isMoreMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-2xl z-40 py-2 animate-in zoom-in-95 duration-100 text-xs divide-y divide-slate-100">
                    <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Catalog Governance &amp; Actions
                    </div>

                    <div className="py-1">
                      {/* Admin Approvals */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsMoreMenuOpen(false);
                          setIsAdminApprovalsOpen(true);
                        }}
                        className="w-full px-3.5 py-2 text-left flex items-center justify-between text-slate-700 hover:bg-amber-50/80 hover:text-amber-900 transition-colors font-medium group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <ShieldAlert className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
                          <span>Admin Approvals Queue</span>
                        </div>
                        {pendingCrqCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-600 text-white font-bold">
                            {pendingCrqCount}
                          </span>
                        )}
                      </button>

                      {/* Sync Live Catalog */}
                      {isSuperAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsMoreMenuOpen(false);
                            openConfirm(
                              'Reload Master Catalog from Database?',
                              'This will synchronize and ensure all live items from the database are refreshed.',
                              async () => {
                                const reloaded: ItemMaster[] = await syncCatalogMutation.mutateAsync();
                                reloaded.forEach((i) => onUpdateItem(i));
                                showToast(`✓ Synchronized ${reloaded.length} live items from database!`);
                              }
                            );
                          }}
                          className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-slate-700 hover:bg-teal-50 hover:text-[#0F8B8D] transition-colors font-medium group cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4 text-[#0F8B8D] group-hover:scale-110 transition-transform" />
                          <span>Sync Live Catalog</span>
                        </button>
                      )}

                      {/* Audit History */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsMoreMenuOpen(false);
                          setAuditTarget({});
                          setIsAuditModalOpen(true);
                        }}
                        className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors font-medium group cursor-pointer"
                      >
                        <History className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                        <span>Audit &amp; Change History</span>
                      </button>

                      {/* Governance RBAC */}
                      {isSuperAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsMoreMenuOpen(false);
                            setIsGovModalOpen(true);
                          }}
                          className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition-colors font-medium group cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
                          <span>Governance RBAC Controls</span>
                        </button>
                      )}
                    </div>

                    <div className="py-1">
                      {/* Export CSV */}
                      <button
                        type="button"
                        onClick={handleExportCatalogCsv}
                        className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors font-medium group cursor-pointer"
                      >
                        <Download className="w-4 h-4 text-slate-500 group-hover:scale-110 transition-transform" />
                        <span>Export Catalog to CSV</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>



          {/* Filter Bar */}
          <div className="bg-white p-3 rounded-xl border border-[#E4E0D6] flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2 flex-1 max-w-lg bg-[#F6F4EF] border border-[#E4E0D6] rounded-lg px-3 py-1.5 text-xs focus-within:border-[#0F8B8D] focus-within:bg-white transition-all">
              <Search className="w-3.5 h-3.5 text-[#9CA3AF] flex-shrink-0" />
              <input
                type="text"
                placeholder="Instant search SKU code, name, category, resin, mold tool..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setItemPage(1);
                }}
                className="w-full bg-transparent border-none outline-none text-xs text-[#14213D]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-gray-400 hover:text-gray-700 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap bg-[#F6F4EF] p-1 rounded-lg border border-[#E4E0D6]">
              {[
                { id: 'all', label: 'All Items', testId: 'item-kpi-total-items', count: displayTotalCount || itemCatalogStats?.total },
                { id: 'Finished Good', label: 'Finished Goods', testId: 'item-kpi-finished-goods', count: itemCatalogStats?.finishedGoods },
                { id: 'Raw Material', label: 'Raw Materials', count: itemCatalogStats?.rawMaterials },
                { id: 'Masterbatch', label: 'Masterbatch', count: itemCatalogStats?.masterbatch },
                { id: 'Regrind', label: 'Regrind', count: itemCatalogStats?.regrind },
                { id: 'draft', label: 'Drafts', count: itemCatalogStats?.drafts },
                { id: 'pending_approval', label: 'Pending', count: itemCatalogStats?.pending },
              ].map((chip) => (
                <button
                  key={chip.id}
                  data-testid={chip.testId}
                  onClick={() => {
                    setFilterType(chip.id);
                    setItemPage(1);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    filterType === chip.id
                      ? 'bg-[#14213D] text-white shadow-xs'
                      : 'text-[#6B7280] hover:text-[#14213D] hover:bg-white/80'
                  }`}
                >
                  <span>{chip.label}</span>
                  {chip.count !== undefined && (
                    <span
                      className={`text-[10px] font-mono font-extrabold px-1.5 py-0.2 rounded-full ${
                        filterType === chip.id
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200/80 text-slate-700'
                      }`}
                    >
                      {chip.count}
                    </span>
                  )}
                </button>
              ))}

              {isSuperAdmin && (
                <button
                  onClick={() => {
                    setFilterType('rejected');
                    setItemPage(1);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    filterType === 'rejected'
                      ? 'bg-rose-700 text-white shadow-xs'
                      : 'text-rose-700 hover:bg-rose-50'
                  }`}
                >
                  <span>🚫 Rejected</span>
                  {itemCatalogStats?.rejected !== undefined && (
                    <span
                      className={`text-[10px] font-mono font-extrabold px-1.5 py-0.2 rounded-full ${
                        filterType === 'rejected'
                          ? 'bg-white/20 text-white'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {itemCatalogStats.rejected}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Bulk Actions Toolbar */}
          {selectedItemCodes.length > 0 && (
            <div className="p-2.5 bg-[#14213D] text-white rounded-xl flex items-center justify-between text-xs animate-in fade-in duration-150 shadow-md">
              <div className="flex items-center gap-2 font-semibold">
                <CheckSquare className="w-4 h-4 text-[#E8622C]" />
                <span>{selectedItemCodes.length} Item(s) selected</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (!isSuperAdmin && !canApproveItem) {
                      showToast('Admin access required for bulk approval');
                      return;
                    }
                    selectedItemCodes.forEach((code) => {
                      const itm = items.find((i) => i.code === code);
                      if (itm) {
                        onUpdateItem({ ...itm, approval: 'approved', status: 'active' });
                      }
                    });
                    showToast(`Bulk approved ${selectedItemCodes.length} item(s)`);
                    setSelectedItemCodes([]);
                  }}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 rounded text-xs font-bold transition-colors"
                >
                  Bulk Approve
                </button>
                <button
                  onClick={() => {
                    if (!isSuperAdmin && !canApproveItem) {
                      showToast('Admin access required for bulk rejection');
                      return;
                    }
                    selectedItemCodes.forEach((code) => {
                      const itm = items.find((i) => i.code === code);
                      if (itm) {
                        onUpdateItem({ ...itm, approval: 'rejected', status: 'inactive' });
                      }
                    });
                    showToast(`Marked ${selectedItemCodes.length} item(s) as Rejected`);
                    setSelectedItemCodes([]);
                  }}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 rounded text-xs font-bold transition-colors"
                >
                  Bulk Reject
                </button>
                <button
                  onClick={() => {
                    showToast(`Exported ${selectedItemCodes.length} items to CSV`);
                    setSelectedItemCodes([]);
                  }}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-xs font-semibold transition-colors"
                >
                  Export Selected
                </button>
                <button
                  onClick={() => setSelectedItemCodes([])}
                  className="p-1 hover:bg-white/10 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Table with Mold Spec & Tooling Columns (Scrollbar-Free Clean Container) */}
          <div className="panel item-master-grid-panel bg-white rounded-xl border border-[#E4E0D6] shadow-xs overflow-hidden">
            <div className="item-master-grid-viewport overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <table className="item-master-grid-table w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F6F4EF] border-b border-[#E4E0D6] text-[#4B5563] font-bold text-[11px] uppercase tracking-wider select-none">
                    <th className="p-3 w-8 text-center">
                      <input
                        type="checkbox"
                        checked={pagedItems.length > 0 && pagedItems.every((i) => selectedItemCodes.includes(i.code))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            const pageCodes = pagedItems.map((i) => i.code);
                            setSelectedItemCodes(Array.from(new Set([...selectedItemCodes, ...pageCodes])));
                          } else {
                            const pageCodes = new Set(pagedItems.map((i) => i.code));
                            setSelectedItemCodes(selectedItemCodes.filter((c) => !pageCodes.has(c)));
                          }
                        }}
                        className="rounded text-[#0F8B8D]"
                      />
                    </th>
                    <th className="p-3 cursor-pointer hover:bg-amber-50/50" onClick={() => handleItemSort('code')}>
                      <div className="flex items-center gap-1">
                        Item Code
                        <ArrowUpDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </th>
                    <th className="p-3 cursor-pointer hover:bg-amber-50/50" onClick={() => handleItemSort('name')}>
                      <div className="flex items-center gap-1">
                        Item Name &amp; Family
                        <ArrowUpDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </th>
                    <th className="p-3">
                      <div className="flex items-center gap-1">
                        Plant / Unit
                        <ArrowUpDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </th>
                    
                    <th className="p-3 text-right cursor-pointer hover:bg-amber-50/50" onClick={() => handleItemSort('stock')}>
                      <div className="flex items-center justify-end gap-1">
                        On Hand
                        <ArrowUpDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </th>
                    <th className="p-3 text-right cursor-pointer hover:bg-amber-50/50" onClick={() => handleItemSort('avail')}>
                      <div className="flex items-center justify-end gap-1">
                        Available
                        <ArrowUpDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </th>
                    <th className="p-3">Warehouse</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Approval</th>
                    <th className="p-3 text-right w-32">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E0D6]">
                  {grid.isError ? (
                    <tr>
                      <td colSpan={10} className="p-8">
                        <QueryErrorState error={grid.error} onRetry={() => grid.refetch()} />
                      </td>
                    </tr>
                  ) : isInitialCatalogLoading || (grid.isFetching && pagedItems.length === 0) ? (
                    Array.from({ length: 8 }).map((_, idx) => (
                      <tr key={`item-skeleton-${idx}`} className="animate-pulse">
                        <td className="p-3 text-center">
                          <div className="w-4 h-4 bg-slate-200 rounded mx-auto" />
                        </td>
                        <td className="p-3">
                          <div className="h-4 w-24 bg-teal-100/80 rounded" />
                        </td>
                        <td className="p-3">
                          <div className="h-4 w-44 bg-slate-200 rounded mb-1" />
                          <div className="h-3 w-24 bg-slate-100 rounded" />
                        </td>
                        <td className="p-3">
                          <div className="h-4 w-32 bg-slate-200 rounded" />
                        </td>
                        <td className="p-3">
                          <div className="h-4 w-20 bg-slate-100 rounded" />
                        </td>
                        <td className="p-3">
                          <div className="h-4 w-28 bg-slate-200 rounded mb-1" />
                          <div className="h-3 w-16 bg-slate-100 rounded" />
                        </td>
                        <td className="p-3">
                          <div className="h-4 w-24 bg-slate-200 rounded" />
                        </td>
                        <td className="p-3 text-right">
                          <div className="h-4 w-12 bg-slate-200 rounded ml-auto" />
                        </td>
                        <td className="p-3 text-right">
                          <div className="h-4 w-12 bg-slate-200 rounded ml-auto" />
                        </td>
                        <td className="p-3">
                          <div className="h-4 w-16 bg-slate-200 rounded" />
                        </td>
                        <td className="p-3 text-center">
                          <div className="h-5 w-16 bg-emerald-100/60 rounded-full mx-auto" />
                        </td>
                        <td className="p-3 text-center">
                          <div className="h-5 w-20 bg-emerald-100/60 rounded-full mx-auto" />
                        </td>
                        <td className="p-3 text-right">
                          <div className="h-6 w-16 bg-slate-100 rounded ml-auto" />
                        </td>
                      </tr>
                    ))
                  ) : pagedItems.length > 0 ? (
                    pagedItems.map((item) => (
                      <ItemMasterGridRow
                        key={item.code}
                        item={item}
                        isSelected={selectedItemCodes.includes(item.code)}
                        onToggleSelect={(code, checked) => {
                          if (checked) {
                            setSelectedItemCodes([...selectedItemCodes, code]);
                          } else {
                            setSelectedItemCodes(selectedItemCodes.filter((c) => c !== code));
                          }
                        }}
                        onNavigateDetail={(code) => onNavigate('itemDetail', code)}
                        onOpenAudit={(itm) => {
                          setAuditTarget({ type: 'ITEM_MASTER', code: itm.code, name: itm.name });
                          setIsAuditModalOpen(true);
                        }}
                        onQuickModify={(itm) => setQuickModifyItem(itm)}
                        onCloneItem={(itm) => {
                          if (!isSuperAdmin && !canCreateItem) {
                            showToast('Admin permission required to clone items');
                            return;
                          }
                          let copyCode = `${itm.code}-COPY`;
                          let copyName = `${itm.name} (Copy)`;
                          let copyNum = 1;
                          while (items.some((i) => i.code.toLowerCase() === copyCode.toLowerCase())) {
                            copyNum++;
                            copyCode = `${itm.code}-COPY${copyNum}`;
                            copyName = `${itm.name} (Copy ${copyNum})`;
                          }
                          const clone: ItemMaster = {
                            ...itm,
                            code: copyCode,
                            name: copyName,
                            approval: 'pending',
                            status: 'inactive',
                            createdOn: 'Today',
                          };
                          onCreateItem(clone);
                          saveItemMutation.mutate(clone);
                          masterDataGovernanceService.submitChangeRequest({
                            requestType: 'CREATE',
                            itemCode: clone.code,
                            itemName: clone.name,
                            requestedBy: currentUser?.name || 'Shopfloor User',
                            userRole: currentUser?.role || 'operator',
                            reason: `Cloned from parent SKU ${itm.code}`,
                            payload: clone,
                          });
                          showToast(`✓ Cloned ${itm.code} to new SKU ${copyCode} (Pending Approval)`);
                        }}
                        onOpenMfgBomWizard={(itm) => {
                          if (itm.type === 'Raw Material') {
                            openConfirm(
                              'Raw Material BOM Notice',
                              'Raw Materials typically do not have a Manufacturing BOM. Do you want to proceed?',
                              () => handleOpenMfgBomWizard(itm)
                            );
                          } else {
                            handleOpenMfgBomWizard(itm);
                          }
                        }}
                        onDeleteItem={(itm) => {
                          if (!isSuperAdmin) {
                            setDeleteTargetItem(itm);
                            setDeleteReason('');
                            setIsRaiseDeleteModalOpen(true);
                            return;
                          }
                          openConfirm(
                            `Delete ${itm.code}?`,
                            `Are you sure you want to permanently delete SKU ${itm.code} (${itm.name}) from the live master catalog?`,
                            async () => {
                              try {
                                await deleteItemMutation.mutateAsync(itm.code);
                                onDeleteItem(itm.code);
                                masterDataGovernanceService.recordAudit({
                                  entityType: 'ITEM_MASTER',
                                  entityCode: itm.code,
                                  entityName: itm.name,
                                  action: 'DELETE',
                                  changedBy: currentUser?.name || 'Admin',
                                  userRole: 'admin',
                                  changeSummary: `Admin deleted item ${itm.code} from Master Catalog.`,
                                });
                                showToast(`✓ Item ${itm.code} deleted successfully.`);
                              } catch (err: any) {
                                console.error('[MasterDataViews.deleteItem] Error:', err);
                                showToast(`⚠️ Failed to delete SKU ${itm.code}: ${err?.message || 'Database error'}`);
                              }
                            }
                          );
                        }}
                        renderStatusBadge={renderStatusBadge}
                        renderApprovalBadge={renderApprovalBadge}
                      />
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10}>
                        <div className="py-12 px-6 text-center">
                          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-teal-50 text-[#0F8B8D] mb-3">
                            <Plus className="w-6 h-6" />
                          </div>
                          <h3 className="text-sm font-bold text-[#14213D] mb-1">
                            {effectiveItemsList.length === 0 ? 'No Master Items in Catalog' : 'No matching items found'}
                          </h3>
                          <p className="text-xs text-[#6B7280] max-w-md mx-auto mb-4">
                            {effectiveItemsList.length === 0
                              ? 'The catalog is empty and ready for live data entry. Click below to register your first Raw Material or Finished Good.'
                              : 'No items match your active search or filter. Try clearing filters or changing search query.'}
                          </p>
                          {effectiveItemsList.length === 0 && (
                            <button
                              onClick={handleOpenCreateItemWizard}
                              className="btn btn-sm btn-primary inline-flex items-center gap-1.5"
                            >
                              <Plus className="w-3.5 h-3.5" /> Create First Item
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Standard High-Performance Pagination Bar */}
            <PaginationBar
              currentPage={safeItemPage}
              totalPages={totalItemPages}
              pageSize={itemPageSize}
              totalItems={displayTotalCount}
              onPageChange={setItemPage}
              onPageSizeChange={(newSize) => {
                setItemPageSize(newSize);
                setItemPage(1);
              }}
              pageSizeOptions={[10, 25, 50, 100]}
              itemName="items"
            />
          </div>
        </div>
      );
    }

    /* ----------------------------------------------------
       ITEM DETAIL VIEW (With All 10 Full Tabs & Mold Spec Tooling)
    ---------------------------------------------------- */
    if (view === 'itemDetail') {
      const effectiveCode = typeof selectedCode === 'object' ? (selectedCode as any)?.code : selectedCode;

      const found =
        (itemDetailData && (itemDetailData.code === effectiveCode || String(itemDetailData.code).toLowerCase() === String(effectiveCode).toLowerCase())
          ? itemDetailData
          : null) ||
        normalizedItems.find(
          (i) => i.code === effectiveCode || (effectiveCode && i.code?.toLowerCase() === String(effectiveCode).toLowerCase())
        ) ||
        (items || []).find(
          (i) => i.code === effectiveCode || (effectiveCode && i.code?.toLowerCase() === String(effectiveCode).toLowerCase())
        ) ||
        itemDetailData ||
        (effectiveCode ? null : (normalizedItems.length > 0 ? normalizedItems[0] : null));

      if (isItemDetailLoading && !found && effectiveCode) {
        return (
          <div className="space-y-5 max-w-[1500px] mx-auto pb-8">
            <div
              className="back-link cursor-pointer flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
              onClick={() => onNavigate('itemList')}
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Item Master
            </div>
            <div className="w-full p-4 md:p-6 space-y-4 animate-pulse">
              <div className="h-9 w-64 bg-slate-200 rounded-lg" />
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-white border border-[#E4E0D6] space-y-2">
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                    <div className="h-6 bg-slate-200 rounded w-3/4" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      const item = found ? normalizeItemMaster(found) : null;

      if (!item) {
        return (
          <div className="space-y-5">
            <div className="back-link" onClick={() => onNavigate('itemList')}>
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Item Master
            </div>
            <div className="p-12 text-center bg-white rounded-xl border border-[#E4E0D6] shadow-xs">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-500 mb-3">
                <Box className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-[#14213D] mb-1">Item Not Found in Catalog</h3>
              <p className="text-xs text-[#6B7280] max-w-sm mx-auto mb-4">
                The requested item code {effectiveCode ? `"${effectiveCode}"` : ''} is not available or the master catalog is currently empty.
              </p>
              <button className="btn btn-sm btn-primary" onClick={() => onNavigate('itemList')}>
                Return to Catalog
              </button>
            </div>
          </div>
        );
      }

      const isFg = item.type === 'Finished Good' || item.type === 'Semi-Finished Good';
      const itemBoms = boms.filter((b) => (b.lines || []).some((l) => l.item === item.code) || b.parent === item.code);
      const cycle = Number(item.standardCycleTime || item.cycleTime || (item as any).cycle_time || (item as any).cycle_time_seconds || (item as any).standard_cycle_time || 0);
      const cavities = Math.max(1, Number(item.cavityCount || (item as any).cavity_count || 1));
      const partWt = Number(item.partWeightGrams || (item as any).part_weight_grams || item.netWeightGrams || 0);
      const runnerWt = Number(item.runnerWeightGrams || (item as any).runner_weight_grams || 0);
      const singleShotWt = Number((partWt + runnerWt).toFixed(2));
      const totalMoldShotWt = Number(((partWt * cavities) + runnerWt).toFixed(2));
      const hourlyOutput = cycle > 0 ? Math.round((3600 / cycle) * cavities) : 0;
      const detailStock = getItemStockData(item);
      const whStockItem = getWarehouseStockItem(item.code);
      const itemLots = whStockItem?.lots || [];

      const tabs = [
        'Overview',
        'Inventory',
        'Purchasing',
        'Quality',
        isFg ? 'Cycle Time & Mold Spec' : 'Material & Rheology Specs',
        'BOM usage',
        'Documents',
        'Barcode / Label',
        'Approval',
        'Audit history',
      ];

      return (
        <div className="space-y-5 max-w-[1500px] mx-auto pb-8">
          <div
            className="back-link"
            onClick={() => onNavigate('itemList')}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Item Master
          </div>

          {/* Detail Header */}
          <div className="detail-header">
            <div className="dh-left">
              <div className="item-thumb">{item.icon}</div>
              <div>
                <div className="dh-title flex items-center gap-2 flex-wrap">
                  <h2>{item.name}</h2>
                  {renderStatusBadge(item.status)}
                  {renderApprovalBadge(item.approval, item)}
                  {renderRoutingBadge(item)}
                </div>
                <div className="dh-meta">
                  <div className="m">
                    Item Code: <b>{item.code}</b>
                  </div>
                  <div className="m">
                    Type: <b>{item.type}</b>
                  </div>
                  <div className="m flex items-center gap-1">
                    <Factory className="w-3 h-3 text-[#0F8B8D]" />
                    Plant: <b>{item.plant || '—'}</b>
                  </div>
                  <div className="m">
                    Category: <b>{item.cat || '—'}</b>
                  </div>
                  <div className="m">
                    Warehouse: <b>{item.wh || '—'}</b>
                  </div>
                  {isFg ? (
                    <div className="m">
                      Mold: <b>{item.moldToolId ? `${item.moldToolId} (${cavities} Cav)` : '—'}</b>
                    </div>
                  ) : item.type === 'Raw Material' || item.type === 'Regrind' ? (
                    <div className="m">
                      Polymer: <b>{item.resinType || item.polymerGrade || '—'}</b>
                    </div>
                  ) : item.type === 'Masterbatch' || item.type === 'Colorant' || item.type === 'Additive' ? (
                    <div className="m">
                      Color: <b>{item.color || 'Standard'} {item.masterbatchDosage ? `(${item.masterbatchDosage} LDR)` : ''}</b>
                    </div>
                  ) : item.type === 'Packaging Material' ? (
                    <div className="m">
                      Pack Spec: <b>{item.packagingStandard || '—'}</b>
                    </div>
                  ) : (
                    <div className="m">
                      Fitment: <b>{item.moldToolId || '—'}</b>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="dh-actions">
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => setQuickModifyItem(item)}
              >
                <Edit2 className="w-3.5 h-3.5 text-[#E8622C]" /> Quick Modify
              </button>
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => handleOpenEditItemWizard(item)}
              >
                <Sliders className="w-3.5 h-3.5" /> 10-Step Wizard
              </button>
              <button
                className="btn btn-sm btn-ghost flex items-center gap-1.5"
                onClick={() => {
                  setAuditTarget({ type: 'ITEM_MASTER', code: item.code, name: item.name });
                  setIsAuditModalOpen(true);
                }}
                title="View change & approval ledger for this item"
              >
                <History className="w-3.5 h-3.5 text-[#0F8B8D]" /> Change Ledger
              </button>
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => handlePrintLabel(item)}
              >
                <Printer className="w-3.5 h-3.5" /> Print Label
              </button>
              {isFg && (
                <button
                  className="btn btn-sm btn-primary flex items-center gap-1.5 shadow-sm"
                  onClick={() => handleOpenMfgBomWizard(item)}
                >
                  <Layers className="w-3.5 h-3.5" /> Create Manufacturing BOM
                </button>
              )}
              {item.approval !== 'approved' && (
                <button
                  className="btn btn-sm btn-ghost border-[#E4E0D6] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-bold"
                  onClick={() => handleApproveItem(item)}
                >
                  <Check className="w-3.5 h-3.5" /> Approve &amp; Release
                </button>
              )}
            </div>
          </div>

          {/* KPIs */}
          <div className="kpi-row">
            <div className="kpi-card">
              <div className="lbl">On Hand Stock</div>
              <div className="val text-lg">{detailStock.onHand}</div>
            </div>
            <div className="kpi-card">
              <div className="lbl">Available Stock</div>
              <div className="val text-lg text-emerald-700">{detailStock.available}</div>
            </div>
            {isFg ? (
              <>
                <div className="kpi-card">
                  <div className="lbl">Std Cycle Time</div>
                  <div className="val text-lg">{cycle > 0 ? `${cycle}s` : '—'}</div>
                </div>
                <div className="kpi-card">
                  <div className="lbl">Est. Hourly Output</div>
                  <div className="val text-lg text-emerald-700">{hourlyOutput > 0 ? `${hourlyOutput} pcs/h` : '—'}</div>
                </div>
              </>
            ) : item.type === 'Raw Material' || item.type === 'Regrind' ? (
              <>
                <div className="kpi-card">
                  <div className="lbl">Melt Flow Index</div>
                  <div className="val text-lg font-mono">{item.mfi || '—'}</div>
                </div>
                <div className="kpi-card">
                  <div className="lbl">Density Gradient</div>
                  <div className="val text-lg font-mono text-emerald-700">{item.density || '—'}</div>
                </div>
              </>
            ) : item.type === 'Masterbatch' || item.type === 'Colorant' || item.type === 'Additive' ? (
              <>
                <div className="kpi-card">
                  <div className="lbl">Target Dosage (LDR)</div>
                  <div className="val text-lg font-mono">{item.masterbatchDosage || '—'}</div>
                </div>
                <div className="kpi-card">
                  <div className="lbl">Heat Stability</div>
                  <div className="val text-lg font-mono text-emerald-700">{item.heatStability || '—'}</div>
                </div>
              </>
            ) : item.type === 'Packaging Material' ? (
              <>
                <div className="kpi-card">
                  <div className="lbl">Box Dimensions</div>
                  <div className="val text-sm font-mono truncate">{item.boxDimensions || '—'}</div>
                </div>
                <div className="kpi-card">
                  <div className="lbl">Packaging Standard</div>
                  <div className="val text-sm font-semibold text-emerald-700 truncate">{item.packagingStandard || '—'}</div>
                </div>
              </>
            ) : (
              <>
                <div className="kpi-card">
                  <div className="lbl">Lead Time</div>
                  <div className="val text-lg font-mono">{item.leadTime || '—'}</div>
                </div>
                <div className="kpi-card">
                  <div className="lbl">Safety Stock</div>
                  <div className="val text-lg font-mono text-emerald-700">{item.safetyStock ? `${item.safetyStock} ${item.baseUOM || 'EA'}` : '0 EA'}</div>
                </div>
              </>
            )}
            <div className="kpi-card">
              <div className="lbl">BOM References</div>
              <div className="val text-lg">{itemBoms.length}</div>
            </div>
          </div>

          {/* Tabs Bar */}
          <div className="tabs">
            {tabs.map((tab) => (
              <div
                key={tab}
                className={`tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </div>
            ))}
          </div>

          {/* Tab 1: Overview */}
          {activeTab === 'Overview' && (
            <div className="space-y-5">
              {/* Dynamic Spec Header Card */}
              {isFg ? (
                <div className="p-5 bg-white rounded-2xl border border-blue-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-blue-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                        <Cpu className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#14213D]">
                          Finished Good &mdash; Injection Molding Tooling &amp; Process Parameters
                        </h3>
                        <p className="text-xs text-gray-500">
                          Core rheology, cycle timing, mold cavity metrics, and automatic shot weight balancing.
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      MOLD SPEC GATE
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs">
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-bold text-gray-500 block mb-1">Cycle Time (seconds) *</span>
                      <span className="font-mono text-base font-bold text-[#14213D]">{cycle > 0 ? `${cycle} sec` : '—'}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-bold text-gray-500 block mb-1">Part Weight (grams/pc) *</span>
                      <span className="font-mono text-base font-bold text-[#14213D]">{partWt > 0 ? `${partWt} g` : (item as any).part_weight_grams ? `${(item as any).part_weight_grams} g` : '0 g'}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-bold text-gray-500 block mb-1">Mold Cavities (count) *</span>
                      <span className="font-mono text-base font-bold text-[#14213D]">{cavities > 0 ? `${cavities} cav` : '—'}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-bold text-gray-500 block mb-1">Runner Weight (grams) *</span>
                      <span className="font-mono text-base font-bold text-[#14213D]">{runnerWt > 0 ? `${runnerWt} g` : '0 g'}</span>
                    </div>
                  </div>

                  {/* Live Formula Breakdown Card */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/70 via-emerald-50/50 to-teal-50/60 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        <strong className="text-[#14213D]">Calculated Shot Weight:</strong>
                        <span className="px-2.5 py-0.5 rounded-md bg-white border border-blue-200 font-mono font-bold text-blue-800">
                          {singleShotWt > 0 ? `${singleShotWt} g / pc shot` : '—'}
                        </span>
                        <span className="text-gray-400">&bull;</span>
                        <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 font-mono font-bold text-emerald-800">
                          {totalMoldShotWt > 0 ? `${totalMoldShotWt} g (Total ${cavities}-Cavity Shot)` : '—'}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-600 font-mono">
                        Formula: Part Weight ({partWt}g) + Runner Weight ({runnerWt}g) = {singleShotWt}g &bull; ({partWt}g &times; {cavities} Cavities) + {runnerWt}g = {totalMoldShotWt}g Total Mold Shot
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 pl-4 border-l border-blue-200/80">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Est. Hourly Output</span>
                      <span className="text-base font-mono font-bold text-emerald-700">{hourlyOutput > 0 ? `${hourlyOutput} pcs / hr` : '—'}</span>
                    </div>
                  </div>
                </div>
              ) : item.type === 'Raw Material' || item.type === 'Regrind' ? (
                <div className="p-5 bg-white rounded-2xl border border-emerald-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#14213D]">
                          Raw Polymer Feedstock &mdash; Rheology &amp; Technical Parameters
                        </h3>
                        <p className="text-xs text-gray-500">
                          Resin grade, melt flow rate, density index, and moisture pre-drying limits.
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      RESIN FEEDSTOCK
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs">
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-bold text-gray-500 block mb-1">Polymer Grade *</span>
                      <span className="font-mono text-base font-bold text-[#14213D]">{item.polymerGrade || item.resinType || '—'}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-bold text-gray-500 block mb-1">Melt Flow Index (MFI) *</span>
                      <span className="font-mono text-base font-bold text-[#14213D]">{item.mfi || '—'}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-bold text-gray-500 block mb-1">Specific Density *</span>
                      <span className="font-mono text-base font-bold text-[#14213D]">{item.density || '—'}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-bold text-gray-500 block mb-1">Moisture Limit</span>
                      <span className="font-mono text-base font-bold text-emerald-700">{item.moistureLimit || '—'}</span>
                    </div>
                  </div>
                </div>
              ) : item.type === 'Masterbatch' || item.type === 'Colorant' || item.type === 'Additive' ? (
                <div className="p-5 bg-white rounded-2xl border border-purple-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-purple-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#14213D]">
                          Colorant &amp; Additive Masterbatch Formulation
                        </h3>
                        <p className="text-xs text-gray-500">
                          Target let-down ratio (LDR), carrier resin compatibility, and heat stability thresholds.
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200">
                      COLOR MASTERBATCH
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs">
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-bold text-gray-500 block mb-1">Carrier Resin *</span>
                      <span className="font-mono text-base font-bold text-[#14213D]">{item.carrierResin || '—'}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-bold text-gray-500 block mb-1">Shade / Color Name *</span>
                      <span className="font-mono text-base font-bold text-[#14213D]">{item.color || '—'}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-bold text-gray-500 block mb-1">Target Dosage (LDR %) *</span>
                      <span className="font-mono text-base font-bold text-[#14213D]">{item.masterbatchDosage || '—'}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-bold text-gray-500 block mb-1">Heat Stability</span>
                      <span className="font-mono text-base font-bold text-purple-700">{item.heatStability || '—'}</span>
                    </div>
                  </div>
                </div>
              ) : item.type === 'Packaging Material' ? (
                <div className="p-5 bg-white rounded-2xl border border-amber-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-amber-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#14213D]">
                          Packaging Engineering &amp; Logistics Specifications
                        </h3>
                        <p className="text-xs text-gray-500">
                          Box standards, dimensional tolerances, palletizing schemes, and burst test ratings.
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      PACKAGING SPEC
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs">
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-bold text-gray-500 block mb-1">Packaging Standard *</span>
                      <span className="font-mono text-base font-bold text-[#14213D]">{item.packagingStandard || '—'}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-bold text-gray-500 block mb-1">Box Dimensions (LxWxH) *</span>
                      <span className="font-mono text-base font-bold text-[#14213D]">{item.boxDimensions || '—'}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-bold text-gray-500 block mb-1">Pallet Pattern</span>
                      <span className="font-mono text-base font-bold text-[#14213D]">{item.palletPattern || '—'}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-bold text-gray-500 block mb-1">ECT / Bursting Strength</span>
                      <span className="font-mono text-base font-bold text-amber-700">{item.burstingStrength || '—'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-700 text-white flex items-center justify-center">
                        <Sliders className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#14213D]">
                          Plant Asset Maintenance &amp; Equipment Fitment
                        </h3>
                        <p className="text-xs text-gray-500">
                          Machine fitment, manufacturer part numbers, PM intervals, and criticality flags.
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      PLANT ASSET
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs">
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-bold text-gray-500 block mb-1">Machine Fitment *</span>
                      <span className="font-mono text-base font-bold text-[#14213D]">{item.moldToolId || '—'}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-bold text-gray-500 block mb-1">OEM Part Number *</span>
                      <span className="font-mono text-base font-bold text-[#14213D]">{item.code}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-bold text-gray-500 block mb-1">PM Cycle</span>
                      <span className="font-mono text-base font-bold text-[#14213D]">{item.pmInterval || '—'}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <span className="text-[11px] font-bold text-gray-500 block mb-1">Criticality Flag</span>
                      <span className="font-mono text-base font-bold text-slate-700">{item.criticality || 'Standard'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Classification & Properties */}
              <div className="detail-grid">
                <div className="panel p-5 space-y-4">
                  <div className="section-title">
                    {isFg ? 'Classification & Polymer Properties' : 'Item Classification & Technical Properties'}
                  </div>
                  <div className="kv-grid">
                    <div className="kv"><label>Item Type</label><div className="v">{item.type}</div></div>
                    <div className="kv"><label>Plant / Unit</label><div className="v font-semibold text-[#14213D] flex items-center gap-1"><Factory className="w-3.5 h-3.5 text-[#0F8B8D]" />{item.plant || '—'}</div></div>
                    <div className="kv"><label>Material Family</label><div className="v">{item.cat || '—'}</div></div>
                    <div className="kv"><label>Base UOM</label><div className="v mono">{item.baseUOM || 'PCS'}</div></div>
                    {isFg ? (
                      <>
                        <div className="kv"><label>Resin Grade</label><div className="v">{item.resinType || item.polymerGrade || '—'}</div></div>
                        <div className="kv"><label>Melt Flow Index</label><div className="v mono">{item.mfi || '—'}</div></div>
                        <div className="kv"><label>Density</label><div className="v mono">{item.density || '—'}</div></div>
                        <div className="kv"><label>Mold Tool ID</label><div className="v mono font-bold text-[#0F8B8D]">{item.moldToolId || '—'}</div></div>
                      </>
                    ) : item.type === 'Raw Material' || item.type === 'Regrind' ? (
                      <>
                        <div className="kv"><label>Resin / Grade</label><div className="v">{item.polymerGrade || item.resinType || '—'}</div></div>
                        <div className="kv"><label>Melt Flow Index</label><div className="v mono">{item.mfi || '—'}</div></div>
                        <div className="kv"><label>Density</label><div className="v mono">{item.density || '—'}</div></div>
                        <div className="kv"><label>Moisture Limit</label><div className="v mono text-emerald-700">{item.moistureLimit || '—'}</div></div>
                      </>
                    ) : item.type === 'Masterbatch' || item.type === 'Colorant' || item.type === 'Additive' ? (
                      <>
                        <div className="kv"><label>Carrier Resin</label><div className="v">{item.carrierResin || '—'}</div></div>
                        <div className="kv"><label>Color / Shade</label><div className="v">{item.color || '—'}</div></div>
                        <div className="kv"><label>Target LDR Dosage</label><div className="v mono">{item.masterbatchDosage || '—'}</div></div>
                        <div className="kv"><label>Heat Stability</label><div className="v mono text-purple-700">{item.heatStability || '—'}</div></div>
                      </>
                    ) : item.type === 'Packaging Material' ? (
                      <>
                        <div className="kv"><label>Packaging Spec</label><div className="v">{item.packagingStandard || '—'}</div></div>
                        <div className="kv"><label>Box Dimensions</label><div className="v mono">{item.boxDimensions || '—'}</div></div>
                        <div className="kv"><label>HSN / SAC Code</label><div className="v mono">{item.hsnCode || '—'}</div></div>
                        <div className="kv"><label>Storage Form</label><div className="v">{item.storageForm || '—'}</div></div>
                      </>
                    ) : (
                      <>
                        <div className="kv"><label>Machine Fitment</label><div className="v mono">{item.moldToolId || '—'}</div></div>
                        <div className="kv"><label>OEM Part Number</label><div className="v mono">{item.code}</div></div>
                        <div className="kv"><label>Maintenance Interval</label><div className="v">{item.pmInterval || '—'}</div></div>
                        <div className="kv"><label>Critical Spare</label><div className="v font-bold text-amber-700">{item.criticality || 'Standard'}</div></div>
                      </>
                    )}
                    <div className="kv"><label>Country of Origin</label><div className="v">{item.countryOrigin || '—'}</div></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="side-block">
                    <h4>Planning &amp; Inventory Parameters</h4>
                    <div className="side-row"><span>Reorder Level</span><span className="mono">{item.reorderLevel ? `${item.reorderLevel} ${item.baseUOM || 'PCS'}` : '—'}</span></div>
                    <div className="side-row"><span>Safety Stock</span><span className="mono">{item.safetyStock ? `${item.safetyStock} ${item.baseUOM || 'PCS'}` : '—'}</span></div>
                    <div className="side-row"><span>Lead Time</span><span>{item.leadTime || '—'}</span></div>
                    <div className="side-row"><span>Preferred Supplier</span><span>{item.supplier || '—'}</span></div>
                    <div className="side-row">
                      <span>{isFg ? 'Post-Molding Destination' : 'Receiving Inspection Gate'}</span>
                      <span className="font-bold text-[#0F8B8D]">{isFg ? (item.routingDestination || item.wh || 'FG Store') : (item.wh || 'RM Store')}</span>
                    </div>
                  </div>

                  <div className="side-block">
                    <h4>Quality Controls</h4>
                    <div className="side-row"><span>Incoming Inspection</span><span>{item.qc ? 'Required' : 'Not required'}</span></div>
                    <div className="side-row"><span>Lot Controlled</span><span>{item.lot ? 'Yes' : 'No'}</span></div>
                    <div className="side-row"><span>COA / TDS Required</span><span>{item.qc ? 'Yes' : 'No'}</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Inventory */}
          {activeTab === 'Inventory' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border bg-emerald-50/80 border-emerald-200 text-emerald-900 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="text-xs font-bold flex items-center gap-2">
                    <span>{isFg ? 'Default Post-Molding Store Routing:' : 'Default Inbound Receiving Location:'}</span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-white border shadow-2xs">
                      {isFg ? `${item.routingDestination || 'DOL'} → ${item.wh || 'FG-WH-01'}` : `${item.wh || 'RM-WH-01'} (IQC Accepted)`}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1">
                    {isFg
                      ? `Output from injection molding machine auto-backflushes into ${item.wh || 'FG-WH-01'}.`
                      : `Inbound materials are received, batch-tested, and routed to ${item.wh || 'RM-WH-01'}.`}
                  </div>
                </div>
                <div className="text-xs font-mono font-bold px-3 py-1.5 rounded-lg bg-white border">
                  Target Store: {item.wh || (isFg ? 'FG-WH-01' : 'RM-WH-01')}
                </div>
              </div>

              <div className="panel bg-white border border-[#E4E0D6] rounded-xl overflow-hidden shadow-xs">
                <div className="panel-head p-4 bg-[#F9F8F5] border-b border-[#E4E0D6] flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#14213D]">Warehouse Stock by Lot</h3>
                  <span className="text-xs text-gray-500 font-mono">
                    Total Lots: {itemLots.length} &bull; On Hand: {detailStock.onHand}
                  </span>
                </div>
                <div className="panel-body p-0">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#F6F4EF] border-b border-[#E4E0D6] text-gray-600 font-semibold">
                        <th className="py-2.5 px-3">Lot Number</th>
                        <th className="py-2.5 px-3">Warehouse</th>
                        <th className="py-2.5 px-3">Bin</th>
                        <th className="py-2.5 px-3 text-right">Available Qty</th>
                        <th className="py-2.5 px-3">Receipt / Mfg</th>
                        <th className="py-2.5 px-3">Expiry</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {itemLots.length > 0 ? (
                        itemLots.map((lot, idx) => (
                          <tr key={lot.lotNumber || idx} className="hover:bg-gray-50">
                            <td className="py-2.5 px-3 font-mono font-bold text-[#0F8B8D]">{lot.lotNumber}</td>
                            <td className="py-2.5 px-3">{whStockItem?.primaryWarehouse || item.wh || 'WH-01'}</td>
                            <td className="py-2.5 px-3 font-mono text-xs text-[#0F8B8D] font-bold">{lot.storageBin || whStockItem?.primaryBin || '—'}</td>
                            <td className="py-2.5 px-3 text-right font-semibold">{lot.availableQuantityKg || lot.initialQuantityKg || 0} {lot.uom || item.baseUOM || 'PCS'}</td>
                            <td className="py-2.5 px-3 font-mono">{lot.receiptDate || '—'}</td>
                            <td className="py-2.5 px-3 font-mono">{lot.expiryDate || '—'}</td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`badge ${(lot.status as any) === 'released' || (lot.status as any) === 'available' ? 'green' : (lot.status as any) === 'quarantine' ? 'amber' : 'gray'}`}>
                                {lot.status || 'available'}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-gray-500 bg-gray-50/50">
                            <div className="flex flex-col items-center justify-center gap-1.5">
                              <Package className="w-5 h-5 text-gray-400" />
                              <span className="font-semibold text-gray-700">No active inventory lots or batches recorded for {item.code}.</span>
                              <span className="text-[11px] text-gray-500">
                                Current Physical Balance: {detailStock.onHand} | Available: {detailStock.available} | Default Store: {item.wh || 'General Store'}
                              </span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Purchasing */}
          {activeTab === 'Purchasing' && (
            <div className="space-y-5">
              <div className="p-5 bg-white rounded-2xl border border-[#E4E0D6] shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center">
                      <Factory className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#14213D]">
                        Procurement &amp; Vendor Supply Chain Parameters
                      </h3>
                      <p className="text-xs text-gray-500">
                        Primary vendor, lead times, purchase pricing, and reorder thresholds.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPurchasingSpecsItem(item);
                      setIsPurchasingSpecsModalOpen(true);
                    }}
                    className="btn btn-sm btn-primary flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit Purchasing Specs
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-[11px] font-bold text-gray-500 block mb-1">Preferred Supplier</span>
                    <span className="font-semibold text-sm text-[#14213D]">{item.supplier || '—'}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-[11px] font-bold text-gray-500 block mb-1">Standard Purchase Cost</span>
                    <span className="font-mono text-base font-bold text-[#0F8B8D]">₹{(Number(item.standardCost || item.cost || 0)).toFixed(2)}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-[11px] font-bold text-gray-500 block mb-1">Procurement Lead Time</span>
                    <span className="font-mono text-sm font-bold text-[#14213D]">{item.leadTime || '—'}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-[11px] font-bold text-gray-500 block mb-1">Target Receiving Store</span>
                    <span className="font-mono text-sm font-bold text-[#14213D]">{item.wh || '—'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs pt-2">
                  <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200">
                    <span className="text-[11px] font-bold text-gray-500 block mb-1">Reorder Level (ROP)</span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-lg font-bold text-[#14213D]">{item.reorderLevel || '—'}</span>
                      <span className="text-gray-500 font-semibold">{item.reorderLevel ? (item.baseUOM || 'PCS') : ''}</span>
                    </div>
                  </div>
                  <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200">
                    <span className="text-[11px] font-bold text-gray-500 block mb-1">Safety Buffer Stock</span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-lg font-bold text-emerald-700">{item.safetyStock || '—'}</span>
                      <span className="text-gray-500 font-semibold">{item.safetyStock ? (item.baseUOM || 'PCS') : ''}</span>
                    </div>
                  </div>
                  <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200">
                    <span className="text-[11px] font-bold text-gray-500 block mb-1">HSN / SAC Code</span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-lg font-bold text-slate-800">{item.hsnCode || '—'}</span>
                      <span className="text-gray-500 font-semibold">{item.hsnCode ? '(18% GST)' : ''}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Quality */}
          {activeTab === 'Quality' && (
            <div className="space-y-5">
              <div className="p-5 bg-white rounded-2xl border border-[#E4E0D6] shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#14213D]">
                        Quality Assurance &amp; Inbound Inspection Standards
                      </h3>
                      <p className="text-xs text-gray-500">
                        IQC inspection requirements, CoA verification, lot controls, and defect thresholds.
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {item.qc ? 'IQC MANDATORY' : 'IQC EXEMPT'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-[11px] font-bold text-gray-500 block mb-1">Inbound QC Inspection</span>
                    <span className={`font-semibold text-sm ${item.qc ? 'text-emerald-700 font-bold' : 'text-gray-600'}`}>
                      {item.qc ? 'Required (Mandatory)' : 'Exempt'}
                    </span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-[11px] font-bold text-gray-500 block mb-1">Lot / Batch Traceability</span>
                    <span className="font-semibold text-sm text-[#14213D]">
                      {item.lot ? 'Active Lot Tracking' : 'Non-Lot Tracked'}
                    </span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-[11px] font-bold text-gray-500 block mb-1">CoA / TDS Requirement</span>
                    <span className="font-semibold text-sm text-blue-700">
                      {item.qc ? 'Mandatory per batch' : 'Optional'}
                    </span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-[11px] font-bold text-gray-500 block mb-1">Inspection Standard</span>
                    <span className="font-mono text-sm font-semibold text-slate-800">{(item as any).samplingPlan || '—'}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2 text-xs">
                  <h4 className="font-bold text-[#14213D] text-xs">Inspection Checkpoints &amp; Acceptance Limits</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                      <span className="text-gray-500 block text-[11px]">Specific Gravity / Density</span>
                      <strong className="text-sm font-mono text-[#14213D]">{item.density || '—'}</strong>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                      <span className="text-gray-500 block text-[11px]">Melt Flow Index (MFI)</span>
                      <strong className="text-sm font-mono text-[#14213D]">{item.mfi || '—'}</strong>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                      <span className="text-gray-500 block text-[11px]">Moisture Limit</span>
                      <strong className="text-sm font-mono text-emerald-700">{item.moistureLimit || '—'}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Dynamic Technical Specs (Cycle Time & Mold Spec for FG vs Material & Rheology for non-FG) */}
          {(activeTab === 'Cycle Time & Mold Spec' || activeTab === 'Material & Rheology Specs') && (
            <div className="space-y-5">
              {isFg ? (
                <div className="p-5 bg-white rounded-2xl border border-[#E4E0D6] shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-[#14213D]">Standard Cycle Time Study &amp; Rheology Balance</h3>
                      <p className="text-xs text-gray-500">Injection molding cavity timing, cooling metrics &amp; shot breakdown.</p>
                    </div>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => setQuickModifyItem(item)}
                    >
                      Edit Tooling Specs
                    </button>
                  </div>

                  <div className="flex items-baseline gap-3 pt-2">
                    <span className="font-mono text-4xl font-bold text-[#14213D]">{cycle > 0 ? cycle : '—'}</span>
                    <span className="text-sm font-semibold text-gray-500">sec / cycle</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <span className="text-gray-500 block">Mold Tool Cavities</span>
                      <strong className="text-sm text-[#14213D]">{cavities > 0 ? `${cavities} Cavities` : '—'}</strong>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <span className="text-gray-500 block">Single Part Weight</span>
                      <strong className="text-sm text-[#14213D]">{partWt > 0 ? `${partWt} grams` : '—'}</strong>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <span className="text-gray-500 block">Runner &amp; Sprue Weight</span>
                      <strong className="text-sm text-[#14213D]">{runnerWt > 0 ? `${runnerWt} grams` : '0 grams'}</strong>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <span className="text-gray-500 block">Total Shot Weight</span>
                      <strong className="text-sm text-emerald-700">{totalMoldShotWt > 0 ? `${totalMoldShotWt} grams` : '—'}</strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-5 bg-white rounded-2xl border border-[#E4E0D6] shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-[#14213D]">Material Rheology &amp; Technical Data Sheet</h3>
                      <p className="text-xs text-gray-500">Melt flow behavior, density, drying requirements, and processing conditions.</p>
                    </div>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => setQuickModifyItem(item)}
                    >
                      Edit Material Specs
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <span className="text-gray-500 block">Melt Flow Index (MFI)</span>
                      <strong className="text-sm text-[#14213D]">{item.mfi || '—'}</strong>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <span className="text-gray-500 block">Specific Gravity / Density</span>
                      <strong className="text-sm text-[#14213D]">{item.density || '—'}</strong>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <span className="text-gray-500 block">Moisture Limit</span>
                      <strong className="text-sm text-[#14213D]">{item.moistureLimit || '—'}</strong>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <span className="text-gray-500 block">Recommended Melt Temp</span>
                      <strong className="text-sm text-emerald-700">{item.meltTemp || '210°C – 240°C'}</strong>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs space-y-1">
                    <strong className="text-emerald-900 block font-bold">Resin Handling &amp; Drying Requirement:</strong>
                    <p className="text-emerald-800">
                      Pre-dry for hygroscopic polymers (e.g., PA6, PET, ABS, PC) at 80°C for 3-4 hours prior to injection hopper loading. For non-hygroscopic polyolefins (PP/HDPE), hopper loading with dehumidified air is recommended.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 7: Documents (Live Uploaded PC Documents) */}
          {activeTab === 'Documents' && (
            <div className="p-5 bg-white rounded-2xl border border-[#E4E0D6] shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#E4E0D6] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#E8622C]" /> Attached Technical Drawings &amp; Documents
                  </h3>
                  <p className="text-xs text-gray-500">2D/3D part drawings, mold setup sheets, TDS, and quality inspection specs.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setQuickModifyItem(item)}
                  className="btn btn-sm btn-primary flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" /> Attach Document from PC
                </button>
              </div>

              {(item.documents && item.documents.length > 0) ? (
                <div className="overflow-x-auto border border-[#E4E0D6] rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#F6F4EF] text-[#14213D] border-b border-[#E4E0D6] font-semibold">
                        <th className="py-2.5 px-3">Document Name</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Version</th>
                        <th className="py-2.5 px-3">Effective Date</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {item.documents.map((doc, idx) => (
                        <tr key={doc.id || idx} className="hover:bg-gray-50">
                          <td className="py-2.5 px-3 font-semibold text-[#14213D] flex items-center gap-2">
                            <Paperclip className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                            <span>{doc.name}</span>
                            <span className="text-[10px] text-gray-400 font-mono">({doc.fileSize || '2.4 MB'})</span>
                          </td>
                          <td className="py-2.5 px-3 text-gray-600">{doc.type}</td>
                          <td className="py-2.5 px-3 font-mono">{doc.version || 'v1.0'}</td>
                          <td className="py-2.5 px-3 font-mono text-gray-600">{doc.uploadedDate || '—'}</td>
                          <td className="py-2.5 px-3 text-right">
                            {doc.link && (
                              <a
                                href={doc.link}
                                download={doc.name}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold"
                              >
                                <Download className="w-3.5 h-3.5" /> Download
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10 px-4 bg-[#F9F8F5] rounded-xl border border-[#E4E0D6] space-y-3">
                  <FileText className="w-8 h-8 text-gray-400 mx-auto" />
                  <div>
                    <h4 className="font-bold text-sm text-[#14213D]">No technical documents attached yet for {item.code}.</h4>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto mt-0.5">
                      Upload part drawings (STEP/DWG/PDF), mold setup sheets, or packaging specifications.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setQuickModifyItem(item)}
                    className="btn btn-sm btn-primary inline-flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" /> Attach Document from PC
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab 6: BOM Usage */}
          {activeTab === 'BOM usage' && (
            <div className="panel bg-white border border-[#E4E0D6] rounded-xl overflow-hidden shadow-xs">
              <div className="panel-head p-4 bg-[#F9F8F5] border-b border-[#E4E0D6] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#14213D]">Manufacturing BOM &amp; Recipe Records</h3>
                  <p className="text-xs text-gray-500">Multi-level polymer formulas, routing operations, and standard cost rollups.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenMfgBomWizard(item)}
                  className="btn btn-sm btn-primary flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Create Manufacturing BOM
                </button>
              </div>
              <div className="panel-body p-0">
                {itemBoms.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-[#F6F4EF] border-b border-[#E4E0D6] text-gray-600 font-semibold">
                          <th className="py-2.5 px-3">BOM ID</th>
                          <th className="py-2.5 px-3">Parent Product</th>
                          <th className="py-2.5 px-3">Version</th>
                          <th className="py-2.5 px-3">Process</th>
                          <th className="py-2.5 px-3">Std Unit Cost</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {itemBoms.map((b) => (
                          <tr
                            key={b.id}
                            onClick={() => onNavigate('bomDetail', b.id)}
                            className="hover:bg-gray-50 cursor-pointer"
                          >
                            <td className="py-2.5 px-3 font-mono font-bold text-[#0F8B8D]">{b.id}</td>
                            <td className="py-2.5 px-3 font-semibold text-[#14213D]">{b.parentName}</td>
                            <td className="py-2.5 px-3 font-mono">{b.version}</td>
                            <td className="py-2.5 px-3 text-gray-600">{b.processType || 'Injection Molding'}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-gray-800">
                              ₹{(b.standardCost || 0).toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3">{renderApprovalBadge(b.status)}</td>
                            <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => onNavigate('bomDetail', b.id)}
                                className="text-xs text-[#0F8B8D] font-bold hover:underline"
                              >
                                Open Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-10 px-4 space-y-3 bg-[#F9F8F5]">
                    <div className="w-12 h-12 rounded-full bg-white border border-[#E4E0D6] text-gray-400 flex items-center justify-center mx-auto shadow-xs">
                      <Layers className="w-6 h-6 text-[#0F8B8D]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#14213D]">No Manufacturing BOM exists for {item.code}.</h4>
                      <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
                        Configure multi-component resin percentages, secondary degating operations, machine routing, and live cost rollups.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenMfgBomWizard(item)}
                      className="btn btn-sm btn-primary flex items-center gap-1.5 mx-auto shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" /> Create Manufacturing BOM
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 8: Barcode / Label */}
          {activeTab === 'Barcode / Label' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="panel p-5">
                <h3 className="font-bold text-sm text-[#14213D] mb-4">Label Specifications</h3>
                <div className="space-y-2 text-xs">
                  <div className="side-row"><span>Symbology</span><span>QR Code + Code 128</span></div>
                  <div className="side-row"><span>Lot Number Included</span><span>{item.lot ? 'Yes' : 'No'}</span></div>
                  <div className="side-row"><span>Warehouse Location Tag</span><span>Yes ({item.wh || 'STORE'})</span></div>
                  <div className="side-row"><span>Hazard / Moisture Warning</span><span>{item.hazardous ? 'Hazardous' : 'Standard'}</span></div>
                </div>
                <button
                  className="btn btn-sm btn-primary w-full mt-4"
                  onClick={() => showToast(`Sent label for ${item.code} to Zebra printer`)}
                >
                  <Printer className="w-3.5 h-3.5" /> Print 4x6" Thermal Label
                </button>
              </div>

              <div className="panel p-5 flex flex-col items-center justify-center bg-[#F6F4EF]/60 border-dashed border-2 border-[#E4E0D6]">
                <div className="p-4 bg-white border border-[#E4E0D6] rounded-lg shadow-sm w-64 text-center font-mono text-[11px] space-y-1.5">
                  <div className="font-bold font-['Space_Grotesk'] text-xs">DATASTOCK PLASTICS</div>
                  <div className="text-[10px] text-[#6B7280] border-b border-[#E4E0D6] pb-1">{item.plant ? item.plant.toUpperCase() : 'PLANT 01'}</div>
                  <div className="font-bold text-xs pt-1">{item.code}</div>
                  <div className="text-[10px] truncate">{item.name}</div>
                  <div className="text-[10px]">{isFg ? `MOLD: ${item.moldToolId || '—'}` : `RESIN: ${item.resinType || item.polymerGrade || '—'}`}</div>
                  <div className="text-[10px]">QTY: {detailStock.onHand} &middot; {item.wh || 'STORE'}</div>
                  <div className="py-2 text-2xl tracking-widest text-[#14213D]">
                    ||||| | ||||| | ||
                  </div>
                  <div className="text-[9px] text-[#9CA3AF]">* {item.code} *</div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 9: Approval */}
          {activeTab === 'Approval' && (
            <ItemApprovalTab
              item={item}
              currentUser={currentUser}
              onApprove={handleApproveItem}
              onReject={handleRejectItem}
              onSubmitForApproval={handleSubmitForApproval}
              canApproveItem={canApproveItem}
              isSuperAdmin={isSuperAdmin}
            />
          )}

          {/* Tab 10: Audit History */}
          {activeTab === 'Audit history' && (
            <ItemAuditHistoryTab
              item={item}
              onOpenAuditVault={() => {
                setAuditTarget({ type: 'ITEM_MASTER', code: item.code, name: item.name });
                setIsAuditModalOpen(true);
              }}
            />
          )}
        </div>
      );
    }

  /* ----------------------------------------------------
     BOM / FORMULA MASTER LIST & DETAIL
  ---------------------------------------------------- */
  if (view === 'bomList') {
    const openCreateBomModal = () => {
      if (!isSuperAdmin && !canCreateBom) {
        showToast('Admin permission required to create BOM recipes.');
        return;
      }
      const fgItems = items.filter(
        (i) =>
          (i.type === 'Finished Good' || (i.type as string) === 'Finished Goods') &&
          (i.approval === 'approved' || i.status === 'active')
      );
      let parent = fgItems.length > 0 ? fgItems[0].code : '';
      let version = 'v1';
      const handleSave = () => {
        const parentItem = items.find((i) => i.code === parent);
        const rawMaterials = items.filter(
          (i) =>
            (i.type === 'Raw Material' || i.type === 'Masterbatch') &&
            (i.approval === 'approved' || i.status === 'active')
        );
        const lines = rawMaterials.length > 0
          ? rawMaterials.slice(0, 2).map((rm) => ({
              item: rm.code,
              name: rm.name,
              qty: 1,
              uom: rm.baseUOM || 'KG',
              scrap: 0,
              cost: 0,
            }))
          : [];

        const newBom: BomMaster = {
          id: `BOM-${1050 + boms.length}`,
          parent: parent || 'NEW-FG-RECIPE',
          parentName: parentItem?.name || parent || 'New Product Recipe',
          version,
          status: 'released',
          updated: 'Today',
          lines,
        };
        onCreateBom(newBom);
        closeDrawer();
        showToast(`BOM ${newBom.id} created for ${newBom.parentName}`);
      };

      openDrawer(
        'Create New BOM / Recipe',
        <div className="space-y-4">
          <div className="field">
            <label>Parent Finished Good</label>
            <select defaultValue={parent} onChange={(e) => (parent = e.target.value)}>
              {fgItems.map((i) => (
                <option key={i.code} value={i.code}>{i.code} &mdash; {i.name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Version Tag</label>
            <input defaultValue={version} onChange={(e) => (version = e.target.value)} />
          </div>
        </div>,
        <div className="flex justify-end gap-2 w-full">
          <button className="btn btn-sm btn-ghost" onClick={closeDrawer}>Cancel</button>
          <button className="btn btn-sm btn-primary" onClick={handleSave}>Create BOM</button>
        </div>
      );
    };

    return (
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-wider text-[#0F8B8D] font-bold">
              Master Data &middot; Engineering
            </div>
            <h1 className="text-xl font-bold text-[#14213D]">BOM / Formula Master</h1>
            <p className="text-xs text-[#6B7280]">
              Multi-level recipes, resin, masterbatch and regrind blending ratios.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn btn-sm btn-primary flex items-center gap-1.5 shadow-sm"
              onClick={() => {
                if (!isSuperAdmin && !canCreateBom) {
                  showToast('Admin permission required to create/modify Manufacturing BOMs.');
                  return;
                }
                const defaultParent = items.find(
                  (i) =>
                    ((i.type as string) === 'Finished Goods' || i.type === 'Finished Good') &&
                    (i.approval === 'approved' || i.status === 'active')
                ) || null;
                if (defaultParent) {
                  handleOpenMfgBomWizard(defaultParent);
                } else {
                  showToast('Please approve a Finished Good item first in Item Master before building a BOM.');
                }
              }}
            >
              <Layers className="w-3.5 h-3.5" /> Create Manufacturing BOM
            </button>
            <button className="btn btn-sm btn-ghost border-[#E4E0D6]" onClick={openCreateBomModal}>
              <Plus className="w-3.5 h-3.5" /> Quick BOM
            </button>
          </div>
        </div>

        <div className="kpi-row">
          <div className="kpi-card"><div className="lbl">Total BOMs</div><div className="val">{boms.length}</div></div>
          <div className="kpi-card"><div className="lbl">Released</div><div className="val">{boms.filter((b) => b.status === 'released').length}</div></div>
          <div className="kpi-card"><div className="lbl">Under Review</div><div className="val">{boms.filter((b) => b.status === 'under_review').length}</div></div>
          <div className="kpi-card"><div className="lbl">Drafts</div><div className="val">{boms.filter((b) => b.status === 'draft').length}</div></div>
        </div>

        <div className="panel">
          <table>
            <thead>
              <tr>
                <th>BOM ID</th>
                <th>Parent Product</th>
                <th>Version</th>
                <th>Lines</th>
                <th>Rollup Cost</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {boms.length > 0 ? (
                boms.map((b) => {
                  const totalCost = (b.lines || []).reduce((s, l) => s + (l.cost || 0), 0);
                  return (
                    <tr key={b.id} onClick={() => onNavigate('bomDetail', b.id)}>
                      <td><span className="cell-code">{b.id}</span></td>
                      <td className="cell-name"><b>{b.parentName}</b><div className="cell-sub">{b.parent}</div></td>
                      <td>{b.version}</td>
                      <td>{(b.lines || []).length} components</td>
                      <td className="font-mono font-bold">₹{totalCost.toFixed(2)}</td>
                      <td>{renderApprovalBadge(b.status)}</td>
                      <td className="mono text-xs text-[#6B7280]">{b.updated}</td>
                      <td>
                        <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="row-ic danger"
                            onClick={() => {
                              if (!isSuperAdmin && !canEditBom) {
                                showToast('Admin permission required to delete BOM records.');
                                return;
                              }
                              openConfirm(`Delete ${b.id}?`, `Delete recipe for ${b.parentName}?`, () => {
                                onDeleteBom(b.id);
                                showToast(`BOM ${b.id} deleted`);
                              });
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-xs text-[#6B7280]">
                    No Bill of Materials configured yet. Click 'Create Manufacturing BOM' to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------
     BOM DETAIL VIEW
  ---------------------------------------------------- */
  if (view === 'bomDetail') {
    const bom = boms.find((b) => b.id === selectedId) || (boms.length > 0 ? boms[0] : null);
    if (!bom) {
      return (
        <div className="space-y-5">
          <div className="back-link" onClick={() => onNavigate('bomList')}>
            <ArrowLeft className="w-3.5 h-3.5" /> Back to BOM Master
          </div>
          <div className="p-12 text-center bg-white rounded-xl border border-[#E4E0D6]">
            <h3 className="text-sm font-bold text-[#14213D] mb-1">BOM Not Found</h3>
            <p className="text-xs text-[#6B7280] mb-4">The requested Bill of Materials record does not exist.</p>
            <button className="btn btn-sm btn-primary" onClick={() => onNavigate('bomList')}>
              Return to BOM List
            </button>
          </div>
        </div>
      );
    }
    const totalCost = (bom.lines || []).reduce((s, l) => s + (l.cost || 0), 0);

    return (
      <div className="space-y-5">
        <div className="back-link" onClick={() => onNavigate('bomList')}>
          <ArrowLeft className="w-3.5 h-3.5" /> Back to BOM Master
        </div>

        <div className="detail-header">
          <div className="dh-left">
            <div className="item-thumb" style={{ background: 'linear-gradient(135deg, var(--teal), #12a3a5)' }}>
              🏷
            </div>
            <div>
              <div className="dh-title">
                <h2>{bom.parentName}</h2>
                {renderApprovalBadge(bom.status)}
              </div>
              <div className="dh-meta">
                <div className="m">BOM ID: <b>{bom.id}</b></div>
                <div className="m">Version: <b>{bom.version}</b></div>
                <div className="m">Parent Item: <b>{bom.parent}</b></div>
                <div className="m">Last Updated: <b>{bom.updated}</b></div>
              </div>
            </div>
          </div>
          <div className="dh-actions">
            {bom.status !== 'released' && (
              <button
                className="btn btn-sm btn-primary"
                onClick={() => {
                  if (!isSuperAdmin && !canEditBom) {
                    showToast('Admin permission required to release BOM to production.');
                    return;
                  }
                  onUpdateBom({ ...bom, status: 'released' });
                  showToast(`BOM ${bom.id} approved & released`);
                }}
              >
                Release to Production
              </button>
            )}
          </div>
        </div>

        {/* Component Lines Table with Unique Formula Code and Core Material Summation */}
        {(() => {
          const recipeCode = bom.recipeCode || bom.formulaCode || masterDataGovernanceService.generateFormulaRecipeId(
            bom.parent || bom.id,
            bom.parentName,
            bom.version
          );
          const cleanVersion = (bom.version || '1.0').trim().replace(/^[vV]+/, '');
          
          const isAuxiliaryLine = (line: BomLine) => {
            const code = (line.item || '').toUpperCase();
            const cat = (line.category || '').toUpperCase();
            const uom = (line.uom || '').toUpperCase();
            return (
              code.startsWith('BOP-') ||
              code.startsWith('CON-') ||
              code.startsWith('PK-') ||
              code.startsWith('PCK-') ||
              cat.includes('PACK') ||
              cat.includes('BOUGHT') ||
              cat.includes('CONSUMABLE') ||
              cat.includes('HARDWARE') ||
              uom === 'PCS' ||
              uom === 'SET' ||
              uom === 'BOX' ||
              uom === 'ROLL'
            );
          };

          const getLineRoleBadge = (line: BomLine) => {
            const code = (line.item || '').toUpperCase();
            const cat = (line.category || '').toUpperCase();
            if (code.startsWith('PK-') || code.startsWith('PCK-') || cat.includes('PACK')) {
              return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">PCK &middot; Packaging</span>;
            }
            if (code.startsWith('BOP-') || cat.includes('BOUGHT') || cat.includes('HARDWARE')) {
              return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">BOP &middot; Bought Out</span>;
            }
            if (code.startsWith('CON-') || cat.includes('CONSUMABLE')) {
              return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">CON &middot; Consumable</span>;
            }
            if (code.startsWith('MB-')) {
              return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">MB &middot; Masterbatch</span>;
            }
            if (code.startsWith('AD-')) {
              return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">AD &middot; Additive</span>;
            }
            if (code.startsWith('RG-')) {
              return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">RG &middot; Regrind</span>;
            }
            return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">RM &middot; Core Resin</span>;
          };

          const coreMaterialLines = (bom.lines || []).filter((l) => !isAuxiliaryLine(l));
          const auxiliaryLines = (bom.lines || []).filter((l) => isAuxiliaryLine(l));

          const totalMaterialUnitQty = coreMaterialLines.reduce((sum, l) => sum + (Number(l.qty) || 0), 0);
          const totalMaterialBatchQty = totalMaterialUnitQty * (bom.batchSize || 1000);
          const materialUom = coreMaterialLines[0]?.uom || 'KG';

          return (
            <div className="space-y-4">
              {/* Top Formula Formulation Header Card */}
              <div className="p-4 bg-gradient-to-r from-blue-50/80 via-emerald-50/60 to-teal-50/70 border border-blue-200 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-100 pb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-blue-300 rounded-lg text-xs font-mono font-bold text-blue-900 shadow-2xs">
                      <Fingerprint className="w-3.5 h-3.5 text-blue-600" />
                      <span>RECIPE / FORMULA ID: {recipeCode}</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100/70 text-blue-800 border border-blue-200">
                      Linked to BOM {bom.id} (v{cleanVersion})
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 font-medium">
                    Batch Size: <strong className="text-[#14213D] font-mono">{bom.batchSize || 1000} {bom.baseUOM || 'PCS'}</strong>
                  </div>
                </div>

                {/* Summary Metrics: Core Material Sum (excluding BOP, CON, PCK) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 bg-white/95 rounded-lg border border-blue-100 shadow-2xs">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                      Core Material Sum Unit Qty
                    </span>
                    <span className="font-mono text-base font-bold text-blue-900">
                      {totalMaterialUnitQty.toFixed(4)} {materialUom} <span className="text-[10px] text-gray-400 font-normal">/ PC</span>
                    </span>
                  </div>
                  <div className="p-2.5 bg-white/95 rounded-lg border border-emerald-100 shadow-2xs">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                      Core Material Sum Batch Qty
                    </span>
                    <span className="font-mono text-base font-bold text-emerald-800">
                      {totalMaterialBatchQty.toFixed(2)} {materialUom} <span className="text-[10px] text-gray-400 font-normal">/ Batch</span>
                    </span>
                  </div>
                  <div className="p-2.5 bg-white/95 rounded-lg border border-teal-100 shadow-2xs">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                      Core Formulation Blend
                    </span>
                    <span className="font-mono text-base font-bold text-teal-800">
                      {coreMaterialLines.length} Material{coreMaterialLines.length !== 1 ? 's' : ''} (100%)
                    </span>
                  </div>
                  <div className="p-2.5 bg-white/95 rounded-lg border border-amber-100 shadow-2xs">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                      Excluded Auxiliaries
                    </span>
                    <span className="font-mono text-base font-bold text-amber-800">
                      {auxiliaryLines.length} Items (BOP/CON/PCK)
                    </span>
                  </div>
                </div>
              </div>

              {/* Recipe Lines Table */}
              <div className="panel bg-white border border-[#E4E0D6] rounded-xl overflow-hidden shadow-xs">
                <div className="panel-head p-4 bg-[#F9F8F5] border-b border-[#E4E0D6] flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#0F8B8D]" /> Formula &amp; Recipe Components ({bom.lines?.length || 0})
                  </h3>
                  <span className="text-xs font-mono font-bold text-[#E8622C]">Unit Material Cost: ₹{totalCost.toFixed(2)}</span>
                </div>
                <div className="panel-body p-0">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#F6F4EF] text-[#14213D] border-b border-[#E4E0D6] font-semibold">
                        <th className="py-2.5 px-3">Component Item</th>
                        <th className="py-2.5 px-3">Role / Classification</th>
                        <th className="py-2.5 px-3 text-right">Quantity / Unit</th>
                        <th className="py-2.5 px-3 text-center">UOM</th>
                        <th className="py-2.5 px-3 text-right">Formula %</th>
                        <th className="py-2.5 px-3 text-right">Scrap Factor %</th>
                        <th className="py-2.5 px-3 text-right">Line Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {bom.lines.map((line, idx) => {
                        const isAux = isAuxiliaryLine(line);
                        const formulaPct = !isAux && totalMaterialUnitQty > 0
                          ? ((Number(line.qty) / totalMaterialUnitQty) * 100).toFixed(1)
                          : null;

                        return (
                          <tr
                            key={idx}
                            onClick={() => onNavigate('itemDetail', line.item)}
                            className={`hover:bg-gray-50 cursor-pointer ${isAux ? 'bg-amber-50/20' : ''}`}
                          >
                            <td className="py-2.5 px-3">
                              <span className="cell-code font-bold text-[#0F8B8D]">{line.item}</span>
                              <div className="cell-sub text-gray-600">{line.name}</div>
                            </td>
                            <td className="py-2.5 px-3">{getLineRoleBadge(line)}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-right text-[#14213D]">{line.qty}</td>
                            <td className="py-2.5 px-3 text-center font-mono text-gray-600">{line.uom}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold">
                              {formulaPct ? (
                                <span className="text-blue-700">{formulaPct}%</span>
                              ) : (
                                <span className="text-gray-400 text-[10px]">N/A (BOP)</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-rose-600">{line.scrap}%</td>
                            <td className="py-2.5 px-3 font-mono font-semibold text-right text-gray-800">₹{line.cost.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-[#F9F8F5] border-t-2 border-[#E4E0D6] font-semibold text-xs text-[#14213D]">
                      <tr className="bg-blue-50/50">
                        <td colSpan={2} className="py-2.5 px-3 text-blue-900 font-bold">
                          Core Material Formula Sum (Excl. BOP / CON / PCK):
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-900">
                          {totalMaterialUnitQty.toFixed(4)}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-blue-900">{materialUom}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-900">100.0%</td>
                        <td className="py-2.5 px-3 text-right text-[11px] text-gray-500">Net Resin</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">
                          ₹{coreMaterialLines.reduce((s, l) => s + (l.cost || 0), 0).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    );
  }

  /* ----------------------------------------------------
     MACHINES & MOLDS LIST
  ---------------------------------------------------- */
  if (view === 'machineList') {
    const [machSearch, setMachSearch] = useState('');
    const [machStatusFilter, setMachStatusFilter] = useState('all');

    const filteredMachines = machines.filter((m) => {
      const matchQ =
        m.id.toLowerCase().includes(machSearch.toLowerCase()) ||
        m.name.toLowerCase().includes(machSearch.toLowerCase()) ||
        m.line.toLowerCase().includes(machSearch.toLowerCase()) ||
        m.type.toLowerCase().includes(machSearch.toLowerCase());
      if (!matchQ) return false;
      if (machStatusFilter !== 'all' && m.status !== machStatusFilter) return false;
      return true;
    });

    const totalMachinePages = Math.ceil(filteredMachines.length / machinePageSize) || 1;
    const pagedMachines = filteredMachines.slice(
      (machinePage - 1) * machinePageSize,
      machinePage * machinePageSize
    );

    return (
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-wider text-[#0F8B8D] font-bold">
              Master Data &middot; Plant Assets
            </div>
            <h1 className="text-xl font-bold text-[#14213D]">Machines &amp; Molds</h1>
            <p className="text-xs text-[#6B7280]">
              Injection molding machines, extrusion lines, molds/tooling and granulators.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn btn-sm btn-primary"
              onClick={() => {
                let id = `IMM-250T-0${machines.length + 1}`;
                let name = 'Injection Molding Machine 250T';
                let line = 'Line 4';
                let tonnage = '250T';

                openDrawer(
                  'Register New Plant Machine / Mold',
                  <div className="space-y-4">
                    <div className="field"><label>Asset ID</label><input defaultValue={id} onChange={(e) => (id = e.target.value)} /></div>
                    <div className="field"><label>Asset Name</label><input defaultValue={name} onChange={(e) => (name = e.target.value)} /></div>
                    <div className="field"><label>Line Location</label><input defaultValue={line} onChange={(e) => (line = e.target.value)} /></div>
                    <div className="field"><label>Tonnage / Specification</label><input defaultValue={tonnage} onChange={(e) => (tonnage = e.target.value)} /></div>
                  </div>,
                  <div className="flex justify-end gap-2 w-full">
                    <button className="btn btn-sm btn-ghost" onClick={closeDrawer}>Cancel</button>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => {
                        onCreateMachine({
                          id,
                          name,
                          type: 'Injection Molding Machine',
                          line,
                          status: 'idle',
                          job: '—',
                          lastPM: 'Today',
                          nextPM: 'In 30 days',
                          tonnage,
                          approval: 'approved',
                          createdOn: 'Today',
                        });
                        closeDrawer();
                        showToast(`Asset ${id} registered`);
                      }}
                    >
                      Register Asset
                    </button>
                  </div>
                );
              }}
            >
              <Plus className="w-3.5 h-3.5" /> Add Machine / Mold
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E4E0D6] shadow-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search asset ID, machine name, line location..."
              value={machSearch}
              onChange={(e) => {
                setMachSearch(e.target.value);
                setMachinePage(1);
              }}
              className="w-full bg-[#F6F4EF] border border-[#E4E0D6] rounded-lg px-3 py-1.5 text-xs text-[#14213D] focus:outline-none focus:border-[#0F8B8D]"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={machStatusFilter}
              onChange={(e) => {
                setMachStatusFilter(e.target.value);
                setMachinePage(1);
              }}
              className="bg-[#F6F4EF] border border-[#E4E0D6] rounded-lg px-3 py-1.5 text-xs font-semibold text-[#14213D] focus:outline-none focus:border-[#0F8B8D]"
            >
              <option value="all">Status: All Assets</option>
              <option value="running">Status: Running</option>
              <option value="idle">Status: Idle</option>
              <option value="breakdown">Status: Breakdown / Alert</option>
            </select>
          </div>
        </div>

        <div className="panel bg-white rounded-xl border border-[#E4E0D6] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F6F4EF] border-b border-[#E4E0D6] text-[#4B5563] font-bold text-[11px] uppercase tracking-wider">
                  <th className="p-3">Asset ID</th>
                  <th className="p-3">Asset Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Line Location</th>
                  <th className="p-3">Current Job</th>
                  <th className="p-3">Next PM Due</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Approval</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E0D6]">
                {pagedMachines.length > 0 ? (
                  pagedMachines.map((m) => (
                    <tr key={m.id} className="hover:bg-[#F0F6FF] transition-colors">
                      <td className="p-3"><span className="cell-code">{m.id}</span></td>
                      <td className="p-3 cell-name"><b>{m.name}</b><div className="cell-sub">{m.tonnage !== '—' ? m.tonnage : m.type}</div></td>
                      <td className="p-3"><span className="type-pill">{m.type}</span></td>
                      <td className="p-3">{m.line}</td>
                      <td className="p-3 mono text-xs">{m.job}</td>
                      <td className="p-3 mono text-xs text-[#6B7280]">{m.nextPM}</td>
                      <td className="p-3">
                        <span className={`badge ${m.status === 'running' ? 'green' : m.status === 'breakdown' ? 'red' : 'gray'}`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="p-3">{renderApprovalBadge(m.approval)}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            className="p-1 text-[#6B7280] hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Delete Asset"
                            onClick={() => {
                              openConfirm(`Delete asset ${m.id}?`, `Remove from registry?`, () => {
                                onDeleteMachine(m.id);
                                showToast(`Asset ${m.id} deleted`);
                              });
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-xs text-[#9CA3AF]">
                      No machines or molds found matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <PaginationBar
            currentPage={machinePage}
            totalPages={totalMachinePages}
            pageSize={machinePageSize}
            totalItems={filteredMachines.length}
            onPageChange={setMachinePage}
            onPageSizeChange={setMachinePageSize}
            itemName="machines"
          />
        </div>
      </div>
    );
  }

    return null;
  };

  return (
    <>
      {renderViewContent()}

      {/* 10-Step Item Wizard Modal */}
      <CreateItemWizardModal
        key={wizardEditItem ? `edit-${wizardEditItem.code}` : 'new-item-wizard'}
        isOpen={isItemWizardOpen}
        onClose={() => {
          setIsItemWizardOpen(false);
          setWizardEditItem(null);
        }}
        onSaveItem={handleSaveWizardItem}
        editItem={wizardEditItem}
        allItems={items}
        showToast={showToast}
      />

      {/* Grid In Bulk Import Modal with Zod Validation */}
      <ItemGridImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleBulkImport}
        onSuccessToast={showToast}
      />

      {/* 9-Step Manufacturing BOM Wizard Modal */}
      {isMfgBomWizardOpen && bomWizardParentItem && (
        <ManufacturingBomWizardModal
          key={bomWizardParentItem.code}
          isOpen={isMfgBomWizardOpen}
          onClose={() => {
            setIsMfgBomWizardOpen(false);
            setBomWizardParentItem(null);
          }}
          parentItem={bomWizardParentItem}
          allItems={items.filter((i) => i.approval === 'approved' || i.status === 'active')}
          existingBoms={boms}
          onSaveBom={(newBom) => {
            onCreateBom(newBom);
            setIsMfgBomWizardOpen(false);
            setBomWizardParentItem(null);
          }}
          showToast={showToast}
          onViewBomDetails={(b) => onNavigate('bomDetail', b.id)}
        />
      )}

      {/* Task 3: PostgreSQL Audit & Change History Modal */}
      <AuditHistoryModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        targetFilter={auditTarget}
        onNavigate={onNavigate}
      />

      {/* Task 4: Governance & RBAC Configuration Modal */}
      <GovernancePermissionsModal
        isOpen={isGovModalOpen}
        onClose={() => setIsGovModalOpen(false)}
        permissions={govPerms}
        showToast={showToast}
      />

      {/* Quick Modify Item & Tooling Modal */}
      {quickModifyItem && (
        <QuickModifyItemModal
          item={quickModifyItem}
          allItems={items}
          isOpen={!!quickModifyItem}
          isAdmin={isSuperAdmin || canEditItem}
          onClose={() => setQuickModifyItem(null)}
          onSave={async (updated) => {
            await handleSaveWizardItem(updated);
            setQuickModifyItem(null);
          }}
          onDelete={(code) => {
            openConfirm(
              `Delete ${code}?`,
              `Are you sure you want to permanently delete SKU ${code} from Master Catalog?`,
              async () => {
                try {
                  await deleteItemMutation.mutateAsync(code);
                  onDeleteItem(code);
                  showToast(`✓ Item ${code} deleted successfully.`);
                  setQuickModifyItem(null);
                } catch (err: any) {
                  console.error('[MasterDataViews.QuickModifyDelete] Error:', err);
                  showToast(`⚠️ Failed to delete SKU ${code}: ${err?.message || 'Database error'}`);
                }
              }
            );
          }}
          onOpenWizard={(itemToEdit) => {
            setQuickModifyItem(null);
            handleOpenEditItemWizard(itemToEdit);
          }}
          showToast={showToast}
        />
      )}

      {/* Dedicated Purchasing Specs Wizard Modal */}
      {purchasingSpecsItem && (
        <EditPurchasingSpecsModal
          isOpen={isPurchasingSpecsModalOpen}
          item={purchasingSpecsItem}
          onClose={() => {
            setIsPurchasingSpecsModalOpen(false);
            setPurchasingSpecsItem(null);
          }}
          onSave={async (updated) => {
            await handleSaveWizardItem(updated);
            setPurchasingSpecsItem(null);
          }}
          showToast={showToast}
        />
      )}

      {/* Task 2: Admin Approvals & CRUD Change Request Center Modal */}
      <AdminApprovalsModal
        isOpen={isAdminApprovalsOpen}
        onClose={() => setIsAdminApprovalsOpen(false)}
        onApplyApproval={handleApplyApproval}
        onApplyRejection={handleApplyRejection}
        showToast={showToast}
      />

      {/* Task 2: Raise Deletion Request Modal for Non-Admin Users */}
      {isRaiseDeleteModalOpen && deleteTargetItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <span>Raise SKU Deletion Request to Admin</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsRaiseDeleteModalOpen(false);
                  setDeleteTargetItem(null);
                }}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-xs">
              <div className="font-bold text-amber-900">
                Item is Approved / Active on Shopfloor
              </div>
              <p className="text-amber-800">
                SKU <strong>{deleteTargetItem.code}</strong> ({deleteTargetItem.name}) cannot be directly deleted by standard users. Please provide a business reason for Admin approval.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Reason for Deletion Request *
              </label>
              <textarea
                rows={3}
                required
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="e.g. Obsolete SKU replaced by ECR-2026-B, zero inventory on shopfloor..."
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setIsRaiseDeleteModalOpen(false);
                  setDeleteTargetItem(null);
                }}
                className="btn btn-sm btn-ghost border text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!deleteReason.trim()}
                onClick={() => {
                  masterDataGovernanceService.submitChangeRequest({
                    requestType: 'DELETE',
                    itemCode: deleteTargetItem.code,
                    itemName: deleteTargetItem.name,
                    requestedBy: currentUser?.name || 'Shopfloor User',
                    userRole: currentUser?.role || 'operator',
                    reason: deleteReason.trim(),
                    currentSnapshot: deleteTargetItem,
                  });
                  showToast(`✓ Submitted deletion request for SKU ${deleteTargetItem.code} to Admin for review.`);
                  setIsRaiseDeleteModalOpen(false);
                  setDeleteTargetItem(null);
                }}
                className="btn btn-sm bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" /> Submit Request to Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
