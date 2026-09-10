import React, { useState } from 'react';
import {
  Users,
  UserCheck,
  Clock,
  Calendar,
  AlertTriangle,
  Award,
  ShieldCheck,
  FileSpreadsheet,
  TrendingUp,
  Plus,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileText,
  DollarSign,
  Briefcase,
  Layers,
  Wrench,
  Radio,
  Download,
  Search,
} from 'lucide-react';
import {
  HrEmployee,
  HrAttendanceRecord,
  HrLeaveRequest,
  HrOvertimeRequest,
  HrSafetyIncident,
  HrPpeIssueRecord,
} from '../../types';

interface HrCommandCenterProps {
  employees: HrEmployee[];
  attendance: HrAttendanceRecord[];
  leaves: HrLeaveRequest[];
  overtime: HrOvertimeRequest[];
  incidents: HrSafetyIncident[];
  ppeIssues: HrPpeIssueRecord[];
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const HrCommandCenter: React.FC<HrCommandCenterProps> = ({
  employees,
  attendance,
  leaves,
  overtime,
  incidents,
  ppeIssues,
  onNavigate,
  showToast,
}) => {
  const [activeShiftFilter, setActiveShiftFilter] = useState<'All' | 'Shift A' | 'Shift B' | 'General Shift'>('All');

  // KPI Calculations
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e) => e.status === 'Active' || e.status === 'Probation').length;
  const contractWorkers = employees.filter((e) => e.employeeType === 'Contract').length;
  const presentToday = attendance.filter((a) => a.status === 'Present').length;
  const absentToday = attendance.filter((a) => a.status === 'Absent').length;
  const onLeaveToday = attendance.filter((a) => a.status === 'On Leave').length;
  const lateCheckins = attendance.filter((a) => a.lateMinutes > 0).length;
  const totalOtHoursToday = overtime.reduce((sum, o) => sum + (o.status === 'Approved' ? o.hours : 0), 0);
  const pendingOtRequests = overtime.filter((o) => o.status === 'Pending Approval').length;
  const pendingLeaves = leaves.filter((l) => l.status === 'Pending Approval').length;
  const openIncidents = incidents.filter((i) => i.status !== 'Closed').length;
  const ppeDueCount = ppeIssues.filter((p) => p.status === 'Replacement Due').length;

  // Expiring certifications count (within next 60 days)
  const expiringCertsCount = employees.reduce((acc, emp) => {
    return acc + emp.certifications.filter((c) => c.status === 'Expiring Soon').length;
  }, 0);

  // Overdue trainings count
  const overdueTrainingCount = employees.reduce((acc, emp) => {
    return acc + emp.assignedTrainings.filter((t) => t.status === 'Overdue').length;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Live Manufacturing Shift & Plant Alert Banner */}
      <div className="bg-gradient-to-r from-[#14213D] to-[#1C2B4D] text-white p-5 rounded-2xl shadow-sm border border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E8622C] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#E8622C]"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#E8622C]">
              Manufacturing Workforce Operations · Plant 01
            </span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Plastic Factory HR Command Center
          </h2>
          <p className="text-xs text-slate-300">
            Shift A active · 6 Injection Molding Lines, 2 Extrusion Lines, Tool Room, and Central MEP utilities staffed.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('hrEmployees', { openAddModal: true })}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#E8622C] text-white rounded-lg text-xs font-bold hover:bg-[#d55320] transition shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Employee</span>
          </button>
          <button
            onClick={() => onNavigate('hrRoster')}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/10 text-white rounded-lg text-xs font-bold hover:bg-white/20 transition border border-white/20 cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-300" />
            <span>Shift Roster</span>
          </button>
          <button
            onClick={() => onNavigate('hrLaborAlloc')}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/10 text-white rounded-lg text-xs font-bold hover:bg-white/20 transition border border-white/20 cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-emerald-300" />
            <span>Line Allocation</span>
          </button>
          <button
            onClick={() => onNavigate('hrSafety')}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-900/40 text-rose-200 border border-rose-700/50 rounded-lg text-xs font-bold hover:bg-rose-900/60 transition cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Report Incident</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid (16 Key Operational Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div
          onClick={() => onNavigate('hrEmployees')}
          className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs hover:border-[#0F8B8D] cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-[11px] font-bold">Total Staff</span>
            <Users className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-[#14213D] mt-1">{totalEmployees}</div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">{activeEmployees} Active</div>
        </div>

        <div
          onClick={() => onNavigate('hrEmployees', { filterType: 'Contract' })}
          className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs hover:border-[#0F8B8D] cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-[11px] font-bold">Contract</span>
            <Briefcase className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-amber-900 mt-1">{contractWorkers}</div>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5">Apex Manpower</div>
        </div>

        <div
          onClick={() => onNavigate('hrAttendance')}
          className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs hover:border-[#0F8B8D] cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-[11px] font-bold">Present Today</span>
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-700 mt-1">{presentToday}</div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">96.4% Coverage</div>
        </div>

        <div
          onClick={() => onNavigate('hrAttendance')}
          className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs hover:border-[#0F8B8D] cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-[11px] font-bold">Late / Missing</span>
            <Clock className="w-3.5 h-3.5 text-orange-600" />
          </div>
          <div className="text-xl font-bold text-orange-700 mt-1">{lateCheckins}</div>
          <div className="text-[10px] text-orange-600 font-medium mt-0.5">Exceptions flagged</div>
        </div>

        <div
          onClick={() => onNavigate('hrLeave')}
          className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs hover:border-[#0F8B8D] cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-[11px] font-bold">On Leave</span>
            <Calendar className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="text-xl font-bold text-purple-900 mt-1">{onLeaveToday}</div>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5">{pendingLeaves} Pending Req</div>
        </div>

        <div
          onClick={() => onNavigate('hrOvertime')}
          className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs hover:border-[#0F8B8D] cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-[11px] font-bold">OT Hours Today</span>
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-blue-900 mt-1">{totalOtHoursToday}h</div>
          <div className="text-[10px] text-blue-600 font-semibold mt-0.5">{pendingOtRequests} Pending</div>
        </div>

        <div
          onClick={() => onNavigate('hrTraining')}
          className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs hover:border-[#0F8B8D] cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-[11px] font-bold">Certs / Training</span>
            <Award className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-amber-900 mt-1">{expiringCertsCount}</div>
          <div className="text-[10px] text-rose-600 font-semibold mt-0.5">{overdueTrainingCount} Overdue</div>
        </div>

        <div
          onClick={() => onNavigate('hrSafety')}
          className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs hover:border-[#0F8B8D] cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-[11px] font-bold">Safety / EHS</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-[#14213D] mt-1">{openIncidents}</div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">0 Lost Time (LTI)</div>
        </div>
      </div>

      {/* Second Row: Live Shift Coverage & Urgent Action Required */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Machine Operator Line Coverage Matrix */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#0F8B8D]" />
              <h3 className="font-bold text-sm text-[#14213D]">Production Shift Coverage</h3>
            </div>
            <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-200">
              Shift A · 06:00-14:00
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-[#14213D]">Injection Molding (IMM-01 to IMM-06)</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  12 Operators Required · 11 Assigned · 1 Shortage (IMM-02)
                </div>
              </div>
              <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded">
                91% Staffed
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-[#14213D]">Medical Tube Extrusion (EXT-01 &amp; EXT-02)</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  4 Technicians Required · 4 Certified Assigned
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded">
                100% Full
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-[#14213D]">Tool Room &amp; Mold Maintenance Bay</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  2 Mold Setters Required · 2 Certified EOT Crane Operators
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded">
                100% Full
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-[#14213D]">Warehouse Resin Staging &amp; Forklifts</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  3 Drivers · Santosh Yadav arrived 22m late (Approved)
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded">
                Normal
              </span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('hrLaborAlloc')}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <span>Open Real-Time Workforce Line Allocation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Operational Alerts & Compliance Ticker */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#E8622C]" />
              <h3 className="font-bold text-sm text-[#14213D]">Action Required &amp; Alerts</h3>
            </div>
            <span className="text-xs bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded border border-rose-200">
              4 Action Items
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div
              onClick={() => onNavigate('hrSafety')}
              className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 cursor-pointer hover:bg-rose-100/70 transition"
            >
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-rose-900">Safety Incident INC-2026-0012</div>
                <p className="text-rose-700 text-[11px] mt-0.5">
                  Minor purge burn on IMM-04. 5-Why RCA completed, CAPA-2026-0044 awaiting closure.
                </p>
              </div>
            </div>

            <div
              onClick={() => onNavigate('hrOvertime')}
              className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 cursor-pointer hover:bg-amber-100/70 transition"
            >
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-amber-900">Overtime Approval Pending</div>
                <p className="text-amber-800 text-[11px] mt-0.5">
                  Ganesh More requested 2h pre-shift OT for 11kV APFC Capacitor Bank 4 maintenance.
                </p>
              </div>
            </div>

            <div
              onClick={() => onNavigate('hrTraining')}
              className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2.5 cursor-pointer hover:bg-blue-100/70 transition"
            >
              <Award className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-blue-900">3 Certifications Expiring &lt;30 Days</div>
                <p className="text-blue-800 text-[11px] mt-0.5">
                  Suresh Patil (IMM Master), Santosh Yadav (Forklift License), Pooja Kulkarni (ISO 9001).
                </p>
              </div>
            </div>

            <div
              onClick={() => onNavigate('hrPpe')}
              className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-2.5 cursor-pointer hover:bg-slate-100 transition"
            >
              <ShieldCheck className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-800">PPE Replacement Due (2 Items)</div>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  Dielectric 11kV Gloves (G. More) and ESD Lab Coat (P. Kulkarni) due for renewal.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Functional Modules Grid */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#14213D]">HR Operations Navigation</h3>
            <span className="text-xs text-slate-500 font-mono">20 Modules</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => onNavigate('hrOrg')}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left font-semibold text-slate-800 flex items-center gap-2 transition cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Org Structure</span>
            </button>
            <button
              onClick={() => onNavigate('hrEmployees')}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left font-semibold text-slate-800 flex items-center gap-2 transition cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Employee Master</span>
            </button>
            <button
              onClick={() => onNavigate('hrOnboarding')}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left font-semibold text-slate-800 flex items-center gap-2 transition cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Onboarding/Exit</span>
            </button>
            <button
              onClick={() => onNavigate('hrAttendance')}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left font-semibold text-slate-800 flex items-center gap-2 transition cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-cyan-600" />
              <span>Biometric Daily</span>
            </button>
            <button
              onClick={() => onNavigate('hrSkillMatrix')}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left font-semibold text-slate-800 flex items-center gap-2 transition cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5 text-amber-600" />
              <span>Skill Matrix</span>
            </button>
            <button
              onClick={() => onNavigate('hrPayroll')}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left font-semibold text-slate-800 flex items-center gap-2 transition cursor-pointer"
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>Payroll Inputs</span>
            </button>
            <button
              onClick={() => onNavigate('hrCompliance')}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left font-semibold text-slate-800 flex items-center gap-2 transition cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-teal-600" />
              <span>Labor Law Docs</span>
            </button>
            <button
              onClick={() => onNavigate('hrReports')}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left font-semibold text-slate-800 flex items-center gap-2 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-purple-600" />
              <span>HR Reports Hub</span>
            </button>
            <button
              onClick={() => onNavigate('hrEss')}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left font-semibold text-slate-800 flex items-center gap-2 transition cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-pink-600" />
              <span>Self-Service (ESS)</span>
            </button>
            <button
              onClick={() => onNavigate('hrRbac')}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left font-semibold text-slate-800 flex items-center gap-2 transition cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
              <span>RBAC &amp; Audit</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Month-to-Date Labor Cost:</span>
            <span className="font-bold font-mono text-[#14213D]">₹18,42,500</span>
          </div>
        </div>
      </div>

      {/* Headcount Distribution Table & Recent Biometric Punches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Headcount Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#14213D]">Headcount by Department &amp; Plant Area</h3>
            <span className="text-xs font-semibold text-slate-500">Plant 01 Main Plastics</span>
          </div>

          <div className="space-y-2">
            {[
              { name: 'Injection Molding Division', count: 28, pct: 48, cost: '₹11.2L / mo', color: 'bg-[#0F8B8D]' },
              { name: 'Extrusion & Profiles', count: 16, pct: 28, cost: '₹6.8L / mo', color: 'bg-blue-600' },
              { name: 'Quality Assurance & QC', count: 14, pct: 24, cost: '₹5.4L / mo', color: 'bg-emerald-600' },
              { name: 'Tool Room & Mold Maint', count: 8, pct: 14, cost: '₹3.9L / mo', color: 'bg-amber-500' },
              { name: 'Warehouse & Logistics', count: 16, pct: 28, cost: '₹4.2L / mo', color: 'bg-purple-600' },
              { name: 'Plant MEP & Facilities', count: 12, pct: 21, cost: '₹5.1L / mo', color: 'bg-indigo-600' },
            ].map((dept, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-800">{dept.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">{dept.cost}</span>
                    <span className="font-bold text-[#14213D] w-12 text-right">{dept.count} staff</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${dept.color} rounded-full`} style={{ width: `${dept.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Biometric Clock-in Terminal Log */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
              <h3 className="font-bold text-sm text-[#14213D]">Live Biometric Gateways Stream</h3>
            </div>
            <span className="text-xs font-mono text-slate-500">Sync: 100% OK</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Time</th>
                  <th className="p-2.5">Staff</th>
                  <th className="p-2.5">Shift</th>
                  <th className="p-2.5">Gateway</th>
                  <th className="p-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {attendance.slice(0, 5).map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/70">
                    <td className="p-2.5 font-mono font-bold text-[#14213D]">{att.checkIn}</td>
                    <td className="p-2.5">
                      <div className="font-semibold text-slate-900">{att.employeeName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{att.employeeId}</div>
                    </td>
                    <td className="p-2.5 text-[11px]">{att.shift.split(' ')[0]}</td>
                    <td className="p-2.5 text-[11px] text-slate-500">{att.deviceSource}</td>
                    <td className="p-2.5 text-right">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          att.status === 'Present'
                            ? 'bg-emerald-100 text-emerald-800'
                            : att.status === 'Late'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {att.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={() => onNavigate('hrAttendance')}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <span>View Full Biometric Attendance Sheet</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
