import React, { useState } from 'react';
import {
  Truck,
  FileCheck,
  FileText,
  ShieldCheck,
  Clock,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Plus,
  RefreshCw,
  Eye,
  Building2,
  Package,
  MapPin,
  ExternalLink,
  ChevronRight,
  AlertOctagon,
  UploadCloud,
  FileSpreadsheet,
  X,
} from 'lucide-react';
import {
  DeliveryNoteChallan,
  EInvoiceRecord,
  EWayBillRecord,
  GatePassRecord,
  ComplianceExceptionRecord,
} from '../../types/salesOrderDeliveryTypes';

interface DispatchDashboardProps {
  deliveries?: DeliveryNoteChallan[];
  eInvoices?: EInvoiceRecord[];
  eWayBills?: EWayBillRecord[];
  gatePasses?: GatePassRecord[];
  exceptions?: ComplianceExceptionRecord[];
  onNavigate?: (view: string, param?: any) => void;
  onIssueGatePass?: (pass: GatePassRecord, deliveryId?: string) => void;
  showToast?: (msg: string) => void;
}

export const DispatchDashboard: React.FC<DispatchDashboardProps> = ({
  deliveries = [],
  eInvoices = [],
  eWayBills = [],
  gatePasses = [],
  exceptions = [],
  onNavigate = (_view?: string, _param?: any) => {},
  onIssueGatePass,
  showToast = (_msg?: string) => {},
}) => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [isIssuePassModalOpen, setIsIssuePassModalOpen] = useState(false);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string>('');
  const [selectedGate, setSelectedGate] = useState('Plant 1 Gate 2');
  const [bayNumber, setBayNumber] = useState('Bay 2 - Dispatch Deck');
  const [sealNumber, setSealNumber] = useState('SL-90812');
  const [driverContact, setDriverContact] = useState('+91 98220 19281');

  const safeDeliveries = deliveries || [];
  const safeEInvoices = eInvoices || [];
  const safeEWayBills = eWayBills || [];
  const safeGatePasses = gatePasses || [];
  const safeExceptions = exceptions || [];

  // Selected delivery for gate pass modal
  const targetDelivery = safeDeliveries.find((d) => d.id === selectedDeliveryId) || safeDeliveries[0];

  const handleCreateAndIssueGatePass = () => {
    if (!targetDelivery) {
      showToast('Please select a delivery challan first.');
      return;
    }

    const passNumber = `GP-2026-0${Math.floor(100 + Math.random() * 900)}`;
    const newPass: GatePassRecord = {
      id: passNumber,
      gatePassNumber: passNumber,
      deliveryId: targetDelivery.id,
      deliveryNumber: targetDelivery.id,
      salesOrderId: targetDelivery.salesOrderId,
      customerName: targetDelivery.customer,
      vehicleNumber: targetDelivery.vehicleNumber,
      driverName: targetDelivery.driverName || 'Driver Assigned',
      driverContact: driverContact || targetDelivery.driverContact || '+91 98220 19281',
      transporterName: targetDelivery.transporterName,
      ewbNumber: targetDelivery.ewbNumber,
      invoiceNumber: targetDelivery.invoiceNumber,
      invoiceValue: targetDelivery.invoiceValue,
      packageCount: targetDelivery.packageCount || 10,
      grossWeightKg: targetDelivery.grossWeightKg || 1250,
      tareWeightKg: targetDelivery.tareWeightKg || 350,
      netWeightKg: targetDelivery.netWeightKg || 900,
      securityCheckStatus: 'Cleared',
      vehicleInspection: {
        physicalDamageChecked: true,
        sealIntact: true,
        sealNumber: sealNumber,
        driverLicenseVerified: true,
        weighmentMatched: true,
      },
      gateOutTimestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      securityOfficerName: 'S. Deshmukh (SEC-104)',
      notes: `Gate pass issued from dispatch desk for bay ${bayNumber}.`,
    };

    if (onIssueGatePass) {
      onIssueGatePass(newPass, targetDelivery.id);
    } else {
      showToast(`Gate Pass ${passNumber} generated successfully!`);
    }

    setIsIssuePassModalOpen(false);
  };

  // Metrics
  const todayDispatches = safeDeliveries.length;
  const todayValue = safeDeliveries.reduce((sum, d) => sum + d.invoiceValue, 0);
  const pendingDispatches = safeDeliveries.filter((d) => ['Draft', 'Packaged', 'Challan Generated'].includes(d.status)).length;
  const inTransitCount = safeDeliveries.filter((d) => d.status === 'In-Transit').length;
  const activeEwbs = safeEWayBills.filter((e) => e.status === 'Active').length;
  const expiringEwbs = safeEWayBills.filter((e) => e.validityHoursRemaining <= 4).length;
  const eInvoiceSuccess = safeEInvoices.filter((i) => i.status === 'Generated').length;
  const openGatePasses = safeGatePasses.filter((g) => g.securityCheckStatus === 'Cleared').length;
  const activeAlerts = safeExceptions.filter((x) => x.status === 'Open').length;

  // 9-stage pipeline breakdown
  const stages = [
    { title: '1. Confirmed', count: 4, val: '₹14.2L', color: 'border-blue-300 bg-blue-50/50' },
    { title: '2. Allocated', count: 3, val: '₹9.8L', color: 'border-cyan-300 bg-cyan-50/50' },
    { title: '3. Picked & Packed', count: 2, val: '₹6.4L', color: 'border-indigo-300 bg-indigo-50/50' },
    { title: '4. Challan Made', count: safeDeliveries.filter((d) => d.status === 'Challan Generated').length, val: '₹8.4L', color: 'border-teal-300 bg-teal-50/50' },
    { title: '5. E-Inv & EWB', count: safeDeliveries.filter((d) => d.status === 'E-Invoiced').length, val: '₹7.9L', color: 'border-purple-300 bg-purple-50/50' },
    { title: '6. Gate Pass', count: safeDeliveries.filter((d) => d.status === 'Gate Pass Issued').length, val: '₹3.9L', color: 'border-amber-300 bg-amber-50/50' },
    { title: '7. Gate Out', count: 1, val: '₹3.9L', color: 'border-emerald-300 bg-emerald-50/50' },
    { title: '8. In-Transit', count: inTransitCount, val: '₹7.5L', color: 'border-emerald-400 bg-emerald-50' },
    { title: '9. POD Received', count: 1, val: '₹3.6L', color: 'border-emerald-500 bg-emerald-100/50' },
  ];

  return (
    <div className="space-y-5">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-[#0F8B8D]/10 text-[#0F8B8D]">
              <Truck className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-gray-900 font-['Space_Grotesk']">
              Deliveries & Dispatch Control Center
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Integrated Indian ERP logistics with live E-Way Bill countdowns, IRN E-Invoicing, and Security Gate Passes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('createChallan')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Delivery Note
          </button>
          <button
            onClick={() => setIsIssuePassModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#14213D] hover:bg-[#1f335e] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Issue Gate Pass
          </button>
        </div>
      </div>

      {/* 8 Core Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-gray-500">Today Dispatches</div>
          <div className="text-base font-bold text-gray-900 mt-1">{todayDispatches} Shipments</div>
          <div className="text-[10px] text-emerald-600 font-semibold">₹{(todayValue / 100000).toFixed(1)}L total</div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-gray-500">Pending Staging</div>
          <div className="text-base font-bold text-amber-700 mt-1">{pendingDispatches} Loads</div>
          <div className="text-[10px] text-gray-400">Loading bay assigned</div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-gray-500">In-Transit</div>
          <div className="text-base font-bold text-blue-700 mt-1">{inTransitCount} Vehicles</div>
          <div className="text-[10px] text-gray-400">GPS tracked en route</div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-gray-500">POD Confirmed</div>
          <div className="text-base font-bold text-emerald-700 mt-1">1 Delivered</div>
          <div className="text-[10px] text-emerald-600">Signed copy archived</div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-gray-500">EWB Active</div>
          <div className="text-base font-bold text-gray-900 mt-1">{activeEwbs} Ported</div>
          <div className="text-[10px] text-red-600 font-bold">{expiringEwbs} Expiring &lt;4h</div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-gray-500">E-Invoices</div>
          <div className="text-base font-bold text-purple-700 mt-1">{eInvoiceSuccess} Validated</div>
          <div className="text-[10px] text-purple-600 font-semibold">NIC QR generated</div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-gray-500">Gate Passes</div>
          <div className="text-base font-bold text-emerald-700 mt-1">{openGatePasses} Cleared</div>
          <div className="text-[10px] text-gray-400">Plant Gate 1 & 2</div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-red-200 bg-red-50/40 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-red-700">Critical Alerts</div>
          <div className="text-base font-bold text-red-700 mt-1">{activeAlerts} Issues</div>
          <div className="text-[10px] text-red-600 font-semibold">EWB / HSN exceptions</div>
        </div>
      </div>

      {/* Real-Time Dispatch Pipeline (Horizontal Swimlane) */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b pb-2">
          <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
            Live Dispatch Pipeline & SLA Stage Tracking
          </h2>
          <span className="text-[11px] text-gray-500">Click a stage to filter active delivery items</span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
          {stages.map((stage, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer hover:shadow-2xs ${stage.color}`}
            >
              <div className="text-[10px] font-bold text-gray-700 truncate">{stage.title}</div>
              <div className="text-sm font-bold text-gray-900 mt-1">{stage.count}</div>
              <div className="text-[10px] text-gray-500">{stage.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Action Bar (Compliance & Security) */}
      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-wrap items-center gap-2 text-xs">
        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mr-2">Quick Actions:</span>
        <button
          onClick={() => onNavigate('createChallan')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-semibold transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-[#0F8B8D]" /> New Delivery Note
        </button>
        <button
          onClick={() => setIsIssuePassModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg font-semibold transition-colors cursor-pointer"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Issue Gate Pass
        </button>
        <button
          onClick={() => onNavigate('gatePass')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-semibold transition-colors cursor-pointer"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Gate Security Check
        </button>
        <button
          onClick={() => onNavigate('eWayBillMgmt')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-semibold transition-colors cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5 text-amber-600" /> Generate E-Way Bill
        </button>
        <button
          onClick={() => onNavigate('eInvoiceMgmt')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-semibold transition-colors cursor-pointer"
        >
          <FileCheck className="w-3.5 h-3.5 text-indigo-600" /> Generate E-Invoice
        </button>
        <button
          onClick={() => onNavigate('exceptions')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 rounded-lg font-semibold transition-colors cursor-pointer"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-red-600" /> Compliance Exceptions ({activeAlerts})
        </button>
      </div>

      {/* Two Column Section: E-Way Bill Expiry Watchlist & Live Vehicle Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* EWB Expiry Watchlist */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3 text-xs">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-red-600" />
              E-Way Bill Validity Expiry Watchlist (&lt; 4 Hours)
            </h3>
            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
              High Priority
            </span>
          </div>

          <div className="space-y-2.5">
            {eWayBills.map((ewb) => {
              const isUrgent = ewb.validityHoursRemaining <= 4;
              return (
                <div
                  key={ewb.ewbNumber}
                  className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                    isUrgent ? 'border-red-300 bg-red-50/40' : 'border-gray-200 bg-gray-50/50'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-gray-900">{ewb.ewbNumber}</span>
                      <span className="font-mono text-[11px] text-gray-600">Veh: {ewb.vehicleNumber}</span>
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      Customer: {ewb.recipientGstin} &bull; Transporter: {ewb.transporterName}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-[10px] text-gray-500">Remaining</div>
                      <div className={`font-mono font-bold ${isUrgent ? 'text-red-700' : 'text-emerald-700'}`}>
                        {ewb.validityHoursRemaining}h remaining
                      </div>
                    </div>
                    <button
                      onClick={() => onNavigate('eWayBillMgmt', { ewbNumber: ewb.ewbNumber })}
                      className="px-2.5 py-1 bg-white border border-gray-300 hover:bg-gray-50 rounded font-semibold text-[11px] text-gray-700"
                    >
                      Extend
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Active Vehicle Tracker & Loading Bays */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3 text-xs">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-emerald-600" />
              Active Vehicle & Dispatch Bay Tracker
            </h3>
            <span className="text-[10px] text-gray-400">Plant 1 & 2 Docks</span>
          </div>

          <div className="space-y-2.5">
            {[
              {
                veh: 'MH-14-GH-8821',
                transporter: 'VRL Logistics Ltd',
                driver: 'Suresh Patil (9822019281)',
                bay: 'Bay 3 - Automotive Dock',
                status: 'Security Checked (Gate Out)',
                statusColor: 'bg-emerald-100 text-emerald-800',
              },
              {
                veh: 'MH-12-PQ-4412',
                transporter: 'Gati-KWE Logistics',
                driver: 'Anil Jadhav (9764512390)',
                bay: 'Bay 1 - FMCG Pallet Dock',
                status: 'Gross Weight Verification',
                statusColor: 'bg-amber-100 text-amber-800',
              },
              {
                veh: 'MH-43-BB-9011',
                transporter: 'Safexpress Private Ltd',
                driver: 'Rajesh Shinde (9823901928)',
                bay: 'Bay 4 - Export Dock',
                status: 'Loading in Progress',
                statusColor: 'bg-blue-100 text-blue-800',
              },
            ].map((v, i) => (
              <div key={i} className="p-3 rounded-lg border border-gray-200 bg-gray-50/50 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-gray-900">{v.veh}</span>
                    <span className="text-gray-500 text-[11px]">&bull; {v.transporter}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${v.statusColor}`}>
                    {v.status}
                  </span>
                </div>
                <div className="text-[11px] text-gray-600 flex justify-between">
                  <span>Driver: {v.driver}</span>
                  <span className="font-semibold text-gray-800">{v.bay}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live Dispatch Feed */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3 text-xs">
        <h3 className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">
          Live Dispatch & Security Audit Feed
        </h3>

        <div className="space-y-2">
          {[
            {
              time: '11:42 AM',
              text: 'Vehicle MH-14-GH-8821 cleared Gate 1 with DN-4001, Gate Pass GP-2026-0891, and EWB 241088492019.',
              type: 'success',
            },
            {
              time: '11:15 AM',
              text: 'IRN generated on NIC Portal for INV-2026-09-001 (DN-4001). Signed QR code affixed.',
              type: 'info',
            },
            {
              time: '10:30 AM',
              text: 'Weight Bridge Gross Check passed: Tare 4,200 Kg, Gross 5,650 Kg. Net 1,450 Kg matches packing slip.',
              type: 'success',
            },
            {
              time: '09:40 AM',
              text: 'Compliance Warning: E-Way Bill 241099881122 expiring within 3 hours for delivery to Manesar.',
              type: 'warning',
            },
          ].map((feed, idx) => (
            <div key={idx} className="flex items-start gap-3 p-2 rounded-lg bg-gray-50/70 border border-gray-100">
              <span className="font-mono text-[11px] text-gray-400 shrink-0">{feed.time}</span>
              <span className="text-gray-700">{feed.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ISSUE GATE PASS INTERACTIVE MODAL */}
      {isIssuePassModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-[#14213D] text-white">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm">Issue Security Gate Pass (Outward)</h3>
                  <p className="text-[11px] text-gray-300">Security clearance authorization for vehicle gate exit</p>
                </div>
              </div>
              <button
                onClick={() => setIsIssuePassModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              {/* Delivery Challan Selection */}
              <div>
                <label className="font-bold text-gray-700 block mb-1 text-[11px] uppercase tracking-wider">
                  Select Delivery Note / Challan
                </label>
                <select
                  value={selectedDeliveryId || targetDelivery?.id}
                  onChange={(e) => setSelectedDeliveryId(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg font-semibold text-gray-900 focus:ring-2 focus:ring-[#0F8B8D] focus:outline-hidden"
                >
                  {safeDeliveries.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.id} &bull; {d.customer} &bull; Veh: {d.vehicleNumber} ({d.status})
                    </option>
                  ))}
                </select>
              </div>

              {targetDelivery && (
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-blue-950 text-sm">{targetDelivery.id}</span>
                    <span className="font-bold text-blue-800 text-[11px]">₹{(targetDelivery.invoiceValue || 0).toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-gray-700 text-[11px]">
                    <div>Customer: <strong className="text-gray-900 block truncate">{targetDelivery.customer}</strong></div>
                    <div>Vehicle: <strong className="font-mono text-gray-900 block">{targetDelivery.vehicleNumber}</strong></div>
                    <div>Transporter: <strong className="text-gray-900 block truncate">{targetDelivery.transporterName}</strong></div>
                    <div>E-Way Bill: <strong className="font-mono text-emerald-700 block">{targetDelivery.ewbNumber || 'Generated'}</strong></div>
                  </div>
                </div>
              )}

              {/* Gate & Bay Configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Exit Security Gate</label>
                  <select
                    value={selectedGate}
                    onChange={(e) => setSelectedGate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                  >
                    <option value="Plant 1 Gate 1">Plant 1 Gate 1 (Main Entrance)</option>
                    <option value="Plant 1 Gate 2">Plant 1 Gate 2 (Heavy Dispatch)</option>
                    <option value="Plant 2 Gate 1">Plant 2 Gate 1 (FMCG Dock)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Loading Bay / Deck</label>
                  <select
                    value={bayNumber}
                    onChange={(e) => setBayNumber(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                  >
                    <option value="Bay 1 - FMCG Pallet Dock">Bay 1 - FMCG Pallet Dock</option>
                    <option value="Bay 2 - Automotive Dock">Bay 2 - Automotive Dock</option>
                    <option value="Bay 3 - Chemical & Bulk">Bay 3 - Chemical & Bulk</option>
                    <option value="Bay 4 - Export Dock">Bay 4 - Export Dock</option>
                  </select>
                </div>
              </div>

              {/* Security Seal & Driver Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Container / Truck Seal #</label>
                  <input
                    type="text"
                    value={sealNumber}
                    onChange={(e) => setSealNumber(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg font-mono text-xs"
                    placeholder="e.g. SL-90812"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Driver Contact #</label>
                  <input
                    type="text"
                    value={driverContact}
                    onChange={(e) => setDriverContact(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg font-mono text-xs"
                    placeholder="+91 98220 19281"
                  />
                </div>
              </div>

              {/* Weight verification summary */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span className="text-gray-700">Weighbridge Status:</span>
                </div>
                <div className="flex items-center gap-4 text-gray-800 font-mono">
                  <span>Tare: <strong>{targetDelivery?.tareWeightKg || 350} kg</strong></span>
                  <span>Gross: <strong>{targetDelivery?.grossWeightKg || 1250} kg</strong></span>
                  <span className="text-emerald-700 font-bold">Net: {targetDelivery?.netWeightKg || 900} kg</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <button
                onClick={() => {
                  setIsIssuePassModalOpen(false);
                  onNavigate('gatePass');
                }}
                className="text-gray-600 hover:text-gray-900 font-semibold text-xs flex items-center gap-1"
              >
                Open Gate Pass Terminal &rarr;
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsIssuePassModalOpen(false)}
                  className="px-3.5 py-1.5 border border-gray-300 hover:bg-gray-100 rounded-lg text-xs font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAndIssueGatePass}
                  className="px-4 py-2 bg-[#14213D] hover:bg-[#1f335e] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Generate & Issue Gate Pass
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
