import React, { useState } from 'react';
import {
  Store,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Package,
  Layers,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  Building2,
  Trash2,
} from 'lucide-react';
import { ItemMaster } from '../../../types';
import { ExplodedMaterialRequirement, StoreInventoryNode } from './jitTypes';
import { parseStockNumber } from './jitCalculations';

interface Props {
  requirements: ExplodedMaterialRequirement[];
  items: ItemMaster[];
  stores: StoreInventoryNode[];
  onAddStore: (store: StoreInventoryNode) => void;
  onRemoveStore: (storeId: string) => void;
}

export const JitStoreFeasibilityView: React.FC<Props> = ({
  requirements,
  items,
  stores,
  onAddStore,
  onRemoveStore,
}) => {
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddStoreOpen, setIsAddStoreOpen] = useState<boolean>(false);

  // New store form state
  const [newStoreCode, setNewStoreCode] = useState('');
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreType, setNewStoreType] = useState<StoreInventoryNode['type']>('CUSTOM');
  const [newStoreZone, setNewStoreZone] = useState('');
  const [newStoreDesc, setNewStoreDesc] = useState('');

  const handleCreateStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreCode.trim() || !newStoreName.trim()) return;

    const newStore: StoreInventoryNode = {
      id: `store-custom-${Date.now()}`,
      code: newStoreCode.trim().toUpperCase(),
      name: newStoreName.trim(),
      type: newStoreType,
      zone: newStoreZone.trim() || 'General Bay',
      description: newStoreDesc.trim() || 'Custom factory store location',
      isCustom: true,
    };

    onAddStore(newStore);
    setNewStoreCode('');
    setNewStoreName('');
    setNewStoreZone('');
    setNewStoreDesc('');
    setIsAddStoreOpen(false);
  };

  // Filter requirements
  const filteredReqs = requirements.filter((r) => {
    const matchesSearch =
      r.materialCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.materialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.storeLocation.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCat = categoryFilter === 'all' || r.category === categoryFilter;
    const matchesStore =
      selectedStoreId === 'all' ||
      r.storeLocation.toLowerCase().includes(selectedStoreId.toLowerCase());

    return matchesSearch && matchesCat && matchesStore;
  });

  const shortageCount = requirements.filter((r) => r.feasibility === 'Critical_Shortage').length;
  const tightCount = requirements.filter((r) => r.feasibility === 'Tight_Buffer').length;
  const sufficientCount = requirements.filter((r) => r.feasibility === 'Sufficient').length;

  return (
    <div className="space-y-6">
      {/* Top Stores Navigation & Quick Feasibility KPIs */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Store className="w-4 h-4 text-indigo-600" />
              Connected Multi-Store Inventory & Material Feasibility Hub
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live stock correlation across Finished Goods, Semi-Finished (SFG), Resin (RM), Masterbatch (MB), Packaging (PCK) & Hardware Stores
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddStoreOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Store</span>
            </button>
          </div>
        </div>

        {/* Store Selection Pills */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setSelectedStoreId('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedStoreId === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Stores ({stores.length})
          </button>

          {stores.map((st) => {
            const isSelected = selectedStoreId === st.code;
            return (
              <div key={st.id} className="inline-flex items-center">
                <button
                  type="button"
                  onClick={() => setSelectedStoreId(st.code)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span className="font-mono font-bold text-[11px]">{st.code}</span>
                  <span>{st.name}</span>
                  {st.isCustom && (
                    <span className="text-[10px] bg-indigo-200 text-indigo-900 px-1 rounded">
                      Custom
                    </span>
                  )}
                </button>
                {st.isCustom && (
                  <button
                    type="button"
                    onClick={() => onRemoveStore(st.id)}
                    className="ml-1 text-slate-400 hover:text-rose-600 p-1 rounded"
                    title="Remove custom store"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Material Feasibility Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-white border border-emerald-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-slate-500 font-medium">100% Sufficient Materials</span>
            <div className="text-2xl font-black text-emerald-700 font-mono">
              {sufficientCount}{' '}
              <span className="text-xs font-normal text-slate-500">of {requirements.length}</span>
            </div>
            <div className="text-[11px] text-emerald-600">Stock ready for instant release</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-amber-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-slate-500 font-medium">Tight Safety Buffer (&lt;20%)</span>
            <div className="text-2xl font-black text-amber-700 font-mono">{tightCount}</div>
            <div className="text-[11px] text-amber-600">Consider placing purchase indent</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-rose-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-slate-500 font-medium">Critical Material Shortages</span>
            <div className="text-2xl font-black text-rose-700 font-mono">{shortageCount}</div>
            <div className="text-[11px] text-rose-600">
              {shortageCount > 0 ? 'Action required prior to shift start' : 'Zero material blockers'}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Material Requirements Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <div className="relative w-full">
              <Search className="absolute left-3 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search material code, name, or store..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-600 font-medium">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-md px-2.5 py-1 text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
            >
              <option value="all">All Categories</option>
              <option value="RM">Raw Material (Resin)</option>
              <option value="MB">Masterbatch (Colorant)</option>
              <option value="INSERT">Inserts / Hardware</option>
              <option value="PCK">Packaging Materials</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Material Code & Description</th>
                <th className="py-3 px-4">Connected Store</th>
                <th className="py-3 px-4 text-right">Required for Plan</th>
                <th className="py-3 px-4 text-right">Stock On-Hand</th>
                <th className="py-3 px-4 text-right">Balance Post-Run</th>
                <th className="py-3 px-4 text-center">Feasibility Status</th>
                <th className="py-3 px-4">Allocated Machine Jobs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReqs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No material requirements found for the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredReqs.map((req, idx) => {
                  const balance = req.availableStock - req.requiredQty;
                  const isShortage = req.feasibility === 'Critical_Shortage';
                  const isTight = req.feasibility === 'Tight_Buffer';

                  return (
                    <tr
                      key={idx}
                      className={`hover:bg-slate-50 transition-colors ${
                        isShortage ? 'bg-rose-50/40' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            req.category === 'RM'
                              ? 'bg-blue-100 text-blue-800'
                              : req.category === 'MB'
                              ? 'bg-purple-100 text-purple-800'
                              : req.category === 'INSERT'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {req.categoryLabel}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900">{req.materialCode}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">
                          {req.materialName}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        <div className="flex items-center gap-1.5 font-medium text-[11px]">
                          <Store className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono text-slate-800 font-semibold">
                            {req.storeLocation}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-indigo-900 bg-indigo-50/30">
                        {req.requiredQty.toLocaleString()} {req.uom}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-medium text-slate-800">
                        {req.availableStock.toLocaleString()} {req.uom}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <span className={balance < 0 ? 'text-rose-600' : 'text-emerald-700'}>
                          {balance >= 0 ? '+' : ''}
                          {balance.toLocaleString()} {req.uom}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {isShortage ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Deficit: {req.shortageQty.toLocaleString()} {req.uom}
                          </span>
                        ) : isTight ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                            Buffer Low
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Feasible
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-[11px] text-slate-500">
                        <div className="flex flex-wrap gap-1">
                          {req.sourceJobs.map((src, sIdx) => (
                            <span
                              key={sIdx}
                              className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono text-[10px]"
                              title={`${src.producedPcs.toLocaleString()} pcs of ${src.itemCode}`}
                            >
                              {src.machineId}: {src.allocatedQty.toFixed(1)} {req.uom}
                            </span>
                          ))}
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

      {/* Add Custom Store Modal */}
      {isAddStoreOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                Add Future / Custom Factory Store
              </h3>
              <button
                type="button"
                onClick={() => setIsAddStoreOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStore} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Store Code (e.g. WH-EXT-01, RM-SUB-02) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="WH-LINE-SIDE-01"
                  value={newStoreCode}
                  onChange={(e) => setNewStoreCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Store Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Line-Side Direct Staging Bay"
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Classification / Store Type
                </label>
                <select
                  value={newStoreType}
                  onChange={(e) => setNewStoreType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="RM">Raw Material / Resin Store</option>
                  <option value="MB">Additive & Masterbatch Store</option>
                  <option value="SFG">Semi-Finished / Regrind Store</option>
                  <option value="FG">Finished Goods Store</option>
                  <option value="PCK">Packaging Store</option>
                  <option value="SPARE">Inserts & Spares Store</option>
                  <option value="CUSTOM">General Factory Store</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Physical Storage Zone / Bay
                </label>
                <input
                  type="text"
                  placeholder="Bay 3 - Floor Stocking Staging"
                  value={newStoreZone}
                  onChange={(e) => setNewStoreZone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Description / Purpose
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes on usage, temperature, access controls..."
                  value={newStoreDesc}
                  onChange={(e) => setNewStoreDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddStoreOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  Add Store to Live Network
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
