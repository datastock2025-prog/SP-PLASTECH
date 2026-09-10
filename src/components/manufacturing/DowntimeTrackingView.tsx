import React, { useState } from 'react';
import { WorkOrder, MachineMaster } from '../../types';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Flame,
  Plus,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Layers,
  Activity,
  Filter
} from 'lucide-react';

interface DowntimeProps {
  workOrders: WorkOrder[];
  machines: MachineMaster[];
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const DowntimeTrackingView: React.FC<DowntimeProps> = ({
  workOrders,
  machines,
  onNavigate,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'events' | 'pareto' | 'mttr'>('events');

  // Downtime live events list
  const downtimeEvents = [
    {
      id: 'DT-2026-088',
      machine: 'BLW-01',
      wo: 'WO-1191',
      category: 'Equipment Failure',
      subReason: 'Zone 2 Thermocouple Trip',
      durationMin: 35,
      status: 'Active (18m elapsed)',
      escalationLevel: 'Level 2: Maintenance Lead Assigned',
      reportedAt: '10:40 AM',
      technician: 'D. Mistry'
    },
    {
      id: 'DT-2026-087',
      machine: 'IMM-250T-03',
      wo: 'WO-1188',
      category: 'Tooling & Mold',
      subReason: 'Mold Temperature Adjustment',
      durationMin: 20,
      status: 'Resolved',
      escalationLevel: 'Level 1: Operator Handled',
      reportedAt: '09:15 AM',
      technician: 'R. Kumar'
    },
    {
      id: 'DT-2026-086',
      machine: 'EXT-LINE-02',
      wo: 'WO-1189',
      category: 'Material & Feed',
      subReason: 'Hopper Vacuum Loader Clog',
      durationMin: 15,
      status: 'Resolved',
      escalationLevel: 'Level 1: Operator Handled',
      reportedAt: '07:30 AM',
      technician: 'A. Sharma'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E4E0D6] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-800">
              Plant Reliability &bull; OEE Loss Driver
            </span>
            <span className="text-[11px] text-[#6B7280]">
              Hierarchical Reason Codes &bull; Escalation Timers
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#14213D]">Downtime Tracking &amp; Analysis</h1>
        </div>

        <div className="flex bg-[#F6F4EF] p-1 rounded-xl border border-[#E4E0D6] text-xs font-semibold">
          <button
            onClick={() => setActiveTab('events')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'events' ? 'bg-white text-[#14213D] shadow-xs font-bold' : 'text-[#6B7280]'
            }`}
          >
            Live Events &amp; Log
          </button>
          <button
            onClick={() => setActiveTab('mttr')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'mttr' ? 'bg-white text-[#14213D] shadow-xs font-bold' : 'text-[#6B7280]'
            }`}
          >
            MTBF &amp; MTTR Metrics
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-4 rounded-2xl border border-[#E4E0D6] shadow-xs">
          <div className="text-[#6B7280]">Total Downtime Today</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">70 min</div>
          <div className="text-[11px] text-[#6B7280]">3 events logged</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#E4E0D6] shadow-xs">
          <div className="text-[#6B7280]">Mean Time to Repair (MTTR)</div>
          <div className="text-2xl font-bold text-[#0F8B8D] mt-1">23.3 min</div>
          <div className="text-[11px] text-emerald-700">Target &lt; 30 min</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#E4E0D6] shadow-xs">
          <div className="text-[#6B7280]">Mean Time Between Failures (MTBF)</div>
          <div className="text-2xl font-bold text-[#14213D] mt-1">14.8 Hours</div>
          <div className="text-[11px] text-[#6B7280]">Plant benchmark: 12h</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#E4E0D6] shadow-xs">
          <div className="text-[#6B7280]">Active Breakdown Bay</div>
          <div className="text-xl font-bold text-rose-600 mt-1">BLW-01 (18 min)</div>
          <div className="text-[11px] text-rose-700">Escalation active</div>
        </div>
      </div>

      {/* Events Table */}
      {activeTab === 'events' && (
        <div className="bg-white rounded-2xl border border-[#E4E0D6] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E4E0D6]">
            <h3 className="font-bold text-sm text-[#14213D]">Recent Downtime Incidents</h3>
            <button
              onClick={() => showToast('Downtime event logged manually.')}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
            >
              + Log New Stoppage
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead className="bg-[#F6F4EF] text-[#6B7280]">
                <tr className="border-b border-[#E4E0D6]">
                  <th className="p-3 text-left font-bold">Event ID</th>
                  <th className="p-3 text-left font-bold">Machine Bay</th>
                  <th className="p-3 text-left font-bold">Work Order</th>
                  <th className="p-3 text-left font-bold">Root Cause Reason</th>
                  <th className="p-3 text-right font-bold">Duration</th>
                  <th className="p-3 text-left font-bold">Escalation &amp; Technician</th>
                  <th className="p-3 text-center font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {downtimeEvents.map((evt) => (
                  <tr key={evt.id} className="border-b border-[#E4E0D6] hover:bg-[#FAF9F5]">
                    <td className="p-3 font-mono font-bold text-[#0F8B8D]">{evt.id}</td>
                    <td className="p-3 font-mono font-bold text-[#14213D]">{evt.machine}</td>
                    <td className="p-3 font-mono text-[#6B7280]">{evt.wo}</td>
                    <td className="p-3">
                      <div className="font-semibold text-[#14213D]">{evt.subReason}</div>
                      <div className="text-[10px] text-[#6B7280]">{evt.category}</div>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-amber-700">{evt.durationMin} min</td>
                    <td className="p-3">
                      <div className="font-medium text-[#14213D]">{evt.escalationLevel}</div>
                      <div className="text-[10px] text-[#6B7280]">Assigned: {evt.technician}</div>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        evt.status.includes('Active') ? 'bg-rose-100 text-rose-800 animate-pulse' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {evt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
