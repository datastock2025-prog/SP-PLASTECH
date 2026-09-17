import React, { useState } from 'react';
import {
  ItemMaster,
  BomMaster,
  MachineMaster,
  ApprovalStatus,
  ItemType,
} from '../types';
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
} from 'lucide-react';
import { PaginationBar } from './common/PaginationBar';
import { CreateItemWizardModal } from './masterdata/CreateItemWizardModal';
import { ManufacturingBomWizardModal } from './engineering/bomWizard/ManufacturingBomWizardModal';
import { itemService } from '../services/itemService';

interface MasterDataProps {
  view: string;
  items: ItemMaster[];
  boms: BomMaster[];
  machines: MachineMaster[];
  selectedCode?: string;
  selectedId?: string;
  onNavigate: (view: string, code?: string, id?: string) => void;
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

export const MasterDataViews: React.FC<MasterDataProps> = ({
  view,
  items,
  boms,
  machines,
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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('Overview');
  const [editingItemCell, setEditingItemCell] = useState<{ code: string; field: string } | null>(null);
  const [itemCellVal, setItemCellVal] = useState<string>('');
  const [selectedItemCodes, setSelectedItemCodes] = useState<string[]>([]);
  const [itemPage, setItemPage] = useState<number>(1);
  const [itemPageSize, setItemPageSize] = useState<number>(10);
  const [machinePage, setMachinePage] = useState<number>(1);
  const [machinePageSize, setMachinePageSize] = useState<number>(10);

  // 10-Step Item Wizard State
  const [isItemWizardOpen, setIsItemWizardOpen] = useState<boolean>(false);
  const [wizardEditItem, setWizardEditItem] = useState<ItemMaster | null>(null);

  const handleOpenCreateItemWizard = () => {
    setWizardEditItem(null);
    setIsItemWizardOpen(true);
  };

  const handleOpenEditItemWizard = (item: ItemMaster) => {
    setWizardEditItem(item);
    setIsItemWizardOpen(true);
  };

  const handleSaveWizardItem = (savedItem: ItemMaster) => {
    itemService.saveItem(savedItem);
    const exists = items.some((i) => i.code === savedItem.code);
    if (exists) {
      onUpdateItem(savedItem);
    } else {
      onCreateItem(savedItem);
    }
  };

  // Manufacturing BOM Wizard State
  const [isMfgBomWizardOpen, setIsMfgBomWizardOpen] = useState<boolean>(false);
  const [bomWizardParentItem, setBomWizardParentItem] = useState<ItemMaster | null>(null);

  const handleOpenMfgBomWizard = (targetItem: ItemMaster) => {
    setBomWizardParentItem(targetItem);
    setIsMfgBomWizardOpen(true);
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

  const renderApprovalBadge = (approval: ApprovalStatus) => {
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
    return <span className={`badge ${res.cls}`}>{res.label}</span>;
  };

  /* ----------------------------------------------------
     ITEM MASTER LIST & DETAIL
  ---------------------------------------------------- */
  if (view === 'itemList') {
    const filteredItems = items.filter((i) => {
      const matchSearch =
        i.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.cat.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;
      if (filterType === 'all') return true;
      if (filterType === 'pending_approval') return i.approval === 'pending';
      if (filterType === 'draft') return i.approval === 'draft';
      if (filterType === 'Masterbatch') return i.type === 'Masterbatch' || i.type === 'Additive';
      return i.type === filterType;
    });

    const lowStockCount = items.filter((i) => i.status === 'low').length;
    const holdCount = items.filter((i) => i.status === 'hold').length;
    const pendingCount = items.filter((i) => i.approval === 'pending').length;
    const draftCount = items.filter((i) => i.approval === 'draft').length;

    const totalItemPages = Math.ceil(filteredItems.length / itemPageSize) || 1;
    const pagedItems = filteredItems.slice((itemPage - 1) * itemPageSize, itemPage * itemPageSize);

    return (
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-wider text-[#0F8B8D] font-bold">
              Master Data &middot; Catalog
            </div>
            <h1 className="text-xl font-bold text-[#14213D]">Item Master</h1>
            <p className="text-xs text-[#6B7280]">
              Raw materials, masterbatch, regrind, finished goods, packaging and spares.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => showToast(`Exported ${items.length} items to CSV`)}
            >
              Export CSV
            </button>
            <button className="btn btn-sm btn-primary" onClick={handleOpenCreateItemWizard}>
              <Plus className="w-3.5 h-3.5" /> Create Item
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="kpi-row">
          <div className="kpi-card">
            <div className="lbl">Total Items</div>
            <div className="val">{items.length}</div>
            <div className="trend flat">Across 7 categories</div>
          </div>
          <div className="kpi-card">
            <div className="lbl">Drafts in Progress</div>
            <div className="val text-amber-700">{draftCount}</div>
            <div className="trend flat">{draftCount ? 'Auto-saving enabled' : 'Zero drafts'}</div>
          </div>
          <div className="kpi-card">
            <div className="lbl">Pending Approval</div>
            <div className="val">{pendingCount}</div>
            <div className="trend flat">{pendingCount ? 'Awaiting QA review' : 'All approved'}</div>
          </div>
          <div className="kpi-card">
            <div className="lbl">Low Stock</div>
            <div className="val">{lowStockCount}</div>
            <div className="trend down">Needs purchase requisition</div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="filter-bar">
          <div
            className={`chip ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            All Items
          </div>
          <div
            className={`chip ${filterType === 'Finished Good' ? 'active' : ''}`}
            onClick={() => setFilterType('Finished Good')}
          >
            Finished Goods
          </div>
          <div
            className={`chip ${filterType === 'Raw Material' ? 'active' : ''}`}
            onClick={() => setFilterType('Raw Material')}
          >
            Raw Materials
          </div>
          <div
            className={`chip ${filterType === 'Masterbatch' ? 'active' : ''}`}
            onClick={() => setFilterType('Masterbatch')}
          >
            Masterbatch
          </div>
          <div
            className={`chip ${filterType === 'Regrind' ? 'active' : ''}`}
            onClick={() => setFilterType('Regrind')}
          >
            Regrind
          </div>
          <div
            className={`chip ${filterType === 'draft' ? 'active' : ''}`}
            onClick={() => setFilterType('draft')}
          >
            📝 Drafts ({draftCount})
          </div>
          <div
            className={`chip ${filterType === 'pending_approval' ? 'active' : ''}`}
            onClick={() => setFilterType('pending_approval')}
          >
            ⏳ Pending Review ({pendingCount})
          </div>

          <div className="flex-1 max-w-xs ml-auto">
            <input
              type="text"
              placeholder="Search code, name, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-mini w-full"
            />
          </div>
        </div>

        {/* Bulk Actions Toolbar */}
        {selectedItemCodes.length > 0 && (
          <div className="p-2.5 bg-[#14213D] text-white rounded-lg flex items-center justify-between text-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2 font-semibold">
              <CheckSquare className="w-4 h-4 text-[#E8622C]" />
              <span>{selectedItemCodes.length} Item(s) selected</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  selectedItemCodes.forEach((code) => {
                    const itm = items.find((i) => i.code === code);
                    if (itm) {
                      onUpdateItem({ ...itm, approval: 'approved' });
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
                  selectedItemCodes.forEach((code) => {
                    const itm = items.find((i) => i.code === code);
                    if (itm) {
                      onUpdateItem({ ...itm, approval: 'rejected' });
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

        {/* Table */}
        <div className="panel bg-white rounded-xl border border-[#E4E0D6] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F6F4EF] border-b border-[#E4E0D6] text-[#4B5563] font-bold text-[11px] uppercase tracking-wider">
                  <th className="p-3 w-8">
                    <input
                      type="checkbox"
                      checked={filteredItems.length > 0 && selectedItemCodes.length === filteredItems.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItemCodes(filteredItems.map((i) => i.code));
                        } else {
                          setSelectedItemCodes([]);
                        }
                      }}
                      className="rounded text-[#0F8B8D]"
                    />
                  </th>
                  <th className="p-3">Item Code</th>
                  <th className="p-3">Item Name &amp; Family</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">On Hand</th>
                  <th className="p-3">Available</th>
                  <th className="p-3">Warehouse</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Approval</th>
                  <th className="p-3 text-right">Approval Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E0D6]">
                {pagedItems.length > 0 ? (
                  pagedItems.map((item) => {
                    const isSelected = selectedItemCodes.includes(item.code);
                    return (
                      <tr
                        key={item.code}
                        className={`hover:bg-[#F9F8F5] transition-colors cursor-pointer ${
                          isSelected ? 'bg-[#F0FDF4]' : ''
                        }`}
                        onClick={() => onNavigate('itemDetail', { code: item.code })}
                      >
                        <td className="p-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedItemCodes([...selectedItemCodes, item.code]);
                              } else {
                                setSelectedItemCodes(selectedItemCodes.filter((c) => c !== item.code));
                              }
                            }}
                            className="rounded text-[#0F8B8D]"
                          />
                        </td>
                        <td className="p-3">
                          <span className="font-mono font-bold text-[#0F8B8D]">{item.code}</span>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-[#14213D] flex items-center gap-1">
                            <span>{item.icon}</span> <span>{item.name}</span>
                          </div>
                          <div className="text-[11px] text-[#6B7280] flex items-center gap-1.5 flex-wrap mt-0.5">
                            <span>{item.cat}</span>
                            {(item.isDol || item.routingDestination === 'DOL') && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                DOL &rarr; FG
                              </span>
                            )}
                            {(item.isAssembly || item.routingDestination === 'ASSEMBLY') && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                ASSEMPLY &rarr; Assembly
                              </span>
                            )}
                            {(item.isDeflash || item.routingDestination === 'DEFLASH') && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                DEFLASH &rarr; Deflash
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F6F4EF] text-[#14213D] border border-[#E4E0D6]">
                            {item.type}
                          </span>
                        </td>
                        <td
                          className="p-3 font-semibold text-[#14213D]"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingItemCell({ code: item.code, field: 'stock' });
                            setItemCellVal(item.stock);
                          }}
                        >
                          {editingItemCell?.code === item.code && editingItemCell.field === 'stock' ? (
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                value={itemCellVal}
                                onChange={(e) => setItemCellVal(e.target.value)}
                                className="w-24 px-1.5 py-0.5 text-xs border border-[#0F8B8D] rounded bg-white font-mono"
                                autoFocus
                              />
                              <button
                                onClick={() => {
                                  onUpdateItem({ ...item, stock: itemCellVal });
                                  setEditingItemCell(null);
                                  showToast(`Stock updated for ${item.code}`);
                                }}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="hover:underline" title="Click to edit stock">
                              {item.stock}
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-[#4B5563]">{item.avail}</td>
                        <td
                          className="p-3 font-mono text-xs text-[#6B7280]"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingItemCell({ code: item.code, field: 'wh' });
                            setItemCellVal(item.wh);
                          }}
                        >
                          {editingItemCell?.code === item.code && editingItemCell.field === 'wh' ? (
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                value={itemCellVal}
                                onChange={(e) => setItemCellVal(e.target.value)}
                                className="w-24 px-1.5 py-0.5 text-xs border border-[#0F8B8D] rounded bg-white font-mono"
                                autoFocus
                              />
                              <button
                                onClick={() => {
                                  onUpdateItem({ ...item, wh: itemCellVal });
                                  setEditingItemCell(null);
                                  showToast(`Warehouse updated for ${item.code}`);
                                }}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="hover:underline" title="Click to edit warehouse">
                              {item.wh}
                            </span>
                          )}
                        </td>
                        <td className="p-3">{renderStatusBadge(item.status)}</td>
                        <td className="p-3">{renderApprovalBadge(item.approval)}</td>
                        <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            {item.approval === 'pending' && (
                              <>
                                <button
                                  onClick={() => {
                                    onUpdateItem({ ...item, approval: 'approved' });
                                    showToast(`Approved ${item.code}`);
                                  }}
                                  className="px-2 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-semibold text-[10px] flex items-center gap-1 transition-colors"
                                  title="Quick Approve Item"
                                >
                                  <ThumbsUp className="w-3 h-3" /> Approve
                                </button>
                                <button
                                  onClick={() => {
                                    onUpdateItem({ ...item, approval: 'rejected' });
                                    showToast(`Rejected ${item.code}`);
                                  }}
                                  className="px-2 py-0.5 rounded bg-rose-100 hover:bg-rose-200 text-rose-800 font-semibold text-[10px] flex items-center gap-1 transition-colors"
                                  title="Reject Item"
                                >
                                  <ThumbsDown className="w-3 h-3" /> Reject
                                </button>
                              </>
                            )}
                            <button
                              className="p-1 text-[#6B7280] hover:text-[#0066CC] hover:bg-blue-50 rounded transition-colors"
                              title="Edit in 10-Step Wizard"
                              onClick={() => handleOpenEditItemWizard(item)}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              className="p-1 text-[#6B7280] hover:text-[#0066CC] hover:bg-blue-50 rounded transition-colors"
                              title="Clone / Duplicate Item"
                              onClick={() => {
                                const clone = {
                                  ...item,
                                  code: `${item.code}-COPY`,
                                  name: `${item.name} (Copy)`,
                                  approval: 'draft' as ApprovalStatus,
                                };
                                handleOpenEditItemWizard(clone);
                                showToast(`Loaded duplicate draft of ${item.code} in Create Item Wizard.`);
                              }}
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              className="p-1 text-[#6B7280] hover:text-[#0F8B8D] hover:bg-teal-50 rounded transition-colors"
                              title="Create Manufacturing BOM"
                              onClick={() => {
                                if (item.type === 'Raw Material') {
                                  openConfirm(
                                    'Raw Material BOM Notice',
                                    'Raw Materials typically do not have a Manufacturing BOM. Do you want to proceed?',
                                    () => handleOpenMfgBomWizard(item)
                                  );
                                } else {
                                  handleOpenMfgBomWizard(item);
                                }
                              }}
                            >
                              <Layers className="w-3.5 h-3.5" />
                            </button>
                            <button
                              className="p-1 text-[#6B7280] hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              title="Delete Item"
                              onClick={() => {
                                openConfirm(
                                  `Delete ${item.code}?`,
                                  `This will remove ${item.name} from the master catalog.`,
                                  () => {
                                    itemService.deleteItem(item.code);
                                    onDeleteItem(item.code);
                                    showToast(`Item ${item.code} deleted`);
                                  }
                                );
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10}>
                      <div className="py-12 px-6 text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-teal-50 text-[#0F8B8D] mb-3">
                          <Plus className="w-6 h-6" />
                        </div>
                        <h3 className="text-sm font-bold text-[#14213D] mb-1">
                          {items.length === 0 ? 'No Master Items in Catalog' : 'No matching items found'}
                        </h3>
                        <p className="text-xs text-[#6B7280] max-w-md mx-auto mb-4">
                          {items.length === 0
                            ? 'The catalog is empty and ready for live data entry. Click below to register your first Raw Material or Finished Good.'
                            : 'No items match your active search or filter. Try clearing filters or changing search query.'}
                        </p>
                        {items.length === 0 && (
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
          <PaginationBar
            currentPage={itemPage}
            totalPages={totalItemPages}
            pageSize={itemPageSize}
            totalItems={filteredItems.length}
            onPageChange={setItemPage}
            onPageSizeChange={setItemPageSize}
            itemName="items"
          />
        </div>

        {/* 10-Step Item Wizard Modal */}
        <CreateItemWizardModal
          isOpen={isItemWizardOpen}
          onClose={() => setIsItemWizardOpen(false)}
          onSaveItem={handleSaveWizardItem}
          editItem={wizardEditItem}
          showToast={showToast}
        />

        {/* 9-Step Manufacturing BOM Wizard Modal */}
        {isMfgBomWizardOpen && bomWizardParentItem && (
          <ManufacturingBomWizardModal
            isOpen={isMfgBomWizardOpen}
            onClose={() => setIsMfgBomWizardOpen(false)}
            parentItem={bomWizardParentItem}
            allItems={items}
            existingBoms={boms}
            onSaveBom={(newBom) => {
              onCreateBom(newBom);
              setIsMfgBomWizardOpen(false);
            }}
            showToast={showToast}
            onViewBomDetails={(b) => onNavigate('bomDetail', { id: b.id })}
          />
        )}
      </div>
    );
  }

  /* ----------------------------------------------------
     ITEM DETAIL VIEW (With All 10 Full Tabs)
  ---------------------------------------------------- */
  if (view === 'itemDetail') {
    const item = items.find((i) => i.code === selectedCode) || (items.length > 0 ? items[0] : null);
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
              The requested item code is not available or the master catalog is currently empty.
            </p>
            <button className="btn btn-sm btn-primary" onClick={() => onNavigate('itemList')}>
              Return to Catalog
            </button>
          </div>
        </div>
      );
    }

    const itemBoms = boms.filter((b) => (b.lines || []).some((l) => l.item === item.code) || b.parent === item.code);

    const tabs = [
      'Overview',
      'Inventory',
      'Purchasing',
      'Quality',
      'Cycle Time',
      'BOM usage',
      'Documents',
      'Barcode / Label',
      'Approval',
      'Audit history',
    ];

    return (
      <div className="space-y-5">
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
              <div className="dh-title">
                <h2>{item.name}</h2>
                {renderStatusBadge(item.status)}
                {renderApprovalBadge(item.approval)}
              </div>
              <div className="dh-meta">
                <div className="m">
                  Item Code: <b>{item.code}</b>
                </div>
                <div className="m">
                  Type: <b>{item.type}</b>
                </div>
                <div className="m">
                  Category: <b>{item.cat}</b>
                </div>
                <div className="m">
                  Warehouse: <b>{item.wh}</b>
                </div>
              </div>
            </div>
          </div>
          <div className="dh-actions">
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => handleOpenEditItemWizard(item)}
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit in 10-Step Wizard
            </button>
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => showToast(`Label sent to Zebra printer for ${item.code}`)}
            >
              <Printer className="w-3.5 h-3.5" /> Print Label
            </button>
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => {
                const clone = {
                  ...item,
                  code: `${item.code}-COPY`,
                  name: `${item.name} (Copy)`,
                  approval: 'draft' as ApprovalStatus,
                };
                handleOpenEditItemWizard(clone);
                showToast(`Loaded copy of ${item.code} in Create Item Wizard.`);
              }}
            >
              <Copy className="w-3.5 h-3.5" /> Duplicate
            </button>
            <button
              className="btn btn-sm btn-primary flex items-center gap-1.5 shadow-sm"
              onClick={() => handleOpenMfgBomWizard(item)}
            >
              <Layers className="w-3.5 h-3.5" /> Create Manufacturing BOM
            </button>
            <button
              className="btn btn-sm btn-ghost border-[#E4E0D6]"
              onClick={() => {
                onUpdateItem({ ...item, status: 'active', approval: 'approved' });
                showToast(`Item ${item.code} approved and released`);
              }}
            >
              Approve &amp; Release
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="kpi-row">
          <div className="kpi-card">
            <div className="lbl">On Hand Stock</div>
            <div className="val text-lg">{item.stock}</div>
          </div>
          <div className="kpi-card">
            <div className="lbl">Available Stock</div>
            <div className="val text-lg">{item.avail}</div>
          </div>
          <div className="kpi-card">
            <div className="lbl">Std Cycle Time</div>
            <div className="val text-lg">{item.standardCycleTime || '—'} {item.cycleTimeUOM || 's'}</div>
          </div>
          <div className="kpi-card">
            <div className="lbl">BOM References</div>
            <div className="val text-lg">{itemBoms.length}</div>
          </div>
        </div>

        {/* Alert Strips if needed */}
        {item.status === 'low' && (
          <div className="alert-strip warn">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Stock below safety threshold ({item.safetyStock || '2,000 KG'}). Purchase order suggestion generated in MRP.</span>
          </div>
        )}
        {item.status === 'hold' && (
          <div className="alert-strip warn">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Quality hold active on lot LOT-011-01. Quarantined in RG-WH-01 pending inspection release.</span>
          </div>
        )}

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
          <div className="detail-grid">
            <div className="panel p-5 space-y-4">
              <div className="section-title">Classification &amp; Properties</div>
              <div className="kv-grid">
                <div className="kv"><label>Item Type</label><div className="v">{item.type}</div></div>
                <div className="kv"><label>Material Family</label><div className="v">{item.cat}</div></div>
                <div className="kv"><label>Base UOM</label><div className="v mono">{item.baseUOM}</div></div>
                <div className="kv"><label>Resin Grade</label><div className="v">{item.resinType || '—'}</div></div>
                <div className="kv"><label>Melt Flow Index</label><div className="v mono">{item.mfi || '12 g/10min'}</div></div>
                <div className="kv"><label>Density</label><div className="v mono">{item.density || '0.905 g/cm³'}</div></div>
                <div className="kv"><label>Food Grade Compliance</label><div className="v">{item.foodGrade || 'Yes'}</div></div>
                <div className="kv"><label>Country of Origin</label><div className="v">{item.countryOrigin || 'India'}</div></div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="side-block">
                <h4>Planning Parameters</h4>
                <div className="side-row"><span>Reorder Level</span><span className="mono">{item.reorderLevel || '4,000 KG'}</span></div>
                <div className="side-row"><span>Safety Stock</span><span className="mono">{item.safetyStock || '2,000 KG'}</span></div>
                <div className="side-row"><span>Lead Time</span><span>{item.leadTime || '7 days'}</span></div>
                <div className="side-row"><span>Preferred Supplier</span><span>{item.supplier || 'Reliance Polymers'}</span></div>
                <div className="side-row"><span>Valuation Method</span><span>{item.valuation || 'Weighted Avg'}</span></div>
              </div>

              <div className="side-block">
                <h4>Quality Controls</h4>
                <div className="side-row"><span>Incoming Inspection</span><span>{item.qc ? 'Required' : 'Not required'}</span></div>
                <div className="side-row"><span>Lot Controlled</span><span>{item.lot ? 'Yes' : 'No'}</span></div>
                <div className="side-row"><span>COA Required</span><span>{item.qc ? 'Yes' : 'No'}</span></div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Inventory */}
        {activeTab === 'Inventory' && (
          <div className="space-y-4">
            {/* Post-Production Routing Destination Banner */}
            <div className={`p-4 rounded-xl border flex items-center justify-between flex-wrap gap-3 ${
              (item.isDeflash || item.routingDestination === 'DEFLASH')
                ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                : (item.isAssembly || item.routingDestination === 'ASSEMBLY')
                ? 'bg-purple-50/80 border-purple-200 text-purple-900'
                : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
            }`}>
              <div>
                <div className="text-xs font-bold flex items-center gap-2">
                  <span>Default Post-Molding Store Routing:</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-white border shadow-2xs">
                    {(item.isDeflash || item.routingDestination === 'DEFLASH')
                      ? 'DEFLASH &rarr; DEFLASH-STORE'
                      : (item.isAssembly || item.routingDestination === 'ASSEMBLY')
                      ? 'ASSEMPLY &rarr; ASSEMBLY-STORE'
                      : 'DOL &rarr; FG-STORE'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 mt-1">
                  {(item.isDeflash || item.routingDestination === 'DEFLASH')
                    ? 'Configured in Item Wizard Step 5 (DEFLASH checked): After daily production entry is saved, output routes directly to DEFLASH-STORE for gate trimming and deburring.'
                    : (item.isAssembly || item.routingDestination === 'ASSEMBLY')
                    ? 'Configured in Item Wizard Step 5 (ASSEMPLY checked): After daily production entry is saved, output routes directly to ASSEMBLY-STORE for secondary assembly.'
                    : 'Configured in Item Wizard Step 5 (DOL checked): Direct On Line production drops directly into FG-STORE (Finished Goods), bypassing secondary staging.'}
                </div>
              </div>
              <div className="text-xs font-mono font-bold px-3 py-1.5 rounded-lg bg-white border">
                Target Store: {(item.isDeflash || item.routingDestination === 'DEFLASH')
                  ? 'DEFLASH-STORE'
                  : (item.isAssembly || item.routingDestination === 'ASSEMBLY')
                  ? 'ASSEMBLY-STORE'
                  : 'FG-STORE'}
              </div>
            </div>

            <div className="panel">
              <div className="panel-head"><h3>Warehouse Stock by Lot</h3></div>
              <div className="panel-body p-0">
                <table>
                  <thead>
                    <tr><th>Lot Number</th><th>Warehouse</th><th>Bin</th><th>On Hand</th><th>Mfg Date</th><th>Expiry</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {item.lots && item.lots.length > 0 ? (
                      item.lots.map((lot) => (
                        <tr key={lot.lotId}>
                          <td className="cell-code">{lot.lotId}</td>
                          <td>{item.wh}</td>
                          <td className="mono text-xs text-[#0F8B8D] font-bold">{lot.bin}</td>
                          <td className="font-semibold">{lot.qty.toLocaleString()} {lot.uom}</td>
                          <td>{lot.mfgDate}</td>
                          <td>{lot.expiryDate}</td>
                          <td><span className={`badge ${lot.status === 'available' ? 'green' : 'purple'}`}>{lot.status}</span></td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="cell-code">LOT-2026-0842</td>
                        <td>{item.wh}</td>
                        <td className="mono text-xs text-[#0F8B8D] font-bold">{item.locationCode || 'WH-A1'}</td>
                        <td className="font-semibold">{item.stock}</td>
                        <td>2026-06-01</td>
                        <td>2027-06-01</td>
                        <td><span className="badge green">available</span></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Cycle Time */}
        {activeTab === 'Cycle Time' && (
          <div className="detail-grid">
            <div className="panel p-5 space-y-4">
              <div className="section-title">Standard Cycle Time Study</div>
              <div className="flex items-baseline gap-3">
                <span className="font-['Space_Grotesk'] text-4xl font-bold text-[#14213D]">
                  {item.standardCycleTime || 12.0}
                </span>
                <span className="text-sm font-semibold text-[#6B7280]">
                  {item.cycleTimeUOM || 'sec/pc'}
                </span>
              </div>
              <div className="kv-grid pt-2">
                <div className="kv"><label>Source</label><div className="v">{item.cycleTimeSource || 'Item Master Study'}</div></div>
                <div className="kv"><label>Revision</label><div className="v mono">{item.cycleTimeVersion || 'v1'}</div></div>
                <div className="kv"><label>Effective Date</label><div className="v">{item.cycleTimeEffective || '01 Jan 2026'}</div></div>
                <div className="kv"><label>Approved By</label><div className="v">{item.cycleTimeApprovedBy || 'A. Sharma'}</div></div>
              </div>
            </div>

            <div className="side-block">
              <h4>Log Cycle Time Study</h4>
              <button
                className="btn btn-sm btn-primary w-full"
                onClick={() => {
                  let newCycle = item.standardCycleTime || 12;
                  openDrawer(
                    `Update Cycle Time — ${item.code}`,
                    <div className="space-y-4">
                      <div className="field">
                        <label>New Cycle Time (sec/pc)</label>
                        <input
                          type="number"
                          step="0.1"
                          defaultValue={newCycle}
                          onChange={(e) => (newCycle = parseFloat(e.target.value) || newCycle)}
                        />
                      </div>
                      <div className="field">
                        <label>Reason for Update</label>
                        <input placeholder="e.g. Mold cooling channel optimization" />
                      </div>
                    </div>,
                    <div className="flex justify-end gap-2 w-full">
                      <button className="btn btn-sm btn-ghost" onClick={closeDrawer}>Cancel</button>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => {
                          onUpdateItem({ ...item, standardCycleTime: newCycle });
                          closeDrawer();
                          showToast(`Cycle time updated to ${newCycle}s`);
                        }}
                      >
                        Save Cycle Time
                      </button>
                    </div>
                  );
                }}
              >
                + Record New Cycle Time
              </button>
            </div>
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
                <Plus className="w-3.5 h-3.5" />
                {itemBoms.length > 0 ? 'Create Another BOM' : 'Create Manufacturing BOM'}
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
                        <th className="py-2.5 px-3">Mfg Category</th>
                        <th className="py-2.5 px-3">Std Unit Cost</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {itemBoms.map((b) => (
                        <tr
                          key={b.id}
                          onClick={() => onNavigate('bomDetail', { id: b.id })}
                          className="hover:bg-gray-50 cursor-pointer"
                        >
                          <td className="py-2.5 px-3 font-mono font-bold text-[#0F8B8D]">{b.id}</td>
                          <td className="py-2.5 px-3 font-semibold text-[#14213D]">{b.parentName}</td>
                          <td className="py-2.5 px-3 font-mono">{b.version}</td>
                          <td className="py-2.5 px-3 text-gray-600">{b.mfgCategory || b.bomType || 'Discrete BOM'}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-gray-800">
                            ${(b.standardCost || 0).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3">{renderApprovalBadge(b.status)}</td>
                          <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => onNavigate('bomDetail', { id: b.id })}
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
                    <h4 className="font-bold text-sm text-[#14213D]">No Manufacturing BOM exists for this item.</h4>
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
                <div className="side-row"><span>Lot Number Included</span><span>Yes</span></div>
                <div className="side-row"><span>Warehouse Location Tag</span><span>Yes ({item.wh})</span></div>
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
                <div className="text-[10px] text-[#6B7280] border-b border-[#E4E0D6] pb-1">PLANT 01 &middot; HOSUR</div>
                <div className="font-bold text-xs pt-1">{item.code}</div>
                <div className="text-[10px] truncate">{item.name}</div>
                <div className="text-[10px]">LOT: LOT-2026-0842</div>
                <div className="text-[10px]">QTY: {item.stock} &middot; {item.wh}</div>
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
          <div className="panel p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#14213D]">Master Data Approval Workflow</h3>
              {renderApprovalBadge(item.approval)}
            </div>
            <div className="space-y-3">
              <div className="timeline-item">
                <div className="t-dot" style={{ background: 'var(--success)' }} />
                <div>
                  <div className="t-text"><b>Item Created</b> &mdash; {item.name}</div>
                  <div className="t-time">{item.createdOn} &middot; Initial draft</div>
                </div>
              </div>
              <div className="timeline-item">
                <div className="t-dot" style={{ background: item.approval === 'approved' ? 'var(--success)' : 'var(--warning)' }} />
                <div>
                  <div className="t-text">
                    <b>QA &amp; Technical Review</b> &mdash; {item.approval === 'approved' ? 'Approved by Priya Rao' : 'Awaiting Review'}
                  </div>
                  <div className="t-time">Master catalog release authority</div>
                </div>
              </div>
            </div>
            {item.approval !== 'approved' && (
              <div className="flex gap-2 pt-2">
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    onUpdateItem({ ...item, approval: 'approved', status: 'active' });
                    showToast(`Item ${item.code} approved and released`);
                  }}
                >
                  Approve Item
                </button>
                <button
                  className="btn btn-sm btn-ghost text-[#C4433A] border-[#C4433A]/30 hover:bg-[#FBE1DE]"
                  onClick={() => {
                    onUpdateItem({ ...item, approval: 'rejected', rejectReason: 'Missing technical data sheet' });
                    showToast(`Item ${item.code} rejected`);
                  }}
                >
                  Reject Item
                </button>
              </div>
            )}
          </div>
        )}

        {/* Fallback for other tabs */}
        {!['Overview', 'Inventory', 'Cycle Time', 'BOM usage', 'Barcode / Label', 'Approval'].includes(activeTab) && (
          <div className="panel p-5 text-xs space-y-2">
            <div className="font-bold text-sm text-[#14213D]">{activeTab} Details</div>
            <p className="text-[#6B7280]">
              Full audit and record history for item {item.code}. Managed under master data governance rules.
            </p>
          </div>
        )}

        {/* 10-Step Item Wizard Modal */}
        <CreateItemWizardModal
          isOpen={isItemWizardOpen}
          onClose={() => setIsItemWizardOpen(false)}
          onSaveItem={handleSaveWizardItem}
          editItem={wizardEditItem}
          showToast={showToast}
        />

        {/* 9-Step Manufacturing BOM Wizard Modal */}
        {isMfgBomWizardOpen && bomWizardParentItem && (
          <ManufacturingBomWizardModal
            isOpen={isMfgBomWizardOpen}
            onClose={() => setIsMfgBomWizardOpen(false)}
            parentItem={bomWizardParentItem}
            allItems={items}
            existingBoms={boms}
            onSaveBom={(newBom) => {
              onCreateBom(newBom);
              setIsMfgBomWizardOpen(false);
            }}
            showToast={showToast}
            onViewBomDetails={(b) => onNavigate('bomDetail', { id: b.id })}
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
      const fgItems = items.filter((i) => i.type === 'Finished Good');
      let parent = fgItems.length > 0 ? fgItems[0].code : '';
      let version = 'v1';
      const handleSave = () => {
        const parentItem = items.find((i) => i.code === parent);
        const rawMaterials = items.filter((i) => i.type === 'Raw Material' || i.type === 'Masterbatch');
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
              {items.filter((i) => i.type === 'Finished Good').map((i) => (
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
                const defaultParent = items.find((i) => i.type === 'Finished Goods' || i.type === 'Finished Good') || (items.length > 0 ? items[0] : null);
                if (defaultParent) {
                  handleOpenMfgBomWizard(defaultParent);
                } else {
                  showToast('Please create a Finished Good item first in Item Master before building a BOM.');
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
                    <tr key={b.id} onClick={() => onNavigate('bomDetail', { id: b.id })}>
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

        {/* 9-Step Manufacturing BOM Wizard Modal */}
        {isMfgBomWizardOpen && bomWizardParentItem && (
          <ManufacturingBomWizardModal
            isOpen={isMfgBomWizardOpen}
            onClose={() => setIsMfgBomWizardOpen(false)}
            parentItem={bomWizardParentItem}
            allItems={items}
            existingBoms={boms}
            onSaveBom={(newBom) => {
              onCreateBom(newBom);
              setIsMfgBomWizardOpen(false);
            }}
            showToast={showToast}
            onViewBomDetails={(b) => onNavigate('bomDetail', { id: b.id })}
          />
        )}
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
                  onUpdateBom({ ...bom, status: 'released' });
                  showToast(`BOM ${bom.id} approved & released`);
                }}
              >
                Release to Production
              </button>
            )}
          </div>
        </div>

        {/* Component Lines Table */}
        <div className="panel">
          <div className="panel-head">
            <h3>Component Recipe Lines</h3>
            <span className="text-xs font-mono font-bold text-[#E8622C]">Unit Material Cost: ₹{totalCost.toFixed(2)}</span>
          </div>
          <div className="panel-body p-0">
            <table>
              <thead>
                <tr>
                  <th>Component Item</th>
                  <th>Quantity / Unit</th>
                  <th>UOM</th>
                  <th>Scrap Factor %</th>
                  <th>Line Cost</th>
                </tr>
              </thead>
              <tbody>
                {bom.lines.map((line, idx) => (
                  <tr key={idx} onClick={() => onNavigate('itemDetail', { code: line.item })}>
                    <td>
                      <span className="cell-code">{line.item}</span>
                      <div className="cell-sub">{line.name}</div>
                    </td>
                    <td className="font-mono font-bold">{line.qty}</td>
                    <td>{line.uom}</td>
                    <td>{line.scrap}%</td>
                    <td className="font-mono font-semibold">₹{line.cost.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
                    <tr key={m.id} className="hover:bg-[#F9F8F5] transition-colors">
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
