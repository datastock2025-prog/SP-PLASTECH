import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  DollarSign,
  UserCheck,
  Award,
} from 'lucide-react';
import { HrLeaveRequest, HrOvertimeRequest } from '../../types';

interface HrLeaveOvertimeViewProps {
  leaves: HrLeaveRequest[];
  overtime: HrOvertimeRequest[];
  onApproveLeave: (leaveId: string) => void;
  onRejectLeave: (leaveId: string) => void;
  onApproveOvertime: (otId: string) => void;
  onRejectOvertime: (otId: string) => void;
  showToast: (msg: string) => void;
}

export const HrLeaveOvertimeView: React.FC<HrLeaveOvertimeViewProps> = ({
  leaves,
  overtime,
  onApproveLeave,
  onRejectLeave,
  onApproveOvertime,
  onRejectOvertime,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'leaves' | 'overtime'>('leaves');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isApplyLeaveModalOpen, setIsApplyLeaveModalOpen] = useState(false);
  const [isOtRequestModalOpen, setIsOtRequestModalOpen] = useState(false);

  // New Leave Form State
  const [newLeaveEmp, setNewLeaveEmp] = useState('EMP-1001 (Suresh Patil)');
  const [newLeaveType, setNewLeaveType] = useState('Casual Leave (CL)');
  const [newLeaveStart, setNewLeaveStart] = useState('2026-09-10');
  const [newLeaveEnd, setNewLeaveEnd] = useState('2026-09-11');
  const [newLeaveDays, setNewLeaveDays] = useState(2);
  const [newLeaveReason, setNewLeaveReason] = useState('');

  const filteredLeaves = leaves.filter((l) => {
    const matchSearch =
      l.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'All' || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const filteredOvertime = overtime.filter((o) => {
    const matchSearch =
      o.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'All' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleCreateLeave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast(`Leave application submitted for ${newLeaveEmp} (${newLeaveDays} days). Pending Supervisor approval.`);
    setIsApplyLeaveModalOpen(false);
  };

  const handleCreateOt = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Production Overtime pre-authorization request logged for shift supervisor review.');
    setIsOtRequestModalOpen(false);
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Top Header & Tab switcher */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-base text-[#14213D] flex items-center gap-2">
              <span>Leave Applications &amp; Production Overtime Management</span>
            </h2>
            <p className="text-slate-500">
              Casual/Sick/Earned leaves, multi-level supervisor approvals, OT pre-authorization, and statutory 2x payroll rates.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-lg flex items-center gap-1">
            <button
              onClick={() => setActiveTab('leaves')}
              className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                activeTab === 'leaves' ? 'bg-white text-[#14213D] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Leave Requests ({leaves.filter((l) => l.status === 'Pending').length} Pending)
            </button>
            <button
              onClick={() => setActiveTab('overtime')}
              className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                activeTab === 'overtime' ? 'bg-white text-[#14213D] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Overtime Pre-Authorization ({overtime.filter((o) => o.status === 'Pending').length} Pending)
            </button>
          </div>

          {activeTab === 'leaves' ? (
            <button
              onClick={() => setIsApplyLeaveModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0F8B8D] text-white rounded-lg font-bold hover:bg-[#0c7072] transition cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Apply for Leave</span>
            </button>
          ) : (
            <button
              onClick={() => setIsOtRequestModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#E8622C] text-white rounded-lg font-bold hover:bg-[#d55320] transition cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Authorize Overtime (OT)</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search employee, ID, reason, department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0F8B8D]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium cursor-pointer"
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending Approval</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* 1. Leaves Tab */}
      {activeTab === 'leaves' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Staff / Code</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Leave Type</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Days</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredLeaves.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/70">
                    <td className="p-3">
                      <div className="font-bold text-[#14213D]">{l.employeeName}</div>
                      <div className="text-[10px] font-mono text-slate-400">{l.employeeId}</div>
                    </td>
                    <td className="p-3 text-slate-600">{l.department}</td>
                    <td className="p-3">
                      <span className="font-semibold text-slate-800">{l.leaveType}</span>
                    </td>
                    <td className="p-3 font-mono">
                      {l.startDate} to {l.endDate}
                    </td>
                    <td className="p-3 font-bold text-[#14213D]">{l.days} Day(s)</td>
                    <td className="p-3 text-slate-600 max-w-[220px] truncate" title={l.reason}>
                      {l.reason}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          l.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : l.status === 'Pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {l.status === 'Pending' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onApproveLeave(l.id)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded font-bold border border-emerald-200 transition cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => onRejectLeave(l.id)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded font-bold border border-rose-200 transition cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-semibold">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Overtime Tab */}
      {activeTab === 'overtime' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Staff / Code</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">OT Hours</th>
                  <th className="p-3">Rate Multiplier</th>
                  <th className="p-3">Production Reason</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredOvertime.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/70">
                    <td className="p-3">
                      <div className="font-bold text-[#14213D]">{o.employeeName}</div>
                      <div className="text-[10px] font-mono text-slate-400">{o.employeeId}</div>
                    </td>
                    <td className="p-3 text-slate-600">{o.department}</td>
                    <td className="p-3 font-mono">{o.date}</td>
                    <td className="p-3 font-bold text-blue-700">{o.hours} Hours</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 font-mono font-bold rounded">
                        {o.rateMultiplier}x Basic
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 max-w-[260px] truncate" title={o.reason}>
                      {o.reason}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          o.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : o.status === 'Pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {o.status === 'Pending' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onApproveOvertime(o.id)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded font-bold border border-emerald-200 transition cursor-pointer"
                          >
                            Approve OT
                          </button>
                          <button
                            onClick={() => onRejectOvertime(o.id)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded font-bold border border-rose-200 transition cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-semibold">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      {isApplyLeaveModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateLeave} className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-[#14213D]">Apply for Employee Leave</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Employee</label>
                <select
                  value={newLeaveEmp}
                  onChange={(e) => setNewLeaveEmp(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option>EMP-1001 (Suresh Patil)</option>
                  <option>EMP-1002 (Amit Deshmukh)</option>
                  <option>EMP-1003 (Pooja Sharma)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Leave Category</label>
                <select
                  value={newLeaveType}
                  onChange={(e) => setNewLeaveType(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option>Casual Leave (CL)</option>
                  <option>Sick Leave (SL)</option>
                  <option>Earned / Privilege Leave (PL)</option>
                  <option>Compensatory Off (CO)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">From Date</label>
                  <input
                    type="date"
                    value={newLeaveStart}
                    onChange={(e) => setNewLeaveStart(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">To Date</label>
                  <input
                    type="date"
                    value={newLeaveEnd}
                    onChange={(e) => setNewLeaveEnd(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Reason for Absence</label>
                <textarea
                  rows={2}
                  required
                  value={newLeaveReason}
                  onChange={(e) => setNewLeaveReason(e.target.value)}
                  placeholder="e.g. Family medical emergency / Personal reasons"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsApplyLeaveModalOpen(false)}
                className="px-3.5 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#0F8B8D] text-white rounded-lg font-bold hover:bg-[#0c7072] transition cursor-pointer"
              >
                Submit Application
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Authorize OT Modal */}
      {isOtRequestModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateOt} className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-[#14213D] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#E8622C]" />
              <span>Production Overtime Authorization</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Operator / Technician</label>
                <select className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <option>EMP-1001 (Suresh Patil - Injection Molding)</option>
                  <option>EMP-1002 (Amit Deshmukh - Tool Room)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">OT Date</label>
                  <input type="date" defaultValue="2026-09-02" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Planned OT Hours</label>
                  <input type="number" defaultValue="2" min="1" max="4" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold" />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Production Justification</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Critical rush dispatch for Automotive Tier-1 Order (Mahindra Bumper Mold run)."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsOtRequestModalOpen(false)}
                className="px-3.5 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#E8622C] text-white rounded-lg font-bold hover:bg-[#d55320] transition cursor-pointer"
              >
                Authorize Overtime
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
