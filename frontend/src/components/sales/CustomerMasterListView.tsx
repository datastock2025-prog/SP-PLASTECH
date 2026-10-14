import React, { useState, useEffect } from 'react';
import {
  Building,
  Search,
  Plus,
  Filter,
  Download,
  Share2,
  SlidersHorizontal,
  CreditCard,
  User,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Edit,
  DollarSign,
  FileCheck,
  History,
  Trash2,
} from 'lucide-react';
import { Customer, SalesOrder, SalesQuotation } from '../../types';
import { PaginationBar } from '../common/PaginationBar';
import {
  customerMasterService,
  EnrichedCustomerRecord,
} from '../../services/customerMasterService';
import { CustomerOnboardingWizardModal } from './CustomerOnboardingWizardModal';
import { CustomerPoAmendmentModal } from './CustomerPoAmendmentModal';
import { adminEventBus } from '../../services/adminService';

interface Props {
  customers: Customer[];
  sos?: SalesOrder[];
  quotes?: SalesQuotation[];
  onNavigate: (view: string, param?: any) => void;
  onCreateCustomer?: (c: Customer) => void;
  onUpdateCustomer?: (c: Customer) => void;
  openDrawer?: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer?: () => void;
  showToast: (msg: string) => void;
}

export const CustomerMasterListView: React.FC<Props> = ({
  customers,
  sos = [],
  quotes = [],
  onNavigate,
  onCreateCustomer,
  onUpdateCustomer,
  openDrawer,
  closeDrawer,
  showToast,
}) => {
  const [search, setSearch] = useState<string>('');
  const [segmentFilter, setSegmentFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Live Enriched Customers from CustomerMasterService
  const [liveCustomers, setLiveCustomers] = useState<EnrichedCustomerRecord[]>(() =>
    customerMasterService.getCustomersSync()
  );

  useEffect(() => {
    const handleUpdate = () => {
      setLiveCustomers(customerMasterService.getCustomersSync());
    };
    adminEventBus.on('CUSTOMER_SAVED', handleUpdate);
    adminEventBus.on('CUSTOMER_DELETED', handleUpdate);
    return () => {
      adminEventBus.off('CUSTOMER_SAVED', handleUpdate);
      adminEventBus.off('CUSTOMER_DELETED', handleUpdate);
    };
  }, []);

  // Wizard & PO Modal state
  const [isOnboardingWizardOpen, setIsOnboardingWizardOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<EnrichedCustomerRecord | null>(null);
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [selectedCustomerForPo, setSelectedCustomerForPo] =
    useState<EnrichedCustomerRecord | null>(null);

  // Metrics
  const totalCustomers = liveCustomers.length;
  const activeCustomers = liveCustomers.filter((c) => c.status === 'active').length;
  const totalCreditSanctioned = liveCustomers.reduce((sum, c) => sum + (c.creditLimit || 0), 0);
  const totalOverdue = liveCustomers.reduce((sum, c) => sum + (c.overdueAmount || 0), 0);

  const filteredCustomers = liveCustomers.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      (c.contactPerson && c.contactPerson.toLowerCase().includes(search.toLowerCase())) ||
      (c.gstin && c.gstin.toLowerCase().includes(search.toLowerCase())) ||
      (c.poNumber && c.poNumber.toLowerCase().includes(search.toLowerCase()));

    const matchSegment = segmentFilter === 'all' || c.segment === segmentFilter;
    const matchRisk = riskFilter === 'all' || (c.riskRating && c.riskRating === riskFilter);

    return matchSearch && matchSegment && matchRisk;
  });

  const totalPages = Math.ceil(filteredCustomers.length / pageSize) || 1;
  const pagedCustomers = filteredCustomers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleDeleteCustomer = (c: EnrichedCustomerRecord) => {
    if (window.confirm(`Are you sure you want to deactivate Customer ${c.name} (${c.code})?`)) {
      customerMasterService.deleteCustomer(c.code);
      showToast(`✓ Deactivated Customer ${c.name} (${c.code})`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-[#E4E0D6] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[#0F8B8D]/10 text-[#0F8B8D] font-mono font-bold text-[10px] uppercase tracking-wider">
              Customer Accounts &middot; Commercial 360&deg; Master
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono text-[10px] font-semibold border border-emerald-200">
              KYC &amp; Credit Verified
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#14213D] mt-1 font-['Space_Grotesk']">
            Customer Directory &amp; Master Accounts
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Manage corporate client accounts, PO governance &amp; LIFO version traceability, contracted rates, payment terms, and 360&deg; relationship history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast('Exporting customer accounts data...')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E0D6] bg-[#F6F4EF] hover:bg-[#E4E0D6] text-xs font-semibold text-[#14213D] cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" /> Export CSV
          </button>
          <button
            onClick={() => {
              setEditingCustomer(null);
              setIsOnboardingWizardOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#0F8B8D] hover:bg-[#0d7a7c] text-white text-xs font-bold shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> + Onboard New Customer (Wizard)
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E4E0D6] shadow-xs">
          <div className="text-[11px] text-[#6B7280] font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>Enterprise Customer Base</span>
            <Building className="w-4 h-4 text-[#0F8B8D]" />
          </div>
          <div className="text-2xl font-bold font-['Space_Grotesk'] text-[#14213D] mt-1">
            {totalCustomers.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            {activeCustomers.toLocaleString()} Active Corporate Accounts
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E4E0D6] shadow-xs">
          <div className="text-[11px] text-[#6B7280] font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>Sanctioned Credit Limit</span>
            <CreditCard className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold font-['Space_Grotesk'] text-purple-700 mt-1">
            ₹{(totalCreditSanctioned / 10000000).toFixed(2)} Cr
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Total approved working credit</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E4E0D6] shadow-xs">
          <div className="text-[11px] text-[#6B7280] font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>Overdue Exposure</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold font-['Space_Grotesk'] text-red-700 mt-1">
            ₹{(totalOverdue / 100000).toFixed(2)} Lakhs
          </div>
          <div className="text-[11px] text-red-600 font-medium mt-1">
            {liveCustomers.filter((c) => (c.overdueAmount || 0) > 0).length} accounts with overdue aging
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E4E0D6] shadow-xs">
          <div className="text-[11px] text-[#6B7280] font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>Key Tier 1 OEMs</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-['Space_Grotesk'] text-emerald-700 mt-1">
            {liveCustomers.filter((c) => c.riskRating === 'AAA' || c.riskRating === 'AA').length}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">High-volume institutional clients</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-[#E4E0D6] flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full md:max-w-lg">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA5C4]" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search across customers by Name, Code, PO #, GSTIN, or Contact..."
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-[#E4E0D6] text-xs bg-[#F6F4EF] focus:bg-white focus:outline-none focus:border-[#0F8B8D] transition"
          />
          {search && (
            <button
              onClick={() => {
                setSearch('');
                setCurrentPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <span className="text-xs font-bold">&times;</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <select
            value={segmentFilter}
            onChange={(e) => {
              setSegmentFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-[#E4E0D6] text-xs bg-[#F6F4EF] font-medium text-[#14213D] focus:outline-none focus:border-[#0F8B8D]"
          >
            <option value="all">All Segments</option>
            <option value="Automotive OEM Tier 1">Automotive OEM Tier 1</option>
            <option value="FMCG Rigid Packaging">FMCG Rigid Packaging</option>
            <option value="Retail & Packaging">Retail &amp; Packaging</option>
            <option value="Electronics Enclosures">Electronics Enclosures</option>
            <option value="Industrial Components">Industrial Components</option>
          </select>

          <select
            value={riskFilter}
            onChange={(e) => {
              setRiskFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-[#E4E0D6] text-xs bg-[#F6F4EF] font-medium text-[#14213D] focus:outline-none focus:border-[#0F8B8D]"
          >
            <option value="all">All Risk Ratings</option>
            <option value="AAA">Rating: AAA (Prime)</option>
            <option value="AA">Rating: AA (Strong)</option>
            <option value="A">Rating: A (Standard)</option>
            <option value="BBB">Rating: BBB (Moderate)</option>
            <option value="High Risk">Rating: High Risk</option>
          </select>

          <div className="text-xs text-slate-500 font-mono pl-1 hidden lg:inline">
            {filteredCustomers.length} Matched
          </div>
        </div>
      </div>

      {/* Customer Master Table with Full CRUD & PO Traceability */}
      <div className="bg-white rounded-xl border border-[#E4E0D6] shadow-sm overflow-hidden">
        <table className="w-full text-xs text-left border-collapse table-fixed">
          <colgroup>
            <col className="w-[26%]" />
            <col className="w-[18%]" />
            <col className="w-[18%]" />
            <col className="w-[14%]" />
            <col className="w-[10%]" />
            <col className="w-[14%]" />
          </colgroup>
          <thead>
            <tr className="bg-[#14213D] text-[#EDEFF7] font-semibold text-[11px]">
              <th className="py-3 px-4">Customer Code &amp; Legal Name</th>
              <th className="py-3 px-3">Active PO &amp; LIFO Revision</th>
              <th className="py-3 px-3">Credit Limit &amp; Terms</th>
              <th className="py-3 px-3">State &amp; GSTIN</th>
              <th className="py-3 px-3 text-center">Status &amp; Risk</th>
              <th className="py-3 px-4 text-right">Admin CRUD Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E0D6]">
            {pagedCustomers.map((c) => {
              const limit = c.creditLimit || 1500000;
              const used = c.currentBalance || Math.round(limit * 0.45);
              const usedPct = ((used / limit) * 100).toFixed(0);
              const poInfo = customerMasterService.getLatestPoForCustomer(c.code);

              return (
                <tr
                  key={c.code}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => onNavigate('customerDetail', { id: c.code })}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#14213D] text-white flex items-center justify-center font-bold text-xs flex-shrink-0 font-mono">
                        {c.code.replace('CUST-', '')}
                      </div>
                      <div className="truncate">
                        <div className="font-bold text-[#14213D] hover:text-[#0F8B8D] truncate">
                          {c.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">
                          {c.code} &middot; {c.segment || 'OEM Partner'}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <div className="font-mono font-bold text-slate-900 truncate flex items-center gap-1">
                      <FileCheck className="w-3.5 h-3.5 text-[#0F8B8D]" />
                      <span>{poInfo.poNumber || 'No PO'}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-teal-700 bg-teal-50 px-1 py-0.2 rounded font-bold border border-teal-200">
                        {poInfo.version || 'v1.0'}
                      </span>
                      <span>({poInfo.poDate || c.poDate || '2026-09-01'})</span>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <div className="flex justify-between text-[11px] mb-1 font-mono">
                      <span className="font-bold text-[#14213D]">
                        ₹{(limit / 100000).toFixed(1)}L Limit
                      </span>
                      <span className="text-slate-500 font-semibold">{c.paymentTerms || 'Net 30 Days'}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#0F8B8D]"
                        style={{ width: `${Math.min(100, parseInt(usedPct))}%` }}
                      />
                    </div>
                  </td>

                  <td className="py-3 px-3 text-slate-700">
                    <div className="font-semibold text-slate-900 truncate">{c.state || 'Maharashtra'}</div>
                    <div className="text-[10px] font-mono text-slate-400 truncate">{c.gstin || '27AAACT2727Q1ZW'}</div>
                  </td>

                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                          c.riskRating === 'AAA' || c.riskRating === 'AA'
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.riskRating === 'A'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {c.riskRating || 'AA'}
                      </span>
                      <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800">
                        Active
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {/* Edit Customer Master Wizard */}
                      <button
                        title="Edit Customer Master via Wizard"
                        onClick={() => {
                          setEditingCustomer(c);
                          setIsOnboardingWizardOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-[#0F8B8D] cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      {/* Amend PO & Version History */}
                      <button
                        title="Amend PO & LIFO Version Traceability"
                        onClick={() => {
                          setSelectedCustomerForPo(c);
                          setIsPoModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete / Deactivate */}
                      <button
                        title="Deactivate Customer"
                        onClick={() => handleDeleteCustomer(c)}
                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* High-Volume Pagination Bar */}
        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          pageSizeOptions={[10, 25, 50, 100, 250, 500]}
          totalItems={filteredCustomers.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemName="customers"
        />
      </div>

      {/* Customer Onboarding & Master Edit 5-Step Wizard Modal */}
      {isOnboardingWizardOpen && (
        <CustomerOnboardingWizardModal
          isOpen={isOnboardingWizardOpen}
          onClose={() => {
            setIsOnboardingWizardOpen(false);
            setEditingCustomer(null);
          }}
          initialCustomer={editingCustomer}
          onCustomerSaved={(saved) => {
            showToast(`✓ Customer ${saved.name} (${saved.code}) saved successfully!`);
          }}
          showToast={showToast}
        />
      )}

      {/* PO Amendment & Version History Traceability Modal */}
      {isPoModalOpen && selectedCustomerForPo && (
        <CustomerPoAmendmentModal
          isOpen={isPoModalOpen}
          onClose={() => {
            setIsPoModalOpen(false);
            setSelectedCustomerForPo(null);
          }}
          customer={selectedCustomerForPo}
          onPoUpdated={(updated) => {
            showToast(`✓ PO updated for ${updated.name}`);
          }}
          showToast={showToast}
        />
      )}
    </div>
  );
};

