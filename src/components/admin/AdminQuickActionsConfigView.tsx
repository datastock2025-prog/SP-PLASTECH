import React, { useState } from 'react';
import {
  Sliders,
  Zap,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Filter,
  BarChart3,
  Clock,
  ShieldCheck,
  Smartphone,
  Layers,
  Edit2,
  Check,
  X,
  Pin,
  PinOff,
  TrendingUp,
  Activity,
  UserCheck,
  ArrowUpDown,
  Laptop,
} from 'lucide-react';
import { INITIAL_QUICK_ACTIONS, QuickActionItem, SAMPLE_QA_AUDIT_LOGS, QuickActionUsageAudit } from '../../data/quickActionsData';

interface AdminQuickActionsConfigViewProps {
  showToast?: (msg: string) => void;
}

export const AdminQuickActionsConfigView: React.FC<AdminQuickActionsConfigViewProps> = ({
  showToast = (_msg: string) => {},
}) => {
  const [actions, setActions] = useState<QuickActionItem[]>(INITIAL_QUICK_ACTIONS);
  const [auditLogs, setAuditLogs] = useState<QuickActionUsageAudit[]>(SAMPLE_QA_AUDIT_LOGS);
  const [activeTab, setActiveTab] = useState<'config' | 'analytics' | 'audit'>('config');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('ALL');
  const [editingAction, setEditingAction] = useState<QuickActionItem | null>(null);

  const modulesList = ['ALL', 'Production', 'Quality', 'Warehouse', 'Maintenance', 'Procurement', 'Sales', 'HR', 'Admin'];

  const filteredActions = actions.filter((act) => {
    const matchesModule = selectedModule === 'ALL' || act.module === selectedModule;
    const matchesSearch =
      act.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesModule && matchesSearch;
  });

  const handleToggleActive = (id: string) => {
    setActions((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const next = !a.isActive;
          showToast(`${a.name} is now ${next ? 'ENABLED' : 'DISABLED'}`);
          return { ...a, isActive: next };
        }
        return a;
      })
    );
  };

  const handleTogglePinned = (id: string) => {
    setActions((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const next = !a.isDefaultPinned;
          showToast(`${a.name} default pin set to ${next}`);
          return { ...a, isDefaultPinned: next };
        }
        return a;
      })
    );
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAction) return;

    setActions((prev) =>
      prev.map((a) => (a.id === editingAction.id ? editingAction : a))
    );
    showToast(`Quick Action ${editingAction.id} configuration updated!`);
    setEditingAction(null);
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0F8B8D] to-[#14213D] text-white flex items-center justify-center shadow-md">
              <Zap className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Quick Actions Administration &amp; Governance
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure role-based action triggers, global keyboard shortcuts, open behaviors, and execution telemetry.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setActiveTab('config')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'config'
                  ? 'bg-[#0F8B8D] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Action Registry ({actions.length})
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'analytics'
                  ? 'bg-[#0F8B8D] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Usage Analytics
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'audit'
                  ? 'bg-[#0F8B8D] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Execution Audit Log
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: Action Registry & Configuration Table */}
      {activeTab === 'config' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter actions or shortcuts..."
                  className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0F8B8D] outline-none"
                />
              </div>

              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white font-semibold text-slate-700"
              >
                {modulesList.map((m) => (
                  <option key={m} value={m}>
                    {m === 'ALL' ? 'All Modules' : m}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <span>Shortcuts:</span>
              <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono">
                Ctrl+Shift+Q
              </kbd>
              <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono">
                Ctrl+Shift+N
              </kbd>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Action ID &amp; Name</th>
                    <th className="py-3 px-4">Module</th>
                    <th className="py-3 px-4">Target Behavior</th>
                    <th className="py-3 px-4">Shortcut</th>
                    <th className="py-3 px-4">Allowed Roles</th>
                    <th className="py-3 px-4 text-center">Default Pin</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredActions.map((act) => (
                    <tr key={act.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#0F8B8D]/10 text-[#0F8B8D] flex items-center justify-center font-bold text-xs shrink-0">
                            {act.sortOrder}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              <span>{act.name}</span>
                              <span className="text-[10px] font-mono text-slate-400">({act.id})</span>
                            </div>
                            <div className="text-[11px] text-slate-500 truncate max-w-xs">{act.description}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {act.module}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-[#0F8B8D] border border-teal-100">
                          {act.openBehavior}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {act.shortcut ? (
                          <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded shadow-2xs">
                            {act.shortcut}
                          </kbd>
                        ) : (
                          <span className="text-slate-300">&mdash;</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 flex-wrap max-w-xs">
                          {act.allowedRoles.slice(0, 3).map((role) => (
                            <span
                              key={role}
                              className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium"
                            >
                              {role}
                            </span>
                          ))}
                          {act.allowedRoles.length > 3 && (
                            <span className="text-[10px] text-slate-400 font-semibold">
                              +{act.allowedRoles.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleTogglePinned(act.id)}
                          title={act.isDefaultPinned ? 'Pinned in favorites' : 'Unpinned'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            act.isDefaultPinned
                              ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
                              : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          {act.isDefaultPinned ? <Pin className="w-4 h-4 fill-amber-500" /> : <PinOff className="w-4 h-4" />}
                        </button>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleActive(act.id)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                            act.isActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                          }`}
                        >
                          {act.isActive ? 'ACTIVE' : 'DISABLED'}
                        </button>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setEditingAction({ ...act })}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#0F8B8D] hover:bg-slate-100 transition-colors"
                          title="Configure Parameters"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Usage Analytics & Telemetry */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Total Quick Actions Executed</span>
                <Zap className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">1,248</div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> +18.4% vs last week
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Average Execution Time</span>
                <Clock className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">18.2s</div>
              <div className="text-[11px] text-slate-500 mt-1">vs 2.4 mins for full-page navigation</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Success Rate</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-emerald-700 mt-2">99.2%</div>
              <div className="text-[11px] text-slate-500 mt-1">10 validation retries resolved inline</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Mobile &amp; FAB Adoption</span>
                <Smartphone className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">42.8%</div>
              <div className="text-[11px] text-purple-600 font-semibold mt-1">Shopfloor tablet &amp; mobile users</div>
            </div>
          </div>

          {/* Breakdown by Top Actions & Role Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#0F8B8D]" />
                <span>Most Frequently Used Quick Actions (30-Day Volume)</span>
              </h3>
              <div className="space-y-3">
                {[
                  { name: 'Create Work Order (IMM Press)', count: 485, pct: 100, color: 'bg-[#0F8B8D]' },
                  { name: 'Record Machine Downtime', count: 320, pct: 66, color: 'bg-[#E8622C]' },
                  { name: 'Receive Goods (GRN Silo)', count: 215, pct: 44, color: 'bg-indigo-600' },
                  { name: 'Create NCR (Plastic Defect)', count: 184, pct: 38, color: 'bg-rose-500' },
                  { name: 'Create Purchase Requisition', count: 142, pct: 29, color: 'bg-amber-500' },
                ].map((row) => (
                  <div key={row.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-700">{row.name}</span>
                      <span className="text-slate-900">{row.count} uses</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className={`h-full rounded-full ${row.color}`} style={{ width: `${row.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>Quick Action Executions by User Role</span>
              </h3>
              <div className="space-y-3">
                {[
                  { role: 'Machine Operators & Technicians', count: '460 executions', share: '36.8%' },
                  { role: 'Production Supervisors & Schedulers', count: '345 executions', share: '27.6%' },
                  { role: 'Warehouse Staff (Silo / Dispatch)', count: '210 executions', share: '16.8%' },
                  { role: 'Quality Inspectors & Lab Techs', count: '148 executions', share: '11.9%' },
                  { role: 'Plant Managers & Admin', count: '85 executions', share: '6.9%' },
                ].map((item) => (
                  <div key={item.role} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                    <span className="font-semibold text-slate-800">{item.role}</span>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 block">{item.count}</span>
                      <span className="text-[10px] text-slate-500">{item.share}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Execution Audit Log */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Real-Time Quick Action Execution Trail</h3>
              <p className="text-xs text-slate-500">Live immutable ledger of fast transactions across plants and devices.</p>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 animate-pulse" /> Telemetry Live
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Audit ID &amp; Time</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">User &amp; Role</th>
                  <th className="py-3 px-4">Trigger Source</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Created Record</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono">
                      <div className="font-bold text-slate-800">{log.id}</div>
                      <div className="text-[10px] text-slate-400">{log.timestamp}</div>
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-800">
                      <div>{log.actionName}</div>
                      <div className="text-[10px] text-slate-500">{log.module}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{log.userName}</div>
                      <div className="text-[10px] text-slate-500">{log.userRole} &bull; {log.plantId}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {log.triggerSource}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-600">
                      {log.durationSec}s
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-[#0F8B8D]">
                      {log.recordId || '&mdash;'}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Action Modal */}
      {editingAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">
                Configure Quick Action: {editingAction.name} ({editingAction.id})
              </h3>
              <button
                onClick={() => setEditingAction(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Action Name</label>
                <input
                  type="text"
                  value={editingAction.name}
                  onChange={(e) => setEditingAction({ ...editingAction, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Open Behavior</label>
                <select
                  value={editingAction.openBehavior}
                  onChange={(e: any) => setEditingAction({ ...editingAction, openBehavior: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold bg-white"
                >
                  <option value="Modal">Interactive Modal</option>
                  <option value="Drawer">Slide-Over Drawer</option>
                  <option value="Full Page">Full Page Navigation</option>
                  <option value="External Link">External Link</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Keyboard Shortcut</label>
                <input
                  type="text"
                  value={editingAction.shortcut || ''}
                  onChange={(e) => setEditingAction({ ...editingAction, shortcut: e.target.value })}
                  placeholder="e.g. Alt + W"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Required RBAC Permission</label>
                <input
                  type="text"
                  value={editingAction.permissionRequired}
                  onChange={(e) => setEditingAction({ ...editingAction, permissionRequired: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  required
                />
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingAction.isActive}
                    onChange={(e) => setEditingAction({ ...editingAction, isActive: e.target.checked })}
                    className="rounded text-[#0F8B8D]"
                  />
                  <span className="font-semibold text-slate-700">Active &amp; Available</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingAction.isDefaultPinned}
                    onChange={(e) => setEditingAction({ ...editingAction, isDefaultPinned: e.target.checked })}
                    className="rounded text-amber-500"
                  />
                  <span className="font-semibold text-slate-700">Pinned in Favorites by Default</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingAction(null)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-white bg-[#0F8B8D] hover:bg-[#0b6e70] shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
