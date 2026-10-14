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
  Plus,
  X,
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
  onIssueGatePass?: (pass: GatePassRecord, deliveryId?: string) => void;
  onNavigate?: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const GatePassVerification: React.FC<GatePassVerificationProps> = ({
  gatePasses,
  deliveries,
  onApproveGateOut,
  onHoldGatePass,
  onIssueGatePass,
  onNavigate = (_view?: string, _param?: any) => {},
  showToast,
}) => {
  const [viewMode, setViewMode] = useState<'Security Gate' | 'Dispatch Desk'>('Security Gate');
  const [searchCode, setSearchCode] = useState('GP-2026-0891');
  const [selectedPassId, setSelectedPassId] = useState(gatePasses[0]?.id || gatePasses[0]?.gatePassNumber || 'GP-6001');

  // Security Checklist State
  const [vehicleMatched, setVehicleMatched] = useState(true);
  const [driverVerified, setDriverVerified] = useState(true);
  const [packageCountMatched, setPackageCountMatched] = useState(true);
  const [sealIntact, setSealIntact] = useState(true);
  const [weighBridgeVerified, setWeighBridgeVerified] = useState(true);

  // Hold reason state
  const [holdReason, setHoldReason] = useState('');
  const [showHoldModal, setShowHoldModal] = useState(false);

  // Issue Gate Pass Modal state
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [modalDeliveryId, setModalDeliveryId] = useState(deliveries[0]?.id || '');
  const [modalGate, setModalGate] = useState('Plant 1 Gate 2');
  const [modalBay, setModalBay] = useState('Bay 2 - Dispatch Deck');
  const [modalSeal, setModalSeal] = useState('SL-90812');
  const [modalDriverContact, setModalDriverContact] = useState('+91 98220 19281');

  const activePass =
    gatePasses.find((g) => (g.id || g.gatePassNumber) === selectedPassId) ||
    gatePasses[0] ||
    ({
      id: 'GP-6001',
      gatePassNumber: 'GP-6001',
      deliveryNoteNumber: 'DN-4001',
      deliveryNoteId: 'DN-4001',
      deliveryId: 'DN-4001',
      vehicleNumber: 'MH-14-GH-8821',
      driverName: 'Suresh More',
      driverPhone: '+91 98220 44192',
      driverContact: '+91 98220 44192',
      transporterName: 'VRL Logistics Ltd',
      gateNumber: 'Gate 2 (Outward Loading Bay)',
      ewbNumber: '241088910245',
      lrNumber: 'LR-VRL-99214',
      sealNumber: 'SEAL-PIM-88401',
      packageCount: 170,
      totalPackages: 170,
      grossWeightKg: 1840,
      status: 'Verified',
      securityCheckStatus: 'Cleared',
      vehiclePhotoCaptured: true,
      sealPhotoCaptured: true,
      ewbQrScanned: true,
      eInvoiceQrVerified: true,
    } as GatePassRecord);

  const handleApprove = () => {
    const pId = activePass.id || activePass.gatePassNumber;
    onApproveGateOut(pId);
    showToast(`Gate Pass ${pId} cleared for Gate-Out. Boom barrier open.`);
  };

  const handleHold = () => {
    if (!holdReason) {
      showToast('Please specify a security hold reason.');
      return;
    }
    const pId = activePass.id || activePass.gatePassNumber;
    onHoldGatePass(pId, holdReason);
    setShowHoldModal(false);
    showToast(`Vehicle ${activePass.vehicleNumber || 'Vehicle'} placed on Security Hold: ${holdReason}`);
  };

  const handleCreateNewPass = () => {
    const targetDeliv = deliveries.find((d) => d.id === modalDeliveryId) || deliveries[0];
    const passNumber = `GP-2026-0${Math.floor(100 + Math.random() * 900)}`;

    const newPass: GatePassRecord = {
      id: passNumber,
      gatePassNumber: passNumber,
      deliveryId: targetDeliv?.id || 'DN-4001',
      deliveryNumber: targetDeliv?.id || 'DN-4001',
      deliveryNoteId: targetDeliv?.id || 'DN-4001',
      salesOrderId: targetDeliv?.salesOrderId || 'SO-5001',
      customerName: targetDeliv?.customer || 'Customer Entity',
      vehicleNumber: targetDeliv?.vehicleNumber || 'MH-14-GH-8821',
      driverName: targetDeliv?.driverName || 'Driver Assigned',
      driverContact: modalDriverContact,
      driverPhone: modalDriverContact,
      transporterName: targetDeliv?.transporterName || 'Express Logistics',
      ewbNumber: targetDeliv?.ewbNumber || '241088492019',
      invoiceNumber: targetDeliv?.invoiceNumber || 'INV-2026-001',
      invoiceValue: targetDeliv?.invoiceValue || 150000,
      packageCount: targetDeliv?.packageCount || 10,
      totalPackages: targetDeliv?.packageCount || 10,
      grossWeightKg: targetDeliv?.grossWeightKg || 1250,
      tareWeightKg: targetDeliv?.tareWeightKg || 350,
      netWeightKg: targetDeliv?.netWeightKg || 900,
      gateNumber: modalGate,
      sealNumber: modalSeal,
      securityCheckStatus: 'Cleared',
      vehicleInspection: {
        physicalDamageChecked: true,
        sealIntact: true,
        sealNumber: modalSeal,
        driverLicenseVerified: true,
        weighmentMatched: true,
      },
      gateOutTimestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      securityOfficerName: 'S. Deshmukh (SEC-104)',
      notes: `Issued at ${modalGate} for ${modalBay}.`,
    };

    if (onIssueGatePass) {
      onIssueGatePass(newPass, targetDeliv?.id);
    } else {
      showToast(`Gate Pass ${passNumber} generated.`);
    }

    setSelectedPassId(passNumber);
    setShowIssueModal(false);
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

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowIssueModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Issue Gate Pass
          </button>

          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
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
                  <span className="text-xl font-bold font-mono text-[#0F8B8D]">
                    {activePass.id || activePass.gatePassNumber}
                  </span>
                  <span className="text-gray-400">&bull;</span>
                  <span className="font-mono text-base font-bold text-gray-900">
                    {activePass.vehicleNumber}
                  </span>
                  <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800">
                    {(activePass.securityCheckStatus || activePass.status || 'PENDING').toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Transporter: <strong>{activePass.transporterName || activePass.transporter || 'Self'}</strong> &bull; Gate:{' '}
                  <strong>{activePass.gateNumber || 'Gate 1'}</strong>
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
                  <div className="text-[11px] font-mono text-emerald-700">{activePass.ewbNumber || '241088492019'} (Valid 38h)</div>
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
                  <div className="text-[11px] font-mono text-emerald-700">
                    {activePass.deliveryNoteId || activePass.deliveryId || activePass.deliveryNoteNumber || 'DN-4001'}
                  </div>
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
                    <div className="text-[11px] text-gray-500 font-mono">Expected: {activePass.vehicleNumber || 'MH-14-GH-8821'}</div>
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
                    <div className="text-[11px] text-gray-500">
                      {activePass.driverName || 'Driver'} ({activePass.driverPhone || activePass.driverContact || '+91 98220 19281'})
                    </div>
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
                    <div className="text-[11px] text-gray-500">
                      Expected: {activePass.totalPackages ?? activePass.packageCount ?? 170} units
                    </div>
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
                    <div className="text-[11px] text-gray-500 font-mono">
                      Seal: {activePass.sealNumber || (activePass.vehicleInspection?.sealNumber) || 'SEAL-PIM-88401'}
                    </div>
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
                  key={gp.id || gp.gatePassNumber}
                  onClick={() => {
                    setSelectedPassId(gp.id || gp.gatePassNumber);
                    setViewMode('Security Gate');
                  }}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="p-3 font-mono font-bold text-[#0F8B8D]">{gp.id || gp.gatePassNumber}</td>
                  <td className="p-3 font-mono text-gray-900">{gp.deliveryNoteId || gp.deliveryNoteNumber}</td>
                  <td className="p-3 font-mono font-bold text-gray-900">{gp.vehicleNumber}</td>
                  <td className="p-3 text-gray-700">{gp.transporterName || gp.transporter}</td>
                  <td className="p-3 text-gray-600">{gp.driverName} ({gp.driverPhone || gp.driverMobile || 'N/A'})</td>
                  <td className="p-3 text-gray-600">
                    <div>{gp.gateNumber || 'Gate 1'}</div>
                    <div className="font-mono text-[10px] text-gray-400">Seal: {gp.sealNumber}</div>
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        (gp.securityCheckStatus || gp.status) === 'Cleared' || (gp.securityCheckStatus || gp.status) === 'Verified'
                          ? 'bg-emerald-100 text-emerald-800'
                          : (gp.securityCheckStatus || gp.status) === 'Security Hold'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {gp.securityCheckStatus || gp.status || 'Pending'}
                    </span>
                  </td>
                  <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        setSelectedPassId(gp.id || gp.gatePassNumber);
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

      {/* Issue Gate Pass Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Issue Security Gate Pass</h3>
                  <p className="text-[11px] text-gray-500">Generate outward gate pass for dispatch vehicle</p>
                </div>
              </div>
              <button
                onClick={() => setShowIssueModal(false)}
                className="text-gray-400 hover:text-gray-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Select Delivery Challan</label>
                <select
                  value={modalDeliveryId}
                  onChange={(e) => setModalDeliveryId(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                >
                  {deliveries.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.id} &bull; {d.customer} &bull; {d.vehicleNumber} ({d.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Security Gate</label>
                  <select
                    value={modalGate}
                    onChange={(e) => setModalGate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                  >
                    <option value="Plant 1 Gate 1">Plant 1 Gate 1 (Main Entrance)</option>
                    <option value="Plant 1 Gate 2">Plant 1 Gate 2 (Heavy Dispatch)</option>
                    <option value="Plant 2 Gate 1">Plant 2 Gate 1 (FMCG Dock)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Loading Bay</label>
                  <select
                    value={modalBay}
                    onChange={(e) => setModalBay(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                  >
                    <option value="Bay 1 - FMCG Pallet Dock">Bay 1 - FMCG Pallet Dock</option>
                    <option value="Bay 2 - Automotive Dock">Bay 2 - Automotive Dock</option>
                    <option value="Bay 3 - Chemical & Bulk">Bay 3 - Chemical & Bulk</option>
                    <option value="Bay 4 - Export Dock">Bay 4 - Export Dock</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Security Seal #</label>
                  <input
                    type="text"
                    value={modalSeal}
                    onChange={(e) => setModalSeal(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg font-mono text-xs"
                    placeholder="SL-90812"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Driver Phone #</label>
                  <input
                    type="text"
                    value={modalDriverContact}
                    onChange={(e) => setModalDriverContact(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg font-mono text-xs"
                    placeholder="+91 98220 19281"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setShowIssueModal(false)}
                className="px-3 py-1.5 border border-gray-300 rounded text-gray-700 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewPass}
                className="px-4 py-2 bg-[#14213D] hover:bg-[#1f335e] text-white rounded-lg font-bold flex items-center gap-1.5 shadow-sm"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Issue Gate Pass
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
