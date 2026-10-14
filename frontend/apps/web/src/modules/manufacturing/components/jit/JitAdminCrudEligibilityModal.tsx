import React, { useState } from 'react';
import {
  X,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  UserCheck,
  UserX,
  Users,
  Key,
  Plus,
  Trash2,
  Check,
} from 'lucide-react';
import { CrudEligibilityUser } from './jitTypes';

interface Props {
  eligibleUsers: CrudEligibilityUser[];
  onUpdateEligibleUsers: (users: CrudEligibilityUser[]) => void;
  isAdminUnlocked: boolean;
  onToggleAdminUnlock: (unlocked: boolean) => void;
  onClose: () => void;
}

export const JitAdminCrudEligibilityModal: React.FC<Props> = ({
  eligibleUsers,
  onUpdateEligibleUsers,
  isAdminUnlocked,
  onToggleAdminUnlock,
  onClose,
}) => {
  const [userList, setUserList] = useState<CrudEligibilityUser[]>(eligibleUsers);
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('Senior Production Planner');
  const [newUserDept, setNewUserDept] = useState('Manufacturing');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleToggleUserPermission = (
    id: string,
    field: 'canEditReleased' | 'canDeleteReleased' | 'canAddReleased' | 'canRollbackInputWO'
  ) => {
    const updated = userList.map((u) => (u.id === id ? { ...u, [field]: !u[field] } : u));
    setUserList(updated);
  };

  const handleAddUser = () => {
    if (!newUserName.trim()) return;
    const nextId = `user-auth-${Date.now()}`;
    const newUser: CrudEligibilityUser = {
      id: nextId,
      name: newUserName.trim(),
      role: newUserRole,
      department: newUserDept,
      canEditReleased: true,
      canDeleteReleased: false,
      canAddReleased: true,
      canRollbackInputWO: true,
    };
    setUserList([...userList, newUser]);
    setNewUserName('');
  };

  const handleDeleteUser = (id: string) => {
    setUserList(userList.filter((u) => u.id !== id));
  };

  const handleSave = () => {
    onUpdateEligibleUsers(userList);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Released Schedule Lock &amp; Admin CRUD Governance
              </h3>
              <p className="text-xs text-slate-500">
                Define who is authorized to modify schedules or edit/rollback work orders after floor input has started
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Master Admin Override Switch */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 font-bold text-indigo-950 text-sm">
                {isAdminUnlocked ? <Unlock className="w-4 h-4 text-emerald-600" /> : <Lock className="w-4 h-4 text-amber-600" />}
                <span>Admin Master Bypass / Emergency Unlock</span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                When enabled, Administrator session allows immediate editing, deletion, and rollback on released schedules and active work orders.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onToggleAdminUnlock(!isAdminUnlocked)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 ${
                isAdminUnlocked
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-800 hover:bg-slate-900 text-white'
              }`}
            >
              {isAdminUnlocked ? (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Unlocked (Active)</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Lock Enforced</span>
                </>
              )}
            </button>
          </div>

          {/* User Eligibility Matrix */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600" />
                Designated Authorized Users &amp; Role Privileges
              </span>
              <span className="text-[11px] text-slate-500">
                {userList.length} Authorized Personnels
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                    <th className="py-2.5 px-3">Personnel</th>
                    <th className="py-2.5 px-3">Role / Dept</th>
                    <th className="py-2.5 px-2 text-center">Edit Job</th>
                    <th className="py-2.5 px-2 text-center">Add Job</th>
                    <th className="py-2.5 px-2 text-center">Delete Job</th>
                    <th className="py-2.5 px-2 text-center bg-indigo-50/50">Edit/Rollback Active WO</th>
                    <th className="py-2.5 px-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {userList.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3">
                        <strong className="text-slate-800 font-semibold">{user.name}</strong>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                        <div>{user.role}</div>
                        <div className="text-[10px] text-slate-400">{user.department}</div>
                      </td>

                      {/* Can Edit */}
                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={user.canEditReleased}
                          onChange={() => handleToggleUserPermission(user.id, 'canEditReleased')}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

                      {/* Can Add */}
                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={user.canAddReleased}
                          onChange={() => handleToggleUserPermission(user.id, 'canAddReleased')}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

                      {/* Can Delete */}
                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={user.canDeleteReleased}
                          onChange={() => handleToggleUserPermission(user.id, 'canDeleteReleased')}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

                      {/* Can Rollback Active Floor WO */}
                      <td className="py-2.5 px-2 text-center bg-indigo-50/20">
                        <input
                          type="checkbox"
                          checked={Boolean(user.canRollbackInputWO)}
                          onChange={() => handleToggleUserPermission(user.id, 'canRollbackInputWO')}
                          className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
                          title="Authorize user to modify or rollback orders after floor input has begun"
                        />
                      </td>

                      {/* Delete user */}
                      <td className="py-2.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                          title="Remove user authorization"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add New Authorized User form */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
            <span className="font-bold text-slate-700 text-xs block">
              + Authorize Another User / Role
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="User / Planner Name (e.g. S. Nair)"
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="Senior Production Planner">Senior Production Planner</option>
                <option value="Plant Head">Plant Head</option>
                <option value="Quality Assurance Lead">Quality Assurance Lead</option>
                <option value="Shift In-Charge Supervisor">Shift In-Charge Supervisor</option>
              </select>
              <button
                type="button"
                onClick={handleAddUser}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg px-3 py-1.5 text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Authorized User</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            {savedSuccess ? <Check className="w-3.5 h-3.5" /> : null}
            <span>{savedSuccess ? 'Saved & Applied!' : 'Save Permissions'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
