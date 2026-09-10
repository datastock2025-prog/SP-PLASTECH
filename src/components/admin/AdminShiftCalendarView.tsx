import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Moon,
  Sun,
  Coffee,
  DollarSign,
  AlertTriangle,
  Building,
  CheckCircle2,
  CalendarCheck,
  Award,
} from 'lucide-react';
import {
  ShiftCalendarConfig,
  HolidayOvertimeRule,
  mockShifts,
  mockHolidays,
} from '../../data/mockAdminExtendedData';

interface AdminShiftCalendarViewProps {
  showToast?: (msg: string) => void;
}

export const AdminShiftCalendarView: React.FC<AdminShiftCalendarViewProps> = ({
  showToast = (_msg: string) => {},
}) => {
  const [shifts, setShifts] = useState<ShiftCalendarConfig[]>(mockShifts);
  const [holidays, setHolidays] = useState<HolidayOvertimeRule[]>(mockHolidays);
  const [activeTab, setActiveTab] = useState<'SHIFTS' | 'CALENDAR_HOLIDAYS' | 'OVERTIME_RULES'>('SHIFTS');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleToggleShiftStatus = (id: string) => {
    setShifts((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const next = s.status === 'Active' ? 'Suspended' : 'Active';
          showToast(`Shift ${s.shiftName} set to ${next}.`);
          return { ...s, status: next };
        }
        return s;
      })
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <Calendar className="w-4 h-4 text-[#0F8B8D]" />
            <span>Workforce Cadence &amp; Production Shifts</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Shift &amp; Working Calendar Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure 24x7 3-shift rotation cycles, night shift allowances, mold handover buffer windows, and statutory holiday overtime multipliers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast('Dispatched shift rosters to biometric turnstile clocks.')}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Sync Biometric Clocks
          </button>
          <button
            onClick={() => showToast('Opened new shift / holiday creation modal.')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0F8B8D] hover:bg-[#0c7274] rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Shift Rule
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('SHIFTS')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'SHIFTS' ? 'bg-[#0F8B8D] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Daily Shift Schedules ({shifts.length})
        </button>
        <button
          onClick={() => setActiveTab('CALENDAR_HOLIDAYS')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'CALENDAR_HOLIDAYS'
              ? 'bg-[#0F8B8D] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Plant Holidays &amp; Overhauls ({holidays.length})
        </button>
        <button
          onClick={() => setActiveTab('OVERTIME_RULES')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'OVERTIME_RULES'
              ? 'bg-[#0F8B8D] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Statutory Overtime Policies
        </button>
      </div>

      {/* Tab 1: Daily Shifts */}
      {activeTab === 'SHIFTS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shifts.map((sft) => (
            <div
              key={sft.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4 hover:border-slate-300 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      sft.isNightShift ? 'bg-indigo-900 text-indigo-200' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {sft.isNightShift ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  </div>
                  <div>
                    <span className="font-mono text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {sft.shiftCode}
                    </span>
                    <h3 className="font-bold text-xs text-slate-900 mt-0.5">{sft.shiftName}</h3>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleShiftStatus(sft.id)}
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition-colors ${
                    sft.status === 'Active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  {sft.status}
                </button>
              </div>

              {/* Timing Grid */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Timings</span>
                  <span className="font-mono font-bold text-slate-800">
                    {sft.startTime} – {sft.endTime}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Duration</span>
                  <span className="font-mono font-bold text-slate-800">{sft.durationHours} Hours</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Handover Buffer</span>
                  <span className="font-mono font-bold text-[#0F8B8D]">{sft.handoverBufferMinutes} Mins</span>
                </div>
              </div>

              {/* Perks / Break */}
              <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                <div className="flex items-center gap-1.5">
                  <Coffee className="w-3.5 h-3.5 text-slate-400" />
                  <span>Paid Meal &amp; Tea Break: {sft.paidBreakMinutes}m</span>
                </div>
                <div className="flex items-center gap-1 font-mono font-bold text-emerald-700">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                  <span>₹{sft.shiftAllowanceInr} Shift Allowance</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Active Plants: {sft.appliesToPlants.length} Facilities</span>
                <button
                  onClick={() => showToast(`Editing schedule parameters for ${sft.shiftCode}.`)}
                  className="text-[#0F8B8D] font-semibold hover:underline"
                >
                  Edit Parameters
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Plant Holidays & Overhauls */}
      {activeTab === 'CALENDAR_HOLIDAYS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="py-3 px-4">Event Title</th>
                <th className="py-3 px-4">Date / Period</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">OT Multiplier</th>
                <th className="py-3 px-4">Comp-Off</th>
                <th className="py-3 px-4">Affected Plants</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {holidays.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 font-bold text-slate-900">{h.title}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{h.dateOrRule}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {h.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-700">{h.otMultiplier}x Rate</td>
                  <td className="py-3 px-4">
                    {h.compOffEligible ? (
                      <span className="text-emerald-600 font-semibold">Eligible (60d)</span>
                    ) : (
                      <span className="text-slate-400">No</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{h.affectedPlants.join(', ')}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => showToast(`Adjusted holiday rule: ${h.title}`)}
                      className="text-xs font-semibold text-[#0F8B8D] hover:underline"
                    >
                      Configure
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Statutory Overtime Policies */}
      {activeTab === 'OVERTIME_RULES' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-[#0F8B8D]" />
            Factories Act 1948 &amp; Plastics Continuous Process Overtime Rules
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-800 block">Weekly 48-Hour Threshold</span>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Standard overtime calculated at 1.5x basic hourly wage after 48 completed shift hours per week.
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-800 block">Double Time on Sundays &amp; Gazetted Holidays</span>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                2.0x normal wage rate mandatory for emergency tool maintenance or injection shopfloor customer commitments.
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-800 block">Compensatory Off Window</span>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Operators working on designated weekly offs must be granted compensatory off within 60 calendar days.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
