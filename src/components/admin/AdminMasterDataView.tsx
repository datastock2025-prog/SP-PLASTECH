import React, { useState } from 'react';
import {
  Database,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Lock,
  FileCheck,
  Tag,
  ShieldCheck,
  RefreshCw,
  Download,
  Upload,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { MasterDataRecord, mockMasterDataRecords } from '../../data/mockAdminExtendedData';

interface AdminMasterDataViewProps {
  showToast?: (msg: string) => void;
}

export const AdminMasterDataView: React.FC<AdminMasterDataViewProps> = ({
  showToast = (_msg: string) => {},
}) => {
  const [records, setRecords] = useState<MasterDataRecord[]>(mockMasterDataRecords);
  const [selectedEntity, setSelectedEntity] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<MasterDataRecord>(records[0]);

  const entityTypes = [
    'ALL',
    'Polymer Resin Item',
    'Color Masterbatch',
    'Finished Molded Component',
    'Tooling & Mold Asset',
    'Customer Account',
  ];

  const filteredRecords = records.filter((r) => {
    const matchType = selectedEntity === 'ALL' || r.entityType === selectedEntity;
    const matchSearch =
      r.code.toLowerCase().includes(search.toLowerCase()) ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.category.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const handleToggleLock = (id: string) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const next = r.status === 'Locked' ? 'Approved' : 'Locked';
          showToast(`Master record ${r.code} is now ${next}.`);
          return { ...r, status: next };
        }
        return r;
      })
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <Database className="w-4 h-4 text-[#0F8B8D]" />
            <span>Enterprise Data Governance &amp; Single Source of Truth</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Master Data Management Screen</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Govern core catalog masters for polyolefin raw materials, masterbatch codes, injection mold dies, and customer compliance specs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast('Master data audit & deduplication check completed: 0 duplicates detected.')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Audit Deduplication
          </button>
          <button
            onClick={() => showToast('Opened master catalog creation wizard.')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0F8B8D] hover:bg-[#0c7274] rounded-lg shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            New Master Record
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search master item by code, resin grade, tool ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {entityTypes.map((et) => (
            <button
              key={et}
              onClick={() => setSelectedEntity(et)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedEntity === et
                  ? 'bg-[#0F8B8D] text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {et}
            </button>
          ))}
        </div>
      </div>

      {/* Master Data Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Table List (Left) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="py-3 px-4">Entity Type</th>
                <th className="py-3 px-4">Code / Item</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((r) => {
                const isSelected = selectedRecord?.id === r.id;
                return (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedRecord(r)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-[#0F8B8D]/5 font-semibold' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="py-3 px-4 text-slate-500 text-[11px] font-medium">{r.entityType}</td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-xs font-bold text-slate-900">{r.code}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs font-normal">{r.name}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{r.category}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : r.status === 'Locked'
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <ChevronRight className="w-4 h-4 text-slate-400 inline" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Record Inspector (Right) */}
        {selectedRecord && (
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-5 h-fit sticky top-4">
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {selectedRecord.entityType}
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-0.5">{selectedRecord.name}</h2>
                <span className="font-mono text-xs font-bold text-[#0F8B8D]">{selectedRecord.code}</span>
              </div>

              <button
                onClick={() => handleToggleLock(selectedRecord.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                  selectedRecord.status === 'Locked'
                    ? 'bg-emerald-600 text-white border-transparent'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {selectedRecord.status === 'Locked' ? 'Unlock Record' : 'Lock Golden Record'}
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Classification:</span>
                  <span className="font-semibold text-slate-800">{selectedRecord.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Primary UOM:</span>
                  <span className="font-mono font-semibold text-slate-800">{selectedRecord.primaryUom}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Multi-Plant Scope:</span>
                  <span className="font-semibold text-slate-800">{selectedRecord.plantScope}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Last Verified:</span>
                  <span className="text-slate-700">
                    {selectedRecord.lastUpdated} by {selectedRecord.updatedBy}
                  </span>
                </div>
              </div>

              {/* Compliance Badges */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Compliance &amp; Quality Mandates:</label>
                <div className="p-3 bg-teal-50/50 rounded-lg border border-teal-200 text-[#0F8B8D] font-semibold text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>{selectedRecord.complianceCert}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => showToast(`Exported golden master sheet for ${selectedRecord.code}.`)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Export Master Specs
              </button>
              <button
                onClick={() => showToast(`Opened full master profile editor for ${selectedRecord.code}.`)}
                className="px-3 py-1.5 rounded-lg bg-[#0F8B8D] text-white text-xs font-semibold hover:bg-[#0c7274]"
              >
                Edit Specification
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
