import React, { useState } from 'react';
import {
  ShieldCheck,
  QrCode,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Truck,
  Scale,
  Camera,
  Search,
  Printer,
  Clock,
  UserCheck,
  FileText,
  Building2,
  Lock,
} from 'lucide-react';
import {
  GatePassRecord,
  DeliveryNoteChallan,
} from '../../types/salesOrderDeliveryTypes';

interface GatePassVerificationProps {
  gatePasses: GatePassRecord[];
  deliveries: DeliveryNoteChallan[];
  onApproveGateOut: (passId: string) => void;
  onHoldGatePass: (passId: string, reason: string) => void;
  showToast: (msg: string) => void;
}

export const GatePassVerification: React.FC<GatePassVerificationProps> = ({
  gatePasses,
  deliveries,
  onApproveGateOut,
  onHoldGatePass,
  showToast,
}) => {
  const [viewMode, setViewMode] = useState<'Security Gate' | 'Dispatch Desk'>('Security Gate');
  const [searchCode, setSearchCode] = useState('GP-2026-0891');
  const [selectedPassId, setSelectedPassId] = useState('GP-2026-0891');

  // Security Checklist State
  const [vehicleMatched, setVehicleMatched] = useState(true);
  const [driverVerified, setDriverVerified] = useState(true);
  const [packageCountMatched, setPackageCountMatched] = useState(true);
  const [sealIntact, setSealIntact] = useState(true);
  const [weighBridgeVerified, setWeighBridgeVerified] = useState(true);

  // Hold reason state
  const [holdReason, setHoldReason] = useState('');
  const [showHoldModal, setShowHoldModal] = useState(false);

  const activePass = gatePasses.find((g) => g.id === selectedPassId) || gatePasses[0];

  const handleApprove = () => {
    onApproveGateOut(activePass.id);
    showToast(`Gate Pass ${activePass.id} cleared for Gate-Out. Boom barrier open.`);
  };

  const handleHold = () => {
    if (!holdReason) {
      showToast('Please specify a security hold reason.');
      return;
    }
    onHoldGatePass(activePass.id, holdReason);
    setShowHoldModal(false);
    showToast(`Vehicle ${activePass.vehicleNumber} placed on Security Hold: ${holdReason}`);
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-[#14213D] text-white">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </span>
            <h1 className="text-xl font-bold text-gray-900 font-['Space_Grotesk']">
              Security Gate Pass & Outward Verification
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Gate checkpost scanning for E-Way Bill validity, vehicle inspection, gross weighbridge, and driver verification.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('Security Gate')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
              viewMode === 'Security Gate'
                ? 'bg-[#14213D] text-white shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Security Gate Terminal
          </button>
          <button
            onClick={() => setViewMode('Dispatch Desk')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
              viewMode === 'Dispatch Desk'
                ? 'bg-[#14213D] text-white shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Dispatch Desk Register
          </button>
        </div>
      </div>

      {/* SECURITY GATE TERMINAL VIEW */}
      {viewMode === 'Security Gate' && (
        <div className="space-y-4">
          {/* Quick Scanner Bar */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder="Scan QR or enter Gate Pass #, Vehicle #, Challan #..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0F8B8D]"
              />
            </div>
            <button
              onClick={() => showToast('Gate Camera QR scanner engaged.')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold shadow-2xs"
            >
              <Camera className="w-4 h-4 text-gray-600" /> Camera Scan
            </button>
          </div>

          {/* Active Inspection Card */}
          <div className="bg-white rounded-xl border-2 border-[#14213D]/20 shadow-md p-5 space-y-5">
            {/* Status Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold font-mono text-[#0F8B8D]">{activePass.id}</span>
                  <span className="text-gray-400">&bull;</span>
                  <span className="font-mono text-base font-bold text-gray-900">
                    {activePass.vehicleNumber}
                  </span>
                  <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800">
                    {activePass.securityCheckStatus.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Transporter: <strong>{activePass.transporterName}</strong> &bull; Gate:{' '}
                  <strong>{activePass.gateNumber}</strong>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 hover:bg-gray-50 rounded-lg text-xs font-medium text-gray-700"
                >
                  <Printer className="w-4 h-4 text-gray-500" /> Print Slip
                </button>
              </div>
            </div>

            {/* Statutory Green Checks Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-emerald-950">E-Way Bill Verified</div>
                  <div className="text-[11px] font-mono text-emerald-700">{activePass.ewbNumber} (Valid 38h)</div>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-emerald-950">NIC IRN Validated</div>
                  <div className="text-[11px] font-mono text-emerald-700">Digital QR Intact on Challan</div>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-emerald-950">Delivery Challan Linked</div>
                  <div className="text-[11px] font-mono text-emerald-700">{activePass.deliveryNoteId}</div>
                </div>
              </div>
            </div>

            {/* Physical Inspection Checklist (Interactive Security Toggles) */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Physical Security Checkpost Checklist
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* 1. Vehicle Number */}
                <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50/70 cursor-pointer">
                  <div>
                    <span className="font-semibold text-gray-900">1. Vehicle Number Plate Match</span>
                    <div className="text-[11px] text-gray-500 font-mono">Expected: {activePass.vehicleNumber}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={vehicleMatched}
                    onChange={(e) => setVehicleMatched(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-0"
                  />
                </label>

                {/* 2. Driver Identity */}
                <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50/70 cursor-pointer">
                  <div>
                    <span className="font-semibold text-gray-900">2. Driver Identity & License Check</span>
                    <div className="text-[11px] text-gray-500">{activePass.driverName} ({activePass.driverPhone})</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={driverVerified}
                    onChange={(e) => setDriverVerified(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-0"
                  />
                </label>

                {/* 3. Package Count */}
                <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50/70 cursor-pointer">
                  <div>
                    <span className="font-semibold text-gray-900">3. Physical Box / Pallet Count</span>
                    <div className="text-[11px] text-gray-500">Expected: {activePass.totalPackages} units</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={packageCountMatched}
                    onChange={(e) => setPackageCountMatched(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-0"
                  />
                </label>

                {/* 4. Container Seal */}
                <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50/70 cursor-pointer">
                  <div>
                    <span className="font-semibold text-gray-900">4. Container Security Seal Intact</span>
                    <div className="text-[11px] text-gray-500 font-mono">Seal: {activePass.sealNumber}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={sealIntact}
                    onChange={(e) => setSealIntact(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-0"
                  />
                </label>
              </div>

              {/* Weighbridge verification */}
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-gray-600" />
                  <div>
                    <span className="font-semibold text-gray-900">Weighbridge Gross Tare Check</span>
                    <div className="text-[11px] text-gray-500 font-mono">
                      Tare: 4,200 Kg &bull; Gross: 5,650 Kg &bull; Net: 1,450 Kg (Within &plusmn;0.5% tolerance)
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => showToast('Re-weigh command sent to Plant Weighbridge scale.')}
                  className="px-2.5 py-1 text-xs border border-gray-300 rounded hover:bg-white text-gray-700"
                >
                  Re-Weigh
                </button>
              </div>
            </div>

            {/* High Impact Security Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t">
              <button
                onClick={handleApprove}
                className="w-full sm:flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-[0.99]"
              >
                <CheckCircle className="w-5 h-5" /> APPROVE GATE OUT & OPEN BOOM BARRIER
              </button>
              <button
                onClick={() => setShowHoldModal(true)}
                className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm"
              >
                <XCircle className="w-5 h-5" /> HOLD VEHICLE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DISPATCH DESK REGISTER VIEW */}
      {viewMode === 'Dispatch Desk' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden text-xs">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 font-bold text-[11px] uppercase border-b border-gray-200">
              <tr>
                <th className="p-3">Gate Pass #</th>
                <th className="p-3">Delivery Challan #</th>
                <th className="p-3">Vehicle Number</th>
                <th className="p-3">Transporter</th>
                <th className="p-3">Driver Details</th>
                <th className="p-3">Gate & Seal #</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {gatePasses.map((gp) => (
                <tr
                  key={gp.id}
                  onClick={() => {
                    setSelectedPassId(gp.id);
                    setViewMode('Security Gate');
                  }}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="p-3 font-mono font-bold text-[#0F8B8D]">{gp.id}</td>
                  <td className="p-3 font-mono text-gray-900">{gp.deliveryNoteId}</td>
                  <td className="p-3 font-mono font-bold text-gray-900">{gp.vehicleNumber}</td>
                  <td className="p-3 text-gray-700">{gp.transporterName}</td>
                  <td className="p-3 text-gray-600">{gp.driverName} ({gp.driverPhone})</td>
                  <td className="p-3 text-gray-600">
                    <div>{gp.gateNumber}</div>
                    <div className="font-mono text-[10px] text-gray-400">Seal: {gp.sealNumber}</div>
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        gp.securityCheckStatus === 'Cleared'
                          ? 'bg-emerald-100 text-emerald-800'
                          : gp.securityCheckStatus === 'Security Hold'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {gp.securityCheckStatus}
                    </span>
                  </td>
                  <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        setSelectedPassId(gp.id);
                        setViewMode('Security Gate');
                      }}
                      className="text-xs font-semibold text-[#0F8B8D] hover:underline"
                    >
                      Inspect Gate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Security Hold Modal */}
      {showHoldModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl text-xs">
            <div className="flex items-center gap-2 text-red-600 font-bold text-base">
              <AlertTriangle className="w-5 h-5" /> Issue Security Hold on Vehicle
            </div>
            <p className="text-gray-600">
              Vehicle {activePass.vehicleNumber} will be prevented from departing the premises. Specify the security exception:
            </p>

            <select
              value={holdReason}
              onChange={(e) => setHoldReason(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 bg-white text-gray-900 font-medium"
            >
              <option value="">Select reason...</option>
              <option value="E-Way Bill Expired during transit staging">E-Way Bill Expired during transit staging</option>
              <option value="Package count discrepancy (Counted less than challan)">Package count discrepancy (Counted less than challan)</option>
              <option value="Security seal broken or missing">Security seal broken or missing</option>
              <option value="Vehicle number plate mismatch">Vehicle number plate mismatch</option>
              <option value="Weighbridge weight exceeds tolerance (>150kg difference)">Weighbridge weight exceeds tolerance</option>
              <option value="Finance Credit Hold override requested">Finance Credit Hold override requested</option>
            </select>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setShowHoldModal(false)}
                className="px-3 py-1.5 border border-gray-300 rounded text-gray-700 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleHold}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded font-bold"
              >
                Confirm Hold
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
