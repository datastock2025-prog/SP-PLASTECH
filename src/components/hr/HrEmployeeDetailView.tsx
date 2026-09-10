import React, { useState } from 'react';
import {
  ArrowLeft,
  User,
  Briefcase,
  Clock,
  Calendar,
  Award,
  ShieldCheck,
  FileSpreadsheet,
  FileText,
  Activity,
  Phone,
  Mail,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Download,
  Edit,
  Sliders,
  DollarSign,
  Layers,
  Wrench,
} from 'lucide-react';
import {
  HrEmployee,
  HrAttendanceRecord,
  HrLeaveRequest,
  HrOvertimeRequest,
  HrSafetyIncident,
  HrPpeIssueRecord,
} from '../../types';

interface HrEmployeeDetailViewProps {
  employee: HrEmployee;
  attendanceHistory: HrAttendanceRecord[];
  leaves: HrLeaveRequest[];
  overtime: HrOvertimeRequest[];
  incidents: HrSafetyIncident[];
  ppeIssues: HrPpeIssueRecord[];
  onBack: () => void;
  showToast: (msg: string) => void;
}

export const HrEmployeeDetailView: React.FC<HrEmployeeDetailViewProps> = ({
  employee,
  attendanceHistory,
  leaves,
  overtime,
  incidents,
  ppeIssues,
  onBack,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'personal'
    | 'employment'
    | 'attendance'
    | 'shift'
    | 'leave'
    | 'skills'
    | 'training'
    | 'certifications'
    | 'safety'
    | 'ppe'
    | 'payroll'
    | 'documents'
    | 'activity'
  >('overview');

  const [showSensitiveData, setShowSensitiveData] = useState(false);

  // Safe fallbacks in case of partial records
  const emp = employee || {
    id: 'EMP-0000',
    firstName: 'Unknown',
    lastName: 'Employee',
    gender: 'Male',
    dob: '1990-01-01',
    bloodGroup: 'O+',
    department: 'General',
    designation: 'Staff',
    employeeType: 'Permanent',
    status: 'Active',
    plant: 'Main Plant',
    shift: 'General Shift',
    supervisor: 'Manager',
    mobile: '+91 00000 00000',
    email: 'staff@plasticserp.internal',
    nationalIdMasked: 'XXXX-XXXX-0000',
    bankAccountMasked: 'BANK-XXXXXX0000',
    emergencyContact: { name: 'Emergency Contact', relationship: 'Relative', phone: '+91 00000 00000' },
    address: 'Factory Quarters',
    joiningDate: '2025-01-01',
    noticePeriodDays: 30,
    grade: 'G-01',
    costCenter: 'CC-1000',
    skills: [],
    certifications: [],
    assignedTrainings: [],
    issuedPpe: [],
    leaveBalances: { casual: 6, sick: 6, earned: 12, compOff: 0 },
  };

  const empLeaves = leaves.filter((l) => l.employeeId === emp.id);
  const empOvertime = overtime.filter((o) => o.employeeId === emp.id);
  const empIncidents = incidents.filter((i) => i.employeeId === emp.id);
  const empPpe = (emp.issuedPpe && emp.issuedPpe.length > 0)
    ? emp.issuedPpe
    : ppeIssues.filter((p) => p.employeeId === emp.id).map(p => ({
        issueId: p.id,
        ppeName: p.ppeName,
        size: p.size,
        issueDate: p.issueDate,
        replacementDueDate: p.replacementDueDate,
        status: p.status as any,
      }));
  const empAttendance = attendanceHistory.filter((a) => a.employeeId === emp.id);

  const casualBal = emp.leaveBalances?.casual ?? 0;
  const sickBal = emp.leaveBalances?.sick ?? 0;
  const earnedBal = emp.leaveBalances?.earned ?? 0;
  const compOffBal = emp.leaveBalances?.compOff ?? 0;
  const totalLeaveBal = casualBal + sickBal + earnedBal + compOffBal;

  const tabs = [
    { id: 'overview', label: '360 Overview' },
    { id: 'personal', label: 'Personal & KYC' },
    { id: 'employment', label: 'Employment Terms' },
    { id: 'attendance', label: 'Attendance & Punches' },
    { id: 'shift', label: 'Shift Roster' },
    { id: 'leave', label: 'Leave Balances' },
    { id: 'skills', label: 'Skill Matrix' },
    { id: 'training', label: 'Training SOPs' },
    { id: 'certifications', label: 'Licenses & Certs' },
    { id: 'safety', label: 'EHS & Safety' },
    { id: 'ppe', label: 'Issued PPE' },
    { id: 'payroll', label: 'Payroll Inputs' },
    { id: 'documents', label: 'Docs Vault' },
    { id: 'activity', label: 'Audit Trail' },
  ];

  return (
    <div className="space-y-5">
      {/* Top Navigation & Actions Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 transition cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Employee List</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast(`Printed Employee 360 Dossier for ${emp.firstName} ${emp.lastName}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 transition cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download 360 Dossier</span>
          </button>
          <button
            onClick={() => showToast(`Edit profile opened for ${emp.id}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#14213D] hover:bg-[#1C2B4D] text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#14213D] to-[#0F8B8D] text-white flex items-center justify-center font-bold text-xl uppercase shadow-md">
            {(emp.firstName?.[0] || 'U')}
            {(emp.lastName?.[0] || 'E')}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#14213D]">
                {emp.firstName} {emp.lastName}
              </h2>
              <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded">
                {emp.id}
              </span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded">
                {emp.status}
              </span>
            </div>

            <div className="text-xs text-slate-600 flex flex-wrap items-center gap-3">
              <span className="font-semibold text-slate-900">{emp.designation}</span>
              <span>•</span>
              <span>{emp.department}</span>
              <span>•</span>
              <span className="text-[#0F8B8D] font-bold">{emp.shift}</span>
            </div>

            <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-3 pt-0.5">
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                {emp.mobile}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-400" />
                {emp.email}
              </span>
              <span>•</span>
              <span>Supervisor: <strong className="text-slate-700">{emp.supervisor}</strong></span>
            </div>
          </div>
        </div>

        {/* Quick KPI Stat pills */}
        <div className="flex flex-wrap md:flex-nowrap items-center gap-3 text-xs">
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center min-w-[90px]">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Leave Bal</span>
            <div className="text-sm font-bold text-[#14213D] mt-0.5">
              {totalLeaveBal} Days
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center min-w-[90px]">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Skills Matrix</span>
            <div className="text-sm font-bold text-[#0F8B8D] mt-0.5">
              {emp.skills?.length || 0} Certified
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center min-w-[90px]">
            <span className="text-[10px] text-slate-400 font-bold uppercase">PPE Issued</span>
            <div className="text-sm font-bold text-indigo-700 mt-0.5">
              {empPpe.length} Items
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-xs flex items-center gap-1 overflow-x-auto text-xs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#14213D] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content Panels */}
      {/* 1. Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 text-xs">
          <div className="lg:col-span-2 space-y-4">
            {/* Operator Qualifications & Skill Matrix Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-[#14213D] flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#0F8B8D]" />
                  <span>Certified Machine &amp; Process Qualifications</span>
                </h3>
                <span className="text-[11px] font-semibold text-slate-500">ISO 9001 / IATF Compliant</span>
              </div>

              <div className="space-y-2">
                {(emp.skills && emp.skills.length > 0) ? (
                  emp.skills.map((sk) => (
                    <div key={sk.skillId} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">{sk.skillName}</div>
                        <div className="text-[11px] text-slate-500">Assessed by: {sk.assessor} · Valid till {sk.validUntil}</div>
                      </div>
                      <span className="px-2 py-1 rounded bg-[#0F8B8D]/10 text-[#0F8B8D] font-bold text-[10px]">
                        {sk.level}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-slate-400 text-center">No specialized skill evaluations recorded.</div>
                )}
              </div>
            </div>

            {/* Recent Biometric Attendance Punches */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-bold text-sm text-[#14213D] flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Recent Attendance &amp; Shift Logs</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Shift</th>
                      <th className="p-2.5">Check-In</th>
                      <th className="p-2.5">Check-Out</th>
                      <th className="p-2.5">Hours</th>
                      <th className="p-2.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {empAttendance.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-slate-400">No recent punch logs found.</td>
                      </tr>
                    ) : (
                      empAttendance.map((att) => (
                        <tr key={att.id}>
                          <td className="p-2.5 font-medium">{att.date}</td>
                          <td className="p-2.5">{att.shift}</td>
                          <td className="p-2.5 font-mono">{att.checkIn}</td>
                          <td className="p-2.5 font-mono">{att.checkOut}</td>
                          <td className="p-2.5 font-mono">{att.totalHours}h</td>
                          <td className="p-2.5 text-right">
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                              {att.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Issued PPE & Certifications summary */}
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-bold text-sm text-[#14213D] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Issued PPE &amp; Expiry</span>
              </h3>
              <div className="space-y-2">
                {empPpe.map((ppe) => (
                  <div key={ppe.issueId} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span>{ppe.ppeName}</span>
                      <span className="text-[10px] font-mono text-slate-500">{ppe.size}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Due: {ppe.replacementDueDate}</span>
                      <span className={`font-bold ${ppe.status === 'Replacement Due' ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {ppe.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-bold text-sm text-[#14213D] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                <span>Leave Entitlement</span>
              </h3>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                  <div className="text-[10px] text-slate-400">Casual Leave</div>
                  <div className="text-base font-bold text-[#14213D]">{casualBal} Days</div>
                </div>
                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                  <div className="text-[10px] text-slate-400">Sick Leave</div>
                  <div className="text-base font-bold text-[#14213D]">{sickBal} Days</div>
                </div>
                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                  <div className="text-[10px] text-slate-400">Earned (Privilege)</div>
                  <div className="text-base font-bold text-[#14213D]">{earnedBal} Days</div>
                </div>
                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                  <div className="text-[10px] text-slate-400">Compensatory Off</div>
                  <div className="text-base font-bold text-[#14213D]">{compOffBal} Days</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Personal & KYC Tab (with Privacy Masking) */}
      {activeTab === 'personal' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-[#14213D]">Personal Information &amp; Statutory KYC</h3>
              <p className="text-slate-500 text-[11px]">Field-level privacy controls enabled for sensitive identifiers.</p>
            </div>

            <button
              onClick={() => {
                setShowSensitiveData(!showSensitiveData);
                showToast(showSensitiveData ? 'Sensitive data masked.' : 'Sensitive data unmasked (Logged in Audit).');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold transition cursor-pointer"
            >
              {showSensitiveData ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showSensitiveData ? 'Mask Sensitive Data' : 'Unmask Bank & National ID'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 font-semibold">Date of Birth / Age</span>
              <div className="font-bold text-[#14213D] text-sm mt-0.5">{emp.dob}</div>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 font-semibold">Gender</span>
              <div className="font-bold text-[#14213D] text-sm mt-0.5">{emp.gender}</div>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 font-semibold">Blood Group</span>
              <div className="font-bold text-rose-700 text-sm mt-0.5">{emp.bloodGroup}</div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 font-semibold">National ID (Aadhaar/SSN)</span>
              <div className="font-bold text-indigo-700 text-sm font-mono mt-0.5">
                {showSensitiveData ? '8842-9901-4819' : emp.nationalIdMasked}
              </div>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 font-semibold">Bank Salary Account</span>
              <div className="font-bold text-indigo-700 text-sm font-mono mt-0.5">
                {showSensitiveData ? 'HDFC000104 - 501004481921' : emp.bankAccountMasked}
              </div>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 font-semibold">Emergency Contact</span>
              <div className="font-bold text-[#14213D] text-sm mt-0.5">
                {emp.emergencyContact?.name || 'Primary Contact'} ({emp.emergencyContact?.relationship || 'Relative'})
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">{emp.emergencyContact?.phone || '+91 98000 00000'}</div>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="text-slate-500 font-semibold">Residential Address</span>
            <div className="font-medium text-slate-800">{emp.address}</div>
          </div>

          {emp.medicalNotes && (
            <div className="p-3.5 bg-amber-50 rounded-lg border border-amber-200 space-y-1">
              <span className="text-amber-800 font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Restricted Medical Notes &amp; Occupational Health Clearance</span>
              </span>
              <div className="text-amber-900 text-xs">{emp.medicalNotes}</div>
            </div>
          )}
        </div>
      )}

      {/* 3. Employment Terms Tab */}
      {activeTab === 'employment' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5 text-xs">
          <h3 className="font-bold text-sm text-[#14213D]">Employment Agreement &amp; Contract Lifecycle</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500">Employee Type</span>
              <div className="font-bold text-[#14213D] text-sm mt-0.5">{emp.employeeType}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500">Date of Joining</span>
              <div className="font-bold text-[#14213D] text-sm mt-0.5">{emp.joiningDate}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500">Confirmation Date</span>
              <div className="font-bold text-[#14213D] text-sm mt-0.5">{emp.confirmationDate || 'Confirmed on Record'}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500">Notice Period</span>
              <div className="font-bold text-[#14213D] text-sm mt-0.5">{emp.noticePeriodDays} Days</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500">Designation Grade</span>
              <div className="font-bold text-indigo-700 text-sm mt-0.5">{emp.grade}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500">Cost Center</span>
              <div className="font-bold text-indigo-700 text-sm mt-0.5 font-mono">{emp.costCenter}</div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Attendance & Punches Tab */}
      {activeTab === 'attendance' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-[#14213D]">Biometric Punch Records &amp; Working Hours</h3>
              <p className="text-slate-500 text-[11px]">Direct logs from Turnstile Gateways with late-arrival and OT breakdown.</p>
            </div>
            <button
              onClick={() => showToast(`Exported punch history for ${emp.firstName} ${emp.lastName}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Punch Logs</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Shift Timing</th>
                  <th className="p-3">Punch In</th>
                  <th className="p-3">Punch Out</th>
                  <th className="p-3">Total Hours</th>
                  <th className="p-3">OT Hours</th>
                  <th className="p-3">Terminal Gateway</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {empAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-400">
                      No biometric attendance records found for this employee ID.
                    </td>
                  </tr>
                ) : (
                  empAttendance.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/70">
                      <td className="p-3 font-medium">{rec.date}</td>
                      <td className="p-3">{rec.shift}</td>
                      <td className="p-3 font-mono font-bold text-slate-900">{rec.checkIn}</td>
                      <td className="p-3 font-mono text-slate-700">{rec.checkOut}</td>
                      <td className="p-3 font-mono font-bold">{rec.totalHours}h</td>
                      <td className="p-3 font-mono text-blue-600 font-bold">
                        {rec.overtimeHours > 0 ? `+${rec.overtimeHours}h OT` : '-'}
                      </td>
                      <td className="p-3 text-slate-500">{rec.deviceSource}</td>
                      <td className="p-3 text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            rec.status === 'Present'
                              ? 'bg-emerald-100 text-emerald-800'
                              : rec.status === 'Late'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {rec.status} {rec.lateMinutes > 0 ? `(${rec.lateMinutes}m Late)` : ''}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Shift Roster Tab */}
      {activeTab === 'shift' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-[#14213D]">Shift Assignment &amp; Machine Line Allocation</h3>
              <p className="text-slate-500 text-[11px]">Primary shift schedule and machine assignment.</p>
            </div>
            <button
              onClick={() => showToast('Shift modification requested.')}
              className="px-3 py-1.5 bg-[#14213D] text-white rounded-lg font-bold hover:bg-[#1C2B4D] transition cursor-pointer"
            >
              Change Shift Assignment
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-200 space-y-1">
              <span className="text-blue-900 font-bold text-[10px] uppercase">Current Active Shift</span>
              <div className="text-base font-bold text-blue-950">{emp.shift}</div>
              <div className="text-[11px] text-blue-800">Rotation Cycle: Weekly Rotational</div>
            </div>

            <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-1">
              <span className="text-emerald-900 font-bold text-[10px] uppercase">Production Plant</span>
              <div className="text-base font-bold text-emerald-950">{emp.plant}</div>
              <div className="text-[11px] text-emerald-800">{emp.department}</div>
            </div>

            <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-200 space-y-1">
              <span className="text-indigo-900 font-bold text-[10px] uppercase">Line Supervisor</span>
              <div className="text-base font-bold text-indigo-950">{emp.supervisor}</div>
              <div className="text-[11px] text-indigo-800">Shift In-charge</div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Leave Balances Tab */}
      {activeTab === 'leave' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-[#14213D]">Leave Entitlements &amp; Request History</h3>
              <p className="text-slate-500 text-[11px]">Year 2026 statutory leaves under Factories Act.</p>
            </div>
            <button
              onClick={() => showToast('Leave request modal opened.')}
              className="px-3 py-1.5 bg-[#0F8B8D] text-white rounded-lg font-bold hover:bg-[#0c7072] transition cursor-pointer"
            >
              Apply Leave on Behalf
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-slate-400 font-bold text-[10px] uppercase">Casual Leave (CL)</span>
              <div className="text-xl font-bold text-[#14213D] mt-1">{casualBal} / 12</div>
              <div className="text-[10px] text-slate-500">Days Available</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-slate-400 font-bold text-[10px] uppercase">Sick Leave (SL)</span>
              <div className="text-xl font-bold text-[#14213D] mt-1">{sickBal} / 10</div>
              <div className="text-[10px] text-slate-500">Days Available</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-slate-400 font-bold text-[10px] uppercase">Earned / Privilege (PL)</span>
              <div className="text-xl font-bold text-[#14213D] mt-1">{earnedBal} / 15</div>
              <div className="text-[10px] text-slate-500">Days Available</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-slate-400 font-bold text-[10px] uppercase">Comp Off (CO)</span>
              <div className="text-xl font-bold text-[#14213D] mt-1">{compOffBal}</div>
              <div className="text-[10px] text-slate-500">Earned Against OT</div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-slate-800 text-xs">Recent Leave Applications</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Leave Type</th>
                    <th className="p-2.5">Period</th>
                    <th className="p-2.5">Days</th>
                    <th className="p-2.5">Reason</th>
                    <th className="p-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {empLeaves.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-400">No leave applications on record for this cycle.</td>
                    </tr>
                  ) : (
                    empLeaves.map((l) => (
                      <tr key={l.id}>
                        <td className="p-2.5 font-bold text-slate-900">{l.leaveType}</td>
                        <td className="p-2.5 font-mono">{l.startDate} to {l.endDate}</td>
                        <td className="p-2.5 font-bold">{l.days} Days</td>
                        <td className="p-2.5 text-slate-600">{l.reason}</td>
                        <td className="p-2.5 text-right">
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
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. Skills & Machine Matrix Tab */}
      {activeTab === 'skills' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#14213D]">Individual Operator Skill &amp; Machine Competency Matrix</h3>
            <button
              onClick={() => showToast('Skill Assessment evaluation modal opened.')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F8B8D] text-white rounded-lg font-bold text-xs cursor-pointer hover:bg-[#0c7072] transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record New Skill Assessment</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3">Skill / Process</th>
                  <th className="p-3">Proficiency Level</th>
                  <th className="p-3">Assessed By</th>
                  <th className="p-3">Valid Until</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(emp.skills && emp.skills.length > 0) ? (
                  emp.skills.map((sk) => (
                    <tr key={sk.skillId}>
                      <td className="p-3 font-bold text-[#14213D]">{sk.skillName}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-800 font-bold rounded">
                          {sk.level}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">{sk.assessor}</td>
                      <td className="p-3 font-mono">{sk.validUntil}</td>
                      <td className="p-3 text-right">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded">
                          Active Qualified
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-400">No skill assessments found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 8. Training SOPs Tab */}
      {activeTab === 'training' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#14213D]">Assigned Mandatory &amp; Technical Trainings</h3>
            <button
              onClick={() => showToast('Assign training dialog opened.')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#14213D] text-white rounded-lg font-bold text-xs cursor-pointer hover:bg-[#1C2B4D] transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Assign New Training SOP</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {(emp.assignedTrainings && emp.assignedTrainings.length > 0) ? (
              emp.assignedTrainings.map((tr) => (
                <div key={tr.trainingId} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                        {tr.trainingId}
                      </span>
                      <span className="font-bold text-slate-900">{tr.name}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Assigned: {tr.assignedDate} · Due: {tr.dueDate}
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded text-xs font-bold ${
                      tr.status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {tr.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-slate-400">All mandatory safety &amp; induction training modules up to date.</div>
            )}
          </div>
        </div>
      )}

      {/* 9. Licenses & Certifications Tab */}
      {activeTab === 'certifications' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#14213D]">Statutory Licenses &amp; OEM Machine Certifications</h3>
            <button
              onClick={() => showToast('Add certificate dialog opened.')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#14213D] text-white rounded-lg font-bold text-xs cursor-pointer hover:bg-[#1C2B4D] transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Certification</span>
            </button>
          </div>

          <div className="space-y-3">
            {(emp.certifications && emp.certifications.length > 0) ? (
              emp.certifications.map((cert) => (
                <div key={cert.certificateId} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-slate-900">{cert.name}</div>
                    <div className="text-[11px] text-slate-500">
                      Issuing Body: <strong>{cert.issuingAuthority}</strong> · License #: <span className="font-mono font-bold text-indigo-700">{cert.certificateNumber}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Issued: {cert.issueDate} · Valid Until: <strong>{cert.validUntil}</strong>
                    </div>
                  </div>
                  <button
                    onClick={() => showToast(`Downloading ${cert.name} PDF`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg font-bold text-slate-700 cursor-pointer shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-slate-400">No external OEM licenses attached to profile.</div>
            )}
          </div>
        </div>
      )}

      {/* 10. EHS & Safety Tab */}
      {activeTab === 'safety' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-sm text-[#14213D]">Safety Incidents, Near-Miss Logs &amp; CAPA</h3>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">Zero LTI Record</span>
          </div>

          <div className="space-y-3">
            {empIncidents.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <div className="font-bold text-slate-800">Clean EHS Safety Record</div>
                <p className="text-slate-500 text-xs">No near-miss or workplace safety violations logged for this worker.</p>
              </div>
            ) : (
              empIncidents.map((inc) => (
                <div key={inc.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-[10px] font-bold bg-rose-50 text-rose-800 px-2 py-0.5 rounded border border-rose-200">
                        {inc.id}
                      </span>
                      <h4 className="font-bold text-slate-900 mt-1">{inc.title}</h4>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px]">{inc.incidentType}</span>
                  </div>
                  <p className="text-slate-600 text-xs">{inc.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 11. Issued PPE Tab */}
      {activeTab === 'ppe' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#14213D]">Issued Personal Protective Equipment (PPE) Roster</h3>
            <button
              onClick={() => showToast(`PPE re-issuance initiated for ${emp.firstName} ${emp.lastName}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F8B8D] text-white rounded-lg font-bold text-xs cursor-pointer hover:bg-[#0c7072] transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Issue New PPE</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3">PPE Equipment Name</th>
                  <th className="p-3">Size Specification</th>
                  <th className="p-3">Date Issued</th>
                  <th className="p-3">Replacement Due</th>
                  <th className="p-3 text-right">Condition Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {empPpe.map((ppe) => (
                  <tr key={ppe.issueId}>
                    <td className="p-3 font-bold text-[#14213D]">{ppe.ppeName}</td>
                    <td className="p-3 font-mono font-bold text-slate-800">{ppe.size}</td>
                    <td className="p-3 font-mono">{ppe.issueDate}</td>
                    <td className="p-3 font-mono font-semibold text-indigo-700">{ppe.replacementDueDate}</td>
                    <td className="p-3 text-right">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ppe.status === 'Replacement Due'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {ppe.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 12. Payroll Inputs Tab */}
      {activeTab === 'payroll' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-[#14213D]">Salary Structure &amp; Statutory Wage Parameters</h3>
              <p className="text-slate-500 text-[11px]">Monthly wage breakdown under Minimum Wages &amp; Payment of Wages Act.</p>
            </div>
            <button
              onClick={() => showToast(`Generated salary breakdown sheet for ${emp.firstName} ${emp.lastName}`)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold transition cursor-pointer"
            >
              Export Salary Structure
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <div className="font-bold text-slate-900 border-b border-slate-200 pb-1">Earnings Component</div>
              <div className="flex justify-between">
                <span className="text-slate-500">Basic Pay + DA:</span>
                <span className="font-mono font-bold text-slate-800">₹18,500</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">House Rent Allowance (HRA):</span>
                <span className="font-mono text-slate-800">₹7,400</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Conveyance &amp; Special Allowance:</span>
                <span className="font-mono text-slate-800">₹2,600</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Overtime Rate Multiplier:</span>
                <span className="font-mono text-blue-700 font-bold">2.0x Statutory Rate</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 font-bold">
                <span>Monthly Gross CTC:</span>
                <span className="font-mono text-base text-[#14213D]">₹28,500</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <div className="font-bold text-slate-900 border-b border-slate-200 pb-1">Statutory Deductions &amp; Banking</div>
              <div className="flex justify-between">
                <span className="text-slate-500">Provident Fund (PF - 12%):</span>
                <span className="font-mono text-slate-800">₹2,220</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ESIC Worker Contribution (0.75%):</span>
                <span className="font-mono text-slate-800">₹214</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Professional Tax (PT):</span>
                <span className="font-mono text-slate-800">₹200</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bank Account:</span>
                <span className="font-mono font-bold text-indigo-700">{emp.bankAccountMasked}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-emerald-700">
                <span>Estimated Net Take Home:</span>
                <span className="font-mono text-base">₹25,866</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 13. Documents Vault Tab */}
      {activeTab === 'documents' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#14213D]">Employee Document Vault &amp; Certifications</h3>
            <button
              onClick={() => showToast('Document upload dialog triggered.')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#14213D] text-white rounded-lg font-bold text-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { name: 'Signed Employment Contract 2019.pdf', size: '2.4 MB', date: '2019-03-15', tag: 'Contract' },
              { name: 'Aadhaar Card Copy (Verified).pdf', size: '1.1 MB', date: '2019-03-15', tag: 'KYC' },
              { name: 'Injection Molding Master Certification.pdf', size: '3.8 MB', date: '2023-03-10', tag: 'Certificate' },
              { name: 'Annual Medical Audiometry & Fitness.pdf', size: '1.6 MB', date: '2026-02-10', tag: 'Medical' },
            ].map((doc, idx) => (
              <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <div>
                    <div className="font-bold text-slate-800">{doc.name}</div>
                    <div className="text-[10px] text-slate-400">{doc.size} · Uploaded {doc.date}</div>
                  </div>
                </div>
                <button
                  onClick={() => showToast(`Downloading ${doc.name}`)}
                  className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded text-slate-700 font-bold transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 14. Activity Audit Trail Tab */}
      {activeTab === 'activity' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-sm text-[#14213D]">Employee Lifecycle Audit &amp; Event Log</h3>
            <span className="text-slate-400 font-mono text-[10px]">Tamper-Proof Ledger</span>
          </div>

          <div className="space-y-3">
            {[
              { title: 'Biometric Gateway Turnstile Punch', time: 'Today 05:54 AM', user: 'Biometric Face-01 Gateway', desc: 'Valid shift entry punch confirmed at main shop floor turnstile.' },
              { title: 'Safety Training Refresh Completed', time: '14-Aug-2026', user: 'EHS Safety Officer', desc: 'Annual refresher on Molten Polymer Purging SOP signed off.' },
              { title: 'PPE Re-issuance Recorded', time: '01-Jul-2026', user: 'HR Store In-charge', desc: 'High-heat nitrile gloves issued against worn pair.' },
              { title: 'Annual Performance Appraisal & Grade Revision', time: '01-Apr-2026', user: 'Plant Operations Manager', desc: 'Promoted to Grade G-01 Senior Mold Technician.' },
              { title: 'Employment Confirmation', time: `${emp.joiningDate}`, user: 'HR System', desc: 'Successfully onboarded and KYC verified.' },
            ].map((ev, idx) => (
              <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-[#0F8B8D] mt-1.5 shrink-0" />
                <div className="space-y-0.5 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{ev.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{ev.time}</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">{ev.desc}</p>
                  <div className="text-[10px] text-slate-400">By: {ev.user}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

