import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Filter,
  Download,
  Star,
  ShieldAlert,
  SlidersHorizontal,
  ArrowUpDown,
  Building,
  Mail,
  Phone,
  Truck,
  ExternalLink,
  Award,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import {
  SupplierMaster,
  SupplierCategory,
  SupplierStatus,
} from '../../types/procurement';
import { ProcurementStatusBadge } from './ProcurementStatusBadge';
import { PaginationBar } from '../common/PaginationBar';

interface Props {
  suppliers: SupplierMaster[];
  onNavigate: (view: string, param?: any) => void;
  onUpdateSupplier: (supplier: SupplierMaster) => void;
  onCreateSupplier: (supplier: SupplierMaster) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
}

export const SupplierMasterListView: React.FC<Props> = ({
  suppliers,
  onNavigate,
  onUpdateSupplier,
  onCreateSupplier,
  openDrawer,
  closeDrawer,
  showToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedRisk, setSelectedRisk] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const categories: string[] = [
    'All',
    'Virgin Resin',
    'Masterbatch & Colorants',
    'Additives & Fillers',
    'Regrind & Recycled',
    'Packaging Materials',
    'Molds & Tooling',
    'Machine Spare Parts',
  ];

  // Filtering
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((sup) => {
      const matchSearch =
        sup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sup.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sup.bankingTax?.taxId && sup.bankingTax.taxId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        sup.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sup.contacts.some(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.email.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchCategory = selectedCategory === 'All' || sup.category === selectedCategory;
      const matchStatus = selectedStatus === 'All' || sup.status === selectedStatus;
      const matchRisk = selectedRisk === 'All' || sup.riskLevel === selectedRisk;

      return matchSearch && matchCategory && matchStatus && matchRisk;
    });
  }, [suppliers, searchTerm, selectedCategory, selectedStatus, selectedRisk]);

  const totalPages = Math.ceil(filteredSuppliers.length / pageSize) || 1;
  const paginatedSuppliers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSuppliers.slice(start, start + pageSize);
  }, [filteredSuppliers, currentPage, pageSize]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Code', 'Name', 'Category', 'Status', 'Rating', 'Risk', 'Payment Terms', 'Open PO Value', 'Lead Time'];
    const rows = filteredSuppliers.map(s => [
      s.code,
      `"${s.name}"`,
      `"${s.category}"`,
      s.status,
      s.rating,
      s.riskLevel,
      `"${s.paymentTerms}"`,
      s.openPOValue,
      `${s.leadTimeDays} Days`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Supplier_Master_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filteredSuppliers.length} suppliers to CSV`);
  };

  // Open New Supplier Drawer
  const handleOpenCreateDrawer = () => {
    let formCode = `SUP-NEW-${Math.floor(100 + Math.random() * 900)}`;
    let formName = '';
    let formLegalName = '';
    let formCategory: SupplierCategory = 'Virgin Resin';
    let formTerms = 'Net 30 Days';
    let formGstin = '';
    let formPan = '';
    let formContactName = '';
    let formContactEmail = '';
    let formContactPhone = '';
    let formLeadTime = 7;

    const handleSubmit = () => {
      if (!formName.trim()) {
        alert('Please enter supplier company name');
        return;
      }
      const newSup: SupplierMaster = {
        id: `SUP-${Date.now()}`,
        code: formCode,
        name: formName,
        legalName: formLegalName || formName,
        type: 'Manufacturer',
        category: formCategory,
        status: 'pending_approval',
        rating: 4.0,
        riskLevel: 'Low',
        preferred: false,
        blocked: false,
        industry: formCategory,
        country: 'India',
        currency: 'INR (₹)',
        paymentTerms: formTerms,
        deliveryTerms: 'Door Delivery',
        leadTimeDays: Number(formLeadTime) || 7,
        minimumOrderValue: 50000,
        createdDate: new Date().toISOString().slice(0, 10),
        openPOsCount: 0,
        openPOValue: 0,
        outstandingBalance: 0,
        contacts: formContactName ? [
          {
            id: `CON-${Date.now()}`,
            name: formContactName,
            role: 'Sales Representative',
            department: 'Sales',
            email: formContactEmail,
            phone: formContactPhone,
            isPrimary: true,
            preferredContact: 'Email',
            active: true,
          }
        ] : [],
        addresses: [],
        bankingTax: {
          bankName: 'HDFC Bank Ltd',
          accountNumber: '50200000000',
          ifscOrSwift: 'HDFC0000123',
          branch: 'Main Branch',
          paymentMethod: 'NEFT/RTGS',
          taxId: formGstin || '27AAACR0000K1Z0',
          panNumber: formPan || 'AAACR0000K',
          msmeRegistered: false,
          withholdingTaxPct: 0.1,
          eInvoicingEnabled: true,
        },
        itemsSupplied: [],
        priceLists: [],
        documents: [],
        compliance: {
          esgRating: 'B',
          esgScore: 75,
          iso9001Valid: true,
          iso9001Expiry: '2027-12-31',
          iso14001Valid: false,
          foodGradeCompliant: true,
          reachCompliant: true,
          rohsCompliant: true,
          recycledContentCert: false,
          conflictMineralsDeclaration: true,
          lastAuditDate: new Date().toISOString().slice(0, 10),
          lastAuditScore: 85,
          auditFindings: 0,
          openCapas: 0,
        },
        scorecard: {
          overallScore: 85.0,
          overallGrade: 'B',
          trend: 'stable',
          evaluationPeriod: 'New Vendor Evaluation',
          onTimeDeliveryPct: 95.0,
          quantityAccuracyPct: 100,
          qualityAcceptancePct: 98.0,
          priceCompetitivenessPct: 90.0,
          priceVariancePct: 0.0,
          responsivenessScore: 90,
          documentCompliancePct: 100,
          complaintResolutionDays: 3.0,
          returnRatePct: 0.0,
          metrics: []
        },
        activityHistory: [
          {
            id: `ACT-${Date.now()}`,
            date: new Date().toISOString().slice(0, 10),
            user: 'Procurement Officer',
            action: 'Supplier Registered',
            details: 'Initiated onboarding workflow',
          }
        ]
      };

      onCreateSupplier(newSup);
      closeDrawer();
      showToast(`Supplier ${newSup.name} (${newSup.code}) registered and submitted for onboarding approval`);
    };

    openDrawer(
      'Register New Supplier / Vendor',
      <div className="space-y-4 text-xs">
        <div className="p-3 bg-[#14213D] text-white rounded-xl">
          <div className="text-[10px] text-[#0F8B8D] font-bold uppercase tracking-wider">Vendor Onboarding</div>
          <div className="font-bold text-sm">Polymer & Material Supplier Registration</div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Supplier Code</label>
            <input
              type="text"
              defaultValue={formCode}
              onChange={(e) => (formCode = e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-mono text-xs"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Category *</label>
            <select
              defaultValue={formCategory}
              onChange={(e) => (formCategory = e.target.value as SupplierCategory)}
              className="w-full px-3 py-2 border rounded-lg bg-white text-xs"
            >
              {categories.filter(c => c !== 'All').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-slate-600 font-semibold mb-1">Company / Trade Name *</label>
          <input
            type="text"
            placeholder="e.g. Supreme Petrochem Polymers Ltd"
            onChange={(e) => (formName = e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white text-xs"
          />
        </div>

        <div>
          <label className="block text-slate-600 font-semibold mb-1">Legal Registered Entity Name</label>
          <input
            type="text"
            placeholder="e.g. Supreme Petrochemicals Private Limited"
            onChange={(e) => (formLegalName = e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white text-xs"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">GSTIN / Tax ID</label>
            <input
              type="text"
              placeholder="e.g. 27AAACS1982K1Z3"
              onChange={(e) => (formGstin = e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white font-mono text-xs uppercase"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-semibold mb-1">PAN Number</label>
            <input
              type="text"
              placeholder="e.g. AAACS1982K"
              onChange={(e) => (formPan = e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white font-mono text-xs uppercase"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Payment Terms</label>
            <select
              defaultValue={formTerms}
              onChange={(e) => (formTerms = e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white text-xs"
            >
              <option value="Net 30 Days">Net 30 Days</option>
              <option value="Net 45 Days">Net 45 Days</option>
              <option value="Net 60 Days">Net 60 Days</option>
              <option value="Advance / LC">Advance / LC</option>
              <option value="10% Advance, Net 30">10% Advance, Net 30</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Avg Lead Time (Days)</label>
            <input
              type="number"
              defaultValue={formLeadTime}
              onChange={(e) => (formLeadTime = Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg bg-white text-xs"
            />
          </div>
        </div>

        <div className="p-3 bg-slate-50 border rounded-xl space-y-2">
          <div className="font-semibold text-slate-700">Primary Contact Person</div>
          <div>
            <input
              type="text"
              placeholder="Contact Person Name"
              onChange={(e) => (formContactName = e.target.value)}
              className="w-full px-3 py-1.5 border rounded-lg bg-white text-xs mb-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="email"
              placeholder="Email Address"
              onChange={(e) => (formContactEmail = e.target.value)}
              className="w-full px-3 py-1.5 border rounded-lg bg-white text-xs"
            />
            <input
              type="tel"
              placeholder="Mobile / Phone"
              onChange={(e) => (formContactPhone = e.target.value)}
              className="w-full px-3 py-1.5 border rounded-lg bg-white text-xs"
            />
          </div>
        </div>
      </div>,
      <div className="flex justify-end gap-2">
        <button
          onClick={closeDrawer}
          className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-xs font-semibold"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-[#0F8B8D] hover:bg-[#0d797b] text-white rounded-lg text-xs font-semibold shadow-sm"
        >
          Register & Submit for Approval
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D]">
            Supplier Master Directory
          </h1>
          <p className="text-xs text-slate-500">
            {filteredSuppliers.length} suppliers registered • Polymer producers, masterbatch formulators, and mold toolmakers
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-[#14213D] rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            onClick={handleOpenCreateDrawer}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0F8B8D] hover:bg-[#0d797b] text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" /> Onboard Supplier
          </button>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-b border-slate-200">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setSelectedCategory(cat);
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition ${
              selectedCategory === cat
                ? 'bg-[#14213D] text-white shadow-sm font-semibold'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search & Secondary Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by vendor name, code, GSTIN, contact..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#0F8B8D]"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700"
          >
            <option value="All">All Statuses</option>
            <option value="preferred">Preferred</option>
            <option value="active">Active</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="under_review">Under Review</option>
            <option value="blocked">Blocked</option>
          </select>

          <select
            value={selectedRisk}
            onChange={(e) => {
              setSelectedRisk(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700"
          >
            <option value="All">All Risk Levels</option>
            <option value="Low">Low Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="High">High Risk</option>
            <option value="Critical">Critical Risk</option>
          </select>
        </div>
      </div>

      {/* Advanced Supplier Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 font-semibold">Supplier Name / Code</th>
                <th className="py-3 px-3 font-semibold">Category</th>
                <th className="py-3 px-3 font-semibold">Primary Contact</th>
                <th className="py-3 px-3 font-semibold">Payment & Incoterms</th>
                <th className="py-3 px-3 font-semibold text-right">Open PO Value</th>
                <th className="py-3 px-3 font-semibold text-center">Rating / Grade</th>
                <th className="py-3 px-3 font-semibold text-center">Risk</th>
                <th className="py-3 px-3 font-semibold text-center">Status</th>
                <th className="py-3 px-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No suppliers match your search filters.
                  </td>
                </tr>
              ) : (
                paginatedSuppliers.map((sup) => (
                  <tr
                    key={sup.id}
                    className="hover:bg-slate-50/80 transition group cursor-pointer"
                    onClick={() => onNavigate('supplierDetail', { id: sup.id })}
                  >
                    {/* Name & Code */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        {sup.preferred && (
                          <span title="Preferred Tier-1 Supplier">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                          </span>
                        )}
                        {sup.blocked && (
                          <span title={`Vendor Blocked: ${sup.blockedReason}`}>
                            <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                          </span>
                        )}
                        <div>
                          <div className="font-bold text-[#14213D] group-hover:text-[#0F8B8D] transition">
                            {sup.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {sup.code} {sup.bankingTax?.taxId && `• GSTIN: ${sup.bankingTax.taxId}`}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                        {sup.category}
                      </span>
                    </td>

                    {/* Contact */}
                    <td className="py-3 px-3">
                      {sup.contacts[0] ? (
                        <div>
                          <div className="font-medium text-[#14213D]">{sup.contacts[0].name}</div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" /> {sup.contacts[0].email}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No contact logged</span>
                      )}
                    </td>

                    {/* Terms */}
                    <td className="py-3 px-3">
                      <div className="font-medium text-[#14213D]">{sup.paymentTerms}</div>
                      <div className="text-[10px] text-slate-500">{sup.deliveryTerms} • {sup.leadTimeDays}d Lead</div>
                    </td>

                    {/* Open PO Value */}
                    <td className="py-3 px-3 text-right font-semibold text-[#14213D]">
                      {sup.openPOValue > 0 ? (
                        <div>
                          <div>₹{(sup.openPOValue / 100000).toFixed(2)} L</div>
                          <div className="text-[10px] text-slate-500">{sup.openPOsCount} POs Active</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-normal">₹0</span>
                      )}
                    </td>

                    {/* Score / Grade */}
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-[11px]">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                        <span>{sup.rating.toFixed(1)}</span>
                        <span className="text-[10px] text-slate-500 font-normal">({sup.scorecard.overallGrade})</span>
                      </div>
                    </td>

                    {/* Risk Badge */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          sup.riskLevel === 'Critical'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : sup.riskLevel === 'High'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : sup.riskLevel === 'Medium'
                            ? 'bg-sky-100 text-sky-800 border border-sky-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {sup.riskLevel}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 text-center">
                      <ProcurementStatusBadge status={sup.status} size="xs" />
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onNavigate('supplierDetail', { id: sup.id })}
                          className="px-2.5 py-1 text-[11px] font-semibold text-[#0F8B8D] hover:bg-[#0F8B8D]/10 rounded transition"
                        >
                          View 14 Tabs
                        </button>
                        <button
                          onClick={() => {
                            showToast(`Creating Purchase Order for ${sup.name}`);
                            onNavigate('poList');
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-[#14213D] hover:bg-[#1f325c] text-white rounded transition shadow-sm"
                        >
                          + PO
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredSuppliers.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={(sz) => {
            setPageSize(sz);
            setCurrentPage(1);
          }}
          itemName="suppliers"
        />
      </div>
    </div>
  );
};
