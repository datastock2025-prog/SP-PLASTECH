import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building,
  Truck,
  DollarSign,
  Package,
  Layers,
  FileCheck,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { SalesOrder } from '../../types';

interface Props {
  sos: SalesOrder[];
  onNavigate: (view: string, param?: any) => void;
}

export const SalesOrderTrackingTimelineView: React.FC<Props> = ({ sos, onNavigate }) => {
  const [selectedSoId, setSelectedSoId] = useState<string>(sos[0]?.id || 'SO-5001');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const currentSO = sos.find((s) => s.id === selectedSoId) || sos[0];

  const milestones = [
    { stage: 1, name: 'Quotation Accepted', code: 'QT-3001', status: 'completed', time: '2026-08-10 10:30', icon: FileCheck },
    { stage: 2, name: 'Sales Order Registered', code: currentSO?.id, status: 'completed', time: `${currentSO?.orderDate} 11:15`, icon: Layers },
    { stage: 3, name: 'Credit Check Cleared', code: 'CREDIT-OK', status: currentSO?.approval === 'rejected' ? 'blocked' : 'completed', time: '2026-08-12 12:00', icon: ShieldCheck },
    { stage: 4, name: 'Material & Resin Allocated', code: 'HDPE-LOT-98', status: 'completed', time: '2026-08-13 09:00', icon: Package },
    { stage: 5, name: 'Work Order Released', code: 'WO-7740', status: 'completed', time: '2026-08-13 14:00', icon: Wrench },
    { stage: 6, name: 'Injection / Blow Molding', code: 'IMM-150T', status: 'completed', time: '2026-08-14 18:30', icon: Wrench },
    { stage: 7, name: 'Quality COA Inspection', code: 'COA-PASS-09', status: 'completed', time: '2026-08-15 11:00', icon: CheckCircle2 },
    { stage: 8, name: 'Packaging & Pallet Staging', code: 'BAY-04', status: 'completed', time: '2026-08-15 16:00', icon: Package },
    { stage: 9, name: 'Delivery Challan & Gate Pass', code: 'DC-8803', status: 'completed', time: '2026-08-16 09:30', icon: Truck },
    { stage: 10, name: 'In Transit via Transporter', code: 'KA-51-MM-8841', status: 'in_progress', time: '2026-08-16 11:00', icon: Truck },
    { stage: 11, name: 'Delivered & POD Signed', code: 'POD-PENDING', status: 'pending', time: 'Expected 2026-08-18', icon: CheckCircle2 },
    { stage: 12, name: 'GST Invoice Generated', code: 'INV-2026-441', status: 'pending', time: 'Post-delivery', icon: DollarSign },
    { stage: 13, name: 'Payment Reconciliation', code: 'NET-30', status: 'pending', time: 'Due 30 Days', icon: DollarSign },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-[#E4E0D6] shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase font-bold text-[#0F8B8D]">
            <span>End-to-End Visibility &middot; 13-Stage Milestone Engine</span>
          </div>
          <h1 className="text-xl font-bold text-[#14213D] font-['Space_Grotesk'] mt-0.5">
            Real-Time Sales Order Tracking
          </h1>
          <p className="text-xs text-[#6B7280]">
            Track orders from quote acceptance to polymer extrusion, quality COA, transit, POD, and cash reconciliation.
          </p>
        </div>

        {/* Order Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-[#14213D]">Select Order:</label>
          <select
            value={selectedSoId}
            onChange={(e) => setSelectedSoId(e.target.value)}
            className="p-2 border border-[#E4E0D6] rounded-lg text-xs font-mono font-bold bg-[#F6F4EF]"
          >
            {sos.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id} &middot; {s.customer}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Order Summary Banner */}
      {currentSO && (
        <div className="bg-gradient-to-r from-[#14213D] to-[#1C2B4D] text-white p-5 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold text-[#0F8B8D]">{currentSO.id}</span>
              <span className="px-2 py-0.5 rounded bg-white/10 text-xs font-medium">
                PO: {currentSO.customerPO || '—'}
              </span>
            </div>
            <h2 className="text-base font-bold mt-0.5">{currentSO.customer}</h2>
            <p className="text-xs text-[#9AA5C4]">
              {currentSO.lines.length} Line(s) &middot; Delivery Target: <b>{currentSO.deliveryDate}</b>
            </p>
          </div>

          <div className="flex items-center gap-6 font-mono text-right">
            <div>
              <div className="text-[10px] uppercase text-[#9AA5C4]">Order Value</div>
              <div className="text-xl font-bold text-white">
                ₹{currentSO.lines.reduce((s, l) => s + l.qty * l.price, 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 13-Stage Timeline Grid */}
      <div className="bg-white p-6 rounded-xl border border-[#E4E0D6] shadow-sm">
        <h2 className="text-sm font-bold text-[#14213D] mb-6 flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#0F8B8D]" />
          <span>Fulfillment Milestones (Stages 1 through 13)</span>
        </h2>

        <div className="relative pl-6 border-l-2 border-[#E4E0D6] space-y-6">
          {milestones.map((m) => {
            const Icon = m.icon;
            const isDone = m.status === 'completed';
            const isProg = m.status === 'in_progress';
            const isBlocked = m.status === 'blocked';

            return (
              <div key={m.stage} className="relative group">
                {/* Node Circle */}
                <div
                  className={`absolute -left-[31px] top-0 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                    isDone
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : isProg
                      ? 'bg-[#0F8B8D] border-[#0F8B8D] text-white animate-pulse'
                      : isBlocked
                      ? 'bg-rose-500 border-rose-500 text-white'
                      : 'bg-white border-slate-300 text-slate-400'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <span className="text-[10px] font-bold font-mono">{m.stage}</span>
                  )}
                </div>

                <div className="bg-[#F6F4EF] p-3.5 rounded-lg border border-[#E4E0D6] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        isDone
                          ? 'bg-emerald-100 text-emerald-800'
                          : isProg
                          ? 'bg-cyan-100 text-cyan-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#14213D]">{m.name}</span>
                        <span className="font-mono text-[10px] text-[#0F8B8D] font-bold">
                          [{m.code}]
                        </span>
                      </div>
                      <div className="text-[10px] text-[#6B7280] font-mono mt-0.5">{m.time}</div>
                    </div>
                  </div>

                  <div>
                    {isDone && <span className="badge green">Completed</span>}
                    {isProg && <span className="badge blue">In Transit / Active</span>}
                    {isBlocked && <span className="badge red">Credit Blocked</span>}
                    {!isDone && !isProg && !isBlocked && (
                      <span className="badge gray">Pending Sequence</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
