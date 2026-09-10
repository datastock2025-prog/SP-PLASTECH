import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Filter,
  Shield,
  KeyRound,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Mail,
  Phone,
  Building,
  Clock,
  Edit2,
  ShieldAlert,
} from 'lucide-react';
import { AdminUser } from '../../types/admin';
import { mockAdminUsers, mockAdminRoles, mockCompanyProfile } from '../../data/mockAdminData';

interface AdminUsersViewProps {
  showToast?: (msg: string) => void;
}

export const AdminUsersView: React.FC<AdminUsersViewProps> = ({ showToast = (_msg: string) => {} }) => {
  const [users, setUsers] = useState<AdminUser[]>(mockAdminUsers);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedPlant, setSelectedPlant] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    designation: '',
    department: 'Manufacturing Execution',
    roleId: 'ROLE-PLANT-MANAGER',
    plantIds: ['PLANT-01'],
    assignedShift: 'Shift A — Morning (06:00 – 14:00)',
    status: 'Active' as AdminUser['status'],
    mfaEnabled: true,
  });

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.designation.toLowerCase().includes(search.toLowerCase());

    const matchesRole = selectedRole === 'ALL' || u.roleId === selectedRole;
    const matchesPlant = selectedPlant === 'ALL' || u.plantIds.includes(selectedPlant);
    const matchesStatus = selectedStatus === 'ALL' || u.status === selectedStatus;

    return matchesSearch && matchesRole && matchesPlant && matchesStatus;
  });

  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData({
      fullName: '',
      username: '',
      email: '',
      phone: '',
      designation: '',
      department: 'Manufacturing Execution',
      roleId: 'ROLE-PLANT-MANAGER',
      plantIds: ['PLANT-01'],
      assignedShift: 'Shift A — Morning (06:00 – 14:00)',
      status: 'Active',
      mfaEnabled: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: AdminUser) => {
    setModalMode('edit');
    setEditingUserId(user.id);
    setFormData({
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      phone: user.phone,
      designation: user.designation,
      department: user.department,
      roleId: user.roleId,
      plantIds: user.plantIds,
      assignedShift: user.assignedShift,
      status: user.status,
      mfaEnabled: user.mfaEnabled,
    });
    setIsModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.username) {
      showToast('Please provide full name, username, and email.');
      return;
    }

    const selectedRoleObj = mockAdminRoles.find((r) => r.id === formData.roleId);
    const plantNames = formData.plantIds.map(
      (pid) => mockCompanyProfile.plants.find((p) => p.id === pid)?.plantName || pid
    );

    if (modalMode === 'create') {
      const newUser: AdminUser = {
        id: `USR-00${users.length + 1}`,
        username: formData.username.toLowerCase().trim(),
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        designation: formData.designation.trim() || 'ERP Operator',
        department: formData.department,
        roleId: formData.roleId,
        roleName: selectedRoleObj?.name || 'Custom Role',
        plantIds: formData.plantIds,
        plantNames,
        assignedShift: formData.assignedShift,
        status: formData.status,
        mfaEnabled: formData.mfaEnabled,
        mfaMethod: formData.mfaEnabled ? 'Authenticator App (TOTP)' : 'None',
        lastLoginDate: 'Never',
        lastLoginIp: '—',
        createdDate: new Date().toISOString().split('T')[0],
        avatarColor: 'from-[#0F8B8D] to-[#E8622C]',
        initials: formData.fullName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2),
        failedLoginAttempts: 0,
      };
      setUsers([newUser, ...users]);
      showToast(`User account for ${newUser.fullName} created with welcome credentials.`);
    } else if (editingUserId) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUserId
            ? {
                ...u,
                fullName: formData.fullName,
                username: formData.username,
                email: formData.email,
                phone: formData.phone,
                designation: formData.designation,
                department: formData.department,
                roleId: formData.roleId,
                roleName: selectedRoleObj?.name || u.roleName,
                plantIds: formData.plantIds,
                plantNames,
                assignedShift: formData.assignedShift,
                status: formData.status,
                mfaEnabled: formData.mfaEnabled,
              }
            : u
        )
      );
      showToast('User profile and permissions updated.');
    }
    setIsModalOpen(false);
  };

  const handleToggleStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextStatus = u.status === 'Active' ? 'Suspended' : 'Active';
          showToast(`User ${u.fullName} is now ${nextStatus}.`);
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
  };

  const handleResetPassword = (user: AdminUser) => {
    const tempPin = Math.floor(1000 + Math.random() * 9000);
    showToast(`Password reset for ${user.fullName}. Temporary OTP PIN: ${tempPin} dispatched.`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <Users className="w-4 h-4 text-[#0F8B8D]" />
            <span>Identity & Access Governance</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">User Management Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Provision ERP employee accounts, assign plant credentials, enforce MFA authentication, and manage active sessions.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F8B8D] hover:bg-[#0c7274] rounded-lg shadow-sm transition-colors self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Provision New User
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, role, or title..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D] focus:border-[#0F8B8D]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Role filter */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="text-xs py-2 px-3 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
          >
            <option value="ALL">All Roles</option>
            {mockAdminRoles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          {/* Plant filter */}
          <select
            value={selectedPlant}
            onChange={(e) => setSelectedPlant(e.target.value)}
            className="text-xs py-2 px-3 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
          >
            <option value="ALL">All Plants</option>
            {mockCompanyProfile.plants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.plantName}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs py-2 px-3 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
            <option value="Locked">Locked</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">User Details</th>
                <th className="py-3 px-4">Role &amp; Department</th>
                <th className="py-3 px-4">Plant Access</th>
                <th className="py-3 px-4">MFA Security</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* User details */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full bg-gradient-to-br ${user.avatarColor} flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0`}
                      >
                        {user.initials}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-[13px]">{user.fullName}</div>
                        <div className="text-slate-400 font-mono text-[11px] flex items-center gap-1.5 mt-0.5">
                          <span>@{user.username}</span>
                          <span>&middot;</span>
                          <span className="text-slate-500">{user.email}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Role & Dept */}
                  <td className="py-3.5 px-4">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {user.roleName}
                    </span>
                    <div className="text-slate-500 text-[11px] mt-1">{user.department}</div>
                    <div className="text-slate-400 text-[10px]">{user.designation}</div>
                  </td>

                  {/* Plant Access */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1 max-w-[220px]">
                      {user.plantNames.map((p, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 border border-slate-200"
                        >
                          {p.split('—')[0].trim()}
                        </span>
                      ))}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">{user.assignedShift.split('—')[0]}</div>
                  </td>

                  {/* MFA */}
                  <td className="py-3.5 px-4">
                    {user.mfaEnabled ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-100">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Enabled (TOTP)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded text-[11px] border border-amber-100">
                        <ShieldAlert className="w-3 h-3 text-amber-600" />
                        Disabled
                      </span>
                    )}
                  </td>

                  {/* Last Login */}
                  <td className="py-3.5 px-4">
                    <div className="text-slate-800 font-medium text-[11px]">{user.lastLoginDate}</div>
                    <div className="text-slate-400 font-mono text-[10px]">{user.lastLoginIp}</div>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        user.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : user.status === 'Suspended'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenEdit(user)}
                        title="Edit User Configuration"
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleResetPassword(user)}
                        title="Reset Password / Dispatch Temporary OTP"
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user.id)}
                        title={user.status === 'Active' ? 'Suspend Account' : 'Reactivate Account'}
                        className={`p-1.5 rounded hover:bg-slate-100 transition-colors ${
                          user.status === 'Active'
                            ? 'text-rose-600 hover:bg-rose-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {user.status === 'Active' ? (
                          <Lock className="w-3.5 h-3.5" />
                        ) : (
                          <Unlock className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {filteredUsers.length} of {users.length} registered system users</span>
          <span>Authentication Protocol: Argon2id Hashed &middot; Session Token 8h</span>
        </div>
      </div>

      {/* Modal: Create or Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">
                {modalMode === 'create' ? 'Provision New ERP User' : 'Edit User Profile'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. Ramesh Kulkarni"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Username (Login ID) *</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="e.g. ramesh.k"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Official Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. ramesh.k@reboot-erp.com"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mobile / WhatsApp No.</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98XXX XXXXX"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="e.g. Tooling Lead Engineer"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Functional Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                  >
                    <option value="Executive Operations">Executive Operations</option>
                    <option value="Manufacturing Execution">Manufacturing Execution</option>
                    <option value="Quality & SPC Laboratory">Quality & SPC Laboratory</option>
                    <option value="Supply Chain & Inventory">Supply Chain & Inventory</option>
                    <option value="Finance & Accounts">Finance & Accounts</option>
                    <option value="Commercial & Sales">Commercial & Sales</option>
                    <option value="Engineering & Maintenance">Engineering & Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">RBAC System Role *</label>
                  <select
                    value={formData.roleId}
                    onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                  >
                    {mockAdminRoles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Operational Shift</label>
                  <select
                    value={formData.assignedShift}
                    onChange={(e) => setFormData({ ...formData, assignedShift: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                  >
                    <option value="General Shift (09:00 – 18:00)">General Shift (09:00 – 18:00)</option>
                    <option value="Shift A — Morning (06:00 – 14:00)">Shift A — Morning (06:00 – 14:00)</option>
                    <option value="Shift B — Afternoon (14:00 – 22:00)">Shift B — Afternoon (14:00 – 22:00)</option>
                    <option value="Shift C — Night (22:00 – 06:00)">Shift C — Night (22:00 – 06:00)</option>
                  </select>
                </div>
              </div>

              {/* Plant Multi-selection */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Authorized Plant Facilities</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {mockCompanyProfile.plants.map((p) => {
                    const isChecked = formData.plantIds.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                          isChecked ? 'bg-[#0F8B8D]/10 border-[#0F8B8D] text-slate-900 font-medium' : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, plantIds: [...formData.plantIds, p.id] });
                            } else {
                              if (formData.plantIds.length > 1) {
                                setFormData({
                                  ...formData,
                                  plantIds: formData.plantIds.filter((id) => id !== p.id),
                                });
                              }
                            }
                          }}
                          className="rounded text-[#0F8B8D] focus:ring-[#0F8B8D]"
                        />
                        <span>{p.plantCode}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* MFA and Account Status */}
              <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.mfaEnabled}
                    onChange={(e) => setFormData({ ...formData, mfaEnabled: e.target.checked })}
                    className="rounded text-[#0F8B8D] focus:ring-[#0F8B8D]"
                  />
                  <span className="font-semibold text-slate-700">Enforce Multi-Factor Authentication (MFA)</span>
                </label>

                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Status:</span>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="px-2 py-1 rounded border border-slate-300"
                  >
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Locked">Locked</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#0F8B8D] hover:bg-[#0c7274] text-white font-semibold shadow-sm"
                >
                  {modalMode === 'create' ? 'Provision Account' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
