import React, { useState, useMemo } from 'react';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  ShoppingBag,
  Package,
  CreditCard,
  Truck,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Building2,
  Calendar,
  Layers,
  Info,
  Plus,
  Trash2,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import {
  PlasticSalesOrder,
  SalesOrderType,
  SalesOrderLineItem,
  MonthlyPlanOrder,
} from '../../../types/salesOrderDeliveryTypes';

interface SalesOrderWizardProps {
  initialOrder?: Partial<PlasticSalesOrder>;
  defaultOrderType?: SalesOrderType;
  monthlyPlans: MonthlyPlanOrder[];
  onSave: (order: PlasticSalesOrder) => void;
  onCancel: () => void;
  showToast: (msg: string) => void;
}

export const SalesOrderWizard: React.FC<SalesOrderWizardProps> = ({
  initialOrder,
  defaultOrderType,
  monthlyPlans,
  onSave,
  onCancel,
  showToast,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Order Type & Customer Selection
  const [orderType, setOrderType] = useState<SalesOrderType>(
    initialOrder?.orderType || defaultOrderType || 'Daily Sales Order'
  );
  const [customer, setCustomer] = useState(
    initialOrder?.customer || 'Tata Motors Passenger Vehicles Ltd'
  );
  const [customerPoNumber, setCustomerPoNumber] = useState(
    initialOrder?.customerPoNumber || 'PO-TM-2026-9022'
  );
  const [customerPoDate, setCustomerPoDate] = useState(
    initialOrder?.customerPoDate || '2026-09-12'
  );
  const [plant, setPlant] = useState(
    initialOrder?.plant || 'Plant 1 - Pimpri Auto-Hub'
  );
  const [fgStore, setFgStore] = useState(
    initialOrder?.fgStore || 'FG-Automotive Cell'
  );
  const [monthlyPlanPeriod, setMonthlyPlanPeriod] = useState('September 2026');
  const [linkToPlan, setLinkToPlan] = useState(Boolean(initialOrder?.monthlyPlanRef));
  const [selectedPlanRef, setSelectedPlanRef] = useState(
    initialOrder?.monthlyPlanRef || 'PLN-2026-09-01'
  );

  // Customer metadata mock lookup
  const customerMeta = useMemo(() => {
    switch (customer) {
      case 'Tata Motors Passenger Vehicles Ltd':
        return {
          gstin: '27AAACT2727Q1ZW',
          state: 'Maharashtra',
          stateCode: '27',
          creditLimit: 15000000,
          currentExposure: 6420000,
          availableCredit: 8580000,
        };
      case 'Marico FMCG Consumer Products':
        return {
          gstin: '27AAACM4421R1Z8',
          state: 'Maharashtra',
          stateCode: '27',
          creditLimit: 8000000,
          currentExposure: 3200000,
          availableCredit: 4800000,
        };
      case 'Bajaj Auto Ltd Chakan Works':
        return {
          gstin: '27AAACB1234F1ZM',
          state: 'Maharashtra',
          stateCode: '27',
          creditLimit: 12000000,
          currentExposure: 12450000,
          availableCredit: -450000, // Exceeded
        };
      case 'Maruti Suzuki India Ltd (Manesar)':
      default:
        return {
          gstin: '06AAACM2345N1Z0',
          state: 'Haryana',
          stateCode: '06',
          creditLimit: 50000000,
          currentExposure: 18500000,
          availableCredit: 31500000,
        };
    }
  }, [customer]);

  // Step 2: Line items
  const [lines, setLines] = useState<SalesOrderLineItem[]>(
    initialOrder?.lines && initialOrder.lines.length > 0
      ? initialOrder.lines
      : [
          {
            lineNumber: 1,
            itemCode: 'FG-AUTO-012',
            itemName: 'ABS Dashboard Trim Bezel (Matte Black)',
            customerItemCode: 'TATA-7890-DSB',
            hsn: '39269099',
            orderedQty: 2500,
            allocatedQty: 2500,
            pickedQty: 0,
            packedQty: 0,
            deliveredQty: 0,
            invoicedQty: 0,
            remainingQty: 2500,
            uom: 'PCS',
            plant: 'Plant 1 - Pimpri Auto-Hub',
            fgStore: 'FG-Automotive Cell',
            batchPreference: 'FEFO Strict (Mould #M-104)',
            requestedDeliveryDate: '2026-09-15',
            availableStock: 8200,
            reservedStock: 2500,
            shortageQty: 0,
            status: 'In Stock',
            unitPrice: 55.0,
            discountPct: 0,
            taxableValue: 137500,
            gstRatePct: 18,
            cgstAmount: 12375,
            sgstAmount: 12375,
            igstAmount: 0,
            cessAmount: 0,
            totalValue: 162250,
            polymerGrade: 'LG Chem ABS-HI121H',
            mouldCode: 'M-104-ABS-2C',
          },
        ]
  );

  // Step 3: Pricing & Commercials
  const [priceList, setPriceList] = useState(
    initialOrder?.priceList || 'Tier-1 Automotive OEM Matrix 2026'
  );
  const [paymentTerms, setPaymentTerms] = useState(
    initialOrder?.paymentTerms || 'Net 45 Days PDC'
  );
  const [freightAmount, setFreightAmount] = useState(
    initialOrder?.freightAmount || 4500
  );
  const [packingAmount, setPackingAmount] = useState(
    initialOrder?.packingAmount || 2000
  );

  // Step 4: Packaging & Quality
  const [packagingType, setPackagingType] = useState('Corrugated box with VCI Liner');
  const [packagingInstructions, setPackagingInstructions] = useState(
    'Corrugated cartons with ESD anti-static polythene liners. Maximum stacking height 2 boxes.'
  );
  const [coaRequired, setCoaRequired] = useState(true);
  const [rohsRequired, setRohsRequired] = useState(true);
  const [reachRequired, setReachRequired] = useState(false);
  const [foodGradeRequired, setFoodGradeRequired] = useState(false);
  const [batchTraceabilityRequired, setBatchTraceabilityRequired] = useState(true);
  const [customerInspectionRequired, setCustomerInspectionRequired] = useState(false);

  // Step 5: Transport & Dispatch
  const [transportMode, setTransportMode] = useState('Road');
  const [transporterName, setTransporterName] = useState('VRL Logistics Ltd');
  const [vehicleNumber, setVehicleNumber] = useState('MH-14-GH-8821');
  const [deliveryTerms, setDeliveryTerms] = useState('Immediate JIT Delivery within 48 Hours');
  const [incoterms, setIncoterms] = useState('DAP - Delivered At Place');
  const [shippingAddress, setShippingAddress] = useState(
    'Assembly Line Gate #3, Tata Motors Works, Pimpri, Pune - 411018'
  );
  const [dispatchPoint, setDispatchPoint] = useState('Pimpri Plant 1 Gate #2');

  // Calculations for Step 3 and Step 6
  const isInterState = customerMeta.stateCode !== '27'; // Assuming Supplier is 27-MH
  const totalTaxable = lines.reduce((sum, l) => sum + l.taxableValue, 0);
  const totalCgst = isInterState ? 0 : totalTaxable * 0.09;
  const totalSgst = isInterState ? 0 : totalTaxable * 0.09;
  const totalIgst = isInterState ? totalTaxable * 0.18 : 0;
  const totalOrderVal = totalTaxable + totalCgst + totalSgst + totalIgst + freightAmount + packingAmount;

  // E-Way Bill requirement check (> 50,000 INR or inter-state)
  const isEwbRequired = totalOrderVal > 50000 || isInterState;
  const isEInvoiceRequired = true; // B2B registered supplies under mandate

  // Credit Status Check
  const creditStatus = customerMeta.availableCredit < totalOrderVal ? 'Hold' : 'Approved';

  // Line item manipulation
  const handleAddLine = () => {
    const nextLine: SalesOrderLineItem = {
      lineNumber: lines.length + 1,
      itemCode: 'FG-AUTO-045',
      itemName: 'PP Air Duct Housing - Front Left',
      customerItemCode: 'TATA-4412-ADH',
      hsn: '39269099',
      orderedQty: 1000,
      allocatedQty: 1000,
      pickedQty: 0,
      packedQty: 0,
      deliveredQty: 0,
      invoicedQty: 0,
      remainingQty: 1000,
      uom: 'PCS',
      plant,
      fgStore,
      batchPreference: 'FIFO Standard',
      requestedDeliveryDate: '2026-09-15',
      availableStock: 4600,
      reservedStock: 1000,
      shortageQty: 0,
      status: 'In Stock',
      unitPrice: 42.0,
      discountPct: 0,
      taxableValue: 42000,
      gstRatePct: 18,
      cgstAmount: isInterState ? 0 : 3780,
      sgstAmount: isInterState ? 0 : 3780,
      igstAmount: isInterState ? 7560 : 0,
      cessAmount: 0,
      totalValue: 49560,
      polymerGrade: 'Reliance Repol H110MA',
      mouldCode: 'M-088-PP-1C',
    };
    setLines([...lines, nextLine]);
  };

  const handleUpdateLineQty = (index: number, newQty: number) => {
    const updated = [...lines];
    const l = updated[index];
    l.orderedQty = newQty;
    l.taxableValue = newQty * l.unitPrice * (1 - l.discountPct / 100);
    l.cgstAmount = isInterState ? 0 : l.taxableValue * 0.09;
    l.sgstAmount = isInterState ? 0 : l.taxableValue * 0.09;
    l.igstAmount = isInterState ? l.taxableValue * 0.18 : 0;
    l.totalValue = l.taxableValue + l.cgstAmount + l.sgstAmount + l.igstAmount;
    l.shortageQty = Math.max(0, newQty - l.availableStock);
    l.status = l.shortageQty > 0 ? 'Shortage' : 'In Stock';
    setLines(updated);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length === 1) {
      showToast('A sales order requires at least one line item.');
      return;
    }
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleSubmit = (statusToSet: 'Draft' | 'Pending Approval' | 'Confirmed') => {
    const newOrder: PlasticSalesOrder = {
      id: initialOrder?.id || `SO-${Math.floor(5000 + Math.random() * 9000)}`,
      orderType,
      customer,
      customerGstin: customerMeta.gstin,
      customerPoNumber,
      customerPoDate,
      orderDate: '2026-09-12',
      requiredDeliveryDate: lines[0]?.requestedDeliveryDate || '2026-09-15',
      monthlyPlanPeriod: orderType === 'Monthly Plan Order' ? monthlyPlanPeriod : undefined,
      monthlyPlanRef: linkToPlan ? selectedPlanRef : undefined,
      linkType: linkToPlan ? 'Manually Mapped' : 'Not Linked',
      salesperson: 'Ramesh Patel',
      currency: 'INR',
      paymentTerms,
      priceList,
      plant,
      fgStore,
      billingAddress: {
        line1: 'Head Office / Billing Unit',
        city: customerMeta.state === 'Haryana' ? 'Gurugram' : 'Pune',
        state: customerMeta.state,
        pincode: customerMeta.state === 'Haryana' ? '122051' : '411018',
        gstin: customerMeta.gstin,
        placeOfSupply: `${customerMeta.stateCode}-${customerMeta.state}`,
      },
      shippingAddress: {
        line1: shippingAddress,
        city: customerMeta.state === 'Haryana' ? 'Gurugram' : 'Pune',
        state: customerMeta.state,
        pincode: customerMeta.state === 'Haryana' ? '122051' : '411018',
        gstin: customerMeta.gstin,
        dispatchPoint,
      },
      status: creditStatus === 'Hold' ? 'Credit Hold' : statusToSet,
      creditStatus,
      creditLimit: customerMeta.creditLimit,
      currentExposure: customerMeta.currentExposure,
      availableCredit: customerMeta.availableCredit,
      deliveryStatus: 'Not Started',
      invoiceStatus: 'Uninvoiced',
      eInvoiceStatus: 'Pending',
      eWayBillStatus: 'Pending',
      taxableAmount: totalTaxable,
      cgstTotal: totalCgst,
      sgstTotal: totalSgst,
      igstTotal: totalIgst,
      cessTotal: 0,
      freightAmount,
      packingAmount,
      totalOrderValue: totalOrderVal,
      deliveredValue: 0,
      invoicedValue: 0,
      remainingValue: totalOrderVal,
      transportMode,
      transporterName,
      transporterGstin: '27AABCV1234F1Z1',
      vehicleNumber,
      incoterms,
      deliveryTerms,
      packagingInstructions,
      eInvoiceRequired: isEInvoiceRequired,
      eWayBillRequired: isEwbRequired,
      deliveryChallanAllowed: true,
      coaRequired,
      msdsRequired: false,
      batchTraceabilityRequired,
      lines,
      auditTrail: [
        {
          action: `Sales Order Created as ${statusToSet} (Type: ${orderType})`,
          user: 'Commercial Operations Team',
          timestamp: '2026-09-12 11:30',
          details: linkToPlan ? `Linked to Monthly Plan ${selectedPlanRef}` : 'Independent Daily Order',
        },
      ],
    };

    onSave(newOrder);
    showToast(`Order ${newOrder.id} saved successfully (${newOrder.status}).`);
  };

  const steps = [
    { num: 1, label: 'Type & Customer' },
    { num: 2, label: 'Line Items' },
    { num: 3, label: 'Pricing & GST' },
    { num: 4, label: 'Packaging & QC' },
    { num: 5, label: 'Transport & EWB' },
    { num: 6, label: 'Review & Submit' },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-6">
      {/* Wizard Header & Stepper */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 font-['Space_Grotesk']">
              Sales Order Creation Wizard (Indian Plastic ERP)
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Strict separation between daily transactional sales orders and monthly forecast commitments.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-xs text-gray-500 hover:text-gray-800 font-medium px-3 py-1.5 rounded-lg border border-gray-200"
          >
            Cancel / Exit
          </button>
        </div>

        {/* 6 Steps Progress Bar */}
        <div className="grid grid-cols-6 gap-2">
          {steps.map((s) => {
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <div
                key={s.num}
                onClick={() => setCurrentStep(s.num)}
                className={`cursor-pointer p-2 rounded-lg border transition-all text-center ${
                  isCurrent
                    ? 'border-[#0F8B8D] bg-[#0F8B8D]/5 text-[#0F8B8D] font-bold'
                    : isCompleted
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-gray-200 text-gray-400 bg-gray-50/50'
                }`}
              >
                <div className="text-[11px] font-mono">
                  {isCompleted ? '✓ Step ' + s.num : 'Step ' + s.num}
                </div>
                <div className="text-xs truncate">{s.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 1: Order Type & Customer Selection */}
      {currentStep === 1 && (
        <div className="space-y-6 animate-fadeIn">
          {/* Order Type Radio Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Select Order Type & Billing Architecture
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  orderType === 'Daily Sales Order'
                    ? 'border-[#0F8B8D] bg-[#0F8B8D]/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="orderType"
                  value="Daily Sales Order"
                  checked={orderType === 'Daily Sales Order'}
                  onChange={() => setOrderType('Daily Sales Order')}
                  className="sr-only"
                />
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <div className="font-bold text-sm text-gray-900">Daily Sales Order</div>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Individual dispatchable order. Direct delivery and billing. Independent by default with optional plan mapping.
                </div>
              </label>

              <label
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  orderType === 'Monthly Plan Order'
                    ? 'border-blue-600 bg-blue-50/50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="orderType"
                  value="Monthly Plan Order"
                  checked={orderType === 'Monthly Plan Order'}
                  onChange={() => setOrderType('Monthly Plan Order')}
                  className="sr-only"
                />
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  <div className="font-bold text-sm text-gray-900">Monthly Plan Order</div>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Demand forecast & supply commitment. Used for reconciliation. Not auto-consumed by daily orders.
                </div>
              </label>

              <label
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  orderType === 'Blanket/Contract Order'
                    ? 'border-purple-600 bg-purple-50/50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="orderType"
                  value="Blanket/Contract Order"
                  checked={orderType === 'Blanket/Contract Order'}
                  onChange={() => setOrderType('Blanket/Contract Order')}
                  className="sr-only"
                />
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                  <div className="font-bold text-sm text-gray-900">Blanket/Contract Order</div>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Long-term rate contract with scheduled releases over multiple financial quarters.
                </div>
              </label>
            </div>
          </div>

          {/* Customer Selection & Live Credit Profile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Customer Name *</label>
              <select
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 focus:border-[#0F8B8D]"
              >
                <option value="Tata Motors Passenger Vehicles Ltd">Tata Motors Passenger Vehicles Ltd</option>
                <option value="Marico FMCG Consumer Products">Marico FMCG Consumer Products</option>
                <option value="Bajaj Auto Ltd Chakan Works">Bajaj Auto Ltd Chakan Works</option>
                <option value="Maruti Suzuki India Ltd (Manesar)">Maruti Suzuki India Ltd (Manesar)</option>
              </select>
            </div>

            {/* Live Customer GST & Credit Snapshot */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs flex flex-col justify-center">
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-500 font-medium">Customer GSTIN:</span>
                <span className="font-mono font-bold text-gray-900">{customerMeta.gstin}</span>
              </div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-500 font-medium">State / POS:</span>
                <span className="font-semibold text-gray-800">{customerMeta.stateCode} - {customerMeta.state}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">Available Credit:</span>
                <span className={`font-bold ${customerMeta.availableCredit < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                  ₹{(customerMeta.availableCredit / 100000).toFixed(2)} Lakhs
                  {customerMeta.availableCredit < 0 && ' (CREDIT HOLD RISK)'}
                </span>
              </div>
            </div>
          </div>

          {/* PO Details & Facility Routing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Customer PO Number *</label>
              <input
                type="text"
                value={customerPoNumber}
                onChange={(e) => setCustomerPoNumber(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:border-[#0F8B8D]"
                placeholder="e.g. PO-TM-2026-9022"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Customer PO Date *</label>
              <input
                type="date"
                value={customerPoDate}
                onChange={(e) => setCustomerPoDate(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:border-[#0F8B8D]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Manufacturing Plant *</label>
              <select
                value={plant}
                onChange={(e) => setPlant(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 focus:border-[#0F8B8D]"
              >
                <option value="Plant 1 - Pimpri Auto-Hub">Plant 1 - Pimpri Auto-Hub</option>
                <option value="Plant 2 - Chakan Packaging Plant">Plant 2 - Chakan Packaging Plant</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Finished Goods Store *</label>
              <select
                value={fgStore}
                onChange={(e) => setFgStore(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 focus:border-[#0F8B8D]"
              >
                <option value="FG-Automotive Cell">FG-Automotive Cell</option>
                <option value="FG-Main Warehouse">FG-Main Warehouse</option>
                <option value="FG-Export Hub">FG-Export Hub</option>
              </select>
            </div>
          </div>

          {/* Monthly Plan Period or Optional Link */}
          {orderType === 'Monthly Plan Order' ? (
            <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                <Calendar className="w-4 h-4 text-blue-600" />
                Monthly Supply Plan Configuration
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-blue-900 font-medium">Month Period *</label>
                  <select
                    value={monthlyPlanPeriod}
                    onChange={(e) => setMonthlyPlanPeriod(e.target.value)}
                    className="w-full mt-1 text-xs border border-blue-300 rounded-lg p-2 bg-white text-gray-900"
                  >
                    <option value="September 2026">September 2026</option>
                    <option value="October 2026">October 2026</option>
                    <option value="November 2026">November 2026</option>
                  </select>
                </div>
                <div className="text-xs text-blue-800 flex items-center">
                  Monthly Plan orders establish demand forecasts and bulk targets. Daily orders are NOT auto-deducted unless manually mapped in reconciliation.
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="linkPlan"
                  checked={linkToPlan}
                  onChange={(e) => setLinkToPlan(e.target.checked)}
                  className="rounded text-[#0F8B8D] focus:ring-0"
                />
                <label htmlFor="linkPlan" className="text-xs font-semibold text-gray-800 cursor-pointer">
                  Optionally Link this Daily Order to an Active Monthly Plan
                </label>
              </div>

              {linkToPlan && (
                <div className="pt-2">
                  <label className="text-xs text-gray-600">Select Active Monthly Plan Ref:</label>
                  <select
                    value={selectedPlanRef}
                    onChange={(e) => setSelectedPlanRef(e.target.value)}
                    className="w-full mt-1 text-xs border border-gray-300 rounded-lg p-2 bg-white text-gray-900"
                  >
                    {monthlyPlans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.id} - {p.customer} ({p.monthPeriod})
                      </option>
                    ))}
                  </select>
                  <div className="text-[11px] text-gray-500 mt-1">
                    Linking assigns this daily dispatch to the monthly plan reconciliation scorecard without modifying the daily order's independent billing.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Line Items & FG Details */}
      {currentStep === 2 && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Molded Plastic Products & FG Specifications
            </h3>
            <button
              onClick={handleAddLine}
              className="text-xs font-semibold text-[#0F8B8D] hover:text-[#0c7072] flex items-center gap-1 bg-[#0F8B8D]/10 px-2.5 py-1.5 rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" /> Add Product Line
            </button>
          </div>

          <div className="space-y-3">
            {lines.map((line, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-gray-200 bg-white shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#14213D] text-white text-xs flex items-center justify-center font-bold font-mono">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-sm text-gray-900">{line.itemName}</div>
                      <div className="text-[11px] text-gray-500 font-mono">
                        Code: {line.itemCode} | Cust Code: {line.customerItemCode} | HSN: {line.hsn}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveLine(idx)}
                    className="text-gray-400 hover:text-red-600 p-1 rounded"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-xs">
                  <div>
                    <label className="text-gray-500 font-medium">Ordered Qty ({line.uom})</label>
                    <input
                      type="number"
                      value={line.orderedQty}
                      onChange={(e) => handleUpdateLineQty(idx, Number(e.target.value))}
                      className="w-full mt-1 border border-gray-300 rounded p-1.5 text-gray-900 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-gray-500 font-medium">Unit Price (₹)</label>
                    <input
                      type="number"
                      value={line.unitPrice}
                      readOnly
                      className="w-full mt-1 border border-gray-200 bg-gray-50 rounded p-1.5 text-gray-900 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-gray-500 font-medium">Polymer Grade</label>
                    <div className="mt-1 font-semibold text-gray-800 truncate" title={line.polymerGrade}>
                      {line.polymerGrade}
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-500 font-medium">Mould Code</label>
                    <div className="mt-1 font-mono text-gray-800">{line.mouldCode}</div>
                  </div>

                  <div>
                    <label className="text-gray-500 font-medium">Batch Preference</label>
                    <select
                      value={line.batchPreference}
                      onChange={(e) => {
                        const copy = [...lines];
                        copy[idx].batchPreference = e.target.value;
                        setLines(copy);
                      }}
                      className="w-full mt-1 border border-gray-300 rounded p-1 text-xs bg-white text-gray-800"
                    >
                      <option value="FEFO Strict (Mould #M-104)">FEFO (First Expiry First Out)</option>
                      <option value="FIFO Standard">FIFO Standard</option>
                      <option value="Specific Quality Certified Lot">QC Certified Lot Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-500 font-medium">Req Delivery Date</label>
                    <input
                      type="date"
                      value={line.requestedDeliveryDate}
                      onChange={(e) => {
                        const copy = [...lines];
                        copy[idx].requestedDeliveryDate = e.target.value;
                        setLines(copy);
                      }}
                      className="w-full mt-1 border border-gray-300 rounded p-1 text-xs text-gray-800"
                    />
                  </div>
                </div>

                {/* Stock Check Indicator for this Line */}
                <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg text-xs border border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500">
                      Available Stock: <strong className="text-gray-900 font-mono">{line.availableStock.toLocaleString()} PCS</strong>
                    </span>
                    <span className="text-gray-500">
                      Reserved: <strong className="text-gray-700 font-mono">{line.reservedStock.toLocaleString()} PCS</strong>
                    </span>
                  </div>

                  {line.shortageQty > 0 ? (
                    <span className="flex items-center gap-1 text-red-700 font-bold bg-red-100 px-2 py-0.5 rounded text-[11px]">
                      <AlertCircle className="w-3.5 h-3.5" /> Shortage of {line.shortageQty.toLocaleString()} PCS (Production Order Needed)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                      <Check className="w-3.5 h-3.5" /> 100% In-Stock & Ready for FEFO Pick
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Pricing & Commercials */}
      {currentStep === 3 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">Commercial Terms</h3>
              <div>
                <label className="text-xs font-semibold text-gray-700">Price List Applied</label>
                <select
                  value={priceList}
                  onChange={(e) => setPriceList(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 mt-1"
                >
                  <option value="Tier-1 Automotive OEM Matrix 2026">Tier-1 Automotive OEM Matrix 2026</option>
                  <option value="FMCG Rigid Packaging List">FMCG Rigid Packaging List</option>
                  <option value="Standard Domestic List">Standard Domestic List</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">Payment Terms</label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 mt-1"
                >
                  <option value="Advance Payment">100% Advance Payment</option>
                  <option value="Net 30 Days RTGS">Net 30 Days RTGS</option>
                  <option value="Net 45 Days PDC">Net 45 Days PDC</option>
                  <option value="Net 60 Days">Net 60 Days</option>
                  <option value="Letter of Credit (LC)">Letter of Credit (LC)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Freight (₹)</label>
                  <input
                    type="number"
                    value={freightAmount}
                    onChange={(e) => setFreightAmount(Number(e.target.value))}
                    className="w-full text-xs border border-gray-300 rounded-lg p-2 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Packing & Handling (₹)</label>
                  <input
                    type="number"
                    value={packingAmount}
                    onChange={(e) => setPackingAmount(Number(e.target.value))}
                    className="w-full text-xs border border-gray-300 rounded-lg p-2 mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Indian GST Tax & Credit Engine Card */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  GST Calculation & Credit Check
                </span>
                <span className="text-[11px] font-semibold text-gray-500">
                  Place of Supply: {customerMeta.stateCode}-{customerMeta.state}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Taxable Goods Value</span>
                  <span className="font-semibold text-gray-900 font-mono">₹{totalTaxable.toLocaleString()}</span>
                </div>
                {isInterState ? (
                  <div className="flex justify-between text-gray-600">
                    <span>IGST (18% Inter-state)</span>
                    <span className="font-semibold text-gray-900 font-mono">₹{totalIgst.toLocaleString()}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-gray-600">
                      <span>CGST (9% Intra-state)</span>
                      <span className="font-semibold text-gray-900 font-mono">₹{totalCgst.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>SGST (9% Intra-state)</span>
                      <span className="font-semibold text-gray-900 font-mono">₹{totalSgst.toLocaleString()}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Freight & Packing Additions</span>
                  <span className="font-semibold text-gray-900 font-mono">₹{(freightAmount + packingAmount).toLocaleString()}</span>
                </div>
                <div className="border-t border-gray-200 pt-1.5 flex justify-between text-sm font-bold text-[#14213D]">
                  <span>Total Order Gross Value</span>
                  <span className="font-mono">₹{totalOrderVal.toLocaleString()}</span>
                </div>
              </div>

              {/* Credit Status Indicator */}
              <div
                className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                  creditStatus === 'Approved'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                {creditStatus === 'Approved' ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Credit Check Passed: Customer has ₹{(customerMeta.availableCredit / 100000).toFixed(1)}L headroom.</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>Credit Hold Warning: Exceeds limit by ₹{(Math.abs(customerMeta.availableCredit) / 100000).toFixed(1)}L. Order will be blocked.</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Packaging & Quality Requirements */}
      {currentStep === 4 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Plastic Industry Packaging Specifications
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700">Packaging Type *</label>
                <select
                  value={packagingType}
                  onChange={(e) => setPackagingType(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 mt-1"
                >
                  <option value="Corrugated box with VCI Liner">Corrugated box with VCI Liner</option>
                  <option value="Plastic Returnable Crates (Automotive standard)">Plastic Returnable Crates (Automotive standard)</option>
                  <option value="Wooden EPAL Pallets with Shrink Wrap">Wooden EPAL Pallets with Shrink Wrap</option>
                  <option value="Food Grade Woven HDPE Bags">Food Grade Woven HDPE Bags</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">Special Handling Instructions</label>
                <input
                  type="text"
                  value={packagingInstructions}
                  onChange={(e) => setPackagingInstructions(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 text-gray-900 mt-1"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 border-t border-gray-200 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Mandatory Quality Compliance Certifications
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <label className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 bg-gray-50/50 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={coaRequired}
                  onChange={(e) => setCoaRequired(e.target.checked)}
                  className="rounded text-[#0F8B8D]"
                />
                <span className="font-semibold text-gray-800">Certificate of Analysis (COA)</span>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 bg-gray-50/50 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={rohsRequired}
                  onChange={(e) => setRohsRequired(e.target.checked)}
                  className="rounded text-[#0F8B8D]"
                />
                <span className="font-semibold text-gray-800">RoHS Compliance Cert</span>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 bg-gray-50/50 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={reachRequired}
                  onChange={(e) => setReachRequired(e.target.checked)}
                  className="rounded text-[#0F8B8D]"
                />
                <span className="font-semibold text-gray-800">REACH SVHC Declaration</span>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 bg-gray-50/50 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={foodGradeRequired}
                  onChange={(e) => setFoodGradeRequired(e.target.checked)}
                  className="rounded text-[#0F8B8D]"
                />
                <span className="font-semibold text-gray-800">Food Grade Migration Test</span>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 bg-gray-50/50 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={batchTraceabilityRequired}
                  onChange={(e) => setBatchTraceabilityRequired(e.target.checked)}
                  className="rounded text-[#0F8B8D]"
                />
                <span className="font-semibold text-gray-800">Mould & Polymer Lot Traceability</span>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 bg-gray-50/50 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={customerInspectionRequired}
                  onChange={(e) => setCustomerInspectionRequired(e.target.checked)}
                  className="rounded text-[#0F8B8D]"
                />
                <span className="font-semibold text-gray-800">Customer Pre-Dispatch Inspection</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Transport & Dispatch Details */}
      {currentStep === 5 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-700">Transport Mode *</label>
              <select
                value={transportMode}
                onChange={(e) => setTransportMode(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 mt-1"
              >
                <option value="Road">Road</option>
                <option value="Rail">Rail</option>
                <option value="Air">Air</option>
                <option value="Sea">Sea</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700">Transporter Master *</label>
              <select
                value={transporterName}
                onChange={(e) => setTransporterName(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 mt-1"
              >
                <option value="VRL Logistics Ltd">VRL Logistics Ltd (29AABCV1234F1Z1)</option>
                <option value="Safexpress Pvt Ltd">Safexpress Pvt Ltd (27AABCS9912A1Z9)</option>
                <option value="TCI Freight Express">TCI Freight Express (06AABCT1921R1Z5)</option>
                <option value="Gati KWE">Gati KWE (36AAACG4410R1Z2)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700">Vehicle Number</label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded-lg p-2.5 text-gray-900 font-mono mt-1"
                placeholder="e.g. MH-14-GH-8821"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700">Incoterms</label>
              <select
                value={incoterms}
                onChange={(e) => setIncoterms(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 mt-1"
              >
                <option value="DAP - Delivered At Place">DAP - Delivered At Place</option>
                <option value="EXW - Ex Works">EXW - Ex Works</option>
                <option value="FCA - Free Carrier">FCA - Free Carrier</option>
                <option value="FOB - Free on Board">FOB - Free on Board</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700">Dispatch Point</label>
              <input
                type="text"
                value={dispatchPoint}
                onChange={(e) => setDispatchPoint(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded-lg p-2.5 text-gray-900 mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700">Delivery SLA Terms</label>
              <input
                type="text"
                value={deliveryTerms}
                onChange={(e) => setDeliveryTerms(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded-lg p-2.5 text-gray-900 mt-1"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700">Shipping Delivery Address *</label>
            <textarea
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              rows={2}
              className="w-full text-xs border border-gray-300 rounded-lg p-2.5 text-gray-900 mt-1"
            />
          </div>

          {/* E-Way Bill Rule Check */}
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs flex items-center gap-3">
            <Truck className="w-5 h-5 text-amber-700 shrink-0" />
            <div>
              <div className="font-bold text-amber-900">
                E-Way Bill Compliance Requirement: {isEwbRequired ? 'MANDATORY' : 'EXEMPT'}
              </div>
              <div className="text-amber-800 text-[11px]">
                Order value (₹{totalOrderVal.toLocaleString()}) exceeds ₹50,000 threshold. Valid E-Way Bill Part A and Part B must accompany delivery at plant gate release.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 6: Review & Submit */}
      {currentStep === 6 && (
        <div className="space-y-6 animate-fadeIn">
          {/* Review Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2 text-xs">
              <div className="font-bold text-gray-900 uppercase tracking-wider mb-2">Order & Facility Summary</div>
              <div className="flex justify-between">
                <span className="text-gray-500">Order Type:</span>
                <span className="font-bold text-gray-900">{orderType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Customer:</span>
                <span className="font-semibold text-gray-900">{customer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">PO Number / Date:</span>
                <span className="font-mono text-gray-800">{customerPoNumber} ({customerPoDate})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Plant / Store:</span>
                <span className="text-gray-800">{plant} &bull; {fgStore}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Monthly Plan Link:</span>
                <span className="font-semibold text-blue-700">
                  {linkToPlan ? `Linked to ${selectedPlanRef}` : 'Independent Daily Order'}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2 text-xs">
              <div className="font-bold text-gray-900 uppercase tracking-wider mb-2">Tax & Compliance Summary</div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Taxable Value:</span>
                <span className="font-mono font-semibold text-gray-900">₹{totalTaxable.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total GST ({isInterState ? 'IGST 18%' : 'CGST+SGST 18%'}):</span>
                <span className="font-mono font-semibold text-gray-900">₹{(totalCgst + totalSgst + totalIgst).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Gross Invoice Amount:</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">₹{totalOrderVal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Credit Check Result:</span>
                <span className={`font-bold ${creditStatus === 'Approved' ? 'text-emerald-700' : 'text-red-700'}`}>
                  {creditStatus === 'Approved' ? 'APPROVED' : 'CREDIT HOLD'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">E-Way Bill & E-Invoice:</span>
                <span className="font-semibold text-indigo-700">Required (Turnover & Value rule)</span>
              </div>
            </div>
          </div>

          {/* Lines Table Summary */}
          <div className="border border-gray-200 rounded-lg overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-gray-100 text-gray-600 font-semibold text-[11px]">
                <tr>
                  <th className="p-2.5">Line</th>
                  <th className="p-2.5">Product & Polymer</th>
                  <th className="p-2.5 text-right">Quantity</th>
                  <th className="p-2.5 text-right">Rate</th>
                  <th className="p-2.5 text-right">Taxable</th>
                  <th className="p-2.5 text-right">Gross Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {lines.map((l, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="p-2.5 font-mono">{i + 1}</td>
                    <td className="p-2.5">
                      <div className="font-semibold text-gray-900">{l.itemName}</div>
                      <div className="text-[10px] text-gray-500">{l.polymerGrade} &bull; Mould {l.mouldCode}</div>
                    </td>
                    <td className="p-2.5 text-right font-semibold">{l.orderedQty.toLocaleString()} {l.uom}</td>
                    <td className="p-2.5 text-right font-mono">₹{l.unitPrice}</td>
                    <td className="p-2.5 text-right font-mono">₹{l.taxableValue.toLocaleString()}</td>
                    <td className="p-2.5 text-right font-mono font-bold text-gray-900">₹{l.totalValue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Wizard Bottom Navigation Buttons */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-4">
        {currentStep > 1 ? (
          <button
            onClick={() => setCurrentStep(currentStep - 1)}
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Step {currentStep - 1}
          </button>
        ) : (
          <div></div>
        )}

        <div className="flex items-center gap-2">
          {currentStep < 6 ? (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              className="flex items-center gap-1.5 px-5 py-2 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded-lg text-xs font-semibold shadow-sm"
            >
              Continue to Step {currentStep + 1} <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSubmit('Draft')}
                className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold"
              >
                Save as Draft
              </button>
              <button
                onClick={() => handleSubmit('Pending Approval')}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm"
              >
                Submit for Approval
              </button>
              <button
                onClick={() => handleSubmit('Confirmed')}
                className="px-5 py-2 bg-[#14213D] hover:bg-[#1f335e] text-white rounded-lg text-xs font-semibold shadow-sm"
              >
                Confirm Order
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
