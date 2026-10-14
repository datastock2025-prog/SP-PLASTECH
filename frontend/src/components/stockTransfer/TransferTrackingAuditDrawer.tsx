import React, { useState } from 'react';
import {
  QrCode,
  CheckCircle2,
  Clock,
  Truck,
  AlertTriangle,
  Layers,
  MapPin,
  Calendar,
  Building2,
  Package,
  Wrench,
  ShieldCheck,
  RotateCcw,
  FileText,
  User,
  ExternalLink,
  Printer,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  X,
} from 'lucide-react';
import {
  StockTransferRecord,
  UserRolePerspective,
} from '../../types/stockTransferTypes';

interface TransferTrackingAuditDrawerProps {
  transfer: StockTransferRecord;
  currentUserRole: UserRolePerspective;
  onClose: () => void;
  onUpdateVehicleAndExtendEwb: (transferId: string, newVehicle: string, reason: string) => void;
  showToast: (msg: string) => void;
}

export const TransferTrackingAuditDrawer: React.FC<TransferTrackingAuditDrawerProps> = ({
  transfer,
  currentUserRole,
  onClose,
  onUpdateVehicleAndExtendEwb,
  showToast,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'TIMELINE' | 'AUDIT' | 'DOCUMENTS'>('TIMELINE');

  // Edge Case 2: Vehicle Breakdown & E-Way Bill Extension Modal State
  const [showVehicleBreakdownModal, setShowVehicleBreakdownModal] = useState<boolean>(false);
  const [newVehicleNumber, setNewVehicleNumber] = useState<string>('MH-12-PQ-9944');
  const [breakdownReason, setBreakdownReason] = useState<string>('Axle failure on NH-48 highway near Shirwal toll. Transshipping cargo into replacement vehicle.');

  // Timeline Step Status Determination
  const getTimelineStatus = (stepIndex: number) => {
    // 0: Created, 1: Picked, 2: Loaded, 3: In Transit, 4: Arrived, 5: Inspected, 6: Posted
    if (transfer.status === 'Draft') return stepIndex === 0 ? 'ACTIVE' : 'PENDING';
    if (transfer.status === 'Ready for Pick') return stepIndex <= 0 ? 'COMPLETED' : stepIndex === 1 ? 'ACTIVE' : 'PENDING';
    if (transfer.status === 'Picked / Staged') return stepIndex <= 1 ? 'COMPLETED' : stepIndex === 2 ? 'ACTIVE' : 'PENDING';
    if (transfer.status === 'Dispatched / In Transit') return stepIndex <= 3 ? 'COMPLETED' : stepIndex === 4 ? 'ACTIVE' : 'PENDING';
    if (transfer.status === 'Partially Received') return stepIndex <= 5 ? 'COMPLETED' : 'PENDING';
    if (transfer.status === 'Received / Completed') return 'COMPLETED';
    return 'PENDING';
  };

  const handleConfirmBreakdownExtension = () => {
    if (!newVehicleNumber.trim()) {
      showToast('Please enter the replacement vehicle number.');
      return;
    }

    onUpdateVehicleAndExtendEwb(transfer.id, newVehicleNumber, breakdownReason);
    setShowVehicleBreakdownModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex justify-end">
      <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header with Transfer Number, QR Code & Status */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl p-1 shrink-0 flex items-center justify-center">
              <QrCode className="w-10 h-10 text-slate-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-black text-blue-400">{transfer.id}</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    transfer.status === 'Received / Completed'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : transfer.status === 'Partially Received'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  }`}
                >
                  {transfer.status}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {transfer.fromPlantName} &rarr; {transfer.toPlantName}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Edge Case 2 Banner: In-Transit Vehicle Breakdown Alert */}
        {transfer.status === 'Dispatched / In Transit' && (
          <div className="bg-amber-50 border-b border-amber-200 p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Transit Action:</strong> E-Way Bill{' '}
                <span className="font-mono">{transfer.logistics?.eWayBillNumber || 'EXEMPT'}</span> is currently active.
              </span>
            </div>
            <button
              onClick={() => setShowVehicleBreakdownModal(true)}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded text-[11px] transition-colors whitespace-nowrap shadow-2xs flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Vehicle Breakdown / Extend EWB
            </button>
          </div>
        )}

        {/* Sub-Tabs: Timeline vs Audit Matrix */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-2">
          <button
            onClick={() => setActiveSubTab('TIMELINE')}
            className={`pb-2.5 px-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
              activeSubTab === 'TIMELINE'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> 7-Stage Visual Timeline
          </button>
          <button
            onClick={() => setActiveSubTab('AUDIT')}
            className={`pb-2.5 px-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
              activeSubTab === 'AUDIT'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> "Who, When, Where" Audit Matrix
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {activeSubTab === 'TIMELINE' && (
            /* 7-Stage Visual Timeline Tracker (Screen 8) */
            <div className="space-y-6">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                End-to-End Logistical Lifecycle:
              </div>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {/* 1. Created */}
                <div className="relative">
                  <span
                    className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      getTimelineStatus(0) === 'COMPLETED'
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    ✓
                  </span>
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-900">1. Transfer Note Created</div>
                    <div className="text-[11px] text-slate-500">
                      By: <strong>{transfer.createdBy}</strong> ({transfer.createdDate} {transfer.createdTime})
                    </div>
                    <div className="text-[11px] text-slate-600 font-mono">
                      Terminal: 192.168.1.18 • Priority: {transfer.priority}
                    </div>
                  </div>
                </div>

                {/* 2. Picked & Packed */}
                <div className="relative">
                  <span
                    className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      getTimelineStatus(1) === 'COMPLETED'
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                        : getTimelineStatus(1) === 'ACTIVE'
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    2
                  </span>
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-900">2. Picked &amp; Packed at Source</div>
                    <div className="text-[11px] text-slate-500">
                      Store: <strong>{transfer.fromStoreName}</strong>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Items staged into dispatch holding bins. Lot barcoding verified.
                    </div>
                  </div>
                </div>

                {/* 3. Loaded on Vehicle */}
                <div className="relative">
                  <span
                    className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      getTimelineStatus(2) === 'COMPLETED'
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                        : getTimelineStatus(2) === 'ACTIVE'
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    3
                  </span>
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-900">3. Loaded &amp; Gate Pass Cleared</div>
                    <div className="text-[11px] text-slate-600">
                      Vehicle: <strong className="font-mono">{transfer.logistics?.vehicleNumber || 'Internal Trolley'}</strong>{' '}
                      • Gate Pass: <strong className="font-mono">{transfer.gatePassNumber}</strong>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Driver: {transfer.logistics?.driverName} ({transfer.logistics?.driverMobile})
                    </div>
                  </div>
                </div>

                {/* 4. In Transit (EWB Countdown) */}
                <div className="relative">
                  <span
                    className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      getTimelineStatus(3) === 'COMPLETED'
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                        : getTimelineStatus(3) === 'ACTIVE'
                        ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    4
                  </span>
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-900">4. In Transit (Highway Route)</div>
                    <div className="text-[11px] text-indigo-700 font-semibold">
                      E-Way Bill Valid Until:{' '}
                      <span className="font-mono text-slate-800">
                        {transfer.logistics?.eWayBillValidUntil || 'N/A (Intra-State <50KM)'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Transporter: {transfer.logistics?.transporterName} (Distance: {transfer.logistics?.distanceKm || 0} KM)
                    </div>
                  </div>
                </div>

                {/* 5. Arrived at Destination */}
                <div className="relative">
                  <span
                    className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      getTimelineStatus(4) === 'COMPLETED'
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                        : getTimelineStatus(4) === 'ACTIVE'
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    5
                  </span>
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-900">5. Arrived at Destination Gate</div>
                    <div className="text-[11px] text-slate-500">
                      Plant: <strong>{transfer.toPlantName}</strong>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Vehicle checked in at receiving weighbridge dock.
                    </div>
                  </div>
                </div>

                {/* 6. Unloaded & Inspected */}
                <div className="relative">
                  <span
                    className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      getTimelineStatus(5) === 'COMPLETED'
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                        : getTimelineStatus(5) === 'ACTIVE'
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    6
                  </span>
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-900">6. Unloaded &amp; Quality Inspected</div>
                    <div className="text-[11px] text-slate-500">
                      Store: <strong>{transfer.toStoreName}</strong>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Piece count matched against Transfer Note manifest.
                    </div>
                  </div>
                </div>

                {/* 7. Stock Posted (Final GRN) */}
                <div className="relative">
                  <span
                    className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      getTimelineStatus(6) === 'COMPLETED'
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    7
                  </span>
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-900">7. Stock Posted (Final GRN)</div>
                    <div className="text-[11px] text-slate-600">
                      GRN Number:{' '}
                      <strong className="font-mono text-emerald-700">
                        {transfer.grnNumber || 'Pending Dock Post'}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'AUDIT' && (
            /* Audit Matrix Tab ("Who, When, Where") */
            <div className="space-y-4">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Immutable System Audit Trail:
              </div>

              <div className="space-y-3">
                {transfer.auditTrail.map((log) => (
                  <div key={log.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{log.userName}</span>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-bold">
                          {log.userRole}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">{log.timestamp}</span>
                    </div>

                    <div className="text-slate-800 font-semibold">{log.action}: {log.changesMade}</div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" /> {log.location}
                      </span>
                      <span>•</span>
                      <span className="font-mono">IP: {log.deviceIp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edge Case 2: Vehicle Breakdown & E-Way Bill Extension Modal */}
      {showVehicleBreakdownModal && (
        <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border-2 border-amber-300">
            <div className="flex items-center gap-2 text-amber-800">
              <RefreshCw className="w-5 h-5 text-amber-600 animate-spin" />
              <h3 className="text-sm font-black">In-Transit Vehicle Breakdown &amp; E-Way Bill Extension</h3>
            </div>

            <p className="text-xs text-slate-600">
              Update the active vehicle details on the GST E-Way Bill portal without cancelling the primary stock transfer note.
            </p>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <div>Transfer: <strong className="font-mono text-blue-700">{transfer.id}</strong></div>
              <div>Original Vehicle: <strong className="font-mono">{transfer.logistics?.vehicleNumber}</strong></div>
              <div>Current E-Way Bill: <strong className="font-mono">{transfer.logistics?.eWayBillNumber}</strong></div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Replacement Vehicle Number <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={newVehicleNumber}
                  onChange={(e) => setNewVehicleNumber(e.target.value.toUpperCase())}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Transshipment / Breakdown Justification <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={2}
                  value={breakdownReason}
                  onChange={(e) => setBreakdownReason(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900">
                Statutory API update: The GST E-Way Bill validity will be recalculated and extended by 24 hours to account
                for highway transshipment.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowVehicleBreakdownModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBreakdownExtension}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black shadow-sm"
              >
                Update Vehicle &amp; Extend EWB
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
