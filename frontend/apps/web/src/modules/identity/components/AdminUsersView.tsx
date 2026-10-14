import React, { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Search, Plus, KeyRound, Lock, Unlock, Edit2, Trash2, History, Copy, Check, AlertTriangle } from 'lucide-react';
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

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, roleId: roles.find((r) => r.code === 'STANDARD_USER')?.id ?? roles[0]?.id ?? '' });
    setFormError('');
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

  const onReset = (u: ManagedUser) =>
    m.resetPassword.mutate(u.id, {
      onSuccess: (pw) => {
        setCopied(false);
        setSecret({ title: 'Password reset', user: u.username ?? u.email, password: pw });
      },
      onError: (er) => showToast(errMsg(er)),
    });

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
                            title="Reset Password"
                            aria-label="Reset password"
                            disabled={m.resetPassword.isPending}
                            onClick={() => onReset(u)}
                          >
                            <KeyRound className="h-3.5 w-3.5 text-slate-500 hover:text-slate-900" />
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

            <fieldset className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
              <legend className="px-1 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Plant Access <span className="text-rose-500">*</span>
              </legend>
              <div className="mt-1 flex flex-wrap gap-2">
                {plants.map((p) => {
                  const isChecked = form.plantIds.includes(p.id);
                  return (
                    <label
                      key={p.id}
                      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium cursor-pointer transition-all ${
                        isChecked
                          ? 'border-indigo-300 bg-indigo-50/80 text-indigo-700 shadow-2xs dark:border-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                        checked={isChecked}
                        onChange={() => togglePlant(p.id)}
                      />
                      <span>
                        <strong className="font-semibold">{p.code}</strong> — {p.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

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
