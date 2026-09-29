import React, { useState, useEffect } from 'react';
import {
  AlertOctagon,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Tag,
  Sliders,
  Settings,
  ShieldAlert,
  Flame,
  Wrench,
  Boxes,
  Users,
  TrendingUp,
  DollarSign,
  Briefcase,
  ChevronDown,
  Layers,
  Edit2,
  Trash2,
  Lock,
  Check,
  X,
} from 'lucide-react';
import { ReasonCodeItem, reasonCodes, mockReasonCodes } from '../../data/adminExtendedData';
import { masterDataGovernanceService } from '../../services/masterDataGovernanceService';
import { SupabaseDataService } from '../../services/supabaseService';
import { adminEventBus } from '../../services/adminService';
import { isUserAdmin } from '../../utils/warehouseSync';
import { useAuthContext } from '../../shared/components/RequireAuth';

const REASON_CODES_STORAGE_KEY = 'reboot_erp_master_reason_codes';

interface AdminReasonCodesViewProps {
  showToast?: (msg: string) => void;
}

export const AdminReasonCodesView: React.FC<AdminReasonCodesViewProps> = ({
  showToast = (_msg: string) => {},
}) => {
  const { currentUser } = useAuthContext();
  const isAdmin = isUserAdmin(currentUser);

  // Initialize reason codes from local storage or fallback to mockReasonCodes
  const [reasonCodes, setReasonCodes] = useState<ReasonCodeItem[]>(() => {
    try {
      const stored = localStorage.getItem(REASON_CODES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse reason codes from storage', e);
    }
    // Save defaults into storage if first run
    try {
      localStorage.setItem(REASON_CODES_STORAGE_KEY, JSON.stringify(mockReasonCodes));
    } catch {}
    return mockReasonCodes;
  });

  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedSubCat, setSelectedSubCat] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReason, setEditingReason] = useState<ReasonCodeItem | null>(null);

  // Save reason codes list helper
  const saveReasonCodesList = (list: ReasonCodeItem[]) => {
    setReasonCodes(list);
    try {
      localStorage.setItem(REASON_CODES_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save reason codes to storage', e);
    }
    adminEventBus.emit('REASON_CODES_UPDATED', list);
  };

  const [newReason, setNewReason] = useState({
    code: '',
    title: '',
    department: 'Production',
    subCategory: 'rejection reasons',
    description: '',
    severity: 'Medium' as const,
    affectsOEE: true,
    defaultAction: '',
  });

  const departmentList = [
    { id: 'ALL', label: 'All Domains', icon: Layers },
    { id: 'Production', label: 'Production (Molding & Purge)', icon: Flame },
    { id: 'Warehouse', label: 'Warehouse & Silo WMS', icon: Boxes },
    { id: 'Quality', label: 'Quality & IATF Lab', icon: ShieldAlert },
    { id: 'Maintenance', label: 'Maintenance & Tooling', icon: Wrench },
    { id: 'Human Resources', label: 'HR & Safety Cadence', icon: Users },
    { id: 'Sales & CRM', label: 'Sales & Mold RFQ CRM', icon: TrendingUp },
    { id: 'Procurement', label: 'Procurement & Polymer SCM', icon: Briefcase },
    { id: 'Finance', label: 'Finance, Tax & Cost Centers', icon: DollarSign },
  ];

  // Derive available subcategories based on department
  const getSubcategories = () => {
    if (selectedDept === 'Production') {
      return ['ALL', 'rejection reasons', 'downtime reasons', 'scrap reasons', 'runner/lumbes categories'];
    }
    if (selectedDept === 'Warehouse') {
      return ['ALL', 'stock adjustment reasons', 'transfer reasons', 'putaway exceptions', 'cycle count variance reasons'];
    }
    if (selectedDept === 'Quality') {
      return ['ALL', 'defect codes', 'hold reasons', 'disposition reasons'];
    }
    if (selectedDept === 'Maintenance') {
      return ['ALL', 'breakdown reasons', 'preventive maintenance types'];
    }
    if (selectedDept === 'Human Resources') {
      return ['ALL', 'shift patterns', 'overtime rules', 'training categories'];
    }
    if (selectedDept === 'Sales & CRM') {
      return ['ALL', 'lead sources', 'opportunity stages', 'lost reasons'];
    }
    if (selectedDept === 'Procurement') {
      return ['ALL', 'supplier categories', 'purchase approval limits'];
    }
    if (selectedDept === 'Finance') {
      return ['ALL', 'tax codes', 'currency', 'cost centers'];
    }
    return ['ALL'];
  };

  const filteredCodes = reasonCodes.filter((rc) => {
    const matchDept = selectedDept === 'ALL' || rc.department === selectedDept;
    const matchSubCat = selectedSubCat === 'ALL' || rc.subCategory.toLowerCase() === selectedSubCat.toLowerCase();
    const matchSearch =
      rc.code.toLowerCase().includes(search.toLowerCase()) ||
      rc.title.toLowerCase().includes(search.toLowerCase()) ||
      rc.description.toLowerCase().includes(search.toLowerCase()) ||
      rc.subCategory.toLowerCase().includes(search.toLowerCase());
    return matchDept && matchSubCat && matchSearch;
  });

  const handleToggleActive = (id: string) => {
    if (!isAdmin) {
      showToast('⚠️ Admin privileges required to enable/disable reason codes.');
      return;
    }

    const updated = reasonCodes.map((r) => {
      if (r.id === id) {
        const next = !r.isActive;
        showToast(`Reason Code ${r.code} is now ${next ? 'Active' : 'Disabled'}.`);
        return { ...r, isActive: next };
      }
      return r;
    });
    saveReasonCodesList(updated);
  };

  const handleCreateReason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showToast('⚠️ Admin privileges required to add new reason codes.');
      return;
    }

    if (!newReason.code.trim() || !newReason.title.trim()) {
      showToast('Please fill out Reason Code and Title.');
      return;
    }

    const cleanCode = newReason.code.trim().toUpperCase();

    const created: ReasonCodeItem = {
      id: `RC-${cleanCode}-${Date.now().toString().slice(-4)}`,
      code: cleanCode,
      title: newReason.title.trim(),
      department: newReason.department,
      subCategory: newReason.subCategory.trim(),
      description: newReason.description.trim(),
      severity: newReason.severity,
      affectsOEE: newReason.affectsOEE,
      defaultAction: newReason.defaultAction.trim() || 'Log in shopfloor register.',
      isActive: true,
    };

    const updated = [created, ...reasonCodes];
    saveReasonCodesList(updated);

    // Save to Supabase Database
    try {
      await SupabaseDataService.upsertReasonCode({
        code: created.code,
        title: created.title,
        department: created.department,
        sub_category: created.subCategory,
        description: created.description,
        severity: created.severity,
        affects_oee: created.affectsOEE,
        default_action: created.defaultAction,
        is_active: created.isActive,
      });
    } catch (err) {
      console.warn('Supabase reason code save notice:', err);
    }

    // Record audit event
    masterDataGovernanceService.recordAudit({
      entityType: 'REASON_CODE',
      entityCode: created.code,
      entityName: created.title,
      action: 'CREATE',
      changedBy: currentUser?.name || 'Super Administrator',
      userRole: 'admin',
      changeSummary: `Created industrial reason code ${created.code} (${created.department} - ${created.subCategory}).`,
    });

    adminEventBus.emit('REASON_CODE_SAVED', created);
    setIsModalOpen(false);
    setNewReason({
      code: '',
      title: '',
      department: 'Production',
      subCategory: 'rejection reasons',
      description: '',
      severity: 'Medium',
      affectsOEE: true,
      defaultAction: '',
    });

    showToast(`✓ Reason Code "${created.code}" saved in DB & active on front end.`);
  };

  const handleOpenEdit = (rc: ReasonCodeItem) => {
    if (!isAdmin) {
      showToast('⚠️ Only Administrators can edit reason codes.');
      return;
    }
    setEditingReason({ ...rc });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReason) return;

    if (!isAdmin) {
      showToast('⚠️ Admin privileges required to update reason codes.');
      return;
    }

    const updated = reasonCodes.map((r) => (r.id === editingReason.id ? editingReason : r));
    saveReasonCodesList(updated);

    // Persist to Supabase
    try {
      await SupabaseDataService.upsertReasonCode({
        code: editingReason.code,
        title: editingReason.title,
        department: editingReason.department,
        sub_category: editingReason.subCategory,
        description: editingReason.description,
        severity: editingReason.severity,
        affects_oee: editingReason.affectsOEE,
        default_action: editingReason.defaultAction,
        is_active: editingReason.isActive,
      });
    } catch (err) {
      console.warn('Supabase update error:', err);
    }

    masterDataGovernanceService.recordAudit({
      entityType: 'REASON_CODE',
      entityCode: editingReason.code,
      entityName: editingReason.title,
      action: 'UPDATE',
      changedBy: currentUser?.name || 'Super Administrator',
      userRole: 'admin',
      changeSummary: `Updated reason code ${editingReason.code} settings and countermeasure.`,
    });

    adminEventBus.emit('REASON_CODE_SAVED', editingReason);
    setEditingReason(null);
    showToast(`✓ Reason Code "${editingReason.code}" updated in DB.`);
  };

  const handleDeleteReason = (rc: ReasonCodeItem) => {
    if (!isAdmin) {
      showToast('⚠️ Admin privileges required to delete reason codes.');
      return;
    }
    const updated = reasonCodes.filter((r) => r.id !== rc.id);
    saveReasonCodesList(updated);
    showToast(`Deleted Reason Code: ${rc.code}.`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <AlertOctagon className="w-4 h-4 text-[#E8622C]" />
            <span>Master Taxonomy &amp; Exception Handling</span>
            {isAdmin ? (
              <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                Admin Mode (Full Access)
              </span>
            ) : (
              <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> Read-Only Mode
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Reason Code Setup Screen</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Exhaustive industrial configuration for plastics manufacturing: rejection causes, injection mold downtime, purge runner categories, warehouse adjustments, lab holds, and cost center allocation.
          </p>
        </div>

        {isAdmin ? (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F8B8D] hover:bg-[#0c7274] rounded-lg shadow-sm transition-colors self-start md:self-auto cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Reason Code
          </button>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 text-xs font-semibold border border-slate-200">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Admin Mode Required to Edit</span>
          </div>
        )}
      </div>

      {/* Department Tabs Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
        {departmentList.map((dep) => {
          const Icon = dep.icon;
          const isSelected = selectedDept === dep.id;
          return (
            <button
              key={dep.id}
              onClick={() => {
                setSelectedDept(dep.id);
                setSelectedSubCat('ALL');
              }}
              className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#0F8B8D] text-white border-[#0F8B8D] shadow-xs'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <Icon className={`w-4 h-4 mb-1.5 ${isSelected ? 'text-white' : 'text-[#0F8B8D]'}`} />
              <span className="text-[11px] font-bold leading-tight line-clamp-2">{dep.label}</span>
            </button>
          );
        })}
      </div>

      {/* Subcategory Pills & Search Filter */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search code (e.g. SHORT-SHOT, FLASH, MFI, GST)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-900">{filteredCodes.length}</strong> reason codes
          </div>
        </div>

        {/* Subcategories */}
        {selectedDept !== 'ALL' && (
          <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Subcategory:</span>
            {getSubcategories().map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubCat(sub)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors capitalize cursor-pointer ${
                  selectedSubCat.toLowerCase() === sub.toLowerCase()
                    ? 'bg-teal-50 text-[#0F8B8D] border border-teal-200 font-semibold'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Reason Codes Table / Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCodes.map((rc) => (
          <div
            key={rc.id}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {rc.code}
                  </span>
                  <span className="text-[10px] font-semibold text-[#0F8B8D] capitalize block mt-1">
                    {rc.subCategory}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      rc.severity === 'Critical'
                        ? 'bg-rose-100 text-rose-700'
                        : rc.severity === 'High'
                        ? 'bg-orange-100 text-orange-700'
                        : rc.severity === 'Medium'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {rc.severity}
                  </span>

                  {/* Edit Option: Only Admin (Task-1) */}
                  {isAdmin ? (
                    <button
                      onClick={() => handleOpenEdit(rc)}
                      className="p-1 rounded text-slate-400 hover:text-[#0F8B8D] hover:bg-teal-50 transition-colors cursor-pointer"
                      title="Edit Reason Code (Admin Only)"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span title="Admin permission required to edit">
                      <Lock className="w-3 h-3 text-slate-300" />
                    </span>
                  )}

                  <button
                    onClick={() => handleToggleActive(rc.id)}
                    disabled={!isAdmin}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      rc.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                    } ${isAdmin ? 'cursor-pointer hover:ring-2 hover:ring-teal-200' : 'cursor-not-allowed'}`}
                    title={
                      !isAdmin
                        ? 'Admin required to toggle active status'
                        : rc.isActive
                        ? 'Active (Click to disable)'
                        : 'Disabled (Click to activate)'
                    }
                  />

                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteReason(rc)}
                      className="p-1 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete Reason Code"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <h3 className="font-bold text-xs text-slate-900 mt-2">{rc.title}</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-2">{rc.description}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Department:</span>
                <span className="font-semibold text-slate-700">{rc.department}</span>
              </div>

              {rc.affectsOEE && (
                <div className="flex items-center gap-1 text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 w-fit">
                  <Zap className="w-3 h-3" />
                  <span>Direct OEE Downtime / Quality Penalty</span>
                </div>
              )}

              <div className="p-2 bg-slate-50 rounded-lg text-[11px] text-slate-600">
                <strong className="text-slate-700 block text-[10px] uppercase font-semibold">Standard Action:</strong>
                {rc.defaultAction}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Create Reason Code */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6">
            <h3 className="font-bold text-slate-900 text-base mb-1">Add Industrial Reason Code</h3>
            <p className="text-xs text-slate-500 mb-4">
              Configure scrap, downtime, stock adjustment, or defect taxonomy parameters (Persists to DB).
            </p>

            <form onSubmit={handleCreateReason} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Reason Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. REJ-JETTING-01"
                    value={newReason.code}
                    onChange={(e) => setNewReason({ ...newReason, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono uppercase font-bold focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Severity Tier</label>
                  <select
                    value={newReason.severity}
                    onChange={(e) => setNewReason({ ...newReason, severity: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reason Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jetting Marks Near Injection Pin Gate"
                  value={newReason.title}
                  onChange={(e) => setNewReason({ ...newReason, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={newReason.department}
                    onChange={(e) => setNewReason({ ...newReason, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  >
                    <option value="Production">Production</option>
                    <option value="Warehouse">Warehouse</option>
                    <option value="Quality">Quality</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Sales & CRM">Sales & CRM</option>
                    <option value="Procurement">Procurement</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Subcategory</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. rejection reasons"
                    value={newReason.subCategory}
                    onChange={(e) => setNewReason({ ...newReason, subCategory: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description &amp; Root Cause</label>
                <textarea
                  rows={2}
                  placeholder="Explain mechanism (e.g. melt speed too fast entering gate)..."
                  value={newReason.description}
                  onChange={(e) => setNewReason({ ...newReason, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Standard Operator Countermeasure</label>
                <input
                  type="text"
                  placeholder="e.g. Lower first stage injection speed by 10mm/s"
                  value={newReason.defaultAction}
                  onChange={(e) => setNewReason({ ...newReason, defaultAction: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="affectsOeeCheck"
                  checked={newReason.affectsOEE}
                  onChange={(e) => setNewReason({ ...newReason, affectsOEE: e.target.checked })}
                  className="rounded text-[#0F8B8D]"
                />
                <label htmlFor="affectsOeeCheck" className="text-slate-700 font-semibold cursor-pointer">
                  Direct impact on Machine OEE / Availability calculations
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#0F8B8D] hover:bg-[#0c7274] text-white font-semibold shadow-sm cursor-pointer"
                >
                  Save Reason Code to DB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Reason Code (Admin Only) */}
      {editingReason && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-900 text-base">Edit Reason Code: {editingReason.code}</h3>
              <button
                onClick={() => setEditingReason(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Update description, severity tier, department taxonomy, or countermeasure action.
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reason Code</label>
                  <input
                    type="text"
                    disabled
                    value={editingReason.code}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-100 font-mono font-bold text-slate-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Severity Tier</label>
                  <select
                    value={editingReason.severity}
                    onChange={(e) => setEditingReason({ ...editingReason, severity: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason Title</label>
                <input
                  type="text"
                  required
                  value={editingReason.title}
                  onChange={(e) => setEditingReason({ ...editingReason, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={editingReason.department}
                    onChange={(e) => setEditingReason({ ...editingReason, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  >
                    <option value="Production">Production</option>
                    <option value="Warehouse">Warehouse</option>
                    <option value="Quality">Quality</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Sales & CRM">Sales & CRM</option>
                    <option value="Procurement">Procurement</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Subcategory</label>
                  <input
                    type="text"
                    required
                    value={editingReason.subCategory}
                    onChange={(e) => setEditingReason({ ...editingReason, subCategory: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description &amp; Root Cause</label>
                <textarea
                  rows={2}
                  value={editingReason.description}
                  onChange={(e) => setEditingReason({ ...editingReason, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Standard Operator Countermeasure</label>
                <input
                  type="text"
                  value={editingReason.defaultAction}
                  onChange={(e) => setEditingReason({ ...editingReason, defaultAction: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editAffectsOeeCheck"
                  checked={editingReason.affectsOEE}
                  onChange={(e) => setEditingReason({ ...editingReason, affectsOEE: e.target.checked })}
                  className="rounded text-[#0F8B8D]"
                />
                <label htmlFor="editAffectsOeeCheck" className="text-slate-700 font-semibold cursor-pointer">
                  Direct impact on Machine OEE / Availability calculations
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingReason(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#0F8B8D] hover:bg-[#0c7274] text-white font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save Changes to DB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
