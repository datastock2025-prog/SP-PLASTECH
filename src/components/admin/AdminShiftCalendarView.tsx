import React, { useState, useEffect } from 'react';
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
  Edit2,
  Trash2,
  X,
  Save,
  Check,
  RefreshCw,
  Sliders,
  ShieldCheck,
} from 'lucide-react';
import {
  ShiftCalendarConfig,
  HolidayOvertimeRule,
  mockShifts,
  mockHolidays,
} from '../../data/mockAdminExtendedData';
import { adminService } from '../../services/adminService';
import { PlantDetails } from '../../types/admin';
import { mockCompanyProfile } from '../../data/mockAdminData';

interface AdminShiftCalendarViewProps {
  showToast?: (msg: string) => void;
}

export const AdminShiftCalendarView: React.FC<AdminShiftCalendarViewProps> = ({
  showToast = (_msg: string) => {},
}) => {
  const [shifts, setShifts] = useState<ShiftCalendarConfig[]>(mockShifts);
  const [holidays, setHolidays] = useState<HolidayOvertimeRule[]>(mockHolidays);
  const [plants, setPlants] = useState<PlantDetails[]>(mockCompanyProfile.plants);
  const [activeTab, setActiveTab] = useState<'SHIFTS' | 'CALENDAR_HOLIDAYS' | 'OVERTIME_RULES'>('SHIFTS');
  const [isSyncingBiometrics, setIsSyncingBiometrics] = useState(false);

  // Shift Modal State
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [shiftForm, setShiftForm] = useState<Partial<ShiftCalendarConfig>>({
    shiftCode: 'SHIFT-D',
    shiftName: 'Shift D — General Maintenance (08:30 – 17:30)',
    startTime: '08:30',
    endTime: '17:30',
    durationHours: 8,
    handoverBufferMinutes: 15,
    paidBreakMinutes: 45,
    shiftAllowanceInr: 150,
    isNightShift: false,
    appliesToPlants: ['PLANT-01', 'PLANT-02'],
    status: 'Active',
  });

  // Holiday / Overhaul Modal State
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [editingHolidayId, setEditingHolidayId] = useState<string | null>(null);
  const [holidayForm, setHolidayForm] = useState<Partial<HolidayOvertimeRule & { compOffDaysLimit?: number }>>({
    title: '',
    dateOrRule: '',
    type: 'Gazetted Holiday',
    otMultiplier: 2.0,
    compOffEligible: true,
    compOffDaysLimit: 60,
    affectedPlants: ['Pune / Chakan Hub', 'Sanand Precision', 'Chennai Molding'],
  });

  // Load live plants
  useEffect(() => {
    adminService.getPlants().then((livePlants) => {
      if (livePlants && livePlants.length > 0) {
        setPlants(livePlants);
      }
    });
  }, []);

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

  const handleSyncBiometricClocks = () => {
    setIsSyncingBiometrics(true);
    setTimeout(() => {
      setIsSyncingBiometrics(false);
      showToast('Dispatched shift rosters and biometric credentials to 14 turnstile controllers.');
    }, 800);
  };

  // Open Shift Creator
  const handleOpenCreateShift = () => {
    setEditingShiftId(null);
    setShiftForm({
      shiftCode: `SHIFT-0${shifts.length + 1}`,
      shiftName: 'New Shift Schedule',
      startTime: '09:00',
      endTime: '18:00',
      durationHours: 8,
      handoverBufferMinutes: 15,
      paidBreakMinutes: 45,
      shiftAllowanceInr: 200,
      isNightShift: false,
      appliesToPlants: plants.map((p) => p.plantCode),
      status: 'Active',
    });
    setIsShiftModalOpen(true);
  };

  // Open Shift Editor
  const handleOpenEditShift = (sft: ShiftCalendarConfig) => {
    setEditingShiftId(sft.id);
    setShiftForm({ ...sft });
    setIsShiftModalOpen(true);
  };

  const handleSaveShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftForm.shiftCode || !shiftForm.shiftName) {
      showToast('Please provide shift code and name.');
      return;
    }

    if (editingShiftId) {
      const updated = { ...(shiftForm as ShiftCalendarConfig), id: editingShiftId };
      setShifts((prev) => prev.map((s) => (s.id === editingShiftId ? updated : s)));
      showToast(`Shift schedule parameters for ${updated.shiftCode} saved.`);
    } else {
      const newShift: ShiftCalendarConfig = {
        ...(shiftForm as ShiftCalendarConfig),
        id: `SFT-${Date.now().toString().slice(-4)}`,
      };
      setShifts((prev) => [...prev, newShift]);
      showToast(`New shift schedule ${newShift.shiftCode} activated.`);
    }
    setIsShiftModalOpen(false);
  };

  // Open Holiday Creator
  const handleOpenCreateHoliday = () => {
    setEditingHolidayId(null);
    setHolidayForm({
      title: '',
      dateOrRule: new Date().toISOString().split('T')[0],
      type: 'Gazetted Holiday',
      otMultiplier: 2.0,
      compOffEligible: true,
      compOffDaysLimit: 60,
      affectedPlants: ['Pune / Chakan Hub', 'Sanand Precision', 'Chennai Molding'],
    });
    setIsHolidayModalOpen(true);
  };

  // Open Holiday / Overhaul Configurator
  const handleOpenEditHoliday = (h: HolidayOvertimeRule) => {
    setEditingHolidayId(h.id);
    setHolidayForm({ ...h, compOffDaysLimit: 60 });
    setIsHolidayModalOpen(true);
  };

  const handleToggleCompOffInline = (hId: string) => {
    setHolidays((prev) =>
      prev.map((h) => {
        if (h.id === hId) {
          const next = !h.compOffEligible;
          showToast(`Comp-off eligibility for ${h.title} set to ${next ? 'Eligible (60d)' : 'Disabled'}.`);
          return { ...h, compOffEligible: next };
        }
        return h;
      })
    );
  };

  const handleSaveHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayForm.title || !holidayForm.dateOrRule) {
      showToast('Please provide event title and date.');
      return;
    }

    if (editingHolidayId) {
      const updated = { ...(holidayForm as HolidayOvertimeRule), id: editingHolidayId };
      setHolidays((prev) => prev.map((h) => (h.id === editingHolidayId ? updated : h)));
      showToast(`Holiday & overtime rule for "${updated.title}" updated.`);
    } else {
      const newH: HolidayOvertimeRule = {
        ...(holidayForm as HolidayOvertimeRule),
        id: `HOL-${Date.now().toString().slice(-4)}`,
      };
      setHolidays((prev) => [...prev, newH]);
      showToast(`New calendar holiday "${newH.title}" registered.`);
    }
    setIsHolidayModalOpen(false);
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
            onClick={handleSyncBiometricClocks}
            disabled={isSyncingBiometrics}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#0F8B8D] ${isSyncingBiometrics ? 'animate-spin' : ''}`} />
            {isSyncingBiometrics ? 'Syncing Clocks...' : 'Sync Biometric Clocks'}
          </button>
          <button
            onClick={activeTab === 'CALENDAR_HOLIDAYS' ? handleOpenCreateHoliday : handleOpenCreateShift}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0F8B8D] hover:bg-[#0c7274] rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            {activeTab === 'CALENDAR_HOLIDAYS' ? 'Add Holiday / Overhaul' : 'Add Shift Rule'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('SHIFTS')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'SHIFTS' ? 'bg-[#0F8B8D] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Daily Shift Schedules ({shifts.length})
        </button>
        <button
          onClick={() => setActiveTab('CALENDAR_HOLIDAYS')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'CALENDAR_HOLIDAYS'
              ? 'bg-[#0F8B8D] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Plant Holidays &amp; Overhauls ({holidays.length})
        </button>
        <button
          onClick={() => setActiveTab('OVERTIME_RULES')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
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
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition-colors cursor-pointer ${
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
                  onClick={() => handleOpenEditShift(sft)}
                  className="flex items-center gap-1 text-[#0F8B8D] font-semibold hover:underline cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
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
                <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{h.title}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{h.dateOrRule}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {h.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-700">{h.otMultiplier}x Rate</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleToggleCompOffInline(h.id)}
                      title="Click to toggle Comp-Off eligibility"
                      className="group flex items-center gap-1 cursor-pointer"
                    >
                      {h.compOffEligible ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 group-hover:bg-emerald-100 transition-colors">
                          Eligible (60d)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-400 group-hover:bg-slate-200 transition-colors">
                          Disabled
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{h.affectedPlants.join(', ')}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleOpenEditHoliday(h)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-[#0F8B8D] shadow-2xs transition-colors cursor-pointer ml-auto"
                    >
                      <Sliders className="w-3 h-3" />
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

      {/* ========================================================================= */}
      {/* SHIFT SCHEDULE CONFIGURATION MODAL */}
      {/* ========================================================================= */}
      {isShiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingShiftId ? `Edit Shift ${shiftForm.shiftCode}` : 'Create New Shift Schedule'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set work timings, mold handover allowances, and biometric plant bindings.
                </p>
              </div>
              <button
                onClick={() => setIsShiftModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveShift} className="p-6 space-y-4 overflow-y-auto text-xs flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Shift Code</label>
                  <input
                    type="text"
                    required
                    value={shiftForm.shiftCode || ''}
                    onChange={(e) => setShiftForm({ ...shiftForm, shiftCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. SHIFT-A"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Duration (Hours)</label>
                  <input
                    type="number"
                    min="4"
                    max="12"
                    value={shiftForm.durationHours || 8}
                    onChange={(e) => setShiftForm({ ...shiftForm, durationHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Shift Name &amp; Description</label>
                  <input
                    type="text"
                    required
                    value={shiftForm.shiftName || ''}
                    onChange={(e) => setShiftForm({ ...shiftForm, shiftName: e.target.value })}
                    placeholder="e.g. Shift A — Morning Injection Shift (06:00 – 14:00)"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Time (24h)</label>
                  <input
                    type="time"
                    required
                    value={shiftForm.startTime || '06:00'}
                    onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Time (24h)</label>
                  <input
                    type="time"
                    required
                    value={shiftForm.endTime || '14:00'}
                    onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Handover Buffer (Mins)</label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={shiftForm.handoverBufferMinutes || 15}
                    onChange={(e) => setShiftForm({ ...shiftForm, handoverBufferMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Paid Meal/Tea Break (Mins)</label>
                  <input
                    type="number"
                    min="0"
                    max="90"
                    value={shiftForm.paidBreakMinutes || 45}
                    onChange={(e) => setShiftForm({ ...shiftForm, paidBreakMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Shift Allowance (₹ / shift)</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={shiftForm.shiftAllowanceInr || 0}
                    onChange={(e) => setShiftForm({ ...shiftForm, shiftAllowanceInr: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-emerald-700 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Night Shift Policy</label>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="isNightShift"
                      checked={!!shiftForm.isNightShift}
                      onChange={(e) => setShiftForm({ ...shiftForm, isNightShift: e.target.checked })}
                      className="rounded border-slate-300 text-[#0F8B8D] focus:ring-[#0F8B8D]"
                    />
                    <label htmlFor="isNightShift" className="text-xs text-slate-700">
                      Night Shift (Rotational)
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsShiftModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#0F8B8D] hover:bg-[#0c7274] text-white font-semibold shadow-sm cursor-pointer"
                >
                  Save Shift Parameters
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* HOLIDAY & OVERTIME RULE CONFIGURATION MODAL */}
      {/* ========================================================================= */}
      {isHolidayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingHolidayId ? `Configure ${holidayForm.title}` : 'Add Plant Holiday / Overhaul'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set statutory holiday multipliers, comp-off windows, and affected plant branches.
                </p>
              </div>
              <button
                onClick={() => setIsHolidayModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHoliday} className="p-6 space-y-4 overflow-y-auto text-xs flex-1">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Event / Holiday Title</label>
                <input
                  type="text"
                  required
                  value={holidayForm.title || ''}
                  onChange={(e) => setHolidayForm({ ...holidayForm, title: e.target.value })}
                  placeholder="e.g. Diwali Laxmi Pujan (Plant Holiday)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date or Date Range</label>
                  <input
                    type="text"
                    required
                    value={holidayForm.dateOrRule || ''}
                    onChange={(e) => setHolidayForm({ ...holidayForm, dateOrRule: e.target.value })}
                    placeholder="e.g. 2026-11-08 or 2026-11-05 to 2026-11-07"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Holiday / Event Type</label>
                  <select
                    value={holidayForm.type}
                    onChange={(e) => setHolidayForm({ ...holidayForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Gazetted Holiday">Gazetted Holiday</option>
                    <option value="Restricted Holiday">Restricted Holiday</option>
                    <option value="Annual Plant Overhaul Shutdown">Annual Plant Overhaul Shutdown</option>
                    <option value="Weekly Off">Weekly Off</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Overtime Wage Multiplier</label>
                  <select
                    value={holidayForm.otMultiplier}
                    onChange={(e) => setHolidayForm({ ...holidayForm, otMultiplier: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono font-bold text-emerald-700"
                  >
                    <option value={1.5}>1.5x Normal Rate</option>
                    <option value={2.0}>2.0x Normal Rate (Double Time)</option>
                    <option value={2.5}>2.5x Normal Rate</option>
                    <option value={3.0}>3.0x Normal Rate (Triple Time)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Compensatory Off Policy</label>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="compOffEligible"
                      checked={!!holidayForm.compOffEligible}
                      onChange={(e) => setHolidayForm({ ...holidayForm, compOffEligible: e.target.checked })}
                      className="rounded border-slate-300 text-[#0F8B8D] focus:ring-[#0F8B8D]"
                    />
                    <label htmlFor="compOffEligible" className="text-xs text-slate-700">
                      Eligible for Comp-Off (60 Days Validity)
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Affected Manufacturing Plants</label>
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  {['Pune / Chakan Hub', 'Sanand Precision', 'Chennai Auto Molding', 'Hosur Extrusion Unit'].map((pName) => {
                    const isChecked = holidayForm.affectedPlants?.includes(pName);
                    return (
                      <label key={pName} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setHolidayForm({
                                ...holidayForm,
                                affectedPlants: [...(holidayForm.affectedPlants || []), pName],
                              });
                            } else {
                              setHolidayForm({
                                ...holidayForm,
                                affectedPlants: holidayForm.affectedPlants?.filter((p) => p !== pName),
                              });
                            }
                          }}
                          className="rounded border-slate-300 text-[#0F8B8D]"
                        />
                        <span className="text-xs text-slate-700">{pName}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsHolidayModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#0F8B8D] hover:bg-[#0c7274] text-white font-semibold shadow-sm cursor-pointer"
                >
                  Save Holiday Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
