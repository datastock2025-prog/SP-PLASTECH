import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
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
  Plus,
  Trash2,
  QrCode,
  Printer,
  Download,
  ExternalLink,
  Clock,
  ChevronRight,
  Info,
  Search,
  X,
  Zap,
  Check,
  Copy,
  Scale,
  Hash,
  RefreshCw,
} from 'lucide-react';
import {
  PlasticSalesOrder,
  DeliveryNoteChallan,
  DeliveryChallanItem,
  EInvoiceRecord,
  EWayBillRecord,
  GatePassRecord,
  FgBatchStock,
} from '../../types/salesOrderDeliveryTypes';
import { INITIAL_FG_BATCHES } from '../../data/salesOrderDeliveryData';

// Standard Finished Goods Master Catalog for adding ad-hoc or catalog items
export interface CatalogItem {
  itemCode: string;
  itemName: string;
  hsn: string;
  uom: string;
  standardRate: number;
  category: string;
  defaultBatchPrefix: string;
  defaultBin: string;
}

const FINISHED_GOODS_CATALOG: CatalogItem[] = [
  {
    itemCode: 'FG-AUTO-012',
    itemName: 'ABS Dashboard Trim Bezel (Matte Black)',
    hsn: '39269099',
    uom: 'PCS',
    standardRate: 55.0,
    category: 'Automotive Interior',
    defaultBatchPrefix: 'B-2026-ABS',
    defaultBin: 'BIN-08',
  },
  {
    itemCode: 'FG-AUTO-045',
    itemName: 'PP Air Duct Housing - Front Left',
    hsn: '39269099',
    uom: 'PCS',
    standardRate: 42.0,
    category: 'Automotive Under-hood',
    defaultBatchPrefix: 'B-2026-PP',
    defaultBin: 'BIN-02',
  },
  {
    itemCode: 'FG-FLIP-28',
    itemName: '28mm PP Flip-Top Dispenser Cap (Parachute Blue)',
    hsn: '39235010',
    uom: 'PCS',
    standardRate: 15.5,
    category: 'FMCG Closures',
    defaultBatchPrefix: 'B-2026-FLP',
    defaultBin: 'BIN-14',
  },
  {
    itemCode: 'FG-MOTO-088',
    itemName: 'Nylon Front Fork Guard (UV Stabilized)',
    hsn: '39269099',
    uom: 'PCS',
    standardRate: 76.0,
    category: '2-Wheeler Components',
    defaultBatchPrefix: 'B-2026-NYL',
    defaultBin: 'BIN-19',
  },
  {
    itemCode: 'FG-CASING-200',
    itemName: 'Polycarbonate Electric Meter Base Casing',
    hsn: '85381010',
    uom: 'PCS',
    standardRate: 125.0,
    category: 'Electrical & Utilities',
    defaultBatchPrefix: 'B-2026-PC',
    defaultBin: 'BIN-04',
  },
  {
    itemCode: 'FG-CTN-500',
    itemName: '500ml HDPE Heavy-Duty Chemical Bottle',
    hsn: '39233090',
    uom: 'PCS',
    standardRate: 24.0,
    category: 'Rigid Packaging',
    defaultBatchPrefix: 'B-2026-HDPE',
    defaultBin: 'BIN-11',
  },
  {
    itemCode: 'FG-PAL-010',
    itemName: 'Heavy Duty Plastic Pallet (1200x1000mm)',
    hsn: '39239090',
    uom: 'PCS',
    standardRate: 850.0,
    category: 'Industrial Logistics',
    defaultBatchPrefix: 'B-2026-PAL',
    defaultBin: 'BIN-BAY-3',
  },
  {
    itemCode: 'FG-BKT-010',
    itemName: '10L Industrial PP Bucket with Metal Handle',
    hsn: '39241090',
    uom: 'PCS',
    standardRate: 110.0,
    category: 'Industrial Containers',
    defaultBatchPrefix: 'B-2026-BKT',
    defaultBin: 'BIN-07',
  },
];

export interface EditableChallanItem {
  id: string;
  soLineNumber?: number;
  itemCode: string;
  itemName: string;
  hsn: string;
  orderedQty?: number;
  remainingQty?: number;
  availableStock: number;
  dispatchQty: number;
  uom: string;
  unitPrice: number;
  taxRatePct: number;
  batchLot: string;
  locationCode: string;
  binCode?: string;
  coaNumber?: string;
  isCustomAdded?: boolean;
}

interface CreateDeliveryChallanProps {
  salesOrders: PlasticSalesOrder[];
  preSelectedSoId?: string;
  onSaveDelivery: (
    delivery: DeliveryNoteChallan,
    eInvoice?: EInvoiceRecord,
    eWayBill?: EWayBillRecord,
    gatePass?: GatePassRecord
  ) => void;
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

  // Step 2: Line Items List (supports dynamic additions & modifications)
  const [items, setItems] = useState<EditableChallanItem[]>(() => {
    if (!activeSo) return [];
    return activeSo.lines.map((l, idx) => ({
      id: `so-line-${l.itemCode}-${idx}`,
      soLineNumber: idx + 1,
      itemCode: l.itemCode,
      itemName: l.itemName,
      hsn: l.hsn || '39269099',
      orderedQty: l.orderedQty,
      remainingQty: l.remainingQty,
      availableStock: l.availableStock || 5000,
      dispatchQty: l.remainingQty > 0 ? l.remainingQty : l.orderedQty,
      uom: l.uom || 'PCS',
      unitPrice: l.unitPrice || 50,
      taxRatePct: l.gstRatePct || 18,
      batchLot: `B-2026-${l.itemCode.replace('FG-', '')}-01`,
      locationCode: 'LOC-A1-04',
      binCode: 'BIN-08',
      coaNumber: `COA-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      isCustomAdded: false,
    }));
  });

  // Packaging & Weight
  const [packageCount, setPackageCount] = useState(120);
  const [packagingType, setPackagingType] = useState('Corrugated Cartons on Wooden Pallets');
  const [tareWeight, setTareWeight] = useState(4200);
  const [grossWeight, setGrossWeight] = useState(5650);

  // Step 3: Transport & Vehicle
  const [transportMode, setTransportMode] = useState<'Road' | 'Rail' | 'Air'>('Road');
  const [transporterName, setTransporterName] = useState('VRL Logistics Ltd');
  const [transporterGstin, setTransporterGstin] = useState('29AABCV2211C1Z0');
  const [vehicleNumber, setVehicleNumber] = useState('MH-14-GH-8821');
  const [driverName, setDriverName] = useState('Suresh Patil');
  const [driverPhone, setDriverPhone] = useState('+91 98220 19281');
  const [driverLicense, setDriverLicense] = useState('MH-14-2015-009812');
  const [lrNumber, setLrNumber] = useState(`LR-${Math.floor(100000 + Math.random() * 900000)}`);
  const [approxDistanceKm, setApproxDistanceKm] = useState(140);

  // Step 4: Compliance & Tax
  const [challanType, setChallanType] = useState<'Tax Invoice-cum-Challan' | 'Delivery Challan' | 'Job Work Challan'>('Tax Invoice-cum-Challan');
  const [autoEInvoice, setAutoEInvoice] = useState(true);
  const [autoEwb, setAutoEwb] = useState(true);
  const [ewbPartB, setEwbPartB] = useState(true);
  const [autoGatePass, setAutoGatePass] = useState(true);
  const [transportReason, setTransportReason] = useState('Supply of Finished Goods under Sales Contract');

  // Add Item Modal State
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<CatalogItem | null>(FINISHED_GOODS_CATALOG[0]);
  const [newItemQty, setNewItemQty] = useState(500);
  const [newItemRate, setNewItemRate] = useState(FINISHED_GOODS_CATALOG[0].standardRate);
  const [newItemTaxRate, setNewItemTaxRate] = useState(18);
  const [newItemBatch, setNewItemBatch] = useState('B-2026-AUTO-01');
  const [newItemLocation, setNewItemLocation] = useState('LOC-A1-04');
  const [customItemMode, setCustomItemMode] = useState(false);
  const [customItemCode, setCustomItemCode] = useState('');
  const [customItemName, setCustomItemName] = useState('');
  const [customItemHsn, setCustomItemHsn] = useState('39269099');
  const [customItemUom, setCustomItemUom] = useState('PCS');

  // Batch Selection Dropdown helper
  const [activeBatchModalItemId, setActiveBatchModalItemId] = useState<string | null>(null);

  // All-in-One 1-Click Execution Progress / Success Modal
  const [isGeneratingAllInOne, setIsGeneratingAllInOne] = useState(false);
  const [generationPhase, setGenerationPhase] = useState<number>(0);
  const [generatedResult, setGeneratedResult] = useState<{
    delivery: DeliveryNoteChallan;
    eInvoice: EInvoiceRecord;
    eWayBill: EWayBillRecord;
    gatePass: GatePassRecord;
  } | null>(null);
  const [activeDossierTab, setActiveDossierTab] = useState<'challan' | 'eInvoice' | 'eWayBill' | 'gatePass'>('challan');

  // When SO changes, re-load SO lines but retain any custom lines added
  const handleSoChange = (soId: string) => {
    setSelectedSoId(soId);
    const newSo = salesOrders.find((s) => s.id === soId);
    if (newSo) {
      const soLines: EditableChallanItem[] = newSo.lines.map((l, idx) => ({
        id: `so-line-${l.itemCode}-${idx}`,
        soLineNumber: idx + 1,
        itemCode: l.itemCode,
        itemName: l.itemName,
        hsn: l.hsn || '39269099',
        orderedQty: l.orderedQty,
        remainingQty: l.remainingQty,
        availableStock: l.availableStock || 5000,
        dispatchQty: l.remainingQty > 0 ? l.remainingQty : l.orderedQty,
        uom: l.uom || 'PCS',
        unitPrice: l.unitPrice || 50,
        taxRatePct: l.gstRatePct || 18,
        batchLot: `B-2026-${l.itemCode.replace('FG-', '')}-01`,
        locationCode: 'LOC-A1-04',
        binCode: 'BIN-08',
        coaNumber: `COA-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        isCustomAdded: false,
      }));
      setItems(soLines);
    }
  };

  // Live Calculations
  const calculatedTaxable = useMemo(() => {
    return items.reduce((sum, it) => sum + (it.dispatchQty || 0) * (it.unitPrice || 0), 0);
  }, [items]);

  const isInterState = activeSo?.billingAddress?.state && activeSo.billingAddress.state !== 'Maharashtra';
  const calculatedCgst = isInterState ? 0 : calculatedTaxable * 0.09;
  const calculatedSgst = isInterState ? 0 : calculatedTaxable * 0.09;
  const calculatedIgst = isInterState ? calculatedTaxable * 0.18 : 0;
  const calculatedTotal = calculatedTaxable + calculatedCgst + calculatedSgst + calculatedIgst;
  const calculatedNetWeight = Math.max(0, grossWeight - tareWeight);
  const totalDispatchedUnits = items.reduce((sum, it) => sum + (it.dispatchQty || 0), 0);

  // Steps Navigation
  const steps = [
    { num: 1, label: 'Order & Customer' },
    { num: 2, label: 'Items & Batch FEFO' },
    { num: 3, label: 'Transport & Vehicle' },
    { num: 4, label: 'Compliance & Tax' },
    { num: 5, label: 'Review & Dispatch' },
  ];

  // Item List Actions
  const handleUpdateItemQty = (id: string, qty: number) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, dispatchQty: Math.max(0, qty) } : it))
    );
  };

  const handleUpdateItemRate = (id: string, rate: number) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, unitPrice: Math.max(0, rate) } : it))
    );
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      showToast('A delivery challan must contain at least 1 item.');
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
    showToast('Item removed from dispatch list.');
  };

  const handleSelectBatch = (itemId: string, batchStock: FgBatchStock) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === itemId
          ? {
              ...it,
              batchLot: batchStock.batchNumber,
              locationCode: batchStock.locationCode,
              binCode: batchStock.binCode,
              coaNumber: batchStock.coaNumber,
            }
          : it
      )
    );
    setActiveBatchModalItemId(null);
    showToast(`Batch ${batchStock.batchNumber} assigned with COA ${batchStock.coaNumber}.`);
  };

  const handleAddItemFromModal = () => {
    if (customItemMode) {
      if (!customItemName.trim()) {
        showToast('Please enter an item name.');
        return;
      }
      const code = customItemCode.trim() || `FG-CUST-${Math.floor(100 + Math.random() * 900)}`;
      const newItem: EditableChallanItem = {
        id: `custom-item-${Date.now()}`,
        soLineNumber: items.length + 1,
        itemCode: code,
        itemName: customItemName.trim(),
        hsn: customItemHsn || '39269099',
        availableStock: 10000,
        dispatchQty: newItemQty,
        uom: customItemUom || 'PCS',
        unitPrice: newItemRate,
        taxRatePct: newItemTaxRate,
        batchLot: newItemBatch || `B-2026-${code.replace('FG-', '')}-01`,
        locationCode: newItemLocation || 'LOC-A1-04',
        binCode: 'BIN-01',
        coaNumber: `COA-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        isCustomAdded: true,
      };
      setItems((prev) => [...prev, newItem]);
      showToast(`Added ${newItem.itemName} (${newItem.dispatchQty} ${newItem.uom})`);
    } else if (selectedCatalogItem) {
      // Check if already in list
      const existing = items.find((i) => i.itemCode === selectedCatalogItem.itemCode);
      if (existing) {
        handleUpdateItemQty(existing.id, existing.dispatchQty + newItemQty);
        showToast(`Updated quantity for ${selectedCatalogItem.itemName}`);
      } else {
        const newItem: EditableChallanItem = {
          id: `catalog-${selectedCatalogItem.itemCode}-${Date.now()}`,
          soLineNumber: items.length + 1,
          itemCode: selectedCatalogItem.itemCode,
          itemName: selectedCatalogItem.itemName,
          hsn: selectedCatalogItem.hsn,
          availableStock: 8000,
          dispatchQty: newItemQty,
          uom: selectedCatalogItem.uom,
          unitPrice: newItemRate || selectedCatalogItem.standardRate,
          taxRatePct: newItemTaxRate,
          batchLot: newItemBatch || `${selectedCatalogItem.defaultBatchPrefix}-01`,
          locationCode: newItemLocation || 'LOC-A1-04',
          binCode: selectedCatalogItem.defaultBin,
          coaNumber: `COA-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          isCustomAdded: true,
        };
        setItems((prev) => [...prev, newItem]);
        showToast(`Added ${newItem.itemName} to challan.`);
      }
    }
    setIsAddItemModalOpen(false);
  };

  // Filter catalog items
  const filteredCatalog = useMemo(() => {
    if (!catalogSearch) return FINISHED_GOODS_CATALOG;
    const q = catalogSearch.toLowerCase();
    return FINISHED_GOODS_CATALOG.filter(
      (c) =>
        c.itemCode.toLowerCase().includes(q) ||
        c.itemName.toLowerCase().includes(q) ||
        c.hsn.includes(q) ||
        c.category.toLowerCase().includes(q)
    );
  }, [catalogSearch]);

  // THE MASTER FUNCTION: "ONE FINAL CLICK" ALL-IN-ONE DISPATCH GENERATION
  const executeAllInOneDispatch = (mode: 'all-in-one' | 'standard' | 'note-only') => {
    if (items.length === 0 || calculatedTaxable <= 0) {
      showToast('Cannot dispatch: At least 1 item with quantity > 0 is required.');
      return;
    }

    if (!vehicleNumber.trim()) {
      showToast('Please specify a valid vehicle registration number.');
      setCurrentStep(3);
      return;
    }

    const includeEInv = mode === 'all-in-one' || (mode === 'standard' && autoEInvoice);
    const includeEwb = mode === 'all-in-one' || (mode === 'standard' && autoEwb);
    const includeGp = mode === 'all-in-one' || (mode === 'standard' && autoGatePass);

    setIsGeneratingAllInOne(true);
    setGenerationPhase(1);

    const deliveryId = `DN-${Math.floor(4000 + Math.random() * 999)}`;
    const invoiceNumber = `INV-2026-09-${Math.floor(100 + Math.random() * 899)}`;
    const irnHash = `a${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`.substring(0, 64);
    const ackNumber = `1120260900${Math.floor(10000 + Math.random() * 90000)}`;
    const ewbNumber = `2410${Math.floor(10000000 + Math.random() * 90000000)}`;
    const gatePassNumber = `GP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const sealNumber = `SEAL-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const challanItems: DeliveryChallanItem[] = items.map((it, idx) => ({
      soLineNumber: it.soLineNumber || idx + 1,
      itemCode: it.itemCode,
      itemName: it.itemName,
      orderedQty: it.orderedQty || it.dispatchQty,
      deliveredQty: it.dispatchQty,
      remainingQty: Math.max(0, (it.orderedQty || it.dispatchQty) - it.dispatchQty),
      requestedQty: it.dispatchQty,
      pickedQty: it.dispatchQty,
      packedQty: it.dispatchQty,
      uom: it.uom,
      plant: activeSo?.plant || 'Plant 1 - Pimpri Auto-Hub',
      fgStore: activeSo?.fgStore || 'FG-Automotive Cell',
      batchLot: it.batchLot,
      locationCode: it.locationCode,
      hsn: it.hsn,
      unitPrice: it.unitPrice,
      taxRatePct: it.taxRatePct,
      lineTotal: it.dispatchQty * it.unitPrice,
      pickStatus: 'Picked',
    }));

    const newDelivery: DeliveryNoteChallan = {
      id: deliveryId,
      salesOrderId: activeSo?.id || 'SO-DIRECT',
      salesOrderType: activeSo?.orderType || 'Daily Sales Order',
      deliveryDate: '2026-09-15',
      dispatchDate: '2026-09-15',
      customer: activeSo?.customer || 'Customer Enterprise',
      customerGstin: activeSo?.customerGstin || '27AAACT2727Q1ZW',
      shipToAddress:
        (activeSo?.shippingAddress?.line1 || 'Plot 42, Sector 10, MIDC') +
        ', ' +
        (activeSo?.shippingAddress?.city || 'Pune'),
      shipToGstin: activeSo?.shippingAddress?.gstin || activeSo?.customerGstin || '27AAACT2727Q1ZW',
      placeOfSupply: activeSo?.billingAddress?.placeOfSupply || '27-Maharashtra',
      type: challanType === 'Job Work Challan' ? 'Delivery Challan' : 'Normal Supply',
      plant: activeSo?.plant || 'Plant 1 - Pimpri Auto-Hub',
      fgStore: activeSo?.fgStore || 'FG-Automotive Cell',
      status: includeGp ? 'Gate Pass Created' : 'Ready for Dispatch',
      transportMode,
      vehicleNumber,
      transporterName,
      transporterIdGstin: transporterGstin,
      driverName,
      driverMobile: driverPhone,
      lrNumber,
      dispatchPoint: activeSo?.shippingAddress?.dispatchPoint || 'Gate 2 Loading Dock Bay 4',
      estimatedDistanceKm: approxDistanceKm,
      expectedDeparture: '2026-09-15 14:00',
      expectedArrival: '2026-09-15 18:30',
      eInvoiceStatus: includeEInv ? 'Generated' : 'Pending',
      irn: includeEInv ? irnHash : undefined,
      ackNumber: includeEInv ? ackNumber : undefined,
      ackDate: includeEInv ? '2026-09-15 12:15:00' : undefined,
      eWayBillStatus: includeEwb ? 'Generated' : 'Pending',
      ewbNumber: includeEwb ? ewbNumber : undefined,
      ewbDate: includeEwb ? '2026-09-15 12:16:00' : undefined,
      ewbValidUntil: includeEwb ? '2026-09-18 23:59:59' : undefined,
      ewbPartA: includeEwb,
      ewbPartB: includeEwb,
      invoiceNumber,
      invoiceDate: '2026-09-15',
      taxableValue: calculatedTaxable,
      cgstAmount: calculatedCgst,
      sgstAmount: calculatedSgst,
      igstAmount: calculatedIgst,
      invoiceValue: calculatedTotal,
      packageCount,
      grossWeightKg: grossWeight,
      netWeightKg: calculatedNetWeight,
      gatePassNumber,
      gatePassStatus: includeGp ? 'Generated' : 'Draft',
      sealNumber,
      podStatus: 'Pending',
      items: challanItems,
      packages: [
        {
          packageNumber: 'PKG-01',
          packageType: packagingType,
          weightKg: grossWeight,
          itemCount: totalDispatchedUnits,
        },
      ],
      auditTrail: [
        {
          action: '1-Click All-in-One Statutory Issuance',
          user: 'Dispatch Compliance Manager',
          timestamp: '2026-09-15 12:15:00',
          remarks: `Delivery Note ${deliveryId}, IRN ${irnHash.substring(0, 8)}..., E-Way Bill ${ewbNumber}, Gate Pass ${gatePassNumber} issued synchronously.`,
        },
      ],
    };

    const newEInvoice: EInvoiceRecord = {
      invoiceNumber,
      deliveryNoteNumber: deliveryId,
      salesOrderNumber: activeSo?.id || 'SO-5001',
      customer: activeSo?.customer || 'Customer Enterprise',
      customerGstin: activeSo?.customerGstin || '27AAACT2727Q1ZW',
      supplierGstin: '27AABCP1122D1Z4',
      invoiceDate: '2026-09-15',
      invoiceValue: calculatedTotal,
      taxableValue: calculatedTaxable,
      placeOfSupply: activeSo?.billingAddress?.placeOfSupply || '27-Maharashtra',
      invoiceType: 'B2B',
      hsnCode: items[0]?.hsn || '39269099',
      cgst: calculatedCgst,
      sgst: calculatedSgst,
      igst: calculatedIgst,
      cess: 0,
      irn: irnHash,
      ackNumber,
      ackDate: '2026-09-15 12:15:00',
      status: 'Generated',
      qrCodeUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="%23f3f4f6"/><text x="10" y="65" font-family="monospace" font-size="9" fill="%23111">NIC-IRP-QR-SIGNED</text></svg>',
      eWayBillLinked: true,
      apiLogs: [
        {
          timestamp: '2026-09-15 12:15:00',
          endpoint: 'https://einvoice1.gst.gov.in/api/v1/GenerateIRN',
          status: 200,
          message: 'IRN generated and digitally signed by NIC IRP Portal',
        },
      ],
    };

    const newEWayBill: EWayBillRecord = {
      ewbNumber,
      sourceDocument: 'Invoice',
      documentNumber: invoiceNumber,
      customer: activeSo?.customer || 'Customer Enterprise',
      customerGstin: activeSo?.customerGstin || '27AAACT2727Q1ZW',
      supplierGstin: '27AABCP1122D1Z4',
      dispatchDate: '2026-09-15',
      validUntil: '2026-09-18 23:59:59',
      hoursRemaining: 72,
      transporterName,
      transporterId: transporterGstin,
      vehicleNumber,
      transportMode,
      distanceKm: approxDistanceKm,
      status: 'Generated',
      subSupplyType: 'Supply',
      reasonForTransportation: 'Supply',
      dispatchFrom: 'Plant 1 - Pimpri, Pune, Maharashtra (PIN: 411018)',
      dispatchTo: `${activeSo?.shippingAddress?.line1 || 'Plant Unit'}, ${activeSo?.shippingAddress?.city || 'Pune'}`,
      driverName,
      driverMobile: driverPhone,
      lrNumber,
      qrCodeUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="%23f3f4f6"/><text x="10" y="65" font-family="monospace" font-size="9" fill="%23111">EWB-QR-PORTAL</text></svg>',
      vehicleHistory: [
        {
          vehicleNumber,
          fromPlace: 'Pune Plant 1',
          updatedOn: '2026-09-15 12:16:00',
          user: 'Dispatch Automation Officer',
          reason: 'Initial Vehicle Part-B Assignment',
        },
      ],
      isConsolidated: false,
    };

    const newGatePass: GatePassRecord = {
      id: gatePassNumber,
      gatePassNumber,
      deliveryNoteNumber: deliveryId,
      deliveryNoteId: deliveryId,
      invoiceOrChallanNumber: invoiceNumber,
      vehicleNumber,
      driverName,
      driverMobile: driverPhone,
      driverPhone,
      transporter: transporterName,
      transporterName,
      gateNumber: 'Gate 2 (Outward Bay 4)',
      ewbNumber,
      lrNumber,
      sealNumber,
      packageCount,
      totalPackages: packageCount,
      grossWeightKg: grossWeight,
      departureTime: '2026-09-15 14:00',
      securityVerifiedBy: 'Security Officer Gate 2',
      dispatchApprovedBy: 'Plant Dispatch Head',
      status: 'Generated',
      securityCheckStatus: 'Cleared',
      vehiclePhotoCaptured: true,
      sealPhotoCaptured: true,
      ewbQrScanned: true,
      eInvoiceQrVerified: true,
      remarks: 'All 4 statutory records synchronized in single transaction.',
    };

    // Sequential simulation animation
    setTimeout(() => {
      setGenerationPhase(2);
      setTimeout(() => {
        setGenerationPhase(3);
        setTimeout(() => {
          setGenerationPhase(4);
          setTimeout(() => {
            setIsGeneratingAllInOne(false);
            setGeneratedResult({
              delivery: newDelivery,
              eInvoice: newEInvoice,
              eWayBill: newEWayBill,
              gatePass: newGatePass,
            });
            showToast('All 4 statutory documents generated synchronously!');
          }, 450);
        }, 400);
      }, 400);
    }, 450);
  };

  const handleCommitSavedResult = () => {
    if (!generatedResult) return;
    onSaveDelivery(
      generatedResult.delivery,
      generatedResult.eInvoice,
      generatedResult.eWayBill,
      generatedResult.gatePass
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6 space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors"
            title="Return to Delivery Register"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                GST Rule 55 &amp; IRN Compliant
              </span>
              <span className="text-xs text-gray-400 font-mono">SO: {activeSo?.id || 'DIRECT'}</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mt-0.5 tracking-tight">
              Create Outward Delivery Note &amp; Statutory Dispatch
            </h1>
            <p className="text-xs text-gray-500">
              Generate 3-Ply Delivery Challan, NIC E-Invoice (IRN), E-Way Bill (Part A+B), and Security Gate Pass in one unified flow.
            </p>
          </div>
        </div>

        {/* Hero Quick Action: 1-Click All-in-One Generator Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => executeAllInOneDispatch('all-in-one')}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0F8B8D] hover:bg-[#0c7274] text-white rounded-xl text-xs font-bold shadow-md shadow-teal-700/15 hover:shadow-lg transition-all transform active:scale-95"
            title="Generate Note + E-Invoice + E-Way Bill + Gate Pass synchronously"
          >
            <Zap className="w-4 h-4 fill-amber-300 text-amber-300 animate-pulse" />
            <span>⚡ 1-Click All-in-One Dispatch</span>
            <span className="bg-teal-900/40 px-2 py-0.5 rounded text-[11px] font-mono">
              ₹{calculatedTotal.toLocaleString()}
            </span>
          </button>
        </div>
      </div>

      {/* Step Indicators Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-1.5 bg-gray-50/80 rounded-xl border border-gray-200">
        {steps.map((s) => (
          <button
            key={s.num}
            onClick={() => setCurrentStep(s.num)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              currentStep === s.num
                ? 'bg-[#14213D] text-white shadow-xs'
                : currentStep > s.num
                ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep === s.num
                  ? 'bg-white text-[#14213D]'
                  : currentStep > s.num
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {currentStep > s.num ? <Check className="w-3 h-3" /> : s.num}
            </span>
            <span className="truncate">{s.label}</span>
          </button>
        ))}
      </div>

      {/* STEP 1: ORDER & CUSTOMER SELECTION */}
      {currentStep === 1 && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
              <label className="text-xs font-bold text-gray-800 uppercase tracking-wider block">
                Select Source Sales Order to Fulfill *
              </label>
              <select
                value={selectedSoId}
                onChange={(e) => handleSoChange(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-hidden"
              >
                {salesOrders.map((so) => (
                  <option key={so.id} value={so.id}>
                    {so.id} &bull; {so.customer} &bull; PO: {so.customerPoNumber} ({so.lines.length} lines)
                  </option>
                ))}
              </select>
              <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                <span>Order Type: <strong className="text-gray-800">{activeSo?.orderType || 'Daily Sales Order'}</strong></span>
                <span>Payment: <strong className="text-gray-800">{activeSo?.paymentTerms || '30 Days PDC'}</strong></span>
              </div>
            </div>

            <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-200 space-y-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Consignee Legal Entity
              </span>
              <div className="text-base font-bold text-gray-900">{activeSo?.customer}</div>
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div>
                  <span className="text-gray-400 block text-[10px]">GSTIN</span>
                  <span className="font-mono font-semibold text-gray-800">{activeSo?.customerGstin}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Place of Supply</span>
                  <span className="font-semibold text-gray-800">{activeSo?.billingAddress?.placeOfSupply || '27-Maharashtra'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-teal-50/50 rounded-xl border border-teal-200">
            <div>
              <span className="text-teal-900 font-bold text-xs">Origin Dispatch Plant</span>
              <div className="text-sm font-semibold text-gray-900 mt-0.5">{activeSo?.plant || 'Plant 1 - Pimpri Auto-Hub'}</div>
              <div className="text-[11px] text-gray-500">GSTIN: 27AABCP1122D1Z4</div>
            </div>
            <div>
              <span className="text-teal-900 font-bold text-xs">Origin FG Warehouse Store</span>
              <div className="text-sm font-semibold text-gray-900 mt-0.5">{activeSo?.fgStore || 'FG-Automotive Cell'}</div>
              <div className="text-[11px] text-gray-500">Primary High-Bay Pallet Store</div>
            </div>
            <div>
              <span className="text-teal-900 font-bold text-xs">Customer Credit Status</span>
              <div className="text-emerald-700 font-bold text-sm mt-0.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>APPROVED (₹{(((activeSo?.availableCredit || 0)) / 100000).toFixed(1)}L Avail)</span>
              </div>
              <div className="text-[11px] text-gray-500">Zero Overdue Invoices</div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: ITEMS & BATCH FEFO WITH "+ ADD ITEM" BUTTON */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 text-sm tracking-tight">
                  Dispatch Line Items &amp; FEFO Batches
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {items.length} {items.length === 1 ? 'Item' : 'Items'} Listed
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Configure dispatch quantities, assign inspected batches with COA, or add extra items to this consignment.
              </p>
            </div>

            {/* THE REQUESTED "+ ADD ITEM" BUTTON */}
            <button
              onClick={() => {
                setCustomItemMode(false);
                setSelectedCatalogItem(FINISHED_GOODS_CATALOG[0]);
                setNewItemQty(500);
                setNewItemRate(FINISHED_GOODS_CATALOG[0].standardRate);
                setNewItemTaxRate(18);
                setNewItemBatch('B-2026-ABS-01');
                setNewItemLocation('LOC-A1-04');
                setIsAddItemModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#0F8B8D] hover:bg-[#0c7274] text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Item</span>
            </button>
          </div>

          {/* Items Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-semibold uppercase text-[11px] border-b border-gray-200">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Item Code &amp; Description</th>
                  <th className="p-3">HSN Code</th>
                  <th className="p-3 text-right">Available</th>
                  <th className="p-3 text-right w-32">Dispatch Qty</th>
                  <th className="p-3">Batch / FEFO / COA</th>
                  <th className="p-3 text-right">Rate (₹)</th>
                  <th className="p-3 text-right">Taxable (₹)</th>
                  <th className="p-3 text-center w-12">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((it, idx) => {
                  const lineTaxable = (it.dispatchQty || 0) * (it.unitPrice || 0);
                  return (
                    <tr key={it.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="p-3 font-mono text-gray-400 font-semibold">{idx + 1}</td>
                      <td className="p-3">
                        <div className="font-bold text-gray-900">{it.itemName}</div>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono mt-0.5">
                          <span>{it.itemCode}</span>
                          {it.isCustomAdded && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 font-sans font-semibold">
                              Added Extra
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 font-mono text-gray-600">{it.hsn}</td>
                      <td className="p-3 text-right font-mono font-semibold text-emerald-700">
                        {it.availableStock.toLocaleString()} {it.uom}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            min="1"
                            value={it.dispatchQty}
                            onChange={(e) => handleUpdateItemQty(it.id, Number(e.target.value))}
                            className="w-24 text-right border border-gray-300 rounded p-1.5 font-bold font-mono text-gray-900 focus:ring-1 focus:ring-teal-500 outline-hidden"
                          />
                          <span className="text-[10px] text-gray-400 font-medium">{it.uom}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-mono font-bold text-gray-900">{it.batchLot}</div>
                            <div className="text-[10px] text-gray-400 font-mono">
                              {it.locationCode} &bull; {it.coaNumber || 'COA Verified'}
                            </div>
                          </div>
                          <button
                            onClick={() => setActiveBatchModalItemId(it.id)}
                            className="text-[10px] text-teal-700 hover:text-teal-900 font-semibold underline px-1"
                            title="Pick from available FEFO stock"
                          >
                            Change
                          </button>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <input
                          type="number"
                          step="0.5"
                          value={it.unitPrice}
                          onChange={(e) => handleUpdateItemRate(it.id, Number(e.target.value))}
                          className="w-20 text-right border border-gray-300 rounded p-1 font-mono text-gray-800 text-xs"
                        />
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-gray-900">
                        ₹{lineTaxable.toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleRemoveItem(it.id)}
                          className="p-1 text-gray-400 hover:text-rose-600 rounded transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Consignment Packaging & Weight Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-gray-50/90 p-4 rounded-xl border border-gray-200 text-xs">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Total Packages (Boxes / Pallets)</label>
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={packageCount}
                  onChange={(e) => setPackageCount(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg p-2 font-bold font-mono text-gray-900 bg-white"
                />
              </div>
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">Packaging Protocol</label>
              <input
                type="text"
                value={packagingType}
                onChange={(e) => setPackagingType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-gray-900 bg-white font-medium"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">Tare Weight (Truck/Pallet - Kg)</label>
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={tareWeight}
                  onChange={(e) => setTareWeight(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg p-2 font-mono text-gray-900 bg-white"
                />
              </div>
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">Gross Weight (Weighbridge - Kg)</label>
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-600" />
                <input
                  type="number"
                  value={grossWeight}
                  onChange={(e) => setGrossWeight(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg p-2 font-mono font-bold text-gray-900 bg-white"
                />
              </div>
              <div className="text-[10px] text-emerald-700 font-bold mt-1">
                Net Weight: {calculatedNetWeight.toLocaleString()} Kg
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: TRANSPORT & VEHICLE LOGISTICS */}
      {currentStep === 3 && (
        <div className="space-y-4 text-xs">
          <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-200 flex items-center gap-2.5 text-blue-900 font-medium">
            <Truck className="w-5 h-5 text-blue-700 shrink-0" />
            <span>
              Indian E-Way Bill Rule 138 compliant logistics setup. Vehicle registration and distance determine Part-B validity automatically.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Transport Mode *</label>
              <select
                value={transportMode}
                onChange={(e: any) => setTransportMode(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 font-semibold"
              >
                <option value="Road">Road (Standard Fleet)</option>
                <option value="Rail">Rail (Container Freight)</option>
                <option value="Air">Air (Urgent / High-Value Sample)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Vehicle Registration # *</label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                placeholder="MH-14-GH-8821"
                className="w-full border border-gray-300 rounded-lg p-2.5 font-mono font-bold text-gray-900"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Transporter Name</label>
              <input
                type="text"
                value={transporterName}
                onChange={(e) => setTransporterName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 font-semibold text-gray-900"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Transporter GSTIN / ID</label>
              <input
                type="text"
                value={transporterGstin}
                onChange={(e) => setTransporterGstin(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 font-mono text-gray-900"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Driver Name</label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-900"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Driver Mobile Phone</label>
              <input
                type="text"
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 font-mono text-gray-900"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Driver License #</label>
              <input
                type="text"
                value={driverLicense}
                onChange={(e) => setDriverLicense(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 font-mono text-gray-900"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">LR / Bilty Number</label>
              <input
                type="text"
                value={lrNumber}
                onChange={(e) => setLrNumber(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 font-mono font-bold text-gray-900"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Approx Distance (KM for EWB)</label>
              <input
                type="number"
                value={approxDistanceKm}
                onChange={(e) => setApproxDistanceKm(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg p-2.5 font-mono font-bold text-gray-900"
              />
              <span className="text-[10px] text-gray-400 mt-0.5 block">
                Calculates Part-B Validity (approx 72 hours)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: COMPLIANCE & STATUTORY AUTOMATION */}
      {currentStep === 4 && (
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-gray-800 block mb-1">Document Classification *</label>
              <select
                value={challanType}
                onChange={(e: any) => setChallanType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 font-semibold"
              >
                <option value="Tax Invoice-cum-Challan">Tax Invoice-cum-Challan (Commercial B2B Supply)</option>
                <option value="Delivery Challan">Delivery Challan (Rule 55 - Sample / Trial)</option>
                <option value="Job Work Challan">Job Work Challan (Sub-contracting Rule 45)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-gray-800 block mb-1">Transportation Reason</label>
              <input
                type="text"
                value={transportReason}
                onChange={(e) => setTransportReason(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-900 font-medium"
              />
            </div>
          </div>

          <div className="p-4 bg-gray-50/90 rounded-xl border border-gray-200 space-y-3">
            <h3 className="font-bold text-gray-800 uppercase text-[11px] tracking-wider">
              Statutory Automation Preferences (NIC IRP &amp; EWB Portals)
            </h3>

            <div className="space-y-3">
              <label className="flex items-start gap-2.5 cursor-pointer p-2.5 bg-white rounded-lg border border-gray-200 hover:border-teal-300 transition-colors">
                <input
                  type="checkbox"
                  checked={autoEInvoice}
                  onChange={(e) => setAutoEInvoice(e.target.checked)}
                  className="rounded text-[#0F8B8D] mt-0.5"
                />
                <div>
                  <span className="font-bold text-gray-900 block">
                    Generate E-Invoice (IRN) via NIC IRP Portal upon save
                  </span>
                  <span className="text-gray-500 text-[11px]">
                    Issues 64-char cryptographic IRN hash, digitally signed QR code payload, and official Ack number.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer p-2.5 bg-white rounded-lg border border-gray-200 hover:border-teal-300 transition-colors">
                <input
                  type="checkbox"
                  checked={autoEwb}
                  onChange={(e) => setAutoEwb(e.target.checked)}
                  className="rounded text-[#0F8B8D] mt-0.5"
                />
                <div>
                  <span className="font-bold text-gray-900 block">
                    Generate E-Way Bill (Consignment Value: ₹{calculatedTotal.toLocaleString()})
                  </span>
                  <span className="text-gray-500 text-[11px]">
                    Exceeds ₹50,000 threshold requirement. Registers Part-A instantly.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer p-2.5 bg-white rounded-lg border border-gray-200 hover:border-teal-300 transition-colors">
                <input
                  type="checkbox"
                  checked={ewbPartB}
                  onChange={(e) => setEwbPartB(e.target.checked)}
                  disabled={!autoEwb}
                  className="rounded text-[#0F8B8D] mt-0.5"
                />
                <div>
                  <span className="font-bold text-gray-900 block">
                    Assign Complete Part-B (Vehicle {vehicleNumber} assigned)
                  </span>
                  <span className="text-gray-500 text-[11px]">
                    Transporter {transporterName} assigned for {approxDistanceKm} KM transit.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer p-2.5 bg-white rounded-lg border border-gray-200 hover:border-teal-300 transition-colors">
                <input
                  type="checkbox"
                  checked={autoGatePass}
                  onChange={(e) => setAutoGatePass(e.target.checked)}
                  className="rounded text-[#0F8B8D] mt-0.5"
                />
                <div>
                  <span className="font-bold text-gray-900 block">
                    Issue Plant Security Gate Pass (Boom Barrier Exit Clearance)
                  </span>
                  <span className="text-gray-500 text-[11px]">
                    Produces scannable barcode for security checkpoint with gross weight ({grossWeight} Kg).
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: REVIEW & DISPATCH - MISSION CONTROL HERO ACTION */}
      {currentStep === 5 && (
        <div className="space-y-6 text-xs">
          {/* Statutory Green Light Banner */}
          <div className="bg-emerald-50/90 border border-emerald-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-emerald-950 text-sm">
                  Statutory Pre-Dispatch Compliance Passed
                </div>
                <div className="text-[11px] text-emerald-800">
                  Consignor GSTIN (27AABCP1122D1Z4) &bull; Consignee ({activeSo?.customerGstin}) &bull; Vehicle {vehicleNumber} verified.
                </div>
              </div>
            </div>
            <div className="text-right sm:border-l sm:border-emerald-200 sm:pl-4">
              <div className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
                Total Consignment Value
              </div>
              <div className="text-xl font-mono font-bold text-emerald-950">
                ₹{calculatedTotal.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Consignee</span>
              <div className="font-bold text-gray-900 truncate mt-0.5">{activeSo?.customer}</div>
              <div className="text-[10px] text-gray-500">{activeSo?.customerGstin}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Items &amp; Units</span>
              <div className="font-bold text-gray-900 mt-0.5">
                {items.length} Lines &bull; {totalDispatchedUnits.toLocaleString()} Pcs
              </div>
              <div className="text-[10px] text-gray-500">{packageCount} Total Packages</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Vehicle / Transporter</span>
              <div className="font-mono font-bold text-gray-900 mt-0.5">{vehicleNumber}</div>
              <div className="text-[10px] text-gray-500 truncate">{transporterName}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Tax Breakdown</span>
              <div className="font-mono font-semibold text-gray-800 mt-0.5">
                {isInterState ? `IGST: ₹${calculatedIgst.toLocaleString()}` : `CGST+SGST: ₹${(calculatedCgst + calculatedSgst).toLocaleString()}`}
              </div>
              <div className="text-[10px] text-gray-500">Taxable: ₹{calculatedTaxable.toLocaleString()}</div>
            </div>
          </div>

          {/* 4 Synchronized Output Documents Preview */}
          <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-800 uppercase text-[11px] tracking-wider">
                Synchronized 4-Document Dossier to be Created
              </span>
              <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Single Database Transaction
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    1. Delivery Challan
                  </span>
                  <span className="text-[10px] font-mono text-gray-400">DN-XXXX</span>
                </div>
                <p className="text-[11px] text-gray-500">
                  3-Ply outward note with item details, batch numbers, and warehouse store seal.
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    2. NIC E-Invoice
                  </span>
                  <span className="text-[10px] font-mono text-purple-700 font-semibold">IRP Live</span>
                </div>
                <p className="text-[11px] text-gray-500">
                  64-character hash, digitally signed QR code, and official Acknowledgement Number.
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-teal-600" />
                    3. E-Way Bill
                  </span>
                  <span className="text-[10px] font-mono text-teal-700 font-semibold">Part A + B</span>
                </div>
                <p className="text-[11px] text-gray-500">
                  Valid 12-digit number for Vehicle {vehicleNumber} across {approxDistanceKm} KM.
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    4. Security Gate Pass
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 font-semibold">GP-XXXX</span>
                </div>
                <p className="text-[11px] text-gray-500">
                  Driver verification pass, gross weighbridge reading, and boom barrier exit token.
                </p>
              </div>
            </div>
          </div>

          {/* THE MASTER BUTTON: ONE FINAL CLICK */}
          <div className="bg-gradient-to-r from-[#14213D] to-[#0F8B8D] p-5 rounded-2xl text-white shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-base font-bold flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
                  Ready to Issue Official Consignment Documents?
                </h4>
                <p className="text-xs text-blue-100 mt-0.5">
                  One click creates and links all 4 documents in a single atomic operation without manual data re-entry.
                </p>
              </div>

              <button
                onClick={() => executeAllInOneDispatch('all-in-one')}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-[#14213D] font-bold text-sm rounded-xl shadow-md transition-all transform active:scale-95 whitespace-nowrap"
              >
                <span>⚡ ONE FINAL CLICK: Create All-in-One</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Alternative granular options */}
            <div className="border-t border-white/20 pt-3 flex items-center justify-between text-xs text-blue-200">
              <span>Looking for standard or partial creation?</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => executeAllInOneDispatch('note-only')}
                  className="hover:text-white underline"
                >
                  Delivery Note Only
                </button>
                <span>&bull;</span>
                <button
                  onClick={() => executeAllInOneDispatch('standard')}
                  className="hover:text-white underline"
                >
                  Apply Step 4 Checkbox Preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Footer for Steps 1-4 */}
      {currentStep < 5 && (
        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className={`px-4 py-2 text-xs font-semibold rounded-xl border ${
              currentStep === 1
                ? 'text-gray-300 border-gray-200 cursor-not-allowed'
                : 'text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Back
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-mono hidden sm:inline">
              Step {currentStep} of 5
            </span>
            <button
              onClick={() => setCurrentStep(Math.min(5, currentStep + 1))}
              className="flex items-center gap-1.5 px-5 py-2 bg-[#14213D] hover:bg-[#1f335e] text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: ADD ITEM DIALOG (Requested "+ Add Item" Feature) */}
      {/* ========================================================= */}
      {isAddItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl max-w-2xl w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Add Dispatch Line Item</h3>
                  <p className="text-[11px] text-gray-500">
                    Add finished goods from master catalog or custom consignment line.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddItemModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Toggle Mode: Catalog vs Custom Item */}
            <div className="flex items-center p-1 bg-gray-100 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setCustomItemMode(false)}
                className={`flex-1 py-1.5 rounded-md transition-colors ${
                  !customItemMode ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Select from Product Master Catalog
              </button>
              <button
                onClick={() => setCustomItemMode(true)}
                className={`flex-1 py-1.5 rounded-md transition-colors ${
                  customItemMode ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Enter Custom Part / Tooling / Sample
              </button>
            </div>

            {!customItemMode ? (
              <div className="space-y-3">
                {/* Search in catalog */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search product code, name, HSN, category..."
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-teal-500 outline-hidden"
                  />
                </div>

                {/* Catalog Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                  {filteredCatalog.map((cat) => {
                    const isSelected = selectedCatalogItem?.itemCode === cat.itemCode;
                    return (
                      <div
                        key={cat.itemCode}
                        onClick={() => {
                          setSelectedCatalogItem(cat);
                          setNewItemRate(cat.standardRate);
                          setNewItemBatch(`${cat.defaultBatchPrefix}-01`);
                        }}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'border-teal-600 bg-teal-50/50 shadow-xs'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-gray-800 text-[11px]">{cat.itemCode}</span>
                          <span className="text-[10px] text-teal-800 font-semibold bg-teal-100/60 px-1.5 py-0.5 rounded">
                            ₹{cat.standardRate} / {cat.uom}
                          </span>
                        </div>
                        <div className="font-semibold text-gray-900 mt-1 truncate">{cat.itemName}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          HSN: {cat.hsn} &bull; {cat.category}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Item Code</label>
                    <input
                      type="text"
                      placeholder="e.g. FG-SMP-991"
                      value={customItemCode}
                      onChange={(e) => setCustomItemCode(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">HSN Code</label>
                    <input
                      type="text"
                      placeholder="39269099"
                      value={customItemHsn}
                      onChange={(e) => setCustomItemHsn(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Item Description / Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Custom Injection Mold Trial Sample (Natural)"
                    value={customItemName}
                    onChange={(e) => setCustomItemName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2"
                  />
                </div>
              </div>
            )}

            {/* Quantity, Rate, Batch details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-gray-100 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Dispatch Qty *</label>
                <input
                  type="number"
                  min="1"
                  value={newItemQty}
                  onChange={(e) => setNewItemQty(Math.max(1, Number(e.target.value)))}
                  className="w-full border border-gray-300 rounded-lg p-2 font-bold font-mono text-gray-900"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Unit Rate (₹)</label>
                <input
                  type="number"
                  step="0.5"
                  value={newItemRate}
                  onChange={(e) => setNewItemRate(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg p-2 font-mono text-gray-900"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Batch / Lot #</label>
                <input
                  type="text"
                  value={newItemBatch}
                  onChange={(e) => setNewItemBatch(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 font-mono text-gray-900"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Store Location</label>
                <input
                  type="text"
                  value={newItemLocation}
                  onChange={(e) => setNewItemLocation(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 font-mono text-gray-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="text-xs">
                <span className="text-gray-500">Taxable Addition: </span>
                <strong className="font-mono text-gray-900">
                  ₹{(newItemQty * newItemRate).toLocaleString()}
                </strong>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAddItemModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddItemFromModal}
                  className="px-4 py-2 bg-[#0F8B8D] hover:bg-[#0c7274] text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Add to Challan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: BATCH SELECTION MODAL                           */}
      {/* ========================================================= */}
      {activeBatchModalItemId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Select Inspected Batch (FEFO Ranked)</h3>
                <p className="text-[11px] text-gray-500">
                  Finished goods stock with approved Certificate of Analysis (COA).
                </p>
              </div>
              <button
                onClick={() => setActiveBatchModalItemId(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {INITIAL_FG_BATCHES.map((b) => (
                <div
                  key={b.batchNumber}
                  onClick={() => handleSelectBatch(activeBatchModalItemId, b)}
                  className="p-3 rounded-xl border border-gray-200 hover:border-teal-500 hover:bg-teal-50/40 cursor-pointer transition-all flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-gray-900">{b.batchNumber}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        {b.qualityStatus}
                      </span>
                    </div>
                    <div className="text-gray-500 text-[11px] mt-0.5">
                      {b.itemName} &bull; Bin: {b.binCode}
                    </div>
                    <div className="text-[10px] text-teal-800 font-mono mt-0.5">
                      {b.coaNumber} &bull; Mfg: {b.mfgDate}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-gray-900">
                      {b.availableQty.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-gray-400 block">In Store</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button
                onClick={() => setActiveBatchModalItemId(null)}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-semibold text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: ALL-IN-ONE GENERATION PROGRESS & SUCCESS DOSSIER */}
      {/* ========================================================= */}
      {(isGeneratingAllInOne || generatedResult) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-2xl w-full p-6 space-y-5">
            {isGeneratingAllInOne ? (
              /* High-tech rapid API generation sequence */
              <div className="text-center py-6 space-y-5">
                <div className="w-14 h-14 bg-teal-50 text-teal-700 rounded-2xl flex items-center justify-center mx-auto border border-teal-200 animate-spin">
                  <RefreshCw className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Executing All-in-One Statutory Issuance...
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Synchronizing GST Rule 55 Delivery Note, NIC E-Invoice IRN, E-Way Bill, and Gate Pass.
                  </p>
                </div>

                <div className="space-y-2 text-left max-w-md mx-auto text-xs">
                  <div
                    className={`flex items-center gap-2.5 p-2 rounded-lg ${
                      generationPhase >= 1 ? 'bg-teal-50 text-teal-900 font-semibold' : 'text-gray-400'
                    }`}
                  >
                    {generationPhase > 1 ? (
                      <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
                    )}
                    <span>1. Creating 3-Ply Outward Delivery Note (DN-40XX)</span>
                  </div>

                  <div
                    className={`flex items-center gap-2.5 p-2 rounded-lg ${
                      generationPhase >= 2 ? 'bg-purple-50 text-purple-900 font-semibold' : 'text-gray-400'
                    }`}
                  >
                    {generationPhase > 2 ? (
                      <CheckCircle2 className="w-4 h-4 text-purple-600" />
                    ) : generationPhase === 2 ? (
                      <div className="w-4 h-4 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-gray-200" />
                    )}
                    <span>2. Transmitting B2B Payload to NIC IRP Portal &amp; Signing IRN</span>
                  </div>

                  <div
                    className={`flex items-center gap-2.5 p-2 rounded-lg ${
                      generationPhase >= 3 ? 'bg-blue-50 text-blue-900 font-semibold' : 'text-gray-400'
                    }`}
                  >
                    {generationPhase > 3 ? (
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    ) : generationPhase === 3 ? (
                      <div className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-gray-200" />
                    )}
                    <span>3. Registering Complete Part A + Part B E-Way Bill</span>
                  </div>

                  <div
                    className={`flex items-center gap-2.5 p-2 rounded-lg ${
                      generationPhase >= 4 ? 'bg-emerald-50 text-emerald-900 font-semibold' : 'text-gray-400'
                    }`}
                  >
                    {generationPhase >= 4 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-gray-200" />
                    )}
                    <span>4. Generating Security Gate Pass &amp; Vehicle Exit Token</span>
                  </div>
                </div>
              </div>
            ) : generatedResult ? (
              /* Success Celebration & Document Dossier */
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900">
                        All-in-One Consignment Dossier Created!
                      </h3>
                      <p className="text-xs text-gray-500">
                        Delivery Note, Signed IRN, E-Way Bill, and Gate Pass are active and saved.
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Consignment Value</span>
                    <span className="font-mono font-bold text-emerald-700 text-base">
                      ₹{generatedResult.delivery.invoiceValue.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* 4 Document Summary Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => setActiveDossierTab('challan')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-colors ${
                      activeDossierTab === 'challan'
                        ? 'border-blue-600 bg-blue-50/50 shadow-2xs'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-[10px] text-gray-400 block">Challan #</span>
                    <span className="font-mono font-bold text-gray-900 block truncate">
                      {generatedResult.delivery.id}
                    </span>
                    <span className="text-[10px] text-blue-700 font-semibold mt-0.5 block">
                      {items.length} Items
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveDossierTab('eInvoice')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-colors ${
                      activeDossierTab === 'eInvoice'
                        ? 'border-purple-600 bg-purple-50/50 shadow-2xs'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-[10px] text-gray-400 block">IRN Status</span>
                    <span className="font-mono font-bold text-purple-900 block truncate">
                      IRN Signed
                    </span>
                    <span className="text-[10px] text-purple-700 font-semibold mt-0.5 block">
                      NIC Ack Recd
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveDossierTab('eWayBill')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-colors ${
                      activeDossierTab === 'eWayBill'
                        ? 'border-teal-600 bg-teal-50/50 shadow-2xs'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-[10px] text-gray-400 block">E-Way Bill #</span>
                    <span className="font-mono font-bold text-gray-900 block truncate">
                      {generatedResult.eWayBill.ewbNumber}
                    </span>
                    <span className="text-[10px] text-teal-700 font-semibold mt-0.5 block">
                      Valid 72h
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveDossierTab('gatePass')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-colors ${
                      activeDossierTab === 'gatePass'
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-2xs'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-[10px] text-gray-400 block">Gate Pass #</span>
                    <span className="font-mono font-bold text-gray-900 block truncate">
                      {generatedResult.gatePass.gatePassNumber}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block">
                      Exit Cleared
                    </span>
                  </button>
                </div>

                {/* Tab Detailed View */}
                <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-200 text-xs space-y-3">
                  {activeDossierTab === 'challan' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-800">3-Ply Outward Delivery Challan</span>
                        <span className="font-mono font-bold text-gray-900">{generatedResult.delivery.id}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-gray-600">
                        <div>Vehicle: <strong className="text-gray-900">{generatedResult.delivery.vehicleNumber}</strong></div>
                        <div>Packages: <strong className="text-gray-900">{generatedResult.delivery.packageCount} pkgs</strong></div>
                        <div>Gross Wt: <strong className="text-gray-900">{generatedResult.delivery.grossWeightKg} Kg</strong></div>
                        <div>Net Wt: <strong className="text-gray-900">{generatedResult.delivery.netWeightKg} Kg</strong></div>
                      </div>
                    </div>
                  )}

                  {activeDossierTab === 'eInvoice' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-purple-900">NIC Invoice Registration Portal (IRN)</span>
                        <span className="font-mono text-purple-800 font-semibold">Ack: {generatedResult.eInvoice.ackNumber}</span>
                      </div>
                      <div className="p-2 bg-white rounded border border-gray-200 font-mono text-[10px] break-all text-gray-700">
                        IRN: {generatedResult.eInvoice.irn}
                      </div>
                      <div className="flex items-center justify-between text-gray-500">
                        <span>Invoice: <strong className="text-gray-800">{generatedResult.eInvoice.invoiceNumber}</strong></span>
                        <span>QR Code: <strong className="text-emerald-700">Digitally Embedded</strong></span>
                      </div>
                    </div>
                  )}

                  {activeDossierTab === 'eWayBill' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-teal-900">National E-Way Bill Portal</span>
                        <span className="font-mono font-bold text-teal-800">EWB: {generatedResult.eWayBill.ewbNumber}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-gray-600">
                        <div>Valid Until: <strong className="text-gray-900">{generatedResult.eWayBill.validUntil}</strong></div>
                        <div>Distance: <strong className="text-gray-900">{generatedResult.eWayBill.distanceKm} KM</strong></div>
                        <div>Transporter: <strong className="text-gray-900">{generatedResult.eWayBill.transporterName}</strong></div>
                        <div>Vehicle Assigned: <strong className="text-gray-900 font-mono">{generatedResult.eWayBill.vehicleNumber}</strong></div>
                      </div>
                    </div>
                  )}

                  {activeDossierTab === 'gatePass' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-900">Plant Security Gate Pass</span>
                        <span className="font-mono font-bold text-emerald-800">{generatedResult.gatePass.gatePassNumber}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-gray-600">
                        <div>Security Check: <strong className="text-emerald-700">Cleared &bull; Exit Ready</strong></div>
                        <div>Seal #: <strong className="text-gray-900 font-mono">{generatedResult.gatePass.sealNumber}</strong></div>
                        <div>Gate Bay: <strong className="text-gray-900">{generatedResult.gatePass.gateNumber}</strong></div>
                        <div>Driver: <strong className="text-gray-900">{generatedResult.gatePass.driverName} ({generatedResult.gatePass.driverMobile})</strong></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Final Commit & Navigation */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => {
                      showToast('Print command sent to network warehouse printer.');
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold"
                  >
                    <Printer className="w-4 h-4 text-gray-500" />
                    <span>Print All 4 Copies</span>
                  </button>

                  <button
                    onClick={handleCommitSavedResult}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#14213D] hover:bg-[#1f335e] text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    <span>View in Delivery Register</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
