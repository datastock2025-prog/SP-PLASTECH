import React, { useState } from 'react';
import {
  ArrowLeft,
  Building,
  Mail,
  Phone,
  Truck,
  FileText,
  DollarSign,
  ShieldCheck,
  ShieldAlert,
  Award,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Plus,
  Edit,
  ExternalLink,
  Download,
  Calendar,
  Layers,
  Star,
  Scale,
  CreditCard,
  Globe,
  Upload,
} from 'lucide-react';
import {
  SupplierMaster,
  ExtendedPurchaseOrder,
  GoodsReceiptNote,
  SupplierInvoiceRecord,
  SupplierReturnRecord,
} from '../../types/procurement';
import { ProcurementStatusBadge } from './ProcurementStatusBadge';

interface Props {
  supplierId: string;
  suppliers: SupplierMaster[];
  pos: ExtendedPurchaseOrder[];
  grns: GoodsReceiptNote[];
  invoices: SupplierInvoiceRecord[];
  returns: SupplierReturnRecord[];
  onNavigate: (view: string, param?: any) => void;
  onUpdateSupplier: (supplier: SupplierMaster) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
}

export const SupplierDetailView: React.FC<Props> = ({
  supplierId,
  suppliers,
  pos,
  grns,
  invoices,
  returns,
  onNavigate,
  onUpdateSupplier,
  openDrawer,
  closeDrawer,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<number>(0);

  const supplier = suppliers.find((s) => s.id === supplierId) || suppliers[0];

  if (!supplier) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800">Supplier Not Found</h2>
        <button
          onClick={() => onNavigate('supplierList')}
          className="mt-4 px-4 py-2 bg-[#14213D] text-white rounded-lg text-xs"
        >
          Return to Supplier Directory
        </button>
      </div>
    );
  }

  // Linked records
  const supplierPos = pos.filter((p) => p.supplierId === supplier.id);
  const supplierGrns = grns.filter((g) => g.supplierId === supplier.id);
  const supplierInvoices = invoices.filter((i) => i.supplierId === supplier.id);
  const supplierReturns = returns.filter((r) => r.supplierId === supplier.id);

  const tabs = [
    '1. Overview',
    '2. General Info',
    '3. Contacts',
    '4. Addresses',
    '5. Banking & Tax',
    '6. Items Supplied',
    '7. Price Schedules',
    '8. Purchase History',
    '9. Quality & Inspection',
    '10. Performance Scorecard',
    '11. Supply Contracts',
    '12. Document Vault',
    '13. ESG & Compliance',
    '14. Approvals & Audit Trail',
  ];

  return (
    <div className="space-y-5 pb-12">
      {/* Back Button & Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('supplierList')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#14213D] transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Supplier Directory
        </button>

        <div className="flex items-center gap-2">
          {supplier.blocked ? (
            <button
              onClick={() => {
                const updated = { ...supplier, blocked: false, status: 'active' as const };
                onUpdateSupplier(updated);
                showToast(`Unblocked supplier ${supplier.name}`);
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              Unblock Supplier
            </button>
          ) : (
            <button
              onClick={() => {
                const updated = { ...supplier, blocked: true, status: 'blocked' as const, blockedReason: 'Manual hold by Quality & Procurement manager' };
                onUpdateSupplier(updated);
                showToast(`Blocked supplier ${supplier.name}`);
              }}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              Block Supplier
            </button>
          )}

          <button
            onClick={() => {
              showToast(`Drafting Purchase Order for ${supplier.name}`);
              onNavigate('poList');
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0F8B8D] hover:bg-[#0d797b] text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" /> Issue PO
          </button>
        </div>
      </div>

      {/* Hero Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#14213D] text-white flex items-center justify-center font-bold text-xl font-['Space_Grotesk'] shadow">
              {supplier.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D]">
                  {supplier.name}
                </h1>
                <ProcurementStatusBadge status={supplier.status} />
                {supplier.preferred && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-500" /> Tier-1 Preferred
                  </span>
                )}
                {supplier.blocked && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200 px-2.5 py-0.5 rounded-full">
                    <ShieldAlert className="w-3 h-3 text-red-600" /> Vendor Blocked
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                <span className="font-mono font-semibold text-[#14213D]">{supplier.code}</span> • {supplier.legalName || supplier.name} • Category: <span className="font-medium text-[#14213D]">{supplier.category}</span> • GSTIN: <span className="font-mono">{supplier.bankingTax.taxId}</span>
              </p>
            </div>
          </div>

          {/* Quick Metrics in Header */}
          <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100 self-start md:self-auto">
            <div className="text-center px-2">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">OTD %</div>
              <div className="text-base font-bold text-emerald-700 font-['Space_Grotesk']">
                {supplier.scorecard.onTimeDeliveryPct}%
              </div>
            </div>
            <div className="w-[1px] h-8 bg-slate-200" />
            <div className="text-center px-2">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">QC Pass Rate</div>
              <div className="text-base font-bold text-emerald-700 font-['Space_Grotesk']">
                {supplier.scorecard.qualityAcceptancePct}%
              </div>
            </div>
            <div className="w-[1px] h-8 bg-slate-200" />
            <div className="text-center px-2">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Grade</div>
              <div className="text-base font-bold text-[#14213D] font-['Space_Grotesk']">
                {supplier.scorecard.overallGrade}
              </div>
            </div>
          </div>
        </div>

        {/* 14 Tabs Navigation Bar */}
        <div className="flex items-center gap-1 overflow-x-auto mt-6 pt-2 border-t border-slate-100 scrollbar-thin">
          {tabs.map((tab, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(idx)}
              className={`px-3 py-2 text-xs font-semibold whitespace-nowrap rounded-lg transition ${
                activeTab === idx
                  ? 'bg-[#14213D] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content Display */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        {/* ----------------- TAB 0: OVERVIEW ----------------- */}
        {activeTab === 0 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="text-xs text-slate-500">Active PO Commitment</div>
                <div className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D] mt-1">
                  ₹{(supplier.openPOValue / 100000).toFixed(2)} Lakhs
                </div>
                <div className="text-[11px] text-slate-500 mt-1">{supplier.openPOsCount} Open Orders</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="text-xs text-slate-500">Outstanding Balance</div>
                <div className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D] mt-1">
                  ₹{(supplier.outstandingBalance / 100000).toFixed(2)} Lakhs
                </div>
                <div className="text-[11px] text-emerald-600 font-medium mt-1">Under Credit Limit</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="text-xs text-slate-500">Avg Lead Time</div>
                <div className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D] mt-1">
                  {supplier.leadTimeDays} Days
                </div>
                <div className="text-[11px] text-slate-500 mt-1">{supplier.deliveryTerms}</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="text-xs text-slate-500">Risk Assessment</div>
                <div className="text-xl font-bold font-['Space_Grotesk'] text-emerald-700 mt-1">
                  {supplier.riskLevel} Risk
                </div>
                <div className="text-[11px] text-slate-500 mt-1">ESG Score: {supplier.compliance.esgScore}/100</div>
              </div>
            </div>

            {/* Polymer Resins & Items Supplied */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[#14213D]">Key Polymer Materials Supplied</h3>
                <span className="text-xs text-slate-500">{supplier.itemsSupplied.length} Approved SKUs</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Item Code</th>
                      <th className="py-2 px-3">Material Description</th>
                      <th className="py-2 px-3">Supplier SKU</th>
                      <th className="py-2 px-3 text-right">Last Price</th>
                      <th className="py-2 px-3 text-right">Contract Price</th>
                      <th className="py-2 px-3 text-center">QC Checks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {supplier.itemsSupplied.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-bold text-[#14213D]">{item.itemCode}</td>
                        <td className="py-2 px-3 font-medium">{item.itemName}</td>
                        <td className="py-2 px-3 text-slate-600 font-mono">{item.supplierItemCode}</td>
                        <td className="py-2 px-3 text-right font-semibold text-[#14213D]">₹{item.lastPurchasePrice.toFixed(2)} / {item.uom}</td>
                        <td className="py-2 px-3 text-right text-emerald-700 font-bold">₹{item.contractPrice?.toFixed(2) || '—'}</td>
                        <td className="py-2 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-100">
                            COA + MSDS Verified
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notes & Special Instructions */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs">
              <div className="font-bold text-[#14213D] mb-1">Procurement Notes & Handling Specs</div>
              <p className="text-slate-600">{supplier.notes || 'No custom procurement notes recorded.'}</p>
            </div>
          </div>
        )}

        {/* ----------------- TAB 1: GENERAL INFO ----------------- */}
        {activeTab === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-[#14213D] border-b pb-2">Company Identification</h3>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Supplier Code</span>
                <span className="font-mono font-bold text-[#14213D]">{supplier.code}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Legal Name</span>
                <span className="font-semibold text-[#14213D]">{supplier.legalName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Business Type</span>
                <span className="font-semibold text-[#14213D]">{supplier.type}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Industry / Segment</span>
                <span className="font-semibold text-[#14213D]">{supplier.industry}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Country of Origin</span>
                <span className="font-semibold text-[#14213D]">{supplier.country}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Website</span>
                <a href={supplier.website} target="_blank" rel="noreferrer" className="text-[#0F8B8D] font-semibold hover:underline flex items-center gap-1">
                  {supplier.website || '—'} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-sm text-[#14213D] border-b pb-2">Commercial & Order Terms</h3>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Default Currency</span>
                <span className="font-semibold text-[#14213D]">{supplier.currency}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Payment Terms</span>
                <span className="font-semibold text-[#14213D]">{supplier.paymentTerms}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Delivery Incoterms</span>
                <span className="font-semibold text-[#14213D]">{supplier.deliveryTerms}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Standard Lead Time</span>
                <span className="font-semibold text-[#14213D]">{supplier.leadTimeDays} Days</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Minimum Order Value (MOV)</span>
                <span className="font-semibold text-[#14213D]">₹{supplier.minimumOrderValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Onboarding Date</span>
                <span className="font-semibold text-[#14213D]">{supplier.createdDate}</span>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- TAB 2: CONTACTS ----------------- */}
        {activeTab === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#14213D]">Key Contact Personnel</h3>
              <button
                onClick={() => showToast('Add contact modal opened')}
                className="flex items-center gap-1 text-xs font-semibold text-[#0F8B8D] hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Add Contact
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {supplier.contacts.map((contact) => (
                <div key={contact.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#14213D]">{contact.name}</span>
                      {contact.isPrimary && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          Primary POC
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{contact.role} • {contact.department}</div>
                  </div>

                  <div className="space-y-1.5 mt-3 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <a href={`mailto:${contact.email}`} className="text-[#0F8B8D] hover:underline">{contact.email}</a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{contact.phone}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ----------------- TAB 3: ADDRESSES ----------------- */}
        {activeTab === 3 && (
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-[#14213D]">Registered Locations & Pickup Docks</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {supplier.addresses.map((addr) => (
                <div key={addr.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center justify-between font-bold text-[#14213D] mb-2">
                    <span>{addr.type} Address</span>
                    {addr.isDefault && (
                      <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded font-normal">Default</span>
                    )}
                  </div>
                  <p className="text-slate-600">
                    {addr.addressLine1}<br />
                    {addr.city}, {addr.state} - {addr.postalCode}<br />
                    {addr.country}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ----------------- TAB 4: BANKING & TAX ----------------- */}
        {activeTab === 4 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-[#14213D] border-b pb-2">Tax Registration & Compliance</h3>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">GSTIN / Tax Registration</span>
                <span className="font-mono font-bold text-[#14213D]">{supplier.bankingTax.taxId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">PAN Card Number</span>
                <span className="font-mono font-bold text-[#14213D]">{supplier.bankingTax.panNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">MSME Registered</span>
                <span className="font-semibold text-[#14213D]">{supplier.bankingTax.msmeRegistered ? 'Yes (Registered)' : 'No'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">TDS / Withholding Tax Rate</span>
                <span className="font-semibold text-[#14213D]">{supplier.bankingTax.withholdingTaxPct}%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">E-Invoicing Compliant</span>
                <span className="font-semibold text-emerald-700">{supplier.bankingTax.eInvoicingEnabled ? 'Enabled & Verified' : 'Disabled'}</span>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-sm text-[#14213D] border-b pb-2">Bank Account & Remittance Details</h3>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Bank Name</span>
                <span className="font-semibold text-[#14213D]">{supplier.bankingTax.bankName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Account Number</span>
                <span className="font-mono font-bold text-[#14213D]">{supplier.bankingTax.accountNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">IFSC / SWIFT Code</span>
                <span className="font-mono font-bold text-[#14213D]">{supplier.bankingTax.ifscOrSwift}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Branch</span>
                <span className="font-semibold text-[#14213D]">{supplier.bankingTax.branch}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Payment Channel</span>
                <span className="font-semibold text-[#14213D]">{supplier.bankingTax.paymentMethod}</span>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- TAB 5: ITEMS SUPPLIED ----------------- */}
        {activeTab === 5 && (
          <div className="space-y-4 text-xs">
            <h3 className="font-bold text-sm text-[#14213D]">Catalog of Approved Raw Materials</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b">
                  <tr>
                    <th className="py-2.5 px-3">Item Code</th>
                    <th className="py-2.5 px-3">Material Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Supplier Code</th>
                    <th className="py-2.5 px-3 text-right">MOQ</th>
                    <th className="py-2.5 px-3 text-right">Lead Time</th>
                    <th className="py-2.5 px-3 text-right">Last Purchase Price</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {supplier.itemsSupplied.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#14213D]">{item.itemCode}</td>
                      <td className="py-2.5 px-3 font-medium">{item.itemName}</td>
                      <td className="py-2.5 px-3">{item.category}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{item.supplierItemCode}</td>
                      <td className="py-2.5 px-3 text-right">{item.moq.toLocaleString()} {item.uom}</td>
                      <td className="py-2.5 px-3 text-right">{item.leadTimeDays} Days</td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#14213D]">₹{item.lastPurchasePrice.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-center">
                        <ProcurementStatusBadge status={item.approvalStatus} size="xs" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ----------------- TAB 6: PRICE SCHEDULES ----------------- */}
        {activeTab === 6 && (
          <div className="space-y-4 text-xs">
            <h3 className="font-bold text-sm text-[#14213D]">Indexed Polymer Price Schedules</h3>
            {supplier.priceLists.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No active indexed price schedule registered.</div>
            ) : (
              supplier.priceLists.map((pl) => (
                <div key={pl.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-[#14213D]">{pl.itemName} ({pl.itemCode})</div>
                      <div className="text-slate-500 text-[11px] font-mono">Price List Ref: {pl.priceListId}</div>
                    </div>
                    <ProcurementStatusBadge status={pl.status} size="sm" />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-3 rounded-lg border border-slate-200">
                    <div>
                      <div className="text-slate-400 text-[10px] uppercase">Base Index</div>
                      <div className="font-bold text-[#14213D]">₹{pl.baseIndexValue}/kg</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[10px] uppercase">Contract Price</div>
                      <div className="font-bold text-emerald-700">₹{pl.unitPrice}/kg</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[10px] uppercase">Validity</div>
                      <div className="font-medium text-slate-700">{pl.effectiveFrom} to {pl.effectiveTo}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[10px] uppercase">MOQ</div>
                      <div className="font-medium text-slate-700">{pl.moq.toLocaleString()} KG</div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-600 bg-amber-50 p-2.5 rounded-lg border border-amber-100">
                    <span className="font-semibold text-amber-900">Index Formula: </span>
                    {pl.indexReference} • {pl.adjustmentFormula}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ----------------- TAB 7: PURCHASE HISTORY ----------------- */}
        {activeTab === 7 && (
          <div className="space-y-4 text-xs">
            <h3 className="font-bold text-sm text-[#14213D]">Purchase Orders & Fulfillment History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b">
                  <tr>
                    <th className="py-2.5 px-3">PO Number</th>
                    <th className="py-2.5 px-3">Order Date</th>
                    <th className="py-2.5 px-3">Expected Date</th>
                    <th className="py-2.5 px-3 text-right">Total Amount</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {supplierPos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">No purchase orders found for this vendor.</td>
                    </tr>
                  ) : (
                    supplierPos.map((po) => (
                      <tr key={po.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#14213D]">{po.poNumber}</td>
                        <td className="py-2.5 px-3">{po.poDate}</td>
                        <td className="py-2.5 px-3">{po.expectedDeliveryDate}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-[#14213D]">₹{po.totalAmount.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-center">
                          <ProcurementStatusBadge status={po.status} size="xs" />
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => onNavigate('poDetail', { id: po.id })}
                            className="text-[#0F8B8D] font-semibold hover:underline"
                          >
                            View PO
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ----------------- TAB 8: QUALITY & INSPECTION ----------------- */}
        {activeTab === 8 && (
          <div className="space-y-5 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#14213D]">Incoming Quality Control (IQC) Performance</h3>
              <span className="text-emerald-700 font-bold text-sm bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                {supplier.scorecard.qualityAcceptancePct}% Lot Acceptance Rate
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="text-slate-500">MFI Tolerance Pass Rate</div>
                <div className="text-xl font-bold font-['Space_Grotesk'] text-emerald-700 mt-1">99.8%</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Tested @ 230°C / 2.16kg</div>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="text-slate-500">Moisture Content Compliance</div>
                <div className="text-xl font-bold font-['Space_Grotesk'] text-emerald-700 mt-1">100%</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Threshold &lt; 0.05%</div>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="text-slate-500">Open Quality Rejections / NCR</div>
                <div className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D] mt-1">{supplierReturns.length}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Supplier Returns</div>
              </div>
            </div>

            {/* Linked Quality Documents & COAs */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <div className="font-bold text-[#14213D] mb-2">Quality Agreements & COA Policy</div>
              <p className="text-slate-600 leading-relaxed">
                Manufacturer must supply batch test Certificate of Analysis (COA) containing Melt Flow Index (MFI), Density, Tensile Strength, and Izod Impact with every vehicle dispatch. Materials failing sample inspection undergo immediate quarantine hold.
              </p>
            </div>
          </div>
        )}

        {/* ----------------- TAB 9: PERFORMANCE SCORECARD ----------------- */}
        {activeTab === 9 && (
          <div className="space-y-6 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#14213D]">Multi-Dimensional Vendor Scorecard</h3>
                <p className="text-slate-500 text-[11px]">Evaluation Period: {supplier.scorecard.evaluationPeriod}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-[#14213D] text-white flex items-center justify-center font-bold text-xl font-['Space_Grotesk']">
                  {supplier.scorecard.overallGrade}
                </div>
                <div>
                  <div className="font-bold text-[#14213D]">Score: {supplier.scorecard.overallScore}/100</div>
                  <div className="text-emerald-600 text-[10px] font-semibold">Tier-1 Approved</div>
                </div>
              </div>
            </div>

            {/* Evaluation Metrics Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b">
                  <tr>
                    <th className="py-2.5 px-3">Performance Dimension</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Target SLA</th>
                    <th className="py-2.5 px-3 text-right">Actual Measured</th>
                    <th className="py-2.5 px-3 text-right">Weight</th>
                    <th className="py-2.5 px-3 text-center">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {supplier.scorecard.metrics.map((metric, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-semibold text-[#14213D]">{metric.name}</td>
                      <td className="py-2.5 px-3">{metric.category}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-500">{metric.target}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#14213D]">{metric.actual}</td>
                      <td className="py-2.5 px-3 text-right">{metric.weight}%</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          {metric.score} / 100
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ----------------- TAB 10: CONTRACTS ----------------- */}
        {activeTab === 10 && (
          <div className="space-y-4 text-xs">
            <h3 className="font-bold text-sm text-[#14213D]">Volume Agreements & Pricing Contracts</h3>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between font-bold text-[#14213D]">
                <span>Annual Polypropylene (PP) Bulk Volume Supply Agreement</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">Active</span>
              </div>
              <p className="text-slate-600">
                Committed Volume: 240,000 KG @ Platts Index + ₹4.5/kg. Released: 148,000 KG. Remaining: 92,000 KG.
              </p>
            </div>
          </div>
        )}

        {/* ----------------- TAB 11: DOCUMENTS ----------------- */}
        {activeTab === 11 && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#14213D]">Compliance Documents & Certificates</h3>
              <button
                onClick={() => showToast('Document upload dialog triggered')}
                className="flex items-center gap-1 text-xs font-semibold text-[#0F8B8D] hover:underline"
              >
                <Upload className="w-3.5 h-3.5" /> Upload Certificate
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {supplier.documents.map((doc) => (
                <div key={doc.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-[#14213D]">{doc.title}</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">{doc.type} • Ref: {doc.documentNumber}</div>
                    <div className="text-slate-400 text-[10px] mt-1">Valid Until: {doc.expiryDate}</div>
                  </div>
                  <button
                    onClick={() => showToast(`Downloaded ${doc.fileName}`)}
                    className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[#14213D]"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ----------------- TAB 12: ESG & COMPLIANCE ----------------- */}
        {activeTab === 12 && (
          <div className="space-y-5 text-xs">
            <h3 className="font-bold text-sm text-[#14213D]">ESG & Regulatory Certifications</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-slate-50 border rounded-xl">
                <div className="text-slate-400">ISO 9001:2015</div>
                <div className="font-bold text-emerald-700 mt-1">Verified Valid</div>
                <div className="text-[10px] text-slate-500">{supplier.compliance.iso9001Expiry}</div>
              </div>
              <div className="p-3 bg-slate-50 border rounded-xl">
                <div className="text-slate-400">FDA 21 CFR Food Grade</div>
                <div className="font-bold text-emerald-700 mt-1">Compliant</div>
                <div className="text-[10px] text-slate-500">21 CFR 177.1520</div>
              </div>
              <div className="p-3 bg-slate-50 border rounded-xl">
                <div className="text-slate-400">REACH / RoHS</div>
                <div className="font-bold text-emerald-700 mt-1">Declared Safe</div>
                <div className="text-[10px] text-slate-500">SVHC Compliant</div>
              </div>
              <div className="p-3 bg-slate-50 border rounded-xl">
                <div className="text-slate-400">ESG Sustainability</div>
                <div className="font-bold text-emerald-700 mt-1">Rating {supplier.compliance.esgRating}</div>
                <div className="text-[10px] text-slate-500">{supplier.compliance.esgScore} / 100</div>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- TAB 13: APPROVALS & ACTIVITY ----------------- */}
        {activeTab === 13 && (
          <div className="space-y-4 text-xs">
            <h3 className="font-bold text-sm text-[#14213D]">Vendor Onboarding Audit Log</h3>
            <div className="space-y-2.5">
              {supplier.activityHistory.map((act) => (
                <div key={act.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-[#14213D]">{act.action}</div>
                    <div className="text-slate-600 text-[11px]">{act.details}</div>
                    <div className="text-slate-400 text-[10px] mt-0.5">By {act.user} • {act.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
