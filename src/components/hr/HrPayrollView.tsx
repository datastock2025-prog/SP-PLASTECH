import React, { useState } from 'react';
import {
  DollarSign,
  FileSpreadsheet,
  Download,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  Layers,
  FileText,
  Clock,
  Printer,
  Sparkles,
  Eye,
} from 'lucide-react';
import { HrPayrollInputRow } from '../../types';

interface HrPayrollViewProps {
  payrollRows: HrPayrollInputRow[];
  onLockPayroll: (month: string) => void;
  showToast: (msg: string) => void;
}

export const HrPayrollView: React.FC<HrPayrollViewProps> = ({
  payrollRows,
  onLockPayroll,
  showToast,
}) => {
  const [selectedMonth, setSelectedMonth] = useState('2026-08');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayslip, setSelectedPayslip] = useState<HrPayrollInputRow | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  const filteredRows = payrollRows.filter((r) => {
    return (
      r.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.department.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalGross = payrollRows.reduce((sum, r) => sum + r.grossSalary, 0);
  const totalNet = payrollRows.reduce((sum, r) => sum + r.netSalary, 0);
  const totalDeductions = payrollRows.reduce((sum, r) => sum + r.totalDeductions, 0);
  const totalOtPaid = payrollRows.reduce((sum, r) => sum + r.overtimePay, 0);

  const handleExportBankTransfer = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Employee ID,Beneficiary Name,Bank Account,IFSC,Net Salary,Payment Mode']
        .concat(
          payrollRows.map(
            (r) =>
              `${r.employeeId},"${r.employeeName}",XXXXXX4819,HDFC000104,${r.netSalary},NEFT`
          )
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bank_salary_disbursement_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Bank salary disbursement sheet exported for ${selectedMonth}.`);
  };

  const handleLockPayrollCycle = () => {
    setIsLocked(true);
    onLockPayroll(selectedMonth);
    showToast(`Payroll cycle ${selectedMonth} locked. Attendance data frozen and payslips published.`);
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Top Header & Actions Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-base text-[#14213D] flex items-center gap-2">
              <span>Payroll Computation &amp; Attendance Integration</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isLocked ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {isLocked ? 'Cycle Locked' : 'Cycle Open'}
              </span>
            </h2>
            <p className="text-slate-500">
              Auto-calculated from biometric attendance, approved leaves, night shift allowances, OT multipliers, and PF/ESI deductions.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 text-xs cursor-pointer"
          >
            <option value="2026-08">August 2026</option>
            <option value="2026-07">July 2026</option>
            <option value="2026-06">June 2026</option>
          </select>

          <button
            onClick={handleExportBankTransfer}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold border border-slate-200 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Bank Transfer CSV</span>
          </button>

          <button
            onClick={handleLockPayrollCycle}
            disabled={isLocked}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition shadow-xs cursor-pointer ${
              isLocked
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                : 'bg-[#14213D] hover:bg-[#1C2B4D] text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-[#E8622C]" />
            <span>{isLocked ? 'Payroll Frozen' : 'Lock Payroll & Generate Slips'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-400 font-bold text-[10px] uppercase">Total Gross Earnings</span>
          <div className="text-lg font-bold text-[#14213D] mt-0.5">₹{totalGross.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-slate-500">Includes Basic, HRA &amp; Allowances</div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-400 font-bold text-[10px] uppercase">Overtime &amp; Night Allowance</span>
          <div className="text-lg font-bold text-blue-700 mt-0.5">₹{totalOtPaid.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-slate-500">2x Statutory rate computed</div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-400 font-bold text-[10px] uppercase">Statutory Deductions (PF/ESI/PT)</span>
          <div className="text-lg font-bold text-rose-700 mt-0.5">₹{totalDeductions.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-slate-500">PF 12% + ESI 0.75% + PT ₹200</div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-400 font-bold text-[10px] uppercase">Net Bank Disbursement</span>
          <div className="text-lg font-bold text-emerald-700 mt-0.5">₹{totalNet.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-emerald-800 font-semibold">100% Reconciled</div>
        </div>
      </div>

      {/* Filter and Search */}
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
      </div>

      {/* Payroll Input & Calculation Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Staff / Code</th>
                <th className="p-3">Department</th>
                <th className="p-3 text-center">Payable / Total Days</th>
                <th className="p-3 text-right">Basic + DA</th>
                <th className="p-3 text-right">OT Pay</th>
                <th className="p-3 text-right">Night Allow.</th>
                <th className="p-3 text-right">Gross Salary</th>
                <th className="p-3 text-right">PF / ESI Deduct.</th>
                <th className="p-3 text-right">Net Payable</th>
                <th className="p-3 text-right">Payslip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRows.map((r) => (
                <tr key={r.employeeId} className="hover:bg-slate-50/70">
                  <td className="p-3">
                    <div className="font-bold text-[#14213D]">{r.employeeName}</div>
                    <div className="text-[10px] font-mono text-slate-400">{r.employeeId}</div>
                  </td>
                  <td className="p-3 text-slate-600">{r.department}</td>
                  <td className="p-3 text-center font-mono font-bold">
                    <span className="text-emerald-700">{r.payableDays}</span> / {r.totalDaysInMonth}
                  </td>
                  <td className="p-3 text-right font-mono">₹{r.basicSalary.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-right font-mono text-blue-700 font-bold">
                    ₹{r.overtimePay.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3 text-right font-mono text-purple-700">
                    ₹{r.shiftAllowance.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900">
                    ₹{r.grossSalary.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3 text-right font-mono text-rose-700">
                    -₹{r.totalDeductions.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-700 text-sm">
                    ₹{r.netSalary.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setSelectedPayslip(r)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-bold transition cursor-pointer"
                    >
                      View Slip
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payslip Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-base text-[#14213D]">Apex Plastics Corporation Ltd</h3>
                <p className="text-slate-500 text-[11px]">Salary Payslip for {selectedMonth}</p>
              </div>
              <button
                onClick={() => setSelectedPayslip(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px]">
              <div>
                <span className="text-slate-400">Employee:</span>
                <div className="font-bold text-slate-900">{selectedPayslip.employeeName}</div>
              </div>
              <div>
                <span className="text-slate-400">Employee Code:</span>
                <div className="font-bold font-mono text-slate-900">{selectedPayslip.employeeId}</div>
              </div>
              <div>
                <span className="text-slate-400">Department:</span>
                <div className="font-bold text-slate-900">{selectedPayslip.department}</div>
              </div>
              <div>
                <span className="text-slate-400">Payable Days:</span>
                <div className="font-bold text-slate-900">{selectedPayslip.payableDays} / {selectedPayslip.totalDaysInMonth} Days</div>
              </div>
            </div>

            {/* Earnings and Deductions breakdown */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="font-bold text-slate-800 border-b border-slate-200 pb-1">Earnings</div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Basic + DA:</span>
                  <span className="font-mono">₹{selectedPayslip.basicSalary.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">House Rent (HRA):</span>
                  <span className="font-mono">₹{selectedPayslip.hra.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Overtime (OT):</span>
                  <span className="font-mono text-blue-700 font-bold">₹{selectedPayslip.overtimePay.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Night Allowance:</span>
                  <span className="font-mono text-purple-700">₹{selectedPayslip.shiftAllowance.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 font-bold">
                  <span>Gross Pay:</span>
                  <span className="font-mono">₹{selectedPayslip.grossSalary.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="font-bold text-slate-800 border-b border-slate-200 pb-1">Deductions</div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Provident Fund (PF):</span>
                  <span className="font-mono">₹{selectedPayslip.providentFund.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ESI (0.75%):</span>
                  <span className="font-mono">₹{selectedPayslip.esi.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Professional Tax:</span>
                  <span className="font-mono">₹{selectedPayslip.professionalTax.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-rose-700">
                  <span>Total Deductions:</span>
                  <span className="font-mono">₹{selectedPayslip.totalDeductions.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-emerald-800 font-bold text-xs">Net Salary Paid</span>
                <div className="text-[10px] text-emerald-700">Disbursed via HDFC NEFT</div>
              </div>
              <div className="text-lg font-bold font-mono text-emerald-900">
                ₹{selectedPayslip.netSalary.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  showToast(`Payslip PDF printed for ${selectedPayslip.employeeName}`);
                  setSelectedPayslip(null);
                }}
                className="flex items-center gap-1 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print PDF</span>
              </button>
              <button
                onClick={() => setSelectedPayslip(null)}
                className="px-4 py-2 bg-[#14213D] hover:bg-[#1C2B4D] text-white rounded-lg font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
