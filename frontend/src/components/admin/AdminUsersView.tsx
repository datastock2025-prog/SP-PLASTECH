import React, { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Search, Plus, KeyRound, Lock, Unlock, Edit2, Trash2, History, Copy, Check, AlertTriangle } from 'lucide-react';
import {
  useMe,
  useUsers,
  useRoles,
  usePlants,
  useUserHistory,
  useUserMutations,
} from '../../features/identity/useIdentity';
import { SHIFT_OPTIONS } from '../../features/identity/mapMe';
import type { AbilityRule, ManagedUser, UserStatus } from '../../features/identity/types';

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

  const selectCls = 'h-9 rounded-md border border-slate-200 bg-white px-2 text-xs';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-[#0F8B8D]" />
          <h2 className="text-lg font-bold text-[#14213D]">User Directory</h2>
          <span className="text-xs text-slate-500">{meta ? `${meta.total} users` : ''}</span>
        </div>
        {canCreate && (
          <Button onClick={openCreate} className="gap-1.5">
            <Plus className="h-4 w-4" /> Provision User
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-2 p-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              className="pl-8"
              placeholder="Search name, username, email"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <select className={selectCls} value={roleId} onChange={(e) => { setRoleId(e.target.value); setPage(1); }}>
            <option value="">All roles</option>
            {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <select className={selectCls} value={status} onChange={(e) => { setStatus(e.target.value as UserStatus | ''); setPage(1); }}>
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="LOCKED">Locked</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </CardContent>
      </Card>

      {usersQuery.isError && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          <AlertTriangle className="h-4 w-4" /> {errMsg(usersQuery.error)}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Plants</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersQuery.isLoading && (
                <TableRow><TableCell colSpan={6} className="py-8 text-center text-xs text-slate-500">Loading users…</TableCell></TableRow>
              )}
              {!usersQuery.isLoading && users.length === 0 && (
                <TableRow><TableCell colSpan={6} className="py-8 text-center text-xs text-slate-500">No users found.</TableCell></TableRow>
              )}
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="text-sm font-semibold text-[#14213D]">{u.fullName}</div>
                    <div className="text-[11px] text-slate-500">{u.username} · {u.email}</div>
                  </TableCell>
                  <TableCell className="text-xs">{u.roleName}</TableCell>
                  <TableCell className="text-xs">
                    {u.plantIds.map((id) => plants.find((p) => p.id === id)?.code ?? '—').join(', ') || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusStyle[u.status]}>{u.status}</Badge>
                    {u.mustChangePassword && <span className="ml-1 text-[10px] text-amber-600">pwd change pending</span>}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" title="History" aria-label="History" onClick={() => setHistoryUser(u)}><History className="h-4 w-4" /></Button>
                      {canUpdate && <Button size="icon" variant="ghost" title="Edit" aria-label="Edit" onClick={() => openEdit(u)}><Edit2 className="h-4 w-4" /></Button>}
                      {canReset && <Button size="icon" variant="ghost" title="Reset password" aria-label="Reset password" disabled={m.resetPassword.isPending} onClick={() => onReset(u)}><KeyRound className="h-4 w-4" /></Button>}
                      {canUpdate && (
                        <Button size="icon" variant="ghost" title={u.status === 'LOCKED' ? 'Unlock' : 'Lock'} aria-label={u.status === 'LOCKED' ? 'Unlock' : 'Lock'} disabled={m.setLocked.isPending} onClick={() => onLock(u)}>
                          {u.status === 'LOCKED' ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                        </Button>
                      )}
                      {canDelete && u.id !== me?.id && <Button size="icon" variant="ghost" title="Delete" aria-label="Delete" onClick={() => setDeleteTarget(u)}><Trash2 className="h-4 w-4 text-red-600" /></Button>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 text-xs">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span>Page {meta.page} of {meta.totalPages}</span>
          <Button size="sm" variant="outline" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? `Edit ${editing.fullName}` : 'Provision new user'}</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <label className="col-span-2">Full name<Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></label>
              <label>Username<Input disabled={!!editing} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></label>
              <label>Email<Input type="email" disabled={!!editing} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
              <label>Phone<Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
              <label>Designation<Input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} /></label>
              <label>Department<Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></label>
              <label>Shift
                <select className={`${selectCls} w-full`} value={form.assignedShift} onChange={(e) => setForm({ ...form, assignedShift: e.target.value })}>
                  {SHIFT_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </label>
              <label className="col-span-2">Role
                <select className={`${selectCls} w-full`} value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })}>
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </label>
            </div>
            <fieldset>
              <legend className="mb-1 font-medium">Plant access</legend>
              <div className="flex flex-wrap gap-3">
                {plants.map((p) => (
                  <label key={p.id} className="flex items-center gap-1">
                    <input type="checkbox" checked={form.plantIds.includes(p.id)} onChange={() => togglePlant(p.id)} /> {p.code} — {p.name}
                  </label>
                ))}
              </div>
            </fieldset>
            {formError && <p className="text-red-600" role="alert">{formError}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={m.create.isPending || m.update.isPending}>{editing ? 'Save changes' : 'Provision'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!secret} onOpenChange={(o) => !o && setSecret(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{secret?.title}</DialogTitle></DialogHeader>
          <p className="text-xs text-slate-600">
            Temporary password for <b>{secret?.user}</b>. It is shown only once; the user must change it at first sign-in.
          </p>
          <div className="flex items-center gap-2 rounded-md border bg-slate-50 p-2 font-mono text-sm">
            <span className="flex-1 break-all">{secret?.password}</span>
            <Button size="icon" variant="ghost" aria-label="Copy password" onClick={copySecret}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex justify-end"><Button onClick={() => setSecret(null)}>Done</Button></div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete user?</DialogTitle></DialogHeader>
          <p className="text-xs text-slate-600">{deleteTarget?.fullName} will lose access immediately. The record is soft-deleted and kept in the audit trail.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" disabled={m.remove.isPending} onClick={confirmDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!historyUser} onOpenChange={(o) => !o && setHistoryUser(null)}>
        <DialogContent className="max-h-[80vh] max-w-lg overflow-y-auto">
          <DialogHeader><DialogTitle>Audit history — {historyUser?.fullName}</DialogTitle></DialogHeader>
          {history.isLoading && <p className="text-xs text-slate-500">Loading…</p>}
          {history.isError && <p className="text-xs text-red-600">{errMsg(history.error)}</p>}
          {history.data?.data.length === 0 && <p className="text-xs text-slate-500">No history yet.</p>}
          <ul className="space-y-2">
            {history.data?.data.map((h) => (
              <li key={h.id} className="rounded-md border p-2 text-xs">
                <div className="flex justify-between"><b>{h.action}</b><span className="text-slate-500">{new Date(h.performedAt).toLocaleString()}</span></div>
                <div className="text-slate-500">by {h.performedByName}</div>
                {h.changedFields && h.changedFields.length > 0 && <div>Changed: {h.changedFields.join(', ')}</div>}
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsersView;
