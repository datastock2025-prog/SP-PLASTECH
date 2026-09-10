import React, { useState } from 'react';
import {
  Package,
  Search,
  Filter,
  AlertTriangle,
  Layers,
  ArrowRight,
  TrendingDown,
  Clock,
  CheckCircle2,
  RefreshCw,
  Plus,
  Sliders,
  DollarSign,
  Download,
} from 'lucide-react';
import { mockScmInventory } from '../../data/mockScmData';
import { SCMInventoryItem } from '../../types/scm';

interface ScmInventoryPlanningViewProps {
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const ScmInventoryPlanningView: React.FC<ScmInventoryPlanningViewProps> = ({ onNavigate, showToast }) => {
  const [items, setItems] = useState<SCMInventoryItem[]>(mockScmInventory);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<SCMInventoryItem | null>(null);

  const filteredItems = items.filter((i) => {
    const matchesSearch =
      i.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.warehouseLocation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'All' || i.category === categoryFilter;
    const matchesStat = statusFilter === 'All' || i.status === statusFilter;
    return matchesSearch && matchesCat && matchesStat;
  });

  const totalValue = items.reduce((acc, curr) => acc + curr.stockValue, 0);
  const stockoutRiskCount = items.filter((i) => i.status === 'Stockout Risk' || i.status === 'Critical Stock').length;
  const expiringCount = items.filter((i) => i.status === 'Expiring').length;

  const handleCreatePR = (item: SCMInventoryItem) => {
    showToast(`Created Purchase Requisition for ${item.itemCode} (${item.reorderLevel} ${item.uom})`);
  };

  const handleTransferStock = (item: SCMInventoryItem) => {
    showToast(`Opened Warehouse Transfer ticket for ${item.itemCode} from ${item.warehouseLocation}`);
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 font-mono text-xs font-semibold uppercase">
              Inventory &amp; Buffer Control
            </span>
            <span className="text-xs text-slate-500">· Real-Time Silo &amp; Rack Mapping</span>
          </div>
          <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D] mt-1">
            Plastic Manufacturing Inventory Planning &amp; Days-of-Cover
          </h1>
          <p className="text-slate-500 text-xs">
            Multi-location inventory planning covering Virgin Polymers, Pigment Masterbatches, FEFO Chemical Additives, Regrind Granules, and Staged Finished Goods.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('scmInventoryAging')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Aging &amp; FEFO Analysis</span>
          </button>
          <button
            onClick={() => onNavigate('scmReplenishment')}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Replenishment Rules</span>
          </button>
        </div>
      </div>

      {/* Inventory KPI Deck */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-semibold">Total Stock Valuation</div>
          <div className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D] mt-1">
            ₹{(totalValue / 10000000).toFixed(2)} Cr
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">₹{totalValue.toLocaleString()}</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-semibold">Virgin Resin Stock</div>
          <div className="text-xl font-bold font-['Space_Grotesk'] text-slate-900 mt-1">
            72.5 MT
          </div>
          <div className="text-[10px] text-emerald-600 font-bold mt-0.5">Silos &amp; Pallet Racks</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-semibold">Closed-Loop Regrind Stock</div>
          <div className="text-xl font-bold font-['Space_Grotesk'] text-emerald-700 mt-1">
            4.6 MT
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Internal Granulator Stock</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-semibold">Stockout Risk SKUs</div>
          <div className="text-xl font-bold font-['Space_Grotesk'] text-rose-600 mt-1">
            {stockoutRiskCount} SKUs
          </div>
          <div className="text-[10px] text-rose-700 font-semibold mt-0.5">&lt; 4 Days Coverage</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-semibold">Expiring Additive Batches</div>
          <div className="text-xl font-bold font-['Space_Grotesk'] text-amber-600 mt-1">
            {expiringCount} Batches
          </div>
          <div className="text-[10px] text-amber-700 font-semibold mt-0.5">FEFO Action Needed</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            {['All', 'Virgin Resin', 'Masterbatch', 'Chemical Additive', 'Regrind', 'Finished Good'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  categoryFilter === cat ? 'bg-[#14213D] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search SKU or Bin Location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Healthy">Healthy</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Critical Stock">Critical Stock</option>
              <option value="Stockout Risk">Stockout Risk</option>
              <option value="Expiring">Expiring</option>
            </select>
          </div>
        </div>

        {/* Inventory Planning Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Item Code &amp; Material</th>
                <th className="p-3">Category</th>
                <th className="p-3">Location / Bin</th>
                <th className="p-3 text-right">Current Stock</th>
                <th className="p-3 text-right">Available</th>
                <th className="p-3 text-right">Incoming Supply</th>
                <th className="p-3 text-right">Projected Stock</th>
                <th className="p-3 text-right">Days of Cover</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredItems.map((item) => (
                <tr key={item.itemCode} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{item.itemCode}</div>
                    <div className="text-[11px] text-slate-500 truncate max-w-[200px]">{item.itemName}</div>
                    {item.resinGrade && (
                      <span className="text-[10px] font-mono text-[#0F8B8D]">{item.resinGrade} ({item.mfi})</span>
                    )}
                    {item.shelfLifeExpiryDate && (
                      <span className="text-[10px] font-mono text-amber-700 font-bold block">
                        Expires: {item.shelfLifeExpiryDate}
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium">
                      {item.category}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-[11px] text-slate-600">{item.warehouseLocation}</td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900">
                    {item.currentStock.toLocaleString()} {item.uom}
                  </td>
                  <td className="p-3 text-right font-mono text-emerald-700 font-semibold">
                    {item.availableStock.toLocaleString()} {item.uom}
                  </td>
                  <td className="p-3 text-right font-mono text-blue-700">
                    +{item.incomingSupply.toLocaleString()} {item.uom}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900">
                    {item.projectedStock.toLocaleString()} {item.uom}
                  </td>
                  <td className="p-3 text-right font-mono">
                    <span
                      className={`font-bold ${
                        item.daysOfCover <= 5
                          ? 'text-rose-600'
                          : item.daysOfCover <= 15
                          ? 'text-amber-600'
                          : 'text-emerald-700'
                      }`}
                    >
                      {item.daysOfCover} d
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.status === 'Stockout Risk'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : item.status === 'Low Stock'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : item.status === 'Expiring'
                          ? 'bg-purple-100 text-purple-800 border border-purple-300'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-1">
                    <button
                      onClick={() => handleCreatePR(item)}
                      className="px-2 py-1 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded text-[11px] font-bold transition cursor-pointer"
                      title="Create Requisition"
                    >
                      Requisition
                    </button>
                    <button
                      onClick={() => handleTransferStock(item)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition cursor-pointer"
                      title="Transfer Location"
                    >
                      Transfer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
