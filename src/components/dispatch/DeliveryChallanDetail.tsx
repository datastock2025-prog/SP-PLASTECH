import React, { useState } from 'react';
import {
  ArrowLeft,
  Truck,
  FileCheck,
  FileText,
  ShieldCheck,
  Printer,
  Download,
  Clock,
  CheckCircle,
  AlertTriangle,
  QrCode,
  Eye,
  Building2,
  Package,
  Calendar,
  Phone,
  User,
  UploadCloud,
  Layers,
} from 'lucide-react';
import {
  DeliveryNoteChallan,
  EInvoiceRecord,
  EWayBillRecord,
  GatePassRecord,
} from '../../types/salesOrderDeliveryTypes';

interface DeliveryChallanDetailProps {
  delivery: DeliveryNoteChallan;
  onBack: () => void;
  onNavigate: (view: string, param?: any) => void;
  showToast: (msg: string) => void;
}

export const DeliveryChallanDetail: React.FC<DeliveryChallanDetailProps> = ({
  delivery,
  onBack,
  onNavigate,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [showJson, setShowJson] = useState(false);

  const tabs = [
    'Overview',
    'Dispatched Items',
    'E-Invoice',
    'E-Way Bill',
    'Gate Pass',
    'POD & Delivery Tracking',
    'Documents',
    'Audit Trail',
  ];

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[#0F8B8D]">{delivery.id}</span>
            <span className="text-xs text-gray-400">&bull;</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-800">
              {delivery.type}
            </span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded ${
                delivery.status === 'In-Transit'
                  ? 'bg-blue-100 text-blue-800'
                  : delivery.status === 'Delivered'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {delivery.status}
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 font-['Space_Grotesk'] mt-0.5">
            {delivery.customer}
          </h1>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('gatePass', { deliveryId: delivery.id })}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#14213D] hover:bg-[#1f335e] text-white rounded-lg text-xs font-semibold shadow-2xs"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Security Gate Pass
          </button>
          <button
            onClick={() => onNavigate('eInvoiceMgmt')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold"
          >
            <FileCheck className="w-3.5 h-3.5 text-purple-600" /> IRP Portal
          </button>
          <button
            onClick={() => onNavigate('eWayBillMgmt')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold"
          >
            <FileText className="w-3.5 h-3.5 text-amber-600" /> EWB Portal
          </button>
          <button
            onClick={() => {
              showToast('Signed Proof of Delivery (POD) upload modal initiated.');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold"
          >
            <UploadCloud className="w-3.5 h-3.5 text-blue-600" /> Upload POD
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-medium"
          >
            <Printer className="w-3.5 h-3.5 text-gray-500" /> Print Challan
          </button>
          <button
            onClick={() => showToast(`Exported all compliance PDFs for ${delivery.id} as a ZIP bundle.`)}
            className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-medium"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" /> Download ZIP
          </button>
        </div>
      </div>

      {/* 8 Tab Navigation */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-1 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-[#14213D] text-white shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Dispatch & Facility */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
            <h3 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] border-b pb-2">
              1. Delivery & Order Reference
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-gray-400">Sales Order Ref:</span>
                <div className="font-mono font-bold text-[#0F8B8D]">{delivery.salesOrderId}</div>
              </div>
              <div>
                <span className="text-gray-400">Dispatch Date:</span>
                <div className="font-semibold text-gray-900">{delivery.date}</div>
              </div>
              <div>
                <span className="text-gray-400">Customer Legal Entity:</span>
                <div className="font-semibold text-gray-900">{delivery.customer}</div>
              </div>
              <div>
                <span className="text-gray-400">Customer GSTIN:</span>
                <div className="font-mono font-semibold text-gray-900">{delivery.customerGstin}</div>
              </div>
              <div>
                <span className="text-gray-400">Plant of Origin:</span>
                <div className="text-gray-900 font-semibold">{delivery.plant}</div>
              </div>
              <div>
                <span className="text-gray-400">Origin Store:</span>
                <div className="text-gray-900 font-semibold">{delivery.fgStore}</div>
              </div>
            </div>
          </div>

          {/* Transport & Vehicle */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
            <h3 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] border-b pb-2">
              2. Vehicle & Transporter Logistics
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-gray-400">Vehicle Number:</span>
                <div className="font-mono font-bold text-gray-900">{delivery.vehicleNumber}</div>
              </div>
              <div>
                <span className="text-gray-400">Transporter:</span>
                <div className="font-semibold text-gray-900">{delivery.transporterName}</div>
              </div>
              <div>
                <span className="text-gray-400">Driver Details:</span>
                <div className="text-gray-900">{delivery.driverName} ({delivery.driverPhone})</div>
              </div>
              <div>
                <span className="text-gray-400">LR / Bilty #:</span>
                <div className="font-mono font-bold text-gray-900">{delivery.lrNumber}</div>
              </div>
              <div>
                <span className="text-gray-400">Distance:</span>
                <div className="font-bold text-gray-900">{delivery.approxDistanceKm} KM</div>
              </div>
              <div>
                <span className="text-gray-400">Gate Pass:</span>
                <div className="font-mono font-bold text-emerald-700">{delivery.gatePassNumber || 'Pending'}</div>
              </div>
            </div>
          </div>

          {/* Packaging & Weight */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
            <h3 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] border-b pb-2">
              3. Weight Bridge & Packaging Specifications
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gray-50 p-2 rounded-lg">
                <span className="text-gray-500">Gross Weight:</span>
                <div className="font-mono font-bold text-gray-900 text-sm mt-0.5">{delivery.grossWeightKg} Kg</div>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg">
                <span className="text-gray-500">Tare Weight:</span>
                <div className="font-mono font-bold text-gray-900 text-sm mt-0.5">{delivery.tareWeightKg} Kg</div>
              </div>
              <div className="bg-emerald-50 p-2 rounded-lg text-emerald-900">
                <span className="text-emerald-700">Net Weight:</span>
                <div className="font-mono font-bold text-sm mt-0.5">{delivery.netWeightKg} Kg</div>
              </div>
            </div>
            <div className="border-t pt-2">
              <span className="text-gray-400">Packaging Protocol:</span>
              <div className="text-gray-800 mt-0.5">{delivery.packagingType} ({delivery.packageCount} units)</div>
            </div>
          </div>

          {/* Financial & Invoicing */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
            <h3 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] border-b pb-2">
              4. Commercial Valuation & Tax Schedule
            </h3>
            <div className="space-y-1">
              <div className="flex justify-between text-gray-600">
                <span>Taxable Amount:</span>
                <span className="font-mono font-semibold text-gray-900">₹{delivery.taxableAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>CGST (9%):</span>
                <span className="font-mono font-semibold text-gray-900">₹{delivery.cgstTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>SGST (9%):</span>
                <span className="font-mono font-semibold text-gray-900">₹{delivery.sgstTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>IGST (18%):</span>
                <span className="font-mono font-semibold text-gray-900">₹{delivery.igstTotal.toLocaleString()}</span>
              </div>
              <div className="border-t pt-1.5 flex justify-between font-bold text-sm text-[#14213D]">
                <span>Total Invoice Value:</span>
                <span className="font-mono">₹{delivery.invoiceValue.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DISPATCHED ITEMS */}
      {activeTab === 'Dispatched Items' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden text-xs">
          <table className="w-full text-left">
            <thead className="bg-gray-100 text-gray-600 font-bold text-[11px] uppercase">
              <tr>
                <th className="p-2.5">Line #</th>
                <th className="p-2.5">Item Code & Name</th>
                <th className="p-2.5">HSN</th>
                <th className="p-2.5 text-right">Dispatched Qty</th>
                <th className="p-2.5">Allocated Batch & Bin</th>
                <th className="p-2.5">COA Cert #</th>
                <th className="p-2.5 text-right">Rate</th>
                <th className="p-2.5 text-right">Taxable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {delivery.items.map((it) => (
                <tr key={it.lineNumber} className="hover:bg-gray-50">
                  <td className="p-2.5 font-mono text-gray-500">{it.lineNumber}</td>
                  <td className="p-2.5 font-semibold text-gray-900">{it.itemName}</td>
                  <td className="p-2.5 font-mono text-gray-600">{it.hsn}</td>
                  <td className="p-2.5 text-right font-bold text-gray-900">{it.dispatchedQty.toLocaleString()} {it.uom}</td>
                  <td className="p-2.5 font-mono text-[11px]">
                    {it.allocatedBatches.map((b) => `${b.batchNumber} (${b.allocatedQty})`).join(', ')}
                  </td>
                  <td className="p-2.5 font-mono text-emerald-700 font-semibold">{it.coaNumber}</td>
                  <td className="p-2.5 text-right font-mono">₹{it.unitPrice}</td>
                  <td className="p-2.5 text-right font-mono font-bold text-gray-900">₹{it.taxableValue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: E-INVOICE */}
      {activeTab === 'E-Invoice' && (
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">National E-Invoice IRP Synchronization</h3>
              <p className="text-xs text-gray-500">Unique 64-character IRN and NIC signed QR code.</p>
            </div>
            <button
              onClick={() => setShowJson(!showJson)}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-800 font-semibold"
            >
              {showJson ? 'Hide Signed JSON' : 'View Signed JSON'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
              <div className="font-bold text-gray-800 uppercase text-[11px]">IRP Validation Certificate</div>
              <div>
                <span className="text-gray-400">IRN:</span>
                <div className="font-mono text-[11px] font-bold text-gray-900 break-all mt-0.5">
                  {delivery.irn || 'b78a994c1f9302194857dc820a45719bc40192e472093849102830fca1029148'}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div>
                  <span className="text-gray-400">Ack No:</span>
                  <div className="font-mono font-semibold text-gray-900">{delivery.ackNo || '112026090014521'}</div>
                </div>
                <div>
                  <span className="text-gray-400">Ack Date:</span>
                  <div className="text-gray-900">{delivery.ackDate || '2026-09-12 11:15:00'}</div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col items-center justify-center text-center">
              <QrCode className="w-20 h-20 text-gray-900" />
              <div className="text-[11px] font-bold text-gray-800 mt-2">NIC Digitally Signed QR Code</div>
              <div className="text-[10px] text-gray-500">Scanned by GST Mobile App & Checkposts</div>
            </div>
          </div>

          {showJson && (
            <div className="p-3 bg-gray-900 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-48">
              {JSON.stringify(
                {
                  Version: '1.1',
                  TranDtls: { TaxSch: 'GST', SupTyp: 'B2B' },
                  DocDtls: { Typ: 'INV', No: delivery.invoiceNumber, Dt: delivery.invoiceDate },
                  BuyerDtls: { Gstin: delivery.customerGstin, LglNm: delivery.customer },
                  ValDtls: { TotInvVal: delivery.invoiceValue },
                },
                null,
                2
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: E-WAY BILL */}
      {activeTab === 'E-Way Bill' && (
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">E-Way Bill Transit Pass</h3>
              <p className="text-xs text-gray-500">Government transit document under GST Rule 138.</p>
            </div>
            <button
              onClick={() => onNavigate('eWayBillMgmt', { ewbNumber: delivery.ewbNumber })}
              className="px-3 py-1.5 bg-[#0F8B8D] text-white rounded font-semibold"
            >
              Open EWB Hub
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900">
              <div className="text-[10px] uppercase font-bold text-emerald-700">EWB Number</div>
              <div className="text-base font-bold font-mono mt-0.5">{delivery.ewbNumber || '241088492019'}</div>
              <div className="text-[10px] text-emerald-700 mt-1">Part A & Part B Complete</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-[10px] uppercase font-bold text-gray-500">Valid Until</div>
              <div className="text-base font-bold text-gray-900 mt-0.5">{delivery.ewbValidUntil || '2026-09-14 23:59:59'}</div>
              <div className="text-[10px] text-emerald-700 mt-1 font-semibold">38h validity remaining</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-[10px] uppercase font-bold text-gray-500">Assigned Vehicle</div>
              <div className="text-base font-bold font-mono text-gray-900 mt-0.5">{delivery.vehicleNumber}</div>
              <div className="text-[10px] text-gray-500 mt-1">Transporter: {delivery.transporterName}</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: GATE PASS */}
      {activeTab === 'Gate Pass' && (
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Security Gate Pass & Outward Verification</h3>
              <p className="text-xs text-gray-500">Gate security clearance and vehicle dispatch stamp.</p>
            </div>
            <button
              onClick={() => onNavigate('gatePass', { deliveryId: delivery.id })}
              className="px-3 py-1.5 bg-[#14213D] text-white rounded font-semibold"
            >
              Verify at Gate
            </button>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-base text-emerald-700">
                {delivery.gatePassNumber || 'GP-2026-0891'}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                SECURITY CLEARED
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-gray-600">
              <div>Gate: <strong className="text-gray-900">Plant 1 Gate 2</strong></div>
              <div>Driver: <strong className="text-gray-900">{delivery.driverName}</strong></div>
              <div>Security Officer: <strong className="text-gray-900">S. Deshmukh (SEC-104)</strong></div>
              <div>Gate Out: <strong className="text-emerald-700">2026-09-12 11:42</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: POD & DELIVERY TRACKING */}
      {activeTab === 'POD & Delivery Tracking' && (
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Proof of Delivery (POD) & Transit Milestone</h3>
              <p className="text-xs text-gray-500">Consignee physical receiving signature and goods condition report.</p>
            </div>
            <button
              onClick={() => showToast('Signed POD copy uploaded to repository.')}
              className="px-3 py-1.5 bg-[#0F8B8D] text-white rounded font-semibold flex items-center gap-1.5"
            >
              <UploadCloud className="w-3.5 h-3.5" /> Upload Signed Copy
            </button>
          </div>

          <div className="p-6 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-center space-y-2">
            <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
            <div className="font-bold text-gray-900 text-sm">Proof of Delivery Pending Consignee Stamping</div>
            <p className="text-gray-500 text-xs max-w-md mx-auto">
              Vehicle {delivery.vehicleNumber} is currently in transit to {delivery.customer}. Stamped and signed delivery challan can be uploaded upon vehicle return.
            </p>
          </div>
        </div>
      )}

      {/* TAB 7: DOCUMENTS */}
      {activeTab === 'Documents' && (
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4 text-xs">
          <h3 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] border-b pb-2">
            Dispatched Document Package
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { name: `Delivery Challan (${delivery.id})`, size: '280 KB' },
              { name: `Commercial Invoice (${delivery.invoiceNumber})`, size: '410 KB' },
              { name: `E-Way Bill (241088492019)`, size: '140 KB' },
              { name: `Security Gate Pass (${delivery.gatePassNumber})`, size: '190 KB' },
              { name: `COA Certificate Batch B-2026`, size: '520 KB' },
            ].map((doc, idx) => (
              <div key={idx} className="p-3 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div className="truncate max-w-[150px] font-semibold text-gray-900">{doc.name}</div>
                </div>
                <button
                  onClick={() => showToast(`Downloading ${doc.name}...`)}
                  className="p-1 text-gray-500 hover:text-gray-900"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: AUDIT TRAIL */}
      {activeTab === 'Audit Trail' && (
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3 text-xs">
          <h3 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] border-b pb-2">
            Delivery Lifecycle Chronology
          </h3>

          <div className="space-y-3">
            {delivery.auditTrail.map((log, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-[#0F8B8D] mt-1.5 shrink-0"></div>
                <div>
                  <div className="font-semibold text-gray-900">{log.action}</div>
                  <div className="text-[11px] text-gray-500">By {log.user} on {log.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
