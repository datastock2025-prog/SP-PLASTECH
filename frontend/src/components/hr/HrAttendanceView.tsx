import React, { useState } from 'react';
import {
  Clock,
  UserCheck,
  AlertTriangle,
  Radio,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Plus,
  Download,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { HrAttendanceRecord, HrAttendanceStatus } from '../../types';

interface HrAttendanceViewProps {
  attendance: HrAttendanceRecord[];
  onUpdateAttendance: (record: HrAttendanceRecord) => void;
  showToast: (msg: string) => void;
}

export const HrAttendanceView: React.FC<HrAttendanceViewProps> = ({
  attendance,
  onUpdateAttendance,
  showToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('2026-09-01');
  const [selectedShift, setSelectedShift] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedRecord, setSelectedRecord] = useState<HrAttendanceRecord | null>(null);
  const [isExceptionModalOpen, setIsExceptionModalOpen] = useState(false);
  const [exceptionReason, setExceptionReason] = useState('');

  // Filter attendance records
  const filteredRecords = attendance.filter((a) => {
    const matchesSearch =
      a.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesShift = selectedShift === 'All' || a.shift.includes(selectedShift);
    const matchesStatus = statusFilter === 'All' || a.status === statusFilter;

    return matchesSearch && matchesShift && matchesStatus;
  });

  const handleApproveException = (rec: HrAttendanceRecord) => {
    onUpdateAttendance({
      ...rec,
      status: 'Present',
      supervisorApproved: true,
      exception: `${rec.exception || 'Late arrival'} - Approved by Shift In-charge.`,
    });
    showToast(`Attendance exception for ${rec.employeeName} approved and updated.`);
    setIsExceptionModalOpen(false);
  };

  const handleExportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Date,Employee ID,Employee Name,Department,Shift,Scheduled In,Scheduled Out,Check In,Check Out,Total Hours,OT Hours,Late Mins,Status,Source']
        .concat(
          filteredRecords.map(
            (r) =>
              `${r.date},${r.employeeId},"${r.employeeName}",${r.department},"${r.shift}",${r.scheduledIn},${r.scheduledOut},${r.checkIn},${r.checkOut},${r.totalHours},${r.overtimeHours},${r.lateMinutes},${r.status},${r.deviceSource}`
          )
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `plastic_erp_attendance_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Daily attendance export completed for ${selectedDate}.`);
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Top Header & Live Device Status */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-50 text-cyan-700 rounded-lg border border-cyan-100">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-base text-[#14213D] flex items-center gap-2">
              <span>Daily Biometric Attendance &amp; Shift Exceptions</span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[10px] font-bold border border-emerald-200">
                <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-600" />
                <span>Gateways Online</span>
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Rotational shift punch logs, cross-day night shifts, missing punch exceptions, and supervisor approvals.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 text-xs cursor-pointer"
          />
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold border border-slate-200 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Daily CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-400 font-bold text-[10px] uppercase">Rostered Staff</span>
          <div className="text-lg font-bold text-[#14213D] mt-0.5">{attendance.length}</div>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-400 font-bold text-[10px] uppercase">Present On-Shift</span>
          <div className="text-lg font-bold text-emerald-700 mt-0.5">
            {attendance.filter((a) => a.status === 'Present').length}
          </div>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-400 font-bold text-[10px] uppercase">Late Arrivals</span>
          <div className="text-lg font-bold text-orange-600 mt-0.5">
            {attendance.filter((a) => a.lateMinutes > 0).length}
          </div>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-400 font-bold text-[10px] uppercase">Overtime Hours</span>
          <div className="text-lg font-bold text-blue-700 mt-0.5">
            {attendance.reduce((sum, a) => sum + a.overtimeHours, 0).toFixed(1)}h
          </div>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-400 font-bold text-[10px] uppercase">Attendance Accuracy</span>
          <div className="text-lg font-bold text-[#0F8B8D] mt-0.5">99.2%</div>
        </div>
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-400 font-bold text-[10px] uppercase">Shift Coverage</span>
          <div className="text-lg font-bold text-[#14213D] mt-0.5">96.4%</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search staff, code, department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0F8B8D]"
          />
        </div>

        <select
          value={selectedShift}
          onChange={(e) => setSelectedShift(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium cursor-pointer"
        >
          <option value="All">All Shifts</option>
          <option value="Shift A">Shift A (06:00 - 14:00)</option>
          <option value="Shift B">Shift B (14:00 - 22:00)</option>
          <option value="Shift C">Shift C (Night)</option>
          <option value="General">General Shift</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium cursor-pointer"
        >
          <option value="All">All Statuses</option>
          <option value="Present">Present</option>
          <option value="Late">Late Arrival</option>
          <option value="On Leave">On Leave</option>
          <option value="Absent">Absent</option>
        </select>
      </div>

      {/* Attendance Punch Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Staff / Code</th>
                <th className="p-3">Department</th>
                <th className="p-3">Shift Timing</th>
                <th className="p-3">In Punch</th>
                <th className="p-3">Out Punch</th>
                <th className="p-3">Total / OT</th>
                <th className="p-3">Terminal Gateway</th>
                <th className="p-3">Status / Exception</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/70">
                  <td className="p-3">
                    <div className="font-bold text-[#14213D]">{rec.employeeName}</div>
                    <div className="text-[10px] font-mono text-slate-400">{rec.employeeId}</div>
                  </td>
                  <td className="p-3 text-slate-600">{rec.department}</td>
                  <td className="p-3 font-semibold text-slate-800">{rec.shift}</td>
                  <td className="p-3 font-mono font-bold text-slate-900">{rec.checkIn}</td>
                  <td className="p-3 font-mono text-slate-700">{rec.checkOut}</td>
                  <td className="p-3 font-mono">
                    <span className="font-bold text-[#14213D]">{rec.totalHours}h</span>
                    {rec.overtimeHours > 0 && (
                      <span className="ml-1 text-blue-600 font-bold">(+{rec.overtimeHours}h OT)</span>
                    )}
                  </td>
                  <td className="p-3 text-slate-500">{rec.deviceSource}</td>
                  <td className="p-3">
                    <div className="flex flex-col gap-0.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold w-fit ${
                          rec.status === 'Present'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rec.status === 'Late'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {rec.status} {rec.lateMinutes > 0 ? `(${rec.lateMinutes}m Late)` : ''}
                      </span>
                      {rec.exception && (
                        <span className="text-[10px] text-slate-500 truncate max-w-[200px]" title={rec.exception}>
                          {rec.exception}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    {rec.lateMinutes > 0 || rec.status === 'Late' ? (
                      <button
                        onClick={() => {
                          setSelectedRecord(rec);
                          setIsExceptionModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded font-bold text-[10px] transition cursor-pointer"
                      >
                        Handle Exception
                      </button>
                    ) : (
                      <button
                        onClick={() => showToast(`Punches verified for ${rec.employeeName}`)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-semibold text-[10px] transition cursor-pointer"
                      >
                        Verify
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Exception Approval Modal */}
      {isExceptionModalOpen && selectedRecord && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-[#14213D]">Attendance Exception Resolution</h3>
            <p className="text-xs text-slate-500">
              Staff: <strong>{selectedRecord.employeeName} ({selectedRecord.employeeId})</strong>
              <br />
              Issue: Late arrival by {selectedRecord.lateMinutes} minutes ({selectedRecord.checkIn} check-in).
            </p>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Supervisor Remark / Approval Note</label>
              <textarea
                value={exceptionReason}
                onChange={(e) => setExceptionReason(e.target.value)}
                placeholder="e.g. Approved due to public transport delay / Official gate duty pass."
                rows={3}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsExceptionModalOpen(false)}
                className="px-3.5 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApproveException(selectedRecord)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition cursor-pointer"
              >
                Approve Exception
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
