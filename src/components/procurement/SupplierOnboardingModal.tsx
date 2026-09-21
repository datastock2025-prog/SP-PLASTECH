import React, { useState } from 'react';
import {
  X,
  Building,
  User,
  MapPin,
  CreditCard,
  ShieldCheck,
  FileText,
  AlertCircle,
  Plus,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronDown,
} from 'lucide-react';
import {
  SupplierMaster,
  SupplierCategory,
  SupplierStatus,
} from '../../types/procurement';
import { masterDataGovernanceService } from '../../services/masterDataGovernanceService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreateSupplier: (supplier: SupplierMaster) => void;
  showToast: (msg: string) => void;
}

export const SupplierOnboardingModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onCreateSupplier,
  showToast,
}) => {
  if (!isOpen) return null;

  // Form State initialized with realistic defaults matching screenshot
  const [formCode, setFormCode] = useState(
    () => `SUP-NEW-${Math.floor(100 + Math.random() * 900)}`
  );
  const [formCategory, setFormCategory] = useState<SupplierCategory>('Virgin Resin');
  const [formName, setFormName] = useState('');
  const [formLegalName, setFormLegalName] = useState('');
  const [formGstin, setFormGstin] = useState('');
  const [formPan, setFormPan] = useState('');
  const [formHsnCode, setFormHsnCode] = useState('39021000');
  const [formTariffCode, setFormTariffCode] = useState('3902.10.00');
  const [formMoq, setFormMoq] = useState<number>(1000);
  const [formTerms, setFormTerms] = useState('Net 30 Days');
  const [formLeadTime, setFormLeadTime] = useState<number>(7);

  // Primary Contact
  const [formContactName, setFormContactName] = useState('');
  const [formContactEmail, setFormContactEmail] = useState('');
  const [formContactPhone, setFormContactPhone] = useState('');
  const [formContactRole, setFormContactRole] = useState('Key Account Manager');

  // Address
  const [formAddressLine, setFormAddressLine] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState('Gujarat');
  const [formPincode, setFormPincode] = useState('');
  const [formCountry, setFormCountry] = useState('India');

  // Banking
  const [formBankName, setFormBankName] = useState('HDFC Bank Ltd');
  const [formAccountNumber, setFormAccountNumber] = useState('');
  const [formIfsc, setFormIfsc] = useState('');
  const [formBranch, setFormBranch] = useState('');

  // MSME & Compliance
  const [formMsmeRegistered, setFormMsmeRegistered] = useState(false);
  const [formUdyamNo, setFormUdyamNo] = useState('');
  const [formCreditLimit, setFormCreditLimit] = useState<number>(25);
  const [formIso9001, setFormIso9001] = useState(true);
  const [formFoodGrade, setFormFoodGrade] = useState(true);
  const [formReachRoHS, setFormReachRoHS] = useState(true);

  // Active section tab for multi-section expansion (optional ease of navigation)
  const [activeTab, setActiveTab] = useState<'core' | 'address' | 'banking' | 'compliance'>('core');
  const [errorMsg, setErrorMsg] = useState('');

  const categories: SupplierCategory[] = [
    'Virgin Resin',
    'Masterbatch & Colorants',
    'Additives & Fillers',
    'Regrind & Recycled',
    'Packaging Materials',
    'Molds & Tooling',
    'Machine Spare Parts',
    'Consumables & Lubricants',
    'Logistics & Freight',
    'Testing & Calibration Services',
    'Subcontracting Services',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setErrorMsg('Please enter the supplier company / trade name.');
      setActiveTab('core');
      return;
    }
    if (!formCategory) {
      setErrorMsg('Please select a supplier category.');
      return;
    }

    const newSup: SupplierMaster = {
      id: `SUP-${Date.now()}`,
      code: formCode.trim() || `SUP-NEW-${Math.floor(100 + Math.random() * 900)}`,
      name: formName.trim(),
      legalName: formLegalName.trim() || formName.trim(),
      type: 'Manufacturer',
      category: formCategory,
      status: 'pending_approval',
      rating: 4.5,
      riskLevel: 'Low',
      preferred: false,
      blocked: false,
      industry: `${formCategory} Manufacturing & Distribution`,
      country: formCountry,
      currency: 'INR (₹)',
      paymentTerms: formTerms,
      deliveryTerms: `FOR Factory (${formCity || 'Hazira Plant'})`,
      leadTimeDays: Number(formLeadTime) || 7,
      minimumOrderValue: 50000,
      hsnCode: formHsnCode.trim() || '39021000',
      tariffCode: formTariffCode.trim() || '3902.10.00',
      moq: Number(formMoq) || 1000,
      createdDate: new Date().toISOString().slice(0, 10),
      openPOsCount: 0,
      openPOValue: 0,
      outstandingBalance: 0,
      lastPurchaseDate: undefined,
      website: `https://www.${formName.toLowerCase().replace(/[^a-z0-9]/g, '')}.example.com`,
      notes: `Registered via Vendor Onboarding Portal on ${new Date().toLocaleDateString()}. Initial qualification in progress.`,
      contacts: formContactName.trim()
        ? [
            {
              id: `CON-${Date.now()}`,
              name: formContactName.trim(),
              role: formContactRole || 'Key Account Manager',
              department: 'Sales',
              email: formContactEmail.trim() || `sales@${formName.toLowerCase().replace(/[^a-z0-9]/g, '')}.example.com`,
              phone: formContactPhone.trim() || '+91 98000 00000',
              isPrimary: true,
              preferredContact: 'Email',
              active: true,
            },
          ]
        : [
            {
              id: `CON-${Date.now()}`,
              name: 'Commercial Head',
              role: 'Sales Manager',
              department: 'Sales',
              email: 'sales@vendor.example',
              phone: '+91 98000 00000',
              isPrimary: true,
              preferredContact: 'Email',
              active: true,
            },
          ],
      addresses: [
        {
          id: `ADDR-${Date.now()}`,
          type: 'Billing',
          addressLine1: formAddressLine.trim() || 'Plot No. 45, Industrial Zone Phase 2',
          city: formCity.trim() || 'Surat',
          state: formState.trim() || 'Gujarat',
          country: formCountry,
          postalCode: formPincode.trim() || '394510',
          isDefault: true,
        },
        {
          id: `ADDR-${Date.now() + 1}`,
          type: 'Pickup',
          addressLine1: formAddressLine.trim() || 'Central Polymer Warehouse & Loading Dock',
          city: formCity.trim() || 'Surat',
          state: formState.trim() || 'Gujarat',
          country: formCountry,
          postalCode: formPincode.trim() || '394510',
          isDefault: false,
        },
      ],
      bankingTax: {
        bankName: formBankName.trim() || 'HDFC Bank Ltd',
        accountNumber: formAccountNumber.trim() || '502000' + Math.floor(10000000 + Math.random() * 90000000),
        ifscOrSwift: formIfsc.trim().toUpperCase() || 'HDFC0000123',
        branch: formBranch.trim() || 'Industrial Complex Branch',
        paymentMethod: 'NEFT/RTGS',
        taxId: formGstin.trim().toUpperCase() || '27AAACS1982K1Z3',
        panNumber: formPan.trim().toUpperCase() || 'AAACS1982K',
        msmeRegistered: formMsmeRegistered,
        msmeNumber: formUdyamNo.trim() || undefined,
        withholdingTaxPct: 0.1,
        eInvoicingEnabled: true,
      },
      itemsSupplied: [
        {
          itemCode: `RM-${formCategory === 'Virgin Resin' ? 'PP' : 'MB'}-NEW-01`,
          itemName: `${formName} Standard Grade Polymer Material`,
          category: formCategory,
          supplierItemCode: `${formCode}-SKU-001`,
          uom: 'KG',
          leadTimeDays: Number(formLeadTime) || 7,
          moq: Number(formMoq) || 1000,
          lastPurchasePrice: 82.5,
          contractPrice: 80.0,
          preferredItem: true,
          approvalStatus: 'approved',
          coaRequired: true,
          msdsRequired: true,
        },
      ],
      priceLists: [
        {
          id: `PL-${Date.now()}`,
          priceListId: `PL-${formCode}-01`,
          itemCode: `RM-${formCategory === 'Virgin Resin' ? 'PP' : 'MB'}-NEW-01`,
          itemName: `${formName} Standard Grade Polymer Material`,
          currency: 'INR (₹)',
          unitPrice: 80.0,
          effectiveFrom: new Date().toISOString().slice(0, 10),
          effectiveTo: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          moq: Number(formMoq) || 1000,
          leadTimeDays: Number(formLeadTime) || 7,
          priceType: 'Indexed',
          indexReference: 'Platts Asia PP CFR India + Freight Adder',
          baseIndexValue: 76.0,
          adjustmentFormula: 'P_actual = Base_Index + Freight + GST(18%)',
          freightIncluded: true,
          packingIncluded: true,
          taxPct: 18,
          status: 'Active',
        },
      ],
      documents: [
        {
          id: `DOC-GST-${Date.now()}`,
          title: 'GST Registration Certificate',
          type: 'Tax Certificate',
          fileName: `${formName.replace(/\s+/g, '_')}_GST_Cert.pdf`,
          fileSize: '1.2 MB',
          issueDate: new Date().toISOString().slice(0, 10),
          expiryDate: '2030-12-31',
          documentNumber: formGstin.trim() || '27AAACS1982K1Z3',
          uploadedBy: 'System Auto-KYC',
          status: 'Valid',
          verified: true,
        },
        {
          id: `DOC-PAN-${Date.now()}`,
          title: 'Company PAN Card Copy',
          type: 'Tax Certificate',
          fileName: `${formName.replace(/\s+/g, '_')}_PAN_Copy.pdf`,
          fileSize: '850 KB',
          issueDate: new Date().toISOString().slice(0, 10),
          expiryDate: '2035-12-31',
          documentNumber: formPan.trim() || 'AAACS1982K',
          uploadedBy: 'System Auto-KYC',
          status: 'Valid',
          verified: true,
        },
        {
          id: `DOC-ISO-${Date.now()}`,
          title: 'ISO 9001:2015 Quality Certificate',
          type: 'ISO Certificate',
          fileName: 'ISO_9001_Quality_Certificate.pdf',
          fileSize: '2.4 MB',
          issueDate: new Date().toISOString().slice(0, 10),
          expiryDate: '2028-06-30',
          documentNumber: 'ISO-9001-QMS-9982',
          uploadedBy: 'Quality Assurance Head',
          status: 'Valid',
          verified: formIso9001,
        },
        {
          id: `DOC-FDA-${Date.now()}`,
          title: 'FDA 21 CFR Food Contact Declaration',
          type: 'Food Grade Certificate',
          fileName: 'FDA_21CFR_Compliance_Declaration.pdf',
          fileSize: '1.8 MB',
          issueDate: new Date().toISOString().slice(0, 10),
          expiryDate: '2028-12-31',
          documentNumber: 'FDA-21CFR-177.1520',
          uploadedBy: 'Technical Services',
          status: 'Valid',
          verified: formFoodGrade,
        },
      ],
      compliance: {
        esgRating: 'A',
        esgScore: 88,
        iso9001Valid: formIso9001,
        iso9001Expiry: '2028-06-30',
        iso14001Valid: false,
        foodGradeCompliant: formFoodGrade,
        reachCompliant: formReachRoHS,
        rohsCompliant: formReachRoHS,
        recycledContentCert: formCategory === 'Regrind & Recycled',
        conflictMineralsDeclaration: true,
        lastAuditDate: new Date().toISOString().slice(0, 10),
        lastAuditScore: 92,
        auditFindings: 0,
        openCapas: 0,
      },
      scorecard: {
        overallScore: 90.0,
        overallGrade: 'A',
        trend: 'improving',
        evaluationPeriod: 'Initial Supplier Qualification',
        onTimeDeliveryPct: 98.0,
        quantityAccuracyPct: 100.0,
        qualityAcceptancePct: 99.0,
        priceCompetitivenessPct: 92.0,
        priceVariancePct: 0.0,
        responsivenessScore: 95,
        documentCompliancePct: 100,
        complaintResolutionDays: 2.0,
        returnRatePct: 0.0,
        metrics: [
          {
            name: 'On-Time In-Full Delivery (OTIF)',
            category: 'Delivery',
            target: '95%',
            actual: '98.0%',
            weight: 30,
            score: 98,
            status: 'pass',
          },
          {
            name: 'Incoming QC Lot Acceptance Rate',
            category: 'Quality',
            target: '98%',
            actual: '99.0%',
            weight: 35,
            score: 99,
            status: 'pass',
          },
          {
            name: 'Contract Price Stability & Index Adherence',
            category: 'Price',
            target: '90%',
            actual: '92.0%',
            weight: 20,
            score: 92,
            status: 'pass',
          },
          {
            name: 'COA & MSDS Documentation Compliance',
            category: 'Compliance',
            target: '100%',
            actual: '100%',
            weight: 15,
            score: 100,
            status: 'pass',
          },
        ],
      },
      activityHistory: [
        {
          id: `ACT-${Date.now()}`,
          date: new Date().toISOString().slice(0, 10),
          user: 'Procurement Officer',
          action: 'Supplier Registered & Onboarding Initiated',
          details: `Registered ${formName} (${formCode}) under ${formCategory} with GSTIN ${formGstin || '27AAACS1982K1Z3'}`,
        },
      ],
    };

    onCreateSupplier(newSup);
    masterDataGovernanceService.saveSupplier({
      code: newSup.code,
      name: newSup.name,
      category: newSup.category,
      hsnCode: newSup.hsnCode,
      tariffCode: newSup.tariffCode,
      moq: newSup.moq,
      leadTimeDays: newSup.leadTimeDays,
      paymentTerms: newSup.paymentTerms,
    });

    showToast(`✓ Supplier ${newSup.name} (${newSup.code}) registered successfully!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-bold text-[#14213D] font-['Space_Grotesk']">
            Register New Supplier / Vendor
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Top Banner exactly matching screenshot */}
          <div className="p-4 bg-[#14213D] text-white rounded-xl shadow-inner">
            <div className="text-[10px] text-[#0F8B8D] font-bold uppercase tracking-wider">
              VENDOR ONBOARDING
            </div>
            <div className="font-bold text-sm tracking-wide mt-0.5">
              Polymer & Material Supplier Registration
            </div>
          </div>

          {/* Error Message if any */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section Navigation Pills (Quick Access) */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('core')}
              className={`flex-1 py-1.5 rounded-md transition ${
                activeTab === 'core'
                  ? 'bg-white text-[#14213D] shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              1. Basic & Commercial
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('address')}
              className={`flex-1 py-1.5 rounded-md transition ${
                activeTab === 'address'
                  ? 'bg-white text-[#14213D] shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              2. Plant & Location
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('banking')}
              className={`flex-1 py-1.5 rounded-md transition ${
                activeTab === 'banking'
                  ? 'bg-white text-[#14213D] shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              3. Banking & Tax
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('compliance')}
              className={`flex-1 py-1.5 rounded-md transition ${
                activeTab === 'compliance'
                  ? 'bg-white text-[#14213D] shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              4. Compliance & MSME
            </button>
          </div>

          {/* ---------------- TAB 1: CORE FIELDS (Matches Screenshot 1) ---------------- */}
          {activeTab === 'core' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Row 1: Supplier Code & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Supplier Code</label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-mono text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as SupplierCategory)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Company / Trade Name */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Company / Trade Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Supreme Petrochem Polymers Ltd"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                />
              </div>

              {/* Row 3: Legal Registered Entity Name */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Legal Registered Entity Name</label>
                <input
                  type="text"
                  placeholder="e.g. Supreme Petrochemicals Private Limited"
                  value={formLegalName}
                  onChange={(e) => setFormLegalName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                />
              </div>

              {/* Row 4: GSTIN & PAN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">GSTIN / Tax ID</label>
                  <input
                    type="text"
                    placeholder="E.G. 27AAACS1982K1Z3"
                    value={formGstin}
                    onChange={(e) => setFormGstin(e.target.value.toUpperCase())}
                    maxLength={15}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono text-xs uppercase text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">PAN Number</label>
                  <input
                    type="text"
                    placeholder="E.G. AAACS1982K"
                    value={formPan}
                    onChange={(e) => setFormPan(e.target.value.toUpperCase())}
                    maxLength={10}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono text-xs uppercase text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                  />
                </div>
              </div>

              {/* Row 5: HSN Code & MOQ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">HSN / Tariff Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="39021000"
                    value={formHsnCode}
                    onChange={(e) => setFormHsnCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Default MOQ (Min Order Qty) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formMoq}
                    onChange={(e) => setFormMoq(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                  />
                </div>
              </div>

              {/* Row 6: Payment Terms & Lead Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Payment Terms</label>
                  <select
                    value={formTerms}
                    onChange={(e) => setFormTerms(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                  >
                    <option value="Net 30 Days">Net 30 Days</option>
                    <option value="Net 45 Days">Net 45 Days</option>
                    <option value="Net 60 Days">Net 60 Days</option>
                    <option value="Advance / LC">Advance / LC</option>
                    <option value="10% Advance, Net 30">10% Advance, Net 30</option>
                    <option value="Against BL / Dispatch">Against BL / Dispatch</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Avg Lead Time (Days)</label>
                  <input
                    type="number"
                    min={1}
                    value={formLeadTime}
                    onChange={(e) => setFormLeadTime(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                  />
                </div>
              </div>

              {/* Primary Contact Person Box (Exact Screenshot Layout) */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#0F8B8D]" />
                  <span>Primary Contact Person</span>
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Contact Person Name"
                    value={formContactName}
                    onChange={(e) => setFormContactName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={formContactEmail}
                    onChange={(e) => setFormContactEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                  />
                  <input
                    type="tel"
                    placeholder="Mobile / Phone"
                    value={formContactPhone}
                    onChange={(e) => setFormContactPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ---------------- TAB 2: ADDRESS & PLANT LOCATION ---------------- */}
          {activeTab === 'address' && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#0F8B8D]" />
                  <span>Factory / Dispatch Location Details</span>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Address Line / Street / Industrial Plot</label>
                  <input
                    type="text"
                    placeholder="e.g. Plot No. 12/B, GIDC Petrochemical Complex"
                    value={formAddressLine}
                    onChange={(e) => setFormAddressLine(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">City</label>
                    <input
                      type="text"
                      placeholder="Surat"
                      value={formCity}
                      onChange={(e) => setFormCity(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">State</label>
                    <select
                      value={formState}
                      onChange={(e) => setFormState(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                    >
                      <option value="Gujarat">Gujarat</option>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Rajasthan">Rajasthan</option>
                      <option value="Tamil Nadu">Tamil Nadu</option>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Daman & Diu">Daman & Diu</option>
                      <option value="Haryana">Haryana</option>
                      <option value="Uttar Pradesh">Uttar Pradesh</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">Pincode</label>
                    <input
                      type="text"
                      placeholder="394510"
                      value={formPincode}
                      onChange={(e) => setFormPincode(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---------------- TAB 3: BANKING & TAX ---------------- */}
          {activeTab === 'banking' && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-[#0F8B8D]" />
                  <span>Bank Account & Remittance Setup</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">Bank Name</label>
                    <input
                      type="text"
                      placeholder="e.g. HDFC Bank Ltd"
                      value={formBankName}
                      onChange={(e) => setFormBankName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">Account Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 50200018920194"
                      value={formAccountNumber}
                      onChange={(e) => setFormAccountNumber(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">IFSC / SWIFT Code</label>
                    <input
                      type="text"
                      placeholder="HDFC0000123"
                      value={formIfsc}
                      onChange={(e) => setFormIfsc(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono uppercase text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">Branch</label>
                    <input
                      type="text"
                      placeholder="Industrial Fort Branch"
                      value={formBranch}
                      onChange={(e) => setFormBranch(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---------------- TAB 4: COMPLIANCE & MSME ---------------- */}
          {activeTab === 'compliance' && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0F8B8D]" />
                  <span>MSME & Statutory Compliances</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="msme-chk"
                    checked={formMsmeRegistered}
                    onChange={(e) => setFormMsmeRegistered(e.target.checked)}
                    className="rounded text-[#0F8B8D] focus:ring-[#0F8B8D]"
                  />
                  <label htmlFor="msme-chk" className="text-slate-700 font-medium cursor-pointer">
                    Enterprise is registered under MSME / Udyam scheme
                  </label>
                </div>
                {formMsmeRegistered && (
                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">Udyam Registration Number</label>
                    <input
                      type="text"
                      placeholder="UDYAM-GJ-01-0012345"
                      value={formUdyamNo}
                      onChange={(e) => setFormUdyamNo(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono uppercase text-xs text-slate-800"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Approved Credit Limit (₹ Lakhs)</label>
                  <input
                    type="number"
                    min={0}
                    value={formCreditLimit}
                    onChange={(e) => setFormCreditLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs font-mono text-slate-800"
                  />
                </div>
                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <div className="font-semibold text-slate-700">Polymer Quality Certifications:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-600">
                      <input
                        type="checkbox"
                        checked={formIso9001}
                        onChange={(e) => setFormIso9001(e.target.checked)}
                        className="rounded text-[#0F8B8D]"
                      />
                      <span>ISO 9001:2015 QMS</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-600">
                      <input
                        type="checkbox"
                        checked={formFoodGrade}
                        onChange={(e) => setFormFoodGrade(e.target.checked)}
                        className="rounded text-[#0F8B8D]"
                      />
                      <span>FDA Food Contact</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-600">
                      <input
                        type="checkbox"
                        checked={formReachRoHS}
                        onChange={(e) => setFormReachRoHS(e.target.checked)}
                        className="rounded text-[#0F8B8D]"
                      />
                      <span>REACH & RoHS Declared</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal Actions matching screenshot */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#0F8B8D] hover:bg-[#0d797b] text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Register & Submit for Approval
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
