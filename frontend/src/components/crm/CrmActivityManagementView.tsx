import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Plus,
  Phone,
  Video,
  Building2,
  Users,
  FlaskConical,
  FileText,
  AlertTriangle,
  ChevronRight,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Activity, ActivityType, ActivityStatus } from '../../types/crm';
import { mockActivities, mockAccounts, mockLeads } from '../../data/mockCrmData';

interface CrmActivityManagementViewProps {
  onNavigate: (view: string, params?: any) => void;
  showToast: (message: string) => void;
}

export const CrmActivityManagementView: React.FC<CrmActivityManagementViewProps> = ({
  onNavigate,
  showToast,
}) => {
  const [activities, setActivities] = useState<Activity[]>(mockActivities);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showLogModal, setShowLogModal] = useState(false);

  const [newActivity, setNewActivity] = useState<Partial<Activity>>({
    type: 'Customer Plant Visit',
    subject: '',
    description: '',
    accountId: mockAccounts[0].id,
    accountName: mockAccounts[0].accountName,
    contactPerson: 'Vikram Malhotra',
    assignedTo: 'Rajesh Sharma',
    scheduledDate: '2026-09-06',
    status: 'Planned',
    priority: 'High',
  });

  const filteredActivities = useMemo(() => {
    return activities.filter(act => {
      if (typeFilter !== 'All' && act.type !== typeFilter) return false;
      if (statusFilter !== 'All' && act.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          act.subject.toLowerCase().includes(q) ||
          act.accountName?.toLowerCase().includes(q) ||
          act.assignedTo.toLowerCase().includes(q) ||
          act.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [activities, typeFilter, statusFilter, searchQuery]);

  const handleToggleComplete = (actId: string) => {
    setActivities(prev =>
      prev.map(a => {
        if (a.id === actId) {
          const newStatus: ActivityStatus = a.status === 'Completed' ? 'Planned' : 'Completed';
          return { ...a, status: newStatus };
        }
        return a;
      })
    );
    showToast(`Activity status updated`);
  };

  const handleLogActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivity.subject) {
      showToast('Please enter an activity subject');
      return;
    }

    const created: Activity = {
      id: `ACT-2026-0${activities.length + 1}`,
      type: newActivity.type as ActivityType,
      subject: newActivity.subject,
      description: newActivity.description || '',
      accountId: newActivity.accountId,
      accountName: newActivity.accountName,
      contactPerson: newActivity.contactPerson || 'Key Stakeholder',
      assignedTo: newActivity.assignedTo || 'Rajesh Sharma',
      scheduledDate: newActivity.scheduledDate || '2026-09-10',
      status: 'Planned',
      priority: newActivity.priority as any || 'Medium',
      createdAt: '2026-09-01',
    };

    setActivities([created, ...activities]);
    setShowLogModal(false);
    showToast(`Logged activity: ${created.subject}`);
  };

  const getTypeIcon = (type: ActivityType) => {
    switch (type) {
      case 'Phone Call':
        return <Phone className="w-4 h-4 text-blue-600" />;
      case 'Video Conference':
        return <Video className="w-4 h-4 text-purple-600" />;
      case 'Customer Plant Visit':
        return <Building2 className="w-4 h-4 text-amber-600" />;
      case 'Sample Trial Visit':
        return <FlaskConical className="w-4 h-4 text-teal-600" />;
      case 'Commercial Negotiation':
        return <FileText className="w-4 h-4 text-emerald-600" />;
      default:
        return <Calendar className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
              Sales Cadence
            </span>
            <span className="text-xs text-slate-500">{filteredActivities.length} Tasks Scheduled</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Activities & Plant Visit Tracker</h1>
          <p className="text-sm text-slate-600">
            Log technical customer audits, mold trial visits, commercial follow-ups, and price renegotiation meetings.
          </p>
        </div>

        <button
          onClick={() => setShowLogModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Schedule Activity
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks, plant visits, meetings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 focus:ring-2 focus:ring-teal-500"
          >
            <option value="All">All Activity Types</option>
            <option value="Customer Plant Visit">Customer Plant Visit</option>
            <option value="Sample Trial Visit">Sample Trial Visit</option>
            <option value="Commercial Negotiation">Commercial Negotiation</option>
            <option value="Phone Call">Phone Call</option>
            <option value="Video Conference">Video Conference</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 focus:ring-2 focus:ring-teal-500"
          >
            <option value="All">All Statuses</option>
            <option value="Planned">Planned</option>
            <option value="Completed">Completed</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden divide-y divide-slate-200">
        {filteredActivities.map(act => (
          <div
            key={act.id}
            className={`p-4 hover:bg-slate-50 transition-colors flex items-start justify-between gap-4 ${
              act.status === 'Completed' ? 'bg-slate-50/40 opacity-75' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <button
                onClick={() => handleToggleComplete(act.id)}
                className={`mt-0.5 p-1 rounded-full border transition-colors ${
                  act.status === 'Completed'
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'border-slate-300 hover:border-emerald-500 text-transparent hover:text-emerald-500'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-slate-100 rounded-md">
                    {getTypeIcon(act.type)}
                  </div>
                  <h3 className={`font-bold text-xs ${act.status === 'Completed' ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                    {act.subject}
                  </h3>
                  <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                    act.priority === 'Critical' ? 'bg-rose-100 text-rose-800' :
                    act.priority === 'High' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {act.priority}
                  </span>
                </div>

                <p className="text-xs text-slate-600">{act.description}</p>

                {act.outcome && (
                  <div className="p-2 bg-emerald-50/60 rounded border border-emerald-200 text-[11px] text-emerald-800 font-medium">
                    Outcome: {act.outcome}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                  <span className="font-semibold text-teal-700">{act.accountName}</span>
                  <span>•</span>
                  <span>Contact: {act.contactPerson}</span>
                  <span>•</span>
                  <span>Owner: {act.assignedTo}</span>
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-xs font-bold text-slate-800 flex items-center justify-end gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {act.scheduledDate}
              </div>
              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold mt-1 ${
                act.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
              }`}>
                {act.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Schedule Activity Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Schedule CRM Interaction</h3>
              <button onClick={() => setShowLogModal(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleLogActivity} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Interaction Type *</label>
                <select
                  value={newActivity.type}
                  onChange={(e) => setNewActivity({ ...newActivity, type: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="Customer Plant Visit">Customer Plant Visit</option>
                  <option value="Sample Trial Visit">Sample Trial Visit</option>
                  <option value="Commercial Negotiation">Commercial Negotiation</option>
                  <option value="Phone Call">Phone Call</option>
                  <option value="Video Conference">Video Conference</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject / Objective *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mold Trial Sign-Off at Chakan Plant"
                  value={newActivity.subject}
                  onChange={(e) => setNewActivity({ ...newActivity, subject: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                >
                </input>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Customer Account</label>
                  <select
                    value={newActivity.accountId}
                    onChange={(e) => {
                      const acc = mockAccounts.find(a => a.id === e.target.value);
                      setNewActivity({ ...newActivity, accountId: e.target.value, accountName: acc?.accountName });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  >
                    {mockAccounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.accountName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    value={newActivity.scheduledDate}
                    onChange={(e) => setNewActivity({ ...newActivity, scheduledDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description & Agenda</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Inspect injection cycle, verify shrinkage tolerance and color dispersion..."
                  value={newActivity.description}
                  onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
