import React, { useState } from 'react';
import {
  CheckSquare,
  FileCheck,
  Bell,
  Eye,
  History,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Filter,
  Search,
  Trash2,
  Calendar,
  User,
  Building,
  Tag,
  Share2,
  ExternalLink,
  ChevronRight,
  Sliders,
  Plus,
} from 'lucide-react';
import { INITIAL_RECENT_RECORDS, RecentRecordItem } from '../../data/sidebarNavigationData';

interface WorkspaceToolProps {
  onNavigate: (view: string, param?: any) => void;
  showToast?: (msg: string) => void;
}

export const WorkspaceTasksView: React.FC<WorkspaceToolProps> = ({ onNavigate, showToast }) => {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('PENDING');
  const [tasks, setTasks] = useState([
    { id: 'TSK-101', title: 'Sign off Line 02 SMED Changeover Checklist', module: 'Production', priority: 'HIGH', due: 'Today, 2:00 PM', assignedBy: 'Priya Rao', status: 'PENDING', view: 'changeover' },
    { id: 'TSK-102', title: 'Perform In-Process AQL Inspection on WO-2026-00456', module: 'Quality', priority: 'CRITICAL', due: 'Today, 3:30 PM', assignedBy: 'Vikram Mehta', status: 'PENDING', view: 'inspectionPlanList' },
    { id: 'TSK-103', title: 'Review Quarantine Release for Resin Lot LOT-2026-00123', module: 'Warehouse', priority: 'MEDIUM', due: 'Tomorrow', assignedBy: 'Anand Kumar', status: 'PENDING', view: 'quarantine' },
    { id: 'TSK-104', title: 'Authorize Overtime Shift Roster for IMM-04 night shift', module: 'HR', priority: 'MEDIUM', due: 'Tomorrow, 10:00 AM', assignedBy: 'HR Ops', status: 'PENDING', view: 'hrLeaveOvertime' },
    { id: 'TSK-105', title: 'Verify Silo 03 PP Granules Cycle Count Reconciliation', module: 'Warehouse', priority: 'LOW', due: 'In 3 days', assignedBy: 'Inventory Lead', status: 'PENDING', view: 'cycleCount' },
    { id: 'TSK-106', title: 'Recalibrate Chiller Unit CH-02 Pressure Transducer', module: 'Maintenance', priority: 'MEDIUM', due: 'Yesterday', assignedBy: 'Toolroom Lead', status: 'COMPLETED', view: 'calibrationTracker' },
  ]);

  const handleToggle = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: t.status === 'PENDING' ? 'COMPLETED' : 'PENDING' } : t));
    showToast?.('Task status updated successfully');
  };

  const filteredTasks = tasks.filter(t => filter === 'ALL' || t.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">My Tasks &amp; Work Items</h1>
            <p className="text-xs text-slate-500">Track and execute your assigned shop floor actions, shift checklists, and quality sign-offs</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50 text-xs">
            {(['PENDING', 'COMPLETED', 'ALL'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  filter === f ? 'bg-white text-indigo-600 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {filteredTasks.map(task => (
          <div
            key={task.id}
            className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              task.status === 'COMPLETED' ? 'bg-slate-50/80 border-slate-200 opacity-70' : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xs'
            }`}
          >
            <div className="flex items-start gap-3 min-w-0">
              <button
                onClick={() => handleToggle(task.id)}
                className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${
                  task.status === 'COMPLETED' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-indigo-500'
                }`}
              >
                {task.status === 'COMPLETED' && <CheckCircle2 className="w-4 h-4" />}
              </button>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">{task.id}</span>
                  <span className="text-[11px] font-semibold text-slate-500">{task.module}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    task.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                    task.priority === 'HIGH' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {task.priority}
                  </span>
                </div>
                <h3 className={`text-sm font-semibold mt-1 text-slate-900 ${task.status === 'COMPLETED' ? 'line-through text-slate-400' : ''}`}>
                  {task.title}
                </h3>
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Due: {task.due}</span>
                  <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> From: {task.assignedBy}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => onNavigate(task.view)}
                className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span>Execute Action</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const WorkspaceApprovalsView: React.FC<WorkspaceToolProps> = ({ onNavigate, showToast }) => {
  const [approvals, setApprovals] = useState([
    { id: 'APP-201', type: 'Purchase Order', record: 'PO-2026-00789', desc: '40MT Virgin Polypropylene Copolymer (₹38.5 Lakhs)', initiator: 'Kavita Iyer', date: 'Today, 11:20 AM', amount: '₹38,50,000', view: 'poApprovals' },
    { id: 'APP-202', type: 'Engineering Change (ECO)', record: 'ECO-2026-014', desc: 'Cavity Core insert revision for Bumper Mold M-004', initiator: 'R&D Engineering', date: 'Yesterday', amount: 'Tooling Rev B', view: 'ecoList' },
    { id: 'APP-203', type: 'Credit Limit Exception', record: 'SO-2026-1234', desc: 'Maruti Suzuki ₹15L over standard 60-day credit exposure', initiator: 'Sales Desk', date: '2 days ago', amount: '₹15,00,000', view: 'creditControl' },
  ]);

  const handleAction = (id: string, action: 'Approve' | 'Reject') => {
    setApprovals(prev => prev.filter(a => a.id !== id));
    showToast?.(`${action}d successfully`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">My Approvals Hub</h1>
            <p className="text-xs text-slate-500">Multi-tier sign-offs across Purchase Orders, ECO revisions, Credit Approvals, and QC Releases</p>
          </div>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
          {approvals.length} PENDING DECISIONS
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {approvals.map(app => (
          <div key={app.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">{app.type}</span>
                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">{app.record}</span>
                <span className="text-xs font-semibold text-slate-900">{app.amount}</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">{app.desc}</h3>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                <span>Requested by: <b>{app.initiator}</b></span>
                <span>&bull;</span>
                <span>{app.date}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end shrink-0">
              <button
                onClick={() => onNavigate(app.view)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
              >
                Inspect Details
              </button>
              <button
                onClick={() => handleAction(app.id, 'Reject')}
                className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors"
              >
                Reject
              </button>
              <button
                onClick={() => handleAction(app.id, 'Approve')}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-colors"
              >
                One-Click Approve
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const WorkspaceNotificationsView: React.FC<WorkspaceToolProps> = ({ onNavigate, showToast }) => {
  const [notifications, setNotifications] = useState([
    { id: 'NOT-01', title: 'Mold Temperature Alert on IMM Press 04', text: 'Cavity zone thermocouple reads 234°C (Upper threshold exceeded by 9°C)', type: 'ALERT', time: '12 mins ago', view: 'mfgDash' },
    { id: 'NOT-02', title: 'Raw Material Silo 02 Low Level Warning', text: 'PP Homopolymer stock below 2.5 metric tons minimum safety buffer', type: 'WARNING', time: '45 mins ago', view: 'stockList' },
    { id: 'NOT-03', title: 'Work Order WO-2026-00456 Ready for Final QC', text: 'Lot of 1,200 automotive housings finished injection molding cycle', type: 'INFO', time: '2 hrs ago', view: 'woList' },
    { id: 'NOT-04', title: 'New Customer Quotation Q-2026-89 Accepted', text: 'Tata Motors accepted quotation for battery brackets (Value ₹14.8L)', type: 'SUCCESS', time: '4 hrs ago', view: 'quoteList' },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Notification Center</h1>
            <p className="text-xs text-slate-500">Live floor telemetries, threshold alarms, and production milestone triggers</p>
          </div>
        </div>
        <button
          onClick={() => { setNotifications([]); showToast?.('All notifications marked as read'); }}
          className="text-xs text-indigo-600 font-semibold hover:underline"
        >
          Clear all notifications
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {notifications.map(n => (
          <div key={n.id} onClick={() => onNavigate(n.view)} className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer flex items-start gap-3.5">
            <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
              n.type === 'ALERT' ? 'bg-rose-500' :
              n.type === 'WARNING' ? 'bg-amber-500' :
              n.type === 'SUCCESS' ? 'bg-emerald-500' : 'bg-indigo-500'
            }`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-bold text-slate-900">{n.title}</h4>
                <span className="text-[11px] text-slate-400 shrink-0">{n.time}</span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">{n.text}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 self-center shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const WorkspaceSavedViewsView: React.FC<WorkspaceToolProps> = ({ onNavigate }) => {
  const presets = [
    { id: 'SV-1', title: 'Active Molding Work Orders (Plant 01)', module: 'Manufacturing', view: 'woList', count: '14 orders', icon: '📋' },
    { id: 'SV-2', title: 'Critical Stock Items Below Reorder Point', module: 'Warehouse', view: 'stockList', count: '6 SKUs', icon: '📦' },
    { id: 'SV-3', title: 'Open Quality NCRs Awaiting 5-Why RCA', module: 'Quality', view: 'ncrList', count: '2 NCRs', icon: '⚠️' },
    { id: 'SV-4', title: 'Purchase Orders Pending Multi-Tier Approval', module: 'Procurement', view: 'poApprovals', count: '3 POs', icon: '🧾' },
    { id: 'SV-5', title: 'Weekly Injection Press Shift Rosters', module: 'HRMS', view: 'hrShiftRoster', count: '128 staff', icon: '👥' },
    { id: 'SV-6', title: 'Machines Exceeding Energy Thresholds', module: 'MEP', view: 'energyTelemetry', count: '4 units', icon: '⚡' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Saved Views &amp; Presets</h1>
            <p className="text-xs text-slate-500">Quickly launch predefined data grid queries, custom column layouts, and filtered records</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {presets.map(p => (
          <div
            key={p.id}
            onClick={() => onNavigate(p.view)}
            className="bg-white p-5 rounded-xl border border-slate-200 hover:border-purple-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span className="font-semibold uppercase tracking-wider text-[10px] text-purple-600">{p.module}</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded font-mono text-[11px]">{p.count}</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>{p.icon}</span>
                <span>{p.title}</span>
              </h3>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-purple-600 font-semibold">
              <span>Open filtered view</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const WorkspaceRecentRecordsView: React.FC<WorkspaceToolProps> = ({ onNavigate, showToast }) => {
  const [records, setRecords] = useState<RecentRecordItem[]>(INITIAL_RECENT_RECORDS);

  const handleClear = () => {
    setRecords([]);
    try {
      localStorage.removeItem('reboot_recent_records');
    } catch (e) {
      console.error(e);
    }
    showToast?.('Recent records history cleared');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Recent Records Log</h1>
            <p className="text-xs text-slate-500">History of your recently visited work orders, sales orders, polymer items, and vendors</p>
          </div>
        </div>
        {records.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-xs font-semibold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {records.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
          <History className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-700">No recent records yet</h3>
          <p className="text-xs text-slate-500 mt-1">Navigate to any work order, part, or supplier to populate this list.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {records.map(rec => (
            <div
              key={rec.id}
              onClick={() => onNavigate(rec.view, rec.params)}
              className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs uppercase font-mono shrink-0">
                  {rec.type}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-700">{rec.recordCode}</span>
                    <span className="text-[11px] text-slate-400 font-medium">&bull; {rec.module}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-800 truncate mt-0.5">{rec.title}</h4>
                </div>
              </div>
              <div className="text-[11px] text-slate-400 shrink-0 flex items-center gap-1">
                <span>{rec.timestamp}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
