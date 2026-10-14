import React, { useState } from 'react';
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  FileSpreadsheet,
  Sliders,
} from 'lucide-react';
import { RequestForQuotation, ExtendedPurchaseOrder, ExtendedPoLine } from '../../types/procurement';

interface Props {
  rfqNumber?: string;
  rfqs: RequestForQuotation[];
  onNavigate: (view: string, param?: any) => void;
  onCreatePO: (po: ExtendedPurchaseOrder) => void;
  showToast: (msg: string) => void;
}

interface BidEvaluation {
  supplierId: string;
  supplierName: string;
  quoteReference: string;
  quotationDate: string;
  unitPrice: number;
  freightPerUnit: number;
  landedCostPerUnit: number;
  totalAmount: number;
  leadTimeDays: number;
  promisedDeliveryDate: string;
  paymentTerms: string;
  incoterms: string;
  qualityCertificationsProvided: string[];
  technicalDeviations: string;
  weightedTotalScore: number;
  priceScore: number;
  qualityScore: number;
  deliveryScore: number;
  termsScore: number;
}

export const SupplierQuotationComparisonView: React.FC<Props> = ({
  rfqNumber = 'RFQ-2026-018',
  rfqs,
  onNavigate,
  onCreatePO,
  showToast,
}) => {
  const rfq = rfqs.find((r) => r.rfqNumber === rfqNumber) || rfqs[0];

  const [splitRatioA, setSplitRatioA] = useState<number>(70);
  const [splitRatioB, setSplitRatioB] = useState<number>(30);

  if (!rfq) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800">RFQ Not Found</h2>
        <button
          onClick={() => onNavigate('rfqList')}
          className="mt-4 px-4 py-2 bg-[#0F8B8D] text-white rounded-lg text-xs font-semibold"
        >
          Return to RFQs
        </button>
      </div>
    );
  }

  const targetLine = rfq.lines?.[0] || {
    lineNo: 1,
    itemCode: 'SP-MOLD-PIN-01',
    itemName: 'Core Pin Set H13 Nitrided (4 Pcs)',
    description: 'Hardened H13 DIN 1.2344, polished Ra 0.2 surface finish',
    quantity: 2,
    uom: 'SET',
    requiredDate: '2026-09-18',
    targetPrice: 85000,
    historicalPrice: 88000,
    coaRequired: true,
    msdsRequired: false,
  };

  // Mock / Derived bids for comparison
  const defaultBids: BidEvaluation[] = [
    {
      supplierId: 'SUP-004',
      supplierName: 'Precision Molds & Tooling Works',
      quoteReference: 'QT-PREC-9912',
      quotationDate: '2026-08-27',
      unitPrice: 84000,
      freightPerUnit: 1200,
      landedCostPerUnit: 85200,
      totalAmount: 84000 * targetLine.quantity * 1.18,
      leadTimeDays: 12,
      promisedDeliveryDate: '2026-09-15',
      paymentTerms: 'Net 30 Days',
      incoterms: 'DAP Factory Gate',
      qualityCertificationsProvided: ['HRC 54 Hardness Cert', 'CMM Dimensional Report', 'Material Test Cert'],
      technicalDeviations: 'None (100% compliant)',
      weightedTotalScore: 94,
      priceScore: 96,
      qualityScore: 95,
      deliveryScore: 90,
      termsScore: 92,
    },
    {
      supplierId: 'SUP-TOOL-08',
      supplierName: 'Shree Sai Tooling Technologies',
      quoteReference: 'QT-SST-4401',
      quotationDate: '2026-08-28',
      unitPrice: 91000,
      freightPerUnit: 800,
      landedCostPerUnit: 91800,
      totalAmount: 91000 * targetLine.quantity * 1.18,
      leadTimeDays: 10,
      promisedDeliveryDate: '2026-09-12',
      paymentTerms: '10% Advance, Net 30',
      incoterms: 'Ex-Works Pune',
      qualityCertificationsProvided: ['Hardness Cert', 'Ultrasonic Test Cert'],
      technicalDeviations: 'Minor surface roughness Ra 0.3 vs requested 0.2',
      weightedTotalScore: 82,
      priceScore: 78,
      qualityScore: 84,
      deliveryScore: 94,
      termsScore: 76,
    },
    {
      supplierId: 'SUP-TOOL-09',
      supplierName: 'Apex Toolcraft Components',
      quoteReference: 'QT-ATC-1120',
      quotationDate: '2026-08-29',
      unitPrice: 88500,
      freightPerUnit: 1500,
      landedCostPerUnit: 90000,
      totalAmount: 88500 * targetLine.quantity * 1.18,
      leadTimeDays: 18,
      promisedDeliveryDate: '2026-09-22',
      paymentTerms: 'Net 45 Days',
      incoterms: 'DDP Factory Gate',
      qualityCertificationsProvided: ['Standard Mill Test Cert'],
      technicalDeviations: 'Lead time exceeds requested deadline by 4 days',
      weightedTotalScore: 76,
      priceScore: 82,
      qualityScore: 80,
      deliveryScore: 65,
      termsScore: 85,
    }
  ];

  // Award Single PO
  const handleAwardSingle = (vendorId: string) => {
    const chosenBid = defaultBids.find((b) => b.supplierId === vendorId) || defaultBids[0];

    const totalSub = targetLine.quantity * chosenBid.unitPrice;
    const taxAmt = totalSub * 0.18;
    const freightTotal = chosenBid.freightPerUnit * targetLine.quantity;
    const grandTotal = totalSub + taxAmt + freightTotal;

    const poLine: ExtendedPoLine = {
      lineNo: 1,
      itemCode: targetLine.itemCode,
      itemName: targetLine.itemName,
      description: targetLine.description,
      orderedQty: targetLine.quantity,
      receivedQty: 0,
      invoicedQty: 0,
      remainingQty: targetLine.quantity,
      uom: targetLine.uom,
      unitPrice: chosenBid.unitPrice,
      discountPct: 0,
      taxPct: 18,
      lineTotal: totalSub + taxAmt,
      expectedDate: chosenBid.promisedDeliveryDate,
      warehouse: 'TOOL-ROOM-WH',
      binLocation: 'TR-A1-BIN2',
      lotRequired: true,
      coaRequired: true,
      msdsRequired: false,
      status: 'open',
    };

    const newPo: ExtendedPurchaseOrder = {
      id: `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      poNumber: `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      poDate: new Date().toISOString().slice(0, 10),
      expectedDeliveryDate: chosenBid.promisedDeliveryDate,
      promisedDeliveryDate: chosenBid.promisedDeliveryDate,
      supplierId: chosenBid.supplierId,
      supplierName: chosenBid.supplierName,
      supplierCode: chosenBid.supplierId,
      buyer: 'Senior Tooling Buyer',
      plantWarehouse: 'RM-WH-01 (Main Plant)',
      currency: 'INR (₹)',
      exchangeRate: 1.0,
      paymentTerms: chosenBid.paymentTerms,
      deliveryTerms: chosenBid.incoterms,
      orderType: 'Standard PO',
      sourcePrNumber: rfq.sourcePrNumber,
      sourceRfqNumber: rfq.rfqNumber,
      status: 'approved',
      approvalStatus: 'approved',
      lines: [poLine],
      totalSubtotal: totalSub,
      totalDiscount: 0,
      totalTax: taxAmt,
      freightAmount: freightTotal,
      totalAmount: grandTotal,
      receivedAmount: 0,
      invoicedAmount: 0,
      outstandingAmount: grandTotal,
      shippingAddress: 'Reboot Plastic Solutions, Plot 42, GIDC Industrial Estate, Vapi, Gujarat 396195',
      billingAddress: 'Reboot Plastic Solutions Pvt Ltd, Accounts Payable, Vapi, Gujarat',
      notes: `Awarded based on lowest landed cost & highest technical scoring on ${rfq.rfqNumber}`,
      specialInstructions: 'Hardness certificate and CMM dimensional inspection report required at receipt.',
      grnList: [],
      invoiceList: [],
      approvals: [
        {
          level: 'Procurement Approval',
          approver: 'Vikram Seth',
          status: 'Approved',
          date: new Date().toISOString().slice(0, 10),
          comment: 'Awarded to L1 evaluated bidder'
        }
      ],
      activityHistory: [
        {
          date: new Date().toISOString().slice(0, 10),
          event: `PO created from RFQ ${rfq.rfqNumber} award`,
          by: 'Vikram Seth'
        }
      ]
    };

    onCreatePO(newPo);
    showToast(`Awarded ${rfq.rfqNumber} to ${chosenBid.supplierName}. Created ${newPo.poNumber}`);
    onNavigate('poList');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('rfqList')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#14213D] transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to RFQ List
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast('Exporting comparison matrix to Excel...')}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export Matrix
          </button>
        </div>
      </div>

      {/* RFQ Meta Card */}
      <div className="bg-[#14213D] text-white p-6 rounded-2xl shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0F8B8D]/30 text-[#0F8B8D] border border-[#0F8B8D]/50 font-mono">
                {rfq.rfqNumber}
              </span>
              <span className="text-xs text-slate-300">PR Reference: {rfq.sourcePrNumber || 'Manual'}</span>
            </div>
            <h1 className="text-xl font-bold font-['Space_Grotesk']">{rfq.title}</h1>
            <p className="text-xs text-slate-300 mt-1">
              Material: <span className="font-semibold text-white">{targetLine.itemName}</span> • Target: <span className="font-semibold text-white">{targetLine.quantity.toLocaleString()} {targetLine.uom}</span> @ Budget Target ₹{targetLine.targetPrice.toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/10 p-3 rounded-xl border border-white/10 self-start md:self-auto text-xs">
            <div>
              <div className="text-[10px] text-slate-300 uppercase">Quotations Received</div>
              <div className="text-base font-bold font-['Space_Grotesk'] text-emerald-400">{defaultBids.length} of 3</div>
            </div>
            <div className="w-[1px] h-8 bg-white/20" />
            <div>
              <div className="text-[10px] text-slate-300 uppercase">Lowest Landed Price</div>
              <div className="text-base font-bold font-['Space_Grotesk'] text-emerald-400">
                ₹{Math.min(...defaultBids.map((b) => b.landedCostPerUnit)).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold font-['Space_Grotesk'] text-[#14213D]">
              Supplier Quotation Comparative Matrix
            </h2>
            <p className="text-xs text-slate-500">
              Evaluated with weighted scoring: Price (50%), Quality (25%), Delivery SLA (15%), Credit Terms (10%)
            </p>
          </div>
        </div>

        {/* Matrix Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {defaultBids.map((bid, idx) => {
            const isHighestScore = bid.weightedTotalScore === Math.max(...defaultBids.map((b) => b.weightedTotalScore));

            return (
              <div
                key={bid.supplierId}
                className={`rounded-2xl border p-5 flex flex-col justify-between transition relative ${
                  isHighestScore
                    ? 'border-[#0F8B8D] ring-2 ring-[#0F8B8D]/20 bg-[#0F8B8D]/5'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {isHighestScore && (
                  <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-[#0F8B8D] text-white text-[10px] font-bold shadow flex items-center gap-1">
                    <Award className="w-3 h-3" /> Recommended Award (Rank #{idx + 1})
                  </div>
                )}

                <div className="space-y-4">
                  {/* Supplier Header */}
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#14213D]">{bid.supplierName}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Quote Ref: <span className="font-mono">{bid.quoteReference}</span> • {bid.quotationDate}
                    </div>
                  </div>

                  {/* Landed Pricing Box */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Base Price (unit)</span>
                      <span className="font-bold text-[#14213D]">₹{bid.unitPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Freight & Handling</span>
                      <span className="font-medium text-slate-700">+₹{bid.freightPerUnit.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">GST (18%)</span>
                      <span className="font-medium text-slate-700">+₹{((bid.unitPrice) * 0.18).toLocaleString()}</span>
                    </div>
                    <div className="border-t border-slate-200 pt-1 flex justify-between font-bold text-sm">
                      <span className="text-[#14213D]">Net Landed Rate</span>
                      <span className="text-emerald-700 font-['Space_Grotesk']">
                        ₹{bid.landedCostPerUnit.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right text-[11px] text-slate-400">
                      Total Bid: ₹{bid.totalAmount.toLocaleString()}
                    </div>
                  </div>

                  {/* Commercial Terms & SLA */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Delivery Lead Time</span>
                      <span className="font-bold text-[#14213D]">{bid.leadTimeDays} Days ({bid.promisedDeliveryDate})</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Payment Terms</span>
                      <span className="font-semibold text-[#14213D]">{bid.paymentTerms}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Incoterms</span>
                      <span className="font-semibold text-[#14213D]">{bid.incoterms}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Quality Certs</span>
                      <span className="font-semibold text-emerald-700">{bid.qualityCertificationsProvided.join(', ')}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Technical Deviation</span>
                      <span className="font-medium text-slate-700">{bid.technicalDeviations}</span>
                    </div>
                  </div>

                  {/* Weighted Score Breakdown */}
                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5 text-xs">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-[#14213D]">Total Weighted Score</span>
                      <span className="text-[#0F8B8D] text-sm font-['Space_Grotesk'] font-bold">
                        {bid.weightedTotalScore} / 100
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 text-[10px] text-center text-slate-500 pt-1">
                      <div className="bg-slate-50 p-1 rounded">Price: <strong>{bid.priceScore}</strong></div>
                      <div className="bg-slate-50 p-1 rounded">Quality: <strong>{bid.qualityScore}</strong></div>
                      <div className="bg-slate-50 p-1 rounded">Lead: <strong>{bid.deliveryScore}</strong></div>
                      <div className="bg-slate-50 p-1 rounded">Terms: <strong>{bid.termsScore}</strong></div>
                    </div>
                  </div>
                </div>

                {/* Direct Action Button */}
                <div className="mt-5">
                  <button
                    onClick={() => handleAwardSingle(bid.supplierId)}
                    className={`w-full py-2.5 rounded-xl font-semibold text-xs transition shadow-sm flex items-center justify-center gap-1.5 ${
                      isHighestScore
                        ? 'bg-[#0F8B8D] hover:bg-[#0d797b] text-white'
                        : 'bg-[#14213D] hover:bg-[#1f325c] text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Award 100% Volume & Issue PO
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dual-Sourcing / Split Award Sourcing Tool */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-100 text-[#0F8B8D] flex items-center justify-center font-bold">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#14213D]">Dual-Sourcing Volume Allocation Engine</h3>
                <p className="text-xs text-slate-500">Mitigate supply risk by splitting volume between Primary (L1) and Secondary (Backup) suppliers</p>
              </div>
            </div>

            <button
              onClick={() => {
                showToast(`Generated 2 split Purchase Orders: ${splitRatioA}% to Precision Molds and ${splitRatioB}% to Shree Sai Tooling`);
                onNavigate('poList');
              }}
              className="px-4 py-2 bg-[#E8622C] hover:bg-[#d45320] text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              Issue Dual Split POs
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <div className="flex justify-between font-bold text-[#14213D] mb-1">
                <span>Primary Supplier: Precision Molds ({splitRatioA}%)</span>
                <span>{((targetLine.quantity) * splitRatioA / 100).toFixed(1)} {targetLine.uom}</span>
              </div>
              <input
                type="range"
                min={10}
                max={90}
                value={splitRatioA}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSplitRatioA(val);
                  setSplitRatioB(100 - val);
                }}
                className="w-full accent-[#0F8B8D]"
              />
              <div className="text-[11px] text-slate-500 mt-1">
                PO Value: ₹{Math.round((((targetLine?.quantity || 1) * splitRatioA / 100) * 84000 * 1.18)).toLocaleString()}
              </div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <div className="flex justify-between font-bold text-[#14213D] mb-1">
                <span>Secondary Backup: Shree Sai Tooling ({splitRatioB}%)</span>
                <span>{(((targetLine?.quantity || 1)) * splitRatioB / 100).toFixed(1)} {targetLine?.uom || 'SET'}</span>
              </div>
              <input
                type="range"
                min={10}
                max={90}
                value={splitRatioB}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSplitRatioB(val);
                  setSplitRatioA(100 - val);
                }}
                className="w-full accent-[#E8622C]"
              />
              <div className="text-[11px] text-slate-500 mt-1">
                PO Value: ₹{Math.round((((targetLine?.quantity || 1) * splitRatioB / 100) * 91000 * 1.18)).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
