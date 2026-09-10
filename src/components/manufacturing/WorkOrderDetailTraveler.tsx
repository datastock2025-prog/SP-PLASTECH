import React, { useState } from 'react';
import { WorkOrder, MachineMaster, ItemMaster, BomMaster } from '../../types';
import { MoldMaster } from '../../data/manufacturingData';
import {
  ArrowLeft,
  Barcode,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  Clock,
  Layers,
  FileText,
  ShieldAlert,
  Flame,
  Activity,
  History,
  Tag,
  User,
  Zap,
  TrendingUp,
  Inbox,
  Check,
  Plus,
  Trash2
} from 'lucide-react';

interface TravelerProps {
  workOrder: WorkOrder;
  machines: MachineMaster[];
  items: ItemMaster[];
  boms: BomMaster[];
  molds: MoldMaster[];
  onNavigate: (view: string, param?: any) => void;
  onUpdateWO: (wo: WorkOrder) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
}

export const WorkOrderDetailTraveler: React.FC<TravelerProps> = ({
  workOrder: wo,
  machines,
  items,
  boms,
  molds,
  onNavigate,
  onUpdateWO,
  openDrawer,
  closeDrawer,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<
    'Overview' | 'Instructions' | 'Materials' | 'Operations' | 'Output' | 'Quality' | 'Downtime' | 'Operator History' | 'Documents'
  >('Overview');

  const itemName = (code: string) => items.find((i) => i.code === code)?.name || code;
  const itemObj = items.find((i) => i.code === wo.item);
  const bom = boms.find((b) => b.parent === wo.item && b.status === 'released') || boms[0];
  const assignedMold = molds.find((m) => m.id === wo.mold);

  const progressPct = Math.min(100, Math.round((wo.completed / wo.qty) * 100));

  const handlePrintTraveler = () => {
    window.print();
  };

  const handleRelease = () => {
    onUpdateWO({
      ...wo,
      status: 'released',
      releasedBy: 'Priya Rao (Planner)',
      releasedDate: '2026-08-28',
      history: [{ event: 'Released to production floor', time: 'Just now' }, ...(wo.history || [])]
    });
    showToast(`${wo.id} released to shop floor.`);
  };

  const handleStartProduction = () => {
    onUpdateWO({
      ...wo,
      status: 'in_progress',
      history: [{ event: 'Production started on line', time: 'Just now' }, ...(wo.history || [])]
    });
    showToast(`Production run started for ${wo.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E4E0D6] shadow-xs">
        <button
          onClick={() => onNavigate('woList')}
          className="flex items-center gap-2 text-xs font-bold text-[#0F8B8D] hover:text-[#0c7072] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Work Orders
        </button>

        <div className="flex items-center gap-2">
          {wo.status === 'planned' && (
            <button
              onClick={handleRelease}
              className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              Release Traveler to Floor
            </button>
          )}

          {wo.status === 'released' && (
            <button
              onClick={handleStartProduction}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
            >
              <Play className="w-3.5 h-3.5" /> Start Production
            </button>
          )}

          <button
            onClick={() => onNavigate('shopFloor', { id: wo.id })}
            className="px-3 py-1.5 rounded-xl bg-[#14213D] hover:bg-[#1f3158] text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Open Kiosk Terminal
          </button>

          <button
            onClick={handlePrintTraveler}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-[#E4E0D6] text-xs font-bold text-[#14213D] flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" /> Print Router
          </button>
        </div>
      </div>

      {/* Header Digital Traveler Card with Barcode */}
      <div className="bg-white rounded-2xl border border-[#E4E0D6] p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#0F8B8D]/10 text-[#0F8B8D]">
                {wo.id}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                wo.status === 'in_progress' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
              }`}>
                {wo.status.replace('_', ' ')}
              </span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                wo.priority === 'High' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
              }`}>
                {wo.priority} Priority
              </span>
            </div>

            <div>
              <h1 className="text-2xl font-bold text-[#14213D]">{itemName(wo.item)}</h1>
              <div className="text-xs text-[#6B7280] font-mono mt-0.5">
                Item Code: {wo.item} &bull; Plant Location: {wo.locOutput || 'FG-WH-01-A1'}
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-xs pt-1">
              <div><span className="text-[#6B7280]">Machine:</span> <b className="text-[#14213D] font-mono">{wo.machine || 'Unassigned'}</b></div>
              <div><span className="text-[#6B7280]">Installed Mold:</span> <b className="text-[#14213D] font-mono">{wo.mold || 'MLD-1001'}</b></div>
              <div><span className="text-[#6B7280]">Shift:</span> <b className="text-[#14213D]">{wo.shift || 'Shift A'}</b></div>
              <div><span className="text-[#6B7280]">Lead Operator:</span> <b className="text-[#14213D]">{wo.operator}</b></div>
            </div>
          </div>

          {/* Large Scannable Barcode & QR Code simulation */}
          <div className="p-4 rounded-xl bg-[#F6F4EF] border border-[#E4E0D6] flex flex-col items-center justify-center shrink-0">
            <div className="font-mono text-2xl tracking-[0.25em] font-black text-[#14213D] select-all">
              ||| | |||| | || |||||
            </div>
            <div className="font-mono text-[11px] text-[#6B7280] font-bold mt-1">
              *{wo.id}*
            </div>
            <div className="text-[10px] text-[#0F8B8D] font-semibold mt-0.5">
              Shop Floor Scannable Traveler
            </div>
          </div>
        </div>

        {/* Planned vs Actual Progress Gauge Bar */}
        <div className="mt-6 pt-4 border-t border-[#E4E0D6] space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-[#6B7280]">Manufacturing Output Progress</span>
            <span className="text-[#14213D]">
              <b>{wo.completed.toLocaleString()}</b> / {wo.qty.toLocaleString()} {wo.uom} ({progressPct}%)
              {wo.scrap > 0 && <span className="text-[#C4433A] ml-2 font-bold">(Scrap: {wo.scrap})</span>}
            </span>
          </div>
          <div className="w-full bg-[#E4E0D6] h-3 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                progressPct >= 100 ? 'bg-emerald-600' : 'bg-[#0F8B8D]'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* 9 Tab Navigation Bar */}
      <div className="flex bg-[#F6F4EF] p-1.5 rounded-2xl border border-[#E4E0D6] overflow-x-auto text-xs font-semibold gap-1">
        {[
          'Overview',
          'Instructions',
          'Materials',
          'Operations',
          'Output',
          'Quality',
          'Downtime',
          'Operator History',
          'Documents',
        ].map((tabName) => (
          <button
            key={tabName}
            onClick={() => setActiveTab(tabName as any)}
            className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all ${
              activeTab === tabName
                ? 'bg-white text-[#14213D] shadow-xs font-bold'
                : 'text-[#6B7280] hover:text-[#14213D]'
            }`}
          >
            {tabName}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E4E0D6] p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-[#14213D]">Work Order Schedule &amp; Production Metrics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-[#F6F4EF]">
                <div className="text-[#6B7280]">Target Quantity</div>
                <div className="text-lg font-bold text-[#14213D] mt-0.5">{wo.qty.toLocaleString()} {wo.uom}</div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50">
                <div className="text-emerald-800">Good Output</div>
                <div className="text-lg font-bold text-emerald-900 mt-0.5">{wo.completed.toLocaleString()} {wo.uom}</div>
              </div>
              <div className="p-3 rounded-xl bg-rose-50">
                <div className="text-rose-800">Scrap / Rejects</div>
                <div className="text-lg font-bold text-rose-900 mt-0.5">{wo.scrap} {wo.uom}</div>
              </div>
              <div className="p-3 rounded-xl bg-[#F6F4EF]">
                <div className="text-[#6B7280]">Standard Cycle Time</div>
                <div className="text-lg font-bold text-[#14213D] mt-0.5">{wo.cycleTimeStd || 12.0} s/shot</div>
              </div>
              <div className="p-3 rounded-xl bg-[#F6F4EF]">
                <div className="text-[#6B7280]">Estimated Run Time</div>
                <div className="text-lg font-bold text-[#14213D] mt-0.5">
                  {((wo.qty * (wo.cycleTimeStd || 12.0)) / 3600).toFixed(1)} Hours
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#F6F4EF]">
                <div className="text-[#6B7280]">Warehouse Bin</div>
                <div className="text-lg font-mono font-bold text-[#14213D] mt-0.5">{wo.locOutput || 'FG-WH-01-A1'}</div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E4E0D6] space-y-2">
              <h4 className="font-bold text-xs text-[#14213D]">Recipe BOM Reference</h4>
              <div className="p-3 rounded-xl border border-[#E4E0D6] bg-slate-50/50 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono font-bold text-[#0F8B8D]">{bom?.id || 'BOM-1042'}</span> &mdash;{' '}
                  <span className="font-semibold">{bom?.parentName}</span> ({bom?.version})
                </div>
                <button
                  onClick={() => onNavigate('bomDetail', { id: bom?.id })}
                  className="text-xs text-[#0F8B8D] font-bold hover:underline"
                >
                  View BOM Tree &rarr;
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E4E0D6] p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-[#14213D]">Traceability &amp; Verification</h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-[#F6F4EF]">
                <span className="text-[#6B7280]">Electronic Batch Record:</span>
                <span className="font-mono font-bold text-[#0F8B8D]">EBR-2026-00456</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#F6F4EF]">
                <span className="text-[#6B7280]">Quality Gate Status:</span>
                <span className="font-bold text-emerald-700">Passed First Article</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#F6F4EF]">
                <span className="text-[#6B7280]">Material Staged:</span>
                <span className="font-bold text-emerald-700">100% Issued</span>
              </div>
            </div>

            <button
              onClick={() => onNavigate('genealogy', { id: wo.id })}
              className="w-full py-2 rounded-xl bg-[#0F8B8D] text-white hover:bg-[#0c7072] text-xs font-bold shadow-xs transition-colors"
            >
              View Full Batch Genealogy &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Instructions & Parameters */}
      {activeTab === 'Instructions' && (
        <div className="bg-white rounded-2xl border border-[#E4E0D6] p-5 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-[#14213D]">Machine Process Parameter Setup Sheet</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[#F6F4EF] text-[#6B7280] border-b border-[#E4E0D6]">
                  <th className="p-2.5 text-left font-bold">Zone / Process Setting</th>
                  <th className="p-2.5 text-center font-bold">Target Setpoint</th>
                  <th className="p-2.5 text-center font-bold">Tolerance Band</th>
                  <th className="p-2.5 text-center font-bold">Actual Telemetry</th>
                  <th className="p-2.5 text-center font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { zone: 'Barrel Temperature — Zone 1 (Feed)', target: '205 °C', tol: '±5 °C', act: '206 °C', status: 'In Spec' },
                  { zone: 'Barrel Temperature — Zone 2 (Compression)', target: '212 °C', tol: '±5 °C', act: '213 °C', status: 'In Spec' },
                  { zone: 'Barrel Temperature — Zone 3 (Metering)', target: '215 °C', tol: '±5 °C', act: '215 °C', status: 'In Spec' },
                  { zone: 'Nozzle Tip Temperature', target: '220 °C', tol: '±3 °C', act: '221 °C', status: 'In Spec' },
                  { zone: 'Mold Chilled Water Temp (Stationary/Movable)', target: '35 °C', tol: '±2 °C', act: '36 °C', status: 'In Spec' },
                  { zone: 'Injection Pressure Setpoint', target: '850 bar', tol: '±30 bar', act: '848 bar', status: 'In Spec' },
                  { zone: 'Holding Pressure Setpoint', target: '450 bar', tol: '±20 bar', act: '452 bar', status: 'In Spec' },
                  { zone: 'Screw Recovery Speed', target: '120 RPM', tol: '±10 RPM', act: '119 RPM', status: 'In Spec' },
                  { zone: 'Cooling Time Timer', target: '8.0 sec', tol: '±0.5 sec', act: '8.1 sec', status: 'In Spec' }
                ].map((row, idx) => (
                  <tr key={idx} className="border-b border-[#E4E0D6] hover:bg-[#FAF9F5]">
                    <td className="p-2.5 font-medium text-[#14213D]">{row.zone}</td>
                    <td className="p-2.5 text-center font-mono font-bold text-[#14213D]">{row.target}</td>
                    <td className="p-2.5 text-center font-mono text-[#6B7280]">{row.tol}</td>
                    <td className="p-2.5 text-center font-mono font-bold text-emerald-700">{row.act}</td>
                    <td className="p-2.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Materials */}
      {activeTab === 'Materials' && (
        <div className="bg-white rounded-2xl border border-[#E4E0D6] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#14213D]">Required Components &amp; Resin Dosing</h3>
            <button
              onClick={() => onNavigate('materialIssuing', { id: wo.id })}
              className="px-3 py-1.5 rounded-xl bg-[#0F8B8D] text-white text-xs font-bold"
            >
              Scan &amp; Issue Material &rarr;
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[#F6F4EF] text-[#6B7280] border-b border-[#E4E0D6]">
                  <th className="p-2.5 text-left font-bold">Material Code</th>
                  <th className="p-2.5 text-left font-bold">Description</th>
                  <th className="p-2.5 text-right font-bold">Required Qty</th>
                  <th className="p-2.5 text-right font-bold">Issued Qty</th>
                  <th className="p-2.5 text-left font-bold">Assigned Lot #</th>
                  <th className="p-2.5 text-center font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { code: 'RM-PP-NAT-001', name: 'PP Natural Granules (Virgin)', req: 3880, issued: 3880, lot: 'LOT-001-01', status: '100% Issued' },
                  { code: 'MB-WHT-002', name: 'White Masterbatch (2% Dosage)', req: 96, issued: 96, lot: 'LOT-MB-00456', status: '100% Issued' },
                  { code: 'RG-PP-011', name: 'Recycled Regrind PP (Max 15%)', req: 420, issued: 420, lot: 'RG-00321', status: '100% Issued' },
                  { code: 'PK-CTN-021', name: 'Export Packaging Cartons (200 pcs)', req: 40, issued: 40, lot: 'PK-LOT-88', status: '100% Issued' }
                ].map((m, idx) => (
                  <tr key={idx} className="border-b border-[#E4E0D6]">
                    <td className="p-2.5 font-mono font-bold text-[#0F8B8D]">{m.code}</td>
                    <td className="p-2.5 font-semibold text-[#14213D]">{m.name}</td>
                    <td className="p-2.5 text-right font-mono font-bold">{m.req.toLocaleString()} KG</td>
                    <td className="p-2.5 text-right font-mono font-bold text-[#1F8A5F]">{m.issued.toLocaleString()} KG</td>
                    <td className="p-2.5 font-mono text-[#6B7280]">{m.lot}</td>
                    <td className="p-2.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 8: Operator History */}
      {activeTab === 'Operator History' && (
        <div className="bg-white rounded-2xl border border-[#E4E0D6] p-5 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-[#14213D]">Operator Assignment &amp; Shift Change History</h3>
          <div className="space-y-3">
            {[
              {
                time: '2026-08-28 06:00',
                from: 'None (Initial Assignment)',
                to: 'Rajesh Kumar (Senior Molder)',
                by: 'Anjali Sharma (Supervisor)',
                reason: 'Shift A allocation',
                shift: 'Shift A'
              },
              {
                time: '2026-08-27 14:00',
                from: 'S. Nair',
                to: 'A. Sharma',
                by: 'Priya Rao (Planner)',
                reason: 'Shift handover rotation',
                shift: 'Shift B'
              }
            ].map((log, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-[#F6F4EF] border border-[#E4E0D6] text-xs space-y-1">
                <div className="flex justify-between font-bold text-[#14213D]">
                  <span>{log.to} &larr; <span className="text-[#6B7280] font-normal">{log.from}</span></span>
                  <span className="text-[11px] font-mono text-[#6B7280]">{log.time}</span>
                </div>
                <div className="text-[11px] text-[#6B7280]">
                  Changed By: <b>{log.by}</b> &bull; Reason: <i>{log.reason}</i> &bull; {log.shift}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other Tabs Fallback */}
      {!['Overview', 'Instructions', 'Materials', 'Operator History'].includes(activeTab) && (
        <div className="bg-white rounded-2xl border border-[#E4E0D6] p-5 text-xs text-[#6B7280] space-y-2">
          <h4 className="font-bold text-sm text-[#14213D]">{activeTab} Details</h4>
          <p>Active audit logs, real-time telemetry checkpoints, and operator signatures for <b>{wo.id}</b>.</p>
        </div>
      )}
    </div>
  );
};
