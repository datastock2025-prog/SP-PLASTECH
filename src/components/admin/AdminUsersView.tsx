import React, { useState, useEffect } from 'react';
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
  Trash2,
  ShieldAlert,
  Database,
  RefreshCw,
  Copy,
  Check,
  History,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { AdminUser, AdminRole, PlantDetails } from '../../types/admin';
import { adminService, adminEventBus } from '../../services/adminService';
import {
  useAdminUsers,
  useAdminRoles,
  useAdminPlants,
  useSaveAdminUser,
  useDeleteAdminUser,
} from '../../hooks/useAdmin';

interface AdminUsersViewProps {
  showToast?: (msg: string) => void;
}

export const AdminUsersView: React.FC<AdminUsersViewProps> = ({ showToast = (_msg: string) => {} }) => {
  // TanStack React Query v5 dynamic hooks
  const { data: users = [], isLoading: isUsersLoading, refetch: refetchUsers } = useAdminUsers();
  const { data: roles = [] } = useAdminRoles();
  const { data: plants = [] } = useAdminPlants();

  const saveUserMutation = useSaveAdminUser();
  const deleteUserMutation = useDeleteAdminUser();

  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedPlant, setSelectedPlant] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Credential & Temp OTP Modal State
  const [credModalUser, setCredModalUser] = useState<AdminUser | null>(null);
  const [copiedOtp, setCopiedOtp] = useState(false);
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminNewUserId, setAdminNewUserId] = useState('');
  const [testOtpInput, setTestOtpInput] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [activeCredTab, setActiveCredTab] = useState<'otp' | 'password' | 'userId' | 'history'>('otp');

  useEffect(() => {
    const unsub = adminEventBus.subscribe((event) => {
      if (event === 'USER_CREATED' || event === 'USER_UPDATED' || event === 'DATA_CHANGED') {
        refetchUsers();
      }
    });
    return unsub;
  }, [refetchUsers]);

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
    const matchesPlant = selectedPlant === 'ALL' || (u.plantIds || []).some((p) => p === selectedPlant);
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
      roleId: roles[0]?.id || 'ROLE-PLANT-MANAGER',
      plantIds: [plants[0]?.id || 'PLANT-01'],
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
      fullName: user.fullName || '',
      username: user.username || '',
      email: user.email || '',
      phone: user.phone || '',
      designation: user.designation || '',
      department: user.department || 'Manufacturing Execution',
      roleId: user.roleId || 'ROLE-PLANT-MANAGER',
      plantIds: Array.isArray(user.plantIds) ? user.plantIds : [plants[0]?.id || 'PLANT-01'],
      assignedShift: user.assignedShift || 'Shift A — Morning (06:00 – 14:00)',
      status: user.status || 'Active',
      mfaEnabled: user.mfaEnabled ?? true,
    });
    setIsModalOpen(true);
  };

  const handleOpenCredentialsModal = (user: AdminUser, defaultTab: 'otp' | 'password' | 'userId' | 'history' = 'otp') => {
    setCredModalUser(user);
    setActiveCredTab(defaultTab);
    setAdminNewPassword('');
    setAdminNewUserId(user.id);
    setCopiedOtp(false);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.username) {
      showToast('Please provide full name, username, and email.');
      return;
    }

    if (modalMode === 'create') {
      const created = await adminService.createUser({
        fullName: formData.fullName.trim(),
        username: formData.username.toLowerCase().trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        designation: formData.designation.trim() || 'ERP Operator',
        department: formData.department,
        roleId: formData.roleId,
        plantIds: formData.plantIds,
        assignedShift: formData.assignedShift,
        status: formData.status,
        mfaEnabled: formData.mfaEnabled,
      });
      refetchUsers();
      setIsModalOpen(false);
      showToast(`User ${created.fullName} provisioned with 24-Hour Temporary OTP.`);
      // Automatically open the credential modal to display the new OTP
      handleOpenCredentialsModal(created, 'otp');
    } else if (editingUserId) {
      await adminService.updateUser(editingUserId, {
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        designation: formData.designation,
        department: formData.department,
        roleId: formData.roleId,
        plantIds: formData.plantIds,
        assignedShift: formData.assignedShift,
        status: formData.status,
        mfaEnabled: formData.mfaEnabled,
      });
      refetchUsers();
      showToast(`User profile and credentials updated in database.`);
      setIsModalOpen(false);
    }
  };

  const handleRegenerateTempOtp = async () => {
    if (!credModalUser) return;
    try {
      const res = await adminService.generateTempOtp(credModalUser.id, 'Super Admin');
      const updated = users.find((u) => u.id === credModalUser.id);
      if (updated) {
        setCredModalUser({ ...updated });
      }
      navigator.clipboard.writeText(res.code).catch(() => {});
      setCopiedOtp(true);
      setTimeout(() => setCopiedOtp(false), 3000);
      showToast(`✓ New 24-hour Temporary OTP (${res.code}) generated and copied to clipboard.`);
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleVerifyOtp = async () => {
    if (!credModalUser || !testOtpInput.trim()) {
      showToast('Please enter the 6-digit OTP to verify.');
      return;
    }
    setIsVerifyingOtp(true);
    try {
      const res = await adminService.verifyUserOtp(credModalUser.id, testOtpInput.trim());
      if (res.success) {
        refetchUsers();
        const updated = users.find((u) => u.id === credModalUser.id);
        if (updated) {
          setCredModalUser({ ...updated });
        }
        setTestOtpInput('');
        showToast('✓ OTP verified successfully via NestJS Middleware API.');
      } else {
        showToast(`Verification failed: ${res.message}`);
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleAdminResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credModalUser || !adminNewPassword.trim()) {
      showToast('Please enter a new password.');
      return;
    }
    if (adminNewPassword.length < 8) {
      showToast('Password must be at least 8 characters long.');
      return;
    }
    try {
      await adminService.resetUserPassword(credModalUser.id, adminNewPassword.trim(), 'Super Admin');
      const updated = users.find((u) => u.id === credModalUser.id);
      if (updated) {
        setCredModalUser({ ...updated });
      }
      setAdminNewPassword('');
      showToast(`✓ Password reset for ${credModalUser.fullName}. User can now log in with new credentials.`);
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleAdminChangeUserId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credModalUser || !adminNewUserId.trim()) {
      showToast('Please enter a new User ID / Username.');
      return;
    }
    try {
      const updated = await adminService.changeUserId(credModalUser.id, adminNewUserId.trim(), 'Super Admin');
      refetchUsers();
      setCredModalUser({ ...updated });
      showToast(`✓ User ID successfully updated to "${updated.id}".`);
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleToggleStatus = async (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    const nextStatus = target.status === 'Active' ? 'Suspended' : 'Active';
    await adminService.updateUser(userId, { status: nextStatus });
    refetchUsers();
    showToast(`User ${target.fullName} status updated to ${nextStatus}.`);
  };

  const handleDeleteUser = async (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    deleteUserMutation.mutate(userId);
    showToast(`User ${target.fullName} soft-deleted from database (Audit trail retained).`);
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
            {roles.map((r) => (
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
            {plants.map((p) => (
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
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-[13px]">{user.fullName}</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-teal-50 text-[#0F8B8D] border border-teal-200 font-mono">
                            v{user.version || 1}
                          </span>
                        </div>
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
                        onClick={() => handleOpenCredentialsModal(user, 'otp')}
                        title="Manage 24h Temp OTP & Credentials"
                        className="p-1.5 rounded hover:bg-teal-50 text-teal-600 hover:text-teal-800 transition-colors"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenCredentialsModal(user, 'history')}
                        title="View Change History & Version Audit"
                        className="p-1.5 rounded hover:bg-indigo-50 text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        <History className="w-3.5 h-3.5" />
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
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        title="Delete User (Soft-delete & revoke active sessions)"
                        className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
                    {roles.map((r) => (
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
                  {plants.map((p) => {
                    const currentPlantIds = formData.plantIds || [];
                    const isChecked = currentPlantIds.includes(p.id);
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
                              setFormData({ ...formData, plantIds: [...currentPlantIds, p.id] });
                            } else {
                              if (currentPlantIds.length > 1) {
                                setFormData({
                                  ...formData,
                                  plantIds: currentPlantIds.filter((id) => id !== p.id),
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

      {/* Modal: User Credentials & 24h Temp OTP Governance */}
      {credModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${credModalUser.avatarColor} flex items-center justify-center text-sm font-bold text-white shadow-sm`}
                >
                  {credModalUser.initials}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">{credModalUser.fullName}</h3>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-teal-50 text-[#0F8B8D] border border-teal-200 font-mono">
                      v{credModalUser.version || 1}
                    </span>
                  </div>
                  <div className="text-slate-500 font-mono text-[11px] flex items-center gap-1.5">
                    <span>@{credModalUser.username}</span>
                    <span>&middot;</span>
                    <span>{credModalUser.email}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setCredModalUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            {/* Sub-tab Navigation */}
            <div className="px-6 pt-3 pb-2 border-b border-slate-200 bg-white flex items-center gap-2 text-xs font-semibold overflow-x-auto shrink-0">
              <button
                onClick={() => setActiveCredTab('otp')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeCredTab === 'otp'
                    ? 'bg-[#0F8B8D] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>24h Temporary OTP</span>
              </button>

              <button
                onClick={() => setActiveCredTab('password')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeCredTab === 'password'
                    ? 'bg-[#0F8B8D] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Direct Password Reset</span>
              </button>

              <button
                onClick={() => setActiveCredTab('userId')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeCredTab === 'userId'
                    ? 'bg-[#0F8B8D] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Change User ID</span>
              </button>

              <button
                onClick={() => setActiveCredTab('history')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeCredTab === 'history'
                    ? 'bg-[#0F8B8D] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Change History ({credModalUser.changeHistory?.length || 1})</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              {/* TAB 1: 24h Temporary OTP */}
              {activeCredTab === 'otp' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200 text-slate-700 leading-relaxed">
                    <div className="font-bold text-[#0F8B8D] flex items-center gap-1.5 mb-1">
                      <Sparkles className="w-4 h-4" />
                      <span>24-Hour Temporary OTP Workflow</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      New employees receive a 6-digit Temporary OTP valid for exactly <strong>24 hours</strong>. If they do not log in within 24 hours, the OTP automatically expires and an Administrator must regenerate it. Once logged in with the OTP, the user can configure their permanent password from the profile page.
                    </p>
                  </div>

                  {/* OTP Status Card */}
                  <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-center space-y-3">
                    <span className="text-slate-500 font-medium">Temporary 6-Digit Login OTP</span>
                    <div className="flex items-center gap-3">
                      <div className="px-6 py-2.5 rounded-xl bg-white border-2 border-[#0F8B8D] font-mono text-2xl font-black text-slate-900 tracking-widest shadow-inner select-all">
                        {credModalUser.tempOtp?.code || '------'}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (credModalUser.tempOtp?.code) {
                            navigator.clipboard.writeText(credModalUser.tempOtp.code);
                            setCopiedOtp(true);
                            setTimeout(() => setCopiedOtp(false), 2000);
                            showToast('OTP copied to clipboard!');
                          }
                        }}
                        className="p-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 shadow-xs flex items-center gap-1 font-semibold cursor-pointer"
                        title="Copy OTP"
                      >
                        {copiedOtp ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>

                    {/* Expiry / Validity Status */}
                    <div>
                      {credModalUser.tempOtp ? (
                        credModalUser.tempOtp.isUsed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-200 text-slate-700">
                            <Check className="w-3 h-3 text-emerald-600" /> Claimed &amp; Password Set
                          </span>
                        ) : Date.now() <= credModalUser.tempOtp.expiresAt ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                              <Clock className="w-3 h-3 text-emerald-600" /> Active &bull; Valid for 24h
                            </span>
                            <div className="text-[10px] text-slate-500 mt-1">
                              Expires at: {new Date(credModalUser.tempOtp.expiresAt).toLocaleString()}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800">
                            <AlertTriangle className="w-3 h-3 text-rose-600" /> Expired (24h Window Passed)
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
                          No OTP Generated Yet
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleRegenerateTempOtp}
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#0F8B8D] hover:bg-[#0c7274] text-white font-bold text-xs shadow-md transition-all cursor-pointer w-full sm:w-auto"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Generate Fresh 24-Hour Temp OTP</span>
                    </button>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <input
                        type="text"
                        maxLength={6}
                        value={testOtpInput}
                        onChange={(e) => setTestOtpInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter 6-digit OTP"
                        className="px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs w-36 text-center focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                      />
                      <button
                        type="button"
                        disabled={isVerifyingOtp || !testOtpInput}
                        onClick={handleVerifyOtp}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                      >
                        {isVerifyingOtp ? 'Verifying...' : 'Verify OTP API'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Direct Password Reset */}
              {activeCredTab === 'password' && (
                <form onSubmit={handleAdminResetPassword} className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 leading-relaxed text-[11px]">
                    <span className="font-bold">Administrative Security Governance: </span>
                    Only system administrators with Master privileges can forcefully reset credentials for enterprise users. The user's temporary OTP will be invalidated once a permanent password is set.
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">New Permanent Password *</label>
                    <input
                      type="password"
                      required
                      value={adminNewPassword}
                      onChange={(e) => setAdminNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters (e.g. SpPlastech2026!#)"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm cursor-pointer"
                    >
                      <KeyRound className="w-4 h-4 text-teal-400" />
                      <span>Apply Password Reset</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 3: Change User ID */}
              {activeCredTab === 'userId' && (
                <form onSubmit={handleAdminChangeUserId} className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 leading-relaxed text-[11px]">
                    <span className="font-bold">Unique Identifier Change: </span>
                    Modifying a User ID changes their primary login handle across all database modules. This action is permanently logged in the audit ledger.
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">New User ID / Username *</label>
                    <input
                      type="text"
                      required
                      value={adminNewUserId}
                      onChange={(e) => setAdminNewUserId(e.target.value)}
                      placeholder="e.g. USR-PLANT-09 or ramesh.kulkarni"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Save New User ID</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 4: Version & Audit Change History */}
              {activeCredTab === 'history' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Immutable Credential &amp; Profile Audit Trail</span>
                    <span className="text-[11px] text-slate-500">Current Revision: <strong>v{credModalUser.version || 1}</strong></span>
                  </div>

                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                    {(credModalUser.changeHistory || [
                      {
                        version: 1,
                        timestamp: credModalUser.createdDate || new Date().toISOString(),
                        changedBy: 'Super Admin',
                        action: 'PROVISION_USER',
                        details: 'Account created with initial credentials.',
                      },
                    ]).map((entry, idx) => (
                      <div key={idx} className="p-3 bg-white space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.2 rounded font-mono font-bold text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200">
                              v{entry.version}
                            </span>
                            <span className="font-bold text-slate-800">{entry.action}</span>
                          </div>
                          <span className="text-slate-400 font-mono text-[10px]">
                            {new Date(entry.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-snug">{entry.details}</p>
                        <div className="text-[10px] text-slate-400 font-medium">
                          Authorized by: <span className="text-slate-600">{entry.changedBy}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
              <span>Security Protocol: AES-256 Encrypted &bull; RBAC Level 4</span>
              <button
                type="button"
                onClick={() => setCredModalUser(null)}
                className="px-4 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
