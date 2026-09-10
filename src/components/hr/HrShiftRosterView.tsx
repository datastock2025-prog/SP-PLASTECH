import React, { useState } from 'react';
import {
  Calendar,
  Layers,
  Users,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Copy,
  Lock,
  Download,
  Shuffle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { HrShiftMaster, HrShiftRosterCell, HrEmployee } from '../../types';

interface HrShiftRosterViewProps {
  shifts: HrShiftMaster[];
  roster: HrShiftRosterCell[];
  employees: HrEmployee[];
  onUpdateRoster: (newRoster: HrShiftRosterCell[]) => void;
  showToast: (msg: string) => void;
}

export const HrShiftRosterView: React.FC<HrShiftRosterViewProps> = ({
  shifts,
  roster,
  employees,
  onUpdateRoster,
  showToast,
}) => {
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<string>('All');
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);

  const dates = [
    { date: '2026-09-01', day: 'Tue', isToday: true },
    { date: '2026-09-02', day: 'Wed', isToday: false },
    { date: '2026-09-03', day: 'Thu', isToday: false },
    { date: '2026-09-04', day: 'Fri', isToday: false },
    { date: '2026-09-05', day: 'Sat', isToday: false },
    { date: '2026-09-06', day: 'Sun', isToday: false },
    { date: '2026-09-07', day: 'Mon', isToday: false },
  ];

  // Group employees in roster
  const uniqueEmpIds = Array.from(new Set(roster.map((r) => r.employeeId)));

  const getShiftBadgeStyle = (code: string) => {
    switch (code) {
      case 'SHIFT-A':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SHIFT-B':
        return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'SHIFT-C':
        return 'bg-purple-100 text-purple-900 border-purple-200';
      case 'GEN':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'OFF':
        return 'bg-rose-50 text-rose-700 border-rose-200 font-bold';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const handlePublishRoster = () => {
    showToast('Weekly Shift Roster locked and published to biometric gates & mobile app.');
    setIsPublishModalOpen(false);
  };

  return (
    <div className="space-y-5 text-xs">
      {/* Top Header & Actions Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-base text-[#14213D] flex items-center gap-2">
              <span>Manufacturing Shift Management &amp; Machine Roster</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                September 2026 Active
              </span>
            </h2>
            <p className="text-slate-500">
              Rotational shift planner, machine line staffing coverage, certified operator validation, and shift swapping.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsSwapModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold border border-slate-200 transition cursor-pointer"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Shift Swap Request</span>
          </button>
          <button
            onClick={() => showToast('Previous week shift pattern copied.')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold border border-slate-200 transition cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Previous Week</span>
          </button>
          <button
            onClick={() => setIsPublishModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#14213D] hover:bg-[#1C2B4D] text-white rounded-lg font-bold shadow-xs transition cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-[#E8622C]" />
            <span>Publish &amp; Lock Roster</span>
          </button>
        </div>
      </div>

      {/* Shift Master Legend Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {shifts.map((s) => (
          <div key={s.code} className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getShiftBadgeStyle(s.code)}`}>
                {s.code}
              </span>
              {s.nightShiftAllowance && (
                <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                  Night Allowance +₹{s.shiftAllowanceAmount}
                </span>
              )}
            </div>
            <div className="font-bold text-[#14213D] text-xs mt-1">{s.name}</div>
            <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{s.startTime} - {s.endTime} ({s.gracePeriodMins}m Grace)</span>
            </div>
          </div>
        ))}
      </div>

      {/* Roster Calendar Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-3 p-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-[#14213D]">Weekly Operator Assignment Schedule</h3>
            <span className="text-slate-400">· 01 Sep 2026 - 07 Sep 2026</span>
          </div>

          <div className="flex items-center gap-1">
            <button className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 cursor-pointer">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-bold text-slate-700 font-mono">Week 36 (Current)</span>
            <button className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 cursor-pointer">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3 min-w-[200px]">Operator / Line Focus</th>
                {dates.map((d) => (
                  <th key={d.date} className={`p-3 text-center min-w-[110px] ${d.isToday ? 'bg-indigo-50/70 text-indigo-900 font-bold' : ''}`}>
                    <div>{d.day}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{d.date.slice(5)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {uniqueEmpIds.map((empId) => {
                const empRoster = roster.filter((r) => r.employeeId === empId);
                const first = empRoster[0];
                return (
                  <tr key={empId} className="hover:bg-slate-50/70">
                    <td className="p-3">
                      <div className="font-bold text-[#14213D]">{first?.employeeName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{empId} · {first?.department}</div>
                      {first?.lineOrMachine && (
                        <div className="text-[10px] text-[#0F8B8D] font-semibold">{first.lineOrMachine}</div>
                      )}
                    </td>

                    {dates.map((d) => {
                      const cell = empRoster.find((r) => r.date === d.date);
                      const shiftCode = cell?.shiftCode || 'SHIFT-A';
                      return (
                        <td key={d.date} className={`p-2 text-center ${d.isToday ? 'bg-indigo-50/30' : ''}`}>
                          <div className={`p-2 rounded-lg border text-center font-bold text-[10px] shadow-2xs ${getShiftBadgeStyle(shiftCode)}`}>
                            <div>{shiftCode}</div>
                            {cell?.isWeeklyOff ? (
                              <div className="text-[9px] text-rose-600">Weekly Off</div>
                            ) : (
                              <div className="text-[9px] text-slate-500 font-normal">Confirmed</div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shift Swapping Modal */}
      {isSwapModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-[#14213D] flex items-center gap-2">
              <Shuffle className="w-4 h-4 text-indigo-600" />
              <span>Shift Swap Request</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Requesting Operator</label>
                <select className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <option>EMP-1001 (Suresh Patil - Shift A)</option>
                  <option>EMP-1002 (Amit Deshmukh - Shift B)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Swap With Operator</label>
                <select className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <option>EMP-1002 (Amit Deshmukh - Shift B)</option>
                  <option>EMP-1001 (Suresh Patil - Shift A)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Effective Date</label>
                <input type="date" defaultValue="2026-09-03" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsSwapModalOpen(false)}
                className="px-3.5 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  showToast('Shift swap request approved and updated in biometric roster.');
                  setIsSwapModalOpen(false);
                }}
                className="px-4 py-2 bg-[#14213D] text-white rounded-lg font-bold hover:bg-[#1C2B4D] transition cursor-pointer"
              >
                Confirm Swap
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish Modal */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-[#14213D] flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#E8622C]" />
              <span>Publish &amp; Broadcast Roster</span>
            </h3>
            <p className="text-slate-600">
              Publishing will lock this weekly schedule, synchronize shift timing rules with the 4 Biometric Turnstiles, and broadcast SMS / App push notifications to 58 operators.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsPublishModalOpen(false)}
                className="px-3.5 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handlePublishRoster}
                className="px-4 py-2 bg-[#E8622C] text-white rounded-lg font-bold hover:bg-[#d55320] transition cursor-pointer"
              >
                Publish Roster
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
