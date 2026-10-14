import React, { useState, useMemo } from 'react';
import {
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  Building2,
  FileCheck,
  Package,
  Truck,
  CreditCard,
  Plus,
  Trash2,
  Search,
  History,
  ShieldCheck,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  EnrichedCustomerRecord,
  ContractedCustomerLine,
  customerMasterService,
} from '../../services/customerMasterService';
import { ItemMaster } from '../../types';
import { itemService } from '../../services/itemService';
import { transportMasterService, TransporterRecord } from '../../services/transportMasterService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCustomerSaved: (customer: EnrichedCustomerRecord) => void;
  initialCustomer?: EnrichedCustomerRecord | null;
  showToast: (msg: string) => void;
}

export const CustomerOnboardingWizardModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onCustomerSaved,
  initialCustomer,
  showToast,
}) => {
  const [step, setStep] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Step 1: Profile & KYC
  const [code, setCode] = useState<string>(
    initialCustomer?.code || customerMasterService.generateNextCustomerCode()
  );
  const [name, setName] = useState<string>(initialCustomer?.name || '');
  const [shortName, setShortName] = useState<string>(initialCustomer?.shortName || '');
  const [segment, setSegment] = useState<string>(
    initialCustomer?.segment || 'Automotive OEM Tier 1'
  );
  const [customerType, setCustomerType] = useState<any>(
    initialCustomer?.customerType || 'Tier 1'
  );
  const [tier, setTier] = useState<any>(initialCustomer?.tier || 'Tier 1');
  const [gstin, setGstin] = useState<string>(initialCustomer?.gstin || '');
  const [pan, setPan] = useState<string>(
    initialCustomer?.gstin ? initialCustomer.gstin.slice(2, 12) : ''
  );
  const [state, setState] = useState<string>(initialCustomer?.state || 'Maharashtra');
  const [creditLimit, setCreditLimit] = useState<number>(
    initialCustomer?.creditLimit || 2500000
  );
  const [creditDays, setCreditDays] = useState<number>(initialCustomer?.creditDays || 30);
  const [riskRating, setRiskRating] = useState<any>(initialCustomer?.riskRating || 'AA');
  const [contactPerson, setContactPerson] = useState<string>(
    initialCustomer?.contactPerson || ''
  );
  const [mobile, setMobile] = useState<string>(initialCustomer?.mobile || '');
  const [email, setEmail] = useState<string>(initialCustomer?.email || '');
  const [billingAddress, setBillingAddress] = useState<string>(
    initialCustomer?.address || ''
  );
  const [destination, setDestination] = useState<string>(
    initialCustomer?.destination || ''
  );

  // Step 2: PO & Contract
  const [poNumber, setPoNumber] = useState<string>(
    initialCustomer?.poNumber || `PO-${code}-2026-01`
  );
  const [poDate, setPoDate] = useState<string>(
    initialCustomer?.poDate || new Date().toISOString().slice(0, 10)
  );
  const [poExpiryDate, setPoExpiryDate] = useState<string>(
    initialCustomer?.poExpiryDate ||
      new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10)
  );
  const [poVersionTag, setPoVersionTag] = useState<string>('v1.0 (Initial Onboarding)');
  const [poChangeReason, setPoChangeReason] = useState<string>(
    'Initial Customer Master Registration & Contract Setup'
  );

  // Step 3: Contracted Line Items
  const [masterItemsList] = useState<ItemMaster[]>(() => itemService.getItemsSync());
  const [contractedLines, setContractedLines] = useState<ContractedCustomerLine[]>(
    initialCustomer?.contractedLines && initialCustomer.contractedLines.length > 0
      ? initialCustomer.contractedLines
      : [
          {
            id: 'LINE-1',
            itemCode: 'RMBOP-SR',
            itemName: 'SCREW RETAINER (APJ)',
            customerPartNumber: `${code}-RMBOP-SR`,
            unitPrice: 45.0,
            hsn: '39269099',
            gstRatePct: 18,
            polymerGrade: 'Engineering Polymer Grade',
            mouldCode: 'MLD-1001-AUTO',
            uom: 'PCS',
          },
        ]
  );
  const [searchItemQuery, setSearchItemQuery] = useState<string>('');
  const [activeItemSearchLineIdx, setActiveItemSearchLineIdx] = useState<number | null>(null);

  // Step 4: Commercial Terms & Packaging Specs
  const [priceList, setPriceList] = useState<string>(
    initialCustomer?.priceList || 'Tier-1 Automotive OEM Matrix 2026'
  );
  const [paymentTerms, setPaymentTerms] = useState<string>(
    initialCustomer?.paymentTerms || 'Net 30 Days RTGS'
  );
  const [freightTerms, setFreightTerms] = useState<string>(
    initialCustomer?.freightTerms || 'Paid & Billed'
  );
  const [freightAmount, setFreightAmount] = useState<number>(
    initialCustomer?.freightAmount || 4500
  );
  const [packingAmount, setPackingAmount] = useState<number>(
    initialCustomer?.packingAmount || 2000
  );
  const [packagingType, setPackagingType] = useState<string>(
    initialCustomer?.packagingType || 'Corrugated Box with VCI Liner'
  );
  const [packagingInstructions, setPackagingInstructions] = useState<string>(
    initialCustomer?.packagingInstructions ||
      'Standard master carton packaging with polybag liner, layer separators, and barcode identification labels.'
  );
  const [coaRequired, setCoaRequired] = useState<boolean>(
    initialCustomer?.coaRequired ?? true
  );
  const [rohsRequired, setRohsRequired] = useState<boolean>(
    initialCustomer?.rohsRequired ?? true
  );
  const [reachRequired, setReachRequired] = useState<boolean>(
    initialCustomer?.reachRequired ?? false
  );
  const [foodGradeRequired, setFoodGradeRequired] = useState<boolean>(
    initialCustomer?.foodGradeRequired ?? false
  );
  const [batchTraceabilityRequired, setBatchTraceabilityRequired] = useState<boolean>(
    initialCustomer?.batchTraceabilityRequired ?? true
  );

  // Step 5: Transport & EWB Master
  const [transportersList] = useState<TransporterRecord[]>(() =>
    transportMasterService.getTransportersSync()
  );
  const [preferredTransporter, setPreferredTransporter] = useState<string>(
    initialCustomer?.preferredTransporter || 'VRL Logistics Ltd'
  );
  const [transporterGstin, setTransporterGstin] = useState<string>(
    initialCustomer?.transporterGstin || '29AABCV1234F1Z1'
  );
  const [transportMode, setTransportMode] = useState<string>(
    initialCustomer?.transportMode || 'Road'
  );
  const [incoterms, setIncoterms] = useState<string>(
    initialCustomer?.incoterms || 'DAP - Delivered At Place'
  );
  const [dispatchPoint, setDispatchPoint] = useState<string>(
    initialCustomer?.dispatchPoint || 'Plant 1 Gate #2'
  );
  const [deliveryTerms, setDeliveryTerms] = useState<string>(
    initialCustomer?.deliveryTerms || 'Immediate JIT Delivery within 48 Hours'
  );
  const [shippingAddress, setShippingAddress] = useState<string>(
    initialCustomer?.shippingAddress || initialCustomer?.address || ''
  );

  const filteredMasterItems = useMemo(() => {
    const q = searchItemQuery.toLowerCase().trim();
    if (!q) return masterItemsList.slice(0, 10);
    return masterItemsList
      .filter(
        (i) =>
          i.code.toLowerCase().includes(q) ||
          i.name.toLowerCase().includes(q) ||
          (i.type && i.type.toLowerCase().includes(q))
      )
      .slice(0, 10);
  }, [masterItemsList, searchItemQuery]);

  if (!isOpen) return null;

  const handleSelectTransporter = (t: TransporterRecord) => {
    setPreferredTransporter(t.name);
    setTransporterGstin(t.transporterIdGstin);
    if (t.transportModes && t.transportModes.length > 0) {
      setTransportMode(t.transportModes[0]);
    }
  };

  const handleAddContractedLine = () => {
    const candidate = masterItemsList[contractedLines.length % masterItemsList.length];
    const newLine: ContractedCustomerLine = {
      id: `LINE-${Date.now()}`,
      itemCode: candidate ? candidate.code : `FG-${contractedLines.length + 1}`,
      itemName: candidate ? candidate.name : 'Molded Component',
      customerPartNumber: `${code}-${candidate ? candidate.code : contractedLines.length + 1}`,
      unitPrice: 55.0,
      hsn: '39269099',
      gstRatePct: 18,
      polymerGrade: 'Engineering Polymer Grade',
      mouldCode: 'MLD-1001-AUTO',
      uom: candidate?.baseUOM || 'PCS',
    };
    setContractedLines([...contractedLines, newLine]);
  };

  const handleRemoveContractedLine = (idx: number) => {
    if (contractedLines.length <= 1) {
      showToast('At least one finished good product line is required.');
      return;
    }
    setContractedLines(contractedLines.filter((_, i) => i !== idx));
  };

  const validateStep = (s: number): boolean => {
    if (s === 1) {
      if (!name.trim()) {
        setErrorMsg('Company / Legal Name is mandatory.');
        return false;
      }
      if (!gstin.trim() || gstin.trim().length !== 15) {
        setErrorMsg('Valid 15-character GSTIN is mandatory.');
        return false;
      }
      if (!contactPerson.trim() || !mobile.trim()) {
        setErrorMsg('Primary Contact Person and Phone Number are mandatory.');
        return false;
      }
    }
    if (s === 2) {
      if (!poNumber.trim()) {
        setErrorMsg('Customer PO Number cannot be empty.');
        return false;
      }
      if (!poDate.trim()) {
        setErrorMsg('PO Date is mandatory.');
        return false;
      }
    }
    if (s === 3) {
      if (contractedLines.length === 0) {
        setErrorMsg('Add at least one contracted Finished Good line item.');
        return false;
      }
      for (let i = 0; i < contractedLines.length; i++) {
        if (!contractedLines[i].itemCode || contractedLines[i].unitPrice <= 0) {
          setErrorMsg(`Line #${i + 1} must have a valid item code and positive unit price.`);
          return false;
        }
      }
    }
    if (s === 4) {
      if (!priceList.trim() || !paymentTerms.trim() || !packagingType.trim()) {
        setErrorMsg('Price List, Payment Terms, and Packaging Type are required.');
        return false;
      }
    }
    if (s === 5) {
      if (!preferredTransporter.trim() || !shippingAddress.trim()) {
        setErrorMsg('Preferred Transporter and Shipping Address are mandatory.');
        return false;
      }
    }
    setErrorMsg(null);
    return true;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    setStep((prev) => Math.min(5, prev + 1));
  };

  const handleSaveCustomerMaster = (e: React.FormEvent) => {
    e.preventDefault();
    for (let s = 1; s <= 5; s++) {
      if (!validateStep(s)) {
        setStep(s);
        return;
      }
    }

    const poVersionObj = {
      version: poVersionTag || 'v1.0 (Onboarding Master)',
      poNumber: poNumber.trim().toUpperCase(),
      poDate: poDate,
      validFrom: poDate,
      validTill: poExpiryDate,
      changeReason: poChangeReason || 'Customer Master Onboarding',
      changedBy: 'Admin / Commercial Lead',
      changedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      notes: `Contracted lines: ${contractedLines.length} FG items.`,
    };

    const recordToSave: EnrichedCustomerRecord = {
      id: initialCustomer?.id || `CUST-${Date.now()}`,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      shortName: shortName.trim() || name.trim().slice(0, 15),
      segment,
      customerType,
      tier,
      gstin: gstin.trim().toUpperCase(),
      state,
      creditLimit: Number(creditLimit),
      creditDays: Number(creditDays),
      currentBalance: initialCustomer?.currentBalance || 0,
      overdueAmount: initialCustomer?.overdueAmount || 0,
      riskRating,
      contactPerson: contactPerson.trim(),
      mobile: mobile.trim(),
      email: email.trim(),
      address: billingAddress.trim() || shippingAddress.trim(),
      destination: destination.trim() || state,
      tradeTerms: incoterms,
      status: 'active',
      createdOn: initialCustomer?.createdOn || new Date().toISOString().slice(0, 10),
      poNumber: poNumber.trim().toUpperCase(),
      poDate,
      poExpiryDate,
      poVersions: [
        poVersionObj,
        ...(initialCustomer?.poVersions || []).filter((v) => v.poNumber !== poNumber),
      ],
      contractedLines,
      priceList,
      paymentTerms,
      freightTerms,
      freightAmount: Number(freightAmount),
      packingAmount: Number(packingAmount),
      packagingType,
      packagingInstructions,
      coaRequired,
      rohsRequired,
      reachRequired,
      foodGradeRequired,
      batchTraceabilityRequired,
      preferredTransporter,
      transporterGstin,
      transportMode,
      incoterms,
      dispatchPoint,
      deliveryTerms,
      shippingAddress: shippingAddress.trim(),
    };

    const saved = customerMasterService.saveCustomer(recordToSave);
    onCustomerSaved(saved);
    showToast(`✓ Successfully onboarded Customer Master: ${saved.name} (${saved.code})`);
    onClose();
  };

  const stepsList = [
    { num: 1, label: 'Profile & KYC', icon: Building2 },
    { num: 2, label: 'PO & Contract', icon: FileCheck },
    { num: 3, label: 'FG Lines & Tax', icon: Package },
    { num: 4, label: 'Commercials & QC', icon: CreditCard },
    { num: 5, label: 'Transport & EWB', icon: Truck },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold bg-[#0F8B8D]/10 text-[#0F8B8D] px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                Customer Master Onboarding Wizard
              </span>
              <span className="text-[11px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                Code: {code}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 font-['Space_Grotesk'] mt-0.5">
              {initialCustomer ? 'Edit Customer Master & Contract Governance' : 'Onboard New Customer Master (5-Step Enterprise Wizard)'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Tabs */}
        <div className="px-6 py-3 border-b border-slate-100 bg-white grid grid-cols-5 gap-2">
          {stepsList.map((s) => {
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;
            const Icon = s.icon;
            return (
              <div
                key={s.num}
                onClick={() => {
                  if (validateStep(step)) setStep(s.num);
                }}
                className={`cursor-pointer p-2 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                  isCurrent
                    ? 'border-[#0F8B8D] bg-[#0F8B8D]/5 text-[#0F8B8D] font-bold shadow-xs'
                    : isCompleted
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 text-slate-400 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center gap-1 text-[11px] font-mono">
                  <Icon className="w-3.5 h-3.5" />
                  <span>{isCompleted ? '✓ Step ' + s.num : 'Step ' + s.num}</span>
                </div>
                <div className="text-xs truncate font-semibold mt-0.5">{s.label}</div>
              </div>
            );
          })}
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center justify-between">
            <span>⚠️ {errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* STEP 1: Profile & KYC */}
          {step === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 font-medium flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-700 shrink-0" />
                <span>Customer Master KYC &middot; Corporate Identity &amp; Credit Governance</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Customer Code *</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full p-2.5 border rounded-lg font-mono font-bold text-[#0F8B8D] bg-slate-50"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">Company / Legal Entity Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maruti Polymer Components Ltd"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setErrorMsg(null);
                    }}
                    className="w-full p-2.5 border rounded-lg font-bold text-slate-900 focus:ring-1 focus:ring-[#0F8B8D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Industry Segment *</label>
                  <select
                    value={segment}
                    onChange={(e) => setSegment(e.target.value)}
                    className="w-full p-2.5 border rounded-lg bg-white"
                  >
                    <option value="Automotive OEM Tier 1">Automotive OEM Tier 1</option>
                    <option value="FMCG Rigid Packaging">FMCG Rigid Packaging</option>
                    <option value="Electronics Enclosures">Electronics Enclosures</option>
                    <option value="Industrial Components">Industrial Components</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Customer Tier</label>
                  <select
                    value={tier}
                    onChange={(e) => setTier(e.target.value as any)}
                    className="w-full p-2.5 border rounded-lg bg-white"
                  >
                    <option value="Tier 1">Tier 1 Strategic OEM</option>
                    <option value="Tier 2">Tier 2 Sub-Supplier</option>
                    <option value="Tier 3">Tier 3 Direct Distributor</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Initial Risk Rating</label>
                  <select
                    value={riskRating}
                    onChange={(e) => setRiskRating(e.target.value as any)}
                    className="w-full p-2.5 border rounded-lg bg-white font-bold"
                  >
                    <option value="AAA">AAA - Prime Sovereign</option>
                    <option value="AA">AA - Highly Stable</option>
                    <option value="A">A - Moderate Risk</option>
                    <option value="BBB">BBB - High Monitoring</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">15-Digit GSTIN *</label>
                  <input
                    type="text"
                    maxLength={15}
                    placeholder="e.g. 27AAACT2727Q1ZW"
                    value={gstin}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setGstin(val);
                      if (val.length >= 12) setPan(val.slice(2, 12));
                      setErrorMsg(null);
                    }}
                    className="w-full p-2.5 border rounded-lg font-mono font-bold uppercase focus:ring-1 focus:ring-[#0F8B8D]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">PAN Number</label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="e.g. AAACT2727Q"
                    value={pan}
                    onChange={(e) => setPan(e.target.value.toUpperCase())}
                    className="w-full p-2.5 border rounded-lg font-mono font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">State / POS *</label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full p-2.5 border rounded-lg bg-white"
                  >
                    <option value="Maharashtra">Maharashtra (27)</option>
                    <option value="Gujarat">Gujarat (24)</option>
                    <option value="Haryana">Haryana (06)</option>
                    <option value="Tamil Nadu">Tamil Nadu (33)</option>
                    <option value="Karnataka">Karnataka (29)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Sanctioned Credit Limit (₹) *</label>
                  <input
                    type="number"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(Number(e.target.value))}
                    className="w-full p-2.5 border rounded-lg font-bold text-emerald-800"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Credit Days *</label>
                  <input
                    type="number"
                    value={creditDays}
                    onChange={(e) => setCreditDays(Number(e.target.value))}
                    className="w-full p-2.5 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Destination Hub / City</label>
                  <input
                    type="text"
                    placeholder="e.g. Pune Pimpri Auto Cluster"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full p-2.5 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Primary Contact Person *</label>
                  <input
                    type="text"
                    placeholder="e.g. Rajesh Khurana (Procurement Lead)"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full p-2.5 border rounded-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Official Mobile / Phone *</label>
                  <input
                    type="text"
                    placeholder="+91 98220 00000"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full p-2.5 border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Official Email Address *</label>
                  <input
                    type="email"
                    placeholder="procurement@oem-partner.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Registered Billing Address *</label>
                <textarea
                  rows={2}
                  placeholder="Plot / Industrial Area, City, State, PIN"
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  className="w-full p-2.5 border rounded-lg"
                />
              </div>
            </div>
          )}

          {/* STEP 2: PO & Contract Governance */}
          {step === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 font-medium flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>Customer Purchase Order (PO) Governance &amp; Version Traceability</span>
                </div>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-mono font-bold">
                  LIFO Audit
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Customer PO Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PO-TM-2026-9022"
                    value={poNumber}
                    onChange={(e) => {
                      setPoNumber(e.target.value.toUpperCase());
                      setErrorMsg(null);
                    }}
                    className="w-full p-2.5 border rounded-lg font-mono font-bold uppercase text-slate-900 focus:ring-1 focus:ring-[#0F8B8D]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">PO Issue Date *</label>
                  <input
                    type="date"
                    value={poDate}
                    onChange={(e) => setPoDate(e.target.value)}
                    className="w-full p-2.5 border rounded-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">PO Expiry / Renewal Date</label>
                  <input
                    type="date"
                    value={poExpiryDate}
                    onChange={(e) => setPoExpiryDate(e.target.value)}
                    className="w-full p-2.5 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">PO Version / Revision Tag *</label>
                  <input
                    type="text"
                    placeholder="e.g. v1.0 (Initial) or Rev 02 (Price Hike)"
                    value={poVersionTag}
                    onChange={(e) => setPoVersionTag(e.target.value)}
                    className="w-full p-2.5 border rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">PO Amendment Reason / Context *</label>
                  <input
                    type="text"
                    placeholder="e.g. Annual Rate Contract Renewal &amp; Volume Increase"
                    value={poChangeReason}
                    onChange={(e) => setPoChangeReason(e.target.value)}
                    className="w-full p-2.5 border rounded-lg font-medium"
                  />
                </div>
              </div>

              {/* Version History Table */}
              {initialCustomer?.poVersions && initialCustomer.poVersions.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden mt-3">
                  <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 font-bold text-slate-700 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-[#0F8B8D]" /> Previous PO Revision History (LIFO Audited)
                  </div>
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/70 text-slate-600 border-b">
                      <tr>
                        <th className="p-2">Version</th>
                        <th className="p-2">PO #</th>
                        <th className="p-2">Issue Date</th>
                        <th className="p-2">Reason for Amendment</th>
                        <th className="p-2">Changed By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {initialCustomer.poVersions.map((v, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-2 font-mono font-bold text-teal-700">{v.version}</td>
                          <td className="p-2 font-mono font-bold">{v.poNumber}</td>
                          <td className="p-2">{v.poDate}</td>
                          <td className="p-2 text-slate-600">{v.changeReason}</td>
                          <td className="p-2 text-slate-500">{v.changedBy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Contracted Line Items & Tax Info */}
          {step === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#0F8B8D]" /> Contracted Finished Goods Lines &amp; Rates ({contractedLines.length})
                  </h4>
                  <p className="text-slate-500 text-[11px]">
                    Pre-mapped product rates will automatically populate when this customer is selected in sales orders.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddContractedLine}
                  className="px-3 py-1.5 bg-[#0F8B8D] hover:bg-[#0c7072] text-white font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Product Line
                </button>
              </div>

              <div className="space-y-3">
                {contractedLines.map((line, idx) => (
                  <div
                    key={line.id || idx}
                    className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2 relative"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs bg-teal-100 text-teal-800 px-2 py-0.5 rounded">
                        Contracted Item #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveContractedLine(idx)}
                        className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <div className="sm:col-span-2">
                        <label className="font-semibold text-slate-600 block mb-0.5">Select Master Item *</label>
                        <select
                          value={line.itemCode}
                          onChange={(e) => {
                            const found = masterItemsList.find((i) => i.code === e.target.value);
                            const updated = [...contractedLines];
                            updated[idx] = {
                              ...updated[idx],
                              itemCode: e.target.value,
                              itemName: found ? found.name : updated[idx].itemName,
                              customerPartNumber: `${code}-${e.target.value}`,
                              uom: found?.baseUOM || 'PCS',
                            };
                            setContractedLines(updated);
                          }}
                          className="w-full p-2 border rounded-lg bg-white font-bold text-slate-900"
                        >
                          {masterItemsList.slice(0, 30).map((it) => (
                            <option key={it.code} value={it.code}>
                              {it.code} — {it.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="font-semibold text-slate-600 block mb-0.5">Customer Part #</label>
                        <input
                          type="text"
                          value={line.customerPartNumber || ''}
                          onChange={(e) => {
                            const updated = [...contractedLines];
                            updated[idx].customerPartNumber = e.target.value;
                            setContractedLines(updated);
                          }}
                          className="w-full p-2 border rounded-lg font-mono font-semibold"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-600 block mb-0.5">Contract Rate (₹) *</label>
                        <input
                          type="number"
                          value={line.unitPrice}
                          onChange={(e) => {
                            const updated = [...contractedLines];
                            updated[idx].unitPrice = Number(e.target.value);
                            setContractedLines(updated);
                          }}
                          className="w-full p-2 border rounded-lg font-mono font-bold text-[#0F8B8D]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600">
                      <div>
                        <span>HSN: </span>
                        <input
                          type="text"
                          value={line.hsn || '39269099'}
                          onChange={(e) => {
                            const updated = [...contractedLines];
                            updated[idx].hsn = e.target.value;
                            setContractedLines(updated);
                          }}
                          className="p-1 border rounded w-24 font-mono font-bold ml-1"
                        />
                      </div>
                      <div>
                        <span>Polymer: </span>
                        <input
                          type="text"
                          value={line.polymerGrade || 'Engineering Polymer Grade'}
                          onChange={(e) => {
                            const updated = [...contractedLines];
                            updated[idx].polymerGrade = e.target.value;
                            setContractedLines(updated);
                          }}
                          className="p-1 border rounded w-40 ml-1"
                        />
                      </div>
                      <div>
                        <span>Mould Tag: </span>
                        <input
                          type="text"
                          value={line.mouldCode || 'MLD-1001-AUTO'}
                          onChange={(e) => {
                            const updated = [...contractedLines];
                            updated[idx].mouldCode = e.target.value;
                            setContractedLines(updated);
                          }}
                          className="p-1 border rounded w-32 font-mono ml-1"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Commercials & Packaging Specs */}
          {step === 4 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                    Commercial Matrix &amp; Tax Terms
                  </h4>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Price List Matrix *</label>
                    <select
                      value={priceList}
                      onChange={(e) => setPriceList(e.target.value)}
                      className="w-full p-2.5 border rounded-lg bg-white"
                    >
                      <option value="Tier-1 Automotive OEM Matrix 2026">Tier-1 Automotive OEM Matrix 2026</option>
                      <option value="FMCG Rigid Packaging List">FMCG Rigid Packaging List</option>
                      <option value="Standard Domestic List">Standard Domestic List</option>
                      <option value="Inter-State OEM Contract">Inter-State OEM Contract</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Default Payment Terms *</label>
                    <select
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                      className="w-full p-2.5 border rounded-lg bg-white font-bold"
                    >
                      <option value="Advance Payment">100% Advance Payment</option>
                      <option value="Net 30 Days RTGS">Net 30 Days RTGS</option>
                      <option value="Net 45 Days PDC">Net 45 Days PDC</option>
                      <option value="Net 45 Days LC">Net 45 Days LC</option>
                      <option value="Net 60 Days">Net 60 Days</option>
                      <option value="Letter of Credit (LC)">Letter of Credit (LC)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Default Freight (₹)</label>
                      <input
                        type="number"
                        value={freightAmount}
                        onChange={(e) => setFreightAmount(Number(e.target.value))}
                        className="w-full p-2.5 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Packing &amp; Handling (₹)</label>
                      <input
                        type="number"
                        value={packingAmount}
                        onChange={(e) => setPackingAmount(Number(e.target.value))}
                        className="w-full p-2.5 border rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                    Packaging Specifications
                  </h4>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Default Packaging Type *</label>
                    <select
                      value={packagingType}
                      onChange={(e) => setPackagingType(e.target.value)}
                      className="w-full p-2.5 border rounded-lg bg-white"
                    >
                      <option value="Corrugated Box with VCI Liner">Corrugated Box with VCI Liner</option>
                      <option value="Heavy-Duty Corrugated Master Carton">Heavy-Duty Corrugated Master Carton</option>
                      <option value="Returnable Plastic Crate (RPC)">Returnable Plastic Crate (RPC)</option>
                      <option value="Wooden Pallet with Stretch Wrap">Wooden Pallet with Stretch Wrap</option>
                      <option value="Anti-Static ESD Protective Box">Anti-Static ESD Protective Box</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Palletizing &amp; Handling Instructions</label>
                    <textarea
                      rows={3}
                      value={packagingInstructions}
                      onChange={(e) => setPackagingInstructions(e.target.value)}
                      className="w-full p-2.5 border rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2">
                  Mandatory Quality Compliance Requirements
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 p-2 rounded-lg border bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={coaRequired}
                      onChange={(e) => setCoaRequired(e.target.checked)}
                      className="rounded text-[#0F8B8D]"
                    />
                    <span className="font-semibold">Certificate of Analysis (COA)</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rohsRequired}
                      onChange={(e) => setRohsRequired(e.target.checked)}
                      className="rounded text-[#0F8B8D]"
                    />
                    <span className="font-semibold">RoHS Compliance Cert</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reachRequired}
                      onChange={(e) => setReachRequired(e.target.checked)}
                      className="rounded text-[#0F8B8D]"
                    />
                    <span className="font-semibold">REACH SVHC Declaration</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={foodGradeRequired}
                      onChange={(e) => setFoodGradeRequired(e.target.checked)}
                      className="rounded text-[#0F8B8D]"
                    />
                    <span className="font-semibold">Food Grade Migration Test</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={batchTraceabilityRequired}
                      onChange={(e) => setBatchTraceabilityRequired(e.target.checked)}
                      className="rounded text-[#0F8B8D]"
                    />
                    <span className="font-semibold">Mould &amp; Polymer Lot Traceability</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Transport, EWB & Dispatch SLA */}
          {step === 5 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 font-medium flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Logistics Fleet, E-Way Bill Dispatch Point &amp; SLA SLA Configuration</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Preferred Transporter *</label>
                  <select
                    value={preferredTransporter}
                    onChange={(e) => {
                      const found = transportersList.find((t) => t.name === e.target.value);
                      if (found) handleSelectTransporter(found);
                      else setPreferredTransporter(e.target.value);
                    }}
                    className="w-full p-2.5 border rounded-lg bg-white font-bold"
                  >
                    {transportersList.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name} ({t.transporterCode})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Transporter GSTIN / EWB ID</label>
                  <input
                    type="text"
                    value={transporterGstin}
                    onChange={(e) => setTransporterGstin(e.target.value.toUpperCase())}
                    className="w-full p-2.5 border rounded-lg font-mono font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Transport Mode *</label>
                  <select
                    value={transportMode}
                    onChange={(e) => setTransportMode(e.target.value)}
                    className="w-full p-2.5 border rounded-lg bg-white"
                  >
                    <option value="Road">Road Logistics</option>
                    <option value="Rail">Rail Express</option>
                    <option value="Air">Air Freight</option>
                    <option value="Multi-Modal">Multi-Modal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Incoterms *</label>
                  <select
                    value={incoterms}
                    onChange={(e) => setIncoterms(e.target.value)}
                    className="w-full p-2.5 border rounded-lg bg-white font-semibold"
                  >
                    <option value="DAP - Delivered At Place">DAP - Delivered At Place</option>
                    <option value="Ex-Works Factory Gate">Ex-Works Factory Gate</option>
                    <option value="FCA - Free Carrier">FCA - Free Carrier</option>
                    <option value="CPT - Carriage Paid To">CPT - Carriage Paid To</option>
                    <option value="DDP - Delivered Duty Paid">DDP - Delivered Duty Paid</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Default Dispatch Point *</label>
                  <input
                    type="text"
                    value={dispatchPoint}
                    onChange={(e) => setDispatchPoint(e.target.value)}
                    className="w-full p-2.5 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Delivery SLA Terms *</label>
                  <input
                    type="text"
                    value={deliveryTerms}
                    onChange={(e) => setDeliveryTerms(e.target.value)}
                    className="w-full p-2.5 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Shipping Delivery Address *</label>
                <textarea
                  rows={2}
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full p-2.5 border rounded-lg"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => Math.max(1, prev - 1))}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
          ) : (
            <div></div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2 bg-[#0F8B8D] hover:bg-[#0c7072] text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                Continue to Step {step + 1} <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveCustomerMaster}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Check className="w-4 h-4" /> Save &amp; Register Customer Master
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
