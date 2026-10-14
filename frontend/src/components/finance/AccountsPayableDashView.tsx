import React, { useState, useMemo } from 'react';
import { SupplierInvoice, Supplier, PurchaseOrder, JournalEntry } from '../../types';
import {
  EnterpriseSupplierInvoice,
  ThreeWayMatchRecord,
  ApExceptionRecord,
  ThreeWayMatchStatus,
  SupplierInvoiceStatus,
  ApExceptionType,
} from '../../types/financeEnterprise';
import {
  mockEnterpriseSupplierInvoices,
  mockThreeWayMatchRecord,
  mockApExceptions,
} from '../../data/financeEnterpriseData';
import { FinanceAuditDrawer } from './FinanceAuditDrawer';
import {
  Receipt,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  Building,
  Check,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  FileText,
  Percent,
  Plus,
  Upload,
  Layers,
  FileSpreadsheet,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Eye,
  Edit3,
  HelpCircle,
  X,
  Send,
  Download,
  Split,
  RefreshCw,
} from 'lucide-react';

interface Props {
  supplierInvoices?: SupplierInvoice[];
  suppliers?: Supplier[];
  purchaseOrders?: PurchaseOrder[];
  onCreateJE?: (je: JournalEntry) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
}

export const AccountsPayableDashView: React.FC<Props> = ({
  supplierInvoices: initialSupplierInvoices,
  suppliers = [],
  purchaseOrders = [],
  onCreateJE,
  openDrawer,
  closeDrawer,
  showToast,
}) => {
  // Navigation Tabs for AP Subsystem (STEP-7 to STEP-14)
  const [apActiveTab, setApActiveTab] = useState<
    'dashboard' | 'invoicesList' | 'createInvoice' | 'autoMatchUpload' | 'matchWorkspace' | 'exceptions'
  >('invoicesList');

  // State for enterprise AP invoices
  const [enterpriseInvoices, setEnterpriseInvoices] = useState<EnterpriseSupplierInvoice[]>(
    mockEnterpriseSupplierInvoices
  );
  const [selectedInvoice, setSelectedInvoice] = useState<EnterpriseSupplierInvoice | null>(
    mockEnterpriseSupplierInvoices[1]
  );
  const [threeWayMatchData, setThreeWayMatchData] = useState<ThreeWayMatchRecord>(
    mockThreeWayMatchRecord
  );
  const [apExceptions, setApExceptions] = useState<ApExceptionRecord[]>(mockApExceptions);

  // Filter States for Invoices List
  const [listStatusTab, setListStatusTab] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [supplierFilter, setSupplierFilter] = useState<string>('All');
  const [selectedInvoicesForBatch, setSelectedInvoicesForBatch] = useState<string[]>([]);

  // Create Invoice Form State (STEP-9)
  const [newSupplier, setNewSupplier] = useState<string>('Supreme Polymers India Ltd');
  const [newInvoiceNum, setNewInvoiceNum] = useState<string>('INV-2026-');
  const [newInvoiceDate, setNewInvoiceDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [newDueDate, setNewDueDate] = useState<string>('2026-10-14');
  const [newMatchingOption, setNewMatchingOption] = useState<
    'Attach to PO' | 'Attach to GRN' | 'Match manually' | 'Non-PO'
  >('Attach to PO');
  const [newPoRef, setNewPoRef] = useState<string>('PO-3390');
  const [newGrnRef, setNewGrnRef] = useState<string>('GRN-8812');
  const [newGrossAmount, setNewGrossAmount] = useState<number>(187200);
  const [newTaxAmount, setNewTaxAmount] = useState<number>(16848);

  // Auto-Match Upload Simulation State (STEP-10)
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadConfidenceOcr, setUploadConfidenceOcr] = useState<boolean>(true);
  const [lastUploadBatch, setLastUploadBatch] = useState<{
    batchId: string;
    total: number;
    autoMatched: number;
    withTolerance: number;
    exceptions: number;
  } | null>(null);

  // Manual check variance reason state (STEP-13)
  const [overrideReason, setOverrideReason] = useState<string>(
    'Supplier raw resin surge surcharge approved by Lead Buyer'
  );

  // Calculations for AP Dashboard KPIs (STEP-7)
  const totalOpenAp = enterpriseInvoices.reduce((s, i) => s + i.totalInvoiceAmount, 0);
  const overdueAp = enterpriseInvoices
    .filter((i) => i.status === 'Variance' || i.status === 'Pending Match')
    .reduce((s, i) => s + i.totalInvoiceAmount, 0);
  const pendingMatchCount = enterpriseInvoices.filter(
    (i) => i.matchStatus === 'Variance' || i.matchStatus === 'Exception' || i.matchStatus === 'Not Started'
  ).length;

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return enterpriseInvoices.filter((inv) => {
      const matchSearch =
        inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.poReference && inv.poReference.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchTab =
        listStatusTab === 'All' ||
        inv.status === listStatusTab ||
        inv.matchStatus === listStatusTab;
      const matchSupplier = supplierFilter === 'All' || inv.supplier === supplierFilter;
      return matchSearch && matchTab && matchSupplier;
    });
  }, [enterpriseInvoices, searchTerm, listStatusTab, supplierFilter]);

  // Open 3-Way Match Workspace for an invoice (STEP-13)
  const handleOpen3WayWorkspace = (inv: EnterpriseSupplierInvoice) => {
    setSelectedInvoice(inv);
    setThreeWayMatchData({
      ...mockThreeWayMatchRecord,
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      supplier: inv.supplier,
      invoiceAmount: inv.totalInvoiceAmount,
      matchStatus: inv.matchStatus,
    });
    setApActiveTab('matchWorkspace');
  };

  // Open Audit Drawer (STEP-24)
  const handleOpenAudit = (inv: EnterpriseSupplierInvoice) => {
    openDrawer(
      `AP Audit Trail: ${inv.invoiceNumber}`,
      <FinanceAuditDrawer
        title="Supplier Invoice & 3-Way Match Audit"
        documentNumber={inv.invoiceNumber}
        auditTrail={inv.auditTrail}
        onClose={closeDrawer}
      />
    );
  };

  // Handle Auto-Match Upload Simulation (STEP-10)
  const handleSimulateAutoMatchUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      const batchResult = {
        batchId: `BATCH-AUTO-${Math.floor(1000 + Math.random() * 9000)}`,
        total: 4,
        autoMatched: 2,
        withTolerance: 1,
        exceptions: 1,
      };
      setLastUploadBatch(batchResult);

      const uploadedInvoice: EnterpriseSupplierInvoice = {
        id: `SUP-INV-${Date.now()}`,
        invoiceNumber: `OCR-INV-${Math.floor(10000 + Math.random() * 90000)}`,
        supplier: 'Supreme Polymers India Ltd',
        invoiceDate: new Date().toISOString().slice(0, 10),
        dueDate: '2026-10-25',
        currency: 'INR (₹)',
        exchangeRate: 1.0,
        entity: 'Reboot Manufacturing Corp (Plant 01)',
        paymentTerms: 'Net 30 Days',
        paymentMethod: 'RTGS',
        supplierBankAccount: 'HDFC Bank - 008920001928',
        taxInvoiceNumber: `TAX-OCR-${Date.now()}`,
        totalInvoiceAmount: 98000,
        taxAmount: 8820,
        freightAmount: 0,
        otherCharges: 0,
        matchedAmount: 98000,
        varianceAmount: 0,
        poReference: 'PO-3390',
        grnReference: 'GRN-8812',
        matchStatus: 'Auto-Matched',
        approvalStatus: 'Approved',
        paymentStatus: 'Unpaid',
        status: 'Auto-Matched',
        ocrConfidence: 99.1,
        ocrExtracted: true,
        attachments: ['Uploaded_Batch_Scanned.pdf'],
        lineItems: [
          {
            lineNo: 1,
            itemCode: 'RM-PP-001',
            description: 'Polypropylene Granules Injection Grade',
            quantity: 1200,
            uom: 'KG',
            unitPrice: 78.0,
            taxCode: 'GST-18%',
            costCenter: 'CC-WH-01',
            glAccount: '1310',
            amount: 93600,
          },
        ],
        auditTrail: [
          {
            id: `AUD-${Date.now()}`,
            timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
            action: 'Auto-Match Upload Executed',
            actor: 'AI OCR Parser v3.1',
            role: 'Admin',
            notes: 'AI OCR matched line items, tax totals, and supplier bank records against PO-3390 and GRN-8812.',
          },
        ],
      };

      setEnterpriseInvoices([uploadedInvoice, ...enterpriseInvoices]);
      showToast(`Auto-Match Completed: Batch ${batchResult.batchId} processed with 99.1% OCR confidence.`);
    }, 1200);
  };

  // Handle Create Invoice Submission (STEP-9)
  const handleCreateSupplierInvoice = () => {
    const createdInv: EnterpriseSupplierInvoice = {
      id: `SUP-INV-${Date.now()}`,
      invoiceNumber: newInvoiceNum || `INV-${Date.now()}`,
      supplier: newSupplier,
      invoiceDate: newInvoiceDate,
      dueDate: newDueDate,
      currency: 'INR (₹)',
      exchangeRate: 1.0,
      entity: 'Reboot Manufacturing Corp (Plant 01)',
      paymentTerms: 'Net 30 Days',
      paymentMethod: 'Bank Wire',
      supplierBankAccount: 'HDFC Corporate Current - 008920001928',
      taxInvoiceNumber: `TAX-${newInvoiceNum}`,
      totalInvoiceAmount: newGrossAmount + newTaxAmount,
      taxAmount: newTaxAmount,
      freightAmount: 0,
      otherCharges: 0,
      matchedAmount: newGrossAmount,
      varianceAmount: 0,
      poReference: newMatchingOption === 'Non-PO' ? undefined : newPoRef,
      grnReference: newMatchingOption === 'Attach to GRN' || newMatchingOption === 'Attach to PO' ? newGrnRef : undefined,
      matchStatus: newMatchingOption === 'Non-PO' ? 'Matched' : 'Auto-Matched',
      approvalStatus: 'Pending',
      paymentStatus: 'Unpaid',
      status: 'Pending Approval',
      ocrConfidence: 100,
      ocrExtracted: false,
      attachments: ['Direct_Invoice_Manual.pdf'],
      lineItems: [
        {
          lineNo: 1,
          itemCode: 'RM-GEN-01',
          description: 'Supplier Direct Deliverable',
          quantity: 1,
          uom: 'LOT',
          unitPrice: newGrossAmount,
          taxCode: 'GST-18%',
          costCenter: 'CC-WH-01',
          glAccount: '1310',
          amount: newGrossAmount,
        },
      ],
      auditTrail: [
        {
          id: `AUD-CR-${Date.now()}`,
          timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
          action: 'Created Supplier Invoice',
          actor: 'AP Accountant',
          role: 'AP Accountant',
          notes: `Created via option: ${newMatchingOption}`,
        },
      ],
    };

    setEnterpriseInvoices([createdInv, ...enterpriseInvoices]);
    showToast(`Supplier Invoice ${createdInv.invoiceNumber} created and routed for 3-Way verification.`);
    setApActiveTab('invoicesList');
  };

  // Manual Override in 3-Way Match Workspace (STEP-13)
  const handleAuthorizeVariance = () => {
    if (!selectedInvoice) return;
    const updated = enterpriseInvoices.map((inv) => {
      if (inv.id === selectedInvoice.id) {
        return {
          ...inv,
          matchStatus: 'Manually Overridden' as ThreeWayMatchStatus,
          status: 'Approved' as SupplierInvoiceStatus,
          approvalStatus: 'Approved' as const,
          auditTrail: [
            ...inv.auditTrail,
            {
              id: `AUD-OVR-${Date.now()}`,
              timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
              action: 'Variance Authorized via Manual Check',
              actor: 'Sunita Sharma',
              role: 'Controller/CFO' as const,
              notes: `Manual check override authorized. Reason: ${overrideReason}`,
            },
          ],
        };
      }
      return inv;
    });

    setEnterpriseInvoices(updated);
    showToast(`Variance authorized for ${selectedInvoice.invoiceNumber}. Segregation of duties recorded.`);
    setApActiveTab('invoicesList');
  };

  // Helper for 3-Way Match Status Badge (STEP-22)
  const getMatchStatusBadge = (status: ThreeWayMatchStatus) => {
    switch (status) {
      case 'Auto-Matched':
      case 'Matched':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Matched
          </span>
        );
      case 'Variance':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-amber-600" /> Variance
          </span>
        );
      case 'Exception':
      case 'Blocked':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-600" /> Exception
          </span>
        );
      case 'Manually Overridden':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-purple-600" /> Overridden
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Banner (STEP-7) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white rounded-2xl p-5 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-bold uppercase rounded-md tracking-wider">
              Procure-to-Pay Subsystem
            </span>
            <span className="text-xs text-slate-300">Automated 3-Way Match &bull; PO &plus; GRN &plus; Invoice</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2.5">
            <Receipt className="w-6 h-6 text-teal-400" />
            Accounts Payable & 3-Way Matching
          </h1>
          <p className="text-xs text-slate-400">
            Automated line-level verification, tolerance control, duplicate detection, and manual review workspaces.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setApActiveTab('autoMatchUpload')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs rounded-xl shadow-sm transition"
          >
            <Upload className="w-4 h-4" />
            + Auto-Match Upload
          </button>
          <button
            type="button"
            onClick={() => setApActiveTab('createInvoice')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium rounded-xl transition"
          >
            <Plus className="w-4 h-4 text-teal-400" />
            Manual Invoice
          </button>
          <button
            type="button"
            onClick={() => setApActiveTab('exceptions')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-950/60 hover:bg-rose-900/60 text-rose-200 border border-rose-800/60 text-xs font-medium rounded-xl transition"
          >
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            Exceptions ({apExceptions.length})
          </button>
        </div>
      </div>

      {/* Primary Subsystem Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto">
        <button
          type="button"
          onClick={() => setApActiveTab('dashboard')}
          className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition border-b-2 flex items-center gap-2 ${
            apActiveTab === 'dashboard'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          AP Dashboard & KPIs
        </button>
        <button
          type="button"
          onClick={() => setApActiveTab('invoicesList')}
          className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition border-b-2 flex items-center gap-2 ${
            apActiveTab === 'invoicesList'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Supplier Invoices ({enterpriseInvoices.length})
        </button>
        <button
          type="button"
          onClick={() => setApActiveTab('autoMatchUpload')}
          className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition border-b-2 flex items-center gap-2 ${
            apActiveTab === 'autoMatchUpload'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          Auto-Match Engine (PO + GRN + Inv)
        </button>
        <button
          type="button"
          onClick={() => setApActiveTab('matchWorkspace')}
          className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition border-b-2 flex items-center gap-2 ${
            apActiveTab === 'matchWorkspace'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Split className="w-3.5 h-3.5" />
          3-Way Match Workspace & Manual Check
        </button>
        <button
          type="button"
          onClick={() => setApActiveTab('exceptions')}
          className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition border-b-2 flex items-center gap-2 ${
            apActiveTab === 'exceptions'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          AP Exceptions ({apExceptions.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: AP DASHBOARD (STEP-7) */}
      {/* ========================================================================= */}
      {apActiveTab === 'dashboard' && (
        <div className="space-y-6">
          {/* STEP-7: 10 KPI CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Open AP</span>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">₹{totalOpenAp.toLocaleString()}</div>
              <span className="text-[10px] text-slate-500 font-medium">3 active suppliers</span>
            </div>
            <div className="p-3.5 bg-white rounded-xl border border-rose-200 bg-rose-50/30 shadow-xs">
              <span className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider block">Overdue AP</span>
              <div className="text-xl font-bold font-mono text-rose-900 mt-1">₹{overdueAp.toLocaleString()}</div>
              <span className="text-[10px] text-rose-700 font-medium">Attention Required</span>
            </div>
            <div className="p-3.5 bg-white rounded-xl border border-amber-200 bg-amber-50/30 shadow-xs">
              <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block">Pending Match</span>
              <div className="text-xl font-bold text-amber-900 mt-1">{pendingMatchCount}</div>
              <span className="text-[10px] text-amber-700 font-medium">1 price variance</span>
            </div>
            <div className="p-3.5 bg-white rounded-xl border border-teal-200 bg-teal-50/20 shadow-xs">
              <span className="text-[11px] font-semibold text-teal-800 uppercase tracking-wider block">Early Discount Savings</span>
              <div className="text-xl font-bold font-mono text-teal-950 mt-1">₹3,744.00</div>
              <span className="text-[10px] text-emerald-600 font-bold">2% if paid in 10 days</span>
            </div>
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Avg Payment Days (DPO)</span>
              <div className="text-xl font-bold text-slate-900 mt-1">28.4 Days</div>
              <span className="text-[10px] text-emerald-600 font-medium">Target &lt;30 days</span>
            </div>
          </div>

          {/* Conditional Alerts (STEP-7) */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-amber-900">3-Way Match Tolerances & Exceptions Alert</h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  &bull; <strong>Masterbatch Colorants Pvt Ltd:</strong> Unit price ₹275.00 billed exceeds PO contracted rate of ₹255.00 by +7.84% (Max allowed ±1.0%).<br />
                  &bull; <strong>Precision Tooling & Molds:</strong> Invoice received but QA inspection for cavity inserts is still pending in Goods Inward.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setApActiveTab('exceptions')}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium shrink-0 shadow-xs transition"
            >
              Inspect Exceptions
            </button>
          </div>

          {/* Widgets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">AP Aging Buckets</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-600">Current (Not Due)</span>
                  <span className="font-mono font-bold text-emerald-700">₹2,04,048 (47.3%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '47.3%' }} />
                </div>
                <div className="flex justify-between text-[11px] pt-1">
                  <span className="text-slate-600">1 - 30 Days</span>
                  <span className="font-mono font-bold text-amber-700">₹1,49,112 (34.6%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '34.6%' }} />
                </div>
                <div className="flex justify-between text-[11px] pt-1">
                  <span className="text-slate-600">31 - 60 Days</span>
                  <span className="font-mono font-bold text-rose-700">₹78,400 (18.1%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: '18.1%' }} />
                </div>
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">3-Way Match Funnel & Ratio</h3>
              <div className="grid grid-cols-3 gap-2 text-center pt-2">
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase block">Auto-Matched</span>
                  <span className="text-lg font-bold text-emerald-900">75%</span>
                  <span className="text-[9px] text-emerald-700 block">No Touch</span>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <span className="text-[10px] text-amber-800 font-bold uppercase block">Variance Review</span>
                  <span className="text-lg font-bold text-amber-900">15%</span>
                  <span className="text-[9px] text-amber-700 block">Within tolerance</span>
                </div>
                <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
                  <span className="text-[10px] text-rose-800 font-bold uppercase block">Exceptions</span>
                  <span className="text-lg font-bold text-rose-900">10%</span>
                  <span className="text-[9px] text-rose-700 block">Buyer review</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SUPPLIER INVOICE LIST (STEP-8) */}
      {/* ========================================================================= */}
      {apActiveTab === 'invoicesList' && (
        <div className="space-y-4">
          {/* Sub-status filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {['All', 'Auto-Matched', 'Variance', 'Pending Match', 'Pending Approval', 'Approved'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setListStatusTab(tab)}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  listStatusTab === tab
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Filters Bar */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Invoice #, Supplier, PO #..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <select
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700"
              >
                <option value="All">All Suppliers</option>
                <option value="Supreme Polymers India Ltd">Supreme Polymers</option>
                <option value="Masterbatch Colorants Pvt Ltd">Masterbatch Colorants</option>
                <option value="Precision Tooling & Molds LLP">Precision Tooling</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const csv =
                    'Invoice #,Supplier,PO Ref,GRN Ref,Date,Due Date,Amount,Tax,Match Status\n' +
                    filteredInvoices
                      .map(
                        (i) =>
                          `"${i.invoiceNumber}","${i.supplier}","${i.poReference || ''}","${i.grnReference || ''}","${i.invoiceDate}","${i.dueDate}",${i.totalInvoiceAmount},${i.taxAmount},"${i.matchStatus}"`
                      )
                      .join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'AP_Supplier_Invoices.csv';
                  a.click();
                  showToast('Exported AP Invoices CSV.');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 text-xs font-medium"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Invoices Table (STEP-8) */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                    <th className="p-3 w-8">
                      <input
                        type="checkbox"
                        className="rounded text-teal-600"
                        onChange={(e) => {
                          if (e.target.checked) setSelectedInvoicesForBatch(filteredInvoices.map((i) => i.id));
                          else setSelectedInvoicesForBatch([]);
                        }}
                      />
                    </th>
                    <th className="p-3">Invoice #</th>
                    <th className="p-3">Supplier Name</th>
                    <th className="p-3">PO Reference</th>
                    <th className="p-3">GRN Reference</th>
                    <th className="p-3">Invoice Date</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3 text-right">Gross Amount (₹)</th>
                    <th className="p-3 text-center">3-Way Match Status</th>
                    <th className="p-3 text-center">OCR Score</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedInvoicesForBatch.includes(inv.id)}
                          onChange={() => {
                            if (selectedInvoicesForBatch.includes(inv.id)) {
                              setSelectedInvoicesForBatch(selectedInvoicesForBatch.filter((id) => id !== inv.id));
                            } else {
                              setSelectedInvoicesForBatch([...selectedInvoicesForBatch, inv.id]);
                            }
                          }}
                          className="rounded text-teal-600"
                        />
                      </td>
                      <td className="p-3 font-mono font-bold text-teal-700">
                        <button
                          type="button"
                          onClick={() => handleOpen3WayWorkspace(inv)}
                          className="hover:underline flex items-center gap-1"
                        >
                          {inv.invoiceNumber}
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </button>
                      </td>
                      <td className="p-3 font-semibold text-slate-900">{inv.supplier}</td>
                      <td className="p-3 font-mono text-slate-600">{inv.poReference || '—'}</td>
                      <td className="p-3 font-mono text-slate-600">{inv.grnReference || 'Pending GRN'}</td>
                      <td className="p-3 text-slate-600 font-mono text-[11px]">{inv.invoiceDate}</td>
                      <td className="p-3 text-slate-600 font-mono text-[11px]">{inv.dueDate}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        ₹{inv.totalInvoiceAmount.toLocaleString()}
                      </td>
                      <td className="p-3 text-center">{getMatchStatusBadge(inv.matchStatus)}</td>
                      <td className="p-3 text-center">
                        <span className="font-mono text-[11px] px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-bold">
                          {inv.ocrConfidence}%
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpen3WayWorkspace(inv)}
                            className="p-1 hover:bg-teal-50 text-teal-700 rounded transition"
                            title="Inspect 3-Way Match"
                          >
                            <Split className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenAudit(inv)}
                            className="p-1 hover:bg-slate-100 text-slate-500 rounded transition"
                            title="Audit Log"
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
      {/* TAB 3: AUTO-MATCH UPLOAD & EXTRACTION (STEP-10 & STEP-11) */}
      {/* ========================================================================= */}
      {apActiveTab === 'autoMatchUpload' && (
        <div className="space-y-5">
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Automated 3-Way Match Intake Engine (PO + GRN + Invoice)
              </h3>
              <p className="text-xs text-slate-500">
                Upload supplier invoice documents or batch bundles. System performs OCR extraction and runs 3-way line matching against ERP PO and Warehouse GRN records.
              </p>
            </div>

            {/* Drag and Drop Zone (STEP-10) */}
            <div className="border-2 border-dashed border-teal-300 bg-teal-50/20 rounded-2xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-700 mx-auto flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">
                  Drag & Drop Supplier Invoices or Invoice Bundles
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Supported formats: PDF, TIFF, XML / EDI, CSV, Excel. Max batch size 25 MB.
                </p>
              </div>

              <div className="flex items-center justify-center gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={uploadConfidenceOcr}
                    onChange={(e) => setUploadConfidenceOcr(e.target.checked)}
                    className="rounded text-teal-600"
                  />
                  <span>AI OCR Confidence Engine (95% Threshold)</span>
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={handleSimulateAutoMatchUpload}
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-xl shadow-sm transition inline-flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Parsing OCR & Matching Lines...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload & Execute Auto-Match
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Match Rules & Tolerances Info (STEP-11) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800 block text-[11px]">Price Tolerance Rule</span>
                <p className="text-slate-600 text-[11px]">
                  Governed at ±1% or max ₹500.00 difference. Beyond this threshold requires Lead Buyer or Controller approval.
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800 block text-[11px]">Quantity Tolerance Rule</span>
                <p className="text-slate-600 text-[11px]">
                  0% tolerance for discrete mold parts. Invoiced quantity cannot exceed accepted Warehouse GRN count.
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800 block text-[11px]">Tax & Rounding Rule</span>
                <p className="text-slate-600 text-[11px]">
                  GSTIN validation against master. Maximum ₹1.00 rounding discrepancy automatically absorbed.
                </p>
              </div>
            </div>

            {/* Batch Result (post-upload - STEP-10) */}
            {lastUploadBatch && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 text-xs">
                    Batch Result: {lastUploadBatch.batchId}
                  </span>
                  <span className="text-xs text-emerald-700 font-mono">Processed Just Now</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono font-bold">
                  <div className="p-2 bg-white rounded border border-emerald-200 text-slate-800">
                    Total: {lastUploadBatch.total}
                  </div>
                  <div className="p-2 bg-white rounded border border-emerald-200 text-emerald-700">
                    Auto-Matched: {lastUploadBatch.autoMatched}
                  </div>
                  <div className="p-2 bg-white rounded border border-amber-200 text-amber-700">
                    With Tolerance: {lastUploadBatch.withTolerance}
                  </div>
                  <div className="p-2 bg-white rounded border border-rose-200 text-rose-700">
                    Exceptions: {lastUploadBatch.exceptions}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: 3-WAY MATCH WORKSPACE & MANUAL CHECK (STEP-13) */}
      {/* ========================================================================= */}
      {apActiveTab === 'matchWorkspace' && (
        <div className="space-y-5">
          {/* Header Summary */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">{threeWayMatchData.invoiceNumber}</span>
                <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-semibold text-slate-700">
                  {threeWayMatchData.supplier}
                </span>
                {getMatchStatusBadge(threeWayMatchData.matchStatus)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Invoice Total: <strong>₹{threeWayMatchData.invoiceAmount.toLocaleString()}</strong> &bull; Tolerance Status: {threeWayMatchData.toleranceStatus}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setApActiveTab('invoicesList')}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 text-xs font-medium"
              >
                Back to List
              </button>
              <button
                type="button"
                onClick={handleAuthorizeVariance}
                className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold shadow-xs transition"
              >
                Authorize & Approve Variance
              </button>
            </div>
          </div>

          {/* Three-Panel Side-by-Side Comparison Layout (STEP-13) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {/* Panel 1: Purchase Order */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-800 uppercase text-[10px] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-teal-600" />
                  1. Purchase Order (PO)
                </span>
                <span className="font-mono text-[10px] text-teal-700 font-bold">{threeWayMatchData.po.poNumber}</span>
              </div>
              <div className="space-y-1 text-[11px] text-slate-600">
                <div>Contracted Supplier: <strong>{threeWayMatchData.po.supplier}</strong></div>
                <div>PO Date: {threeWayMatchData.po.poDate} &bull; Terms: {threeWayMatchData.po.paymentTerms}</div>
                <div>Ordered: <strong>500 KG</strong> @ <strong>₹255.00/KG</strong></div>
                <div className="font-bold text-slate-900 pt-1">Total PO Net: ₹1,27,500.00</div>
              </div>
            </div>

            {/* Panel 2: Goods Receipt Note */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-800 uppercase text-[10px] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  2. Goods Receipt Note (GRN)
                </span>
                <span className="font-mono text-[10px] text-emerald-700 font-bold">{threeWayMatchData.grn.grnNumber}</span>
              </div>
              <div className="space-y-1 text-[11px] text-slate-600">
                <div>Received Date: {threeWayMatchData.grn.grnDate}</div>
                <div>Accepted: <strong>500 KG</strong> (Rejected: 0 KG)</div>
                <div>Batch/Lot: <span className="font-mono">{threeWayMatchData.grn.batchLot}</span></div>
                <div>Inspector: {threeWayMatchData.grn.inspector}</div>
                <div className="font-bold text-emerald-700 pt-1">Status: Accepted in Full</div>
              </div>
            </div>

            {/* Panel 3: Supplier Invoice */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-800 uppercase text-[10px] flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-indigo-600" />
                  3. Supplier Invoice
                </span>
                <span className="font-mono text-[10px] text-indigo-700 font-bold">{threeWayMatchData.invoice.invoiceNumber}</span>
              </div>
              <div className="space-y-1 text-[11px] text-slate-600">
                <div>Invoice Date: {threeWayMatchData.invoice.invoiceDate}</div>
                <div>Billed: <strong>500 KG</strong> @ <strong className="text-rose-700 font-bold">₹275.00/KG</strong></div>
                <div>Tax: ₹24,750 &bull; Freight: ₹1,500</div>
                <div className="font-bold text-slate-900 pt-1">Total Billed: ₹1,49,112.00</div>
              </div>
            </div>
          </div>

          {/* Line Matching Table with Manual Check Actions (STEP-13) */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs space-y-3 p-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Line Matching & Tolerance Variance Inspection
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                    <th className="p-2.5">Item Description</th>
                    <th className="p-2.5 text-right">PO Qty</th>
                    <th className="p-2.5 text-right">GRN Qty</th>
                    <th className="p-2.5 text-right">Inv Qty</th>
                    <th className="p-2.5 text-right">PO Price (₹)</th>
                    <th className="p-2.5 text-right">Inv Price (₹)</th>
                    <th className="p-2.5 text-right">Price Variance</th>
                    <th className="p-2.5 text-center">Match Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {threeWayMatchData.linesComparison.map((line, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-2.5 font-semibold text-slate-900">{line.item}</td>
                      <td className="p-2.5 text-right font-mono text-slate-700">{line.poQty} KG</td>
                      <td className="p-2.5 text-right font-mono text-slate-700">{line.grnQty} KG</td>
                      <td className="p-2.5 text-right font-mono text-slate-700">{line.invoiceQty} KG</td>
                      <td className="p-2.5 text-right font-mono text-slate-700">₹{line.poPrice.toFixed(2)}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-rose-700">₹{line.invoicePrice.toFixed(2)}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-rose-700">
                        +₹{line.priceVariance.toFixed(2)}/KG (+7.8%)
                      </td>
                      <td className="p-2.5 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                          Price Variance
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Manual Check & Override Controls (STEP-13) */}
            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2 text-xs">
              <span className="font-bold text-amber-900 block text-[11px] uppercase">
                Manual Check / Variance Resolution Options
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Variance Rationale Reason Code</label>
                  <select
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs"
                  >
                    <option value="Supplier raw resin surge surcharge approved by Lead Buyer">
                      Price Increase Approved by Buyer
                    </option>
                    <option value="Freight and cartage bundled in unit rate">
                      Freight Included in Line Rate
                    </option>
                    <option value="Currency exchange rate fluctuation">
                      Foreign Exchange Fluctuation
                    </option>
                    <option value="Debit Note requested from Vendor">
                      Vendor Credit Note Requested (Hold Difference)
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Supervisor Authorization Stamp</label>
                  <input
                    type="text"
                    readOnly
                    value="Controller Clearance: Sunita Sharma (Max Limit ₹5,00,000)"
                    className="w-full p-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-600 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: AP EXCEPTIONS RESOLUTION WORKSPACE (STEP-14) */}
      {/* ========================================================================= */}
      {apActiveTab === 'exceptions' && (
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900">AP Exception Resolution Center</h3>
              <p className="text-xs text-slate-500">
                12 Exception categories: Missing PO, Missing GRN, Price & Quantity variances, Tax mismatches, and Duplicate invoices.
              </p>
            </div>
            <span className="px-3 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-full font-bold text-xs">
              {apExceptions.length} Active Exceptions
            </span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <th className="p-3">Exception ID</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Invoice #</th>
                  <th className="p-3">Supplier</th>
                  <th className="p-3 text-right">Variance Amount (₹)</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3">Assigned Owner</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {apExceptions.map((exc) => (
                  <tr key={exc.exceptionId} className="hover:bg-slate-50/60">
                    <td className="p-3 font-mono font-bold text-teal-700">{exc.exceptionId}</td>
                    <td className="p-3 font-semibold text-slate-900">{exc.exceptionType}</td>
                    <td className="p-3 font-mono text-slate-700">{exc.invoiceNumber}</td>
                    <td className="p-3 text-slate-700">{exc.supplier}</td>
                    <td className="p-3 text-right font-mono font-bold text-rose-700">
                      ₹{exc.varianceAmount.toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          exc.severity === 'Critical'
                            ? 'bg-rose-100 text-rose-800'
                            : exc.severity === 'High'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {exc.severity}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{exc.assignedTo}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-medium text-slate-700">
                        {exc.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          showToast(`Routing resolution for ${exc.exceptionId} to ${exc.assignedTo}`);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition"
                      >
                        Resolve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: CREATE SUPPLIER INVOICE (STEP-9) */}
      {/* ========================================================================= */}
      {apActiveTab === 'createInvoice' && (
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Create / Enter Supplier Invoice</h3>
              <p className="text-xs text-slate-500">
                Manual invoice entry with PO linking, GRN attachment, and line-item tax breakdown.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setApActiveTab('invoicesList')}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateSupplierInvoice}
                className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg shadow-xs"
              >
                Save & Route for 3-Way Match
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Supplier *</label>
              <select
                value={newSupplier}
                onChange={(e) => setNewSupplier(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg bg-white"
              >
                <option value="Supreme Polymers India Ltd">Supreme Polymers India Ltd</option>
                <option value="Masterbatch Colorants Pvt Ltd">Masterbatch Colorants Pvt Ltd</option>
                <option value="Precision Tooling & Molds LLP">Precision Tooling & Molds LLP</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Invoice Number *</label>
              <input
                type="text"
                value={newInvoiceNum}
                onChange={(e) => setNewInvoiceNum(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Matching Mode *</label>
              <select
                value={newMatchingOption}
                onChange={(e) => setNewMatchingOption(e.target.value as any)}
                className="w-full p-2 border border-slate-200 rounded-lg bg-white font-semibold text-teal-800"
              >
                <option value="Attach to PO">Attach to PO</option>
                <option value="Attach to GRN">Attach to GRN</option>
                <option value="Match manually">Match Manually</option>
                <option value="Non-PO">Non-PO Direct Expense</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Invoice Date *</label>
              <input
                type="date"
                value={newInvoiceDate}
                onChange={(e) => setNewInvoiceDate(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Due Date *</label>
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Gross Invoice Amount (₹) *</label>
              <input
                type="number"
                value={newGrossAmount}
                onChange={(e) => setNewGrossAmount(parseFloat(e.target.value) || 0)}
                className="w-full p-2 border border-slate-200 rounded-lg font-mono font-bold"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
