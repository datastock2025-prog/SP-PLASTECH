import React, { useState } from 'react';
import {
  Truck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  FileCheck,
  MapPin,
  FileSpreadsheet,
  Download,
  Plus,
  Send,
} from 'lucide-react';
import { mockOutboundDeliveries } from '../../data/mockScmData';
import { OutboundDelivery } from '../../types/scm';

interface ScmOutboundLogisticsViewProps {
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const ScmOutboundLogisticsView: React.FC<ScmOutboundLogisticsViewProps> = ({ onNavigate, showToast }) => {
  const [deliveries, setDeliveries] = useState<OutboundDelivery[]>(mockOutboundDeliveries);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedDelivery, setSelectedDelivery] = useState<OutboundDelivery | null>(mockOutboundDeliveries[0]);

  const handleConfirmPod = (deliveryId: string) => {
    setDeliveries((prev) =>
      prev.map((d) =>
        d.id === deliveryId
          ? {
              ...d,
              podStatus: 'Confirmed e-POD',
              status: 'Delivered',
              deliveredAt: 'Today, 02:30 PM',
            }
          : d
      )
    );
    showToast(`Electronic Proof of Delivery (e-POD) signed and synchronized for ${deliveryId}`);
  };

  const filteredDeliveries = deliveries.filter((d) => {
    const matchesSearch =
      d.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono text-xs font-semibold uppercase">
              Outbound Logistics &amp; Milk Runs
            </span>
            <span className="text-xs text-slate-500">· OEM JIT Line Delivery &amp; Electronic POD</span>
          </div>
          <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D] mt-1">
            Outbound Customer Deliveries &amp; Vehicle Allocation
          </h1>
          <p className="text-slate-500 text-xs">
            Manage finished goods dispatch notes, dedicated automotive milk runs, GPS route compliance, and electronic proof of delivery (e-POD).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast('Generated Dispatch Manifest for all scheduled outbound routes')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Route Manifest</span>
          </button>
        </div>
      </div>

      {/* Deliveries Table & POD Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Outbound Dispatch List (2 Cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-[#14213D] font-['Space_Grotesk']">
              Scheduled &amp; In-Transit Deliveries ({deliveries.length})
            </h3>
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Customer or Vehicle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Delivery ID</th>
                  <th className="p-3">Customer &amp; Plant</th>
                  <th className="p-3">Vehicle &amp; Driver</th>
                  <th className="p-3 text-right">Qty</th>
                  <th className="p-3">Route Type</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">e-POD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredDeliveries.map((del) => (
                  <tr
                    key={del.id}
                    onClick={() => setSelectedDelivery(del)}
                    className={`hover:bg-slate-50/80 transition cursor-pointer ${
                      selectedDelivery?.id === del.id ? 'bg-emerald-50/40 font-semibold' : ''
                    }`}
                  >
                    <td className="p-3 font-mono font-bold text-slate-900">{del.id}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{del.customer}</div>
                      <div className="text-[11px] text-slate-500">{del.destinationPlant}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-mono font-bold text-slate-800">{del.vehicleNumber}</div>
                      <div className="text-[11px] text-slate-500">{del.driverName}</div>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      {del.totalQty.toLocaleString()} {del.uom}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium">
                        {del.routeType}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          del.status === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : del.status === 'In Transit'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {del.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {del.podStatus === 'Confirmed e-POD' ? (
                        <span className="text-[11px] text-emerald-600 font-bold">✓ Signed</span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConfirmPod(del.id);
                          }}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold transition"
                        >
                          Sign POD
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Delivery Details & POD Inspector (1 Col) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[10px] font-mono text-[#0F8B8D] font-bold uppercase">
              Electronic POD &amp; Dispatch Inspection
            </span>
            <h3 className="font-bold text-base text-[#14213D] font-['Space_Grotesk'] mt-0.5">
              {selectedDelivery?.id}
            </h3>
            <p className="text-xs text-slate-500">{selectedDelivery?.customer}</p>
          </div>

          {selectedDelivery && (
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Destination:</span>
                  <span className="font-bold text-slate-800">{selectedDelivery.destinationPlant}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Scheduled Time:</span>
                  <span className="font-mono text-slate-800">{selectedDelivery.scheduledDeparture}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Assigned Driver:</span>
                  <span className="font-medium text-slate-800">{selectedDelivery.driverName} ({selectedDelivery.driverPhone})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Seal / Container:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedDelivery.sealNumber}</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1.5">
                <div className="text-[10px] font-bold text-emerald-800 uppercase">
                  Proof of Delivery Status
                </div>
                <div className="font-mono font-bold text-emerald-950 text-sm">
                  {selectedDelivery.podStatus}
                </div>
                {selectedDelivery.deliveredAt && (
                  <div className="text-[11px] text-emerald-700">Delivered: {selectedDelivery.deliveredAt}</div>
                )}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onNavigate('scmTrackTrace', { deliveryId: selectedDelivery.id })}
                  className="w-full py-2 bg-[#14213D] hover:bg-[#1C2B4D] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>360° Forward Lot Traceability</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
