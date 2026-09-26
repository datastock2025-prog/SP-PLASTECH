import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Sparkles,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Eye,
  Maximize2,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Download,
  DollarSign,
  Layers,
  Building,
  Truck,
  RefreshCw,
  Plus,
  HelpCircle,
  Lock,
  CornerDownRight,
  Check,
  X,
  Sliders,
  FileCheck,
} from 'lucide-react';

export interface BoundingBox {
  id: string;
  fieldKey: string;
  label: string;
  x: number; // percentage from left (0 - 100)
  y: number; // percentage from top (0 - 100)
  width: number; // percentage
  height: number; // percentage
  page: number;
}

export interface InvoiceLineItem {
  id: string;
  itemCode: string;
  itemName: string;
  poQty: number;
  grnQty: number;
  invQty: number;
  uom: string;
  poRate: number;
  invRate: number;
  status: 'MATCH' | 'TOLERANCE_WARNING' | 'MISMATCH_BLOCKER';
  varianceQty: number;
  varianceAmount: number;
  tolerancePct: number;
  discrepancyReason?: string;
  resolvedResolution?: string;
  bboxId?: string;
}

export interface OcrInvoiceDocument {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  vendorName: string;
  vendorGstin: string;
  vendorAddress: string;
  placeOfSupply: string;
  linkedPoNumber: string;
  linkedGrnNumber: string;
  totalAmount: number;
  subtotal: number;
  taxAmount: number;
  confidenceScore: number; // 0 - 100
  status: 'PENDING_REVIEW' | 'AUTO_MATCHED' | 'POSTED_TO_LEDGER' | 'REJECTED' | 'UNDER_CORRECTION';
  type: 'INWARD_PURCHASE' | 'OUTWARD_SALES';
  fileUrl?: string;
  lineItems: InvoiceLineItem[];
  boundingBoxes: Record<string, BoundingBox>;
}

interface InvoiceOcrVerificationWorkspaceProps {
  initialInvoiceId?: string;
  mode?: 'INWARD_PURCHASE' | 'OUTWARD_SALES';
  onNavigate?: (view: string, param?: any) => void;
  onPostToLedger?: (invoice: OcrInvoiceDocument) => void;
  onRejectInvoice?: (invoice: OcrInvoiceDocument, reason: string) => void;
  showToast: (msg: string) => void;
}

// Sample Curated Plastics Manufacturing ERP Invoices for Live Demonstration
const SAMPLE_INVOICES: OcrInvoiceDocument[] = [
  {
    id: 'INV-DOC-001',
    invoiceNumber: 'INV-9988',
    invoiceDate: '2026-09-24',
    vendorName: 'ABC Polymers India Ltd',
    vendorGstin: '27AABCU9603R1ZP',
    vendorAddress: 'Plot 42, MIDC Chakan Phase-2, Pune, Maharashtra - 410501',
    placeOfSupply: 'Maharashtra (27)',
    linkedPoNumber: 'PO-2026-089',
    linkedGrnNumber: 'GRN-2026-054',
    totalAmount: 124500,
    subtotal: 105508,
    taxAmount: 18992,
    confidenceScore: 98,
    status: 'PENDING_REVIEW',
    type: 'INWARD_PURCHASE',
    lineItems: [
      {
        id: 'li-1',
        itemCode: 'RM-PP-001',
        itemName: 'Polypropylene Homopolymer (Injection Grade H110MA)',
        poQty: 1000,
        grnQty: 995,
        invQty: 1000,
        uom: 'KG',
        poRate: 110,
        invRate: 110,
        status: 'MISMATCH_BLOCKER',
        varianceQty: 5,
        varianceAmount: 550,
        tolerancePct: 0.5,
        discrepancyReason: 'Invoice billed 1000 KG, but warehouse accepted 995 KG (5 KG shortage in transit / moisture variance).',
        bboxId: 'bbox-line-1',
      },
      {
        id: 'li-2',
        itemCode: 'MB-BL-005',
        itemName: 'Pharma Blue Color Masterbatch (USP Class VI / DMF)',
        poQty: 50,
        grnQty: 50,
        invQty: 50,
        uom: 'KG',
        poRate: 290,
        invRate: 290,
        status: 'MATCH',
        varianceQty: 0,
        varianceAmount: 0,
        tolerancePct: 0,
        bboxId: 'bbox-line-2',
      },
    ],
    boundingBoxes: {
      invoiceNo: { id: 'bbox-inv-no', fieldKey: 'invoiceNo', label: 'Invoice #', x: 70, y: 14, width: 22, height: 4, page: 1 },
      invoiceDate: { id: 'bbox-inv-date', fieldKey: 'invoiceDate', label: 'Date', x: 70, y: 19, width: 22, height: 4, page: 1 },
      vendorName: { id: 'bbox-vendor', fieldKey: 'vendorName', label: 'Vendor Name', x: 8, y: 12, width: 45, height: 5, page: 1 },
      vendorGstin: { id: 'bbox-gstin', fieldKey: 'vendorGstin', label: 'Vendor GSTIN', x: 8, y: 22, width: 35, height: 4, page: 1 },
      poRef: { id: 'bbox-po-ref', fieldKey: 'poRef', label: 'PO Reference', x: 8, y: 32, width: 35, height: 4, page: 1 },
      totalAmount: { id: 'bbox-total', fieldKey: 'totalAmount', label: 'Total Amount', x: 68, y: 78, width: 25, height: 5, page: 1 },
      'bbox-line-1': { id: 'bbox-line-1', fieldKey: 'lineItem_0', label: 'RM-PP-001 Row', x: 6, y: 46, width: 88, height: 6, page: 1 },
      'bbox-line-2': { id: 'bbox-line-2', fieldKey: 'lineItem_1', label: 'MB-BL-005 Row', x: 6, y: 53, width: 88, height: 6, page: 1 },
    },
  },
  {
    id: 'INV-DOC-002',
    invoiceNumber: 'INV-8840',
    invoiceDate: '2026-09-22',
    vendorName: 'Supreme Masterbatches & Additives Ltd',
    vendorGstin: '33AABCS1234F1ZN',
    vendorAddress: 'SIPCOT Industrial Complex, Hosur, Tamil Nadu - 635126',
    placeOfSupply: 'Tamil Nadu (33)',
    linkedPoNumber: 'PO-2026-074',
    linkedGrnNumber: 'GRN-2026-049',
    totalAmount: 486000,
    subtotal: 411864,
    taxAmount: 74136,
    confidenceScore: 99,
    status: 'AUTO_MATCHED',
    type: 'INWARD_PURCHASE',
    lineItems: [
      {
        id: 'li-201',
        itemCode: 'HD-BLW-02',
        itemName: 'High Density Polyethylene Blow Grade B56003',
        poQty: 4000,
        grnQty: 4000,
        invQty: 4000,
        uom: 'KG',
        poRate: 98,
        invRate: 98,
        status: 'MATCH',
        varianceQty: 0,
        varianceAmount: 0,
        tolerancePct: 0,
        bboxId: 'bbox-line-201',
      },
      {
        id: 'li-202',
        itemCode: 'ADD-UV-01',
        itemName: 'HALS UV Stabilizer Masterbatch (Automotive Grade)',
        poQty: 200,
        grnQty: 200,
        invQty: 200,
        uom: 'KG',
        poRate: 470,
        invRate: 470,
        status: 'MATCH',
        varianceQty: 0,
        varianceAmount: 0,
        tolerancePct: 0,
        bboxId: 'bbox-line-202',
      },
    ],
    boundingBoxes: {
      invoiceNo: { id: 'bbox-inv-no-2', fieldKey: 'invoiceNo', label: 'Invoice #', x: 72, y: 14, width: 20, height: 4, page: 1 },
      invoiceDate: { id: 'bbox-inv-date-2', fieldKey: 'invoiceDate', label: 'Date', x: 72, y: 19, width: 20, height: 4, page: 1 },
      vendorName: { id: 'bbox-vendor-2', fieldKey: 'vendorName', label: 'Vendor Name', x: 8, y: 12, width: 45, height: 5, page: 1 },
      vendorGstin: { id: 'bbox-gstin-2', fieldKey: 'vendorGstin', label: 'Vendor GSTIN', x: 8, y: 22, width: 35, height: 4, page: 1 },
      poRef: { id: 'bbox-po-ref-2', fieldKey: 'poRef', label: 'PO Reference', x: 8, y: 32, width: 35, height: 4, page: 1 },
      totalAmount: { id: 'bbox-total-2', fieldKey: 'totalAmount', label: 'Total Amount', x: 68, y: 78, width: 25, height: 5, page: 1 },
      'bbox-line-201': { id: 'bbox-line-201', fieldKey: 'lineItem_0', label: 'HD-BLW-02 Row', x: 6, y: 46, width: 88, height: 6, page: 1 },
      'bbox-line-202': { id: 'bbox-line-202', fieldKey: 'lineItem_1', label: 'ADD-UV-01 Row', x: 6, y: 53, width: 88, height: 6, page: 1 },
    },
  },
  {
    id: 'INV-DOC-003',
    invoiceNumber: 'EINV-2026-081',
    invoiceDate: '2026-09-25',
    vendorName: 'SP-PLASTECH Plant 01 (Outward Commercial)',
    vendorGstin: '33AABCS8810K1ZM',
    vendorAddress: 'Plot 18, SIDCO Phase 1, Hosur, Tamil Nadu',
    placeOfSupply: 'Tamil Nadu (33) -> Maruti Suzuki / Tata Tier-1',
    linkedPoNumber: 'SO-2026-1234',
    linkedGrnNumber: 'DISP-CHALLAN-901',
    totalAmount: 385000,
    subtotal: 326271,
    taxAmount: 58729,
    confidenceScore: 97,
    status: 'PENDING_REVIEW',
    type: 'OUTWARD_SALES',
    lineItems: [
      {
        id: 'li-301',
        itemCode: 'FG-CTN-500',
        itemName: '500ml Precision Molded Container Base',
        poQty: 5000,
        grnQty: 5000, // Dispatch Qty
        invQty: 5000,
        uom: 'PCS',
        poRate: 35,
        invRate: 35,
        status: 'MATCH',
        varianceQty: 0,
        varianceAmount: 0,
        tolerancePct: 0,
        bboxId: 'bbox-line-301',
      },
      {
        id: 'li-302',
        itemCode: 'FG-LID-500',
        itemName: '500ml Tamper-Proof Hermetic Lid',
        poQty: 5000,
        grnQty: 4800, // Dispatched only 4,800
        invQty: 5000, // Invoiced for 5,000 -> Red Mismatch!
        uom: 'PCS',
        poRate: 42,
        invRate: 42,
        status: 'MISMATCH_BLOCKER',
        varianceQty: 200,
        varianceAmount: 8400,
        tolerancePct: 0,
        discrepancyReason: 'Critical Outward Variance: Billed 5,000 PCS, but Security Gate Pass & Dispatch Challan only shipped 4,800 PCS (200 PCS unfulfilled). Block posting to avoid customer dispute.',
        bboxId: 'bbox-line-302',
      },
    ],
    boundingBoxes: {
      invoiceNo: { id: 'bbox-einv-no', fieldKey: 'invoiceNo', label: 'E-Invoice #', x: 72, y: 14, width: 22, height: 4, page: 1 },
      invoiceDate: { id: 'bbox-einv-date', fieldKey: 'invoiceDate', label: 'Date', x: 72, y: 19, width: 22, height: 4, page: 1 },
      vendorName: { id: 'bbox-einv-vendor', fieldKey: 'vendorName', label: 'Seller Name', x: 8, y: 12, width: 45, height: 5, page: 1 },
      vendorGstin: { id: 'bbox-einv-gstin', fieldKey: 'vendorGstin', label: 'Seller GSTIN', x: 8, y: 22, width: 35, height: 4, page: 1 },
      poRef: { id: 'bbox-einv-po', fieldKey: 'poRef', label: 'SO Reference', x: 8, y: 32, width: 35, height: 4, page: 1 },
      totalAmount: { id: 'bbox-einv-total', fieldKey: 'totalAmount', label: 'Total Amount', x: 68, y: 78, width: 25, height: 5, page: 1 },
      'bbox-line-301': { id: 'bbox-line-301', fieldKey: 'lineItem_0', label: 'FG-CTN-500 Row', x: 6, y: 46, width: 88, height: 6, page: 1 },
      'bbox-line-302': { id: 'bbox-line-302', fieldKey: 'lineItem_1', label: 'FG-LID-500 Row', x: 6, y: 53, width: 88, height: 6, page: 1 },
    },
  },
];

export const InvoiceOcrVerificationWorkspace: React.FC<InvoiceOcrVerificationWorkspaceProps> = ({
  initialInvoiceId,
  mode = 'INWARD_PURCHASE',
  onNavigate,
  onPostToLedger,
  onRejectInvoice,
  showToast,
}) => {
  // Navigation / Mode State
  const [currentScreen, setCurrentScreen] = useState<'WORKSPACE' | 'UPLOAD_PROCESS' | 'BATCH_SUMMARY'>('WORKSPACE');
  const [activeTabMode, setActiveTabMode] = useState<'INWARD_PURCHASE' | 'OUTWARD_SALES'>(mode);
  const [invoices, setInvoices] = useState<OcrInvoiceDocument[]>(SAMPLE_INVOICES);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(initialInvoiceId || SAMPLE_INVOICES[0].id);

  // Active Selected Invoice
  const selectedInvoice = invoices.find((inv) => inv.id === selectedInvoiceId) || invoices[0];

  // Viewer Controls (Zoom, Pan, Rotate)
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotationDeg, setRotationDeg] = useState<number>(0);
  const [activeFieldKey, setActiveFieldKey] = useState<string | null>(null);

  // Discrepancy Resolution Modal / Drawer State (Screen 3)
  const [resolutionTarget, setResolutionTarget] = useState<{
    lineItem: InvoiceLineItem;
    lineIndex: number;
  } | null>(null);
  const [selectedResolutionOption, setSelectedResolutionOption] = useState<
    'CORRECT_OCR' | 'ACCEPT_SHORT_SUPPLY' | 'CREATE_DEBIT_NOTE' | 'REJECT_INVOICE'
  >('CREATE_DEBIT_NOTE');

  // Simulated AI Upload & Processing State (Screen 1)
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [aiExtractionStep, setAiExtractionStep] = useState<number>(0);

  // Keyboard Shortcuts Hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + Enter: Post to Ledger
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handlePostToLedger();
      }
      // Ctrl + R: Reject Invoice
      if ((e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        handleQuickReject();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedInvoice]);

  // Handle Drag & Drop Upload with Simulated Live Extraction Feed (Screen 1)
  const handleFileUpload = (file?: File) => {
    setIsUploading(true);
    setCurrentScreen('UPLOAD_PROCESS');
    setUploadProgress(0);
    setAiExtractionStep(0);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 25;
      });
    }, 250);

    setTimeout(() => setAiExtractionStep(1), 700); // Header extraction
    setTimeout(() => setAiExtractionStep(2), 1400); // Line item parsing
    setTimeout(() => setAiExtractionStep(3), 2100); // 3-Way match vs PO/GRN

    // UX Trick from Blueprint: Auto-redirect millisecond AI finishes without requiring "Next" click
    setTimeout(() => {
      setIsUploading(false);
      setCurrentScreen('WORKSPACE');
      showToast('AI Extraction & 3-Way Match completed in 2.4s (Confidence: 98.4%)');
    }, 2800);
  };

  // Resolve Line Item Discrepancy
  const handleApplyResolution = () => {
    if (!resolutionTarget) return;

    const { lineIndex } = resolutionTarget;
    const updatedLineItems = [...selectedInvoice.lineItems];
    const targetItem = { ...updatedLineItems[lineIndex] };

    if (selectedResolutionOption === 'CORRECT_OCR') {
      targetItem.invQty = targetItem.grnQty;
      targetItem.status = 'MATCH';
      targetItem.varianceQty = 0;
      targetItem.varianceAmount = 0;
      targetItem.resolvedResolution = `OCR quantity corrected from original reading to match accepted GRN (${targetItem.grnQty} ${targetItem.uom})`;
      showToast(`Corrected line item quantity to ${targetItem.grnQty} ${targetItem.uom}`);
    } else if (selectedResolutionOption === 'ACCEPT_SHORT_SUPPLY') {
      targetItem.status = 'TOLERANCE_WARNING';
      targetItem.resolvedResolution = `Manager approved short supply absorption of ${targetItem.varianceQty} ${targetItem.uom}`;
      showToast(`Short supply variance accepted under Plant Manager authorization`);
    } else if (selectedResolutionOption === 'CREATE_DEBIT_NOTE') {
      targetItem.status = 'MATCH';
      targetItem.resolvedResolution = `Debit Note DN-2026-${Math.floor(1000 + Math.random() * 9000)} auto-generated for ₹${targetItem.varianceAmount.toLocaleString()}`;
      showToast(`Debit Note issued for ₹${targetItem.varianceAmount.toLocaleString()} shortage`);
    } else if (selectedResolutionOption === 'REJECT_INVOICE') {
      targetItem.status = 'MISMATCH_BLOCKER';
      targetItem.resolvedResolution = `Invoice rejected & sent back to vendor due to unverified overbilling`;
      showToast(`Invoice rejected and dispute notification prepared for supplier`);
    }

    updatedLineItems[lineIndex] = targetItem;

    const updatedInvoice: OcrInvoiceDocument = {
      ...selectedInvoice,
      lineItems: updatedLineItems,
    };

    setInvoices((prev) => prev.map((inv) => (inv.id === updatedInvoice.id ? updatedInvoice : inv)));
    setResolutionTarget(null);
  };

  // Post to Ledger
  const handlePostToLedger = () => {
    const hasBlockers = selectedInvoice.lineItems.some((item) => item.status === 'MISMATCH_BLOCKER');
    if (hasBlockers) {
      showToast('⚠️ Blocked: Please resolve all red discrepancy line items before posting to General Ledger!');
      return;
    }

    const updated: OcrInvoiceDocument = {
      ...selectedInvoice,
      status: 'POSTED_TO_LEDGER',
    };
    setInvoices((prev) => prev.map((inv) => (inv.id === updated.id ? updated : inv)));
    if (onPostToLedger) onPostToLedger(updated);
    showToast(`✅ Invoice ${selectedInvoice.invoiceNumber} verified 100% and posted to Accounts Payable Ledger.`);
  };

  const handleQuickReject = () => {
    const updated: OcrInvoiceDocument = {
      ...selectedInvoice,
      status: 'REJECTED',
    };
    setInvoices((prev) => prev.map((inv) => (inv.id === updated.id ? updated : inv)));
    if (onRejectInvoice) onRejectInvoice(updated, 'Rate/Quantity Discrepancy');
    showToast(`❌ Invoice ${selectedInvoice.invoiceNumber} rejected. Dispute packet generated.`);
  };

  const totalVarianceAmount = selectedInvoice.lineItems.reduce((sum, item) => sum + (item.varianceAmount || 0), 0);
  const allMatched = selectedInvoice.lineItems.every((item) => item.status === 'MATCH');

  return (
    <div className="space-y-4 max-w-[1700px] mx-auto pb-12 font-['Plus_Jakarta_Sans']">
      {/* Top Banner Navigation & Quick Mode Switcher */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-[#0F8B8D] flex items-center justify-center font-bold text-base shadow-xs shrink-0">
            <Sparkles className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 font-['Space_Grotesk']">
                3-Way Invoice Verification &amp; OCR Matching Desk
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                Split-Screen AI Canvas
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Side-by-side automated matching of Supplier Tax Invoices against Purchase Orders (PO) &amp; Warehouse Goods Receipts (GRN).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode Pill Toggle (Inward Purchase vs Outward Sales) */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-semibold">
            <button
              onClick={() => {
                setActiveTabMode('INWARD_PURCHASE');
                const inwardSample = invoices.find((i) => i.type === 'INWARD_PURCHASE');
                if (inwardSample) setSelectedInvoiceId(inwardSample.id);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTabMode === 'INWARD_PURCHASE'
                  ? 'bg-[#14213D] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📥 Inward (PO ➔ GRN ➔ Invoice)
            </button>
            <button
              onClick={() => {
                setActiveTabMode('OUTWARD_SALES');
                const outwardSample = invoices.find((i) => i.type === 'OUTWARD_SALES');
                if (outwardSample) setSelectedInvoiceId(outwardSample.id);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTabMode === 'OUTWARD_SALES'
                  ? 'bg-[#0F8B8D] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📤 Outward (SO ➔ Dispatch ➔ E-Invoice)
            </button>
          </div>

          <button
            onClick={() => handleFileUpload()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload New Invoice</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SCREEN 1: UPLOAD & AI PROCESSING ("THE MAGIC MOMENT")                     */}
      {/* ========================================================================= */}
      {currentScreen === 'UPLOAD_PROCESS' && (
        <div className="bg-white p-10 rounded-2xl border border-slate-200 shadow-md text-center max-w-2xl mx-auto space-y-6 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center mx-auto shadow-inner">
            <RefreshCw className="w-8 h-8 animate-spin" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900 font-['Space_Grotesk']">
              AI Intelligent Document Ingestion Engine
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Extracting vector bounding boxes, line-item pricing tiers, and cross-matching against open ERP records.
            </p>
          </div>

          {/* Live Extraction Feed */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left font-mono text-xs space-y-2 text-slate-700">
            <div className="flex items-center justify-between text-slate-500 font-bold border-b border-slate-200 pb-1.5">
              <span>📄 Source: Invoice_ABC_Polymers_Sep26.pdf (1.2 MB)</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-2">
                <span className={uploadProgress >= 100 ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                  {uploadProgress >= 100 ? '✓' : '⏳'}
                </span>
                <span>Uploading &amp; Rasterizing Document Stream... 100%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={aiExtractionStep >= 1 ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                  {aiExtractionStep >= 1 ? '✓' : '⏳'}
                </span>
                <span>Extracting Header &amp; Tax Identifiers (Vendor, GSTIN, Date, Invoice #)...</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={aiExtractionStep >= 2 ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                  {aiExtractionStep >= 2 ? '✓' : '⏳'}
                </span>
                <span>Parsing Multi-Tier Table Line Items (2 Polymer SKUs found)...</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={aiExtractionStep >= 3 ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                  {aiExtractionStep >= 3 ? '✓' : '⏳'}
                </span>
                <span>Cross-Matching Against PO #PO-2026-089 &amp; GRN #GRN-2026-054...</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-teal-700 font-semibold bg-teal-50 py-2 px-4 rounded-lg border border-teal-200 inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Zero-Click Auto-Redirect active: opening Split-Screen Workspace now...</span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 2: THE CORE VERIFICATION WORKSPACE (SPLIT-SCREEN 40% / 60%)        */}
      {/* ========================================================================= */}
      {currentScreen === 'WORKSPACE' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* --------------------------------------------------------------------- */}
          {/* LEFT PANE (40%): SMART DOCUMENT VIEWER WITH BOUNDING BOX OVERLAYS     */}
          {/* --------------------------------------------------------------------- */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-[780px]">
            {/* Viewer Top Toolbar */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <FileText className="w-4 h-4 text-teal-600" />
                <span>Source PDF Document</span>
                <span className="text-[10px] text-slate-400 font-mono">(Page 1 of 1)</span>
              </div>

              {/* Zoom & Rotate Controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(70, z - 15))}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono font-bold text-slate-600 px-1">{zoomLevel}%</span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(180, z + 15))}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setRotationDeg((r) => (r + 90) % 360)}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 ml-1"
                  title="Rotate Document 90°"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Interactive Document Canvas Simulator with Precise Bounding Boxes */}
            <div className="flex-1 overflow-auto p-4 bg-slate-100 relative select-none flex justify-center items-start">
              <div
                style={{
                  transform: `scale(${zoomLevel / 100}) rotate(${rotationDeg}deg)`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.15s ease-out',
                }}
                className="w-[520px] min-h-[700px] bg-white shadow-xl rounded-lg p-6 relative border border-slate-300 text-slate-800 font-sans text-xs"
              >
                {/* Simulated Invoice Document Content */}
                <div className="border-b-2 border-slate-900 pb-3 mb-4 flex justify-between items-start">
                  <div>
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                      {selectedInvoice.vendorName}
                    </h2>
                    <p className="text-[10px] text-slate-500 max-w-[240px] leading-tight mt-0.5">
                      {selectedInvoice.vendorAddress}
                    </p>
                    <p className="text-[10px] font-mono font-bold text-slate-700 mt-1">
                      GSTIN: {selectedInvoice.vendorGstin}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] font-black uppercase text-slate-900 block font-mono">
                      TAX INVOICE
                    </span>
                    <p className="text-[10px] text-slate-600 font-mono mt-0.5">
                      Inv No: <strong>{selectedInvoice.invoiceNumber}</strong>
                    </p>
                    <p className="text-[10px] text-slate-600 font-mono">
                      Date: <strong>{selectedInvoice.invoiceDate}</strong>
                    </p>
                    <p className="text-[10px] text-teal-700 font-mono font-bold">
                      PO Ref: {selectedInvoice.linkedPoNumber}
                    </p>
                  </div>
                </div>

                {/* Buyer Details */}
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[10px] mb-4">
                  <span className="font-bold text-slate-600 block uppercase">Billed To (Customer / Consignee):</span>
                  <p className="font-bold text-slate-900">SP-PLASTECH PRIVATE LIMITED &middot; UNIT 01</p>
                  <p className="text-slate-600">Plot 18, SIDCO Industrial Complex, Hosur, Tamil Nadu - 635126</p>
                  <p className="font-mono text-slate-700">GSTIN: 33AABCS8810K1ZM | State Code: 33</p>
                </div>

                {/* Invoice Table Visual Representation */}
                <table className="w-full text-left text-[10px] border-collapse mb-4">
                  <thead>
                    <tr className="bg-slate-200 text-slate-800 font-bold border-y border-slate-300">
                      <th className="p-1.5">#</th>
                      <th className="p-1.5">Item Description</th>
                      <th className="p-1.5 text-right">Qty</th>
                      <th className="p-1.5 text-right">Rate (₹)</th>
                      <th className="p-1.5 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.lineItems.map((li, idx) => (
                      <tr key={li.id} className="border-b border-slate-200">
                        <td className="p-1.5 text-slate-500 font-mono">{idx + 1}</td>
                        <td className="p-1.5 font-bold text-slate-900">
                          {li.itemCode}
                          <span className="block text-[9px] text-slate-500 font-normal">{li.itemName}</span>
                        </td>
                        <td className="p-1.5 text-right font-mono font-bold">
                          {li.invQty.toLocaleString()} {li.uom}
                        </td>
                        <td className="p-1.5 text-right font-mono">₹{li.invRate.toFixed(2)}</td>
                        <td className="p-1.5 text-right font-mono font-bold">
                          ₹{(li.invQty * li.invRate).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Total Summary Breakdown */}
                <div className="border-t border-slate-300 pt-2 flex justify-end text-[10px]">
                  <div className="w-48 space-y-1 font-mono">
                    <div className="flex justify-between text-slate-600">
                      <span>Taxable Subtotal:</span>
                      <span>₹{selectedInvoice.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>GST @ 18%:</span>
                      <span>₹{selectedInvoice.taxAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 border-t border-slate-300 pt-1 text-xs">
                      <span>Invoice Total:</span>
                      <span>₹{selectedInvoice.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* --------------------------------------------------------------- */}
                {/* INTERACTIVE SVG BOUNDING BOXES OVERLAY                          */}
                {/* --------------------------------------------------------------- */}
                {Object.entries(selectedInvoice.boundingBoxes).map(([key, bbox]) => {
                  const isActive = activeFieldKey === bbox.fieldKey;
                  return (
                    <div
                      key={bbox.id}
                      onClick={() => setActiveFieldKey(bbox.fieldKey)}
                      style={{
                        left: `${bbox.x}%`,
                        top: `${bbox.y}%`,
                        width: `${bbox.width}%`,
                        height: `${bbox.height}%`,
                      }}
                      className={`absolute rounded transition-all duration-150 cursor-pointer pointer-events-auto flex items-start justify-end p-0.5 ${
                        isActive
                          ? 'border-2 border-amber-500 bg-amber-400/25 ring-4 ring-amber-300/40 shadow-lg'
                          : 'border border-dashed border-teal-500/60 bg-teal-500/10 hover:bg-teal-500/20 hover:border-teal-600'
                      }`}
                      title={`Extracted: ${bbox.label}`}
                    >
                      {isActive && (
                        <span className="bg-amber-600 text-white font-bold text-[8px] font-mono px-1 rounded shadow-xs -mt-3.5">
                          {bbox.label}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Document Footer Legend */}
            <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-amber-400/60 border border-amber-500 inline-block" />
                <span>Click any field on the right to highlight its bounding box</span>
              </span>
              <span className="font-mono text-teal-700 font-bold">OCR Confidence: {selectedInvoice.confidenceScore}%</span>
            </div>
          </div>

          {/* --------------------------------------------------------------------- */}
          {/* RIGHT PANE (60%): EXTRACTED DATA & 3-WAY MATCH MATRIX                 */}
          {/* --------------------------------------------------------------------- */}
          <div className="lg:col-span-7 space-y-4">
            {/* Header Extracted Fields & Confidence Scorecard */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Header Details &amp; GST Compliance
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedInvoice.confidenceScore >= 95
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    AI Confidence: {selectedInvoice.confidenceScore}% (Trust Blindly)
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-slate-400">Total:</span>
                  <strong className="text-slate-900 text-sm font-bold">
                    ₹{selectedInvoice.totalAmount.toLocaleString()}
                  </strong>
                </div>
              </div>

              {/* 2-Column Editable Header Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Invoice Number */}
                <div
                  onMouseEnter={() => setActiveFieldKey('invoiceNo')}
                  onClick={() => setActiveFieldKey('invoiceNo')}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    activeFieldKey === 'invoiceNo'
                      ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-200'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Invoice Number (Extracted)
                  </label>
                  <input
                    type="text"
                    defaultValue={selectedInvoice.invoiceNumber}
                    className="w-full bg-transparent font-mono font-bold text-slate-900 focus:outline-none"
                  />
                </div>

                {/* Invoice Date */}
                <div
                  onMouseEnter={() => setActiveFieldKey('invoiceDate')}
                  onClick={() => setActiveFieldKey('invoiceDate')}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    activeFieldKey === 'invoiceDate'
                      ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-200'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Invoice Date
                  </label>
                  <input
                    type="text"
                    defaultValue={selectedInvoice.invoiceDate}
                    className="w-full bg-transparent font-mono font-bold text-slate-900 focus:outline-none"
                  />
                </div>

                {/* Vendor GSTIN */}
                <div
                  onMouseEnter={() => setActiveFieldKey('vendorGstin')}
                  onClick={() => setActiveFieldKey('vendorGstin')}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    activeFieldKey === 'vendorGstin'
                      ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-200'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Vendor GSTIN (Verified GSTR-2B)
                  </label>
                  <input
                    type="text"
                    defaultValue={selectedInvoice.vendorGstin}
                    className="w-full bg-transparent font-mono font-bold text-slate-900 focus:outline-none"
                  />
                </div>

                {/* Place of Supply */}
                <div
                  onMouseEnter={() => setActiveFieldKey('vendorName')}
                  onClick={() => setActiveFieldKey('vendorName')}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    activeFieldKey === 'vendorName'
                      ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-200'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Vendor Name &amp; Place of Supply
                  </label>
                  <input
                    type="text"
                    defaultValue={selectedInvoice.vendorName}
                    className="w-full bg-transparent font-bold text-slate-900 focus:outline-none truncate"
                  />
                </div>
              </div>

              {/* Linked PO & GRN Badge Bar */}
              <div className="p-3 bg-teal-50/60 border border-teal-200 rounded-xl flex items-center justify-between text-xs text-teal-900">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-teal-700" />
                  <span>
                    Linked PO: <strong>{selectedInvoice.linkedPoNumber}</strong> &middot; GRN:{' '}
                    <strong>{selectedInvoice.linkedGrnNumber}</strong>
                  </span>
                </div>
                <button
                  onClick={() =>
                    showToast(`Opened cross-reference audit for ${selectedInvoice.linkedPoNumber}`)
                  }
                  className="font-bold text-teal-700 hover:underline flex items-center gap-1"
                >
                  <span>View PO Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* ----------------------------------------------------------------- */}
            {/* THE 3-WAY MATCH MATRIX (CORE TABLE WITH TRAFFIC LIGHTS)           */}
            {/* ----------------------------------------------------------------- */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 font-['Space_Grotesk']">
                    {activeTabMode === 'INWARD_PURCHASE'
                      ? 'Inward 3-Way Match Matrix (PO vs GRN vs Invoice)'
                      : 'Outward Match Matrix (SO vs Dispatch Challan vs E-Invoice)'}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Side-by-side variance calculation. Click any red/yellow cell to launch Discrepancy Resolution.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-[11px]">
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    🟢 Auto-Verified
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                    🟡 Tolerance (±2%)
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                    🔴 Blocked Mismatch
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10.5px]">
                      <th className="p-3">Item Code &amp; Description</th>
                      <th className="p-3 text-right">
                        {activeTabMode === 'INWARD_PURCHASE' ? 'PO Qty (A)' : 'SO Qty (A)'}
                      </th>
                      <th className="p-3 text-right">
                        {activeTabMode === 'INWARD_PURCHASE' ? 'GRN Accepted (B)' : 'Dispatched (B)'}
                      </th>
                      <th className="p-3 text-right">Invoice Qty (C)</th>
                      <th className="p-3 text-right">Variance (C - B)</th>
                      <th className="p-3 text-center">Match Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedInvoice.lineItems.map((li, idx) => {
                      const isHovered = activeFieldKey === `lineItem_${idx}`;

                      return (
                        <tr
                          key={li.id}
                          onMouseEnter={() => setActiveFieldKey(`lineItem_${idx}`)}
                          className={`transition-colors cursor-pointer ${
                            isHovered
                              ? 'bg-amber-50/50'
                              : li.status === 'MISMATCH_BLOCKER'
                              ? 'bg-rose-50/30'
                              : 'hover:bg-slate-50/80'
                          }`}
                        >
                          <td className="p-3">
                            <div className="font-bold text-slate-900 font-mono">{li.itemCode}</div>
                            <div className="text-[11px] text-slate-600 truncate max-w-xs">{li.itemName}</div>
                            {li.resolvedResolution && (
                              <div className="text-[10px] text-teal-700 font-medium bg-teal-50 px-1.5 py-0.5 rounded mt-1 border border-teal-200 inline-block">
                                ↳ {li.resolvedResolution}
                              </div>
                            )}
                          </td>

                          <td className="p-3 text-right font-mono font-medium text-slate-700">
                            {li.poQty.toLocaleString()} {li.uom}
                          </td>

                          <td className="p-3 text-right font-mono font-bold text-slate-900">
                            {li.grnQty.toLocaleString()} {li.uom}
                          </td>

                          <td className="p-3 text-right font-mono font-bold text-slate-900">
                            {li.invQty.toLocaleString()} {li.uom}
                          </td>

                          <td className="p-3 text-right font-mono">
                            {li.varianceQty === 0 ? (
                              <span className="text-emerald-700 font-bold">0 {li.uom}</span>
                            ) : (
                              <span
                                className={`font-bold px-1.5 py-0.5 rounded ${
                                  li.status === 'MISMATCH_BLOCKER'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                +{li.varianceQty} {li.uom} (₹{li.varianceAmount.toLocaleString()})
                              </span>
                            )}
                          </td>

                          <td className="p-3 text-center">
                            {li.status === 'MATCH' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                100% Matched
                              </span>
                            )}

                            {li.status === 'TOLERANCE_WARNING' && (
                              <button
                                onClick={() => setResolutionTarget({ lineItem: li, lineIndex: idx })}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200"
                              >
                                <AlertTriangle className="w-3 h-3" />
                                Accept ±{li.tolerancePct}%
                              </button>
                            )}

                            {li.status === 'MISMATCH_BLOCKER' && (
                              <button
                                onClick={() => setResolutionTarget({ lineItem: li, lineIndex: idx })}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 hover:bg-rose-200 animate-pulse"
                              >
                                <XCircle className="w-3 h-3" />
                                Overbilled (Resolve ➔)
                              </button>
                            )}
                          </td>

                          <td className="p-3 text-right">
                            <button
                              onClick={() => setResolutionTarget({ lineItem: li, lineIndex: idx })}
                              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-[11px] font-semibold text-slate-700"
                            >
                              Resolve
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Action Footer Bar with Total Variance & Keyboard Shortcut Hints */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="text-slate-600">
                    Total Invoice Variance:{' '}
                    <strong className={totalVarianceAmount > 0 ? 'text-rose-700 font-bold' : 'text-emerald-700 font-bold'}>
                      ₹{totalVarianceAmount.toLocaleString()}
                    </strong>
                  </div>
                  <span className="text-slate-300">|</span>
                  <div className="text-[11px] text-slate-400 font-mono hidden md:inline">
                    Shortcuts: <kbd className="px-1.5 py-0.5 bg-white border rounded">Ctrl+Enter</kbd> Post &middot;{' '}
                    <kbd className="px-1.5 py-0.5 bg-white border rounded">Ctrl+R</kbd> Reject
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleQuickReject}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-slate-300 text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject Invoice</span>
                  </button>

                  <button
                    onClick={handlePostToLedger}
                    className="px-5 py-2 rounded-xl bg-[#0F8B8D] hover:bg-[#0c7274] text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Post to Accounts Payable Ledger</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 3: DISCREPANCY RESOLUTION SLIDE-OVER DRAWER                        */}
      {/* ========================================================================= */}
      {resolutionTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden text-xs">
            {/* Header */}
            <div className="p-4 bg-rose-50 border-b border-rose-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h3 className="text-sm font-bold text-rose-900 font-['Space_Grotesk']">
                  Resolve 3-Way Discrepancy: {resolutionTarget.lineItem.itemCode}
                </h3>
              </div>
              <button
                onClick={() => setResolutionTarget(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Problem Statement */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="font-bold text-slate-800 block">Variance Statement:</span>
                <p className="text-slate-600">
                  {resolutionTarget.lineItem.discrepancyReason ||
                    `Supplier billed ${resolutionTarget.lineItem.invQty} ${resolutionTarget.lineItem.uom}, but Warehouse GRN only verified ${resolutionTarget.lineItem.grnQty} ${resolutionTarget.lineItem.uom}.`}
                </p>
                <div className="text-rose-700 font-bold font-mono text-[11px] pt-1">
                  Financial Exposure: ₹{resolutionTarget.lineItem.varianceAmount.toLocaleString()} overbilled
                </div>
              </div>

              {/* 4 Resolution Options from Blueprint */}
              <div className="space-y-2">
                <label className="font-bold text-slate-800 block text-xs">
                  How would you like to resolve this discrepancy?
                </label>

                {/* Option 1: Correct the Invoice (OCR Error) */}
                <label
                  onClick={() => setSelectedResolutionOption('CORRECT_OCR')}
                  className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                    selectedResolutionOption === 'CORRECT_OCR'
                      ? 'border-teal-600 bg-teal-50/50 ring-2 ring-teal-200'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="resolution"
                    checked={selectedResolutionOption === 'CORRECT_OCR'}
                    onChange={() => setSelectedResolutionOption('CORRECT_OCR')}
                    className="mt-0.5 text-teal-600 focus:ring-teal-500"
                  />
                  <div>
                    <strong className="text-slate-900 block">Option 1: Correct the Invoice (OCR Reading Error)</strong>
                    <p className="text-slate-500 text-[11px]">
                      Change billed quantity to match accepted GRN ({resolutionTarget.lineItem.grnQty}{' '}
                      {resolutionTarget.lineItem.uom}) and update bounding box.
                    </p>
                  </div>
                </label>

                {/* Option 2: Accept Short Supply (GRN Error / Tolerance) */}
                <label
                  onClick={() => setSelectedResolutionOption('ACCEPT_SHORT_SUPPLY')}
                  className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                    selectedResolutionOption === 'ACCEPT_SHORT_SUPPLY'
                      ? 'border-teal-600 bg-teal-50/50 ring-2 ring-teal-200'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="resolution"
                    checked={selectedResolutionOption === 'ACCEPT_SHORT_SUPPLY'}
                    onChange={() => setSelectedResolutionOption('ACCEPT_SHORT_SUPPLY')}
                    className="mt-0.5 text-teal-600 focus:ring-teal-500"
                  />
                  <div>
                    <strong className="text-slate-900 block">Option 2: Accept Short Supply (Tolerance Absorption)</strong>
                    <p className="text-slate-500 text-[11px]">
                      Accept supplier billing of {resolutionTarget.lineItem.invQty} {resolutionTarget.lineItem.uom}{' '}
                      under ±2% plant moisture variance tolerance.
                    </p>
                  </div>
                </label>

                {/* Option 3: Create Debit Note for Difference */}
                <label
                  onClick={() => setSelectedResolutionOption('CREATE_DEBIT_NOTE')}
                  className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                    selectedResolutionOption === 'CREATE_DEBIT_NOTE'
                      ? 'border-teal-600 bg-teal-50/50 ring-2 ring-teal-200'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="resolution"
                    checked={selectedResolutionOption === 'CREATE_DEBIT_NOTE'}
                    onChange={() => setSelectedResolutionOption('CREATE_DEBIT_NOTE')}
                    className="mt-0.5 text-teal-600 focus:ring-teal-500"
                  />
                  <div>
                    <strong className="text-slate-900 block">Option 3: Auto-Generate Debit Note (Recommended)</strong>
                    <p className="text-slate-500 text-[11px]">
                      Post invoice for accepted GRN ({resolutionTarget.lineItem.grnQty} {resolutionTarget.lineItem.uom})
                      and issue Debit Note DN for ₹{resolutionTarget.lineItem.varianceAmount.toLocaleString()}.
                    </p>
                  </div>
                </label>

                {/* Option 4: Reject Invoice */}
                <label
                  onClick={() => setSelectedResolutionOption('REJECT_INVOICE')}
                  className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                    selectedResolutionOption === 'REJECT_INVOICE'
                      ? 'border-rose-600 bg-rose-50/50 ring-2 ring-rose-200'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="resolution"
                    checked={selectedResolutionOption === 'REJECT_INVOICE'}
                    onChange={() => setSelectedResolutionOption('REJECT_INVOICE')}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <strong className="text-rose-900 block">Option 4: Reject Invoice Back to Vendor</strong>
                    <p className="text-slate-500 text-[11px]">
                      Halt all AP processing, block voucher creation, and email formal dispute report to supplier.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setResolutionTarget(null)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyResolution}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <span>Apply Resolution</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
