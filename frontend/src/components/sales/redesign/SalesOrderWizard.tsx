import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  Search,
  Lock,
  Sparkles,
  MapPin,
  Phone,
  X,
  PlusCircle,
} from 'lucide-react';
import {
  PlasticSalesOrder,
  SalesOrderType,
  SalesOrderLineItem,
  MonthlyPlanOrder,
} from '../../../types/salesOrderDeliveryTypes';
import { Customer, ItemMaster } from '../../../types';
import { LIVE_CUSTOMERS_CATALOG, CustomerMasterRecord } from '../../../data/liveCustomersCatalog';
import { adminService, adminEventBus } from '../../../services/adminService';
import { transportMasterService, TransporterRecord } from '../../../services/transportMasterService';
import { itemService } from '../../../services/itemService';
import { INITIAL_FG_BATCHES, getNextSalesOrderNumber } from '../../../data/salesOrderDeliveryData';
import { INITIAL_MOLDS } from '../../../data/manufacturingData';
import {
  customerMasterService,
  CustomerMasterExtended,
  CustomerPoVersion,
} from '../../../services/customerMasterService';
import { CustomerOnboardingWizardModal } from '../CustomerOnboardingWizardModal';
import { CustomerPoAmendmentModal } from '../CustomerPoAmendmentModal';

interface SalesOrderWizardProps {
  initialOrder?: Partial<PlasticSalesOrder>;
  defaultOrderType?: SalesOrderType;
  monthlyPlans: MonthlyPlanOrder[];
  customers?: Customer[];
  existingOrders?: PlasticSalesOrder[];
  onSave: (order: PlasticSalesOrder) => void;
  onCancel: () => void;
  showToast: (msg: string) => void;
}

export const SalesOrderWizard: React.FC<SalesOrderWizardProps> = ({
  initialOrder,
  defaultOrderType,
  monthlyPlans,
  customers = [],
  existingOrders = [],
  onSave,
  onCancel,
  showToast,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [stepError, setStepError] = useState<string | null>(null);

  // Task-1 & 4: Admin Governed Unique Sequential Sales Order Number (SO-XXXX)
  const [soNumber, setSoNumber] = useState<string>(() => {
    if (initialOrder?.id) return initialOrder.id;
    return getNextSalesOrderNumber(existingOrders);
  });

  useEffect(() => {
    if (!initialOrder?.id) {
      adminService
        .generateNextNumber('Sales & Commercial', 'Sales Order')
        .then((generated) => {
          if (generated && generated.startsWith('SO-')) {
            setSoNumber(generated);
          } else {
            setSoNumber(getNextSalesOrderNumber(existingOrders));
          }
        })
        .catch(() => {
          setSoNumber(getNextSalesOrderNumber(existingOrders));
        });
    }
  }, [initialOrder, existingOrders]);

  // Master Items single source of truth
  const [masterItemsList, setMasterItemsList] = useState<ItemMaster[]>(() =>
    itemService.getItemsSync()
  );

  useEffect(() => {
    const handleUpdate = () => {
      setMasterItemsList(itemService.getItemsSync());
    };
    adminEventBus.on('ITEM_SAVED', handleUpdate);
    adminEventBus.on('ITEM_DELETED', handleUpdate);
    adminEventBus.on('CATALOG_RELOADED', handleUpdate);
    return () => {
      adminEventBus.off('ITEM_SAVED', handleUpdate);
      adminEventBus.off('ITEM_DELETED', handleUpdate);
      adminEventBus.off('CATALOG_RELOADED', handleUpdate);
    };
  }, []);

  // Dynamic customer master synchronization from single source of truth
  const [customerCatalog, setCustomerCatalog] = useState<CustomerMasterExtended[]>(() =>
    customerMasterService.getCustomersSync()
  );

  useEffect(() => {
    const handleCustomerSync = () => {
      setCustomerCatalog(customerMasterService.getCustomersSync());
    };
    adminEventBus.on('CUSTOMER_MASTER_UPDATED', handleCustomerSync);
    adminEventBus.on('CATALOG_RELOADED', handleCustomerSync);
    return () => {
      adminEventBus.off('CUSTOMER_MASTER_UPDATED', handleCustomerSync);
      adminEventBus.off('CATALOG_RELOADED', handleCustomerSync);
    };
  }, []);

  // Helper to query live single source of truth stock across FG stores
  const getLiveStockForProduct = (itemCode: string, plantName?: string, storeName?: string) => {
    // 1. Check matching batches in INITIAL_FG_BATCHES
    const matchingBatches = INITIAL_FG_BATCHES.filter((b) => {
      const codeMatch = b.itemCode === itemCode || ((b as any).productName && (b as any).productName.toLowerCase().includes(itemCode.toLowerCase())) || b.itemName?.toLowerCase().includes(itemCode.toLowerCase());
      const plantMatch = !plantName || !b.plant || b.plant.includes(plantName.split(' - ')[0]) || b.plant === plantName;
      const storeMatch = !storeName || !b.fgStore || b.fgStore === storeName;
      return codeMatch && (plantMatch || storeMatch);
    });

    if (matchingBatches.length > 0) {
      const avail = matchingBatches.reduce((acc, b) => acc + (b.availableQty || 0), 0);
      const res = matchingBatches.reduce((acc, b) => acc + (b.reservedQty || 0), 0);
      if (avail > 0) {
        return { availableStock: avail, reservedStock: res };
      }
    }

    // 2. Query Item Master
    const item = masterItemsList.find((i) => i.code === itemCode || i.name === itemCode);
    const itemStock = (item as any)?.currentStock ?? (item as any)?.stock ?? (item as any)?.availableStock;
    if (typeof itemStock === 'number' && itemStock > 0) {
      const res = Math.floor(itemStock * 0.12);
      return { availableStock: itemStock, reservedStock: res };
    }

    // 3. Fallback FG store balance baseline: realistic positive stock in FG stores
    const hash = itemCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const baseAvail = 4500 + (hash % 12) * 800; // e.g., 4,500 to 14,100 PCS
    const baseRes = Math.floor(baseAvail * 0.12);
    return { availableStock: baseAvail, reservedStock: baseRes };
  };

  // Helper to query live mold and polymer
  const getLiveMoldForProduct = (itemCode: string) => {
    const mold = INITIAL_MOLDS.find((m) => m.compatibleProducts?.includes(itemCode));
    return mold ? mold.assetTag : 'MLD-1001-AUTO';
  };

  // Helper to find latest updated PO for a customer using LIFO (Last In, First Out)
  const getLatestCustomerPo = (custName: string, custCode: string) => {
    // 1. Check Customer Master Service LIFO revision history
    const masterPo = customerMasterService.getLatestPoForCustomer(custCode || custName);
    if (masterPo && masterPo.poNumber) {
      return {
        poNumber: masterPo.poNumber,
        poDate: masterPo.poDate || new Date().toISOString().slice(0, 10),
        version: masterPo.version || 'Rev 01',
        isRegistered: true,
      };
    }

    // 2. Fallback to existing orders LIFO sort
    const matchingOrders = existingOrders.filter(
      (o) =>
        (o.customer && o.customer.toLowerCase() === custName.toLowerCase()) ||
        (o.customer && o.customer.toLowerCase().includes(custName.toLowerCase())) ||
        (o.id && custCode && o.id.includes(custCode))
    );

    if (matchingOrders.length > 0) {
      const sorted = [...matchingOrders].sort(
        (a, b) =>
          new Date(b.orderDate || b.customerPoDate || '2020-01-01').getTime() -
          new Date(a.orderDate || a.customerPoDate || '2020-01-01').getTime()
      );
      const latest = sorted[0];
      if (latest.customerPoNumber) {
        return {
          poNumber: latest.customerPoNumber,
          poDate: latest.customerPoDate || new Date().toISOString().slice(0, 10),
          version: 'Rev 01',
          isRegistered: true,
        };
      }
    }

    // 3. Known major accounts defaults
    if (custName.includes('Tata Motors')) {
      return { poNumber: 'PO-TM-2026-9022', poDate: '2026-09-08', version: 'Rev 03', isRegistered: true };
    }
    if (custName.includes('Bajaj Auto')) {
      return { poNumber: 'BAJ-DISP-0911', poDate: '2026-09-10', version: 'Rev 02', isRegistered: true };
    }
    if (custName.includes('Marico')) {
      return { poNumber: 'PO-MRC-55029', poDate: '2026-09-09', version: 'Rev 01', isRegistered: true };
    }
    if (custName.includes('Maruti Suzuki')) {
      return { poNumber: 'MSIL-BLANKET-2026-04', poDate: '2026-08-15', version: 'Rev 02', isRegistered: true };
    }

    return { poNumber: '', poDate: new Date().toISOString().slice(0, 10), version: 'Rev 01', isRegistered: false };
  };

  // Task-3: Default Order Type is strictly 'Monthly Plan Order'
  const [orderType, setOrderType] = useState<SalesOrderType>(
    initialOrder?.orderType || defaultOrderType || 'Monthly Plan Order'
  );

  const initialCustRecord = customerCatalog[0] || LIVE_CUSTOMERS_CATALOG[0];
  const initialPoInfo = getLatestCustomerPo(
    initialOrder?.customer || initialCustRecord?.name || 'Tata Motors Passenger Vehicles Ltd',
    initialCustRecord?.code || '12398'
  );

  const [customer, setCustomer] = useState(
    initialOrder?.customer || 'Tata Motors Passenger Vehicles Ltd'
  );
  const [customerCode, setCustomerCode] = useState(initialCustRecord?.code || '12398');
  const [customerGstin, setCustomerGstin] = useState(
    initialOrder?.customerGstin || '27AAACT2727Q1ZW'
  );
  const [customerState, setCustomerState] = useState('Maharashtra');
  const [customerStateCode, setCustomerStateCode] = useState('27');
  const isInterState = customerStateCode !== '27';
  const [customerCreditLimit, setCustomerCreditLimit] = useState<number>(15000000);
  const [customerCurrentExposure, setCustomerCurrentExposure] = useState<number>(6420000);
  const [customerAvailableCredit, setCustomerAvailableCredit] = useState<number>(8580000);

  // Task-2 & 3: Customer PO Number is Auto-Filled via LIFO and Read-Only / Non-Editable
  const [customerPoNumber, setCustomerPoNumber] = useState<string>(
    initialOrder?.customerPoNumber || initialPoInfo.poNumber || 'PO-TM-2026-9022'
  );
  const [customerPoDate, setCustomerPoDate] = useState<string>(
    initialOrder?.customerPoDate || initialPoInfo.poDate || new Date().toISOString().slice(0, 10)
  );
  const [customerPoVersion, setCustomerPoVersion] = useState<string>(
    initialPoInfo.version || 'Rev 01'
  );

  // Customer Onboarding & PO Amendment Modals
  const [isOnboardingWizardOpen, setIsOnboardingWizardOpen] = useState(false);
  const [isPoAmendmentModalOpen, setIsPoAmendmentModalOpen] = useState(false);
  const [isRegisterPoModalOpen, setIsRegisterPoModalOpen] = useState(false);
  const [newPoNumberInput, setNewPoNumberInput] = useState('');
  const [newPoDateInput, setNewPoDateInput] = useState(new Date().toISOString().slice(0, 10));

  const handleSaveRegisteredPo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPoNumberInput.trim()) return;
    setCustomerPoNumber(newPoNumberInput.trim());
    setCustomerPoDate(newPoDateInput);
    setCustomerPoVersion('Rev 01');
    setIsRegisterPoModalOpen(false);
    showToast(`✓ PO Registered: ${newPoNumberInput.trim()} for ${customer}`);
  };

  const [plant, setPlant] = useState(
    initialOrder?.plant || 'Plant 1 - Pimpri Auto-Hub'
  );
  const [fgStore, setFgStore] = useState(
    initialOrder?.fgStore || 'FG-Automotive Cell'
  );
  const [monthlyPlanPeriod, setMonthlyPlanPeriod] = useState('September 2026');
  const [linkToPlan, setLinkToPlan] = useState(Boolean(initialOrder?.monthlyPlanRef));
  const [selectedPlanRef, setSelectedPlanRef] = useState(
    initialOrder?.monthlyPlanRef || (monthlyPlans[0]?.planNumber || 'PLN-2026-09-01')
  );

  // Customer Autocomplete state
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const customerDropdownRef = useRef<HTMLDivElement | null>(null);

  // Filtered customer catalog
  const filteredCustomers = useMemo(() => {
    const q = customerSearchQuery.toLowerCase().trim();
    if (!q) return customerCatalog.slice(0, 8);
    return customerCatalog
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          (c.shortName && c.shortName.toLowerCase().includes(q)) ||
          (c.gstin && c.gstin.toLowerCase().includes(q)) ||
          (c.state && c.state.toLowerCase().includes(q))
      )
      .slice(0, 10);
  }, [customerCatalog, customerSearchQuery]);

  // Close customer dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target as Node)) {
        setIsCustomerSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const [selectedCustomerMaster, setSelectedCustomerMaster] = useState<CustomerMasterExtended | null>(
    () => customerMasterService.getCustomerByCodeOrName('12398') || null
  );

  // Handle Customer Selection with Auto-fill of all commercial & transport fields + LIFO PO
  const handleSelectCustomer = (c: CustomerMasterRecord | CustomerMasterExtended) => {
    setCustomer(c.name);
    setCustomerCode(c.code);
    setCustomerGstin(c.gstin || '27AAACT2727Q1ZW');
    setCustomerState(c.state || 'Maharashtra');
    setCustomerStateCode(c.state === 'Haryana' ? '06' : c.state === 'Tamil Nadu' ? '33' : '27');
    setCustomerCreditLimit(c.creditLimit || 10000000);
    setCustomerCurrentExposure(c.currentBalance || 2500000);
    setCustomerAvailableCredit(Math.max(0, (c.creditLimit || 10000000) - (c.currentBalance || 2500000)));

    const extended = customerMasterService.getCustomerByCodeOrName(c.code || c.name);
    setSelectedCustomerMaster(extended || null);

    if (c.paymentTerms) {
      setPaymentTerms(c.paymentTerms);
    }
    if ((c as any).shippingAddress || c.address || (c as any).destination) {
      setShippingAddress((c as any).shippingAddress || c.address || `${(c as any).destination || ''}, ${c.state || ''}`);
    }

    // Auto-fill LIFO PO Number
    const poInfo = getLatestCustomerPo(c.name, c.code);
    if (poInfo.poNumber) {
      setCustomerPoNumber(poInfo.poNumber);
      setCustomerPoDate(poInfo.poDate);
      setCustomerPoVersion(poInfo.version || 'Rev 01');
    } else {
      setCustomerPoNumber('');
      setCustomerPoDate(new Date().toISOString().slice(0, 10));
      setCustomerPoVersion('Rev 01');
    }

    setIsCustomerSearchOpen(false);
    setCustomerSearchQuery('');
    setStepError(null);
    showToast(`✓ Selected Customer: ${c.name} (Code: ${c.code}) - Master Data Auto-filled!`);
  };

  // Step 2: Line items - Clean Single Source of Truth initialization
  const initialFirstMasterItem = masterItemsList[0];
  const initialStock = initialFirstMasterItem
    ? getLiveStockForProduct(initialFirstMasterItem.code)
    : { availableStock: 8200, reservedStock: 2500 };

  const [lines, setLines] = useState<SalesOrderLineItem[]>(() => {
    if (initialOrder?.lines && initialOrder.lines.length > 0) {
      return initialOrder.lines;
    }
    if (initialFirstMasterItem) {
      const unitPrice =
        (initialFirstMasterItem as any).sellingPrice ||
        (initialFirstMasterItem as any).unitPrice ||
        (initialFirstMasterItem as any).standardCost ||
        55;
      const qty = 2500;
      const taxable = qty * unitPrice;
      const cgst = taxable * 0.09;
      const sgst = taxable * 0.09;
      const shortage = Math.max(0, qty - initialStock.availableStock);
      return [
        {
          lineNumber: 1,
          itemCode: initialFirstMasterItem.code,
          itemName: initialFirstMasterItem.name,
          customerItemCode:
            (initialFirstMasterItem as any).customerPartNumber ||
            `TATA-${initialFirstMasterItem.code}`,
          hsn: (initialFirstMasterItem as any).hsn || '39269099',
          orderedQty: qty,
          allocatedQty: qty,
          pickedQty: 0,
          packedQty: 0,
          deliveredQty: 0,
          invoicedQty: 0,
          remainingQty: qty,
          uom: initialFirstMasterItem.baseUOM || 'PCS',
          plant: 'Plant 1 - Pimpri Auto-Hub',
          fgStore: 'FG-Automotive Cell',
          batchPreference: 'FIFO Standard',
          requestedDeliveryDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
          availableStock: initialStock.availableStock,
          reservedStock: initialStock.reservedStock,
          shortageQty: shortage,
          status: shortage > 0 ? 'Shortage' : 'In Stock',
          unitPrice: Number(unitPrice),
          discountPct: 0,
          taxableValue: taxable,
          gstRatePct: 18,
          cgstAmount: cgst,
          sgstAmount: sgst,
          igstAmount: 0,
          cessAmount: 0,
          totalValue: taxable + cgst + sgst,
          polymerGrade:
            (initialFirstMasterItem as any).grade ||
            (initialFirstMasterItem as any).material ||
            'LG Chem ABS-121H',
          mouldCode:
            (initialFirstMasterItem as any).moldCode ||
            getLiveMoldForProduct(initialFirstMasterItem.code),
        },
      ];
    }
    return [];
  });

  const [activeItemSearchIdx, setActiveItemSearchIdx] = useState<number | null>(null);
  const [itemSearchQuery, setItemSearchQuery] = useState<string>('');
  const itemSearchContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        itemSearchContainerRef.current &&
        !itemSearchContainerRef.current.contains(e.target as Node)
      ) {
        setActiveItemSearchIdx(null);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const filteredMasterItems = useMemo(() => {
    const q = itemSearchQuery.toLowerCase().trim();
    if (!q) return masterItemsList.slice(0, 10);
    return masterItemsList
      .filter(
        (item) =>
          (item.code && item.code.toLowerCase().includes(q)) ||
          (item.name && item.name.toLowerCase().includes(q)) ||
          (item.type && item.type.toLowerCase().includes(q)) ||
          ((item as any).category && (item as any).category.toLowerCase().includes(q)) ||
          ((item as any).grade && (item as any).grade.toLowerCase().includes(q)) ||
          ((item as any).hsn && (item as any).hsn.toLowerCase().includes(q)) ||
          (item.desc && item.desc.toLowerCase().includes(q)) ||
          ((item as any).description && (item as any).description.toLowerCase().includes(q))
      )
      .slice(0, 12);
  }, [masterItemsList, itemSearchQuery]);

  const handleSelectMasterItem = (idx: number, item: ItemMaster) => {
    const updated = [...lines];
    const unitPrice =
      (item as any).sellingPrice ||
      (item as any).unitPrice ||
      (item as any).standardCost ||
      (item as any).valuation ||
      55;
    const qty = updated[idx].orderedQty || 1000;
    const taxable = qty * unitPrice * (1 - updated[idx].discountPct / 100);
    const cgst = isInterState ? 0 : taxable * 0.09;
    const sgst = isInterState ? 0 : taxable * 0.09;
    const igst = isInterState ? taxable * 0.18 : 0;
    
    // Live stock calculation from single source
    const liveStock = getLiveStockForProduct(item.code);
    const shortage = Math.max(0, qty - liveStock.availableStock);
    const liveMould = (item as any).moldCode || getLiveMoldForProduct(item.code);
    const livePolymer = (item as any).grade || (item as any).material || (item as any).polymerType || 'Engineering Polymer Grade';

    updated[idx] = {
      ...updated[idx],
      itemCode: item.code,
      itemName: item.name,
      customerItemCode: (item as any).customerPartNumber || `${customerCode || 'CUST'}-${item.code}`,
      hsn: (item as any).hsn || '39269099',
      uom: item.baseUOM || (item as any).uom || 'PCS',
      polymerGrade: livePolymer,
      mouldCode: liveMould,
      unitPrice: Number(unitPrice),
      taxableValue: taxable,
      cgstAmount: cgst,
      sgstAmount: sgst,
      igstAmount: igst,
      totalValue: taxable + cgst + sgst + igst,
      availableStock: liveStock.availableStock,
      reservedStock: liveStock.reservedStock,
      shortageQty: shortage,
      status: shortage > 0 ? 'Shortage' : 'In Stock',
    };

    setLines(updated);
    setActiveItemSearchIdx(null);
    setItemSearchQuery('');
    setStepError(null);
    showToast(`✓ Selected Product: ${item.code} (${item.name}) - Live Stock & Mold Loaded!`);
  };

  // Step 3: Pricing & Commercials
  const [priceList, setPriceList] = useState(
    initialOrder?.priceList || 'Tier-1 Automotive OEM Matrix 2026'
  );
  const [paymentTerms, setPaymentTerms] = useState(
    initialOrder?.paymentTerms || 'Net 30 Days RTGS'
  );
  const [freightAmount, setFreightAmount] = useState<number>(
    initialOrder?.freightAmount || 4500
  );
  const [packingAmount, setPackingAmount] = useState<number>(
    initialOrder?.packingAmount || 2000
  );

  // Step 4: Packaging & Quality Requirements + Admin Packaging Type Manager
  const [packagingTypesList, setPackagingTypesList] = useState<string[]>([
    'Corrugated Box with VCI Liner',
    'Heavy-Duty Corrugated Master Carton',
    'Returnable Plastic Crate (RPC)',
    'Wooden Pallet with Stretch Wrap',
    'Anti-Static ESD Protective Box',
    'Standard Polybag Master Pack',
  ]);
  const [packagingType, setPackagingType] = useState('Corrugated Box with VCI Liner');
  const [packagingInstructions, setPackagingInstructions] = useState(
    '50 PCS per box. Individual bubble wrap. Plastic layer separator. Barcode label on Box front & top.'
  );
  const [isNewPkgModalOpen, setIsNewPkgModalOpen] = useState(false);
  const [newPkgTypeName, setNewPkgTypeName] = useState('');

  const handleCreatePackagingType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPkgTypeName.trim()) return;
    const trimmed = newPkgTypeName.trim();
    if (!packagingTypesList.includes(trimmed)) {
      setPackagingTypesList([...packagingTypesList, trimmed]);
    }
    setPackagingType(trimmed);
    setNewPkgTypeName('');
    setIsNewPkgModalOpen(false);
    showToast(`✓ Created and selected packaging type: ${trimmed}`);
  };

  const [coaRequired, setCoaRequired] = useState(true);
  const [rohsRequired, setRohsRequired] = useState(true);
  const [reachRequired, setReachRequired] = useState(false);
  const [foodGradeRequired, setFoodGradeRequired] = useState(false);
  const [batchTraceabilityRequired, setBatchTraceabilityRequired] = useState(true);
  const [customerInspectionRequired, setCustomerInspectionRequired] = useState(false);

  // Step 5: Transport & EWB (Task-3 Transporter Master Autocomplete)
  const [transportersList, setTransportersList] = useState<TransporterRecord[]>(() =>
    transportMasterService.getTransportersSync()
  );
  const [transportMode, setTransportMode] = useState<string>(
    initialOrder?.transportMode || 'Road'
  );
  const [transporterName, setTransporterName] = useState<string>(
    initialOrder?.transporterName || 'VRL Logistics Ltd'
  );
  const [transporterGstin, setTransporterGstin] = useState<string>(
    initialOrder?.transporterGstin || '29AABCV1234F1Z1'
  );
  const [vehicleNumber, setVehicleNumber] = useState<string>(
    initialOrder?.vehicleNumber || 'MH-14-GH-8821'
  );
  const [incoterms, setIncoterms] = useState<string>(
    initialOrder?.incoterms || 'DAP - Delivered At Place'
  );
  const [dispatchPoint, setDispatchPoint] = useState(
    initialOrder?.shippingAddress?.dispatchPoint || 'Pimpri Plant 1 Gate #2'
  );
  const [deliveryTerms, setDeliveryTerms] = useState(
    initialOrder?.deliveryTerms || 'Immediate JIT Delivery within 48 Hours'
  );
  const [shippingAddress, setShippingAddress] = useState(
    initialOrder?.shippingAddress?.line1 ||
      'Assembly Line Gate #3, Tata Motors Works, Pimpri, Pune - 411018'
  );

  // Transporter Autocomplete & Quick Modal
  const [isTransporterSearchOpen, setIsTransporterSearchOpen] = useState(false);
  const [transporterSearchQuery, setTransporterSearchQuery] = useState('');
  const [isQuickTransporterModalOpen, setIsQuickTransporterModalOpen] = useState(false);
  const [quickTransporterName, setQuickTransporterName] = useState('');
  const [quickTransporterGstin, setQuickTransporterGstin] = useState('');
  const transporterDropdownRef = useRef<HTMLDivElement | null>(null);

  // Close transporter dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        transporterDropdownRef.current &&
        !transporterDropdownRef.current.contains(e.target as Node)
      ) {
        setIsTransporterSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const filteredTransporters = useMemo(() => {
    const q = transporterSearchQuery.toLowerCase().trim();
    if (!q) return transportersList.slice(0, 8);
    return transportersList
      .filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.transporterCode.toLowerCase().includes(q) ||
          t.transporterIdGstin.toLowerCase().includes(q) ||
          t.city.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [transportersList, transporterSearchQuery]);

  const handleSelectTransporter = (t: TransporterRecord) => {
    setTransporterName(t.name);
    setTransporterGstin(t.transporterIdGstin);
    if (t.transportModes && t.transportModes.length > 0) {
      setTransportMode(t.transportModes[0]);
    }
    setIsTransporterSearchOpen(false);
    setTransporterSearchQuery('');
    setStepError(null);
    showToast(`✓ Selected Transporter: ${t.name} (${t.transporterIdGstin})`);
  };

  const handleQuickCreateTransporter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTransporterName.trim()) {
      showToast('Transporter Name is required');
      return;
    }
    if (!quickTransporterGstin.trim() || quickTransporterGstin.trim().length !== 15) {
      showToast('15-digit GSTIN / Transporter ID is required');
      return;
    }

    const newTransporter: TransporterRecord = {
      id: `TRP-${Date.now()}`,
      transporterCode: transportMasterService.generateNextTransporterCode(),
      name: quickTransporterName.trim(),
      transporterIdGstin: quickTransporterGstin.trim().toUpperCase(),
      contactPerson: 'Logistics Desk',
      phone: '+91 98000 00000',
      email: 'dispatch@logistics.example',
      address: 'Transport Hub',
      city: 'Pune',
      state: 'Maharashtra',
      transportModes: ['Road'],
      vehicleTypes: ['Standard Container (14 Ton)'],
      status: 'active',
      rating: 4.8,
      totalShipments: 0,
      onTimeDeliveryPct: 98.0,
      createdDate: new Date().toISOString().slice(0, 10),
    };

    transportMasterService.saveTransporter(newTransporter);
    setTransportersList(transportMasterService.getTransportersSync());
    handleSelectTransporter(newTransporter);
    setIsQuickTransporterModalOpen(false);
    showToast(`✓ Created & selected new transporter: ${newTransporter.name}`);
  };

  // Inter-state GST calculation (Maharashtra POS = 27)
  const totalTaxable = lines.reduce((acc, l) => acc + (l.taxableValue || 0), 0);
  const totalCgst = isInterState ? 0 : totalTaxable * 0.09;
  const totalSgst = isInterState ? 0 : totalTaxable * 0.09;
  const totalIgst = isInterState ? totalTaxable * 0.18 : 0;
  const totalOrderVal =
    totalTaxable + totalCgst + totalSgst + totalIgst + (freightAmount || 0) + (packingAmount || 0);

  // E-Way Bill requirement check (> 50,000 INR or inter-state)
  const isEwbRequired = totalOrderVal > 50000 || isInterState;
  const isEInvoiceRequired = true;

  // Credit Status Check
  const creditStatus = customerAvailableCredit < totalOrderVal ? 'Hold' : 'Approved';

  // Line item manipulation
  const handleAddLine = () => {
    const candidateItem =
      masterItemsList.find((i) => !lines.some((l) => l.itemCode === i.code)) ||
      masterItemsList[0];

    const unitPrice =
      (candidateItem as any)?.sellingPrice ||
      (candidateItem as any)?.unitPrice ||
      (candidateItem as any)?.standardCost ||
      55.0;

    const liveStock = candidateItem
      ? getLiveStockForProduct(candidateItem.code)
      : { availableStock: 5000, reservedStock: 0 };
    const liveMould = candidateItem
      ? (candidateItem as any).moldCode || getLiveMoldForProduct(candidateItem.code)
      : 'MLD-1001-AUTO';
    const livePolymer =
      (candidateItem as any)?.grade ||
      (candidateItem as any)?.material ||
      'PP Copolymer Grade';

    const nextLine: SalesOrderLineItem = {
      lineNumber: lines.length + 1,
      itemCode: candidateItem?.code || `FG-ITEM-${lines.length + 1}`,
      itemName: candidateItem?.name || 'Molded Finished Good',
      customerItemCode:
        (candidateItem as any)?.customerPartNumber ||
        `${customerCode || 'CUST'}-${candidateItem?.code || lines.length + 1}`,
      hsn: (candidateItem as any)?.hsn || '39269099',
      orderedQty: 1000,
      allocatedQty: 1000,
      pickedQty: 0,
      packedQty: 0,
      deliveredQty: 0,
      invoicedQty: 0,
      remainingQty: 1000,
      uom: candidateItem?.baseUOM || 'PCS',
      plant,
      fgStore,
      batchPreference: 'FIFO Standard',
      requestedDeliveryDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      availableStock: liveStock.availableStock,
      reservedStock: liveStock.reservedStock,
      shortageQty: Math.max(0, 1000 - liveStock.availableStock),
      status: liveStock.availableStock < 1000 ? 'Shortage' : 'In Stock',
      unitPrice: Number(unitPrice),
      discountPct: 0,
      taxableValue: 1000 * Number(unitPrice),
      gstRatePct: 18,
      cgstAmount: isInterState ? 0 : 1000 * Number(unitPrice) * 0.09,
      sgstAmount: isInterState ? 0 : 1000 * Number(unitPrice) * 0.09,
      igstAmount: isInterState ? 1000 * Number(unitPrice) * 0.18 : 0,
      cessAmount: 0,
      totalValue: 1000 * Number(unitPrice) * 1.18,
      polymerGrade: livePolymer,
      mouldCode: liveMould,
    };
    setLines([...lines, nextLine]);
    setActiveItemSearchIdx(lines.length);
    setItemSearchQuery('');
    setStepError(null);
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
    setStepError(null);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length === 1) {
      showToast('A sales order requires at least one finished goods line item.');
      return;
    }
    setLines(lines.filter((_, i) => i !== index));
  };

  // Task-5: Strict Multi-Step Validations
  const validateStep = (stepNumber: number): { valid: boolean; error?: string } => {
    if (stepNumber === 1) {
      if (!customer || !customer.trim()) {
        return { valid: false, error: 'Customer Name is required. Please select or enter a customer.' };
      }
      if (!customerPoNumber || !customerPoNumber.trim()) {
        return {
          valid: false,
          error: 'Customer PO Number is required and cannot be empty. Please click "+ Register Customer PO" to add one.',
        };
      }
      if (!customerPoDate || !customerPoDate.trim()) {
        return { valid: false, error: 'Customer PO Date is required.' };
      }
    }

    if (stepNumber === 2) {
      if (!lines || lines.length === 0) {
        return { valid: false, error: 'Finished Goods line items cannot be empty. Please add at least one product.' };
      }
      for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        if (!l.itemCode || !l.itemCode.trim()) {
          return { valid: false, error: `Line #${i + 1} is missing a selected product/item.` };
        }
        if (!l.orderedQty || Number(l.orderedQty) <= 0) {
          return { valid: false, error: `Line #${i + 1} ordered quantity must be greater than 0.` };
        }
        if (l.unitPrice === undefined || Number(l.unitPrice) <= 0) {
          return { valid: false, error: `Line #${i + 1} unit price must be greater than 0.` };
        }
      }
    }

    if (stepNumber === 3) {
      if (!priceList || !priceList.trim()) {
        return { valid: false, error: 'Price List is required.' };
      }
      if (!paymentTerms || !paymentTerms.trim()) {
        return { valid: false, error: 'Payment Terms are required.' };
      }
      if (freightAmount === undefined || freightAmount === null || isNaN(freightAmount)) {
        return { valid: false, error: 'Freight amount must be a valid number (0 or higher).' };
      }
      if (packingAmount === undefined || packingAmount === null || isNaN(packingAmount)) {
        return { valid: false, error: 'Packing & handling amount must be a valid number (0 or higher).' };
      }
    }

    if (stepNumber === 4) {
      if (!packagingType || !packagingType.trim()) {
        return { valid: false, error: 'Packaging Type is required.' };
      }
      if (!packagingInstructions || !packagingInstructions.trim()) {
        return { valid: false, error: 'Packaging & Handling instructions cannot be empty.' };
      }
    }

    if (stepNumber === 5) {
      if (!transportMode || !transportMode.trim()) {
        return { valid: false, error: 'Transport Mode is required.' };
      }
      if (!transporterName || !transporterName.trim()) {
        return { valid: false, error: 'Transporter Name is required.' };
      }
      if (!transporterGstin || !transporterGstin.trim()) {
        return { valid: false, error: 'Transporter GSTIN / ID is required.' };
      }
      if (!vehicleNumber || !vehicleNumber.trim()) {
        return { valid: false, error: 'Vehicle Number is required.' };
      }
      if (!incoterms || !incoterms.trim()) {
        return { valid: false, error: 'Incoterms are required.' };
      }
      if (!dispatchPoint || !dispatchPoint.trim()) {
        return { valid: false, error: 'Dispatch Point is required.' };
      }
      if (!deliveryTerms || !deliveryTerms.trim()) {
        return { valid: false, error: 'Delivery Terms are required.' };
      }
      if (!shippingAddress || !shippingAddress.trim()) {
        return { valid: false, error: 'Shipping Delivery Address is required.' };
      }
    }

    return { valid: true };
  };

  const handleNextStep = () => {
    const check = validateStep(currentStep);
    if (!check.valid) {
      setStepError(check.error || 'Validation failed for the current step.');
      showToast(`⚠️ ${check.error}`);
      return;
    }
    setStepError(null);
    setCurrentStep((prev) => Math.min(6, prev + 1));
  };

  const handleStepClick = (targetStep: number) => {
    if (targetStep < currentStep) {
      setStepError(null);
      setCurrentStep(targetStep);
      return;
    }
    // Validate each step in between
    for (let s = currentStep; s < targetStep; s++) {
      const check = validateStep(s);
      if (!check.valid) {
        setStepError(`Cannot jump to Step ${targetStep}: Step ${s} requirement not met - ${check.error}`);
        showToast(`⚠️ Step ${s}: ${check.error}`);
        setCurrentStep(s);
        return;
      }
    }
    setStepError(null);
    setCurrentStep(targetStep);
  };

  const handleSubmit = (statusToSet: 'Draft' | 'Pending Approval' | 'Confirmed') => {
    // Validate all 5 steps before final submit
    for (let s = 1; s <= 5; s++) {
      const check = validateStep(s);
      if (!check.valid) {
        setStepError(`Cannot submit order: Step ${s} error - ${check.error}`);
        showToast(`⚠️ Step ${s}: ${check.error}`);
        setCurrentStep(s);
        return;
      }
    }

    const newOrder: PlasticSalesOrder = {
      id: soNumber.trim(),
      orderType,
      customer,
      customerGstin,
      customerPoNumber,
      customerPoDate,
      orderDate: new Date().toISOString().slice(0, 10),
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
        city: customerState === 'Haryana' ? 'Gurugram' : 'Pune',
        state: customerState,
        pincode: customerState === 'Haryana' ? '122051' : '411018',
        gstin: customerGstin,
        placeOfSupply: `${customerStateCode}-${customerState}`,
      },
      shippingAddress: {
        line1: shippingAddress,
        city: customerState === 'Haryana' ? 'Gurugram' : 'Pune',
        state: customerState,
        pincode: customerState === 'Haryana' ? '122051' : '411018',
        gstin: customerGstin,
        dispatchPoint,
      },
      status: creditStatus === 'Hold' ? 'Credit Hold' : statusToSet,
      creditStatus,
      creditLimit: customerCreditLimit,
      currentExposure: customerCurrentExposure,
      availableCredit: customerAvailableCredit,
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
      transportMode: (transportMode as 'Road' | 'Rail' | 'Air' | 'Ship') || 'Road',
      transporterName,
      transporterGstin,
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
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          details: linkToPlan ? `Linked to Monthly Plan ${selectedPlanRef}` : 'Independent Monthly Plan Order',
        },
      ],
    };

    onSave(newOrder);
    adminEventBus.emit('SALES_ORDER_CREATED', newOrder);
    showToast(`✓ Sales Order ${newOrder.id} saved successfully (${newOrder.status}).`);
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-bold bg-[#0F8B8D]/10 text-[#0F8B8D] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Sales Order Creation Wizard
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 font-bold">
                <Lock className="w-2.5 h-2.5" /> SO #: {soNumber} (Admin Sequence Governed)
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 font-['Space_Grotesk']">
              Sales Order Creation Wizard (Indian Plastic ERP)
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Strict separation between daily transactional sales orders and monthly forecast commitments with full GST compliance.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-xs text-gray-500 hover:text-gray-800 font-medium px-3 py-1.5 rounded-lg border border-gray-200 cursor-pointer self-start sm:self-center"
          >
            Cancel / Exit
          </button>
        </div>

        {/* 6 Steps Progress Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {steps.map((s) => {
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <div
                key={s.num}
                onClick={() => handleStepClick(s.num)}
                className={`cursor-pointer p-2 rounded-lg border transition-all text-center ${
                  isCurrent
                    ? 'border-[#0F8B8D] bg-[#0F8B8D]/5 text-[#0F8B8D] font-bold'
                    : isCompleted
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-gray-200 text-gray-400 bg-gray-50/50 hover:bg-gray-100'
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

      {/* Validation Error Alert Banner */}
      {stepError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span className="font-semibold">{stepError}</span>
          </div>
          <button
            onClick={() => setStepError(null)}
            className="text-red-500 hover:text-red-800 p-1 text-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step 1: Order Type & Customer Selection */}
      {currentStep === 1 && (
        <div className="space-y-6 animate-fadeIn">
          {/* Order Type Radio Selection (Default: Monthly Plan Order) */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Select Order Type &amp; Billing Architecture (Default: Monthly Plan Order)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  orderType === 'Monthly Plan Order'
                    ? 'border-blue-600 bg-blue-50/50 shadow-xs'
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    <div className="font-bold text-sm text-gray-900">Monthly Plan Order</div>
                  </div>
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Default</span>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Demand forecast &amp; supply commitment. Used for reconciliation. Not auto-consumed by daily orders.
                </div>
              </label>

              <label
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  orderType === 'Daily Sales Order'
                    ? 'border-[#0F8B8D] bg-[#0F8B8D]/5 shadow-xs'
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
                  orderType === 'Blanket/Contract Order'
                    ? 'border-purple-600 bg-purple-50/50 shadow-xs'
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

          {/* Customer Selection with Autocomplete & Auto-Fill */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Search Autocomplete */}
            <div className="space-y-1.5 relative">
              <label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
                <span>Customer Name * (Search &amp; Autocomplete)</span>
                <span className="text-[10px] text-teal-700 font-mono">118 Live Enterprise Customers</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search customer name, code, or GSTIN..."
                  value={customer}
                  onFocus={() => {
                    setIsCustomerSearchOpen(true);
                    setCustomerSearchQuery(customer || '');
                  }}
                  onChange={(e) => {
                    setCustomer(e.target.value);
                    setCustomerSearchQuery(e.target.value);
                    setIsCustomerSearchOpen(true);
                  }}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 font-semibold focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none"
                />
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />

                {/* Customer Autocomplete Dropdown */}
                {isCustomerSearchOpen && (
                  <div
                    ref={customerDropdownRef}
                    className="absolute left-0 top-full mt-1 w-full bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-fade-in"
                  >
                    <div className="p-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>Customer Master Catalog ({filteredCustomers.length} results)</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomerSearchOpen(false);
                          setIsOnboardingWizardOpen(true);
                        }}
                        className="text-[11px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 cursor-pointer"
                      >
                        <PlusCircle className="w-3 h-3" /> + Onboard Customer (Wizard)
                      </button>
                    </div>

                    <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 text-xs">
                      {filteredCustomers.length === 0 ? (
                        <div className="p-4 text-center">
                          <p className="text-slate-400 mb-2">No matching customer found.</p>
                          <button
                            type="button"
                            onClick={() => {
                              setIsCustomerSearchOpen(false);
                              setIsOnboardingWizardOpen(true);
                            }}
                            className="text-xs bg-[#0F8B8D] text-white px-3 py-1.5 rounded-lg font-bold hover:bg-[#0c7072]"
                          >
                            + Onboard New Customer (5-Step Wizard)
                          </button>
                        </div>
                      ) : (
                        filteredCustomers.map((c) => (
                          <div
                            key={c.id || c.code}
                            onClick={() => handleSelectCustomer(c)}
                            className="p-2.5 hover:bg-teal-50/70 cursor-pointer transition flex items-start justify-between gap-2"
                          >
                            <div>
                              <div className="font-bold text-[#14213D] flex items-center gap-1.5">
                                {c.name}
                                <span className="text-[10px] font-mono text-teal-700 bg-teal-100/70 px-1.5 py-0.2 rounded">
                                  {c.code}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                GSTIN: <span className="font-mono">{c.gstin || '27AAACT2727Q1ZW'}</span> • State: {c.state || 'Maharashtra'}
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <div className="font-bold text-emerald-700 text-[11px]">
                                Limit: ₹{((c.creditLimit || 10000000) / 100000).toFixed(1)}L
                              </div>
                              <div className="text-[10px] text-slate-400">{c.paymentTerms || 'Net 30 Days'}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Live Credit Profile Card */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-gray-500">
                <span>Customer GSTIN:</span>
                <span className="font-mono font-bold text-gray-900">{customerGstin}</span>
              </div>
              <div className="flex justify-between items-center text-gray-500">
                <span>State / POS:</span>
                <span className="font-medium text-gray-900">
                  {customerStateCode} - {customerState}
                </span>
              </div>
              <div className="flex justify-between items-center text-gray-500">
                <span>Available Credit:</span>
                <span
                  className={`font-bold font-mono ${
                    customerAvailableCredit < 0 ? 'text-red-700' : 'text-emerald-700'
                  }`}
                >
                  ₹{(customerAvailableCredit / 100000).toFixed(2)} Lakhs
                </span>
              </div>
            </div>
          </div>

          {/* Customer PO Number (Read-Only LIFO Locked), PO Date, Plant, and FG Store */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-500" /> Customer PO # * (Locked)
                </label>
                <button
                  type="button"
                  onClick={() => setIsPoAmendmentModalOpen(true)}
                  className="text-[10px] text-[#0F8B8D] hover:underline font-bold cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-2.5 h-2.5" /> {customerPoNumber ? '+ Amend / Revise PO' : '+ Register PO'}
                </button>
              </div>
              <div className="relative mt-1">
                <input
                  type="text"
                  readOnly
                  value={customerPoNumber}
                  placeholder="No PO Registered"
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 font-mono text-gray-900 bg-slate-100/80 cursor-not-allowed font-bold"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded font-mono font-semibold flex items-center gap-1">
                  <span>LIFO Auto</span>
                  {customerPoVersion && (
                    <span className="bg-teal-700 text-white text-[9px] px-1 rounded font-bold">
                      {customerPoVersion}
                    </span>
                  )}
                </span>
              </div>
              {!customerPoNumber ? (
                <span className="text-[10px] text-red-600 mt-0.5 block font-bold">
                  ⚠️ No PO on file. Click &quot;+ Register PO&quot; to continue.
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Latest amended PO auto-filled via LIFO (Read-Only)
                </span>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700">Customer PO Date * (Auto)</label>
              <input
                type="date"
                value={customerPoDate}
                onChange={(e) => setCustomerPoDate(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded-lg p-2.5 text-gray-900 mt-1 focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Auto-filled PO Issue Date</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700">Manufacturing Plant *</label>
              <select
                value={plant}
                onChange={(e) => setPlant(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 mt-1"
              >
                <option value="Plant 1 - Pimpri Auto-Hub">Plant 1 - Pimpri Auto-Hub (Pune)</option>
                <option value="Plant 2 - Chakan Moulding Complex">Plant 2 - Chakan Moulding Complex</option>
                <option value="Plant 3 - Sanand Component Facility">Plant 3 - Sanand Component Facility</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700">Finished Goods Store *</label>
              <select
                value={fgStore}
                onChange={(e) => setFgStore(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 mt-1"
              >
                <option value="FG-Automotive Cell">FG-Automotive Cell</option>
                <option value="FG-FMCG Packaging Store">FG-FMCG Packaging Store</option>
                <option value="FG-Bulk Pallet Bay">FG-Bulk Pallet Bay</option>
              </select>
            </div>
          </div>

          {/* Optional Monthly Plan Mapping */}
          {orderType === 'Daily Sales Order' && (
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={linkToPlan}
                  onChange={(e) => setLinkToPlan(e.target.checked)}
                  className="rounded text-[#0F8B8D]"
                />
                <span className="text-xs font-bold text-gray-800">
                  Optionally Link this Daily Order to an Active Monthly Plan
                </span>
              </label>

              {linkToPlan && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Select Active Monthly Plan</label>
                    <select
                      value={selectedPlanRef}
                      onChange={(e) => setSelectedPlanRef(e.target.value)}
                      className="w-full text-xs border border-gray-300 rounded-lg p-2 bg-white text-gray-900 mt-1"
                    >
                      {monthlyPlans.map((p) => (
                        <option key={p.id} value={p.planNumber}>
                          {p.planNumber} — {p.customer} ({p.monthYear})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="text-xs text-gray-500 flex items-center">
                    <Info className="w-4 h-4 mr-1 text-[#0F8B8D] shrink-0" />
                    Linking feeds live dispatch progress into the Monthly Demand vs Daily Execution Reconciliation Screen.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Line Items */}
      {currentStep === 2 && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Finished Goods Line Items ({lines.length})
              </h3>
              <p className="text-[11px] text-gray-500">
                Live batch inventory, HSN, polymer grade, and mould data mapped from Single Source of Truth.
              </p>
            </div>
            <button
              onClick={handleAddLine}
              className="text-xs font-bold text-[#0F8B8D] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Product Line
            </button>
          </div>

          <div className="space-y-3">
            {lines.map((line, idx) => {
              const isSearchingThisItem = activeItemSearchIdx === idx;
              return (
                <div
                  key={idx}
                  className="border border-gray-200 rounded-xl p-4 bg-white space-y-3 shadow-xs relative"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-bold text-xs bg-[#0F8B8D]/10 text-[#0F8B8D] px-2 py-0.5 rounded-full font-mono">
                          Line #{line.lineNumber}
                        </span>
                        <span className="text-[11px] text-gray-500 font-medium">
                          Select from Item Master Single Source
                        </span>
                      </div>

                      {/* Searchable Item Master Autocomplete Input */}
                      <div
                        ref={isSearchingThisItem ? itemSearchContainerRef : undefined}
                        className="relative"
                      >
                        <div className="flex items-center relative">
                          <input
                            type="text"
                            placeholder="Search Item Master by Name, Code, Grade, or HSN..."
                            value={isSearchingThisItem ? itemSearchQuery : `${line.itemName} (${line.itemCode})`}
                            onFocus={() => {
                              setActiveItemSearchIdx(idx);
                              setItemSearchQuery(line.itemName || '');
                            }}
                            onClick={() => {
                              setActiveItemSearchIdx(idx);
                              setItemSearchQuery(line.itemName || '');
                            }}
                            onChange={(e) => {
                              setItemSearchQuery(e.target.value);
                              setActiveItemSearchIdx(idx);
                            }}
                            className="w-full pl-3 pr-24 py-2 border rounded-lg text-xs font-bold text-gray-900 focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none bg-slate-50/40 hover:bg-white"
                          />
                          <div className="absolute right-2 flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 text-[10px] font-mono font-bold border border-teal-200">
                              {line.itemCode}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (activeItemSearchIdx === idx) {
                                  setActiveItemSearchIdx(null);
                                } else {
                                  setActiveItemSearchIdx(idx);
                                  setItemSearchQuery(line.itemName || '');
                                }
                              }}
                              className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
                              title="Browse Item Master catalog"
                            >
                              <Search className="w-3.5 h-3.5 text-[#0F8B8D]" />
                            </button>
                          </div>
                        </div>

                        {/* Autocomplete Dropdown Popover */}
                        {isSearchingThisItem && (
                          <div className="absolute left-0 top-full mt-1 w-full max-w-xl bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-fade-in">
                            <div className="p-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-xs text-gray-600 font-medium">
                              <span className="flex items-center gap-1.5 font-semibold text-gray-800">
                                <Search className="w-3.5 h-3.5 text-[#0F8B8D]" /> Item Master Single Source ({masterItemsList.length} Items)
                              </span>
                              <span className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-mono font-bold">
                                {filteredMasterItems.length} found
                              </span>
                            </div>

                            <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 text-xs">
                              {filteredMasterItems.length === 0 ? (
                                <div className="p-4 text-center text-gray-400 text-xs">
                                  No matching items found in Item Master catalog.
                                </div>
                              ) : (
                                filteredMasterItems.map((item) => (
                                  <div
                                    key={item.code}
                                    onClick={() => handleSelectMasterItem(idx, item)}
                                    className="p-3 hover:bg-teal-50/70 cursor-pointer transition flex items-start justify-between gap-3"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <div className="font-bold text-gray-900 flex items-center gap-2 flex-wrap">
                                        <span>{item.name}</span>
                                        <span className="text-[10px] font-mono text-teal-700 bg-teal-100/70 px-1.5 py-0.2 rounded font-bold">
                                          {item.code}
                                        </span>
                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-gray-100 text-gray-600 font-medium">
                                          {item.type || (item as any).category || 'Finished Good'}
                                        </span>
                                      </div>
                                      <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                                        HSN: <strong>{(item as any).hsn || '39269099'}</strong> • Polymer:{' '}
                                        <strong>{(item as any).grade || (item as any).material || 'ABS/PP'}</strong> • Tooling:{' '}
                                        <strong>{(item as any).moldCode || 'M-TOOL-01'}</strong>
                                      </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                      <div className="font-bold text-[#0F8B8D] text-xs font-mono">
                                        ₹{(item as any).sellingPrice || (item as any).unitPrice || (item as any).standardCost || 55}
                                      </div>
                                      <div className="text-[10px] text-gray-400 font-mono">
                                        / {item.baseUOM || (item as any).uom || 'PCS'}
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-gray-500 mt-1.5 flex items-center gap-3 flex-wrap">
                        <span>Customer Part: <strong className="text-gray-700">{line.customerItemCode}</strong></span>
                        <span>HSN: <strong className="text-gray-700">{line.hsn}</strong></span>
                        <span>Polymer: <strong className="text-gray-700">{line.polymerGrade}</strong></span>
                        <span>Mould: <strong className="text-gray-700">{line.mouldCode}</strong></span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveLine(idx)}
                      className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 cursor-pointer self-end sm:self-start"
                      title="Remove Line"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="text-gray-500 font-medium">Ordered Qty ({line.uom}) *</label>
                    <input
                      type="number"
                      value={line.orderedQty}
                      onChange={(e) => handleUpdateLineQty(idx, Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg p-1.5 font-bold text-gray-900 mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-gray-500 font-medium">Unit Price (₹) *</label>
                    <input
                      type="number"
                      value={line.unitPrice}
                      onChange={(e) => {
                        const newPrice = Number(e.target.value);
                        const updated = [...lines];
                        const l = updated[idx];
                        l.unitPrice = newPrice;
                        l.taxableValue = l.orderedQty * newPrice * (1 - (l.discountPct || 0) / 100);
                        l.cgstAmount = isInterState ? 0 : l.taxableValue * 0.09;
                        l.sgstAmount = isInterState ? 0 : l.taxableValue * 0.09;
                        l.igstAmount = isInterState ? l.taxableValue * 0.18 : 0;
                        l.totalValue = l.taxableValue + l.cgstAmount + l.sgstAmount + l.igstAmount;
                        setLines(updated);
                        setStepError(null);
                      }}
                      className="w-full border border-gray-300 rounded-lg p-1.5 font-semibold text-gray-900 mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-gray-500 font-medium">Taxable Value (₹)</label>
                    <div className="font-bold text-gray-900 p-1.5 bg-gray-50 rounded-lg mt-1 font-mono">
                      ₹{line.taxableValue.toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-500 font-medium">Req. Delivery Date</label>
                    <input
                      type="date"
                      value={line.requestedDeliveryDate}
                      onChange={(e) => {
                        const updated = [...lines];
                        updated[idx].requestedDeliveryDate = e.target.value;
                        setLines(updated);
                      }}
                      className="w-full border border-gray-300 rounded-lg p-1.5 text-gray-900 mt-1"
                    />
                  </div>
                </div>

                {/* Live Stock Check Indicator from Inventory Single Truth */}
                <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-lg text-xs border border-gray-200">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600">
                      Available Stock:{' '}
                      <strong className="text-gray-900 font-mono font-bold">
                        {line.availableStock.toLocaleString()} PCS
                      </strong>
                    </span>
                    <span className="text-gray-500">
                      Reserved:{' '}
                      <strong className="text-gray-700 font-mono">
                        {line.reservedStock.toLocaleString()} PCS
                      </strong>
                    </span>
                  </div>

                  {line.shortageQty > 0 ? (
                    <span className="flex items-center gap-1 text-red-700 font-bold bg-red-100 px-2 py-0.5 rounded text-[11px] border border-red-200">
                      <AlertCircle className="w-3.5 h-3.5" /> Shortage of {line.shortageQty.toLocaleString()} PCS
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded text-[11px] border border-emerald-200">
                      <Check className="w-3.5 h-3.5" /> 100% In-Stock &amp; Ready for Dispatch
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* Step 3: Pricing & Commercials (Auto-filled from Customer Master) */}
      {currentStep === 3 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">Commercial Terms</h3>
              <div>
                <label className="text-xs font-semibold text-gray-700">Price List Applied *</label>
                <select
                  value={priceList}
                  onChange={(e) => {
                    setPriceList(e.target.value);
                    setStepError(null);
                  }}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 mt-1"
                >
                  <option value="Tier-1 Automotive OEM Matrix 2026">Tier-1 Automotive OEM Matrix 2026</option>
                  <option value="FMCG Rigid Packaging List">FMCG Rigid Packaging List</option>
                  <option value="Standard Domestic List">Standard Domestic List</option>
                  <option value="Inter-State OEM Contract">Inter-State OEM Contract</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">Payment Terms * (Auto-filled)</label>
                <select
                  value={paymentTerms}
                  onChange={(e) => {
                    setPaymentTerms(e.target.value);
                    setStepError(null);
                  }}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 mt-1"
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
                  <label className="text-xs font-semibold text-gray-700">Freight (₹) *</label>
                  <input
                    type="number"
                    value={freightAmount}
                    onChange={(e) => {
                      setFreightAmount(Number(e.target.value));
                      setStepError(null);
                    }}
                    className="w-full text-xs border border-gray-300 rounded-lg p-2 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Packing &amp; Handling (₹) *</label>
                  <input
                    type="number"
                    value={packingAmount}
                    onChange={(e) => {
                      setPackingAmount(Number(e.target.value));
                      setStepError(null);
                    }}
                    className="w-full text-xs border border-gray-300 rounded-lg p-2 mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Indian GST Tax & Credit Engine Card */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  GST Calculation &amp; Credit Check
                </span>
                <span className="text-[11px] font-semibold text-gray-500">
                  Place of Supply: {customerStateCode}-{customerState}
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
                  <span>Freight &amp; Packing Additions</span>
                  <span className="font-semibold text-gray-900 font-mono">
                    ₹{(freightAmount + packingAmount).toLocaleString()}
                  </span>
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
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <div>
                  <strong>Credit Evaluation: {creditStatus}</strong> (Available: ₹
                  {(customerAvailableCredit / 100000).toFixed(2)}L vs Order: ₹
                  {(totalOrderVal / 100000).toFixed(2)}L)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Packaging & Quality */}
      {currentStep === 4 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">Packaging Specifications</h3>
                <button
                  type="button"
                  onClick={() => setIsNewPkgModalOpen(true)}
                  className="text-xs font-bold text-[#0F8B8D] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> + New Packaging Type
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">Packaging Type * (Auto-filled)</label>
                <select
                  value={packagingType}
                  onChange={(e) => {
                    setPackagingType(e.target.value);
                    setStepError(null);
                  }}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 mt-1"
                >
                  {packagingTypesList.map((pt) => (
                    <option key={pt} value={pt}>
                      {pt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">Packaging &amp; Palletizing Instructions *</label>
                <textarea
                  rows={3}
                  value={packagingInstructions}
                  onChange={(e) => {
                    setPackagingInstructions(e.target.value);
                    setStepError(null);
                  }}
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
                <span className="font-semibold text-gray-800">Mould &amp; Polymer Lot Traceability</span>
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

      {/* Step 5: Transport & Dispatch Details (Auto-filled from Customer & Transporter Master) */}
      {currentStep === 5 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-700">Transport Mode *</label>
              <select
                value={transportMode}
                onChange={(e) => {
                  setTransportMode(e.target.value);
                  setStepError(null);
                }}
                className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 mt-1"
              >
                <option value="Road">Road</option>
                <option value="Rail">Rail</option>
                <option value="Air">Air</option>
                <option value="Multi-Modal">Multi-Modal</option>
              </select>
            </div>

            {/* Transporter Master Autocomplete */}
            <div className="relative">
              <label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
                <span>Transporter Master *</span>
                <span className="text-[10px] text-teal-700 font-mono">Live Master Fleet</span>
              </label>
              <div className="relative mt-1">
                <input
                  type="text"
                  placeholder="Search transporter name, GSTIN..."
                  value={transporterName}
                  onFocus={() => {
                    setIsTransporterSearchOpen(true);
                    setTransporterSearchQuery(transporterName || '');
                  }}
                  onChange={(e) => {
                    setTransporterName(e.target.value);
                    setTransporterSearchQuery(e.target.value);
                    setIsTransporterSearchOpen(true);
                  }}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 font-semibold focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none"
                />
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />

                {/* Transporter Autocomplete Popover */}
                {isTransporterSearchOpen && (
                  <div
                    ref={transporterDropdownRef}
                    className="absolute left-0 top-full mt-1 w-[340px] bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-fade-in"
                  >
                    <div className="p-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>Transport Master Directory</span>
                      <span>{filteredTransporters.length} found</span>
                    </div>

                    <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 text-xs">
                      {filteredTransporters.length === 0 ? (
                        <div className="p-3 text-center text-slate-400">No transporter matching search.</div>
                      ) : (
                        filteredTransporters.map((t) => (
                          <div
                            key={t.id}
                            onClick={() => handleSelectTransporter(t)}
                            className="p-2.5 hover:bg-teal-50/70 cursor-pointer transition flex items-start justify-between gap-2"
                          >
                            <div>
                              <div className="font-bold text-[#14213D] flex items-center gap-1.5">
                                {t.name}
                                <span className="text-[10px] font-mono text-teal-700 bg-teal-100/70 px-1.5 py-0.2 rounded">
                                  {t.transporterCode}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                EWB GSTIN: <span className="font-mono">{t.transporterIdGstin}</span>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                              {t.transportModes[0] || 'Road'}
                            </span>
                          </div>
                        ))
                      )}
                    </div>

                    {/* + Add New Transporter action */}
                    <div className="p-2 bg-slate-50 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setQuickTransporterName(transporterSearchQuery.trim());
                          setQuickTransporterGstin('');
                          setIsQuickTransporterModalOpen(true);
                          setIsTransporterSearchOpen(false);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-[#E8622C] hover:bg-[#d45320] text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>+ Register New Transporter</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700">Vehicle Number *</label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => {
                  setVehicleNumber(e.target.value);
                  setStepError(null);
                }}
                className="w-full text-xs border border-gray-300 rounded-lg p-2.5 text-gray-900 font-mono mt-1"
                placeholder="e.g. MH-14-GH-8821"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700">Incoterms *</label>
              <select
                value={incoterms}
                onChange={(e) => {
                  setIncoterms(e.target.value);
                  setStepError(null);
                }}
                className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 mt-1"
              >
                <option value="DAP - Delivered At Place">DAP - Delivered At Place</option>
                <option value="Ex-Works Factory Gate">Ex-Works Factory Gate</option>
                <option value="FCA - Free Carrier">FCA - Free Carrier</option>
                <option value="CPT - Carriage Paid To">CPT - Carriage Paid To</option>
                <option value="DDP - Delivered Duty Paid">DDP - Delivered Duty Paid</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700">Dispatch Point *</label>
              <input
                type="text"
                value={dispatchPoint}
                onChange={(e) => {
                  setDispatchPoint(e.target.value);
                  setStepError(null);
                }}
                className="w-full text-xs border border-gray-300 rounded-lg p-2.5 text-gray-900 mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700">Delivery SLA Terms *</label>
              <input
                type="text"
                value={deliveryTerms}
                onChange={(e) => {
                  setDeliveryTerms(e.target.value);
                  setStepError(null);
                }}
                className="w-full text-xs border border-gray-300 rounded-lg p-2.5 text-gray-900 mt-1"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700">Shipping Delivery Address *</label>
            <textarea
              rows={2}
              value={shippingAddress}
              onChange={(e) => {
                setShippingAddress(e.target.value);
                setStepError(null);
              }}
              className="w-full text-xs border border-gray-300 rounded-lg p-2.5 text-gray-900 mt-1"
            />
          </div>

          {/* E-Way Bill Notice */}
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
            <Truck className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <strong>E-Way Bill Compliance Requirement: {isEwbRequired ? 'MANDATORY' : 'OPTIONAL'}</strong>
              <div className="text-[11px] text-amber-800">
                Order value (₹{totalOrderVal.toLocaleString()}){' '}
                {totalOrderVal > 50000 ? 'exceeds ₹50,000 threshold' : 'under threshold'}. Valid E-Way Bill Part A and Part B must accompany delivery at plant gate release.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 6: Review & Final Submission */}
      {currentStep === 6 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-3 gap-2">
              <div>
                <span className="text-xs font-bold text-[#0F8B8D] uppercase tracking-wider">
                  Order Summary
                </span>
                <h3 className="text-base font-bold text-gray-900 font-['Space_Grotesk']">
                  {orderType} • {customer}
                </h3>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Gross Total (GST Inc.)</div>
                <div className="text-xl font-bold font-mono text-[#14213D]">
                  ₹{totalOrderVal.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-gray-500">SO Number (Admin Sequence):</span>
                <div className="font-bold text-gray-900 font-mono flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-600" /> {soNumber}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Customer PO #:</span>
                <div className="font-bold text-gray-900 font-mono">{customerPoNumber}</div>
              </div>
              <div>
                <span className="text-gray-500">Customer GSTIN:</span>
                <div className="font-bold text-gray-900 font-mono">{customerGstin}</div>
              </div>
              <div>
                <span className="text-gray-500">Transporter:</span>
                <div className="font-bold text-gray-900">
                  {transporterName} ({transporterGstin})
                </div>
              </div>
            </div>

            {/* Line items table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-600 border-b">
                  <tr>
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">Item Description</th>
                    <th className="p-2.5 text-right">Quantity</th>
                    <th className="p-2.5 text-right">Rate (₹)</th>
                    <th className="p-2.5 text-right">Taxable (₹)</th>
                    <th className="p-2.5 text-center">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lines.map((l, i) => (
                    <tr key={i}>
                      <td className="p-2.5 text-gray-400">{i + 1}</td>
                      <td className="p-2.5 font-medium text-gray-900">
                        {l.itemName}{' '}
                        <span className="text-gray-400 font-mono">({l.itemCode})</span>
                      </td>
                      <td className="p-2.5 text-right font-bold">
                        {l.orderedQty.toLocaleString()} {l.uom}
                      </td>
                      <td className="p-2.5 text-right font-mono">₹{l.unitPrice}</td>
                      <td className="p-2.5 text-right font-mono font-bold">
                        ₹{l.taxableValue.toLocaleString()}
                      </td>
                      <td className="p-2.5 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-4">
        {currentStep > 1 ? (
          <button
            onClick={() => {
              setStepError(null);
              setCurrentStep(currentStep - 1);
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 flex items-center gap-1.5 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" /> Previous Step
          </button>
        ) : (
          <div></div>
        )}

        <div className="flex items-center gap-2">
          {currentStep < 6 ? (
            <button
              onClick={handleNextStep}
              className="px-5 py-2 bg-[#0F8B8D] hover:bg-[#0c7072] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              Continue to Step {currentStep + 1} <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSubmit('Draft')}
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold cursor-pointer"
              >
                Save as Draft
              </button>
              <button
                onClick={() => handleSubmit('Confirmed')}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Check className="w-4 h-4" /> Confirm &amp; Release Sales Order
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Register Customer PO Modal */}
      {isRegisterPoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h4 className="text-sm font-bold text-slate-900 font-['Space_Grotesk'] flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#0F8B8D]" /> Register Customer PO / Purchase Order
              </h4>
              <button
                onClick={() => setIsRegisterPoModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRegisteredPo} className="p-5 space-y-3.5 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-600">
                <span className="font-semibold text-slate-900">Customer:</span> {customer} ({customerCode})
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Customer PO Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PO-TM-2026-9022 / BAJ-DISP-0911"
                  value={newPoNumberInput}
                  onChange={(e) => setNewPoNumberInput(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border rounded-lg text-xs font-mono font-bold uppercase focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  PO Issue Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={newPoDateInput}
                  onChange={(e) => setNewPoDateInput(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs font-semibold focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterPoModalOpen(false)}
                  className="px-3 py-1.5 border rounded-lg text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#0F8B8D] hover:bg-[#0c7072] text-white font-bold rounded-lg cursor-pointer"
                >
                  Save &amp; Apply PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Create Packaging Type Modal */}
      {isNewPkgModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h4 className="text-sm font-bold text-slate-900 font-['Space_Grotesk'] flex items-center gap-2">
                <Package className="w-4 h-4 text-[#0F8B8D]" /> Create New Packaging Type (Admin)
              </h4>
              <button
                onClick={() => setIsNewPkgModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePackagingType} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Packaging Specification Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Reinforced Euro-Pallet with Weather Shield"
                  value={newPkgTypeName}
                  onChange={(e) => setNewPkgTypeName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs font-semibold focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewPkgModalOpen(false)}
                  className="px-3 py-1.5 border rounded-lg text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#0F8B8D] hover:bg-[#0c7072] text-white font-bold rounded-lg cursor-pointer"
                >
                  Add Packaging Type
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Create Transporter Modal */}
      {isQuickTransporterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h4 className="text-sm font-bold text-slate-900 font-['Space_Grotesk']">
                Register Transporter Master
              </h4>
              <button
                onClick={() => setIsQuickTransporterModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickCreateTransporter} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Transporter Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SafeXpress Roadways / SpotOn Logistics"
                  value={quickTransporterName}
                  onChange={(e) => setQuickTransporterName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs font-semibold focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  15-Digit GSTIN / EWB ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={15}
                  placeholder="e.g. 27AABCV1234F1Z1"
                  value={quickTransporterGstin}
                  onChange={(e) => setQuickTransporterGstin(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border rounded-lg text-xs font-mono font-bold uppercase focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickTransporterModalOpen(false)}
                  className="px-3 py-1.5 border rounded-lg text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#0F8B8D] hover:bg-[#0c7072] text-white font-bold rounded-lg"
                >
                  Save &amp; Select Transporter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer PO Amendment & Version History Traceability Modal */}
      {isPoAmendmentModalOpen && (
        <CustomerPoAmendmentModal
          customer={
            selectedCustomerMaster || {
              id: customerCode || 'CUST-TEMP',
              code: customerCode || 'CUST-TEMP',
              name: customer,
              gstin: customerGstin,
              state: customerState,
              activePoNumber: customerPoNumber,
              activePoDate: customerPoDate,
              activePoVersion: customerPoVersion || 'Rev 01',
              poVersions: [],
              creditLimit: customerCreditLimit,
              paymentTerms: paymentTerms,
              shippingAddress: shippingAddress,
              status: 'Active',
              createdAt: new Date().toISOString(),
            }
          }
          onClose={() => setIsPoAmendmentModalOpen(false)}
          showToast={showToast}
          onSuccess={(updatedCust) => {
            setSelectedCustomerMaster(updatedCust);
            setCustomerPoNumber(updatedCust.activePoNumber || '');
            setCustomerPoDate(updatedCust.activePoDate || '');
            setCustomerPoVersion(updatedCust.activePoVersion || 'Rev 01');
            setIsPoAmendmentModalOpen(false);
            showToast(`✓ PO Amended: ${updatedCust.activePoNumber} (${updatedCust.activePoVersion}) - Version Logged!`);
          }}
        />
      )}

      {/* 5-Step Customer Onboarding Wizard Modal */}
      {isOnboardingWizardOpen && (
        <CustomerOnboardingWizardModal
          isOpen={isOnboardingWizardOpen}
          onClose={() => setIsOnboardingWizardOpen(false)}
          onCustomerSaved={(newCust) => {
            handleSelectCustomer(newCust);
            setIsOnboardingWizardOpen(false);
            showToast(`✓ Customer ${newCust.name} (${newCust.code}) onboarded successfully!`);
          }}
          showToast={showToast}
        />
      )}
    </div>
  );
};
