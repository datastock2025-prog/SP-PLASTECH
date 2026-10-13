import React, { useState } from 'react';
import { Shield, Lock, Eye, EyeOff, Save, CheckCircle2, UserCheck, AlertCircle } from 'lucide-react';

export interface DomainPermissionConfig {
  role: string;
  userEmail?: string;
  canViewFinancial: boolean;
  canViewProductionOee: boolean;
  canViewQualityPpm: boolean;
  canViewScmOtif: boolean;
  canViewEsgCarbon: boolean;
  canViewMaintenanceMtbf: boolean;
}

interface AdminDomainRbacControlProps {
  isOpen: boolean;
  onClose: () => void;
  showToast?: (msg: string) => void;
  onPermissionsUpdated?: (configs: DomainPermissionConfig[]) => void;
}

export const AdminDomainRbacControl: React.FC<AdminDomainRbacControlProps> = ({
  isOpen,
  onClose,
  showToast = () => {},
  onPermissionsUpdated,
}) => {
  const [permissions, setPermissions] = useState<DomainPermissionConfig[]>([
    {
      role: 'ADMIN',
      canViewFinancial: true,
      canViewProductionOee: true,
      canViewQualityPpm: true,
      canViewScmOtif: true,
      canViewEsgCarbon: true,
      canViewMaintenanceMtbf: true,
    },
    {
      role: 'PLANT_MANAGER',
      canViewFinancial: false,
      canViewProductionOee: true,
      canViewQualityPpm: true,
      canViewScmOtif: true,
      canViewEsgCarbon: true,
      canViewMaintenanceMtbf: true,
    },
    {
      role: 'FINANCE_HEAD',
      canViewFinancial: true,
      canViewProductionOee: false,
      canViewQualityPpm: false,
      canViewScmOtif: true,
      canViewEsgCarbon: false,
      canViewMaintenanceMtbf: false,
    },
    {
      role: 'QUALITY_HEAD',
      canViewFinancial: false,
      canViewProductionOee: true,
      canViewQualityPpm: true,
      canViewScmOtif: false,
      canViewEsgCarbon: false,
      canViewMaintenanceMtbf: true,
    },
    {
      role: 'OPERATOR',
      canViewFinancial: false,
      canViewProductionOee: true,
      canViewQualityPpm: false,
      canViewScmOtif: false,
      canViewEsgCarbon: false,
      canViewMaintenanceMtbf: false,
    },
  ]);

  if (!isOpen) return null;

  const togglePermission = (index: number, field: keyof DomainPermissionConfig) => {
    setPermissions((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: !copy[index][field] };
      return copy;
    });
  };

  const handleSave = () => {
    localStorage.setItem('sp_domain_rbac_matrix', JSON.stringify(permissions));
    onPermissionsUpdated?.(permissions);
    showToast('Domain RBAC permissions updated & applied successfully!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-[#14213D] to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Admin Data Access & Domain RBAC Governance</h2>
              <p className="text-xs text-slate-300">
                Configure which user roles and departments can view specific metric scorecards and AI data domains.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg font-bold">
            &times;
          </button>
        </div>

        {/* Matrix Table */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-3.5">User Role</th>
                  <th className="p-3.5 text-center">Financials</th>
                  <th className="p-3.5 text-center">Production OEE</th>
                  <th className="p-3.5 text-center">Quality PPM</th>
                  <th className="p-3.5 text-center">SCM &amp; OTIF</th>
                  <th className="p-3.5 text-center">ESG Carbon</th>
                  <th className="p-3.5 text-center">MTBF/MTTR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {permissions.map((perm, idx) => (
                  <tr key={perm.role} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 font-bold text-slate-800 flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-teal-600" />
                      {perm.role.replace('_', ' ')}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => togglePermission(idx, 'canViewFinancial')}
                        className={`p-1.5 rounded-lg font-bold ${
                          perm.canViewFinancial ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {perm.canViewFinancial ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => togglePermission(idx, 'canViewProductionOee')}
                        className={`p-1.5 rounded-lg font-bold ${
                          perm.canViewProductionOee ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {perm.canViewProductionOee ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => togglePermission(idx, 'canViewQualityPpm')}
                        className={`p-1.5 rounded-lg font-bold ${
                          perm.canViewQualityPpm ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {perm.canViewQualityPpm ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => togglePermission(idx, 'canViewScmOtif')}
                        className={`p-1.5 rounded-lg font-bold ${
                          perm.canViewScmOtif ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {perm.canViewScmOtif ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => togglePermission(idx, 'canViewEsgCarbon')}
                        className={`p-1.5 rounded-lg font-bold ${
                          perm.canViewEsgCarbon ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {perm.canViewEsgCarbon ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => togglePermission(idx, 'canViewMaintenanceMtbf')}
                        className={`p-1.5 rounded-lg font-bold ${
                          perm.canViewMaintenanceMtbf ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {perm.canViewMaintenanceMtbf ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            <span>Row-level and domain-level filters are enforced in the NestJS Tenant Context &amp; Prisma layer.</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              Save Governance Matrix
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
