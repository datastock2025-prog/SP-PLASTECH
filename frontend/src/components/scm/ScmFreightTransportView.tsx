import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Search,
  Filter,
  DollarSign,
  Award,
  TrendingDown,
  Clock,
  CheckCircle2,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import { mockFreightCarriers } from '../../data/mockScmData';
import { FreightCarrier } from '../../types/scm';

interface ScmFreightTransportViewProps {
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const ScmFreightTransportView: React.FC<ScmFreightTransportViewProps> = ({ onNavigate, showToast }) => {
  const [carriers, setCarriers] = useState<FreightCarrier[]>(mockFreightCarriers);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCarriers = carriers.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.contractType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 font-mono text-xs font-semibold uppercase">
              Transport Management System (TMS)
            </span>
            <span className="text-xs text-slate-500">· Carrier Master &amp; Freight Optimization</span>
          </div>
          <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D] mt-1">
            Freight &amp; Transport Management Workbench
          </h1>
          <p className="text-slate-500 text-xs">
            Manage logistics carrier contracts, negotiated base rates, SLA performance scores, and vehicle fleet compliance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast('Opened Carrier Contract Rate Master')}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#E8622C] hover:bg-[#d45422] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Logistics Carrier</span>
          </button>
        </div>
      </div>

      {/* Carrier Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredCarriers.map((c) => (
          <div key={c.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4 hover:shadow-md transition">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400">{c.id}</span>
                <h3 className="font-bold text-base text-[#14213D] font-['Space_Grotesk']">{c.name}</h3>
                <div className="text-xs text-slate-500">{c.contractType} · {c.fleetSize} Vehicles</div>
              </div>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                {c.status}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Negotiated Rate:</span>
                <span className="font-mono font-bold text-slate-900">{c.ratePerKm}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Contract End:</span>
                <span className="font-mono text-slate-700">{c.validUntil}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">On-Time Delivery SLA:</span>
                <span className="font-mono font-bold text-emerald-600">{c.onTimePerformancePct}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Damage Claims Rate:</span>
                <span className="font-mono font-bold text-slate-800">{c.damageClaimPct}%</span>
              </div>
            </div>

            <div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Serviced Corridors
              </div>
              <div className="flex flex-wrap gap-1.5">
                {c.servicedRoutes.map((route, i) => (
                  <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium border border-slate-200">
                    {route}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
