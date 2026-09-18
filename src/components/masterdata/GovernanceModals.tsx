import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  History,
  X,
  Search,
  Download,
  Lock,
  Unlock,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  ArrowRight,
  Filter,
  Layers,
  Box,
  Sliders,
  Check,
} from 'lucide-react';
import {
  masterDataGovernanceService,
  MasterDataChangeRecord,
  MasterDataGovernancePermissions,
} from '../../services/masterDataGovernanceService';
import { adminEventBus } from '../../services/adminService';

/* =========================================================================
   TASK 3: POSTGRESQL SECURE AUDIT & CHANGE HISTORY MODAL
   ========================================================================= */
interface AuditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetFilter?: { type?: string; code?: string; name?: string };
  onNavigate?: (view: string, payload?: any) => void;
}

export const AuditHistoryModal: React.FC<AuditHistoryModalProps> = ({
  isOpen,
  onClose,
  targetFilter,
  onNavigate,
}) => {
  const [activeType, setActiveType] = useState<string>(targetFilter?.type || 'ALL');
  const [searchQ, setSearchQ] = useState<string>(targetFilter?.code || '');
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);
  const [logs, setLogs] = useState<MasterDataChangeRecord[]>([]);

  useEffect(() => {
    if (isOpen) {
      setLogs(masterDataGovernanceService.getAuditHistory());
      if (targetFilter?.type) setActiveType(targetFilter.type);
      if (targetFilter?.code) setSearchQ(targetFilter.code);
    }
  }, [isOpen, targetFilter]);

  useEffect(() => {
    const unsub = adminEventBus.on('AUDIT_RECORD_SAVED', (record) => {
      setLogs((prev) => [record, ...prev]);
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const filteredLogs = logs.filter((log) => {
    if (!log) return false;
    if (activeType !== 'ALL' && log.entityType !== activeType) return false;
    if (!searchQ.trim()) return true;
    const q = searchQ.trim().toLowerCase();
    return (
      (log.entityCode || '').toLowerCase().includes(q) ||
      (log.entityName || '').toLowerCase().includes(q) ||
      (log.changedBy || '').toLowerCase().includes(q) ||
      (log.changeSummary || '').toLowerCase().includes(q) ||
      (log.action || '').toLowerCase().includes(q)
    );
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <Check className="w-3 h-3" /> CREATED
          </span>
        );
      case 'UPDATE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
            <Sliders className="w-3 h-3" /> UPDATED
          </span>
        );
      case 'APPROVE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-300">
            <CheckCircle className="w-3 h-3" /> APPROVED
          </span>
        );
      case 'REJECT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertTriangle className="w-3 h-3" /> REJECTED
          </span>
        );
      case 'DELETE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-800 border border-gray-300">
            DELETED
          </span>
        );
      case 'VERSION_RELEASE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
            <Layers className="w-3 h-3" /> RELEASED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
            {action}
          </span>
        );
    }
  };

  const handleExportCsv = () => {
    const headers = ['Audit ID,Timestamp,Entity Type,Entity Code,Entity Name,Action,Changed By,Role,Summary'];
    const rows = filteredLogs.map((l) =>
      [
        `"${l.id}"`,
        `"${l.timestamp}"`,
        `"${l.entityType}"`,
        `"${l.entityCode}"`,
        `"${(l.entityName || '').replace(/"/g, '""')}"`,
        `"${l.action}"`,
        `"${l.changedBy}"`,
        `"${l.userRole}"`,
        `"${(l.changeSummary || '').replace(/"/g, '""')}"`,
      ].join(',')
    );
    const blob = new Blob([[...headers, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `postgresql_master_data_audit_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-50 text-[#0F8B8D] border border-teal-200 shadow-2xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#14213D]">
                  PostgreSQL Master Data Audit &amp; Change History
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Lock className="w-3 h-3" /> SECURE AUDIT LOG
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Immutable chronological log of all Item Master, BOM formulations, approvals and engineering changes.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors"
              title="Export filtered audit trail to CSV"
            >
              <Download className="w-3.5 h-3.5" /> Export Log
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="p-4 border-b border-slate-200 bg-[#F9F8F5] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {['ALL', 'ITEM_MASTER', 'BOM_MASTER', 'ROUTING', 'PLANT'].map((t) => (
              <button
                key={t}
                onClick={() => setActiveType(t)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeType === t
                    ? 'bg-[#0F8B8D] text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {t === 'ALL'
                  ? 'All Entities'
                  : t === 'ITEM_MASTER'
                  ? 'Item Master'
                  : t === 'BOM_MASTER'
                  ? 'BOM Recipes'
                  : t === 'ROUTING'
                  ? 'Routings'
                  : 'Plants'}
              </button>
            ))}
          </div>

          <div className="relative w-full max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search code, user, or summary..."
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-[#0F8B8D]"
            />
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log) => {
              const isExpanded = expandedRecordId === log.id;
              const formattedDate = new Date(log.timestamp).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              return (
                <div
                  key={log.id}
                  className="rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all p-3.5 shadow-2xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-[11px] font-bold text-slate-400">{log.id}</span>
                      {getActionBadge(log.action)}
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {log.entityType}
                      </span>
                      <span className="font-mono font-bold text-xs text-[#0F8B8D]">{log.entityCode}</span>
                      {log.entityName && (
                        <span className="text-xs font-semibold text-slate-800">&mdash; {log.entityName}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-medium">
                        <b>{log.changedBy}</b> ({log.userRole})
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">{formattedDate}</span>
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-slate-700 font-normal pl-1">
                    {log.changeSummary}
                  </div>

                  {log.diff && Object.keys(log.diff).length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => setExpandedRecordId(isExpanded ? null : log.id)}
                        className="text-[11px] font-bold text-[#0F8B8D] hover:underline flex items-center gap-1"
                      >
                        {isExpanded ? 'Hide Field Diffs' : 'View Field Diffs (Before / After)'}
                      </button>
                      {isExpanded && (
                        <div className="mt-2 bg-slate-50 rounded-lg p-2.5 border border-slate-200 font-mono text-[11px] space-y-1">
                          {Object.entries(log.diff).map(([key, val]) => (
                            <div key={key} className="flex items-center gap-2">
                              <span className="font-bold text-slate-600">{key}:</span>
                              <span className="px-1.5 py-0.2 bg-rose-50 text-rose-700 rounded border border-rose-200">
                                {JSON.stringify(val.before)}
                              </span>
                              <ArrowRight className="w-3 h-3 text-slate-400" />
                              <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                                {JSON.stringify(val.after)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              No audit logs found matching criteria.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <b>{filteredLogs.length}</b> audit events &middot; Synced with PostgreSQL database
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors"
          >
            Close Audit Vault
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   TASK 4: ADMIN ROLE-BASED ACCESS CONTROL (RBAC) GOVERNANCE MODAL
   ========================================================================= */
interface GovernancePermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  permissions: MasterDataGovernancePermissions;
  showToast: (msg: string) => void;
}

const AVAILABLE_ROLES = [
  { id: 'admin', label: 'Super Admin / System Administrator' },
  { id: 'plant_operations_director', label: 'Plant Operations Director' },
  { id: 'engineering_manager', label: 'Engineering Manager' },
  { id: 'tooling_lead', label: 'Tooling & Mold Lead' },
  { id: 'quality_director', label: 'Quality Director' },
  { id: 'qa_lead', label: 'QA Lead' },
  { id: 'production_supervisor', label: 'Production Supervisor' },
  { id: 'store_keeper', label: 'Inventory & Store Keeper' },
  { id: 'operator', label: 'Machine Operator' },
];

export const GovernancePermissionsModal: React.FC<GovernancePermissionsModalProps> = ({
  isOpen,
  onClose,
  permissions,
  showToast,
}) => {
  const [perms, setPerms] = useState<MasterDataGovernancePermissions>(permissions);

  useEffect(() => {
    if (isOpen) {
      setPerms(masterDataGovernanceService.getGovernancePermissions());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleRole = (
    key: keyof MasterDataGovernancePermissions,
    roleId: string
  ) => {
    // Admin is permanently enabled
    if (roleId === 'admin') return;

    setPerms((prev) => {
      const list = prev[key] || [];
      const exists = list.includes(roleId);
      const updated = exists ? list.filter((r) => r !== roleId) : [...list, roleId];
      return {
        ...prev,
        [key]: updated,
      };
    });
  };

  const handleSave = () => {
    masterDataGovernanceService.saveGovernancePermissions(perms);
    showToast('✓ Master Data & BOM Grid Permissions updated by Admin!');
    onClose();
  };

  const handleReset = () => {
    const defaultPerms: MasterDataGovernancePermissions = {
      canCreateItemRoles: ['admin', 'super_admin', 'engineering_manager', 'plant_operations_director'],
      canEditItemRoles: ['admin', 'super_admin', 'engineering_manager'],
      canApproveItemRoles: ['admin', 'super_admin', 'quality_director', 'qa_lead'],
      canDeleteItemRoles: ['admin', 'super_admin'],
      canCreateBomRoles: ['admin', 'super_admin', 'tooling_lead', 'engineering_manager'],
      canEditBomRoles: ['admin', 'super_admin', 'tooling_lead', 'engineering_manager'],
      canApproveBomRoles: ['admin', 'super_admin', 'plant_operations_director'],
    };
    setPerms(defaultPerms);
    masterDataGovernanceService.saveGovernancePermissions(defaultPerms);
    showToast('Governance permissions reset to default security matrix.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-purple-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#14213D]">
                  Master Data &amp; BOM Governance &amp; RBAC Control
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800">
                  <Lock className="w-3 h-3" /> ADMIN ONLY
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Task-4: Admin decides who can Create, Edit, Approve, and Delete Item Master and BOM grids.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice */}
        <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-200/80 flex items-center gap-2 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-700" />
          <span>
            <b>Super Admin Override:</b> System Administrators retain full unrestricted authority to edit, approve, or delete all records at any time.
          </span>
        </div>

        {/* RBAC Matrix */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Item Master Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-[#0F8B8D]" />
                <h3 className="text-sm font-bold text-slate-800">Item Master Grid Permissions</h3>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Controls SKU catalog &amp; tooling specs</span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="p-3">User Role</th>
                    <th className="p-3 text-center">Create Item</th>
                    <th className="p-3 text-center">Edit / Inline Grid</th>
                    <th className="p-3 text-center">Approve / Reject</th>
                    <th className="p-3 text-center">Delete Item</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {AVAILABLE_ROLES.map((role) => {
                    const isAdmin = role.id === 'admin';
                    const canCreate = isAdmin || (perms.canCreateItemRoles || []).includes(role.id);
                    const canEdit = isAdmin || (perms.canEditItemRoles || []).includes(role.id);
                    const canApprove = isAdmin || (perms.canApproveItemRoles || []).includes(role.id);
                    const canDelete = isAdmin || (perms.canDeleteItemRoles || []).includes(role.id);

                    return (
                      <tr key={role.id} className="hover:bg-slate-50/80">
                        <td className="p-3 font-semibold text-slate-800 flex items-center gap-2">
                          {role.label}
                          {isAdmin && (
                            <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 text-[9px] font-bold">
                              LOCKED
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={canCreate}
                            disabled={isAdmin}
                            onChange={() => toggleRole('canCreateItemRoles', role.id)}
                            className="rounded text-[#0F8B8D] cursor-pointer"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={canEdit}
                            disabled={isAdmin}
                            onChange={() => toggleRole('canEditItemRoles', role.id)}
                            className="rounded text-[#0F8B8D] cursor-pointer"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={canApprove}
                            disabled={isAdmin}
                            onChange={() => toggleRole('canApproveItemRoles', role.id)}
                            className="rounded text-[#0F8B8D] cursor-pointer"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={canDelete}
                            disabled={isAdmin}
                            onChange={() => toggleRole('canDeleteItemRoles', role.id)}
                            className="rounded text-[#0F8B8D] cursor-pointer"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* BOM Master Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#E8622C]" />
                <h3 className="text-sm font-bold text-slate-800">Bill of Materials (BOM) Grid Permissions</h3>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Controls formulations, blending ratios &amp; routings</span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="p-3">User Role</th>
                    <th className="p-3 text-center">Create BOM Wizard</th>
                    <th className="p-3 text-center">Edit Lines &amp; Scrap</th>
                    <th className="p-3 text-center">Approve &amp; Release</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {AVAILABLE_ROLES.map((role) => {
                    const isAdmin = role.id === 'admin';
                    const canCreate = isAdmin || (perms.canCreateBomRoles || []).includes(role.id);
                    const canEdit = isAdmin || (perms.canEditBomRoles || []).includes(role.id);
                    const canApprove = isAdmin || (perms.canApproveBomRoles || []).includes(role.id);

                    return (
                      <tr key={role.id} className="hover:bg-slate-50/80">
                        <td className="p-3 font-semibold text-slate-800 flex items-center gap-2">
                          {role.label}
                          {isAdmin && (
                            <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 text-[9px] font-bold">
                              LOCKED
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={canCreate}
                            disabled={isAdmin}
                            onChange={() => toggleRole('canCreateBomRoles', role.id)}
                            className="rounded text-[#0F8B8D] cursor-pointer"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={canEdit}
                            disabled={isAdmin}
                            onChange={() => toggleRole('canEditBomRoles', role.id)}
                            className="rounded text-[#0F8B8D] cursor-pointer"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={canApprove}
                            disabled={isAdmin}
                            onChange={() => toggleRole('canApproveBomRoles', role.id)}
                            className="rounded text-[#0F8B8D] cursor-pointer"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
          >
            Reset Defaults
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg bg-[#0F8B8D] hover:bg-[#0D7779] text-white text-xs font-bold transition-colors shadow-xs"
            >
              Save RBAC Policy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
