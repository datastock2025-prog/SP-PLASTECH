import React, { useState } from 'react';
import {
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle,
  Truck,
  Printer,
  RefreshCw,
  Search,
  Filter,
  Plus,
  ExternalLink,
  ChevronRight,
  Download,
  Building2,
  Calendar,
  XCircle,
} from 'lucide-react';
import { EWayBillRecord } from '../../types/salesOrderDeliveryTypes';

interface EWayBillManagementProps {
  eWayBills?: EWayBillRecord[];
  onUpdateEwb?: (updated: EWayBillRecord) => void;
  showToast?: (msg: string) => void;
}

export const EWayBillManagement: React.FC<EWayBillManagementProps> = ({
  eWayBills = [],
  onUpdateEwb = (_updated?: EWayBillRecord) => {},
  showToast = (_msg?: string) => {},
}) => {
  const [activeTab, setActiveTab] = useState('Active EWBs');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEwbForExtension, setSelectedEwbForExtension] = useState<EWayBillRecord | null>(null);
  const [extensionReason, setExtensionReason] = useState('Transshipment delay due to truck mechanical breakdown');
  const [newVehicleNumber, setNewVehicleNumber] = useState('');

  const safeEwbs = eWayBills || [];

  // Metrics
  const activeCount = safeEwbs.filter((e) => e.status === 'Active').length;
  const expiringSoonCount = safeEwbs.filter((e) => e.validityHoursRemaining <= 8 && e.status === 'Active').length;
  const expiredCount = safeEwbs.filter((e) => e.status === 'Expired').length;
  const partAOnlyCount = safeEwbs.filter((e) => e.partBStatus === 'Pending').length;
  const cancelledCount = safeEwbs.filter((e) => e.status === 'Cancelled').length;

  const tabs = [
    'Active EWBs',
    'Expiring Soon (<8h)',
    'Part A Only',
    'Validity Expired',
    'Cancelled',
    'Consolidated EWBs',
  ];

  const filteredEwbs = safeEwbs.filter((e) => {
    if (activeTab === 'Active EWBs' && e.status !== 'Active') return false;
    if (activeTab === 'Expiring Soon (<8h)' && (e.validityHoursRemaining > 8 || e.status !== 'Active')) return false;
    if (activeTab === 'Part A Only' && e.partBStatus !== 'Pending') return false;
    if (activeTab === 'Validity Expired' && e.status !== 'Expired') return false;
    if (activeTab === 'Cancelled' && e.status !== 'Cancelled') return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchNum = e.ewbNumber.includes(q);
      const matchDoc = e.documentNumber.toLowerCase().includes(q);
      const matchVeh = e.vehicleNumber.toLowerCase().includes(q);
      const matchGstin = e.recipientGstin.toLowerCase().includes(q);
      if (!matchNum && !matchDoc && !matchVeh && !matchGstin) return false;
    }
    return true;
  });

  const handleConfirmExtension = () => {
    if (!selectedEwbForExtension) return;
    const updated: EWayBillRecord = {
      ...selectedEwbForExtension,
      validityHoursRemaining: selectedEwbForExtension.validityHoursRemaining + 24,
      validUntil: '2026-09-15 23:59:59',
      vehicleNumber: newVehicleNumber || selectedEwbForExtension.vehicleNumber,
    };
    onUpdateEwb(updated);
    setSelectedEwbForExtension(null);
    setNewVehicleNumber('');
    showToast(`Validity extended by 24 hours for E-Way Bill ${updated.ewbNumber}.`);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-gray-900 font-['Space_Grotesk']">
              GST E-Way Bill Transit Management Portal
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            National E-Way Bill portal synchronization (Rule 138), Part A/B management, and countdown trackers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast('NIC E-Way Bill status refreshed from GST Server.')}
            className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5 text-gray-500" /> Sync Portal
          </button>
        </div>
      </div>

      {/* 5 Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-gray-500">Active EWBs</div>
          <div className="text-xl font-bold text-emerald-700 mt-1">{activeCount}</div>
          <div className="text-[10px] text-gray-400">Valid on road</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-red-200 bg-red-50/40 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-red-700">Expiring &lt;8h</div>
          <div className="text-xl font-bold text-red-700 mt-1">{expiringSoonCount}</div>
          <div className="text-[10px] text-red-600 font-semibold">Extension required</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-gray-500">Part A Only</div>
          <div className="text-xl font-bold text-amber-700 mt-1">{partAOnlyCount}</div>
          <div className="text-[10px] text-gray-400">Awaiting vehicle</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-gray-500">Expired</div>
          <div className="text-xl font-bold text-gray-700 mt-1">{expiredCount}</div>
          <div className="text-[10px] text-gray-400">Critical review</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-gray-500">Cancelled</div>
          <div className="text-xl font-bold text-gray-500 mt-1">{cancelledCount}</div>
          <div className="text-[10px] text-gray-400">Within 24h window</div>
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

      {/* Filter & Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search E-Way Bill Number, Vehicle #, Delivery #, GSTIN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none"
          />
        </div>
      </div>

      {/* EWB Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden text-xs">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600 font-bold text-[11px] uppercase border-b border-gray-200">
            <tr>
              <th className="p-3">EWB Number & Date</th>
              <th className="p-3">Document / Challan #</th>
              <th className="p-3">Vehicle # & Transporter</th>
              <th className="p-3">Recipient GSTIN</th>
              <th className="p-3 text-right">Value (₹)</th>
              <th className="p-3">Validity Countdown</th>
              <th className="p-3">Part A / Part B</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredEwbs.map((ewb) => {
              const isUrgent = ewb.validityHoursRemaining <= 8;
              return (
                <tr key={ewb.ewbNumber} className="hover:bg-gray-50">
                  <td className="p-3">
                    <div className="font-mono font-bold text-gray-900">{ewb.ewbNumber}</div>
                    <div className="text-[10px] text-gray-400">{ewb.generatedDate}</div>
                  </td>
                  <td className="p-3 font-mono font-semibold text-[#0F8B8D]">
                    {ewb.documentNumber}
                  </td>
                  <td className="p-3">
                    <div className="font-mono font-bold text-gray-900">{ewb.vehicleNumber}</div>
                    <div className="text-[10px] text-gray-500">{ewb.transporterName}</div>
                  </td>
                  <td className="p-3 font-mono text-gray-700">{ewb.recipientGstin}</td>
                  <td className="p-3 text-right font-mono font-bold text-gray-900">
                    ₹{ewb.totalValue.toLocaleString()}
                  </td>
                  <td className="p-3">
                    <div
                      className={`font-bold font-mono inline-flex items-center gap-1 ${
                        isUrgent ? 'text-red-600 bg-red-50 px-2 py-0.5 rounded' : 'text-emerald-700'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      {ewb.validityHoursRemaining}h left
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{ewb.validUntil}</div>
                  </td>
                  <td className="p-3">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded mr-1">
                      Part A
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        ewb.partBStatus === 'Completed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      Part B: {ewb.partBStatus}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setSelectedEwbForExtension(ewb)}
                        className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded font-semibold text-[11px]"
                      >
                        Extend
                      </button>
                      <button
                        onClick={() => window.print()}
                        className="p-1 text-gray-500 hover:text-gray-900"
                        title="Print EWB"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Extend Validity Modal */}
      {selectedEwbForExtension && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl text-xs">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-base text-gray-900">
                Extend E-Way Bill Validity: {selectedEwbForExtension.ewbNumber}
              </h3>
            </div>

            <p className="text-gray-600">
              Government rules allow extension within 8 hours prior to expiry. Please provide vehicle and reason:
            </p>

            <div className="space-y-3">
              <div>
                <label className="font-medium text-gray-700">Reason for Extension *</label>
                <select
                  value={extensionReason}
                  onChange={(e) => setExtensionReason(e.target.value)}
                  className="w-full mt-1 border border-gray-300 rounded p-2 bg-white text-gray-900"
                >
                  <option value="Transshipment delay due to truck mechanical breakdown">
                    Transshipment delay / Vehicle breakdown
                  </option>
                  <option value="Traffic jam / highway blockage">Traffic jam / highway blockage</option>
                  <option value="Natural calamity / heavy rains">Natural calamity / heavy rains</option>
                  <option value="Law and order issue">Law and order issue</option>
                </select>
              </div>

              <div>
                <label className="font-medium text-gray-700">Updated Vehicle Number (Optional if transshipped)</label>
                <input
                  type="text"
                  placeholder="e.g. MH-12-RN-9944"
                  value={newVehicleNumber}
                  onChange={(e) => setNewVehicleNumber(e.target.value)}
                  className="w-full mt-1 border border-gray-300 rounded p-2 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setSelectedEwbForExtension(null)}
                className="px-3 py-1.5 border border-gray-300 rounded text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmExtension}
                className="px-4 py-1.5 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded font-bold"
              >
                Confirm 24h Extension
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
