import React, { useState } from 'react';
import { WorkOrder, MachineMaster, ItemMaster } from '../../types';
import { MoldMaster } from '../../data/manufacturingData';
import {
  Play,
  Pause,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flame,
  Activity,
  Plus,
  RefreshCw,
  Sliders,
  Send,
  Zap,
  TrendingUp,
  BarChart2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Cpu
} from 'lucide-react';

interface CommandCenterProps {
  workOrders: WorkOrder[];
  machines: MachineMaster[];
  items: ItemMaster[];
  molds: MoldMaster[];
  onNavigate: (view: string, param?: any) => void;
  onUpdateWO: (wo: WorkOrder) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
}

export const MfgCommandCenter: React.FC<CommandCenterProps> = ({
  workOrders,
  machines,
  items,
  molds,
  onNavigate,
  onUpdateWO,
  openDrawer,
  closeDrawer,
  showToast,
}) => {
  const [timeRange, setTimeRange] = useState<'shift' | 'day' | 'week'>('shift');
  const [selectedBay, setSelectedBay] = useState<string>('all');

  const itemName = (code: string) => items.find((i) => i.code === code)?.name || code;
  const prodMachines = machines.filter((m) =>
    ['Injection Molding Machine', 'Extrusion Line', 'Blow Molding Machine'].includes(m.type)
  );

  const filteredMachines = selectedBay === 'all'
    ? prodMachines
    : prodMachines.filter((m) => m.line.toLowerCase().includes(selectedBay.toLowerCase()));

  // Active metrics
  const activeWOs = workOrders.filter((w) => ['in_progress', 'released', 'material_wait'].includes(w.status));
  const totalCompleted = workOrders.reduce((sum, w) => sum + (w.completed || 0), 0);
  const totalTarget = workOrders.reduce((sum, w) => sum + (w.qty || 0), 0);
  const targetPct = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 84;
  const totalScrap = workOrders.reduce((sum, w) => sum + (w.scrap || 0), 0);
  const scrapRate = totalCompleted > 0 ? ((totalScrap / (totalCompleted + totalScrap)) * 100).toFixed(1) : '1.8';
  const totalDowntimeMin = workOrders.reduce((sum, w) => sum + (w.downtimeMin || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header & Fast Toggles */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E4E0D6] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#0F8B8D]/10 text-[#0F8B8D]">
              MES Live Plant Floor
            </span>
            <span className="flex items-center gap-1 text-[11px] text-[#1F8A5F] font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#1F8A5F] animate-pulse" />
              Connected &middot; Real-time Telemetry
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#14213D]">Production Command Center</h1>
          <p className="text-xs text-[#6B7280]">
            Centralized supervisory dashboard bridging office planning, plant floor IoT telemetry, and OEE performance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Shift/Day/Week Toggle */}
          <div className="flex bg-[#F6F4EF] p-1 rounded-xl border border-[#E4E0D6] text-xs font-semibold">
            <button
              onClick={() => setTimeRange('shift')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeRange === 'shift' ? 'bg-white text-[#14213D] shadow-xs font-bold' : 'text-[#6B7280]'
              }`}
            >
              Current Shift A
            </button>
            <button
              onClick={() => setTimeRange('day')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeRange === 'day' ? 'bg-white text-[#14213D] shadow-xs font-bold' : 'text-[#6B7280]'
              }`}
            >
              Today (24h)
            </button>
            <button
              onClick={() => setTimeRange('week')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeRange === 'week' ? 'bg-white text-[#14213D] shadow-xs font-bold' : 'text-[#6B7280]'
              }`}
            >
              This Week
            </button>
          </div>

          <button
            onClick={() => onNavigate('shopFloor')}
            className="px-3 py-2 rounded-xl bg-[#14213D] text-white hover:bg-[#1f3158] text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-[#E8622C]" />
            Operator Kiosk
          </button>
          <button
            onClick={() => onNavigate('prodEntryGrid')}
            className="px-3 py-2 rounded-xl bg-[#0F8B8D] text-white hover:bg-[#0c7072] text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            Inline Data Grid
          </button>
        </div>
      </div>

      {/* KPI Summary Row (11 Key Production Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-[#E4E0D6] shadow-xs">
          <div className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Output vs Target</div>
          <div className="text-xl font-bold text-[#14213D] mt-1">{targetPct}%</div>
          <div className="text-[11px] text-[#1F8A5F] font-semibold mt-0.5">
            {totalCompleted.toLocaleString()} / {totalTarget.toLocaleString()} pcs
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#E4E0D6] shadow-xs">
          <div className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Overall Plant OEE</div>
          <div className="text-xl font-bold text-[#0F8B8D] mt-1">79.2%</div>
          <div className="text-[11px] text-[#6B7280] mt-0.5">
            A: 88% &bull; P: 92% &bull; Q: 98%
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#E4E0D6] shadow-xs">
          <div className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Scrap Rate</div>
          <div className="text-xl font-bold text-[#C4433A] mt-1">{scrapRate}%</div>
          <div className="text-[11px] text-[#6B7280] mt-0.5">
            {totalScrap.toLocaleString()} pcs ({((totalScrap * 0.048)).toFixed(0)} kg)
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#E4E0D6] shadow-xs">
          <div className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Downtime Today</div>
          <div className="text-xl font-bold text-[#D97706] mt-1">{totalDowntimeMin} min</div>
          <div className="text-[11px] text-[#6B7280] mt-0.5">3 active events logged</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#E4E0D6] shadow-xs">
          <div className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Active WOs / Bays</div>
          <div className="text-xl font-bold text-[#14213D] mt-1">{activeWOs.length} WOs</div>
          <div className="text-[11px] text-[#1F8A5F] font-semibold mt-0.5">5 of 6 machines running</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#E4E0D6] shadow-xs">
          <div className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Changeovers</div>
          <div className="text-xl font-bold text-purple-700 mt-1">2 Planned</div>
          <div className="text-[11px] text-[#6B7280] mt-0.5">Avg duration: 32 min</div>
        </div>
      </div>

      {/* Real-Time Machine Status Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#14213D]">Real-Time Machine Telemetry &amp; Status</h2>
            <span className="text-xs px-2 py-0.5 rounded bg-[#F6F4EF] text-[#4B5563] font-mono font-bold">
              {filteredMachines.length} Bays Active
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[#6B7280]">Bay Filter:</span>
            <select
              value={selectedBay}
              onChange={(e) => setSelectedBay(e.target.value)}
              className="px-2.5 py-1 text-xs border border-[#E4E0D6] rounded-lg bg-white font-semibold text-[#14213D]"
            >
              <option value="all">All Plant Lines</option>
              <option value="Line 1">Line 1 (Heavy Bays)</option>
              <option value="Line 2">Line 2 (Extrusion)</option>
              <option value="Line 3">Line 3 (High-Speed IMM)</option>
              <option value="Line 4">Line 4 (Blow Molding)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredMachines.map((m) => {
            const activeWO = workOrders.find(
              (w) => w.machine === m.id && !['completed', 'cancelled'].includes(w.status)
            );
            const assignedMold = molds.find((mold) => mold.assignedMachine === m.id || mold.id === activeWO?.mold);

            let statusColor = 'bg-emerald-500';
            let statusBadgeCls = 'bg-emerald-100 text-emerald-800 border-emerald-200';
            let statusLabel = 'Running In Spec';

            if (m.status === 'breakdown') {
              statusColor = 'bg-rose-500';
              statusBadgeCls = 'bg-rose-100 text-rose-800 border-rose-200';
              statusLabel = 'Downtime / Breakdown';
            } else if (m.status === 'idle') {
              statusColor = 'bg-amber-500';
              statusBadgeCls = 'bg-amber-100 text-amber-800 border-amber-200';
              statusLabel = 'Idle / Setup Pending';
            }

            const oee = m.status === 'running' ? (m.id === 'IMM-250T-03' ? 84 : 76) : m.status === 'breakdown' ? 0 : 42;
            const cycleActual = m.status === 'running' ? (activeWO?.cycleTimeStd ? (activeWO.cycleTimeStd + 0.1).toFixed(1) : '12.1') : '—';
            const cycleStd = activeWO?.cycleTimeStd || 12.0;

            return (
              <div
                key={m.id}
                onClick={() => onNavigate('machineList', { id: m.id })}
                className="bg-white rounded-2xl border border-[#E4E0D6] p-4 shadow-xs hover:border-[#0F8B8D] hover:shadow-md transition-all cursor-pointer group"
              >
                {/* Header */}
                <div className="flex items-start justify-between pb-3 border-b border-[#E4E0D6]">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-3 h-3 rounded-full ${statusColor} ${m.status === 'running' ? 'animate-pulse' : ''}`} />
                    <div>
                      <div className="font-bold text-sm text-[#14213D] group-hover:text-[#0F8B8D] transition-colors flex items-center gap-1.5">
                        <span>{m.id}</span>
                        <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-[#F6F4EF] text-[#6B7280]">
                          {m.tonnage || m.line}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#6B7280]">{m.name}</div>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadgeCls}`}>
                    {statusLabel}
                  </span>
                </div>

                {/* Job & Product Info */}
                <div className="py-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7280]">Active Work Order:</span>
                    {activeWO ? (
                      <span className="font-mono font-bold text-[#0F8B8D] bg-[#0F8B8D]/10 px-1.5 py-0.5 rounded">
                        {activeWO.id}
                      </span>
                    ) : (
                      <span className="text-[#9CA3AF] italic">No active order</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7280]">Product:</span>
                    <span className="font-semibold text-[#14213D] truncate max-w-[180px]">
                      {activeWO ? itemName(activeWO.item) : '—'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7280]">Installed Mold:</span>
                    <span className="font-mono text-[#4B5563]">
                      {assignedMold ? `${assignedMold.id} (${assignedMold.cavities} Cav)` : '—'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#F6F4EF]">
                    <div>
                      <div className="text-[10px] text-[#6B7280]">Cycle Time (Act vs Std)</div>
                      <div className="font-mono font-bold text-[#14213D]">
                        {cycleActual}s <span className="text-[10px] font-normal text-[#6B7280]">/ {cycleStd}s</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#6B7280]">Operator On Shift</div>
                      <div className="font-semibold text-[#14213D] truncate">
                        {activeWO ? activeWO.operator : '—'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mini OEE Bar */}
                <div className="pt-3 border-t border-[#E4E0D6] flex items-center justify-between gap-3 text-xs">
                  <span className="text-[11px] font-bold text-[#6B7280]">Bay OEE</span>
                  <div className="flex-1 h-2 bg-[#E4E0D6] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        oee >= 80 ? 'bg-emerald-500' : oee > 50 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${oee}%` }}
                    />
                  </div>
                  <span className="font-mono font-bold text-[#14213D]">{oee}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Alerts Panel & Shift Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Alerts Stream */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E4E0D6] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E4E0D6]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#C4433A]" />
              <h3 className="font-bold text-sm text-[#14213D]">Live Production Alerts &amp; Critical Exceptions</h3>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold">
              3 Requires Attention
            </span>
          </div>

          <div className="space-y-2.5">
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-rose-600 mt-1.5 shrink-0" />
                <div>
                  <div className="font-bold text-rose-900">
                    BLW-01: Machine Down &gt; 15 min &mdash; Zone 2 Thermocouple Trip
                  </div>
                  <div className="text-rose-700 text-[11px] mt-0.5">
                    Triggered at 09:40 AM &bull; Technician D. Mistry dispatched &bull; Escalation timer: 18 min elapsed
                  </div>
                </div>
              </div>
              <button
                onClick={() => onNavigate('scrapDowntime')}
                className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[11px] shrink-0"
              >
                Resolve &rarr;
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                <div>
                  <div className="font-bold text-amber-900">
                    WO-1191 (IMM-650T): Cycle Time Drift (+11.6% above standard)
                  </div>
                  <div className="text-amber-700 text-[11px] mt-0.5">
                    Actual: 13.4s vs Std: 12.0s &bull; Mold cooling water flow rate restricted to 18 L/min
                  </div>
                </div>
              </div>
              <button
                onClick={() => onNavigate('woDetail', { id: 'WO-1191' })}
                className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] shrink-0"
              >
                Inspect &rarr;
              </button>
            </div>

            <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 flex items-start justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-purple-600 mt-1.5 shrink-0" />
                <div>
                  <div className="font-bold text-purple-900">
                    Mold MLD-1001: Preventive Maintenance Threshold Reached (428k / 450k Shots)
                  </div>
                  <div className="text-purple-700 text-[11px] mt-0.5">
                    Due in 21,350 shots &bull; Schedule toolroom cavity polish &amp; seal kit replacement
                  </div>
                </div>
              </div>
              <button
                onClick={() => onNavigate('moldTooling')}
                className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-700 text-white font-semibold text-[11px] shrink-0"
              >
                Toolroom &rarr;
              </button>
            </div>
          </div>
        </div>

        {/* Shift Summary & Fast Quick Actions */}
        <div className="bg-white rounded-2xl border border-[#E4E0D6] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E4E0D6]">
            <div>
              <h3 className="font-bold text-sm text-[#14213D]">Shift A Operations Summary</h3>
              <div className="text-[11px] text-[#6B7280]">06:00 &mdash; 14:00 (3h 15m remaining)</div>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              On Track
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-[#F6F4EF]">
              <span className="text-[#6B7280]">Shift Supervisor:</span>
              <span className="font-semibold text-[#14213D]">Anjali Sharma</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#F6F4EF]">
              <span className="text-[#6B7280]">Output Achieved:</span>
              <span className="font-bold text-[#1F8A5F]">7.84 Tons / 8.5 Tons (92.2%)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#F6F4EF]">
              <span className="text-[#6B7280]">Safety Counter:</span>
              <span className="font-bold text-[#1F8A5F] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> 0 Incidents (342 Safe Days)
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#F6F4EF]">
              <span className="text-[#6B7280]">Top Scrap Driver:</span>
              <span className="font-medium text-[#C4433A]">Short Shots (42%)</span>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="pt-2 border-t border-[#E4E0D6] space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Quick Actions</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onNavigate('woList')}
                className="p-2 rounded-xl bg-[#F6F4EF] hover:bg-[#FAF9F5] border border-[#E4E0D6] text-xs font-semibold text-[#14213D] text-left transition-colors"
              >
                + Create Work Order
              </button>
              <button
                onClick={() => onNavigate('scrapDowntime')}
                className="p-2 rounded-xl bg-[#F6F4EF] hover:bg-[#FAF9F5] border border-[#E4E0D6] text-xs font-semibold text-[#14213D] text-left transition-colors"
              >
                Log Downtime Event
              </button>
              <button
                onClick={() => onNavigate('materialIssuing')}
                className="p-2 rounded-xl bg-[#F6F4EF] hover:bg-[#FAF9F5] border border-[#E4E0D6] text-xs font-semibold text-[#14213D] text-left transition-colors"
              >
                Scan Issue Material
              </button>
              <button
                onClick={() => onNavigate('changeover')}
                className="p-2 rounded-xl bg-[#F6F4EF] hover:bg-[#FAF9F5] border border-[#E4E0D6] text-xs font-semibold text-[#14213D] text-left transition-colors"
              >
                SMED Changeover
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
