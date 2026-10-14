import React, { useState } from 'react';
import { WorkOrder } from '../../types';
import {
  Users,
  Clock,
  ArrowRight,
  Filter,
  CheckCircle2,
  Calendar,
  Layers
} from 'lucide-react';

interface OperatorHistoryProps {
  workOrders: WorkOrder[];
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const OperatorHistoryView: React.FC<OperatorHistoryProps> = ({
  workOrders,
  onNavigate,
  showToast,
}) => {
  const [selectedShift, setSelectedShift] = useState<string>('all');

  const operatorAuditLogs = [
    {
      woId: 'WO-1188',
      item: 'Square Container 500ml',
      machine: 'IMM-250T-03',
      previousOperator: 'S. Nair (OP-209)',
      newOperator: 'Rajesh Kumar (OP-441)',
      changedBy: 'Anjali Sharma (Supervisor)',
      changeReason: 'Shift A scheduled roster start',
      timestamp: '2026-08-28 06:00',
      shift: 'Shift A',
      statusAtChange: 'In Progress'
    },
    {
      woId: 'WO-1189',
      item: 'Household Bucket 10L',
      machine: 'EXT-LINE-02',
      previousOperator: 'None',
      newOperator: 'Amit Sharma (OP-112)',
      changedBy: 'Priya Rao (Planner)',
      changeReason: 'Work order release & initial assignment',
      timestamp: '2026-08-28 06:15',
      shift: 'Shift A',
      statusAtChange: 'Released'
    },
    {
      woId: 'WO-1191',
      item: 'PET Bottle Preform',
      machine: 'BLW-01',
      previousOperator: 'Amit Sharma',
      newOperator: 'K. Iyer (OP-550)',
      changedBy: 'Anjali Sharma (Supervisor)',
      changeReason: 'Quality specialist takeover for process troubleshooting',
      timestamp: '2026-08-28 09:30',
      shift: 'Shift A',
      statusAtChange: 'Quality Hold'
    }
  ];

  const filteredLogs = selectedShift === 'all'
    ? operatorAuditLogs
    : operatorAuditLogs.filter((l) => l.shift === selectedShift);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E4E0D6] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800">
              Audit Compliance &bull; Shift Roster
            </span>
            <span className="text-[11px] text-[#6B7280]">
              Chronological Operator Assignment Timeline &bull; Full Traceability
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#14213D]">Operator Assignment &amp; Shift History</h1>
        </div>

        <select
          value={selectedShift}
          onChange={(e) => setSelectedShift(e.target.value)}
          className="p-2.5 rounded-xl border border-[#E4E0D6] bg-white font-bold text-xs text-[#14213D]"
        >
          <option value="all">All Shifts</option>
          <option value="Shift A">Shift A (06:00 - 14:00)</option>
          <option value="Shift B">Shift B (14:00 - 22:00)</option>
          <option value="Shift C">Shift C (22:00 - 06:00)</option>
        </select>
      </div>

      {/* Timeline List */}
      <div className="bg-white rounded-2xl border border-[#E4E0D6] p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-[#14213D]">Chronological Handover &amp; Assignment Events</h3>
        <div className="space-y-3">
          {filteredLogs.map((log, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-[#F6F4EF] border border-[#E4E0D6] text-xs space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#0F8B8D]">{log.woId}</span>
                  <span className="font-bold text-[#14213D]">{log.item}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#E4E0D6] text-[#4B5563] font-mono">
                    {log.machine}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-[#6B7280]">{log.timestamp}</div>
              </div>

              <div className="flex items-center gap-2 font-semibold text-[#14213D]">
                <span className="text-[#6B7280] font-normal">{log.previousOperator}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#0F8B8D]" />
                <span className="text-emerald-800 font-bold">{log.newOperator}</span>
              </div>

              <div className="text-[11px] text-[#6B7280] pt-1 border-t border-[#E4E0D6]/60 flex flex-wrap justify-between gap-2">
                <div>Changed By: <b>{log.changedBy}</b> &bull; Reason: <i>{log.changeReason}</i></div>
                <div>Status: <span className="font-bold text-[#14213D]">{log.statusAtChange}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
