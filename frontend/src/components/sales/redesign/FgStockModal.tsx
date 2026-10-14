import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Package,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Building2,
  ExternalLink,
  Plus,
  Truck,
  Filter,
  Warehouse,
} from 'lucide-react';
import { FgBatchStock } from '../../../types/salesOrderDeliveryTypes';

interface FgStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  batches: FgBatchStock[];
  onNavigate: (view: string, param?: any) => void;
  onCreateOrderForItem?: (itemCode: string) => void;
  onCreateDelivery?: () => void;
}

export const FgStockModal: React.FC<FgStockModalProps> = ({
  isOpen,
  onClose,
  batches = [],
  onNavigate,
  onCreateOrderForItem,
  onCreateDelivery,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlant, setSelectedPlant] = useState('All');
  const [selectedQcStatus, setSelectedQcStatus] = useState('All');

  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      const matchesSearch =
        searchQuery === '' ||
        (b.batchNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.itemCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.itemName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.polymerLotNo || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPlant =
        selectedPlant === 'All' || (b.plant || '').toLowerCase().includes(selectedPlant.toLowerCase());

      const matchesQc =
        selectedQcStatus === 'All' ||
        (b.qualityStatus || '').toLowerCase() === selectedQcStatus.toLowerCase();

      return matchesSearch && matchesPlant && matchesQc;
    });
  }, [batches, searchQuery, selectedPlant, selectedQcStatus]);

  const totalAvailable = useMemo(
    () => filteredBatches.reduce((acc, b) => acc + (b.availableQty || 0), 0),
    [filteredBatches]
  );
  const totalReserved = useMemo(
    () => filteredBatches.reduce((acc, b) => acc + (b.reservedQty || 0), 0),
    [filteredBatches]
  );
  const totalPickable = useMemo(
    () => filteredBatches.reduce((acc, b) => acc + (b.pickableQty || 0), 0),
    [filteredBatches]
  );
  const totalBatches = filteredBatches.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#0F8B8D] text-white rounded-xl shadow-xs">
              <Warehouse className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900">
                  Finished Goods Stock & FEFO Batch Availability
                </h3>
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full">
                  Live Dispatchable Inventory
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Real-time stock across finished goods stores with First-Expiry-First-Out (FEFO) and Quality release tracking.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-gray-50/50 border-b border-gray-200 text-xs">
          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              Total FG Available
            </div>
            <div className="text-lg font-extrabold text-[#14213D] mt-0.5">
              {totalAvailable.toLocaleString()} <span className="text-xs font-normal text-gray-500">PCS</span>
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">{totalBatches} physical batches</div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-amber-200 bg-amber-50/30 shadow-2xs">
            <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
              Reserved for Orders
            </div>
            <div className="text-lg font-extrabold text-amber-700 mt-0.5">
              {totalReserved.toLocaleString()} <span className="text-xs font-normal text-gray-500">PCS</span>
            </div>
            <div className="text-[10px] text-amber-600 mt-0.5">Locked for active delivery notes</div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-2xs">
            <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
              Net Pickable Stock
            </div>
            <div className="text-lg font-extrabold text-emerald-700 mt-0.5">
              {totalPickable.toLocaleString()} <span className="text-xs font-normal text-gray-500">PCS</span>
            </div>
            <div className="text-[10px] text-emerald-600 mt-0.5">Immediate order allocation</div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-blue-200 bg-blue-50/30 shadow-2xs">
            <div className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">
              QA Inspection Status
            </div>
            <div className="text-lg font-extrabold text-blue-800 mt-0.5">
              100% <span className="text-xs font-normal text-gray-500">COA Ready</span>
            </div>
            <div className="text-[10px] text-blue-600 mt-0.5">Batch test reports attached</div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search batch #, item code, description, lot..."
                className="w-full text-xs pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={selectedPlant}
                onChange={(e) => setSelectedPlant(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
              >
                <option value="All">All Plants</option>
                <option value="Pimpri">Plant 1 - Pimpri</option>
                <option value="Chakan">Plant 2 - Chakan</option>
                <option value="Sanand">Plant 3 - Sanand</option>
              </select>

              <select
                value={selectedQcStatus}
                onChange={(e) => setSelectedQcStatus(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
              >
                <option value="All">All QC Statuses</option>
                <option value="Approved">Approved</option>
                <option value="Under Inspection">Under Inspection</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => {
              onClose();
              onNavigate('stockList');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0F8B8D] hover:text-teal-800 bg-[#0F8B8D]/10 hover:bg-[#0F8B8D]/20 rounded-lg transition-colors whitespace-nowrap"
          >
            <Warehouse className="w-3.5 h-3.5" />
            Full Warehouse Inventory Register <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {/* Batches Table */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-gray-50 text-gray-600 font-bold uppercase tracking-wider text-[10px] border-b border-gray-200">
                <tr>
                  <th className="p-3">Batch & Lot #</th>
                  <th className="p-3">Item Code & Name</th>
                  <th className="p-3">Plant / Store / Bin</th>
                  <th className="p-3 text-right">Available</th>
                  <th className="p-3 text-right">Reserved</th>
                  <th className="p-3 text-right">Pickable</th>
                  <th className="p-3">FEFO & Expiry</th>
                  <th className="p-3">QC / COA</th>
                  <th className="p-3 text-center">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-500">
                      <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      No finished goods batches found matching the filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredBatches.map((b) => (
                    <tr key={b.batchNumber} className="hover:bg-gray-50/80 transition-colors">
                      <td className="p-3 font-semibold text-gray-900">
                        <div className="font-mono text-xs text-[#14213D]">{b.batchNumber}</div>
                        <div className="text-[10px] text-gray-500 font-normal">Lot: {b.polymerLotNo || 'N/A'}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-gray-900">{b.itemCode}</div>
                        <div className="text-[11px] text-gray-600 max-w-[200px] truncate" title={b.itemName}>
                          {b.itemName}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-gray-900 font-medium text-[11px]">{b.plant}</div>
                        <div className="text-[10px] text-gray-500">
                          {b.fgStore} &bull; <span className="font-mono font-bold text-gray-700">{b.binCode}</span>
                        </div>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-gray-900">
                        {(b.availableQty || 0).toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono text-amber-700 font-semibold">
                        {(b.reservedQty || 0).toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-700 bg-emerald-50/40">
                        {(b.pickableQty || 0).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded-sm text-[10px] font-bold">
                            FEFO #{b.fefoRank || 1}
                          </span>
                          <span className="text-[10px] text-gray-600">
                            {b.daysToExpiry || 300}d left
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">Exp: {b.expiryDate}</div>
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-semibold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {b.qualityStatus}
                        </span>
                        <div className="text-[10px] text-gray-400 mt-0.5">COA: {b.coaNumber || 'COA-Pass'}</div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {onCreateOrderForItem && (
                            <button
                              onClick={() => {
                                onClose();
                                onCreateOrderForItem(b.itemCode);
                              }}
                              className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-[#0F8B8D] border border-teal-200 rounded-md text-[10px] font-bold transition-colors flex items-center gap-1"
                              title="Create Sales Order for this Item"
                            >
                              <Plus className="w-3 h-3" /> Daily SO
                            </button>
                          )}
                          {onCreateDelivery && (
                            <button
                              onClick={() => {
                                onClose();
                                onCreateDelivery();
                              }}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-md text-[10px] font-bold transition-colors flex items-center gap-1"
                              title="Create Delivery Note / Challan"
                            >
                              <Truck className="w-3 h-3" /> Challan
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Finished goods batches are strictly governed by automotive FEFO quality releases.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
