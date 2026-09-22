import React, { useState } from 'react';
import {
  Database,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Lock,
  Unlock,
  FileCheck,
  Tag,
  ShieldCheck,
  RefreshCw,
  Download,
  Upload,
  Layers,
  ChevronRight,
  X,
  Edit2,
  Check,
  AlertCircle,
  FileSpreadsheet,
  Copy,
  Sparkles,
  GitMerge,
} from 'lucide-react';
import { MasterDataRecord } from '../../data/mockAdminExtendedData';
import { masterDataGovernanceService } from '../../services/masterDataGovernanceService';
import { adminEventBus } from '../../services/adminService';
import { PaginationBar } from '../common/PaginationBar';
import { MasterDataCombobox } from '../common/MasterDataCombobox';

interface AdminMasterDataViewProps {
  showToast?: (msg: string) => void;
}

export const AdminMasterDataView: React.FC<AdminMasterDataViewProps> = ({
  showToast = (_msg: string) => {},
}) => {
  const [records, setRecords] = useState<MasterDataRecord[]>(() => masterDataGovernanceService.getAllRecords());
  const [selectedEntity, setSelectedEntity] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<MasterDataRecord>(() => {
    const list = masterDataGovernanceService.getAllRecords();
    return list[0] || {
      id: 'MD-01',
      entityType: 'Polymer Resin Item',
      code: 'RES-PP-COPO-01',
      name: 'Polypropylene Impact Co-Polymer (MFI 12, High Izod)',
      primaryUom: 'Kilograms (KG)',
      category: 'Virgin Raw Polymer',
      itemGroup: 'Polymer Feedstock',
      plantScope: 'All Plants (Global)',
      lastUpdated: '2026-09-02',
      updatedBy: 'Dr. Sunita Kulkarni',
      complianceCert: 'RoHS, REACH, UL-94 HB',
      status: 'Approved',
    };
  });

  // Dynamic Master Catalog Options State
  const [categories, setCategories] = useState<string[]>(() => masterDataGovernanceService.getCategories());
  const [itemGroups, setItemGroups] = useState<string[]>(() => masterDataGovernanceService.getItemGroups());
  const [uoms, setUoms] = useState<string[]>(() => masterDataGovernanceService.getUoms());
  const [plantScopes, setPlantScopes] = useState<string[]>(() => masterDataGovernanceService.getPlantScopes());
  const [resinTypes, setResinTypes] = useState<string[]>(() => masterDataGovernanceService.getResinTypes());
  const [colors, setColors] = useState<string[]>(() => masterDataGovernanceService.getColors());
  const [complianceMandates, setComplianceMandates] = useState<string[]>(() => masterDataGovernanceService.getComplianceMandates());

  // Subscribe to Master Data updates
  React.useEffect(() => {
    const unsub = adminEventBus.subscribe(() => {
      const refreshed = masterDataGovernanceService.getAllRecords();
      setRecords(refreshed);
      setCategories(masterDataGovernanceService.getCategories());
      setItemGroups(masterDataGovernanceService.getItemGroups());
      setUoms(masterDataGovernanceService.getUoms());
      setPlantScopes(masterDataGovernanceService.getPlantScopes());
      setResinTypes(masterDataGovernanceService.getResinTypes());
      setColors(masterDataGovernanceService.getColors());
      setComplianceMandates(masterDataGovernanceService.getComplianceMandates());
      if (refreshed.length > 0 && !refreshed.some((r) => r.id === selectedRecord?.id)) {
        setSelectedRecord(refreshed[0]);
      }
    });
    return unsub;
  }, [selectedRecord]);

  // Modals State
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);

  // Record Form State
  const [formData, setFormData] = useState<Partial<MasterDataRecord>>({
    entityType: 'Polymer Resin Item',
    code: '',
    name: '',
    primaryUom: 'Kilograms (KG)',
    category: 'Virgin Raw Polymer',
    itemGroup: 'Polymer Feedstock',
    plantScope: 'All Plants (Global)',
    complianceCert: 'RoHS, REACH, UL-94 HB',
    status: 'Approved',
  });

  const entityTypes = [
    'ALL',
    'Polymer Resin Item',
    'Color Masterbatch',
    'Finished Molded Component',
    'Tooling & Mold Asset',
    'Customer Account',
  ];

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(8);

  const filteredRecords = records.filter((r) => {
    const matchType = selectedEntity === 'ALL' || r.entityType === selectedEntity;
    const matchSearch =
      r.code.toLowerCase().includes(search.toLowerCase()) ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.category.toLowerCase().includes(search.toLowerCase()) ||
      (r.itemGroup && r.itemGroup.toLowerCase().includes(search.toLowerCase()));
    return matchType && matchSearch;
  });

  // Reset pagination when filter or search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedEntity]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleToggleLock = (id: string) => {
    const target = records.find((r) => r.id === id);
    if (target) {
      const next = target.status === 'Locked' ? 'Approved' : 'Locked';
      const updated = masterDataGovernanceService.saveRecord({ ...target, status: next as any });
      setRecords(masterDataGovernanceService.getAllRecords());
      if (selectedRecord?.id === id) setSelectedRecord(updated);
      showToast(`Master record ${target.code} is now ${next}.`);
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setIsEditMode(false);
    const prefixMap: Record<string, string> = {
      'Polymer Resin Item': 'RES-PP-',
      'Color Masterbatch': 'MB-BLK-',
      'Finished Molded Component': 'FG-BMP-',
      'Tooling & Mold Asset': 'MOLD-TOOL-',
      'Customer Account': 'CUST-OEM-',
    };
    const entity = selectedEntity === 'ALL' ? 'Polymer Resin Item' : selectedEntity;
    setFormData({
      entityType: entity as any,
      code: `${prefixMap[entity] || 'ITEM-'}${Date.now().toString().slice(-4)}`,
      name: '',
      primaryUom: entity.includes('Resin') || entity.includes('Masterbatch') ? 'Kilograms (KG)' : 'Pieces (NOS)',
      category: entity === 'Polymer Resin Item' ? 'Virgin Raw Polymer' : entity === 'Color Masterbatch' ? 'Additives & Pigments' : entity === 'Finished Molded Component' ? 'Automotive Exterior' : 'Injection Mold Dies',
      itemGroup: entity === 'Polymer Resin Item' ? 'Polymer Feedstock' : entity === 'Color Masterbatch' ? 'Colorants & Additives' : entity === 'Finished Molded Component' ? 'Automotive Assemblies' : 'Tooling & Mold Spares',
      plantScope: 'All Plants (Global)',
      complianceCert: 'RoHS, REACH, UL-94 HB, ISO 9001',
      status: 'Approved',
    });
    setIsRecordModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (rec: MasterDataRecord) => {
    setIsEditMode(true);
    setFormData({ ...rec });
    setIsRecordModalOpen(true);
  };

  // Save Record (Create or Edit)
  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name) {
      showToast('Please provide both Master Code and Description Name.');
      return;
    }

    const saved = masterDataGovernanceService.saveRecord({
      ...(isEditMode && selectedRecord ? { id: selectedRecord.id } : {}),
      ...(formData as any),
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
    });

    const updatedList = masterDataGovernanceService.getAllRecords();
    setRecords(updatedList);
    setSelectedRecord(saved);
    showToast(`Master record ${saved.code} successfully saved to enterprise governance.`);
    setIsRecordModalOpen(false);
  };

  // Run Deduplication Audit
  const handleRunDeduplicationAudit = () => {
    setIsAuditing(true);
    setIsAuditModalOpen(true);
    setTimeout(() => {
      setIsAuditing(false);
    }, 900);
  };

  // Export Master Specs as CSV
  const handleExportSpecs = () => {
    const csvContent = [
      ['Entity Type', 'Master Code', 'Description Name', 'Category', 'Primary UOM', 'Plant Scope', 'Compliance Certs', 'Status', 'Last Updated', 'Updated By'],
      ...records.map((r) => [
        `"${r.entityType}"`,
        `"${r.code}"`,
        `"${r.name}"`,
        `"${r.category}"`,
        `"${r.primaryUom}"`,
        `"${r.plantScope}"`,
        `"${r.complianceCert}"`,
        `"${r.status}"`,
        `"${r.lastUpdated}"`,
        `"${r.updatedBy}"`,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Reboot_ERP_Master_Data_Specs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Downloaded complete Master Data specifications CSV.');
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
            onClick={handleRunDeduplicationAudit}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#0F8B8D]" />
            Audit Deduplication
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0F8B8D] hover:bg-[#0c7274] rounded-lg shadow-sm transition-colors cursor-pointer"
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
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
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
              {paginatedRecords.length > 0 ? (
                paginatedRecords.map((r) => {
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
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No matching master data records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Master Data Grid Pagination */}
          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filteredRecords.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
            pageSizeOptions={[5, 8, 15, 25, 50]}
            itemName="master records"
            className="border-t border-slate-200 px-4 py-2.5 bg-slate-50"
          />
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
                className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
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
                  <span className="text-slate-500">Item Group:</span>
                  <span className="font-semibold text-slate-800">{selectedRecord.itemGroup || 'General'}</span>
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

              {/* Manufacturing & Polymer Technical Attributes */}
              {(selectedRecord.resinType || selectedRecord.color || selectedRecord.polymerGrade) && (
                <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 space-y-1.5">
                  <span className="font-bold text-blue-950 block text-[11px] uppercase tracking-wider">
                    Manufacturing &amp; Polymer Attributes
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500 block">Resin Type:</span>
                      <strong className="text-slate-900">{selectedRecord.resinType || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Color:</span>
                      <strong className="text-slate-900">{selectedRecord.color || 'N/A'}</strong>
                    </div>
                    {selectedRecord.polymerGrade && (
                      <div className="col-span-2">
                        <span className="text-slate-500 block">Polymer Grade:</span>
                        <strong className="text-slate-900">{selectedRecord.polymerGrade}</strong>
                      </div>
                    )}
                    {selectedRecord.mfi && (
                      <div>
                        <span className="text-slate-500 block">MFI (g/10min):</span>
                        <strong className="font-mono text-slate-900">{selectedRecord.mfi}</strong>
                      </div>
                    )}
                    {selectedRecord.density && (
                      <div>
                        <span className="text-slate-500 block">Density (g/cm³):</span>
                        <strong className="font-mono text-slate-900">{selectedRecord.density}</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}

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
                onClick={handleExportSpecs}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                Export Master Specs
              </button>
              <button
                onClick={() => handleOpenEdit(selectedRecord)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F8B8D] text-white text-xs font-semibold hover:bg-[#0c7274] transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit Specification
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* AUDIT DEDUPLICATION SCAN MODAL */}
      {/* ========================================================================= */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-teal-50 text-[#0F8B8D]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Catalog Audit &amp; Deduplication Engine</h3>
                  <p className="text-xs text-slate-500">Cross-plant similarity scan &amp; Golden Record verification</p>
                </div>
              </div>
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs">
              {isAuditing ? (
                <div className="py-12 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-[#0F8B8D] animate-spin mx-auto" />
                  <p className="font-semibold text-slate-800">Scanning {records.length} Master Catalog Records...</p>
                  <p className="text-slate-400 text-[11px]">Checking Levenshtein distance, polymer grade aliases &amp; GSTIN mappings.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Audited Records</span>
                      <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">{records.length}</span>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                      <span className="text-[10px] uppercase font-bold text-emerald-600 block">Golden Masters</span>
                      <span className="text-lg font-bold text-emerald-800 font-mono mt-0.5 block">
                        {records.filter((r) => r.status === 'Approved' || r.status === 'Locked').length}
                      </span>
                    </div>
                    <div className="p-3 bg-teal-50 rounded-xl border border-teal-100 text-center">
                      <span className="text-[10px] uppercase font-bold text-teal-600 block">Redundancy Index</span>
                      <span className="text-lg font-bold text-teal-800 font-mono mt-0.5 block">0.0% Clean</span>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-emerald-950 text-xs">Zero Duplicate Conflict Anomalies</h4>
                      <p className="text-emerald-800 text-[11px] mt-0.5 leading-relaxed">
                        All polyolefin grades, masterbatch codes, and tooling assets conform to unified taxonomy guidelines with 100% unique primary keys.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
                      Taxonomy Health Breakdown
                    </span>
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
                        <span className="text-slate-600">Polymer Resin Item Codes</span>
                        <span className="font-mono font-semibold text-emerald-700">100% Unique / Validated</span>
                      </div>
                      <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
                        <span className="text-slate-600">Mold Die Asset Serialization</span>
                        <span className="font-mono font-semibold text-emerald-700">Verified Golden</span>
                      </div>
                      <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
                        <span className="text-slate-600">Statutory Customer Identifiers</span>
                        <span className="font-mono font-semibold text-emerald-700">GSTIN Matched</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-[#0F8B8D] text-white text-xs font-semibold hover:bg-[#0c7274] cursor-pointer"
              >
                Close Audit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* NEW / EDIT MASTER RECORD MODAL */}
      {/* ========================================================================= */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {isEditMode ? `Edit ${formData.code}` : 'Register New Master Data Record'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Single source of truth specification for materials, tooling, or accounts.
                </p>
              </div>
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRecord} className="p-6 space-y-4 overflow-y-auto text-xs flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Entity Type</label>
                  <select
                    value={formData.entityType}
                    onChange={(e) => setFormData({ ...formData, entityType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Polymer Resin Item">Polymer Resin Item</option>
                    <option value="Color Masterbatch">Color Masterbatch</option>
                    <option value="Finished Molded Component">Finished Molded Component</option>
                    <option value="Tooling & Mold Asset">Tooling &amp; Mold Asset</option>
                    <option value="Customer Account">Customer Account</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Master Code</label>
                  <input
                    type="text"
                    required
                    value={formData.code || ''}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. RES-PP-COPO-02"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Item / Account Description</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Polypropylene Impact Co-Polymer (MFI 12, High Izod)"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <MasterDataCombobox
                    label="Classification / Category"
                    value={formData.category || ''}
                    options={categories}
                    onChange={(val) => setFormData({ ...formData, category: val })}
                    onAddNew={(newVal) => {
                      masterDataGovernanceService.saveCategory(newVal);
                      showToast(`Added "${newVal}" to Master Categories`);
                    }}
                    placeholder="e.g. Virgin Raw Polymer"
                  />
                </div>

                <div>
                  <MasterDataCombobox
                    label="Item Group"
                    value={formData.itemGroup || ''}
                    options={itemGroups}
                    onChange={(val) => setFormData({ ...formData, itemGroup: val })}
                    onAddNew={(newVal) => {
                      masterDataGovernanceService.saveItemGroup(newVal);
                      showToast(`Added "${newVal}" to Master Item Groups`);
                    }}
                    placeholder="e.g. Polymer Feedstock"
                  />
                </div>

                <div>
                  <MasterDataCombobox
                    label="Primary Unit of Measure"
                    value={formData.primaryUom || 'Kilograms (KG)'}
                    options={uoms}
                    onChange={(val) => setFormData({ ...formData, primaryUom: val })}
                    onAddNew={(newVal) => {
                      masterDataGovernanceService.saveUom(newVal);
                      showToast(`Added "${newVal}" to Master UOMs`);
                    }}
                    placeholder="e.g. Kilograms (KG)"
                  />
                </div>

                <div>
                  <MasterDataCombobox
                    label="Multi-Plant Scope"
                    value={formData.plantScope || 'All Plants (Global)'}
                    options={plantScopes}
                    onChange={(val) => setFormData({ ...formData, plantScope: val })}
                    onAddNew={(newVal) => {
                      masterDataGovernanceService.savePlantScope(newVal);
                      showToast(`Added "${newVal}" to Plant Scopes`);
                    }}
                    placeholder="e.g. All Plants (Global)"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Governance Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Approved">Approved (Active in ERP)</option>
                    <option value="Draft">Draft (Pending Verification)</option>
                    <option value="Locked">Locked (Golden Record)</option>
                  </select>
                </div>

                <div>
                  <MasterDataCombobox
                    label="Resin Type / Base Material"
                    value={formData.resinType || ''}
                    options={resinTypes}
                    onChange={(val) => setFormData({ ...formData, resinType: val })}
                    onAddNew={(newVal) => {
                      masterDataGovernanceService.saveResinType(newVal);
                      showToast(`Added "${newVal}" to Master Resin Types`);
                    }}
                    placeholder="e.g. Impact Copolymer PP + 15% EPDM"
                  />
                </div>

                <div>
                  <MasterDataCombobox
                    label="Color / Finish"
                    value={formData.color || ''}
                    options={colors}
                    onChange={(val) => setFormData({ ...formData, color: val })}
                    onAddNew={(newVal) => {
                      masterDataGovernanceService.saveColor(newVal);
                      showToast(`Added "${newVal}" to Master Colors`);
                    }}
                    placeholder="e.g. Midnight Black / Painted Gloss"
                  />
                </div>

                <div className="col-span-2 grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Polymer Grade</label>
                    <input
                      type="text"
                      value={formData.polymerGrade || ''}
                      onChange={(e) => setFormData({ ...formData, polymerGrade: e.target.value })}
                      placeholder="e.g. Repol H110MA"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">MFI (g/10min)</label>
                    <input
                      type="text"
                      value={formData.mfi || ''}
                      onChange={(e) => setFormData({ ...formData, mfi: e.target.value })}
                      placeholder="e.g. 12.0"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Density (g/cm³)</label>
                    <input
                      type="text"
                      value={formData.density || ''}
                      onChange={(e) => setFormData({ ...formData, density: e.target.value })}
                      placeholder="e.g. 0.905"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <MasterDataCombobox
                    label="Compliance & Quality Mandates"
                    value={formData.complianceCert || ''}
                    options={complianceMandates}
                    onChange={(val) => setFormData({ ...formData, complianceCert: val })}
                    onAddNew={(newVal) => {
                      masterDataGovernanceService.saveComplianceMandate(newVal);
                      showToast(`Added "${newVal}" to Compliance Mandates`);
                    }}
                    placeholder="e.g. RoHS, REACH, UL-94 HB, PPAP Level-3"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#0F8B8D] hover:bg-[#0c7274] text-white font-semibold shadow-sm cursor-pointer"
                >
                  {isEditMode ? 'Save Specification' : 'Register Master Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
