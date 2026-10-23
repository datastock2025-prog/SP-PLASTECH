import React, { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Search, Plus, KeyRound, Lock, Unlock, Edit2, Trash2, History, Copy, Check, AlertTriangle, ChevronDown, X, Eye, EyeOff, Sparkles } from 'lucide-react';
import {
  useMe,
  useUsers,
  useRoles,
  usePlants,
  useUserHistory,
  useUserMutations,
} from '@/src/features/identity/useIdentity';
import { SHIFT_OPTIONS } from '@/src/features/identity/mapMe';
import type { AbilityRule, ManagedUser, UserStatus } from '@/src/features/identity/types';

interface AdminUsersViewProps {
  showToast?: (msg: string) => void;
}

const PAGE_SIZE = 20;

function generateSecurePassword(): string {
  const sets = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnopqrstuvwxyz', '23456789', '!@#$%^&*'];
  const all = sets.join('');
  const chars = sets.map((s) => s[Math.floor(Math.random() * s.length)]);
  for (let i = 4; i < 14; i++) {
    chars.push(all[Math.floor(Math.random() * all.length)]);
  }
  return chars.sort(() => Math.random() - 0.5).join('');
}

const toArr = (v: string | string[]) => (Array.isArray(v) ? v : [v]);
function can(rules: AbilityRule[] | undefined, action: string, subject: string): boolean {
  let allowed = false;
  for (const r of rules ?? []) {
    const hit = toArr(r.action).some((a) => a === 'manage' || a === action) && toArr(r.subject).some((s) => s === 'all' || s === subject);
    if (hit) allowed = !r.inverted;
  }
  return allowed;
}

const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Request failed');

const EMPTY_FORM = {
  fullName: '',
  username: '',
  email: '',
  phone: '',
  designation: '',
  department: '',
  roleId: '',
  plantIds: [] as string[],
  assignedShift: SHIFT_OPTIONS[0] as string,
};

const statusStyle: Record<UserStatus, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  LOCKED: 'bg-red-50 text-red-700 border-red-200',
  SUSPENDED: 'bg-amber-50 text-amber-700 border-amber-200',
};

export const AdminUsersView: React.FC<AdminUsersViewProps> = ({ showToast = () => {} }) => {
  const { data: me } = useMe();
  const rules = me?.abilityRules;
  const canCreate = can(rules, 'create', 'User');
  const canUpdate = can(rules, 'update', 'User');
  const canDelete = can(rules, 'delete', 'User');
  const canReset = can(rules, 'resetPassword', 'User') || canUpdate;

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<UserStatus | ''>('');
  const [roleId, setRoleId] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const params = useMemo(
    () => ({ page, limit: PAGE_SIZE, search: search || undefined, status: status || undefined, roleId: roleId || undefined }),
    [page, search, status, roleId]
  );
  const usersQuery = useUsers(params);
  const { data: roles = [] } = useRoles();
  const { data: plants = [] } = usePlants();
  const m = useUserMutations();

  const users = usersQuery.data?.data ?? [];
  const meta = usersQuery.data?.meta;

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [secret, setSecret] = useState<{ title: string; user: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [historyUser, setHistoryUser] = useState<ManagedUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null);
  const history = useUserHistory(historyUser?.id ?? null);

  const [passwordModalUser, setPasswordModalUser] = useState<ManagedUser | null>(null);
  const [customPassword, setCustomPassword] = useState('');
  const [showCustomPassword, setShowCustomPassword] = useState(false);
  const [mustChangePasswordOnLogin, setMustChangePasswordOnLogin] = useState(true);
  const [passwordModalError, setPasswordModalError] = useState('');

  const [plantDropdownOpen, setPlantDropdownOpen] = useState(false);
  const [plantSearch, setPlantSearch] = useState('');

  const filteredPlants = useMemo(() => {
    if (!plantSearch.trim()) return plants;
    const q = plantSearch.trim().toLowerCase();
    return plants.filter((p) => p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q));
  }, [plants, plantSearch]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, roleId: roles.find((r) => r.code === 'STANDARD_USER')?.id ?? roles[0]?.id ?? '' });
    setFormError('');
    setPlantDropdownOpen(false);
    setPlantSearch('');
    setFormOpen(true);
  };

  const openEdit = (u: ManagedUser) => {
    setEditing(u);
    setForm({
      fullName: u.fullName,
      username: u.username ?? '',
      email: u.email,
      phone: u.phone ?? '',
      designation: u.designation ?? '',
      department: u.department ?? '',
      roleId: u.roleId,
      plantIds: u.plantIds,
      assignedShift: u.assignedShift ?? SHIFT_OPTIONS[0],
    });
    setFormError('');
    setPlantDropdownOpen(false);
    setPlantSearch('');
    setFormOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.fullName.trim() || !form.roleId || form.plantIds.length === 0) {
      setFormError('Full name, role and at least one plant are required.');
      return;
    }
    const common = {
      fullName: form.fullName.trim(),
      phone: form.phone.trim() || null,
      designation: form.designation.trim() || null,
      department: form.department.trim() || null,
      assignedShift: form.assignedShift,
      roleId: form.roleId,
      plantIds: form.plantIds,
    };
    if (editing) {
      m.update.mutate(
        { id: editing.id, body: { ...common, version: editing.version } },
        {
          onSuccess: () => {
            setFormOpen(false);
            showToast(`Updated ${common.fullName}`);
          },
          onError: (er) => setFormError(errMsg(er)),
        }
      );
    } else {
      if (!form.username.trim() || !form.email.trim()) {
        setFormError('Username and email are required.');
        return;
      }
      m.create.mutate(
        { ...common, username: form.username.trim().toLowerCase(), email: form.email.trim().toLowerCase() },
        {
          onSuccess: ({ user, tempPassword }) => {
            setFormOpen(false);
            setCopied(false);
            setSecret({ title: 'User provisioned', user: user.username ?? user.email, password: tempPassword });
          },
          onError: (er) => setFormError(errMsg(er)),
        }
      );
    }
  };

  const openPasswordModal = (u: ManagedUser) => {
    setPasswordModalUser(u);
    setCustomPassword('');
    setShowCustomPassword(false);
    setMustChangePasswordOnLogin(true);
    setPasswordModalError('');
  };

  const handleGeneratePassword = () => {
    const pw = generateSecurePassword();
    setCustomPassword(pw);
    setShowCustomPassword(true);
  };

  const handleSavePassword = () => {
    if (!passwordModalUser) return;
    setPasswordModalError('');
    const pw = customPassword.trim();
    if (pw && pw.length < 8) {
      setPasswordModalError('Password must be at least 8 characters long.');
      return;
    }
    m.resetPassword.mutate(
      {
        id: passwordModalUser.id,
        password: pw || undefined,
        mustChangePassword: mustChangePasswordOnLogin,
      },
      {
        onSuccess: (savedPw) => {
          const u = passwordModalUser;
          setPasswordModalUser(null);
          setCopied(false);
          setSecret({
            title: pw ? 'Password Updated Successfully' : 'Temporary Password Generated',
            user: u.username ?? u.email,
            password: savedPw,
          });
          showToast(`Password successfully updated for ${u.fullName}`);
        },
        onError: (er) => {
          setPasswordModalError(errMsg(er));
        },
      }
    );
  };

  const onReset = (u: ManagedUser) => openPasswordModal(u);

  const onLock = (u: ManagedUser) =>
    m.setLocked.mutate(
      { id: u.id, locked: u.status !== 'LOCKED' },
      {
        onSuccess: () => showToast(u.status === 'LOCKED' ? `Unlocked ${u.fullName}` : `Locked ${u.fullName}`),
        onError: (er) => showToast(errMsg(er)),
      }
    );

  const confirmDelete = () => {
    if (!deleteTarget) return;
    m.remove.mutate(deleteTarget.id, {
      onSuccess: () => {
        showToast(`Deleted ${deleteTarget.fullName}`);
        setDeleteTarget(null);
      },
      onError: (er) => {
        showToast(errMsg(er));
        setDeleteTarget(null);
      },
    });
  };

  const copySecret = async () => {
    if (!secret) return;
    await navigator.clipboard.writeText(secret.password);
    setCopied(true);
  };

  const togglePlant = (id: string) =>
    setForm((f) => ({ ...f, plantIds: f.plantIds.includes(id) ? f.plantIds.filter((p) => p !== id) : [...f.plantIds, id] }));

  const selectCls =
    'h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 shadow-2xs font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200';

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Org &amp; Workflow · Identity &amp; Access
          </div>
          <div className="mt-0.5 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              <Users className="h-4 w-4" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              User Directory
            </h2>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {meta ? `${meta.total} users` : ''}
            </span>
          </div>
        </div>
        {canCreate && (
          <Button
            onClick={openCreate}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs font-semibold px-4"
          >
            <Plus className="h-4 w-4" /> Provision User
          </Button>
        )}
      </div>

      {/* Filter / Search Card */}
      <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            className="pl-9 h-9 text-xs"
            placeholder="Search users by name, username, email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <select
          className={selectCls}
          value={roleId}
          onChange={(e) => {
            setRoleId(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All roles</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <select
          className={selectCls}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as UserStatus | '');
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="LOCKED">Locked</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {usersQuery.isError && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errMsg(usersQuery.error)}</span>
        </div>
      )}

      {/* Modern Table Container */}
      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-200/80 bg-slate-50/75 dark:border-slate-800 dark:bg-slate-800/50">
                <TableHead className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  User
                </TableHead>
                <TableHead className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Role
                </TableHead>
                <TableHead className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Plants
                </TableHead>
                <TableHead className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Status
                </TableHead>
                <TableHead className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Last login
                </TableHead>
                <TableHead className="py-3 px-4 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersQuery.isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-xs text-slate-500">
                    Loading users…
                  </TableCell>
                </TableRow>
              )}
              {!usersQuery.isLoading && users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-xs text-slate-500">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
              {users.map((u) => {
                const initials =
                  u.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join('')
                    .toUpperCase() || 'U';

                return (
                  <TableRow
                    key={u.id}
                    className="border-b border-slate-100 transition-colors hover:bg-slate-50/70 dark:border-slate-800/60 dark:hover:bg-slate-800/40"
                  >
                    <TableCell className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-xs font-bold text-white shadow-xs">
                          {initials}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                            {u.fullName}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                            <span className="font-mono text-slate-600 dark:text-slate-400">
                              {u.username}
                            </span>
                            <span>·</span>
                            <span>{u.email}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {u.roleName}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400">
                      {u.plantIds.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {u.plantIds.map((id) => (
                            <span
                              key={id}
                              className="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            >
                              {plants.find((p) => p.id === id)?.code ?? '—'}
                            </span>
                          ))}
                        </div>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusStyle[u.status]}`}
                        >
                          {u.status}
                        </Badge>
                        {u.mustChangePassword && (
                          <span className="inline-flex items-center rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                            pwd change pending
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-xs text-slate-500">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          title="Audit History"
                          aria-label="History"
                          onClick={() => setHistoryUser(u)}
                        >
                          <History className="h-3.5 w-3.5 text-slate-500 hover:text-slate-900" />
                        </Button>
                        {canUpdate && (
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            title="Edit User"
                            aria-label="Edit"
                            onClick={() => openEdit(u)}
                          >
                            <Edit2 className="h-3.5 w-3.5 text-slate-500 hover:text-slate-900" />
                          </Button>
                        )}
                        {canReset && (
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            title={
                              u.id === me?.id
                                ? 'Change your own password in Profile > Security'
                                : 'Change / Reset User Password'
                            }
                            aria-label="Change or reset password"
                            disabled={u.id === me?.id || m.resetPassword.isPending}
                            onClick={() => {
                              if (u.id === me?.id) {
                                showToast('To change your own password, visit Profile > Security.');
                                return;
                              }
                              openPasswordModal(u);
                            }}
                          >
                            <KeyRound
                              className={`h-3.5 w-3.5 ${
                                u.id === me?.id
                                  ? 'text-slate-300 dark:text-slate-600'
                                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
                              }`}
                            />
                          </Button>
                        )}
                        {canUpdate && (
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            title={u.status === 'LOCKED' ? 'Unlock Account' : 'Lock Account'}
                            aria-label={u.status === 'LOCKED' ? 'Unlock' : 'Lock'}
                            disabled={m.setLocked.isPending}
                            onClick={() => onLock(u)}
                          >
                            {u.status === 'LOCKED' ? (
                              <Unlock className="h-3.5 w-3.5 text-amber-600" />
                            ) : (
                              <Lock className="h-3.5 w-3.5 text-slate-500" />
                            )}
                          </Button>
                        )}
                        {canDelete && u.id !== me?.id && (
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            title="Delete User"
                            aria-label="Delete"
                            onClick={() => setDeleteTarget(u)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-rose-500 hover:text-rose-700" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-xs text-slate-600 shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          <span>
            Showing page <b>{meta.page}</b> of <b>{meta.totalPages}</b> ({meta.total} users)
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Provision / Edit Modal */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? `Edit ${editing.fullName}` : 'Provision New User'}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? 'Update user account credentials and assigned plant access.'
                : 'Create new enterprise account credentials and grant multi-plant access.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2 space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="e.g. John Doe"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Username {!editing && <span className="text-rose-500">*</span>}
                </label>
                <Input
                  placeholder="e.g. jdoe"
                  disabled={!!editing}
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Email {!editing && <span className="text-rose-500">*</span>}
                </label>
                <Input
                  type="email"
                  placeholder="jdoe@spplastech.com"
                  disabled={!!editing}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Phone</label>
                <Input
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Designation</label>
                <Input
                  placeholder="e.g. Production Manager"
                  value={form.designation}
                  onChange={(e) => setForm({ ...form, designation: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Department</label>
                <Input
                  placeholder="e.g. Manufacturing"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Shift</label>
                <select
                  className={`${selectCls} w-full`}
                  value={form.assignedShift}
                  onChange={(e) => setForm({ ...form, assignedShift: e.target.value })}
                >
                  {SHIFT_OPTIONS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2 space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Role <span className="text-rose-500">*</span>
                </label>
                <select
                  className={`${selectCls} w-full`}
                  value={form.roleId}
                  onChange={(e) => setForm({ ...form, roleId: e.target.value })}
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Searchable Multi-Plant Selection Dropdown */}
            <div className="space-y-1.5 rounded-xl border border-slate-200/90 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Assigned Plant Access <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] font-medium text-slate-500">
                  {form.plantIds.length} of {plants.length} selected
                </span>
              </div>

              {/* Selected plant badges chip container */}
              {form.plantIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 rounded-lg border border-slate-200/80 bg-white dark:border-slate-700 dark:bg-slate-800">
                  {form.plantIds.map((pid) => {
                    const p = plants.find((x) => x.id === pid);
                    return (
                      <span
                        key={pid}
                        className="inline-flex items-center gap-1 rounded-md bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 text-[11px] font-medium text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300"
                      >
                        <strong className="font-semibold">{p?.code ?? pid}</strong>
                        {p?.name && <span className="truncate max-w-[120px] text-indigo-600/80 dark:text-indigo-300/80">({p.name})</span>}
                        <button
                          type="button"
                          onClick={() => togglePlant(pid)}
                          className="hover:bg-indigo-200/60 rounded p-0.5 ml-0.5 text-indigo-600 dark:hover:bg-indigo-800 transition-colors"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Dropdown Popover Trigger */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setPlantDropdownOpen((prev) => !prev)}
                  className={`w-full flex items-center justify-between h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 shadow-2xs font-medium hover:border-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 ${
                    form.plantIds.length === 0 ? 'border-amber-300 dark:border-amber-700' : ''
                  }`}
                >
                  <span className="truncate">
                    {form.plantIds.length === 0
                      ? 'Select plants to assign...'
                      : form.plantIds.length === plants.length
                      ? `All Plants (${plants.length}) Selected`
                      : `${form.plantIds.length} plant(s) selected`}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${plantDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {plantDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setPlantDropdownOpen(false)}
                    />
                    <div className="absolute z-50 left-0 right-0 mt-1 rounded-xl border border-slate-200 bg-white p-2.5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                      <div className="mb-2 flex items-center gap-1.5">
                        <div className="relative flex-1">
                          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                          <Input
                            placeholder="Filter plants by code or name..."
                            value={plantSearch}
                            onChange={(e) => setPlantSearch(e.target.value)}
                            className="h-7 pl-8 text-xs"
                            autoFocus
                          />
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-[11px]"
                          onClick={() => {
                            const allIds = plants.map((p) => p.id);
                            setForm((f) => ({ ...f, plantIds: allIds }));
                          }}
                        >
                          All
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-[11px]"
                          onClick={() => setForm((f) => ({ ...f, plantIds: [] }))}
                        >
                          Clear
                        </Button>
                      </div>

                      <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredPlants.length === 0 ? (
                          <div className="py-3 text-center text-xs text-slate-400">
                            No plants found matching &ldquo;{plantSearch}&rdquo;
                          </div>
                        ) : (
                          filteredPlants.map((p) => {
                            const isChecked = form.plantIds.includes(p.id);
                            return (
                              <label
                                key={p.id}
                                className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded cursor-pointer text-xs transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => togglePlant(p.id)}
                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                                />
                                <div className="flex-1 truncate">
                                  <span className="font-semibold text-slate-800 dark:text-slate-200 mr-1.5">
                                    {p.code}
                                  </span>
                                  <span className="text-slate-500 dark:text-slate-400">
                                    {p.name}
                                  </span>
                                </div>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {formError && (
              <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs font-medium text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={m.create.isPending || m.update.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs font-medium"
              >
                {editing ? 'Save Changes' : 'Provision User'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Admin Change / Reset User Password Dialog */}
      <Dialog open={!!passwordModalUser} onOpenChange={(o) => !o && setPasswordModalUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Manage User Password
            </DialogTitle>
            <DialogDescription>
              Set a custom password or auto-generate a secure temporary password for{' '}
              <b className="text-slate-900 dark:text-slate-100">{passwordModalUser?.fullName}</b> (
              <span className="font-mono">{passwordModalUser?.username ?? passwordModalUser?.email}</span>).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2 text-xs">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  New Password
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 text-[11px]"
                >
                  <Sparkles className="h-3 w-3" /> Auto-Generate Secure
                </button>
              </div>
              <div className="relative">
                <Input
                  type={showCustomPassword ? 'text' : 'password'}
                  placeholder="Min 8 characters (or leave blank to auto-generate)"
                  value={customPassword}
                  onChange={(e) => setCustomPassword(e.target.value)}
                  className="pr-16 font-mono text-xs"
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="h-7 w-7 text-slate-400 hover:text-slate-700"
                    onClick={() => setShowCustomPassword(!showCustomPassword)}
                    title={showCustomPassword ? 'Hide password' : 'Show password'}
                  >
                    {showCustomPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                  {customPassword && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="h-7 w-7 text-slate-400 hover:text-slate-700"
                      onClick={async () => {
                        await navigator.clipboard.writeText(customPassword);
                        showToast('Password copied to clipboard');
                      }}
                      title="Copy to clipboard"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                Minimum 8 characters. Leave blank to generate a random 16-character temporary password.
              </p>
            </div>

            <label className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50/70 p-2.5 text-xs font-medium text-slate-700 cursor-pointer dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300">
              <input
                type="checkbox"
                checked={mustChangePasswordOnLogin}
                onChange={(e) => setMustChangePasswordOnLogin(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
              />
              <div>
                <span className="font-semibold block text-slate-800 dark:text-slate-200">
                  Force password reset on next login
                </span>
                <span className="text-[11px] text-slate-500 block">
                  User will be prompted to choose a new password when they sign in.
                </span>
              </div>
            </label>

            {passwordModalError && (
              <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs font-medium text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{passwordModalError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPasswordModalUser(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={m.resetPassword.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs font-medium"
                onClick={handleSavePassword}
              >
                {m.resetPassword.isPending ? 'Updating...' : customPassword ? 'Set Custom Password' : 'Generate & Reset'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Secret / Credentials Dialog */}
      <Dialog open={!!secret} onOpenChange={(o) => !o && setSecret(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{secret?.title}</DialogTitle>
            <DialogDescription>
              Temporary password for <b>{secret?.user}</b>. This will only be shown once.
            </DialogDescription>
          </DialogHeader>
          <div className="my-2 flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-sm dark:border-slate-800 dark:bg-slate-950">
            <span className="flex-1 break-all font-semibold text-indigo-600 dark:text-indigo-400">
              {secret?.password}
            </span>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 shrink-0"
              onClick={copySecret}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copy
                </>
              )}
            </Button>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={() => setSecret(null)}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete User Account?</DialogTitle>
            <DialogDescription>
              <b>{deleteTarget?.fullName}</b> will lose access immediately. The record will be
              soft-deleted and preserved in the audit log.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-3">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={m.remove.isPending}
              onClick={confirmDelete}
            >
              Delete User
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Audit History Dialog */}
      <Dialog open={!!historyUser} onOpenChange={(o) => !o && setHistoryUser(null)}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit History — {historyUser?.fullName}</DialogTitle>
            <DialogDescription>
              Historical event trail of changes performed on this user profile.
            </DialogDescription>
          </DialogHeader>
          {history.isLoading && <p className="text-xs text-slate-500 py-4">Loading audit events…</p>}
          {history.isError && <p className="text-xs text-rose-600 py-4">{errMsg(history.error)}</p>}
          {history.data?.data.length === 0 && (
            <p className="text-xs text-slate-500 py-4">No audit events recorded yet.</p>
          )}
          <ul className="space-y-2.5 pt-2">
            {history.data?.data.map((h) => (
              <li
                key={h.id}
                className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 text-xs dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {h.action}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {new Date(h.performedAt).toLocaleString()}
                  </span>
                </div>
                <div className="mt-1 text-slate-500">
                  By: <span className="font-medium text-slate-700 dark:text-slate-300">{h.performedByName}</span>
                </div>
                {h.changedFields && h.changedFields.length > 0 && (
                  <div className="mt-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                    Modified: <span className="font-mono">{h.changedFields.join(', ')}</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsersView;
