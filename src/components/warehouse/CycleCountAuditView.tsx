import React, { useState } from 'react';
import {
  Hash,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Plus,
  ArrowRight,
  ShieldCheck,
  User,
  Sliders,
  Calendar,
} from 'lucide-react';
import { CycleCountSession, CycleCountItemAudit } from '../../types/warehouse';
import { WarehouseStatusBadge } from './WarehouseStatusBadge';

interface Props {
  sessions: CycleCountSession[];
  onNavigate: (view: string, param?: any) => void;
  openDrawer: (title: string, content: React.ReactNode, footer?: React.ReactNode) => void;
  closeDrawer: () => void;
  showToast: (msg: string) => void;
  onUpdateSession?: (session: CycleCountSession) => void;
  onCreateSession?: (session: CycleCountSession) => void;
}

export const CycleCountAuditView: React.FC<Props> = ({
  sessions,
  onNavigate,
  openDrawer,
  closeDrawer,
  showToast,
  onUpdateSession,
  onCreateSession,
}) => {
  const [sessionList, setSessionList] = useState<CycleCountSession[]>(sessions);
  const [selectedSessionId, setSelectedSessionId] = useState<string>(sessions[0]?.id || '');

  const currentSession = sessionList.find((s) => s.id === selectedSessionId) || sessionList[0];

  const handleUpdateItemCount = (itemSku: string, countedQty: number) => {
    if (!currentSession) return;
    const updatedItems = currentSession.items.map((item) => {
      if (item.itemSku === itemSku) {
        const varianceQty = countedQty - item.systemRecordedQty;
        const variancePct = item.systemRecordedQty > 0 ? (varianceQty / item.systemRecordedQty) * 100 : 0;
        const unitRate = 80; // approximate
        return {
          ...item,
          physicallyCountedQty: countedQty,
          varianceQty,
          variancePct: parseFloat(variancePct.toFixed(2)),
          varianceValueInr: varianceQty * unitRate,
          status: varianceQty === 0 ? ('matched' as const) : ('variance' as const),
        };
      }
      return item;
    });

    const matched = updatedItems.filter((i) => i.status === 'matched').length;
    const variance = updatedItems.filter((i) => i.status === 'variance').length;
    const netVal = updatedItems.reduce((a, b) => a + b.varianceValueInr, 0);

    const updatedSession: CycleCountSession = {
      ...currentSession,
      items: updatedItems,
      matchedCount: matched,
      varianceCount: variance,
      netVarianceValueInr: netVal,
      status: variance > 0 ? 'under_review' : 'reconciled',
    };

    setSessionList((prev) => prev.map((s) => (s.id === updatedSession.id ? updatedSession : s)));
    if (onUpdateSession) onUpdateSession(updatedSession);
    showToast(`Updated physical count for ${itemSku}`);
  };

  const handleReconcileSession = () => {
    if (!currentSession) return;
    const updatedSession: CycleCountSession = {
      ...currentSession,
      status: 'reconciled',
      items: currentSession.items.map((i) => ({ ...i, status: 'matched' })),
    };
    setSessionList((prev) => prev.map((s) => (s.id === updatedSession.id ? updatedSession : s)));
    if (onUpdateSession) onUpdateSession(updatedSession);
    showToast(`Cycle Count ${currentSession.countNumber} reconciled and inventory ledger posted`);
  };

  const openNewCountDrawer = () => {
    let title = 'Weekly High-Value Resin Audit';
    let zone = 'Zone A (Bulk Silos & Pallet Bays)';
    let auditor = 'Anil Sharma (Internal Auditor)';
    let freq: any = 'Weekly High Value';

    openDrawer(
      'Initiate New Cycle Count Session',
      <div className="space-y-4 text-xs">
        <div className="space-y-1">
          <label className="font-semibold text-slate-700">Audit Session Title</label>
          <input
            type="text"
            defaultValue={title}
            onChange={(e) => (title = e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#0F8B8D] outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-slate-700">Target Warehouse Zone</label>
          <select
            defaultValue={zone}
            onChange={(e) => (zone = e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#0F8B8D] outline-none"
          >
            <option value="Zone A (Bulk Silos & Pallet Bays)">Zone A (Bulk Silos & Pallet Bays)</option>
            <option value="Zone B (Masterbatch & Additives Vault)">Zone B (Masterbatch & Additives Vault)</option>
            <option value="Zone C (Finished Goods High-Bay Racks)">Zone C (Finished Goods High-Bay Racks)</option>
            <option value="Zone D (Regrind Closed Loop Silos)">Zone D (Regrind Closed Loop Silos)</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Audit Frequency</label>
            <select
              defaultValue={freq}
              onChange={(e) => (freq = e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#0F8B8D] outline-none"
            >
              <option value="Daily ABC">Daily ABC Fast Movers</option>
              <option value="Weekly High Value">Weekly High Value</option>
              <option value="Monthly Full Wall-to-Wall">Monthly Full Wall-to-Wall</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Assigned Auditor</label>
            <input
              type="text"
              defaultValue={auditor}
              onChange={(e) => (auditor = e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#0F8B8D] outline-none"
            />
          </div>
        </div>
      </div>,
      <div className="flex items-center justify-end gap-2 w-full">
        <button
          onClick={closeDrawer}
          className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            const newSession: CycleCountSession = {
              id: `CC-${Date.now()}`,
              countNumber: `CC-2026-W${Math.floor(Math.random() * 20 + 35)}`,
              sessionTitle: title,
              targetZone: zone,
              frequency: freq,
              auditorName: auditor,
              startDate: new Date().toISOString().slice(0, 10),
              status: 'in_progress',
              totalSkusAudited: 3,
              matchedCount: 2,
              varianceCount: 1,
              netVarianceValueInr: 0,
              items: [
                {
                  itemSku: 'RM-PP-NAT-001',
                  itemName: 'PP Natural Homopolymer Granules',
                  binLocation: 'SILO-01-A',
                  lotNumber: 'LOT-2026-PP-881',
                  systemRecordedQty: 14500,
                  physicallyCountedQty: 14500,
                  varianceQty: 0,
                  variancePct: 0,
                  varianceValueInr: 0,
                  status: 'matched',
                },
                {
                  itemSku: 'MB-BLK-001',
                  itemName: 'Carbon Black Masterbatch 40%',
                  binLocation: 'VAULT-B-01-RACK',
                  lotNumber: 'LOT-2026-MB-108',
                  systemRecordedQty: 2400,
                  physicallyCountedQty: 2390,
                  varianceQty: -10,
                  variancePct: -0.4,
                  varianceValueInr: -1450,
                  status: 'variance',
                  remarks: '10kg sample bag consumed by color lab',
                },
              ],
            };
            setSessionList((prev) => [newSession, ...prev]);
            setSelectedSessionId(newSession.id);
            if (onCreateSession) onCreateSession(newSession);
            closeDrawer();
            showToast(`Created Cycle Count Session ${newSession.countNumber}`);
          }}
          className="px-4 py-2 bg-[#14213D] hover:bg-[#1f325c] text-white rounded-lg text-xs font-semibold"
        >
          Launch Audit Session
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#0F8B8D]/10 text-[#0F8B8D] border border-[#0F8B8D]/30 uppercase tracking-wider">
              Physical Stock Audit &middot; ABC Reconciliation
            </span>
          </div>
          <h1 className="text-xl font-bold font-['Space_Grotesk'] text-[#14213D]">
            Cycle Count &amp; Stock Audit Sessions
          </h1>
          <p className="text-xs text-slate-500">
            Perpetual inventory counting, blind weight audits, variance analysis, and ledger reconciliation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openNewCountDrawer}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#14213D] hover:bg-[#1f325c] text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" /> + New Cycle Count Session
          </button>
        </div>
      </div>

      {/* Session Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {sessionList.map((session) => (
          <div
            key={session.id}
            onClick={() => setSelectedSessionId(session.id)}
            className={`p-4 rounded-2xl border transition cursor-pointer space-y-2 ${
              selectedSessionId === session.id
                ? 'border-[#0F8B8D] bg-teal-50/40 shadow-sm ring-2 ring-[#0F8B8D]/20'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-xs text-[#14213D]">{session.countNumber}</span>
              <WarehouseStatusBadge status={session.status} size="xs" />
            </div>
            <div className="font-bold text-xs text-slate-900">{session.sessionTitle}</div>
            <div className="text-[11px] text-slate-500 font-mono">
              Zone: {session.targetZone} &bull; Auditor: {session.auditorName.split(' ')[0]}
            </div>
            <div className="flex justify-between text-[11px] font-mono pt-1 border-t border-slate-100">
              <span className="text-emerald-600 font-bold">{session.matchedCount} Matched</span>
              <span className="text-amber-600 font-bold">{session.varianceCount} Variance</span>
            </div>
          </div>
        ))}
      </div>

      {/* Active Session Audit Table */}
      {currentSession && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-[#0F8B8D]">{currentSession.countNumber}</span>
                <h3 className="font-bold font-['Space_Grotesk'] text-base text-[#14213D]">
                  {currentSession.sessionTitle}
                </h3>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Target Zone: <span className="font-semibold">{currentSession.targetZone}</span> &bull; Auditor: {currentSession.auditorName} &bull; Date: {currentSession.startDate}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleReconcileSession}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded-xl text-xs font-semibold shadow-sm transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Post &amp; Reconcile Ledger
              </button>
            </div>
          </div>

          {/* Audit Line Items Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Item SKU &amp; Name</th>
                  <th className="py-2.5 px-3">Storage Bin</th>
                  <th className="py-2.5 px-3">Lot Number</th>
                  <th className="py-2.5 px-3 text-right">System Recorded</th>
                  <th className="py-2.5 px-3 text-right">Physical Counted</th>
                  <th className="py-2.5 px-3 text-right">Variance Qty</th>
                  <th className="py-2.5 px-3 text-right">Variance Value (₹)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentSession.items.map((item) => (
                  <tr key={item.itemSku} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-[#14213D]">{item.itemName}</div>
                      <div className="font-mono text-[10px] text-[#0F8B8D]">{item.itemSku}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono font-bold text-xs text-[#0F8B8D] px-1.5 py-0.5 bg-teal-50 rounded border border-teal-200">
                        {item.binLocation}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{item.lotNumber}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold">
                      {item.systemRecordedQty.toLocaleString()} KG
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        defaultValue={item.physicallyCountedQty}
                        onBlur={(e) => handleUpdateItemCount(item.itemSku, parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1 border border-slate-200 rounded text-right font-mono font-bold text-[#14213D] focus:ring-1 focus:ring-[#0F8B8D] outline-none"
                      />
                    </td>
                    <td className={`py-2.5 px-3 text-right font-mono font-bold ${item.varianceQty === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {item.varianceQty > 0 ? `+${item.varianceQty}` : item.varianceQty} KG
                    </td>
                    <td className={`py-2.5 px-3 text-right font-mono font-semibold ${item.varianceValueInr === 0 ? 'text-slate-700' : 'text-rose-600'}`}>
                      ₹{item.varianceValueInr.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <WarehouseStatusBadge status={item.status} size="xs" />
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                      {item.remarks || '&mdash;'}
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
