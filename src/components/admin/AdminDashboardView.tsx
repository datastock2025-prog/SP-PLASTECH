import React, { useState } from 'react';
import {
  Server,
  Activity,
  Cpu,
  HardDrive,
  Database,
  Users,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Zap,
  Lock,
  Building2,
  Terminal,
} from 'lucide-react';
import { AdminSystemHealth } from '../../types/admin';
import { mockSystemHealth, mockCompanyProfile, mockAuditLogs } from '../../data/mockAdminData';

interface AdminDashboardViewProps {
  onNavigate?: (view: string, param?: any) => void;
  showToast?: (msg: string) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  onNavigate,
  showToast = (_msg: string) => {},
}) => {
  const [health, setHealth] = useState<AdminSystemHealth>(mockSystemHealth);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'nodes' | 'jobs'>('overview');

  const handleRefreshMetrics = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setHealth((prev) => ({
        ...prev,
        cpuUsagePct: +(20 + Math.random() * 12).toFixed(1),
        memoryUsagePct: +(55 + Math.random() * 8).toFixed(1),
        dbLatencyMs: +(2.5 + Math.random() * 2).toFixed(1),
      }));
      setIsRefreshing(false);
      showToast('System health metrics synchronized from cluster nodes.');
    }, 600);
  };

  const handleClearCache = () => {
    showToast('Redis in-memory query and session cache successfully purged.');
  };

  const handleTriggerBackup = () => {
    showToast('Automated hot database snapshot scheduled with background worker.');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {health.serverStatus}
            </span>
            <span className="text-xs text-slate-500">Node Cluster: AP-SOUTH-1 (Primary HA)</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Admin Operations & System Health</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Enterprise infrastructure oversight, security audit telemetry, background worker queues, and multi-plant node states.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefreshMetrics}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Metrics
          </button>
          <button
            onClick={handleClearCache}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            Purge Cache
          </button>
          <button
            onClick={handleTriggerBackup}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-[#0F8B8D] hover:bg-[#0c7274] rounded-lg shadow-sm transition-colors"
          >
            <Database className="w-3.5 h-3.5" />
            Backup Now
          </button>
        </div>
      </div>

      {/* Primary KPI Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Cluster CPU Core Load</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{health.cpuUsagePct}%</span>
            <span className="text-xs text-emerald-600 font-medium">8 Cores Active</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                health.cpuUsagePct > 80 ? 'bg-rose-500' : health.cpuUsagePct > 60 ? 'bg-amber-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${health.cpuUsagePct}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 mt-1.5">
            <span>Base: 2.8 GHz</span>
            <span>Target: &lt; 75%</span>
          </div>
        </div>

        {/* Memory */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">RAM Allocation</span>
            <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{health.memoryUsagePct}%</span>
            <span className="text-xs text-slate-500 font-medium">
              {health.memoryUsedGb} / {health.memoryTotalGb} GB
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-teal-600 transition-all duration-500"
              style={{ width: `${health.memoryUsagePct}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 mt-1.5">
            <span>Buffer: 4.2 GB</span>
            <span>Swap: 0% used</span>
          </div>
        </div>

        {/* Disk NVMe */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">NVMe Storage Vault</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{health.diskUsagePct}%</span>
            <span className="text-xs text-slate-500 font-medium">
              {health.diskUsedGb} / {health.diskTotalGb} GB
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-500"
              style={{ width: `${health.diskUsagePct}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 mt-1.5">
            <span>RAID 10 Redundant</span>
            <span>Free: ~385 GB</span>
          </div>
        </div>

        {/* DB Latency & Sessions */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Database & Sessions</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{health.dbLatencyMs} ms</span>
            <span className="text-xs text-emerald-600 font-medium">p99 Latency</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-1 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>{health.activeSessionsCount} Live Users</span>
            </div>
            <span className="text-slate-400">|</span>
            <div className="flex items-center gap-1.5 text-slate-600">
              <span>{health.databaseConnections} Pool Conns</span>
            </div>
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 mt-1.5">
            <span>Uptime: {health.uptimeFormatted}</span>
            <span>SSL: {health.sslCertificateExpiryDays}d</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Multi-Plant Node Health & Background Queues */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Plant Nodes and Service Subsystems */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subsystem status table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-[#0F8B8D]" />
                <h2 className="text-sm font-bold text-slate-900">Plant Subsystems & Edge Node Telemetry</h2>
              </div>
              <span className="text-xs text-slate-500">3 of 3 Facilities Reporting</span>
            </div>

            <div className="divide-y divide-slate-100">
              {mockCompanyProfile.plants.map((plant) => (
                <div key={plant.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700 mt-0.5">
                      <Building2 className="w-5 h-5 text-[#0F8B8D]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900">{plant.plantName}</span>
                        {plant.isHeadquarters && (
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-bold uppercase">
                            HQ
                          </span>
                        )}
                        <span className="text-xs font-mono text-slate-400">({plant.plantCode})</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{plant.division} &middot; {plant.city}, {plant.state}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-600">
                        <span>Machines: <strong>{plant.activeLines} / {plant.totalMachines} Online</strong></span>
                        <span>Warehouse: <strong>{plant.defaultWarehouseName}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-1.5 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        plant.operationalStatus === 'Fully Operational'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {plant.operationalStatus}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">Ping: 12ms &middot; TLS 1.3</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Background Batch Worker Queues */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-600" />
                <h2 className="text-sm font-bold text-slate-900">Background Worker Jobs & Cron Schedules</h2>
              </div>
              <span className="text-xs font-medium text-emerald-600">Queue Engine: BullMQ / Redis</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-xs text-slate-500 font-medium">MRP Nightly Explosion</div>
                <div className="text-lg font-bold text-slate-900 mt-1">Ready</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Runs daily at 01:00 AM IST</div>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-xs text-slate-500 font-medium">Platts Polymer Price Sync</div>
                <div className="text-lg font-bold text-emerald-700 mt-1">Completed</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Last sync: 00:05 AM (14 Indices)</div>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-xs text-slate-500 font-medium">Shift Attendance Sync</div>
                <div className="text-lg font-bold text-indigo-700 mt-1">Active (15m)</div>
                <div className="text-[11px] text-slate-500 mt-0.5">128 Punches captured today</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Quick Navigation & Security Summary */}
        <div className="space-y-6">
          {/* Admin Navigation Shortcuts */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#0F8B8D]" />
              Administration Quick Links
            </h2>
            <div className="space-y-1.5">
              {[
                { label: 'Manage Users & Access', view: 'adminUsers', desc: '8 Active Users & Plant Assignments' },
                { label: 'RBAC Permission Matrix', view: 'adminRoles', desc: '6 Custom Roles & 13 Modules' },
                { label: 'Company & Plant Setup', view: 'adminPlants', desc: 'GSTIN, CIN & 3 Facilities' },
                { label: 'Document Numbering Series', view: 'adminNumbering', desc: 'WO, PO, SO, GRN & Tax Invoices' },
                { label: 'Approval Workflows', view: 'adminWorkflows', desc: 'PO & BOM Sign-off Tiers' },
                { label: 'Security & MFA Policy', view: 'adminSecurity', desc: 'Lockouts, Session Timeouts, IP Whitelist' },
                { label: 'System Audit Logs', view: 'adminAuditLogs', desc: 'Immutable SOX/SOC2 Audit Trail' },
                { label: 'API Connectors & Hardware', view: 'adminIntegrations', desc: 'SAP, NIC GST, Weighbridge & Zebra' },
                { label: 'Database Backup & Restore', view: 'adminBackups', desc: 'Automated Daily Snapshots' },
                { label: 'Alert Notification Templates', view: 'adminNotifications', desc: 'Email, SMS, WhatsApp Triggers' },
                { label: 'Master ERP Parameters', view: 'adminCustomFields', desc: 'Negative Stock Block, FEFO & UDF' },
              ].map((item) => (
                <button
                  key={item.view}
                  onClick={() => onNavigate && onNavigate(item.view)}
                  className="w-full text-left p-2.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all flex items-center justify-between group"
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-800 group-hover:text-[#0F8B8D] transition-colors">
                      {item.label}
                    </div>
                    <div className="text-[11px] text-slate-400">{item.desc}</div>
                  </div>
                  <span className="text-slate-300 group-hover:text-[#0F8B8D] transition-colors text-xs font-bold">&rarr;</span>
                </button>
              ))}
            </div>
          </div>

          {/* Security & Audit Pulse */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900">Recent Audit Pulse</h2>
              </div>
              <button
                onClick={() => onNavigate && onNavigate('adminAuditLogs')}
                className="text-xs font-medium text-[#0F8B8D] hover:underline"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {mockAuditLogs.slice(0, 4).map((log) => (
                <div key={log.id} className="text-xs pb-2.5 border-b border-slate-100 last:border-b-0">
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-slate-900">{log.userName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{log.timestamp.split(' ')[1]}</span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5 line-clamp-1">{log.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[9px] font-mono">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-slate-400">{log.module}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
