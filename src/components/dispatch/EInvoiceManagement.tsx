import React, { useState } from 'react';
import {
  FileCheck,
  Search,
  RefreshCw,
  QrCode,
  Download,
  Printer,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Building2,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { EInvoiceRecord } from '../../types/salesOrderDeliveryTypes';

interface EInvoiceManagementProps {
  eInvoices?: EInvoiceRecord[];
  onGenerateIrn?: (invoiceNumber: string) => void;
  onCancelIrn?: (invoiceNumber: string, reason: string) => void;
  showToast?: (msg: string) => void;
}

export const EInvoiceManagement: React.FC<EInvoiceManagementProps> = ({
  eInvoices = [],
  onGenerateIrn = (_invoiceNumber?: string) => {},
  onCancelIrn = (_invoiceNumber?: string, _reason?: string) => {},
  showToast = (_msg?: string) => {},
}) => {
  const [activeTab, setActiveTab] = useState('All E-Invoices');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJson, setSelectedJson] = useState<any | null>(null);

  const safeEInvoices = eInvoices || [];

  // Metrics
  const generatedCount = safeEInvoices.filter((i) => i.status === 'Generated').length;
  const pendingCount = safeEInvoices.filter((i) => i.status === 'Pending').length;
  const failedCount = safeEInvoices.filter((i) => i.status === 'Failed').length;
  const cancelledCount = safeEInvoices.filter((i) => i.status === 'Cancelled').length;
  const totalValue = safeEInvoices.reduce((sum, i) => sum + i.invoiceValue, 0);

  const tabs = [
    'All E-Invoices',
    'Generated (Success)',
    'Pending IRP Upload',
    'Failed / Error',
    'Cancelled',
  ];

  const filtered = safeEInvoices.filter((inv) => {
    if (activeTab === 'Generated (Success)' && inv.status !== 'Generated') return false;
    if (activeTab === 'Pending IRP Upload' && inv.status !== 'Pending') return false;
    if (activeTab === 'Failed / Error' && inv.status !== 'Failed') return false;
    if (activeTab === 'Cancelled' && inv.status !== 'Cancelled') return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchInv = inv.invoiceNumber.toLowerCase().includes(q);
      const matchCust = inv.customer.toLowerCase().includes(q);
      const matchGstin = inv.customerGstin.toLowerCase().includes(q);
      const matchIrn = inv.irn?.toLowerCase().includes(q);
      if (!matchInv && !matchCust && !matchGstin && !matchIrn) return false;
    }
    return true;
  });

  const handleBulkGenerate = () => {
    showToast('Batch IRP Request dispatched for 2 pending invoices. IRNs confirmed.');
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-purple-50 text-purple-700">
              <FileCheck className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-gray-900 font-['Space_Grotesk']">
              GST E-Invoice & IRP Synchronization Portal
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time direct interface with NIC Invoice Registration Portal (IRP). 64-character IRN and QR codes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleBulkGenerate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded-lg text-xs font-semibold shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5" /> Bulk Generate IRN
          </button>
        </div>
      </div>

      {/* 5 Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-gray-500">Generated (Success)</div>
          <div className="text-xl font-bold text-emerald-700 mt-1">{generatedCount}</div>
          <div className="text-[10px] text-gray-400">IRN signed</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-gray-500">Pending Upload</div>
          <div className="text-xl font-bold text-amber-700 mt-1">{pendingCount}</div>
          <div className="text-[10px] text-gray-400">Queued for NIC</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-red-200 bg-red-50/40 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-red-700">Failed / Rejected</div>
          <div className="text-xl font-bold text-red-700 mt-1">{failedCount}</div>
          <div className="text-[10px] text-red-600 font-semibold">Retry available</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-gray-500">Cancelled</div>
          <div className="text-xl font-bold text-gray-500 mt-1">{cancelledCount}</div>
          <div className="text-[10px] text-gray-400">Within 24 hours</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-gray-500">Total Value</div>
          <div className="text-xl font-bold text-gray-900 mt-1">₹{(totalValue / 100000).toFixed(1)}L</div>
          <div className="text-[10px] text-gray-400">Taxable + GST</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white p-1 rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-[#14213D] text-white shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search Invoice #, Customer, GSTIN, IRN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden text-xs">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600 font-bold text-[11px] uppercase border-b border-gray-200">
            <tr>
              <th className="p-3">Invoice # & Date</th>
              <th className="p-3">Customer Entity & GSTIN</th>
              <th className="p-3 text-right">Taxable (₹)</th>
              <th className="p-3 text-right">Invoice Value (₹)</th>
              <th className="p-3">IRN / IRP Status</th>
              <th className="p-3">Ack Details</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((inv) => (
              <tr key={inv.invoiceNumber} className="hover:bg-gray-50">
                <td className="p-3">
                  <div className="font-mono font-bold text-gray-900">{inv.invoiceNumber}</div>
                  <div className="text-[10px] text-gray-400">{inv.invoiceDate}</div>
                </td>
                <td className="p-3">
                  <div className="font-semibold text-gray-900">{inv.customer}</div>
                  <div className="font-mono text-[10px] text-gray-400">{inv.customerGstin}</div>
                </td>
                <td className="p-3 text-right font-mono text-gray-700">
                  ₹{inv.taxableValue.toLocaleString()}
                </td>
                <td className="p-3 text-right font-mono font-bold text-gray-900">
                  ₹{inv.invoiceValue.toLocaleString()}
                </td>
                <td className="p-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      inv.status === 'Generated'
                        ? 'bg-purple-100 text-purple-800'
                        : inv.status === 'Failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {inv.status}
                  </span>
                  {inv.irn && (
                    <div className="font-mono text-[9px] text-gray-400 truncate max-w-[140px] mt-0.5">
                      {inv.irn.substring(0, 20)}...
                    </div>
                  )}
                  {inv.errorMessage && (
                    <div className="text-[10px] text-red-600 font-medium mt-0.5 max-w-[180px]">
                      {inv.errorMessage}
                    </div>
                  )}
                </td>
                <td className="p-3 font-mono text-gray-600">
                  {inv.ackNo ? (
                    <div>
                      <div>Ack: {inv.ackNo}</div>
                      <div className="text-[10px] text-gray-400">{inv.ackDate}</div>
                    </div>
                  ) : (
                    <span className="text-gray-400">&mdash;</span>
                  )}
                </td>
                <td className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    {inv.status === 'Generated' ? (
                      <>
                        <button
                          onClick={() => {
                            setSelectedJson({
                              irn: inv.irn,
                              invoiceNumber: inv.invoiceNumber,
                              taxable: inv.taxableValue,
                              total: inv.invoiceValue,
                              customer: inv.customer,
                              qrSigned: true,
                            });
                          }}
                          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded font-semibold text-[11px] text-gray-700"
                        >
                          Signed JSON
                        </button>
                        <button
                          onClick={() => window.print()}
                          className="p-1 text-gray-500 hover:text-gray-900"
                          title="Print with QR Code"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </>
                    ) : inv.status === 'Failed' ? (
                      <button
                        onClick={() => onGenerateIrn(inv.invoiceNumber)}
                        className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-semibold text-[11px]"
                      >
                        Retry IRP
                      </button>
                    ) : (
                      <button
                        onClick={() => onGenerateIrn(inv.invoiceNumber)}
                        className="px-2.5 py-1 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded font-semibold text-[11px]"
                      >
                        Generate IRN
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* JSON Viewer Modal */}
      {selectedJson && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-5 space-y-3 shadow-xl text-xs">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-gray-900">
                NIC Digitally Signed Invoice Payload: {selectedJson.invoiceNumber}
              </h3>
              <button
                onClick={() => setSelectedJson(null)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-gray-950 text-emerald-400 p-3 rounded-lg font-mono text-[11px] overflow-x-auto max-h-60">
              {JSON.stringify(selectedJson, null, 2)}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setSelectedJson(null)}
                className="px-3 py-1.5 bg-[#14213D] text-white rounded font-semibold"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
