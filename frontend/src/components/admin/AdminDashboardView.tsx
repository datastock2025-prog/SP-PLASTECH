import React from 'react';
import { Activity, Building2, Cpu, Database, RefreshCw, Terminal, Users, CheckCircle2 } from 'lucide-react';
import { usePlants, useSystemHealth } from '../../features/identity/useIdentity';

interface AdminDashboardViewProps {
  onNavigate?: (view: string, param?: any) => void;
  showToast?: (msg: string) => void;
}

const QUICK_LINKS = [
  { label: 'Manage Users & Access', view: 'adminUsers', desc: 'Users and plant assignments' },
  { label: 'Company & Plant Setup', view: 'adminPlants', desc: 'Plants and branches' },
  { label: 'RBAC Permission Matrix', view: 'adminRoles', desc: 'Roles and permissions' },
  { label: 'System Audit Logs', view: 'adminAuditLogs', desc: 'Audit trail' },
];

const formatUptime = (s: number) => {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m`;
};

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ onNavigate, showToast = () => {} }) => {
  const health = useSystemHealth();
  const plants = usePlants();
  const h = health.data;
  const memPct = h && h.memoryTotalGb > 0 ? Math.round((h.memoryUsedGb / h.memoryTotalGb) * 1000) / 10 : 0;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              h ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${h ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            {health.isError ? 'Unavailable' : h ? 'Operational' : 'Checking...'}
          </span>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Admin Operations &amp; System Health</h1>
          <p className="text-xs text-slate-500 mt-0.5">Live metrics from the identity server and database.</p>
        </div>
        <button
          onClick={async () => { await health.refetch(); showToast('Metrics refreshed.'); }}
          disabled={health.isFetching}
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${health.isFetching ? 'animate-spin' : ''}`} />
          Refresh Metrics
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Tile icon={<Cpu className="w-4 h-4" />} label="Server CPU Load" value={h ? `${h.loadPct}%` : '—'} sub={h ? `${h.cpuCores} cores` : ''} />
        <Tile icon={<Activity className="w-4 h-4" />} label="Server Memory" value={h ? `${memPct}%` : '—'} sub={h ? `${h.memoryUsedGb} / ${h.memoryTotalGb} GB` : ''} />
        <Tile icon={<Database className="w-4 h-4" />} label="Database Latency" value={h ? `${h.dbLatencyMs} ms` : '—'} sub={h ? `Uptime ${formatUptime(h.uptimeSeconds)}` : ''} />
        <Tile icon={<Users className="w-4 h-4" />} label="Users / Active Sessions" value={h ? `${h.userCount} / ${h.activeSessions}` : '—'} sub="Provisioned / signed in" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Plants</h2>
            <span className="text-xs text-slate-500">{plants.data?.length ?? 0} registered</span>
          </div>
          <div className="divide-y divide-slate-100">
            {(plants.data ?? []).map((p) => (
              <div key={p.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-[#0F8B8D]" />
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {p.name} <span className="text-xs font-mono text-slate-400">({p.code})</span>
                    </div>
                    {p.location && <div className="text-xs text-slate-500">{p.location}</div>}
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3 h-3" />
                  {p.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
            {plants.data && plants.data.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-400">No plants yet. Create one under Plants &amp; Branches.</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#0F8B8D]" />
            Administration Quick Links
          </h2>
          <div className="space-y-1.5">
            {QUICK_LINKS.map((item) => (
              <button
                key={item.view}
                onClick={() => onNavigate?.(item.view)}
                className="w-full text-left p-2.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-800 group-hover:text-[#0F8B8D]">{item.label}</div>
                  <div className="text-[11px] text-slate-400">{item.desc}</div>
                </div>
                <span className="text-slate-300 group-hover:text-[#0F8B8D] text-xs font-bold">&rarr;</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const Tile: React.FC<{ icon: React.ReactNode; label: string; value: string; sub: string }> = ({ icon, label, value, sub }) => (
  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</span>
      <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">{icon}</div>
    </div>
    <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
    <div className="text-xs text-slate-500 mt-1">{sub}</div>
  </div>
);
