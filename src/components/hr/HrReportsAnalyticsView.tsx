import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Download,
  Calendar,
  Layers,
  FileSpreadsheet,
  Printer,
  Sparkles,
  PieChart,
  Activity,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { HrEmployee, HrAttendanceRecord, HrDepartment } from '../../types';

interface HrReportsAnalyticsViewProps {
  employees: HrEmployee[];
  attendance: HrAttendanceRecord[];
  departments: HrDepartment[];
  showToast: (msg: string) => void;
}

export const HrReportsAnalyticsView: React.FC<HrReportsAnalyticsViewProps> = ({
  employees,
  attendance,
  departments,
  showToast,
}) => {
  const [reportRange, setReportRange] = useState('Month');

  // Headcount by dept
  const deptBreakdown = departments.map((d) => ({
    name: d.name,
    code: d.code,
    headcount: d.headcount,
    costCenter: d.costCenter,
    pct: ((d.headcount / 128) * 100).toFixed(1),
  }));

  // Operator grade breakdown
  const gradeBreakdown = [
    { grade: 'G-01 (Machine Operators & Tech)', count: 64, pct: '50.0%' },
    { grade: 'G-02 (Sr Operators & Specialists)', count: 32, pct: '25.0%' },
    { grade: 'G-03 (Shift Supervisors & Foremen)', count: 18, pct: '14.1%' },
    { grade: 'G-04 (Engineers & QA In-charge)', count: 10, pct: '7.8%' },
    { grade: 'M-01/M-02 (Plant Managers & HODs)', count: 4, pct: '3.1%' },
  ];

  return (
    <div className="space-y-5 text-xs">
      {/* Top Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-base text-[#14213D] flex items-center gap-2">
              <span>Workforce Analytics, Headcount &amp; MIS Reports</span>
            </h2>
            <p className="text-slate-500">
              Departmental staffing ratios, absenteeism trends, overtime costs, skill competency indexes, and labor turnover metrics.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={reportRange}
            onChange={(e) => setReportRange(e.target.value)}
            className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 text-xs cursor-pointer"
          >
            <option value="Month">Monthly MIS (Sep 2026)</option>
            <option value="Quarter">Q3 2026 Summary</option>
            <option value="YTD">YTD Financial Year 2026-27</option>
          </select>

          <button
            onClick={() => showToast('Full Workforce MIS Executive Pack exported to Excel.')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#14213D] hover:bg-[#1C2B4D] text-white rounded-lg font-bold transition cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Full MIS Pack</span>
          </button>
        </div>
      </div>

      {/* Top Executive Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-400 font-bold text-[10px] uppercase">Total Active Workforce</span>
          <div className="text-lg font-bold text-[#14213D] mt-0.5">128 Employees</div>
          <div className="text-[10px] text-emerald-700 font-semibold">+6 onboards this quarter</div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-400 font-bold text-[10px] uppercase">Average Plant Attendance</span>
          <div className="text-lg font-bold text-[#0F8B8D] mt-0.5">96.8%</div>
          <div className="text-[10px] text-slate-500">Absenteeism: 3.2% (Target &lt; 4%)</div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-400 font-bold text-[10px] uppercase">Labor Turnover Rate</span>
          <div className="text-lg font-bold text-emerald-700 mt-0.5">1.4% / Month</div>
          <div className="text-[10px] text-slate-500">Industry benchmark: 3.5%</div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-400 font-bold text-[10px] uppercase">Skill Competency Index</span>
          <div className="text-lg font-bold text-indigo-700 mt-0.5">92.4%</div>
          <div className="text-[10px] text-indigo-900 font-semibold">100% Machine Qualification</div>
        </div>
      </div>

      {/* Analytics Charts & Visuals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Department Headcount Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-sm text-[#14213D]">Departmental Headcount Distribution</h3>
            <span className="text-slate-400 font-mono">128 Total Staff</span>
          </div>

          <div className="space-y-3">
            {deptBreakdown.map((dept) => (
              <div key={dept.code} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{dept.name}</span>
                  <span className="font-mono font-bold text-slate-900">{dept.headcount} ({dept.pct}%)</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#14213D] to-[#0F8B8D] rounded-full"
                    style={{ width: `${dept.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Grade Level Ratios */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-sm text-[#14213D]">Staff Grade &amp; Qualification Hierarchy</h3>
            <span className="text-slate-400 font-mono">5 Grade Bands</span>
          </div>

          <div className="space-y-3">
            {gradeBreakdown.map((g, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#14213D]">{g.grade}</div>
                  <div className="text-[10px] text-slate-400">{g.pct} of total plant workforce</div>
                </div>
                <div className="text-base font-bold font-mono text-indigo-700">{g.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ready-to-Export MIS Reports Center */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-[#14213D]">One-Click Production MIS &amp; Statutory Report Downloads</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { name: 'Monthly Muster Roll & Attendance Register', format: 'Excel / CSV', act: 'Factories Act 1948' },
            { name: 'Overtime & Night Shift Allowance Statement', format: 'Excel', act: 'Payment of Wages' },
            { name: 'Operator Skill Matrix & Training Record', format: 'PDF / Excel', act: 'IATF 16949 / ISO 9001' },
            { name: 'EHS Incidents & Zero-Harm Safety Audit', format: 'PDF', act: 'OSHA / ISO 45001' },
            { name: 'Contract Labour Billing & Wage Audit Report', format: 'Excel', act: 'CLRA Act 1970' },
            { name: 'Provident Fund (ECR) Electronic Challan', format: 'Text (.txt / ECR)', act: 'EPFO India' },
            { name: 'ESIC Monthly Return & Worker List', format: 'Excel', act: 'ESIC Portal Format' },
            { name: 'Employee Master Census & KYC Audit', format: 'Excel', act: 'Corporate HR MIS' },
          ].map((rep, idx) => (
            <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 flex flex-col justify-between">
              <div>
                <div className="font-bold text-slate-900 leading-snug">{rep.name}</div>
                <div className="text-[10px] text-slate-500 font-medium mt-1">Ref: {rep.act}</div>
              </div>
              <button
                onClick={() => showToast(`Exporting ${rep.name} (${rep.format})...`)}
                className="flex items-center justify-center gap-1.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg font-bold transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#0F8B8D]" />
                <span>Export {rep.format}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
