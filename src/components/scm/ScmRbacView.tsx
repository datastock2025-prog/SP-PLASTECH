import React, { useState } from 'react';
import {
  Shield,
  CheckCircle2,
  Lock,
  Eye,
  Edit,
  UserCheck,
  Search,
  Key,
  Users,
} from 'lucide-react';
import { mockScmRbac } from '../../data/mockScmData';
import { ScmRolePermission } from '../../types/scm';

interface ScmRbacViewProps {
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const ScmRbacView: React.FC<ScmRbacViewProps> = ({ onNavigate, showToast }) => {
  const [roles, setRoles] = useState<ScmRolePermission[]>(mockScmRbac);
  const [selectedRole, setSelectedRole] = useState<ScmRolePermission>(mockScmRbac[0]);

  const handleTogglePermission = (moduleName: string, permKey: 'view' | 'edit' | 'approve' | 'export') => {
    setRoles((prev) =>
      prev.map((r) => {
        if (r.roleId === selectedRole.roleId) {
          const updatedModules = r.modules.map((m) => {
            if (m.moduleName === moduleName) {
              return {
                ...m,
                [permKey]: !m[permKey],
              };
            }
            return m;
          });
          const updatedRole = { ...r, modules: updatedModules };
          setSelectedRole(updatedRole);
          return updatedRole;
        }
        return r;
      })
    );
    showToast(`Updated ${permKey.toUpperCase()} permission for ${moduleName}`);
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 font-mono text-xs font-semibold uppercase">
              Role-Based Access Control (RBAC)
            </span>
            <span className="text-xs text-slate-500">· 11 Specialized SCM Personas</span>
          </div>
          <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D] mt-1">
            SCM Security Matrix &amp; Granular Permissions
          </h1>
          <p className="text-slate-500 text-xs">
            Enforce separation of duties across Demand Planners, Procurement Officers, Warehouse Supervisors, and External Supplier Portals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast('Synchronized SCM Security Policies with SSO / Active Directory')}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Key className="w-4 h-4" />
            <span>Audit &amp; Sync Directory</span>
          </button>
        </div>
      </div>

      {/* Main Grid: 11 Roles & Permissions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles List */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-[#14213D] font-['Space_Grotesk'] border-b border-slate-100 pb-2">
            SCM Personas ({roles.length})
          </h3>
          <div className="space-y-1.5 text-xs">
            {roles.map((r) => (
              <div
                key={r.roleId}
                onClick={() => setSelectedRole(r)}
                className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                  selectedRole.roleId === r.roleId
                    ? 'border-[#0F8B8D] bg-[#0F8B8D]/5 font-bold text-slate-900'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div>
                  <div>{r.roleName}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{r.roleId}</div>
                </div>
                <Users className="w-3.5 h-3.5 text-slate-400" />
              </div>
            ))}
          </div>
        </div>

        {/* Permissions Table for Selected Role (2 Cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-mono text-[#0F8B8D] font-bold uppercase">
                Active Role Matrix
              </span>
              <h2 className="text-base font-bold font-['Space_Grotesk'] text-[#14213D] mt-0.5">
                {selectedRole.roleName}
              </h2>
            </div>
            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-mono font-bold">
              {selectedRole.roleId}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">SCM Functional Module</th>
                  <th className="p-3 text-center">View</th>
                  <th className="p-3 text-center">Edit / Adjust</th>
                  <th className="p-3 text-center">Approve / Lock</th>
                  <th className="p-3 text-center">Export Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {selectedRole.modules.map((m) => (
                  <tr key={m.moduleName} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-semibold text-slate-900">{m.moduleName}</td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={m.view}
                        onChange={() => handleTogglePermission(m.moduleName, 'view')}
                        className="rounded text-[#0F8B8D] cursor-pointer"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={m.edit}
                        onChange={() => handleTogglePermission(m.moduleName, 'edit')}
                        className="rounded text-[#0F8B8D] cursor-pointer"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={m.approve}
                        onChange={() => handleTogglePermission(m.moduleName, 'approve')}
                        className="rounded text-[#0F8B8D] cursor-pointer"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={m.export}
                        onChange={() => handleTogglePermission(m.moduleName, 'export')}
                        className="rounded text-[#0F8B8D] cursor-pointer"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
