import React, { useState } from 'react';
import {
  Compass,
  Truck,
  Ship,
  Plane,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  FileText,
  Building,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { mockInboundShipments } from '../../data/mockScmData';
import { InboundShipment } from '../../types/scm';

interface ScmInboundLogisticsViewProps {
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const ScmInboundLogisticsView: React.FC<ScmInboundLogisticsViewProps> = ({ onNavigate, showToast }) => {
  const [shipments, setShipments] = useState<InboundShipment[]>(mockInboundShipments);
  const [selectedShipment, setSelectedShipment] = useState<InboundShipment>(mockInboundShipments[0]);

  const handleExpediteCustoms = (shipmentId: string) => {
    showToast(`Escalated customs clearance broker for ${shipmentId} via ICEGATE EDI port system`);
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 font-mono text-xs font-semibold uppercase">
              Inbound Freight Logistics
            </span>
            <span className="text-xs text-slate-500">· Multimodal Ocean, Air &amp; Highway Tracking</span>
          </div>
          <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D] mt-1">
            Inbound Logistics, Customs Clearance &amp; Port Gate Tracking
          </h1>
          <p className="text-slate-500 text-xs">
            Monitor international polymer import shipments from Antwerp and Saudi Arabia through Chennai Port customs clearance to Hosūr plant silo discharge.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('scmFreight')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <Truck className="w-4 h-4 text-[#0F8B8D]" />
            <span>Carrier Rates &amp; Contracts</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Shipments List & Live 10-Milestone Pipeline Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shipments Table (1.8 Cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-[#14213D] font-['Space_Grotesk'] border-b border-slate-100 pb-3">
            Inbound Shipments in Transit ({shipments.length})
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Shipment ID</th>
                  <th className="p-3">Supplier &amp; Mode</th>
                  <th className="p-3">Origin / Port</th>
                  <th className="p-3 text-right">Weight (KG)</th>
                  <th className="p-3">ETA Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {shipments.map((s) => (
                  <tr
                    key={s.shipmentId}
                    onClick={() => setSelectedShipment(s)}
                    className={`hover:bg-slate-50/80 transition cursor-pointer ${
                      selectedShipment.shipmentId === s.shipmentId ? 'bg-cyan-50/40 font-semibold' : ''
                    }`}
                  >
                    <td className="p-3 font-mono font-bold text-slate-900">{s.shipmentId}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{s.supplierName}</div>
                      <div className="text-[11px] text-slate-500">{s.carrier} ({s.modeOfTransport})</div>
                    </td>
                    <td className="p-3">
                      <div className="text-slate-800">{s.origin}</div>
                      {s.portOfEntry && <div className="text-[10px] text-[#0F8B8D] font-mono">{s.portOfEntry}</div>}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      {s.totalWeightKg.toLocaleString()} KG
                    </td>
                    <td className="p-3 font-mono text-slate-700">{s.expectedArrivalDate}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.status === 'Customs Clearance'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-blue-100 text-blue-800 border border-blue-300'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {s.status === 'Customs Clearance' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExpediteCustoms(s.shipmentId);
                          }}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-bold transition"
                        >
                          Expedite Customs
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            showToast(`GPS Ping: Container on Highway NH-48, 140km to plant`);
                          }}
                          className="px-2.5 py-1 bg-[#0F8B8D] text-white rounded text-[11px] font-bold"
                        >
                          GPS Ping
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Shipment Milestones Visualizer (1.2 Cols) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[10px] font-mono text-[#0F8B8D] font-bold uppercase">
              10-Milestone Chain of Custody
            </span>
            <h3 className="font-bold text-base text-[#14213D] font-['Space_Grotesk'] mt-0.5">
              {selectedShipment.shipmentId}
            </h3>
            <p className="text-xs text-slate-500">
              Container: <strong className="font-mono text-slate-800">{selectedShipment.containerNumber}</strong>
            </p>
          </div>

          <div className="space-y-3 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {selectedShipment.milestones.map((ms, index) => (
              <div key={index} className="flex items-start gap-3 relative z-10 text-xs">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                    ms.status === 'completed'
                      ? 'bg-emerald-600 text-white'
                      : ms.status === 'current'
                      ? 'bg-[#0F8B8D] text-white ring-4 ring-[#0F8B8D]/20 animate-pulse'
                      : 'bg-slate-100 text-slate-400 border border-slate-300'
                  }`}
                >
                  {ms.status === 'completed' ? '✓' : index + 1}
                </div>

                <div className="flex-1 pt-0.5">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>{ms.name}</span>
                    <span className="font-mono text-[10px] text-slate-500 font-normal">{ms.date}</span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {ms.status === 'completed'
                      ? 'Verified &amp; Logged'
                      : ms.status === 'current'
                      ? 'In Active Processing'
                      : 'Pending Step'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>Documentation Status:</span>
              <strong className="text-slate-800">{selectedShipment.documentsStatus}</strong>
            </div>
            <div className="flex justify-between">
              <span>Container Temp Control:</span>
              <strong className="text-emerald-700">{selectedShipment.temperatureControlStatus}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
