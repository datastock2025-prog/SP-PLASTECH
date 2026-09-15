import React, { useState, useMemo } from 'react';
import { JournalEntry, Account, CostCenter } from '../../types';
import {
  EnterpriseJournalEntry,
  JournalLineItem,
  JournalType,
  JournalEntryStatus,
  LedgerTransaction,
  ChartOfAccountDetail,
  AuditRecord,
} from '../../types/financeEnterprise';
import {
  mockEnterpriseJournalEntries,
  mockChartOfAccountsDetails,
  mockLedgerTransactions,
} from '../../data/financeEnterpriseData';
import { FinanceAuditDrawer } from './FinanceAuditDrawer';
import {
  BookOpen,
  Plus,
  RotateCcw,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  Trash2,
  Printer,
  Calendar,
  Building,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Filter,
  Download,
  Upload,
  Layers,
  Clock,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Eye,
  Edit3,
  Copy,
  AlertTriangle,
  FileSpreadsheet,
  Check,
  X,
  Send,
  HelpCircle,
  DollarSign,
  PieChart,
} from 'lucide-react';

interface Props {
  journalEntries: JournalEntry[];
  accounts: Account[];
  costCenters: CostCenter[];
  onCreateJE: (je: JournalEntry) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
}

export const JournalEntriesView: React.FC<Props> = ({
  journalEntries: baseJournalEntries,
  accounts: baseAccounts,
  costCenters: baseCostCenters,
  onCreateJE,
  openDrawer,
  closeDrawer,
  showToast,
}) => {
  // Navigation Tabs for Journal Entry & Ledger Subsystem
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'entriesList' | 'createEntry' | 'ledger' | 'accountDetail'
  >('entriesList');

  // Enterprise state
  const [enterpriseJEs, setEnterpriseJEs] = useState<EnterpriseJournalEntry[]>(
    mockEnterpriseJournalEntries
  );
  const [selectedJE, setSelectedJE] = useState<EnterpriseJournalEntry | null>(
    mockEnterpriseJournalEntries[0]
  );
  const [selectedAccountCode, setSelectedAccountCode] = useState<string>('1210');
  const [ledgerTransactions, setLedgerTransactions] = useState<LedgerTransaction[]>(
    mockLedgerTransactions
  );

  // List filters
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [periodFilter, setPeriodFilter] = useState<string>('2026-09');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedJEsForBatch, setSelectedJEsForBatch] = useState<string[]>([]);

  // Create / Edit JE Form State
  const [entryMode, setEntryMode] = useState<'create' | 'edit'>('create');
  const [formPostingDate, setFormPostingDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [formPeriod, setFormPeriod] = useState<string>('2026-09 (Open)');
  const [formJournalType, setFormJournalType] = useState<JournalType>('Standard');
  const [formEntity, setFormEntity] = useState<string>('Reboot Manufacturing Corp (Plant 01)');
  const [formCurrency, setFormCurrency] = useState<string>('INR (₹)');
  const [formExchangeRate, setFormExchangeRate] = useState<number>(1.0);
  const [formDescription, setFormDescription] = useState<string>('');
  const [formRefDoc, setFormRefDoc] = useState<string>('');
  const [formCostCenter, setFormCostCenter] = useState<string>('CC-PROD-01');
  const [formDepartment, setFormDepartment] = useState<string>('Production');
  const [formIsReversal, setFormIsReversal] = useState<boolean>(false);
  const [formReverseDate, setFormReverseDate] = useState<string>('2026-10-01');
  const [formAttachments, setFormAttachments] = useState<
    Array<{ name: string; size: string; type: string }>
  >([]);

  const [formLines, setFormLines] = useState<JournalLineItem[]>([
    {
      lineNo: 1,
      accountCode: '5100',
      accountName: 'Raw Material Consumption',
      description: 'Polypropylene Copolymer MFI issue',
      debit: 50000,
      credit: 0,
      currency: 'INR',
      exchangeRate: 1,
      taxCode: 'GST-0%',
      costCenter: 'CC-PROD-01',
      department: 'Production',
      status: 'Valid',
    },
    {
      lineNo: 2,
      accountCode: '1310',
      accountName: 'Inventory - Raw Material Resins',
      description: 'Warehouse Store Bin RM-01',
      debit: 0,
      credit: 50000,
      currency: 'INR',
      exchangeRate: 1,
      taxCode: 'GST-0%',
      costCenter: 'CC-WH-01',
      department: 'Warehouse',
      status: 'Valid',
    },
  ]);

  // Calculations for Create form
  const formTotalDebit = formLines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const formTotalCredit = formLines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const formDifference = Math.abs(formTotalDebit - formTotalCredit);
  const isFormBalanced = formDifference < 0.01 && formTotalDebit > 0;

  // Ledger Filter State
  const [ledgerViewType, setLedgerViewType] = useState<string>('Account Statement');
  const [ledgerAccountFilter, setLedgerAccountFilter] = useState<string>('1210');
  const [ledgerCostCenterFilter, setLedgerCostCenterFilter] = useState<string>('All');
  const [showUnpostedLedger, setShowUnpostedLedger] = useState<boolean>(true);

  // Account Detail Tab State (STEP-6)
  const [accountDetailActiveTab, setAccountDetailActiveTab] = useState<
    'Overview' | 'Transactions' | 'Budget' | 'Sub-Ledger' | 'Documents' | 'Audit' | 'Settings'
  >('Overview');

  // Audit Drawer Helper
  const handleOpenAudit = (je: EnterpriseJournalEntry) => {
    openDrawer(
      `Audit History: ${je.jeNumber}`,
      <FinanceAuditDrawer
        title="Journal Entry Audit"
        documentNumber={je.jeNumber}
        auditTrail={je.auditTrail}
        onClose={closeDrawer}
      />
    );
  };

  // Quick balancing line helper (STEP-3 UX Requirement)
  const handleAutoBalance = () => {
    if (formTotalDebit > formTotalCredit) {
      const diff = formTotalDebit - formTotalCredit;
      const newLine: JournalLineItem = {
        lineNo: formLines.length + 1,
        accountCode: '2150',
        accountName: 'Accrued Expenses & Balancing Account',
        description: 'Auto-balancing line adjustment',
        debit: 0,
        credit: diff,
        currency: 'INR',
        exchangeRate: 1,
        taxCode: 'GST-Exempt',
        costCenter: formCostCenter,
        department: formDepartment,
        status: 'Valid',
      };
      setFormLines([...formLines, newLine]);
      showToast(`Added balancing credit of ₹${diff.toLocaleString()} to line #${formLines.length + 1}`);
    } else if (formTotalCredit > formTotalDebit) {
      const diff = formTotalCredit - formTotalDebit;
      const newLine: JournalLineItem = {
        lineNo: formLines.length + 1,
        accountCode: '6450',
        accountName: 'Inventory Write-Down & Variance',
        description: 'Auto-balancing line adjustment',
        debit: diff,
        credit: 0,
        currency: 'INR',
        exchangeRate: 1,
        taxCode: 'GST-Exempt',
        costCenter: formCostCenter,
        department: formDepartment,
        status: 'Valid',
      };
      setFormLines([...formLines, newLine]);
      showToast(`Added balancing debit of ₹${diff.toLocaleString()} to line #${formLines.length + 1}`);
    } else {
      showToast('Entry is already balanced. No adjustment needed.');
    }
  };

  // Copy down description helper (STEP-3)
  const handleCopyDownMemo = (index: number) => {
    if (index === 0) return;
    const prevDesc = formLines[index - 1].description;
    const updated = [...formLines];
    updated[index].description = prevDesc;
    setFormLines(updated);
    showToast(`Copied description from line #${index} to #${index + 1}`);
  };

  // Save / Post Journal Entry
  const handleSaveOrPostEntry = (targetStatus: 'Draft' | 'Pending Approval' | 'Posted') => {
    if (targetStatus === 'Posted' && !isFormBalanced) {
      showToast('Cannot post an unbalanced Journal Entry. Debits must equal Credits.');
      return;
    }

    const newJE: EnterpriseJournalEntry = {
      jeNumber: `JE-2026-0${884 + enterpriseJEs.length}`,
      postingDate: formPostingDate,
      period: formPeriod,
      journalType: formJournalType,
      entity: formEntity,
      currency: formCurrency,
      exchangeRate: formExchangeRate,
      description: formDescription || 'General Ledger Transaction',
      referenceDocument: formRefDoc || 'MANUAL-INPUT',
      sourceModule: 'General Ledger',
      costCenter: formCostCenter,
      department: formDepartment,
      isReversal: formIsReversal,
      reverseOnDate: formIsReversal ? formReverseDate : undefined,
      attachmentRequired: formTotalDebit > 100000,
      status: targetStatus,
      totalDebit: formTotalDebit,
      totalCredit: formTotalCredit,
      balanceDifference: formDifference,
      isBalanced: isFormBalanced,
      attachments: formAttachments,
      approvalWorkflow: {
        stage: targetStatus === 'Posted' ? 'Posted' : targetStatus === 'Pending Approval' ? 'Manager Review' : 'Draft',
        approverName: 'Sunita Sharma',
        approverRole: 'Finance Controller',
        approvalLimit: 500000,
        submitDate: new Date().toISOString().slice(0, 16),
        dueDate: '2026-09-20',
        comments: ['Entry validated for posting.'],
        timeline: [
          { stage: 'Draft Created', timestamp: new Date().toISOString().slice(0, 16), user: 'Finance Officer', status: 'done' },
          ...(targetStatus === 'Posted'
            ? [
                { stage: 'Manager Review', timestamp: new Date().toISOString().slice(0, 16), user: 'Sunita Sharma', status: 'done' as const },
                { stage: 'Posted to GL', timestamp: new Date().toISOString().slice(0, 16), user: 'System Engine', status: 'done' as const },
              ]
            : []),
        ],
        plImpact: -formTotalDebit,
        balanceSheetImpact: -formTotalCredit,
        affectsClosedPeriod: false,
      },
      createdBy: 'Finance Officer',
      createdAt: new Date().toISOString().slice(0, 16),
      postedBy: targetStatus === 'Posted' ? 'Finance Officer' : undefined,
      auditTrail: [
        {
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
          action: targetStatus === 'Posted' ? 'Posted to General Ledger' : `Saved as ${targetStatus}`,
          actor: 'Finance Officer',
          role: 'Finance Manager',
          notes: formDescription,
        },
      ],
      lines: formLines,
    };

    setEnterpriseJEs([newJE, ...enterpriseJEs]);

    // Also sync to base onCreateJE prop to ensure zero breaking changes to existing business logic!
    onCreateJE({
      id: newJE.jeNumber,
      date: newJE.postingDate,
      ref: newJE.referenceDocument || '',
      memo: newJE.description,
      currency: newJE.currency,
      status: targetStatus === 'Posted' ? 'posted' : targetStatus === 'Pending Approval' ? 'pending' : 'draft',
      createdBy: newJE.createdBy,
      approvedBy: newJE.approvedBy || '',
      lines: newJE.lines.map((l) => ({
        account: l.accountCode,
        desc: l.description,
        debit: l.debit,
        credit: l.credit,
        cc: l.costCenter,
        tax: l.taxCode,
      })),
    });

    showToast(`Journal Entry ${newJE.jeNumber} successfully ${targetStatus === 'Posted' ? 'posted to Ledger' : 'saved'}.`);
    setActiveTab('entriesList');
  };

  // Reversal Action (STEP-3 & 4)
  const handleReverseEntry = (je: EnterpriseJournalEntry) => {
    const reversalJE: EnterpriseJournalEntry = {
      ...je,
      jeNumber: `${je.jeNumber}-REV`,
      postingDate: new Date().toISOString().slice(0, 10),
      description: `[REVERSAL] of ${je.jeNumber}: ${je.description}`,
      isReversal: true,
      status: 'Posted',
      lines: je.lines.map((l) => ({
        ...l,
        debit: l.credit, // swap debit and credit
        credit: l.debit,
        description: `Reversal of: ${l.description}`,
      })),
      auditTrail: [
        ...je.auditTrail,
        {
          id: `AUD-REV-${Date.now()}`,
          timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
          action: 'Reversed Journal Entry',
          actor: 'Sunita Sharma',
          role: 'Controller/CFO',
          notes: `Reversal generated with inverted debits/credits.`,
        },
      ],
    };

    setEnterpriseJEs([reversalJE, ...enterpriseJEs]);
    showToast(`Reversal Entry ${reversalJE.jeNumber} posted to General Ledger.`);
  };

  // Filtered entries for List Tab
  const filteredEntries = useMemo(() => {
    return enterpriseJEs.filter((je) => {
      const matchSearch =
        je.jeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        je.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (je.referenceDocument && je.referenceDocument.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchStatus = statusFilter === 'All' || je.status === statusFilter;
      const matchType = typeFilter === 'All' || je.journalType === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [enterpriseJEs, searchTerm, statusFilter, typeFilter]);

  // Current selected Account detail for STEP-6
  const currentAccountDetail =
    mockChartOfAccountsDetails.find((a) => a.accountCode === selectedAccountCode) ||
    mockChartOfAccountsDetails[1];

  // Helper for Status Badges (STEP-22)
  const getStatusBadge = (status: JournalEntryStatus) => {
    switch (status) {
      case 'Draft':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">Draft</span>;
      case 'Pending Approval':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>;
      case 'Approved':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">Approved</span>;
      case 'Posted':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1"><Check className="w-3 h-3 text-emerald-600" /> Posted</span>;
      case 'Reversed':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">Reversed</span>;
      case 'Rejected':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">Rejected</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Fiscal Period & Top Notification Banner (STEP-2) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-5 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase rounded-md tracking-wider">
              Period Active: 2026-09
            </span>
            <span className="text-xs text-slate-300">Fiscal Cutoff: 30-Sep-2026 &bull; 16 Days Remaining</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-teal-400" />
            General Ledger & Journal Entries
          </h1>
          <p className="text-xs text-slate-400">
            Real-time double-entry accounting, segregation of duties, and audit-ready financial governance.
          </p>
        </div>

        {/* Quick Mode Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEntryMode('create');
              setActiveTab('createEntry');
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            + New Journal Entry
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium rounded-xl transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-400" />
            Ledger Inquiry
          </button>
        </div>
      </div>

      {/* Primary Subsystem Navigation (STEP-2, 3, 5, 6) */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition border-b-2 flex items-center gap-2 ${
            activeTab === 'dashboard'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <PieChart className="w-3.5 h-3.5" />
          JE Dashboard & KPIs
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('entriesList')}
          className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition border-b-2 flex items-center gap-2 ${
            activeTab === 'entriesList'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Journal Entries ({enterpriseJEs.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('createEntry')}
          className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition border-b-2 flex items-center gap-2 ${
            activeTab === 'createEntry'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          {entryMode === 'create' ? 'Create Journal Entry' : 'Edit Journal Entry'}
          {!isFormBalanced && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Unbalanced lines" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition border-b-2 flex items-center gap-2 ${
            activeTab === 'ledger'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          General Ledger & Statements
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('accountDetail')}
          className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition border-b-2 flex items-center gap-2 ${
            activeTab === 'accountDetail'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          COA Account Inspector
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: JOURNAL ENTRY DASHBOARD (STEP-2) */}
      {/* ========================================================================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* STEP-2: 9 KPI CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Entries</span>
              <div className="text-xl font-bold text-slate-900 mt-1">1,482</div>
              <span className="text-[10px] text-emerald-600 font-medium">+14% vs last period</span>
            </div>
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Draft Entries</span>
              <div className="text-xl font-bold text-slate-700 mt-1">12</div>
              <span className="text-[10px] text-amber-600 font-medium">3 pending completion</span>
            </div>
            <div className="p-3.5 bg-white rounded-xl border border-amber-200 bg-amber-50/30 shadow-xs">
              <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block">Pending Approval</span>
              <div className="text-xl font-bold text-amber-900 mt-1">4</div>
              <span className="text-[10px] text-amber-700 font-medium">1 waiting &gt;24 hrs</span>
            </div>
            <div className="p-3.5 bg-white rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
              <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">Posted (Current)</span>
              <div className="text-xl font-bold text-emerald-900 mt-1">1,460</div>
              <span className="text-[10px] text-emerald-600 font-medium">100% balanced</span>
            </div>
            <div className="p-3.5 bg-white rounded-xl border border-rose-200 bg-rose-50/30 shadow-xs">
              <span className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider block">Exceptions / Unbalanced</span>
              <div className="text-xl font-bold text-rose-900 mt-1">1</div>
              <span className="text-[10px] text-rose-600 font-bold">Action Required!</span>
            </div>
          </div>

          {/* Conditional Alerts Banner (STEP-2) */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-amber-900">Finance Controller Action List (Period 2026-09)</h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  &bull; Draft JE-2026-0883 contains an imbalance of ₹6,400.00 between Stock and Write-down accounts.<br />
                  &bull; Period closing cut-off is active in 16 days. 4 recurring depreciation journals scheduled for 30-Sep.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setEntryMode('edit');
                setActiveTab('createEntry');
              }}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium shrink-0 shadow-xs transition"
            >
              Resolve Imbalance
            </button>
          </div>

          {/* Widgets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Widget 1: Journal Distribution */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Journal Distribution by Type</h3>
                <span className="text-[10px] text-slate-500">Period: 2026-09</span>
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-600">Standard Production / Material Issues</span>
                    <span className="font-semibold text-slate-900">62% (₹94.2L)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-teal-600 h-full rounded-full" style={{ width: '62%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-600">Supplier Invoices & 3-Way Matches</span>
                    <span className="font-semibold text-slate-900">22% (₹33.5L)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: '22%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-600">Payroll & Benefits Accruals</span>
                    <span className="font-semibold text-slate-900">11% (₹16.7L)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: '11%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-600">Depreciation & Fixed Assets</span>
                    <span className="font-semibold text-slate-900">5% (₹7.6L)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-600 h-full rounded-full" style={{ width: '5%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Widget 2: Approver Queue & Bottlenecks */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Approval Queue & Aging</h3>
                <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-bold">SOX Tier-2</span>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-2 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">JE-2026-0882: Utility Accrual Aug/Sep</span>
                    <span className="text-[10px] text-slate-500">Approver: Sunita Sharma (Waiting 2h 45m)</span>
                  </div>
                  <span className="font-mono font-bold text-slate-800">₹3,40,000</span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">JE-2026-0880: Tooling Maintenance Amortization</span>
                    <span className="text-[10px] text-slate-500">Approver: Rajesh Nair (Waiting 5h 10m)</span>
                  </div>
                  <span className="font-mono font-bold text-slate-800">₹78,400</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: JOURNAL ENTRIES LIST (STEP-2 & STEP-3) */}
      {/* ========================================================================= */}
      {activeTab === 'entriesList' && (
        <div className="space-y-4">
          {/* Status Sub-Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {['All', 'Draft', 'Pending Approval', 'Approved', 'Posted', 'Reversed'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Filters Bar (STEP-2) */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search JE #, Description, Reference..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700"
              >
                <option value="All">All Types</option>
                <option value="Standard">Standard</option>
                <option value="Adjustment">Adjustment</option>
                <option value="Accrual">Accrual</option>
                <option value="Reversal">Reversal</option>
              </select>

              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 font-mono"
              >
                <option value="2026-09">Period: 2026-09 (Open)</option>
                <option value="2026-08">Period: 2026-08 (Closed)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const csv =
                    'JE Number,Posting Date,Type,Description,Ref,Debit,Credit,Status\n' +
                    filteredEntries
                      .map(
                        (je) =>
                          `"${je.jeNumber}","${je.postingDate}","${je.journalType}","${je.description}","${je.referenceDocument || ''}",${je.totalDebit},${je.totalCredit},"${je.status}"`
                      )
                      .join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Journal_Register_${periodFilter}.csv`;
                  a.click();
                  showToast('Exported Journal Register CSV.');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 text-xs font-medium"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Table (STEP-2 Table Columns & Row Actions) */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                    <th className="p-3 w-8">
                      <input
                        type="checkbox"
                        className="rounded text-teal-600"
                        onChange={(e) => {
                          if (e.target.checked) setSelectedJEsForBatch(filteredEntries.map((j) => j.jeNumber));
                          else setSelectedJEsForBatch([]);
                        }}
                      />
                    </th>
                    <th className="p-3">JE Number</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Narration / Description</th>
                    <th className="p-3">Reference Doc</th>
                    <th className="p-3 text-right">Debit (₹)</th>
                    <th className="p-3 text-right">Credit (₹)</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3">Created By</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEntries.map((je) => (
                    <tr key={je.jeNumber} className="hover:bg-slate-50/60 transition">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedJEsForBatch.includes(je.jeNumber)}
                          onChange={() => {
                            if (selectedJEsForBatch.includes(je.jeNumber)) {
                              setSelectedJEsForBatch(selectedJEsForBatch.filter((id) => id !== je.jeNumber));
                            } else {
                              setSelectedJEsForBatch([...selectedJEsForBatch, je.jeNumber]);
                            }
                          }}
                          className="rounded text-teal-600"
                        />
                      </td>
                      <td className="p-3 font-mono font-bold text-teal-700">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedJE(je);
                            setEntryMode('edit');
                            setFormDescription(je.description);
                            setFormRefDoc(je.referenceDocument || '');
                            setFormLines(je.lines);
                            setActiveTab('createEntry');
                          }}
                          className="hover:underline"
                        >
                          {je.jeNumber}
                        </button>
                        {je.isReversal && (
                          <span className="block text-[9px] text-purple-600 font-sans font-normal">Reversal Entry</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-600 font-mono text-[11px]">{je.postingDate}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-800">
                          {je.journalType}
                        </span>
                      </td>
                      <td className="p-3 text-slate-800 font-medium max-w-[280px] truncate" title={je.description}>
                        {je.description}
                      </td>
                      <td className="p-3 font-mono text-slate-600 text-[11px]">{je.referenceDocument || '—'}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        ₹{je.totalDebit.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        ₹{je.totalCredit.toLocaleString()}
                      </td>
                      <td className="p-3 text-center">{getStatusBadge(je.status)}</td>
                      <td className="p-3 text-slate-600 text-[11px]">{je.createdBy}</td>
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          {je.status === 'Posted' && (
                            <button
                              type="button"
                              onClick={() => handleReverseEntry(je)}
                              className="p-1 hover:bg-purple-50 text-purple-600 rounded transition"
                              title="Reverse Journal Entry"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenAudit(je)}
                            className="p-1 hover:bg-slate-100 text-slate-500 rounded transition"
                            title="Audit Trail"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CREATE / EDIT JOURNAL ENTRY (STEP-3 & STEP-4) */}
      {/* ========================================================================= */}
      {activeTab === 'createEntry' && (
        <div className="space-y-5">
          {/* Header Form Panel (STEP-3) */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {entryMode === 'create' ? 'Draft New General Ledger Journal Entry' : `Edit Entry: ${selectedJE?.jeNumber}`}
                </h3>
                <span className="text-xs text-slate-500">
                  Dual-sided double-entry with instant mathematical balance verification.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveOrPostEntry('Draft')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveOrPostEntry('Pending Approval')}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
                >
                  <Send className="w-3 h-3" />
                  Submit for Approval
                </button>
                <button
                  type="button"
                  disabled={!isFormBalanced}
                  onClick={() => handleSaveOrPostEntry('Posted')}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition shadow-xs flex items-center gap-1.5 ${
                    isFormBalanced
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                  title={!isFormBalanced ? 'Entry is unbalanced. Debits must equal Credits.' : 'Post to General Ledger'}
                >
                  <Check className="w-3.5 h-3.5" />
                  Post to Ledger
                </button>
              </div>
            </div>

            {/* Header Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Posting Date *</label>
                <input
                  type="date"
                  value={formPostingDate}
                  onChange={(e) => setFormPostingDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Fiscal Period</label>
                <input
                  type="text"
                  readOnly
                  value={formPeriod}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50 font-mono text-slate-700"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Journal Type</label>
                <select
                  value={formJournalType}
                  onChange={(e) => setFormJournalType(e.target.value as JournalType)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="Standard">Standard</option>
                  <option value="Adjustment">Adjustment</option>
                  <option value="Accrual">Accrual</option>
                  <option value="Reversal">Reversal</option>
                  <option value="Depreciation">Depreciation</option>
                  <option value="Payroll">Payroll</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Source Reference / Doc #</label>
                <input
                  type="text"
                  placeholder="e.g. WO-8812, SUP-INV-4401"
                  value={formRefDoc}
                  onChange={(e) => setFormRefDoc(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-600 mb-1">Memo / Narration *</label>
                <input
                  type="text"
                  placeholder="Enter high-level accounting business rationale..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Cost Center</label>
                <select
                  value={formCostCenter}
                  onChange={(e) => setFormCostCenter(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
                >
                  {baseCostCenters.map((cc) => (
                    <option key={cc.code} value={cc.code}>
                      {cc.code} - {cc.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Reversal Toggle</label>
                <div className="flex items-center gap-2 mt-1.5">
                  <input
                    type="checkbox"
                    id="revToggle"
                    checked={formIsReversal}
                    onChange={(e) => setFormIsReversal(e.target.checked)}
                    className="rounded text-teal-600"
                  />
                  <label htmlFor="revToggle" className="text-slate-700 cursor-pointer">
                    Auto-reverse on Next Period
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Grid (The Core Workhorse - STEP-3) */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>Journal Line Items ({formLines.length})</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  (Use Enter or Tab to navigate, Debit and Credit mutually exclusive)
                </span>
              </h4>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoBalance}
                  className="px-2.5 py-1 text-[11px] bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg font-semibold transition"
                >
                  Quick Auto-Balance Line
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormLines([
                      ...formLines,
                      {
                        lineNo: formLines.length + 1,
                        accountCode: '5100',
                        accountName: 'Direct Material Expense',
                        description: formDescription || 'General line item',
                        debit: 0,
                        credit: 0,
                        currency: 'INR',
                        exchangeRate: 1,
                        taxCode: 'GST-0%',
                        costCenter: formCostCenter,
                        department: formDepartment,
                        status: 'Valid',
                      },
                    ]);
                  }}
                  className="px-2.5 py-1 text-[11px] bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg font-semibold transition flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add Line
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                    <th className="p-2 w-10 text-center">#</th>
                    <th className="p-2 min-w-[200px]">GL Account</th>
                    <th className="p-2 min-w-[220px]">Line Description / Narration</th>
                    <th className="p-2 min-w-[120px]">Cost Center</th>
                    <th className="p-2 min-w-[110px] text-right">Debit (₹)</th>
                    <th className="p-2 min-w-[110px] text-right">Credit (₹)</th>
                    <th className="p-2 w-20 text-center">Tax Code</th>
                    <th className="p-2 w-12 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {formLines.map((line, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-2 text-center font-mono text-slate-400 font-semibold">{idx + 1}</td>
                      <td className="p-2">
                        <select
                          value={line.accountCode}
                          onChange={(e) => {
                            const updated = [...formLines];
                            const sel = baseAccounts.find((a) => a.code === e.target.value);
                            updated[idx].accountCode = e.target.value;
                            if (sel) updated[idx].accountName = sel.name;
                            setFormLines(updated);
                          }}
                          className="w-full p-1.5 text-xs border border-slate-200 rounded bg-white font-mono"
                        >
                          {baseAccounts.map((a) => (
                            <option key={a.code} value={a.code}>
                              {a.code} - {a.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={line.description}
                            onChange={(e) => {
                              const updated = [...formLines];
                              updated[idx].description = e.target.value;
                              setFormLines(updated);
                            }}
                            className="w-full p-1.5 text-xs border border-slate-200 rounded"
                            placeholder="Line narration..."
                          />
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => handleCopyDownMemo(idx)}
                              title="Copy down from previous line"
                              className="p-1 hover:bg-slate-100 text-slate-500 rounded"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="p-2">
                        <select
                          value={line.costCenter}
                          onChange={(e) => {
                            const updated = [...formLines];
                            updated[idx].costCenter = e.target.value;
                            setFormLines(updated);
                          }}
                          className="w-full p-1.5 text-xs border border-slate-200 rounded bg-white"
                        >
                          <option value="None">None</option>
                          {baseCostCenters.map((cc) => (
                            <option key={cc.code} value={cc.code}>
                              {cc.code}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={line.debit || ''}
                          placeholder="0.00"
                          onChange={(e) => {
                            const updated = [...formLines];
                            const val = parseFloat(e.target.value) || 0;
                            updated[idx].debit = val;
                            if (val > 0) updated[idx].credit = 0; // mutually exclusive
                            setFormLines(updated);
                          }}
                          className="w-full p-1.5 text-xs border border-slate-200 rounded text-right font-mono font-bold text-emerald-700"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={line.credit || ''}
                          placeholder="0.00"
                          onChange={(e) => {
                            const updated = [...formLines];
                            const val = parseFloat(e.target.value) || 0;
                            updated[idx].credit = val;
                            if (val > 0) updated[idx].debit = 0; // mutually exclusive
                            setFormLines(updated);
                          }}
                          className="w-full p-1.5 text-xs border border-slate-200 rounded text-right font-mono font-bold text-rose-700"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <select
                          value={line.taxCode}
                          onChange={(e) => {
                            const updated = [...formLines];
                            updated[idx].taxCode = e.target.value;
                            setFormLines(updated);
                          }}
                          className="w-full p-1 text-[11px] border border-slate-200 rounded bg-white"
                        >
                          <option value="GST-0%">GST 0%</option>
                          <option value="GST-5%">GST 5%</option>
                          <option value="GST-12%">GST 12%</option>
                          <option value="GST-18%">GST 18%</option>
                          <option value="GST-28%">GST 28%</option>
                          <option value="GST-Exempt">Exempt</option>
                        </select>
                      </td>
                      <td className="p-2 text-center">
                        {formLines.length > 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = formLines.filter((_, i) => i !== idx);
                              setFormLines(updated);
                            }}
                            className="text-rose-500 hover:text-rose-700 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Sticky Totals & Validation Panel (STEP-3) */}
                <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-mono font-bold">
                  <tr>
                    <td colSpan={4} className="p-3 text-right uppercase text-[11px] text-slate-600">
                      Total Functional Ledger Sum:
                    </td>
                    <td className="p-3 text-right text-emerald-800 text-sm">
                      ₹{formTotalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right text-rose-800 text-sm">
                      ₹{formTotalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td colSpan={2} className="p-3 text-center">
                      {isFormBalanced ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 text-xs font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                          Balanced (₹0.00)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-100 text-rose-800 text-xs font-bold animate-pulse">
                          <AlertCircle className="w-4 h-4 text-rose-700" />
                          Diff: ₹{formDifference.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: GENERAL LEDGER & STATEMENTS (STEP-5) */}
      {/* ========================================================================= */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          {/* Header Filters (STEP-5) */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Ledger View</label>
                  <select
                    value={ledgerViewType}
                    onChange={(e) => setLedgerViewType(e.target.value)}
                    className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-slate-50 text-slate-800"
                  >
                    <option value="Account Statement">Account Statement</option>
                    <option value="Trial Balance">Trial Balance</option>
                    <option value="Customer Sub-Ledger">Sub-ledger by Customer</option>
                    <option value="Supplier Sub-Ledger">Sub-ledger by Supplier</option>
                    <option value="Cost Center Ledger">Cost Center Ledger</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Filter Account</label>
                  <select
                    value={ledgerAccountFilter}
                    onChange={(e) => setLedgerAccountFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-mono"
                  >
                    <option value="All">All Active Accounts</option>
                    {baseAccounts.map((a) => (
                      <option key={a.code} value={a.code}>
                        {a.code} - {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Period Range</label>
                  <input
                    type="text"
                    readOnly
                    value="2026-04-01 to 2026-09-30 (FY 2026-27)"
                    className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-600 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showUnpostedLedger}
                    onChange={(e) => setShowUnpostedLedger(e.target.checked)}
                    className="rounded text-teal-600"
                  />
                  <span>Include Unposted Drafts</span>
                </label>
              </div>
            </div>

            {/* STEP-5: 6 KPI CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-slate-100">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Opening Balance</span>
                <span className="font-mono text-xs font-bold text-slate-900">₹26,32,900.00</span>
              </div>
              <div className="p-2.5 bg-emerald-50/60 rounded-lg border border-emerald-200">
                <span className="text-[10px] text-emerald-800 font-bold uppercase block">Total Debits</span>
                <span className="font-mono text-xs font-bold text-emerald-900">₹4,17,200.00</span>
              </div>
              <div className="p-2.5 bg-rose-50/60 rounded-lg border border-rose-200">
                <span className="text-[10px] text-rose-800 font-bold uppercase block">Total Credits</span>
                <span className="font-mono text-xs font-bold text-rose-900">₹4,50,000.00</span>
              </div>
              <div className="p-2.5 bg-teal-50/60 rounded-lg border border-teal-200">
                <span className="text-[10px] text-teal-800 font-bold uppercase block">Closing Balance</span>
                <span className="font-mono text-xs font-bold text-teal-950">₹26,00,100.00</span>
              </div>
              <div className="p-2.5 bg-amber-50/60 rounded-lg border border-amber-200">
                <span className="text-[10px] text-amber-800 font-bold uppercase block">Unposted Balance</span>
                <span className="font-mono text-xs font-bold text-amber-900">₹45,000.00</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Period Lock</span>
                <span className="font-mono text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Open
                </span>
              </div>
            </div>
          </div>

          {/* Ledger Table with Running Balance (STEP-5) */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                    <th className="p-3">Date</th>
                    <th className="p-3">JE #</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Ref Doc</th>
                    <th className="p-3">Source Type</th>
                    <th className="p-3 text-right">Debit (₹)</th>
                    <th className="p-3 text-right">Credit (₹)</th>
                    <th className="p-3 text-right">Running Balance (₹)</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Audit / Drilldown</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ledgerTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/60 transition">
                      <td className="p-3 font-mono text-[11px] text-slate-600">{tx.date}</td>
                      <td className="p-3 font-mono font-bold text-teal-700">
                        <button
                          type="button"
                          onClick={() => {
                            showToast(`Drilling down into ${tx.jeNumber}...`);
                            setActiveTab('entriesList');
                            setSearchTerm(tx.jeNumber);
                          }}
                          className="hover:underline flex items-center gap-1"
                        >
                          {tx.jeNumber}
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </button>
                      </td>
                      <td className="p-3 text-slate-800 font-medium max-w-[280px]">{tx.description}</td>
                      <td className="p-3 font-mono text-[11px] text-slate-600">{tx.reference}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-medium text-slate-700">
                          {tx.sourceType}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-700">
                        {tx.debit > 0 ? `₹${tx.debit.toLocaleString()}` : '—'}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-rose-700">
                        {tx.credit > 0 ? `₹${tx.credit.toLocaleString()}` : '—'}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        ₹{tx.runningBalance.toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        {tx.isPosted ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Posted
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Unposted
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            openDrawer(
                              `Ledger Transaction Detail: ${tx.id}`,
                              <div className="space-y-4 text-xs">
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                  <div className="font-mono text-sm font-bold text-slate-900">{tx.jeNumber}</div>
                                  <div className="text-slate-600 mt-1">{tx.description}</div>
                                  <div className="text-[11px] text-slate-500 mt-0.5">Source Doc: {tx.sourceDocument}</div>
                                </div>
                                <div className="p-3 bg-emerald-50 text-emerald-900 rounded-lg text-[11px]">
                                  <strong>Double-Entry Posting Verified:</strong> Tied to General Ledger transaction log.
                                </div>
                              </div>
                            );
                          }}
                          className="p-1 hover:bg-slate-100 text-slate-500 rounded"
                          title="View Drilldown"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: CHART OF ACCOUNTS / ACCOUNT DETAIL (STEP-6) */}
      {/* ========================================================================= */}
      {activeTab === 'accountDetail' && (
        <div className="space-y-5">
          {/* Account Selector Header */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 text-xs font-mono font-bold rounded">
                  {currentAccountDetail.accountCode}
                </span>
                <h3 className="text-base font-bold text-slate-900">{currentAccountDetail.accountName}</h3>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-full">
                  {currentAccountDetail.status}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Type: <strong>{currentAccountDetail.accountType}</strong> &bull; Parent: {currentAccountDetail.parentAccount}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedAccountCode}
                onChange={(e) => setSelectedAccountCode(e.target.value)}
                className="px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg bg-white"
              >
                {mockChartOfAccountsDetails.map((a) => (
                  <option key={a.accountCode} value={a.accountCode}>
                    {a.accountCode} - {a.accountName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* STEP-6: 7 Tabs Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto text-xs">
            {(
              ['Overview', 'Transactions', 'Budget', 'Sub-Ledger', 'Documents', 'Audit', 'Settings'] as const
            ).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setAccountDetailActiveTab(t)}
                className={`px-3.5 py-2 font-semibold transition border-b-2 ${
                  accountDetailActiveTab === t
                    ? 'border-teal-600 text-teal-700 bg-teal-50/40'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Tab Content Rendering */}
          {accountDetailActiveTab === 'Overview' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Current Ledger Balance</span>
                <div className="text-xl font-mono font-bold text-slate-900">
                  ₹{currentAccountDetail.currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[10px] text-slate-500">Period-to-Date Activity: ₹{currentAccountDetail.ptdActivity.toLocaleString()}</span>
              </div>
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Last Bank Reconciliation</span>
                <div className="text-base font-mono font-bold text-teal-700">{currentAccountDetail.lastReconciliationDate}</div>
                <span className="text-[10px] text-emerald-600 font-medium">Reconciled by Treasury</span>
              </div>
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Audit & Deactivation Check</span>
                <div className="text-xs font-semibold text-rose-700 mt-1">Deactivation Locked</div>
                <p className="text-[10px] text-slate-500">
                  Account has active posted journals in fiscal year 2026-27. Inactivation is prohibited per SOX guidelines.
                </p>
              </div>
            </div>
          )}

          {accountDetailActiveTab === 'Sub-Ledger' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800 uppercase text-[11px]">
                  Sub-Ledger Party Balance Breakdown (Trade Control)
                </span>
                <span className="text-slate-500">4 Sub-Ledger Entities Linked</span>
              </div>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                    <th className="p-3">Party Name</th>
                    <th className="p-3 text-right">Open Amount (₹)</th>
                    <th className="p-3 text-right">Current</th>
                    <th className="p-3 text-right">1-30 Days</th>
                    <th className="p-3 text-right">31-60 Days</th>
                    <th className="p-3 text-right">90+ Days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(currentAccountDetail.subLedgerBreakdown || []).map((sub, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-900">{sub.partyName}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        ₹{sub.openAmount.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-600">₹{sub.current.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-slate-600">₹{sub.aging30.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-amber-700">₹{sub.aging60.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-rose-700 font-bold">₹{sub.aging90Plus.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {accountDetailActiveTab === 'Settings' && (
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-slate-900 uppercase text-[11px]">Strict Accounting Controls & Rules</h4>
                <div className="mt-2 space-y-1.5 text-slate-700">
                  {currentAccountDetail.settings.postingRules.map((rule, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                      <span>{rule}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-slate-100 pt-3">
                <h4 className="font-bold text-slate-900 uppercase text-[11px]">Mandatory Posting Dimensions</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  {currentAccountDetail.settings.mandatoryFields.map((f, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded font-mono text-[11px]">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
