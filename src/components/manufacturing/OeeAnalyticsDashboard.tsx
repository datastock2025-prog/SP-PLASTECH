import React, { useState } from 'react';
import {
  TrendingUp,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  BarChart2,
  Calendar,
  Layers,
  Zap,
  ArrowRight
} from 'lucide-react';

interface OEEProps {
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const OeeAnalyticsDashboard: React.FC<OEEProps> = ({
  onNavigate,
  showToast,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'shift' | 'today' | 'month'>('today');

  // 3-Factor OEE math
  const availability = 88.4; // Planned operating time vs actual run time
  const performance = 91.8; // Actual cycle vs standard theoretical cycle
  const quality = 97.5; // Good pieces vs total pieces produced
  const overallOEE = ((availability * performance * quality) / 10000).toFixed(1); // ~79.1%

  // Six Big Losses breakdown
  const sixBigLosses = [
    { loss: '1. Equipment Breakdowns & Unplanned Stops', category: 'Availability', hours: 2.1, pct: 28, color: 'bg-rose-500' },
    { loss: '2. Setup, SMED & Mold Changeovers', category: 'Availability', hours: 1.8, pct: 24, color: 'bg-amber-500' },
    { loss: '3. Minor Idling & Sensor Stoppages (<5 min)', category: 'Performance', hours: 1.4, pct: 19, color: 'bg-blue-500' },
    { loss: '4. Reduced Speed & Cycle Drift (>12.0s)', category: 'Performance', hours: 1.1, pct: 15, color: 'bg-purple-500' },
    { loss: '5. Startup Purge & Changeover Scraps', category: 'Quality', hours: 0.6, pct: 8, color: 'bg-emerald-500' },
    { loss: '6. In-Line Production Scrap & Defects', category: 'Quality', hours: 0.5, pct: 6, color: 'bg-slate-500' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E4E0D6] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#0F8B8D]/10 text-[#0F8B8D]">
              World-Class Manufacturing Metrics
            </span>
            <span className="text-[11px] text-[#6B7280]">
              Availability &times; Performance &times; Quality Formula
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#14213D]">Overall Equipment Effectiveness (OEE)</h1>
        </div>

        <div className="flex bg-[#F6F4EF] p-1 rounded-xl border border-[#E4E0D6] text-xs font-semibold">
          {['shift', 'today', 'month'].map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPeriod(p as any)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                selectedPeriod === p ? 'bg-white text-[#14213D] shadow-xs font-bold' : 'text-[#6B7280]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* 3-Factor Formula Banner Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        {/* Overall OEE */}
        <div className="bg-white p-5 rounded-2xl border-2 border-[#0F8B8D] shadow-xs flex flex-col justify-between">
          <div className="text-[11px] font-bold text-[#0F8B8D] uppercase tracking-wider">Overall Plant OEE</div>
          <div className="text-4xl font-black text-[#14213D] my-2">{overallOEE}%</div>
          <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> World-Class Target: 85%
          </div>
        </div>

        {/* Availability */}
        <div className="bg-white p-5 rounded-2xl border border-[#E4E0D6] shadow-xs flex flex-col justify-between">
          <div className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Availability (A)</div>
          <div className="text-3xl font-black text-[#14213D] my-2">{availability}%</div>
          <div className="text-[11px] text-[#6B7280]">Operating Time / Planned Time</div>
        </div>

        {/* Performance */}
        <div className="bg-white p-5 rounded-2xl border border-[#E4E0D6] shadow-xs flex flex-col justify-between">
          <div className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Performance (P)</div>
          <div className="text-3xl font-black text-[#14213D] my-2">{performance}%</div>
          <div className="text-[11px] text-[#6B7280]">Ideal Cycle / Actual Cycle</div>
        </div>

        {/* Quality */}
        <div className="bg-white p-5 rounded-2xl border border-[#E4E0D6] shadow-xs flex flex-col justify-between">
          <div className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Quality Rate (Q)</div>
          <div className="text-3xl font-black text-emerald-700 my-2">{quality}%</div>
          <div className="text-[11px] text-[#6B7280]">Good Pieces / Total Produced</div>
        </div>
      </div>

      {/* Six Big Losses Tree */}
      <div className="bg-white rounded-2xl border border-[#E4E0D6] p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-[#14213D]">TPM Six Big Losses Breakdown</h3>
        <div className="space-y-3">
          {sixBigLosses.map((item, idx) => (
            <div key={idx} className="space-y-1 text-xs">
              <div className="flex justify-between font-semibold text-[#14213D]">
                <span>{item.loss}</span>
                <span>{item.hours} Hours ({item.pct}%)</span>
              </div>
              <div className="w-full bg-[#E4E0D6] h-2.5 rounded-full overflow-hidden">
                <div className={`${item.color} h-full rounded-full`} style={{ width: `${item.pct * 2}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
