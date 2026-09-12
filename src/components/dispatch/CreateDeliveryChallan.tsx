import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Truck,
  FileCheck,
  FileText,
  Package,
  ShieldCheck,
  Sparkles,
  Building2,
  Calendar,
  Layers,
} from 'lucide-react';
import {
  PlasticSalesOrder,
  DeliveryNoteChallan,
  DeliveryChallanItem,
} from '../../types/salesOrderDeliveryTypes';

interface CreateDeliveryChallanProps {
  salesOrders: PlasticSalesOrder[];
  preSelectedSoId?: string;
  onSaveDelivery: (delivery: DeliveryNoteChallan) => void;
  onCancel: () => void;
  showToast: (msg: string) => void;
}

export const CreateDeliveryChallan: React.FC<CreateDeliveryChallanProps> = ({
  salesOrders,
  preSelectedSoId,
  onSaveDelivery,
  onCancel,
  showToast,
}) => {
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: SO & Customer
  const [selectedSoId, setSelectedSoId] = useState(preSelectedSoId || salesOrders[0]?.id || '');
  const activeSo = salesOrders.find((s) => s.id === selectedSoId) || salesOrders[0];

  // Step 2: Items & Quantities
  const [dispatchItems, setDispatchItems] = useState<{ [itemCode: string]: number }>(() => {
    const initial: { [itemCode: string]: number } = {};
    activeSo?.lines.forEach((l) => {
      initial[l.itemCode] = l.remainingQty > 0 ? l.remainingQty : l.orderedQty;
    });
    return initial;
  });
  const [packageCount, setPackageCount] = useState(120);
  const [packagingType, setPackagingType] = useState('Corrugated Cartons on Wooden Pallets');
  const [tareWeight, setTareWeight] = useState(4200);
  const [grossWeight, setGrossWeight] = useState(5650);

  // Step 3: Transport & Vehicle
  const [transportMode, setTransportMode] = useState('Road');
  const [transporterName, setTransporterName] = useState('VRL Logistics Ltd');
  const [transporterGstin, setTransporterGstin] = useState('29AABCV2211C1Z0');
  const [vehicleNumber, setVehicleNumber] = useState('MH-14-GH-8821');
  const [driverName, setDriverName] = useState('Suresh Patil');
  const [driverPhone, setDriverPhone] = useState('9822019281');
  const [driverLicense, setDriverLicense] = useState('MH-14-2015-009812');
  const [lrNumber, setLrNumber] = useState(`LR-${Math.floor(100000 + Math.random() * 900000)}`);
  const [approxDistanceKm, setApproxDistanceKm] = useState(140);

  // Step 4: Document Type & Compliance
  const [challanType, setChallanType] = useState<'Tax Invoice-cum-Challan' | 'Delivery Challan' | 'Job Work Challan'>('Tax Invoice-cum-Challan');
  const [autoEInvoice, setAutoEInvoice] = useState(true);
  const [autoEwb, setAutoEwb] = useState(true);
  const [ewbPartB, setEwbPartB] = useState(true);
  const [transportReason, setTransportReason] = useState('Supply of Finished Goods under Sales Contract');

  // Update quantities when SO changes
  const handleSoChange = (soId: string) => {
    setSelectedSoId(soId);
    const newSo = salesOrders.find((s) => s.id === soId);
    if (newSo) {
      const updated: { [itemCode: string]: number } = {};
      newSo.lines.forEach((l) => {
        updated[l.itemCode] = l.remainingQty > 0 ? l.remainingQty : l.orderedQty;
      });
      setDispatchItems(updated);
    }
  };

  // Calculations
  const calculatedTaxable = activeSo?.lines.reduce((sum, l) => {
    const qty = dispatchItems[l.itemCode] || 0;
    return sum + qty * l.unitPrice;
  }, 0) || 0;

  const isInterState = activeSo?.billingAddress.state !== 'Maharashtra';
  const calculatedCgst = isInterState ? 0 : calculatedTaxable * 0.09;
  const calculatedSgst = isInterState ? 0 : calculatedTaxable * 0.09;
  const calculatedIgst = isInterState ? calculatedTaxable * 0.18 : 0;
  const calculatedTotal = calculatedTaxable + calculatedCgst + calculatedSgst + calculatedIgst;

  const steps = [
    { num: 1, label: 'Order & Customer' },
    { num: 2, label: 'Items & Batch FEFO' },
    { num: 3, label: 'Transport & Vehicle' },
    { num: 4, label: 'Compliance & Tax' },
    { num: 5, label: 'Review & Dispatch' },
  ];

  const handleGenerate = (includeEInv: boolean, includeEwb: boolean) => {
    const challanItems: DeliveryChallanItem[] = activeSo.lines.map((l, i) => {
      const dQty = dispatchItems[l.itemCode] || 0;
      return {
        soLineNumber: i + 1,
        itemCode: l.itemCode,
        itemName: l.itemName,
        orderedQty: l.orderedQty,
        deliveredQty: dQty,
        remainingQty: Math.max(0, l.orderedQty - dQty),
        requestedQty: dQty,
        pickedQty: dQty,
        packedQty: dQty,
        uom: l.uom,
        plant: activeSo.plant,
        fgStore: activeSo.fgStore,
        batchLot: `B-2026-${l.itemCode.substring(3, 7)}-01`,
        locationCode: 'LOC-A1-04',
        hsn: l.hsn,
        unitPrice: l.unitPrice,
        taxRatePct: l.gstRatePct || 18,
        lineTotal: dQty * l.unitPrice,
        pickStatus: 'Picked',
      };
    });

    const newDelivery: DeliveryNoteChallan = {
      id: `DN-${Math.floor(4000 + Math.random() * 999)}`,
      salesOrderId: activeSo.id,
      salesOrderType: activeSo.orderType,
      deliveryDate: '2026-09-12',
      dispatchDate: '2026-09-12',
      customer: activeSo.customer,
      customerGstin: activeSo.customerGstin,
      shipToAddress: (activeSo.shippingAddress?.line1 || 'Plant Unit') + ', ' + (activeSo.shippingAddress?.city || 'Pune'),
      shipToGstin: activeSo.shippingAddress?.gstin || activeSo.customerGstin,
      placeOfSupply: activeSo.billingAddress?.placeOfSupply || '27-Maharashtra',
      type: challanType === 'Job Work Challan' ? 'Delivery Challan' : 'Normal Supply',
      plant: activeSo.plant,
      fgStore: activeSo.fgStore,
      status: includeEInv && includeEwb ? 'Gate Pass Created' : 'Ready for Dispatch',
      transportMode: 'Road',
      vehicleNumber,
      transporterName,
      transporterIdGstin: transporterGstin,
      driverName,
      driverMobile: driverPhone,
      lrNumber,
      dispatchPoint: activeSo.shippingAddress?.dispatchPoint || 'Gate 2 Dock',
      estimatedDistanceKm: approxDistanceKm,
      expectedDeparture: '2026-09-12 14:00',
      expectedArrival: '2026-09-12 18:00',
      eInvoiceStatus: includeEInv ? 'Generated' : 'Pending',
      irn: includeEInv ? 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456' : undefined,
      ackNumber: includeEInv ? '112026090098711' : undefined,
      ackDate: includeEInv ? '2026-09-12 12:05:00' : undefined,
      eWayBillStatus: includeEwb ? 'Generated' : 'Pending',
      ewbNumber: includeEwb ? `2410${Math.floor(10000000 + Math.random() * 90000000)}` : undefined,
      ewbDate: includeEwb ? '2026-09-12 12:06:00' : undefined,
      ewbValidUntil: includeEwb ? '2026-09-14 23:59:59' : undefined,
      ewbPartA: includeEwb,
      ewbPartB: includeEwb,
      invoiceNumber: `INV-2026-09-${Math.floor(100 + Math.random() * 899)}`,
      invoiceDate: '2026-09-12',
      taxableValue: calculatedTaxable,
      cgstAmount: calculatedCgst,
      sgstAmount: calculatedSgst,
      igstAmount: calculatedIgst,
      invoiceValue: calculatedTotal,
      packageCount,
      grossWeightKg: grossWeight,
      netWeightKg: grossWeight - tareWeight,
      gatePassNumber: `GP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      gatePassStatus: 'Draft',
      sealNumber: 'SEAL-2026-8812',
      podStatus: 'Pending',
      items: challanItems,
      packages: [],
      auditTrail: [
        {
          action: 'Delivery Challan Generated',
          user: 'Dispatch Executive',
          timestamp: '2026-09-12 12:00',
        },
      ],
    };

    onSaveDelivery(newDelivery);
    showToast(`Delivery Note ${newDelivery.id} created successfully.`);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900 font-['Space_Grotesk']">
              Create Outward Delivery Note / Challan
            </h1>
            <p className="text-xs text-gray-500">
              Indian ERP compliance flow with automated IRN generation, E-Way Bill registration, and security pass.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {steps.map((s) => (
            <div
              key={s.num}
              onClick={() => setCurrentStep(s.num)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                currentStep === s.num
                  ? 'bg-[#14213D] text-white'
                  : currentStep > s.num
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              <span>{s.num}.</span>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: ORDER & CUSTOMER */}
      {currentStep === 1 && (
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-gray-700">Select Sales Order to Fulfill *</label>
              <select
                value={selectedSoId}
                onChange={(e) => handleSoChange(e.target.value)}
                className="w-full mt-1 border border-gray-300 rounded p-2 bg-white text-gray-900 font-semibold"
              >
                {salesOrders.map((so) => (
                  <option key={so.id} value={so.id}>
                    {so.id} - {so.customer} (PO: {so.customerPoNumber})
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <span className="text-gray-500">Customer Legal Entity:</span>
              <div className="font-bold text-gray-900 text-sm mt-0.5">{activeSo.customer}</div>
              <div className="font-mono text-gray-500 text-[11px] mt-0.5">GSTIN: {activeSo.customerGstin}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-200">
            <div>
              <span className="text-blue-900 font-semibold">Origin Plant:</span>
              <div className="text-gray-900 font-medium mt-0.5">{activeSo.plant}</div>
            </div>
            <div>
              <span className="text-blue-900 font-semibold">Origin FG Store:</span>
              <div className="text-gray-900 font-medium mt-0.5">{activeSo.fgStore}</div>
            </div>
            <div>
              <span className="text-blue-900 font-semibold">Credit Status:</span>
              <div className="text-emerald-700 font-bold mt-0.5">
                {activeSo.creditStatus.toUpperCase()} (₹{(activeSo.availableCredit / 100000).toFixed(1)}L Avail)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: ITEMS & BATCH FEFO */}
      {currentStep === 2 && (
        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-bold text-gray-900 uppercase text-[11px]">
              Select Quantities & Finished Goods Batches for Dispatch
            </h3>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
              FEFO Quality Priority Active
            </span>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-100 text-gray-600 text-[11px] uppercase">
                <tr>
                  <th className="p-2.5">Item Code & Name</th>
                  <th className="p-2.5 text-right">Remaining Order Qty</th>
                  <th className="p-2.5 text-right">Available Stock</th>
                  <th className="p-2.5 text-right w-32">Dispatch Qty</th>
                  <th className="p-2.5">Auto-Allocated Batch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activeSo.lines.map((l) => (
                  <tr key={l.itemCode} className="hover:bg-gray-50">
                    <td className="p-2.5">
                      <div className="font-bold text-gray-900">{l.itemName}</div>
                      <div className="text-[10px] text-gray-400 font-mono">
                        {l.itemCode} &bull; HSN {l.hsn}
                      </div>
                    </td>
                    <td className="p-2.5 text-right font-bold text-amber-700">
                      {l.remainingQty.toLocaleString()} {l.uom}
                    </td>
                    <td className="p-2.5 text-right font-mono font-semibold text-emerald-700">
                      {l.availableStock.toLocaleString()}
                    </td>
                    <td className="p-2.5 text-right">
                      <input
                        type="number"
                        value={dispatchItems[l.itemCode] || 0}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setDispatchItems({ ...dispatchItems, [l.itemCode]: val });
                        }}
                        className="w-28 text-right border border-gray-300 rounded p-1 font-bold text-gray-900 font-mono"
                      />
                    </td>
                    <td className="p-2.5">
                      <div className="font-mono text-gray-800 font-semibold">
                        B-2026-{l.itemCode.substring(3, 7)}-01
                      </div>
                      <div className="text-[10px] text-gray-400">Loc: FG-01-A &bull; Bin B-04</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div>
              <label className="font-medium text-gray-600">Total Packages</label>
              <input
                type="number"
                value={packageCount}
                onChange={(e) => setPackageCount(Number(e.target.value))}
                className="w-full mt-1 border border-gray-300 rounded p-1.5 font-bold"
              />
            </div>
            <div>
              <label className="font-medium text-gray-600">Packaging Protocol</label>
              <input
                type="text"
                value={packagingType}
                onChange={(e) => setPackagingType(e.target.value)}
                className="w-full mt-1 border border-gray-300 rounded p-1.5"
              />
            </div>
            <div>
              <label className="font-medium text-gray-600">Tare Weight (Kg)</label>
              <input
                type="number"
                value={tareWeight}
                onChange={(e) => setTareWeight(Number(e.target.value))}
                className="w-full mt-1 border border-gray-300 rounded p-1.5 font-mono"
              />
            </div>
            <div>
              <label className="font-medium text-gray-600">Gross Weight (Kg)</label>
              <input
                type="number"
                value={grossWeight}
                onChange={(e) => setGrossWeight(Number(e.target.value))}
                className="w-full mt-1 border border-gray-300 rounded p-1.5 font-mono font-bold"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: TRANSPORT & VEHICLE */}
      {currentStep === 3 && (
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-medium text-gray-700">Transport Mode</label>
              <select
                value={transportMode}
                onChange={(e) => setTransportMode(e.target.value)}
                className="w-full mt-1 border border-gray-300 rounded p-1.5 bg-white text-gray-900"
              >
                <option value="Road">Road</option>
                <option value="Rail">Rail</option>
                <option value="Air">Air</option>
              </select>
            </div>

            <div>
              <label className="font-medium text-gray-700">Vehicle Number *</label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder="MH-14-GH-8821"
                className="w-full mt-1 border border-gray-300 rounded p-1.5 font-mono font-bold text-gray-900"
              />
            </div>

            <div>
              <label className="font-medium text-gray-700">Transporter Name</label>
              <input
                type="text"
                value={transporterName}
                onChange={(e) => setTransporterName(e.target.value)}
                className="w-full mt-1 border border-gray-300 rounded p-1.5 text-gray-900 font-semibold"
              />
            </div>

            <div>
              <label className="font-medium text-gray-700">Transporter GSTIN</label>
              <input
                type="text"
                value={transporterGstin}
                onChange={(e) => setTransporterGstin(e.target.value)}
                className="w-full mt-1 border border-gray-300 rounded p-1.5 font-mono text-gray-900"
              />
            </div>

            <div>
              <label className="font-medium text-gray-700">Driver Name</label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full mt-1 border border-gray-300 rounded p-1.5 text-gray-900"
              />
            </div>

            <div>
              <label className="font-medium text-gray-700">Driver Phone</label>
              <input
                type="text"
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                className="w-full mt-1 border border-gray-300 rounded p-1.5 text-gray-900 font-mono"
              />
            </div>

            <div>
              <label className="font-medium text-gray-700">Driver License #</label>
              <input
                type="text"
                value={driverLicense}
                onChange={(e) => setDriverLicense(e.target.value)}
                className="w-full mt-1 border border-gray-300 rounded p-1.5 text-gray-900 font-mono"
              />
            </div>

            <div>
              <label className="font-medium text-gray-700">LR / Bilty Number</label>
              <input
                type="text"
                value={lrNumber}
                onChange={(e) => setLrNumber(e.target.value)}
                className="w-full mt-1 border border-gray-300 rounded p-1.5 text-gray-900 font-mono font-bold"
              />
            </div>

            <div>
              <label className="font-medium text-gray-700">Approx Distance (KM for EWB)</label>
              <input
                type="number"
                value={approxDistanceKm}
                onChange={(e) => setApproxDistanceKm(Number(e.target.value))}
                className="w-full mt-1 border border-gray-300 rounded p-1.5 text-gray-900 font-mono font-bold"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: COMPLIANCE & TAX */}
      {currentStep === 4 && (
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-gray-700">Document Type *</label>
              <select
                value={challanType}
                onChange={(e: any) => setChallanType(e.target.value)}
                className="w-full mt-1 border border-gray-300 rounded p-2 bg-white text-gray-900 font-semibold"
              >
                <option value="Tax Invoice-cum-Challan">Tax Invoice-cum-Challan (Commercial Supply)</option>
                <option value="Delivery Challan">Delivery Challan (Rule 55 - Job Work / Sample)</option>
                <option value="Job Work Challan">Job Work Challan (Sub-contracting)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-gray-700">Transportation Reason</label>
              <input
                type="text"
                value={transportReason}
                onChange={(e) => setTransportReason(e.target.value)}
                className="w-full mt-1 border border-gray-300 rounded p-2 text-gray-900"
              />
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
            <h3 className="font-bold text-gray-800 uppercase text-[11px]">
              Statutory E-Invoice & E-Way Bill Automation Options
            </h3>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoEInvoice}
                  onChange={(e) => setAutoEInvoice(e.target.checked)}
                  className="rounded text-[#0F8B8D]"
                />
                <span className="font-semibold text-gray-800">
                  Generate E-Invoice (IRN) via NIC IRP Portal upon save
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoEwb}
                  onChange={(e) => setAutoEwb(e.target.checked)}
                  className="rounded text-[#0F8B8D]"
                />
                <span className="font-semibold text-gray-800">
                  Generate E-Way Bill (Consignment Value: ₹{calculatedTotal.toLocaleString()})
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer ml-6">
                <input
                  type="checkbox"
                  checked={ewbPartB}
                  onChange={(e) => setEwbPartB(e.target.checked)}
                  disabled={!autoEwb}
                  className="rounded text-[#0F8B8D]"
                />
                <span className="text-gray-700">
                  Generate Complete Part A + Part B (Vehicle {vehicleNumber} assigned)
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: REVIEW & DISPATCH */}
      {currentStep === 5 && (
        <div className="space-y-4 text-xs">
          <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <div>
                <div className="font-bold text-emerald-950">Pre-Dispatch Statutory Validation Passed</div>
                <div className="text-[11px] text-emerald-700">
                  Active GSTIN, valid HSN (3926/3923), Vehicle {vehicleNumber} verified.
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-emerald-700 font-bold uppercase">Consignment Total</div>
              <div className="text-lg font-bold font-mono text-emerald-950">₹{calculatedTotal.toLocaleString()}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div>
              <span className="text-gray-400">Customer:</span>
              <div className="font-bold text-gray-900 mt-0.5">{activeSo.customer}</div>
            </div>
            <div>
              <span className="text-gray-400">Vehicle:</span>
              <div className="font-mono font-bold text-gray-900 mt-0.5">{vehicleNumber}</div>
            </div>
            <div>
              <span className="text-gray-400">Transporter:</span>
              <div className="font-semibold text-gray-900 mt-0.5">{transporterName}</div>
            </div>
            <div>
              <span className="text-gray-400">Net Weight:</span>
              <div className="font-mono font-bold text-gray-900 mt-0.5">{grossWeight - tareWeight} Kg</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-3">
            <button
              onClick={() => handleGenerate(false, false)}
              className="px-3.5 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-semibold"
            >
              Generate Delivery Note Only
            </button>
            <button
              onClick={() => handleGenerate(true, false)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
            >
              Generate Note + E-Invoice
            </button>
            <button
              onClick={() => handleGenerate(true, true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded-lg font-semibold shadow-sm"
            >
              <Sparkles className="w-4 h-4" /> All-in-One: Note + E-Invoice + E-Way Bill + Gate Pass
            </button>
          </div>
        </div>
      )}

      {/* Navigation Footer for Steps 1-4 */}
      {currentStep < 5 && (
        <div className="flex items-center justify-between border-t pt-3">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${
              currentStep === 1
                ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                : 'text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Back
          </button>

          <button
            onClick={() => setCurrentStep(Math.min(5, currentStep + 1))}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#14213D] hover:bg-[#1f335e] text-white rounded-lg text-xs font-semibold"
          >
            Next Step <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
