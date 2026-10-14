import React, { useState } from 'react';
import { Account, JournalEntry } from '../../types';
import {
  Calendar,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Clock,
  Play,
  RotateCcw,
  ShieldCheck,
  Building,
  DollarSign,
  FileSpreadsheet,
} from 'lucide-react';

interface Props {
  accounts: Account[];
  journalEntries?: JournalEntry[];
  onCreateJE?: (je: JournalEntry) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
}

export const PeriodCloseView: React.FC<Props> = ({
  accounts,
  journalEntries = [],
  onCreateJE,
  openDrawer,
  closeDrawer,
  showToast,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2026-08 (August 2026)');
  const [isLocked, setIsLocked] = useState<boolean>(false);

  const [checklist, setChecklist] = useState([
    {
      id: 'step-1',
      name: 'Bank & Cash Accounts Reconciliation',
      desc: 'Verify HDFC & ICICI bank feeds against statement closing balances.',
      status: 'completed',
      responsible: 'Treasury Accountant',
      mandatory: true,
    },
    {
      id: 'step-2',
      name: 'AP Supplier Invoices & 3-Way GRN Matching',
      desc: 'Ensure all received goods GRNs have corresponding vendor bills matched or accrued.',
      status: 'completed',
      responsible: 'AP Lead',
      mandatory: true,
    },
    {
      id: 'step-3',
      name: 'AR Sales Billing & Dispatch Invoicing',
      desc: 'Verify all factory outbound delivery notes (DN) have generated valid GST tax invoices.',
      status: 'completed',
      responsible: 'AR Lead',
      mandatory: true,
    },
    {
      id: 'step-4',
      name: 'Manufacturing WIP & Inventory Valuation Run',
      desc: 'Revalue raw material PP resin lot stocks and work-in-progress work orders.',
      status: 'completed',
      responsible: 'Cost Controller',
      mandatory: true,
    },
    {
      id: 'step-5',
      name: 'Fixed Assets Depreciation Run',
      desc: 'Post monthly SLM depreciation vouchers for Injection Molding Machines & Molds.',
      status: 'pending',
      responsible: 'Fixed Asset Accountant',
      mandatory: true,
    },
    {
      id: 'step-6',
      name: 'Trial Balance Balance Check',
      desc: 'Verify sum of all debit balances equals sum of all credit balances.',
      status: 'completed',
      responsible: 'Finance Controller',
      mandatory: true,
    },
  ]);

  const completedCount = checklist.filter((s) => s.status === 'completed').length;
  const progressPct = Math.round((completedCount / checklist.length) * 100);

  const handleToggleStep = (stepId: string) => {
    setChecklist((prev) =>
      prev.map((s) =>
        s.id === stepId ? { ...s, status: s.status === 'completed' ? 'pending' : 'completed' } : s
      )
    );
  };

  const handleRunDepreciation = () => {
    if (onCreateJE) {
      const jeId = `JE-${new Date().getFullYear()}-DEP-${Date.now().toString().slice(-4)}`;
      onCreateJE({
        id: jeId,
        date: new Date().toISOString().slice(0, 10),
        ref: 'FA-DEP-AUG-2026',
        memo: 'Monthly Fixed Assets Depreciation - Plant Machinery & Tooling',
        currency: 'INR',
        status: 'posted',
        createdBy: 'Fixed Asset Accountant',
        approvedBy: 'Priya Rao (CFO)',
        lines: [
          { account: '6200', desc: 'Depreciation Expense - Machinery', debit: 125000, credit: 0, cc: 'CC-PROD-01', tax: '' },
          { account: '6200', desc: 'Depreciation Expense - Tooling Molds', debit: 45000, credit: 0, cc: 'CC-TOOL-01', tax: '' },
          { account: '1410', desc: 'Accumulated Depreciation - Plant Assets', debit: 0, credit: 170000, cc: '', tax: '' },
        ],
      });
      setChecklist((prev) =>
        prev.map((s) => (s.id === 'step-5' ? { ...s, status: 'completed' } : s))
      );
      showToast(`Depreciation voucher ${jeId} (₹1,70,000) posted and Step 5 marked complete!`);
    }
  };

  const handleLockPeriod = () => {
    if (progressPct < 100) {
      showToast('Cannot lock financial period until all mandatory checklist steps are completed!');
      return;
    }
    setIsLocked(true);
    showToast(`Period ${selectedPeriod} successfully LOCKED for financial reporting!`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-wider text-[#0F8B8D] font-bold">
            Finance &middot; Financial Controlling &amp; Governance
          </div>
          <h1 className="text-2xl font-bold text-[#14213D] font-['Space_Grotesk']">
            Period Close &amp; Financial Governance
          </h1>
          <p className="text-xs text-[#6B7280]">
            Monthly &amp; quarterly financial close checklists, automated depreciation runs, trial balance audit, and period locking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLocked(!isLocked)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm text-white ${
              isLocked ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#14213D] hover:bg-[#1f3158]'
            }`}
          >
            {isLocked ? (
              <>
                <Unlock className="w-3.5 h-3.5" /> Unlock Period
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" /> Lock Period (Final)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Period Selector & Progress Banner */}
      <div className="bg-white rounded-xl border border-[#E4E0D6] shadow-sm p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E4E0D6] pb-3">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-[#0F8B8D]" />
            <div>
              <div className="text-[10px] uppercase font-bold text-[#6B7280]">Target Financial Period</div>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="font-bold text-sm text-[#14213D] bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="2026-08 (August 2026)">August 2026 (Active Monthly Close)</option>
                <option value="2026-07 (July 2026)">July 2026 (Locked &amp; Audited)</option>
                <option value="2026-Q2 (FY26-27 Q2)">FY 2026-27 Quarter 2</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded text-xs font-bold uppercase flex items-center gap-1.5 ${
                isLocked
                  ? 'bg-rose-100 text-rose-800'
                  : progressPct === 100
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {isLocked ? (
                <>
                  <Lock className="w-3.5 h-3.5" /> Period Locked
                </>
              ) : progressPct === 100 ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready to Lock
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5" /> Close in Progress
                </>
              )}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-[#14213D]">
              Checklist Completion: {completedCount} of {checklist.length} Steps Complete
            </span>
            <span className="font-mono text-[#0F8B8D]">{progressPct}%</span>
          </div>
          <div className="w-full bg-[#E4E0D6] rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                progressPct === 100 ? 'bg-emerald-600' : 'bg-[#0F8B8D]'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Close Checklist Steps */}
      <div className="bg-white rounded-xl border border-[#E4E0D6] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#E4E0D6] bg-[#F6F4EF]/50">
          <h2 className="text-sm font-bold text-[#14213D] font-['Space_Grotesk']">
            Sequential Period-End Close Protocol
          </h2>
          <p className="text-[11px] text-[#6B7280]">
            All mandatory financial steps must be validated before locking the ledger.
          </p>
        </div>

        <div className="divide-y divide-[#E4E0D6]">
          {checklist.map((step, idx) => (
            <div
              key={step.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F6F4EF]/40 transition-colors"
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => handleToggleStep(step.id)}
                  className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                    step.status === 'completed'
                      ? 'bg-emerald-500 border-emerald-600 text-white'
                      : 'border-[#E4E0D6] hover:border-[#0F8B8D]'
                  }`}
                >
                  {step.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#14213D]">
                      Step {idx + 1}: {step.name}
                    </span>
                    {step.mandatory && (
                      <span className="text-[9px] font-bold uppercase bg-[#F6F4EF] text-[#6B7280] px-1.5 py-0.5 rounded border border-[#E4E0D6]">
                        Mandatory
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">{step.desc}</p>
                  <div className="text-[10px] text-[#0F8B8D] font-medium mt-1">
                    Owner: {step.responsible}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                {step.id === 'step-5' && step.status !== 'completed' && (
                  <button
                    onClick={handleRunDepreciation}
                    className="px-2.5 py-1 text-xs font-semibold bg-[#0F8B8D] text-white rounded hover:bg-[#0D7A7C] flex items-center gap-1"
                  >
                    <Play className="w-3 h-3" /> Run Depreciation
                  </button>
                )}
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    step.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {step.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
